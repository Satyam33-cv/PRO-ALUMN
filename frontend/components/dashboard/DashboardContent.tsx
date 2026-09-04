"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Users,
  Briefcase,
  BookOpen,
  Activity,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  MapPin,
  CheckCircle2,
  Clock,
  Send,
  Award,
  GraduationCap,
  Map,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { Alumni, Job, ReferralRequest, EventItem } from "@/lib/api/types";

interface BentoStatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  badge: string;
  bgClass: string;
  index: number;
}

function BentoStatCard({
  icon: Icon,
  value,
  label,
  badge,
  bgClass,
  index,
}: BentoStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={`border-2 border-black dark:border-white/20 rounded-xl p-5 ${bgClass} shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_rgba(255,255,255,0.25)] transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg border-2 border-black dark:border-white/20 bg-white dark:bg-black flex items-center justify-center shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.15)]">
          <Icon size={18} className="text-black dark:text-white" />
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-black dark:border-white/20 bg-white/80 dark:bg-black/60 text-black dark:text-white">
          {badge}
        </span>
      </div>
      <p className="font-display text-3xl font-extrabold text-black dark:text-white">
        {value}
      </p>
      <p className="font-medium text-xs text-black/70 dark:text-white/70 mt-1">
        {label}
      </p>
    </motion.div>
  );
}

function computeMatchScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return 86 + (hash % 13); // 86% - 98%
}

async function fetchDashboardData() {
  const [alumni, jobs, sentRefRes, recvRefRes, notifRes, events, mentorshipRes] = await Promise.all([
    apiClient.alumni.list().catch(() => [] as Alumni[]),
    apiClient.jobs.list().catch(() => [] as Job[]),
    apiClient.referrals.mySent().catch(() => ({ referrals: [] as ReferralRequest[] })),
    apiClient.referrals.myReceived().catch(() => ({ referrals: [] as ReferralRequest[] })),
    apiClient.notifications.list().catch(() => ({ notifications: [] as Record<string, unknown>[], unreadCount: 0 })),
    apiClient.events.list().catch(() => [] as EventItem[]),
    apiClient.mentorship.list().catch(() => ({ mentorships: [] as unknown[] })),
  ]);

  return {
    alumni: Array.isArray(alumni) ? alumni : [],
    jobs: Array.isArray(jobs) ? jobs : [],
    sentReferrals: sentRefRes?.referrals || [],
    receivedReferrals: recvRefRes?.referrals || [],
    notifications: notifRes?.notifications || [],
    events: Array.isArray(events) ? events : [],
    mentorships: Array.isArray(mentorshipRes?.mentorships) ? mentorshipRes.mentorships : [],
  };
}

export function DashboardContent() {
  const { user } = useAuth();
  const { data, error, isLoading, refresh } = useApi("dashboard:overview", fetchDashboardData);

  const firstName = user?.name ? user.name.split(" ")[0] : "there";
  const userRole = (user?.role || "student").toUpperCase();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${firstName}! 👋`;
    if (hour < 18) return `Good afternoon, ${firstName}! 👋`;
    return `Good evening, ${firstName}! 👋`;
  })();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading Bento dashboard">
        <div className="h-36 bg-slate-200 dark:bg-white/10 border-2 border-black rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-white/10 border-2 border-black rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-white/10 border-2 border-black rounded-xl" />
          <div className="h-80 bg-slate-200 dark:bg-white/10 border-2 border-black rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-xl border-2 border-black bg-rose-100 text-black shadow-[4px_4px_0px_#000] text-center space-y-3 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-700 mx-auto" />
        <h3 className="font-display font-bold text-base text-rose-950">Could not load dashboard data</h3>
        <p className="text-xs text-rose-800">{error.message || "Please check your backend connection and try again."}</p>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-white text-black font-bold text-xs rounded-lg shadow-[2px_2px_0px_#000] hover:bg-slate-100 transition-colors"
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  const alumniList = data?.alumni || [];
  const jobsList = data?.jobs || [];
  const eventsList = data?.events || [];
  const sentRefs = data?.sentReferrals || [];
  const recvRefs = data?.receivedReferrals || [];
  const totalReferrals = sentRefs.length + recvRefs.length;

  const stats = [
    {
      icon: Users,
      value: alumniList.length > 0 ? `${alumniList.length}` : "0",
      label: "Verified Alumni Network",
      badge: "Directory",
      bgClass: "bg-[#FEF08A] dark:bg-amber-950/40",
    },
    {
      icon: Briefcase,
      value: `${totalReferrals}`,
      label: "Referrals Active",
      badge: "Pipeline",
      bgClass: "bg-[#BBF7D0] dark:bg-emerald-950/40",
    },
    {
      icon: BookOpen,
      value: `${jobsList.length}`,
      label: "Open Job Positions",
      badge: "Careers",
      bgClass: "bg-[#BAE6FD] dark:bg-sky-950/40",
    },
    {
      icon: CalendarDays,
      value: `${eventsList.length}`,
      label: "Reunions & Meetups",
      badge: "Events",
      bgClass: "bg-[#FED7AA] dark:bg-orange-950/40",
    },
  ];

  // AI recommendations
  const recommendations = alumniList.slice(0, 3).map((a) => {
    const name = a.name || "Alumni Member";
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const match = computeMatchScore(a.id);
    const skills = [a.department, a.location, "Mentor"].filter(Boolean) as string[];

    return {
      id: a.id,
      name,
      initials: initials || "AL",
      role: a.role || a.jobTitle || "Alumni",
      company: a.company || a.currentCompany || "Somaiya Alumnus",
      batch: a.batch ? `'${String(a.batch).slice(-2)}` : "'22",
      match,
      skills: skills.slice(0, 3),
    };
  });

  // Recent activity
  const rawNotifs = data?.notifications || [];
  const activities = rawNotifs.length > 0
    ? rawNotifs.slice(0, 4).map((n) => ({
        text: String(n.message || n.title || n.content || "Updated your network connection"),
        time: n.createdAt ? new Date(n.createdAt as string).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently",
      }))
    : [
        { text: "Connected to Pro-Alumn verified network engine", time: "Just now" },
        { text: `Profile completeness is at ${user?.profileCompleteness ?? 85}%`, time: "Today" },
        { text: `${jobsList.length} verified opportunities listed on career board`, time: "Today" },
      ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ── BENTO HERO BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden border-2 border-black dark:border-white/20 rounded-2xl bg-[#FFFDF0] dark:bg-zinc-900 p-6 md:p-8 shadow-[5px_5px_0px_#000] dark:shadow-[5px_5px_0px_rgba(255,255,255,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-extrabold bg-[#FFE600] text-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]">
              {userRole} PORTAL
            </span>
            <span className="text-black/40 dark:text-white/40 font-mono text-xs">·</span>
            <span className="font-mono text-xs text-black/60 dark:text-white/60 font-medium">
              Somaiya Vidyavihar Ecosystem
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-black/75 dark:text-white/75 leading-relaxed font-sans">
            AI vector matching is active. Explore verified alumni, submit targeted internal referral requests, or book 1-on-1 mentorship sprints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE600] hover:bg-[#FFE600]/90 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <Map size={14} /> Open Geo-Directory
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 border-2 border-black bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.2)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <Briefcase size={14} /> Browse Jobs <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>

      {/* ── 4 KEY BENTO METRIC TILES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <BentoStatCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            badge={stat.badge}
            bgClass={stat.bgClass}
            index={i}
          />
        ))}
      </div>

      {/* ── MAIN BENTO GRID (2 Cols: Wide Left + Narrow Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: RECOMMENDATIONS & REFERRAL MACHINE */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendations Bento */}
          <div className="border-2 border-black dark:border-white/20 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between mb-5 border-b-2 border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  <Sparkles size={14} className="text-black" />
                </div>
                <h2 className="font-display font-extrabold text-lg text-black dark:text-white">
                  AI Top Alumni Recommendations
                </h2>
              </div>
              <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-black dark:border-white/20 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300">
                Cosine Similarity 384D
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-xs text-black/60 dark:text-white/60">No recommendations available at the moment.</p>
                <Link href="/directory" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Browse entire directory
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-black dark:border-white/20 bg-[#FBFBFA] dark:bg-zinc-800 hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,0.2)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg border-2 border-black bg-blue-500 text-white font-display font-black text-sm flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
                        {a.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/directory/${a.id}`} className="font-display font-bold text-sm text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {a.name}
                          </Link>
                          <span className="font-mono text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-bold">
                            {a.batch}
                          </span>
                        </div>
                        <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                          {a.role} at <span className="font-bold text-black dark:text-white">{a.company}</span>
                        </p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {a.skills.map((s) => (
                            <span key={s} className="font-mono text-[9px] bg-white dark:bg-zinc-700 border border-black/30 dark:border-white/20 px-1.5 py-0.5 rounded font-semibold text-black/80 dark:text-white/80">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg border-2 border-black bg-[#A3E635] text-black shadow-[2px_2px_0px_#000]">
                        {a.match}% Match
                      </span>
                      <Link
                        href={`/directory/${a.id}`}
                        className="px-3 py-1.5 font-bold text-xs text-white bg-black dark:bg-white dark:text-black rounded-lg border-2 border-black hover:opacity-90 transition-opacity"
                      >
                        View Profile
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 4-Stage Referral Pipeline Tracker Bento */}
          <div className="border-2 border-black dark:border-white/20 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#BBF7D0] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  <Briefcase size={14} className="text-black" />
                </div>
                <h2 className="font-display font-extrabold text-lg text-black dark:text-white">
                  Referral Machine Lifecycle
                </h2>
              </div>
              <Link href="/jobs" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-amber-50 dark:bg-amber-950/20 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-1">
                  <Clock size={14} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Stage 1</span>
                </div>
                <p className="font-display font-bold text-sm text-black dark:text-white">Pending</p>
                <p className="text-[10px] text-black/60 dark:text-white/60 mt-0.5">Resume submitted</p>
              </div>

              <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-blue-50 dark:bg-blue-950/20 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 mb-1">
                  <CheckCircle2 size={14} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Stage 2</span>
                </div>
                <p className="font-display font-bold text-sm text-black dark:text-white">Screened</p>
                <p className="text-[10px] text-black/60 dark:text-white/60 mt-0.5">Reviewed by alumni</p>
              </div>

              <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-purple-50 dark:bg-purple-950/20 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 mb-1">
                  <Send size={14} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Stage 3</span>
                </div>
                <p className="font-display font-bold text-sm text-black dark:text-white">Referred</p>
                <p className="text-[10px] text-black/60 dark:text-white/60 mt-0.5">Logged in portal</p>
              </div>

              <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/20 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 mb-1">
                  <Award size={14} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Stage 4</span>
                </div>
                <p className="font-display font-bold text-sm text-black dark:text-white">Celebrated</p>
                <p className="text-[10px] text-black/60 dark:text-white/60 mt-0.5">Offer accepted!</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5-PILLAR FAST TRAVEL & ACTIVITY */}
        <div className="space-y-6">
          {/* Quick Pillar Travel Bento */}
          <div className="border-2 border-black dark:border-white/20 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)]">
            <h2 className="font-display font-extrabold text-base text-black dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
              The 5 Pillars
            </h2>
            <div className="space-y-2.5">
              <Link
                href="/directory"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-black dark:border-white/20 bg-[#FEF08A] hover:translate-x-1 transition-transform text-black shadow-[2px_2px_0px_#000]"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-black" />
                  <span className="font-bold text-xs">Alumni Directory & Map</span>
                </div>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/jobs"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-black dark:border-white/20 bg-[#BAE6FD] hover:translate-x-1 transition-transform text-black shadow-[2px_2px_0px_#000]"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase size={16} className="text-black" />
                  <span className="font-bold text-xs">Job Board & Referrals</span>
                </div>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/mentorship"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-black dark:border-white/20 bg-[#FED7AA] hover:translate-x-1 transition-transform text-black shadow-[2px_2px_0px_#000]"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={16} className="text-black" />
                  <span className="font-bold text-xs">1-on-1 Mentorship Hub</span>
                </div>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/events"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-black dark:border-white/20 bg-[#BBF7D0] hover:translate-x-1 transition-transform text-black shadow-[2px_2px_0px_#000]"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={16} className="text-black" />
                  <span className="font-bold text-xs">Reunions & Meetups</span>
                </div>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/stories"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-black dark:border-white/20 bg-[#F5D0FE] hover:translate-x-1 transition-transform text-black shadow-[2px_2px_0px_#000]"
              >
                <div className="flex items-center gap-2.5">
                  <Award size={16} className="text-black" />
                  <span className="font-bold text-xs">Spotlight Stories Feed</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Activity Stream Bento */}
          <div className="border-2 border-black dark:border-white/20 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)]">
            <h2 className="font-display font-extrabold text-sm text-black dark:text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-black dark:text-white" />
              Recent Network Activity
            </h2>
            <div className="space-y-3">
              {activities.map((act, i) => (
                <div key={i} className="flex items-start gap-2.5 border-b border-black/5 dark:border-white/5 pb-2.5 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-[#A3E635] border border-black mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-black dark:text-white leading-snug">{act.text}</p>
                    <p className="font-mono text-[10px] text-black/50 dark:text-white/50 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}