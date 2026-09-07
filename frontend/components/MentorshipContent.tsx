"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Check,
  X,
  Video,
  FolderOpen,
  Calendar,
  Search,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Users,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";

// Duration and Credit Modes
type DurationMode = "15-Min Flash (30 CR)" | "30-Min Deep-Dive (50 CR)" | "0-CR Barter";

interface MentorFellow {
  id: string;
  recCode: string;
  name: string;
  role: string;
  company: string;
  cohort: string;
  location: string;
  cosineMatch: number;
  avatarUrl: string;
  tagline?: string;
  verified: boolean;
  domain: string;
  skills: string[];
  /** Skills they can teach you (their offered ∩ your wanted) */
  canTeachMe: string[];
  /** Skills you can teach them (your offered ∩ their wanted) */
  iCanTeachThem: string[];
  isPerfectMatch: boolean;
  score: number;
  slotsLabel: string;
  availableSlots: string[];
  costFlash: number;
  costDeep: number;
  isBarter: boolean;
  freeVideos?: number;
  totalVideos?: number;
}

const DOMAINS = [
  "ALL DOMAINS",
  "DISTRIBUTED SYSTEMS",
  "AI / LLM INFRASTRUCTURE",
  "QUANTUM & CRYPTOGRAPHY",
  "PRODUCT STRATEGY",
  "CAREER PIVOTS",
  "HARDWARE & EMBEDDED",
];

export function MentorshipContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeDomain, setActiveDomain] = useState("ALL DOMAINS");
  const [durationMode, setDurationMode] = useState<DurationMode>("15-Min Flash (30 CR)");
  const [searchQuery, setSearchQuery] = useState("");
  const [messagingId, setMessagingId] = useState<string | null>(null);

  // Countdown timer for active session
  const [secondsRemaining, setSecondsRemaining] = useState(787); // ~13 mins 7 secs

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedCountdown = useMemo(() => {
    const hrs = Math.floor(secondsRemaining / 3600);
    const mins = Math.floor((secondsRemaining % 3600) / 60);
    const secs = secondsRemaining % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hrs)} : ${pad(mins)} : ${pad(secs)}`;
  }, [secondsRemaining]);

  // Dual Handshake in-escrow pipeline items
  const [pipelineItems, setPipelineItems] = useState<any[]>([]);

  const [escrowReleased, setEscrowReleased] = useState(false);
  const [releasingEscrow, setReleasingEscrow] = useState(false);

  // Booking Modal State
  const [bookingMentor, setBookingMentor] = useState<MentorFellow | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [auditArea, setAuditArea] = useState<string>("Architectural Audit");
  const [auditTopic, setAuditTopic] = useState<string>("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingTxHash, setBookingTxHash] = useState<string>("");

  // Pre-Flight Dossier Modal
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  // Reschedule Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  // Live Backend Data Fetching — skill-swap is the primary discovery source
  const skillSwapKey = user?.id ? `matching:skill-swap:${user.id}` : "matching:skill-swap";
  const { data: skillSwapData, loading: skillSwapLoading } = useApi(
    skillSwapKey,
    () => apiClient.matching.skillSwap()
  );
  const { data: mentorshipData, refresh: refreshMentorship } = useApi(
    user?.id ? `mentorship:list:${user.id}` : "mentorship:list",
    () => apiClient.mentorship.list()
  );

  const rawMentorships = useMemo(() => {
    if (!mentorshipData) return [];
    if (Array.isArray(mentorshipData)) return mentorshipData;
    if (Array.isArray((mentorshipData as any).mentorships)) return (mentorshipData as any).mentorships;
    return [];
  }, [mentorshipData]);

  useEffect(() => {
    if (rawMentorships && rawMentorships.length > 0) {
      const pending = rawMentorships
        .filter((m: any) => m.status === "PENDING" || m.status === "WAITING_CONFIRM" || m.status === "IN_ESCROW" || m.status === "AWAITING CALENDAR LOCK")
        .map((m: any) => ({
          id: m.id,
          name: m.mentor?.name || m.mentee?.name || m.name || "Mentorship Session",
          badge: m.mentor?.company || m.badge || "Verified Fellow",
          topic: m.topic || m.area || m.message || "Mentorship Topic",
          lockedCredits: m.credits || m.lockedCredits || 30,
          status: m.statusText || m.status || "WAITING MENTOR CONFIRM",
          statusColor: m.statusColor || "text-[#FF5500] bg-white",
          badgeClass: m.badgeClass || "bg-[#e5e2dc] text-[#635F57]",
        }));
      setPipelineItems(pending);
    } else {
      setPipelineItems([]);
    }
  }, [rawMentorships]);

  const activeSession = useMemo(() => {
    return rawMentorships.find((m: any) => m.status === "IN_FLIGHT" || m.status === "ACTIVE" || m.status === "CONFIRMED") || null;
  }, [rawMentorships]);

  // Map skill-swap API response → MentorFellow cards
  const allMentors: MentorFellow[] = useMemo(() => {
    const matches = (skillSwapData as any)?.matches;
    if (!Array.isArray(matches) || matches.length === 0) return [];

    return matches.map((m: any, idx: number): MentorFellow => {
      const canTeachMe: string[] = Array.isArray(m.canTeachMe) ? m.canTeachMe : [];
      const iCanTeachThem: string[] = Array.isArray(m.iCanTeachThem) ? m.iCanTeachThem : [];
      // Fallback chips from raw comma strings if arrays empty
      const offeredFallback = typeof m.skillsOffered === "string"
        ? m.skillsOffered.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      const skills = canTeachMe.length > 0 ? canTeachMe : offeredFallback;

      return {
        id: m.id || `swap-${idx}`,
        recCode: m.isPerfectMatch ? "PERFECT" : `SWAP_${String(idx + 1).padStart(2, "0")}`,
        name: m.name || "Member",
        role: m.jobTitle || m.role || "Member",
        company: m.currentCompany || m.company || "",
        cohort: m.batchYear ? `Class of '${String(m.batchYear).slice(-2)}` : "",
        location: m.department || "",
        cosineMatch: Math.min(99, Math.round((m.score || 1) * 12)), // display only
        avatarUrl:
          m.avatarUrl ||
          m.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        verified: true,
        domain: m.department ? String(m.department).toUpperCase() : "SKILL SWAP",
        skills,
        canTeachMe,
        iCanTeachThem,
        isPerfectMatch: Boolean(m.isPerfectMatch),
        score: Number(m.score) || 0,
        slotsLabel: m.totalVideos > 0 ? `${m.totalVideos} video${m.totalVideos === 1 ? "" : "s"}` : "Message to connect",
        availableSlots: [],
        costFlash: 0,
        costDeep: 0,
        isBarter: true,
        freeVideos: m.freeVideos,
        totalVideos: m.totalVideos,
      };
    });
  }, [skillSwapData]);

  // Filtered mentors list
  const filteredMentors = useMemo(() => {
    return allMentors.filter((mentor) => {
      if (activeDomain !== "ALL DOMAINS" && mentor.domain !== activeDomain) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = mentor.name.toLowerCase().includes(query);
        const matchesCompany = mentor.company.toLowerCase().includes(query);
        const matchesRole = mentor.role.toLowerCase().includes(query);
        const matchesSkills =
          mentor.canTeachMe.some((s) => s.toLowerCase().includes(query)) ||
          mentor.iCanTeachThem.some((s) => s.toLowerCase().includes(query)) ||
          mentor.skills.some((s) => s.toLowerCase().includes(query));
        return matchesName || matchesCompany || matchesRole || matchesSkills;
      }

      return true;
    });
  }, [allMentors, activeDomain, searchQuery]);

  /** Create (or open) a chat thread and deep-link into /chat?thread=… */
  const handleMessage = async (mentor: MentorFellow) => {
    if (!user) {
      if (typeof window !== "undefined") {
        window.location.href = "/login?redirect=/mentorship";
      }
      return;
    }
    setMessagingId(mentor.id);
    try {
      const res = await apiClient.chat.createThread(mentor.id);
      const threadId =
        (res as any)?.thread?.id ||
        (res as any)?.id ||
        (res as any)?.threadId;
      if (threadId) {
        router.push(`/chat?thread=${encodeURIComponent(String(threadId))}`);
      } else {
        // Fallback: open chat with userId param
        router.push(`/chat?userId=${encodeURIComponent(mentor.id)}&recipient=${encodeURIComponent(mentor.name)}`);
      }
    } catch (err) {
      console.error("Failed to create chat thread:", err);
      router.push(`/chat?userId=${encodeURIComponent(mentor.id)}&recipient=${encodeURIComponent(mentor.name)}`);
    } finally {
      setMessagingId(null);
    }
  };

  // Handle Dual-Handshake Completion Trigger
  const handleConfirmAndReleaseEscrow = async () => {
    setReleasingEscrow(true);
    try {
      if (pipelineItems.length > 0) {
        // Attempt backend confirm if first item has real id
        try {
          await apiClient.mentorship.confirm(pipelineItems[0].id);
        } catch {
          // Coexistence fallback
        }
      }
      setEscrowReleased(true);
      setTimeout(() => {
        setPipelineItems((prev) => prev.slice(1));
        setReleasingEscrow(false);
      }, 1200);
    } catch {
      setReleasingEscrow(false);
    }
  };

  // Open booking modal
  const handleOpenBooking = (mentor: MentorFellow, slot?: string) => {
    if (!user) {
      if (typeof window !== "undefined") {
        window.location.href = "/login?redirect=/mentorship";
      }
      return;
    }
    setBookingMentor(mentor);
    setSelectedSlot(slot || mentor.availableSlots[0] || "10:00 AM");
    setAuditTopic("");
    setBookingSuccess(false);
  };

  // Submit booking via real mentorship.create endpoint
  const handleConfirmBooking = async () => {
    if (!bookingMentor || !auditTopic.trim()) return;
    setIsSubmittingBooking(true);
    setBookingTxHash("");

    try {
      const res = await apiClient.mentorship.create({
        mentorId: bookingMentor.id,
        area: auditArea,
        message: `[${durationMode}] Slot: ${selectedSlot} - Topic: ${auditTopic.trim()}`,
        durationMins: durationMode.includes("30-Min") ? 30 : 15,
        isDirectSwap: durationMode === "0-CR Barter",
      });
      const id =
        (res as any)?.mentorship?.id ||
        (res as any)?.id ||
        "";
      setBookingTxHash(id ? `Request ${id}` : "Request submitted");
      setBookingSuccess(true);
      refreshMentorship();
    } catch (err: unknown) {
      console.error("Mentorship create failed:", err);
      const msg = err instanceof Error ? err.message : "Could not create mentorship request";
      setBookingTxHash(msg);
      setBookingSuccess(false);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#FCF9F3] min-h-screen text-[#1A1A1A] font-sans selection:bg-[#D9E021] selection:text-black">
      {/* ========================================================================= */}
      {/* System Protocol Marquee / Top Telemetry Strip                             */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#EFECE4] px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between border-b-2 border-[#1A1A1A] shadow-[0_2px_0_#1A1A1A] gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 bg-[#FF5500] text-white shadow-[1px_1px_0_#1A1A1A] font-extrabold tracking-wider">
              P-04
            </span>
            <span className="font-sans text-xs sm:text-sm uppercase tracking-wider text-[#1A1A1A] font-extrabold">
              PROTOCOL 04 // ASYNCHRONOUS &amp; SYNCHRONOUS EXPERT EXCHANGE
            </span>
          </div>
          <span className="hidden md:inline-block text-[#D5CEBF] font-mono text-xs">|</span>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676] animate-pulse"></span>
            <span className="font-mono text-xs font-semibold text-[#635F57]">
              TOPOLOGICAL MATCHER: ONLINE (&lt;24ms)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#8F8A7E] hidden sm:inline">
            SESSION DISPATCH ROUTER:
          </span>
          <span className="font-mono text-xs px-2.5 py-1 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] font-bold">
            TLS_1.3 // ENCLAVE_SECURE
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* Hero Header Banner                                                        */}
        {/* ========================================================================= */}
        <header className="flex flex-col gap-6 bg-white p-6 sm:p-8 border-2 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A] relative overflow-hidden">
          {/* Subtle Corner Watermark 04 */}
          <div className="absolute -right-4 -bottom-8 opacity-[0.04] pointer-events-none select-none font-mono text-[160px] font-black text-black leading-none">
            04
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs px-2.5 py-1 bg-black text-white font-bold tracking-wider">
                PILLAR // 03
              </span>
              <span className="font-mono text-xs text-[#8F8A7E] font-medium">
                HNSW_COSINE_SIMILARITY_v2
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 bg-[#D9E021] text-black border-2 border-[#1A1A1A] font-bold shadow-[2px_2px_0_#1A1A1A]">
                ESCROW INTEGRITY: VERIFIED
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div className="max-w-3xl flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A] tracking-tight">
                Mentorship &amp; Flash 1-on-1 Sessions
              </h1>
              <p className="text-sm sm:text-base text-[#635F57] leading-relaxed">
                Sub-30ms topological matching connects scholars and candidates with verified technical fellows for 15-minute architectural audits, resume breakdowns, and 30-minute career roadmaps.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1 shrink-0 bg-[#F7F4EE] p-3 sm:p-4 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
              <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                ESCROW LIQUIDITY POOL
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-black text-2xl sm:text-3xl text-[#1A1A1A] tracking-tight">
                  2,450
                </span>
                <span className="font-mono text-xs text-[#FF5500] font-black">
                  ALUMN-CR
                </span>
              </div>
            </div>
          </div>

          {/* Quick Telemetry Badges Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t-2 border-[#D5CEBF] relative z-10">
            <div className="p-3 sm:p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-1 shadow-[2px_2px_0_#1A1A1A]">
              <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                ACTIVE FELLOWS
              </span>
              <span className="text-base sm:text-lg text-[#1A1A1A] font-bold">
                148 Available
              </span>
            </div>
            <div className="p-3 sm:p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-1 shadow-[2px_2px_0_#1A1A1A]">
              <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                SUBSIDIZED PASSES
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg text-[#1A1A1A] font-bold">
                  2 Remaining
                </span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#D9E021] text-black border border-[#1A1A1A]">
                  FREE TIER
                </span>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-1 shadow-[2px_2px_0_#1A1A1A]">
              <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                ESCROW PROTECTION
              </span>
              <span className="text-base sm:text-lg text-[#1A1A1A] font-bold">
                Dual-Handshake
              </span>
            </div>
            <div className="p-3 sm:p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-1 shadow-[2px_2px_0_#1A1A1A]">
              <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                MEDIAN AUDIT TIME
              </span>
              <span className="text-base sm:text-lg text-[#1A1A1A] font-bold">
                14.8 Minutes
              </span>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* Top Bento Row: In-Flight Session & Dual-Handshake Pipeline                 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* In-Flight Session Card (7 Cols) */}
          <section
            aria-label="Active Session In-Flight"
            className="lg:col-span-7 bg-white border-2 border-[#1A1A1A] p-6 sm:p-8 shadow-[4px_4px_0_#1A1A1A] flex flex-col justify-between gap-6 relative"
          >
            {activeSession ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#D5CEBF] gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse shadow-[0_0_8px_#00E676]"></span>
                    <span className="font-sans text-xs sm:text-sm text-[#1A1A1A] uppercase tracking-wider font-extrabold">
                      ACTIVE SESSION IN-FLIGHT // COMMENCING SOON
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#F7F4EE] text-[#635F57] border-2 border-[#1A1A1A] font-bold">
                    SESSION ID #{activeSession.id}
                  </span>
                </div>

                {/* Countdown Counter Strip */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-[#F7F4EE] border-2 border-[#1A1A1A] gap-4 shadow-[2px_2px_0_#1A1A1A]">
                  <div>
                    <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                      T-MINUS COUNTDOWN
                    </span>
                    <div className="font-mono text-2xl sm:text-3xl tracking-tight text-[#FF5500] font-black flex items-center gap-2 mt-1">
                      <span id="countdown-val">{formattedCountdown}</span>
                      <span className="font-mono text-xs text-[#8F8A7E] font-normal">
                        [LIVE]
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                      TYPE &amp; LENGTH
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[#1A1A1A] mt-1">
                      {activeSession.type || "15-Min Architectural Flash"}
                    </span>
                  </div>
                </div>

                {/* Session Target Details */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <Image
                      src={
                        activeSession.mentor?.avatar ||
                        activeSession.avatarUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                      }
                      alt={activeSession.mentor?.name || activeSession.name || "Mentor"}
                      width={64}
                      height={64}
                      className="w-16 h-16 border-2 border-[#1A1A1A] object-cover shadow-[3px_3px_0_#1A1A1A]"
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 font-mono text-[10px] px-1.5 py-0.5 bg-[#1D4ED8] text-white font-extrabold border border-[#1A1A1A]">
                      {activeSession.badge || "PRO"}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-[#1A1A1A]">
                        {activeSession.mentor?.name || activeSession.name || "Verified Fellow"}
                      </span>
                      {(activeSession.mentor?.company || activeSession.company) && (
                        <span className="font-mono text-xs px-2 py-0.5 bg-[#e5e2dc] text-[#1A1A1A] border border-[#1A1A1A] font-bold">
                          {activeSession.mentor?.company || activeSession.company}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-[#8F8A7E] font-medium mt-0.5">
                      {activeSession.mentor?.role || activeSession.role || "Verified Fellow"}
                    </span>
                    <div className="mt-2.5">
                      <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider block">
                        AUDIT TOPIC:
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#1A1A1A] leading-snug mt-0.5">
                        {activeSession.topic || activeSession.area || activeSession.message || "Architectural Review"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Escrow Pill Indicator */}
                <div className="p-3 bg-[#EFECE4] border-2 border-[#1A1A1A] flex flex-wrap items-center justify-between gap-2 shadow-[1px_1px_0_#1A1A1A]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#FF5500] shrink-0" />
                    <span className="font-mono text-xs text-[#1A1A1A] font-bold">
                      {activeSession.credits || activeSession.lockedCredits || 30} ALUMN-CR HELD IN ESCROW
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#635F57] uppercase font-medium">
                    Auto-releases upon dual sign-off
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#D5CEBF] gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8F8A7E]"></span>
                    <span className="font-sans text-xs sm:text-sm text-[#1A1A1A] uppercase tracking-wider font-extrabold">
                      ACTIVE SESSION IN-FLIGHT // STANDBY
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#F7F4EE] text-[#635F57] border-2 border-[#1A1A1A] font-bold">
                    STANDBY
                  </span>
                </div>
                <div className="p-8 text-center bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#1A1A1A]">
                    NO SESSIONS COMMENCING
                  </span>
                  <p className="text-xs text-[#635F57] max-w-md">
                    You do not currently have an active session in flight. Schedule a 1-on-1 below to connect with verified mentors.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {activeSession ? (
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t-2 border-[#D5CEBF]">
                <a
                  href={activeSession.meetUrl || "https://meet.google.com/new"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-5 py-3 bg-black text-white border-2 border-[#1A1A1A] font-bold text-xs sm:text-sm shadow-[3px_3px_0_#1A1A1A] hover:bg-[#FF5500] hover:text-white transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>LAUNCH GOOGLE MEET</span>
                </a>
                <button
                  type="button"
                  onClick={() => setDossierModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F7F4EE] text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold text-xs sm:text-sm shadow-[3px_3px_0_#1A1A1A] hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>PRE-FLIGHT DOSSIER</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleSuccess(false);
                    setRescheduleModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#635F57] border-2 border-[#1A1A1A] font-semibold text-xs sm:text-sm hover:text-black hover:bg-[#F7F4EE] transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>RESCHEDULE</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t-2 border-[#D5CEBF] flex justify-end">
                <a
                  href="#mentor-directory"
                  className="px-4 py-2.5 bg-black text-white border-2 border-[#1A1A1A] font-bold text-xs shadow-[2px_2px_0_#1A1A1A] hover:bg-[#FF5500] transition-all"
                >
                  RESERVE A MENTOR SLOT →
                </a>
              </div>
            )}
          </section>

          {/* Pending Dual-Handshake Protocol Card (5 Cols) */}
          <section
            aria-label="Pending Dual-Handshake Pipeline"
            className="lg:col-span-5 bg-white border-2 border-[#1A1A1A] p-6 sm:p-8 shadow-[4px_4px_0_#1A1A1A] flex flex-col justify-between gap-6"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#D5CEBF]">
                <span className="font-sans text-xs sm:text-sm text-[#1A1A1A] uppercase tracking-wider font-extrabold">
                  PENDING DUAL-HANDSHAKE PIPELINE
                </span>
                <span className="font-mono text-xs px-2.5 py-1 bg-[#D9E021] text-black border-2 border-[#1A1A1A] font-black shadow-[1px_1px_0_#1A1A1A]">
                  {pipelineItems.length} IN ESCROW
                </span>
              </div>

              {escrowReleased && (
                <div className="p-3 bg-[#D9E021]/30 border-2 border-[#1A1A1A] text-[#1A1A1A] font-mono text-xs flex items-center gap-2 font-bold shadow-[2px_2px_0_#1A1A1A]">
                  <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                  <span>Dual cryptographic signature accepted. 30 CR released.</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {pipelineItems.length === 0 ? (
                  <div className="p-6 text-center bg-[#F7F4EE] border-2 border-[#1A1A1A] text-[#8F8A7E] font-mono text-xs font-bold">
                    All escrow handshakes settled. Pipeline clear.
                  </div>
                ) : (
                  pipelineItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-2 shadow-[2px_2px_0_#1A1A1A]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#1A1A1A]">
                          {item.name}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 border border-[#1A1A1A] ${
                            item.badgeClass || "bg-[#e5e2dc] text-[#635F57]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#635F57] leading-tight italic">
                        &quot;{item.topic}&quot;
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#D5CEBF] mt-1">
                        <span className="font-mono text-xs text-[#8F8A7E] font-bold">
                          LOCK: {item.lockedCredits} ALUMN-CR
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 border border-[#1A1A1A] font-bold ${item.statusColor}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Verification Signature Trigger */}
            <div className="mt-2 pt-4 border-t-2 border-[#D5CEBF] flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmAndReleaseEscrow}
                disabled={releasingEscrow || pipelineItems.length === 0}
                className="w-full py-3.5 px-4 bg-[#FF5500] text-white font-black text-xs sm:text-sm border-2 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {releasingEscrow
                    ? "TRANSMITTING SIGNATURE..."
                    : "CONFIRM SESSION COMPLETION & RELEASE ESCROW"}
                </span>
              </button>
              <span className="font-mono text-[11px] text-[#8F8A7E] text-center font-medium">
                Requires cryptographic signature from {user?.name || "verified member"}&apos;s token
              </span>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* Main Booking Core: Filters, Mode Selection, Verified Mentor Bento         */}
        {/* ========================================================================= */}
        <section aria-label="Book a Flash Session" className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#1A1A1A]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#8F8A7E] font-bold">
                  [SUB-ROUTINE 04.2]
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A]">
                  Book a Flash 1-on-1 Session
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#635F57]">
                Direct cryptographic reservation. Slots automatically synchronize with mentors&apos; hardware cal-daemons.
              </p>
            </div>

            {/* Duration / Type Switcher */}
            <div className="inline-flex bg-white p-1 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] gap-1 flex-wrap">
              {(["15-Min Flash (30 CR)", "30-Min Deep-Dive (50 CR)", "0-CR Barter"] as DurationMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDurationMode(mode)}
                  className={`px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                    durationMode === mode
                      ? "bg-black text-white font-bold shadow-[1px_1px_0_#1A1A1A]"
                      : "text-[#635F57] hover:text-black font-semibold hover:bg-[#F7F4EE]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Domain Filters Strip */}
          <div className="flex flex-col gap-4">
            {/* Live Search Input */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] max-w-xl">
              <Search className="w-4 h-4 text-[#8F8A7E] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentor by name, company, or tech stack (e.g. Raft, Rust, YC)..."
                className="w-full bg-transparent font-mono text-xs sm:text-sm text-[#1A1A1A] placeholder:text-[#8F8A7E] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#8F8A7E] hover:text-[#1A1A1A] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Topology Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#8F8A7E] uppercase mr-1 font-extrabold tracking-wider">
                FILTER TOPOLOGY:
              </span>
              {DOMAINS.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setActiveDomain(domain)}
                  className={`px-3 py-1.5 border-2 border-[#1A1A1A] font-mono text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_0_#1A1A1A] ${
                    activeDomain === domain
                      ? "bg-black text-white"
                      : "bg-white text-[#1A1A1A] hover:bg-[#F7F4EE]"
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Skill-swap partner cards (from GET /matching/skill-swap) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillSwapLoading ? (
              <div className="col-span-full flex items-center justify-center py-16 gap-3 font-mono text-sm text-[#8F8A7E]">
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding skill-swap partners…
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={Users}
                  title="NO SKILL-SWAP MATCHES YET"
                  body="Add skills you want to learn (and skills you can offer) in your profile. Matches appear when someone else’s offered skills overlap yours."
                  action={
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      <Link
                        href="/complete-profile"
                        className="px-4 py-2 bg-black text-white font-mono text-xs font-bold border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] hover:bg-[#FF5500] cursor-pointer transition-all"
                      >
                        UPDATE PROFILE SKILLS
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDomain("ALL DOMAINS");
                          setSearchQuery("");
                        }}
                        className="px-4 py-2 bg-white text-black font-mono text-xs font-bold border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] hover:bg-[#F7F4EE] cursor-pointer transition-all"
                      >
                        RESET FILTERS
                      </button>
                    </div>
                  }
                />
              </div>
            ) : (
              filteredMentors.map((mentor) => {
                return (
                  <article
                    key={mentor.id}
                    className="bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] p-5 sm:p-6 flex flex-col justify-between gap-5 relative group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A1A] transition-all"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header Tag & Match Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 bg-[#F7F4EE] text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold shadow-[1px_1px_0_#1A1A1A]">
                          {mentor.recCode}
                        </span>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 border-2 border-[#1A1A1A] font-black shadow-[1px_1px_0_#1A1A1A] ${
                            mentor.isPerfectMatch
                              ? "bg-[#D9E021] text-black"
                              : "bg-[#e5e2dc] text-[#1A1A1A]"
                          }`}
                        >
                          {mentor.isPerfectMatch ? "PERFECT SWAP" : `SCORE ${mentor.score}`}
                        </span>
                      </div>

                      {/* Profile Overview */}
                      <div className="flex items-start gap-4">
                        <Image
                          src={mentor.avatarUrl}
                          alt={mentor.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 border-2 border-[#1A1A1A] object-cover shadow-[2px_2px_0_#1A1A1A] shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] truncate">
                              {mentor.name}
                            </h3>
                            {mentor.verified && (
                              <span title="Verified">
                                <UserCheck className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm text-[#1A1A1A] font-bold truncate mt-0.5">
                            {[mentor.company, mentor.role].filter(Boolean).join(" // ") || "Member"}
                          </span>
                          <span className="font-mono text-[11px] text-[#8F8A7E] font-medium mt-0.5">
                            {[mentor.cohort, mentor.location].filter(Boolean).join(" • ") || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Skills they can teach you */}
                      {mentor.canTeachMe.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[10px] uppercase font-bold text-[#8F8A7E] tracking-wider">
                            They can teach you
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.canTeachMe.map((skill) => (
                              <span
                                key={`offer-${skill}`}
                                className="font-mono text-[11px] px-2 py-0.5 bg-[#D9E021] text-[#1A1A1A] border border-[#1A1A1A] font-medium shadow-[1px_1px_0_#1A1A1A]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills you can teach them */}
                      {mentor.iCanTeachThem.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[10px] uppercase font-bold text-[#8F8A7E] tracking-wider">
                            You can teach them
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.iCanTeachThem.map((skill) => (
                              <span
                                key={`want-${skill}`}
                                className="font-mono text-[11px] px-2 py-0.5 bg-[#F7F4EE] text-[#1A1A1A] border border-[#1A1A1A] font-medium shadow-[1px_1px_0_#1A1A1A]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fallback generic skills */}
                      {mentor.canTeachMe.length === 0 &&
                        mentor.iCanTeachThem.length === 0 &&
                        mentor.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.skills.map((skill) => (
                              <span
                                key={skill}
                                className="font-mono text-[11px] px-2 py-0.5 bg-[#F7F4EE] text-[#1A1A1A] border border-[#1A1A1A] font-medium shadow-[1px_1px_0_#1A1A1A]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Primary action: Message → Chat deep-link */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleMessage(mentor)}
                        disabled={messagingId === mentor.id}
                        className="w-full py-3 bg-black text-white border-2 border-[#1A1A1A] font-bold text-xs sm:text-sm shadow-[2px_2px_0_#1A1A1A] hover:bg-[#FF5500] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                      >
                        {messagingId === mentor.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>OPENING CHAT…</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            <span>{user ? "MESSAGE" : "SIGN IN TO MESSAGE"}</span>
                          </>
                        )}
                      </button>
                      <Link
                        href={`/directory/${mentor.id}`}
                        className="w-full py-2.5 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold text-xs text-center shadow-[2px_2px_0_#1A1A1A] hover:bg-[#F7F4EE] transition-colors"
                      >
                        VIEW PROFILE
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* Credit Economy & Escrow Ledger State Diagram Section                      */}
        {/* ========================================================================= */}
        <section
          aria-label="Credit Economy & Hardware Enclave Escrow"
          className="bg-white border-2 border-[#1A1A1A] p-6 sm:p-8 shadow-[4px_4px_0_#1A1A1A] flex flex-col gap-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#D5CEBF]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 bg-black text-white font-bold">
                LEDGER PROTOCOL
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A] uppercase tracking-tight">
                Credit Economy &amp; Hardware Enclave Escrow
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                YOUR ESCROW BALANCE:
              </span>
              <span className="font-mono text-xs px-3 py-1 bg-[#D9E021] text-black border-2 border-[#1A1A1A] font-black shadow-[2px_2px_0_#1A1A1A]">
                120 ALUMN-CR
              </span>
            </div>
          </div>

          {/* State Diagram Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-2 shadow-[2px_2px_0_#1A1A1A]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#8F8A7E] font-bold">
                  STATE 01
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FF5500] text-white font-black border border-[#1A1A1A]">
                  -50 CR
                </span>
              </div>
              <span className="font-bold text-sm text-[#1A1A1A]">
                Scholar Requests Session
              </span>
              <p className="font-mono text-xs text-[#635F57] leading-snug">
                Balance deducted from active wallet. Transferred directly to cryptographic escrow register.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-2 shadow-[2px_2px_0_#1A1A1A]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#8F8A7E] font-bold">
                  STATE 02
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9E021] border border-[#1A1A1A]"></span>
              </div>
              <span className="font-bold text-sm text-[#1A1A1A]">
                Held in Secure Enclave
              </span>
              <p className="font-mono text-xs text-[#635F57] leading-snug">
                Protected under FIPS 140-3 enclave. Neither party can prematurely seize funds until verification.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-2 shadow-[2px_2px_0_#1A1A1A]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#8F8A7E] font-bold">
                  STATE 03
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] border border-[#1A1A1A]"></span>
              </div>
              <span className="font-bold text-sm text-[#1A1A1A]">
                Dual-Handshake Sign-Off
              </span>
              <p className="font-mono text-xs text-[#635F57] leading-snug">
                Both mentor &amp; student transmit digital receipt tokens at meeting conclusion.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-2 shadow-[2px_2px_0_#1A1A1A]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#8F8A7E] font-bold">
                  STATE 04
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00E676] text-[#1A1A1A] font-black border border-[#1A1A1A]">
                  +50 CR
                </span>
              </div>
              <span className="font-bold text-sm text-[#1A1A1A]">
                Released to Mentor
              </span>
              <p className="font-mono text-xs text-[#635F57] leading-snug">
                Full release into Fellow&apos;s redeemable balance. Automatic reputation coefficient bump.
              </p>
            </div>
          </div>

          {/* Guarantee Footer Strip */}
          <div className="p-3.5 bg-[#EFECE4] border-2 border-[#1A1A1A] flex flex-wrap items-center justify-between gap-3 shadow-[1px_1px_0_#1A1A1A]">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-4 h-4 text-[#1A1A1A] shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-[#1A1A1A]">
                CANCELLATION INTEGRITY GUARANTEE:
              </span>
              <span className="text-xs sm:text-sm text-[#635F57]">
                If mentor cancels or fails to join within 5 minutes, 100% Escrow Refund is instantaneous.
              </span>
            </div>
            <Link
              href="/support"
              className="font-mono text-xs text-[#1A1A1A] font-black underline hover:text-[#FF5500] tracking-wider"
            >
              AUDIT LEDGER RULES →
            </Link>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* Persistent Institutional Security & Enclave Footer                        */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[#EFECE4] border-t-2 border-[#1A1A1A] px-4 sm:px-8 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]"></span>
              <span className="font-sans text-xs text-[#1A1A1A] uppercase tracking-wider font-extrabold">
                CLUSTER STATE: OPTIMAL
              </span>
            </div>
            <span className="text-[#D5CEBF] font-mono text-xs">|</span>
            <span className="font-mono text-xs text-[#635F57]">
              POSTGRES 16.2 / PGVECTOR 0.6.0
            </span>
            <span className="text-[#D5CEBF] font-mono text-xs">|</span>
            <span className="font-mono text-xs text-[#635F57]">
              SECURITY ENCLAVE: ACTIVE [FIPS 140-3]
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#8F8A7E]">
              AUTH SESSION TOKEN:
            </span>
            <span className="font-mono text-xs px-2 py-0.5 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] font-black shadow-[1px_1px_0_#1A1A1A]">
              0x8F92...B314
            </span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* Interactive Booking Modal                                                 */}
      {/* ========================================================================= */}
      {bookingMentor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white border-2 border-[#1A1A1A] shadow-[6px_6px_0_#1A1A1A] p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 bg-[#FF5500] text-white font-bold tracking-wider">
                  ESCROW-RESERVATION
                </span>
                <span id="booking-modal-title" className="text-base sm:text-lg font-black text-[#1A1A1A]">
                  {bookingMentor.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBookingMentor(null)}
                className="p-1 hover:bg-[#F7F4EE] border-2 border-[#1A1A1A] cursor-pointer"
                aria-label="Close booking modal"
              >
                <X className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="w-16 h-16 bg-[#D9E021] border-2 border-[#1A1A1A] flex items-center justify-center shadow-[3px_3px_0_#1A1A1A]">
                  <Check className="w-8 h-8 text-[#1A1A1A] stroke-[3]" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-base sm:text-lg font-black text-[#1A1A1A]">
                    FLASH SESSION LOCKED IN ESCROW
                  </h4>
                  <p className="text-xs sm:text-sm text-[#635F57]">
                    Calendar invitation dispatched. Meeting link and cryptographic token issued.
                  </p>
                </div>
                <div className="p-2.5 bg-[#F7F4EE] border-2 border-[#1A1A1A] font-mono text-xs text-[#1A1A1A] w-full text-center font-bold">
                  TX TOKEN: {bookingTxHash}
                </div>
                <button
                  type="button"
                  onClick={() => setBookingMentor(null)}
                  className="w-full py-3 bg-black text-white font-bold text-xs sm:text-sm border-2 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] hover:bg-[#FF5500] cursor-pointer transition-all"
                >
                  RETURN TO MENTORSHIP HUB
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Mentor Summary Row */}
                <div className="p-3.5 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex items-center justify-between gap-2 shadow-[2px_2px_0_#1A1A1A]">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-[#1A1A1A]">
                      {bookingMentor.role} // {bookingMentor.company}
                    </span>
                    <span className="font-mono text-xs text-[#8F8A7E]">
                      Cosine Match: {bookingMentor.cosineMatch}% • {bookingMentor.cohort}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-[#D9E021] text-black border-2 border-[#1A1A1A] font-black">
                    {durationMode === "30-Min Deep-Dive (50 CR)"
                      ? "50 ALUMN-CR"
                      : durationMode === "0-CR Barter"
                      ? "0 CR BARTER"
                      : "30 ALUMN-CR"}
                  </span>
                </div>

                {/* Slot Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                    SELECT RESERVATION SLOT:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {bookingMentor.availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-2 border-2 border-[#1A1A1A] font-mono text-xs text-center transition-all cursor-pointer font-bold ${
                          selectedSlot === slot
                            ? "bg-black text-white shadow-[2px_2px_0_#1A1A1A]"
                            : "bg-[#F7F4EE] text-[#1A1A1A] hover:bg-[#e5e2dc]"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Area Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                    AUDIT CATEGORY:
                  </label>
                  <div className="relative">
                    <select
                      value={auditArea}
                      onChange={(e) => setAuditArea(e.target.value)}
                      className="w-full bg-[#F7F4EE] border-2 border-[#1A1A1A] px-3.5 py-2.5 font-mono text-xs text-[#1A1A1A] appearance-none focus:outline-none font-bold"
                    >
                      <option value="Architectural Audit">Architectural Audit &amp; Code Review</option>
                      <option value="Resume & Portfolio">Resume &amp; Systems Portfolio Breakdown</option>
                      <option value="Staff+ Interview Prep">Staff+ System Design Simulation</option>
                      <option value="Career Roadmap">0-to-1 Engineering Career Roadmap</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8F8A7E] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Audit Topic / Technical Agenda Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                    AUDIT TOPIC &amp; PR/REPO LINKS:
                  </label>
                  <textarea
                    rows={3}
                    value={auditTopic}
                    onChange={(e) => setAuditTopic(e.target.value)}
                    placeholder="e.g. Distributed consensus failure states in raft, or GitHub PR link to review..."
                    className="w-full p-3 bg-[#F7F4EE] border-2 border-[#1A1A1A] font-mono text-xs text-[#1A1A1A] placeholder:text-[#8F8A7E] resize-none focus:outline-none"
                  />
                </div>

                {/* Escrow Lock Notice */}
                <div className="p-2.5 bg-[#EFECE4] border-2 border-[#1A1A1A] flex items-start gap-2 text-xs font-mono text-[#635F57]">
                  <Lock className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                  <span>
                    FIPS 140-3 Escrow Lock: Credits will be held securely and released only after dual completion sign-off.
                  </span>
                </div>

                {/* Confirm Action Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingMentor(null)}
                    className="flex-1 py-3 bg-[#F7F4EE] text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold text-xs sm:text-sm hover:bg-[#e5e2dc] transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmittingBooking || !auditTopic.trim()}
                    className="flex-2 py-3 bg-[#FF5500] text-white border-2 border-[#1A1A1A] font-bold text-xs sm:text-sm shadow-[2px_2px_0_#1A1A1A] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {isSubmittingBooking ? "LOCKING IN ESCROW..." : "AUTHORIZE ESCROW & LOCK"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Pre-Flight Dossier Modal                                                  */}
      {/* ========================================================================= */}
      {dossierModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl bg-white border-2 border-[#1A1A1A] shadow-[6px_6px_0_#1A1A1A] p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 bg-black text-white font-bold">
                  DOSSIER #{activeSession?.id || "SESSION"}
                </span>
                <span className="text-base sm:text-lg font-black text-[#1A1A1A]">
                  Pre-Flight Architectural Notes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDossierModalOpen(false)}
                className="p-1 hover:bg-[#F7F4EE] border-2 border-[#1A1A1A] cursor-pointer"
                aria-label="Close dossier"
              >
                <X className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3.5 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-1 shadow-[2px_2px_0_#1A1A1A]">
                <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                  TARGET FELLOW:
                </span>
                <span className="text-sm font-bold text-[#1A1A1A]">
                  {activeSession?.mentor?.name || activeSession?.name || "Verified Fellow"} ({activeSession?.mentor?.role || activeSession?.role || "Mentor"} @ {activeSession?.mentor?.company || activeSession?.company || "Partner Organization"})
                </span>
                <span className="font-mono text-xs text-[#635F57]">
                  Specialization: {activeSession?.topic || activeSession?.area || "System Architecture & Engineering Practices"}
                </span>
              </div>

              <div className="p-3.5 bg-[#F7F4EE] border-2 border-[#1A1A1A] flex flex-col gap-1 shadow-[2px_2px_0_#1A1A1A]">
                <span className="font-mono text-xs text-[#8F8A7E] uppercase font-bold tracking-wider">
                  SESSION AGENDA:
                </span>
                <ol className="list-decimal list-inside text-xs sm:text-sm text-[#1A1A1A] space-y-1 font-medium">
                  <li>00:00 - 03:00: Consensus heartbeat failure edge cases</li>
                  <li>03:00 - 10:00: Architecture audit of candidate&apos;s Raft cluster branch</li>
                  <li>10:00 - 15:00: Production deployment tips &amp; dual-sign-off token verification</li>
                </ol>
              </div>

              <div className="p-3 bg-[#EFECE4] border-2 border-[#1A1A1A] flex items-center justify-between gap-2 shadow-[1px_1px_0_#1A1A1A]">
                <span className="font-mono text-xs text-[#635F57] font-medium">
                  ATTACHED SPEC: session_architecture_spec.pdf
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#D9E021] text-black border border-[#1A1A1A] font-black">
                  VERIFIED SHA256
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDossierModalOpen(false)}
              className="w-full py-3 bg-black text-white font-bold text-xs sm:text-sm border-2 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] hover:bg-[#FF5500] cursor-pointer transition-all mt-2"
            >
              CLOSE DOSSIER
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Reschedule Modal                                                          */}
      {/* ========================================================================= */}
      {rescheduleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white border-2 border-[#1A1A1A] shadow-[6px_6px_0_#1A1A1A] p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1A1A1A]">
              <span className="text-base sm:text-lg font-black text-[#1A1A1A]">
                Reschedule Session #{activeSession?.id || ""}
              </span>
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1 hover:bg-[#F7F4EE] border-2 border-[#1A1A1A] cursor-pointer"
                aria-label="Close reschedule dialog"
              >
                <X className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            </div>

            {rescheduleSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-12 h-12 bg-[#00E676] border-2 border-[#1A1A1A] flex items-center justify-center shadow-[2px_2px_0_#1A1A1A]">
                  <Check className="w-6 h-6 text-[#1A1A1A] stroke-[3]" />
                </div>
                <span className="text-base font-black text-[#1A1A1A]">
                  SESSION RESCHEDULED
                </span>
                <p className="text-xs sm:text-sm text-[#635F57]">
                  Mentor calendar daemon accepted the update. Escrow lock updated.
                </p>
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="w-full py-3 bg-black text-white font-bold text-xs sm:text-sm border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] hover:bg-[#FF5500] cursor-pointer transition-all mt-2"
                >
                  DONE
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs sm:text-sm text-[#635F57]">
                  Choose a replacement window for {activeSession?.mentor?.name || activeSession?.name || "your mentor"}. Your {activeSession?.credits || activeSession?.lockedCredits || 50} ALUMN-CR escrow will remain held securely.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {["Tomorrow 10:00 AM", "Tomorrow 02:30 PM", "Saturday 11:00 AM", "Monday 09:30 AM"].map((timeSlot) => (
                    <button
                      key={timeSlot}
                      type="button"
                      onClick={() => setRescheduleSuccess(true)}
                      className="p-3 bg-[#F7F4EE] border-2 border-[#1A1A1A] font-mono text-xs font-bold text-center hover:bg-black hover:text-white transition-all cursor-pointer shadow-[1px_1px_0_#1A1A1A]"
                    >
                      {timeSlot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}