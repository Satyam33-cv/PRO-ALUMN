"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Users, Briefcase, BookOpen, Activity } from "lucide-react";

const recommendations = [
  { name: "Sarah Jenkins", initials: "SJ", role: "Product Manager", company: "Google", batch: "'19", match: 96, skills: ["Product Strategy", "Agile", "SQL"] },
  { name: "Alex Rivera", initials: "AR", role: "Full Stack Engineer", company: "Stripe", batch: "'21", match: 91, skills: ["React", "Node.js", "PostgreSQL"] },
  { name: "Meera Patel", initials: "MP", role: "ML Engineer", company: "OpenAI", batch: "'20", match: 87, skills: ["Python", "PyTorch", "Transformers"] },
];

const stats = [
  { icon: Users, value: "24", label: "Connections", color: "text-blue-600" },
  { icon: Briefcase, value: "3", label: "Active Referrals", color: "text-emerald-500" },
  { icon: BookOpen, value: "12", label: "Courses", color: "text-blue-600" },
  { icon: TrendingUp, value: "94%", label: "Match Score", color: "text-emerald-500" },
];

export function DashboardContent() {
  return (
    <>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white rounded-2xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-blue-600/20 blur-[80px]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-outfit">Welcome back, John! 👋</h1>
          <p className="text-xs text-white/60 mt-1">
            You have <span className="font-semibold text-blue-400">3 AI profile recommendations</span> ready for review today.
          </p>
        </div>
        <Link href="/directory" className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
          Explore Recommendations <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="bg-white dark:bg-onyx-100 rounded-2xl border border-primary-200/50 dark:border-white/5 p-4 shadow-card hover:shadow-cardHover transition-shadow"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-primary-200/50 dark:border-white/5 flex items-center justify-center mb-2.5">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="font-outfit text-xl font-extrabold">{stat.value}</p>
            <p className="text-[11px] text-primary-400 mt-0.5">{stat.label}</p>
          </motion.div>
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
        <div className="space-y-3">
          {recommendations.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary-200/50 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:border-blue-300 dark:hover:border-blue-800/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">{a.initials}</div>
                <div>
                  <h3 className="font-bold text-xs">{a.name}</h3>
                  <p className="text-[11px] text-primary-400">{a.role} @ {a.company} · Class of {a.batch}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    {a.skills.map((s) => (
                      <span key={s} className="text-[9px] bg-white dark:bg-white/5 border border-primary-200 dark:border-white/10 px-1.5 py-0.5 rounded-md text-primary-500 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto shrink-0">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 px-2.5 py-0.5 rounded-lg">{a.match}% Match</span>
                <Link href="/referrals" className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-900 dark:bg-white dark:text-primary-900 rounded-lg hover:bg-primary-800 dark:hover:bg-slate-100 transition-colors shadow-sm">
                  Request Referral
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-onyx-100 rounded-2xl border border-primary-200/50 dark:border-white/5 p-6 shadow-card">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[
            { text: "Priya Sharma accepted your referral request", time: "2 minutes ago", dot: "bg-emerald-500" },
            { text: "New matching alumni found in System Design", time: "1 hour ago", dot: "bg-blue-600" },
            { text: "You completed lesson 12 of React Masterclass", time: "3 hours ago", dot: "bg-blue-600" },
            { text: "Arjun Mehta viewed your profile", time: "Yesterday", dot: "bg-primary-300" },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className={`mt-1.5 w-2 h-2 rounded-full ${a.dot} shrink-0`} />
              <div>
                <p>{a.text}</p>
                <p className="text-primary-400 mt-0.5 text-[10px] font-mono">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}