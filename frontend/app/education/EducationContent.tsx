"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Terminal,
  Activity,
  Coins,
  ShieldCheck,
  Play,
  Flame,
  Plus,
  Lock,
  CheckCircle2,
  X,
  FileText,
  User as UserIcon,
  Check,
  Download,
  Award,
  Layers,
  Cpu,
  Database,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { WatchVideoPlayer } from "@/components/WatchVideoPlayer";
import { apiClient } from "@/lib/api/client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/context/AuthContext";

export interface MarketVideo {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  priceInCredits: number;
  durationSeconds?: number | null;
  duration?: string | null;
  thumbnailUrl?: string | null;
  uploader?: {
    name?: string | null;
    currentCompany?: string | null;
    batchYear?: number | null;
    avatarUrl?: string | null;
  } | null;
  createdAt?: string | Date;
}

interface SprintItem {
  id: string;
  sprintNum: string;
  durationDays: number;
  creditsEarned: number;
  title: string;
  category: "all" | "cryptography" | "distributed" | "silicon";
  fellow: string;
  fellowTitle: string;
  description: string;
  tags: string[];
  passRate: string;
  seatsRemaining: number;
  totalSeats: number;
}

const CURATED_SPRINTS: SprintItem[] = [
  {
    id: "sp-02",
    sprintNum: "SPRINT 02",
    durationDays: 21,
    creditsEarned: 180,
    title: "Post-Quantum Lattice Cryptography & Zero-Knowledge Verification",
    category: "cryptography",
    fellow: "Dr. Elena Rostova",
    fellowTitle: "Stanford Postdoc, '21",
    description: "21-day deep dive into Kyber/Dilithium algorithms, ring-LWE security parameters, and constructing arithmetic circuit zk-SNARK verifiers in Rust.",
    tags: ["#LATTICE", "#KYBER", "#ZK-SNARKS", "#CIRCOM"],
    passRate: "88% VERIFIED PASS",
    seatsRemaining: 14,
    totalSeats: 30,
  },
  {
    id: "sp-03",
    sprintNum: "SPRINT 03",
    durationDays: 10,
    creditsEarned: 95,
    title: "Columnar Database Engine Architecture & SIMD Pushdown",
    category: "distributed",
    fellow: "Sarah Jenkins",
    fellowTitle: "Snowflake Principal Architect, '16",
    description: "10-day hands-on query engine design, vectorized memory execution, Apache Arrow internals, and custom AVX-512 filter pushdown implementations.",
    tags: ["#COLUMNAR", "#SIMD", "#VECTORIZED", "#CPP20"],
    passRate: "94% VERIFIED PASS",
    seatsRemaining: 4,
    totalSeats: 25,
  },
  {
    id: "sp-04",
    sprintNum: "SPRINT 04",
    durationDays: 7,
    creditsEarned: 80,
    title: "Sub-Millisecond Payment Ledger Scalability: 80k tx/sec",
    category: "distributed",
    fellow: "Prateek Shah",
    fellowTitle: "Stripe Core Ledger, '19",
    description: "7-day intense concurrency sprint tackling strict serializability, two-phase commit optimizations, deterministic state replay, and zero double-entry errors.",
    tags: ["#FINTECH", "#LEDGER", "#CONCURRENCY", "#DISTRIBUTED"],
    passRate: "91% VERIFIED PASS",
    seatsRemaining: 8,
    totalSeats: 30,
  },
  {
    id: "sp-05",
    sprintNum: "SPRINT 05",
    durationDays: 14,
    creditsEarned: 140,
    title: "Firmware Co-Design for RISC-V Neural Accelerators",
    category: "silicon",
    fellow: "David Chen",
    fellowTitle: "YC W26 Founder, '17",
    description: "14-day silicon & hardware-software synthesis. Writing custom microcode instructions for tensor processing units, Verilator testbenches, and bare-metal C.",
    tags: ["#RISCV", "#SILICON", "#TENSOR", "#VERILOG"],
    passRate: "82% VERIFIED PASS",
    seatsRemaining: 2,
    totalSeats: 20,
  },
];

export function EducationContent({
  initialVideos = [],
  balance = 350,
  unlockedIds = [],
}: {
  initialVideos: MarketVideo[];
  balance: number;
  unlockedIds: string[];
}) {
  const { user } = useAuth();
  const router = useRouter();

  // Video State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [playingVideo, setPlayingVideo] = useState<MarketVideo | null>(null);
  const [currentBalance, setCurrentBalance] = useState(balance);
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<string[]>(unlockedIds);

  // Sprint Filter & Modals
  const [selectedSprintCategory, setSelectedSprintCategory] = useState<"all" | "cryptography" | "distributed" | "silicon">("all");
  const [enrolledSprintId, setEnrolledSprintId] = useState<string | null>(null);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Filtered Sprints
  const filteredSprints = CURATED_SPRINTS.filter((sp) => {
    if (selectedSprintCategory === "all") return true;
    return sp.category === selectedSprintCategory;
  });

  const handleEnroll = (sprintTitle: string) => {
    if (!user) {
      router.push(`/login?redirect=/education&target=${encodeURIComponent(sprintTitle)}`);
      return;
    }
    setEnrolledSprintId(sprintTitle);
    setSuccessMsg(`Enrolled in ${sprintTitle}! Check your dashboard for runtime access keys.`);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const handleVideoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const file = formData.get("videoFile") as File;

    if (!file || file.size === 0) {
      setErrorMsg("Please select a video file to upload.");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      setErrorMsg("File size exceeds the 150MB limit. Please compress your video.");
      return;
    }

    startTransition(async () => {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(filePath);

        const title = (formData.get("title") as string) || "Untitled Video";
        const description = (formData.get("description") as string) || "";
        await apiClient.video.submit({
          title,
          description,
          videoUrl: publicUrl,
        });

        setSuccessMsg("Technical runbook video uploaded successfully! Moderation in progress.");
        setShowVideoModal(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to submit video";
        setErrorMsg(message);
      }
    });
  };

  const handleUnlock = (videoId: string, cost: number) => {
    if (!user) {
      router.push("/login?redirect=/education");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      try {
        await apiClient.video.unlock(videoId);
        setUnlockedVideoIds((prev) => [...prev, videoId]);
        setCurrentBalance((prev) => Math.max(0, prev - cost));
        setSuccessMsg("Premium video unlocked! Runtime stream activated.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to unlock video";
        setErrorMsg(message);
      }
    });
  };

  return (
    <div className="flex flex-col w-full font-sans selection:bg-[#CCFF00] selection:text-black space-y-10">
      {/* 1. TOP CONTEXT HEADER */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#CCFF00] px-2 py-0.5 font-extrabold shadow-[2px_2px_0px_#000000]">
              [ PILLAR // 07 ]
            </span>
            <span className="uppercase text-[#FF5500] font-bold tracking-wider">
              ACADEMIC REPOSITORY &amp; SPECIALIZED RUNTIMES
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F7F4EE] text-black border border-black shadow-[1px_1px_0px_#000000] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
              SYS_HASH: 0x89F1..E312
            </span>
            <span className="text-neutral-500 font-semibold">EPOCH: 2026.Q2</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-1">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight font-sans">
              Education &amp; Technical Sprint Center
            </h1>
            <p className="text-sm sm:text-base text-neutral-700 max-w-4xl mt-1 leading-relaxed font-sans">
              High-velocity engineering protocols, tactical interview blueprints, and peer-reviewed architectural case studies verified by alumni fellows.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
            <button
              onClick={() => setIsSyllabusModalOpen(true)}
              className="px-4 py-2 bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#F7F4EE] font-bold uppercase transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              type="button"
            >
              Protocol Archive
            </button>
            <button
              onClick={() => {
                if (!user) {
                  router.push("/login?redirect=/education&target=upload");
                } else {
                  setShowVideoModal(true);
                }
              }}
              className="px-4 py-2 bg-black text-[#CCFF00] border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#CCFF00] hover:text-black font-bold uppercase transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              type="button"
            >
              <Plus size={14} />
              <span>Submit Video</span>
            </button>
          </div>
        </div>
      </section>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="p-3 bg-[#CCFF00] border-2 border-black text-black font-mono text-xs font-bold shadow-[3px_3px_0px_#000000] flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-[#FF5500] border-2 border-black text-white font-mono text-xs font-bold shadow-[3px_3px_0px_#000000] flex items-center gap-2">
          <Lock size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. 4 METRIC BENTO CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 font-mono">
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold">METRIC // 01</span>
            <Terminal size={18} className="text-black" />
          </div>
          <div className="my-3">
            <span className="text-4xl sm:text-5xl font-black text-black font-sans leading-none">48</span>
            <span className="text-xs font-bold text-neutral-600 block mt-1 uppercase">Active Protocols</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 bg-[#F7F4EE] border border-black px-2 py-1 text-[11px]">
            <span className="text-neutral-600 font-bold uppercase">SYSTEM PIPELINE</span>
            <span className="text-black font-extrabold">+12 THIS CYCLE</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold">METRIC // 02</span>
            <Activity size={18} className="text-black" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-black font-sans leading-none">92%</span>
              <span className="text-xs text-[#00A859] font-black">▲ 4.8%</span>
            </div>
            <span className="text-xs font-bold text-neutral-600 block mt-1 uppercase">Completion Velocity</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 bg-[#F7F4EE] border border-black px-2 py-1 text-[11px]">
            <span className="text-neutral-600 font-bold uppercase">MEAN TIME TO MERGE</span>
            <span className="text-black font-extrabold">11.4 DAYS</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold">METRIC // 03</span>
            <Coins size={18} className="text-[#FF5500]" />
          </div>
          <div className="my-3">
            <span className="text-4xl sm:text-5xl font-black text-[#FF5500] font-sans leading-none">
              {currentBalance}
            </span>
            <span className="text-xs font-bold text-neutral-600 block mt-1 uppercase">ALUMN-CR Balance</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 bg-[#F7F4EE] border border-black px-2 py-1 text-[11px]">
            <span className="text-neutral-600 font-bold uppercase">STAKING POOL</span>
            <span className="text-black font-extrabold">VAL: $42,000 EQ</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#2E5BFF]">INTEGRITY // V4</span>
            <ShieldCheck size={18} className="text-[#2E5BFF]" />
          </div>
          <div className="my-3">
            <span className="text-base sm:text-lg font-bold text-black font-sans leading-tight block">
              Anti-Cheat Watchdog
            </span>
            <span className="text-xs text-neutral-600 block mt-1 font-sans leading-relaxed">
              FIPS 140-3 Cryptographic active process tracing with zero false positives.
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 bg-[#F7F4EE] border border-black px-2 py-1 text-[11px]">
            <span className="text-neutral-600 font-bold uppercase">AUDIT STATUS</span>
            <span className="inline-flex items-center gap-1.5 text-black font-extrabold">
              <span className="w-2 h-2 rounded-full bg-[#00E676]" /> ACTIVE
            </span>
          </div>
        </div>
      </section>

      {/* 3. FLAGSHIP HERO SPRINT SECTION (SPRINT 01) */}
      <section className="bg-[#F7F4EE] border-2 border-black p-6 sm:p-8 shadow-[5px_5px_0px_#000000] flex flex-col xl:flex-row gap-8">
        <div className="flex-1 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="bg-black text-white px-2 py-0.5 font-bold">[ SPRINT 01 ]</span>
              <span className="bg-white border border-black text-black px-2 py-0.5 font-bold shadow-[1px_1px_0px_#000000]">
                [ 14 DAYS ]
              </span>
              <span className="bg-[#CCFF00] border border-black text-black px-2 py-0.5 font-bold shadow-[1px_1px_0px_#000000]">
                [ 120 ALUMN-CR EARNED ]
              </span>
              <span className="text-neutral-500 font-mono ml-auto hidden sm:inline">
                VERIFIED RUNTIME ID: #SR-9902
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-sans">
                Zero to Tech Lead: Distributed Systems Transition Protocol
              </h2>
              <div className="flex items-center gap-2 mt-1.5 font-mono text-xs">
                <span className="text-neutral-500 font-bold uppercase">LEAD ARCHITECT:</span>
                <span className="font-extrabold text-black">Dr. Elias Vance (Quantix Corp, Class of &apos;14)</span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-neutral-700 max-w-3xl leading-relaxed font-sans">
              14-day rigorous pathway with operational engineering templates, Raft consensus algorithm code review, live concurrency benchmarks, and real-time fault-injection architectures deployed against distributed state machines.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border-2 border-black p-4 shadow-[2px_2px_0px_#000000] font-mono text-xs">
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">SYLLABUS MODULES</span>
                <span className="font-extrabold text-black text-sm">6 CORE / 2 CAPSTONE</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">CODE REVIEWS</span>
                <span className="font-extrabold text-black text-sm">2 PEER VERIFIED</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">TARGET CADENCE</span>
                <span className="font-extrabold text-black text-sm">12 HRS / WEEK</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleEnroll("Zero to Tech Lead: Distributed Systems Transition Protocol")}
              className="px-5 py-2.5 bg-[#FF5500] text-white border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-orange-600 font-mono text-xs font-bold uppercase transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              type="button"
            >
              <span>START SPRINT PROTOCOL</span>
              <span className="font-bold">→</span>
            </button>
            <button
              onClick={() => setIsSyllabusModalOpen(true)}
              className="px-4 py-2.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-100 font-mono text-xs font-bold uppercase transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              type="button"
            >
              Inspect Syllabus PDF [4.2MB]
            </button>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-600 ml-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
              <span>CURRENTLY ENROLLED: 64 ALUMNI FELLOWS</span>
            </div>
          </div>
        </div>

        {/* Blueprint chamber */}
        <div className="w-full xl:w-96 flex flex-col gap-3">
          <div className="bg-white border-2 border-black p-1 shadow-[3px_3px_0px_#000000]">
            <div className="w-full h-48 bg-neutral-900 border border-black flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:14px_14px]" />
              <Layers size={40} className="text-[#CCFF00] mb-2 z-10" />
              <span className="font-mono text-xs font-bold text-white z-10">
                DISTRIBUTED STATE MACHINE
              </span>
              <span className="font-mono text-[10px] text-neutral-400 mt-0.5 z-10">
                TOPOLOGY // FAULT-INJECTION CHAMBER
              </span>
            </div>
            <div className="p-2 bg-[#F7F4EE] border-t border-black mt-1 flex justify-between items-center font-mono text-[11px]">
              <span className="text-neutral-500 font-bold">CHAMBER // CAPSTONE</span>
              <span className="font-bold text-black">RAFT-CLUSTER-V2.GO</span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-bold uppercase">SPRINT TIMELINE</span>
              <span className="text-[#FF5500] font-bold">DAY 01 OF 14</span>
            </div>
            <div className="w-full bg-[#e5e2dc] border border-black h-2.5 overflow-hidden">
              <div className="bg-[#FF5500] h-full w-[14%]" />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5 font-bold">
              <span>START: 00h</span>
              <span>CHECKPOINT 1</span>
              <span>CERT: 336h</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CURATED ENGINEERING SPRINTS GRID (INDEX 02) */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="bg-black text-[#CCFF00] px-2 py-0.5 font-bold">INDEX // 02</span>
              <span className="text-neutral-500 uppercase font-bold">ACTIVE REPOSITORY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-sans mt-1">
              Curated Engineering Sprints
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setSelectedSprintCategory("all")}
              className={`px-3 py-1.5 border-2 border-black font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] ${
                selectedSprintCategory === "all" ? "bg-black text-[#CCFF00]" : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              ALL SPRINTS
            </button>
            <button
              onClick={() => setSelectedSprintCategory("cryptography")}
              className={`px-3 py-1.5 border-2 border-black font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] ${
                selectedSprintCategory === "cryptography" ? "bg-black text-[#CCFF00]" : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              CRYPTOGRAPHY
            </button>
            <button
              onClick={() => setSelectedSprintCategory("distributed")}
              className={`px-3 py-1.5 border-2 border-black font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] ${
                selectedSprintCategory === "distributed" ? "bg-black text-[#CCFF00]" : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              DISTRIBUTED ENGINES
            </button>
            <button
              onClick={() => setSelectedSprintCategory("silicon")}
              className={`px-3 py-1.5 border-2 border-black font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] ${
                selectedSprintCategory === "silicon" ? "bg-black text-[#CCFF00]" : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              SILICON &amp; FIRMWARE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSprints.map((sprint) => (
            <div
              key={sprint.id}
              className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between hover:shadow-[6px_6px_0px_#000000] transition-all group"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="bg-[#F7F4EE] border border-black text-black px-2 py-0.5 font-bold shadow-[1px_1px_0px_#000000]">
                    [ {sprint.sprintNum} // {sprint.durationDays} DAYS ]
                  </span>
                  <span className="text-[#FF5500] font-black">+{sprint.creditsEarned} ALUMN-CR</span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-black font-sans group-hover:text-[#FF5500] transition-colors leading-snug">
                    {sprint.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-xs">
                    <span className="text-neutral-500 font-bold uppercase">FELLOW:</span>
                    <span className="font-extrabold text-black">{sprint.fellow} ({sprint.fellowTitle})</span>
                  </div>
                </div>

                <p className="text-sm text-neutral-700 font-sans leading-relaxed">
                  {sprint.description}
                </p>

                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {sprint.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-[#F7F4EE] border border-black text-neutral-700 text-[11px] font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-6 bg-[#F7F4EE] border-2 border-black p-4 flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-bold uppercase">COHORT PROGRESSION</span>
                  <span className="font-extrabold text-black">{sprint.passRate}</span>
                </div>
                <div className="w-full bg-[#e5e2dc] border border-black h-2">
                  <div className="bg-black h-full" style={{ width: sprint.passRate.split("%")[0] + "%" }} />
                </div>
                <div className="flex justify-between items-center mt-1 pt-1">
                  <span className="text-neutral-600 font-bold">
                    SEATS: {sprint.seatsRemaining}/{sprint.totalSeats} REMAINING
                  </span>
                  <button
                    onClick={() => handleEnroll(sprint.title)}
                    className="px-3.5 py-1.5 bg-black text-[#CCFF00] border border-black font-bold uppercase hover:bg-[#CCFF00] hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_#000000]"
                    type="button"
                  >
                    ENROLL RUNTIME →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. VIDEO LEARNING REPOSITORY & TECHNICAL TALKS (PRESERVING EXISTING FUNCTIONALITY) */}
      <section className="flex flex-col gap-6 pt-4 border-t-2 border-black">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="bg-black text-[#CCFF00] px-2 py-0.5 font-bold">LIBRARY // VIDEOS</span>
              <span className="text-neutral-500 uppercase font-bold">ALUMNI MASTERCLASSES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-sans mt-1">
              Technical Masterclasses &amp; Video Runbooks
            </h2>
            <p className="text-sm text-neutral-600 max-w-2xl mt-0.5">
              Watch deep-dive walkthroughs uploaded by verified alumni fellows or redeem your ALUMN-CR points.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000]">
            <Coins size={18} className="text-[#FF5500]" />
            <span className="text-neutral-600 font-bold">STAKED BALANCE:</span>
            <span className="text-base font-black text-black">{currentBalance} pts</span>
          </div>
        </div>

        {initialVideos.length === 0 ? (
          <div className="bg-white border-2 border-black p-8 text-center shadow-[3px_3px_0px_#000000] font-mono">
            <Play size={32} className="mx-auto text-neutral-400 mb-2" />
            <p className="font-bold text-sm text-black">NO SUBMITTED MASTERCLASSES RECORDED YET</p>
            <p className="text-xs text-neutral-500 mt-1">
              Be the first alumni fellow to submit an architectural runbook video.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialVideos.map((video) => {
              const isUnlocked = unlockedVideoIds.includes(video.id) || video.priceInCredits === 0;
              const isFree = video.priceInCredits === 0;

              return (
                <div
                  key={video.id}
                  className="bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between overflow-hidden group hover:shadow-[6px_6px_0px_#000000] transition-all"
                >
                  {/* Thumbnail / Header */}
                  <div className="relative aspect-video w-full bg-neutral-900 border-b-2 border-black flex flex-col justify-between p-3 overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                      {isFree ? (
                        <span className="px-2 py-0.5 bg-[#00E676] text-black border border-black font-mono text-[10px] font-bold">
                          FREE SKILL
                        </span>
                      ) : isUnlocked ? (
                        <span className="px-2 py-0.5 bg-[#CCFF00] text-black border border-black font-mono text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> UNLOCKED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#FF5500] text-white border border-black font-mono text-[10px] font-bold flex items-center gap-1">
                          <Coins size={11} /> {video.priceInCredits} PTS
                        </span>
                      )}
                    </div>

                    <div className="z-10 mt-auto">
                      <h4 className="font-sans font-extrabold text-white text-sm line-clamp-2 drop-shadow-sm">
                        {video.title}
                      </h4>
                    </div>

                    {/* Play Button Overlay */}
                    {isUnlocked ? (
                      <button
                        onClick={() => setPlayingVideo(video)}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                      >
                        <div className="w-12 h-12 bg-[#CCFF00] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                          <Play size={22} className="text-black ml-0.5 fill-black" />
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlock(video.id, video.priceInCredits)}
                        disabled={isPending}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 p-3 text-center cursor-pointer border-none"
                      >
                        <Lock size={22} className="text-white mb-1.5" />
                        <span className="font-mono text-xs font-bold text-white bg-[#FF5500] px-3 py-1 border border-black shadow-[1px_1px_0px_#000000]">
                          Unlock for {video.priceInCredits} pts
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Body & Meta */}
                  <div className="p-4 flex flex-col flex-1 justify-between font-sans">
                    <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">
                      {video.description || "Comprehensive hands-on engineering walkthrough."}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200 mt-4 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserIcon size={12} className="text-neutral-500" />
                        <span className="text-[11px] font-bold text-black truncate max-w-[120px]">
                          {video.uploader?.name || "Verified Fellow"}
                        </span>
                      </div>
                      {isUnlocked && (
                        <button
                          onClick={() => setPlayingVideo(video)}
                          className="font-bold text-black hover:text-[#FF5500] flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <span>Watch</span>
                          <Play size={10} className="fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. PROOF OF COMPLETION & WATCHDOG ARCHITECTURE (INDEX 03) */}
      <section className="bg-[#F7F4EE] border-2 border-black p-6 sm:p-8 shadow-[5px_5px_0px_#000000] flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#CCFF00] px-2 py-0.5 font-bold">INDEX // 03</span>
            <span className="text-[#FF5500] font-extrabold uppercase">
              PROOF OF COMPLETION &amp; WATCHDOG ARCHITECTURE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
            <span className="font-bold text-black">ATTESTATION PROTOCOL: SEC_ECDSA_P384</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_#000000] flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500 font-bold">
                <span>STAGE 01 // TELEMETRY</span>
                <Cpu size={16} className="text-black" />
              </div>
              <h4 className="text-lg font-extrabold text-black font-sans">Heartbeat Watchdog</h4>
              <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                Continuous keystroke entropy and interactive terminal session checks verify human execution. Minimum threshold: &gt;90% active retention.
              </p>
            </div>
            <div className="mt-4 p-2 bg-[#F7F4EE] border border-black flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-500 font-bold">WATCHDOG STATUS</span>
              <span className="text-[#00A859] font-extrabold">MONITORED: OK</span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_#000000] flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500 font-bold">
                <span>STAGE 02 // VALIDATION</span>
                <ShieldCheck size={16} className="text-black" />
              </div>
              <h4 className="text-lg font-extrabold text-black font-sans">Peer Code Review Sign-Off</h4>
              <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                Two calibrated alumni fellows grade commit diffs against unit test coverage, AST linting, and benchmark latency guarantees.
              </p>
            </div>
            <div className="mt-4 p-2 bg-[#F7F4EE] border border-black flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-500 font-bold">SIGN-OFF QUORUM</span>
              <span className="text-black font-extrabold">2 OF 2 FELLOWS</span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_#000000] flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500 font-bold">
                <span>STAGE 03 // CREDENTIAL</span>
                <Award size={16} className="text-black" />
              </div>
              <h4 className="text-lg font-extrabold text-black font-sans">Cryptographic Certificate</h4>
              <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                ECDSA P-384 signed root with immutable ledger timestamp. Downloadable JSON-LD and PDF cryptographic credentials.
              </p>
            </div>
            <div className="mt-4 p-2 bg-[#F7F4EE] border border-black flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-500 font-bold">VALIDITY PROOF</span>
              <span className="text-[#FF5500] font-extrabold">FIPS 140-3 COMPLIANT</span>
            </div>
          </div>
        </div>

        {/* Verification Card Sample */}
        <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-black text-[#CCFF00] border-2 border-black flex items-center justify-center font-black text-sm shadow-[1px_1px_0px_#000000]">
              CERT
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-black font-sans text-sm">Elena Vance // Recent Verification</span>
              <span className="text-neutral-500 text-[11px]">
                ISSUED: 2026-03-28 | SPRINT: VECTOR-EMBEDDING-COMPRESSION-99
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                  "@context": "https://w3id.org/security/v2",
                  "type": "CryptographicSprintCredential",
                  "issuer": "did:proalumn:authority:0x89F1",
                  "recipient": "did:proalumn:user:elena-vance",
                  "sprint": "VECTOR-EMBEDDING-COMPRESSION-99",
                  "signature": "0x9F42..ECDSA_P384_VALID"
                }, null, 2));
                const dl = document.createElement("a");
                dl.setAttribute("href", dataStr);
                dl.setAttribute("download", "elena_vance_credential.json");
                dl.click();
              }}
              className="px-3.5 py-1.5 bg-[#F7F4EE] text-black border border-black font-bold uppercase hover:bg-neutral-200 transition-all cursor-pointer shadow-[1px_1px_0px_#000000]"
              type="button"
            >
              Download JSON-LD Key
            </button>
            <button
              onClick={() => setIsSignatureModalOpen(true)}
              className="px-4 py-1.5 bg-black text-white border-2 border-black font-bold uppercase hover:bg-[#CCFF00] hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_#000000]"
              type="button"
            >
              Verify Signature →
            </button>
          </div>
        </div>
      </section>

      {/* 7. MODALS */}

      {/* Modal 1: Upload Video Form */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold">[ SUBMISSION PORTAL ]</span>
                <h3 className="font-extrabold text-black font-sans text-base uppercase">Submit Technical Video</h3>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 border border-black hover:bg-neutral-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleVideoSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Video Title <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  name="title"
                  placeholder="e.g. Raft Consensus Internals in Go"
                  className="w-full px-3 py-2 border-2 border-black bg-[#F7F4EE] focus:bg-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Description &amp; Key Concepts <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  name="description"
                  placeholder="Summarize the architectural takeaways for students and fellows..."
                  className="w-full px-3 py-2 border-2 border-black bg-[#F7F4EE] focus:bg-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Video File (.mp4) <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  name="videoFile"
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  className="w-full px-3 py-2 border-2 border-black bg-[#F7F4EE] text-xs font-mono file:mr-3 file:py-1 file:px-3 file:border-2 file:border-black file:font-bold file:bg-black file:text-white hover:file:bg-[#CCFF00] hover:file:text-black"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Maximum file size: 150MB.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 border-2 border-black bg-white font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending}
                  type="submit"
                  className="px-5 py-2 border-2 border-black bg-[#CCFF00] text-black font-bold shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00] cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Transmitting..." : "Submit for Moderation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Watch Video Player */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white border-4 border-black shadow-[8px_8px_0px_#000000] flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b-2 border-black bg-[#F7F4EE] font-mono">
              <h2 className="text-sm font-black text-black uppercase flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#00E676]" />
                <span>SECURE WATCH-TO-EARN PLAYER // {playingVideo.title}</span>
              </h2>
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-1 border border-black bg-white hover:bg-neutral-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <WatchVideoPlayer
                videoId={playingVideo.id}
                videoUrl={playingVideo.videoUrl}
                title={playingVideo.title}
              />
              <div className="p-5 border-t-2 border-black bg-white font-mono text-xs">
                <h3 className="font-extrabold text-black uppercase mb-1">About this Runbook</h3>
                <p className="text-neutral-700 font-sans text-sm leading-relaxed">{playingVideo.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Syllabus PDF Preview Modal */}
      {isSyllabusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black text-[#CCFF00] font-bold">SYLLABUS SPEC</span>
                <span className="font-extrabold text-black font-sans text-base uppercase">Sprint Curriculum Blueprint</span>
              </div>
              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="p-1 border border-black hover:bg-neutral-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-sans text-neutral-800 leading-relaxed text-xs">
              <h4 className="font-mono font-bold text-black uppercase text-sm">
                Module Breakdown // Distributed Systems Transition Protocol
              </h4>
              <ul className="list-decimal pl-5 space-y-1.5 font-mono text-xs">
                <li><strong>Week 1 - Module 01:</strong> Formal Verification &amp; TLA+ state specification models.</li>
                <li><strong>Week 1 - Module 02:</strong> Log-structured storage engines &amp; LSM-Tree write amplification.</li>
                <li><strong>Week 1 - Module 03:</strong> Raft leader election, heartbeats, and cluster membership reconfiguration.</li>
                <li><strong>Week 2 - Module 04:</strong> Vector clocks, CRDTs, and causal consistency invariants.</li>
                <li><strong>Week 2 - Module 05:</strong> Chaos testing with Jepsen &amp; simulated packet drop injection.</li>
                <li><strong>Week 2 - Module 06 (Capstone):</strong> Building a fault-tolerant multi-node key-value store in Go.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-3 border-t-2 border-black">
              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase hover:bg-[#CCFF00] hover:text-black cursor-pointer"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Signature Verification Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#00E676] text-black font-bold">ATTESTATION OK</span>
                <span className="font-extrabold text-black font-sans uppercase">Cryptographic Validation</span>
              </div>
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="p-1 border border-black hover:bg-neutral-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-[#F7F4EE] border border-black space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-bold">ALGORITHM:</span>
                <span className="font-bold text-black">ECDSA P-384 + SHA-384</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-bold">ROOT HASH:</span>
                <span className="font-bold text-black truncate max-w-[200px]">0x89F1942E3120AA812</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-bold">ISSUER:</span>
                <span className="font-bold text-black">PRO-ALUMN CONSORTIUM ROOT CA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-bold">STATUS:</span>
                <span className="text-[#00A859] font-extrabold">CRYPTOGRAPHICALLY VERIFIED</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t-2 border-black">
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase hover:bg-[#CCFF00] hover:text-black cursor-pointer"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
