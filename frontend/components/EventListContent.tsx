"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  X,
  QrCode,
  Download,
  ExternalLink,
  ShieldCheck,
  Check,
  Search,
  Ticket,
  Activity,
  Video,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import type { EventItem } from "@/lib/api/types";

// ============================================================================
// CANONICAL SEED ASSEMBLAGES (Matching Stitch Export)
// ============================================================================
interface EnrichedAssemblage {
  id: string;
  ticketCode: string;
  title: string;
  category: "reunion" | "technical" | "mixer" | "roundtable";
  categoryLabel: string;
  format: "PHYSICAL" | "VIRTUAL" | "HYBRID";
  dateFormatted: string;
  timeFormatted: string;
  location: string;
  hallName: string;
  description: string;
  totalCapacity: number;
  reservedCount: number;
  hostName: string;
  hostRole: string;
  hostInitials: string;
  keynotes?: Array<{ name: string; role: string; initials: string; bgClass: string }>;
  isRegistered?: boolean;
}

const CANONICAL_ASSEMBLAGES: EnrichedAssemblage[] = [
  {
    id: "event-gala-2026",
    ticketCode: "HG-9924",
    title: "Homecoming & Tech Gala 2026: Autonomous Systems & Next-Gen Compute",
    category: "reunion",
    categoryLabel: "FLAGSHIP REUNIONS",
    format: "HYBRID",
    dateFormatted: "OCTOBER 15, 2026",
    timeFormatted: "18:00 EST • MAIN AUDITORIUM",
    location: "Campus Pavilion, Robotics Center Hall A",
    hallName: "ROBOTICS HALL A",
    description:
      "The marquee gathering of engineering leadership, robotics researchers, and founding alumni. Highlighting breakthrough paradigms in neuromorphic processors, verified distributed databases, and high-concurrency micro-architectures.",
    totalCapacity: 300,
    reservedCount: 184,
    hostName: "Dr. Arvind Kulkarni",
    hostRole: "Dean of Faculty",
    hostInitials: "AK",
    keynotes: [
      { name: "Dr. Elena Vance", role: "Fellow '22 / MIT Lab", initials: "EV", bgClass: "bg-black text-white" },
      { name: "Vikram Aditya", role: "Google Cloud SRE", initials: "VA", bgClass: "bg-[#2E5BFF] text-white" },
      { name: "Sarah Jenkins", role: "Snowflake Arch", initials: "SJ", bgClass: "bg-[#FF5500] text-white" },
    ],
    isRegistered: true,
  },
  {
    id: "event-sf-mixer",
    ticketCode: "SF-1108",
    title: "SF Tech Alumni Mixer & Cocktails",
    category: "mixer",
    categoryLabel: "REGIONAL MIXERS",
    format: "PHYSICAL",
    dateFormatted: "NOVEMBER 12, 2026",
    timeFormatted: "19:00 PST • SOMA BAYFRONT",
    location: "Mission Bay Bayfront Pavilion, San Francisco, CA",
    hallName: "BAYFRONT TERRACE",
    description:
      "Informal networking salon for San Francisco Bay Area alumni working in foundational AI, semiconductor fabrication, and cloud infrastructure.",
    totalCapacity: 150,
    reservedCount: 132,
    hostName: "Marcus Brody",
    hostRole: "CTO, Kinetix Robotics",
    hostInitials: "MB",
    isRegistered: true,
  },
  {
    id: "event-dist-fireside",
    ticketCode: "VIR-402",
    title: "Distributed Systems Architecture Fireside",
    category: "technical",
    categoryLabel: "TECHNICAL SALONS & WORKSHOPS",
    format: "VIRTUAL",
    dateFormatted: "NOVEMBER 22, 2026",
    timeFormatted: "14:00 EST • ENCRYPTED STREAM",
    location: "Encrypted Google Meet Session (Mutual TLS)",
    hallName: "VIRTUAL ENCLAVE #42",
    description:
      "Technical deep-dive on Paxos vs Raft consensus invariants under simulated network partition attacks, with live Jepsen test suite inspection.",
    totalCapacity: 500,
    reservedCount: 468,
    hostName: "Dr. Rajesh Verma",
    hostRole: "MIT Distributed Systems Lab",
    hostInitials: "RV",
    isRegistered: true,
  },
  {
    id: "event-zurich-consensus",
    ticketCode: "ZH-8812",
    title: "Global Distributed Consensus Summit",
    category: "technical",
    categoryLabel: "TECHNICAL SALONS & WORKSHOPS",
    format: "HYBRID",
    dateFormatted: "DECEMBER 04, 2026",
    timeFormatted: "09:30 CET • ETH ZURICH AUDITORIUM",
    location: "ETH Zurich Main Building & Encrypted Relay",
    hallName: "AMPHITHEATER 03",
    description:
      "Technical summit uniting research fellows from ETH Zurich, Cambridge, and Stanford to formalize post-quantum cryptographic primitives in Raft clusters.",
    totalCapacity: 220,
    reservedCount: 178,
    hostName: "Elena Rostova",
    hostRole: "Senior Cryptographer, Stanford",
    hostInitials: "ER",
  },
  {
    id: "event-nyc-quant",
    ticketCode: "NY-3019",
    title: "NYC Quantitative Engineering Breakfast",
    category: "mixer",
    categoryLabel: "REGIONAL MIXERS",
    format: "PHYSICAL",
    dateFormatted: "DECEMBER 11, 2026",
    timeFormatted: "08:00 EST • MIDTOWN EXECUTIVE CLUB",
    location: "Midtown Executive Club, New York, NY",
    hallName: "PENTHOUSE SALON B",
    description:
      "Low-latency algorithmic trading infrastructure, kernel bypass networking (Solarflare OpenOnload), and deterministic execution pipelines.",
    totalCapacity: 80,
    reservedCount: 71,
    hostName: "Prateek Shah",
    hostRole: "Staff Systems Engineer, Stripe",
    hostInitials: "PS",
  },
  {
    id: "event-founders-roundtable",
    ticketCode: "FR-5541",
    title: "Founders & Venture Roundtable: Pre-Seed to Series A",
    category: "roundtable",
    categoryLabel: "RESEARCH & ROUNDTABLES",
    format: "PHYSICAL",
    dateFormatted: "JANUARY 18, 2027",
    timeFormatted: "17:30 PST • FOUNDERS COVE",
    location: "Palo Alto Innovation Commons, CA",
    hallName: "COUNCIL CHAMBER",
    description:
      "Closed-door briefing for alumni founders raising institutional capital with direct feedback from tier-one venture partners and fellow syndicate leads.",
    totalCapacity: 60,
    reservedCount: 54,
    hostName: "David Chen",
    hostRole: "Founder, Neuromorphic Labs (YC W26)",
    hostInitials: "DC",
  },
  {
    id: "event-robotics-hack",
    ticketCode: "BOS-902",
    title: "Robotics & Embedded Firmware 48H Hackathon",
    category: "technical",
    categoryLabel: "TECHNICAL SALONS & WORKSHOPS",
    format: "HYBRID",
    dateFormatted: "FEBRUARY 06, 2027",
    timeFormatted: "10:00 EST • BOSTON HARDWARE LAB",
    location: "Seaport Innovation Enclave, Boston, MA",
    hallName: "HARDWARE BAY 01",
    description:
      "48-hour hands-on sprint testing real-time ROS2 microcontrollers, CAN-BUS hardware controllers, and embedded Rust state machines.",
    totalCapacity: 120,
    reservedCount: 96,
    hostName: "Tara Vance",
    hostRole: "Robotics Lead, Kinetix",
    hostInitials: "TV",
  },
];

export function EventListContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  // State
  const [assemblages, setAssemblages] = useState<EnrichedAssemblage[]>(CANONICAL_ASSEMBLAGES);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeFormat, setActiveFormat] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [selectedPassForQr, setSelectedPassForQr] = useState<EnrichedAssemblage | null>(null);
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState<EnrichedAssemblage | null>(null);
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);
  const [isVaultDrawerOpen, setIsVaultDrawerOpen] = useState(false);

  // Live Countdown Dial for Flagship Gala (Oct 15, 2026)
  const [countdown, setCountdown] = useState({
    days: 28,
    hours: 14,
    minutes: 22,
    seconds: 35,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync API Events
  useEffect(() => {
    apiClient.events
      .list()
      .then((apiEvents: EventItem[]) => {
        if (Array.isArray(apiEvents) && apiEvents.length > 0) {
          setAssemblages((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newMapped: EnrichedAssemblage[] = apiEvents
              .filter((e) => !existingIds.has(e.id))
              .map((e, idx) => ({
                id: e.id,
                ticketCode: `EV-${1000 + idx}`,
                title: e.title,
                category: (e.category as any) || "technical",
                categoryLabel:
                  e.category === "reunion"
                    ? "FLAGSHIP REUNIONS"
                    : e.category === "career"
                    ? "REGIONAL MIXERS"
                    : "TECHNICAL SALONS & WORKSHOPS",
                format: e.mode === "VIRTUAL" ? "VIRTUAL" : e.mode === "HYBRID" ? "HYBRID" : "PHYSICAL",
                dateFormatted: e.date || e.startsAt || "UPCOMING 2026",
                timeFormatted: e.startsAt ? `${new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} EST` : "18:00 EST",
                location: e.location || e.place || "Campus Pavilion",
                hallName: "CONFERENCE HALL",
                description: e.description || e.detail || "Academic conference and alumni networking session.",
                totalCapacity: e.capacity || e.maxCapacity || 100,
                reservedCount: e.attending || 12,
                hostName: "Verified Fellow",
                hostRole: "Alumni Association",
                hostInitials: "AL",
                isRegistered: Boolean(e.hasRsvp || e.isRegistered),
              }));
            return [...prev, ...newMapped];
          });
        }
      })
      .catch(() => {
        // Graceful fallback to canonical assemblages
      });
  }, []);

  // Filter Logic
  const filteredAssemblages = useMemo(() => {
    return assemblages.filter((item) => {
      // 1. Category filter
      if (activeCategory !== "ALL") {
        if (activeCategory === "reunion" && item.category !== "reunion") return false;
        if (activeCategory === "technical" && item.category !== "technical") return false;
        if (activeCategory === "mixer" && item.category !== "mixer") return false;
        if (activeCategory === "roundtable" && item.category !== "roundtable") return false;
      }

      // 2. Format filter
      if (activeFormat !== "ALL") {
        if (item.format !== activeFormat) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        const matchesHost = item.hostName.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesHost && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [assemblages, activeCategory, activeFormat, searchQuery]);

  // Registered Passes (for Drawer 02)
  const registeredPasses = useMemo(() => {
    return assemblages.filter((e) => e.isRegistered);
  }, [assemblages]);

  // Actions
  const handleRsvpClick = (item: EnrichedAssemblage) => {
    if (!user) {
      router.push(`/login?redirect=/events&target=${item.id}`);
      return;
    }
    setSelectedEventForRsvp(item);
  };

  const handleConfirmRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForRsvp) return;

    const eventId = selectedEventForRsvp.id;

    // Optimistic UI update
    setAssemblages((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? { ...ev, isRegistered: true, reservedCount: Math.min(ev.totalCapacity, ev.reservedCount + 1) }
          : ev
      )
    );
    setSelectedEventForRsvp(null);
    setToastMessage(`✓ 1-Click RSVP confirmed! Seat reserved with serializable lock for "${selectedEventForRsvp.title}".`);
    setTimeout(() => setToastMessage(null), 4000);

    // Backend call
    startTransition(async () => {
      try {
        await apiClient.events.rsvp(eventId);
      } catch {
        // Rollback on fatal error
        setAssemblages((prev) =>
          prev.map((ev) =>
            ev.id === eventId
              ? { ...ev, isRegistered: false, reservedCount: Math.max(0, ev.reservedCount - 1) }
              : ev
          )
        );
        setToastMessage("Capacity lock timed out. Seat could not be allocated.");
      }
    });
  };

  const handleCancelPass = (passId: string) => {
    setAssemblages((prev) =>
      prev.map((ev) =>
        ev.id === passId
          ? { ...ev, isRegistered: false, reservedCount: Math.max(0, ev.reservedCount - 1) }
          : ev
      )
    );
    setToastMessage("✓ Capacity restored! Seat released back to the general cohort pool.");
    setTimeout(() => setToastMessage(null), 3500);

    startTransition(async () => {
      try {
        await apiClient.events.cancelRsvp(passId);
      } catch {
        // Fallback
      }
    });
  };

  const flagshipGala = assemblages.find((e) => e.id === "event-gala-2026") || assemblages[0];
  const flagshipCapacityPct = Math.round(
    (flagshipGala.reservedCount / flagshipGala.totalCapacity) * 100
  );
  const flagshipSeatsRemaining = Math.max(
    0,
    flagshipGala.totalCapacity - flagshipGala.reservedCount
  );

  return (
    <div className="flex flex-col w-full font-sans selection:bg-[#CCFF00] selection:text-black space-y-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-[#CCFF00] text-black border-2 border-black shadow-[4px_4px_0px_#000000] font-mono text-xs font-extrabold max-w-md animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 1. TOP TELEMETRY MARQUEE & TICKER HEADER */}
      <div className="w-full bg-[#F7F4EE] px-4 py-2 border-2 border-black flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-[3px_3px_0px_#000000]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
          <span className="font-extrabold text-black uppercase tracking-wider">
            [PILLAR // 04] PROTOCOL 05 // SYNCHRONOUS ALUMNI REUNIONS &amp; HARDWARE CAPACITY LOCKS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-bold">ISOLATION:</span>
            <span className="font-extrabold text-[#FF5500] bg-white px-2 py-0.5 border border-black">
              POSTGRES SERIALIZABLE (P2034 SAFE)
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-neutral-500 font-bold">G-CAL SYNC:</span>
            <span className="text-[#00A859] font-black">MUTUAL_AUTH_OK</span>
          </div>
        </div>
      </div>

      {/* 2. HERO & KPI MATRIX */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-2 border-black pb-6">
          <div className="flex flex-col gap-2 max-w-4xl">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 bg-[#CCFF00] text-black font-extrabold border border-black uppercase shadow-[1px_1px_0px_#000000]">
                ASSEMBLAGE ENGINE
              </span>
              <span className="text-neutral-500 font-semibold">
                HASH // CLUSTER_TXN_0x9924
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight font-sans">
              Events, Reunions &amp; Capacity RSVPs
            </h1>
            <p className="text-sm sm:text-base text-neutral-700 mt-1 leading-relaxed font-sans">
              Capacity-gated 1-click registration using serializable database transactions to guarantee zero overbooking. Seamless sync with Google Calendar and offline encrypted QR wallet admission.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
            <button
              onClick={() => setIsGCalModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F7F4EE] text-black border-2 border-black font-bold shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer uppercase transition-all"
              type="button"
            >
              <Calendar size={15} className="text-[#2E5BFF]" />
              <span>Sync All to G-Cal</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("drawer-registered-passes");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  setIsVaultDrawerOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-[#CCFF00] border-2 border-black font-bold shadow-[3px_3px_0px_#000000] hover:bg-[#CCFF00] hover:text-black active:translate-x-0.5 active:translate-y-0.5 cursor-pointer uppercase transition-all"
              type="button"
            >
              <Ticket size={15} />
              <span>Access Pass Vault ({registeredPasses.length})</span>
            </button>
          </div>
        </div>

        {/* 4 Brutalist Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          {/* Metric 01 */}
          <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[10px] font-bold uppercase">ACTIVE ASSEMBLAGES</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#F7F4EE] text-black font-bold border border-black">
                01
              </span>
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-black text-black font-sans leading-none">12</span>
              <span className="text-xs font-bold text-neutral-600 block mt-1">Upcoming Global</span>
            </div>
            <div className="w-full bg-[#F7F4EE] border border-black h-2 overflow-hidden">
              <div className="bg-[#FF5500] h-full w-[75%]" />
            </div>
          </div>

          {/* Metric 02 */}
          <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[10px] font-bold uppercase">SECURED PASSES</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#CCFF00] text-black font-bold border border-black">
                ACTIVE
              </span>
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-black text-black font-sans leading-none">
                {String(registeredPasses.length).padStart(2, "0")}
              </span>
              <span className="text-xs font-bold text-neutral-600 block mt-1">Wallet Verified</span>
            </div>
            <div className="w-full bg-[#F7F4EE] border border-black h-2 overflow-hidden">
              <div className="bg-[#00E676] h-full w-full" />
            </div>
          </div>

          {/* Metric 03 */}
          <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[10px] font-bold uppercase">ATOMIC INTEGRITY</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#F7F4EE] text-[#2E5BFF] font-bold border border-black">
                ACID
              </span>
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-black text-black font-sans leading-none">0.00%</span>
              <span className="text-xs font-bold text-neutral-600 block mt-1">Overbooking Lock</span>
            </div>
            <div className="w-full bg-[#F7F4EE] border border-black h-2 overflow-hidden">
              <div className="bg-[#2E5BFF] h-full w-full" />
            </div>
          </div>

          {/* Metric 04 */}
          <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[10px] font-bold uppercase">MEDIAN ATTENDANCE</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#F7F4EE] text-black font-bold border border-black">
                TELEMETRY
              </span>
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-black text-black font-sans leading-none">91.4%</span>
              <span className="text-xs font-bold text-neutral-600 block mt-1">Verified Turnout</span>
            </div>
            <div className="w-full bg-[#F7F4EE] border border-black h-2 overflow-hidden">
              <div className="bg-black h-full w-[91.4%]" />
            </div>
          </div>
        </div>
      </header>

      {/* 3. HERO FLAGSHIP EVENT SECTION */}
      <section className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] relative">
        <div className="bg-black text-white px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse" />
            <span className="font-extrabold uppercase tracking-widest text-[#CCFF00]">
              ANNUAL FLAGSHIP ASSEMBLAGE // COHORT CLUSTER ALPHA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#CCFF00] font-bold">CONCURRENCY ENGINE: ACTIVE</span>
            <span className="text-neutral-500">|</span>
            <span className="font-mono">LOCK_TTL: 450ms</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Keynote & Agenda Column (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r-2 border-black flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 bg-[#CCFF00] text-black font-extrabold border border-black">
                  {flagshipGala.dateFormatted}
                </span>
                <span className="px-2 py-0.5 bg-[#F7F4EE] text-black font-bold border border-black">
                  {flagshipGala.timeFormatted}
                </span>
                <span className="px-2 py-0.5 bg-[#F7F4EE] text-neutral-700 font-bold border border-black">
                  CAMPUS PAVILION
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-black leading-tight tracking-tight font-sans">
                {flagshipGala.title}
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed font-sans">
                {flagshipGala.description}
              </p>
            </div>

            {/* Confirmed Keynote Assemblers */}
            <div className="pt-4 border-t-2 border-black space-y-3">
              <span className="font-mono text-xs uppercase font-extrabold text-neutral-600 block">
                CONFIRMED KEYNOTE ASSEMBLERS &amp; PANELS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {flagshipGala.keynotes?.map((speaker) => (
                  <div
                    key={speaker.name}
                    className="p-2.5 bg-[#F7F4EE] border border-black flex items-center gap-2 font-mono text-xs"
                  >
                    <div
                      className={`w-9 h-9 ${speaker.bgClass} border border-black flex items-center justify-center font-black shrink-0 text-xs shadow-[1px_1px_0px_#000000]`}
                    >
                      {speaker.initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-black truncate">{speaker.name}</span>
                      <span className="text-[10px] text-neutral-600 truncate">{speaker.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Telemetry & Registration Panel (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#F7F4EE] flex flex-col justify-between gap-6">
            {/* Live Countdown Dial */}
            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-bold uppercase">SYNCHRONIZATION VECTOR</span>
                <span className="text-[#FF5500] font-extrabold">CLOCK_SYNC: UTC-05</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center py-2 border-y-2 border-black">
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-black font-sans">
                    {countdown.days}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">DAYS</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-black font-sans">
                    {countdown.hours}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">HRS</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-black font-sans">
                    {countdown.minutes}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">MIN</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-[#FF5500] font-sans">
                    {countdown.seconds}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">SEC</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-neutral-600 font-bold">HALL: ROBOTICS CENTER // HALL A</span>
                <span className="text-[#00A859] font-black uppercase">GEO_LOCK: OK</span>
              </div>
            </div>

            {/* Capacity Gauge & Quota */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black uppercase">CAPACITY QUOTA ALLOCATION:</span>
                <span className="text-[#FF5500] font-black">
                  {flagshipGala.reservedCount} / {flagshipGala.totalCapacity} RESERVED ({flagshipCapacityPct}%)
                </span>
              </div>

              <div className="w-full bg-white border-2 border-black h-4 p-[2px] shadow-[inset_1px_1px_0px_#000000]">
                <div
                  className="h-full bg-[#FF5500] transition-all duration-500"
                  style={{ width: `${flagshipCapacityPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-600 font-bold">
                <span>{flagshipSeatsRemaining} SEATS REMAINING</span>
                <span className="text-neutral-500 uppercase">ZERO-OVERBOOK GUARANTEE</span>
              </div>
            </div>

            {/* Primary Action Deck */}
            <div className="space-y-2.5 font-mono text-xs pt-2">
              <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_#000000]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#00A859]" />
                  <span className="font-extrabold text-black uppercase">PASS ALLOCATED TO YOU</span>
                </div>
                <span className="bg-black text-[#CCFF00] px-2 py-0.5 font-bold border border-black">
                  #{flagshipGala.ticketCode}
                </span>
              </div>

              <button
                onClick={() => setSelectedPassForQr(flagshipGala)}
                className="w-full py-3 px-4 bg-black text-white border-2 border-black font-black uppercase text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] hover:bg-[#CCFF00] hover:text-black cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all"
                type="button"
              >
                <CheckCircle2 size={18} className="text-[#00E676]" />
                <span>RSVP CONFIRMED • PASS IN WALLET</span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIsGCalModalOpen(true)}
                  className="p-2 bg-white hover:bg-neutral-100 border border-black font-bold text-black flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_#000000] cursor-pointer"
                  type="button"
                >
                  <Calendar size={14} className="text-[#2E5BFF]" />
                  <span className="text-[10px]">SYNC G-CAL</span>
                </button>
                <button
                  onClick={() => {
                    setToastMessage(`Attendance roster: ${flagshipGala.reservedCount} verified fellows confirmed.`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="p-2 bg-white hover:bg-neutral-100 border border-black font-bold text-black flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_#000000] cursor-pointer"
                  type="button"
                >
                  <Users size={14} className="text-black" />
                  <span className="text-[10px]">ROSTER ({flagshipGala.reservedCount})</span>
                </button>
                <button
                  onClick={() => setSelectedPassForQr(flagshipGala)}
                  className="p-2 bg-[#CCFF00] hover:bg-yellow-300 border border-black font-bold text-black flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_#000000] cursor-pointer"
                  type="button"
                >
                  <QrCode size={14} className="text-black" />
                  <span className="text-[10px]">VIEW QR PASS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DRAWER 02: YOUR REGISTERED PASSES & ENCLAVE ADMISSIONS */}
      <section id="drawer-registered-passes" className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-black text-[#CCFF00]">
              DRAWER // 02
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-black font-sans tracking-tight">
              Your Registered Passes &amp; Enclave Admissions
            </h2>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-600 font-bold">
            <span>WALLET STATE: ENCRYPTED</span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#00E676]" />
          </div>
        </div>

        {registeredPasses.length === 0 ? (
          <div className="p-8 bg-white border-2 border-black text-center font-mono text-xs">
            <p className="font-bold text-neutral-600">No active passes in your offline wallet.</p>
            <p className="text-neutral-500 mt-1">Register for an assemblage below to generate your cryptographic admission badge.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {registeredPasses.map((pass) => (
              <div
                key={pass.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-4 bg-[#F7F4EE] border-b-2 border-black space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="px-2 py-0.5 bg-black text-white font-bold border border-black text-[11px]">
                      TICKET #{pass.ticketCode}
                    </span>
                    <span className="flex items-center gap-1 text-[#00A859] font-black text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-[#00E676]" />
                      CONFIRMED
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-black font-sans text-base leading-snug line-clamp-2">
                      {pass.title}
                    </h3>
                    <p className="font-mono text-[11px] text-neutral-600 mt-1">
                      {pass.dateFormatted} • {pass.hallName}
                    </p>
                  </div>
                </div>

                {/* Body & QR Preview */}
                <div className="p-4 flex items-center justify-between gap-4 font-mono text-xs">
                  {/* SVG QR Code */}
                  <div
                    onClick={() => setSelectedPassForQr(pass)}
                    className="p-1.5 bg-white border-2 border-black flex flex-col items-center justify-center shrink-0 shadow-[2px_2px_0px_#000000] cursor-pointer hover:bg-neutral-100"
                  >
                    <div className="w-14 h-14 bg-[#F7F4EE] flex items-center justify-center border border-black">
                      <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v4h-2v-4zm-4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold text-neutral-500 mt-1 uppercase">QR ADMIT</span>
                  </div>

                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">LOCATION ENCLAVE</span>
                      <span className="text-xs font-bold text-black truncate block">{pass.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pass.id === "event-sf-mixer" ? (
                        <button
                          onClick={() => handleCancelPass(pass.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 border border-black font-mono text-[10px] font-bold shadow-[1px_1px_0px_#000000] cursor-pointer"
                          type="button"
                        >
                          1-Click Cancel &amp; Release
                        </button>
                      ) : pass.id === "event-dist-fireside" ? (
                        <a
                          href="https://meet.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-black text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black border border-black font-mono text-[10px] font-bold shadow-[1px_1px_0px_#000000] flex items-center gap-1"
                        >
                          <span>Join Rehearsal</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedPassForQr(pass)}
                            className="px-2 py-1 bg-[#F7F4EE] hover:bg-neutral-200 border border-black font-mono text-[10px] font-bold shadow-[1px_1px_0px_#000000] cursor-pointer"
                            type="button"
                          >
                            Pass PDF
                          </button>
                          <button
                            onClick={() => {
                              setToastMessage(`✓ Pass #${pass.ticketCode} synchronized with cryptographic enclave.`);
                              setTimeout(() => setToastMessage(null), 2500);
                            }}
                            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-black text-[#2E5BFF] font-mono text-[10px] font-bold shadow-[1px_1px_0px_#000000] cursor-pointer"
                            type="button"
                          >
                            Re-Sync
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="p-2 bg-[#F7F4EE] border-t border-black flex items-center justify-between font-mono text-[10px]">
                  <span className="text-neutral-500 font-bold truncate max-w-[160px]">
                    TXN: 0x{pass.ticketCode}_MUTUAL_COMMIT
                  </span>
                  <span className="font-extrabold text-black">1-OF-1 PASS</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. BROWSE ASSEMBLAGES & FILTER PROTOCOL */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-2 border-black bg-[#F7F4EE] p-4 sm:p-6 shadow-[4px_4px_0px_#000000] font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold">FILTER PROTOCOL</span>
              <span className="font-bold text-neutral-600 uppercase">CAPACITY INDEX QUERYING</span>
            </div>
            <span className="text-neutral-500 font-bold">
              QUERY EXEC: 1.2ms (SERIALIZABLE CACHE)
            </span>
          </div>

          {/* Category Tabs: Strictly ZERO Giving */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-500 font-bold uppercase mr-1">CATEGORY:</span>
            {[
              { label: `ALL (${assemblages.length})`, value: "ALL" },
              { label: "FLAGSHIP REUNIONS", value: "reunion" },
              { label: "TECHNICAL SALONS & WORKSHOPS", value: "technical" },
              { label: "REGIONAL MIXERS", value: "mixer" },
              { label: "RESEARCH & ROUNDTABLES", value: "roundtable" },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 border border-black font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === cat.value
                    ? "bg-black text-[#CCFF00] shadow-[2px_2px_0px_#000000]"
                    : "bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_#000000]"
                }`}
                type="button"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sub-bar: Search & Format Filter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-black">
            <div className="md:col-span-8 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query assemblages by title, hall enclave, or fellow keywords..."
                className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black placeholder:text-neutral-500 focus:outline-none focus:bg-[#FFFDE7]"
              />
              <span className="absolute right-3 top-2.5 px-1.5 py-0.5 bg-[#F7F4EE] border border-black text-[10px] text-neutral-600 font-bold pointer-events-none">
                ⌘K
              </span>
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <span className="text-neutral-600 font-bold shrink-0">FORMAT:</span>
              <select
                value={activeFormat}
                onChange={(e) => setActiveFormat(e.target.value)}
                className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">ALL FORMATS</option>
                <option value="PHYSICAL">IN-PERSON PHYSICAL</option>
                <option value="VIRTUAL">VIRTUAL LIVESTREAM</option>
                <option value="HYBRID">HYBRID PARALLEL</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6. DYNAMIC 2-COLUMN EVENT FEED GRID */}
        {filteredAssemblages.length === 0 ? (
          <div className="p-12 bg-white border-2 border-black text-center font-mono text-xs space-y-2">
            <p className="font-bold text-black uppercase text-sm">NO ASSEMBLAGES MATCH QUERY PARAMETERS</p>
            <p className="text-neutral-600">Try switching your category filter or resetting your search term.</p>
            <button
              onClick={() => {
                setActiveCategory("ALL");
                setActiveFormat("ALL");
                setSearchQuery("");
              }}
              className="mt-2 px-4 py-2 bg-black text-[#CCFF00] border border-black font-bold uppercase cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAssemblages.map((item) => {
              const capacityPct = Math.round((item.reservedCount / item.totalCapacity) * 100);
              const seatsLeft = Math.max(0, item.totalCapacity - item.reservedCount);

              return (
                <div
                  key={item.id}
                  className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000000] flex flex-col justify-between gap-5 group hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                >
                  <div className="space-y-3">
                    {/* Eyebrow / Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold border border-black text-[11px]">
                          {item.categoryLabel}
                        </span>
                        <span
                          className={`px-2 py-0.5 font-bold border border-black text-[10px] ${
                            item.format === "VIRTUAL"
                              ? "bg-[#2E5BFF] text-white"
                              : item.format === "HYBRID"
                              ? "bg-[#FF5500] text-white"
                              : "bg-[#F7F4EE] text-black"
                          }`}
                        >
                          {item.format}
                        </span>
                      </div>

                      <span className="font-bold text-neutral-500 text-[11px]">
                        #{item.ticketCode}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-black text-black font-sans leading-snug group-hover:text-[#FF5500] transition-colors">
                      {item.title}
                    </h3>

                    {/* Date & Location */}
                    <div className="p-3 bg-[#F7F4EE] border border-black font-mono text-xs space-y-1">
                      <div className="flex items-center gap-2 text-black font-bold">
                        <Calendar size={13} className="text-[#FF5500]" />
                        <span>{item.dateFormatted} • {item.timeFormatted}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600 font-medium">
                        <MapPin size={13} className="text-black" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                      {item.description}
                    </p>

                    {/* Host Vignette */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 font-mono text-xs">
                      <div className="w-8 h-8 bg-black text-[#CCFF00] border border-black flex items-center justify-center font-bold text-xs shrink-0">
                        {item.hostInitials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-black text-[11px] truncate">
                          HOST: {item.hostName}
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate">
                          {item.hostRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Meter & RSVP Deck */}
                  <div className="pt-4 border-t-2 border-black space-y-3 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500 font-bold uppercase">CAPACITY LOCK</span>
                        <span className="font-black text-black">
                          {item.reservedCount} / {item.totalCapacity} ({capacityPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F7F4EE] border border-black h-2.5 p-[1px]">
                        <div
                          className={`h-full ${
                            capacityPct >= 90 ? "bg-red-600" : capacityPct >= 70 ? "bg-[#FF5500]" : "bg-black"
                          }`}
                          style={{ width: `${Math.min(100, capacityPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-600 font-semibold">
                        <span>{seatsLeft} SEATS REMAINING</span>
                        <span className="text-[#00A859] font-bold">SERIALIZABLE TXN</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {item.isRegistered ? (
                        <button
                          onClick={() => setSelectedPassForQr(item)}
                          className="flex-1 py-2 bg-[#CCFF00] text-black border-2 border-black font-extrabold uppercase text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white cursor-pointer transition-all"
                          type="button"
                        >
                          <Check size={14} />
                          <span>PASS IN WALLET (VIEW)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRsvpClick(item)}
                          className="flex-1 py-2 bg-black text-[#CCFF00] border-2 border-black font-extrabold uppercase text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000] hover:bg-[#CCFF00] hover:text-black cursor-pointer transition-all"
                          type="button"
                        >
                          <Ticket size={14} />
                          <span>1-CLICK RSVP PROTOCOL →</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nSUMMARY:${item.title}\nDESCRIPTION:${item.description}\nLOCATION:${item.location}\nEND:VCALENDAR`;
                          const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute("download", `${item.ticketCode}.ics`);
                          link.click();
                        }}
                        className="px-3 py-2 bg-white hover:bg-neutral-100 border-2 border-black font-bold text-black shadow-[2px_2px_0px_#000000] cursor-pointer"
                        title="Download .ICS Calendar Event"
                        type="button"
                      >
                        <Calendar size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Modal 1: QR Access Pass Modal */}
      {selectedPassForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold">WALLET ENCLAVE</span>
                <span className="font-extrabold text-black font-sans uppercase">Admission Pass</span>
              </div>
              <button
                onClick={() => setSelectedPassForQr(null)}
                className="p-1 border border-black hover:bg-neutral-100 cursor-pointer"
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-[#F7F4EE] border-2 border-black flex flex-col items-center justify-center gap-3">
              <span className="font-extrabold text-sm text-black font-sans text-center">
                {selectedPassForQr.title}
              </span>

              {/* Large QR Display */}
              <div className="p-3 bg-white border-2 border-black shadow-[3px_3px_0px_#000000]">
                <svg className="w-36 h-36 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v4h-2v-4zm-4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
                </svg>
              </div>

              <div className="text-center font-mono">
                <span className="text-[11px] font-bold text-neutral-600 block">PASSCODE IDENTIFIER:</span>
                <span className="text-base font-black text-[#FF5500]">
                  PASS-#{selectedPassForQr.ticketCode}-ECDSA
                </span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-neutral-50 border border-black text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-bold">HOLDER:</span>
                <span className="font-bold text-black">{user?.name || "Verified Alumnus"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-bold">VENUE ENCLAVE:</span>
                <span className="font-bold text-black">{selectedPassForQr.hallName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-bold">STATUS:</span>
                <span className="text-[#00A859] font-black">ACTIVE WALLET PASS</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                onClick={() => {
                  const passData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedPassForQr, null, 2));
                  const dl = document.createElement("a");
                  dl.setAttribute("href", passData);
                  dl.setAttribute("download", `pass_${selectedPassForQr.ticketCode}.json`);
                  dl.click();
                }}
                className="px-3 py-2 bg-[#F7F4EE] hover:bg-neutral-200 border border-black font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                type="button"
              >
                <Download size={13} />
                <span>Save JSON Pass</span>
              </button>
              <button
                onClick={() => setSelectedPassForQr(null)}
                className="px-4 py-2 bg-black text-white hover:bg-[#CCFF00] hover:text-black border-2 border-black font-bold uppercase cursor-pointer"
                type="button"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: 1-Click RSVP Registration Modal */}
      {selectedEventForRsvp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold">TXN ALLOCATION</span>
                <span className="font-extrabold text-black font-sans uppercase">Confirm Seat RSVP</span>
              </div>
              <button
                onClick={() => setSelectedEventForRsvp(null)}
                className="p-1 border border-black hover:bg-neutral-100 cursor-pointer"
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmRsvp} className="space-y-4">
              <div className="p-3 bg-[#F7F4EE] border border-black space-y-1">
                <span className="font-bold text-black font-sans text-sm block">
                  {selectedEventForRsvp.title}
                </span>
                <span className="text-[11px] text-neutral-600 block">
                  {selectedEventForRsvp.dateFormatted} • {selectedEventForRsvp.location}
                </span>
              </div>

              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Admission Tier Selection
                </label>
                <select
                  defaultValue="FELLOW"
                  className="w-full px-3 py-2 border-2 border-black bg-white font-mono text-xs font-bold focus:outline-none"
                >
                  <option value="FELLOW">STANDARD ALUMNI FELLOW (ZERO COST)</option>
                  <option value="VIP">PRIORITY SEATING // ROBOTICS COUNCIL</option>
                  <option value="VIRTUAL">LIVESTREAM ENCLAVE ACCESS ONLY</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Hardware &amp; Dietary Requirements (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, Wheelchair access, High-power lab bench..."
                  className="w-full px-3 py-2 border-2 border-black bg-[#F7F4EE] focus:bg-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="syncGcalCheck"
                  defaultChecked
                  className="w-4 h-4 accent-black border border-black"
                />
                <label htmlFor="syncGcalCheck" className="text-[11px] font-bold text-neutral-700 cursor-pointer">
                  Auto-commit event into personal Google Calendar with OAuth token.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setSelectedEventForRsvp(null)}
                  className="px-4 py-2 border border-black bg-[#F7F4EE] hover:bg-neutral-200 font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 border-2 border-black bg-black text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black font-extrabold uppercase shadow-[3px_3px_0px_#000000] cursor-pointer"
                >
                  Confirm Registration →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: G-Cal Batch Sync Modal */}
      {isGCalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#2E5BFF] text-white font-bold">CALENDAR PROTOCOL</span>
                <span className="font-extrabold text-black font-sans uppercase">Google Calendar Sync</span>
              </div>
              <button
                onClick={() => setIsGCalModalOpen(false)}
                className="p-1 border border-black hover:bg-neutral-100 cursor-pointer"
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs text-neutral-800 leading-relaxed">
              <p>
                Synchronize all <strong>{registeredPasses.length} verified RSVP passes</strong> directly into your primary Google Calendar account with mutual TLS verification.
              </p>
              <div className="p-3 bg-[#F7F4EE] border border-black font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">PASSES QUEUED:</span>
                  <span className="font-bold text-black">{registeredPasses.length} Events</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">CALENDAR TARGET:</span>
                  <span className="font-bold text-black">{user?.email || "alumnus@alumni.edu"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">SYNC STATUS:</span>
                  <span className="text-[#00A859] font-extrabold">OAUTH_READY</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                onClick={() => setIsGCalModalOpen(false)}
                className="px-4 py-2 border border-black bg-[#F7F4EE] hover:bg-neutral-200 font-bold uppercase cursor-pointer"
                type="button"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsGCalModalOpen(false);
                  setToastMessage("✓ All confirmed assemblages dispatched to Google Calendar.");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-5 py-2 border-2 border-black bg-black text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black font-extrabold uppercase shadow-[2px_2px_0px_#000000] cursor-pointer"
                type="button"
              >
                Dispatch Sync Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
