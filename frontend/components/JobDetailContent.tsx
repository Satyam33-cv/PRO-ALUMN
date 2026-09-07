"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  MapPin,
  UserCheck,
  Share2,
  Building2,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { ErrorState, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";

export function JobDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: job, error, isLoading, refresh } = useApi(`job:${id}`, () =>
    apiClient.jobs.get(id)
  );

  const [toast, setToast] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  /** Message the alumni who posted this job (if we have their id) */
  const handleMessagePoster = useCallback(async () => {
    const posterId = (job as any)?.postedById || (job as any)?.userId || (job as any)?.authorId;
    if (!user) {
      router.push(`/login?redirect=/jobs/${id}`);
      return;
    }
    if (!posterId) {
      // No poster id — open directory filtered by company
      router.push(`/directory?company=${encodeURIComponent((job as any)?.company || "")}`);
      return;
    }
    setMessaging(true);
    try {
      const res = await apiClient.chat.createThread(String(posterId));
      const threadId =
        (res as any)?.thread?.id || (res as any)?.id || (res as any)?.threadId;
      if (threadId) {
        router.push(`/chat?thread=${encodeURIComponent(String(threadId))}`);
      } else {
        router.push(
          `/chat?userId=${encodeURIComponent(String(posterId))}&recipient=${encodeURIComponent(
            (job as any)?.postedBy || "Alumni"
          )}`
        );
      }
    } catch {
      router.push(
        `/chat?userId=${encodeURIComponent(String(posterId))}&recipient=${encodeURIComponent(
          (job as any)?.postedBy || "Alumni"
        )}`
      );
    } finally {
      setMessaging(false);
    }
  }, [job, user, router, id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 font-mono">
        <Skeleton className="h-8 w-32 border-2 border-black" />
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] p-8 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Job Requisition Unavailable"
          body={error.message || "We could not fetch this job right now."}
          retry={() => void refresh()}
        />
      </div>
    );
  }

  if (!job) return null;

  const reqs = Array.isArray(job.requirements)
    ? job.requirements
    : typeof job.requirements === "string" && (job.requirements as string).trim()
    ? (job.requirements as string).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono text-black select-text pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 bg-[#FF5500] text-white border-2 border-black px-4 py-2 font-mono text-xs font-bold shadow-[4px_4px_0px_#000000] flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Navigation & Header Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <ArrowLeft size={14} /> Back to Job Board
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-[#F5F5F5] border border-black font-bold uppercase text-neutral-600">
            OPP-DISPATCH
          </span>
          <span className="font-bold text-neutral-400">//</span>
          <span className="font-bold text-neutral-600">REQ-{job.id.slice(0, 6).toUpperCase()}</span>
        </div>
      </div>

      {/* Main Job Container */}
      <article className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden">
        {/* Banner Strip */}
        <header className="bg-black text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b-4 border-black">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block animate-pulse"></span>
            <span className="font-bold text-xs tracking-wider uppercase">
              OPPORTUNITY CONDUIT // VERIFIED ALUMNI POSTING
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#FF5500] text-white border border-black text-[11px] font-bold uppercase">
              {job.type}
            </span>
            {job.remote && (
              <span className="px-2 py-0.5 bg-[#FF5500] text-white border border-black text-[11px] font-bold uppercase">
                REMOTE
              </span>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <div className="p-6 sm:p-8 bg-white border-b-2 border-black">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFFFFF] border-3 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center shrink-0">
                <BriefcaseBusiness size={32} className="text-black" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#FF5500]">
                  {job.company}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-black">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 pt-1">
                  <span className="flex items-center gap-1 font-bold">
                    <MapPin size={13} /> {job.location}
                  </span>
                  {(job as any).applyLink && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-900 font-bold text-[10px] uppercase">
                      <ExternalLink size={12} /> External Apply Available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast("Job link copied to clipboard");
              }}
              className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-black hover:text-white border-2 border-black text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] transition-colors flex items-center gap-1.5 cursor-pointer self-start"
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>

        {/* Body Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Main Description */}
          <div className="lg:col-span-2 p-6 sm:p-8 space-y-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
            {/* Description */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-black inline-block"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  POSITION SPECIFICATION & CONTEXT
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-neutral-800 font-sans whitespace-pre-wrap">
                {job.description ||
                  "This requisition was posted directly by a member of the PRO ALUMN alumni network. Reach out directly with a referral inquiry for internal consideration."}
              </p>
            </section>

            {/* Requirements */}
            {reqs.length > 0 && (
              <section className="space-y-3 pt-4 border-t-2 border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block"></span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    KEY CANDIDATE REQUIREMENTS
                  </h2>
                </div>
                <ul className="space-y-2">
                  {reqs.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-800 font-sans">
                      <span className="w-4 h-4 bg-black text-[#FF5500] border border-black flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Apply + Message Alumni CTAs (no referral pipeline) */}
            <section className="p-6 bg-[#FFFFFF] border-2 border-black space-y-4 shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center gap-2 border-b border-black pb-3">
                <UserCheck size={18} className="text-[#FF5500]" />
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Next steps
                </span>
              </div>
              <p className="text-xs font-sans text-neutral-700">
                Apply on the company site, or message alumni who work there for informal advice.
                There is no tracked referral workflow — conversations live in Chat.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {(job as any).applyLink ? (
                  <a
                    href={(job as any).applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-[#FF5500] hover:bg-[#B80500] text-white border-2 border-black font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink size={16} />
                    Apply on company site
                  </a>
                ) : (
                  <div className="flex-1 py-3 px-4 bg-neutral-200 text-neutral-600 border-2 border-black font-mono font-bold text-xs uppercase flex items-center justify-center gap-2">
                    No external apply link
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleMessagePoster}
                  disabled={messaging}
                  className="flex-1 py-3 px-4 bg-black hover:bg-[#0A0A0A] text-white border-2 border-black font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {messaging ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Opening chat…
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} />
                      Message alumni in Chat
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="p-6 sm:p-8 bg-[#FFFFFF] space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 border-b-2 border-black pb-2">
                REQUISITION METRICS
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-neutral-300">
                  <span className="text-neutral-500 font-bold uppercase">LOCATION:</span>
                  <span className="font-bold text-black">{job.location}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-300">
                  <span className="text-neutral-500 font-bold uppercase">WORK MODE:</span>
                  <span className="font-bold text-black">{job.remote ? "REMOTE / DISTRIBUTED" : "ON-SITE"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-300">
                  <span className="text-neutral-500 font-bold uppercase">DATE POSTED:</span>
                  <span className="font-bold text-black">{job.posted || "RECENT"}</span>
                </div>
                {job.postedBy && (
                  <div className="flex justify-between items-center py-1 border-b border-neutral-300">
                    <span className="text-neutral-500 font-bold uppercase">SHARED BY:</span>
                    <span className="font-bold text-black">
                      {job.postedBy} {job.postedByBatch ? `('${job.postedByBatch.slice(-2)})` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-2 border-black space-y-2 shadow-[2px_2px_0px_#000000]">
              <div className="flex items-center gap-2 font-bold text-xs uppercase text-black">
                <Building2 size={16} className="text-[#FF5500]" />
                <span>INSTITUTIONAL FOOTPRINT</span>
              </div>
              <p className="text-[11px] font-sans text-neutral-700">
                Verified alumni actively work at {job.company}. Connect via the Directory to expand your internal network.
              </p>
              <Link
                href={`/directory?company=${encodeURIComponent(job.company)}`}
                className="inline-block pt-1 font-mono text-[11px] font-bold text-[#FF5500] hover:underline uppercase"
              >
                Browse Company Alumni →
              </Link>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
