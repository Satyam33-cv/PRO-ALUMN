"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

type EditorialArticleProps = {
  story: {
    id: string;
    title: string;
    excerpt: string;
    author: string;
    batch: string;
    company: string;
    role: string;
    date: string;
    status: "published" | "pending" | "rejected";
  };
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

export function EditorialArticle({ story, onApprove, onReject }: EditorialArticleProps) {
  const [showModeration, setShowModeration] = useState(false);

  return (
    <article className="prose max-w-2xl lg:max-w-3xl space-y-6 border-l-4 border-brass-500 px-6 py-6 bg-background">
      <h2 className="text-2xl font-display font-semibold tracking-tight">
        {story.title}
      </h2>

      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm text-ink-900/60">
          {story.author} · {story.batch} · {story.company}
        </p>

        {story.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowModeration(true)}
              className="rounded-full bg-brass-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brass-500/80"
            >
              Moderate
            </button>
          </div>
        )}
      </div>

      <p className="text-ink-900/60 line-clamp-3">{story.excerpt}</p>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-ink-900/50 uppercase tracking-wider">
          {new Date(story.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}</p>

        {story.status === "pending" && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onApprove?.(story.id)}
              className="rounded-full bg-sage-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sage-500/80"
              aria-label={`Approve story: ${story.title}`}
            >
              Approve
            </button>
            <button
              onClick={() => onReject?.(story.id)}
              className="rounded-full border border-clay-500 px-3 py-1.5 text-xs font-medium text-clay-500 transition-colors hover:bg-clay-500/5"
              aria-label={`Reject story: ${story.title}`}
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {story.status === "published" && (
        <Link
          href={`/stories/${story.id}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brass-500 underline underline-offset-4"
        >
          Read full story
          <ArrowRight size={12} className="transition-transform hover:translate-x-1" />
        </Link>
      )}

      {story.status === "pending" && showModeration && (
        <div className="mt-6 p-4 border border-border rounded-lg bg-background">
          <h3 className="text-semibold mb-3">Moderation Panel</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onApprove?.(story.id)}
              className="rounded-full bg-sage-500 px-4 py-2 text-sm font-medium text-white"
              aria-label={`Approve story: ${story.title}`}
            >
              Approve
            </button>
            <button
              onClick={() => onReject?.(story.id)}
              className="rounded-full border border-clay-500 px-4 py-2 text-sm font-medium text-clay-500"
              aria-label={`Reject story: ${story.title}`}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </article>
  );
}