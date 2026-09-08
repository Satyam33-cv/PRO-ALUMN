"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, MessageSquare, Users } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/context/AuthContext";

type MatchRow = {
  id: string;
  name: string;
  jobTitle?: string;
  role?: string;
  currentCompany?: string;
  company?: string;
  department?: string;
  matchScore?: number;
  reasons?: string[];
  sharedSkills?: string[];
};

type JobRow = {
  id: string;
  title: string;
  company: string;
  location?: string;
  posted?: string;
};

async function fetchMatches(): Promise<MatchRow[]> {
  try {
    const res = await apiClient.matching.topAlumni();
    const list = (res as { alumni?: MatchRow[] })?.alumni;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function fetchJobs(): Promise<JobRow[]> {
  try {
    const res = await apiClient.jobs.list();
    if (Array.isArray(res)) return res as JobRow[];
    if (Array.isArray((res as { jobs?: JobRow[] })?.jobs)) return (res as { jobs: JobRow[] }).jobs;
    return [];
  } catch {
    return [];
  }
}

export function DashboardContent() {
  const { user } = useAuth();
  const matchKey = user?.id ? `dashboard:matches:${user.id}` : "dashboard:matches";
  const jobsKey = user?.id ? `dashboard:jobs:${user.id}` : "dashboard:jobs";
  const rewardsKey = user?.id ? `dashboard:rewards:${user.id}` : "dashboard:rewards";

  const {
    data: matches,
    error: matchError,
    isLoading: matchLoading,
    refresh: refreshMatches,
  } = useApi(matchKey, fetchMatches);

  const {
    data: jobs,
    error: jobsError,
    isLoading: jobsLoading,
    refresh: refreshJobs,
  } = useApi(jobsKey, fetchJobs);

  const { data: rewards } = useApi(rewardsKey, () => apiClient.gamification.getStatus());

  const firstName = (user?.name || "there").split(" ")[0];
  const loading = matchLoading || jobsLoading;
  const error = matchError || jobsError;

  if (loading) {
    return (
      <div className="page-shell space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-10 w-64 border-2 border-black" />
        <Skeleton className="h-4 w-96 max-w-full border-2 border-black" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 border-2 border-black" />
          <Skeleton className="h-48 border-2 border-black" />
        </div>
      </div>
    );
  }

  if (error && !matches && !jobs) {
    return (
      <div className="page-shell">
        <ErrorState
          title="Dashboard unavailable"
          body={error.message}
          retry={() => {
            void refreshMatches();
            void refreshJobs();
          }}
        />
      </div>
    );
  }

  const matchList = matches ?? [];
  const jobList = jobs ?? [];

  return (
    <PageShell
      eyebrow="Home"
      title={`Welcome back, ${firstName}`}
      description="People and roles matched to your profile. Open a chat or browse the directory to connect."
      actions={
        <>
          <Link href="/matching" className="nb-btn">
            View matches <ArrowUpRight size={14} />
          </Link>
          <Link href="/directory" className="nb-btn-secondary">
            Directory
          </Link>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {(rewards?.totalPoints != null || rewards?.streak?.current != null) && (
          <Link
            href="/rewards"
            className="nb-card mb-6 flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-[#f5f5f5]"
          >
            <span className="font-mono text-xs font-bold uppercase text-[#525252]">Your rewards</span>
            <span className="font-mono text-sm font-black tabular-nums">{rewards?.totalPoints ?? 0} pts</span>
            {rewards?.rank != null ? (
              <span className="nb-chip">Rank #{rewards.rank}</span>
            ) : null}
            {rewards?.streak?.current ? (
              <span className="nb-chip">{rewards.streak.current}d streak</span>
            ) : null}
            <span className="ml-auto text-xs font-bold uppercase text-[#FF5500]">View all →</span>
          </Link>
        )}

        {/* Matches */}
        <section aria-labelledby="dash-matches" className="nb-card flex flex-col">
          <div className="flex items-center justify-between border-b-2 border-black bg-[#f7f4ef] px-4 py-3">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <h2 id="dash-matches" className="font-mono text-xs font-bold uppercase tracking-wide">
                Suggested alumni
              </h2>
            </div>
            <Link href="/matching" className="font-mono text-[10px] font-bold uppercase underline">
              See all
            </Link>
          </div>

          {matchList.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No matches yet"
                body="Add skills and a short bio on your profile so we can suggest alumni."
                action={
                  <Link href="/complete-profile" className="nb-btn-secondary mt-2">
                    Update profile
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y-2 divide-black">
              {matchList.slice(0, 5).map((m) => {
                const company = m.currentCompany || m.company || "";
                const role = m.jobTitle || m.role || "";
                const score =
                  typeof m.matchScore === "number"
                    ? Math.round(m.matchScore > 1 ? m.matchScore : m.matchScore * 100)
                    : null;
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-black">{m.name}</p>
                      <p className="truncate font-mono text-[11px] text-[#635f57]">
                        {[role, company].filter(Boolean).join(" · ") || m.department || "Alumni"}
                      </p>
                      {Array.isArray(m.reasons) && m.reasons.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {m.reasons.slice(0, 2).map((r) => (
                            <span key={r} className="nb-chip">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {score != null ? (
                      <span className="font-mono text-xs font-black">{score}%</span>
                    ) : null}
                    <Link
                      href={`/chat?userId=${encodeURIComponent(m.id)}&recipient=${encodeURIComponent(m.name)}`}
                      className="nb-btn-secondary !px-3 !py-1.5"
                    >
                      <MessageSquare size={12} /> Message
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Jobs */}
        <section aria-labelledby="dash-jobs" className="nb-card flex flex-col">
          <div className="flex items-center justify-between border-b-2 border-black bg-[#f7f4ef] px-4 py-3">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness size={16} />
              <h2 id="dash-jobs" className="font-mono text-xs font-bold uppercase tracking-wide">
                Open roles
              </h2>
            </div>
            <Link href="/jobs" className="font-mono text-[10px] font-bold uppercase underline">
              See all
            </Link>
          </div>

          {jobList.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No open roles yet" body="Jobs shared by alumni will show up here." />
            </div>
          ) : (
            <ul className="divide-y-2 divide-black">
              {jobList.slice(0, 5).map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f7f4ef]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#FF5500]">
                      <BriefcaseBusiness size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{job.title}</p>
                      <p className="truncate font-mono text-[11px] text-[#635f57]">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                    </div>
                    <ArrowUpRight size={14} className="shrink-0 text-black" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8 nb-card p-5 sm:p-6">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-[#635f57]">Quick links</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/mentorship" className="nb-btn-secondary">
            Skill swap
          </Link>
          <Link href="/events" className="nb-btn-secondary">
            Events
          </Link>
          <Link href="/profile" className="nb-btn-secondary">
            Profile
          </Link>
          <Link href="/chat" className="nb-btn-secondary">
            Messages
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
