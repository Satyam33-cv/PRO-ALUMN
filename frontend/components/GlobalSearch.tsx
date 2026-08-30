"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  FileText,
  StickyNote,
  Users,
  BriefcaseBusiness,
  Megaphone,
  X,
  ChevronRight,
  Command,
  Layers,
  Settings2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/lib/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { apiClient } from "@/lib/api/client";

import { listUserDocsFromDrive } from "@/lib/google-workspace";

export type SearchCategory = "all" | "docs" | "keep" | "alumni" | "jobs" | "announcements" | "action";

export interface SearchResultItem {
  id: string;
  type: "doc" | "keep" | "alumni" | "job" | "announcement" | "action";
  title: string;
  subtitle: string;
  snippet?: string;
  tag?: string;
  url: string;
  externalUrl?: string;
  color?: string;
  badge: string;
  badgeColor: string;
  date?: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const { accessToken, signOut } = useAuth();
  const { toggle: toggleTheme } = useTheme();
  const [queryText, setQueryText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [firestoreDocs, setFirestoreDocs] = useState<SearchResultItem[]>([]);
  const [firestoreNotes, setFirestoreNotes] = useState<SearchResultItem[]>([]);
  const [driveDocs, setDriveDocs] = useState<SearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const [backendResults, setBackendResults] = useState<{
    alumni?: Array<{ id: string; name: string; jobTitle?: string; currentCompany?: string; batchYear?: number | string; department?: string }>;
    jobs?: Array<{ id: string; title: string; company: string; location?: string; type?: string; description?: string }>;
    events?: Array<{ id: string; title: string }>;
    stories?: Array<{ id: string; title: string }>;
    announcements?: Array<{ id: string; title: string; content?: string; body?: string }>;
  }>({});

  useEffect(() => {
    if (queryText.length < 2) {
      setBackendResults({});
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const type = selectedCategory !== "all" && selectedCategory !== "docs" && selectedCategory !== "keep" ? selectedCategory : undefined;
        const res = await apiClient.search.global(queryText, type);
        setBackendResults((res as typeof backendResults) || {});
      } catch (e) {
        console.error("Global search failed:", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [queryText, selectedCategory]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const qDocs = query(collection(db, "docs"), orderBy("createdAt", "desc"));
        const snapDocs = await getDocs(qDocs);
        const fetchedDocs: SearchResultItem[] = [];
        snapDocs.forEach((d) => {
          const data = d.data();
          fetchedDocs.push({
            id: d.id,
            type: "doc",
            title: data.title || "Untitled Document",
            subtitle: `By ${data.author || "Alumni Member"} · Category: ${data.category || "General"}`,
            snippet: data.description || data.content || "Collaborative alumni Google Doc file with live editing and access sharing.",
            tag: data.category || "Document",
            url: `/docs?search=${encodeURIComponent(data.title || "")}`,
            badge: "Google Doc",
            badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
            date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Recent",
          });
        });
        if (mounted && fetchedDocs.length > 0) {
          setFirestoreDocs(fetchedDocs);
        }
      } catch {
        // Fallback already available
      }

      try {
        const qNotes = query(collection(db, "notes"));
        const snapNotes = await getDocs(qNotes);
        const fetchedNotes: SearchResultItem[] = [];
        snapNotes.forEach((d) => {
          const data = d.data();
          fetchedNotes.push({
            id: d.id,
            type: "keep",
            title: data.title || "Untitled Note",
            subtitle: `Category: ${data.category || "Memo"} · ${data.pinned ? "📌 Pinned" : "Memo"}`,
            snippet: data.content || "Quick alumni note and reference memo.",
            tag: data.category || "Memo",
            color: data.color || "bg-white",
            url: `/keep?search=${encodeURIComponent(data.title || "")}`,
            badge: "Keep Memo",
            badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
            date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Recent",
          });
        });
        if (mounted && fetchedNotes.length > 0) {
          setFirestoreNotes(fetchedNotes);
        }
      } catch {
        // Fallback already available
      }

      if (accessToken) {
        try {
          const driveFiles = await listUserDocsFromDrive({ token: accessToken });
          if (mounted && driveFiles && driveFiles.length > 0) {
            const mappedDrive: SearchResultItem[] = driveFiles.map((file) => ({
              id: `drive-${file.id}`,
              type: "doc",
              title: file.name,
              subtitle: `Google Drive Document · ID: ${file.id.slice(0, 8)}...`,
              snippet: "Synced with Google Drive & Google Docs Editor.",
              tag: "Drive File",
              url: `/docs?docId=${file.id}&search=${encodeURIComponent(file.name)}`,
              badge: "Google Drive Doc",
              badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
              date: file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : undefined,
            }));
            setDriveDocs(mappedDrive);
          }
        } catch {
          // Token expired or network issue
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQueryText("");
      setSelectedCategory("all");
    }
  }, [isOpen]);

  const allResults = useMemo(() => {
    const combinedDocs = [...driveDocs, ...firestoreDocs];
    const combinedNotes = [...firestoreNotes];

    const SYSTEM_ACTIONS: SearchResultItem[] = [
      {
        id: "act-theme",
        type: "action",
        title: "Toggle Light / Dark Mode",
        subtitle: "Switch appearance theme instantly",
        url: "#",
        badge: "Theme",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      },
      {
        id: "act-logout",
        type: "action",
        title: "Sign Out of PRO ALUMN",
        subtitle: "Safely end your session",
        url: "/login",
        badge: "Auth",
        badgeColor: "bg-red-50 text-red-700 border-red-200",
      },
      {
        id: "act-post-job",
        type: "action",
        title: "Post a New Career Opportunity",
        subtitle: "Share referrals with students and alumni",
        url: "/jobs/new",
        badge: "Action",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "act-create-doc",
        type: "action",
        title: "New Google Collaborative Doc",
        subtitle: "Create note or reference document",
        url: "/docs",
        badge: "Action",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "act-profile",
        type: "action",
        title: "Edit My Profile & Experience",
        subtitle: "Update career info and skills",
        url: "/profile",
        badge: "Account",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ];

    const alumniResults: SearchResultItem[] = (backendResults.alumni || []).map((a) => ({
      id: `alumni-${a.id}`,
      type: "alumni",
      title: a.name,
      subtitle: `${a.jobTitle ? `${a.jobTitle} at ` : ""}${a.currentCompany || "Alumni Member"}${a.batchYear ? ` · Class of ${a.batchYear}` : ""}`,
      snippet: `Alumni member · Department: ${a.department || "Engineering"}`,
      tag: a.currentCompany || "Alumni",
      url: `/directory?search=${encodeURIComponent(a.name)}`,
      badge: "Alumni Profile",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }));

    const jobResults: SearchResultItem[] = (backendResults.jobs || []).map((j) => ({
      id: `job-${j.id}`,
      type: "job",
      title: j.title,
      subtitle: `${j.company} · ${j.location || "Remote"} · ${j.type || "Full-time"}`,
      snippet: j.description || "Career opportunity posted by alumni community member.",
      tag: j.company,
      url: `/jobs?jobId=${j.id}`,
      badge: "Job Posting",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    }));

    const announcementResults: SearchResultItem[] = (backendResults.announcements || []).map((ann) => ({
      id: `ann-${ann.id}`,
      type: "announcement",
      title: ann.title,
      subtitle: `Official Announcement`,
      snippet: ann.content || ann.body || "Official institutional announcement.",
      tag: "Notice",
      url: `/announcements`,
      badge: "Announcement",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    }));

    return [...combinedDocs, ...combinedNotes, ...alumniResults, ...jobResults, ...announcementResults, ...SYSTEM_ACTIONS];
  }, [firestoreDocs, driveDocs, firestoreNotes, backendResults]);

  const filteredResults = useMemo(() => {
    const q = queryText.trim().toLowerCase();

    return allResults.filter((item) => {
      // Category filter
      if (selectedCategory === "docs" && item.type !== "doc") return false;
      if (selectedCategory === "keep" && item.type !== "keep") return false;
      if (selectedCategory === "alumni" && item.type !== "alumni") return false;
      if (selectedCategory === "jobs" && item.type !== "job") return false;
      if (selectedCategory === "announcements" && item.type !== "announcement") return false;

      // Text filter
      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const subtitleMatch = item.subtitle.toLowerCase().includes(q);
      const snippetMatch = item.snippet ? item.snippet.toLowerCase().includes(q) : false;
      const tagMatch = item.tag ? item.tag.toLowerCase().includes(q) : false;

      return titleMatch || subtitleMatch || snippetMatch || tagMatch;
    });
  }, [allResults, queryText, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const matches = (item: SearchResultItem) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.snippet && item.snippet.toLowerCase().includes(q)) ||
        (item.tag && item.tag.toLowerCase().includes(q))
      );
    };

    const matching = allResults.filter(matches);

    return {
      all: matching.length,
      docs: matching.filter((i) => i.type === "doc").length,
      keep: matching.filter((i) => i.type === "keep").length,
      alumni: matching.filter((i) => i.type === "alumni").length,
      jobs: matching.filter((i) => i.type === "job").length,
      announcements: matching.filter((i) => i.type === "announcement").length,
    };
  }, [allResults, queryText]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [queryText, selectedCategory]);

  // Keyboard navigation within the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    if (item.url === "action:theme") {
      toggleTheme();
    } else if (item.url === "action:signout") {
      signOut();
      router.push("/login");
    } else {
      router.push(item.url);
    }
  };

  const getIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "doc":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "keep":
        return <StickyNote className="w-4 h-4 text-amber-600" />;
      case "alumni":
        return <Users className="w-4 h-4 text-indigo-600" />;
      case "job":
        return <BriefcaseBusiness className="w-4 h-4 text-emerald-600" />;
      case "announcement":
        return <Megaphone className="w-4 h-4 text-purple-600" />;
      case "action":
        return <Settings2 className="w-4 h-4 text-slate-600" />;
    }
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr.trim()) return text;
    const parts = text.split(new RegExp(`(${queryStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === queryStr.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-slate-900 rounded-xs px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl">
      {/* Search Input Bar */}
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition-all ${
          isOpen
            ? "border-blue-600 bg-white ring-2 ring-blue-100 shadow-sm"
            : "border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 hover:border-slate-300"
        }`}
      >
        <Search className={`w-4 h-4 shrink-0 ${isOpen ? "text-blue-600" : "text-slate-400"}`} />
        <input
          ref={inputRef}
          type="text"
          id="global-search-input"
          value={queryText}
          onChange={(e) => {
            setQueryText(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Google Docs, Keep notes, alumni, jobs..."
          className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          aria-label="Global search across Google Docs, Keep notes, and Alumni network"
          autoComplete="off"
        />

        {queryText ? (
          <button
            type="button"
            onClick={() => {
              setQueryText("");
              inputRef.current?.focus();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-400 border border-slate-200 bg-white px-1.5 py-0.5 rounded shadow-xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Global Search Results Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            style={{ maxHeight: "calc(85vh - 80px)" }}
          >
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/90 px-3 py-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All ({categoryCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("docs")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === "docs"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Google Docs ({categoryCounts.docs})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("keep")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === "keep"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                Keep Notes ({categoryCounts.keep})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("alumni")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === "alumni"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Alumni ({categoryCounts.alumni})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("jobs")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === "jobs"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <BriefcaseBusiness className="w-3.5 h-3.5 text-emerald-500" />
                Jobs ({categoryCounts.jobs})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("announcements")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === "announcements"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 text-purple-500" />
                Announcements ({categoryCounts.announcements})
              </button>
            </div>

            {/* Results Content List */}
            <div
              ref={resultsContainerRef}
              className="overflow-y-auto divide-y divide-slate-100 max-h-[380px] p-2"
            >
              {filteredResults.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">No matching files or alumni found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try searching for different keywords, file titles in Google Docs, memos in Google Keep, or alumni names.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQueryText("Mentorship");
                        setSelectedCategory("docs");
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
                    >
                      Search &ldquo;Mentorship&rdquo; in Docs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQueryText("Memo");
                        setSelectedCategory("keep");
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium hover:bg-amber-100"
                    >
                      Search &ldquo;Memo&rdquo; in Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQueryText("Engineer");
                        setSelectedCategory("alumni");
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100"
                    >
                      Search &ldquo;Engineer&rdquo; in Alumni
                    </button>
                  </div>
                </div>
              ) : (
                filteredResults.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-slate-100/90 ring-1 ring-slate-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Type Icon Badge */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          item.type === "doc"
                            ? "bg-blue-50 border-blue-100 text-blue-600"
                            : item.type === "keep"
                            ? "bg-amber-50 border-amber-100 text-amber-600"
                            : item.type === "alumni"
                            ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                            : item.type === "job"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                            : item.type === "action"
                            ? "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            : "bg-purple-50 border-purple-100 text-purple-600"
                        }`}
                      >
                        {getIcon(item.type)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 truncate">
                            {highlightMatch(item.title, queryText)}
                          </span>

                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>

                          {item.tag && (
                            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.tag}
                            </span>
                          )}

                          {item.date && (
                            <span className="ml-auto text-[10px] text-slate-400 shrink-0">
                              {item.date}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                          {highlightMatch(item.subtitle, queryText)}
                        </p>

                        {item.snippet && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed bg-slate-50/50 p-1.5 rounded-md border border-slate-100 font-sans">
                            {highlightMatch(item.snippet, queryText)}
                          </p>
                        )}
                      </div>

                      {/* Arrow / Shortcut indicator */}
                      <div className="shrink-0 self-center">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "text-slate-300 group-hover:text-slate-500"
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Shortcuts and Quick Action buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-mono text-[10px]">
                    ↑↓
                  </span>{" "}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-mono text-[10px]">
                    ↵
                  </span>{" "}
                  Open
                </span>
                <span className="flex items-center gap-1">
                  <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-mono text-[10px]">
                    ESC
                  </span>{" "}
                  Close
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/docs");
                  }}
                  className="hover:text-blue-600 font-medium transition-colors"
                >
                  Browse Docs →
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/keep");
                  }}
                  className="hover:text-amber-600 font-medium transition-colors"
                >
                  Browse Keep Notes →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
