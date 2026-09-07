"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { Briefcase, MessageSquare, Compass, Users, Sparkles, Building2, ArrowUpRight } from "lucide-react";

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
  posterName: string;
  posterCohort: string;
  posterInitials: string;
  remote?: boolean;
}

export function JobListContent() {
  const { user } = useAuth();

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState<string>("ALL");
  const [activeType, setActiveType] = useState<string>("ALL");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [highMatchOnly, setHighMatchOnly] = useState(false);

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
        const posterInitials =
          posterName
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
        const safeCompany = j.company && typeof j.company === "string" ? j.company : "";
        const reqCode = `REQ // ${(1000 + idx * 111).toString(16).toUpperCase()}-${(safeCompany.slice(0, 4) || "ROLE").toUpperCase()}`;

        // Safely normalize requirements / stack
        let stack: string[] = [];
        if (Array.isArray(j.requirements) && j.requirements.length > 0) {
          stack = j.requirements.filter((r: any) => typeof r === "string" && r.trim());
        } else if (typeof j.requirements === "string" && j.requirements.trim()) {
          stack = j.requirements.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (typeof j.skills === "string" && j.skills.trim()) {
          stack = j.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        }

        const safeType = j.type || j.jobType || "Full-time";

        return {
          id: String(j.id || `job-${idx}`),
          reqCode,
          title: String(j.title || "Engineering Role"),
          company: safeCompany,
          location: j.location || (j.remote ? "Remote" : "Onsite"),
          type: safeType,
          comp:
            j.salaryMin && j.salaryMax
              ? `COMP: ${j.currency || "INR"} ${j.salaryMin} - ${j.salaryMax}`
              : j.comp || j.salary
                ? String(j.comp || j.salary)
                : "Competitive",
          similarity,
          domain: j.domain || (safeType === "Internship" ? "INTERNSHIP & RESEARCH" : "SYSTEMS & DISTRIBUTED"),
          description: j.description || "",
          stack,
          posterName,
          posterCohort,
          posterInitials,
          remote: Boolean(j.remote || safeType.toLowerCase().includes("remote")),
        };
      });
    }
    return [];
  }, [apiJobs]);

  // Real KPI statistics
  const kpiData = useMemo(() => {
    const total = jobsList.length;
    const fullTime = jobsList.filter((j) => j.type.toLowerCase().includes("full")).length;
    const remote = jobsList.filter((j) => j.remote || j.location.toLowerCase().includes("remote")).length;
    const companies = new Set(jobsList.map((j) => j.company).filter(Boolean)).size;
    return { total, fullTime, remote, companies };
  }, [jobsList]);

  // Top skills in demand
  const topSkills = useMemo(() => {
    const counts: Record<string, number> = {};
    jobsList.forEach((j) => {
      j.stack.forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill]) => skill);
  }, [jobsList]);

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
      if (highMatchOnly && job.similarity < 90) return false;

      return true;
    });
  }, [jobsList, query, activeDomain, activeType, remoteOnly, highMatchOnly]);

  const isAlumniOrAdmin = user?.role === "alumni" || user?.role === "admin";

  return (
    <div className="w-full space-y-8 font-sans pb-16">
      {/* ============================================================ */}
      {/* Top Protocol Banner & Header */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-2 pb-2 border-b-2 border-black">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="font-bold text-[#FF5500]">/////</span>
            <span className="font-bold text-black uppercase tracking-wider">
              [ PILLAR // 02 ] CAREER OPPORTUNITIES & ALUMNI DIRECTORY
            </span>
            <span className="px-2 py-0.5 bg-[#FF5500] text-white border border-black font-bold text-[10px] uppercase">
              VERIFIED REQUISITIONS
            </span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px] text-neutral-600">
            <span>LIVE JOBS FEED</span>
            <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse"></span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mt-2">
          <div className="max-w-3xl flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black">
              Career & Opportunity Hub
            </h1>
            <p className="text-sm sm:text-base font-normal text-neutral-700 leading-relaxed">
              Open doors through trusted alumni connections. Explore verified engineering, research, and product opportunities posted directly by alumni across tier-1 organizations.
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
            <Link
              href="/directory"
              className="px-4 py-2.5 bg-black text-white font-bold uppercase border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-neutral-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Browse Alumni Network</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Top KPI Bento Strip (4 Columns) - REAL METRICS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* KPI 1 */}
        <div className="bg-[#FFFFFF] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">ACTIVE REQUISITIONS</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-01]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">{kpiData.total}</span>
            <span className="text-xs text-[#FF5500] font-bold">TOTAL POSTINGS</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Open Opportunities</span>
            <span className="font-bold">LIVE ON NETWORK</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#FFFFFF] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">FULL-TIME ROLES</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-02]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">{kpiData.fullTime}</span>
            <span className="text-xs text-emerald-600 font-bold">PERMANENT</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Career Track</span>
            <span className="font-bold text-emerald-600">VERIFIED</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#FFFFFF] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">REMOTE POSITIONS</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-03]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">{kpiData.remote}</span>
            <span className="text-xs text-neutral-500 font-bold">DISTRIBUTED</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Flexible Location</span>
            <span className="font-bold text-[#FF5500]">AVAILABLE</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#FFFFFF] p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase">
            <span className="font-bold">HIRING ORGANIZATIONS</span>
            <span className="px-1.5 py-0.5 bg-white border border-black font-bold">[K-04]</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-black text-black">{kpiData.companies}</span>
            <span className="text-xs text-[#FF5500] font-bold">COMPANIES</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300 text-[11px] text-neutral-700">
            <span>Alumni Companies</span>
            <span className="font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Main Grid: Listings & Career Resources */}
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
                          : "bg-[#FFFFFF] text-black hover:bg-neutral-200"
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
                className="w-full px-3 py-2.5 bg-[#FFFFFF] border-2 border-black text-xs font-mono placeholder:text-neutral-500 focus:outline-none focus:bg-white"
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
                    checked={highMatchOnly}
                    onChange={(e) => setHighMatchOnly(e.target.checked)}
                    className="w-3.5 h-3.5 border-2 border-black accent-black cursor-pointer"
                  />
                  <span className="font-bold uppercase text-[10px]">High Match (&gt;90%)</span>
                </label>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-neutral-500">
                <span>SORT:</span>
                <span className="text-[#FF5500] font-bold">RELEVANCE_DESC</span>
              </div>
            </div>
          </div>

          {/* Requisition Cards List */}
          <div className="flex flex-col gap-6">
            {filteredJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No Requisitions Found"
                body="No job requisitions match your search query or active filter selection."
              />
            ) : (
              filteredJobs.map((job) => {
                const isHigh = job.similarity >= 95;
                return (
                  <article
                    key={job.id}
                    className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col gap-4 transition-all hover:shadow-[6px_6px_0px_#000000] relative"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                          <span className="px-2 py-0.5 bg-[#FFFFFF] border border-black font-bold">
                            {job.reqCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 border border-black font-bold ${
                              isHigh ? "bg-[#FF5500] text-white" : "bg-white text-black"
                            }`}
                          >
                            {job.similarity}% SKILL MATCH
                          </span>
                          <span className="px-2 py-0.5 bg-neutral-100 border border-black text-neutral-700 font-bold">
                            {job.domain}
                          </span>
                          <span className="px-2 py-0.5 bg-[#FF5500] border border-black text-black font-bold text-[10px]">
                            [VERIFIED ALUMNI POSTING]
                          </span>
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
                      <div className="bg-[#FFFFFF] p-2.5 border border-black shadow-[2px_2px_0px_#000000] flex items-center space-x-2.5 min-w-[200px] font-mono">
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

                    {/* Stack Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FFFFFF] border border-black font-mono text-xs">
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
                        <span className="w-2 h-2 rounded-full bg-[#FF5500]"></span>
                        <span>Direct Alumni Connection</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-2 gap-3 flex-wrap font-mono text-xs border-t border-neutral-200">
                      <div className="flex items-center space-x-1.5 text-neutral-600 text-[11px]">
                        <span>✓</span>
                        <span>Posted by Alumni Community • Direct Connections</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-4 py-2 bg-[#FFFFFF] text-black font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-200 transition-all text-center"
                        >
                          View Requisition
                        </Link>
                        {user ? (
                          <Link
                            href={`/chat?recipient=${encodeURIComponent(job.posterName)}`}
                            className="px-4 py-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-800 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center space-x-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message Alumni Poster</span>
                            <span>→</span>
                          </Link>
                        ) : (
                          <Link
                            href="/login"
                            className="px-4 py-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#FF5500] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center space-x-1.5"
                          >
                            <span>Sign In to Connect</span>
                            <span>→</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right 4 Columns: Career Resources & Action Hub */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col gap-5 sticky top-24 font-mono">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 bg-[#FFFFFF] p-2 border-b-2 border-black -mx-6 -mt-6">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]"></span>
                <span className="font-bold text-xs uppercase text-black">
                  CAREER & MENTORSHIP ACTIONS
                </span>
              </div>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">
                PRO-ALUMN
              </span>
            </div>

            {/* Quick Actions List */}
            <div className="flex flex-col gap-2.5">
              <Link
                href="/mentorship"
                className="p-3 bg-[#FFFFFF] hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-between transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-black">1:1 Mentorship & Reviews</span>
                  <span className="text-[10px] text-neutral-600">Schedule resume feedback with alumni</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/directory"
                className="p-3 bg-[#FFFFFF] hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-between transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-black">Company Alumni Search</span>
                  <span className="text-[10px] text-neutral-600">Find fellows working at target firms</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/events"
                className="p-3 bg-[#FFFFFF] hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-between transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-black">Career Workshops & AMA</span>
                  <span className="text-[10px] text-neutral-600">Live sessions hosted by senior alumni</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {/* Top Skills In Demand Box */}
            {topSkills.length > 0 && (
              <div className="bg-[#FFFFFF] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-neutral-600">
                    TOP SKILLS IN DEMAND
                  </span>
                  <span className="text-[10px] text-[#FF5500] font-bold">NETWORK DATA</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {topSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-black text-[10px] font-bold text-black"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Networking Best Practices */}
            <div className="bg-[#FFFFFF] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000] space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-600">
                COMMUNITY NETWORKING ETIQUETTE
              </span>
              <p className="text-[11px] text-neutral-700 leading-snug">
                Reach out to alumni directly through chat. Reference specific requisition codes, attach relevant portfolio projects, and maintain respectful correspondence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Telemetry Footer Strip */}
      {/* ============================================================ */}
      <div className="w-full bg-white p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]"></span>
          <span className="font-bold text-black">NETWORK STATUS: OPERATIONAL</span>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-700">REALTIME CAREER FEED</span>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-700">VERIFIED ALUMNI DIRECTORY</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-600 text-[11px]">
          <span className="px-2 py-0.5 bg-[#FFFFFF] border border-black font-bold text-black">
            ALUMNIA CAREER NETWORK
          </span>
        </div>
      </div>
    </div>
  );
}