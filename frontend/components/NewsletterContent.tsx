"use client";

import { memo, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  Calendar,
  Download,
  BookOpen,
  Search,
  X,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useSearchFilter } from "@/lib/hooks/useSearchFilter";
import type { Newsletter } from "@/lib/api/types";
import { Loader2 } from "lucide-react";

export const NewsletterContent = memo(function NewsletterContent() {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [activePdf, setActivePdf] = useState<{ title: string; url: string } | null>(null);

  const { data, isLoading: loading } = useApi(
    `newsletters:${selectedYear}`,
    () => apiClient.newsletters.list(selectedYear)
  );

  const rawNewsletters = useMemo(() => data?.newsletters || [], [data?.newsletters]);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    isDebouncing,
    filteredItems: filteredNewsletters,
    clearQuery,
  } = useSearchFilter<Newsletter>({
    items: rawNewsletters,
    searchKeys: ["title"],
    customFilter: (n) => {
      if (selectedYear !== "all" && n.year.toString() !== selectedYear) {
        return false;
      }
      return true;
    },
  });

  const availableYears = data?.years || [2024, 2023, 2022, 2021];

  // Group newsletters by year for clean sections
  const groupedByYear = useMemo(() => {
    const map: Record<number, Newsletter[]> = {};
    for (const item of filteredNewsletters) {
      if (!map[item.year]) map[item.year] = [];
      map[item.year].push(item);
    }
    return Object.entries(map).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredNewsletters]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ================= HERO BANNER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-8 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} className="text-red-400" />
            Official University Publication
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading">
            Somaiya Sparsh
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            The flagship alumni newsletter connecting past and present generations. Explore quarterly issues, campus highlights, pioneering alumni stories, and institutional breakthroughs.
          </p>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search newsletters by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
          {isDebouncing && (
            <Loader2 size={16} className="animate-spin text-blue-600 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
          {searchQuery && !isDebouncing && (
            <button
              onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Year Filter Dropdown & Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedYear("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedYear === "all"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All Issues
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedYear === yr.toString()
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= NEWSLETTER GRID ================= */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600" />
        </div>
      ) : filteredNewsletters.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <FileText size={40} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No newsletters found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery.trim()
              ? `No newsletters match "${searchQuery}". Try adjusting your keywords or year filter.`
              : "Try adjusting your search terms or year filter."}
          </p>
          {(searchQuery.trim() || selectedYear !== "all") && (
            <button
              onClick={() => {
                clearQuery();
                setSelectedYear("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {groupedByYear.map(([yearStr, items]) => (
            <section key={yearStr} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-heading">
                  Year {yearStr}
                </h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  {items.length} {items.length === 1 ? "Issue" : "Issues"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((issue) => (
                  <motion.div
                    key={issue.id}
                    whileHover={{ y: -4 }}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    {/* Cover Preview Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={issue.coverImage}
                        alt={issue.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                      {/* Year badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold tracking-wider">
                        {issue.year}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <Calendar size={13} />
                          {new Date(issue.issueDate).toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {issue.title}
                        </h3>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => setActivePdf({ title: issue.title, url: issue.fileUrl })}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
                        >
                          <BookOpen size={14} />
                          Read Issue
                        </button>
                        <a
                          href={issue.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ================= PDF VIEWER MODAL ================= */}
      <AnimatePresence>
        {activePdf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePdf(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <Newspaper size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-md sm:max-w-xl">
                      {activePdf.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">Digital Magazine Reader</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activePdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </a>
                  <button
                    onClick={() => setActivePdf(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close reader"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* PDF Frame */}
              <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-950">
                <iframe
                  src={`${activePdf.url}#view=FitH`}
                  title={activePdf.title}
                  className="w-full h-full border-0"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
