"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, MessageSquare, LifeBuoy, CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { PreLoginNav } from "@/components/PreLoginNav";

const supportOptions = [
  { icon: MessageSquare, title: "Community Forum", desc: "Ask questions and share agent scripts with other developers.", color: "text-indigo-600" },
  { icon: LifeBuoy, title: "Support Ticket", desc: "Direct priority help from our engineers.", color: "text-emerald-500" },
  { icon: CheckCircle2, title: "System Status", desc: "Check live API operational status.", color: "text-blue-600" },
];

const popularArticles = [
  { title: "How do I generate a new API key?", category: "API Keys", views: 1240 },
  { title: "Setting up email notifications for referrals", category: "Notifications", views: 980 },
  { title: "Troubleshooting 403 authentication errors", category: "API Keys", views: 875 },
  { title: "How to configure AI matching parameters", category: "AI Agents", views: 720 },
  { title: "Understanding referral status lifecycle", category: "Referrals", views: 650 },
  { title: "Managing team member permissions", category: "Team", views: 540 },
];

const systemServices = [
  { name: "API Gateway", status: "operational", latency: "24ms" },
  { name: "AI Matching Engine", status: "operational", latency: "142ms" },
  { name: "Email Delivery", status: "operational", latency: "89ms" },
  { name: "FindAll Crawler", status: "degraded", latency: "340ms" },
  { name: "Authentication", status: "operational", latency: "18ms" },
  { name: "Database", status: "operational", latency: "12ms" },
];

const statusConfig = {
  operational: { color: "text-emerald-500", bg: "bg-emerald-500", label: "Operational" },
  degraded: { color: "text-amber-500", bg: "bg-amber-500", label: "Degraded" },
  outage: { color: "text-rose-500", bg: "bg-rose-500", label: "Outage" },
};

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  const [ticketSent, setTicketSent] = useState(false);

  const filtered = popularArticles.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())
  );

  function handleTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketSubject || !ticketBody) return;
    setTicketSent(true);
    setTimeout(() => setTicketSent(false), 3000);
    setTicketSubject("");
    setTicketBody("");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PreLoginNav />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How can we help you?</h1>
          <div className="relative max-w-lg mx-auto">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles, platform issues, connections..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-5">
          {supportOptions.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm text-center space-y-3 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer"
            >
              <s.icon className={`w-7 h-7 ${s.color} mx-auto`} />
              <h3 className="font-bold text-base">{s.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight">Popular Articles</h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 overflow-hidden">
            {filtered.map((a) => (
              <div key={a.title} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold group-hover:text-indigo-600 transition-colors">{a.title}</p>
                  <p className="text-[10px] text-slate-400">
                    <span className="font-medium text-indigo-500">{a.category}</span> · {a.views.toLocaleString()} views
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No articles match your search.</p>
            )}
          </div>
        </div>

        {/* Submit Ticket + System Status side-by-side */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Ticket Form */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight">Submit a Ticket</h2>
            <form onSubmit={handleTicket} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Subject</label>
                <input
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Details</label>
                <textarea
                  value={ticketBody}
                  onChange={(e) => setTicketBody(e.target.value)}
                  rows={4}
                  placeholder="Describe the problem, include steps to reproduce..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20">
                {ticketSent ? "✓ Ticket Submitted" : "Submit Ticket"}
              </button>
            </form>
          </div>

          {/* System Status */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight">System Status</h2>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-4">
              {systemServices.map((s) => {
                const cfg = statusConfig[s.status as keyof typeof statusConfig];
                return (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">{s.latency}</span>
                      <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 text-center">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}