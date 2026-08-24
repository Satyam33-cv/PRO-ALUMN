"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, ArrowRight } from "lucide-react";
import { ReferralThread } from "@/components/ReferralThread";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";

type Status = "pending" | "accepted" | "rejected" | "referred" | "hired";

interface ReferralRequest {
  id: string;
  requesterName: string;
  requesterInitials: string;
  recipientName: string;
  recipientInitials: string;
  jobTitle: string;
  company: string;
  message: string;
  status: Status;
  createdAt: string;
}


const statusTabs: { label: string; value: Status | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Referred", value: "referred" },
  { label: "Hired", value: "hired" },
];

const statusStyles: Record<Status, string> = {
  pending: "bg-brass-500/10 text-brass-500",
  accepted: "bg-sage-500/10 text-sage-500",
  rejected: "bg-clay-500/10 text-clay-500",
  referred: "bg-primaryContainer/10 text-primaryContainer",
  hired: "bg-tertiaryOnContainer/10 text-tertiaryOnContainer font-semibold",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

export function RequestsContent() {
  const [activeTab, setActiveTab] = useState<Status | "all">("all");
  const { data: apiRequests, refresh: refreshRequests } = useApi("requests:list", () => apiClient.requests.list());
  
  const requests: ReferralRequest[] = useMemo(() => {
    if (!apiRequests) return [];
    return (apiRequests as any[]).map((r: any) => ({
      id: r.id,
      requesterName: r.requester?.name || r.requesterName || "Student Member",
      requesterInitials: r.requester?.name ? r.requester.name.split(" ").map((n: string) => n[0]).join("") : "SM",
      recipientName: r.recipient?.name || r.recipientName || "Alumni Member",
      recipientInitials: r.recipient?.name ? r.recipient.name.split(" ").map((n: string) => n[0]).join("") : "AM",
      jobTitle: r.job?.title || r.jobTitle || "Job Referral",
      company: r.job?.company || r.company || "Company",
      message: r.message || r.studentNote || "",
      status: (r.status?.toLowerCase() || "pending") as Status,
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
    }));
  }, [apiRequests]);

  const filtered =
    activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  const statusCounts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Status, number>,
  );

  const pendingForReview = requests.filter((r) => r.status === "pending");

  function handleStatusChange(id: string, newStatus: Status) {
    apiClient.requests.updateStatus(id, newStatus).then(() => {
      refreshRequests();
    });
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage-500">
          Referral Threads
        </p>
        <h1 className="mt-2 font-display text-5xl">Your requests</h1>
      </div>

      {pendingForReview.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg border border-brass-500/20 bg-brass-500/5 p-5"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-brass-500">
            Action Required
          </p>
          <div className="mt-3 space-y-3">
            {pendingForReview.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-lg border border-ink-900/5 bg-white/70 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-[10px] font-medium text-ink-900/60">
                  {req.requesterInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {req.requesterName}
                  </p>
                  <p className="truncate text-xs text-ink-900/45">
                    {req.jobTitle} at {req.company}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleStatusChange(req.id, "accepted")}
                    className="rounded-full bg-sage-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-sage-500/80"
                    aria-label={`Accept referral from ${req.requesterName}`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusChange(req.id, "rejected")}
                    className="rounded-full bg-clay-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-clay-500/80"
                    aria-label={`Reject referral from ${req.requesterName}`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-ink-900/10">
        {statusTabs.map((tab) => {
          const count =
            tab.value === "all" ? requests.length : (statusCounts[tab.value] ?? 0);
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.value
                  ? "border-brass-500 font-semibold text-ink-900"
                  : "border-transparent text-ink-900/50 hover:text-ink-900"
              }`}
            >
              {tab.label}
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink-900/5 px-1.5 text-[10px] font-mono text-ink-900/50">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <Inbox size={40} className="text-ink-900/15" />
            <p className="mt-3 text-sm font-medium text-ink-900/50">
              No requests match this filter
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req, i) => (
              <motion.div
                key={req.id}
                custom={i}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                variants={cardVariants}
                layout
                className="rounded-lg border border-ink-900/10 bg-white/70 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-[11px] font-medium text-ink-900/60">
                    {req.requesterInitials}
                  </div>
                  <span className="text-sm font-medium">{req.requesterName}</span>
                  <ArrowRight size={14} className="text-ink-900/25" />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-[11px] font-medium text-ink-900/60">
                    {req.recipientInitials}
                  </div>
                  <span className="text-sm font-medium">{req.recipientName}</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <p className="text-sm font-semibold">{req.jobTitle}</p>
                  <span className="text-xs text-ink-900/40">at {req.company}</span>
                </div>

                <p className="mt-2 truncate text-xs text-ink-900/60">
                  {req.message}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[req.status]}`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                  <span className="font-mono text-[10px] text-ink-900/40">
                    {req.createdAt}
                  </span>
                </div>

                {(req.status === "accepted" ||
                  req.status === "referred" ||
                  req.status === "hired") && (
                  <div className="mt-4">
                    <ReferralThread
                      status={
                        req.status === "hired"
                          ? "hired"
                          : req.status === "referred"
                            ? "referred"
                            : "accepted"
                      }
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
