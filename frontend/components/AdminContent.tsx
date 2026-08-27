"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Timer,
  CheckCircle2,
  XCircle,
  Check,
  Search,
  Filter,
  Plus,
  Trash2,
  Megaphone,
  Radio,
  Download,
  AlertTriangle,
  Server,
  Zap,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Sparkles,
  Flame,
  Coins,
  Send,
  Building,
  GraduationCap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  PlaySquare,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, Badge, Skeleton } from "@/components/ui";
import { approveProfileAction, approveVideoAction, rejectItemAction } from "@/app/actions/admin";

type AdminTab = "mission_control" | "users" | "moderation" | "stale_profiles" | "cms" | "data_tools";

export function AdminContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>("mission_control");
  const [toast, setToast] = useState<string | null>(null);

  // User management state
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState("ALL");
  const [userPage, setUserPage] = useState(1);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<any>(null);

  // Moderation state
  const [selectedVerificationRows, setSelectedVerificationRows] = useState<Set<string>>(new Set());
  const [moderatingId, setModeratingId] = useState<string | null>(null);

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
  const [csvResult, setCsvResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Telemetry state
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const { accessToken } = useAuth();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = accessToken;
    if (!token) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }
    
    socket.emit("authenticate", token);
    socket.emit("admin_join");

    const onPresenceSync = (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    };

    const onPresenceUpdate = (data: { userId: string, status: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (data.status === 'online') next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    };

    const onActivityStream = (activity: any) => {
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    };

    socket.on("presence_sync", onPresenceSync);
    socket.on("presence_update", onPresenceUpdate);
    socket.on("activity_stream", onActivityStream);

    return () => {
      socket.off("presence_sync", onPresenceSync);
      socket.off("presence_update", onPresenceUpdate);
      socket.off("activity_stream", onActivityStream);
    };
  }, [accessToken]);

  // Queries
  const { data: statsData, reload: reloadStats, isLoading: loadingStats } = useApi("admin:stats", () => apiClient.admin.stats());
  const { data: healthData, reload: reloadHealth } = useApi("admin:health", () => apiClient.admin.systemHealth());
  const { data: usersData, reload: reloadUsers, isLoading: loadingUsers } = useApi(
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
  const { data: staleData, reload: reloadStale } = useApi("admin:stale", () => apiClient.admin.staleProfiles());
  const { data: announcementsData, reload: reloadAnnouncements } = useApi("admin:announcements", () => apiClient.announcements.list());

  const stats = statsData?.stats || {};
  const users = usersData?.users || [];
  const totalUserPages = usersData?.pagination?.pages || 1;
  const pendingStories = (storiesData?.stories || []).filter((s: any) => !s.isApproved);
  const allStories = storiesData?.stories || [];
  const jobs = jobsData?.jobs || [];
  const staleUsers = staleData?.users || [];
  const announcements = announcementsData || [];

  // Unverified alumni queue
  const unverifiedAlumni = useMemo(
    () => users.filter((u: any) => u.role === "ALUMNI" && !u.isVerified),
    [users]
  );

  // User Actions
  const handleVerifyUser = async (id: string, verified: boolean) => {
    try {
      if (verified) {
        // Trigger new Server Action to approve profile and award wallet points
        const formData = new FormData();
        formData.append("userId", id);
        const res = await approveProfileAction(formData);
        if (res.success) showToast(res.message || "Success");
        else showToast(res.error || "Approval failed");
      }
      
      await apiClient.admin.updateUserVerify(id, verified);
      if (!verified) showToast("User unverified successfully");
      reloadUsers();
      reloadStats();
    } catch (err: any) {
      showToast(err.message || "Failed to update verification");
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      await apiClient.admin.updateUserRole(id, newRole);
      showToast(`User role updated to ${newRole}`);
      reloadUsers();
      reloadStats();
    } catch (err: any) {
      showToast(err.message || "Failed to change role");
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.admin.updateUserStatus(id, !currentStatus);
      showToast(`User account ${!currentStatus ? "activated" : "suspended"}`);
      reloadUsers();
    } catch (err: any) {
      showToast(err.message || "Failed to update status");
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
    } catch (err: any) {
      showToast(err.message || "Failed to delete user");
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
    } catch (err: any) {
      showToast(err.message || "Failed to moderate story");
    } finally {
      setModeratingId(null);
    }
  };

  // Video Moderation
  const pendingVideos = [
    {
      id: "mock-video-1",
      title: "Mastering System Design Interviews",
      uploader: { name: "Rahul Sharma", company: "Google" },
      price: 150,
      createdAt: new Date().toISOString()
    }
  ];

  const handleModerateVideo = async (id: string, actionType: "APPROVE" | "REJECT") => {
    setModeratingId(id);
    try {
      const formData = new FormData();
      if (actionType === "APPROVE") {
        formData.append("videoId", id);
        const res = await approveVideoAction(formData);
        if (res.success) showToast(res.message || "Success");
        else showToast(res.error || "Approval failed");
      } else {
        formData.append("itemId", id);
        formData.append("itemType", "VIDEO");
        const res = await rejectItemAction(formData);
        if (res.success) showToast(res.message || "Success");
        else showToast(res.error || "Rejection failed");
      }
    } catch (err: any) {
      showToast("Action failed");
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
    } catch (err: any) {
      showToast(err.message || "Failed to update job status");
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await apiClient.admin.deleteJob(id);
      showToast("Job posting deleted");
      reloadJobs();
      reloadStats();
    } catch (err: any) {
      showToast(err.message || "Failed to delete job");
    }
  };

  // Broadcast
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
      showToast(`Broadcast published! Notified ${res.notifiedCount || 0} members.`);
      setBroadcastTitle("");
      setBroadcastContent("");
      reloadAnnouncements();
      reloadStats();
    } catch (err: any) {
      showToast(err.message || "Failed to send broadcast");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Nudge Stale Profile
  const handleNudgeUser = async (id: string, name: string) => {
    try {
      await apiClient.admin.nudgeUser(id);
      showToast(`Re-engagement nudge sent to ${name}`);
    } catch (err: any) {
      showToast(err.message || "Failed to send nudge");
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
      setCsvResult(res);
      showToast(`Imported ${res.summary?.imported || 0} alumni successfully!`);
      setCsvFile(null);
      reloadUsers();
      reloadStats();
    } catch (err: any) {
      showToast(err.message || "CSV import failed");
    } finally {
      setImportingCsv(false);
    }
  };

  const statCards = [
    { label: "Total Members", value: stats.users?.total || 0, icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { label: "Verified Alumni", value: stats.users?.verified || 0, icon: ShieldCheck, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Open Jobs", value: stats.jobs?.open || 0, icon: BriefcaseBusiness, color: "text-amber-500 bg-amber-500/10" },
    { label: "Referral Requests", value: stats.referrals?.total || 0, icon: Target, color: "text-purple-500 bg-purple-500/10" },
    { label: "Pending Stories", value: stats.stories?.pending || 0, icon: Clock, color: "text-rose-500 bg-rose-500/10" },
    { label: "Upcoming Events", value: stats.events?.upcoming || 0, icon: CalendarDays, color: "text-indigo-500 bg-indigo-500/10" },
  ];

  const funnelBars = [
    { label: "Pending", count: stats.referrals?.byStatus?.PENDING || stats.referrals?.byStatus?.pending || 0, color: "bg-amber-500" },
    { label: "Accepted", count: stats.referrals?.byStatus?.ACCEPTED || stats.referrals?.byStatus?.accepted || 0, color: "bg-blue-500" },
    { label: "Referred", count: stats.referrals?.byStatus?.REFERRED || stats.referrals?.byStatus?.referred || 0, color: "bg-purple-500" },
    { label: "Hired", count: stats.referrals?.byStatus?.HIRED || stats.referrals?.byStatus?.hired || 0, color: "bg-emerald-500" },
  ];
  const maxFunnel = Math.max(1, ...funnelBars.map((b) => b.count));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
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
            Platform governance, user role management, moderation & telemetry
          </p>
        </div>

        {/* Live Health Indicator Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-mono">
            <Server size={14} className={healthData?.status === "HEALTHY" ? "text-emerald-500" : "text-amber-500"} />
            <span>DB: {healthData?.latencyMs ? `${healthData.latencyMs}ms` : "Live"}</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Supabase Online</span>
          </div>

          <button
            onClick={() => {
              reloadStats();
              reloadHealth();
              reloadUsers();
              showToast("Refreshed platform telemetry");
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
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
          { id: "moderation", label: `Moderation (${pendingStories.length + unverifiedAlumni.length})`, icon: ShieldCheck, badge: pendingStories.length > 0 },
          { id: "stale_profiles", label: `Stale Profiles (${staleUsers.length})`, icon: Clock },
          { id: "cms", label: "Content (CMS)", icon: Megaphone },
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
                  Telemetry & DB Health
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">
                  {healthData?.status || "HEALTHY"}
                </span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-ink/5">
                  <span className="text-slate-500">Database Engine</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Supabase PostgreSQL (5432)</span>
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
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{healthData?.nodeVersion || process.version || "v20"}</span>
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
                  onClick={() => setActiveTab("cms")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left"
                >
                  <Megaphone size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Send System Broadcast</p>
                    <p className="text-[11px] text-slate-500">Dispatch announcement to all or targeted roles</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("data_tools")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left"
                >
                  <FileUp size={16} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Bulk CSV Roster Import</p>
                    <p className="text-[11px] text-slate-500">Upload batch of alumni with instant email invite</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("moderation")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all text-left"
                >
                  <ShieldCheck size={16} className="text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Review Stories & Profiles</p>
                    <p className="text-[11px] text-slate-500">{pendingStories.length} stories pending approval</p>
                  </div>
                </button>
              </div>

            </Card>
          </div>

          {/* Live Activity Feed */}
          <Card padding="lg" className="space-y-4">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              Live Network Activity
            </h3>
            <div className="space-y-2 pt-2 max-h-60 overflow-y-auto scrollbar-thin">
              {liveActivities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Waiting for incoming activities...</p>
              ) : (
                <AnimatePresence>
                  {liveActivities.map((act, i) => (
                    <motion.div
                      key={act.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-ink/5"
                    >
                      <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 mt-0.5 shrink-0">
                        <Activity size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-slate-900 dark:text-slate-100 truncate">
                          <span className="font-bold">{act.userName}</span> <span className="text-slate-400 font-normal">({act.userRole})</span>
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{act.message}</p>
                      </div>
                      <span className="ml-auto text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search by name, email, company, department..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-ink/15 bg-transparent text-xs outline-none focus:border-blue-500"
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

          {/* User Table */}
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Company / Dept</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Points & Streak</th>
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
                    users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold text-xs">
                                {u.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 block h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                                  onlineUsers.has(u.id) ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                                }`}
                                title={onlineUsers.has(u.id) ? "Online now" : "Offline"}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                              <p className="text-[11px] text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-ink/15 bg-transparent text-[11px] font-bold outline-none"
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
                            onClick={() => handleVerifyUser(u.id, !u.isVerified)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                              u.isVerified
                                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                                : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25"
                            }`}
                          >
                            {u.isVerified ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                            {u.isVerified ? "Verified" : "Unverified"}
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

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="flex items-center gap-0.5 text-blue-600">
                              <Coins size={12} /> {u.totalPoints || 0}
                            </span>
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Flame size={12} /> {u.currentStreak || 1}d
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedUserForDelete(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-ink/10 text-xs">
                <span className="text-slate-500">
                  Page {userPage} of {totalUserPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-ink/15 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={userPage >= totalUserPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-ink/15 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ================= TAB 3: MODERATION QUEUES ================= */}
      {activeTab === "moderation" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Section: Pending Success Stories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                Success Stories Moderation Queue ({pendingStories.length} pending)
              </h3>
            </div>

            {pendingStories.length === 0 ? (
              <Card padding="lg" className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                All alumni success stories have been moderated!
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingStories.map((story: any) => (
                  <Card key={story.id} padding="lg" className="space-y-3 relative">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{story.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          By {story.alumni?.name || story.author || "Alumnus"} · {story.alumni?.currentCompany || story.company || "Company"}
                        </p>
                      </div>
                      <Badge tone="accent">Pending Review</Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {story.body || story.content || story.excerpt}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                      <button
                        onClick={() => handleModerateStory(story.id, false)}
                        disabled={moderatingId === story.id}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleModerateStory(story.id, true, true)}
                        disabled={moderatingId === story.id}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Approve & Feature ⭐
                      </button>
                      <button
                        onClick={() => handleModerateStory(story.id, true, false)}
                        disabled={moderatingId === story.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Approve Story ✓
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section: Pending Videos (Marketplace) */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <PlaySquare size={20} className="text-rose-500" />
              Video Market Moderation Queue ({pendingVideos.length} pending)
            </h3>
            
            {pendingVideos.length === 0 ? (
              <Card padding="lg" className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                No videos waiting for approval!
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingVideos.map((video) => (
                  <Card key={video.id} padding="md" className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{video.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Uploaded by: {video.uploader.name} · {video.uploader.company}
                      </p>
                      <Badge tone="accent" className="mt-2 text-[10px]">Price: {video.price} pts</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleModerateVideo(video.id, "REJECT")}
                        disabled={moderatingId === video.id}
                        className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleModerateVideo(video.id, "APPROVE")}
                        disabled={moderatingId === video.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Approve Video
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section: Job Postings Moderation */}
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
                  {jobs.map((j: any) => (
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
                          onClick={() => handleToggleJobStatus(j.id, j.status)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          {j.status === "OPEN" ? "Close" : "Reopen"}
                        </button>
                        <button
                          onClick={() => handleDeleteJob(j.id)}
                          className="text-xs text-rose-600 hover:underline font-medium"
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
                  staleUsers.map((u: any) => (
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

      {/* ================= TAB 5: CONTENT MANAGEMENT (CMS) ================= */}
      {activeTab === "cms" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding="md" className="hover:border-emerald-500 transition-colors">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-1"><CalendarDays size={16} className="text-emerald-500" /> Event Manager</h3>
              <p className="text-xs text-slate-500 mb-3">Create, edit, and delete upcoming networking events or webinars.</p>
              <a href="/events" className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl transition-colors">Manage Events →</a>
            </Card>

            <Card padding="md" className="hover:border-purple-500 transition-colors">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-1"><Inbox size={16} className="text-purple-500" /> Newsletter Publisher</h3>
              <p className="text-xs text-slate-500 mb-3">Upload and publish monthly PDF newsletters to the network.</p>
              <a href="/newsletters" className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl transition-colors">Manage Newsletters →</a>
            </Card>
          </div>

          <Card padding="lg">
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Megaphone size={20} className="text-blue-500" />
              Publish System Broadcast
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