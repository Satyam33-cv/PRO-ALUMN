"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  School,
  Cpu,
  Users,
  Briefcase,
  HeartHandshake,
  CalendarDays,
  MessageCircle,
  User,
  HandCoins,
  Award,
  ShieldCheck as AdminShield,
  Clock,
  CheckCircle2,
  Send,
  Database,
  Megaphone,
  FileText,
  BookOpen,
  Zap,
  Lock,
  Layers,
  PlayCircle
} from "lucide-react";
import { PreLoginNav } from "@/components/PreLoginNav";

const stats = [
  { value: "1,200+", label: "Verified Alumni" },
  { value: "85%", label: "Referral Success Rate" },
  { value: "384-Dim", label: "Gemini Vector Vectors" },
  { value: "40+", label: "Partner Companies" },
];

const referralStates = [
  {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    desc: "Student submits targeted resume and personalized referral note for an open requisition.",
  },
  {
    label: "Accepted / Screened",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Alumni reviews portfolio, endorses candidate, or provides constructive feedback.",
  },
  {
    label: "Referred Internally",
    icon: Send,
    color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Alumni submits internal referral directly into company portal with candidate tracking ID.",
  },
  {
    label: "Hired & Celebrated",
    icon: Award,
    color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
    desc: "Candidate clears interview loop, accepts offer, and milestone is spotlighted on community wall.",
  },
];

const personas = [
  {
    icon: GraduationCap,
    title: "Student",
    desc: "AI-computed Top Alumni matches with similarity scores, instant referral requests, and 1:1 mentorship booking.",
    points: [
      "Top 5 AI alumni matching with vector similarity",
      "Tailored resume + note referral submission flow",
      "Reunion countdown & quick skill sprint pathways",
    ],
    color: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: UserCheck,
    title: "Alumni",
    desc: "Verified profile badge, incoming referral management inbox, mentoring availability toggle, and spotlight stories.",
    points: [
      "Structured referral state-machine inbox",
      "Open-to-Mentoring availability toggle switch",
      "Draft and publish career success stories",
    ],
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: School,
    title: "Faculty",
    desc: "Institutional announcements broadcast, story review authority, and event organization with capacity RSVPs.",
    points: [
      "Campus announcement feed with Pinned Priority",
      "Moderation and approval for spotlight stories",
      "Event hosting & real-time RSVP oversight",
    ],
    color: "from-purple-500/10 to-violet-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    icon: AdminShield,
    title: "Administrator",
    desc: "Secure command center for account verification, CSV bulk import, platform moderation, and funnel analytics.",
    points: [
      "Alumni verification queues & CSV bulk import",
      "End-to-end referral funnel & hiring analytics",
      "Comprehensive platform settings and role management",
    ],
    color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400",
  },
];

const productSurfaces = [
  {
    icon: Users,
    title: "Alumni Directory & AI Matching",
    desc: "Search verified alumni with live multi-select chips for batch, department, company, and mentors — ranked by 384-dim Gemini vector similarity.",
    href: "/directory",
    tag: "AI Powered",
  },
  {
    icon: Briefcase,
    title: "Job Board & Referral Engine",
    desc: "Filterable openings across 40+ top tech companies. 'Ask Referral' opens a tailored packet builder and tracks Pending → Hired stages.",
    href: "/jobs",
    tag: "Core Engine",
  },
  {
    icon: Megaphone,
    title: "Campus & Alumni Announcements",
    desc: "Official university broadcasts with Pinned Priority notices, Markdown formatting, and multi-category filtering.",
    href: "/announcements",
    tag: "Live Broadcast",
  },
  {
    icon: FileText,
    title: "Google Workspace Native Suite",
    desc: "Native collaboration: Google Docs for resume reviews, Google Keep for quick notes, Gmail communications, and Google Forms surveys.",
    href: "/docs",
    tag: "Google Cloud",
  },
  {
    icon: HeartHandshake,
    title: "Mentorship Hub",
    desc: "Smart mentor matching, availability status toggles, and 1:1 request approvals that auto-create real-time direct chat threads.",
    href: "/mentorship",
    tag: "1:1 Coaching",
  },
  {
    icon: CalendarDays,
    title: "Events & Capacity RSVPs",
    desc: "Interactive countdowns, category filters, and real-time capacity-controlled RSVPs synced with Google Calendar.",
    href: "/events",
    tag: "Events",
  },
  {
    icon: MessageCircle,
    title: "Unified Real-Time Messaging",
    desc: "Split-view threaded 1:1 and group conversations, seeded directly from alumni profiles and job referral action links.",
    href: "/chat",
    tag: "Real-Time",
  },
  {
    icon: BookOpen,
    title: "Spotlight Wall of Success Stories",
    desc: "Peer-voted and faculty-moderated career breakthrough stories celebrating career pivots, promotions, and startup funding.",
    href: "/stories",
    tag: "Community",
  },

  {
    icon: GraduationCap,
    title: "Skill & Career Education Center",
    desc: "Skillshare-style career sprint guides, technical interview prep pathways, and verified salary negotiation blueprints.",
    href: "/education",
    tag: "Education",
  },
  {
    icon: User,
    title: "Interactive Profile & Vector Sync",
    desc: "Career timeline, achievement badges, mentoring availability, and a 1-tap 'Re-sync AI Profile Vector' powered by Gemini.",
    href: "/profile",
    tag: "Smart Profile",
  },
  {
    icon: ShieldCheck,
    title: "Admin Command Center",
    desc: "Institutional verification queue, CSV bulk graduate import, story moderation, and referral conversion analytics.",
    href: "/admin",
    tag: "Security",
  },
];

const technicalArchitecture = [
  {
    icon: Cpu,
    title: "Google Gemini AI & pgvector",
    desc: "Gemini embedding model generates 384-dimensional dense vectors indexed with PostgreSQL pgvector and HNSW cosine distance for sub-10ms similarity queries.",
    badge: "AI & Vector DB",
  },
  {
    icon: Lock,
    title: "Google OAuth 2.0 & Firebase",
    desc: "Enterprise Single Sign-On via Google OAuth 2.0, Firebase Authentication, and Firestore real-time profile replication for seamless authentication.",
    badge: "Auth & Identity",
  },
  {
    icon: Layers,
    title: "Google Workspace Integration",
    desc: "Native ecosystem integration with Google Docs, Google Keep, Gmail API, Google Forms surveys, and Google Calendar event scheduling.",
    badge: "Productivity",
  },
  {
    icon: Database,
    title: "Enterprise Full-Stack Architecture",
    desc: "Next.js 14 App Router, Express API on Railway, PostgreSQL database with Prisma ORM, and resilient local mock fallbacks for zero downtime.",
    badge: "Cloud Infrastructure",
  },
];

const quickSearchTags = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Software Engineer",
  "Product Manager",
  "Machine Learning",
  "Mentors",
];

export default function LandingPage({ previewVideos = [] }: { previewVideos?: any[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/directory?q=${encodeURIComponent(trimmed)}`);
  }

  function handleTagClick(tag: string) {
    router.push(`/directory?q=${encodeURIComponent(tag)}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      <PreLoginNav />

      <main>
        {/* ── HERO SECTION ── */}
        <section className="relative pt-36 pb-24 px-6 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-linear-to-tr from-blue-600/15 via-indigo-600/10 to-purple-600/15 blur-[140px] pointer-events-none" />
          <div className="absolute top-12 right-10 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>AI-Powered Alumni Intelligence &amp; Google Cloud Ecosystem</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
            >
              Where Alumni Networks
              <br />
              <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Power Fast-Track Careers
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
            >
              384-dimensional vector matching connects students with verified alumni champions
              who can refer them to their dream company — driving every referral through a transparent
              <strong className="text-slate-900 dark:text-slate-200 font-semibold"> Pending → Accepted → Referred → Hired </strong>
              lifecycle.
            </motion.p>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="max-w-2xl mx-auto space-y-3 pt-2"
            >
              <form
                onSubmit={handleSearch}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 pl-4 flex items-center shadow-lg shadow-slate-200/50 dark:shadow-none focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
              >
                <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search alumni by company (e.g. Google, Meta), role, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search alumni"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 py-2.5"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5 shrink-0 transition-colors shadow-sm shadow-blue-600/30 cursor-pointer"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-medium mr-1">Popular:</span>
                {quickSearchTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="pt-2 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-7 py-3.5 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 text-sm font-bold px-7 py-3.5 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:-translate-y-0.5 transition-all shadow-xs"
              >
                <span>Explore Directory</span>
              </Link>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-xs">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-2">
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {s.value}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── REFERRAL LIFECYCLE STATE MACHINE ── */}
        <section id="referrals" className="py-24 px-6 bg-white dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                <Zap className="w-3.5 h-3.5" />
                Referral Lifecycle State Machine
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                No generic cold applications.
                <br />
                <span className="text-blue-600 dark:text-blue-400">Structured warm referrals</span>, end to end.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                Every job posting&apos;s <strong className="text-slate-900 dark:text-slate-200">Ask Referral</strong> action opens an automated
                Resume + Note packet builder. The request enters a verifiable state machine where the alumni reviews, endorses, and submits directly into internal talent pipelines.
              </p>
              <div className="flex flex-wrap gap-3.5 pt-2">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-bold px-6 py-3 shadow-md transition-all cursor-pointer"
                >
                  <span>Browse Job Opportunities</span>
                  <Briefcase className="w-4 h-4" />
                </Link>
                <Link
                  href="/referrals"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-sm font-bold px-6 py-3 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
                >
                  <span>Track Referral Board</span>
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {referralStates.map((state, i) => (
                <motion.div
                  key={state.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl border bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700/60 transition-all"
                >
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${state.color}`}>
                    <state.icon className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-bold">
                        Step 0{i + 1}
                      </span>
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{state.label}</p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {state.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXPANDED PRODUCT SURFACES & EXTRA PAGES ── */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                <Layers className="w-3.5 h-3.5" />
                Comprehensive Platform Ecosystem
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Everything Your Institution &amp; Alumni Network Needs
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Twelve connected surfaces seamlessly unifying mentorship, jobs, announcements, and native Google Workspace tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productSurfaces.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                >
                  <Link
                    href={f.href}
                    className="block h-full p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg hover:border-blue-400/80 dark:hover:border-blue-600/80 hover:-translate-y-1 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                        <f.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                        {f.tag}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 flex items-center justify-between">
                      <span>{f.title}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-1" />
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EDUCATION CENTRE PREVIEW ── */}
        {previewVideos.length > 0 && (
          <section className="py-24 px-6 bg-slate-900 text-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-900/40 text-blue-300 border border-blue-800">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Education Centre
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    Upskill with Expert Masterclasses
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base">
                    Preview premium courses and interview prep deep-dives uploaded by our verified top alumni.
                  </p>
                </div>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-blue-500/20 w-fit"
                >
                  Join to Watch
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden">
                {previewVideos.map((video) => (
                  <div key={video.id} className="min-w-[280px] sm:min-w-[320px] snap-center shrink-0">
                    <div className="flex flex-col h-full bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden group">
                      <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                        <PlayCircle className="w-12 h-12 text-white/50 group-hover:text-white/80 group-hover:scale-110 transition-all z-20" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between z-20 relative bg-slate-800">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
                              {video.priceInCredits === 0 ? "Free" : "Premium"}
                            </span>
                            {video.durationSeconds && (
                              <span className="text-[10px] text-slate-400 font-medium font-mono">
                                {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-100 leading-tight mb-2 line-clamp-2">
                            {video.title}
                          </h3>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold overflow-hidden shrink-0">
                            {video.uploader?.avatarUrl ? (
                              <img src={video.uploader.avatarUrl} alt={video.uploader.name} className="w-full h-full object-cover" />
                            ) : (
                              video.uploader?.name?.[0] || "?"
                            )}
                          </div>
                          <span className="text-xs font-medium text-slate-300 truncate">
                            {video.uploader?.name || "Verified Alumni"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ROLE-BASED EXPERIENCE ── */}
        <section id="roles" className="py-24 px-6 bg-white dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                <Users className="w-3.5 h-3.5" />
                Role-Aware Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                One Platform, Four Dedicated Personas
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Tailored workflows engineered specifically for Student, Alumni, Faculty, and Admin needs.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {personas.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shadow-xs hover:border-blue-400/80 dark:hover:border-blue-600/80 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${p.color} flex items-center justify-center mb-4`}>
                      <p.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">{p.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                  <ul className="space-y-2 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
                    {p.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TECHNICAL ARCHITECTURE & GOOGLE ECOSYSTEM ── */}
        <section id="matching" className="py-24 px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                <Cpu className="w-3.5 h-3.5" />
                Technical Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Built on Google Cloud &amp; pgvector
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Enterprise-grade security, 384-dimensional vector retrieval, and native Google Workspace integration.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {technicalArchitecture.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <s.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                        {s.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">{s.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Code Snippet Preview Window */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs text-slate-400 font-mono">google-gemini-matching.ts</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">PostgreSQL · pgvector HNSW</span>
              </div>
              <pre className="p-6 text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`// 1. Generate 384-dimensional vector embedding with Google Gemini
const studentEmbedding = await gemini.embedText({
  model: "text-embedding-3-small",
  text: "Computer Science senior specializing in Distributed Systems & Kubernetes",
});

// 2. Query top verified alumni with HNSW cosine similarity ranking
const topAlumniMatches = await prisma.$queryRaw\`
  SELECT id, name, "currentCompany", "jobTitle",
         1 - (embedding <=> \${studentEmbedding}::vector) AS similarity_score
  FROM "User"
  WHERE role = 'ALUMNI' AND "isVerified" = true
  ORDER BY embedding <=> \${studentEmbedding}::vector ASC
  LIMIT 5;
\`; // Sub-10ms similarity match score: 94.8%`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── HIGH CONVERTING CTA ── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6 p-10 sm:p-14 rounded-3xl bg-linear-to-br from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden shadow-2xl border border-blue-900/40">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#3B82F610_1px,transparent_1px),linear-gradient(-45deg,#3B82F610_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Join 1,200+ Verified Members
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Start Accelerating Your Career Today
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Connect with verified alumni mentors, request structured job referrals, and collaborate effortlessly with native Google Workspace tools.
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/40 hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/directory"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-bold text-sm border border-white/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Browse Directory</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 bg-white dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold font-outfit text-sm shadow-md shadow-blue-600/20">
                P
              </span>
              <span className="font-outfit font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
                PRO <span className="text-blue-600 dark:text-blue-400">ALUMN</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              <Link href="/directory" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Directory</Link>
              <Link href="/jobs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Jobs &amp; Referrals</Link>
              <Link href="/mentorship" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Mentorship</Link>
              <Link href="/announcements" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Announcements</Link>
              <Link href="/docs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Google Docs</Link>
              <Link href="/education" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Education Center</Link>
              <Link href="/giving" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Giving</Link>
              <Link href="/help" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Find Help</Link>
              <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Admin Portal</Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500">
            <p>© 2026 PRO ALUMN. All rights reserved. Powered by Google Cloud &amp; pgvector.</p>
            <p className="font-mono text-[11px]">Role-Aware Enterprise Edition</p>
          </div>
        </div>
      </footer>
    </div>
  );
}