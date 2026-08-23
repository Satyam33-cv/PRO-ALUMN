"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles, Search, ArrowRight, ShieldCheck, GraduationCap,
  UserCheck, School, Cpu, Users, Briefcase, HeartHandshake, CalendarDays,
  MessageCircle, User, HandCoins, Award, ShieldCheck as AdminShield,
  Clock, CheckCircle2, Send, Database, Globe,
} from "lucide-react";
import { PreLoginNav } from "@/components/PreLoginNav";

const stats = [
  { value: "1,200+", label: "Verified Alumni" },
  { value: "85%", label: "Referral Rate" },
  { value: "384-Dim", label: "AI Vectors" },
  { value: "40+", label: "Partner Companies" },
];

const referralStates = [
  { label: "Pending", icon: Clock, color: "text-bronze-600 dark:text-bronze-400 bg-bronze-100 dark:bg-bronze-500/10 border-bronze-200 dark:border-bronze-500/20" },
  { label: "Accepted / Rejected", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
  { label: "Referred", icon: Send, color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
  { label: "Hired", icon: Award, color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
];

const personas = [
  {
    icon: GraduationCap,
    title: "Student",
    desc: "AI-computed Top 5 Alumni matches with similarity scores, instant referral requests, and mentorship discovery.",
    points: ["Top 5 alumni matching widget", "Resume + note referral flow", "Reunion countdown & quick actions"],
  },
  {
    icon: UserCheck,
    title: "Alumni",
    desc: "Verified badge, incoming referral management, mentoring availability toggle, and a spotlight wall for success stories.",
    points: ["Referral state machine inbox", "Open-to-Mentoring switch", "Draft career stories"],
  },
  {
    icon: School,
    title: "Faculty",
    desc: "Institutional broadcast tools, story review power, and event organization with capacity-controlled RSVPs.",
    points: ["Announcement feed", "Story approval power", "Event & RSVP oversight"],
  },
  {
    icon: AdminShield,
    title: "Administrator",
    desc: "Restricted command center for account verification, CSV bulk import, moderation, and outcome analytics.",
    points: ["Verification queues", "CSV bulk import", "Referral funnel analytics"],
  },
];

const features = [
  { icon: Users, title: "Directory & AI Matching", desc: "Search alumni with live multi-select chips for batch, department, location, and mentors — ranked by vector similarity.", href: "/directory" },
  { icon: Briefcase, title: "Job Board & Referral Engine", desc: "Filterable opportunities where Ask Referral opens a Resume + Note modal and tracks Pending → Hired status.", href: "/jobs" },
  { icon: HeartHandshake, title: "Mentorship Hub", desc: "Top mentor matches, availability toggles, and Accept creating a direct 1:1 chat thread.", href: "/mentorship" },
  { icon: CalendarDays, title: "Events & Capacity RSVPs", desc: "Dynamic countdowns, category tabs, and real-time capacity-controlled RSVPs.", href: "/events" },
  { icon: MessageCircle, title: "Unified Messaging", desc: "Split-view 1:1 and group chats, seeded directly from profile and referral action links.", href: "/chat" },
  { icon: User, title: "Profile & AI Vector Sync", desc: "Career timeline, achievement badges, mentorship switches, and a one-tap Re-sync AI Profile Vector.", href: "/profile" },
  { icon: HandCoins, title: "Giving Platform", desc: "Campaign cards, donor lists, and gift selectors — preview only, payment backend unattached.", href: "/giving" },
  { icon: Award, title: "Spotlight Wall", desc: "Moderated career stories: alumni draft, faculty and admins approve, the community celebrates.", href: "/stories" },
  { icon: ShieldCheck, title: "Admin Command Center", desc: "Verification queues, CSV import, story moderation, and referral funnel analytics.", href: "/admin" },
  { icon: Sparkles, title: "Role-Aware Home Feed", desc: "A personalized greeting, reunion countdown, and quick-action grid for every persona.", href: "/home" },
];

const stack = [
  { icon: Database, title: "pgvector + HNSW", desc: "PostgreSQL vector engine with a 384-dim cosine index for instant similarity search." },
  { icon: Cpu, title: "AI Embeddings", desc: "text-embedding-3-small with automatic fallback to deterministic local hashing." },
  { icon: Globe, title: "Cloudinary · SendGrid · Twilio", desc: "Resume uploads, transactional email, and WhatsApp notifications — console-safe in dev." },
  { icon: ShieldCheck, title: "JWT + bcrypt", desc: "Role-gated Express API with per-route authorization and serializable capacity checks." },
];

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/directory?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen bg-ivory-50 dark:bg-navy-950 text-navy-900 dark:text-ivory-100 font-sans">
      <PreLoginNav />

      <main>
        {/* ── HERO ── */}
        <section className="relative pt-36 pb-20 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-bronze-400/10 dark:bg-bronze-500/10 blur-[120px]" />
          <div className="max-w-4xl mx-auto text-center space-y-6 relative">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-bronze-100 dark:bg-bronze-500/10 text-bronze-700 dark:text-bronze-300 border border-bronze-200 dark:border-bronze-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Role-Aware Alumni Platform — Student · Alumni · Faculty · Admin
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
            >
              Your career starts
              <br />
              with a <span className="text-bronze-600 dark:text-bronze-400">connection</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-navy-500 dark:text-ivory-100/60 max-w-2xl mx-auto"
            >
              384-dimensional AI matching connects students with verified alumni who can refer
              them to their dream company — driving every referral through a transparent
              Pending → Accepted → Referred → Hired lifecycle.
            </motion.p>

            {/* Search */}
            <motion.form
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              onSubmit={handleSearch}
              className="mt-8 max-w-md mx-auto bg-white dark:bg-navy-900 rounded-xl border border-navy-900/10 dark:border-ivory-100/10 p-1 pl-4 flex items-center shadow-card"
            >
              <input
                type="text"
                placeholder="Search alumni by company, role, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search alumni"
                className="w-full bg-transparent text-sm text-navy-900 dark:text-ivory-100 outline-none placeholder:text-navy-400 dark:placeholder:text-ivory-100/30"
              />
              <button type="submit" aria-label="Search" className="bg-bronze-600 hover:bg-bronze-700 text-white w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </motion.form>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
            >
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-bronze-600 text-white text-sm font-bold px-6 py-3 shadow-lg shadow-bronze-600/25 hover:bg-bronze-700 hover:shadow-xl transition-all">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/directory" className="inline-flex items-center gap-2 rounded-xl border-2 border-navy-900/10 dark:border-ivory-100/10 text-navy-900 dark:text-ivory-100 text-sm font-bold px-6 py-3 hover:border-bronze-500/50 hover:bg-bronze-100/50 dark:hover:bg-bronze-500/10 transition-all">
                Explore the Directory
              </Link>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <div className="max-w-3xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-bronze-600 dark:text-bronze-400">{s.value}</p>
                <p className="text-xs text-navy-500 dark:text-ivory-100/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── REFERRAL LIFECYCLE ENGINE ── */}
        <section id="referrals" className="py-20 px-6 bg-white dark:bg-navy-900/40 border-y border-navy-900/10 dark:border-ivory-100/10">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-bronze-100 dark:bg-bronze-500/10 text-bronze-700 dark:text-bronze-300 border border-bronze-200 dark:border-bronze-500/20">Referral Lifecycle Engine</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
                No generic applies. Structured referrals, end to end.
              </h2>
              <p className="mt-4 text-navy-500 dark:text-ivory-100/60">
                Every job card&apos;s <span className="font-semibold text-navy-900 dark:text-ivory-100">Ask Referral</span> action opens a
                Resume + Note flow. The request enters a state machine the alumni drives —
                and both sides see every status change in a request tracking dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl bg-navy-900 dark:bg-ivory-100 text-ivory-50 dark:text-navy-900 text-sm font-bold px-5 py-2.5 hover:opacity-90 transition-opacity">
                  Browse Opportunities <Briefcase className="w-4 h-4" />
                </Link>
                <Link href="/referrals" className="inline-flex items-center gap-2 rounded-xl border-2 border-navy-900/10 dark:border-ivory-100/10 text-navy-900 dark:text-ivory-100 text-sm font-bold px-5 py-2.5 hover:border-bronze-500/50 transition-colors">
                  Track My Requests
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
                  className="flex items-center gap-4 p-4 rounded-2xl border bg-ivory-50 dark:bg-navy-950 border-navy-900/10 dark:border-ivory-100/10"
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${state.color}`}>
                    <state.icon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="font-bold text-sm">{state.label}</p>
                    <p className="text-xs text-navy-500 dark:text-ivory-100/50 mt-0.5">
                      {i === 0 && "Student submits resume + personalized note on an open job."}
                      {i === 1 && "Alumni accepts to proceed or rejects with a reason."}
                      {i === 2 && "Alumni marks the candidate as referred to the company."}
                      {i === 3 && "Outcome recorded — the loop closes with analytics."}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROLE-AWARE ARCHITECTURE ── */}
        <section id="roles" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-bronze-100 dark:bg-bronze-500/10 text-bronze-700 dark:text-bronze-300 border border-bronze-200 dark:border-bronze-500/20">Role-Based Architecture</span>
              <h2 className="text-3xl font-extrabold tracking-tight">One platform, four personas</h2>
              <p className="text-navy-500 dark:text-ivory-100/60 max-w-2xl mx-auto">
                The interface branches across Student, Alumni, Faculty, and Administrator experiences.
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
                  className="p-6 rounded-2xl border border-navy-900/10 dark:border-ivory-100/10 bg-white dark:bg-navy-900/50 shadow-sm hover:shadow-md hover:border-bronze-300 dark:hover:border-bronze-500/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-bronze-100 dark:bg-bronze-500/10 flex items-center justify-center mb-4">
                    <p.icon className="w-6 h-6 text-bronze-600 dark:text-bronze-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                  <p className="text-sm text-navy-500 dark:text-ivory-100/60 mb-4">{p.desc}</p>
                  <ul className="space-y-1.5">
                    {p.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs text-navy-700 dark:text-ivory-100/70">
                        <CheckCircle2 className="w-3.5 h-3.5 text-bronze-600 dark:text-bronze-400 mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section id="features" className="py-20 px-6 bg-white dark:bg-navy-900/40 border-y border-navy-900/10 dark:border-ivory-100/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-bronze-100 dark:bg-bronze-500/10 text-bronze-700 dark:text-bronze-300 border border-bronze-200 dark:border-bronze-500/20">Product Surface</span>
              <h2 className="text-3xl font-extrabold tracking-tight">Everything your network needs</h2>
              <p className="text-navy-500 dark:text-ivory-100/60">Ten connected surfaces, from AI matching to the admin command center.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                >
                  <Link
                    href={f.href}
                    className="block h-full p-6 rounded-2xl border border-navy-900/10 dark:border-ivory-100/10 bg-ivory-50 dark:bg-navy-950 shadow-sm hover:shadow-md hover:border-bronze-300 dark:hover:border-bronze-500/40 hover:-translate-y-1 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-bronze-100 dark:bg-bronze-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <f.icon className="w-6 h-6 text-bronze-600 dark:text-bronze-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      {f.title}
                      <ArrowRight className="w-3.5 h-3.5 text-navy-400 dark:text-ivory-100/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-navy-500 dark:text-ivory-100/60">{f.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI MATCHING & ARCHITECTURE ── */}
        <section id="matching" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-bronze-100 dark:bg-bronze-500/10 text-bronze-700 dark:text-bronze-300 border border-bronze-200 dark:border-bronze-500/20">Technical Architecture</span>
              <h2 className="text-3xl font-extrabold tracking-tight">Matching built on vectors, not guesswork</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stack.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-2xl border border-navy-900/10 dark:border-ivory-100/10 bg-white dark:bg-navy-900/50"
                >
                  <s.icon className="w-6 h-6 text-bronze-600 dark:text-bronze-400 mb-4" />
                  <h3 className="font-bold text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-navy-500 dark:text-ivory-100/60 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-navy-900/10 dark:border-ivory-100/10 bg-navy-950 dark:bg-navy-950 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-ivory-100/10">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs text-ivory-100/40 font-mono">referral-flow.ts</span>
              </div>
              <pre className="p-6 text-sm font-mono text-ivory-100/80 overflow-x-auto leading-relaxed">
{`const match = await alumni.search({
  company: "Google",
  skills: ["React", "System Design"],
  minMatchScore: 85,
}); // pgvector · 384-dim · HNSW cosine

const referral = await alumni.referrals.create({
  alumniId: match[0].id,
  resumeUrl: "https://cdn.resume.pdf",
  note: "Hi! I'd love to connect about the SWE role.",
});
// status: PENDING → ACCEPTED | REJECTED → REFERRED → HIRED`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-12 rounded-3xl bg-navy-900 dark:bg-navy-900 text-ivory-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#B8863B14_1px,transparent_1px),linear-gradient(-45deg,#B8863B14_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-bronze-500/20 blur-[100px]" />
            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl font-extrabold">Start your journey today</h2>
              <p className="text-ivory-100/60 max-w-lg mx-auto">
                Join 1,200+ alumni and students building meaningful careers through verified, structured connections.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-bronze-500 text-navy-950 rounded-xl font-bold hover:bg-bronze-400 transition-colors">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-navy-900/10 dark:border-ivory-100/10 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-navy-500 dark:text-ivory-100/50">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-navy-900 dark:bg-ivory-100 flex items-center justify-center text-bronze-400 dark:text-navy-900 font-bold text-xs">P</span>
            <span className="font-bold text-navy-900 dark:text-ivory-100">PRO ALUMN</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/education" className="hover:text-bronze-600 dark:hover:text-bronze-400 transition-colors">Education Center</Link>
            <Link href="/help" className="hover:text-bronze-600 dark:hover:text-bronze-400 transition-colors">Find Help</Link>
            <Link href="/admin" className="hover:text-bronze-600 dark:hover:text-bronze-400 transition-colors">Admin</Link>
          </div>
          <p className="text-xs">© 2026 PRO ALUMN · Built on pgvector</p>
        </div>
      </footer>
    </div>
  );
}