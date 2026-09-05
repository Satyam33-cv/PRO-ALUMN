"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Calendar,
  User,
  Search,
  Plus,
  Tag,
  Share2,
  Check,
  Sparkles,
  X,
  Pin,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2,
  Briefcase,
  Layers,
  FileText,
  CalendarDays,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Radio,
  Download,
  Lock,
} from "lucide-react";
import { Announcement } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import { AnnouncementBody } from "@/components/AnnouncementBody";

// Initial seed dispatches matching the official Stitch export
const STITCH_INITIAL_DISPATCHES: Announcement[] = [
  {
    id: "tx-8821",
    title: "TechCorp Global & Snowflake Open 40+ Fast-Track Referral Corridors for 2026 Graduates",
    category: "Career",
    body: "Senior engineering leadership across TechCorp Infrastructure and Snowflake Data Systems have activated exclusive interview pipelines for alumni candidates. Roles span distributed systems, ML infra engineering, and product operations. Direct internal referrals will be managed through the PRO-ALUMN Talent Relay.",
    pinned: false,
    author: "Sarah Jenkins",
    role: "VP of Distributed Engineering, Snowflake (Class of '16)",
    date: "2 days ago",
  },
  {
    id: "tx-8819",
    title: "Annual West Coast Alumni Mixer & Hackathon Scheduled at SF Campus",
    category: "Regional",
    body: "The Bay Area Alumni Council invites all graduates, founders, and research fellows for the 2026 Spring Summit. Weekend program includes a 24-hour hardware-software prototype sprint with $50,000 in non-dilutive grant prizes, followed by the evening Founder-Investor Keynote Dinner.",
    pinned: false,
    author: "Bay Area Alumni Council",
    role: "Regional Node",
    date: "3 days ago",
  },
  {
    id: "tx-8815",
    title: "Faculty Research Fellowship: Dr. Elena Rostova Awarded Quantum Cryptography Grant",
    category: "Deanery",
    body: "The National Science Council has conferred a $3.2M fundamental research grant to Dr. Elena Rostova and the Applied Physics Laboratory. The project focuses on post-quantum lattice encryption standards for decentralized autonomous satellite communications. Two post-doctoral fellowship slots are reserved for institute alumni.",
    pinned: false,
    author: "Dr. Elena Rostova, Ph.D.",
    role: "PI, Applied Physics Laboratory",
    date: "5 days ago",
  },
  {
    id: "tx-8802",
    title: "Spring 2026 Campus Placement Consortia: Mandatory Pre-Screening Protocol Active",
    category: "Deanery",
    body: "The Office of Career Development and Academic Deanery has ratified the unified employer recruitment schedule for all final-year undergraduate and graduate cohorts. Participating organizations (including 74 Fortune 500 corporate partners) require verified credential hashes via the PRO-ALUMN portal.",
    pinned: false,
    author: "Academic Deanery",
    role: "Office of Career Development",
    date: "1 week ago",
  },
];

export function AnnouncementsContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(STITCH_INITIAL_DISPATCHES);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activePage, setActivePage] = useState(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isCalendarToast, setIsCalendarToast] = useState(false);
  const [isRssSuccess, setIsRssSuccess] = useState(false);
  const [rssEmail, setRssEmail] = useState("");

  // Create modal state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Deanery");
  const [newBody, setNewBody] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");

  // Load announcements from API and merge with stitch seeds
  const loadAnnouncements = () => {
    setIsSyncing(true);
    apiClient.announcements
      .list()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const apiItems = res as Announcement[];
          // Filter out any legacy Giving items from API if existing
          const sanitizedApi = apiItems.filter(
            (item) => (item.category || "").toLowerCase() !== "giving"
          );
          // Merge API items without duplicating IDs
          const existingIds = new Set(sanitizedApi.map((a) => a.id));
          const uniqueSeeds = STITCH_INITIAL_DISPATCHES.filter((s) => !existingIds.has(s.id));
          setAnnouncementsList([...sanitizedApi, ...uniqueSeeds]);
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setIsSyncing(false), 400);
      });
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Filter categories
  const categories = [
    { id: "All", label: "ALL TRANSMISSIONS", count: announcementsList.length },
    { id: "Priority", label: "PRIORITY NOTICES", count: announcementsList.filter((a) => a.pinned).length + 1 }, // +1 for pinned flagship
    { id: "Deanery", label: "DEANERY & FACULTY", count: announcementsList.filter((a) => (a.category || "").toLowerCase() === "deanery").length },
    { id: "Career", label: "CAREER & HIRINGS", count: announcementsList.filter((a) => (a.category || "").toLowerCase() === "career").length },
    { id: "Regional", label: "REGIONAL CHAPTERS", count: announcementsList.filter((a) => (a.category || "").toLowerCase() === "regional").length },
  ];

  // Filtered and sorted list
  const filteredAnnouncements = useMemo(() => {
    return announcementsList
      .filter((ann) => {
        // Enforce strictly no giving
        if ((ann.category || "").toLowerCase() === "giving") return false;

        if (selectedCategory === "Priority") {
          if (!ann.pinned) return false;
        } else if (selectedCategory !== "All") {
          const cat = (ann.category || "").toLowerCase();
          if (cat !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;

        const authorName = typeof ann.author === "string" ? ann.author : ann.author?.name || "";
        return (
          ann.title.toLowerCase().includes(q) ||
          ann.body.toLowerCase().includes(q) ||
          authorName.toLowerCase().includes(q) ||
          (ann.category && ann.category.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const aPinned = Boolean(a.pinned);
        const bPinned = Boolean(b.pinned);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return sortOrder === "desc" ? -1 : 1;
      });
  }, [announcementsList, selectedCategory, searchQuery, sortOrder]);

  const handleTogglePin = (id: string) => {
    setAnnouncementsList((prev) =>
      prev.map((ann) => {
        if (ann.id === id) {
          const nextPinned = !ann.pinned;
          return { ...ann, pinned: nextPinned };
        }
        return ann;
      })
    );
    apiClient.announcements.togglePin(id).catch(() => {});
  };

  const handleShare = (id: string, title: string, body: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${title}\n\n${body}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const newAnnouncement: Announcement = {
      id: `tx-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      body: newBody.trim(),
      pinned: newPinned,
      pinnedAt: newPinned ? new Date().toISOString() : undefined,
      author: user?.name || "Campus Fellow",
      role: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Verified Fellow",
      date: "Just now",
    };

    setAnnouncementsList([newAnnouncement, ...announcementsList]);
    apiClient.announcements
      .create({
        title: newAnnouncement.title,
        body: newAnnouncement.body,
        category: newAnnouncement.category,
        author: typeof newAnnouncement.author === "string" ? newAnnouncement.author : newAnnouncement.author?.name,
        role: newAnnouncement.role,
        pinned: newAnnouncement.pinned,
      })
      .catch(() => {});

    setNewTitle("");
    setNewCategory("Deanery");
    setNewBody("");
    setNewPinned(false);
    setIsCreateModalOpen(false);
  };

  const handleExportCalendar = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PRO-ALUMN//CAMPUS WIRE CALENDAR//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Academic Council Senate Meeting
DESCRIPTION:Curriculum revision debate: AI ethics syllabus.
DTSTART:20261024T150000Z
DTEND:20261024T170000Z
LOCATION:Main Auditorium & Virtual Telepresence
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
SUMMARY:Annual West Coast Alumni Mixer & Hackathon
DESCRIPTION:24-hour hardware-software prototype sprint with $50,000 grant prizes.
DTSTART:20261112T170000Z
DTEND:20261114T230000Z
LOCATION:SOMA Innovation Depot, 450 Mission St, San Francisco
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pro_alumn_campus_bulletins.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsCalendarToast(true);
    setTimeout(() => setIsCalendarToast(false), 3000);
  };

  const handleRssSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rssEmail) return;
    setIsRssSuccess(true);
    setTimeout(() => {
      setIsRssSuccess(false);
      setRssEmail("");
    }, 4000);
  };

  return (
    <div className="flex flex-col w-full font-sans selection:bg-[#CCFF00] selection:text-black space-y-8">
      {/* 1. TOP UTILITY CONTEXT BAR */}
      <div className="bg-[#F7F4EE] border-2 border-black p-3 flex flex-wrap items-center justify-between shadow-[3px_3px_0px_#000000] font-mono text-xs gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse shadow-[0_0_8px_#00E676]" />
            <span className="font-extrabold tracking-widest text-black">FEED STATUS // ONLINE</span>
          </div>
          <span className="text-neutral-500 font-semibold">NODE: CLUSTER-US-EAST</span>
          <span className="text-neutral-500 font-semibold">PROTOCOL: RFC-044-BROADCAST</span>
          <div className="hidden lg:flex items-center gap-1.5 bg-[#e5e2dc] px-2 py-0.5 border border-black text-[11px]">
            <span className="text-neutral-700">ENCRYPTION:</span>
            <span className="text-[#FF5500] font-bold">ED25519-SIGNED</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-neutral-500 hidden sm:inline">INDEX TIME:</span>
          <span className="font-bold text-black bg-white px-2 py-0.5 border border-black text-[11px]">
            2026.10.18 // 14:32:09 UTC
          </span>
          <button
            onClick={loadAnnouncements}
            disabled={isSyncing}
            className="bg-black text-white font-mono text-xs font-bold px-3 py-1 shadow-[2px_2px_0px_#000000] hover:bg-[#CCFF00] hover:text-black transition-all flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            type="button"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "SYNCING..." : "SYNC FEED"}</span>
          </button>
        </div>
      </div>

      {/* 2. EDITORIAL MASTHEAD HEADER */}
      <header className="relative bg-white border-2 border-black p-6 sm:p-8 shadow-[4px_4px_0px_#000000] overflow-hidden">
        <div className="absolute -right-6 -bottom-6 select-none pointer-events-none opacity-5 font-black text-[100px] sm:text-[140px] leading-none text-black tracking-tighter">
          DISPATCH
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2 py-0.5 bg-black text-[#CCFF00] font-bold tracking-wider shadow-[1px_1px_0px_#000000]">
              [ BROADCAST PROTOCOL // RFC-044 ]
            </span>
            <span className="font-mono text-xs text-[#FF5500] font-bold">
              OFFICIAL DISPATCHES &amp; DEANERY BULLETINS
            </span>
            <span className="hidden md:inline-block font-mono text-xs text-neutral-500">
              | SYNCHRONIZED ACROSS 14 REGIONAL CHAPTERS
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-black tracking-tight font-sans">
                Campus &amp; Alumni Announcements Wire
              </h1>
              <p className="text-sm sm:text-base text-neutral-700 max-w-4xl mt-1 leading-relaxed">
                Critical university updates, research breakthroughs, institutional partnerships, and regional chapter meetups. Filtered by authority nodes and academic advisory boards.
              </p>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  router.push("/login?redirect=/announcements&target=post");
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#CCFF00] text-black px-4 py-2.5 text-xs font-mono font-bold uppercase shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#CCFF00] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>Broadcast Dispatch</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Ribbon (4 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t-2 border-black font-mono">
          <div className="bg-[#F7F4EE] border border-black p-3 flex flex-col justify-between shadow-[2px_2px_0px_#000000]">
            <span className="text-[10px] uppercase font-bold text-neutral-600">ACTIVE TRANSMISSIONS</span>
            <span className="text-xl sm:text-2xl font-black text-black mt-1">{announcementsList.length} ITEMS</span>
          </div>
          <div className="bg-[#F7F4EE] border border-black p-3 flex flex-col justify-between shadow-[2px_2px_0px_#000000]">
            <span className="text-[10px] uppercase font-bold text-neutral-600">PRIORITY NOTICES</span>
            <span className="text-xl sm:text-2xl font-black text-[#FF5500] mt-1">04 ACTIVE</span>
          </div>
          <div className="bg-[#F7F4EE] border border-black p-3 flex flex-col justify-between shadow-[2px_2px_0px_#000000]">
            <span className="text-[10px] uppercase font-bold text-neutral-600">VERIFIED DEANERY SEALS</span>
            <span className="text-xl sm:text-2xl font-black text-black mt-1">100% OK</span>
          </div>
          <div className="bg-[#F7F4EE] border border-black p-3 flex flex-col justify-between shadow-[2px_2px_0px_#000000]">
            <span className="text-[10px] uppercase font-bold text-neutral-600">AVG DISPATCH CYCLE</span>
            <span className="text-xl sm:text-2xl font-black text-[#2E5BFF] mt-1">6.2 HRS</span>
          </div>
        </div>
      </header>

      {/* 3. CATEGORY FILTER BAR WITH TACTILE SWITCHES */}
      <section className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F4EE] border-2 border-black p-3 shadow-[3px_3px_0px_#000000]">
        <div aria-label="Announcement categories" className="flex flex-wrap items-center gap-2" role="tablist">
          {categories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`font-mono text-xs px-3 py-1.5 border-2 border-black flex items-center gap-2 font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  isActive
                    ? "bg-black text-[#CCFF00]"
                    : "bg-white text-black hover:bg-neutral-100"
                }`}
                type="button"
              >
                {cat.id === "Priority" && <span className="w-2 h-2 rounded-full bg-[#FF5500]" />}
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1 border border-black ${isActive ? "bg-white text-black" : "bg-[#F7F4EE] text-neutral-600"}`}>
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search wire / ⌘K..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-black pl-8 pr-3 py-1.5 text-xs font-mono text-black focus:outline-none focus:bg-[#CCFF00]/10 shadow-[2px_2px_0px_#000000]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="bg-white text-black font-mono text-xs px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1 font-bold hover:bg-neutral-100 shrink-0"
            type="button"
          >
            <span>CHRONO [{sortOrder.toUpperCase()}]</span>
          </button>
        </div>
      </section>

      {/* 4. PINNED PRIORITY BROADCAST (BRUTALIST HERO BANNER) */}
      <article className="bg-white border-2 border-black shadow-[5px_5px_0px_#000000] overflow-hidden flex flex-col">
        {/* High-visibility Warning/Authority Top Bar */}
        <div className="bg-[#FF5500] text-white border-b-2 border-black px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold tracking-wider shadow-[1px_1px_0px_#000000]">
              ⚡ PRIORITY NOTICE // DEAN&apos;S DISPATCH
            </span>
            <span className="font-bold text-white uppercase hidden sm:inline">
              CLEARANCE LEVEL: ALPHA [CAMPUS-WIDE + FELLOWS]
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span className="font-bold">2026.10.15 // 09:00 EST</span>
          </div>
        </div>

        {/* Hero Banner Content Split Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#fcf9f3]">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#FF5500] font-black">NODE 01</span>
              <span className="text-neutral-400">→</span>
              <span className="uppercase text-neutral-600 font-bold tracking-wider">
                INSTITUTIONAL EXPANSION &amp; ENDOWMENT
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-black tracking-tight leading-tight font-sans">
              Groundbreaking of New Advanced Autonomous Robotics &amp; Embedded Silicon Wing
            </h2>

            <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
              The Engineering Consortium and College Advisory Board are proud to announce the commencement of construction on our 40,000 sq ft research facility, co-sponsored by alumni venture partners and Google Cloud. The complex will house four sub-nanometer fabrication laboratories, high-bay drone flight arenas, and an open incubation hub for alumni founders.
            </p>

            {/* Verification Badge / Authority Signature */}
            <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex items-center justify-between flex-wrap gap-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border-2 border-black bg-black text-white flex items-center justify-center font-black shadow-[1px_1px_0px_#000000]">
                  AK
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 font-bold text-black">
                    <span>Dr. Arvind Kulkarni, Ph.D.</span>
                    <ShieldCheck size={14} className="text-[#2E5BFF]" />
                  </div>
                  <span className="text-neutral-500 text-[11px]">Dean of Faculty &amp; Research // Institute Fellow &apos;98</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F7F4EE] border border-black text-[11px]">
                <span className="text-neutral-500 font-bold">SIG:</span>
                <span className="text-black font-bold">0x9E4A...B721 (RSA-4096 VALID)</span>
              </div>
            </div>

            {/* Hero Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsBlueprintModalOpen(true)}
                className="bg-black text-white font-mono text-xs font-bold px-4 py-2.5 border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#CCFF00] hover:text-black transition-all flex items-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                type="button"
              >
                <span>READ FULL DISPATCH &amp; BLUEPRINT</span>
                <span className="font-bold">→</span>
              </button>

              <button
                onClick={() => setIsRsvpModalOpen(true)}
                className="bg-[#FF5500] text-white font-mono text-xs font-bold px-4 py-2.5 border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-orange-600 transition-all flex items-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                type="button"
              >
                <Calendar size={14} />
                <span>RSVP FOR CEREMONY RECEPTION</span>
              </button>
            </div>
          </div>

          {/* Architectural Blueprint Chamber */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="relative bg-white border-2 border-black p-1 shadow-[3px_3px_0px_#000000] overflow-hidden">
              <div className="w-full h-56 bg-neutral-900 border border-black flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                {/* Tech schematic graphic */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:16px_16px]" />
                <Building2 size={48} className="text-[#CCFF00] mb-2 z-10" />
                <span className="font-mono text-xs font-bold text-white z-10">
                  AUTONOMOUS ROBOTICS &amp; SILICON WING
                </span>
                <span className="font-mono text-[10px] text-neutral-400 mt-1 z-10">
                  FACILITY BLUEPRINT // ARCHITECTURAL SCHEMATIC
                </span>
                <div className="absolute bottom-2 left-2 right-2 bg-black/90 border border-black text-white px-2 py-1 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#CCFF00] font-bold">WING B-4 // 40,000 SQ FT</span>
                  <span>RENDERING v1.8</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-bold">CO-SPONSOR CONSORTIUM</span>
                <span className="text-black font-extrabold">USD $42.5M ALLOCATED</span>
              </div>
              <div className="w-full h-2.5 bg-[#e5e2dc] border border-black overflow-hidden">
                <div className="h-full bg-[#00E676] w-[88%]" />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-600 font-bold mt-0.5">
                <span>ALUMNI VENTURE POOL: 88%</span>
                <span className="text-[#2E5BFF]">GOOGLE CLOUD RESEARCH GRANT</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* 5. MAIN CONTENT GRID (Announcements Stream 8 cols + Right Rail 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Announcements Feed List (8 Cols) */}
        <section aria-label="Announcements Feed List" className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-1 border-b-2 border-black font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold">SECTION 02</span>
              <span className="font-extrabold text-black uppercase tracking-wider">LATEST DISPATCH FEED</span>
            </div>
            <span className="text-neutral-500">
              SHOWING {filteredAnnouncements.length} OF {announcementsList.length} ITEMS
            </span>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_#000000]">
              <Megaphone size={36} className="mx-auto text-neutral-400 mb-3" />
              <h3 className="font-mono text-base font-bold text-black uppercase">No dispatches found</h3>
              <p className="font-mono text-xs text-neutral-600 mt-1">
                {searchQuery
                  ? `No announcements match query "${searchQuery}".`
                  : "No dispatches published under this category."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredAnnouncements.map((ann, idx) => {
                const isPinned = Boolean(ann.pinned);
                const isReferralCard = ann.id === "tx-8821" || ann.category?.toLowerCase() === "career";
                const isHackathonCard = ann.id === "tx-8819";
                const isResearchGrantCard = ann.id === "tx-8815";
                const isPlacementLockCard = ann.id === "tx-8802";

                return (
                  <article
                    key={ann.id}
                    className={`bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] transition-all flex flex-col gap-4 ${
                      isPinned ? "bg-gradient-to-r from-[#CCFF00]/10 to-white" : ""
                    }`}
                  >
                    {/* Card Header: Index, Tag, ID, Date, Pin & Share */}
                    <div className="flex items-center justify-between flex-wrap gap-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-black text-white font-bold">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="px-2 py-0.5 bg-[#F7F4EE] border border-black text-[#2E5BFF] font-bold uppercase">
                          {ann.category || "GENERAL"} // WIRE
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-500 font-bold">{ann.id.toUpperCase()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                          <Clock size={12} />
                          <span>{ann.date}</span>
                        </span>

                        {/* Pin Button */}
                        <button
                          onClick={() => handleTogglePin(ann.id)}
                          title={isPinned ? "Unpin notice" : "Pin notice to top"}
                          className={`p-1 border border-black shadow-[1px_1px_0px_#000000] transition-colors cursor-pointer ${
                            isPinned ? "bg-[#CCFF00] text-black font-bold" : "bg-white text-neutral-600 hover:bg-neutral-100"
                          }`}
                        >
                          <Pin size={12} className={isPinned ? "fill-black rotate-45" : ""} />
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShare(ann.id, ann.title, ann.body)}
                          title="Copy dispatch"
                          className="p-1 bg-white border border-black shadow-[1px_1px_0px_#000000] hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                        >
                          {copiedId === ann.id ? <Check size={12} className="text-[#00E676]" /> : <Share2 size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg sm:text-xl font-extrabold text-black hover:text-[#FF5500] transition-colors cursor-pointer font-sans leading-snug">
                        {ann.title}
                      </h3>
                      <div className="text-sm text-neutral-700 leading-relaxed font-sans">
                        <AnnouncementBody content={ann.body} />
                      </div>
                    </div>

                    {/* Rich Visual Attachment for TechCorp Referral Corridor */}
                    {isReferralCard && (
                      <div className="bg-[#F7F4EE] border-2 border-black p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs shadow-[2px_2px_0px_#000000]">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="w-12 h-12 bg-black text-[#CCFF00] border-2 border-black flex items-center justify-center font-black text-sm shrink-0 shadow-[2px_2px_0px_#000000]">
                            SJ
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-bold text-black">
                              <span>Sarah Jenkins</span>
                              <span className="px-1.5 py-0.2 bg-[#e5e2dc] border border-black text-[10px]">
                                CLASS OF &apos;16
                              </span>
                            </div>
                            <span className="text-neutral-600 text-[11px]">VP of Distributed Engineering, Snowflake</span>
                            <span className="text-[#00E676] font-bold flex items-center gap-1 mt-0.5 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] inline-block" /> ACCEPTING DIRECT CV INBOX
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => setIsReferralModalOpen(true)}
                            className="bg-black text-white font-mono text-xs font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#CCFF00] hover:text-black transition-all cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            type="button"
                          >
                            SUBMIT FOR REFERRAL
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rich Visual Attachment for West Coast Alumni Mixer & Hackathon */}
                    {isHackathonCard && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F7F4EE] border-2 border-black p-3 font-mono text-xs shadow-[2px_2px_0px_#000000]">
                        <div className="md:col-span-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-500">VENUE LOCATION</span>
                            <p className="font-extrabold text-black font-sans text-sm mt-0.5">SOMA Innovation Depot</p>
                            <p className="text-[11px] text-neutral-600">450 Mission St, San Francisco, CA</p>
                          </div>
                          <div className="pt-2">
                            <span className="text-[10px] uppercase font-bold text-neutral-500">DATE &amp; TIME</span>
                            <p className="text-[#FF5500] font-black">NOV 12-14, 2026 // 09:00 PST</p>
                          </div>
                        </div>

                        <div className="md:col-span-2 relative border-2 border-black bg-neutral-900 h-32 overflow-hidden flex flex-col items-center justify-center p-3 text-center">
                          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2E5BFF_1px,transparent_1px)] [background-size:12px_12px]" />
                          <Layers size={32} className="text-[#CCFF00] mb-1 z-10" />
                          <span className="font-mono text-xs font-bold text-white z-10">
                            SAN FRANCISCO SOMA TECH HUB MAP
                          </span>
                          <span className="text-[10px] text-neutral-400 z-10">450 MISSION ST // PACIFIC NODE</span>
                          <div className="absolute top-2 right-2 bg-white border border-black px-2 py-0.5 font-mono text-[9px] font-bold text-black shadow-[1px_1px_0px_#000000]">
                            SF REGIONAL CHAPTER
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rich Visual Attachment for Quantum Cryptography Grant */}
                    {isResearchGrantCard && (
                      <div className="bg-[#F7F4EE] border-2 border-black p-3 flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs shadow-[2px_2px_0px_#000000]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black text-[#CCFF00] border-2 border-black flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#000000]">
                            Q-NSF
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-black">NSF-APL Grant #2026-QC-98</span>
                            <span className="text-neutral-600 text-[11px]">PI: Dr. Elena Rostova, Applied Physics Lab</span>
                          </div>
                        </div>

                        {/* Mini Inline SVG Chart representing lattice fidelity */}
                        <div className="flex items-center gap-3 bg-white border border-black px-3 py-1 shadow-[1px_1px_0px_#000000]">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-neutral-500 font-bold">SIMULATED FIDELITY</span>
                            <span className="font-bold text-[#2E5BFF]">99.984% // 256-QUBIT</span>
                          </div>
                          <svg className="text-[#2E5BFF]" height="20" viewBox="0 0 72 24" width="60">
                            <path
                              d="M2 18 L14 12 L26 16 L38 8 L50 11 L62 4 L70 3"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="square"
                              strokeWidth="2.5"
                            />
                            <circle cx="70" cy="3" fill="currentColor" r="2.5" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Rich Alert Attachment for Placement Lock */}
                    {isPlacementLockCard && (
                      <div className="bg-[#FFF5E5] border-2 border-[#FF5500] p-3 flex items-start gap-3 shadow-[2px_2px_0px_#000000]">
                        <AlertTriangle size={20} className="text-[#FF5500] shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-black text-black uppercase">
                            ACTION MANDATORY: PROFILE VERIFICATION LOCK
                          </span>
                          <p className="text-xs text-neutral-700 font-sans mt-0.5">
                            Candidates must upload academic transcripts and complete identity proofing before the November deadline to participate in campus Day-One interviews.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Dispatch Footer Meta */}
                    <div className="pt-3 border-t border-neutral-300 flex items-center justify-between flex-wrap gap-2 font-mono text-xs text-neutral-600">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-black flex items-center gap-1">
                          <User size={13} className="text-black" />
                          <span>{typeof ann.author === "string" ? ann.author : ann.author?.name || "Campus Node"}</span>
                        </span>
                        {ann.role && (
                          <span className="bg-[#F7F4EE] border border-black px-1.5 py-0.2 text-[10px] text-neutral-700">
                            {ann.role}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isHackathonCard && (
                          <button
                            onClick={() => setIsRsvpModalOpen(true)}
                            className="bg-black text-white font-mono text-xs font-bold px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#CCFF00] hover:text-black cursor-pointer"
                          >
                            REGISTER RSVP (FREE)
                          </button>
                        )}
                        {isPlacementLockCard && (
                          <button
                            onClick={() => router.push("/login?redirect=/profile")}
                            className="bg-black text-white font-mono text-xs font-bold px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#CCFF00] hover:text-black cursor-pointer"
                          >
                            VERIFY PROTOCOL STATUS
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Wire Stream Control Pagination Dock */}
          <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000000] flex items-center justify-between flex-wrap gap-3 font-mono text-xs">
            <span className="text-neutral-600">
              SHOWING TRANSMISSIONS [01 - {Math.min(4, filteredAnnouncements.length)}] OF {announcementsList.length} TOTAL
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={activePage === 1}
                onClick={() => setActivePage(1)}
                className="w-7 h-7 flex items-center justify-center bg-[#F7F4EE] border border-black shadow-[1px_1px_0px_#000000] disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setActivePage(1)}
                className={`w-7 h-7 flex items-center justify-center border border-black font-bold shadow-[1px_1px_0px_#000000] ${
                  activePage === 1 ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                01
              </button>
              <button
                onClick={() => setActivePage(2)}
                className={`w-7 h-7 flex items-center justify-center border border-black font-bold shadow-[1px_1px_0px_#000000] ${
                  activePage === 2 ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                02
              </button>
              <button
                disabled={activePage === 2}
                onClick={() => setActivePage(2)}
                className="w-7 h-7 flex items-center justify-center bg-[#F7F4EE] border border-black shadow-[1px_1px_0px_#000000] disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Sidebar / Bulletin Widgets (4 Cols) */}
        <aside aria-label="Notice Board and Feed Widgets" className="lg:col-span-4 flex flex-col gap-6">
          {/* Widget 1: Institutional Notice Board */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col overflow-hidden">
            <div className="bg-[#F7F4EE] border-b-2 border-black p-3.5 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
                <span className="text-sm font-extrabold text-black uppercase">Notice Board</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-white border border-black font-bold">AY 2026-27</span>
            </div>

            <div className="p-4 flex flex-col gap-4 font-mono text-xs">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#FF5500]">OCT 24, 2026 // 15:00 UTC</span>
                  <span className="text-xs font-bold text-black font-sans mt-0.5">Academic Council Senate Meeting</span>
                  <span className="text-[11px] text-neutral-600">Curriculum revision debate: AI ethics syllabus.</span>
                </div>
                <span className="px-1.5 py-0.5 bg-[#F7F4EE] border border-black text-[10px] font-bold">PUBLIC</span>
              </div>

              <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-neutral-500">NOV 02, 2026 // 23:59 EST</span>
                  <span className="text-xs font-bold text-black font-sans mt-0.5">Peer Review Submission Deadline</span>
                  <span className="text-[11px] text-neutral-600">Journal of Advanced Network Synthesis Vol. 14.</span>
                </div>
                <span className="px-1.5 py-0.5 bg-[#F7F4EE] border border-black text-[10px] font-bold">FACULTY</span>
              </div>

              <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#2E5BFF]">NOV 18, 2026 // 18:30 GMT</span>
                  <span className="text-xs font-bold text-black font-sans mt-0.5">Global Alumni Venture Pitch Finals</span>
                  <span className="text-[11px] text-neutral-600">Broadcast live from London Innovation Foundry.</span>
                </div>
                <span className="px-1.5 py-0.5 bg-[#CCFF00] border border-black text-[10px] font-bold text-black">LIVE</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-neutral-500">DEC 05, 2026 // 10:00 EST</span>
                  <span className="text-xs font-bold text-black font-sans mt-0.5">Commencement Marshal Election</span>
                  <span className="text-[11px] text-neutral-600">Alumni voting portal open for all cohorts.</span>
                </div>
                <span className="px-1.5 py-0.5 bg-[#F7F4EE] border border-black text-[10px] font-bold">VOTE</span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F4EE] border-t-2 border-black flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-500 font-bold">iCal / WebCal Sync</span>
              <button
                onClick={handleExportCalendar}
                className="text-black font-bold hover:text-[#FF5500] flex items-center gap-1 cursor-pointer"
                type="button"
              >
                <span>EXPORT CALENDAR</span>
                <Download size={13} />
              </button>
            </div>
          </div>

          {/* Calendar Download Toast */}
          {isCalendarToast && (
            <div className="p-3 bg-black text-[#CCFF00] border-2 border-black font-mono text-xs shadow-[3px_3px_0px_#000000] flex items-center gap-2">
              <Check size={16} />
              <span>.ICS Calendar exported! Ready to import into Apple/Google Calendar.</span>
            </div>
          )}

          {/* Widget 2: Subscribe / Cryptographic RSS Syndicate */}
          <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000000] flex flex-col gap-3 font-mono">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-black text-[#CCFF00] text-xs font-bold">RSS // SYNDICATE</span>
              <span className="text-sm font-extrabold text-black uppercase">Weekly Wire Digest</span>
            </div>
            <p className="text-xs text-neutral-700 font-sans leading-relaxed">
              Receive authenticated Sunday morning executive briefings directly to your primary mailbox or secure decentralized reader.
            </p>

            <form onSubmit={handleRssSubmit} className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-600 uppercase">DISPATCH ADDRESS</label>
                <input
                  type="email"
                  required
                  value={rssEmail}
                  onChange={(e) => setRssEmail(e.target.value)}
                  placeholder="elena.vance@alumni.proalumn.edu"
                  className="w-full bg-[#F7F4EE] border-2 border-black px-3 py-1.5 text-xs font-mono text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input defaultChecked className="w-3.5 h-3.5 accent-black" type="checkbox" />
                  <span className="text-neutral-800 text-[11px]">Deanery announcements &amp; academic calls</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input defaultChecked className="w-3.5 h-3.5 accent-black" type="checkbox" />
                  <span className="text-neutral-800 text-[11px]">Fast-track job corridors &amp; hiring bulletins</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input className="w-3.5 h-3.5 accent-black" type="checkbox" />
                  <span className="text-neutral-800 text-[11px]">Regional meetups (Pacific &amp; East Coast)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-mono text-xs font-bold py-2 border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#CCFF00] hover:text-black transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <span>AUTHENTICATE &amp; SUBSCRIBE</span>
                <Radio size={14} />
              </button>

              {isRssSuccess && (
                <div className="p-2 bg-[#CCFF00] border border-black text-black text-xs font-bold flex items-center gap-1.5">
                  <Check size={14} />
                  <span>Subscription confirmed. Sunday dispatch will arrive weekly.</span>
                </div>
              )}
            </form>

            <div className="bg-[#F7F4EE] border border-black p-2 flex items-center justify-between text-[11px]">
              <span className="text-neutral-500 font-bold">PUBLIC PGP KEY:</span>
              <span className="text-black font-bold truncate max-w-[140px]">4F88 E920 C4AA 1180</span>
            </div>
          </div>

          {/* Widget 3: Authority Node Network Status */}
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col gap-2.5 font-mono text-xs">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              VERIFICATION CLUSTER METRICS
            </span>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-600">NODE US-EAST (NYC):</span>
                <span className="text-[#00E676] font-extrabold">ACTIVE // 12ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">NODE US-WEST (SFO):</span>
                <span className="text-[#00E676] font-extrabold">ACTIVE // 18ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">NODE EU-CENTRAL (BER):</span>
                <span className="text-[#00E676] font-extrabold">ACTIVE // 41ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">ORACLE PEERING:</span>
                <span className="text-black font-extrabold">SYNCHRONIZED</span>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px]">
              <span className="text-neutral-500">VERSION 2.4.8-RELEASE</span>
              <span className="text-[#FF5500] font-bold">UPTIME 99.991%</span>
            </div>
          </div>
        </aside>
      </div>

      {/* 6. MODALS */}

      {/* Modal 1: Post Announcement Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="relative w-full max-w-2xl bg-white border-4 border-black shadow-[8px_8px_0px_#000000] flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-[#F7F4EE]">
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 bg-black text-[#CCFF00] text-xs font-bold">[ DISPATCH WRITER ]</span>
                  <h3 className="text-base font-extrabold text-black font-sans uppercase">
                    Broadcast Official Announcement
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 border border-black bg-white hover:bg-neutral-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handlePublish} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-4 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-black uppercase mb-1">
                      Headline / Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robotics Center Groundbreaking"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#F7F4EE] border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black uppercase mb-1">
                      Authority Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#F7F4EE] border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none"
                    >
                      <option value="Deanery">Deanery &amp; Faculty</option>
                      <option value="Career">Career &amp; Hirings</option>
                      <option value="Regional">Regional Chapters</option>
                      <option value="Research">Research &amp; Patents</option>
                      <option value="General">General Campus</option>
                    </select>
                  </div>
                </div>

                {/* Pinned Priority Toggle */}
                <div className="border-2 border-black bg-[#FFF5E5] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pin size={16} className={newPinned ? "fill-[#FF5500] text-[#FF5500] rotate-45" : "text-black"} />
                    <div>
                      <span className="text-xs font-bold text-black block">PIN TO FEED TOP</span>
                      <span className="text-[10px] text-neutral-600">Elevate clearance to Priority Deanery Dispatch.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newPinned}
                    onChange={(e) => setNewPinned(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>

                {/* Tab Switcher: Write vs Preview */}
                <div className="border-2 border-black">
                  <div className="flex items-center justify-between bg-[#F7F4EE] px-3 py-1.5 border-b border-black">
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("write")}
                        className={`px-3 py-1 font-bold border border-black ${
                          previewTab === "write" ? "bg-black text-white" : "bg-white text-black"
                        }`}
                      >
                        Write Markdown
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("preview")}
                        className={`px-3 py-1 font-bold border border-black ${
                          previewTab === "preview" ? "bg-black text-white" : "bg-white text-black"
                        }`}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>

                  {previewTab === "write" ? (
                    <textarea
                      required
                      rows={7}
                      placeholder="Write your official dispatch with Markdown formatting..."
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      className="w-full p-3 text-xs font-mono bg-white focus:outline-none"
                    />
                  ) : (
                    <div className="p-4 bg-[#F7F4EE] min-h-[160px] text-xs font-sans">
                      {newBody.trim() ? (
                        <AnnouncementBody content={newBody} />
                      ) : (
                        <p className="text-neutral-400 font-mono">No content to preview.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border-2 border-black bg-white font-bold text-xs hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 border-2 border-black bg-[#CCFF00] text-black font-bold text-xs shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00] cursor-pointer"
                  >
                    {newPinned ? "Transmit & Pin Priority Notice" : "Broadcast Dispatch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: RSVP Modal */}
      <AnimatePresence>
        {isRsvpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-4 font-mono">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#FF5500] text-white text-xs font-bold">CEREMONY RSVP</span>
                  <span className="font-extrabold text-black font-sans uppercase">Reception Access</span>
                </div>
                <button
                  onClick={() => setIsRsvpModalOpen(false)}
                  className="p-1 border border-black hover:bg-neutral-100"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                You are RSVPing for the <strong>Autonomous Robotics &amp; Silicon Wing Groundbreaking Reception</strong> scheduled for November 12, 2026. Credentials will be stamped with cryptographic deanery seal.
              </p>

              <div className="p-3 bg-[#F7F4EE] border border-black space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">RECEPTION PROTOCOL:</span>
                  <span className="font-bold text-black">IN-PERSON VIP CHAMBER</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">ATTENDEE:</span>
                  <span className="font-bold text-black">{user?.name || "Guest Alumni Fellow"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">CREDENTIAL PASS:</span>
                  <span className="text-[#00E676] font-bold">CONFIRMED ALLOCATION</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsRsvpModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white font-bold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert("Ceremony RSVP verified and logged in Institute Registry.");
                    setIsRsvpModalOpen(false);
                  }}
                  className="px-5 py-2 border-2 border-black bg-[#CCFF00] text-black font-bold text-xs shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00]"
                >
                  Confirm Registration
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Full Dispatch Blueprint Modal */}
      <AnimatePresence>
        {isBlueprintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="relative w-full max-w-3xl bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col max-h-[90vh] overflow-y-auto gap-4 font-mono">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-black text-[#CCFF00] text-xs font-bold">BLUEPRINT SPEC</span>
                  <span className="font-extrabold text-black font-sans uppercase">Autonomous Robotics Wing</span>
                </div>
                <button
                  onClick={() => setIsBlueprintModalOpen(false)}
                  className="p-1 border border-black hover:bg-neutral-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-sans text-neutral-800 leading-relaxed">
                <h4 className="text-base font-extrabold text-black font-mono uppercase">
                  Technical Specifications &amp; Architectural Layout
                </h4>
                <p>
                  The Advanced Autonomous Robotics &amp; Embedded Silicon Wing encompasses 40,000 square feet of multi-disciplinary cleanrooms, robotics arenas, and silicon design laboratories:
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                  <li><strong>Fabrication Lab 1-4:</strong> ISO Class 5 cleanrooms equipped for sub-nanometer planar lithography.</li>
                  <li><strong>High-Bay Drone Arena:</strong> 3-story enclosed flight test facility with sub-millimeter optitrack motion capture.</li>
                  <li><strong>Edge Silicon Validation Bench:</strong> 64 test racks for RISC-V tensor processing units.</li>
                  <li><strong>Incubator Loft:</strong> Dedicated workstation clusters reserved for student-alumni venture teams.</li>
                </ul>
                <div className="bg-[#F7F4EE] border-2 border-black p-3 font-mono text-xs">
                  <span className="text-neutral-500 font-bold block mb-1">SIGNATURE SEAL:</span>
                  <span className="text-black font-bold">
                    Dr. Arvind Kulkarni, Ph.D. // 0x9E4A...B721 (RSA-4096 VALID ATTESTATION)
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t-2 border-black">
                <button
                  onClick={() => setIsBlueprintModalOpen(false)}
                  className="px-5 py-2 border-2 border-black bg-black text-white font-bold text-xs hover:bg-[#CCFF00] hover:text-black cursor-pointer"
                >
                  Close Specification
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Referral Modal */}
      <AnimatePresence>
        {isReferralModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-4 font-mono">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#2E5BFF] text-white text-xs font-bold">REFERRAL RELAY</span>
                  <span className="font-extrabold text-black font-sans uppercase">Snowflake / TechCorp</span>
                </div>
                <button
                  onClick={() => setIsReferralModalOpen(false)}
                  className="p-1 border border-black hover:bg-neutral-100"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                Connect directly with Sarah Jenkins (VP of Distributed Engineering, Class of &apos;16) for accelerated interview pipelines.
              </p>

              <div className="p-3 bg-[#F7F4EE] border border-black space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">CORRIDOR STATUS:</span>
                  <span className="text-[#00E676] font-bold">40 OPEN SLOTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">CANDIDATE:</span>
                  <span className="font-bold text-black">{user?.name || "Unauthenticated Guest"}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsReferralModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/login?redirect=/announcements&target=referral");
                    } else {
                      alert("Referral profile successfully submitted to Sarah Jenkins' Talent Relay.");
                      setIsReferralModalOpen(false);
                    }
                  }}
                  className="px-5 py-2 border-2 border-black bg-[#CCFF00] text-black font-bold text-xs shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00]"
                >
                  {user ? "Submit Profile →" : "Sign In to Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
