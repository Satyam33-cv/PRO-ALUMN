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
        /* Split-Pane UI for Active Mentorships & Direct Messages */
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden h-[calc(100vh-14rem)]">
          
          {/* LEFT SIDEBAR: Threads List */}
          <div className="lg:col-span-4 lg:col-span-3 border-r border-ink/10 flex flex-col h-full bg-paper/20">
            <div className="p-4 border-b border-ink/10 bg-white/50 backdrop-blur-sm">
              <h2 className="font-display font-bold text-lg">Conversations</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto" ref={listRef}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-60">
                  <MessageCircle size={28} className="mb-3" />
                  <p className="text-sm font-semibold">No active chats</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filtered.map((thread) => {
                    const isSelected = selectedId === thread.id;
                    const role = thread.role || "student";
                    const roleInfo = roleBadges[role as keyof typeof roleBadges] || roleBadges.student;
                    
                    return (
                      <button
                        key={thread.id}
                        onClick={() => setSelectedId(thread.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isSelected ? "bg-brass text-white shadow-md" : "hover:bg-ink/5"
                        }`}
                      >
                        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${isSelected ? 'bg-white/20' : 'bg-brass/15 text-brass'}`}>
                          {thread.initials}
                          {thread.unread > 0 && (
                            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className={`font-semibold text-sm truncate ${isSelected ? 'text-white' : 'text-ink'}`}>
                              {thread.name}
                            </span>
                            <span className={`text-[9px] font-mono shrink-0 ${isSelected ? 'text-white/70' : 'text-ink/40'}`}>
                              {thread.time}
                            </span>
                          </div>
                          <span className={`text-xs truncate block ${isSelected ? 'text-white/80' : 'text-ink/60'}`}>
                            {thread.lastMessage}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Chat View */}
          <div className="lg:col-span-8 lg:col-span-9 flex flex-col h-full bg-white relative">
            {selectedId ? (
              <>
                {/* Rich Context Header */}
                <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between bg-white shadow-sm z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brass/15 text-brass font-bold text-lg">
                      {chatThreads.find((t) => t.id === selectedId)?.initials || "?"}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-ink">
                        {chatThreads.find((t) => t.id === selectedId)?.name || "Conversation"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                        </span>
                        <a href={`/profile/${selectedId}`} className="text-xs text-blue-600 hover:underline font-semibold">
                          View Profile & Videos
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Escrow Release Action */}
                  <div className="hidden sm:flex items-center gap-4 text-right">
                    <button 
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 border border-emerald-400/50 shadow-emerald-500/20"
                      onClick={() => alert("Mentorship completed! 50 Credits released from escrow.")}
                    >
                      <ShieldCheck size={16} /> End & Release Credits
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/chat-pattern.png')] bg-fixed bg-opacity-5">
                  {(localThreads[selectedId] ?? []).map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sent ? "flex-row-reverse" : "flex-row"}`}>
                      {!msg.sent && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass text-xs font-bold shadow-sm mt-1">
                          {chatThreads.find((t) => t.id === selectedId)?.initials || "?"}
                        </div>
                      )}
                      <div className={`max-w-[70%] group`}>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                          msg.sent 
                            ? "bg-brass text-white rounded-tr-sm" 
                            : "bg-paper border border-ink/5 text-ink rounded-tl-sm"
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[10px] font-mono text-ink/30 mt-1 block px-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sent ? "text-right" : "text-left"}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={replyEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-ink/10 bg-white">
                  <div className="flex items-end gap-3 bg-paper/50 border border-ink/10 rounded-2xl p-2 focus-within:border-brass focus-within:ring-1 focus-within:ring-brass transition-all">
                    <button className="p-2 text-ink/40 hover:text-brass transition-colors rounded-full hover:bg-white">
                      <Plus size={20} />
                    </button>
                    <textarea
                      rows={1}
                      value={replyInputs[selectedId] ?? ""}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [selectedId]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(selectedId);
                        }
                      }}
                      placeholder={`Message ${chatThreads.find((t) => t.id === selectedId)?.name || 'them'}...`}
                      className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 resize-none py-2 text-sm outline-none placeholder:text-ink/40"
                    />
                    <button
                      onClick={() => handleSendReply(selectedId)}
                      disabled={!replyInputs[selectedId]?.trim()}
                      className="p-2.5 bg-brass text-white rounded-xl hover:bg-ink transition-colors disabled:opacity-30 mb-0.5 shadow-sm"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-ink/20" />
                </div>
                <h3 className="font-display text-2xl font-bold text-ink">Select a Conversation</h3>
                <p className="text-sm text-ink/50 max-w-sm mt-2">
                  Choose a direct message or active mentorship from the sidebar to start collaborating.
                </p>
              </div>
            )}
          </div>
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
