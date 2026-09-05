"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Send,
  Search,
  Lock,
  Terminal,
  Paperclip,
  Code2,
  Mic,
  CheckCheck,
  ShieldCheck,
  CheckCircle,
  X,
  FileCode,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/context/AuthContext";
import { getToken } from "@/lib/auth";
import { getSocket } from "@/lib/socket";

type FilterTab = "ALL" | "1:1" | "ESCROW";

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
    initials: string;
    cohort?: string;
  };
  time: string;
  text: string;
  sent: boolean;
  signature?: string;
  codeSnippet?: {
    filename: string;
    tag: string;
    code: string;
  };
  attachment?: {
    name: string;
    metric: string;
  };
}

interface ThreadSummary {
  id: string;
  index: string;
  name: string;
  title: string;
  cohort: string;
  pgp: string;
  category: "1:1" | "FOUNDER" | "COMPLETED";
  statusBadge: string;
  statusColor: string;
  lastMessage: string;
  time: string;
  escrowBadge: string;
  escrowColor: string;
  subTag: string;
  avatarUrl: string;
  isEscrowActive: boolean;
  escrowAmount: number;
}

const INITIAL_THREADS: ThreadSummary[] = [
  {
    id: "thread-01",
    index: "#01",
    name: "Sarah Jenkins",
    title: "Principal Architect @ Snowflake",
    cohort: "COHORT '16",
    pgp: "PGP: 0x9AF4..C21",
    category: "1:1",
    statusBadge: "ACTIVE 1:1 FLASH",
    statusColor: "bg-[#ffdbcf] text-[#a63500]",
    lastMessage: "“Reviewed the Spanner consensus diagram. The Paxos lease renewal logic is solid.”",
    time: "10:42 AM",
    escrowBadge: "[ 30 ALUMN-CR HELD ]",
    escrowColor: "text-[#a63500] bg-[#F7F4EE]",
    subTag: "FL-8812",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    isEscrowActive: true,
    escrowAmount: 30,
  },
  {
    id: "thread-02",
    index: "#02",
    name: "David Chen",
    title: "Neuromorphic Labs / YC W26",
    cohort: "COHORT '20",
    pgp: "PGP: 0x3BC8..D90",
    category: "FOUNDER",
    statusBadge: "FOUNDER CONDUIT",
    statusColor: "bg-[#e5e2dc] text-[#444748]",
    lastMessage: "“Let's connect this Friday regarding the firmware hiring requisition.”",
    time: "YESTERDAY",
    escrowBadge: "[ DIRECT P2P ROUTE ]",
    escrowColor: "text-[#635F57] bg-[#e5e2dc]",
    subTag: "COHORT '20",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isEscrowActive: false,
    escrowAmount: 0,
  },
  {
    id: "thread-03",
    index: "#03",
    name: "Ananya Deshmukh",
    title: "AWS Edge Services",
    cohort: "COHORT '19",
    pgp: "PGP: 0x7E12..A44",
    category: "COMPLETED",
    statusBadge: "COMPLETED // RELEASED",
    statusColor: "bg-[#f0eee8] text-[#8F8A7E]",
    lastMessage: "“Thanks for the mock interview feedback! The L6 distributed systems rubric was spot on.”",
    time: "OCT 12",
    escrowBadge: "[ ESCROW DISBURSED ]",
    escrowColor: "text-[#8F8A7E] bg-[#e5e2dc]",
    subTag: "RATING: 5.0★",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    isEscrowActive: false,
    escrowAmount: 0,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "thread-01": [
    {
      id: "msg-1",
      sender: {
        id: "sarah-j",
        name: "Sarah Jenkins",
        initials: "SJ",
        cohort: "COHORT '16",
      },
      time: "10:32:14 AM",
      text: "Hi Elena! I pulled up your thesis draft on columnar query optimization. The pushdown filter vectorization on slide 14 is very well structured.",
      sent: false,
      signature: "VERIFIED_SIGNATURE",
    },
    {
      id: "msg-2",
      sender: {
        id: "sarah-j",
        name: "Sarah Jenkins",
        initials: "SJ",
      },
      time: "10:33:05 AM",
      text: "One recommendation: check your memory alignment for AVX-512 register loads. In production, unaligned reads can cost up to 15% throughput.",
      sent: false,
      codeSnippet: {
        filename: "SNOWFLAKE_COLUMN_STORE // OPT_V4.RS",
        tag: "ASM//SIMD",
        code: `// Enforce 64-byte alignment on AVX-512 chunks\n#[repr(align(64))]\npub struct VectorizedRegisterBatch {\n    pub bitmask_predicates: [u64; 8],\n    pub materialized_offsets: __m512i,\n}`,
      },
    },
    {
      id: "msg-3",
      sender: {
        id: "self",
        name: "Elena Vance (You)",
        initials: "EV",
      },
      time: "10:37:41 AM",
      text: "Thank you Sarah! I made the adjustments in the compiler branch. Here is the revised execution profile with zero-copy memory alignment.",
      sent: true,
      attachment: {
        name: "diff_bench_avx512_run09.json",
        metric: "+14.8% MFLOPS",
      },
    },
    {
      id: "msg-4",
      sender: {
        id: "sarah-j",
        name: "Sarah Jenkins",
        initials: "SJ",
      },
      time: "10:40:18 AM",
      text: "Looks exceptional. This meets Snowflake IC5 engineering standards. I am happy to issue a direct senior IC referral to our Core Engine team whenever you are ready to formally apply.",
      sent: false,
    },
  ],
  "thread-02": [
    {
      id: "msg-201",
      sender: {
        id: "david-c",
        name: "David Chen",
        initials: "DC",
        cohort: "COHORT '20",
      },
      time: "YESTERDAY 4:15 PM",
      text: "Hey! We are closing out our seed cohort for YC W26. Let's connect this Friday regarding the firmware hiring requisition.",
      sent: false,
      signature: "P2P_VERIFIED",
    },
  ],
  "thread-03": [
    {
      id: "msg-301",
      sender: {
        id: "ananya-d",
        name: "Ananya Deshmukh",
        initials: "AD",
      },
      time: "OCT 12 11:20 AM",
      text: "Thanks for the mock interview feedback! 50 Credits have been disbursed from escrow.",
      sent: false,
      signature: "CONTRACT_FINALIZED",
    },
  ],
};

export function ChatContent() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [selectedThreadId, setSelectedThreadId] = useState<string>("thread-01");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [threads, setThreads] = useState<ThreadSummary[]>(INITIAL_THREADS);
  
  // Real-time Countdown Timer (8 min 24 sec = 504 sec)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(504);
  const [isEscrowReleased, setIsEscrowReleased] = useState<boolean>(false);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);

  // Modals
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeFilename, setCodeFilename] = useState("QUERY_OPT_V2.RS");
  const [codeSnippetText, setCodeSnippetText] = useState(
`#[inline(always)]\npub fn evaluate_predicates(batch: &[u64]) -> u64 {\n    batch.iter().fold(0, |acc, &val| acc | (val & 0x01))\n}`
  );
  
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchFilename, setPatchFilename] = useState("simd_vector_bench.patch");
  const [patchMetric, setPatchMetric] = useState("+18.2% IPC");

  const [escrowConfirmOpen, setEscrowConfirmOpen] = useState(false);

  const chatStreamRef = useRef<HTMLDivElement>(null);

  // Sync with API threads if available
  const { data: apiChatData } = useApi("chat:threads", () => apiClient.chat.list().catch(() => null));

  // Connect live API threads into list
  useEffect(() => {
    if (apiChatData?.threads && Array.isArray(apiChatData.threads)) {
      const rawThreads = apiChatData.threads as unknown as Array<{ id: string; name: string; lastMessage?: string; lastMessageAt?: string; unread?: number }>;
      const liveThreads: ThreadSummary[] = rawThreads.map((t, idx: number) => ({
        id: t.id,
        index: `#${String(idx + 4).padStart(2, "0")}`,
        name: t.name || `Channel ${idx + 4}`,
        title: "Peer Conduit Member",
        cohort: "COHORT '24",
        pgp: `PGP: 0x${t.id.substring(0, 4)}..${t.id.substring(t.id.length - 3)}`,
        category: "1:1" as const,
        statusBadge: "ACTIVE P2P",
        statusColor: "bg-[#ffdbcf] text-[#a63500]",
        lastMessage: t.lastMessage || "No messages recorded yet.",
        time: t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "LIVE",
        escrowBadge: "[ ZERO LOCK ]",
        escrowColor: "text-[#635F57] bg-[#e5e2dc]",
        subTag: "P2P",
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        isEscrowActive: false,
        escrowAmount: 0,
      }));

      setThreads((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = liveThreads.filter((lt) => !existingIds.has(lt.id));
        return [...prev, ...newOnes];
      });
    }
  }, [apiChatData]);

  // Read URL query parameter ?thread={id}
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const threadParam = params.get("thread") || params.get("threadId");
      if (threadParam) {
        setSelectedThreadId(threadParam);
      }
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat stream
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [selectedThreadId, messagesMap]);

  // WebSockets integration
  useEffect(() => {
    if (!selectedThreadId || !user) return;
    try {
      const socket = getSocket();
      socket.connect();
      const token = getToken();
      if (token) socket.emit("authenticate", token);
      socket.emit("join_room", selectedThreadId);

      const handleReceive = (data: { roomId: string; id: string; text: string; time?: string }) => {
        if (data.roomId === selectedThreadId) {
          const incoming: ChatMessage = {
            id: data.id || `ws-${Date.now()}`,
            sender: {
              id: "peer",
              name: activeThread?.name || "Peer",
              initials: activeThread?.name.substring(0, 2).toUpperCase() || "PA",
            },
            time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: data.text,
            sent: false,
            signature: "WSS_VERIFIED",
          };

          setMessagesMap((prev) => ({
            ...prev,
            [selectedThreadId]: [...(prev[selectedThreadId] || []), incoming],
          }));
        }
      };

      socket.on("receive_message", handleReceive);
      return () => {
        socket.off("receive_message", handleReceive);
      };
    } catch {
      // Graceful fallback for offline testing
    }
  }, [selectedThreadId, user]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0];
  }, [threads, selectedThreadId]);

  const activeMessages = useMemo(() => {
    return messagesMap[selectedThreadId] || [];
  }, [messagesMap, selectedThreadId]);

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    let list = threads;
    if (activeFilter === "1:1") {
      list = list.filter((t) => t.category === "1:1");
    } else if (activeFilter === "ESCROW") {
      list = list.filter((t) => t.isEscrowActive);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.cohort.toLowerCase().includes(q) ||
          t.lastMessage.toLowerCase().includes(q)
      );
    }
    return list;
  }, [threads, activeFilter, searchQuery]);

  // Handle send message
  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: {
        id: user?.id || "self",
        name: user?.name ? `${user.name} (You)` : "Elena Vance (You)",
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : "EV",
      },
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text,
      sent: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedThreadId]: [...(prev[selectedThreadId] || []), newMsg],
    }));

    setMessageInput("");

    // Emit via socket and API
    try {
      const socket = getSocket();
      socket.emit("send_message", {
        roomId: selectedThreadId,
        text,
        id: newMsg.id,
        time: newMsg.time,
      });
      await apiClient.chat.sendMessage(selectedThreadId, text).catch(() => {});
    } catch {
      // Mock / local mode
    }
  };

  // Handle Code snippet insertion
  const handleInsertCode = () => {
    if (!codeSnippetText.trim()) return;
    const newMsg: ChatMessage = {
      id: `code-${Date.now()}`,
      sender: {
        id: user?.id || "self",
        name: user?.name ? `${user.name} (You)` : "Elena Vance (You)",
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : "EV",
      },
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text: `Attached benchmark code artifact for review in: ${codeFilename}`,
      sent: true,
      codeSnippet: {
        filename: codeFilename,
        tag: "SNIPPET // REVIEW",
        code: codeSnippetText,
      },
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedThreadId]: [...(prev[selectedThreadId] || []), newMsg],
    }));
    setCodeModalOpen(false);
  };

  // Handle Patch attachment insertion
  const handleInsertPatch = () => {
    if (!patchFilename.trim()) return;
    const newMsg: ChatMessage = {
      id: `patch-${Date.now()}`,
      sender: {
        id: user?.id || "self",
        name: user?.name ? `${user.name} (You)` : "Elena Vance (You)",
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : "EV",
      },
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text: `Transmitted benchmark patch execution profile (${patchFilename}).`,
      sent: true,
      attachment: {
        name: patchFilename,
        metric: patchMetric,
      },
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedThreadId]: [...(prev[selectedThreadId] || []), newMsg],
    }));
    setPatchModalOpen(false);
  };

  // Handle escrow release execution
  const handleReleaseEscrow = () => {
    setIsReleasing(true);
    setTimeout(() => {
      setIsReleasing(false);
      setIsEscrowReleased(true);
      setEscrowConfirmOpen(false);

      // Add system release message to thread
      const releaseNotice: ChatMessage = {
        id: `sys-release-${Date.now()}`,
        sender: {
          id: "system",
          name: "SMART ESCROW AGENT",
          initials: "SYS",
        },
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        text: `SUCCESS: 30 ALUMN-CR CREDITED TO ${activeThread.name.toUpperCase()} (#${activeThread.subTag}). SESSION ARCHIVED AS COMPLETE WITH 100% SATISFACTION ATTESTATION.`,
        sent: false,
        signature: "CONSENSUS_FINALIZED",
      };

      setMessagesMap((prev) => ({
        ...prev,
        [selectedThreadId]: [...(prev[selectedThreadId] || []), releaseNotice],
      }));
    }, 800);
  };

  // Format countdown
  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="w-full bg-[#fcf9f3] text-[#1c1c18] font-mono select-text">
      {/* Telemetry Sub-Header Strip */}
      <div className="w-full bg-[#EFECE4] px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between border-b-2 border-[#1A1A1A] gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-black text-white text-[11px] font-bold tracking-wider">
              NODE//COMM-04
            </span>
            <span className="font-sans font-bold text-base sm:text-lg text-[#1A1A1A] tracking-tight">
              ADVISORY CONDUIT & REAL-TIME ESCROW DISPATCH
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-0.5 bg-white border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A]">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></span>
            <span className="text-xs text-[#1A1A1A] font-semibold">E2E RATIFIED // SHA-256 ENCLAVE</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#635F57]">
            <span>ESCROW POOL:</span>
            <span className="font-bold text-[#1A1A1A] px-2 py-0.5 bg-white border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A]">
              90 ALUMN-CR
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#8F8A7E]">
            <span>SESSION PROTOCOL:</span>
            <span className="text-[#FF5500] font-bold">SYNCHRONOUS FLASH</span>
          </div>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-12 gap-0 w-full min-h-[calc(100vh-10rem)] bg-[#fcf9f3]">
        {/* LEFT PANE: Conversation Index & Escrow Threads */}
        <section className="col-span-12 lg:col-span-4 xl:col-span-3 bg-[#F7F4EE] flex flex-col border-r-2 border-[#1A1A1A] z-10">
          {/* Thread Query & Diagnostics Bar */}
          <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 border-b-2 border-[#1A1A1A] bg-[#F7F4EE]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#8F8A7E] uppercase font-sans">
                INDEXED CHANNELS
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 bg-[#e5e2dc] text-[#1A1A1A] border border-[#1A1A1A]">
                TOTAL: {String(filteredThreads.length).padStart(2, "0")}
              </span>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
              <Terminal size={15} className="text-[#8F8A7E] shrink-0" />
              <input
                type="text"
                id="filter-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="grep thread, cohort, tag..."
                className="w-full bg-transparent text-xs text-[#1A1A1A] placeholder:text-[#8F8A7E] focus:outline-none"
              />
              <span className="text-[10px] text-[#8F8A7E]">/ESC</span>
            </div>

            {/* Filter Segmented Controller */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`px-2 py-1 text-[11px] font-bold border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] whitespace-nowrap active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                  activeFilter === "ALL"
                    ? "bg-black text-white"
                    : "bg-white text-[#1A1A1A] hover:bg-[#e5e2dc]"
                }`}
              >
                [ ALL CONVERSATIONS ]
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("1:1")}
                className={`px-2 py-1 text-[11px] font-bold border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] whitespace-nowrap active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                  activeFilter === "1:1"
                    ? "bg-black text-white"
                    : "bg-white text-[#1A1A1A] hover:bg-[#e5e2dc]"
                }`}
              >
                [ 1:1 ADVISORY ]
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("ESCROW")}
                className={`px-2 py-1 text-[11px] font-bold border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] whitespace-nowrap active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                  activeFilter === "ESCROW"
                    ? "bg-[#FF5500] text-white"
                    : "bg-white text-[#FF5500] hover:bg-[#e5e2dc]"
                }`}
              >
                [ ESCROW ACTIVE ]
              </button>
            </div>
          </div>

          {/* Thread Scrollable Index */}
          <div className="flex-1 flex flex-col overflow-y-auto divide-y-2 divide-[#1A1A1A]">
            {filteredThreads.map((thread) => {
              const isSelected = thread.id === selectedThreadId;
              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-3.5 sm:p-4 relative cursor-pointer group transition-all ${
                    isSelected
                      ? "bg-white"
                      : "bg-[#F7F4EE] hover:bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF5500]"></div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold px-1.5 bg-black text-white">
                        {thread.index}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 border border-[#1A1A1A] uppercase font-sans ${thread.statusColor}`}>
                        {thread.statusBadge}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8F8A7E] shrink-0">{thread.time}</span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative w-10 h-10 bg-[#ebe8e2] border border-[#1A1A1A] shrink-0 overflow-hidden shadow-[1px_1px_0_#1A1A1A]">
                      <Image
                        src={thread.avatarUrl}
                        alt={thread.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans font-bold text-sm text-[#1A1A1A] truncate">
                        {thread.name}
                      </span>
                      <span className="font-sans text-xs text-[#635F57] truncate">
                        {thread.title}
                      </span>
                    </div>
                  </div>

                  <p className="font-sans text-xs text-[#1A1A1A] line-clamp-2 mb-2.5 font-normal">
                    {thread.lastMessage}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#e5e2dc]">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] ${thread.escrowColor}`}>
                      {thread.escrowBadge}
                    </span>
                    <span className="text-[11px] text-[#8F8A7E] flex items-center gap-1">
                      {thread.isEscrowActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></span>
                      )}
                      {thread.subTag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Status Box at Bottom of Left Pane */}
          <div className="p-3.5 sm:p-4 bg-[#EFECE4] border-t-2 border-[#1A1A1A] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8F8A7E] uppercase font-sans">
                P2P WEBSOCKET
              </span>
              <span className="text-[11px] font-bold text-[#00E676] bg-black px-1.5 py-0.5 border border-[#1A1A1A]">
                WSS://OK
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#635F57]">
              <span>PACKET DROP: 0.00%</span>
              <span>CIPHER: AES-GCM-256</span>
            </div>
          </div>
        </section>

        {/* RIGHT PANE: Active Flash Advisory Thread */}
        <main className="col-span-12 lg:col-span-8 xl:col-span-9 bg-[#fcf9f3] flex flex-col justify-between relative overflow-hidden">
          {/* Thread Header */}
          <header className="p-3.5 sm:p-5 bg-white border-b-2 border-[#1A1A1A] flex flex-wrap items-center justify-between gap-4 z-20 shadow-[0_2px_0_#1A1A1A]">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 bg-[#ebe8e2] border-2 border-[#1A1A1A] shrink-0 overflow-hidden shadow-[2px_2px_0_#1A1A1A]">
                <Image
                  src={activeThread.avatarUrl}
                  alt={activeThread.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00E676] border border-[#1A1A1A] shadow-[0_0_4px_#00E676]"></span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans font-bold text-lg sm:text-xl text-[#1A1A1A]">
                    {activeThread.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#D9E021] text-[#1A1A1A] border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A]">
                    {activeThread.cohort}
                  </span>
                  <span className="text-xs text-[#8F8A7E] font-mono">{activeThread.pgp}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-[#635F57] font-sans">
                  <span>{activeThread.title}</span>
                  <span className="text-[#D5CEBF] font-bold">•</span>
                  <span className="text-[#1D4ED8] font-bold font-mono">
                    15-Minute Architectural Flash Session #{activeThread.subTag}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer & Escrow Action CTA */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex flex-col items-end px-3 py-1 bg-[#F7F4EE] border border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
                <span className="text-[9px] font-bold text-[#8F8A7E] uppercase font-sans">
                  SESSION COUNTDOWN
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping"></span>
                  <span className="text-sm sm:text-base font-bold text-[#FF5500]">
                    T-MINUS {timeFormatted}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="escrow-release-btn"
                onClick={() => setEscrowConfirmOpen(true)}
                disabled={isEscrowReleased}
                className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold font-sans tracking-tight border-2 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] transition-all flex items-center gap-2 ${
                  isEscrowReleased
                    ? "bg-[#e5e2dc] text-[#8F8A7E] cursor-not-allowed shadow-none"
                    : "bg-[#FF5500] text-white hover:bg-[#d04400] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                {isEscrowReleased ? (
                  <>
                    <span>ESCROW DISBURSED (30 CR)</span>
                    <CheckCircle size={15} className="text-[#00E676]" />
                  </>
                ) : (
                  <>
                    <span>END MENTORSHIP & RELEASE 30 CR</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Message History Display Area */}
          <div
            ref={chatStreamRef}
            id="chat-stream"
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#fcf9f3]"
          >
            {/* System Enclave Notice */}
            <div className="w-full flex justify-center">
              <div className="max-w-xl w-full bg-[#F7F4EE] p-3 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Lock size={20} className="text-[#a63500] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#a63500] uppercase font-sans">
                      SMART CONTRACT ESCROW ENGAGED
                    </span>
                    <span className="text-xs text-[#1A1A1A]">
                      30 ALUMN-CR securely locked in dual-handshake enclave. Direct chat channel established.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black text-white shrink-0 border border-[#1A1A1A]">
                  BLOCK #194,821
                </span>
              </div>
            </div>

            {/* Message Stream */}
            {activeMessages.map((msg) => {
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 max-w-2xl ${
                    msg.sent ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Sender Initials Avatar */}
                  <div
                    className={`w-8 h-8 shrink-0 border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] flex items-center justify-center text-xs font-bold ${
                      msg.sent
                        ? "bg-black text-white"
                        : "bg-[#F7F4EE] text-[#1A1A1A]"
                    }`}
                  >
                    {msg.sender.initials}
                  </div>

                  <div className={`flex flex-col gap-1 w-full ${msg.sent ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {msg.sent ? (
                        <>
                          <span className="text-[#8F8A7E]">{msg.time}</span>
                          <span className="font-sans font-bold text-[#1A1A1A]">{msg.sender.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#D9E021] text-[#1A1A1A] border border-[#1A1A1A]">
                            AUTHOR
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-sans font-bold text-[#1A1A1A]">{msg.sender.name}</span>
                          <span className="text-[#8F8A7E]">{msg.time}</span>
                          {msg.signature && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#e5e2dc] text-[#635F57] border border-[#1A1A1A] uppercase">
                              {msg.signature}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3 sm:p-4 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] text-xs sm:text-sm leading-relaxed ${
                        msg.sent ? "bg-[#F7F4EE] text-left" : "bg-white text-left"
                      }`}
                    >
                      <p className="font-sans text-[#1A1A1A]">{msg.text}</p>

                      {/* Code Snippet Artifact inside Chat Bubble */}
                      {msg.codeSnippet && (
                        <div className="mt-3 p-3 bg-[#EFECE4] border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] flex flex-col gap-1.5">
                          <div className="flex items-center justify-between pb-1 border-b border-[#D5CEBF]">
                            <span className="text-[11px] font-bold text-[#635F57]">
                              {msg.codeSnippet.filename}
                            </span>
                            <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5">
                              {msg.codeSnippet.tag}
                            </span>
                          </div>
                          <pre className="text-[11px] text-[#1A1A1A] overflow-x-auto p-2 bg-white border border-[#1A1A1A] font-mono leading-relaxed">
                            <code>{msg.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}

                      {/* Attached Diff Artifact */}
                      {msg.attachment && (
                        <div className="mt-2.5 p-2 bg-white border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            <FileCode size={16} className="text-[#1D4ED8]" />
                            <span className="text-xs font-bold text-[#1A1A1A]">{msg.attachment.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#00E676] bg-black px-1.5 py-0.5 border border-[#1A1A1A]">
                            {msg.attachment.metric}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Delivery status */}
                    {msg.sent && (
                      <div className="flex items-center gap-1 text-[10px] text-[#8F8A7E]">
                        <CheckCheck size={13} className="text-[#00E676]" />
                        <span>DELIVERED & DECRYPTED VIA CLIENT_ENCLAVE</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Telemetry Input Console Section */}
          <footer className="p-3 sm:p-5 bg-[#F7F4EE] border-t-2 border-[#1A1A1A] flex flex-col gap-2.5 z-20 shadow-[0_-2px_0_#1A1A1A]">
            {/* Console Utility Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPatchModalOpen(true)}
                  className="px-2.5 py-1 bg-white text-[#1A1A1A] hover:bg-[#e5e2dc] text-[11px] font-bold border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <Paperclip size={13} />
                  <span>ATTACH PATCH/DIFF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCodeModalOpen(true)}
                  className="px-2.5 py-1 bg-white text-[#1A1A1A] hover:bg-[#e5e2dc] text-[11px] font-bold border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <Code2 size={13} />
                  <span>SHARE BENCHMARK CODE</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Voice telemetry memo stream ready (RAW mono 16kHz)")}
                  className="px-2.5 py-1 bg-white text-[#1A1A1A] hover:bg-[#e5e2dc] text-[11px] font-bold border border-[#1A1A1A] shadow-[1px_1px_0_#1A1A1A] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <Mic size={13} />
                  <span>VOICE MEMO (RAW)</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#8F8A7E]">
                <span>INPUT: MONO_UTF8</span>
                <span>|</span>
                <span>SIGNING KEY: 2048-BIT ED25519</span>
              </div>
            </div>

            {/* Textarea & Send Trigger Layout */}
            <div className="flex items-end gap-2.5">
              <div className="flex-1 bg-white p-2 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] focus-within:shadow-[3px_3px_0_#1A1A1A] transition-all">
                <textarea
                  id="message-box"
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Draft message or attach cryptographic code artifact..."
                  className="w-full bg-transparent p-1 text-xs sm:text-sm text-[#1A1A1A] placeholder:text-[#8F8A7E] focus:outline-none resize-none font-mono"
                />
                <div className="flex items-center justify-between px-1 pt-1 border-t border-[#e5e2dc] text-[#8F8A7E] text-[10px]">
                  <span>[CMD + ENTER] TO SIGN & TRANSMIT</span>
                  <span id="char-counter">{messageInput.length} / 2048 CHARS</span>
                </div>
              </div>

              <button
                type="button"
                id="send-btn"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="h-[68px] sm:h-[76px] px-4 sm:px-6 bg-black text-white font-sans font-bold text-sm tracking-tight border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] hover:bg-[#1c1b1b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center justify-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1">
                  <span>TRANSMIT</span>
                  <span>↵</span>
                </div>
                <span className="text-[9px] text-[#ebe8e2] tracking-widest font-mono">PORT_OUT</span>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Real-Time Telemetry Global Status Footer */}
      <footer className="w-full bg-[#EFECE4] border-t-2 border-[#1A1A1A] px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#635F57] z-30">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_6px_#00E676]"></span>
            <span className="font-bold text-[#1A1A1A] uppercase font-sans">BROADSHEET CONDUIT LIVE</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[#8F8A7E]">CHANNEL:</span>
            <span className="font-bold text-[#1A1A1A]">WSS_PEER_SYNC://127.0.0.1:9042</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-[#8F8A7E]">LATENCY:</span>
            <span className="text-[#1A1A1A] font-bold">11.4 ms</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[#8F8A7E]">SMART ESCROW AGENT:</span>
            <span className="text-[#FF5500] font-bold">ALUMN-CHAIN v4.9</span>
          </div>
          <span className="text-[#D5CEBF]">|</span>
          <div className="flex items-center gap-1 text-[#8F8A7E]">
            <span>SECURITY LEVEL 4</span>
            <ShieldCheck size={14} className="text-[#00E676]" />
          </div>
        </div>
      </footer>

      {/* Modal 1: Code Snippet Insertion Modal */}
      {codeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F4EE] border-4 border-[#1A1A1A] shadow-[6px_6px_0_#1A1A1A] w-full max-w-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-[#FF5500]" />
                <h3 className="font-sans font-bold text-lg text-[#1A1A1A]">SHARE BENCHMARK CODE ARTIFACT</h3>
              </div>
              <button
                type="button"
                onClick={() => setCodeModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#1A1A1A] hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#635F57] uppercase block mb-1">
                  Artifact Identifier / Filename
                </label>
                <input
                  type="text"
                  value={codeFilename}
                  onChange={(e) => setCodeFilename(e.target.value)}
                  className="w-full bg-white border-2 border-[#1A1A1A] p-2 text-xs font-mono text-[#1A1A1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#635F57] uppercase block mb-1">
                  Code Block Contents (Rust / C++ / Python / Go)
                </label>
                <textarea
                  rows={6}
                  value={codeSnippetText}
                  onChange={(e) => setCodeSnippetText(e.target.value)}
                  className="w-full bg-white border-2 border-[#1A1A1A] p-2 text-xs font-mono text-[#1A1A1A] focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D5CEBF]">
              <button
                type="button"
                onClick={() => setCodeModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-[#1A1A1A] text-xs font-bold hover:bg-[#e5e2dc] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleInsertCode}
                className="px-4 py-2 bg-black text-white border-2 border-[#1A1A1A] text-xs font-bold shadow-[2px_2px_0_#1A1A1A] hover:bg-[#1c1b1b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                INJECT INTO ADVISORY CONDUIT →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Patch / Diff Modal */}
      {patchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F4EE] border-4 border-[#1A1A1A] shadow-[6px_6px_0_#1A1A1A] w-full max-w-md p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3">
              <div className="flex items-center gap-2">
                <Paperclip size={18} className="text-[#1D4ED8]" />
                <h3 className="font-sans font-bold text-lg text-[#1A1A1A]">ATTACH EXECUTION PROFILE DIFF</h3>
              </div>
              <button
                type="button"
                onClick={() => setPatchModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#1A1A1A] hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#635F57] uppercase block mb-1">
                  Patch / Benchmark Profile File
                </label>
                <input
                  type="text"
                  value={patchFilename}
                  onChange={(e) => setPatchFilename(e.target.value)}
                  className="w-full bg-white border-2 border-[#1A1A1A] p-2 text-xs font-mono text-[#1A1A1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#635F57] uppercase block mb-1">
                  Measured Performance Delta (e.g. +14.8% MFLOPS)
                </label>
                <input
                  type="text"
                  value={patchMetric}
                  onChange={(e) => setPatchMetric(e.target.value)}
                  className="w-full bg-white border-2 border-[#1A1A1A] p-2 text-xs font-mono text-[#1A1A1A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D5CEBF]">
              <button
                type="button"
                onClick={() => setPatchModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-[#1A1A1A] text-xs font-bold hover:bg-[#e5e2dc] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleInsertPatch}
                className="px-4 py-2 bg-[#1D4ED8] text-white border-2 border-[#1A1A1A] text-xs font-bold shadow-[2px_2px_0_#1A1A1A] hover:bg-blue-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                ATTACH DIFF ARTIFACT →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Escrow Release Confirmation Modal */}
      {escrowConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#1A1A1A] shadow-[6px_6px_0_#1A1A1A] w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b-2 border-[#1A1A1A] pb-3">
              <div className="w-10 h-10 bg-[#ffdbcf] border-2 border-[#1A1A1A] flex items-center justify-center">
                <Lock size={20} className="text-[#a63500]" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-sans font-bold text-lg text-[#1A1A1A]">CONFIRM ESCROW RELEASE</h3>
                <span className="text-xs text-[#8F8A7E]">MUTUAL HANDSHAKE & CREDIT TRANSFER</span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F4EE] border-2 border-[#1A1A1A] text-xs leading-relaxed space-y-2">
              <p className="font-bold text-[#1A1A1A]">
                You are about to disburse <span className="text-[#FF5500] font-mono font-bold">30 ALUMN-CR</span> from Smart Escrow to:
              </p>
              <div className="p-2 bg-white border border-[#1A1A1A] flex items-center justify-between">
                <span className="font-bold text-[#1A1A1A]">{activeThread.name}</span>
                <span className="text-[#635F57] font-mono">{activeThread.subTag}</span>
              </div>
              <p className="text-[#635F57]">
                This action is cryptographically signed and irreversible. The 15-minute architectural flash advisory session will be formally recorded as completed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEscrowConfirmOpen(false)}
                className="px-4 py-2 bg-white border-2 border-[#1A1A1A] text-xs font-bold hover:bg-[#e5e2dc] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                KEEP IN ESCROW
              </button>
              <button
                type="button"
                onClick={handleReleaseEscrow}
                disabled={isReleasing}
                className="px-5 py-2 bg-[#FF5500] text-white border-2 border-[#1A1A1A] text-xs font-bold shadow-[2px_2px_0_#1A1A1A] hover:bg-[#d04400] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                {isReleasing ? (
                  <span>DISBURSING CREDITS...</span>
                ) : (
                  <>
                    <span>CONFIRM & RELEASE 30 CR</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
