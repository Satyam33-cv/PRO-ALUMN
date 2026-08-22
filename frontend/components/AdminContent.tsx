"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  BriefcaseBusiness,
  Clock,
  CalendarDays,
  ShieldCheck,
  FileUp,
  Inbox,
  Target,
  Timer,
  CheckCircle2,
  XCircle,
  Check,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui";
import { BentoGrid } from "@/components/ui/Layout/BentoGrid";
import { StickySidebar } from "@/components/ui/Layout/StickySidebar";

type MetricCard = {
  label: string;
  value: string | number;
  icon: typeof Users;
};

type FunnelBar = {
  label: string;
  count: number;
  color: string;
};

type VerificationAlumni = {
  name: string;
  email: string;
  batch: string;
};

type AdminApiData = {
  metrics: import("@/lib/api/types").AdminMetrics;
  requests: import("@/lib/api/types").ReferralRequest[];
  upcomingEvents: import("@/lib/api/types").EventItem[];
};


export function AdminContent() {
  const [verification, setVerification] = useState<Record<number, "approved" | "rejected">>({});
  const [storyModeration, setStoryModeration] = useState<Record<string, "approved" | "rejected">>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const { data: apiData, error, isLoading } = useApi("admin:stats", async () => {
    const [
      statsData,
      requests,
      upcomingEvents,
      stories,
    ] = await Promise.all([
      apiClient.admin.stats(),
      apiClient.requests.list(),
      apiClient.events.list(),
      apiClient.stories.list(),
    ]);
    return { stats: statsData?.stats || {}, requests, upcomingEvents, pendingStories: (stories || []).filter((s: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => s.status === "pending" || !s.isApproved) } as any;
  });

  const statCards: MetricCard[] = apiData
    ? [
        { label: "Total Members", value: apiData.stats?.users?.total || 0, icon: Users },
        { label: "Verified Members", value: apiData.stats?.users?.verified || 0, icon: Activity },
        { label: "Open Jobs", value: apiData.stats?.jobs?.open || 0, icon: BriefcaseBusiness },
        { label: "Pending Requests", value: apiData.stats?.referrals?.byStatus?.pending || 0, icon: Clock },
        { label: "Upcoming Events", value: apiData.stats?.events?.upcoming || 0, icon: CalendarDays },
        { label: "Pending Stories", value: apiData.stats?.stories?.pending || 0, icon: ShieldCheck },
      ]
    : [];

  const funnelBars: FunnelBar[] = apiData
    ? [
        { label: "Pending", count: apiData.stats?.referrals?.byStatus?.pending || 0, color: "bg-brass" },
        { label: "Accepted", count: apiData.stats?.referrals?.byStatus?.accepted || 0, color: "bg-sage" },
        { label: "Rejected", count: apiData.stats?.referrals?.byStatus?.rejected || 0, color: "bg-clay" },
        { label: "Referred", count: apiData.stats?.referrals?.byStatus?.referred || 0, color: "bg-primaryContainer" },
        { label: "Hired", count: apiData.stats?.referrals?.byStatus?.hired || 0, color: "bg-tertiaryOnContainer" },
      ]
    : [];

  const maxFunnel = Math.max(...funnelBars.map((b) => b.count));

  const verificationQueue: VerificationAlumni[] = []; // Left for API implementation Phase 3

  const pendingStories = apiData?.pendingStories || [];

  const csvErrors = [
    { name: "Row 14 — Marcus Lee", error: "Invalid email format" },
    { name: "Row 27 — Ana Ruiz", error: "Missing graduation year" },
    { name: "Row 31 — Tom NG", error: "Duplicate entry" },
  ];

  const analyticsStats = [
    { label: "Response Time", value: "2.4h avg", icon: Timer },
    { label: "Match Engagement", value: "78% relevance", icon: Target },
    { label: "Admin Turnaround", value: "4.2h avg", icon: Clock },
  ];

  const allSelected = selectedRows.size === verificationQueue.length && verificationQueue.length > 0;
  const someSelected = selectedRows.size > 0 && selectedRows.size < verificationQueue.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(verificationQueue.map((_, i) => i)));
    }
  };

  const toggleRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const bulkApprove = () => {
    setVerification((prev) => {
      const next = { ...prev };
      selectedRows.forEach((i) => {
        next[i] = "approved";
      });
      return next;
    });
    setSelectedRows(new Set());
  };

  const bulkReject = () => {
    setVerification((prev) => {
      const next = { ...prev };
      selectedRows.forEach((i) => {
        next[i] = "rejected";
      });
      return next;
    });
    setSelectedRows(new Set());
  };

  const handleRowApprove = (i: number) => {
    setVerification((prev) => ({ ...prev, [i]: "approved" }));
  };

  const handleRowReject = (i: number) => {
    setVerification((prev) => ({ ...prev, [i]: "rejected" }));
  };

  if (isLoading) {
    return <div className="space-y-12" aria-busy="true" aria-label="Loading admin"><div className="grid grid-cols-2 gap-4 md:grid-cols-3"><Skeleton className="p-5" /><Skeleton className="p-5" /><Skeleton className="p-5" /><Skeleton className="p-5" /><Skeleton className="p-5" /><Skeleton className="p-5" /></div></div>;
  }

  if (error) {
    return <p className="text-red-500">Error loading admin data: {error.message}</p>;
  }

  return (
    <div className="space-y-12">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Command Center</p>
        <h1 className="mt-2 font-display text-5xl">Admin Overview</h1>
        <p className="mt-3 text-sm text-ink/55">Manage your alumni network</p>
      </div>

      <section>
        <BentoGrid
          items={[
            { id: "stats-1", i: "stats-1", w: 2, h: 1, children: (
              <div className="flex items-center gap-3">
                <Users size={20} className="text-brass" />
                <div>
                  <p className="font-display text-4xl tracking-tight">{statCards[0]?.value?.toLocaleString()}</p>
                  <p className="text-xs text-ink/50">{statCards[0]?.label}</p>
                </div>
              </div>
            ) },
            { id: "stats-2", i: "stats-2", w: 2, h: 1, children: (
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-sage" />
                <div>
                  <p className="font-display text-4xl tracking-tight">{statCards[1]?.value?.toLocaleString()}</p>
                  <p className="text-xs text-ink/50">{statCards[1]?.label}</p>
                </div>
              </div>
            ) },
            { id: "stats-3", i: "stats-3", w: 2, h: 1, children: (
              <div className="flex items-center gap-3">
                <BriefcaseBusiness size={20} className="text-brass" />
                <div>
                  <p className="font-display text-4xl tracking-tight">{statCards[2]?.value?.toLocaleString()}</p>
                  <p className="text-xs text-ink/50">{statCards[2]?.label}</p>
                </div>
              </div>
            ) },
            { id: "stats-4", i: "stats-4", w: 2, h: 1, children: (
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-clay" />
                <div>
                  <p className="font-display text-4xl tracking-tight">{statCards[3]?.value?.toLocaleString()}</p>
                  <p className="text-xs text-ink/50">{statCards[3]?.label}</p>
                </div>
              </div>
            ) },
            { id: "stats-5", i: "stats-5", w: 2, h: 1, children: (
              <div className="flex items-center gap-3">
                <CalendarDays size={20} className="text-brass" />
                <div>
                  <p className="font-display text-4xl tracking-tight">{statCards[4]?.value?.toLocaleString()}</p>
                  <p className="text-xs text-ink/50">{statCards[4]?.label}</p>
                </div>
              </div>
            ) },
            { id: "stats-6", i: "stats-6", w: 2, h: 1, children: (
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-brass" />
                <div>
                  <p className="font-display text-4xl tracking-tight">{statCards[5]?.value?.toLocaleString()}</p>
                  <p className="text-xs text-ink/50">{statCards[5]?.label}</p>
                </div>
              </div>
            ) },
          ]}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-lg border border-ink/10 bg-white/70 p-6"
        >
          <h2 className="font-display text-2xl">Referral Funnel</h2>
          <div className="mt-6 space-y-3">
            {funnelBars.map((bar) => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-ink/60">
                  {bar.label}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-ink/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(bar.count / maxFunnel) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                    className={`h-full rounded min-w-[20px] ${bar.color}`}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs text-ink/70">
                  {bar.count}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        <StickySidebar offsetTop={120}>
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="rounded-lg border border-ink/10 bg-white/70 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-2xl">Verification Queue</h2>
                {selectedRows.size > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink/50">{selectedRows.size} selected</span>
                    <button
                      onClick={bulkApprove}
                      className="rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sage/90"
                    >
                      <Check size={11} className="mr-1" /> Approve
                    </button>
                    <button
                      onClick={bulkReject}
                      className="rounded-full border border-clay px-3 py-1.5 text-xs font-semibold text-clay transition-colors hover:bg-clay/5"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-ink/10 overflow-hidden">
                <div className="flex items-center gap-3 py-3 px-4 border-b border-ink/10 bg-ink/5 text-xs font-medium text-ink/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-ink/20 bg-white text-brass focus:ring-brass"
                    />
                    <span className="font-medium">Name</span>
                  </label>
                  <span className="flex-1 text-center">Email</span>
                  <span className="w-20 text-center">Batch</span>
                  <span className="w-32 text-center">Status</span>
                  <span className="w-24 text-center">Actions</span>
                </div>

                <div className="divide-y divide-ink/5">
                  {verificationQueue.map((alumni, i) => (
                    <div key={alumni.email} className="flex items-center gap-3 py-3 px-4">
                      <label className="flex items-center gap-2 cursor-pointer w-10">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(i)}
                          onChange={() => toggleRow(i)}
                          className="h-4 w-4 rounded border-ink/20 bg-white text-brass focus:ring-brass"
                        />
                      </label>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-xs font-medium text-ink/70">
                        {alumni.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{alumni.name}</p>
                        <p className="truncate text-xs text-ink/45">{alumni.email} · {alumni.batch}</p>
                      </div>
                      <span className="w-20 text-center font-mono text-xs text-ink/50">{alumni.batch}</span>
                      <AnimatePresence mode="wait">
                        {verification[i] ? (
                          <motion.span
                            key={verification[i]}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                              verification[i] === "approved"
                                ? "bg-sage/10 text-sage"
                                : "bg-clay/10 text-clay"
                            }`}
                          >
                            {verification[i] === "approved" ? (
                              <>
                                <CheckCircle2 size={12} /> Approved ✓
                              </>
                            ) : (
                              <>
                                <XCircle size={12} /> Rejected
                              </>
                            )}
                          </motion.span>
                        ) : (
                          <motion.div
                            key="buttons"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2"
                          >
                            <button
                              onClick={() => handleRowApprove(i)}
                              className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-sage/90"
                              aria-label={`Approve ${verificationQueue[i]?.name}`}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRowReject(i)}
                              className="rounded-full border border-clay px-3 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay/5"
                              aria-label={`Reject ${verificationQueue[i]?.name}`}
                            >
                              Reject
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 rounded-lg border border-ink/10 bg-white/70 p-6"
          >
            <h2 className="font-display text-2xl">Bulk Import</h2>
            <div className="mt-5 rounded-lg border-2 border-dashed border-ink/20 p-8 text-center">
              <FileUp size={32} className="mx-auto text-ink/30" />
              <p className="mt-3 text-sm text-ink/60">
                Drop CSV file here or{" "}
                <span className="cursor-pointer text-brass underline">
                  browse
                </span>
              </p>
              <p className="mt-1 text-xs text-ink/35">
                Supports .csv files with alumni data
              </p>
            </div>
            <button className="mt-5 rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brass/80">
              Upload roster
            </button>
            <div className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">
                Error Report
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-ink/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 bg-ink/5">
                      <th className="px-4 py-2 font-medium text-ink/60">Name</th>
                      <th className="px-4 py-2 font-medium text-ink/60">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {csvErrors.map((row) => (
                      <tr key={row.name}>
                        <td className="px-4 py-2.5 text-ink/70">{row.name}</td>
                        <td className="px-4 py-2.5 text-clay">{row.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        </div>
      </StickySidebar>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="rounded-lg border border-ink/10 bg-white/70 p-6"
      >
        <h2 className="font-display text-2xl">Story Moderation</h2>
        <div className="mt-5 space-y-4">
          {pendingStories.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Inbox size={32} className="text-ink/20" />
              <p className="mt-2 text-sm text-ink/40">
                No stories pending review
              </p>
            </div>
          )}
          {pendingStories.map((story) => (
            <div
              key={story.id}
              className="rounded-lg border border-ink/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{story.title}</p>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {apiData?.stats?.users?.total ? (story.author || "Anonymous") : story.author} · {story.batchYear || story.batch} · {story.company}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/55">
                    {story.story || story.excerpt}
                  </p>
                </div>
                <AnimatePresence mode="wait">
                  {storyModeration[story.id] ? (
                    <motion.span
                      key={storyModeration[story.id]}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        storyModeration[story.id] === "approved"
                          ? "bg-sage/10 text-sage"
                          : "bg-clay/10 text-clay"
                      }`}
                    >
                      {storyModeration[story.id] === "approved" ? (
                        <>
                          <CheckCircle2 size={12} /> Approved ✓
                        </>
                      ) : (
                        <>
                          <XCircle size={12} /> Rejected
                        </>
                      )}
                    </motion.span>
                  ) : (
                    <motion.div
                      key="mod-buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex shrink-0 gap-2"
                    >
                      <button
                        onClick={() => {
                          apiClient.stories.updateStatus(story.id, true).then(() => {
                            setStoryModeration((prev) => ({
                              ...prev,
                              [story.id]: "approved",
                            }))
                          });
                        }}
                        className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-sage/80"
                        aria-label={`Approve story: ${story.title}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          apiClient.stories.updateStatus(story.id, false).then(() => {
                            setStoryModeration((prev) => ({
                              ...prev,
                              [story.id]: "rejected",
                            }))
                          });
                        }}
                        className="rounded-full border border-clay px-3 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay/5"
                        aria-label={`Reject story: ${story.title}`}
                      >
                        Reject
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {analyticsStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.07, duration: 0.4 }}
            className="rounded-lg border border-ink/10 bg-white/70 p-5"
          >
            <stat.icon size={18} className="text-brass" />
            <p className="mt-3 font-display text-2xl tracking-tight">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-ink/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}