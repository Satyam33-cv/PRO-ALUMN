"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Heart, Star, MessageSquare, ExternalLink, ChevronDown } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { Story } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion";

type Filter = "published" | "all";

// Mock data removed in favor of real API

export function StoriesContent() {
  const [filter, setFilter] = useState<Filter>("published");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: apiStories, mutate: mutateStories } = useApi("stories:list", () => apiClient.stories.list());
  const allStories = (apiStories || []) as any[];

  const filtered =
    filter === "published"
      ? allStories.filter((s) => s.status === "published" || s.isApproved)
      : allStories;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSubmit = () => {
    if (!title.trim() || !story.trim()) return;
    setSubmitting(true);
    apiClient.stories.create({ title, story, company: "PRO ALUMN", role: "Alumni" })
      .then(() => {
        setSubmitting(false);
        setModalOpen(false);
        setTitle("");
        setStory("");
        showToast("Story submitted for review!");
        mutateStories([...allStories, { title, story, status: "pending", isApproved: false }]);
      })
      .catch((err) => {
        setSubmitting(false);
        showToast("Error submitting story.");
        console.error(err);
      });
  };

  const handleUpvote = async (storyId: string) => {
    // Optimistic UI
    mutateStories(allStories.map(s => {
      if (s.id !== storyId) return s;
      const isUpvoting = !s.hasVoted;
      return {
        ...s,
        hasVoted: isUpvoting,
        upvoteCount: (s.upvoteCount || 0) + (isUpvoting ? 1 : -1)
      };
    }), false);

    try {
      const res = await apiClient.stories.vote(storyId);
      if (res.hasVoted) showToast("Upvoted!");
      else showToast("Vote removed");
      // Background revalidate to ensure accuracy
      mutateStories();
    } catch (err) {
      console.error(err);
      mutateStories(); // Revert on failure
      showToast("Failed to vote");
    }
  };

  const handleCelebrate = (storyId: string) => {
    showToast("Celebrated! 🎉");
  };

  const upvoteCount = (story: any) => story.upvoteCount || 0;
  const celebrateCount = (story: any) => 0; // Mocked for now
  const isUpvoted = (story: any) => Boolean(story.hasVoted);
  const isCelebrated = (story: any) => false;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-12"
    >
      <motion.div variants={fadeIn}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">
          Stories
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl tracking-tight">
            Spotlight Wall
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brass px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brass-600"
          >
            Share your story
          </button>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink/55">
          Alumni success stories and referral outcomes
        </p>
      </motion.div>

      <motion.div variants={slideUp} className="flex gap-2">
        {(["published", "all"] as Filter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              filter === tab
                ? "bg-ink text-white"
                : "border border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {tab === "published" ? "Published" : "All"}
          </button>
        ))}
      </motion.div>

      <motion.div variants={staggerContainer} className="masonry-grid gap-6">
        {filtered.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            expanded={expandedId === s.id}
            onToggle={() =>
              setExpandedId(expandedId === s.id ? null : s.id)
            }
            upvotes={upvoteCount(s)}
            celebrates={celebrateCount(s)}
            isUpvoted={isUpvoted(s)}
            isCelebrated={isCelebrated(s)}
            onUpvote={() => handleUpvote(s.id)}
            onCelebrate={() => handleCelebrate(s.id)}
          />
        ))}
        {filtered.length === 0 && (
          <Card padding="lg">
            <p className="text-center text-sm text-ink/50">
              No stories to show.
            </p>
          </Card>
        )}
      </motion.div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Share your story</h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setTitle("");
                  setStory("");
                }}
                className="text-ink/40 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your story a title"
                  className="mt-2 w-full rounded-lg border border-ink/20 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-brass"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">
                  Story
                </label>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={5}
                  placeholder="Tell us about your journey…"
                  className="mt-2 w-full rounded-lg border border-ink/20 bg-transparent px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-brass"
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !story.trim() || submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brass px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brass-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  Submit <Send size={14} />
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}

function StoryCard({
  story: s,
  expanded,
  onToggle,
  upvotes,
  celebrates,
  isUpvoted,
  isCelebrated,
  onUpvote,
  onCelebrate,
}: {
  story: Story;
  expanded: boolean;
  onToggle: () => void;
  upvotes: number;
  celebrates: number;
  isUpvoted: boolean;
  isCelebrated: boolean;
  onUpvote: () => void;
  onCelebrate: () => void;
}) {
  const borderColor =
    s.status === "published" || s.isApproved ? "border-l-tertiaryOnContainer" : "border-l-brass";

  return (
    <motion.div
      variants={slideUp}
      style={{ breakInside: "avoid" }}
      className="masonry-item"
    >
      <Card padding="lg" className={`border-l-2 ${borderColor}`}>
        <button
          onClick={onToggle}
          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        >
          <h3 className="font-display text-xl">{s.title}</h3>
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.p
                key="full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mt-3 overflow-hidden text-sm leading-6 text-ink/70"
              >
                {s.excerpt}
              </motion.p>
            ) : (
              <motion.p
                key="truncated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 line-clamp-3 text-sm leading-6 text-ink/70"
              >
                {s.excerpt}
              </motion.p>
            )}
          </AnimatePresence>
        </button>
        <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/15 text-xs font-semibold text-sage overflow-hidden">
              {s.avatarUrl ? (
                <Image src={s.avatarUrl} alt={s.author} width={36} height={36} unoptimized className="h-full w-full object-cover" />
              ) : s.authorInitials || s.author?.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{s.author || "Anonymous"}</p>
              <p className="text-xs text-ink/50">
                {s.role} · {s.company}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="neutral">{s.batch}</Badge>
            <span className="font-mono text-[10px] uppercase text-ink/40">
              {s.date}
            </span>
            <button
              onClick={onUpvote}
              disabled={isCelebrated}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                isUpvoted
                  ? "bg-sage text-white"
                  : "border border-ink/15 text-ink/70 hover:border-sage hover:text-sage"
              }`}
            >
              <Star size={11} className={isUpvoted ? "fill-current" : ""} />
              {upvotes}
            </button>
            <button
              onClick={onCelebrate}
              disabled={isUpvoted}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                isCelebrated
                  ? "bg-brass text-white"
                  : "border border-ink/15 text-ink/70 hover:border-brass hover:text-brass"
              }`}
            >
              <Heart size={11} className={isCelebrated ? "fill-current" : ""} />
              {celebrates}
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}