"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Activity,
  BriefcaseBusiness,
  Clock,
  CalendarDays,
  ShieldCheck,
  FileUp,
  Inbox,
  Target,
  CheckCircle2,
  Check,
  Search,
  Plus,
  Trash2,
  Megaphone,
  Download,
  AlertTriangle,
  Server,
  Zap,
  RefreshCw,
  Eye,
  UserCheck,
  Coins,
  Send,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  PlaySquare,
  Pause,
  Play,
  FileText,
  Layout,
  Globe,
  HelpCircle,
  X,
  Layers,
  Video as VideoIcon,
  CreditCard,
  Mail,
  Phone,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { getSocket } from "@/lib/socket";
import { getToken } from "@/lib/auth";
import { Card } from "@/components/ui";


type AdminTab = "mission_control" | "users" | "moderation" | "stale_profiles" | "cms" | "data_tools" | "broadcasts" | "events" | "newsletters" | "analytics";
type CmsSubTab = "broadcasts" | "events" | "newsletters" | "pages";

interface PageBlock {
  id: string;
  type: "hero" | "markdown" | "features" | "image" | "cta" | "faq";
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  ctaText?: string;
  ctaLink?: string;
  features?: Array<{ title: string; desc: string; tag?: string }>;
  faqs?: Array<{ question: string; answer: string }>;
}

interface AdminVideo {
  id: string;
  title: string;
  price: number;
  description?: string;
  url: string;
  uploader?: { name?: string; email?: string };
  status?: string;
}

interface AdminStory {
  id: string;
  title: string;
  story?: string;
  company?: string;
  role?: string;
  alumni?: { name?: string };
  isApproved?: boolean;
}

interface AdminJob {
  id: string;
  title: string;
  company: string;
  status?: string;
  postedBy?: { name?: string };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  isVerified?: boolean;
  isActive?: boolean;
  profileStatus?: string;
  batchYear?: number | string;
  department?: string;
  verificationMethod?: string;
  idCardUrl?: string;
  referredByCode?: string;
  currentCompany?: string;
  jobTitle?: string;
  lastJobUpdate?: string;
  profileCompleteness?: number;
  points?: number;
  totalPoints?: number;
  currentStreak?: number;
}

interface AdminAnnouncement {
  id: string;
  title: string;
  body?: string;
  content?: string;
  pinned?: boolean;
  createdAt?: string;
}

interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  date?: string;
  mode?: string;
  location?: string;
  coverImage?: string;
  maxCapacity?: number;
  _count?: { rsvps?: number };
}

interface LiveActivity {
  id?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  summary?: string;
  message?: string;
  pointsEarned?: number;
  timestamp?: string | number | Date;
}

const RESERVED_SLUGS = new Set([
  "admin", "api", "login", "register", "home", "directory", "jobs", "referrals",
  "stories", "announcements", "chat", "events", "mentorship", "giving", "education",
  "docs", "keep", "communications", "forms", "calendar", "profile", "rewards",
  "settings", "newsletter", "newsletters", "matching", "help", "dashboard", "requests"
]);

export function AdminContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>("mission_control");
  const [cmsSubTab, setCmsSubTab] = useState<CmsSubTab>("broadcasts");
  const [toast, setToast] = useState<string | null>(null);

  // User management state
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState("ALL");
  const [userPage, setUserPage] = useState(1);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<{ id: string; name?: string; email?: string } | null>(null);

  // Moderation state
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [rejectProfileModal, setRejectProfileModal] = useState<{
    userId: string;
    userName: string;
    reason: string;
  } | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("ALL");
  const [broadcastPriority, setBroadcastPriority] = useState("NORMAL");
  const [broadcastPinned, setBroadcastPinned] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    count?: number;
    errors?: string[];
    imported?: number;
    summary?: {
      imported?: number;
      skipped?: number;
      failed?: number;
      total?: number;
    };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Telemetry state
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [isActivityPaused, setIsActivityPaused] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // CMS Events Modal State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    mode: "ONLINE",
    coverImage: "",
    maxCapacity: 100,
  });

  // CMS Newsletter Modal State
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);
  const [editingNewsletterId, setEditingNewsletterId] = useState<string | null>(null);
  const [newsletterForm, setNewsletterForm] = useState({
    title: "",
    year: new Date().getFullYear(),
    issueDate: new Date().toISOString().split("T")[0],
    coverImage: "",
    fileUrl: "",
  });

  // CMS Page Builder State
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    description: "",
    heroTitle: "",
    heroSubtitle: "",
    status: "DRAFT",
    blocks: [] as PageBlock[],
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Socket setup & real-time telemetry
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("authenticate", token);
    socket.emit("admin_join", token);

    const onPresenceSnapshot = (snapshot: (string | { userId: string })[]) => {
      if (Array.isArray(snapshot)) {
        const ids = snapshot.map((item) => (typeof item === "string" ? item : item.userId));
        setOnlineUsers(new Set(ids));
      }
    };

    const onPresenceSync = (userIds: string[]) => {
      if (Array.isArray(userIds)) {
        setOnlineUsers(new Set(userIds));
      }
    };

    const onPresenceUpdate = (data: { userId: string; status: string; name?: string; role?: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.status === "online") next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    };

    const onActivityStream = (activity: Record<string, unknown>) => {
      if (!isActivityPaused) {
        setLiveActivities((prev) => [activity, ...prev].slice(0, 200));
      }
    };

    socket.on("presence_snapshot", onPresenceSnapshot);
    socket.on("presence_sync", onPresenceSync);
    socket.on("presence_update", onPresenceUpdate);
    socket.on("activity_stream", onActivityStream);

    return () => {
      socket.off("presence_snapshot", onPresenceSnapshot);
      socket.off("presence_sync", onPresenceSync);
      socket.off("presence_update", onPresenceUpdate);
      socket.off("activity_stream", onActivityStream);
    };
  }, [isActivityPaused]);

  // Queries
  const { data: statsData, reload: reloadStats } = useApi("admin:stats", () => apiClient.admin.stats());
  const { data: healthDataResult, reload: reloadHealth } = useApi("admin:health", () => apiClient.admin.systemHealth());
  const { data: usersData, reload: reloadUsers } = useApi(
    `admin:users:${roleFilter}:${verifiedFilter}:${userSearch}:${userPage}`,
    () => {
      const params: Record<string, string> = { page: String(userPage), limit: "15" };
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (verifiedFilter === "true") params.verified = "true";
      if (verifiedFilter === "false") params.verified = "false";
      if (userSearch.trim()) params.search = userSearch.trim();
      return apiClient.admin.users(params);
    }
  );
  const { data: storiesData, reload: reloadStories } = useApi("admin:stories", () => apiClient.admin.stories());
  const { data: jobsData, reload: reloadJobs } = useApi("admin:jobs", () => apiClient.admin.jobs());
  const { data: staleData } = useApi("admin:stale", () => apiClient.admin.staleProfiles());
  const { data: announcementsData, reload: reloadAnnouncements } = useApi("admin:announcements", () => apiClient.announcements.list());
  const { data: approvalsData, reload: reloadApprovals } = useApi("admin:approvals", () => apiClient.admin.approvals());
  const { data: videosData, reload: reloadVideos } = useApi("admin:videos", () => apiClient.admin.videos());
  const { data: pagesData, reload: reloadPages } = useApi("admin:pages", () => apiClient.admin.pages.list());
  const { data: eventsData, reload: reloadEvents } = useApi("admin:events", () => apiClient.events.list());
  const { data: newslettersData, reload: reloadNewsletters } = useApi("admin:newsletters", () => apiClient.newsletters.list());

  const stats = (statsData?.stats || {}) as {
    users?: { total?: number };
    events?: { upcoming?: number };
    referrals?: {
      byStatus?: {
        PENDING?: number;
        pending?: number;
        ACCEPTED?: number;
        accepted?: number;
        REFERRED?: number;
        referred?: number;
        HIRED?: number;
        hired?: number;
      };
    };
  };
  const healthData = (healthDataResult || {}) as {
    status?: string;
    latencyMs?: number;
    uptimeSeconds?: number;
    memory?: { rssMb?: number };
    nodeVersion?: string;
  };
  const users = (usersData?.users as unknown as AdminUser[]) || [];
  const totalUserPages = Number(usersData?.pagination?.pages) || 1;
  const pendingStories = ((storiesData?.stories || []) as unknown as AdminStory[]).filter((s) => !s.isApproved);
  const jobs = (jobsData?.jobs as unknown as AdminJob[]) || [];
  const staleUsers = (staleData?.users as unknown as AdminUser[]) || [];
  const announcements = (announcementsData as unknown as AdminAnnouncement[]) || [];
  const approvals = approvalsData || {};
  const customPages = ((pagesData?.pages || []) as Array<{
    id: string;
    title: string;
    slug: string;
    description?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    status?: string;
    blocks?: PageBlock[];
    updatedAt?: string;
  }>);
  const events = (Array.isArray(eventsData) ? eventsData : ((eventsData as unknown) as { events?: unknown[] })?.events || []) as unknown as AdminEvent[];
  const newsletters = Array.isArray(newslettersData) ? newslettersData : (newslettersData as { newsletters?: unknown[] })?.newsletters || [];
  const pendingVideos = (((videosData?.videos || (approvals as { pendingVideos?: AdminVideo[] })?.pendingVideos || []) as unknown as AdminVideo[])).filter((v) => v.status === "PENDING");

  // Unverified & Pending Profiles queue
  const unverifiedAlumni = useMemo(
    () => ((usersData?.users || []) as unknown as AdminUser[]).filter((u) => u.profileStatus === "PENDING" || (!u.isVerified && u.role === "ALUMNI")),
    [usersData?.users]
  );

  // =================== PROFILE APPROVAL & REJECTION (REST API) ===================
  const handleApproveProfile = async (userId: string) => {
    setModeratingId(userId);
    try {
      const res = await apiClient.admin.approveProfile(userId);
      if (res.success) {
        showToast(res.message || "Profile approved!");
      } else {
        showToast("Approval failed");
      }
      reloadUsers();
      reloadApprovals();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve profile";
      showToast(message);
    } finally {
      setModeratingId(null);
    }
  };

  const handleRejectProfile = async (userId: string, reason?: string) => {
    setModeratingId(userId);
    try {
      const res = await apiClient.admin.rejectProfile(userId, reason);
      if (res.success) {
        showToast(res.message || "Profile rejected");
      } else {
        showToast("Rejection failed");
      }
      setRejectProfileModal(null);
      reloadUsers();
      reloadApprovals();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject profile";
      showToast(message);
    } finally {
      setModeratingId(null);
    }
  };

  // =================== VIDEO APPROVAL & REJECTION (REST API) ===================
  const handleApproveVideo = async (videoId: string) => {
    setModeratingId(videoId);
    try {
      const res = await apiClient.admin.approveVideo(videoId);
      if (res.success) {
        showToast(res.message || "Video approved!");
      } else {
        showToast("Failed to approve video");
      }
      reloadVideos();
      reloadApprovals();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve video";
      showToast(message);
    } finally {
      setModeratingId(null);
    }
  };

  const handleRejectVideo = async (videoId: string) => {
    setModeratingId(videoId);
    try {
      const res = await apiClient.admin.rejectVideo(videoId);
      if (res.success) {
        showToast(res.message || "Video rejected");
      } else {
        showToast("Failed to reject video");
      }
      reloadVideos();
      reloadApprovals();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject video";
      showToast(message);
    } finally {
      setModeratingId(null);
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      await apiClient.admin.updateUserRole(id, newRole);
      showToast(`User role updated to ${newRole}`);
      reloadUsers();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change role";
      showToast(message);
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.admin.updateUserStatus(id, !currentStatus);
      showToast(`User account ${!currentStatus ? "activated" : "suspended"}`);
      reloadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      showToast(message);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    try {
      await apiClient.admin.deleteUser(selectedUserForDelete.id);
      showToast("User account deleted");
      setSelectedUserForDelete(null);
      reloadUsers();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      showToast(message);
    }
  };

  // Story Moderation
  const handleModerateStory = async (id: string, isApproved: boolean, isFeatured = false) => {
    setModeratingId(id);
    try {
      await apiClient.admin.updateStoryStatus(id, { isApproved, isFeatured });
      showToast(`Story ${isApproved ? "approved" : "rejected"}`);
      reloadStories();
      reloadStats();
      reloadApprovals();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to moderate story";
      showToast(message);
    } finally {
      setModeratingId(null);
    }
  };

  // Job Moderation
  const handleToggleJobStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await apiClient.admin.updateJobStatus(id, nextStatus);
      showToast(`Job status updated to ${nextStatus}`);
      reloadJobs();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update job status";
      showToast(message);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await apiClient.admin.deleteJob(id);
      showToast("Job posting deleted");
      reloadJobs();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete job";
      showToast(message);
    }
  };

  // Broadcasts
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;
    setSendingBroadcast(true);
    try {
      const res = await apiClient.admin.broadcast({
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        targetRole: broadcastTarget,
        priority: broadcastPriority,
        isPinned: broadcastPinned,
      });
      showToast(`Broadcast published! Notified ${(res as unknown as { notifiedCount?: number })?.notifiedCount || 0} members.`);
      setBroadcastTitle("");
      setBroadcastContent("");
      reloadAnnouncements();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send broadcast";
      showToast(message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Nudge Stale Profile
  const handleNudgeUser = async (id: string, name: string) => {
    try {
      await apiClient.admin.nudgeUser(id);
      showToast(`Re-engagement nudge sent to ${name}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send nudge";
      showToast(message);
    }
  };

  // CSV Import
  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setImportingCsv(true);
    setCsvResult(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await apiClient.admin.importCsv(formData);
      setCsvResult(res as unknown as typeof csvResult);
      showToast(`Imported ${(res as unknown as { summary?: { imported?: number }; importedCount?: number })?.summary?.imported || (res as unknown as { importedCount?: number })?.importedCount || 0} alumni successfully!`);
      setCsvFile(null);
      reloadUsers();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "CSV import failed";
      showToast(message);
    } finally {
      setImportingCsv(false);
    }
  };

  // =================== CMS: EVENT ACTIONS ===================
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        await apiClient.admin.events.update(editingEventId, eventForm);
        showToast("Event updated successfully!");
      } else {
        await apiClient.admin.events.create(eventForm);
        showToast("Event created and published!");
      }
      setEventModalOpen(false);
      setEditingEventId(null);
      reloadEvents();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save event";
      showToast(message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await apiClient.admin.events.delete(id);
      showToast("Event removed");
      reloadEvents();
      reloadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete event";
      showToast(message);
    }
  };

  // =================== CMS: NEWSLETTER ACTIONS ===================
  const handleSaveNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNewsletterId) {
        await apiClient.admin.newsletters.update(editingNewsletterId, newsletterForm);
        showToast("Newsletter edition updated!");
      } else {
        await apiClient.admin.newsletters.create(newsletterForm);
        showToast("Newsletter published!");
      }
      setNewsletterModalOpen(false);
      setEditingNewsletterId(null);
      reloadNewsletters();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save newsletter";
      showToast(message);
    }
  };

  const handleDeleteNewsletter = async (id: string) => {
    try {
      await apiClient.admin.newsletters.delete(id);
      showToast("Newsletter deleted");
      reloadNewsletters();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete newsletter";
      showToast(message);
    }
  };

  // =================== CMS: PAGE BUILDER ACTIONS ===================
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = pageForm.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-");

    if (RESERVED_SLUGS.has(cleanSlug)) {
      showToast(`The slug "/${cleanSlug}" is reserved. Please pick another name.`);
      return;
    }

    try {
      if (editingPageId) {
        await apiClient.admin.pages.update(editingPageId, { ...pageForm, slug: cleanSlug });
        showToast("Custom page updated!");
      } else {
        await apiClient.admin.pages.create({ ...pageForm, slug: cleanSlug });
        showToast("Custom page created!");
      }
      setPageModalOpen(false);
      setEditingPageId(null);
      reloadPages();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save page";
      showToast(message);
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      await apiClient.admin.pages.delete(id);
      showToast("Page deleted");
      reloadPages();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete page";
      showToast(message);
    }
  };

  const addBlockToPage = (type: PageBlock["type"]) => {
    const newBlock: PageBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title: type === "markdown" ? "Section Heading" : type === "features" ? "Platform Capabilities" : type === "faq" ? "Common Questions" : "Call to Action",
      content: type === "markdown" ? "Write markdown or rich text content here..." : "",
      features: type === "features" ? [
        { title: "AI-Powered Matching", desc: "Vector similarity ranking using Gemini embeddings", tag: "AI" },
        { title: "Direct Referrals", desc: "Structured referral lifecycle with status tracking", tag: "Referrals" },
        { title: "Verified Community", desc: "Campus-vetted talent pool and leadership access", tag: "Network" },
      ] : undefined,
      faqs: type === "faq" ? [
        { question: "How does verification work?", answer: "Alumni submit institutional credentials or graduation year, approved by campus admins." }
      ] : undefined,
      ctaText: type === "cta" ? "Explore Community" : undefined,
      ctaLink: type === "cta" ? "/directory" : undefined,
    };

    setPageForm((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  const removeBlockFromPage = (id: string) => {
    setPageForm((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  };

  const updateBlockInPage = (id: string, updates: Partial<PageBlock>) => {
    setPageForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const statCards = [
    { label: "Total Members", value: stats.users?.total || 0, icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { label: "Online Now", value: onlineUsers.size, icon: Activity, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Pending Approvals", value: (pendingStories.length + unverifiedAlumni.length + pendingVideos.length), icon: Clock, color: "text-rose-500 bg-rose-500/10" },
    { label: "Pending Videos", value: pendingVideos.length, icon: VideoIcon, color: "text-purple-500 bg-purple-500/10" },
    { label: "Custom Pages", value: customPages.length, icon: Globe, color: "text-indigo-500 bg-indigo-500/10" },
    { label: "Upcoming Events", value: stats.events?.upcoming || 0, icon: CalendarDays, color: "text-amber-500 bg-amber-500/10" },
  ];

  const funnelBars = [
    { label: "Pending", count: stats.referrals?.byStatus?.PENDING || stats.referrals?.byStatus?.pending || 0, color: "bg-amber-500" },
    { label: "Accepted", count: stats.referrals?.byStatus?.ACCEPTED || stats.referrals?.byStatus?.accepted || 0, color: "bg-blue-500" },
    { label: "Referred", count: stats.referrals?.byStatus?.REFERRED || stats.referrals?.byStatus?.referred || 0, color: "bg-purple-500" },
    { label: "Hired", count: stats.referrals?.byStatus?.HIRED || stats.referrals?.byStatus?.hired || 0, color: "bg-emerald-500" },
  ];
  const maxFunnel = Math.max(1, ...funnelBars.map((b) => b.count));

  const totalPendingModeration = pendingStories.length + unverifiedAlumni.length + pendingVideos.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-bold">
              PRO ALUMN Super Admin
            </p>
          </div>
          <h1 className="mt-1 font-display text-4xl font-bold text-slate-900 dark:text-slate-100">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real-time telemetry, user presence, video market &amp; wallet credit ledger
          </p>
        </div>

        {/* Live Health Indicator Pill & Online Users Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-mono">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{onlineUsers.size} Online</span>
            <span className="text-slate-400">|</span>
            <Server size={13} className={healthData?.status === "HEALTHY" ? "text-emerald-500" : "text-amber-500"} />
            <span>DB: {healthData?.latencyMs ? `${healthData.latencyMs}ms` : "Live"}</span>
          </div>

          <button
            onClick={() => {
              reloadStats();
              reloadHealth();
              reloadUsers();
              reloadApprovals();
              reloadVideos();
              reloadPages();
              showToast("Refreshed platform telemetry & moderation queues");
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh telemetry"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-ink/10 pb-2 scrollbar-none">
        {[
          { id: "mission_control", label: "Mission Control", icon: Activity },
          { id: "users", label: `Users (${stats.users?.total || 0})`, icon: Users },
          {
            id: "moderation",
            label: `Moderation & Approvals (${totalPendingModeration})`,
            icon: ShieldCheck,
            badge: totalPendingModeration > 0,
          },
          { id: "stale_profiles", label: `Stale Profiles (${staleUsers.length})`, icon: Clock },
          { id: "cms", label: `Unified CMS (${customPages.length} Pages)`, icon: Megaphone },
          { id: "data_tools", label: "Data & CSV Import", icon: FileUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: MISSION CONTROL & TELEMETRY ================= */}
      {activeTab === "mission_control" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((card) => (
              <Card key={card.label} padding="md" className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${card.color}`}>
                    <card.icon size={18} />
                  </div>
                </div>
                <p className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</p>
              </Card>
            ))}
          </div>

          {/* Telemetry & Funnel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health Telemetry */}
            <Card padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Server size={18} className="text-blue-500" />
                  Telemetry &amp; DB Health
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">
                  {healthData?.status || "HEALTHY"}
                </span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-ink/5">
                  <span className="text-slate-500">Active Presence</span>
                  <span className="font-mono font-bold text-emerald-600">{onlineUsers.size} Users Online</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-ink/5">
                  <span className="text-slate-500">Query Latency</span>
                  <span className="font-mono font-bold text-emerald-600">{healthData?.latencyMs || 24} ms</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-ink/5">
                  <span className="text-slate-500">Server Uptime</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {healthData?.uptimeSeconds ? `${Math.floor(healthData.uptimeSeconds / 3600)}h ${Math.floor((healthData.uptimeSeconds % 3600) / 60)}m` : "Active"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-ink/5">
                  <span className="text-slate-500">Memory RSS</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{healthData?.memory?.rssMb || 85} MB</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Node Runtime</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{healthData?.nodeVersion || "v20"}</span>
                </div>
              </div>
            </Card>

            {/* Referral Funnel */}
            <Card padding="lg" className="space-y-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Target size={18} className="text-purple-500" />
                Referral Conversion Funnel
              </h3>

              <div className="space-y-3 pt-2">
                {funnelBars.map((bar) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{bar.label}</span>
                      <span className="font-mono font-bold">{bar.count}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-ink/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(bar.count / maxFunnel) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${bar.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions Launchpad */}
            <Card padding="lg" className="space-y-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Super Admin Launchpad
              </h3>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => setActiveTab("moderation")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left cursor-pointer"
                >
                  <ShieldCheck size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Review Moderation Queue</p>
                    <p className="text-[11px] text-slate-500">{totalPendingModeration} pending verification &amp; video items</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("cms");
                    setCmsSubTab("pages");
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all text-left cursor-pointer"
                >
                  <Globe size={16} className="text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Page &amp; Site Builder</p>
                    <p className="text-[11px] text-slate-500">Create new live custom pages with no deploy</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("data_tools")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left cursor-pointer"
                >
                  <FileUp size={16} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Bulk CSV Roster Import</p>
                    <p className="text-[11px] text-slate-500">Upload batch of alumni with instant email invite</p>
                  </div>
                </button>
              </div>
            </Card>
          </div>

          {/* Real-Time Activity Feed with Pause / Resume Toggle */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" />
                <h3 className="font-display text-lg font-bold">Real-Time WebSocket Activity Feed</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  {liveActivities.length} Events
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsActivityPaused((p) => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActivityPaused
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {isActivityPaused ? <Play size={12} /> : <Pause size={12} />}
                  <span>{isActivityPaused ? "Resume Feed" : "Pause Feed"}</span>
                </button>

                <button
                  onClick={() => setLiveActivities([])}
                  className="px-2.5 py-1 rounded-xl border border-ink/10 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  title="Clear Feed"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 max-h-72 overflow-y-auto scrollbar-thin">
              {liveActivities.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs font-medium text-slate-500">Connected to <code className="font-mono text-[11px] text-blue-600">admin_telemetry</code> room.</p>
                  <p className="text-[11px] text-slate-400">Waiting for live user actions (login, profile updates, referrals, points)...</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {liveActivities.map((act, i) => (
                    <motion.div
                      key={act.id || `${act.userId}-${i}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 mt-0.5 shrink-0 font-bold text-xs">
                        <Activity size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {act.userName || "Alumni Member"}
                          </p>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                            {act.userRole || "STUDENT"}
                          </span>
                          {Boolean(act.pointsEarned && act.pointsEarned > 0) && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                              <Coins size={10} /> +{act.pointsEarned} pts
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {act.summary || act.message}
                        </p>
                      </div>
                      <span className="ml-auto text-[10px] text-slate-400 font-mono shrink-0">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now"}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ================= TAB 2: USER GOVERNANCE & ROLES ================= */}
      {activeTab === "users" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-ink/10 bg-white/70 dark:bg-slate-900/70">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name, email, company, or department..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-ink/15 bg-transparent text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-ink/15 bg-transparent text-xs font-semibold outline-none focus:border-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="ALUMNI">Alumni</option>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMIN">Admin</option>
              </select>

              <select
                value={verifiedFilter}
                onChange={(e) => {
                  setVerifiedFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-ink/15 bg-transparent text-xs font-semibold outline-none focus:border-blue-500"
              >
                <option value="ALL">All Verification</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>
          </div>

          {/* User Table with Real-time Presence Dots */}
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                    <th className="py-3 px-4">Member (Presence)</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Company / Dept</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Points &amp; Streak</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No users found matching current filters
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isOnline = onlineUsers.has(u.id);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold text-xs">
                                  {u.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                                </div>
                                <span
                                  className={`absolute -bottom-1 -right-1 block h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                                  }`}
                                  title={isOnline ? "Online now (WebSocket verified)" : "Offline"}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isOnline && (
                                    <span className="text-[10px] text-emerald-600 font-normal font-mono">• Online</span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-ink/15 bg-transparent text-[11px] font-bold outline-none cursor-pointer"
                            >
                              <option value="ALUMNI">ALUMNI</option>
                              <option value="STUDENT">STUDENT</option>
                              <option value="FACULTY">FACULTY</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {u.currentCompany || u.department || "—"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {u.jobTitle || (u.batchYear ? `Batch of ${u.batchYear}` : "")}
                            </p>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                if (!u.isVerified) handleApproveProfile(u.id);
                                else handleRejectProfile(u.id);
                              }}
                              disabled={moderatingId === u.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                                u.isVerified
                                  ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                                  : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25"
                              } disabled:opacity-50`}
                            >
                              {u.isVerified ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                              {u.isVerified ? "Verified (+50 pts)" : "Unverified"}
                            </button>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.isActive ?? true)}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${
                                u.isActive !== false
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-rose-500/10 text-rose-600"
                              }`}
                            >
                              {u.isActive !== false ? "Active" : "Suspended"}
                            </button>
                          </td>

                          <td className="py-3 px-4 font-mono">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{u.totalPoints || 0} pts</span>
                            <span className="text-slate-400 ml-1">🔥 {u.currentStreak || 0}d</span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedUserForDelete(u)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-ink/10 text-xs">
                <span className="text-slate-500">
                  Page {userPage} of {totalUserPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-ink/15 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={userPage >= totalUserPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-ink/15 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ================= TAB 3: CENTRALIZED MODERATION & APPROVALS ================= */}
      {activeTab === "moderation" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Centralized Approvals Queue Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" />
                Centralized Platform Approvals &amp; Credit Ledger
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Atomic transactions with audit-logged point movements for Video Market items, alumni verifications, and spotlight stories.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-ink/10 font-bold text-purple-600">
                {pendingVideos.length} Videos
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-ink/10 font-bold text-emerald-600">
                {unverifiedAlumni.length} Profiles
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-ink/10 font-bold text-blue-600">
                {pendingStories.length} Stories
              </span>
            </div>
          </div>

          {/* Section 1: Video Market Moderation Queue (NEW) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <VideoIcon size={20} className="text-purple-600" />
                Video Marketplace Moderation Queue ({pendingVideos.length} pending)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Auto-publishes to video catalog upon approval</span>
            </div>

            {pendingVideos.length === 0 ? (
              <Card padding="md" className="text-center py-8 text-slate-400 text-xs">
                No videos pending moderation. All uploaded course &amp; lecture content is live.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingVideos.map((v) => (
                  <Card key={v.id} padding="md" className="space-y-3 border-purple-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{v.title}</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-[10px] font-mono font-bold">
                            {v.price > 0 ? `${v.price} pts` : "Free"}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Uploaded by {v.uploader?.name || "Member"} ({v.uploader?.email})
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600">
                        Pending Review
                      </span>
                    </div>

                    {v.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {v.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <PlaySquare size={13} />
                        <span>Preview Video</span>
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectVideo(v.id)}
                          disabled={moderatingId === v.id}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                        >
                          {moderatingId === v.id ? "Processing..." : "Reject"}
                        </button>
                        <button
                          onClick={() => handleApproveVideo(v.id)}
                          disabled={moderatingId === v.id}
                          className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {moderatingId === v.id ? "Approving..." : "Approve & Publish"}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Alumni Verification Queue (Server Action Driven) */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <UserCheck size={20} className="text-emerald-500" />
              Alumni Credential Verification Queue ({unverifiedAlumni.length} pending)
            </h3>

            {unverifiedAlumni.length === 0 ? (
              <Card padding="md" className="text-center py-8 text-slate-400 text-xs">
                All registered alumni profiles have been verified!
              </Card>
            ) : (
              <Card padding="none" className="overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Graduation &amp; Dept</th>
                      <th className="py-3 px-4">Verification Evidence</th>
                      <th className="py-3 px-4">Current Company &amp; Role</th>
                      <th className="py-3 px-4 text-right">Ledger Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {unverifiedAlumni.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                          {u.referredByCode && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold">
                              🎁 Ref: {u.referredByCode} (+100 pts)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold">Batch of {u.batchYear || "—"}</span>
                          <span className="text-slate-400 ml-1">({u.department || "—"})</span>
                        </td>
                        <td className="py-3 px-4">
                          {u.verificationMethod === "paid" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              <CreditCard size={12} />
                              <span>Paid (₹29 Fee)</span>
                            </span>
                          )}
                          {u.verificationMethod === "college_email" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                              <Mail size={12} />
                              <span>College Email Verified</span>
                            </span>
                          )}
                          {u.verificationMethod === "id_upload" && (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                                <FileText size={12} />
                                <span>ID Uploaded</span>
                              </span>
                              {u.idCardUrl && (
                                <a
                                  href={u.idCardUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline font-bold"
                                >
                                  View Doc
                                </a>
                              )}
                            </div>
                          )}
                          {u.verificationMethod === "otp" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                              <Phone size={12} />
                              <span>OTP Verified</span>
                            </span>
                          )}
                          {!u.verificationMethod && (
                            <span className="text-slate-400 font-mono text-[11px]">Pending Submission</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{u.currentCompany || "—"}</p>
                          <p className="text-[10px] text-slate-400">{u.jobTitle || "—"}</p>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              setRejectProfileModal({
                                userId: u.id,
                                userName: u.name,
                                reason: "Credentials could not be verified with institutional records. Please verify graduation batch year and department.",
                              })
                            }
                            disabled={moderatingId === u.id}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveProfile(u.id)}
                            disabled={moderatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Check size={12} />
                            {moderatingId === u.id ? "Crediting..." : "Approve (+50 pts)"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          {/* Section 3: Pending Success Stories */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <Megaphone size={20} className="text-rose-500" />
              Success Stories Queue ({pendingStories.length} pending)
            </h3>

            {pendingStories.length === 0 ? (
              <Card padding="md" className="text-center py-8 text-slate-400 text-xs">
                No success stories pending moderation. All published stories are active.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingStories.map((s) => (
                  <Card key={s.id} padding="md" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.title}</h4>
                        <p className="text-xs text-slate-500">By {s.alumni?.name} ({s.company} • {s.role})</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600">
                        Pending
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {s.story}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/5">
                      <button
                        onClick={() => handleModerateStory(s.id, false)}
                        disabled={moderatingId === s.id}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleModerateStory(s.id, true)}
                        disabled={moderatingId === s.id}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        Approve Story
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Job Postings Moderation */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <BriefcaseBusiness size={20} className="text-blue-500" />
              Job Board Moderation ({jobs.length} total)
            </h3>

            <Card padding="none" className="overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                    <th className="py-3 px-4">Job Title</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Posted By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{j.title}</td>
                      <td className="py-3 px-4">{j.company}</td>
                      <td className="py-3 px-4 text-slate-500">{j.postedBy?.name || "Alumni"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          j.status === "OPEN" ? "bg-emerald-500/15 text-emerald-600" : "bg-slate-500/15 text-slate-600"
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleJobStatus(j.id, j.status || "OPEN")}
                          className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          {j.status === "OPEN" ? "Close" : "Reopen"}
                        </button>
                        <button
                          onClick={() => handleDeleteJob(j.id)}
                          className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ================= TAB 4: STALE PROFILES & HEALTH ================= */}
      {activeTab === "stale_profiles" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-blue-500" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Intelligent Profile Freshness Detector
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Identifies alumni who haven&apos;t confirmed their career status in &gt; 6 months. Send a 1-click nudge to encourage updating.
                </p>
              </div>
            </div>
          </div>

          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                  <th className="py-3 px-4">Alumnus</th>
                  <th className="py-3 px-4">Current Role / Company</th>
                  <th className="py-3 px-4">Last Verified</th>
                  <th className="py-3 px-4">Completeness</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {staleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      All alumni profiles are fresh and active!
                    </td>
                  </tr>
                ) : (
                  staleUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{u.currentCompany || "No company set"}</p>
                        <p className="text-[10px] text-slate-400">{u.jobTitle || "—"}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-amber-600">
                        {u.lastJobUpdate ? new Date(u.lastJobUpdate).toLocaleDateString() : "Never updated"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {u.profileCompleteness || 50}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleNudgeUser(u.id, u.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Send size={12} />
                          Send Nudge (+30 pts)
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </motion.div>
      )}

      {/* ================= TAB 5: UNIFIED CMS & PAGE BUILDER ================= */}
      {activeTab === "cms" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* CMS Sub-Tabs Navigation */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 w-fit">
            {[
              { id: "broadcasts", label: "Broadcasts & Alerts", icon: Megaphone },
              { id: "events", label: `Events Manager (${events.length})`, icon: CalendarDays },
              { id: "newsletters", label: `Newsletters (${newsletters.length})`, icon: Inbox },
              { id: "pages", label: `Page Builder (${customPages.length} Custom Pages)`, icon: Globe },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setCmsSubTab(sub.id as CmsSubTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  cmsSubTab === sub.id
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <sub.icon size={14} />
                <span>{sub.label}</span>
              </button>
            ))}
          </div>

          {/* SUB-SECTION 1: BROADCASTS */}
          {cmsSubTab === "broadcasts" && (
            <div className="space-y-6">
              <Card padding="lg">
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <Megaphone size={20} className="text-blue-500" />
                  Publish Official Broadcast
                </h3>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Broadcast Title
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Annual Alumni Meet 2026 Registration Open"
                      className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-transparent text-sm outline-none focus:border-blue-500 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Announcement Message
                    </label>
                    <textarea
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      rows={4}
                      placeholder="Write the broadcast message that will appear in all user notification bells..."
                      className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-transparent text-sm outline-none focus:border-blue-500 leading-relaxed"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Target Audience
                      </label>
                      <select
                        value={broadcastTarget}
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent text-xs font-bold"
                      >
                        <option value="ALL">All Network Members</option>
                        <option value="ALUMNI">Alumni Only</option>
                        <option value="STUDENT">Students Only</option>
                        <option value="FACULTY">Faculty Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Priority Level
                      </label>
                      <select
                        value={broadcastPriority}
                        onChange={(e) => setBroadcastPriority(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent text-xs font-bold"
                      >
                        <option value="NORMAL">Normal Priority</option>
                        <option value="URGENT">Urgent (High Alert)</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={broadcastPinned}
                          onChange={(e) => setBroadcastPinned(e.target.checked)}
                          className="h-4 w-4 rounded border-ink/20 text-blue-600"
                        />
                        Pin to top of feed
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingBroadcast}
                    className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={14} />
                    {sendingBroadcast ? "Dispatching..." : "Dispatch Broadcast"}
                  </button>
                </form>
              </Card>

              {/* Existing Announcements Feed */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Megaphone size={16} className="text-blue-500" />
                  Existing Broadcast Feed ({announcements.length})
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {announcements.map((a) => (
                    <Card key={a.id} padding="md" className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">{a.title}</h5>
                          {a.pinned && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{a.body || a.content}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                      </span>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION 2: EVENTS MANAGER */}
          {cmsSubTab === "events" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold">Alumni Events &amp; Webinars</h3>
                  <p className="text-xs text-slate-500">Create and oversee campus reunions, workshops, and RSVP capacities.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingEventId(null);
                    setEventForm({
                      title: "",
                      description: "",
                      date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
                      location: "",
                      mode: "ONLINE",
                      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
                      maxCapacity: 100,
                    });
                    setEventModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create New Event</span>
                </button>
              </div>

              <Card padding="none" className="overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Mode / Location</th>
                      <th className="py-3 px-4">Capacity / RSVPs</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No events found. Click &quot;Create New Event&quot; to publish one.
                        </td>
                      </tr>
                    ) : (
                      events.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{ev.title}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">{ev.description}</p>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {ev.date ? new Date(ev.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ev.mode === "ONLINE" ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"
                            }`}>
                              {ev.mode}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{ev.location || "Online Link"}</p>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {ev._count?.rsvps || 0} / {ev.maxCapacity || "∞"} RSVPs
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingEventId(ev.id);
                                setEventForm({
                                  title: ev.title || "",
                                  description: ev.description || "",
                                  date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : "",
                                  location: ev.location || "",
                                  mode: ev.mode || "ONLINE",
                                  coverImage: ev.coverImage || "",
                                  maxCapacity: ev.maxCapacity || 100,
                                });
                                setEventModalOpen(true);
                              }}
                              className="text-blue-600 hover:underline font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-rose-600 hover:underline font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* SUB-SECTION 3: NEWSLETTERS */}
          {cmsSubTab === "newsletters" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold">Newsletter Edition Publisher</h3>
                  <p className="text-xs text-slate-500">Upload and catalog official quarterly PDF newsletter magazines.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingNewsletterId(null);
                    setNewsletterForm({
                      title: "Somaiya Sparsh - Edition 2026",
                      year: new Date().getFullYear(),
                      issueDate: new Date().toISOString().split("T")[0],
                      coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
                      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    });
                    setNewsletterModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Publish Newsletter</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsletters.map((nl) => (
                  <Card key={nl.id} padding="md" className="space-y-3">
                    <div className="h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                      <Image
                        src={nl.coverImage}
                        alt={nl.title}
                        width={600}
                        height={300}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                        {nl.year}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{nl.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {nl.issueDate ? new Date(nl.issueDate).toLocaleDateString([], { month: "long", year: "numeric" }) : ""}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-ink/5 text-xs">
                      <a href={nl.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                        <span>View PDF</span>
                        <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => handleDeleteNewsletter(nl.id)}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* SUB-SECTION 4: CUSTOM PAGE BUILDER */}
          {cmsSubTab === "pages" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <div>
                  <h3 className="font-display text-lg font-bold flex items-center gap-2">
                    <Globe size={18} className="text-purple-600" />
                    No-Deploy Custom Page &amp; Site Builder
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Create standalone landing pages, partnership portals, or custom static routes live on the platform without deploying code.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingPageId(null);
                    setPageForm({
                      title: "Industry Partnerships",
                      slug: "partnerships",
                      description: "Discover our hiring and research collaboration opportunities for partner organizations.",
                      heroTitle: "Accelerate With Alumni Talent",
                      heroSubtitle: "Connect directly with 1,200+ vetted engineers, product managers, and faculty leaders.",
                      status: "DRAFT",
                      blocks: [
                        {
                          id: "b1",
                          type: "features",
                          title: "Why Partner With Us",
                          subtitle: "Direct talent pipeline and sponsored campus sprints",
                          features: [
                            { title: "Direct Referral Pipeline", desc: "Access top candidates with vector verified skill portfolios", tag: "Hiring" },
                            { title: "Campus Hackathons", desc: "Co-sponsor campus build sprints with student teams", tag: "Events" },
                            { title: "Executive Mentorship", desc: "1:1 coaching loops with senior engineers and leads", tag: "Mentorship" },
                          ],
                        },
                        {
                          id: "b2",
                          type: "cta",
                          title: "Become an Official Network Partner",
                          subtitle: "Reach out to campus placement coordinators today to schedule your corporate spotlight.",
                          ctaText: "Contact Admin Office",
                          ctaLink: "/help",
                        },
                      ],
                    });
                    setPageModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                  <span>Build New Page</span>
                </button>
              </div>

              {/* Custom Pages Table */}
              <Card padding="none" className="overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                      <th className="py-3 px-4">Page Title &amp; Slug</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Content Blocks</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {customPages.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                          <Globe size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
                          <p className="font-bold">No custom pages created yet.</p>
                          <p className="text-[11px]">Click &quot;Build New Page&quot; to generate your first live page!</p>
                        </td>
                      </tr>
                    ) : (
                      customPages.map((pg) => (
                        <tr key={pg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{pg.title}</p>
                              <a
                                href={`/${pg.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-mono text-[11px]"
                              >
                                <span>/{pg.slug}</span>
                                <ExternalLink size={11} />
                              </a>
                            </div>
                            {pg.description && (
                              <p className="text-[11px] text-slate-500 truncate max-w-sm">{pg.description}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              pg.status === "PUBLISHED"
                                ? "bg-emerald-500/15 text-emerald-600"
                                : pg.status === "DRAFT"
                                ? "bg-amber-500/15 text-amber-600"
                                : "bg-slate-500/15 text-slate-600"
                            }`}>
                              {pg.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {Array.isArray(pg.blocks) ? pg.blocks.length : 0} Blocks
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {pg.updatedAt ? new Date(pg.updatedAt).toLocaleDateString() : "Recently"}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <Link
                              href={`/${pg.slug}`}
                              target="_blank"
                              className="text-xs text-slate-600 dark:text-slate-400 hover:underline font-bold"
                            >
                              Preview
                            </Link>
                            <button
                              onClick={() => {
                                setEditingPageId(pg.id);
                                setPageForm({
                                  title: pg.title || "",
                                  slug: pg.slug || "",
                                  description: pg.description || "",
                                  heroTitle: pg.heroTitle || "",
                                  heroSubtitle: pg.heroSubtitle || "",
                                  status: pg.status || "DRAFT",
                                  blocks: Array.isArray(pg.blocks) ? pg.blocks : [],
                                });
                                setPageModalOpen(true);
                              }}
                              className="text-xs text-blue-600 hover:underline font-bold"
                            >
                              Edit Blocks
                            </button>
                            <button
                              onClick={() => handleDeletePage(pg.id)}
                              className="text-xs text-rose-600 hover:underline font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </motion.div>
      )}

      {/* ================= TAB 6: DATA TOOLS & CSV ================= */}
      {activeTab === "data_tools" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bulk CSV Import */}
            <Card padding="lg" className="space-y-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <FileUp size={20} className="text-blue-500" />
                Bulk Alumni CSV Import
              </h3>
              <p className="text-xs text-slate-500">
                Upload a CSV file containing alumni records. Unique temporary passwords and welcome emails will be dispatched automatically.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-ink/20 hover:border-blue-500 rounded-2xl text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30"
              >
                <FileUp size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {csvFile ? csvFile.name : "Click to select or drop CSV file"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Required columns: name, email, batchYear, department</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCsvFile(e.target.files[0]);
                  }}
                />
              </div>

              {csvFile && (
                <button
                  onClick={handleCsvUpload}
                  disabled={importingCsv}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {importingCsv ? "Processing & Importing..." : `Import ${csvFile.name}`}
                </button>
              )}

              {csvResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">Import Summary:</p>
                  <p>✓ Imported: {csvResult.summary?.imported || 0}</p>
                  <p>⚠ Skipped (duplicates): {csvResult.summary?.skipped || 0}</p>
                  <p>✗ Failed: {csvResult.summary?.failed || 0}</p>
                </div>
              )}
            </Card>

            {/* Platform Data Export */}
            <Card padding="lg" className="space-y-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Download size={20} className="text-emerald-500" />
                Platform Data Export
              </h3>
              <p className="text-xs text-slate-500">
                Download structured data exports in CSV format for institutional accreditation and reporting.
              </p>

              <div className="space-y-3 pt-2">
                <a
                  href="/api/admin/export/users"
                  download
                  className="flex items-center justify-between p-3.5 rounded-xl border border-ink/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-xs font-bold"
                >
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-emerald-500" />
                    <span>Export All Registered Members (CSV)</span>
                  </div>
                  <Download size={14} className="text-slate-400" />
                </a>

                <a
                  href="/api/admin/export/jobs"
                  download
                  className="flex items-center justify-between p-3.5 rounded-xl border border-ink/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-xs font-bold"
                >
                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness size={16} className="text-blue-500" />
                    <span>Export Job Board Listings (CSV)</span>
                  </div>
                  <Download size={14} className="text-slate-400" />
                </a>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ================= MODAL: EVENT CREATOR / EDITOR ================= */}
      <AnimatePresence>
        {eventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarDays size={18} className="text-blue-600" />
                  <span>{editingEventId ? "Edit Alumni Event" : "Create New Event"}</span>
                </h3>
                <button onClick={() => setEventModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-medium"
                    placeholder="e.g. AI In Healthcare Alumni Panel"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent"
                    placeholder="Provide event details, keynote speakers, and agenda..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Event Mode</label>
                    <select
                      value={eventForm.mode}
                      onChange={(e) => setEventForm({ ...eventForm, mode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-bold"
                    >
                      <option value="ONLINE">ONLINE (Webinar/Meet)</option>
                      <option value="OFFLINE">OFFLINE (Campus/Venue)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Location or Meeting Link</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent"
                      placeholder="e.g. Google Meet URL or Auditorium 1"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Max Capacity</label>
                    <input
                      type="number"
                      value={eventForm.maxCapacity}
                      onChange={(e) => setEventForm({ ...eventForm, maxCapacity: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={eventForm.coverImage}
                    onChange={(e) => setEventForm({ ...eventForm, coverImage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-mono text-[11px]"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => setEventModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-ink/15 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                  >
                    {editingEventId ? "Save Changes" : "Publish Event"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: NEWSLETTER PUBLISHER ================= */}
      <AnimatePresence>
        {newsletterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Inbox size={18} className="text-purple-600" />
                  <span>{editingNewsletterId ? "Edit Newsletter Edition" : "Publish Newsletter Edition"}</span>
                </h3>
                <button onClick={() => setNewsletterModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveNewsletter} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Edition Title *</label>
                  <input
                    type="text"
                    required
                    value={newsletterForm.title}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-medium"
                    placeholder="e.g. Somaiya Sparsh - Spring 2026 Edition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Year *</label>
                    <input
                      type="number"
                      required
                      value={newsletterForm.year}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, year: parseInt(e.target.value) || 2026 })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={newsletterForm.issueDate}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, issueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">PDF File URL *</label>
                  <input
                    type="url"
                    required
                    value={newsletterForm.fileUrl}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, fileUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-mono text-[11px]"
                    placeholder="https://.../magazine.pdf"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={newsletterForm.coverImage}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, coverImage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-mono text-[11px]"
                    placeholder="https://.../cover.jpg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => setNewsletterModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-ink/15 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20"
                  >
                    Publish Edition
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: VISUAL PAGE BUILDER ================= */}
      <AnimatePresence>
        {pageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Globe size={20} className="text-purple-600" />
                    <span>{editingPageId ? "Edit Custom Page" : "Visual Page & Site Builder"}</span>
                  </h3>
                  <p className="text-xs text-slate-500">Configure page meta, hero banners, and structured content blocks.</p>
                </div>
                <button onClick={() => setPageModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePage} className="space-y-6 text-xs">
                {/* Page Meta Settings */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-500" />
                    Page Meta Settings
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Page Title *</label>
                      <input
                        type="text"
                        required
                        value={pageForm.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setPageForm((prev) => ({
                            ...prev,
                            title,
                            slug: prev.slug || title.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-bold text-sm"
                        placeholder="e.g. Industry Innovation Hub"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        URL Slug (Live Path) *
                      </label>
                      <div className="flex items-center">
                        <span className="px-2.5 py-2 rounded-l-xl bg-slate-200 dark:bg-slate-800 font-mono text-xs font-bold text-slate-500">
                          /
                        </span>
                        <input
                          type="text"
                          required
                          value={pageForm.slug}
                          onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-") })}
                          className={`w-full px-3 py-2 rounded-r-xl border border-ink/15 bg-transparent font-mono text-xs font-bold ${
                            RESERVED_SLUGS.has(pageForm.slug) ? "border-rose-500 text-rose-600" : ""
                          }`}
                          placeholder="innovation-hub"
                        />
                      </div>
                      {RESERVED_SLUGS.has(pageForm.slug) && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1">
                          ⚠ &quot;{pageForm.slug}&quot; is a reserved system path. Pick another slug.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Meta Description (SEO &amp; Cards)</label>
                    <input
                      type="text"
                      value={pageForm.description}
                      onChange={(e) => setPageForm({ ...pageForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent text-xs"
                      placeholder="Brief summary of this page for directory and search preview..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Hero Main Heading</label>
                      <input
                        type="text"
                        value={pageForm.heroTitle}
                        onChange={(e) => setPageForm({ ...pageForm, heroTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-medium"
                        placeholder="Hero Title (defaults to Page Title if empty)"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Publication Status</label>
                      <select
                        value={pageForm.status}
                        onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent font-bold"
                      >
                        <option value="DRAFT">DRAFT (Admin Preview Only)</option>
                        <option value="PUBLISHED">PUBLISHED (Live to Public)</option>
                        <option value="ARCHIVED">ARCHIVED (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Hero Subtitle</label>
                    <textarea
                      rows={2}
                      value={pageForm.heroSubtitle}
                      onChange={(e) => setPageForm({ ...pageForm, heroSubtitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-transparent"
                      placeholder="Supporting text under the main hero title..."
                    />
                  </div>
                </div>

                {/* Structured Content Blocks Builder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Layout size={14} className="text-purple-500" />
                        Content Blocks ({pageForm.blocks.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">Add rich text, 3-card feature grids, call to actions, or FAQ accordions.</p>
                    </div>

                    {/* Add Block Dropdown */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => addBlockToPage("markdown")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-ink/15 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                      >
                        <FileText size={12} /> + Text
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockToPage("features")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-ink/15 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                      >
                        <Zap size={12} /> + Features
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockToPage("cta")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-ink/15 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                      >
                        <Send size={12} /> + CTA Banner
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockToPage("faq")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-ink/15 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                      >
                        <HelpCircle size={12} /> + FAQ
                      </button>
                    </div>
                  </div>

                  {pageForm.blocks.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-ink/15 rounded-2xl text-center text-slate-400 text-xs">
                      No content blocks yet. Click any button above (+ Text, + Features, + CTA, + FAQ) to add structured blocks.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pageForm.blocks.map((block, idx) => (
                        <div
                          key={block.id || idx}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                            <span className="font-mono text-xs font-bold text-purple-600 uppercase flex items-center gap-1.5">
                              <span>Block {idx + 1}:</span>
                              <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-sans text-[11px]">
                                {block.type.toUpperCase()}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeBlockFromPage(block.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Remove Block"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Block: Markdown / Rich Text */}
                          {block.type === "markdown" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.title || ""}
                                onChange={(e) => updateBlockInPage(block.id, { title: e.target.value })}
                                placeholder="Section Heading (optional)"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent font-bold text-xs"
                              />
                              <textarea
                                rows={4}
                                value={block.content || ""}
                                onChange={(e) => updateBlockInPage(block.id, { content: e.target.value })}
                                placeholder="Markdown or HTML content..."
                                className="w-full px-3 py-2 rounded-lg border border-ink/15 bg-transparent font-mono text-xs leading-relaxed"
                              />
                            </div>
                          )}

                          {/* Block: Features Grid */}
                          {block.type === "features" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.title || ""}
                                onChange={(e) => updateBlockInPage(block.id, { title: e.target.value })}
                                placeholder="Features Section Title"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent font-bold text-xs"
                              />
                              <input
                                type="text"
                                value={block.subtitle || ""}
                                onChange={(e) => updateBlockInPage(block.id, { subtitle: e.target.value })}
                                placeholder="Features Subtitle"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent text-xs"
                              />
                            </div>
                          )}

                          {/* Block: CTA Banner */}
                          {block.type === "cta" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={block.title || ""}
                                onChange={(e) => updateBlockInPage(block.id, { title: e.target.value })}
                                placeholder="Banner Headline"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent font-bold text-xs"
                              />
                              <input
                                type="text"
                                value={block.subtitle || ""}
                                onChange={(e) => updateBlockInPage(block.id, { subtitle: e.target.value })}
                                placeholder="Banner Subtext"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent text-xs"
                              />
                              <input
                                type="text"
                                value={block.ctaText || ""}
                                onChange={(e) => updateBlockInPage(block.id, { ctaText: e.target.value })}
                                placeholder="Button Label (e.g. Join Directory)"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent font-bold text-xs"
                              />
                              <input
                                type="text"
                                value={block.ctaLink || ""}
                                onChange={(e) => updateBlockInPage(block.id, { ctaLink: e.target.value })}
                                placeholder="Button Link (e.g. /register)"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent font-mono text-xs"
                              />
                            </div>
                          )}

                          {/* Block: FAQ Accordion */}
                          {block.type === "faq" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.title || ""}
                                onChange={(e) => updateBlockInPage(block.id, { title: e.target.value })}
                                placeholder="FAQ Section Heading"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent font-bold text-xs"
                              />
                              <input
                                type="text"
                                value={block.subtitle || ""}
                                onChange={(e) => updateBlockInPage(block.id, { subtitle: e.target.value })}
                                placeholder="FAQ Subtitle"
                                className="w-full px-3 py-1.5 rounded-lg border border-ink/15 bg-transparent text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-ink/10">
                  {pageForm.slug && (
                    <a
                      href={`/${pageForm.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye size={14} /> Preview Live Route (/{pageForm.slug})
                    </a>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setPageModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-ink/15 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={RESERVED_SLUGS.has(pageForm.slug)}
                      className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {editingPageId ? "Save Page" : "Create & Save Page"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Profile Reason Modal */}
      <AnimatePresence>
        {rejectProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle size={24} />
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    Reject Profile Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide clear feedback to {rejectProfileModal.userName} so they can fix their details.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quick Preset Reasons:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Graduation batch year mismatch with college registry.",
                      "Please upload a clearer institutional student / alumni ID card.",
                      "Company email or designation could not be authenticated.",
                      "Department / Branch details are incomplete or ambiguous.",
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setRejectProfileModal((prev) => (prev ? { ...prev, reason: preset } : null))
                        }
                        className="px-2.5 py-1 rounded-lg border border-ink/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        {preset.slice(0, 32)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Rejection Feedback (Sent to Member):
                  </label>
                  <textarea
                    rows={3}
                    value={rejectProfileModal.reason}
                    onChange={(e) =>
                      setRejectProfileModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                    }
                    placeholder="Enter specific instructions or discrepancies for the user to resolve..."
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/15 bg-transparent text-xs leading-relaxed outline-none focus:border-rose-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px]">
                  💡 The member will receive this feedback on their next login and can resubmit corrections without being charged again.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectProfileModal(null)}
                  className="px-4 py-2 rounded-xl border border-ink/15 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={moderatingId === rejectProfileModal.userId}
                  onClick={() => handleRejectProfile(rejectProfileModal.userId, rejectProfileModal.reason)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {moderatingId === rejectProfileModal.userId ? "Submitting..." : "Confirm Rejection"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {selectedUserForDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <ShieldAlert size={24} />
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Delete User Account
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete the account of{" "}
                <strong className="text-slate-900 dark:text-slate-100">{selectedUserForDelete.name}</strong> ({selectedUserForDelete.email})? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedUserForDelete(null)}
                  className="px-4 py-2 rounded-xl border border-ink/15 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}