"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Flame,
  Award,
  Trophy,
  Coins,
  Sparkles,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Zap,
  Lock,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";

export const RewardsContent = memo(function RewardsContent() {
  const [activeTab, setActiveTab] = useState<"badges" | "leaderboard" | "history">("badges");
  const [leaderboardFilter, setLeaderboardFilter] = useState<string>("all");

  const { data: statusData } = useApi("rewards:status", () =>
    apiClient.gamification.getStatus()
  );

  const { data: leaderboardData } = useApi(
    `rewards:leaderboard:${leaderboardFilter}`,
    () => apiClient.gamification.getLeaderboard(leaderboardFilter)
  );

  const currentStreak = statusData?.streak?.current || 1;
  const longestStreak = statusData?.streak?.longest || 1;
  const totalPoints = statusData?.totalPoints || 0;
  const rank = statusData?.rank || 1;
  const badges = statusData?.badges || [];
  const activities = statusData?.recentActivities || [];
  const leaderboard = leaderboardData?.leaderboard || [];

  // 7-day streak progress indicators
  const streakDays = [
    { day: "Mon", active: true, points: "+5" },
    { day: "Tue", active: currentStreak >= 2, points: "+5" },
    { day: "Wed", active: currentStreak >= 3, points: "+5" },
    { day: "Thu", active: currentStreak >= 4, points: "+5" },
    { day: "Fri", active: currentStreak >= 5, points: "+5" },
    { day: "Sat", active: currentStreak >= 6, points: "+5" },
    { day: "Sun", active: currentStreak >= 7, points: "🔥 +25", bonus: true },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ================= HERO HEADER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-400" />
              Alumni Rewards & Achievements
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
              Level Up Your Community Impact
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Earn points for active logins, mentoring students, sharing opportunities, and keeping your professional profile fresh. Unlock exclusive recognition badges and rise to the top of the leaderboard!
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 w-full lg:w-auto">
            {/* Streak Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 mb-2">
                <Flame size={22} className="fill-orange-500/30" />
              </div>
              <span className="text-2xl font-black font-heading text-orange-400">{currentStreak} Days</span>
              <span className="text-[11px] font-medium text-slate-400">Active Streak</span>
            </div>

            {/* Total Points Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 mb-2">
                <Coins size={22} />
              </div>
              <span className="text-2xl font-black font-heading text-blue-400">{totalPoints}</span>
              <span className="text-[11px] font-medium text-slate-400">Total Points</span>
            </div>

            {/* Platform Rank Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md col-span-2 sm:col-span-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-2">
                <Trophy size={22} />
              </div>
              <span className="text-2xl font-black font-heading text-amber-400">#{rank}</span>
              <span className="text-[11px] font-medium text-slate-400">Global Rank</span>
            </div>
          </div>
        </div>

        {/* ================= 7-DAY STREAK TRACKER ================= */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Calendar size={16} className="text-orange-400" />
                7-Day Login Streak Tracker
              </p>
              <p className="text-xs text-slate-400">
                Log in daily to earn +5 points. Complete 7 consecutive days for a massive +25 points reward!
              </p>
            </div>
            <div className="text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              Longest Record: <span className="font-bold text-orange-400">{longestStreak} days</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4">
            {streakDays.map((item) => (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border transition-all ${
                  item.active
                    ? "bg-orange-500/15 border-orange-500/40 text-orange-300 shadow-sm shadow-orange-500/10"
                    : "bg-white/5 border-white/5 text-slate-500"
                } ${item.bonus ? "ring-1 ring-amber-500/40" : ""}`}
              >
                <span className="text-[11px] font-semibold">{item.day}</span>
                <div className="my-1.5">
                  {item.active ? (
                    <CheckCircle2 size={18} className="text-orange-400" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-600" />
                  )}
                </div>
                <span className="text-[10px] font-mono font-bold">{item.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= NAVIGATION TABS ================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("badges")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "badges"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Award size={16} />
          Badges & Achievements
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "leaderboard"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Trophy size={16} />
          Leaderboard
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "history"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Coins size={16} />
          Points History
        </button>
      </div>

      {/* ================= TAB 1: BADGES ================= */}
      {activeTab === "badges" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">
                Collectible Badges
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Unlock badges by earning points through your contributions. Display them proudly on your alumni profile!
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Unlocked: {badges.filter((b) => b.isUnlocked).length} / {badges.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {badges.map((badge) => (
              <motion.div
                key={badge.id || badge.name}
                whileHover={{ y: -3 }}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                  badge.isUnlocked
                    ? "bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20 border-blue-200 dark:border-blue-900 shadow-sm"
                    : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-80"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div
                      className={`h-16 w-16 rounded-2xl overflow-hidden border-2 flex items-center justify-center ${
                        badge.isUnlocked
                          ? "border-amber-400 shadow-md shadow-amber-400/20 bg-amber-50"
                          : "border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 grayscale"
                      }`}
                    >
                      <Image
                        src={badge.imageUrl}
                        alt={badge.name}
                        width={64}
                        height={64}
                        className="object-cover h-full w-full"
                        unoptimized
                      />
                    </div>
                    {!badge.isUnlocked && (
                      <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 shadow-xs">
                        <Lock size={12} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {badge.name}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono shrink-0">
                        {badge.requiredPts} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {badge.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>{badge.isUnlocked ? "Unlocked 🎉" : "Progress"}</span>
                        <span>{badge.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            badge.isUnlocked ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${badge.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Ways to Earn Points */}
          <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-heading mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Ways to Earn More Points
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Flame size={20} className="text-orange-500" />
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-md">
                    +5 to +25 pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Daily Logins</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open the platform daily and keep your active streak alive.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Briefcase size={20} className="text-blue-500" />
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    +50 pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Post a Job or Internship</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share opportunities from your company on the job board.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <GraduationCap size={20} className="text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    +40 pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Mentor a Student</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accept mentorship requests and guide aspiring students.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <ShieldCheck size={20} className="text-purple-500" />
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                    +30 to +50 pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Keep Profile Fresh</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify your current role, new skills, and achievements.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: LEADERBOARD ================= */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">
                Top Alumni & Student Contributors
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Recognizing the most active members making an impact across the network.
              </p>
            </div>

            {/* Filter Pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {["all", "alumni", "student"].map((f) => (
                <button
                  key={f}
                  onClick={() => setLeaderboardFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    leaderboardFilter === f
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {f === "all" ? "All Members" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Podium for Top 3 */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* Rank 2 */}
              <div className="order-2 md:order-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center shadow-sm">
                <span className="text-2xl mb-2">🥈</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rank #2</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{leaderboard[1].name}</h3>
                <p className="text-xs text-slate-500">{leaderboard[1].jobTitle || leaderboard[1].department || "Member"}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-lg font-black font-heading text-blue-600 dark:text-blue-400">
                    {leaderboard[1].totalPoints} pts
                  </span>
                  <span className="text-xs text-orange-500 font-bold flex items-center">
                    🔥 {leaderboard[1].currentStreak}d
                  </span>
                </div>
              </div>

              {/* Rank 1 */}
              <div className="order-1 md:order-2 rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/10 to-white dark:to-slate-900 p-6 flex flex-col items-center text-center shadow-lg relative -mt-2">
                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md">
                  Community Champion
                </div>
                <span className="text-3xl mb-2 mt-2">👑</span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Rank #1</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">{leaderboard[0].name}</h3>
                <p className="text-xs text-slate-500">{leaderboard[0].currentCompany ? `${leaderboard[0].jobTitle || 'Role'} at ${leaderboard[0].currentCompany}` : leaderboard[0].department}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-2xl font-black font-heading text-amber-600 dark:text-amber-400">
                    {leaderboard[0].totalPoints} pts
                  </span>
                  <span className="text-xs text-orange-500 font-bold flex items-center">
                    🔥 {leaderboard[0].currentStreak}d
                  </span>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="order-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center shadow-sm">
                <span className="text-2xl mb-2">🥉</span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-600">Rank #3</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{leaderboard[2].name}</h3>
                <p className="text-xs text-slate-500">{leaderboard[2].jobTitle || leaderboard[2].department || "Member"}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-lg font-black font-heading text-blue-600 dark:text-blue-400">
                    {leaderboard[2].totalPoints} pts
                  </span>
                  <span className="text-xs text-orange-500 font-bold flex items-center">
                    🔥 {leaderboard[2].currentStreak}d
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Full List */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((member, index) => (
                <div
                  key={member.id || index}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-6 text-center font-heading font-black text-sm text-slate-400">
                      {index + 1}
                    </span>
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 shrink-0">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{member.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {member.currentCompany ? `${member.jobTitle || 'Role'} at ${member.currentCompany}` : member.department || "Member"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-flex text-xs text-orange-500 font-bold items-center gap-1">
                      <Flame size={14} />
                      {member.currentStreak}d
                    </span>
                    <span className="text-sm font-black font-heading text-blue-600 dark:text-blue-400 min-w-[70px] text-right">
                      {member.totalPoints} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ACTIVITY HISTORY ================= */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">
              Points History & Activity Log
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Detailed breakdown of all points earned on your account.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No points activities recorded yet. Start interacting with the platform to earn points!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {act.actionType.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(act.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-black font-heading text-emerald-600 dark:text-emerald-400">
                      +{act.pointsEarned} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
