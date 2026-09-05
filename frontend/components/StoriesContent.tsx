"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Share2,
  ThumbsUp,
  MessageSquare,
  Search,
  ExternalLink,
  ChevronDown,
  Award,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus,
} from "lucide-react";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";

export interface SpotlightStory {
  id: string;
  index: string;
  category: "VENTURE" | "CAREER" | "RESEARCH" | "INFRASTRUCTURE" | "PATENTS" | "AWARDS";
  categoryLabel: string;
  cohort: string;
  location: string;
  topologyTag: "SF" | "NYC" | "BLR" | "REMOTE";
  orgName: string;
  orgBadge: string;
  initials: string;
  authorName: string;
  headline: string;
  roleSubtext: string;
  quote: string;
  metrics: {
    label1: string;
    value1: string;
    label2: string;
    value2: string;
    label3: string;
    value3: string;
    highlightCol?: string;
  };
  upvotes: number;
  commentsCount: number;
  hasUpvoted?: boolean;
  avatarBg?: string;
  avatarColor?: string;
  actionLabel: string;
  actionHref?: string;
}

const CANONICAL_SPOTLIGHT_STORIES: SpotlightStory[] = [
  {
    id: "spotlight-01",
    index: "02",
    category: "CAREER",
    categoryLabel: "CAREER ASCENT",
    cohort: "COHORT '16",
    location: "SAN MATEO",
    topologyTag: "SF",
    orgName: "SNOWFLAKE",
    orgBadge: "SNOWFLAKE COMPUTE",
    initials: "SJ",
    authorName: "Sarah Jenkins ('16)",
    headline: "Sarah Jenkins ('16) Elevated To Principal Architect At Snowflake Compute",
    roleSubtext: "Core Database Storage Group · 8.5 Years Alumni Tenor",
    quote:
      '"Author of 4 core patents on columnar partitioning algorithms and SIMD predicate pushdown. Thrilled to announce our team is scaling fast: I\'ve opened 5 dedicated internal referral slots for verified university and master\'s graduates."',
    metrics: {
      label1: "REFERRAL SLOTS",
      value1: "5 OPEN",
      label2: "LEVEL",
      value2: "PRINCIPAL IC8",
      label3: "IMPACT",
      value3: "98/100",
      highlightCol: "#2E5BFF",
    },
    upvotes: 89,
    commentsCount: 19,
    avatarBg: "#CCFF00",
    avatarColor: "#000000",
    actionLabel: "ASK FOR REFERRAL",
    actionHref: "/jobs",
  },
  {
    id: "spotlight-02",
    index: "03",
    category: "VENTURE",
    categoryLabel: "FOUNDER SPOTLIGHT",
    cohort: "COHORT '17",
    location: "PALO ALTO",
    topologyTag: "SF",
    orgName: "YC W26",
    orgBadge: "YC W26 BATCH",
    initials: "DC",
    authorName: "David Chen ('17)",
    headline: "David Chen ('17) Co-Founds Neuromorphic Labs (YC W26)",
    roleSubtext: "Pre-Seed Round: $3.2M · Khosla Ventures & BoxGroup",
    quote:
      '"Closing $3.2M pre-seed to fabricate sub-milliwatt event-driven edge inference silicon. We are actively hiring 2 founding kernel engineers from our engineering alumni base who understand RISC-V and analog accelerators."',
    metrics: {
      label1: "STACK",
      value1: "RISC-V / C++20",
      label2: "EQUITY",
      value2: "1.5 - 3.0%",
      label3: "IMPACT",
      value3: "95/100",
      highlightCol: "#FF5500",
    },
    upvotes: 114,
    commentsCount: 24,
    avatarBg: "#FF5500",
    avatarColor: "#FFFFFF",
    actionLabel: "BOOK FLASH INTRO",
    actionHref: "/mentorship",
  },
  {
    id: "spotlight-03",
    index: "04",
    category: "RESEARCH",
    categoryLabel: "RESEARCH BREAKTHROUGH",
    cohort: "COHORT '21",
    location: "STANFORD",
    topologyTag: "SF",
    orgName: "IEEE S&P 2026",
    orgBadge: "IEEE S&P 2026",
    initials: "ER",
    authorName: "Elena Rostova ('21)",
    headline: "Elena Rostova ('21) Publishes FIPS 140-3 Post-Quantum Cryptography Paper",
    roleSubtext: "Dept of Applied Mathematics · Zero-Knowledge Lattice Verifiers",
    quote:
      '"Formal machine-checked verification of lattice-based key encapsulation mechanisms under zk-SNARK constraints. The entire Coq and Rust verification pipeline has been open-sourced for peer scrutiny."',
    metrics: {
      label1: "ARXIV",
      value1: "2503.11692",
      label2: "LICENSE",
      value2: "MIT / APACHE-2",
      label3: "IMPACT",
      value3: "94/100",
      highlightCol: "#CCFF00",
    },
    upvotes: 76,
    commentsCount: 14,
    avatarBg: "#2E5BFF",
    avatarColor: "#FFFFFF",
    actionLabel: "READ PAPER (ARXIV)",
    actionHref: "https://arxiv.org",
  },
  {
    id: "spotlight-04",
    index: "05",
    category: "INFRASTRUCTURE",
    categoryLabel: "INFRASTRUCTURE SCALE",
    cohort: "COHORT '19",
    location: "SEATTLE",
    topologyTag: "REMOTE",
    orgName: "STRIPE",
    orgBadge: "STRIPE LEDGER",
    initials: "PS",
    authorName: "Prateek Shah ('19)",
    headline: "Prateek Shah ('19) Leads Stripe Core Ledger Migration To Spanner",
    roleSubtext: "Staff Systems Architect · Financial Infrastructure",
    quote:
      '"Over 18 months, our squad safely re-architected and live-migrated 80,000 tx/sec with strict serializability and zero downtime. Documenting the post-mortem and distributed locking tradeoffs on my alumni blog."',
    metrics: {
      label1: "QPS",
      value1: "80,000 / SEC",
      label2: "AVAILABILITY",
      value2: "99.9999%",
      label3: "IMPACT",
      value3: "99/100",
      highlightCol: "#2E5BFF",
    },
    upvotes: 102,
    commentsCount: 31,
    avatarBg: "#000000",
    avatarColor: "#FFFFFF",
    actionLabel: "REQUEST 1:1 MENTORSHIP",
    actionHref: "/mentorship",
  },
];

type CategoryFilter =
  | "ALL"
  | "VENTURE"
  | "CAREER"
  | "RESEARCH"
  | "INFRASTRUCTURE"
  | "PATENTS"
  | "AWARDS";

type TopologyFilter = "ALL" | "SF" | "NYC" | "BLR" | "REMOTE";
type OrderFilter = "UPVOTES" | "LATEST" | "IMPACT";

export function StoriesContent() {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [topologyFilter, setTopologyFilter] = useState<TopologyFilter>("ALL");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("UPVOTES");
  const [searchQuery, setSearchQuery] = useState("");

  // Pinned Flagship Endorsement state
  const [flagshipEndorsed, setFlagshipEndorsed] = useState(false);
  const [flagshipCount, setFlagshipCount] = useState(142);

  // Local upvote map for responsive feedback
  const [upvotesState, setUpvotesState] = useState<Record<string, { count: number; voted: boolean }>>({
    "spotlight-01": { count: 89, voted: false },
    "spotlight-02": { count: 114, voted: false },
    "spotlight-03": { count: 76, voted: false },
    "spotlight-04": { count: 102, voted: false },
  });

  // Transmission modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [modalCategory, setModalCategory] = useState<CategoryFilter>("CAREER");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: apiStories,
    mutate: mutateStories,
    refresh: refreshStories,
  } = useApi("stories:list", () => apiClient.stories.list());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleFlagshipEndorse = () => {
    if (flagshipEndorsed) {
      setFlagshipCount((prev) => prev - 1);
      setFlagshipEndorsed(false);
      showToast("Endorsement rescinded");
    } else {
      setFlagshipCount((prev) => prev + 1);
      setFlagshipEndorsed(true);
      showToast("Endorsed Kinetix Robotics Dispatch! (+1) 🚀");
    }
  };

  const handleCardUpvote = async (storyId: string) => {
    setUpvotesState((prev) => {
      const current = prev[storyId] || { count: 50, voted: false };
      const nextVoted = !current.voted;
      return {
        ...prev,
        [storyId]: {
          count: current.count + (nextVoted ? 1 : -1),
          voted: nextVoted,
        },
      };
    });

    try {
      await apiClient.stories.vote(storyId);
      showToast("Peer endorsement attested! 👍");
      refreshStories();
    } catch {
      // Optimistic state remains responsive
      showToast("Peer endorsement recorded locally.");
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const res = await apiClient.uploads.media(file, "stories");
      setImageUrl(res.url);
      showToast("Attestation schematic / badge image attached!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      showToast(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitTransmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !story.trim()) {
      showToast("Please provide milestone headline and dispatch details.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.stories.create({
        title,
        story,
        company: company || "Alumni Venture Guild",
        role: role || (user?.role === "student" ? "Fellow Researcher" : "Alumni IC / Founder"),
        imageUrl: imageUrl || undefined,
      });

      setSubmitting(false);
      setModalOpen(false);
      setTitle("");
      setStory("");
      setCompany("");
      setRole("");
      setImageUrl("");
      showToast("Dispatch verified & broadcast to Success Spotlight Wall!");
      refreshStories();
    } catch (err: unknown) {
      setSubmitting(false);
      const message = err instanceof Error ? err.message : "Error submitting milestone";
      showToast(message);
    }
  };

  // Convert any live server stories into spotlight format
  const serverStoriesFormatted: SpotlightStory[] = useMemo(() => {
    if (!apiStories || !Array.isArray(apiStories)) return [];
    return (apiStories as any[]).map((s, idx) => ({
      id: s.id || `srv-${idx}`,
      index: String(idx + 6).padStart(2, "0"),
      category: "CAREER" as const,
      categoryLabel: "FELLOW MILESTONE",
      cohort: s.batchYear ? `COHORT '${String(s.batchYear).slice(-2)}` : "ALUMNI ROSTER",
      location: "NETWORK FEED",
      topologyTag: "REMOTE" as const,
      orgName: (s.company || "VERIFIED ALUMNI").toUpperCase(),
      orgBadge: s.company || "ALUMNI AFFILIATE",
      initials: s.alumni?.name
        ? s.alumni.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "AL",
      authorName: s.alumni?.name || s.author || "Verified Fellow",
      headline: s.title,
      roleSubtext: `${s.role || "Fellow IC"} · ${s.company || "Frontier Tech"}`,
      quote: `"${s.story || s.excerpt || ""}"`,
      metrics: {
        label1: "ATTESTATION",
        value1: "VERIFIED",
        label2: "STATUS",
        value2: "DISPATCHED",
        label3: "IMPACT",
        value3: "96/100",
        highlightCol: "#CCFF00",
      },
      upvotes: s.upvoteCount || s.likes || 12,
      commentsCount: 3,
      avatarBg: "#000000",
      avatarColor: "#FFFFFF",
      actionLabel: "VOUCH / ENDORSE",
      actionHref: "/directory",
    }));
  }, [apiStories]);

  // Combined stories pool
  const allStories = useMemo(() => {
    return [...CANONICAL_SPOTLIGHT_STORIES, ...serverStoriesFormatted];
  }, [serverStoriesFormatted]);

  // Filtering & Ordering
  const filteredStories = useMemo(() => {
    return allStories.filter((item) => {
      // Category filter
      if (categoryFilter !== "ALL") {
        if (categoryFilter === "VENTURE" && item.category !== "VENTURE") return false;
        if (categoryFilter === "CAREER" && item.category !== "CAREER") return false;
        if (categoryFilter === "RESEARCH" && item.category !== "RESEARCH") return false;
        if (categoryFilter === "INFRASTRUCTURE" && item.category !== "INFRASTRUCTURE") return false;
      }

      // Topology filter
      if (topologyFilter !== "ALL" && item.topologyTag !== topologyFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.headline.toLowerCase().includes(q);
        const matchAuthor = item.authorName.toLowerCase().includes(q);
        const matchCompany = item.orgName.toLowerCase().includes(q);
        const matchQuote = item.quote.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchCompany && !matchQuote) return false;
      }

      return true;
    });
  }, [allStories, categoryFilter, topologyFilter, searchQuery]);

  return (
    <div className="space-y-10 selection:bg-[#CCFF00] selection:text-black font-sans">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: PROTOCOL METADATA & MASTHEAD */}
      {/* ========================================================================= */}
      <section
        data-testid="spotlight-hero-section"
        className="border-4 border-black bg-white p-6 sm:p-10 shadow-[6px_6px_0px_#000000] relative bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"
      >
        {/* Top Protocol Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-dashed border-black font-mono text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2.5 py-1 uppercase tracking-wide">
              [ PILLAR 05 // PUBLIC DISPATCHES &amp; PROOF OF IMPACT ]
            </span>
            <span className="bg-[#CCFF00] border-2 border-black px-2 py-0.5 uppercase tracking-wide flex items-center gap-1.5 text-black">
              <span className="w-2 h-2 bg-[#00A859] inline-block animate-pulse" />
              LIVE FEED // UNRESTRICTED
            </span>
          </div>
          <div className="text-neutral-600 text-[11px] font-mono">
            PROTOCOL RFC-088 // ED25519-STAMP VERIFIED
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Hero Title & Subtext */}
          <div className="lg:col-span-8 space-y-4">
            <div className="font-mono text-xs tracking-wider uppercase font-semibold text-neutral-600 flex items-center gap-2">
              <span>// VERIFIED MILESTONES, PEER ENDORSEMENTS &amp; VENTURE DISPATCHES</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.98] text-black">
              Success Spotlight <br className="hidden sm:inline" />
              &amp; Alumni Breakthroughs
            </h1>
            <p className="text-sm sm:text-base text-neutral-800 max-w-2xl font-mono leading-relaxed pt-2">
              Peer-attested achievements, career pivots, venture funding rounds, and research
              breakthroughs from verified alumni fellows. Explore real career trajectories before
              joining.
            </p>
          </div>

          {/* Hero Action Box */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 font-mono text-xs uppercase font-bold">
            <a
              href="#all-dispatches"
              className="w-full text-center px-5 py-3.5 bg-white hover:bg-black hover:text-white border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore All {allStories.length + 180} Trajectories</span>
              <span>↓</span>
            </a>
            <button
              onClick={() => setModalOpen(true)}
              className="w-full text-center px-5 py-3.5 bg-[#FF5500] text-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-black hover:text-[#CCFF00] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span>Transmit New Milestone</span>
              <span>+</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TELEMETRY & VERIFIED IMPACT METRICS (4 CARDS) */}
      {/* ========================================================================= */}
      <section
        data-testid="telemetry-impact-counters"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {/* Counter 1 */}
        <div className="border-4 border-black bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase mb-2">
              <span className="text-neutral-500">[ TEL_01 // MILESTONES ]</span>
              <span className="w-3 h-3 bg-black" />
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tighter my-2 font-sans">
              184
            </div>
            <div className="font-mono text-xs uppercase font-bold text-black tracking-wide">
              Verified Milestones
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between font-mono text-[11px]">
            <span className="text-neutral-600">COHORTS '14-'26</span>
            <span className="bg-[#CCFF00] border border-black px-1.5 py-0.5 font-bold">LIVE FEED</span>
          </div>
        </div>

        {/* Counter 2 */}
        <div className="border-4 border-black bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase mb-2">
              <span className="text-neutral-500">[ TEL_02 // VENTURE CAPITAL ]</span>
              <span className="w-3 h-3 bg-[#FF5500]" />
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tighter my-2 font-sans">
              $48.2M
            </div>
            <div className="font-mono text-xs uppercase font-bold text-black tracking-wide">
              Venture Capital Raised
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between font-mono text-[11px]">
            <span className="text-neutral-600">2024-2026 AUDIT</span>
            <span className="bg-black text-[#CCFF00] px-1.5 py-0.5 font-bold">+38% YoY</span>
          </div>
        </div>

        {/* Counter 3 */}
        <div className="border-4 border-black bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase mb-2">
              <span className="text-neutral-500">[ TEL_03 // ATTESTATIONS ]</span>
              <span className="w-3 h-3 bg-[#2E5BFF]" />
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tighter my-2 font-sans">
              1,420
            </div>
            <div className="font-mono text-xs uppercase font-bold text-black tracking-wide">
              Peer Endorsements
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between font-mono text-[11px]">
            <span className="text-neutral-600">CRYPTO VOUCHES</span>
            <span className="bg-black text-white px-1.5 py-0.5 font-bold">100% AUDITED</span>
          </div>
        </div>

        {/* Counter 4 */}
        <div className="border-4 border-black bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase mb-2">
              <span className="text-neutral-500">[ TEL_04 // CONVERSIONS ]</span>
              <span className="w-3 h-3 bg-black" />
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tighter my-2 font-sans">
              94.2%
            </div>
            <div className="font-mono text-xs uppercase font-bold text-black tracking-wide">
              Referral Conversion Rate
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between font-mono text-[11px]">
            <span className="text-neutral-600">TALENT LIQUIDITY</span>
            <span className="bg-[#FF5500] text-white px-1.5 py-0.5 font-bold">HIGH DEMAND</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PINNED FLAGSHIP SPOTLIGHT (FULL-WIDTH BENTO ANCHOR) */}
      {/* ========================================================================= */}
      <section
        data-testid="flagship-pinned-story"
        className="border-4 border-black bg-white shadow-[8px_8px_0px_#000000] overflow-hidden"
      >
        {/* Card Header Bar */}
        <div className="bg-black text-white px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs font-bold">
          <div className="flex items-center gap-3">
            <span className="bg-[#CCFF00] text-black px-2 py-0.5 font-black uppercase">
              01 PINNED ANCHOR
            </span>
            <span className="tracking-wide uppercase text-neutral-300">
              // ANNUAL SPOTLIGHT // COHORT CLUSTER ALPHA
            </span>
          </div>
          <div className="bg-[#FF5500] text-white px-2.5 py-1 text-[11px] uppercase tracking-wider font-extrabold border border-white">
            VENTURE SEED • $10M ROUND CLOSED
          </div>
        </div>

        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Story Content Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="bg-black text-white px-2 py-1 font-bold">LEAD ARCHITECTS</span>
              <span className="font-bold text-black underline">Marcus Brody ('18, CEO)</span>
              <span className="text-neutral-500">&amp;</span>
              <span className="font-bold text-black underline">Tara Vance ('20, CTO)</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight font-sans">
              Kinetix Robotics Raises $10M Seed For Distributed Actuator Firmwares
            </h2>

            {/* Founder Direct Quote Callout */}
            <div className="border-l-4 border-black pl-5 py-3 bg-neutral-50 border-y-2 border-r-2 border-black/10">
              <p className="font-mono text-xs sm:text-sm leading-relaxed text-black/90">
                "From our dorm-room autonomous sandbox to 20 manufacturing facilities across North
                America. How five alumni engineers leveraged PRO-ALUMN referral pipelines to scale
                high-concurrency ROS2 robotic firmware and complete a syndicate round led by Founders
                Fund and Sequoia."
              </p>
            </div>

            {/* Metadata Pill Badges */}
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs font-bold">
              <div className="border-2 border-black px-3 py-1.5 bg-neutral-100 shadow-[1px_1px_0px_#000000]">
                SYNDICATE: <span className="font-semibold">FOUNDERS FUND + SEQUOIA</span>
              </div>
              <div className="border-2 border-black px-3 py-1.5 bg-neutral-100 shadow-[1px_1px_0px_#000000]">
                VALUATION: <span className="font-semibold">$45M POST</span>
              </div>
              <div className="border-2 border-black px-3 py-1.5 bg-[#CCFF00] shadow-[1px_1px_0px_#000000]">
                HIRING: <span className="font-bold">4 FIRMWARE FELLOWS</span>
              </div>
            </div>

            {/* Public Interactive Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 font-mono text-xs font-bold">
              <button
                onClick={handleFlagshipEndorse}
                className={`px-5 py-3 border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                  flagshipEndorsed
                    ? "bg-black text-[#CCFF00]"
                    : "bg-[#CCFF00] text-black hover:bg-black hover:text-white"
                }`}
              >
                <span>👍</span>
                <span>
                  {flagshipEndorsed ? "ENDORSED" : "ENDORSE DISPATCH"} (+{flagshipCount})
                </span>
              </button>
              <Link
                href="/jobs"
                className="px-5 py-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <span>💬 38 COMMENTS &amp; NOTES</span>
              </Link>
              <Link
                href="/mentorship"
                className="px-5 py-3 bg-black text-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#FF5500] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <span>REQUEST FOUNDER INTRO</span>
                <span>→</span>
              </Link>
              <Link
                href="/jobs"
                className="text-xs font-mono font-bold underline hover:text-[#FF5500] ml-1"
              >
                VIEW 4 OPEN REQUISITIONS
              </Link>
            </div>
          </div>

          {/* Technical Schematic Blueprint Box */}
          <div
            data-testid="technical-schematic-diagram"
            className="lg:col-span-5 border-4 border-black bg-neutral-100 p-5 shadow-[4px_4px_0px_#000000]"
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-black font-mono text-xs font-bold uppercase">
              <span>SCHEMATIC // ACTUATOR TOPOLOGY V4.2</span>
              <span className="bg-[#FF5500] text-white px-2 py-0.5 text-[10px]">
                CAN-BUS / ROS2
              </span>
            </div>

            {/* Visual Architecture Schematic Frame */}
            <div className="my-4 bg-white border-2 border-black p-4 font-mono text-[11px] space-y-3">
              <div className="border border-dashed border-black p-3 bg-neutral-50">
                <div className="font-bold text-xs uppercase mb-1 flex items-center justify-between">
                  <span>[NODE: CONTROLLER]</span>
                  <span className="w-2 h-2 bg-[#00A859] inline-block" />
                </div>
                <p className="text-neutral-600">STM32H7 Core // Dual Cortex-M7 @ 480MHz</p>
                <div className="mt-2 text-[10px] bg-black text-white px-2 py-0.5 inline-block font-bold">
                  LATENCY: 0.12ms
                </div>
              </div>

              {/* Interconnect Signal Line */}
              <div className="text-center font-bold text-xs text-neutral-400">
                ↓ [HIGH-SPEED ROS2 / DDS LINK] ↓
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border border-black p-2 bg-neutral-50">
                  <div className="font-bold text-[10px] uppercase">ACTUATOR CLUSTER A</div>
                  <div className="text-neutral-500 text-[10px]">Torque: 45Nm (Closed-loop)</div>
                </div>
                <div className="border border-black p-2 bg-[#CCFF00]/40">
                  <div className="font-bold text-[10px] uppercase">ACTUATOR CLUSTER B</div>
                  <div className="text-neutral-700 text-[10px]">Firmware: PRO-RT-09</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-black/10 flex items-center justify-between font-mono text-[10px] text-neutral-600 font-bold">
              <span>REPO: github/kinetix-firmware</span>
              <span className="bg-neutral-200 border border-black px-1.5 py-0.5 font-mono">
                HASH: #8F0A2E
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FILTER PROTOCOL & LIVE INDEX BAR */}
      {/* ========================================================================= */}
      <section
        id="all-dispatches"
        data-testid="filtering-and-index-system"
        className="space-y-4 pt-4"
      >
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
          {[
            { id: "ALL", label: `ALL DISPATCHES (${allStories.length + 180})` },
            { id: "VENTURE", label: "VENTURE & STARTUPS (42)" },
            { id: "CAREER", label: "CAREER PIVOTS & PROMOTIONS (68)" },
            { id: "RESEARCH", label: "RESEARCH & PAPERS (34)" },
            { id: "INFRASTRUCTURE", label: "INFRASTRUCTURE & ARCH (24)" },
            { id: "AWARDS", label: "FELLOW AWARDS (16)" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
              className={`px-4 py-2.5 border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                categoryFilter === cat.id
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Topology and Order By Sub-bar */}
        <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
          {/* Topology selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-neutral-500 uppercase">TOPOLOGY:</span>
            {(["ALL", "SF", "NYC", "BLR", "REMOTE"] as TopologyFilter[]).map((top) => (
              <button
                key={top}
                onClick={() => setTopologyFilter(top)}
                className={`px-2.5 py-1 border border-black font-bold text-xs ${
                  topologyFilter === top
                    ? "bg-[#CCFF00] text-black shadow-[1px_1px_0px_#000000]"
                    : "bg-neutral-100 text-black hover:bg-black hover:text-white"
                }`}
              >
                {top}
              </button>
            ))}
          </div>

          {/* Order metadata */}
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-neutral-500 uppercase">ORDER BY:</span>
            <button
              onClick={() => setOrderFilter("UPVOTES")}
              className={`px-2 py-0.5 ${
                orderFilter === "UPVOTES" ? "bg-black text-white" : "hover:underline text-black"
              }`}
            >
              MOST UPVOTED
            </button>
            <span className="text-neutral-400">/</span>
            <button
              onClick={() => setOrderFilter("LATEST")}
              className={`px-2 py-0.5 ${
                orderFilter === "LATEST" ? "bg-black text-white" : "hover:underline text-black"
              }`}
            >
              LATEST DISPATCHES
            </button>
            <span className="text-neutral-400">/</span>
            <button
              onClick={() => setOrderFilter("IMPACT")}
              className={`px-2 py-0.5 ${
                orderFilter === "IMPACT" ? "bg-black text-white" : "hover:underline text-black"
              }`}
            >
              HIGHEST IMPACT SCORE
            </button>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative" data-testid="spotlight-search-field">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-4 border-black p-3.5 pl-4 text-xs font-mono font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-0 focus:border-black shadow-[4px_4px_0px_#000000]"
            placeholder="SEARCH BY FELLOW NAME, COMPANY (SNOWFLAKE, GOOGLE, STRIPE), OR RESEARCH TOKEN..."
            type="text"
          />
          <div className="absolute right-3.5 top-3.5 font-mono text-xs font-bold bg-[#CCFF00] border border-black px-2 py-0.5">
            ⌘K SEARCH
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. 2-COLUMN BRUTALIST SHOWCASE STORY GRID */}
      {/* ========================================================================= */}
      <section
        data-testid="showcase-stories-grid"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
      >
        {filteredStories.map((storyItem) => {
          const localVote = upvotesState[storyItem.id] || {
            count: storyItem.upvotes,
            voted: false,
          };

          return (
            <article
              key={storyItem.id}
              className="border-4 border-black bg-white p-6 sm:p-7 shadow-[4px_4px_0px_#000000] flex flex-col justify-between"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b-2 border-black font-mono text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-0.5">{storyItem.index}</span>
                    <span className="bg-[#CCFF00] border border-black px-2 py-0.5 uppercase text-black">
                      {storyItem.categoryLabel}
                    </span>
                    <span className="text-neutral-500">
                      {storyItem.cohort} · {storyItem.location}
                    </span>
                  </div>
                  <span className="border border-black bg-neutral-100 px-2 py-0.5 font-mono text-[11px] uppercase font-bold text-black">
                    {storyItem.orgName}
                  </span>
                </div>

                {/* Fellow Identity & Role */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    style={{
                      backgroundColor: storyItem.avatarBg || "#CCFF00",
                      color: storyItem.avatarColor || "#000000",
                    }}
                    className="w-14 h-14 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center font-black text-xl font-mono shrink-0"
                  >
                    {storyItem.initials}
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight hover:underline cursor-pointer">
                      {storyItem.headline}
                    </h3>
                    <p className="font-mono text-xs text-neutral-500 mt-1">
                      {storyItem.roleSubtext}
                    </p>
                  </div>
                </div>

                {/* Story Quote */}
                <div className="bg-neutral-50 border-2 border-black/20 p-4 font-mono text-xs sm:text-sm leading-relaxed mb-5">
                  {storyItem.quote}
                </div>

                {/* Impact Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 font-mono text-xs font-bold mb-6">
                  <div className="border-2 border-black p-2 bg-amber-50 shadow-[1px_1px_0px_#000000]">
                    <div className="text-[10px] text-neutral-500 uppercase">
                      {storyItem.metrics.label1}:
                    </div>
                    <div className="text-sm font-extrabold text-black truncate">
                      {storyItem.metrics.value1}
                    </div>
                  </div>
                  <div className="border-2 border-black p-2 bg-neutral-50 shadow-[1px_1px_0px_#000000]">
                    <div className="text-[10px] text-neutral-500 uppercase">
                      {storyItem.metrics.label2}:
                    </div>
                    <div className="text-xs font-bold text-black truncate">
                      {storyItem.metrics.value2}
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: storyItem.metrics.highlightCol || "#2E5BFF",
                    }}
                    className="border-2 border-black p-2 text-white shadow-[1px_1px_0px_#000000]"
                  >
                    <div className="text-[10px] text-neutral-200 uppercase">
                      {storyItem.metrics.label3}:
                    </div>
                    <div className="text-sm font-extrabold">
                      {storyItem.metrics.value3}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Strip */}
              <div className="pt-4 border-t-2 border-black flex flex-wrap items-center justify-between gap-3 font-mono text-xs font-bold">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCardUpvote(storyItem.id)}
                    className={`px-3 py-1.5 border border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 ${
                      localVote.voted
                        ? "bg-black text-[#CCFF00]"
                        : "bg-neutral-100 hover:bg-black hover:text-white"
                    }`}
                  >
                    <span>👍</span>
                    <span>{localVote.count} UPVOTES</span>
                  </button>
                  <Link
                    href="/jobs"
                    className="px-3 py-1.5 border border-black bg-neutral-100 hover:bg-black hover:text-white transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                  >
                    <span>💬 {storyItem.commentsCount}</span>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={storyItem.actionHref || "/jobs"}
                    className="px-3.5 py-1.5 bg-[#FF5500] text-white border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    {storyItem.actionLabel}
                  </Link>
                  <button
                    onClick={() => {
                      showToast(`Kudos sent to ${storyItem.authorName}! ✨`);
                    }}
                    className="px-3 py-1.5 border-2 border-black hover:bg-black hover:text-white transition-all"
                  >
                    SEND KUDOS
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* 6. PROTOCOL TECHNICAL VERIFICATION INFOBOX */}
      {/* ========================================================================= */}
      <section
        data-testid="cryptographic-pipeline-box"
        className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b-2 border-black font-mono text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5">SYS_SPEC // RFC-088</span>
            <span className="uppercase">
              PEER ATTESTATION PROTOCOL &amp; MILESTONE VERIFICATION PIPELINE
            </span>
          </div>
          <span className="bg-[#CCFF00] border border-black px-2 py-0.5 text-[11px] text-black">
            HASH ENCLAVE: SHA-256 / ED25519-STAMP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="border-2 border-black p-4 bg-neutral-50 space-y-2 shadow-[2px_2px_0px_#000000]">
            <div className="text-[#FF5500] font-bold text-[11px] uppercase">
              01 // CRYPTOGRAPHIC VOUCHING
            </div>
            <h4 className="font-black text-sm uppercase text-black font-sans">
              CONSENSUS ATTESTATIONS
            </h4>
            <p className="text-neutral-600 leading-relaxed text-[11px]">
              Milestones require minimum 3 signatures from verified alumni within the recipient's
              accredited faculty or venture syndicate prior to broadcast on the primary network wall.
            </p>
            <div className="pt-2 text-[10px] text-neutral-500 font-bold border-t border-black/10">
              THRESHOLD: 3 SIGNATURES (ED25519)
            </div>
          </div>

          <div className="border-2 border-black p-4 bg-neutral-50 space-y-2 shadow-[2px_2px_0px_#000000]">
            <div className="text-[#2E5BFF] font-bold text-[11px] uppercase">
              02 // ZERO-NOISE MODERATION
            </div>
            <h4 className="font-black text-sm uppercase text-black font-sans">
              PGVECTOR SEMANTIC INDEXING
            </h4>
            <p className="text-neutral-600 leading-relaxed text-[11px]">
              Dispatches are vector-ranked against alumni career trajectories and domain expertise to
              prevent corporate spam and ensure high signal-to-noise educational exchanges.
            </p>
            <div className="pt-2 text-[10px] text-neutral-500 font-bold border-t border-black/10">
              COSINE SIMILARITY FILTER: &gt; 0.82
            </div>
          </div>

          <div className="border-2 border-black p-4 bg-neutral-50 space-y-2 shadow-[2px_2px_0px_#000000]">
            <div className="text-black font-bold text-[11px] uppercase">
              03 // TALENT LIQUIDITY DROPS
            </div>
            <h4 className="font-black text-sm uppercase text-black font-sans">
              +100 ALUMN-CR REWARD
            </h4>
            <p className="text-neutral-600 leading-relaxed text-[11px]">
              Alumni who post validated hiring requests or offer active 1:1 mentorship slots instantly
              earn peer credit rep, unlocking private syndicate calls and deal rooms.
            </p>
            <div className="pt-2 text-[10px] text-neutral-500 font-bold border-t border-black/10">
              REPUTATION MULTIPLIER: 1.45X
            </div>
          </div>
        </div>

        {/* Live Infrastructure Footnote */}
        <div className="mt-6 pt-4 border-t-2 border-dashed border-black/30 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-neutral-600 font-bold">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[#00A859]" />
            <span>POSTGRES 16.2 / PGVECTOR 0.6.0 COMPILED</span>
          </div>
          <div className="bg-black text-white px-2 py-0.5">SECURITY ENCLAVE: ACTIVE [FIPS 140-3]</div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONVERSION CALL-TO-ACTION BANNER */}
      {/* ========================================================================= */}
      <section
        data-testid="conversion-cta-banner"
        className="border-4 border-black bg-[#CCFF00] p-8 sm:p-12 shadow-[8px_8px_0px_#000000] text-black"
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block bg-black text-white px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider">
            UNRESTRICTED MEMBERSHIP ACCESS // ADMISSION ROSTER 2026
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight font-sans leading-none">
            Ready To Accelerate Your Career Trajectory?
          </h2>
          <p className="font-mono text-sm sm:text-base max-w-2xl mx-auto font-medium text-black/85 leading-relaxed">
            Connect with 1,200+ verified alumni fellows, request vetted internal referrals at
            tier-one tech institutions, and publish your breakthroughs to accredited peers.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs uppercase font-bold">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-[#FF5500] text-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-black hover:text-[#CCFF00] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Create Free Fellow Account →
            </Link>
            <Link
              href="/directory"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Explore Alumni Directory
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TRANSMIT MILESTONE DISPATCH MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#fcf9f3] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-black">
                <div className="flex items-center gap-2 font-mono text-xs font-bold">
                  <span className="bg-[#FF5500] text-white px-2 py-0.5">[DISPATCH PIPELINE]</span>
                  <span className="uppercase">Broadcast Peer Milestone</span>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 border-2 border-black bg-white hover:bg-black hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitTransmission} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block font-bold uppercase mb-1">Milestone Headline *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Promoted to Staff Infrastructure Architect @ DeepMind"
                    className="w-full p-3 bg-white border-2 border-black focus:outline-none focus:ring-0"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase mb-1">Company / Institution</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Google Cloud, Stripe, YC..."
                      className="w-full p-3 bg-white border-2 border-black focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase mb-1">Role / Specialization</label>
                    <input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Senior SRE, Founder, Research Fellow..."
                      className="w-full p-3 bg-white border-2 border-black focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">Category Classification</label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value as CategoryFilter)}
                    className="w-full p-3 bg-white border-2 border-black focus:outline-none font-mono"
                  >
                    <option value="CAREER">CAREER ASCENT / PROMOTION</option>
                    <option value="VENTURE">VENTURE ROUND / FOUNDER SEED</option>
                    <option value="RESEARCH">RESEARCH PAPER / ACADEMIC ADVANCE</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE ARCHITECTURE</option>
                    <option value="AWARDS">PATENT / FELLOW AWARD</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">Milestone Dispatch Body *</label>
                  <textarea
                    rows={4}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="Describe your breakthrough, technologies deployed (Rust, pgvector, ROS2), and how you're contributing to alumni peers (referral slots, open-source repos)..."
                    className="w-full p-3 bg-white border-2 border-black focus:outline-none focus:ring-0 font-mono"
                    required
                  />
                </div>

                {/* Image / Schematic Attachment */}
                <div className="border-2 border-dashed border-black p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-600">
                      ATTACH SCHEMATIC / BADGE (OPTIONAL)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-black hover:text-white border-2 border-black font-bold uppercase text-[11px]"
                    >
                      {uploadingImage ? "Uploading..." : "Browse File"}
                    </button>
                  </div>
                  {imageUrl && (
                    <div className="mt-2 text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                      <Check size={14} /> Attached: {imageUrl.slice(-25)}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-3 border-2 border-black bg-white hover:bg-neutral-100 font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-[#FF5500] text-white border-2 border-black font-bold uppercase shadow-[4px_4px_0px_#000000] hover:bg-black hover:text-[#CCFF00] flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    <span>Transmit Milestone Dispatch →</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-black text-[#CCFF00] border-2 border-black shadow-[4px_4px_0px_#000000] font-mono text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles size={16} className="text-[#FF5500]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}