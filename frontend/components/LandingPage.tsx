"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Send,
  Award,
  Terminal,
  FileText,
  MapPin,
  Briefcase,
  Calendar,
  Sparkles,
  Users,
  Compass,
  Check,
  Building,
  GraduationCap,
  ExternalLink,
  Code,
  Layers,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [vectorQuery, setVectorQuery] = useState("");
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [matchedCandidate, setMatchedCandidate] = useState({
    name: "Dr. Aris Thorne",
    role: "Staff Infra Architect @ DeepMind",
    similarity: "0.942 COSINE MATCH",
    status: "Open for 2 Referrals",
  });

  const presets = [
    {
      label: "Google",
      query: "Google L6 Site Reliability Engineer",
      candidate: {
        name: "Vikram Aditya",
        role: "L6 SRE @ Google Infrastructure",
        similarity: "0.984 COSINE MATCH",
        status: "Active Sponsor • 2 Slots Open",
      },
    },
    {
      label: "Microsoft",
      query: "Microsoft Azure Core Kernel Engineer",
      candidate: {
        name: "Devin Zhao",
        role: "Principal Systems Engineer @ Azure",
        similarity: "0.956 COSINE MATCH",
        status: "Open for Systems Mentorship",
      },
    },
    {
      label: "Amazon",
      query: "Amazon AWS Distributed Databases SDE II",
      candidate: {
        name: "Ananya Deshmukh",
        role: "SDE II @ AWS DynamoDB",
        similarity: "0.961 COSINE MATCH",
        status: "Open for Referrals",
      },
    },
    {
      label: "Meta",
      query: "Meta Infrastructure & PyTorch Performance",
      candidate: {
        name: "Kareem Al-Sayed",
        role: "Senior Research Scientist @ Meta AI",
        similarity: "0.972 COSINE MATCH",
        status: "Reviewing Fellow Papers",
      },
    },
    {
      label: "Systems / SRE",
      query: "Staff Site Reliability Engineer High-Throughput",
      candidate: {
        name: "Marcus Vance",
        role: "Staff SRE @ Google Cloud Storage",
        similarity: "0.948 COSINE MATCH",
        status: "Accepting Fast-Track Requests",
      },
    },
    {
      label: "Product Architect",
      query: "Technical Product Manager AI Platform Growth",
      candidate: {
        name: "Sophia Martinez",
        role: "Director of Product @ Stripe",
        similarity: "0.939 COSINE MATCH",
        status: "Open for 1:1 Advising",
      },
    },
    {
      label: "Machine Learning",
      query: "LLM Fine-Tuning & Quantization ML Engineer",
      candidate: {
        name: "Dr. Aris Thorne",
        role: "Staff Infra Architect @ DeepMind",
        similarity: "0.942 COSINE MATCH",
        status: "Open for 2 Referrals",
      },
    },
  ];

  const handleSelectPreset = (p: (typeof presets)[0]) => {
    setVectorQuery(p.query);
    setMatchedCandidate(p.candidate);
    setShowMatchResult(true);
  };

  const handleComputeMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (vectorQuery.trim()) {
      setShowMatchResult(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF9F3] text-[#1A1A1A] font-sans antialiased selection:bg-black selection:text-white">
      {/* ========================================================================= */}
      {/* TOP BROADSHEET HEADER */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#FCF9F3] border-b-2 border-black">
        <div className="w-full flex items-stretch justify-between h-16">
          {/* Logo & Node Indicator */}
          <div className="flex items-center px-4 md:px-8 border-r-2 border-black bg-[#FCF9F3]">
            <Link href="/" className="flex items-center gap-2 group" aria-label="PRO-ALUMN Home">
              <span className="font-mono text-sm tracking-widest text-black font-black group-hover:text-[#FF5500] transition-colors">
                /////
              </span>
              <span className="font-headline text-xl font-black tracking-tighter text-black uppercase">
                PRO-ALUMN
              </span>
            </Link>
            <div className="hidden xl:flex items-center ml-4 px-2 py-0.5 bg-[#CCFF00] border border-black text-[10px] font-mono font-bold text-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping mr-1.5" />
              SYS.V24 // NODE-ALPHA [PUBLIC_GUEST]
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-stretch h-full" aria-label="Main Navigation">
            <Link
              href="/directory"
              className="flex items-center px-4 font-mono text-xs font-bold uppercase text-black border-r-2 border-black hover:bg-black hover:text-[#CCFF00] transition-colors"
            >
              Directory{" "}
              <span className="ml-1.5 px-1 bg-[#CCFF00] text-black text-[9px] font-black border border-black">
                ★ 1.2K
              </span>
            </Link>
            <Link
              href="/jobs"
              className="flex items-center px-4 font-mono text-xs font-bold uppercase text-black border-r-2 border-black hover:bg-black hover:text-[#CCFF00] transition-colors"
            >
              Jobs &amp; Referrals
            </Link>
            <Link
              href="/mentorship"
              className="flex items-center px-4 font-mono text-xs font-bold uppercase text-black border-r-2 border-black hover:bg-black hover:text-[#CCFF00] transition-colors"
            >
              Mentorship
            </Link>
            <Link
              href="/announcements"
              className="flex items-center px-4 font-mono text-xs font-bold uppercase text-black border-r-2 border-black hover:bg-black hover:text-[#CCFF00] transition-colors"
            >
              Announcements
            </Link>
            <Link
              href="/education"
              className="flex items-center px-4 font-mono text-xs font-bold uppercase text-black border-r-2 border-black hover:bg-black hover:text-[#CCFF00] transition-colors"
            >
              Education
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-stretch">
            <Link
              href="/login"
              className="flex items-center px-4 font-mono text-xs font-bold uppercase text-black border-l-2 border-black hover:bg-black hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 font-mono text-xs font-black uppercase bg-[#FF5500] text-white border-l-2 border-black hover:bg-[#E04B00] shadow-[inset_-2px_0px_0px_0px_#000000] transition-colors"
            >
              Get Started <span className="font-black">→</span>
            </Link>
            <div className="flex items-center px-4 border-l-2 border-black bg-[#EFECE4]">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-black shadow-[1px_1px_0px_0px_#000000]">
                <span className="font-mono text-xs font-bold text-[#CCFF00]">ID</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-16 bg-[#FCF9F3]">
        <div className="flex flex-col w-full bg-[#FCF9F3]">
          {/* ========================================================================= */}
          {/* SECTION 1: ARCHITECTURAL HERO & BROADSHEET MASTHEAD */}
          {/* ========================================================================= */}
          <section className="w-full bg-[#FCF9F3] border-b-2 border-black">
            {/* Masthead Gazette Sub-header Strip */}
            <div className="w-full px-4 md:px-8 py-2 bg-[#EFECE4] border-b border-black flex flex-col md:flex-row justify-between items-center text-black font-mono text-[11px] font-semibold tracking-wider uppercase gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-black border border-black">
                  DISPATCH NO. 448
                </span>
                <span className="flex items-center gap-1.5 text-[#1A1A1A]">
                  <span className="w-2 h-2 rounded-full bg-[#00E676]" />
                  INDEXED IN POSTGRESQL + PGVECTOR
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[#474746]">
                <span>
                  LATENCY: <strong className="text-black font-bold">8.4MS [US-CENTRAL1]</strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  SEMANTIC COSINE THRESHOLD: <strong className="text-black font-bold">0.884</strong>
                </span>
                <span className="px-2 py-0.5 bg-[#00E676]/20 text-[#00873E] border border-[#00A34D] font-bold text-[10px]">
                  ● STATE: PRODUCTION STABLE
                </span>
              </div>
            </div>

            {/* Editorial Scaffolding & Title Block */}
            <div className="w-full px-4 md:px-8 pt-10 pb-8 bg-[#FCF9F3]">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CCFF00] text-black font-mono text-xs font-black uppercase tracking-wider mb-6 border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
                <span className="inline-block w-2.5 h-2.5 bg-black" />
                AI-POWERED ALUMNI INTELLIGENCE // GOOGLE CLOUD &amp; PGVECTOR
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-8 space-y-4">
                  <h1 className="font-headline text-4xl sm:text-5xl lg:text-[62px] lg:leading-[1.05] font-black uppercase tracking-tighter text-black">
                    Where Alumni Networks Power{" "}
                    <span className="bg-[#CCFF00] px-2 py-0.5 border-2 border-black shadow-[4px_4px_0px_0px_#000000] inline-block mt-1">
                      Fast-Track Careers.
                    </span>
                  </h1>
                </div>
                <div className="lg:col-span-4 pb-1">
                  <div className="p-4 bg-[#F7F4EE] border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
                    <div className="font-mono text-[10px] font-bold text-[#1D4ED8] uppercase mb-1">
                      // MISSION PROTOCOL
                    </div>
                    <p className="font-serif text-lg text-[#1A1A1A] italic leading-snug">
                      Connecting students with verified alumni champions via 384-dimensional vector embeddings, driving warm referrals across a transparent, state-governed hiring lifecycle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Row & Direct Vector Prompt */}
              <div className="mt-8 pt-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-[#FF5500] text-white font-mono text-sm font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer"
                >
                  Create Free Fellow Account →
                </Link>
                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-[#FCF9F3] text-black font-mono text-sm font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-[#EFECE4] transition-all cursor-pointer"
                >
                  Explore Directory [1,248+]
                </Link>
                <div className="sm:ml-auto flex items-center gap-2 font-mono text-xs font-bold uppercase text-black bg-[#EFECE4] px-3 py-2 border border-black">
                  <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Dual-Handshake Institutional Auth Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Interactive Broad-Search Terminal Console */}
            <div className="w-full bg-[#EFECE4] px-4 md:px-8 py-6 border-t-2 border-black">
              <div className="max-w-6xl mx-auto flex flex-col gap-3">
                <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-[#474746]">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#FF5500]" />
                    // INSTANT EMBEDDING LOOKUP ENGINE
                  </span>
                  <span className="bg-black text-[#CCFF00] px-2 py-0.5 border border-black text-[11px]">
                    INDEX: pgv_alumni_embeddings_hnsw
                  </span>
                </div>

                <form onSubmit={handleComputeMatch} className="flex flex-col md:flex-row items-stretch bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
                  <div className="flex items-center px-4 py-3 bg-[#FCF9F3] border-b md:border-b-0 md:border-r-2 border-black text-black font-mono text-xs font-bold uppercase whitespace-nowrap">
                    <Search className="w-4 h-4 mr-2 text-[#1D4ED8]" />
                    <span>VECTOR QUERY:</span>
                  </div>
                  <input
                    value={vectorQuery}
                    onChange={(e) => setVectorQuery(e.target.value)}
                    placeholder="e.g. Distributed systems engineer with Kubernetes expertise willing to mentor underrepresented graduates..."
                    type="text"
                    className="w-full px-4 py-3 bg-transparent font-headline text-sm text-black focus:outline-none placeholder:italic placeholder:text-[#635F57] font-medium"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#CCFF00] text-black font-mono text-xs font-black uppercase hover:bg-black hover:text-[#CCFF00] whitespace-nowrap border-t md:border-t-0 md:border-l-2 border-black transition-colors cursor-pointer"
                  >
                    Compute Match (384-D) ↵
                  </button>
                </form>

                {/* Semantic pill tokens */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono text-xs font-bold text-black uppercase mr-1">
                    Target Hubs:
                  </span>
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="px-2.5 py-1 bg-white hover:bg-black hover:text-[#CCFF00] text-black font-mono text-xs font-bold border border-black shadow-[2px_2px_0px_0px_#000000] transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic inline match result preview */}
                {showMatchResult && (
                  <div className="mt-2 p-3.5 bg-black text-white flex flex-col md:flex-row md:items-center justify-between font-mono text-xs border-2 border-black shadow-[4px_4px_0px_0px_#000000] gap-2 animate-fade-in">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-[#CCFF00] text-black font-black uppercase text-[10px]">
                        ★ {matchedCandidate.similarity}
                      </span>
                      <span className="font-bold">{matchedCandidate.name}</span>
                      <span className="text-neutral-300">({matchedCandidate.role})</span>
                      <span className="text-[#00E676] font-bold">• Status: {matchedCandidate.status}</span>
                    </div>
                    <Link
                      href="/directory"
                      className="text-[#CCFF00] font-black underline hover:text-white uppercase"
                    >
                      Inspect Dossier →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Telemetry Strip Metrics (4 Columns) */}
            <div className="w-full grid grid-cols-2 lg:grid-cols-4 bg-black gap-[2px] border-t-2 border-black">
              <div className="p-6 bg-[#FCF9F3] flex flex-col justify-between hover:bg-[#F7F4EE] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase text-[#474746] font-bold">
                    [ TELEMETRY // 01 ]
                  </span>
                  <span className="w-2 h-2 bg-[#00E676] rounded-full" />
                </div>
                <div className="my-4">
                  <div className="font-headline text-4xl font-black text-black tracking-tight">
                    1,248+
                  </div>
                  <div className="font-headline text-sm font-bold text-black uppercase mt-1">
                    Verified Alumni Fellows
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[#474746] border-t border-black/10 pt-2">
                  Auth via .edu / SAML SSO
                </div>
              </div>

              <div className="p-6 bg-[#FCF9F3] flex flex-col justify-between hover:bg-[#F7F4EE] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase text-[#1D4ED8] font-bold">
                    [ TELEMETRY // 02 ]
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#1D4ED8] text-white text-[9px] font-black font-mono">
                    HIGH SIGNAL
                  </span>
                </div>
                <div className="my-4">
                  <div className="font-headline text-4xl font-black text-[#1D4ED8] tracking-tight">
                    88.4%
                  </div>
                  <div className="font-headline text-sm font-bold text-black uppercase mt-1">
                    Warm Referral Interview Rate
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[#474746] border-t border-black/10 pt-2">
                  Vs. 3.2% cold applicant benchmark
                </div>
              </div>

              <div className="p-6 bg-[#FCF9F3] flex flex-col justify-between hover:bg-[#F7F4EE] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase text-black font-bold">
                    [ TELEMETRY // 03 ]
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#CCFF00] text-black text-[9px] font-black font-mono border border-black">
                    AI EMBED
                  </span>
                </div>
                <div className="my-4">
                  <div className="font-headline text-4xl font-black text-black tracking-tight">
                    384-Dim
                  </div>
                  <div className="font-headline text-sm font-bold text-black uppercase mt-1">
                    Gemini Embedding Precision
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[#474746] border-t border-black/10 pt-2">
                  PostgreSQL pgvector cosine retrieval
                </div>
              </div>

              <div className="p-6 bg-[#FCF9F3] flex flex-col justify-between hover:bg-[#F7F4EE] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase text-[#FF5500] font-bold">
                    [ TELEMETRY // 04 ]
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#FF5500] text-white text-[9px] font-black font-mono">
                    PARTNERS
                  </span>
                </div>
                <div className="my-4">
                  <div className="font-headline text-4xl font-black text-[#FF5500] tracking-tight">
                    40+
                  </div>
                  <div className="font-headline text-sm font-bold text-black uppercase mt-1">
                    Partner Tech Corporations
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[#474746] border-t border-black/10 pt-2">
                  Direct requisition mapping conduits
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 2: REFERRAL LIFECYCLE STATE MACHINE */}
          {/* ========================================================================= */}
          <section className="w-full bg-[#EFECE4] py-16 px-4 md:px-8 border-b-2 border-black">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-xs uppercase text-black font-bold tracking-wider mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#CCFF00] border border-black text-black font-black">
                      PROTOCOL SPECIFICATION
                    </span>
                    <span>// LIFECYCLE DISPATCH</span>
                  </div>
                  <h2 className="font-headline text-3xl md:text-4xl uppercase text-black font-black tracking-tight">
                    No Generic Cold Applications. Structured Warm Referrals.
                  </h2>
                </div>
                <div className="font-mono text-xs font-bold text-black uppercase bg-white px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
                  STATE MACHINE ENGINE: pg_referral_fsm_v4
                </div>
              </div>

              {/* State Machine Stepper Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Step 01 */}
                <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
                      <span className="font-mono text-xs font-black uppercase text-black">PHASE 01</span>
                      <span className="px-2 py-0.5 bg-[#EFECE4] border border-black text-black font-mono text-[10px] font-bold uppercase">
                        STATE: PENDING
                      </span>
                    </div>
                    <div className="font-headline text-lg font-black text-black mb-2 uppercase leading-snug">
                      Targeted Dossier Submission
                    </div>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Candidate selects an open requisition from verified alumni corporate boards, attaching a tailored resume and personalized match rationale.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-black font-mono text-xs uppercase text-black font-bold flex justify-between items-center">
                    <span className="text-[#FF5500] font-black">█ SLA: 72H RESPONSE</span>
                    <span className="text-black font-black text-base">→</span>
                  </div>
                </div>

                {/* Step 02 */}
                <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
                      <span className="font-mono text-xs font-black uppercase text-black">PHASE 02</span>
                      <span className="px-2 py-0.5 bg-[#1D4ED8] text-white font-mono text-[10px] font-bold uppercase">
                        STATE: SCREENED
                      </span>
                    </div>
                    <div className="font-headline text-lg font-black text-black mb-2 uppercase leading-snug">
                      Peer Verification &amp; Review
                    </div>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Alumnus conducts an asynchronous review or conducts a 15-minute flash screening session, offering inline code/portfolio annotations.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-black font-mono text-xs uppercase text-black font-bold flex justify-between items-center">
                    <span className="text-[#1D4ED8] font-black">█ DUAL SIGN-OFF</span>
                    <span className="text-black font-black text-base">→</span>
                  </div>
                </div>

                {/* Step 03 */}
                <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
                      <span className="font-mono text-xs font-black uppercase text-black">PHASE 03</span>
                      <span className="px-2 py-0.5 bg-[#FF5500] text-white font-mono text-[10px] font-bold uppercase">
                        STATE: REFERRED
                      </span>
                    </div>
                    <div className="font-headline text-lg font-black text-black mb-2 uppercase leading-snug">
                      Internal Portal Dispatch
                    </div>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Alumnus submits candidate directly into internal corporate routing (Workday, Greenhouse, Taleo) with candidate identification token.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-black font-mono text-xs uppercase text-black font-bold flex justify-between items-center">
                    <span className="text-black font-black">█ REQ HASH ISSUED</span>
                    <span className="text-black font-black text-base">→</span>
                  </div>
                </div>

                {/* Step 04 */}
                <div className="p-5 bg-[#CCFF00] border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
                      <span className="font-mono text-xs font-black uppercase text-black">PHASE 04</span>
                      <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-mono text-[10px] font-black uppercase">
                        STATE: HIRED
                      </span>
                    </div>
                    <div className="font-headline text-lg font-black text-black mb-2 uppercase leading-snug">
                      Offer Cleared &amp; Celebrated
                    </div>
                    <p className="font-headline text-sm text-black leading-relaxed font-medium">
                      Candidate accepts offer letter. Platform archives interview cycle, unlocks alumni mentor badges, and updates institutional metrics.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t-2 border-black font-mono text-xs uppercase text-black font-black flex justify-between items-center">
                    <span>█ MILESTONE LEDGER</span>
                    <span className="text-black font-black text-base">✓</span>
                  </div>
                </div>
              </div>

              {/* State Flow Interactive Monitor Graphic */}
              <div className="w-full bg-black text-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs uppercase">
                  <div className="flex items-center gap-2 text-[#CCFF00]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-ping" />
                    <span className="font-bold">ACTIVE LIVE TRANSMISSIONS: 147 CANDIDATES IN FLIGHT</span>
                  </div>
                  <div className="flex items-center gap-6 text-[#EFECE4]">
                    <span>
                      AVG STAGE CONVERSION: <strong className="text-[#CCFF00]">71.8%</strong>
                    </span>
                    <span>
                      MEDIAN REFERRAL LATENCY: <strong className="text-[#CCFF00]">3.4 DAYS</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 3: THE 5 ESSENTIAL PILLARS (EDITORIAL MOSAIC) */}
          {/* ========================================================================= */}
          <section className="w-full bg-[#FCF9F3] py-16 px-4 md:px-8 border-b-2 border-black">
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-4 border-b-2 border-black">
                <div className="lg:col-span-8">
                  <div className="font-mono text-xs uppercase text-[#1D4ED8] font-bold tracking-wider mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#1D4ED8] text-white font-black">05 PILLARS</span>
                    <span>INFRASTRUCTURE FRAMEWORK</span>
                  </div>
                  <h2 className="font-headline text-3xl md:text-5xl uppercase tracking-tighter text-black font-black">
                    The Complete Architectural Ecosystem.
                  </h2>
                </div>
                <div className="lg:col-span-4 font-headline text-base text-[#474746] leading-relaxed font-medium">
                  Engineered to dismantle friction in collegiate mentorship, internal corporate referrals, and graduate career acceleration.
                </div>
              </div>

              {/* Pillars Bento Mosaic */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pillar 01: Directory & Geo-Map */}
                <div className="lg:col-span-2 p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
                      <span className="font-mono text-xs font-bold uppercase text-[#474746]">
                        [ PILLAR 01 // DIRECTORY &amp; CARTOGRAPHY ]
                      </span>
                      <span className="font-mono text-[11px] font-black uppercase bg-[#CCFF00] border border-black px-2 py-0.5 text-black">
                        HNSW COSINE INDEX
                      </span>
                    </div>
                    <h3 className="font-headline text-2xl font-black uppercase text-black mb-2">
                      Verified Alumni Directory &amp; Leaflet Geo-Map
                    </h3>
                    <p className="font-headline text-sm text-[#474746] max-w-2xl leading-relaxed">
                      Locate fellows across San Francisco, Seattle, London, Zurich, and Tokyo. Query by exact company division, tech stack, or graduate cohort year using 384-dimensional semantic similarity ranking.
                    </p>
                  </div>
                  {/* Geo Visual Location Canvas */}
                  <div className="mt-6 bg-[#FCF9F3] p-3 border-2 border-black">
                    <div className="w-full h-48 bg-[#0F172A] p-4 flex flex-col justify-between border border-black relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="relative z-10 flex justify-between items-start">
                        <span className="font-mono text-[10px] px-2 py-0.5 bg-[#CCFF00] text-black font-bold">
                          LEAFLET GEO-GRID
                        </span>
                        <span className="font-mono text-[10px] text-white">LAT: 37.7749° N, LON: 122.4194° W</span>
                      </div>
                      <div className="relative z-10 flex items-center justify-center gap-6 my-auto">
                        <div className="p-3 border border-white/40 bg-black/60 text-center">
                          <div className="font-headline text-xl font-bold text-white">412</div>
                          <div className="font-mono text-[9px] text-[#CCFF00]">SF BAY CLUSTER</div>
                        </div>
                        <div className="p-3 border border-white/40 bg-black/60 text-center">
                          <div className="font-headline text-xl font-bold text-white">284</div>
                          <div className="font-mono text-[9px] text-[#00E676]">SEATTLE INFRA</div>
                        </div>
                        <div className="p-3 border border-white/40 bg-black/60 text-center">
                          <div className="font-headline text-xl font-bold text-white">198</div>
                          <div className="font-mono text-[9px] text-[#FF5500]">NYC FINANCIAL</div>
                        </div>
                      </div>
                      <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-neutral-400">
                        <span>OPENSTREETMAP // CARTOCDN TILES</span>
                        <Link href="/directory" className="text-[#CCFF00] font-bold hover:underline">
                          OPEN INTERACTIVE MAP →
                        </Link>
                      </div>
                    </div>
                    <div className="flex justify-between items-center font-mono text-[11px] font-bold uppercase text-black pt-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00E676]" />
                        NODE: SF_BAY_AREA_CLUSTER (N=412)
                      </span>
                      <span className="bg-black text-[#CCFF00] px-1.5 py-0.5 text-[10px]">
                        GEO-INDEX: EPSG:4326 // LEAFLET
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 02: Career Hub */}
                <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
                      <span className="font-mono text-xs font-bold uppercase text-[#474746]">
                        [ PILLAR 02 // CAREERS ]
                      </span>
                      <span className="font-mono text-[11px] font-black uppercase bg-[#FF5500] text-white px-2 py-0.5 border border-black">
                        DIRECT DISPATCH
                      </span>
                    </div>
                    <h3 className="font-headline text-2xl font-black uppercase text-black mb-2">
                      Career &amp; Referral Hub
                    </h3>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Live requisition boards linked to alumni referral quotas. Direct submission pipelines bypass general applicant pools with structured endorsement packets.
                    </p>
                  </div>
                  <div className="mt-6 p-4 bg-[#FCF9F3] border-2 border-black text-black font-mono text-xs space-y-2">
                    <div className="flex justify-between border-b border-black/10 pb-1.5">
                      <span className="font-bold uppercase">ACTIVE REQUISITIONS</span>
                      <span className="font-black text-[#FF5500]">342 OPEN</span>
                    </div>
                    <div className="flex justify-between border-b border-black/10 pb-1.5">
                      <span className="font-bold uppercase">INTERNAL REVIEWS</span>
                      <span className="font-black text-[#1D4ED8]">48H SLA</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="font-bold uppercase">TOP DISCIPLINE</span>
                      <span className="font-black text-black">SYSTEMS ARCH</span>
                    </div>
                  </div>
                </div>

                {/* Pillar 03: Mentorship & Flash Sessions */}
                <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
                      <span className="font-mono text-xs font-bold uppercase text-[#474746]">
                        [ PILLAR 03 // FELLOWSHIPS ]
                      </span>
                      <span className="font-mono text-[11px] font-black uppercase bg-[#1D4ED8] text-white px-2 py-0.5 border border-black">
                        FLASH 1-ON-1
                      </span>
                    </div>
                    <h3 className="font-headline text-2xl font-black uppercase text-black mb-2">
                      Mentorship &amp; 1-on-1 Sessions
                    </h3>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      High-impact 15-to-30 minute micro-consults. Frictionless calendar sync with Google Meet integration, paired agenda topics, and dual-confirmed handshakes.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase pt-3 border-t-2 border-black">
                    <span className="font-bold text-[#474746]">
                      SLOT CAPACITY: <strong className="text-black font-black">120/WK</strong>
                    </span>
                    <Link
                      href="/mentorship"
                      className="font-black text-white bg-black px-3 py-1.5 hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                    >
                      Book Flash →
                    </Link>
                  </div>
                </div>

                {/* Pillar 04: Events & RSVPs */}
                <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
                      <span className="font-mono text-xs font-bold uppercase text-[#474746]">
                        [ PILLAR 04 // SYMPOSIA ]
                      </span>
                      <span className="font-mono text-[11px] font-black uppercase bg-[#EFECE4] text-black border border-black px-2 py-0.5">
                        CALENDAR SYNC
                      </span>
                    </div>
                    <h3 className="font-headline text-2xl font-black uppercase text-black mb-2">
                      Events &amp; Capacity RSVPs
                    </h3>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Private collegiate salons, AI masterclasses, and regional alumni dinners. Strict capacity enforcement with automated waitlist elevation and QR credentials.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase pt-3 border-t-2 border-black">
                    <span className="font-bold text-[#474746]">UPCOMING: NY TECH SALON</span>
                    <span className="font-black px-2 py-0.5 bg-[#FF5500] text-white border border-black">
                      T-MINUS 6D
                    </span>
                  </div>
                </div>

                {/* Pillar 05: Feed & Milestones */}
                <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
                      <span className="font-mono text-xs font-bold uppercase text-[#474746]">
                        [ PILLAR 05 // CHRONICLE ]
                      </span>
                      <span className="font-mono text-[11px] font-black uppercase bg-[#00E676]/30 text-black border border-black px-2 py-0.5">
                        LEDGER VERIFIED
                      </span>
                    </div>
                    <h3 className="font-headline text-2xl font-black uppercase text-black mb-2">
                      Community Feed &amp; Milestones
                    </h3>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      A high-signal academic broadsheet wall documenting promotions, peer-reviewed publications, open-source releases, and confirmed offers.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase pt-3 border-t-2 border-black">
                    <span className="font-bold text-[#474746]">LATEST: 32 OFFERS</span>
                    <Link
                      href="/announcements"
                      className="font-black text-black underline hover:text-[#FF5500]"
                    >
                      Read Gazette →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 4: ROLE-AWARE ARCHITECTURE (4 PERSONAS) */}
          {/* ========================================================================= */}
          <section className="w-full bg-[#EFECE4] py-16 px-4 md:px-8 border-b-2 border-black">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-xs uppercase text-black font-bold tracking-wider mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FF5500] text-white font-black">04 PERSONAS</span>
                    <span>MULTI-TENANT ACCESS</span>
                  </div>
                  <h2 className="font-headline text-3xl md:text-4xl uppercase text-black font-black tracking-tight">
                    Tailored Consoles for Every Stakeholder.
                  </h2>
                </div>
                <div className="font-mono text-xs font-bold text-black uppercase bg-white px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
                  RBAC-LEVEL-4 PERMISSIONS
                </div>
              </div>

              {/* Segmented Persona Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Persona 1: Student */}
                <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div className="space-y-3">
                    <div className="font-mono text-xs uppercase text-[#1D4ED8] font-black">
                      01 // UNDERGRAD &amp; GRAD
                    </div>
                    <h4 className="font-headline text-xl font-black uppercase text-black">
                      Student Candidates
                    </h4>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Generate tailored referral packets, query alumni vectors by match relevance, and lock in flash mentoring with domain leaders.
                    </p>
                    <ul className="font-mono text-[11px] uppercase text-black space-y-1.5 pt-2 border-t border-black/10 font-bold">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#1D4ED8]" />
                        One-Click Referral Dossiers
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#1D4ED8]" />
                        AI Resume Alignment Score
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#1D4ED8]" />
                        Flash Slot Reservations
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-3 border-t-2 border-black">
                    <Link
                      href="/login"
                      className="font-mono text-xs font-black uppercase text-black hover:text-[#1D4ED8] flex items-center justify-between"
                    >
                      <span>Student Entry</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Persona 2: Alumni */}
                <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div className="space-y-3">
                    <div className="font-mono text-xs uppercase text-[#FF5500] font-black">
                      02 // INDUSTRY FELLOW
                    </div>
                    <h4 className="font-headline text-xl font-black uppercase text-black">
                      Verified Alumni
                    </h4>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Pay forward opportunities effortlessly. Manage pre-screened referral requests with preset quotas and host structured 15-min chats.
                    </p>
                    <ul className="font-mono text-[11px] uppercase text-black space-y-1.5 pt-2 border-t border-black/10 font-bold">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#FF5500]" />
                        Cap Monthly Referrals
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#FF5500]" />
                        Pre-vetted Student Profiles
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#FF5500]" />
                        Verified Company Badging
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-3 border-t-2 border-black">
                    <Link
                      href="/login"
                      className="font-mono text-xs font-black uppercase text-black hover:text-[#FF5500] flex items-center justify-between"
                    >
                      <span>Alumni Portal</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Persona 3: Faculty */}
                <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div className="space-y-3">
                    <div className="font-mono text-xs uppercase text-black font-black">
                      03 // ACADEMIC LABS
                    </div>
                    <h4 className="font-headline text-xl font-black uppercase text-black">
                      Faculty &amp; Labs
                    </h4>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Bridge classroom research directly to industry labs. Track where graduates land and coordinate corporate grant co-sponsorships.
                    </p>
                    <ul className="font-mono text-[11px] uppercase text-black space-y-1.5 pt-2 border-t border-black/10 font-bold">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-black" />
                        Research Lab Placements
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-black" />
                        Guest Lecturer Dispatch
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-black" />
                        Thesis Industry Advisers
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-3 border-t-2 border-black">
                    <Link
                      href="/login"
                      className="font-mono text-xs font-black uppercase text-black hover:text-[#1D4ED8] flex items-center justify-between"
                    >
                      <span>Faculty Access</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Persona 4: Administrator */}
                <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div className="space-y-3">
                    <div className="font-mono text-xs uppercase text-black font-black">
                      04 // ADVANCEMENT
                    </div>
                    <h4 className="font-headline text-xl font-black uppercase text-black">
                      Dean &amp; Advancement
                    </h4>
                    <p className="font-headline text-sm text-[#474746] leading-relaxed">
                      Audit live placement analytics, export accreditation telemetry, verify student credentials, and nurture lifelong affinity.
                    </p>
                    <ul className="font-mono text-[11px] uppercase text-black space-y-1.5 pt-2 border-t border-black/10 font-bold">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#00E676]" />
                        Real-Time Employment
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#00E676]" />
                        SAML / Okta Integration
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#00E676]" />
                        Audit-Ready Reporting
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-3 border-t-2 border-black">
                    <Link
                      href="/login"
                      className="font-mono text-xs font-black uppercase text-black hover:text-[#FF5500] flex items-center justify-between"
                    >
                      <span>Admin Console</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 5: TECHNICAL ARCHITECTURE & PGVECTOR QUERY */}
          {/* ========================================================================= */}
          <section className="w-full bg-[#FCF9F3] py-16 px-4 md:px-8 border-b-2 border-black">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Rationale & Google Workspace Native Suite */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="font-mono text-xs uppercase text-[#1D4ED8] font-bold tracking-wider flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#1D4ED8] text-white font-black">TOPOLOGY</span>
                    <span>ENGINE SPECIFICATION</span>
                  </div>
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-black">
                    Sub-10ms Vector Proximity Search.
                  </h2>
                  <p className="font-headline text-sm text-[#474746] leading-relaxed">
                    Built atop Google Gemini text embeddings and PostgreSQL{" "}
                    <code className="font-mono text-xs bg-[#CCFF00] border border-black px-1.5 py-0.5 text-black font-bold">
                      pgvector
                    </code>{" "}
                    HNSW indexing. We calculate multidimensional proximity across alumni technical competencies, departmental lineage, and current hiring demand.
                  </p>

                  <div className="pt-2 space-y-2 font-mono text-xs uppercase">
                    <div className="p-2.5 bg-white border border-black text-black flex justify-between shadow-[2px_2px_0px_0px_#000000]">
                      <span className="font-bold">EMBEDDING MODEL</span>
                      <span className="font-black text-[#1D4ED8]">GOOGLE-GEMINI-V2</span>
                    </div>
                    <div className="p-2.5 bg-white border border-black text-black flex justify-between shadow-[2px_2px_0px_0px_#000000]">
                      <span className="font-bold">INDEX ALGORITHM</span>
                      <span className="font-black">HNSW (m=16, ef=64)</span>
                    </div>
                    <div className="p-2.5 bg-white border border-black text-black flex justify-between shadow-[2px_2px_0px_0px_#000000]">
                      <span className="font-bold">SIMILARITY METRIC</span>
                      <span className="font-black text-[#FF5500]">COSINE DISTANCE (&lt;=&gt;)</span>
                    </div>
                    <div className="p-2.5 bg-white border border-black text-black flex justify-between shadow-[2px_2px_0px_0px_#000000]">
                      <span className="font-bold">QUERY LATENCY</span>
                      <span className="font-black text-[#00A34D]">7.2ms AT 100K NODES</span>
                    </div>
                  </div>

                  {/* Native Google Workspace Badge */}
                  <div className="p-4 bg-[#EFECE4] border-2 border-black text-black font-mono text-xs space-y-1 shadow-[3px_3px_0px_0px_#000000]">
                    <div className="font-black uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#00E676]" />
                      [ NATIVE GOOGLE WORKSPACE PROTOCOLS ]
                    </div>
                    <p className="font-headline text-xs text-[#474746] pt-1">
                      Direct sync with Google Calendar for flash availability, Google Docs for interactive dossier markup, and automated Gmail priority notification filters.
                    </p>
                  </div>
                </div>

                {/* Right: Raw SQL Query Terminal with neon syntax */}
                <div className="lg:col-span-7 bg-[#111827] text-white p-6 border-2 border-black shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 font-mono text-xs border-b border-gray-700 text-gray-400">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
                        SQL QUERY RUNNER // PRODUCTION NODE 01
                      </span>
                      <span className="px-2 py-0.5 bg-[#CCFF00] text-black font-bold text-[10px]">
                        READ COMMITTED
                      </span>
                    </div>
                    <pre className="font-mono text-xs text-gray-200 overflow-x-auto leading-relaxed">
                      <span className="text-[#6EE7B7]">-- Semantic Alumni Discovery via pgvector HNSW</span>
                      {"\n"}
                      <span className="text-[#93C5FD] font-bold">SELECT</span> 
                      {"\n    "}a.alumni_id,
                      {"\n    "}a.full_name,
                      {"\n    "}a.current_company,
                      {"\n    "}a.verified_role,
                      {"\n    "}
                      <span className="text-[#FDE047]">1</span> - (a.profile_embedding &lt;=&gt; q.query_vector){" "}
                      <span className="text-[#93C5FD] font-bold">AS</span> cosine_similarity
                      {"\n"}
                      <span className="text-[#93C5FD] font-bold">FROM</span> 
                      {"\n    "}institutional_alumni a,
                      {"\n    "}(
                      {"\n        "}
                      <span className="text-[#93C5FD] font-bold">SELECT</span> gemini_embed_text(
                      {"\n            "}
                      <span className="text-[#FDBA74]">&apos;Distributed systems, SRE, fault tolerance&apos;</span>
                      {"\n        "})::vector(<span className="text-[#FDE047]">384</span>){" "}
                      <span className="text-[#93C5FD] font-bold">AS</span> query_vector
                      {"\n    "}) q
                      {"\n"}
                      <span className="text-[#93C5FD] font-bold">WHERE</span> 
                      {"\n    "}a.referral_quota_active = <span className="text-[#CCFF00] font-bold">TRUE</span>
                      {"\n    "}<span className="text-[#93C5FD] font-bold">AND</span> a.verified_status = <span className="text-[#FDBA74]">&apos;ACCREDITED&apos;</span>
                      {"\n"}
                      <span className="text-[#93C5FD] font-bold">ORDER BY</span> 
                      {"\n    "}a.profile_embedding &lt;=&gt; q.query_vector <span className="text-[#93C5FD] font-bold">ASC</span>
                      {"\n"}
                      <span className="text-[#93C5FD] font-bold">LIMIT</span> <span className="text-[#FDE047]">5</span>;
                    </pre>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-700 flex items-center justify-between font-mono text-xs text-gray-400">
                    <span>
                      INDEX: <span className="text-[#CCFF00]">idx_alumni_hnsw</span>
                    </span>
                    <span className="px-2 py-0.5 bg-[#00E676]/20 text-[#00E676] font-bold">
                      TOTAL EXECUTION: 6.84ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 6: SOCIAL PROOF & ALUMNI SPOTLIGHT */}
          {/* ========================================================================= */}
          <section className="w-full bg-[#EFECE4] py-16 px-4 md:px-8 border-b-2 border-black">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-xs uppercase text-black font-bold tracking-wider mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#CCFF00] border border-black text-black font-black">
                      VERIFIED SPOTLIGHT
                    </span>
                    <span>// FELLOW TESTIMONIALS</span>
                  </div>
                  <h2 className="font-headline text-3xl md:text-4xl uppercase text-black font-black tracking-tight">
                    Verified Testimonials From Industry Champions.
                  </h2>
                </div>
                <div className="font-mono text-xs font-bold text-black uppercase bg-white px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
                  AUTHENTICATED ALUMNI NODES
                </div>
              </div>

              {/* Testimonial Broadsheet Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quote 1 */}
                <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                      <span className="px-2 py-0.5 bg-[#1D4ED8] text-white font-mono text-xs font-black uppercase">
                        GOOGLE CLOUD
                      </span>
                      <span className="font-mono text-xs text-[#474746] font-bold">[ CLASS OF &apos;18 ]</span>
                    </div>
                    <p className="font-serif text-lg text-black italic leading-snug pt-1">
                      &ldquo;Cold InMail was overwhelming and ineffective. PRO-ALUMN gave me pre-screened students from my alma mater whose background was mathematically aligned with our backend infra requisitions. Two hires closed in 60 days.&rdquo;
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-black/20">
                    <div className="font-headline text-sm font-black text-black uppercase">
                      Marcus Vance
                    </div>
                    <div className="font-mono text-[11px] text-[#474746] uppercase font-bold">
                      L6 Staff SRE • Google Cloud Storage
                    </div>
                  </div>
                </div>

                {/* Quote 2 */}
                <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                      <span className="px-2 py-0.5 bg-[#FF5500] text-white font-mono text-xs font-black uppercase">
                        AMAZON AWS
                      </span>
                      <span className="font-mono text-xs text-[#474746] font-bold">[ CLASS OF &apos;20 ]</span>
                    </div>
                    <p className="font-serif text-lg text-black italic leading-snug pt-1">
                      &ldquo;The 15-minute flash mentorship format completely changes the dynamic. It prevents conversational fatigue while allowing me to review portfolios rapidly and refer candidates directly to hiring directors.&rdquo;
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-black/20">
                    <div className="font-headline text-sm font-black text-black uppercase">
                      Elena Rostova
                    </div>
                    <div className="font-mono text-[11px] text-[#474746] uppercase font-bold">
                      SDE II • Amazon Elastic Kubernetes
                    </div>
                  </div>
                </div>

                {/* Quote 3 */}
                <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between hover:bg-[#FCF9F3] transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                      <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-mono text-xs font-black uppercase border border-black">
                        META AI
                      </span>
                      <span className="font-mono text-xs text-[#474746] font-bold">[ CLASS OF &apos;17 ]</span>
                    </div>
                    <p className="font-serif text-lg text-black italic leading-snug pt-1">
                      &ldquo;The state machine tracking offers peace of mind. Both the student and I know the exact status of the referral inside our system. No awkward follow-ups, just crisp computational accountability.&rdquo;
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-black/20">
                    <div className="font-headline text-sm font-black text-black uppercase">
                      Kareem Al-Sayed
                    </div>
                    <div className="font-mono text-[11px] text-[#474746] uppercase font-bold">
                      Senior Research Scientist • Meta AI
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 7: FINAL CALL TO ACTION BANNER (HIGH IMPACT CYBER LIME CONTAINER) */}
          {/* ========================================================================= */}
          <section className="w-full bg-[#CCFF00] text-black py-20 px-4 md:px-8 border-b-2 border-black relative">
            <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-6">
              <div className="font-mono text-xs font-black uppercase tracking-widest bg-black text-[#CCFF00] px-3 py-1 border border-black shadow-[2px_2px_0px_0px_#000000]">
                [ IMMEDIATE ACCREDITATION // DEPLOYED CAMPUS-WIDE ]
              </div>
              <h2 className="font-headline text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tighter max-w-4xl font-black leading-none">
                Want Direct Referrals &amp; Unrestricted Access To The Fellow Roster?
              </h2>
              <p className="font-headline text-base md:text-lg text-black max-w-2xl font-bold leading-normal">
                Join over 1,248 verified engineers, product architects, and institutional researchers across leading technology organisations worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-[#FF5500] text-white font-mono text-sm font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer"
                >
                  Create Free Fellow Account →
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white text-black font-mono text-sm font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-[#FCF9F3] transition-all cursor-pointer"
                >
                  Verify via Campus SSO
                </Link>
              </div>
              <div className="pt-6 font-mono text-xs font-bold text-black uppercase tracking-wider flex flex-wrap justify-center items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-black" />
                  ZERO PLATFORM FEES FOR STUDENTS
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-black" />
                  FERPA &amp; SOC-2 TYPE II CERTIFIED
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-black" />
                  INSTANT .EDU DUAL-HANDSHAKE
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* INSTITUTIONAL BROADSHEET FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[#FCF9F3] border-t-2 border-black">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 border-b-2 border-black">
          <div className="lg:col-span-4 p-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tracking-widest font-black text-black">/////</span>
                <span className="font-headline text-2xl font-black uppercase tracking-tight">
                  PRO-ALUMN
                </span>
              </div>
              <p className="font-headline text-sm text-[#474746] leading-relaxed">
                The collegiate broadsheet index and intellectual network for verified alumni, researchers, and professional fellows across accredited faculties.
              </p>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 border-2 border-black px-3 py-1.5 bg-[#EFECE4] font-mono text-xs uppercase text-black font-bold shadow-[2px_2px_0px_0px_#000000]">
                <span className="inline-block w-2 h-2 bg-[#00E676] rounded-full" />
                Google Cloud &amp; pgvector Cluster Active
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 p-8 border-b-2 md:border-b-0 lg:border-r-2 border-black space-y-4">
            <div className="font-mono text-xs text-black font-black uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF5500]" />
              [ INDEX DIRECTORY // SITEMAP ]
            </div>
            <ul className="space-y-2 font-mono text-xs uppercase font-bold">
              <li className="border-b border-black/15 pb-1.5">
                <Link href="/directory" className="hover:text-[#FF5500] flex justify-between items-center">
                  <span>01. Faculty &amp; Alumni Directory</span>
                  <span>→</span>
                </Link>
              </li>
              <li className="border-b border-black/15 pb-1.5">
                <Link href="/jobs" className="hover:text-[#FF5500] flex justify-between items-center">
                  <span>02. Dispatches &amp; Opportunities</span>
                  <span>→</span>
                </Link>
              </li>
              <li className="border-b border-black/15 pb-1.5">
                <Link href="/mentorship" className="hover:text-[#FF5500] flex justify-between items-center">
                  <span>03. Fellowships &amp; Mentorship</span>
                  <span>→</span>
                </Link>
              </li>
              <li className="border-b border-black/15 pb-1.5">
                <Link href="/announcements" className="hover:text-[#FF5500] flex justify-between items-center">
                  <span>04. Gazette &amp; Bulletins</span>
                  <span>→</span>
                </Link>
              </li>
              <li>
                <Link href="/education" className="hover:text-[#FF5500] flex justify-between items-center">
                  <span>05. Advanced Research Modules</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 p-8 border-b-2 md:border-b-0 lg:border-r-2 border-black space-y-4">
            <div className="font-mono text-xs text-black font-black uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#1D4ED8]" />
              [ PROTOCOLS // GOVERNANCE ]
            </div>
            <ul className="space-y-2 font-mono text-xs uppercase font-bold text-[#474746]">
              <li>
                <Link href="/help" className="hover:text-black block">
                  Academic Charter
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-black block">
                  Cryptographic Privacy Ledger
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-black block">
                  Terms of Affiliation
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-black block">
                  Peer Review Ethics
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-black block">
                  Vector Index Governance
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 p-8 flex flex-col justify-between space-y-6 bg-[#FCF9F3]">
            <div className="space-y-2">
              <div className="font-mono text-xs text-black font-black uppercase tracking-wider">
                [ TELEMETRY ]
              </div>
              <div className="font-mono text-xs space-y-1">
                <div className="text-black font-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00E676]" />
                  NODE: ACTIVE-01
                </div>
                <div className="text-[#474746] font-bold">LATENCY: 14MS</div>
                <div className="text-[#474746] font-bold">REGISTRY: VERIFIED</div>
              </div>
            </div>
            <div className="border-t-2 border-black pt-3 font-mono text-[11px] uppercase text-[#474746]">
              <span className="block font-black text-black">ACCREDITATION</span>
              Office of Academic Records
            </div>
          </div>
        </div>

        <div className="w-full px-4 md:px-8 py-4 bg-[#EFECE4] flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-black font-bold gap-2">
          <div>© 2025 PRO-ALUMN CONSORTIUM. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-[#CCFF00] border border-black text-black font-black">
              EDITION 14.8.2
            </span>
            <span>ENCRYPTED REPOSITORY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}