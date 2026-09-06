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
  pending: "bg-[#CCFF00] border-2 border-black text-black font-mono font-bold uppercase shadow-[2px_2px_0px_#000000]",
  accepted: "bg-[#00E676] border-2 border-black text-black font-mono font-bold uppercase shadow-[2px_2px_0px_#000000]",
  rejected: "bg-[#FF5500] border-2 border-black text-white font-mono font-bold uppercase shadow-[2px_2px_0px_#000000]",
  referred: "bg-cyan-300 border-2 border-black text-black font-mono font-bold uppercase shadow-[2px_2px_0px_#000000]",
  hired: "bg-[#CCFF00] border-2 border-black text-black font-mono font-black uppercase shadow-[2px_2px_0px_#000000]",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

interface ApiRequestRaw {
  id: string;
  requester?: { name?: string };
  requesterName?: string;
  recipient?: { name?: string };
  recipientName?: string;
  job?: { title?: string; company?: string };
  jobTitle?: string;
  company?: string;
  message?: string;
  studentNote?: string;
  status?: string;
  createdAt?: string;
}

export function RequestsContent() {
  const [activeTab, setActiveTab] = useState<Status | "all">("all");
  const { data: apiRequests, refresh: refreshRequests } = useApi("requests:list", () => apiClient.requests.list());
  
  const requests: ReferralRequest[] = useMemo(() => {
    if (!apiRequests) return [];
    return (apiRequests as unknown as ApiRequestRaw[]).map((r) => ({
      id: r.id,
      requesterName: r.requester?.name || r.requesterName || "Student Member",
      requesterInitials: r.requester?.name ? r.requester.name.split(" ").map((n) => n[0]).join("") : "SM",
      recipientName: r.recipient?.name || r.recipientName || "Alumni Member",
      recipientInitials: r.recipient?.name ? r.recipient.name.split(" ").map((n) => n[0]).join("") : "AM",
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
    <div className="space-y-8">
      <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-[#CCFF00] border border-black" />
          <p className="font-mono text-xs uppercase font-bold tracking-[0.2em] text-black">
            [ SECTION 05 // REFERRAL PIPELINE & THREADS ]
          </p>
        </div>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-black">
          Referral Requests
        </h1>
        <p className="mt-1 font-mono text-xs text-neutral-600">
          Track end-to-end candidate intros, verify recommendations, and review hiring outcomes.
        </p>
      </div>

      {pendingForReview.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border-4 border-black bg-[#FFFBEA] p-5 shadow-[6px_6px_0px_#000000]"
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-[#FF5500] border border-black animate-pulse" />
            <p className="font-mono text-xs uppercase font-black tracking-wider text-[#FF5500]">
              Action Required // Pending Referral Decisions ({pendingForReview.length})
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {pendingForReview.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000000]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#CCFF00] text-xs font-mono font-black text-black">
                  {req.requesterInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-black">
                    {req.requesterName}
                  </p>
                  <p className="truncate font-mono text-xs text-neutral-600">
                    {req.jobTitle} at {req.company}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleStatusChange(req.id, "accepted")}
                    className="border-2 border-black bg-[#00E676] px-3 py-1 font-mono text-xs font-black text-black uppercase shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    aria-label={`Accept referral from ${req.requesterName}`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusChange(req.id, "rejected")}
                    className="border-2 border-black bg-[#FF5500] px-3 py-1 font-mono text-xs font-black text-white uppercase shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const count =
            tab.value === "all" ? requests.length : (statusCounts[tab.value] ?? 0);
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 border-2 border-black px-4 py-2 font-mono text-xs font-bold uppercase transition-all ${
                isActive
                  ? "bg-black text-[#CCFF00] shadow-[3px_3px_0px_#000000] -translate-y-0.5"
                  : "bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000000]"
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center border border-current px-1.5 py-0.2 text-[10px] font-mono font-black ${
                isActive ? "bg-[#CCFF00] text-black" : "bg-neutral-100 text-black"
              }`}>
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
            className="flex flex-col items-center border-4 border-black bg-white py-16 text-center shadow-[6px_6px_0px_#000000]"
          >
            <Inbox size={44} className="text-black" />
            <p className="mt-3 font-mono text-sm font-bold uppercase text-black">
              No referral threads found in this category
            </p>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              Change status filter or check incoming requests above.
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
                className="border-3 border-black bg-white p-5 shadow-[4px_4px_0px_#000000]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#CCFF00] text-xs font-mono font-black text-black">
                    {req.requesterInitials}
                  </div>
                  <span className="font-mono text-sm font-bold text-black">{req.requesterName}</span>
                  <ArrowRight size={14} className="text-black" />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-cyan-200 text-xs font-mono font-black text-black">
                    {req.recipientInitials}
                  </div>
                  <span className="font-mono text-sm font-bold text-black">{req.recipientName}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t-2 border-black/10 pt-3">
                  <p className="text-base font-black text-black">{req.jobTitle}</p>
                  <span className="font-mono text-xs font-bold text-neutral-600">at {req.company}</span>
                </div>

                {req.message && (
                  <p className="mt-2 font-mono text-xs text-neutral-700 bg-neutral-50 border border-black/20 p-2.5">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t-2 border-black pt-3">
                  <span
                    className={`inline-flex px-2.5 py-0.5 text-xs ${statusStyles[req.status]}`}
                  >
                    {req.status}
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-500">
                    {req.createdAt}
                  </span>
                </div>

                {(req.status === "accepted" ||
                  req.status === "referred" ||
                  req.status === "hired") && (
                  <div className="mt-4 border-2 border-black p-3 bg-neutral-50">
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
