"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LandingHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/directory?q=${encodeURIComponent(searchQuery.trim())}`);
  }
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-hidden bg-slate-50 dark:bg-onyx">
      {/* Video Background */}
      <div className="absolute top-[12vh] sm:top-[18vh] left-0 w-full h-[85vh] sm:h-[110vh] z-0 pointer-events-none">
        <video
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-70 dark:opacity-50"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260603_132049_036591b8-6e92-4760-b94c-a7ea6eef315c.mp4"
        />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 dark:from-onyx to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 dark:from-onyx to-transparent" />
      </div>

      {/* Content */}
      <div className="max-w-7xl w-full mx-auto px-8 md:px-16 lg:px-20 relative z-10 grid grid-cols-12 gap-x-8 pt-32 sm:pt-40">
        <div className="col-span-12 md:col-span-10 md:col-start-2 text-center md:text-left">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 px-4 py-1.5 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
              AI-Powered Alumni Network
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] font-outfit text-primary-900 dark:text-white"
          >
            Your career starts
            <br />
            with a{" "}
            <span className="inline-flex items-center gap-1">
              <span className="text-primary-400 dark:text-primary-500">connection</span>
              <span className="w-[42px] sm:w-[52px] lg:w-[68px] h-[18px] sm:h-[22px] lg:h-[28px] border-[2px] border-primary-900 dark:border-white rounded-full inline-flex items-center justify-center mx-1 align-middle">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              </span>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg text-primary-500 dark:text-white/50 max-w-lg mx-auto md:mx-0 leading-relaxed"
          >
            384-dimensional AI matching connects you with verified alumni who can refer you
            to your dream company. Learn, grow, and get hired.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 flex flex-wrap justify-center md:justify-start gap-3"
          >
            {[
              { icon: Zap, text: "Instant AI Matching" },
              { icon: ShieldCheck, text: "Verified Alumni" },
              { icon: Sparkles, text: "Skill Courses" },
            ].map((f) => (
              <span key={f.text} className="inline-flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-primary-200/50 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-white/60">
                <f.icon className="w-3 h-3" />
                {f.text}
              </span>
            ))}
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 max-w-md mx-auto md:mx-0"
          >
            <form
              onSubmit={handleSearch}
              className="bg-white dark:bg-white/5 rounded-xl border border-primary-200 dark:border-white/10 p-1 pl-4 flex items-center shadow-card"
            >
              <input
                type="text"
                placeholder="Search alumni by company, role, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search alumni"
                className="w-full bg-transparent text-sm text-primary-900 dark:text-white outline-none placeholder:text-primary-400"
              />
              <button type="submit" aria-label="Search" className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3"
          >
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-bold px-6 py-3 shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 transition-all">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/directory" className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-200 dark:border-white/10 text-primary-900 dark:text-white text-sm font-bold px-6 py-3 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all">
              Browse Classes
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex items-center justify-center md:justify-start gap-4"
          >
            <div className="flex -space-x-2">
              {["PS", "AM", "SR", "VP", "AS"].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-primary-900 dark:bg-white text-white dark:text-primary-900 text-[10px] font-bold flex items-center justify-center border-2 border-slate-50 dark:border-onyx">
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-primary-900 dark:text-white">1,200+ verified alumni</p>
              <p className="text-xs text-primary-400 dark:text-white/40">across 40+ companies worldwide</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edge anchors */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 z-20 hidden md:block">
        <div className="glass dark:glass text-[10px] font-mono px-3 py-1.5 rounded-full text-primary-500 dark:text-white/40">
          AI — 384d
        </div>
      </div>
      <div className="absolute bottom-6 left-8 z-20 text-xs font-mono text-primary-400 dark:text-white/30">2026</div>
      <div className="absolute bottom-6 right-8 z-20 text-xs font-mono text-primary-400 dark:text-white/30">alumni career network</div>
    </section>
  );
}