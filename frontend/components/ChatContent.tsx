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
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/context/AuthContext";
import { getToken } from "@/lib/auth";
import { getSocket } from "@/lib/socket";
import { EmptyState } from "@/components/ui/EmptyState";

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
  failed?: boolean;
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

export function ChatContent() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  
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
      const rawThreads = apiChatData.threads as unknown as Array<{
        id: string;
        name: string;
        title?: string;
        cohort?: string;
        category?: "1:1" | "FOUNDER" | "COMPLETED";
        statusBadge?: string;
        statusColor?: string;
        lastMessage?: string;
        lastMessageAt?: string;
        unread?: number;
        escrowBadge?: string;
        escrowColor?: string;
        subTag?: string;
        avatarUrl?: string;
        isEscrowActive?: boolean;
        escrowAmount?: number;
        pgp?: string;
        messages?: any[];
      }>;
      const liveThreads: ThreadSummary[] = rawThreads.map((t, idx: number) => ({
        id: t.id,
        index: `#${String(idx + 1).padStart(2, "0")}`,
        name: t.name || `Channel ${idx + 1}`,
        title: t.title || "Member",
        cohort: t.cohort || "",
        pgp: t.pgp || `PGP: 0x${t.id.substring(0, 4)}..${t.id.substring(Math.max(0, t.id.length - 3))}`,
        category: t.category || "1:1",
        statusBadge: t.statusBadge || "ACTIVE P2P",
        statusColor: t.statusColor || "bg-[#ffdbcf] text-[#a63500]",
        lastMessage: t.lastMessage || "No messages recorded yet.",
        time: t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "LIVE",
        escrowBadge: t.escrowBadge || (t.isEscrowActive ? `[ ${t.escrowAmount || 30} ALUMN-CR HELD ]` : "[ DIRECT P2P ROUTE ]"),
        escrowColor: t.escrowColor || (t.isEscrowActive ? "text-[#a63500] bg-[#F7F4EE]" : "text-[#635F57] bg-[#e5e2dc]"),
        subTag: t.subTag || `FL-${t.id.slice(0, 4)}`,
        avatarUrl: t.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        isEscrowActive: Boolean(t.isEscrowActive),
        escrowAmount: t.escrowAmount || 0,
      }));

      setThreads(liveThreads);
      if (liveThreads.length > 0) {
        setSelectedThreadId((prev) => (prev && liveThreads.some((lt) => lt.id === prev) ? prev : liveThreads[0].id));
      }
    }
  }, [apiChatData]);

  // Fetch thread messages from API if available
  useEffect(() => {
    if (!selectedThreadId) return;
    let cancelled = false;
    apiClient.chat.getThread(selectedThreadId).then((res: any) => {
      if (cancelled || !res?.messages || !Array.isArray(res.messages)) return;
      const msgs: ChatMessage[] = res.messages.map((m: any) => ({
        id: m.id,
        sender: {
          id: m.senderId || m.sender?.id || "peer",
          name: m.senderName || m.sender?.name || "Peer",
          initials: (m.senderName || m.sender?.name || "PE").substring(0, 2).toUpperCase(),
          cohort: m.senderCohort || m.sender?.cohort,
        },
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : (m.time || ""),
        text: m.text || m.content || "",
        sent: m.senderId === user?.id || m.sent === true,
        signature: m.signature,
        codeSnippet: m.codeSnippet,
        attachment: m.attachment,
      }));
      setMessagesMap((prev) => {
        const existing = prev[selectedThreadId] || [];
        const localMessages = existing.filter(
          (m) => m.failed || m.id.startsWith("msg-") || m.id.startsWith("code-") || m.id.startsWith("patch-")
        );
        const serverIds = new Set(msgs.map((m) => m.id));
        const combined = [...msgs, ...localMessages.filter((m) => !serverIds.has(m.id))];
        return {
          ...prev,
          [selectedThreadId]: combined,
        };
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedThreadId, user?.id]);

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
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  const activeMessages = useMemo(() => {
    return selectedThreadId ? messagesMap[selectedThreadId] || [] : [];
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
    if (!text || !selectedThreadId) return;

    setSendError(null);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: {
        id: user?.id || "self",
        name: user?.name ? `${user.name} (You)` : "You",
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : "ME",
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
      try {
        const socket = getSocket();
        socket.emit("send_message", {
          roomId: selectedThreadId,
          text,
          id: newMsg.id,
          time: newMsg.time,
        });
      } catch (socketErr) {
        console.warn("Socket transmission warning:", socketErr);
      }
      await apiClient.chat.sendMessage(selectedThreadId, text);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Transmission error: Unable to deliver message to conduit. Please check your connection and retry.";
      setSendError(errorMsg);
      setMessagesMap((prev) => ({
        ...prev,
        [selectedThreadId]: (prev[selectedThreadId] || []).map((m) =>
          m.id === newMsg.id ? { ...m, failed: true } : m
        ),
      }));
    }
  };

  // Handle Code snippet insertion
  const handleInsertCode = () => {
    if (!codeSnippetText.trim() || !selectedThreadId) return;
    const newMsg: ChatMessage = {
      id: `code-${Date.now()}`,
      sender: {
        id: user?.id || "self",
        name: user?.name ? `${user.name} (You)` : "You",
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : "ME",
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
    if (!patchFilename.trim() || !selectedThreadId) return;
    const newMsg: ChatMessage = {
      id: `patch-${Date.now()}`,
      sender: {
        id: user?.id || "self",
        name: user?.name ? `${user.name} (You)` : "You",
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : "ME",
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
    if (!activeThread) return;
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
      <div className="w-full bg-[#EFECE4] px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between border-4 border-black shadow-[4px_4px_0px_#000000] gap-3 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-black text-white text-[11px] font-bold tracking-wider border border-black">
              NODE//COMM-04
            </span>
            <span className="font-sans font-black text-base sm:text-lg text-black tracking-tight uppercase">
              ADVISORY CONDUIT & REAL-TIME ESCROW DISPATCH
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse"></span>
            <span className="text-xs text-black font-bold">E2E RATIFIED // SHA-256 ENCLAVE</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-700">
            <span className="font-bold">ESCROW POOL:</span>
            <span className="font-bold text-black px-2 py-1 bg-[#CCFF00] border-2 border-black shadow-[2px_2px_0px_#000000]">
              90 ALUMN-CR
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-bold text-neutral-600">SESSION:</span>
            <span className="text-white bg-[#FF5500] px-2 py-0.5 border border-black font-bold">SYNCHRONOUS FLASH</span>
          </div>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-12 gap-0 w-full min-h-[calc(100vh-10rem)] bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
        {/* LEFT PANE: Conversation Index & Escrow Threads */}
        <section className="col-span-12 lg:col-span-4 xl:col-span-3 bg-[#F7F4EE] flex flex-col border-b-4 lg:border-b-0 lg:border-r-4 border-black z-10">
          {/* Thread Query & Diagnostics Bar */}
          <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 border-b-4 border-black bg-[#F7F4EE]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wider text-black uppercase font-mono">
                INDEXED CHANNELS
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-black text-[#CCFF00] border-2 border-black">
                TOTAL: {String(filteredThreads.length).padStart(2, "0")}
              </span>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black shadow-[3px_3px_0px_#000000]">
              <Terminal size={15} className="text-black shrink-0" />
              <input
                type="text"
                id="filter-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="grep thread, cohort, tag..."
                className="w-full bg-transparent text-xs text-black placeholder:text-neutral-500 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500 font-bold">/ESC</span>
            </div>

            {/* Filter Segmented Controller */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 text-[11px] font-bold border-2 border-black shadow-[2px_2px_0px_#000000] whitespace-nowrap active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                  activeFilter === "ALL"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[#CCFF00]"
                }`}
              >
                [ ALL CONVERSATIONS ]
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("1:1")}
                className={`px-2.5 py-1 text-[11px] font-bold border-2 border-black shadow-[2px_2px_0px_#000000] whitespace-nowrap active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                  activeFilter === "1:1"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[#CCFF00]"
                }`}
              >
                [ 1:1 ADVISORY ]
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("ESCROW")}
                className={`px-2.5 py-1 text-[11px] font-bold border-2 border-black shadow-[2px_2px_0px_#000000] whitespace-nowrap active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                  activeFilter === "ESCROW"
                    ? "bg-[#FF5500] text-white"
                    : "bg-white text-[#FF5500] hover:bg-[#ffdbcf]"
                }`}
              >
                [ ESCROW ACTIVE ]
              </button>
            </div>
          </div>

          {/* Thread Scrollable Index */}
          <div className="flex-1 flex flex-col overflow-y-auto divide-y-2 divide-black">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-600 font-mono">
                No conversation channels indexed.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.id === selectedThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`p-3.5 sm:p-4 relative cursor-pointer group transition-all ${
                      isSelected
                        ? "bg-white"
                        : "bg-[#F7F4EE] hover:bg-[#f0ebe1]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#FF5500]"></div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold px-1.5 bg-black text-white border border-black">
                          {thread.index}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 border-2 border-black uppercase font-mono ${thread.statusColor}`}>
                          {thread.statusBadge}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-neutral-600 shrink-0">{thread.time}</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative w-10 h-10 bg-[#ebe8e2] border-2 border-black shrink-0 overflow-hidden shadow-[2px_2px_0px_#000000]">
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
                        <span className="font-mono font-bold text-sm text-black truncate">
                          {thread.name}
                        </span>
                        <span className="font-mono text-xs text-neutral-700 truncate">
                          {thread.title}
                        </span>
                      </div>
                    </div>

                    <p className="font-sans text-xs text-neutral-800 line-clamp-2 mb-2.5 font-normal">
                      {thread.lastMessage}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 border-2 border-black shadow-[1px_1px_0px_#000000] ${thread.escrowColor}`}>
                        {thread.escrowBadge}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-600 flex items-center gap-1">
                        {thread.isEscrowActive && (
                          <span className="w-2 h-2 rounded-full bg-[#00E676] border border-black"></span>
                        )}
                        {thread.subTag}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Status Box at Bottom of Left Pane */}
          <div className="p-3.5 sm:p-4 bg-[#EFECE4] border-t-4 border-black flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-700 uppercase font-mono">
                P2P WEBSOCKET
              </span>
              <span className="text-[11px] font-bold text-[#00E676] bg-black px-2 py-0.5 border-2 border-black">
                WSS://OK
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-700 font-mono">
              <span>PACKET DROP: 0.00%</span>
              <span>CIPHER: AES-GCM-256</span>
            </div>
          </div>
        </section>

        {/* RIGHT PANE: Active Flash Advisory Thread */}
        <main className="col-span-12 lg:col-span-8 xl:col-span-9 bg-[#fcf9f3] flex flex-col justify-between relative overflow-hidden">
          {!activeThread ? (
            <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12">
              <EmptyState
                icon={MessageSquare}
                title="No Active Conversations"
                body="You have no open advisory conduits or mentorship flash threads. Initiate a connection from the Directory or Mentorship board."
                action={
                  <a
                    href="/directory"
                    className="px-4 py-2 border-2 border-black font-mono text-xs font-bold uppercase bg-[#CCFF00] text-black shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#CCFF00]"
                  >
                    Browse Directory →
                  </a>
                }
              />
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <header className="p-3.5 sm:p-5 bg-white border-b-4 border-black flex flex-wrap items-center justify-between gap-4 z-20 shadow-[0_4px_0px_#000000]">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="relative w-12 h-12 bg-[#ebe8e2] border-2 border-black shrink-0 overflow-hidden shadow-[3px_3px_0px_#000000]">
                    <Image
                      src={activeThread.avatarUrl}
                      alt={activeThread.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00E676] border-2 border-black"></span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-lg sm:text-xl text-black">
                        {activeThread.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#CCFF00] text-black border-2 border-black shadow-[1px_1px_0px_#000000]">
                        {activeThread.cohort}
                      </span>
                      <span className="text-xs text-neutral-600 font-mono font-bold">{activeThread.pgp}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-700 font-mono">
                      <span className="font-bold">{activeThread.title}</span>
                      <span className="text-black font-black">•</span>
                      <span className="text-[#1D4ED8] font-bold font-mono">
                        15-Minute Architectural Flash Session #{activeThread.subTag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timer & Escrow Action CTA */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex flex-col items-end px-3 py-1.5 bg-[#F7F4EE] border-2 border-black shadow-[3px_3px_0px_#000000]">
                    <span className="text-[9px] font-bold text-neutral-600 uppercase font-mono">
                      SESSION COUNTDOWN
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-ping"></span>
                      <span className="text-sm sm:text-base font-black text-[#FF5500] font-mono">
                        T-MINUS {timeFormatted}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="escrow-release-btn"
                    onClick={() => setEscrowConfirmOpen(true)}
                    disabled={isEscrowReleased}
                    className={`px-4 py-2.5 text-xs sm:text-sm font-bold font-mono uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] transition-all flex items-center gap-2 ${
                      isEscrowReleased
                        ? "bg-[#e5e2dc] text-neutral-500 cursor-not-allowed shadow-none"
                        : "bg-[#FF5500] text-white hover:bg-[#d04400] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
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
                  <div className="max-w-xl w-full bg-[#F7F4EE] p-3.5 border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Lock size={20} className="text-[#FF5500] shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-[#FF5500] uppercase font-mono">
                          SMART CONTRACT ESCROW ENGAGED
                        </span>
                        <span className="text-xs text-black font-mono">
                          30 ALUMN-CR securely locked in dual-handshake enclave. Direct chat channel established.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-[#CCFF00] shrink-0 border-2 border-black">
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
                        className={`w-9 h-9 shrink-0 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center text-xs font-black ${
                          msg.sent
                            ? "bg-black text-[#CCFF00]"
                            : "bg-[#F7F4EE] text-black"
                        }`}
                      >
                        {msg.sender.initials}
                      </div>

                      <div className={`flex flex-col gap-1 w-full ${msg.sent ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          {msg.sent ? (
                            <>
                              <span className="text-neutral-500 font-bold">{msg.time}</span>
                              <span className="font-bold text-black">{msg.sender.name}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#CCFF00] text-black border border-black">
                                AUTHOR
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-black">{msg.sender.name}</span>
                              <span className="text-neutral-500 font-bold">{msg.time}</span>
                              {msg.signature && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-black text-[#CCFF00] border border-black uppercase">
                                  {msg.signature}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`p-3.5 sm:p-4 border-2 border-black shadow-[3px_3px_0px_#000000] text-xs sm:text-sm leading-relaxed ${
                            msg.sent ? "bg-[#CCFF00] text-black text-left" : "bg-white text-black text-left"
                          }`}
                        >
                          <p className="font-sans text-black font-medium">{msg.text}</p>

                          {/* Code Snippet Artifact inside Chat Bubble */}
                          {msg.codeSnippet && (
                            <div className="mt-3 p-3 bg-[#EFECE4] border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5">
                              <div className="flex items-center justify-between pb-1 border-b-2 border-black">
                                <span className="text-[11px] font-bold text-black font-mono">
                                  {msg.codeSnippet.filename}
                                </span>
                                <span className="text-[9px] font-bold bg-black text-[#CCFF00] px-1.5 py-0.5 border border-black font-mono">
                                  {msg.codeSnippet.tag}
                                </span>
                              </div>
                              <pre className="text-[11px] text-black overflow-x-auto p-2 bg-white border-2 border-black font-mono leading-relaxed">
                                <code>{msg.codeSnippet.code}</code>
                              </pre>
                            </div>
                          )}

                          {/* Attached Diff Artifact */}
                          {msg.attachment && (
                            <div className="mt-2.5 p-2 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <FileCode size={16} className="text-[#1D4ED8]" />
                                <span className="text-xs font-bold text-black font-mono">{msg.attachment.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-black bg-[#CCFF00] px-1.5 py-0.5 border-2 border-black font-mono">
                                {msg.attachment.metric}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Delivery status */}
                        {msg.sent && (
                          msg.failed ? (
                            <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold font-mono">
                              <AlertTriangle size={13} className="text-red-600" />
                              <span>TRANSMISSION FAILED</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-neutral-600 font-bold font-mono">
                              <CheckCheck size={13} className="text-[#00E676]" />
                              <span>DELIVERED & DECRYPTED VIA CLIENT_ENCLAVE</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Telemetry Input Console Section */}
              <footer className="p-3 sm:p-5 bg-[#F7F4EE] border-t-4 border-black flex flex-col gap-2.5 z-20 shadow-[0_-4px_0px_#000000]">
                {/* Console Utility Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPatchModalOpen(true)}
                      className="px-3 py-1.5 bg-white text-black hover:bg-[#CCFF00] text-[11px] font-bold font-mono uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                    >
                      <Paperclip size={13} />
                      <span>ATTACH PATCH/DIFF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeModalOpen(true)}
                      className="px-3 py-1.5 bg-white text-black hover:bg-[#CCFF00] text-[11px] font-bold font-mono uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                    >
                      <Code2 size={13} />
                      <span>SHARE BENCHMARK CODE</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Voice telemetry memo stream ready (RAW mono 16kHz)")}
                      className="px-3 py-1.5 bg-white text-black hover:bg-[#CCFF00] text-[11px] font-bold font-mono uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                    >
                      <Mic size={13} />
                      <span>VOICE MEMO (RAW)</span>
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-600 font-mono font-bold">
                    <span>INPUT: MONO_UTF8</span>
                    <span>|</span>
                    <span>KEY: 2048-BIT ED25519</span>
                  </div>
                </div>

                {/* Transmission Error Alert Banner */}
                {sendError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-100 border-2 border-black text-red-900 flex items-center justify-between gap-2 text-xs font-bold font-mono shadow-[2px_2px_0px_#000000]"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-600 shrink-0" />
                      <span>{sendError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSendError(null)}
                      className="text-xs uppercase underline hover:text-black font-mono ml-2 cursor-pointer font-bold"
                    >
                      DISMISS
                    </button>
                  </div>
                )}

                {/* Textarea & Send Trigger Layout */}
                <div className="flex items-end gap-2.5">
                  <div className="flex-1 bg-white p-2 border-2 border-black shadow-[3px_3px_0px_#000000] focus-within:shadow-[4px_4px_0px_#000000] transition-all">
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
                      className="w-full bg-transparent p-1 text-xs sm:text-sm text-black placeholder:text-neutral-500 focus:outline-none resize-none font-mono"
                    />
                    <div className="flex items-center justify-between px-1 pt-1 border-t-2 border-black text-neutral-600 font-mono font-bold text-[10px]">
                      <span>[CMD + ENTER] TO SIGN & TRANSMIT</span>
                      <span id="char-counter">{messageInput.length} / 2048 CHARS</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="send-btn"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="h-[74px] sm:h-[80px] px-5 sm:px-7 bg-black text-[#CCFF00] font-mono font-bold text-sm tracking-wider uppercase border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#1c1b1b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center justify-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span>TRANSMIT</span>
                      <span>↵</span>
                    </div>
                    <span className="text-[9px] text-white tracking-widest font-mono">PORT_OUT</span>
                  </button>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>

      {/* Real-Time Telemetry Global Status Footer */}
      <footer className="w-full bg-[#EFECE4] border-4 border-black shadow-[4px_4px_0px_#000000] px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-700 mt-4 z-30 font-mono">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] border border-black shadow-[0_0_6px_#00E676]"></span>
            <span className="font-bold text-black uppercase font-mono">BROADSHEET CONDUIT LIVE</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-neutral-500 font-bold">CHANNEL:</span>
            <span className="font-bold text-black">WSS_PEER_SYNC://127.0.0.1:9042</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-neutral-500 font-bold">LATENCY:</span>
            <span className="text-black font-bold">11.4 ms</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-bold">SMART ESCROW AGENT:</span>
            <span className="text-[#FF5500] font-black">ALUMN-CHAIN v4.9</span>
          </div>
          <span className="text-black font-bold">|</span>
          <div className="flex items-center gap-1 text-neutral-600 font-bold">
            <span>SECURITY LEVEL 4</span>
            <ShieldCheck size={14} className="text-[#00E676]" />
          </div>
        </div>
      </footer>

      {/* Modal 1: Code Snippet Insertion Modal */}
      {codeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F4EE] border-4 border-black shadow-[8px_8px_0px_#000000] w-full max-w-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-4 border-black pb-3">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-[#FF5500]" />
                <h3 className="font-mono font-black text-base sm:text-lg text-black uppercase">SHARE BENCHMARK CODE ARTIFACT</h3>
              </div>
              <button
                type="button"
                onClick={() => setCodeModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-mono">
              <div>
                <label className="text-[11px] font-bold text-neutral-700 uppercase block mb-1">
                  Artifact Identifier / Filename
                </label>
                <input
                  type="text"
                  value={codeFilename}
                  onChange={(e) => setCodeFilename(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 text-xs font-mono text-black focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 uppercase block mb-1">
                  Code Block Contents (Rust / C++ / Python / Go)
                </label>
                <textarea
                  rows={6}
                  value={codeSnippetText}
                  onChange={(e) => setCodeSnippetText(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 text-xs font-mono text-black focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black font-mono">
              <button
                type="button"
                onClick={() => setCodeModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-black text-xs font-bold hover:bg-[#e5e2dc] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleInsertCode}
                className="px-5 py-2 bg-black text-[#CCFF00] border-2 border-black text-xs font-bold shadow-[3px_3px_0px_#000000] hover:bg-[#1c1b1b] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                INJECT INTO CONDUIT →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Patch / Diff Modal */}
      {patchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F4EE] border-4 border-black shadow-[8px_8px_0px_#000000] w-full max-w-md p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-4 border-black pb-3">
              <div className="flex items-center gap-2">
                <Paperclip size={18} className="text-[#1D4ED8]" />
                <h3 className="font-mono font-black text-base sm:text-lg text-black uppercase">ATTACH EXECUTION PROFILE DIFF</h3>
              </div>
              <button
                type="button"
                onClick={() => setPatchModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-mono">
              <div>
                <label className="text-[11px] font-bold text-neutral-700 uppercase block mb-1">
                  Patch / Benchmark Profile File
                </label>
                <input
                  type="text"
                  value={patchFilename}
                  onChange={(e) => setPatchFilename(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 text-xs font-mono text-black focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 uppercase block mb-1">
                  Measured Performance Delta (e.g. +14.8% MFLOPS)
                </label>
                <input
                  type="text"
                  value={patchMetric}
                  onChange={(e) => setPatchMetric(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 text-xs font-mono text-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black font-mono">
              <button
                type="button"
                onClick={() => setPatchModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-black text-xs font-bold hover:bg-[#e5e2dc] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleInsertPatch}
                className="px-5 py-2 bg-[#1D4ED8] text-white border-2 border-black text-xs font-bold shadow-[3px_3px_0px_#000000] hover:bg-blue-800 active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                ATTACH DIFF ARTIFACT →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Escrow Release Confirmation Modal */}
      {escrowConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b-4 border-black pb-3">
              <div className="w-11 h-11 bg-[#ffdbcf] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                <Lock size={22} className="text-[#FF5500]" />
              </div>
              <div className="flex flex-col font-mono">
                <h3 className="font-mono font-black text-lg text-black uppercase">CONFIRM ESCROW RELEASE</h3>
                <span className="text-xs text-neutral-600 font-bold">MUTUAL HANDSHAKE & CREDIT TRANSFER</span>
              </div>
            </div>

            <div className="p-4 bg-[#F7F4EE] border-2 border-black text-xs leading-relaxed space-y-2.5 font-mono">
              <p className="font-bold text-black">
                You are about to disburse <span className="text-black bg-[#CCFF00] px-1.5 py-0.5 border border-black font-mono font-black">30 ALUMN-CR</span> from Smart Escrow to:
              </p>
              <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_#000000]">
                <span className="font-bold text-black">{activeThread.name}</span>
                <span className="text-neutral-700 font-mono font-bold">{activeThread.subTag}</span>
              </div>
              <p className="text-neutral-700">
                This action is cryptographically signed and irreversible. The 15-minute architectural flash advisory session will be formally recorded as completed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 font-mono">
              <button
                type="button"
                onClick={() => setEscrowConfirmOpen(false)}
                className="px-4 py-2.5 bg-white border-2 border-black text-xs font-bold hover:bg-[#e5e2dc] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                KEEP IN ESCROW
              </button>
              <button
                type="button"
                onClick={handleReleaseEscrow}
                disabled={isReleasing}
                className="px-5 py-2.5 bg-[#FF5500] text-white border-2 border-black text-xs font-bold shadow-[3px_3px_0px_#000000] hover:bg-[#d04400] flex items-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50"
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
