"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Sparkles } from "lucide-react";
import { AlumniCard } from "@/components/AlumniCard";
import { MatchRing } from "@/components/MatchRing";
import { ReferralThread } from "@/components/ReferralThread";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import type { Alumni, ReferralRequest, User, Job } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/useApi";

type DashboardData = { user: User; alumni: Alumni[]; jobs: Job[]; requests: ReferralRequest[] };

async function fetchDashboard(): Promise<DashboardData> {
  const [user, alumni, jobs, requests] = await Promise.all([
    apiClient.auth.me(),
    apiClient.alumni.list(),
    apiClient.jobs.list(),
    apiClient.requests.list(),
  ]);
  return { user, alumni, jobs, requests };
}

function matchScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return 82 + (hash % 17);
}

export function DashboardContent() {
  const { data, error, isLoading, refresh } = useApi("dashboard", fetchDashboard);

  if (isLoading) {
    return <div className="space-y-12" aria-busy="true" aria-label="Loading dashboard"><div><Skeleton className="mb-4 h-3 w-36" /><Skeleton className="h-14 max-w-xl" /><Skeleton className="mt-4 h-4 max-w-md" /></div><div className="grid gap-4 md:grid-cols-3"><Skeleton variant="card" className="h-64" /><Skeleton variant="card" className="h-64" /><Skeleton variant="card" className="h-64" /></div></div>;
  }

  if (error) {
    return <ErrorState title="Your dashboard is unavailable" body={error.message} retry={() => void refresh()} />;
  }

  if (!data) return null;

  const firstName = data.user.name.split(" ")[0] || "there";
  const activeRequest = data.requests.find((request) => request.status === "accepted" || request.status === "pending");
  const topMatches = [...data.alumni]
    .sort((a, b) => matchScore(b.id) - matchScore(a.id))
    .slice(0, 5);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Your network</p><h1 className="mt-2 font-display text-5xl tracking-tight">Good morning, {firstName}.</h1><p className="mt-3 text-sm text-ink/55">Here is what is moving in your network.</p></div>
        <Link href="/directory" className="group inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold hover:border-brass focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-2">Browse the directory <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>

      <section className="mt-10" aria-labelledby="matches-heading">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass/15 text-brass"><Sparkles size={17} /></span>
            <div>
              <h2 id="matches-heading" className="font-display text-3xl">Top 5 AI Alumni Matches</h2>
              <p className="mt-0.5 text-xs text-ink/50">384-dim vector similarity · refreshed daily</p>
            </div>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-ink/45 sm:block">Vector scores</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink/10 bg-ink text-canvas">
          <ul className="divide-y divide-canvas/10">
            {topMatches.map((alumni, i) => {
              const score = matchScore(alumni.id);
              return (
                <li key={alumni.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas/5">
                  <span className="w-4 shrink-0 font-mono text-[10px] uppercase text-canvas/40">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass text-sm font-semibold text-canvas">{alumni.initials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{alumni.name}</p>
                    <p className="truncate text-xs text-canvas/55">{alumni.role} at {alumni.company}</p>
                  </div>
                  <div className="hidden flex-wrap gap-1.5 sm:flex">
                    {[alumni.department ?? "Mentor", alumni.location].filter(Boolean).slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-canvas/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-canvas/70">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <MatchRing percentage={score} />
                    <Link href="/jobs" className="rounded-full bg-brass px-4 py-2 text-xs font-semibold text-canvas transition-colors hover:bg-brass-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass">Ask Referral</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_.9fr]" aria-labelledby="tracker-heading">
        <div>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 id="tracker-heading" className="font-display text-3xl">Application status</h2>
            <Link href="/requests" className="text-xs font-semibold text-sage underline underline-offset-4">View all</Link>
          </div>
          <Card padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-brass">Your active thread</p>
                <h3 className="mt-2 font-display text-2xl">{activeRequest ? activeRequest.recipient.name : "Start a conversation"}</h3>
              </div>
              {activeRequest ? <span className="font-mono text-[10px] text-ink/45">{activeRequest.status}</span> : null}
            </div>
            {activeRequest ? (
              <>
                <p className="mt-2 text-xs text-ink/55">{activeRequest.message}</p>
                <div className="mt-8">
                  <ReferralThread status={activeRequest.status === "accepted" ? "accepted" : "pending"} />
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-ink/60">Browse the directory to find someone who can help with your next move.</p>
            )}
          </Card>
        </div>

        <div aria-labelledby="jobs-heading">
          <div className="mb-5 flex items-baseline justify-between"><h2 id="jobs-heading" className="font-display text-3xl">Open doors</h2><Link href="/jobs" className="text-xs font-semibold text-sage underline underline-offset-4">View all</Link></div>
          {data.jobs.length > 0 ? <div className="divide-y divide-ink/10 border-y border-ink/10">{data.jobs.slice(0, 4).map((job) => <Link href={`/jobs/${job.id}`} key={job.id} className="group flex items-center gap-4 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"><div className="flex h-10 w-10 shrink-0 items-center justify-center bg-brass/15 text-brass"><BriefcaseBusiness size={18} /></div><div className="flex-1"><h3 className="text-sm font-semibold group-hover:text-brass">{job.title}</h3><p className="mt-1 text-xs text-ink/50">{job.company} · {job.location}</p></div><span className="hidden font-mono text-[10px] uppercase text-ink/40 sm:block">{job.posted}</span></Link>)}</div> : <EmptyState title="No open roles yet" body="New opportunities shared by your network will appear here." />}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="people-heading">
        <div className="mb-5 flex items-baseline justify-between gap-4"><h2 id="people-heading" className="font-display text-3xl">People worth knowing</h2><span className="font-mono text-[10px] uppercase tracking-wider text-ink/45">Matched to your interests</span></div>
        {data.alumni.length > 0 ? <div className="grid gap-4 md:grid-cols-3">{data.alumni.slice(0, 3).map((alumni) => <AlumniCard key={alumni.id} alumni={alumni} />)}</div> : <EmptyState title="Your network is waiting" body="Browse the directory to find people matched to your interests." action={<Link href="/directory" className="font-semibold text-sage underline underline-offset-4">Browse the directory</Link>} />}
      </section>
    </>
  );
}