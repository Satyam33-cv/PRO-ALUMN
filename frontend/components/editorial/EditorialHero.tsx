"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { SplitText, FadeUp } from "@/components/ui/SplitText";

export function EditorialHero() {
  const router = useRouter();

  return (
    <section className="relative bg-editorial overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A252C08_1px,transparent_1px),linear-gradient(to_bottom,#1A252C08_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Gradient orbs */}
      <div className="absolute top-20 right-[15%] w-[400px] h-[400px] rounded-full bg-editorial-green/8 blur-[120px]" />
      <div className="absolute bottom-10 left-[10%] w-[300px] h-[300px] rounded-full bg-editorial-coral/6 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <FadeUp delay={0.1}>
              <span className="inline-flex items-center gap-2 rounded-pill bg-editorial-green/10 border border-editorial-green/20 px-4 py-1.5 text-sm font-semibold text-editorial-ink">
                <Sparkles className="size-3.5 text-editorial-green" />
                AI-Powered Alumni Network
              </span>
            </FadeUp>

            {/* Headline */}
            <div className="mt-6">
              <SplitText
                as="h1"
                className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-extrabold text-editorial-ink leading-[1.1] tracking-tight"
                delay={0.2}
                staggerChildren={0.04}
              >
                Your career journey starts with a connection
              </SplitText>
            </div>

            {/* Subheading */}
            <FadeUp delay={0.6} className="mt-5">
              <p className="text-lg sm:text-xl text-editorial-ink/50 leading-relaxed max-w-lg">
                384-dimensional AI matching connects you with verified alumni who can refer you
                to your dream company. Skillshare-style courses to level up your skills.
              </p>
            </FadeUp>

            {/* CTAs */}
            <FadeUp delay={0.8} className="mt-8 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/register")}
                className="inline-flex items-center gap-2.5 rounded-pill bg-editorial-green px-7 py-3.5 text-sm font-bold text-editorial-ink shadow-[0_4px_20px_rgba(0,255,132,0.25)] hover:shadow-[0_8px_32px_rgba(0,255,132,0.35)] transition-shadow"
              >
                Start Learning Free
                <ArrowRight className="size-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/directory")}
                className="inline-flex items-center gap-2.5 rounded-pill border-2 border-editorial-ink/10 px-7 py-3.5 text-sm font-bold text-editorial-ink hover:border-editorial-ink/20 hover:bg-editorial-muted transition-all"
              >
                <Play className="size-4 fill-editorial-ink" />
                Browse as Guest
              </motion.button>
            </FadeUp>

            {/* Social proof */}
            <FadeUp delay={1} className="mt-8 flex items-center gap-6">
              <div className="flex -space-x-2">
                {["PS", "AM", "SR", "VP", "AS"].map((initials, i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-editorial bg-editorial-ink text-[10px] font-bold text-white"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-editorial-ink">1,200+ verified alumni</p>
                <p className="text-xs text-editorial-ink/40">across 40+ companies worldwide</p>
              </div>
            </FadeUp>
          </div>

          {/* Right: Feature Cards Stack */}
          <div className="relative hidden lg:block">
            {/* Main Feature Card */}
            <FadeUp delay={0.4}>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-2xl bg-editorial-card border border-editorial-subtle/60 p-7 shadow-float"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-editorial-green/10">
                    <BookOpen className="size-5 text-editorial-green" />
                  </div>
                  <div>
                    <p className="font-outfit text-sm font-bold text-editorial-ink">System Design Mastery</p>
                    <p className="text-xs text-editorial-ink/40">by Priya Sharma · Google</p>
                  </div>
                  <span className="ml-auto rounded-pill bg-editorial-coral/10 px-3 py-1 text-[10px] font-bold text-editorial-coral">
                    NEW
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-editorial-ink/40">12/18 lessons</span>
                    <span className="text-xs font-bold text-editorial-green">67%</span>
                  </div>
                  <div className="h-2 rounded-full bg-editorial-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-editorial-green"
                      initial={{ width: 0 }}
                      whileInView={{ width: "67%" }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {["Distributed Systems", "Scalability", "CAP Theorem", "Caching"].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-pill bg-editorial-muted px-2.5 py-0.5 text-[10px] font-semibold text-editorial-ink/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            </FadeUp>

            {/* Floating AI Match Card */}
            <FadeUp delay={0.7} className="mt-4">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="relative rounded-2xl bg-editorial-card border border-editorial-subtle/60 p-5 shadow-float max-w-xs ml-auto"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-editorial-green to-editorial-green/60 text-xs font-bold text-editorial-ink">
                    94%
                  </div>
                  <div>
                    <p className="text-sm font-bold text-editorial-ink">AI Match Found</p>
                    <p className="text-xs text-editorial-ink/40">Referral success predicted</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "System Design"].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-pill bg-editorial-green/8 px-2 py-0.5 text-[10px] font-semibold text-editorial-ink/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            </FadeUp>

            {/* Stats accent */}
            <FadeUp delay={0.9} className="mt-4">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="rounded-2xl bg-editorial-ink p-5 shadow-float max-w-xs"
              >
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "85%", label: "Response" },
                    { value: "450+", label: "Jobs" },
                    { value: "384", label: "AI Dim" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="font-outfit text-lg font-extrabold text-editorial-green">{stat.value}</p>
                      <p className="text-[10px] text-white/40">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}