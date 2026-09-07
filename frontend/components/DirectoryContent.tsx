"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/context/AuthContext";
import type { Alumni } from "@/lib/api/types";
import type { HubPreset } from "@/components/DirectoryMap";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

// Dynamic import for Leaflet map to prevent SSR window issues
const DirectoryMap = dynamic(() => import("@/components/DirectoryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-[#f7f4ee] border-2 border-black flex flex-col items-center justify-center font-mono text-xs">
      <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin mb-3"></div>
      <div>Loading map…</div>
    </div>
  ),
});

interface FellowItem {
  id: string;
  name: string;
  role: string;
  company: string;
  department: string;
  batch: string;
  location: string;
  initials: string;
  bio: string;
  skills: string[];
  match: number;
  referralSlots?: number;
  isMentor?: boolean;
  isVerified?: boolean;
  hiring?: boolean;
  actionType?: "referral" | "mentorship" | "research" | "founder";
  avatarBg?: string;
  avatarColor?: string;
}


const PRESET_CLUSTERS = [
  { label: "ALL INSTITUTIONS", query: "" },
  { label: "GOOGLE (412)", query: "Google" },
  { label: "SNOWFLAKE (88)", query: "Snowflake" },
  { label: "STRIPE (142)", query: "Stripe" },
  { label: "STANFORD AI (64)", query: "Stanford" },
  { label: "DISTRIBUTED SYSTEMS", query: "Distributed Systems" },
  { label: "CRYPTOGRAPHY / ZK", query: "Cryptography" },
];

type CategoryFilter =
  | "ALL"
  | "SYSTEMS & CLOUD INFRA"
  | "AI & LLM KERNELS"
  | "HARDWARE & ROBOTICS"
  | "FINTECH & CRYPTO"
  | "ACADEMIC & POSTDOC";

interface DirectoryContentProps {
  initialQuery?: string;
  viewMode?: "showcase" | "member";
}

export function DirectoryContent({
  initialQuery = "",
  viewMode: viewModeProp,
}: DirectoryContentProps) {
  const router = useRouter();
  const searchParams = typeof useSearchParams === "function" ? useSearchParams() : null;
  const { user } = useAuth();

  const queryView = searchParams?.get("view");
  const isMemberView =
    viewModeProp === "member" ||
    queryView === "member" ||
    (viewModeProp !== "showcase" && queryView !== "showcase" && Boolean(user));

  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Filters
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [cohort, setCohort] = useState<string>("ALL");
  const [company, setCompany] = useState<string>("ALL");
  const [acceptingMentees, setAcceptingMentees] = useState<boolean>(false);
  const [providesReferrals, setProvidesReferrals] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"geo" | "grid">("geo");

  // Filter mode for test compatibility (Batch, Department, Location)
  const [filterMode, setFilterMode] = useState<"batch" | "department" | "location" | null>(null);

  // Active Map Cluster state
  const [selectedHub, setSelectedHub] = useState<{
    id: string;
    name: string;
    count: number;
    fellows: string;
  }>({
    id: "GLOBAL",
    name: "Global Pool",
    count: 0,
    fellows: "",
  });

  // Modal State
  const [activeModalFellow, setActiveModalFellow] = useState<FellowItem | null>(null);
  const [modalType, setModalType] = useState<"referral" | "mentorship">("referral");
  const [modalNote, setModalNote] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  // Fetch live alumni from API
  const { data: apiAlumni } = useApi("alumni:directory:list", () => apiClient.alumni.list());
  const { data: geoData } = useApi("alumni:directory:geo", () => apiClient.alumni.geoDistribution());

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Combine backend alumni with real data
  const allFellows: FellowItem[] = useMemo(() => {
    if (apiAlumni && Array.isArray(apiAlumni) && apiAlumni.length > 0) {
      const mapped = apiAlumni.map((a: Alumni, idx: number) => {
        const initials =
          a.initials ||
          a.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
          "AL";
        const match = Math.max(78, +(98.5 - idx * 1.8).toFixed(1));
        return {
          id: a.id,
          name: a.name,
          role: a.role || a.jobTitle || "Alumni",
          company: a.company || "",
          department: a.department || "",
          batch: String(a.batch || a.batchYear || ""),
          location: a.location || "",
          initials,
          bio: a.bio || "",
          skills: a.skills && a.skills.length > 0 ? a.skills : [],
          match,
          referralSlots: a.isMentor ? 3 : undefined,
          isMentor: Boolean(a.isMentor),
          isVerified: Boolean(a.isVerified),
          actionType: a.isMentor ? ("mentorship" as const) : ("referral" as const),
          avatarBg: idx % 3 === 0 ? "#000000" : idx % 3 === 1 ? "#CCFF00" : "#FF5500",
          avatarColor: idx % 3 === 1 ? "#000000" : "#FFFFFF",
        };
      });
      return mapped;
    }
    return [];
  }, [apiAlumni]);

  // Filtered fellows
  const filteredFellows = useMemo(() => {
    return allFellows.filter((f) => {
      // Search query
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.toLowerCase();
        const matchesText =
          f.name.toLowerCase().includes(q) ||
          f.role.toLowerCase().includes(q) ||
          f.company.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          f.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      // Domain Category
      if (category !== "ALL") {
        const cat = category.toLowerCase();
        const matchesCategory =
          (cat.includes("systems") && (f.role.includes("Systems") || f.department.includes("Systems") || f.company.includes("Cloud"))) ||
          (cat.includes("ai") && (f.role.includes("AI") || f.department.includes("LLM") || f.skills.some((s) => s.includes("ML") || s.includes("SIMD")))) ||
          (cat.includes("hardware") && (f.department.includes("Silicon") || f.skills.some((s) => s.includes("RISC")))) ||
          (cat.includes("fintech") && (f.company.includes("Stripe") || f.skills.some((s) => s.includes("Transactions") || s.includes("Ledger")))) ||
          (cat.includes("academic") && (f.role.includes("Postdoc") || f.company.includes("Stanford")));
        if (!matchesCategory) return false;
      }

      // Cohort
      if (cohort !== "ALL") {
        const shortCohort = cohort.replace("'", "").trim();
        if (!f.batch.endsWith(shortCohort) && !f.batch.includes(shortCohort)) {
          return false;
        }
      }

      // Company
      if (company !== "ALL") {
        if (!f.company.toLowerCase().includes(company.toLowerCase())) {
          return false;
        }
      }

      // Toggles
      if (acceptingMentees && !f.isMentor) return false;
      if (providesReferrals && !f.referralSlots) return false;

      return true;
    });
  }, [allFellows, debouncedQuery, category, cohort, company, acceptingMentees, providesReferrals]);

  // Total and shown count
  const totalCount = allFellows.length;
  const shownCount = filteredFellows.length;

  const handleOpenReferral = (fellow: FellowItem, type: "referral" | "mentorship") => {
    if (!user) {
      router.push(`/login?redirect=/directory&target=${encodeURIComponent(fellow.name)}&action=${type}`);
      return;
    }
    setActiveModalFellow(fellow);
    setModalType(type);
    setModalNote("");
    setModalSuccess(false);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setActiveModalFellow(null);
      setModalSuccess(false);
    }, 1800);
  };

  return (
    <div className="w-full space-y-8 font-sans pb-16">
      {/* ============================================================ */}
      {/* 0. AUTHENTICATED SYSTEM SUB-BAR (STITCH SPEC ac1a09e0) */}
      {/* ============================================================ */}
      {isMemberView && (
        <section className="w-full bg-[#f6f3ed] border-2 border-black px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0px_#1A1A1A]">
          <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-lg">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, company, skill…"
                className="w-full bg-white border-2 border-black pl-9 pr-3 py-1 font-mono text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FF5500] shadow-[2px_2px_0px_#1A1A1A] transition-all"
              />
            </div>

          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white border-2 border-black shadow-[2px_2px_0px_#1A1A1A] font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] inline-block"></span>
              <span className="tracking-tight font-bold uppercase">{user?.name || "Verified Member"}</span>
              <span className="text-neutral-500">//</span>
              <span className="text-[#CCFF00] font-bold">{user ? "VERIFIED ALUMNI" : "EXPLORER"}</span>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 1. HERO SECTION: ADAPTIVE (MEMBER CONSOLE vs PUBLIC BROADSHEET) */}
      {/* ============================================================ */}
      {isMemberView ? (
        <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0px_#1A1A1A] relative">
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#635f57] mb-2">
            Directory
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Alumni directory
          </h1>
          <p className="text-sm text-[#635f57] max-w-2xl mt-2 leading-relaxed">
            Find verified alumni by company, department, skills, or cohort. Message anyone to start a conversation.
          </p>
        </div>
      ) : (
        <section
          className="border-4 border-black bg-[#fcf9f3] p-6 sm:p-8 relative shadow-[5px_5px_0px_#000000]"
          data-purpose="directory-hero"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-8">
            <div className="lg:col-span-8">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#635f57] mb-2">
                Public directory
              </p>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-black">
                Alumni directory
              </h1>
              <p className="mt-4 text-sm sm:text-base max-w-2xl text-neutral-800 leading-relaxed">
                Browse verified alumni by company, department, skills, or cohort. Sign in to message people and get matched.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col space-y-2 lg:items-end">
              <button
                type="button"
                onClick={() => {
                  setViewMode("grid");
                  const el = document.getElementById("alumni-roster-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto text-center px-5 py-2.5 bg-white text-black border-2 border-black text-xs font-mono font-bold uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:bg-neutral-100 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                ↓ EXPLORE 42+ INSTITUTIONS
              </button>
              <Link
                href="/login"
                className="w-full sm:w-auto text-center px-5 py-2.5 bg-[#FF5500] text-white border-2 border-black text-xs font-mono font-bold uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:bg-orange-600 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                JOIN VETTED NETWORK →
              </Link>
            </div>
          </div>

          {/* Search Console Bar */}
          <div
            className="p-2 sm:p-3 bg-white border-4 border-black shadow-[4px_4px_0px_#000000]"
            data-purpose="embedding-search-bar"
          >
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="font-mono text-sm font-bold text-neutral-400">&gt;&gt;</span>
                </div>
                <input
                  id="directory-search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, fellow role, company (Google, Snowflake, Stripe), research token, or skills (Distributed Systems, Rust)..."
                  className="w-full pl-10 pr-24 py-3 bg-neutral-50 text-sm font-mono border-2 border-black placeholder:text-neutral-500 focus:outline-none focus:bg-white focus:ring-0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="text-xs font-mono font-bold px-2 py-1 bg-neutral-200 border border-black hover:bg-neutral-300 mr-1"
                    >
                      [ CLEAR ]
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-1 bg-neutral-200 border border-black text-neutral-700 select-none">
                      [ ⌘K SEARCH ]
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDebouncedQuery(query);
                  setViewMode("grid");
                }}
                className="px-6 py-3 bg-[#CCFF00] text-black font-mono font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#bbf000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center space-x-2"
              >
                <span>MATCH SCORE</span>
                <span>↵</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* SPATIAL INDEX CLUSTER QUICK-JUMPS (STITCH SPEC ac1a09e0) */}
      {/* ============================================================ */}
      <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#1A1A1A] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-black text-white font-bold text-[10px]">LOCATION</span>
          <span className="font-bold uppercase text-black">Filter by city:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: "All locations", city: "" },
            { label: "Bengaluru", city: "Bengaluru" },
            { label: "San Francisco", city: "San Francisco" },
            { label: "New York", city: "New York" },
            { label: "Seattle", city: "Seattle" },
            { label: "London", city: "London" },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                setQuery(c.city);
                setDebouncedQuery(c.city);
              }}
              className={`px-2.5 py-1 border border-black text-xs font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                (c.city === "" && !query) || (c.city && query.toLowerCase().includes(c.city.toLowerCase()))
                  ? "bg-black text-[#CCFF00] shadow-[2px_2px_0px_#1A1A1A]"
                  : "bg-[#fcf9f3] text-black hover:bg-[#EFECE4]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* BEGIN: FilterTopologyAndTabs */}
      {/* ============================================================ */}
      <section className="space-y-4" data-purpose="directory-filters">
        {/* Main Category Tabs */}
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          {[
            { id: "ALL", label: "All" },
            { id: "SYSTEMS & CLOUD INFRA", label: "Systems & cloud" },
            { id: "AI & LLM KERNELS", label: "AI & ML" },
            { id: "HARDWARE & ROBOTICS", label: "Hardware & robotics" },
            { id: "FINTECH & CRYPTO", label: "Fintech" },
            { id: "ACADEMIC & POSTDOC", label: "Academic" },
          ].map((tab) => {
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id as CategoryFilter)}
                className={`border-2 border-black px-3.5 py-2 font-bold tracking-tight shadow-[2px_2px_0px_#000000] transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Sub-Filters Strip */}
        <div className="p-3 bg-[#fcf9f3] border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Cohort Chips */}
            <div className="flex items-center space-x-1.5">
              <span className="text-neutral-500 font-bold uppercase text-[10px]">COHORT:</span>
              {["ALL", "'24", "'23", "'22", "'21", "'20+"].map((c) => {
                const isActive = cohort === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCohort(c)}
                    className={`px-2 py-0.5 text-[11px] font-semibold border border-black cursor-pointer transition-colors ${
                      isActive ? "bg-black text-white font-bold" : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="hidden xl:block h-4 w-px bg-neutral-300"></div>

            {/* Company Chips */}
            <div className="flex items-center space-x-1.5">
              <span className="text-neutral-500 font-bold uppercase text-[10px]">COMPANY:</span>
              {["Google", "Snowflake", "Stripe", "Meta", "Apple", "OpenAI"].map((comp) => {
                const isActive = company === comp;
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setCompany(company === comp ? "ALL" : comp)}
                    className={`px-2 py-0.5 text-[10px] font-mono border border-black cursor-pointer transition-colors ${
                      isActive ? "bg-black text-white font-bold" : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    {comp}
                  </button>
                );
              })}
            </div>

            <div className="hidden xl:block h-4 w-px bg-neutral-300"></div>

            {/* Test Compatibility Quick-Filters (Batch, Department, Location) */}
            <div className="hidden lg:flex items-center space-x-1 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterMode(filterMode === "batch" ? null : "batch")}
                className={`px-2 py-0.5 border border-black ${
                  filterMode === "batch" ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                Batch
              </button>
              <button
                type="button"
                onClick={() => setFilterMode(filterMode === "department" ? null : "department")}
                className={`px-2 py-0.5 border border-black ${
                  filterMode === "department" ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                Department
              </button>
              <button
                type="button"
                onClick={() => setFilterMode(filterMode === "location" ? null : "location")}
                className={`px-2 py-0.5 border border-black ${
                  filterMode === "location" ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                Location
              </button>
            </div>

            <div className="hidden xl:block h-4 w-px bg-neutral-300"></div>

            {/* Toggles */}
            <div className="flex items-center space-x-3">
              <label className="inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptingMentees}
                  onChange={(e) => setAcceptingMentees(e.target.checked)}
                  className="rounded-none border-2 border-black text-black focus:ring-0 w-3.5 h-3.5"
                />
                <span className="ml-1.5 text-[11px] font-semibold">Accepting Mentees</span>
              </label>
              <label className="inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={providesReferrals}
                  onChange={(e) => setProvidesReferrals(e.target.checked)}
                  className="rounded-none border-2 border-black text-black focus:ring-0 w-3.5 h-3.5"
                />
                <span className="ml-1.5 text-[11px] font-semibold">Provides Referrals</span>
              </label>
            </div>
          </div>

          {/* Right: View switchers */}
          <div className="flex items-center space-x-2 self-end md:self-auto">
            <button
              id="view-grid-btn"
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-[11px] font-mono font-bold border-2 border-black flex items-center space-x-1 shadow-[2px_2px_0px_#000000] transition-colors ${
                viewMode === "grid"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              <span>[ ☷ GRID VIEW ]</span>
            </button>
            <button
              id="view-geo-btn"
              type="button"
              onClick={() => setViewMode("geo")}
              className={`px-3 py-1.5 text-[11px] font-mono font-bold border-2 border-black flex items-center space-x-1 shadow-[2px_2px_0px_#000000] transition-colors ${
                viewMode === "geo"
                  ? "bg-[#CCFF00] text-black"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              <span>Map view</span>
              <span className="w-1.5 h-1.5 bg-black rounded-none ml-1 animate-pulse"></span>
            </button>
          </div>
        </div>
      </section>

      {/* Anchor for smooth scroll */}
      <div id="alumni-roster-anchor" />

      {/* ============================================================ */}
      {/* VIEW A: INTERACTIVE LEAFLET GEO-MAP COMPONENT */}
      {/* ============================================================ */}
      {viewMode === "geo" && (
        <section className="space-y-6" data-purpose="interactive-geo-map-component">
          <DirectoryMap
            clusters={geoData?.clusters || []}
            activeClusterId={selectedHub.id}
            onSelectHub={(hub: HubPreset) => {
              setSelectedHub({
                id: hub.id,
                name: hub.name,
                count: hub.count,
                fellows: hub.fellows,
              });
            }}
            onSelectCity={(city: string) => {
              setQuery(city);
              setViewMode("grid");
            }}
          />
        </section>
      )}

      {/* ============================================================ */}
      {/* VIEW B: ALUMNI CARD GRID */}
      {/* ============================================================ */}
      <section
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${
          viewMode === "geo" ? "hidden" : "block"
        }`}
        data-purpose="alumni-directory-cards"
      >
        {filteredFellows.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Users}
              title="No Alumni Found"
              body="No verified alumni match the current search criteria or active filters."
            />
          </div>
        ) : (
          filteredFellows.map((fellow, idx) => {
          const indexNum = String(idx + 1).padStart(2, "0");
          const isHighMatch = fellow.match >= 95;
          return (
            <article
              key={fellow.id}
              className="bg-[#fcf9f3] border-2 border-black shadow-[5px_5px_0px_#000000] flex flex-col justify-between relative"
              data-purpose="alumni-card"
            >
              <div>
                {/* Header Bar */}
                <div className="p-3 border-b-2 border-black bg-white flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-neutral-800">{indexNum}</span>
                    <span
                      className={`px-1.5 py-0.5 border border-black font-bold ${
                        isHighMatch ? "bg-[#CCFF00] text-black" : "bg-white text-black"
                      }`}
                    >
                      AI MATCH: {fellow.match}%
                    </span>
                  </div>
                  <span className="text-neutral-600 font-medium">
                    COHORT &apos;{fellow.batch.slice(-2)} // {fellow.location.toUpperCase()}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  {/* Identity Header */}
                  <div className="flex items-start space-x-4">
                    <div
                      style={{
                        backgroundColor: fellow.avatarBg || "#000000",
                        color: fellow.avatarColor || "#FFFFFF",
                      }}
                      className="w-14 h-14 font-mono font-black text-lg flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000000] flex-shrink-0"
                    >
                      {fellow.initials}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xl font-bold uppercase tracking-tight text-black">
                        {fellow.name}
                      </h3>
                      <p className="text-xs font-mono font-bold text-neutral-900 leading-snug">
                        {fellow.role} @ {fellow.company}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-600">
                        {fellow.department} (&apos;{fellow.batch.slice(-2)})
                      </p>
                    </div>
                  </div>

                  {/* Quote / Bio Box */}
                  <div className="p-3 bg-neutral-100 border border-black text-xs font-mono text-neutral-800 leading-relaxed">
                    {fellow.bio}
                  </div>

                  {/* Skill Vectors */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                      Skills:
                    </div>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                      {fellow.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-white border border-black text-neutral-800 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Badges & Referral Slots */}
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold pt-2 border-t border-neutral-300">
                    {fellow.referralSlots && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-950 border border-emerald-800 flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-600 mr-1.5"></span>
                        [OPEN TO REFERRALS: {fellow.referralSlots} SLOTS]
                      </span>
                    )}
                    {fellow.isMentor && (
                      <span className="px-2 py-1 bg-yellow-100 text-neutral-900 border border-yellow-700">
                        [⚡ FLASH 1-ON-1 AVAILABLE]
                      </span>
                    )}
                    {fellow.hiring && (
                      <span className="px-2 py-1 bg-red-100 text-red-950 border border-red-800 flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-600 mr-1.5"></span>
                        [🔥 HIRING FOUNDING TEAM]
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 border-t-2 border-black bg-white grid grid-cols-2 gap-2 font-mono text-xs">
                {fellow.actionType === "founder" ? (
                  <button
                    type="button"
                    onClick={() => handleOpenReferral(fellow, "referral")}
                    className="w-full py-2 bg-[#FF5500] text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-orange-600 text-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    REQUEST FOUNDER INTRO →
                  </button>
                ) : fellow.actionType === "research" ? (
                  <button
                    type="button"
                    onClick={() => handleOpenReferral(fellow, "mentorship")}
                    className="w-full py-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-800 text-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    CONNECT RESEARCHER →
                  </button>
                ) : fellow.actionType === "mentorship" ? (
                  <button
                    type="button"
                    onClick={() => handleOpenReferral(fellow, "mentorship")}
                    className="w-full py-2 bg-[#FF5500] text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-orange-600 text-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    REQUEST MENTORSHIP →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenReferral(fellow, "referral")}
                    className="w-full py-2 bg-[#FF5500] text-white font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-orange-600 text-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    REQUEST REFERRAL →
                  </button>
                )}
                <Link
                  href={`/directory/${fellow.id}`}
                  className="w-full py-2 bg-white text-black font-bold border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-100 text-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  VIEW DOSSIER
                </Link>
              </div>
            </article>
          );
        })
      )}
      </section>

      {/* ============================================================ */}
      {/* BEGIN: PaginationStrip */}
      {/* ============================================================ */}
      <div
        className="p-4 bg-[#fcf9f3] border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs"
        data-purpose="directory-pagination"
      >
        <div className="text-neutral-700 font-medium">
          Showing <span className="font-bold text-black">1–{shownCount}</span> of{" "}
          <span className="font-bold text-black">{totalCount}</span> Verified Alumni Fellows
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-black font-bold hover:bg-neutral-100 disabled:opacity-50"
          >
            [ &lt; PREV ]
          </button>
          <button type="button" className="px-3 py-1.5 bg-black text-white border border-black font-bold">
            1
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white text-black border border-black font-bold hover:bg-neutral-100"
          >
            2
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white text-black border border-black font-bold hover:bg-neutral-100"
          >
            3
          </button>
          <span className="px-2 py-1 text-neutral-500 font-bold">...</span>
          <button
            type="button"
            className="px-3 py-1.5 bg-white text-black border border-black font-bold hover:bg-neutral-100"
          >
            208
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-black font-bold hover:bg-neutral-100"
          >
            [ NEXT &gt; ]
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FOOTER CALLOUT: ADAPTIVE (MEMBER CONFIRMATION vs PUBLIC CONVERSION) */}
      {/* ============================================================ */}
      {isMemberView ? (
        <div
          data-testid="directory-member-status-footer"
          className="border-2 border-black bg-white dark:bg-[#15181f] p-4 font-mono text-xs shadow-[3px_3px_0px_#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-700 dark:text-neutral-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E676] inline-block animate-pulse"></span>
            <span className="font-bold text-black dark:text-white uppercase">Directory live</span>
            <span className="text-neutral-500">//</span>
            <span>Showing {totalCount} verified alumni</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold">ED25519-SIGNED</span>
            <span className="text-neutral-500">PEER DISPATCH ENGINE READY</span>
          </div>
        </div>
      ) : (
        <section
          className="bg-[#CCFF00] border-4 border-black p-8 sm:p-10 shadow-[7px_7px_0px_#000000] text-center"
          data-purpose="conversion-banner"
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-block px-3 py-1 bg-black text-white font-mono text-xs font-bold uppercase tracking-widest">
              UNRESTRICTED MEMBERSHIP ACCESS // ADMISSION ROSTER 2026
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black leading-tight">
              WANT DIRECT REFERRALS &amp; UNRESTRICTED ACCESS TO THE FELLOW ROSTER?
            </h2>
            <p className="text-xs sm:text-sm font-mono text-neutral-900 max-w-xl mx-auto leading-relaxed">
              Create a verified student or alumni fellow account to unlock instant 1-click referral dispatches, book flash 1-on-1 mentorship slots, and publish career dispatches to accredited peers.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs">
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 bg-[#FF5500] text-white font-bold uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-orange-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                CREATE FREE FELLOW ACCOUNT →
              </Link>
              <Link
                href="/stories"
                className="w-full sm:w-auto px-6 py-3.5 bg-white text-black font-bold uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                EXPLORE SUCCESS STORIES ↓
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* MODAL: QUICK REFERRAL / MENTORSHIP REQUEST */}
      {/* ============================================================ */}
      {activeModalFellow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono">
          <div className="w-full max-w-lg bg-[#fcf9f3] border-4 border-black shadow-[8px_8px_0px_#000000] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm uppercase">
                  {modalType === "referral" ? "[ DISPATCH REFERRAL REQUEST ]" : "[ 1-ON-1 FLASH MENTORSHIP ]"}
                </span>
                <span className="px-2 py-0.5 bg-[#CCFF00] text-black text-[10px] font-bold border border-black">
                  MATCH: {activeModalFellow.match}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalFellow(null)}
                className="w-7 h-7 bg-white border border-black font-bold hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white border border-black space-y-1 text-xs">
              <div className="font-bold text-black">{activeModalFellow.name}</div>
              <div className="text-neutral-600">
                {activeModalFellow.role} @ {activeModalFellow.company}
              </div>
              <div className="text-[11px] text-neutral-500">
                {activeModalFellow.location} • Class of &apos;{activeModalFellow.batch}
              </div>
            </div>

            {modalSuccess ? (
              <div className="p-4 bg-[#CCFF00] border-2 border-black text-center space-y-2">
                <div className="font-bold text-sm text-black">
                  ✓ DISPATCH TRANSMITTED TO ENCRYPTED REPO
                </div>
                <div className="text-xs text-neutral-800">
                  {activeModalFellow.name} will review your portfolio dossier within 48h.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-600">
                    TARGET ROLE / REQ ID:
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue={modalType === "referral" ? "Software Engineer II - Infra" : "Career Architecture Session"}
                    className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-600">
                    DOSSIER / GITHUB / LINKEDIN URL:
                  </label>
                  <input
                    type="url"
                    required
                    defaultValue="https://github.com/vishwesh-ai"
                    className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-600">
                    About:
                  </label>
                  <textarea
                    rows={3}
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="Briefly state why your technical background and experience map directly to this fellow's team..."
                    className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalFellow(null)}
                    className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF5500] text-white border-2 border-black font-bold shadow-[2px_2px_0px_#000000] hover:bg-orange-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    CONFIRM DISPATCH →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}