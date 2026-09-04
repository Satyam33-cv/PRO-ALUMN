"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Users,
  BriefcaseBusiness,
  Calendar,
  BookOpen,
  Megaphone,
  X,
  ChevronRight,
  Command,
  Layers,
  Sparkles,
  SunMoon,
  LogOut,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { apiClient } from "@/lib/api/client";

export type SearchCategory = "all" | "alumni" | "jobs" | "events" | "stories" | "announcements" | "action";

export interface SearchResultItem {
  id: string;
  type: "alumni" | "job" | "event" | "story" | "announcement" | "action";
  title: string;
  subtitle: string;
  snippet?: string;
  tag?: string;
  url: string;
  badge: string;
  badgeColor: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { toggle: toggleTheme } = useTheme();
  const [queryText, setQueryText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [backendResults, setBackendResults] = useState<{
    alumni?: Array<{ id: string; name: string; jobTitle?: string; currentCompany?: string; batchYear?: number | string; department?: string }>;
    jobs?: Array<{ id: string; title: string; company: string; location?: string; type?: string; description?: string }>;
    events?: Array<{ id: string; title: string; description?: string; location?: string; date?: string }>;
    stories?: Array<{ id: string; title: string; story?: string; alumni?: { name?: string } }>;
    announcements?: Array<{ id: string; title: string; body?: string }>;
  }>({});

  // Query Backend Search API with debounce
  useEffect(() => {
    if (queryText.trim().length < 2) {
      setBackendResults({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const typeParam = selectedCategory !== "all" && selectedCategory !== "action" ? selectedCategory : undefined;
        const res = await apiClient.search.global(queryText.trim(), typeParam);
        setBackendResults((res as typeof backendResults) || {});
      } catch (e) {
        console.error("Global search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [queryText, selectedCategory]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
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

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allResults = useMemo(() => {
    const SYSTEM_ACTIONS: SearchResultItem[] = [
      {
        id: "act-theme",
        type: "action",
        title: "Toggle Light / Dark Mode",
        subtitle: "Switch appearance theme instantly",
        url: "#action:theme",
        badge: "Theme",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
      },
      {
        id: "act-directory",
        type: "action",
        title: "Browse Alumni Directory",
        subtitle: "Search 5,000+ verified graduates and filter by company",
        url: "/directory",
        badge: "Explore",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
      },
      {
        id: "act-jobs",
        type: "action",
        title: "Jobs & Internal Referrals",
        subtitle: "Request employee referrals or post opportunities",
        url: "/jobs",
        badge: "Careers",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
      },
      {
        id: "act-mentorship",
        type: "action",
        title: "Mentorship Hub",
        subtitle: "Book 1-on-1 career guidance sessions with senior alumni",
        url: "/mentorship",
        badge: "Mentorship",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
      },
      {
        id: "act-profile",
        type: "action",
        title: "Edit My Profile & Experience",
        subtitle: "Update career details, resume, and skills",
        url: "/profile",
        badge: "Account",
        badgeColor: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200",
      },
      {
        id: "act-logout",
        type: "action",
        title: "Sign Out of PRO ALUMN",
        subtitle: "Safely end your session",
        url: "#action:logout",
        badge: "Auth",
        badgeColor: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
      },
    ];

    const alumniResults: SearchResultItem[] = (backendResults.alumni || []).map((a) => ({
      id: `alumni-${a.id}`,
      type: "alumni",
      title: a.name,
      subtitle: `${a.jobTitle ? `${a.jobTitle} at ` : ""}${a.currentCompany || "Alumni Member"}${a.batchYear ? ` · Class of ${a.batchYear}` : ""}`,
      snippet: `Department: ${a.department || "Engineering"}`,
      tag: a.currentCompany || "Alumni",
      url: `/directory?search=${encodeURIComponent(a.name)}`,
      badge: "Alumni",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    }));

    const jobResults: SearchResultItem[] = (backendResults.jobs || []).map((j) => ({
      id: `job-${j.id}`,
      type: "job",
      title: j.title,
      subtitle: `${j.company} · ${j.location || "Remote"} · ${j.type || "Full-time"}`,
      snippet: j.description || "Career opportunity posted by alumni member.",
      tag: j.company,
      url: `/jobs?jobId=${j.id}`,
      badge: "Job Posting",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
    }));

    const eventResults: SearchResultItem[] = (backendResults.events || []).map((e) => ({
      id: `event-${e.id}`,
      type: "event",
      title: e.title,
      subtitle: e.location ? `Location: ${e.location}` : "University Event",
      snippet: e.description || "Alumni reunion / webinar session.",
      tag: "Event",
      url: `/events/${e.id}`,
      badge: "Event",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
    }));

    const storyResults: SearchResultItem[] = (backendResults.stories || []).map((s) => ({
      id: `story-${s.id}`,
      type: "story",
      title: s.title,
      subtitle: s.alumni?.name ? `By ${s.alumni.name}` : "Alumni Story",
      snippet: s.story || "Alumni spotlight achievement.",
      tag: "Story",
      url: `/stories`,
      badge: "Spotlight",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    }));

    const announcementResults: SearchResultItem[] = (backendResults.announcements || []).map((ann) => ({
      id: `ann-${ann.id}`,
      type: "announcement",
      title: ann.title,
      subtitle: `Institutional Announcement`,
      snippet: ann.body || "Official institutional announcement.",
      tag: "Notice",
      url: `/announcements`,
      badge: "Announcement",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    }));

    return [...alumniResults, ...jobResults, ...eventResults, ...storyResults, ...announcementResults, ...SYSTEM_ACTIONS];
  }, [backendResults]);

  const filteredResults = useMemo(() => {
    const q = queryText.trim().toLowerCase();

    return allResults.filter((item) => {
      // Category filter
      if (selectedCategory === "alumni" && item.type !== "alumni") return false;
      if (selectedCategory === "jobs" && item.type !== "job") return false;
      if (selectedCategory === "events" && item.type !== "event") return false;
      if (selectedCategory === "stories" && item.type !== "story") return false;
      if (selectedCategory === "announcements" && item.type !== "announcement") return false;
      if (selectedCategory === "action" && item.type !== "action") return false;

      // Text filter
      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const subtitleMatch = item.subtitle.toLowerCase().includes(q);
      const snippetMatch = item.snippet ? item.snippet.toLowerCase().includes(q) : false;
      const tagMatch = item.tag ? item.tag.toLowerCase().includes(q) : false;

      return titleMatch || subtitleMatch || snippetMatch || tagMatch;
    });
  }, [allResults, queryText, selectedCategory]);

  const categoryCounts = useMemo(() => {
    return {
      all: allResults.length,
      alumni: allResults.filter((i) => i.type === "alumni").length,
      jobs: allResults.filter((i) => i.type === "job").length,
      events: allResults.filter((i) => i.type === "event").length,
      stories: allResults.filter((i) => i.type === "story").length,
      announcements: allResults.filter((i) => i.type === "announcement").length,
      action: allResults.filter((i) => i.type === "action").length,
    };
  }, [allResults]);

  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      setIsOpen(false);
      setQueryText("");

      if (item.url === "#action:theme") {
        toggleTheme();
        return;
      }
      if (item.url === "#action:logout") {
        signOut();
        router.push("/login");
        return;
      }
      router.push(item.url);
    },
    [router, signOut, toggleTheme]
  );

  // Keyboard navigation inside results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredResults[selectedIndex];
      if (current) {
        handleSelectResult(current);
      }
    }
  };

  const getResultIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "alumni":
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "job":
        return <BriefcaseBusiness className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "event":
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "story":
        return <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "announcement":
        return <Megaphone className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "action":
        return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl font-sans">
      {/* Search Input Bar */}
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition-all ${
          isOpen
            ? "border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-100 dark:ring-blue-950 shadow-sm"
            : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800"
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
          placeholder="Search verified alumni, jobs, reunions, stories... (Cmd+K)"
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          aria-label="Global search across alumni network"
          autoComplete="off"
        />

        {queryText ? (
          <button
            type="button"
            onClick={() => {
              setQueryText("");
              inputRef.current?.focus();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-400 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-xs">
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
            className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
            style={{ maxHeight: "calc(85vh - 80px)" }}
          >
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 px-3 py-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All ({categoryCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("alumni")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === "alumni"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                Alumni ({categoryCounts.alumni})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("jobs")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === "jobs"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <BriefcaseBusiness className="w-3.5 h-3.5 text-blue-500" />
                Jobs ({categoryCounts.jobs})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("events")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === "events"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                Events ({categoryCounts.events})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory("stories")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === "stories"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                Stories ({categoryCounts.stories})
              </button>
            </div>

            {/* Results List */}
            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px]">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Searching PostgreSQL index...
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No matching results found
                  </p>
                  <p className="text-xs text-slate-400">
                    Try searching for a different company, alumni name, or keyword.
                  </p>
                </div>
              ) : (
                filteredResults.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getResultIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>

                        {item.snippet && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                            {item.snippet}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-2" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer helper */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Navigate with ↑ ↓ and press Enter</span>
              <span>ESC to close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
