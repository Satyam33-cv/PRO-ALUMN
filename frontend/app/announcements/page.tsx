"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { AnnouncementBody } from "@/components/AnnouncementBody";
import {
  Megaphone,
  Calendar,
  User,
  Search,
  Plus,
  Tag,
  Share2,
  Check,
  Sparkles,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Info,
  Pin,
} from "lucide-react";
import { Announcement } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { apiClient } from "@/lib/api/client";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New announcement modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newBody, setNewBody] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");

  React.useEffect(() => {
    apiClient.announcements.list().then((res) => {
      setAnnouncementsList(res as Announcement[]);
      setLoading(false);
    });
  }, []);

  // Pinned count
  const pinnedCount = useMemo(() => {
    return announcementsList.filter((a) => a.pinned).length;
  }, [announcementsList]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    announcementsList.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ["All", ...Array.from(set)];
  }, [announcementsList]);

  // Sort announcements so pinned ones ALWAYS stay on top regardless of date
  const sortedAnnouncements = useMemo(() => {
    return [...announcementsList].sort((a, b) => {
      const aPinned = Boolean(a.pinned);
      const bPinned = Boolean(b.pinned);

      // 1. Pinned priority: true comes first
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      // 2. If both pinned, sort by pinnedAt (if available) or date
      if (aPinned && bPinned) {
        if (a.pinnedAt && b.pinnedAt) {
          return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
        }
      }

      // 3. Chronological sort (newest date first)
      const dateA = a.date ? new Date(a.date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.date ? new Date(b.date).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (!isNaN(dateA) && !isNaN(dateB) && (dateA > 0 || dateB > 0)) {
        return dateB - dateA;
      }

      return 0;
    });
  }, [announcementsList]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return sortedAnnouncements.filter((ann) => {
      if (selectedCategory === "Pinned") {
        if (!ann.pinned) return false;
      } else if (selectedCategory !== "All") {
        if ((ann.category || "General").toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const authorName = typeof ann.author === "string" ? ann.author : (ann.author?.name || "");

      return (
        ann.title.toLowerCase().includes(q) ||
        ann.body.toLowerCase().includes(q) ||
        (authorName && authorName.toLowerCase().includes(q)) ||
        (ann.category && ann.category.toLowerCase().includes(q))
      );
    });
  }, [sortedAnnouncements, selectedCategory, searchQuery]);

  const handleTogglePin = (id: string) => {
    let nextStatus = false;
    setAnnouncementsList((prev) =>
      prev.map((ann) => {
        if (ann.id === id) {
          nextStatus = !ann.pinned;
          return {
            ...ann,
            pinned: nextStatus,
            pinnedAt: nextStatus ? new Date().toISOString() : undefined,
          };
        }
        return ann;
      })
    );

    // Sync in-memory API
    apiClient.announcements.togglePin(id).catch(() => {});
  };

  const handleCopy = (id: string, textToShare: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleInsertFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("announcement-body-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousValue = newBody;
    const selectedText = previousValue.substring(start, end) || "text";
    const replacement = `${prefix}${selectedText}${suffix}`;

    const updated = previousValue.substring(0, start) + replacement + previousValue.substring(end);
    setNewBody(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      body: newBody.trim(),
      pinned: newPinned,
      pinnedAt: newPinned ? new Date().toISOString() : undefined,
      author: user?.name || "Campus Administrator",
      role: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Administrator",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    setAnnouncementsList([newAnnouncement, ...announcementsList]);
    apiClient.announcements
      .create({
        title: newAnnouncement.title,
        body: newAnnouncement.body,
        category: newAnnouncement.category,
        author: typeof newAnnouncement.author === "string" ? newAnnouncement.author : newAnnouncement.author?.name,
        role: newAnnouncement.role,
        pinned: newAnnouncement.pinned,
      })
      .catch(() => {});

    setNewTitle("");
    setNewCategory("General");
    setNewBody("");
    setNewPinned(false);
    setIsModalOpen(false);
    setPreviewTab("write");
  };

  return (
    <RoleShell>
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 ring-1 ring-indigo-500/10 shadow-xs">
              <Megaphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Campus & Alumni Announcements
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Official university updates, program launches, and priority campus notices
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Post Announcement</span>
          </button>
        </motion.div>

        {/* Search & Category Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search announcements, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category & Pinned Pills */}
          <motion.div layout className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {/* Pinned quick filter */}
            {pinnedCount > 0 && (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => setSelectedCategory(selectedCategory === "Pinned" ? "All" : "Pinned")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === "Pinned"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 hover:bg-amber-100"
                }`}
              >
                <Pin size={12} className={selectedCategory === "Pinned" ? "fill-white" : "fill-amber-500 text-amber-600"} />
                <span>Pinned ({pinnedCount})</span>
              </motion.button>
            )}

            {categories.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <motion.button
                  key={cat}
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Markdown & Pinning Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-2.5 text-xs text-indigo-900 dark:text-indigo-200"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600 shrink-0" />
            <span>
              Supports rich <strong>Markdown & HTML</strong> formatting with <strong>Pinned Priority</strong> to keep vital notices at the top.
            </span>
          </div>
          {pinnedCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium shrink-0">
              <Pin size={13} className="fill-amber-500 text-amber-600 rotate-45" />
              <span>{pinnedCount} post{pinnedCount > 1 ? "s" : ""} pinned to top</span>
            </div>
          )}
        </motion.div>

        {/* Announcements Animated List with Layout Transitions */}
        <motion.div layout className="grid gap-5">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredAnnouncements.length === 0 ? (
              <motion.div
                key="empty-state"
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center"
              >
                <Megaphone size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No announcements found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No announcements match "${searchQuery}". Try a different keyword or filter.`
                    : "There are no announcements currently published in this category."}
                </p>
              </motion.div>
            ) : (
              filteredAnnouncements.map((ann) => {
                const isPinned = Boolean(ann.pinned);
                const categoryColorMap: Record<string, string> = {
                  Reunion: "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
                  Programs: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
                  Campus: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
                  Giving: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
                };
                const badgeStyle =
                  categoryColorMap[ann.category || "General"] ||
                  "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

                return (
                  <motion.div
                    key={ann.id}
                    layout="position"
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, y: -12 }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 30 },
                      opacity: { duration: 0.25 },
                      scale: { duration: 0.2 },
                    }}
                  >
                    <Card
                      padding="lg"
                      className={`group relative transition-colors duration-200 shadow-xs hover:shadow-md ${
                        isPinned
                          ? "border-2 border-indigo-400/70 dark:border-indigo-600/70 bg-linear-to-b from-indigo-50/25 dark:from-indigo-950/20 to-white dark:to-slate-900 ring-1 ring-indigo-500/15"
                          : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {/* Pinned Top Accent Banner */}
                      {isPinned && (
                        <div className="mb-3.5 flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-950">
                          <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100/90 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-300/70 dark:border-amber-700/60 shadow-2xs">
                            <Pin size={13} className="fill-amber-600 text-amber-700 dark:fill-amber-400 dark:text-amber-300 rotate-45" />
                            <span>Pinned to Top</span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Priority Announcement
                          </span>
                        </div>
                      )}

                      {/* Card Header: Category, Pin Toggle & Share Action */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badgeStyle}`}
                          >
                            <Tag size={11} className="opacity-70" />
                            {ann.category || "General"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Interactive Pin Toggle Button */}
                          <button
                            onClick={() => handleTogglePin(ann.id)}
                            title={isPinned ? "Unpin this announcement" : "Pin announcement to top of feed"}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                              isPinned
                                ? "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-transparent"
                            }`}
                          >
                            {isPinned ? (
                              <>
                                <Pin size={13} className="fill-amber-600 text-amber-700 dark:fill-amber-400 dark:text-amber-300 rotate-45" />
                                <span>Pinned</span>
                              </>
                            ) : (
                              <>
                                <Pin size={13} className="text-slate-400 group-hover:text-indigo-600" />
                                <span>Pin to top</span>
                              </>
                            )}
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={() => handleCopy(ann.id, `${ann.title}\n\n${ann.body}`)}
                            title="Copy announcement"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                          >
                            {copiedId === ann.id ? (
                              <>
                                <Check size={13} className="text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Share2 size={13} />
                                <span>Share</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {ann.title}
                      </h2>

                      {/* Announcement Body rendered with Markdown / HTML support */}
                      <div className="mt-3.5">
                        <AnnouncementBody content={ann.body} />
                      </div>

                      {/* Footer Meta */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                            {typeof ann.author === "string" ? ann.author : (ann.author?.name || "Campus Administrator")}
                          </span>
                          {ann.role && (
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                              {ann.role}
                            </span>
                          )}
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} />
                            {ann.date}
                          </span>
                        </div>

                        {isPinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            <Pin size={11} className="fill-amber-500 text-amber-600 rotate-45" />
                            Always on top
                          </span>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>

        {/* Post Announcement Modal with AnimatePresence */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                      <Megaphone size={17} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Create Announcement
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handlePublish} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Title & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Announcement Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fall Reunion Registration Now Open"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="General">General</option>
                        <option value="Reunion">Reunion</option>
                        <option value="Programs">Programs</option>
                        <option value="Campus">Campus</option>
                        <option value="Giving">Giving</option>
                        <option value="Career">Career</option>
                      </select>
                    </div>
                  </div>

                  {/* Pin Toggle Control in Form */}
                  <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mt-0.5">
                        <Pin size={16} className={newPinned ? "fill-amber-500 rotate-45" : ""} />
                      </div>
                      <div>
                        <label htmlFor="pin-checkbox" className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer block">
                          Pin to top of feed
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Always display this announcement at the very top of the feed regardless of date.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        id="pin-checkbox"
                        type="checkbox"
                        checked={newPinned}
                        onChange={(e) => setNewPinned(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Tab Switcher & Toolbar */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      {/* Write / Preview Tab buttons */}
                      <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => setPreviewTab("write")}
                          className={`px-3 py-1 font-semibold rounded-md transition-all ${
                            previewTab === "write"
                              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab("preview")}
                          className={`px-3 py-1 font-semibold rounded-md transition-all ${
                            previewTab === "preview"
                              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          Preview Markdown
                        </button>
                      </div>

                      {/* Markdown helper buttons */}
                      {previewTab === "write" && (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <button
                            type="button"
                            onClick={() => handleInsertFormat("**", "**")}
                            title="Bold text (**bold**)"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <Bold size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat("*", "*")}
                            title="Italic text (*italic*)"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <Italic size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat("\n- ", "")}
                            title="Bullet List (- item)"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <List size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat("\n1. ", "")}
                            title="Numbered List (1. item)"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <ListOrdered size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat("[", "](https://)")}
                            title="Link ([title](url))"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <Link2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat("`", "`")}
                            title="Inline Code (`code`)"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <Code size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Body Editor or Live Markdown Preview */}
                    {previewTab === "write" ? (
                      <textarea
                        id="announcement-body-textarea"
                        required
                        rows={8}
                        placeholder={`Write your announcement using Markdown or HTML...

Example:
We are excited to launch our **Fall 2026 Mentorship Program**!

Key benefits:
- 1-on-1 mentorship with senior alumni
- Career workshop series
- Resume & portfolio reviews

Apply on the [Mentorship Portal](/mentorship) before September 1st.`}
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        className="w-full p-3.5 text-sm font-normal text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none resize-y min-h-[180px]"
                      />
                    ) : (
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 min-h-[180px] max-h-[300px] overflow-y-auto">
                        {newBody.trim() ? (
                          <AnnouncementBody content={newBody} />
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Nothing to preview yet. Switch to the Write tab to add content.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Info size={14} className="shrink-0 text-slate-400" />
                    <span>
                      Supported syntax: <code>**bold**</code>, <code>*italic*</code>, <code>- list</code>, <code>1. list</code>, <code>[link](url)</code>, or standard HTML tags.
                    </span>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 cursor-pointer"
                    >
                      {newPinned ? "Publish & Pin Announcement" : "Publish Announcement"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleShell>
  );
}
