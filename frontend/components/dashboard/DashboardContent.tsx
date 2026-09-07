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
import type { Alumni, Job, EventItem, GamificationStatus } from "@/lib/api/types";

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

export function DashboardContent() {
  const { user } = useAuth();

  // State for interactive features
  const [matches, setMatches] = useState<VectorMatchItem[]>([]);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [rsvpConfirmed, setRsvpConfirmed] = useState(false);
  const [reservedCount, setReservedCount] = useState(42);
  const [syncingVector, setSyncingVector] = useState(false);
  const [syncStatus, setSyncStatus] = useState("100% SYNCHRONIZED");
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

  // Fetch real API data
  const { data: dashboardData, refresh } = useApi("member:dashboardData", async () => {
    const isStudent = user?.role === "student" || (user?.role as string) === "STUDENT";
    const [alumni, jobs, events, gamification, topAlumniRes] = await Promise.all([
      apiClient.alumni.list().catch(() => [] as Alumni[]),
      apiClient.jobs.list().catch(() => [] as Job[]),
      apiClient.events.list().catch(() => [] as EventItem[]),
      apiClient.gamification.getStatus().catch(() => null as GamificationStatus | null),
      isStudent
        ? apiClient.matching.topAlumni().catch(() => ({ student: null, alumni: [] }))
        : Promise.resolve({ student: null, alumni: [] }),
    ]);
    return {
      alumni: Array.isArray(alumni) ? alumni : [],
      jobs: Array.isArray(jobs) ? jobs : [],
      events: Array.isArray(events) ? events : [],
      gamification,
      topAlumni: (topAlumniRes?.alumni || []) as Record<string, any>[],
    };
  });

  // Sync real matches from topAlumni API or alumni list
  useEffect(() => {
    if (!dashboardData) return;

    if (dashboardData.topAlumni && dashboardData.topAlumni.length > 0) {
      const liveMatches: VectorMatchItem[] = dashboardData.topAlumni.slice(0, 5).map((m, idx) => ({
        id: m.id,
        name: m.name || "Alumnus",
        role: [m.currentCompany, m.jobTitle].filter(Boolean).join(" • ") || m.department || "Alumni",
        similarity: m.matchScore ? `${m.matchScore}% MATCH` : "RECOMMENDED",
        tagNum: String(idx + 1).padStart(2, "0"),
        bio: m.bio || `${m.batchYear ? `Alum '${String(m.batchYear).slice(-2)} • ` : ""}${m.department || "Alumni Network"}`,
        skills: Array.isArray(m.sharedSkills) && m.sharedSkills.length > 0
          ? m.sharedSkills
          : (typeof m.skills === "string"
              ? m.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
              : ["Engineering", "Mentorship"]).slice(0, 3),
        avatar: m.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      }));
      setMatches(liveMatches);
    } else if (dashboardData.alumni && dashboardData.alumni.length > 0) {
      const fallbackMatches: VectorMatchItem[] = dashboardData.alumni.slice(0, 5).map((a, idx) => ({
        id: a.id,
        name: a.name || "Alumnus",
        role: [a.company, a.role].filter(Boolean).join(" • ") || a.department || "Alumni",
        similarity: "ALUMNI",
        tagNum: String(idx + 1).padStart(2, "0"),
        bio: a.bio || `${a.batch ? `Alum '${String(a.batch).slice(-2)} • ` : ""}${a.department || "Alumni Network"}`,
        skills: [a.department || "Engineering", a.company || "Industry", "Alumni"].filter(Boolean).slice(0, 3),
        avatar: a.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      }));
      setMatches(fallbackMatches);
    }

    if (dashboardData.events && dashboardData.events.length > 0) {
      const firstEv = dashboardData.events[0];
      setReservedCount(firstEv.attending ?? 42);
    }
  }, [dashboardData]);

  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      await apiClient.matching.syncMe().catch(() => {});
      await refresh();
    } catch (err) {
      console.error("Failed to recompute matches:", err);
    } finally {
      setIsRecomputing(false);
    }
  };

  const featuredEvent = dashboardData?.events?.[0];
  const eventCapacity = featuredEvent?.capacity || 200;
  const eventPlace = featuredEvent?.place || featuredEvent?.location || "Main Campus Hall";

  const handleToggleRsvp = async () => {
    if (!featuredEvent) return;
    try {
      if (rsvpConfirmed) {
        await apiClient.events.cancelRsvp(featuredEvent.id).catch(() => {});
        setRsvpConfirmed(false);
        setReservedCount((c) => Math.max(0, c - 1));
      } else {
        await apiClient.events.rsvp(featuredEvent.id).catch(() => {});
        setRsvpConfirmed(true);
        setReservedCount((c) => c + 1);
      }
    } catch (err) {
      console.error("RSVP action failed:", err);
    }
  };

  const handleSyncVector = async () => {
    setSyncingVector(true);
    try {
      await apiClient.matching.syncMe();
      setSyncStatus("100% SYNCHRONIZED");
      await refresh();
    } catch (err) {
      console.error("Profile sync failed:", err);
      setSyncStatus("SYNC ERROR");
    } finally {
      setSyncingVector(false);
    }
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
      <section className="bg-[#F7F4EE] dark:bg-[#12151b] border-4 border-black p-6 lg:p-8 shadow-[6px_6px_0px_#000000] relative overflow-hidden">
        {/* Architectural Watermark */}
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none select-none font-headline text-[150px] lg:text-[180px] leading-none text-[#1A1A1A] dark:text-white font-bold">
          01
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          {/* Student Profile Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative w-16 h-16 bg-white dark:bg-[#181a20] border-2 border-black shadow-[3px_3px_0px_#000000] p-0.5 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-headline text-lg font-bold">
                {userInitials}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00E676] border-2 border-black rounded-full shadow-[0_0_6px_#00E676]"
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
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#CCFF00] text-black border-2 border-black uppercase font-bold">
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
            <div className="bg-white dark:bg-[#181a20] border-2 border-black p-3.5 shadow-[4px_4px_0px_#000000] min-w-[210px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  EMBEDDING SYNC
                </span>
                <span className="font-mono text-[10px] text-[#FF5500] font-bold">
                  {syncStatus}
                </span>
              </div>
              <div className="w-full h-2 bg-[#F7F4EE] dark:bg-[#12151b] border-2 border-black overflow-hidden p-[1px]">
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
              <div className="bg-white dark:bg-[#181a20] border-2 border-black p-2.5 shadow-[3px_3px_0px_#000000] flex flex-col justify-between">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500">
                  COMMUNITY POINTS
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-headline text-lg font-bold text-[#1A1A1A] dark:text-white">
                    {dashboardData?.gamification?.totalPoints ?? 0}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">PTS</span>
                </div>
                <span className="font-mono text-[9px] text-[#1D4ED8] dark:text-blue-400 font-bold">
                  LVL {Math.max(1, Math.floor(((dashboardData?.gamification?.totalPoints || 0) / 100)) + 1)}: RANK #{dashboardData?.gamification?.rank ?? 1}
                </span>
              </div>

              <div className="bg-white dark:bg-[#181a20] border-2 border-black p-2.5 shadow-[3px_3px_0px_#000000] flex flex-col justify-between">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500">
                  ACTIVITY STREAK
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-headline text-lg font-bold text-[#FF5500]">
                    {dashboardData?.gamification?.streak?.current ?? 0}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">DAYS</span>
                </div>
                <span className="font-mono text-[9px] text-neutral-600 dark:text-neutral-400">
                  {dashboardData?.jobs?.length ?? 0} OPPORTUNITIES LIVE
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
        <div className="md:col-span-12 xl:col-span-8 bg-white dark:bg-[#181a20] border-4 border-black shadow-[6px_6px_0px_#000000] flex flex-col">
          {/* Card Frame Header */}
          <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-2 border-black flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 border-2 border-black bg-white dark:bg-[#181a20] font-bold">
                01 // TOPOLOGICAL MATCH
              </span>
              <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                AI Vector Matches (Similarity &gt; 94%)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#e5e2dc] dark:bg-[#20242c] border-2 border-black text-neutral-600 dark:text-neutral-400">
                SPACE: L2_ANGULAR
              </span>
              <button
                onClick={handleRecompute}
                className="p-1 border-2 border-black bg-white dark:bg-[#181a20] hover:bg-[#F7F4EE] dark:hover:bg-[#252932] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
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
          <div className="divide-y-2 divide-black">
            {matches.map((match) => (
              <div
                key={match.id}
                className="p-4 sm:p-5 hover:bg-[#F7F4EE]/60 dark:hover:bg-[#15181f] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="relative w-12 h-12 bg-[#F7F4EE] dark:bg-[#12151b] border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 overflow-hidden">
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
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#CCFF00] border-2 border-black text-black font-bold">
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
                          className="font-mono text-[10px] px-2 py-0.5 bg-[#EFECE4] dark:bg-[#20242c] border-2 border-black text-neutral-700 dark:text-neutral-300"
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
                      <span className="font-mono text-[10px] px-2 py-1 bg-[#e5e2dc] dark:bg-[#20242c] border-2 border-black text-neutral-500 font-bold">
                        SESSION BOOKED
                      </span>
                      <Link
                        href={`/directory?search=${encodeURIComponent(match.name)}`}
                        className="px-3 py-1.5 bg-white dark:bg-[#181a20] border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#F7F4EE] dark:hover:bg-[#252932] font-headline text-xs uppercase font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      >
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/mentorship?mentorId=${match.id}`}
                        className="px-3 py-1.5 bg-[#F7F4EE] dark:bg-[#20242c] border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#ebe8e2] dark:hover:bg-[#252932] font-headline text-xs uppercase font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      >
                        Flash 15m
                      </Link>
                      <Link
                        href={`/chat?userId=${match.id}`}
                        className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-neutral-800 dark:hover:bg-neutral-200 font-headline text-xs uppercase font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send size={12} />
                        <span>Message</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vector Footer Note */}
          <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-2.5 border-t-2 border-black flex flex-wrap items-center justify-between gap-2">
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
        {/* CELL G: POINTS WALLET & REWARDS - 4 COLS (PLACED NEXT TO HERO MATCHES) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-12 xl:col-span-4 bg-white dark:bg-[#181a20] border-4 border-black shadow-[6px_6px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border-2 border-black bg-white dark:bg-[#181a20] font-bold">
                  02
                </span>
                <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                  Community Wallet
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#e5e2dc] dark:bg-[#20242c] border-2 border-black text-neutral-600 dark:text-neutral-400 font-bold">
                RANK #{dashboardData?.gamification?.rank ?? 1}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Balance Panel */}
              <div className="flex items-center justify-between p-3.5 bg-[#F7F4EE] dark:bg-[#12151b] border-2 border-black shadow-[3px_3px_0px_#000000]">
                <div>
                  <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                    MEMBER CREDIT BALANCE
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-headline text-2xl font-bold text-[#1A1A1A] dark:text-white">
                      {dashboardData?.gamification?.totalPoints ?? 0}
                    </span>
                    <span className="font-mono text-xs text-[#FF5500] font-bold">
                      PTS
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[9px] px-2 py-0.5 bg-[#00E676] border-2 border-black text-black font-bold">
                    LVL {Math.max(1, Math.floor(((dashboardData?.gamification?.totalPoints || 0) / 100)) + 1)}
                  </span>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    {dashboardData?.gamification?.streak?.current ?? 0} Day Streak
                  </div>
                </div>
              </div>

              {/* Ledger Activity Records */}
              <div className="space-y-1.5">
                <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  Recent Activity Log
                </span>
                <div className="border-2 border-black divide-y-2 divide-black font-mono text-[10px]">
                  {(dashboardData?.gamification?.recentActivities && dashboardData.gamification.recentActivities.length > 0) ? (
                    dashboardData.gamification.recentActivities.slice(0, 3).map((act: any) => (
                      <div key={act.id} className="p-2 flex justify-between items-center bg-white dark:bg-[#181a20]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#00E676] font-bold">+{act.pointsEarned}</span>
                          <span className="text-[#1A1A1A] dark:text-white uppercase truncate max-w-[170px]">
                            {act.actionType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-neutral-400">
                          {act.createdAt ? new Date(act.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-neutral-500 bg-white dark:bg-[#181a20]">
                      No recent activities logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 pt-0">
            <button
              onClick={handleSyncVector}
              disabled={syncingVector}
              className="w-full py-2 bg-[#F7F4EE] dark:bg-[#20242c] border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#ebe8e2] font-headline text-xs font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              type="button"
            >
              <RefreshCw size={13} className={syncingVector ? "animate-spin text-[#FF5500]" : ""} />
              <span>{syncingVector ? "Syncing Profile..." : "Update Profile Vector Embedding"}</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL C: MENTORSHIP MICRO-SLOTS & LIVE COUNTDOWN - 4 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-6 xl:col-span-4 bg-white dark:bg-[#181a20] border-4 border-black shadow-[6px_6px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border-2 border-black bg-white dark:bg-[#181a20] font-bold">
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
              <div className="bg-[#F7F4EE] dark:bg-[#12151b] border-2 border-black p-4 text-center shadow-[3px_3px_0px_#000000]">
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
                  <div className="w-10 h-10 border-2 border-black bg-[#e5e2dc] shrink-0 overflow-hidden">
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
                <p className="font-sans text-xs text-neutral-600 dark:text-neutral-400 bg-[#EFECE4] dark:bg-[#15181f] p-2.5 border-2 border-black leading-relaxed">
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
              className="flex-1 py-2 bg-black text-white dark:bg-white dark:text-black border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-neutral-800 dark:hover:bg-neutral-200 font-headline text-xs font-bold uppercase text-center flex items-center justify-center gap-1.5 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            >
              <Video size={14} />
              <span>Launch G-Meet</span>
            </a>
            <Link
              href="/mentorship"
              className="px-3 py-2 bg-[#F7F4EE] dark:bg-[#20242c] border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#ebe8e2] font-headline text-xs font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center cursor-pointer"
            >
              Reschedule
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL D: CAPACITY-GATED EVENTS WIDGET - 4 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-6 xl:col-span-4 bg-white dark:bg-[#181a20] border-4 border-black shadow-[6px_6px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border-2 border-black bg-white dark:bg-[#181a20] font-bold">
                  04
                </span>
                <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                  Featured Assemblage
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase">
                RSVP OPEN
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#FF5500] font-bold">
                    {featuredEvent?.category ? `[${featuredEvent.category.toUpperCase()}]` : "[ANNUAL FLAGSHIP]"}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    • {featuredEvent?.date ? new Date(featuredEvent.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase() : "MARCH 28, 2026"}
                  </span>
                </div>
                <h3 className="font-headline text-base sm:text-lg text-[#1A1A1A] dark:text-white font-bold uppercase tracking-tight">
                  {featuredEvent?.title || "Homecoming & Tech Gala 2026"}
                </h3>
                <p className="font-sans text-xs text-neutral-600 dark:text-neutral-400">
                  {featuredEvent?.detail || featuredEvent?.description || "Exclusive gathering for verified students, fellows, and alumni leaders."}
                </p>
              </div>

              {/* Capacity Meter */}
              <div className="border-2 border-black p-3 bg-[#F7F4EE] dark:bg-[#12151b] space-y-1.5 shadow-[3px_3px_0px_#000000]">
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-[#1A1A1A] dark:text-white font-bold">
                    CAPACITY REGISTER
                  </span>
                  <span className="text-neutral-500">
                    {reservedCount} / {eventCapacity} RESERVED ({Math.round((reservedCount / eventCapacity) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-white dark:bg-[#181a20] border-2 border-black p-[1px] flex gap-[2px]">
                  <div
                    className="h-full bg-[#1A1A1A] dark:bg-white transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((reservedCount / eventCapacity) * 100))}%` }}
                  />
                  <div className="h-full bg-[#e5e2dc] dark:bg-neutral-800 flex-1" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>{eventPlace}</span>
                  <span className="text-[#FF5500] font-bold">
                    {Math.max(0, eventCapacity - reservedCount)} SEATS REMAINING
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 pt-0">
            <button
              onClick={handleToggleRsvp}
              className={`w-full py-2 border-2 border-black shadow-[3px_3px_0px_#000000] font-headline text-xs font-bold uppercase text-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5 cursor-pointer ${
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
        {/* CELL H: ACTIVE OPPORTUNITIES SPOTLIGHT - 4 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-12 xl:col-span-4 bg-white dark:bg-[#181a20] border-4 border-black shadow-[6px_6px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border-2 border-black bg-white dark:bg-[#181a20] font-bold">
                  05
                </span>
                <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                  Career Openings
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FF5500] text-white border-2 border-black font-bold">
                {dashboardData?.jobs?.length ?? 0} LIVE REQS
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {(dashboardData?.jobs || []).slice(0, 2).map((job, jIdx) => (
                <div
                  key={job.id || jIdx}
                  className="border-2 border-black p-3.5 bg-[#EFECE4] dark:bg-[#15181f] space-y-2 shadow-[3px_3px_0px_#000000]"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono text-[10px] text-neutral-500 uppercase">
                        {job.company}
                      </span>
                      <h3 className="font-headline text-sm text-[#1A1A1A] dark:text-white font-bold uppercase truncate">
                        {job.title}
                      </h3>
                      <p className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                        {job.location || "Remote"} • {job.type || "Full-time"}
                      </p>
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#CCFF00] text-black border border-black font-bold shrink-0">
                      ACTIVE
                    </span>
                  </div>
                </div>
              ))}

              {(!dashboardData?.jobs || dashboardData.jobs.length === 0) && (
                <div className="p-4 bg-[#F7F4EE] dark:bg-[#12151b] border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center font-mono text-xs text-neutral-500">
                  No open requisitions posted yet. Check back soon!
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 pt-0">
            <Link
              href="/jobs"
              className="block w-full py-2 bg-[#F7F4EE] dark:bg-[#20242c] border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#ebe8e2] font-headline text-xs font-bold uppercase text-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            >
              Explore All {dashboardData?.jobs?.length ? `${dashboardData.jobs.length} ` : ""}Opportunities →
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CELL E: NETWORK MILESTONE WIRE - 12 COLS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="md:col-span-12 xl:col-span-12 bg-white dark:bg-[#181a20] border-4 border-black shadow-[6px_6px_0px_#000000] flex flex-col">
          <div className="bg-[#F7F4EE] dark:bg-[#12151b] px-4 sm:px-6 py-3 border-b-2 border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 border-2 border-black bg-white dark:bg-[#181a20] font-bold">
                06
              </span>
              <h2 className="font-headline text-sm sm:text-base text-[#1A1A1A] dark:text-white font-bold uppercase">
                Network Milestone Wire
              </h2>
            </div>
            <Link
              href="/stories"
              className="font-headline text-xs font-bold px-3 py-1 bg-white dark:bg-[#181a20] border-2 border-black hover:bg-[#F7F4EE] dark:hover:bg-[#252932] shadow-[2px_2px_0px_#000000] uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              + Transmit Story
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black">
            {/* Story 01 */}
            <div className="p-4 sm:p-6 space-y-2.5 hover:bg-[#F7F4EE]/40 dark:hover:bg-[#15181f] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FF5500] text-white border-2 border-black font-bold uppercase">
                    VENTURE FUNDING
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    COHORT &apos;18 • 4h AGO
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpvote("story1")}
                  className={`flex items-center gap-1 px-2 py-0.5 border-2 border-black text-xs font-mono font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
                    hasUpvoted.story1
                      ? "bg-[#CCFF00] text-black"
                      : "bg-[#F7F4EE] dark:bg-[#20242c] text-[#1A1A1A] dark:text-white hover:bg-[#CCFF00] hover:text-black"
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
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#1D4ED8] text-white border-2 border-black font-bold uppercase">
                    OPEN RESEARCH
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    FACULTY CHAIR • YESTERDAY
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpvote("story2")}
                  className={`flex items-center gap-1 px-2 py-0.5 border-2 border-black text-xs font-mono font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
                    hasUpvoted.story2
                      ? "bg-[#CCFF00] text-black"
                      : "bg-[#F7F4EE] dark:bg-[#20242c] text-[#1A1A1A] dark:text-white hover:bg-[#CCFF00] hover:text-black"
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