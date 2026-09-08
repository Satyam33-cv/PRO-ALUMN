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
      <div className="border-4 border-black bg-white p-8 sm:p-10 shadow-[6px_6px_0px_#000000] text-black">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-[#FF5500] text-white font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
            <Sparkles size={14} className="stroke-[3]" />
            Official University Publication
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black">
            Somaiya Sparsh
          </h1>
          <p className="font-mono text-xs sm:text-sm text-neutral-600 leading-relaxed">
            The flagship alumni newsletter connecting past and present generations. Explore quarterly issues, campus highlights, pioneering alumni stories, and institutional breakthroughs.
          </p>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border-3 border-black shadow-[4px_4px_0px_#000000]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
          <input
            type="text"
            placeholder="Search newsletters by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 font-mono text-xs border-2 border-black bg-white text-black placeholder-neutral-400 focus:outline-none focus:bg-[#FF5500]/10 shadow-[2px_2px_0px_#000000] transition-all"
          />
          {isDebouncing && (
            <Loader2 size={16} className="animate-spin text-black absolute right-3 top-1/2 -translate-y-1/2" />
          )}
          {searchQuery && !isDebouncing && (
            <button
              onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:opacity-60"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Year Filter Dropdown & Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedYear("all")}
              className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black uppercase transition-all ${
                selectedYear === "all"
                  ? "bg-black text-[#FF5500] shadow-[2px_2px_0px_#000000]"
                  : "bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_#000000]"
              }`}
            >
              All Issues
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr.toString())}
                className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black uppercase transition-all ${
                  selectedYear === yr.toString()
                    ? "bg-black text-[#FF5500] shadow-[2px_2px_0px_#000000]"
                    : "bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_#000000]"
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
        <div className="flex justify-center py-20 border-4 border-black bg-white shadow-[6px_6px_0px_#000000]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-black border-t-[#FF5500]" />
        </div>
      ) : filteredNewsletters.length === 0 ? (
        <div className="text-center py-16 bg-white border-4 border-black shadow-[6px_6px_0px_#000000] p-8">
          <FileText size={44} className="mx-auto text-black mb-3" />
          <h3 className="font-sans text-xl font-black uppercase text-black">No newsletters found</h3>
          <p className="font-mono text-xs text-neutral-500 mt-1">
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
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-[#FF5500] text-white font-mono text-xs font-black uppercase hover:bg-black hover:text-white shadow-[2px_2px_0px_#000000] transition-colors"
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
                <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                  Year {yearStr}
                </h2>
                <div className="h-0.5 flex-1 bg-black" />
                <span className="font-mono text-xs font-bold uppercase text-black border-2 border-black bg-[#FF5500] px-3 py-1 shadow-[2px_2px_0px_#000000]">
                  {items.length} {items.length === 1 ? "Issue" : "Issues"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((issue) => (
                  <motion.div
                    key={issue.id}
                    whileHover={{ y: -4 }}
                    className="group relative flex flex-col overflow-hidden border-3 border-black bg-white shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] transition-all"
                  >
                    {/* Cover Preview Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 border-b-2 border-black">
                      <Image
                        src={issue.coverImage}
                        alt={issue.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />

                      {/* Year badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 border-2 border-black bg-[#FF5500] text-white font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000]">
                        {issue.year}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-neutral-500">
                          <Calendar size={13} className="text-black" />
                          {new Date(issue.issueDate).toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <h3 className="text-base font-black uppercase tracking-tight text-black line-clamp-2">
                          {issue.title}
                        </h3>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t-2 border-black">
                        <button
                          onClick={() => setActivePdf({ title: issue.title, url: issue.fileUrl })}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border-2 border-black bg-black text-[#FF5500] hover:bg-[#FF5500] hover:text-black font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >
                          <BookOpen size={14} />
                          Read Issue
                        </button>
                        <a
                          href={issue.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center justify-center p-2 border-2 border-black bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_#000000] transition-colors"
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
