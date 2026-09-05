"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  Briefcase,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Video,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  Award,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { Alumni, Job, ReferralRequest, EventItem } from "@/lib/api/types";

interface VectorMatchItem {
  id: string;
  name: string;
  role: string;
  similarity: string;
  tagNum: string;
  bio: string;
  skills: string[];
  booked?: boolean;
  avatar: string;
}

const DEFAULT_MATCHES: VectorMatchItem[] = [
  {
    id: "m-01",
    name: "Vikram Aditya",
    role: "Google Core Systems (L5)",
    similarity: "98.4% COSINE",
    tagNum: "01",
    bio: "Alum '19 • Ex-CERN • Specializing in Paxos Protocols, Distributed Storage & Kernel Bypass",
    skills: ["Go / Rust", "Distributed Locks", "gRPC RPC-v3"],
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "m-02",
    name: "Ananya Deshmukh",
    role: "Amazon AWS SDE II",
    similarity: "96.1% COSINE",
    tagNum: "02",
    bio: "Alum '21 • DynamoDB Core Engines • High-throughput asynchronous replication",
    skills: ["AWS Internals", "C++20", "EBS Optimization"],
    booked: true,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "m-03",
    name: "Siddharth Joshi",
    role: "Stripe Core Ledger Staff",
    similarity: "94.8% COSINE",
    tagNum: "03",
    bio: "Alum '17 • Real-time Payment settlement, Idempotency guarantees, Raft consensus",
    skills: ["Ledger Architecture", "Kafka Streams", "PostgreSQL"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
];

export function DashboardContent() {
  const { user } = useAuth();

  // State for interactive features
  const [matches, setMatches] = useState<VectorMatchItem[]>(DEFAULT_MATCHES);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [rsvpConfirmed, setRsvpConfirmed] = useState(false);
  const [reservedCount, setReservedCount] = useState(184);
  const [syncingVector, setSyncingVector] = useState(false);
  const [syncStatus, setSyncStatus] = useState("92% INDEXED");
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 24, seconds: 18 });
  const [upvotes, setUpvotes] = useState<Record<string, number>>({ story1: 142, story2: 89 });
  const [hasUpvoted, setHasUpvoted] = useState<Record<string, boolean>>({});

  // Countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real API data to supplement or display live statistics
  const { data: dashboardData } = useApi("member:dashboardData", async () => {
    const [alumni, jobs, referralsRes, events] = await Promise.all([
      apiClient.alumni.list().catch(() => [] as Alumni[]),
      apiClient.jobs.list().catch(() => [] as Job[]),
      apiClient.referrals.mySent().catch(() => ({ referrals: [] as ReferralRequest[] })),
      apiClient.events.list().catch(() => [] as EventItem[]),
    ]);
    return {
      alumni: Array.isArray(alumni) ? alumni : [],
      jobs: Array.isArray(jobs) ? jobs : [],
      referrals: referralsRes?.referrals || [],
      events: Array.isArray(events) ? events : [],
    };
  });

  const handleRecompute = () => {
    setIsRecomputing(true);
    setTimeout(() => {
      setIsRecomputing(false);
    }, 900);
  };

  const handleToggleRsvp = () => {
    if (rsvpConfirmed) {
      setRsvpConfirmed(false);
      setReservedCount((c) => c - 1);
    } else {
      setRsvpConfirmed(true);
      setReservedCount((c) => c + 1);
    }
  };

  const handleSyncVector = () => {
    setSyncingVector(true);
    setTimeout(() => {
      setSyncingVector(false);
      setSyncStatus("100% SYNCHRONIZED");
    }, 1200);
  };

  const handleUpvote = (key: string) => {
    if (hasUpvoted[key]) {
      setUpvotes((prev) => ({ ...prev, [key]: prev[key] - 1 }));
      setHasUpvoted((prev) => ({ ...prev, [key]: false }));
    } else {
      setUpvotes((prev) => ({ ...prev, [key]: prev[key] + 1 }));
      setHasUpvoted((prev) => ({ ...prev, [key]: true }));
    }
  };

  const userName = user?.name || "Alex Morgan";
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AM";
  const nodeId = `#${user?.id ? user.id.slice(0, 4).toUpperCase() : "7042"}-${
    userName.split(" ")[1]?.toUpperCase() || "MORGAN"
  }`;
  const cohortText = `COHORT '${
    user?.classYear ? user.classYear.slice(-2) : "26"
  } • ${user?.department || "CS & DISTRIBUTED SYSTEMS"}`;
  const roleBadge =
    user?.role === "admin"
      ? "SUPER ADMIN"
      : user?.role === "alumni"
      ? "ALUMNI SPONSOR"
      : "FELLOW TIER-IV";

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* SECTION 00: TELEMETRY & ACADEMIC DOSSIER BANNER */}
      {/* ========================================================================= */}
      <section className="bg-[#F7F4EE] dark:bg-[#12151b] border-[1.5px] border-[#1A1A1A] dark:border-neutral-800 p-6 lg:p-8 shadow-[3px_3px_0_#1A1A1A] dark:shadow-[3px_3px_0_#333] relative overflow-hidden">
        {/* Architectural Watermark */}
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none select-none font-headline text-[150px] lg:text-[180px] leading-none text-[#1A1A1A] dark:text-white font-bold">
          01
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          {/* Student Profile Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative w-16 h-16 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#ffffff] p-0.5 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-headline text-lg font-bold">
                {userInitials}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00E676] border-[1.5px] border-[#1A1A1A] rounded-full shadow-[0_0_6px_#00E676]"
                title="Node Online"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black font-bold tracking-wider">
                  NODE ID: {nodeId}
                </span>
                <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                  {cohortText}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#D9E021] text-[#1A1A1A] border border-[#1A1A1A] uppercase font-bold">
                  {roleBadge}
                </span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl text-[#1A1A1A] dark:text-white font-bold tracking-tight uppercase">
                Welcome back, {userName}
              </h1>
              <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                Vector matching runtime active. Ingress queue reports 14 new peer embeddings since your previous synchronization at 08:30 UTC.
              </p>
            </div>
          </div>

          {/* Sync Gauge & Algorithmic Health */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 xl:pt-0 border-t xl:border-t-0 border-[#D5CEBF] dark:border-neutral-800">
            {/* Vector Completeness Progress */}
            <div className="bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 p-3.5 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] min-w-[210px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  EMBEDDING SYNC
                </span>
                <span className="font-mono text-[10px] text-[#FF5500] font-bold">
                  {syncStatus}
                </span>
              </div>
              <div className="w-full h-2 bg-[#F7F4EE] dark:bg-[#12151b] border border-[#1A1A1A] dark:border-neutral-700 overflow-hidden p-[1px]">
                <div
                  className="h-full bg-[#1A1A1A] dark:bg-white transition-all duration-500"
                  style={{ width: syncStatus === "100% SYNCHRONIZED" ? "100%" : "92%" }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-neutral-500">
                <span>HNSW-COSINE</span>
                <span className="text-[#00E676] font-bold">• 384-DIM OK</span>
              </div>
            </div>

            {/* Quick Metric Pills */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 p-2.5 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] flex flex-col justify-between">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500">
                  GAMIFICATION
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-headline text-lg font-bold text-[#1A1A1A] dark:text-white">
                    450
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">PTS</span>
                </div>
                <span className="font-mono text-[9px] text-[#1D4ED8] dark:text-blue-400 font-bold">
                  LVL 4: SUPER NET
                </span>
              </div>

              <div className="bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 p-2.5 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] flex flex-col justify-between">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500">
                  PENDING REFS
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-headline text-lg font-bold text-[#FF5500]">
                    12
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">SLOTS</span>
                </div>
                <span className="font-mono text-[9px] text-neutral-600 dark:text-neutral-400">
                  SLA: 48H RESOLVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 01: THE MASTER BENTO GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* ----------------------------------------------------------------------- */}
        {/* CELL A: HERO BENTO (TOP AI VECTOR MATCHES) - 8 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-12 xl:col-span-8 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[3px_3px_0_#1A1A1A] dark:shadow-[3px_3px_0_#333] flex flex-col">
          {/* Card Frame Header */}
          <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] font-bold">
                01 // TOPOLOGICAL MATCH
              </span>
              <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                AI Vector Matches (Similarity &gt; 94%)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#e5e2dc] dark:bg-[#20242c] border border-[#1A1A1A] dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                SPACE: L2_ANGULAR
              </span>
              <button
                onClick={handleRecompute}
                className="p-1 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] hover:bg-[#F7F4EE] dark:hover:bg-[#252932] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                title="Recompute vector matches"
                type="button"
                aria-label="Recompute vector matches"
              >
                <RefreshCw
                  size={14}
                  className={`text-[#1A1A1A] dark:text-white ${
                    isRecomputing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Directory Profiles List */}
          <div className="divide-y-[1.5px] divide-[#1A1A1A] dark:divide-neutral-800">
            {matches.map((match) => (
              <div
                key={match.id}
                className="p-4 sm:p-5 hover:bg-[#F7F4EE]/60 dark:hover:bg-[#15181f] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="relative w-12 h-12 bg-[#F7F4EE] dark:bg-[#12151b] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[1px_1px_0_#1A1A1A] shrink-0 overflow-hidden">
                    <img
                      src={match.avatar}
                      alt={match.name}
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                    <span className="absolute -top-1 -right-1 bg-black text-white font-mono text-[9px] px-1 border border-black">
                      {match.tagNum}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-headline text-sm text-[#1A1A1A] dark:text-white font-bold uppercase">
                        {match.name}
                      </span>
                      <span className="font-mono text-xs text-neutral-500">
                        • {match.role}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#D9E021] border border-[#1A1A1A] text-[#1A1A1A] font-bold">
                        {match.similarity}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-xl">
                      {match.bio}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {match.skills.map((skill) => (
                        <span
                          key={skill}
                          className="font-mono text-[10px] px-2 py-0.5 bg-[#EFECE4] dark:bg-[#20242c] border border-[#1A1A1A] dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                  {match.booked ? (
                    <>
                      <span className="font-mono text-[10px] px-2 py-1 bg-[#e5e2dc] dark:bg-[#20242c] border border-[#1A1A1A] dark:border-neutral-700 text-neutral-500 font-bold">
                        SESSION BOOKED
                      </span>
                      <Link
                        href={`/directory?search=${encodeURIComponent(match.name)}`}
                        className="px-3 py-1.5 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] hover:bg-[#F7F4EE] dark:hover:bg-[#252932] font-headline text-xs uppercase font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      >
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/mentorship"
                        className="px-3 py-1.5 bg-[#F7F4EE] dark:bg-[#20242c] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] hover:bg-[#ebe8e2] dark:hover:bg-[#252932] font-headline text-xs uppercase font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      >
                        Flash 15m
                      </Link>
                      <Link
                        href="/jobs"
                        className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#ffffff] hover:bg-neutral-800 dark:hover:bg-neutral-200 font-headline text-xs uppercase font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1 cursor-pointer"
                      >
                        <span>Request Referral</span>
                        <ArrowRight size={13} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vector Footer Note */}
          <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-2.5 border-t-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-neutral-500">
              VECTOR SPACE INDEX REFRESHED: TODAY, 04:00 UTC
            </span>
            <Link
              href="/directory"
              className="font-mono text-[11px] text-[#FF5500] hover:underline flex items-center gap-1 font-bold"
            >
              <span>Explore All Network Embeddings</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL B: ACTIVE REFERRAL STATE MACHINE - 4 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-12 xl:col-span-4 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[3px_3px_0_#1A1A1A] dark:shadow-[3px_3px_0_#333] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] font-bold">
                  02
                </span>
                <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                  Referral Tracker
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FF5500] text-white border border-[#1A1A1A] font-bold">
                2 LIVE REQS
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Item 1: Google Intern */}
              <div className="border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 p-3.5 bg-[#EFECE4] dark:bg-[#15181f] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-500 uppercase">
                      APP ID: #REF-GOOG-882
                    </span>
                    <h3 className="font-headline text-sm text-[#1A1A1A] dark:text-white font-bold uppercase">
                      Sr. Infrastructure Intern
                    </h3>
                    <p className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      Google Corp • Sponsor: Vikram Aditya
                    </p>
                  </div>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#00E676] text-black border border-[#1A1A1A] font-bold">
                    DISPATCHED
                  </span>
                </div>

                {/* State Machine Step Progression */}
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
                    <div className="p-1 bg-[#1A1A1A] text-white font-bold">01 SUB</div>
                    <div className="p-1 bg-[#1A1A1A] text-white font-bold">02 SCRN</div>
                    <div className="p-1 bg-[#FF5500] text-white font-bold">03 DISP</div>
                    <div className="p-1 bg-[#F7F4EE] dark:bg-[#20242c] text-neutral-400 border border-[#1A1A1A] dark:border-neutral-700">
                      04 HIRE
                    </div>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
                    <span>Phase: Internal req submitted</span>
                    <span className="text-[#FF5500] font-bold">ETA: 48h</span>
                  </div>
                </div>
              </div>

              {/* Item 2: Meta ML Associate */}
              <div className="border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 p-3.5 bg-white dark:bg-[#181a20] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-500 uppercase">
                      APP ID: #REF-META-104
                    </span>
                    <h3 className="font-headline text-sm text-[#1A1A1A] dark:text-white font-bold uppercase">
                      ML Research Associate
                    </h3>
                    <p className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      Meta FAIR • Sponsor: Elena Vance, Ph.D.
                    </p>
                  </div>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#D9E021] text-black border border-[#1A1A1A] font-bold">
                    IN REVIEW
                  </span>
                </div>

                {/* State Machine Step Progression */}
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
                    <div className="p-1 bg-[#1A1A1A] text-white font-bold">01 SUB</div>
                    <div className="p-1 bg-[#FF5500] text-white font-bold">02 SCRN</div>
                    <div className="p-1 bg-[#F7F4EE] dark:bg-[#20242c] text-neutral-400 border border-[#1A1A1A] dark:border-neutral-700">
                      03 DISP
                    </div>
                    <div className="p-1 bg-[#F7F4EE] dark:bg-[#20242c] text-neutral-400 border border-[#1A1A1A] dark:border-neutral-700">
                      04 HIRE
                    </div>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
                    <span>Phase: Portfolio scan in review</span>
                    <span className="text-neutral-400">Awaiting nod</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 pt-0">
            <Link
              href="/jobs"
              className="block w-full py-2 bg-[#F7F4EE] dark:bg-[#20242c] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] hover:bg-[#ebe8e2] font-headline text-xs font-bold uppercase text-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            >
              + Generate New Referral Escrow
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL C: MENTORSHIP MICRO-SLOTS & LIVE COUNTDOWN - 4 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-6 xl:col-span-4 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[3px_3px_0_#1A1A1A] dark:shadow-[3px_3px_0_#333] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] font-bold">
                  03
                </span>
                <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                  Next Mentorship 1:1
                </h2>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#FF5500] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
                ACTIVE T-MINUS
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Digital Countdown Timer */}
              <div className="bg-[#F7F4EE] dark:bg-[#12151b] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 p-4 text-center shadow-[inset_1px_1px_0_#1A1A1A]">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-widest">
                  COMMENCING IN
                </span>
                <div className="font-mono text-2xl sm:text-3xl tracking-wider text-[#1A1A1A] dark:text-white my-1 font-bold">
                  {String(countdown.hours).padStart(2, "0")} :{" "}
                  {String(countdown.minutes).padStart(2, "0")} :{" "}
                  {String(countdown.seconds).padStart(2, "0")}
                </div>
                <span className="font-mono text-[10px] text-[#1D4ED8] dark:text-blue-400 font-bold uppercase">
                  SLOT: 15-MINUTE ARCHITECTURAL FLASH
                </span>
              </div>

              {/* Mentor Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-[#1A1A1A] dark:border-neutral-700 bg-[#e5e2dc] shrink-0 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80"
                      alt="Ananya Deshmukh"
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                  </div>
                  <div>
                    <h4 className="font-headline text-sm font-bold text-[#1A1A1A] dark:text-white uppercase leading-tight">
                      Ananya Deshmukh
                    </h4>
                    <p className="font-mono text-[11px] text-neutral-500">
                      AWS Systems • Topic: Systems Roadmap
                    </p>
                  </div>
                </div>
                <p className="font-sans text-xs text-neutral-600 dark:text-neutral-400 bg-[#EFECE4] dark:bg-[#15181f] p-2.5 border border-[#D5CEBF] dark:border-neutral-800 leading-relaxed">
                  &ldquo;Discussion on asynchronous state machine handlers in DynamoDB &amp; how to defend your distributed storage honors thesis.&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 pt-0 flex gap-2">
            <a
              href="https://meet.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-black text-white dark:bg-white dark:text-black border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#ffffff] hover:bg-neutral-800 dark:hover:bg-neutral-200 font-headline text-xs font-bold uppercase text-center flex items-center justify-center gap-1.5 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            >
              <Video size={14} />
              <span>Launch G-Meet</span>
            </a>
            <Link
              href="/mentorship"
              className="px-3 py-2 bg-[#F7F4EE] dark:bg-[#20242c] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] hover:bg-[#ebe8e2] font-headline text-xs font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center cursor-pointer"
            >
              Reschedule
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL D: CAPACITY-GATED EVENTS WIDGET - 4 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-6 xl:col-span-4 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[3px_3px_0_#1A1A1A] dark:shadow-[3px_3px_0_#333] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] font-bold">
                  04
                </span>
                <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                  Featured Assemblage
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#D9E021] text-black border border-[#1A1A1A] font-bold uppercase">
                RSVP CLOSING
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#FF5500] font-bold">
                    [ANNUAL FLAGSHIP]
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    • MARCH 28, 2026
                  </span>
                </div>
                <h3 className="font-headline text-base sm:text-lg text-[#1A1A1A] dark:text-white font-bold uppercase tracking-tight">
                  Homecoming &amp; Tech Gala 2026
                </h3>
                <p className="font-sans text-xs text-neutral-600 dark:text-neutral-400">
                  The Quadrangle Pavilion &amp; Autonomous Robotics Lab. Exclusive access for verified students, fellows, and alumni founders.
                </p>
              </div>

              {/* Capacity Meter */}
              <div className="border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 p-3 bg-[#F7F4EE] dark:bg-[#12151b] space-y-1.5">
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-[#1A1A1A] dark:text-white font-bold">
                    CAPACITY REGISTER
                  </span>
                  <span className="text-neutral-500">
                    {reservedCount} / 300 RESERVED ({Math.round((reservedCount / 300) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-white dark:bg-[#181a20] border border-[#1A1A1A] dark:border-neutral-700 p-[1px] flex gap-[2px]">
                  <div
                    className="h-full bg-[#1A1A1A] dark:bg-white transition-all duration-300"
                    style={{ width: `${(reservedCount / 300) * 100}%` }}
                  />
                  <div className="h-full bg-[#e5e2dc] dark:bg-neutral-800 flex-1" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>TIER 1: FULL</span>
                  <span className="text-[#FF5500] font-bold">
                    {300 - reservedCount} SEATS REMAINING
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 pt-0">
            <button
              onClick={handleToggleRsvp}
              className={`w-full py-2 border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#ffffff] font-headline text-xs font-bold uppercase text-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5 cursor-pointer ${
                rsvpConfirmed
                  ? "bg-[#00E676] text-black"
                  : "bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
              }`}
              type="button"
            >
              {rsvpConfirmed ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Seat Confirmed (Click to cancel)</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Confirm Seat Reservation (1-Click)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL G: QUICK SYSTEM UTILITY & WALLET LEDGER - 4 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-12 xl:col-span-4 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[3px_3px_0_#1A1A1A] dark:shadow-[3px_3px_0_#333] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] font-bold">
                  05
                </span>
                <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                  Ledger &amp; Vector Core
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#e5e2dc] dark:bg-[#20242c] border border-[#1A1A1A] dark:border-neutral-700 text-neutral-500">
                SYS_ID: 1536_L2
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Balance Panel */}
              <div className="flex items-center justify-between p-3.5 bg-[#F7F4EE] dark:bg-[#12151b] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333]">
                <div>
                  <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                    MEMBER CREDIT WALLET
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-headline text-2xl font-bold text-[#1A1A1A] dark:text-white">
                      120
                    </span>
                    <span className="font-mono text-xs text-[#FF5500] font-bold">
                      ALUMN-CR
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[9px] px-2 py-0.5 bg-[#00E676] border border-[#1A1A1A] text-black font-bold">
                    ESCROW GOOD
                  </span>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    Tier IV Allocation
                  </div>
                </div>
              </div>

              {/* Ledger Activity Records */}
              <div className="space-y-1.5">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  Recent Cryptographic Records
                </span>
                <div className="border border-[#1A1A1A] dark:border-neutral-700 divide-y divide-[#1A1A1A] dark:divide-neutral-700 font-mono text-[10px]">
                  <div className="p-2 flex justify-between items-center bg-white dark:bg-[#181a20]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#00E676] font-bold">+30</span>
                      <span className="text-[#1A1A1A] dark:text-white">
                        Institutional Thesis Verified
                      </span>
                    </div>
                    <span className="text-neutral-400">Today</span>
                  </div>
                  <div className="p-2 flex justify-between items-center bg-white dark:bg-[#181a20]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#FF5500] font-bold">-15</span>
                      <span className="text-[#1A1A1A] dark:text-white">
                        Mentorship Escrow Reserve
                      </span>
                    </div>
                    <span className="text-neutral-400">Yesterday</span>
                  </div>
                  <div className="p-2 flex justify-between items-center bg-white dark:bg-[#181a20]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#00E676] font-bold">+50</span>
                      <span className="text-[#1A1A1A] dark:text-white">
                        Referral Feedback Completed
                      </span>
                    </div>
                    <span className="text-neutral-400">Mar 12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 pt-0">
            <button
              onClick={handleSyncVector}
              disabled={syncingVector}
              className="w-full py-2 bg-[#F7F4EE] dark:bg-[#20242c] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] hover:bg-[#ebe8e2] font-headline text-xs font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              type="button"
            >
              <RefreshCw size={13} className={syncingVector ? "animate-spin text-[#FF5500]" : ""} />
              <span>{syncingVector ? "Re-syncing 384-Dim..." : "Re-sync 384-Dim Embedding Vector"}</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL E: NETWORK MILESTONE WIRE - 12 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-12 xl:col-span-12 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[3px_3px_0_#1A1A1A] dark:shadow-[3px_3px_0_#333] flex flex-col">
          <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] font-bold">
                06
              </span>
              <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                Network Milestone Wire
              </h2>
            </div>
            <Link
              href="/stories"
              className="font-headline text-xs font-bold px-3 py-1 bg-white dark:bg-[#181a20] border border-[#1A1A1A] dark:border-neutral-700 hover:bg-[#F7F4EE] dark:hover:bg-[#252932] shadow-[1px_1px_0_#1A1A1A] uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              + Transmit Story
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1A1A1A] dark:divide-neutral-800">
            {/* Story 01 */}
            <div className="p-4 sm:p-6 space-y-2.5 hover:bg-[#F7F4EE]/40 dark:hover:bg-[#15181f] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FF5500] text-white border border-[#1A1A1A] font-bold uppercase">
                    VENTURE FUNDING
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    COHORT &apos;18 • 4h AGO
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpvote("story1")}
                  className={`flex items-center gap-1 px-2 py-0.5 border border-[#1A1A1A] text-xs font-mono font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
                    hasUpvoted.story1
                      ? "bg-[#D9E021] text-black"
                      : "bg-[#F7F4EE] dark:bg-[#20242c] text-[#1A1A1A] dark:text-white hover:bg-[#D9E021] hover:text-black"
                  }`}
                >
                  <ArrowUp size={12} />
                  <span>{upvotes.story1}</span>
                </button>
              </div>

              <h3 className="font-headline text-base sm:text-lg text-[#1A1A1A] dark:text-white font-bold uppercase tracking-tight">
                Kinetix Robotics raises $10M Seed for Distributed Actuator Firmwares
              </h3>
              <p className="font-sans text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Founded by alumni Marcus Brody (&apos;18) and Tara Vance (&apos;20), Kinetix emerged from the campus autonomous sandbox to commercialize decentralized ROS2 controller clusters.
              </p>
              <div className="flex items-center gap-3 pt-1 font-mono text-[11px] text-neutral-500">
                <span>Backed by Sequoia &amp; Founders Fund</span>
                <span>•</span>
                <Link href="/stories" className="text-[#FF5500] hover:underline font-bold">
                  Read Deep-Dive Dispatches →
                </Link>
              </div>
            </div>

            {/* Story 02 */}
            <div className="p-4 sm:p-6 space-y-2.5 hover:bg-[#F7F4EE]/40 dark:hover:bg-[#15181f] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#1D4ED8] text-white border border-[#1A1A1A] font-bold uppercase">
                    OPEN RESEARCH
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    FACULTY CHAIR • YESTERDAY
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpvote("story2")}
                  className={`flex items-center gap-1 px-2 py-0.5 border border-[#1A1A1A] text-xs font-mono font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
                    hasUpvoted.story2
                      ? "bg-[#D9E021] text-black"
                      : "bg-[#F7F4EE] dark:bg-[#20242c] text-[#1A1A1A] dark:text-white hover:bg-[#D9E021] hover:text-black"
                  }`}
                >
                  <ArrowUp size={12} />
                  <span>{upvotes.story2}</span>
                </button>
              </div>

              <h3 className="font-headline text-base sm:text-lg text-[#1A1A1A] dark:text-white font-bold uppercase tracking-tight">
                Decentralized Byzantine Consensus in LLM Multi-Agent Clusters
              </h3>
              <p className="font-sans text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Authored by Dr. Rajesh Kulkarni in collaboration with student fellow Alex Morgan, this paper outlines fault-tolerant Raft variants for heterogeneous inference pipelines.
              </p>
              <div className="flex items-center gap-3 pt-1 font-mono text-[11px] text-neutral-500">
                <span>Published in IEEE Transactions</span>
                <span>•</span>
                <Link href="/stories" className="text-[#FF5500] hover:underline font-bold">
                  View PDF Preprint →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}