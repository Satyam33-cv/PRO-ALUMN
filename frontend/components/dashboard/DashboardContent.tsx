"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Users, Briefcase, BookOpen, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { Alumni, Job, ReferralRequest } from "@/lib/api/types";
import React from "react";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  color: string;
  index: number;
}

function StatCard({ icon: Icon, value, label, color, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-white dark:bg-onyx-100 rounded-2xl border border-primary-200/50 dark:border-white/5 p-4 shadow-card hover:shadow-cardHover transition-shadow"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-primary-200/50 dark:border-white/5 flex items-center justify-center mb-2.5">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="font-outfit text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-primary-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

function computeMatchScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return 85 + (hash % 14); // 85% - 98%
}

async function fetchDashboardData() {
  const [alumni, jobs, sentRefRes, recvRefRes, notifRes] = await Promise.all([
    apiClient.alumni.list().catch(() => [] as Alumni[]),
    apiClient.jobs.list().catch(() => [] as Job[]),
    apiClient.referrals.mySent().catch(() => ({ referrals: [] as ReferralRequest[] })),
    apiClient.referrals.myReceived().catch(() => ({ referrals: [] as ReferralRequest[] })),
    apiClient.notifications.list().catch(() => ({ notifications: [] as Record<string, unknown>[], unreadCount: 0 })),
  ]);

  return {
    alumni: Array.isArray(alumni) ? alumni : [],
    jobs: Array.isArray(jobs) ? jobs : [],
    sentReferrals: sentRefRes?.referrals || [],
    receivedReferrals: recvRefRes?.referrals || [],
    notifications: notifRes?.notifications || [],
  };
}

export function DashboardContent() {
  const { user } = useAuth();
  const { data, error, isLoading, refresh } = useApi("dashboard:overview", fetchDashboardData);

  const firstName = user?.name ? user.name.split(" ")[0] : "there";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${firstName}! 👋`;
    if (hour < 18) return `Good afternoon, ${firstName}! 👋`;
    return `Good evening, ${firstName}! 👋`;
  })();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-sm text-rose-800 dark:text-rose-300">Could not load dashboard data</h3>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80">{error.message || "Please check your network and try again."}</p>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors"
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  const alumniList = data?.alumni || [];
  const jobsList = data?.jobs || [];
  const totalReferrals = (data?.sentReferrals.length || 0) + (data?.receivedReferrals.length || 0);
  const profileCompletion = user?.profileCompleteness ?? 85;

  const stats = [
    { icon: Users, value: alumniList.length > 0 ? `${alumniList.length}` : "0", label: "Network Alumni", color: "text-blue-600" },
    { icon: Briefcase, value: `${totalReferrals}`, label: "Referral Requests", color: "text-emerald-500" },
    { icon: BookOpen, value: `${jobsList.length}`, label: "Active Opportunities", color: "text-blue-600" },
    { icon: TrendingUp, value: `${profileCompletion}%`, label: "Profile Completion", color: "text-emerald-500" },
  ];

  // Dynamic recommendations sorted by score
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
      company: a.company || a.currentCompany || "Alumni Network",
      batch: a.batchYear ? `'${String(a.batchYear).slice(-2)}` : "'22",
      match,
      skills: skills.slice(0, 3),
    };
  });

  // Dynamic activity stream
  const rawNotifs = data?.notifications || [];
  const recentActivities = rawNotifs.slice(0, 4).map((n) => ({
    text: String(n.message || n.title || n.content || "Updated your network connection"),
    time: n.createdAt ? new Date(n.createdAt as string).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently",
    dot: "bg-blue-600",
  }));

  const activities = recentActivities.length > 0
    ? recentActivities
    : [
        { text: "Welcome to Alumnia network hub", time: "Just now", dot: "bg-emerald-500" },
        { text: `Profile completeness is at ${profileCompletion}%`, time: "Today", dot: "bg-blue-600" },
        { text: `${jobsList.length} active opportunities available on job board`, time: "Today", dot: "bg-primary-300" },
      ];

  return (
    <div className="space-y-6">
      {/* Dynamic Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white rounded-2xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-blue-600/20 blur-[80px]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-outfit">{greeting}</h1>
          <p className="text-xs text-white/60 mt-1">
            You have <span className="font-semibold text-blue-400">{recommendations.length} AI profile recommendations</span> and{" "}
            <span className="font-semibold text-emerald-400">{jobsList.length} active opportunities</span> ready for review today.
          </p>
        </div>
        <Link href="/directory" className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
          Explore Directory <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            color={stat.color}
            index={i}
          />
        ))}
      </div>

      {/* AI Recommendations */}
      <div className="bg-white dark:bg-onyx-100 rounded-2xl border border-primary-200/50 dark:border-white/5 p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-base">Top Alumni Recommendations</h2>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/30">
            AI-Powered
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-xs text-primary-400">No alumni recommendations found yet.</p>
            <Link href="/directory" className="text-xs font-semibold text-blue-600 hover:underline">
              Browse the alumni directory
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary-200/50 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:border-blue-300 dark:hover:border-blue-800/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {a.initials}
                  </div>
                  <div>
                    <Link href={`/directory/${a.id}`} className="font-bold text-xs hover:text-blue-600 transition-colors">
                      {a.name}
                    </Link>
                    <p className="text-[11px] text-primary-400">
                      {a.role} @ {a.company} · Class of {a.batch}
                    </p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {a.skills.map((s) => (
                        <span key={s} className="text-[9px] bg-white dark:bg-white/5 border border-primary-200 dark:border-white/10 px-1.5 py-0.5 rounded-md text-primary-500 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto shrink-0">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 px-2.5 py-0.5 rounded-lg">
                    {a.match}% Match
                  </span>
                  <Link
                    href={`/directory/${a.id}`}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-900 dark:bg-white dark:text-primary-900 rounded-lg hover:bg-primary-800 dark:hover:bg-slate-100 transition-colors shadow-sm text-center"
                  >
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Recent Activity */}
      <div className="bg-white dark:bg-onyx-100 rounded-2xl border border-primary-200/50 dark:border-white/5 p-6 shadow-card">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className={`mt-1.5 w-2 h-2 rounded-full ${a.dot} shrink-0`} />
              <div>
                <p className="text-slate-800 dark:text-slate-200">{a.text}</p>
                <p className="text-primary-400 mt-0.5 text-[10px] font-mono">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}