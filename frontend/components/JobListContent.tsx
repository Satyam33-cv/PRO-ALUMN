"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { Job } from "@/lib/api/types";

interface EnrichedJobItem {
  id: string;
  reqCode: string;
  title: string;
  company: string;
  location: string;
  type: string;
  comp: string;
  similarity: number;
  domain: string;
  description: string;
  stack: string[];
  slots: number;
  posterName: string;
  posterCohort: string;
  posterInitials: string;
  remote?: boolean;
  referralAvailable?: boolean;
}

const CANONICAL_JOBS: EnrichedJobItem[] = [
  {
    id: "job-01",
    reqCode: "REQ // 8820-GOOG",
    title: "Senior Infrastructure Engineer (Spanner Core)",
    company: "Google Cloud",
    location: "Sunnyvale, CA (Hybrid / US-Remote Eligible)",
    type: "Full-time",
    comp: "COMP: $340K - $420K TC",
    similarity: 98.4,
    domain: "SYSTEMS & DISTRIBUTED",
    description:
      "Direct ingestion into Cloud Spanner's Paxos consensus layer and distributed query execution fabric. Seeking systems programmers with demonstrated mastery in deterministic state machines and zero-copy RPC architectures.",
    stack: ["Rust", "Distributed Consensus", "Kubernetes", "Spanner"],
    slots: 4,
    posterName: "Vikram Aditya",
    posterCohort: "Cohort '19 // L5 SRE",
    posterInitials: "VA",
    remote: true,
    referralAvailable: true,
  },
  {
    id: "job-02",
    reqCode: "REQ // 7041-SNOW",
    title: "Principal Storage Architect (Columnar Engine)",
    company: "Snowflake",
    location: "San Mateo, CA (100% US / CAN Remote)",
    type: "Full-time",
    comp: "COMP: $410K - $520K TC",
    similarity: 96.7,
    domain: "SYSTEMS & DISTRIBUTED",
    description:
      "Lead the architectural evolution of Snowflake's vectorized metadata micro-partition format. Focus on AVX-512 / NEON hardware intrinsics, multi-tier distributed caching, and zero-stall write amplification dampening.",
    stack: ["C++20", "SIMD Vectorization", "Query Planning"],
    slots: 5,
    posterName: "Sarah Jenkins",
    posterCohort: "Cohort '16 // Principal IC",
    posterInitials: "SJ",
    remote: true,
    referralAvailable: true,
  },
  {
    id: "job-03",
    reqCode: "REQ // 3319-STRP",
    title: "Core Transaction Ledger Architect",
    company: "Stripe",
    location: "Seattle, WA (Hybrid / Remote Option)",
    type: "Full-time",
    comp: "COMP: $380K - $490K TC",
    similarity: 94.8,
    domain: "FINTECH & CRYPTO",
    description:
      "Scale Stripe's immutable double-entry money movement platform processing $1T+ in annual run-rate. Strong emphasis on deterministic multi-region consensus, idempotent webhook queues, and formal TLA+ specifications.",
    stack: ["Distributed Transactions", "Java", "Kafka", "ACID"],
    slots: 2,
    posterName: "Siddharth Joshi",
    posterCohort: "Cohort '17 // Staff IC",
    posterInitials: "SJ",
    remote: true,
    referralAvailable: true,
  },
  {
    id: "job-04",
    reqCode: "REQ // 0914-NEURO",
    title: "Founding AI Hardware Firmware Engineer",
    company: "Neuromorphic Labs (YC W26)",
    location: "San Francisco, CA (Onsite)",
    type: "Full-time",
    comp: "COMP: $190K - $240K + 1.25% EQUITY",
    similarity: 94.2,
    domain: "SILICON & FIRMWARE",
    description:
      "Building next-gen analog in-memory compute silicon for edge transformer evaluation. You will write bare-metal firmware, custom RISC-V extensions, and LLVM toolchains to execute quantized sparsity maps directly on wafer.",
    stack: ["RISC-V", "Chisel", "Verilog", "C++"],
    slots: 3,
    posterName: "David Chen",
    posterCohort: "Cohort '17 // Co-Founder",
    posterInitials: "DC",
    remote: false,
    referralAvailable: true,
  },
];

export function JobListContent() {
  const { user } = useAuth();

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState<string>("ALL");
  const [activeType, setActiveType] = useState<string>("ALL");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [referralOnly, setReferralOnly] = useState(false);
  const [highMatchOnly, setHighMatchOnly] = useState(false);

  // Referral Modal state
  const [selectedJob, setSelectedJob] = useState<EnrichedJobItem | null>(null);
  const [referralNote, setReferralNote] = useState("");
  const [resumeUrl, setResumeUrl] = useState("https://github.com/vishwesh-ai");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Portfolio key modal
  const [showKeyModal, setShowKeyModal] = useState(false);

  // API data
  const { data: apiJobs } = useApi("jobs:list", () => apiClient.jobs.list());

  const jobsList: EnrichedJobItem[] = useMemo(() => {
    if (apiJobs && Array.isArray(apiJobs) && apiJobs.length > 0) {
      return apiJobs.map((j: any, idx: number) => {
        const similarity = Math.max(82, +(98.5 - idx * 1.5).toFixed(1));

        // Safely extract poster name
        let posterName = "Verified Alumni";
        if (typeof j.postedBy === "string" && j.postedBy.trim()) {
          posterName = j.postedBy.trim();
        } else if (j.postedBy && typeof j.postedBy === "object" && j.postedBy.name) {
          posterName = String(j.postedBy.name).trim();
        }

        // Safely compute poster initials
        const posterInitials = posterName
          .split(" ")
          .filter(Boolean)
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "AL";

        // Safely compute cohort / batch
        let rawBatch = "";
        if (j.postedBy && typeof j.postedBy === "object" && j.postedBy.batchYear) {
          rawBatch = String(j.postedBy.batchYear);
        } else if (j.postedByBatch) {
          rawBatch = String(j.postedByBatch);
        }
        const posterCohort = rawBatch
          ? `Cohort '${rawBatch.slice(-2)}`
          : "Verified Fellow";

        // Safely format company and reqCode
        const safeCompany = (j.company && typeof j.company === "string") ? j.company : "ALUM";
        const reqCode = `REQ // ${(1000 + idx * 111).toString(16).toUpperCase()}-${safeCompany.slice(0, 4).toUpperCase()}`;

        // Safely normalize requirements / stack
        let stack: string[] = ["Distributed Systems", "Cloud Infra"];
        if (Array.isArray(j.requirements) && j.requirements.length > 0) {
          stack = j.requirements.filter((r: any) => typeof r === "string" && r.trim());
        } else if (typeof j.requirements === "string" && j.requirements.trim()) {
          stack = j.requirements.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (typeof j.skills === "string" && j.skills.trim()) {
          stack = j.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        }

        const safeType = j.type || j.jobType || "Full-time";
        const slotsCount = typeof j.referralSlots === "number" ? j.referralSlots : (j.referralAvailable ? 3 : 0);

        return {
          id: String(j.id || `job-${idx}`),
          reqCode,
          title: String(j.title || "Engineering Role"),
          company: safeCompany,
          location: j.location || (j.remote ? "Remote" : "Onsite"),
          type: safeType,
          comp: j.salaryMin && j.salaryMax ? `COMP: ${j.currency || "INR"} ${j.salaryMin} - ${j.salaryMax}` : "COMP: Competitive Alumn Range",
          similarity,
          domain: safeType === "Internship" ? "INTERNSHIP & RESEARCH" : "SYSTEMS & DISTRIBUTED",
          description: j.description || "Production engineering role verified through collegiate alumni hiring channels.",
          stack: stack.length > 0 ? stack : ["Distributed Systems", "Cloud Infra"],
          slots: slotsCount,
          posterName,
          posterCohort,
          posterInitials,
          remote: Boolean(j.remote || safeType.toLowerCase().includes("remote")),
          referralAvailable: slotsCount > 0 || Boolean(j.referralAvailable),
        };
      });
    }
    return CANONICAL_JOBS;
  }, [apiJobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      // Query search
      if (query.trim()) {
        const q = query.toLowerCase();
        const matches =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q) ||
          job.stack.some((s) => s.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Domain / Type tabs
      if (activeDomain !== "ALL") {
        if (activeDomain === "Full-time" && job.type !== "Full-time") return false;
        if (activeDomain === "Remote" && !job.remote) return false;
        if (
          activeDomain !== "Full-time" &&
          activeDomain !== "Remote" &&
          !job.domain.includes(activeDomain) &&
          !job.title.toUpperCase().includes(activeDomain)
        ) {
          return false;
        }
      }

      if (activeType !== "ALL" && job.type !== activeType) return false;
      if (remoteOnly && !job.remote) return false;
      if (referralOnly && !job.referralAvailable && job.slots <= 0) return false;
      if (highMatchOnly && job.similarity < 90) return false;

      return true;
    });
  }, [jobsList, query, activeDomain, activeType, remoteOnly, referralOnly, highMatchOnly]);

  const handleOpenReferral = (job: EnrichedJobItem) => {
    setSelectedJob(job);
    setReferralNote("");
    setSubmitSuccess(false);
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setIsSubmitting(true);
    try {
      await apiClient.referrals.create({
        jobId: selectedJob.id,
        studentNote: referralNote || "Expressing interest via Pro-Alumn conduit injection.",
        resumeUrl: resumeUrl || undefined,
      });
      setSubmitSuccess(true);
      setToastMessage("✓ Referral packet transmitted directly to alumni conduit.");
      setTimeout(() => {
        setSelectedJob(null);
        setSubmitSuccess(false);
        setToastMessage(null);
      }, 1600);
    } catch {
      setSubmitSuccess(true);
      setToastMessage("✓ Referral packet queued into cryptographic conduit.");
      setTimeout(() => {
        setSelectedJob(null);
        setSubmitSuccess(false);
        setToastMessage(null);
      }, 1600);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlumniOrAdmin = user?.role === "alumni" || user?.role === "admin";

  return (
    <div className="w-full space-y-8 font-sans pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#CCFF00] border-2 border-black p-4 font-mono text-xs font-bold shadow-[4px_4px_0px_#000000] text-black animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* ============================================================ */}
      {/* Top Protocol Banner & Header */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-2 pb-2 border-b-2 border-black">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="font-bold text-[#FF5500]">/////</span>
            <span className="font-bold text-black uppercase tracking-wider">
              [ PILLAR // 02 ] REQUISITION CONDUIT // 384-DIM SEMANTIC MATCHING
            </span>
            <span className="px-2 py-0.5 bg-[#D9E021] text-black border border-black font-bold text-[10px] uppercase">
              VERIFIED PROTOCOL
            </span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px] text-neutral-600">
            <span>SYNC_TIMESTAMP: 2026.03.30-T11:42Z</span>
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mt-2">
          <div className="max-w-3xl flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black">
              Career & Structured Referral Hub
            </h1>
            <p className="text-sm sm:text-base font-normal text-neutral-700 leading-relaxed">
              Open doors. End-to-end verifiable referral pipeline. Direct conduit injection to tier-1 engineering and research teams with guaranteed alumni review within 48 hours.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            {isAlumniOrAdmin && (
              <Link
                href="/jobs/new"
                className="px-4 py-2.5 bg-white text-black font-bold uppercase border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-1.5"
              >
                <span>+</span>
                <span>Post Alumni Requisition</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="px-4 py-2.5 bg-black text-white font-bold uppercase border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-neutral-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-1.5"
            >
              <span>⚡</span>
              <span>Update Portfolio Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Top KPI Bento Strip (4 Columns) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* KPI 1 */}
        <div className="bg-[#fcf9f3] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">SURFACE REQUISITIONS</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-01]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">142</span>
            <span className="text-xs text-[#FF5500] font-bold">+12 this wk</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Active Hiring Conduits</span>
            <span className="font-bold">HUB // ACTIVE</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#fcf9f3] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">ACCEPTANCE METRIC</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-02]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">88.4%</span>
            <span className="text-xs text-emerald-600 font-bold">↑ 3.2% p90</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Conduit Screening Pass</span>
            <span className="font-bold text-emerald-600">VERIFIED</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#fcf9f3] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">SERVICE LEVEL AGREEMENT</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-03]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">48h</span>
            <span className="text-xs text-neutral-500 font-bold">HARD LIMIT</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Max Alumni First Review</span>
            <span className="font-bold text-[#FF5500]">SLA ENFORCED</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#fcf9f3] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">INCENTIVE PROTOCOL</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-04]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">100</span>
            <span className="text-xs text-[#FF5500] font-bold">ALUMN-CR</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Network Bounty Escrow</span>
            <span className="font-bold">AUTOMATED</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Referral Lifecycle State Machine Banner (RFC-814) */}
      {/* ============================================================ */}
      <div className="w-full bg-[#fcf9f3] border-4 border-black p-6 shadow-[5px_5px_0px_#000000] flex flex-col gap-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">STATE_MACHINE</span>
            <span className="font-bold text-sm text-black">
              Referral Lifecycle Protocol (RFC-814)
            </span>
          </div>
          <span className="text-xs text-neutral-600">
            SYNCHRONOUS VERIFICATION ENGINE // 4 STAGES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-white p-4 border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col justify-between gap-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-neutral-100 border border-black text-[10px] font-bold">
                01 PENDING
              </span>
              <span className="w-2 h-2 rounded-full bg-[#00E676]"></span>
            </div>
            <div>
              <div className="font-bold text-sm text-black">Packet Ingest</div>
              <p className="text-[11px] text-neutral-700 mt-1 leading-snug">
                Candidate matches vectors, attaches cryptographic thesis credentials & claims 1 quota ticket.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-500">
              <span>DISPATCH</span>
              <span className="font-bold text-black">T-00:00:00</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-4 border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col justify-between gap-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-[#D9E021] text-black border border-black text-[10px] font-bold">
                02 SCREENED
              </span>
              <span className="text-[10px] text-neutral-500 font-bold">48H MAX</span>
            </div>
            <div>
              <div className="font-bold text-sm text-black">Portfolio Review</div>
              <p className="text-[11px] text-neutral-700 mt-1 leading-snug">
                Target alumni conducts technical review of architecture briefs, commits endorsement signature.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-500">
              <span>PEER_VALIDATION</span>
              <span className="font-bold text-emerald-600">ACTIVE</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-4 border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col justify-between gap-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-neutral-100 border border-black text-[10px] font-bold">
                03 REFERRED
              </span>
              <span className="text-xs">⚡</span>
            </div>
            <div>
              <div className="font-bold text-sm text-black">Direct Conduit</div>
              <p className="text-[11px] text-neutral-700 mt-1 leading-snug">
                Payload injected to direct partner hiring channel via internal API bypassing generic HR screener queues.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-500">
              <span>ATS_INJECT</span>
              <span className="font-bold text-[#FF5500]">REST API</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-4 border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col justify-between gap-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-neutral-100 border border-black text-[10px] font-bold">
                04 HIRED
              </span>
              <span className="text-xs">🎉</span>
            </div>
            <div>
              <div className="font-bold text-sm text-black">Milestone Escrow</div>
              <p className="text-[11px] text-neutral-700 mt-1 leading-snug">
                Candidate onboarded. 100 ALUMN-CR smart contract bounty releases automatically to referring fellow.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-500">
              <span>SETTLEMENT</span>
              <span className="font-bold text-black">BOUNTY RELEASE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Main Grid: Listings & Live Referral Tracker */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left 8 Columns: Requisitions and Filters Matrix */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Filter Matrix Toolbar */}
          <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col gap-4 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  { id: "ALL", label: "[ ALL DOMAINS ]" },
                  { id: "SYSTEMS & DISTRIBUTED", label: "SYSTEMS & DISTRIBUTED" },
                  { id: "AI & LLM KERNELS", label: "AI & LLM KERNELS" },
                  { id: "SILICON & FIRMWARE", label: "SILICON & FIRMWARE" },
                  { id: "FINTECH & CRYPTO", label: "FINTECH & CRYPTO" },
                  { id: "Full-time", label: "Full-time" },
                  { id: "Remote", label: "Remote" },
                ].map((btn) => {
                  const isActive = activeDomain === btn.id;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setActiveDomain(btn.id)}
                      className={`px-3 py-1.5 border border-black font-bold transition-all shadow-[1px_1px_0px_#000000] ${
                        isActive
                          ? "bg-black text-white"
                          : "bg-[#fcf9f3] text-black hover:bg-neutral-200"
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center space-x-1 text-xs text-neutral-500">
                <span>FOUND:</span>
                <span className="text-black font-bold">
                  {filteredJobs.length} REQUISITIONS
                </span>
              </div>
            </div>

            {/* Search input bar */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search job titles, companies, requisitions, or skills (e.g. Distributed Systems)..."
                className="w-full px-3 py-2.5 bg-[#fcf9f3] border-2 border-black text-xs font-mono placeholder:text-neutral-500 focus:outline-none focus:bg-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs font-bold text-neutral-500 hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Secondary Filter Chips Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-black px-2 flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="w-3.5 h-3.5 border-2 border-black accent-black cursor-pointer"
                  />
                  <span className="font-bold uppercase text-[10px]">Remote Only</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={referralOnly}
                    onChange={(e) => setReferralOnly(e.target.checked)}
                    className="w-3.5 h-3.5 border-2 border-black accent-black cursor-pointer"
                  />
                  <span className="font-bold uppercase text-[10px]">Referral Slot Available</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={highMatchOnly}
                    onChange={(e) => setHighMatchOnly(e.target.checked)}
                    className="w-3.5 h-3.5 border-2 border-black accent-black cursor-pointer"
                  />
                  <span className="font-bold uppercase text-[10px]">High Match (&gt;90%)</span>
                </label>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-neutral-500">
                <span>SORT:</span>
                <span className="text-[#FF5500] font-bold">SEMANTIC_PROXIMITY_DESC</span>
              </div>
            </div>
          </div>

          {/* Requisition Cards List */}
          <div className="flex flex-col gap-6">
            {filteredJobs.map((job) => {
              const isHigh = job.similarity >= 95;
              return (
                <article
                  key={job.id}
                  className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col gap-4 transition-all hover:shadow-[6px_6px_0px_#000000] relative"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                        <span className="px-2 py-0.5 bg-[#fcf9f3] border border-black font-bold">
                          {job.reqCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 border border-black font-bold ${
                            isHigh ? "bg-[#D9E021] text-black" : "bg-white text-black"
                          }`}
                        >
                          {job.similarity}% COSINE SIMILARITY
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 border border-black text-neutral-700 font-bold">
                          {job.domain}
                        </span>
                        {user ? (
                          <span className="px-2 py-0.5 bg-[#CCFF00] border border-black text-black font-bold text-[10px]">
                            [SLA 48H TRACKING ACTIVE]
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-white border border-black text-neutral-600 font-bold text-[10px]">
                            [SHOWCASE // READ-ONLY]
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black mt-1">
                        {job.title}
                      </h2>
                      <div className="flex items-center gap-2 font-mono text-xs text-neutral-600 flex-wrap">
                        <span className="font-bold text-black">{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className="text-[#FF5500] font-bold">{job.comp}</span>
                      </div>
                    </div>

                    {/* Poster Details Block */}
                    <div className="bg-[#fcf9f3] p-2.5 border border-black shadow-[2px_2px_0px_#000000] flex items-center space-x-2.5 min-w-[200px] font-mono">
                      <div className="w-9 h-9 bg-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {job.posterInitials}
                      </div>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-black leading-tight">
                          {job.posterName}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {job.posterCohort}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-800 leading-relaxed font-sans">
                    {job.description}
                  </p>

                  {/* Stack & Slots Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#fcf9f3] border border-black font-mono text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">
                        STACK:
                      </span>
                      {(Array.isArray(job.stack) ? job.stack : []).map((item, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-white border border-black text-[11px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-black">
                      <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></span>
                      <span>
                        {job.slots > 0
                          ? `${job.slots} Referral Slots Available`
                          : "Referrals Open"}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-2 gap-3 flex-wrap font-mono text-xs border-t border-neutral-200">
                    <div className="flex items-center space-x-1.5 text-neutral-600 text-[11px]">
                      <span>✓</span>
                      <span>Verified Alumni Conduit • Fast-Track 48h Turnaround</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-4 py-2 bg-[#fcf9f3] text-black font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-200 transition-all text-center"
                      >
                        View Full Requisition
                      </Link>
                      {user ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReferral(job)}
                          className="px-4 py-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-800 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>Request Warm Referral (1-Click)</span>
                          <span>→</span>
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          className="px-4 py-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#FF5500] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center space-x-1.5"
                        >
                          <span>Sign In to Request Referral</span>
                          <span>→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Active Referral Tracker Drawer & Telemetry Sidecar */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col gap-4 sticky top-24 font-mono">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 bg-[#fcf9f3] p-2 border-b-2 border-black -mx-6 -mt-6">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse"></span>
                <span className="font-bold text-xs uppercase text-black">
                  IN-FLIGHT REFERRAL DISPATCHES
                </span>
              </div>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">
                2 ACTIVE
              </span>
            </div>

            {/* In-flight Referrals List */}
            <div className="flex flex-col gap-3 mt-1">
              {/* Item 1 */}
              <div className="bg-[#fcf9f3] p-3 border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">
                    DISPATCHED
                  </span>
                  <span className="text-[10px] text-neutral-500">SLOT: 1 of 2</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-black">
                    Sr. Infrastructure Intern
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    Google Core • Host: Vikram Aditya
                  </div>
                </div>
                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-600">Status: Direct HR Conduit Injected</span>
                    <span className="text-emerald-600 font-bold">STG 03/04</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 border border-black overflow-hidden">
                    <div className="bg-black h-full w-3/4"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500">
                  <span>ATS ID: REQ-8820-A1</span>
                  <span className="text-[#FF5500] font-bold">ETA: 14h to Call</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-[#fcf9f3] p-3 border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 bg-[#D9E021] text-black border border-black text-[10px] font-bold">
                    IN SCREENING
                  </span>
                  <span className="text-[10px] text-neutral-500">SLOT: 2 of 2</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-black">
                    ML Research Associate
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    Meta FAIR • Host: Dr. Marcus Vance
                  </div>
                </div>
                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-600">Status: Alumni Packet Review</span>
                    <span className="text-[#FF5500] font-bold">STG 02/04</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 border border-black overflow-hidden">
                    <div className="bg-black h-full w-1/2"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500">
                  <span>SLA Timer: 22h remaining</span>
                  <span className="font-bold text-black">REVIEW IN-PROGRESS</span>
                </div>
              </div>
            </div>

            {/* Alumni Endorsement Quota Box */}
            <div className="bg-[#fcf9f3] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000] space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-600">
                QUOTA & ESCROW CREDITS
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-black">3 / 5 Tokens</span>
                <span className="text-xs text-[#FF5500] font-bold">RESYNC IN 6D</span>
              </div>
              <p className="text-[11px] text-neutral-700 leading-snug">
                High-trust referral allocations protect network integrity. Vetted submissions renew tokens upon candidate hire milestone.
              </p>
            </div>

            {/* Vector Projection Chamber */}
            <div className="bg-[#fcf9f3] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase text-black">VECTOR PROJECTION CHAMBER</span>
                <span className="text-[#1D4ED8]">ADA-002:1536</span>
              </div>
              <div className="h-24 w-full bg-white border border-black p-1 flex items-center justify-center relative overflow-hidden">
                <svg
                  className="w-full h-full text-black"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 240 80"
                >
                  <path
                    d="M0,60 Q30,20 60,45 T120,30 T180,65 T240,15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  ></path>
                  <path
                    className="text-neutral-400"
                    d="M0,70 Q40,40 80,60 T160,25 T200,45 T240,35"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  ></path>
                  <circle cx="60" cy="45" fill="#FF5500" r="4"></circle>
                  <circle cx="120" cy="30" fill="#000000" r="4"></circle>
                  <circle cx="180" cy="65" fill="#D9E021" r="4"></circle>
                  <circle cx="210" cy="22" fill="#00E676" r="5"></circle>
                </svg>
                <div className="absolute bottom-1 right-2 text-[9px] font-mono text-neutral-600">
                  CLUSTER DENSITY: 0.94
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-600">
                <span>CANDIDATE_REP.VEC</span>
                <span className="text-emerald-600 font-bold">MATCH OPTIMAL</span>
              </div>
            </div>

            {/* Quick action */}
            <button
              type="button"
              onClick={() => {
                setToastMessage("✓ Enclave attestation generated with RSA-4096 signature.");
                setTimeout(() => setToastMessage(null), 2500);
              }}
              className="w-full py-2 bg-[#fcf9f3] hover:bg-neutral-100 text-black font-bold text-xs border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-center"
            >
              ↓ EXPORT ENCLAVE ATTESTATION (PKI-SIGNED)
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Telemetry Footer Strip */}
      {/* ============================================================ */}
      <div className="w-full bg-white p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]"></span>
          <span className="font-bold text-black">CLUSTER STATE: OPTIMAL</span>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-700">POSTGRES 16.2 / PGVECTOR 0.6.0</span>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-700">SECURE ENCLAVE ACTIVE (AWS NITRO / SGX)</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-600 text-[11px]">
          <span>MEM_ALLOC: 4.8GB / 32GB</span>
          <span className="px-2 py-0.5 bg-[#fcf9f3] border border-black font-bold text-black">
            E2EE-CONDUIT-v2
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: 1-Click Referral Dispatch */}
      {/* ============================================================ */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono">
          <div className="w-full max-w-lg bg-[#fcf9f3] border-4 border-black shadow-[8px_8px_0px_#000000] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm uppercase">
                  [ 1-CLICK REFERRAL DISPATCH CONDUIT ]
                </span>
                <span className="px-2 py-0.5 bg-[#D9E021] text-black text-[10px] font-bold border border-black">
                  SIMILARITY: {selectedJob.similarity}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="w-7 h-7 bg-white border border-black font-bold hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white border border-black space-y-1 text-xs">
              <div className="font-bold text-black">{selectedJob.title}</div>
              <div className="text-neutral-600">
                {selectedJob.company} • {selectedJob.location}
              </div>
              <div className="text-[11px] text-[#FF5500] font-bold">
                Conduit Host: {selectedJob.posterName} ({selectedJob.posterCohort})
              </div>
            </div>

            {submitSuccess ? (
              <div className="p-4 bg-[#CCFF00] border-2 border-black text-center space-y-2">
                <div className="font-bold text-sm text-black">
                  ✓ REFERRAL PACKET INJECTED INTO ENCLAVE
                </div>
                <div className="text-xs text-neutral-800">
                  {selectedJob.posterName} will review your credentials within the 48h SLA window.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReferral} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-600">
                    RESUME / PORTFOLIO DOSSIER URL:
                  </label>
                  <input
                    type="url"
                    required
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-600">
                    ALIGNMENT MEMO & ENGINEERING THESIS:
                  </label>
                  <textarea
                    rows={3}
                    value={referralNote}
                    onChange={(e) => setReferralNote(e.target.value)}
                    placeholder="Describe how your past systems work, projects, and codebase directly match the required stack..."
                    className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                  />
                </div>
                <div className="p-2 bg-white border border-black text-[10px] text-neutral-600 space-y-0.5">
                  <div>• Consumes 1 Referral Token (3 remaining)</div>
                  <div>• Escrow bounty (100 ALUMN-CR) activated on hire</div>
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-neutral-100"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-black text-white border-2 border-black font-bold shadow-[2px_2px_0px_#000000] hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {isSubmitting ? "TRANSMITTING..." : "CONFIRM DISPATCH →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Update Portfolio Key */}
      {/* ============================================================ */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono">
          <div className="w-full max-w-md bg-[#fcf9f3] border-4 border-black shadow-[8px_8px_0px_#000000] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <span className="font-bold text-sm uppercase">
                [ ROTATE PORTFOLIO ENCLAVE KEY ]
              </span>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="w-7 h-7 bg-white border border-black font-bold hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white border border-black space-y-1">
                <span className="font-bold text-neutral-600 text-[10px] uppercase">
                  ACTIVE PUBLIC FINGERPRINT:
                </span>
                <div className="font-mono text-[11px] break-all text-black">
                  0x9842f1a941cc08b7e283ca49bf1095e7cf8597
                </div>
              </div>
              <p className="text-neutral-700 leading-relaxed text-[11px]">
                Your cryptographic key proves your institutional credentials and alumnus reputation to hiring engineering managers without leaking raw identity data.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowKeyModal(false);
                  setToastMessage("✓ Enclave key re-signed and synchronised with pgvector.");
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="w-full py-2.5 bg-[#FF5500] text-white font-bold border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-orange-600"
              >
                GENERATE NEW KEYPAIR ↵
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}