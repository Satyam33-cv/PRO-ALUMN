"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Heart,
  Send,
  GraduationCap,
  MapPin,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { staggerContainer, slideUp } from "@/lib/motion";

type FilterType = "batch" | "department" | "location" | "mentors";

type DirectoryAlumni = {
  id: string;
  name: string;
  batch: string;
  company: string;
  role: string;
  location: string;
  initials: string;
  match?: number;
  department?: string;
  isMentor?: boolean;
  isVerified?: boolean;
};

type ViewMode = "grid" | "list";

function DirectoryGridCard({
  alumni,
  onStartChat,
  isStartingChat,
}: {
  alumni: DirectoryAlumni;
  onStartChat: (id: string) => void;
  isStartingChat: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <motion.article
      variants={slideUp}
      className="group border border-ink-900/10 bg-white/70 p-5 transition-colors hover:border-brass-500/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-500 text-sm font-semibold text-white">
            {alumni.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl">{alumni.name}</h3>
              {alumni.isVerified && (
                <ShieldCheck size={15} className="text-[#8a8f98]" />
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-900/45">
              Class of {alumni.batch}
            </p>
          </div>
        </div>
        <button
          onClick={() => setBookmarked(!bookmarked)}
          className="shrink-0 p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <Heart
            size={18}
            className={
              bookmarked
                ? "fill-clay-500 text-clay-500"
                : "text-ink-900/30 hover:text-clay-500"
            }
          />
        </button>
      </div>

      <div className="mt-6 border-t border-ink-900/10 pt-4">
        <p className="text-sm font-medium">
          {alumni.role}{" "}
          <span className="text-ink-900/35">at</span> {alumni.company}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-900/50">
          <MapPin size={12} /> {alumni.location}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onStartChat(alumni.id)}
          disabled={isStartingChat}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/15 px-3 py-1.5 text-[11px] font-semibold text-ink-900/70 transition-colors hover:border-brass-500 hover:text-brass-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 disabled:opacity-50"
        >
          {isStartingChat ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Message
        </button>
        <Link
          href={`/mentorship?mentor=${alumni.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-brass px-3 py-1.5 text-[11px] font-semibold text-canvas transition-colors hover:bg-brass-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        >
          <GraduationCap size={12} /> Request Mentorship
        </Link>
      </div>

      <Link
        href={`/directory/${alumni.id}`}
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sage-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 group-hover:text-brass-500"
      >
        View profile
      </Link>
    </motion.article>
  );
}

function DirectoryListCard({
  alumni,
  onStartChat,
  isStartingChat,
}: {
  alumni: DirectoryAlumni;
  onStartChat: (id: string) => void;
  isStartingChat: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <motion.article
      variants={slideUp}
      className="group border border-ink-900/10 bg-white/70 p-4 transition-colors hover:border-brass-500/60"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-500 text-sm font-semibold text-white">
            {alumni.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg">{alumni.name}</h3>
              {alumni.isVerified && (
                <ShieldCheck size={14} className="text-[#8a8f98]" />
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-900/45">
              Class of {alumni.batch}
            </p>
            <p className="mt-0.5 text-sm text-ink-900/55">
              {alumni.role} at {alumni.company}
            </p>
            <p className="flex items-center gap-1 text-xs text-ink-900/50">
              <MapPin size={12} /> {alumni.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Heart
              size={16}
              className={
                bookmarked
                  ? "fill-clay-500 text-clay-500"
                  : "text-ink-900/30 hover:text-clay-500"
              }
            />
          </button>
          <button
            onClick={() => onStartChat(alumni.id)}
            disabled={isStartingChat}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/15 px-3 py-1.5 text-[11px] font-semibold text-ink-900/70 transition-colors hover:border-brass-500 hover:text-brass-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 disabled:opacity-50"
          >
            {isStartingChat ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            Message
          </button>
          <Link
            href={`/mentorship?mentor=${alumni.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-brass px-3 py-1.5 text-[11px] font-semibold text-canvas transition-colors hover:bg-brass-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            <GraduationCap size={11} /> Request Mentorship
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function DirectoryContent({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const deferredQuery = useDeferredValue(query);

  const handleStartChat = async (targetUserId: string) => {
    try {
      setStartingChatId(targetUserId);
      const res = await apiClient.chat.createThread(targetUserId);
      if (res?.thread?.id) {
        router.push(`/chat?thread=${res.thread.id}`);
      } else {
        router.push("/chat");
      }
    } catch (err) {
      console.error("Failed to start chat thread:", err);
      router.push("/chat");
    } finally {
      setStartingChatId(null);
    }
  };

  const { data: allAlumni, error, isLoading, refresh } = useApi(
    "alumni:all",
    () => apiClient.alumni.list()
  );

  const filteredData = useMemo(() => {
    if (!allAlumni) return undefined;

    let result = allAlumni;

    if (deferredQuery.trim()) {
      const q = deferredQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
      );
    }

    if (activeFilter === "batch" && filterValue) {
      result = result.filter((a) => a.batch === filterValue);
    } else if (activeFilter === "department" && filterValue) {
      result = result.filter((a) => a.department === filterValue);
    } else if (activeFilter === "location" && filterValue) {
      result = result.filter((a) => a.location === filterValue);
    } else if (activeFilter === "mentors") {
      result = result.filter((a) => a.isMentor === true);
    }

    return result;
  }, [allAlumni, deferredQuery, activeFilter, filterValue]);

  const batches = useMemo(
    () =>
      allAlumni
        ? Array.from(new Set(allAlumni.map((a) => a.batch))).sort(
            (a, b) => parseInt(b) - parseInt(a)
          )
        : [],
    [allAlumni]
  );

  const departments = useMemo(
    () =>
      allAlumni
        ? Array.from(
            new Set(allAlumni.map((a) => a.department || "").filter(Boolean))
          ).sort()
        : [],
    [allAlumni]
  );

  const locations = useMemo(
    () =>
      allAlumni
        ? Array.from(new Set(allAlumni.map((a) => a.location))).sort()
        : [],
    [allAlumni]
  );

  const mentorCount = useMemo(
    () => (allAlumni ? allAlumni.filter((a) => a.isMentor).length : 0),
    [allAlumni]
  );

  const handleFilterSelect = (filter: FilterType, value?: string) => {
    if (activeFilter === filter && filterValue === (value ?? null)) {
      setActiveFilter(null);
      setFilterValue(null);
    } else {
      setActiveFilter(filter);
      setFilterValue(value ?? null);
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
    setFilterValue(null);
  };

  const totalCount = allAlumni?.length ?? 0;
  const shownCount = filteredData?.length ?? 0;

  const CardComponent = viewMode === "grid" ? DirectoryGridCard : DirectoryListCard;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage-500">
          The network
        </p>
        <h1 className="mt-2 font-display text-5xl">Find your people.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-900/55">
          Search by shared interests, experience, and the places your path might
          go next.
        </p>
      </motion.div>

      <Card padding="md" className="mt-10 max-w-3xl">
        <label
          htmlFor="directory-search"
          className="flex items-center gap-3 border-b border-ink-900/20 py-3"
        >
          <Search size={18} className="text-ink-900/45" />
          <span className="sr-only">Search alumni</span>
          <input
            id="directory-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-900/35 focus:ring-0"
            placeholder="Search name, role, company, or city"
          />
        </label>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-900/55">
            <SlidersHorizontal size={14} /> Filter by:
          </div>
          {activeFilter && (
            <button
              onClick={clearFilter}
              className="flex items-center gap-1 text-xs font-medium text-brass-500 transition-colors hover:text-brass-600"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-ink-900/55">
          <LayoutGrid size={14} /> View:
        </div>
        <div className="flex rounded-lg border border-ink-900/10 bg-white/50 p-1">
          <button
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-brass text-canvas"
                : "text-ink-900/60 hover:text-ink-900"
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-brass text-canvas"
                : "text-ink-900/60 hover:text-ink-900"
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={clearFilter}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !activeFilter
              ? "bg-sage-500 text-white"
              : "border border-ink-900/20 text-ink-900/70 hover:border-sage-500/50 hover:text-ink-900"
          }`}
        >
          All
        </button>

        <button
          onClick={() => handleFilterSelect("batch")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilter === "batch"
              ? "bg-sage-500 text-white"
              : "border border-ink-900/20 text-ink-900/70 hover:border-sage-500/50 hover:text-ink-900"
          }`}
        >
          Batch
        </button>

        {activeFilter === "batch" &&
          batches.map((batch) => (
            <button
              key={batch}
              onClick={() => handleFilterSelect("batch", batch)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filterValue === batch
                  ? "bg-brass-500 text-white"
                  : "border border-ink-900/10 text-ink-900/60 hover:border-brass-500/50"
              }`}
            >
              Class of {batch}
            </button>
          ))}

        <button
          onClick={() => handleFilterSelect("department")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilter === "department"
              ? "bg-sage-500 text-white"
              : "border border-ink-900/20 text-ink-900/70 hover:border-sage-500/50 hover:text-ink-900"
          }`}
        >
          Department
        </button>

        {activeFilter === "department" &&
          departments.map((dept) => (
            <button
              key={dept}
              onClick={() => handleFilterSelect("department", dept)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filterValue === dept
                  ? "bg-brass-500 text-white"
                  : "border border-ink-900/10 text-ink-900/60 hover:border-brass-500/50"
              }`}
            >
              {dept}
            </button>
          ))}

        <button
          onClick={() => handleFilterSelect("location")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilter === "location"
              ? "bg-sage-500 text-white"
              : "border border-ink-900/20 text-ink-900/70 hover:border-sage-500/50 hover:text-ink-900"
          }`}
        >
          Location
        </button>

        {activeFilter === "location" &&
          locations.map((location) => (
            <button
              key={location}
              onClick={() => handleFilterSelect("location", location)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filterValue === location
                  ? "bg-brass-500 text-white"
                  : "border border-ink-900/10 text-ink-900/60 hover:border-brass-500/50"
              }`}
            >
              {location}
            </button>
          ))}

        <button
          onClick={() => handleFilterSelect("mentors")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilter === "mentors"
              ? "bg-sage-500 text-white"
              : "border border-ink-900/20 text-ink-900/70 hover:border-sage-500/50 hover:text-ink-900"
          }`}
        >
          Mentors {mentorCount > 0 && `(${mentorCount})`}
        </button>
      </div>

      {!isLoading && filteredData && (
        <p className="mt-8 text-xs text-ink-900/45">
          Showing {shownCount} of {totalCount} alumni
        </p>
      )}

      <section className="mt-4" aria-live="polite">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-64" />
          </div>
        ) : null}
        {!isLoading && error ? (
          <ErrorState
            title="The directory is unavailable"
            body={error.message}
            retry={() => void refresh()}
          />
        ) : null}
        {!isLoading && !error && filteredData?.length === 0 ? (
          <EmptyState
            title="No alumni match that search"
            body="Try a broader role, company, or city."
          />
        ) : null}
        {!isLoading && !error && filteredData && filteredData.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={
              viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            {filteredData.map((alumni) => (
              <CardComponent
                key={alumni.id}
                alumni={alumni}
                onStartChat={handleStartChat}
                isStartingChat={startingChatId === alumni.id}
              />
            ))}
          </motion.div>
        ) : null}
      </section>
    </>
  );
}