"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Send,
  Terminal,
  CheckCheck,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/context/AuthContext";
import { getToken } from "@/lib/auth";
import { getSocket } from "@/lib/socket";
import { EmptyState } from "@/components/ui/EmptyState";

type FilterTab = "ALL" | "1:1";

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
}

interface ThreadSummary {
  id: string;
  index: string;
  name: string;
  title: string;
  cohort: string;
  category: "1:1" | "FOUNDER" | "COMPLETED";
  statusBadge: string;
  statusColor: string;
  lastMessage: string;
  time: string;
  subTag: string;
  avatarUrl: string;
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
        category: t.category || "1:1",
        statusBadge: t.statusBadge || "ACTIVE",
        statusColor: t.statusColor || "bg-[#e5e2dc] text-[#1A1A1A]",
        lastMessage: t.lastMessage || "No messages yet.",
        time: t.lastMessageAt
          ? new Date(t.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—",
        subTag: t.subTag || "",
        avatarUrl:
          t.avatarUrl ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
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
        time: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : m.time || "",
        text: m.text || m.content || "",
        sent: m.senderId === user?.id || m.sent === true,
      }));
      setMessagesMap((prev) => {
        const existing = prev[selectedThreadId] || [];
        const localMessages = existing.filter((m) => m.failed || m.id.startsWith("msg-"));
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

  return (
    <div className="w-full bg-[#fcf9f3] text-[#1c1c18] font-mono select-text">
      {/* Header */}
      <div className="w-full bg-[#EFECE4] px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between border-4 border-black shadow-[4px_4px_0px_#000000] gap-3 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-sans font-black text-base sm:text-lg text-black tracking-tight uppercase">
            Messages
          </span>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]"></span>
            <span className="text-xs text-black font-bold">CONNECTED</span>
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
                [ 1:1 ]
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

                    {thread.subTag ? (
                      <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                        <span className="text-[11px] font-bold text-neutral-600">
                          {thread.subTag}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
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
                      {activeThread.cohort ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#CCFF00] text-black border-2 border-black shadow-[1px_1px_0px_#000000]">
                          {activeThread.cohort}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-700 font-mono">
                      <span className="font-bold">{activeThread.title || "Member"}</span>
                    </div>
                  </div>
                </div>
              </header>

              {/* Message History Display Area */}
              <div
                ref={chatStreamRef}
                id="chat-stream"
                className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#fcf9f3]"
              >
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
                        </div>

                        {/* Delivery status */}
                        {msg.sent && (
                          msg.failed ? (
                            <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold font-mono">
                              <AlertTriangle size={13} className="text-red-600" />
                              <span>FAILED TO SEND</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-neutral-600 font-bold font-mono">
                              <CheckCheck size={13} className="text-[#00E676]" />
                              <span>SENT</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message composer */}
              <footer className="p-3 sm:p-5 bg-[#F7F4EE] border-t-4 border-black flex flex-col gap-2.5 z-20 shadow-[0_-4px_0px_#000000]">
                {/* Error Alert Banner */}
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
                      placeholder="Write a message…"
                      className="w-full bg-transparent p-1 text-xs sm:text-sm text-black placeholder:text-neutral-500 focus:outline-none resize-none font-mono"
                    />
                    <div className="flex items-center justify-between px-1 pt-1 border-t-2 border-black text-neutral-600 font-mono font-bold text-[10px]">
                      <span>Ctrl/Cmd + Enter to send</span>
                      <span id="char-counter">{messageInput.length} / 2048</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="send-btn"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="h-[74px] sm:h-[80px] px-5 sm:px-7 bg-black text-[#CCFF00] font-mono font-bold text-sm tracking-wider uppercase border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#1c1b1b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send size={16} />
                    <span>Send</span>
                  </button>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
