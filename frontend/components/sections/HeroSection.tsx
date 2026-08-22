"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";

const skills = ["React", "TypeScript", "System Design", "Node.js"];

const matchData = {
  name: "Priya Sharma",
  role: "Senior Software Engineer",
  company: "Google",
  batch: "2019",
  department: "Computer Science",
  match: 94,
  initials: "PS",
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#FAFBFF]">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#4F46E5]/[0.06] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#06B6D4]/[0.05] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#4F46E5]/[0.03] blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="max-w-2xl">
            {/* Pill Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#4F46E5]/10 px-4 py-1.5 text-sm font-medium text-[#4F46E5] border border-[#4F46E5]/20">
                <Sparkles className="size-4" />
                AI-Powered Referral Network
              </span>
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A] leading-[1.1]"
            >
              Turn your college network into{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] bg-clip-text text-transparent">
                  trackable career
                </span>
                <svg
                  className="absolute -bottom-1 left-0 w-full h-3 text-[#4F46E5]/20"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 8C40 2 80 2 100 6C120 10 160 10 198 4"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              opportunities
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-[#0F172A]/60 max-w-lg leading-relaxed"
            >
              Smart matching connects you with the right alumni. Verified referrals
              turn introductions into real opportunities.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/directory"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4F46E5]/25 transition-all hover:bg-[#4338CA] hover:shadow-xl hover:shadow-[#4F46E5]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
              >
                Find Your Alumni Match
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#0F172A]/15 px-6 py-3.5 text-sm font-semibold text-[#0F172A] transition-all hover:border-[#4F46E5]/40 hover:bg-[#4F46E5]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
              >
                Post an Opportunity
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex items-center gap-6 text-sm text-[#0F172A]/50"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#10B981]" />
                <span>2,400+ alumni verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#10B981]" />
                <span>340+ companies</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Floating AI Recommendation Card */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative hidden lg:block"
          >
            {/* Decorative grid pattern */}
            <div className="absolute inset-0 -m-8 bg-[linear-gradient(to_right,#4F46E510_1px,transparent_1px),linear-gradient(to_bottom,#4F46E510_1px,transparent_1px)] bg-[size:24px_24px] rounded-3xl" />

            <div
              className="relative"
            >
              {/* AI Recommendation Card */}
              <div className="rounded-2xl border border-[#0F172A]/10 bg-white/90 backdrop-blur-sm shadow-2xl shadow-[#0F172A]/8 p-6 transition-all duration-300 hover:shadow-[#4F46E5]/15 hover:border-[#4F46E5]/20">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#4F46E5]">
                    <Sparkles className="size-4" />
                    AI Alumni Recommendation
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[#10B981]/10 px-3 py-1">
                    <TrendingUp className="size-3.5 text-[#10B981]" />
                    <span className="text-xs font-bold text-[#10B981]">
                      {matchData.match}% Match
                    </span>
                  </div>
                </div>

                {/* Profile */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-lg font-bold text-white">
                      {matchData.initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-white">
                      <CheckCircle2 className="size-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-lg font-semibold text-[#0F172A]">
                        {matchData.name}
                      </h3>
                      <Shield className="size-4 text-[#4F46E5]" />
                    </div>
                    <p className="text-sm text-[#0F172A]/60 mt-0.5">
                      {matchData.role}
                    </p>
                    <p className="text-sm font-medium text-[#0F172A]/80 mt-0.5">
                      {matchData.company}
                    </p>
                    <p className="text-xs text-[#0F172A]/40 mt-1">
                      {matchData.department} · Class of {matchData.batch}
                    </p>
                  </div>
                </div>

                {/* Match Score Bar */}
                <div className="mt-5 pt-5 border-t border-[#0F172A]/5">
                  <div className="flex items-center justify-between text-xs text-[#0F172A]/50 mb-2">
                    <span>AI Compatibility Score</span>
                    <span className="font-semibold text-[#4F46E5]">{matchData.match}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0F172A]/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4]"
                      initial={{ width: 0 }}
                      animate={{ width: `${matchData.match}%` }}
                      transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="mt-5">
                  <p className="text-xs font-medium text-[#0F172A]/40 uppercase tracking-wider mb-2">
                    Matched Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-[#4F46E5]/8 px-3 py-1.5 text-xs font-medium text-[#4F46E5]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Link href="/referrals" className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4F46E5]/25 transition-all hover:bg-[#4338CA] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2">
                  Request Referral
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Floating stat badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -top-4 -right-4 rounded-xl border border-[#0F172A]/10 bg-white/90 backdrop-blur-sm shadow-lg p-3 flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5]/10">
                  <Users className="size-4 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0F172A]">2.4k+</p>
                  <p className="text-[10px] text-[#0F172A]/50">Active alumni</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute -bottom-4 -left-4 rounded-xl border border-[#0F172A]/10 bg-white/90 backdrop-blur-sm shadow-lg p-3 flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981]/10">
                  <Zap className="size-4 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0F172A]">92%</p>
                  <p className="text-[10px] text-[#0F172A]/50">Match rate</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;