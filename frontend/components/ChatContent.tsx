"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Send,
  MessageCircle,
  Search,
  ShieldCheck,
  BriefcaseBusiness,
  GraduationCap,
  ChevronRight,
  RefreshCw,
  Hash,
  MessageSquare,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/context/AuthContext";
import { getSocket } from "@/lib/socket";
import type { Alumni } from "@/lib/api/types";
import { ReferralThread } from "@/components/ReferralThread";
import { Card } from "@/components/ui";
import {
  listChatSpaces,
  listChatMessages,
  sendChatMessage,
  createChatSpace,
  GoogleChatSpace,
  GoogleChatMessage,
} from "@/lib/google-workspace";

type Tab = "1:1" | "Groups" | "GoogleChat";

type MockMessage = {
  id: string;
  text: string;
  time: string;
  sent: boolean;
};

type ThreadMessage = {
  id: string;
  text: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
};

const listItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.15 } },
};

const roleBadges = {
  student: { label: "Student", color: "bg-sage/10 text-sage", icon: GraduationCap },
  alumni: { label: "Alumni", color: "bg-brass/10 text-brass", icon: BriefcaseBusiness },
  faculty: { label: "Faculty", color: "bg-indigo/10 text-indigo", icon: GraduationCap },
  admin: { label: "Admin", color: "bg-red/10 text-red", icon: ShieldCheck },
};

export function ChatContent() {
  const { user, accessToken, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("1:1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [localThreads, setLocalThreads] = useState<Record<string, MockMessage[]>>({});
  const [messageSearch, setMessageSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Google Chat States
  const [googleSpaces, setGoogleSpaces] = useState<GoogleChatSpace[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [spaceMessages, setSpaceMessages] = useState<GoogleChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatMessageInput, setChatMessageInput] = useState("");
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [newSpaceOpen, setNewSpaceOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [creatingSpace, setCreatingSpace] = useState(false);

  const { data: recommendedAlumniData } = useApi("chat:alumni", () =>
    apiClient.alumni.list(undefined, { filter: "role", value: "ALUMNI" })
  );
  const recommendedAlumni = recommendedAlumniData || [];

  const { data: chatData, reload: reloadChatData } = useApi(
    "chat:list",
    () => apiClient.chat.list()
  );

  const chatThreads = useMemo(() => {
    if (!chatData?.threads) return [];
    return (chatData.threads as unknown as Array<{ id: string; name: string; isGroup: boolean; participants?: Array<{ role?: string }>; lastMessage?: string; lastMessageAt: string; unread?: number }>).map((t) => ({
      id: t.id,
      name: t.name,
      isGroup: t.isGroup,
      role: t.participants?.[0]?.role?.toLowerCase() || "alumni",
      initials: t.name ? t.name.substring(0, 2).toUpperCase() : "??",
      lastMessage: t.lastMessage || "No messages yet",
      time: new Date(t.lastMessageAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      unread: t.unread || 0,
      participants: t.participants,
    }));
  }, [chatData]);

  // Read URL query parameter ?thread={id} or ?threadId={id}
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const threadParam = params.get("thread") || params.get("threadId");
      if (threadParam) {
        setSelectedId(threadParam);
      }
    }
  }, []);

  // Fetch Google Chat Spaces
  const fetchGoogleSpaces = async () => {
    if (!accessToken) return;
    setLoadingSpaces(true);
    try {
      const spaces = await listChatSpaces({ token: accessToken });
      setGoogleSpaces(spaces);
      if (spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(spaces[0]);
      }
    } catch (err) {
      console.warn("Could not fetch Google Chat spaces:", err);
    } finally {
      setLoadingSpaces(false);
    }
  };

  useEffect(() => {
    if (activeTab === "GoogleChat" && accessToken) {
      fetchGoogleSpaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accessToken]);

  // Fetch Google Chat Messages when a space is selected
  useEffect(() => {
    if (!selectedSpace || !accessToken) return;
    let isActive = true;

    const fetchMsgs = async () => {
      setLoadingMessages(true);
      try {
        const msgs = await listChatMessages({
          token: accessToken,
          spaceName: selectedSpace.name,
        });
        if (isActive) setSpaceMessages(msgs);
      } catch (err) {
        console.warn("Could not fetch space messages:", err);
      } finally {
        if (isActive) setLoadingMessages(false);
      }
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 6000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [selectedSpace, accessToken]);

  const handleSendGoogleChatMessage = async () => {
    if (!selectedSpace || !chatMessageInput.trim() || !accessToken) return;
    const textToSend = chatMessageInput.trim();
    setChatMessageInput("");
    setSendingChatMessage(true);

    try {
      const sentMsg = await sendChatMessage({
        token: accessToken,
        spaceName: selectedSpace.name,
        text: textToSend,
      });
      setSpaceMessages((prev) => [...prev, sentMsg]);
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setSendingChatMessage(false);
    }
  };

  const handleCreateSpaceSubmit = async () => {
    if (!newSpaceName.trim() || !accessToken) return;
    setCreatingSpace(true);
    try {
      const created = await createChatSpace({
        token: accessToken,
        displayName: newSpaceName.trim(),
      });
      setGoogleSpaces((prev) => [created, ...prev]);
      setSelectedSpace(created);
      setNewSpaceOpen(false);
      setNewSpaceName("");
    } catch (err) {
      console.error("Failed to create Google Chat space:", err);
    } finally {
      setCreatingSpace(false);
    }
  };

  const filtered = useMemo(() => {
    let result = chatThreads.filter((t) =>
      activeTab === "Groups" ? t.isGroup : !t.isGroup
    );
    if (messageSearch.trim()) {
      const q = messageSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.lastMessage.toLowerCase().includes(q) ||
          (t.role && t.role.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeTab, messageSearch, chatThreads]);

  const totalUnread = chatThreads.reduce(
    (sum: number, t) => sum + t.unread,
    0
  );

  useEffect(() => {
    if (selectedId && replyEndRef.current) {
      replyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedId, localThreads]);

  // Real-time WebSockets Integration
  useEffect(() => {
    if (!selectedId || !user) return;
    const socket = getSocket();
    
    // Connect to server and join the specific chat room
    socket.connect();
    if (accessToken) socket.emit("authenticate", accessToken);
    socket.emit("join_room", selectedId);

    // Listen for incoming messages
    const handleReceiveMessage = (data: { roomId: string; id: string; text: string; time: string; sent: boolean }) => {
      if (data.roomId === selectedId) {
        setLocalThreads((prev) => {
          const current = prev[selectedId] || [];
          // Avoid duplicates
          if (current.find(m => m.id === data.id)) return prev;
          
          return {
            ...prev,
            [selectedId]: [...current, data],
          };
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    // Initial fetch of historical messages
    const fetchMessages = async () => {
      try {
        const data = (await apiClient.chat.getThread(selectedId)) as {
          messages: ThreadMessage[];
        };

        const formatted = data.messages.map((m) => ({
          id: m.id,
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sent: m.sender.id === user.id,
        }));

        setLocalThreads((prev) => ({
          ...prev,
          [selectedId]: formatted,
        }));
      } catch (err) {
        console.error("Failed to fetch thread", err);
      }
    };
    fetchMessages();

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [selectedId, user, accessToken]);

  const handleSendReply = async (threadId: string) => {
    const text = replyInputs[threadId]?.trim();
    if (!text) return;

    // Optimistic UI
    const newMsg: MockMessage = {
      id: `local-${Date.now()}`,
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sent: true,
    };
    setLocalThreads((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), newMsg],
    }));
    setReplyInputs((prev) => ({ ...prev, [threadId]: "" }));

    // API Call & WebSockets
    try {
      const socket = getSocket();
      socket.emit("send_message", { ...newMsg, threadId, roomId: threadId });
      
      await apiClient.chat.sendMessage(threadId, text);
      reloadChatData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComposeSend = () => {
    if (!selectedAlumni || !composeMessage.trim()) return;
    setComposeOpen(false);
    setSelectedAlumni(null);
    setComposeMessage("");
  };

  const getThreadReferralStatus = (threadId: string) => {
    const statusMap: Record<
      string,
      "pending" | "accepted" | "referred" | "hired" | "rejected" | null
    > = {
      "chat-1": "accepted",
      "chat-3": "pending",
      "chat-5": "referred",
      "chat-2": "hired",
      "chat-4": null,
    };
    return statusMap[threadId] || null;
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold">Chat & Channels</h1>
          {totalUnread > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-clay px-1.5 text-[10px] font-semibold text-white">
              {totalUnread}
            </span>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-paper/60 p-1 rounded-full border border-ink/10">
          <button
            onClick={() => setActiveTab("1:1")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === "1:1"
                ? "bg-white text-ink shadow-xs"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            Direct Messages
          </button>
          <button
            onClick={() => setActiveTab("Groups")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === "Groups"
                ? "bg-white text-ink shadow-xs"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            Student Cohorts
          </button>
          <button
            onClick={() => setActiveTab("GoogleChat")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === "GoogleChat"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            <MessageSquare size={13} />
            Google Chat Spaces
          </button>
        </div>

        <div className="relative max-w-xs w-full sm:w-auto">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="search"
            value={messageSearch}
            onChange={(e) => setMessageSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-ink/10 bg-white outline-none placeholder:text-ink/35 focus:border-brass focus:ring-1 focus:ring-brass"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "GoogleChat" ? (
        /* Google Chat Spaces View */
        <div className="mt-6 space-y-6">
          {!accessToken && (
            <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-base">
                    Connect with Google Chat
                  </h3>
                  <p className="text-sm text-ink/60">
                    Sign in with Google to chat in your organization&apos;s
                    spaces and alumni channels in real time.
                  </p>
                </div>
              </div>
              <button
                onClick={signInWithGoogle}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                Sign in with Google
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Spaces List */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-ink/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                  <Hash size={18} className="text-blue-600" />
                  Google Chat Spaces
                </h2>
                {accessToken && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={fetchGoogleSpaces}
                      disabled={loadingSpaces}
                      className="p-1 text-ink/40 hover:text-ink"
                      title="Refresh spaces"
                    >
                      <RefreshCw
                        size={14}
                        className={loadingSpaces ? "animate-spin" : ""}
                      />
                    </button>
                    <button
                      onClick={() => setNewSpaceOpen(true)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Create Space"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>

              {loadingSpaces ? (
                <div className="py-12 text-center text-xs text-ink/40">
                  Loading Google Chat spaces...
                </div>
              ) : googleSpaces.length === 0 ? (
                <div className="py-10 text-center space-y-3 rounded-xl border border-dashed border-ink/10 bg-paper/20">
                  <MessageSquare size={28} className="mx-auto text-ink/30" />
                  <p className="text-xs font-semibold text-ink/70">
                    No Google Chat Spaces
                  </p>
                  <p className="text-[11px] text-ink/50 max-w-xs mx-auto">
                    Create a new space for your alumni cohort or topic.
                  </p>
                  {accessToken && (
                    <button
                      onClick={() => setNewSpaceOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      <Plus size={13} />
                      Create Space
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {googleSpaces.map((space) => (
                    <button
                      key={space.name}
                      onClick={() => setSelectedSpace(space)}
                      className={`w-full p-3 rounded-xl text-left transition-colors flex items-center justify-between gap-2 ${
                        selectedSpace?.name === space.name
                          ? "bg-blue-50/80 border border-blue-500/30 text-blue-900"
                          : "hover:bg-paper/60 border border-transparent text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs">
                          #
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-xs truncate">
                            {space.displayName || "General Space"}
                          </p>
                          <p className="text-[10px] text-ink/40 capitalize">
                            {space.spaceType?.toLowerCase() || "Space"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Space Chat Stream */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-ink/10 p-5 shadow-sm flex flex-col justify-between min-h-[520px]">
              {selectedSpace ? (
                <div className="flex flex-col h-full justify-between space-y-4">
                  {/* Space Header */}
                  <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Hash size={18} />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-ink">
                          {selectedSpace.displayName || "Google Chat Space"}
                        </h3>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          ● Connected via Google Chat API
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[360px] p-2">
                    {loadingMessages ? (
                      <div className="py-16 text-center text-xs text-ink/40">
                        Loading messages...
                      </div>
                    ) : spaceMessages.length === 0 ? (
                      <div className="py-16 text-center text-xs text-ink/40 space-y-2">
                        <MessageSquare size={24} className="mx-auto text-ink/20" />
                        <p>No messages yet in this space.</p>
                        <p className="text-[10px]">Send the first message below!</p>
                      </div>
                    ) : (
                      spaceMessages.map((msg, idx) => (
                        <div key={msg.name || idx} className="flex gap-2.5 items-start">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                            {msg.sender?.displayName
                              ? msg.sender.displayName[0].toUpperCase()
                              : "U"}
                          </div>
                          <div className="flex-1 min-w-0 bg-paper/40 p-3 rounded-xl border border-ink/5">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-xs text-ink">
                                {msg.sender?.displayName || "Member"}
                              </span>
                              <span className="text-[10px] text-ink/40">
                                {msg.createTime
                                  ? new Date(msg.createTime).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" }
                                    )
                                  : ""}
                              </span>
                            </div>
                            <p className="text-xs text-ink/85 leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Box */}
                  {accessToken && (
                    <div className="pt-3 border-t border-ink/10 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Message #${
                          selectedSpace.displayName || "space"
                        }...`}
                        value={chatMessageInput}
                        onChange={(e) => setChatMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendGoogleChatMessage();
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-full border border-ink/15 text-xs outline-none focus:border-blue-600"
                      />
                      <button
                        onClick={handleSendGoogleChatMessage}
                        disabled={
                          sendingChatMessage || !chatMessageInput.trim()
                        }
                        className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="my-auto py-16 text-center space-y-3">
                  <MessageSquare size={36} className="mx-auto text-ink/20" />
                  <p className="text-sm font-semibold text-ink/60">
                    Select a Google Chat Space
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Alumni Direct & Cohort Threads View */
        <div className="mt-6 flex gap-6 lg:grid lg:grid-cols-[1.2fr_1fr]">
          <div className="flex-1 min-w-0 lg:border-r lg:border-ink/10 lg:pr-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="h-[calc(100vh-12rem)] overflow-y-auto"
              ref={listRef}
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 border border-dashed border-ink/20 bg-paper/60 p-8 sm:p-10 h-full">
                  <MessageCircle
                    size={22}
                    className="text-brass"
                    strokeWidth={1.6}
                  />
                  <div className="text-center">
                    <h3 className="font-display text-2xl">
                      No conversations yet
                    </h3>
                    <p className="mt-2 max-w-prose text-sm leading-6 text-ink/60">
                      Start a conversation from the Network page or join a Google
                      Chat Space.
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((thread, i) => {
                    const messages = localThreads[thread.id] ?? [];
                    const isExpanded = selectedId === thread.id;
                    const role = thread.role || "student";
                    const roleInfo =
                      roleBadges[role as keyof typeof roleBadges] ||
                      roleBadges.student;
                    const referralStatus = getThreadReferralStatus(thread.id);

                    return (
                      <motion.div
                        key={thread.id}
                        custom={i}
                        variants={listItemVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                      >
                        <button
                          onClick={() => {
                            setSelectedId(isExpanded ? null : thread.id);
                            listRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                          className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors cursor-pointer border-b border-ink/5 ${
                            isExpanded ? "bg-brass/5" : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass font-semibold text-sm">
                              {thread.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-semibold text-sm truncate">
                                  {thread.name}
                                </span>
                                <span className="shrink-0 font-mono text-[10px] text-ink/40">
                                  {thread.time}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center justify-between gap-2">
                                <span className="truncate max-w-[200px] text-xs text-ink/50">
                                  {thread.lastMessage}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${roleInfo.color}`}
                                  >
                                    <roleInfo.icon size={10} className="mr-1" />
                                    {roleInfo.label}
                                  </span>
                                  {thread.unread > 0 && (
                                    <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-semibold text-white">
                                      {thread.unread}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className={`text-ink/30 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden border-t border-ink/5 bg-paper/30"
                            >
                              <div className="px-4 py-4 space-y-3">
                                {referralStatus && (
                                  <div className="rounded-lg bg-brass/5 border border-brass/20 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-mono text-xs uppercase tracking-wider text-brass">
                                        Referral Status
                                      </span>
                                      <span className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] bg-brass/15 text-brass">
                                        {referralStatus}
                                      </span>
                                    </div>
                                    <ReferralThread status={referralStatus} />
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-ink/5 px-4 py-3">
                                <div className="space-y-3" ref={scrollRef}>
                                  {messages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex items-end gap-2 ${
                                        msg.sent
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      {!msg.sent && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass text-[10px] font-semibold">
                                          {thread.initials}
                                        </div>
                                      )}
                                      <div
                                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                          msg.sent
                                            ? "bg-brass/10 text-ink"
                                            : "bg-ink/5 text-ink"
                                        }`}
                                      >
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="mt-1 font-mono text-[9px] text-ink/40">
                                          {msg.time}
                                        </p>
                                      </div>
                                      {msg.sent && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-[10px] font-semibold text-white">
                                          You
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  <div ref={replyEndRef} />
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={replyInputs[thread.id] ?? ""}
                                    onChange={(e) =>
                                      setReplyInputs((prev) => ({
                                        ...prev,
                                        [thread.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply(thread.id);
                                      }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-brass"
                                  />
                                  <button
                                    onClick={() => handleSendReply(thread.id)}
                                    disabled={!replyInputs[thread.id]?.trim()}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass text-white transition-colors hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Send size={14} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </motion.div>
          </div>

          <AnimatePresence>
            {selectedId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="lg:sticky lg:top-24 h-[calc(100vh-12rem)] overflow-y-auto"
              >
                <Card padding="lg" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brass/15 text-brass font-semibold text-sm">
                        {chatThreads.find((t) => t.id === selectedId)
                          ?.initials || "?"}
                      </div>
                      <div>
                        <p className="font-display text-xl">
                          {chatThreads.find((t) => t.id === selectedId)?.name ||
                            "Conversation"}
                        </p>
                        <p className="text-sm text-ink/50">Active now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedId(null)}
                        className="p-1 text-ink/40 hover:text-ink"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {(localThreads[selectedId!] ?? []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${
                          msg.sent ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!msg.sent && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass text-[10px] font-semibold">
                            {chatThreads.find((t) => t.id === selectedId)
                              ?.initials || "?"}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            msg.sent ? "bg-brass/10 text-ink" : "bg-ink/5 text-ink"
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className="mt-1 font-mono text-[9px] text-ink/40">
                            {msg.time}
                          </p>
                        </div>
                        {msg.sent && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-[10px] font-semibold text-white">
                            You
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={replyEndRef} />
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-ink/5 pt-4">
                    <input
                      type="text"
                      value={replyInputs[selectedId!] ?? ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [selectedId!]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(selectedId!);
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-brass"
                    />
                    <button
                      onClick={() => handleSendReply(selectedId!)}
                      disabled={!replyInputs[selectedId!]?.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass text-white transition-colors hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating compose button */}
      <button
        onClick={() => setComposeOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brass text-white shadow-lg transition-colors hover:bg-ink lg:hidden"
        aria-label="New message"
      >
        <Plus size={22} />
      </button>

      {/* Create Google Chat Space Modal */}
      {newSpaceOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                New Google Chat Space
              </h3>
              <button
                onClick={() => setNewSpaceOpen(false)}
                className="text-ink/40 hover:text-ink text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink/70">
                Space Name / Topic *
              </label>
              <input
                type="text"
                placeholder="e.g. AI & Tech Founders Circle"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
              <button
                onClick={() => setNewSpaceOpen(false)}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-semibold text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpaceSubmit}
                disabled={creatingSpace || !newSpaceName.trim()}
                className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {creatingSpace ? "Creating..." : "Create Space"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Direct Message Modal */}
      <AnimatePresence>
        {composeOpen && (
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-ink/50 flex items-start justify-center"
            onClick={() => setComposeOpen(false)}
          >
            <motion.div
              variants={modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative mt-20 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            >
              <button
                onClick={() => setComposeOpen(false)}
                className="absolute right-4 top-4 text-ink/40 transition-colors hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <h2 className="font-display text-2xl font-bold">New Message</h2>

              <div className="mt-5 max-h-60 space-y-1 overflow-y-auto">
                {recommendedAlumni.map((alumni) => (
                  <button
                    key={alumni.id}
                    onClick={() =>
                      setSelectedAlumni(
                        selectedAlumni?.id === alumni.id ? null : alumni
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedAlumni?.id === alumni.id
                        ? "bg-brass/10"
                        : "hover:bg-paper/50"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass text-xs font-semibold overflow-hidden">
                      {alumni.avatarUrl ? (
                        <Image
                          src={alumni.avatarUrl}
                          alt={alumni.name}
                          width={36}
                          height={36}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        alumni.initials ||
                        alumni.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{alumni.name}</p>
                      <p className="truncate text-[11px] text-ink/50">
                        {alumni.jobTitle || alumni.role} at{" "}
                        {alumni.currentCompany || alumni.company}
                      </p>
                    </div>
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                        selectedAlumni?.id === alumni.id
                          ? "border-brass bg-brass"
                          : "border-ink/25"
                      }`}
                    >
                      {selectedAlumni?.id === alumni.id && (
                        <div className="flex h-full items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <textarea
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder="Write a message..."
                rows={3}
                className="mt-4 w-full resize-none rounded-lg border border-ink/15 bg-white p-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-brass"
              />

              <button
                onClick={handleComposeSend}
                disabled={!selectedAlumni || !composeMessage.trim()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brass px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                Send
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
