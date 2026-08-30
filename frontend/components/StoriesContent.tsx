"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Star,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion";

type CategoryFilter = "all" | "achievements" | "career" | "featured";

export interface StoryItem {
  id: string;
  title: string;
  story: string;
  company?: string;
  role?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  hasVoted?: boolean;
  upvoteCount?: number;
  author?: {
    name?: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  [key: string]: unknown;
}

export function StoriesContent() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: apiStories, mutate: mutateStories, refresh: refreshStories } = useApi("stories:list", () => apiClient.stories.list());
  const allStories = ((apiStories || []) as unknown as StoryItem[]);

  const filtered = allStories.filter((s) => {
    if (filter === "featured") return s.isFeatured;
    if (filter === "achievements") return s.title?.toLowerCase().includes("placed") || s.title?.toLowerCase().includes("win") || s.title?.toLowerCase().includes("hackathon") || s.title?.toLowerCase().includes("journey");
    return true;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const res = await apiClient.uploads.media(file, "stories");
      setImageUrl(res.url);
      showToast("Achievement image uploaded to Supabase!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      showToast(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !story.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.stories.create({
        title,
        story,
        company: company || "Somaiya Vidyavihar",
        role: role || (user?.role === "student" ? "Student" : user?.role === "faculty" ? "Faculty" : "Alumni"),
        imageUrl: imageUrl || undefined,
      });

      setSubmitting(false);
      setModalOpen(false);
      setTitle("");
      setStory("");
      setCompany("");
      setRole("");
      setImageUrl("");
      showToast("Achievement story shared to community feed!");
      refreshStories();
    } catch (err: unknown) {
      setSubmitting(false);
      const message = err instanceof Error ? err.message : "Error submitting story";
      showToast(message);
    }
  };

  const handleUpvote = async (storyId: string) => {
    // Optimistic UI
    mutateStories(
      allStories.map((s) => {
        if (s.id !== storyId) return s;
        const isUpvoting = !s.hasVoted;
        return {
          ...s,
          hasVoted: isUpvoting,
          upvoteCount: (s.upvoteCount || 0) + (isUpvoting ? 1 : -1),
        };
      })
    );

    try {
      const res = await apiClient.stories.vote(storyId);
      if (res.hasVoted) showToast("Upvoted! ⭐");
      refreshStories();
    } catch {
      refreshStories();
      showToast("Failed to vote");
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-10"
    >
      <motion.div variants={fadeIn}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-bold">
            COMMUNITY SPOTLIGHT
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-mono">SUPABASE LIVE FEED</span>
        </div>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Student & Alumni Achievements
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Celebrate career milestones, placement wins, hackathon victories, and inspirational alumni stories.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles size={16} />
            + Share Achievement / Story
          </button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={slideUp} className="flex gap-2">
        {[
          { id: "all", label: "All Stories & Feeds" },
          { id: "featured", label: "⭐ Featured Milestones" },
          { id: "achievements", label: "🏆 Placement & Hackathon Wins" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as CategoryFilter)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              filter === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "border border-ink/15 text-slate-600 hover:border-blue-500/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Feed Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((s) => (
          <motion.div key={s.id} variants={slideUp} className="h-full">
            <Card padding="lg" className="flex flex-col h-full border-blue-100 dark:border-blue-900/40 hover:border-blue-500/40 transition-all shadow-xs">
              {/* Card Header with Author Info */}
              <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 font-bold overflow-hidden">
                    {s.alumni?.avatarUrl || s.avatarUrl ? (
                      <Image
                        src={s.alumni?.avatarUrl || s.avatarUrl}
                        alt={s.alumni?.name || s.author || "Author"}
                        width={44}
                        height={44}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (s.alumni?.name || s.author || "User").split(" ").map((n: string) => n[0]).join("")
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {s.alumni?.name || s.author || "Anonymous"}
                      </p>
                      {s.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {s.role || s.alumni?.jobTitle || "Member"} · <strong>{s.company || s.alumni?.currentCompany || "Somaiya"}</strong>
                      {s.batchYear ? ` · Class of ${s.batchYear}` : ""}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                </span>
              </div>

              {/* Title & Body */}
              <div className="py-4 space-y-3 flex-1">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {s.story || s.excerpt}
                </p>

                {/* Attached Image from Supabase Stories Bucket */}
                {s.imageUrl && (
                  <div className="relative mt-3 rounded-xl overflow-hidden border border-ink/10 max-h-60 bg-black/5">
                    <Image
                      src={s.imageUrl}
                      alt={s.title}
                      width={600}
                      height={300}
                      unoptimized
                      className="w-full object-cover max-h-60 hover:scale-102 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  {s.company ? `📍 ${s.company}` : "🎓 Campus Achievement"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpvote(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      s.hasVoted
                        ? "bg-amber-500 text-white shadow-xs"
                        : "border border-ink/15 text-slate-600 hover:border-amber-500/40 hover:text-amber-600"
                    }`}
                  >
                    <Star size={13} className={s.hasVoted ? "fill-current" : ""} />
                    <span>{s.upvoteCount || 0}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      showToast("Story link copied to clipboard!");
                    }}
                    className="p-1.5 rounded-full border border-ink/15 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Share story"
                  >
                    <Share2 size={13} />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 border border-dashed border-ink/15 rounded-2xl">
            <Sparkles size={32} className="mx-auto text-blue-500 mb-2 opacity-60" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No achievement stories found in this category.</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to share your milestone with the alumni community!</p>
          </div>
        )}
      </motion.div>

      {/* ================= CREATE STORY & MEDIA MODAL ================= */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-ink/10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-600" />
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    Share Achievement / Story
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title / Milestone Headline *
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Placed at Google as SDE-1 / Won Hackathon 2026"
                    className="w-full rounded-xl border border-ink/20 bg-transparent px-3.5 py-2.5 text-xs outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Organization
                    </label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Google / Microsoft / AWS"
                      className="w-full rounded-xl border border-ink/20 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Role / Position
                    </label>
                    <input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Software Engineer / Intern"
                      className="w-full rounded-xl border border-ink/20 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Journey & Advice *
                  </label>
                  <textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    rows={4}
                    placeholder="Share how you prepared, projects you built, or advice for fellow students..."
                    className="w-full rounded-xl border border-ink/20 bg-transparent px-3.5 py-2.5 text-xs leading-relaxed outline-none focus:border-blue-600"
                  />
                </div>

                {/* Upload Image to Supabase 'stories' bucket */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Achievement Photo / Banner (Supabase Storage)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 text-xs font-bold hover:bg-blue-500/20 cursor-pointer"
                    >
                      {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={14} />}
                      {imageUrl ? "Replace Image" : "Upload Image to Supabase"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    {imageUrl && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Image attached!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-ink/15 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!title.trim() || !story.trim() || submitting || uploadingImage}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Publish to Feed (+40 pts)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}