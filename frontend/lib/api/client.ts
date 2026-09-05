import { apiFetch } from "@/lib/api";
import type { Alumni, AuthSession, EventItem, EventDetailItem, Job, LoginInput, ReferralRequest, RegisterInput, User } from "./types";

export const apiClient = {
  auth: {
    login: async (input: LoginInput): Promise<AuthSession> => {
      return await apiFetch<AuthSession>({ method: "POST", url: "/auth/login", data: input });
    },
    register: async (input: RegisterInput): Promise<AuthSession> => {
      return await apiFetch<AuthSession>({ method: "POST", url: "/auth/register", data: input });
    },
    me: async (): Promise<User> => {
      return await apiFetch<{ user: User }>({ method: "GET", url: "/users/me" }).then((res) => res.user);
    },
  },
  users: {
    updateProfile: async (data: Partial<User>) => {
      return await apiFetch<{ user: User }>({ method: "PATCH", url: "/users/me", data }).then((res) => res.user);
    },
    verifyEvidence: async (data: { method: "college_email" | "id_upload" | "otp"; collegeEmail?: string; idCardUrl?: string; otp?: string }) => {
      return await apiFetch<{ success: boolean; message: string; user: User }>({ method: "POST", url: "/users/verify-evidence", data });
    },
  },
  uploads: {
    resume: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return await apiFetch<{ url: string; filename: string; message: string }>({
        method: "POST",
        url: "/uploads/resume",
        data: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    avatar: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return await apiFetch<{ url: string; user: User; message: string }>({
        method: "POST",
        url: "/uploads/avatar",
        data: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    certificate: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return await apiFetch<{ url: string; filename: string; message: string }>({
        method: "POST",
        url: "/uploads/certificate",
        data: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    media: async (file: File, bucket = "stories") => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", bucket);
      return await apiFetch<{ url: string; bucket: string; filename: string }>({
        method: "POST",
        url: "/uploads/media",
        data: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  },
  alumni: {
    list: async (query?: string, options?: { filter?: string | null; value?: string | null }): Promise<Alumni[]> => {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (options?.filter && options?.value) {
        params.filter = options.filter;
        params.filterValue = options.value;
      }
      const res = await apiFetch<{ alumni: User[] }>({
        method: "GET",
        url: "/users/alumni",
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      return (res.alumni || []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        batch: String(u.batchYear || ""),
        company: u.currentCompany || "",
        role: u.jobTitle || u.role || "Alumni",
        location: u.location || "",
        initials: (u.name || "").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase(),
        department: u.department,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        linkedinUrl: u.linkedinUrl,
      }));
    },
    get: async (id: string): Promise<Alumni> => {
      const res = await apiFetch<{ user: User }>({ method: "GET", url: `/users/${id}` });
      const u = res.user;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        batch: String(u.batchYear || ""),
        company: u.currentCompany || "",
        role: u.jobTitle || u.role || "Alumni",
        location: u.location || "",
        initials: (u.name || "").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase(),
        department: u.department,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        linkedinUrl: u.linkedinUrl,
      };
    },
    geoDistribution: async () => {
      return await apiFetch<{
        clusters: Array<{
          city: string;
          country: string;
          lat: number;
          lng: number;
          count: number;
          alumni: Array<{ id: string; name: string; currentCompany?: string; jobTitle?: string; avatarUrl?: string }>;
        }>;
      }>({ method: "GET", url: "/users/geo-distribution" });
    },
  },
  jobs: {
    list: async (): Promise<Job[]> => {
      return await apiFetch<{ jobs: Job[] }>({ method: "GET", url: "/jobs" }).then((res) => res.jobs);
    },
    get: async (id: string): Promise<Job> => {
      return await apiFetch<Job>({ method: "GET", url: `/jobs/${id}` });
    },
    create: async (data: {
      title: string;
      company: string;
      type: string;
      location: string;
      description: string;
      requirements?: string[];
      referralAvailable?: boolean;
      remote?: boolean;
    }): Promise<{ job: Job }> => {
      return await apiFetch<{ job: Job }>({ method: "POST", url: "/jobs", data });
    },
    myPostings: async (): Promise<{ jobs: Job[] }> => {
      return await apiFetch<{ jobs: Job[] }>({ method: "GET", url: "/jobs/my-postings" });
    },
    updateApplicantStatus: async (jobId: string, requestId: string, status: string, alumniNote?: string): Promise<{ success: boolean; message?: string }> => {
      return await apiFetch<{ success: boolean; message?: string }>({
        method: "PATCH",
        url: `/jobs/${jobId}/applicants/${requestId}/status`,
        data: { status, alumniNote },
      });
    },
  },
  events: {
    list: async (): Promise<EventItem[]> => {
      return await apiFetch<{ events: EventItem[] }>({ method: "GET", url: "/events" }).then((res) => res.events);
    },
    get: async (id: string): Promise<EventDetailItem> => {
      return await apiFetch<{ event: EventDetailItem }>({ method: "GET", url: `/events/${id}` })
        .then((res) => res.event || (res as unknown as EventDetailItem));
    },
    create: async (data: {
      title: string;
      detail: string;
      place: string;
      date: string;
      month?: string;
      day?: string;
      startsAt?: string;
      category?: string;
      capacity?: number;
    }): Promise<{ event: EventItem }> => {
      return await apiFetch<{ event: EventItem }>({ method: "POST", url: "/events", data });
    },
    rsvp: async (id: string): Promise<{ attending: boolean; rsvp?: unknown; message?: string }> => {
      return await apiFetch<{ attending: boolean; rsvp?: unknown; message?: string }>({
        method: "POST",
        url: `/events/${id}/rsvp`,
      });
    },
    cancelRsvp: async (id: string): Promise<{ attending: boolean; message?: string }> => {
      return await apiFetch<{ attending: boolean; message?: string }>({
        method: "DELETE",
        url: `/events/${id}/rsvp`,
      });
    },
  },
  referrals: {
    mySent: async (): Promise<{ referrals: ReferralRequest[]; pagination?: Record<string, unknown> }> => {
      return await apiFetch<{ referrals: ReferralRequest[]; pagination?: Record<string, unknown> }>({ method: "GET", url: "/referrals/me/sent" });
    },
    myReceived: async (status?: string): Promise<{ referrals: ReferralRequest[]; pagination?: Record<string, unknown> }> => {
      return await apiFetch<{ referrals: ReferralRequest[]; pagination?: Record<string, unknown> }>({
        method: "GET",
        url: "/referrals/me/received",
        params: status ? { status } : undefined,
      });
    },
    list: async (): Promise<ReferralRequest[]> => {
      return await apiFetch<{ referrals: ReferralRequest[] }>({
        method: "GET",
        url: "/referrals/me/received",
      }).then((res) => res.referrals || []);
    },
    create: async (data: { jobId: string; message?: string; studentNote?: string; resumeUrl?: string; coverLetter?: string } | string, legacyMsg?: string): Promise<ReferralRequest> => {
      const payload = typeof data === "string" ? { jobId: data, studentNote: legacyMsg } : { ...data, studentNote: data.studentNote || data.message };
      return await apiFetch<ReferralRequest>({ method: "POST", url: "/referrals", data: payload });
    },
    updateStatus: async (id: string, status: string): Promise<ReferralRequest> => {
      return await apiFetch<ReferralRequest>({ method: "PATCH", url: `/referrals/${id}/status`, data: { status: status.toUpperCase() } });
    },
    getById: async (id: string): Promise<ReferralRequest> => {
      return await apiFetch<ReferralRequest>({ method: "GET", url: `/referrals/${id}` });
    },
  },
  requests: {
    list: async (): Promise<ReferralRequest[]> => {
      return await apiFetch<{ referrals: ReferralRequest[] }>({
        method: "GET",
        url: "/referrals/me/received",
      }).then((res) => res.referrals || []);
    },
    create: async (jobId: string, message: string): Promise<ReferralRequest> => {
      return await apiFetch<ReferralRequest>({ method: "POST", url: "/referrals", data: { jobId, studentNote: message } });
    },
    updateStatus: async (id: string, status: ReferralRequest["status"]): Promise<ReferralRequest> => {
      return await apiFetch<ReferralRequest>({ method: "PATCH", url: `/referrals/${id}/status`, data: { status: status.toUpperCase() as ReferralRequest["status"] } });
    },
  },
  admin: {
    stats: async (): Promise<Record<string, unknown>> => {
      return await apiFetch<Record<string, unknown>>({ method: "GET", url: "/admin/stats" });
    },
    systemHealth: async (): Promise<Record<string, unknown>> => {
      return await apiFetch<Record<string, unknown>>({ method: "GET", url: "/admin/system-health" });
    },
    users: async (params?: Record<string, string>): Promise<{ users: User[]; pagination?: Record<string, unknown> }> => {
      return await apiFetch<{ users: User[]; pagination?: Record<string, unknown> }>({ method: "GET", url: "/admin/users", params });
    },
    updateUserVerify: async (id: string, verified: boolean): Promise<{ success: boolean; user?: User }> => {
      return await apiFetch<{ success: boolean; user?: User }>({ method: "PATCH", url: `/admin/users/${id}/verify`, data: { verified } });
    },
    approveProfile: async (id: string): Promise<{ success: boolean; message?: string; user?: User }> => {
      return await apiFetch<{ success: boolean; message?: string; user?: User }>({ method: "POST", url: `/admin/users/${id}/approve-profile` });
    },
    rejectProfile: async (id: string, reason?: string): Promise<{ success: boolean; message?: string; user?: User }> => {
      return await apiFetch<{ success: boolean; message?: string; user?: User }>({ method: "POST", url: `/admin/users/${id}/reject-profile`, data: { reason } });
    },
    approveVideo: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return await apiFetch<{ success: boolean; message?: string }>({ method: "PATCH", url: `/admin/videos/${id}/status`, data: { status: "PUBLISHED" } });
    },
    rejectVideo: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return await apiFetch<{ success: boolean; message?: string }>({ method: "PATCH", url: `/admin/videos/${id}/status`, data: { status: "REJECTED" } });
    },
    updateUserRole: async (id: string, role: string): Promise<{ success: boolean; user?: User }> => {
      return await apiFetch<{ success: boolean; user?: User }>({ method: "PATCH", url: `/admin/users/${id}/role`, data: { role } });
    },
    updateUserStatus: async (id: string, isActive: boolean): Promise<{ success: boolean; user?: User }> => {
      return await apiFetch<{ success: boolean; user?: User }>({ method: "PATCH", url: `/admin/users/${id}/status`, data: { isActive } });
    },
    deleteUser: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return await apiFetch<{ success: boolean; message?: string }>({ method: "DELETE", url: `/admin/users/${id}` });
    },
    stories: async (status?: string): Promise<{ stories: Record<string, unknown>[] }> => {
      const params = status ? { status } : undefined;
      return await apiFetch<{ stories: Record<string, unknown>[] }>({ method: "GET", url: "/admin/stories", params });
    },
    updateStoryStatus: async (id: string, data: { isApproved?: boolean; isFeatured?: boolean }): Promise<{ success: boolean }> => {
      return await apiFetch<{ success: boolean }>({ method: "PATCH", url: `/admin/stories/${id}/status`, data });
    },
    jobs: async (status?: string): Promise<{ jobs: Job[] }> => {
      const params = status ? { status } : undefined;
      return await apiFetch<{ jobs: Job[] }>({ method: "GET", url: "/admin/jobs", params });
    },
    updateJobStatus: async (id: string, status: string): Promise<{ success: boolean }> => {
      return await apiFetch<{ success: boolean }>({ method: "PATCH", url: `/admin/jobs/${id}/status`, data: { status } });
    },
    deleteJob: async (id: string): Promise<{ success: boolean }> => {
      return await apiFetch<{ success: boolean }>({ method: "DELETE", url: `/admin/jobs/${id}` });
    },
    broadcast: async (data: { title: string; content: string; targetRole?: string; priority?: string; isPinned?: boolean }): Promise<{ success: boolean; message?: string }> => {
      return await apiFetch<{ success: boolean; message?: string }>({ method: "POST", url: "/admin/broadcast", data });
    },
    staleProfiles: async (): Promise<{ count: number; users: User[] }> => {
      return await apiFetch<{ count: number; users: User[] }>({ method: "GET", url: "/admin/stale-profiles" });
    },
    nudgeUser: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return await apiFetch<{ success: boolean; message?: string }>({ method: "POST", url: `/admin/nudge-user/${id}` });
    },
    importCsv: async (formData: FormData): Promise<{ success: boolean; importedCount?: number; message?: string }> => {
      return await apiFetch<{ success: boolean; importedCount?: number; message?: string }>({
        method: "POST",
        url: "/admin/import-csv",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    approvals: async (): Promise<Record<string, unknown>> => {
      return await apiFetch<Record<string, unknown>>({ method: "GET", url: "/admin/approvals" });
    },
    videos: async (status?: string): Promise<{ videos: Record<string, unknown>[] }> => {
      const params = status ? { status } : undefined;
      return await apiFetch<{ videos: Record<string, unknown>[] }>({ method: "GET", url: "/admin/videos", params });
    },
    updateVideoStatus: async (id: string, status: string): Promise<{ success: boolean }> => {
      return await apiFetch<{ success: boolean }>({ method: "PATCH", url: `/admin/videos/${id}/status`, data: { status } });
    },
    events: {
      create: async (data: { title: string; description: string; date: string; location?: string; mode?: string; coverImage?: string; maxCapacity?: number }) => {
        return await apiFetch<{ event: EventItem }>({ method: "POST", url: "/admin/events", data });
      },
      update: async (id: string, data: Partial<{ title: string; description: string; date: string; location?: string; mode?: string; coverImage?: string; maxCapacity?: number }>) => {
        return await apiFetch<{ event: EventItem }>({ method: "PUT", url: `/admin/events/${id}`, data });
      },
      delete: async (id: string) => {
        return await apiFetch<{ success: boolean }>({ method: "DELETE", url: `/admin/events/${id}` });
      },
    },
    newsletters: {
      create: async (data: { title: string; issueDate?: string; year?: number; coverImage?: string; fileUrl: string }) => {
        return await apiFetch<{ newsletter: import("./types").Newsletter }>({ method: "POST", url: "/admin/newsletters", data });
      },
      update: async (id: string, data: Partial<{ title: string; issueDate?: string; year?: number; coverImage?: string; fileUrl?: string }>) => {
        return await apiFetch<{ newsletter: import("./types").Newsletter }>({ method: "PUT", url: `/admin/newsletters/${id}`, data });
      },
      delete: async (id: string) => {
        return await apiFetch<{ success: boolean }>({ method: "DELETE", url: `/admin/newsletters/${id}` });
      },
    },
    pages: {
      list: async (): Promise<{ pages: Record<string, unknown>[] }> => {
        return await apiFetch<{ pages: Record<string, unknown>[] }>({ method: "GET", url: "/admin/pages" });
      },
      create: async (data: { title: string; slug?: string; description?: string; heroTitle?: string; heroSubtitle?: string; blocks?: unknown[]; status?: string }): Promise<{ page: Record<string, unknown> }> => {
        return await apiFetch<{ page: Record<string, unknown> }>({ method: "POST", url: "/admin/pages", data });
      },
      update: async (id: string, data: Partial<{ title: string; slug?: string; description?: string; heroTitle?: string; heroSubtitle?: string; blocks?: unknown[]; status?: string }>): Promise<{ page: Record<string, unknown> }> => {
        return await apiFetch<{ page: Record<string, unknown> }>({ method: "PUT", url: `/admin/pages/${id}`, data });
      },
      delete: async (id: string): Promise<{ success: boolean }> => {
        return await apiFetch<{ success: boolean }>({ method: "DELETE", url: `/admin/pages/${id}` });
      },
    },
  },
  pages: {
    getBySlug: async (slug: string): Promise<{ page: Record<string, unknown> }> => {
      return await apiFetch<{ page: Record<string, unknown> }>({ method: "GET", url: `/pages/${slug}` });
    },
    listPublished: async (): Promise<{ pages: Record<string, unknown>[] }> => {
      return await apiFetch<{ pages: Record<string, unknown>[] }>({ method: "GET", url: "/pages" });
    },
  },
  stories: {
    list: async (): Promise<unknown[]> => {
      return await apiFetch<{ stories: unknown[] }>({ method: "GET", url: "/stories" }).then((res) => res.stories);
    },
    create: async (data: unknown): Promise<unknown> => {
      return await apiFetch<unknown>({ method: "POST", url: "/stories", data });
    },
    updateStatus: async (id: string, isApproved: boolean): Promise<unknown> => {
      return await apiFetch<unknown>({ method: "PATCH", url: `/stories/${id}/approve`, data: { isApproved } });
    },
    vote: async (id: string): Promise<{ hasVoted: boolean; message: string }> => {
      return await apiFetch<{ hasVoted: boolean; message: string }>({ method: "POST", url: `/stories/${id}/vote` });
    },
  },
  announcements: {
    list: async (): Promise<unknown[]> => {
      const res = await apiFetch<{ announcements: Array<{ pinned?: boolean }> }>({ method: "GET", url: "/announcements" });
      return (res.announcements || []).sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return 0;
      });
    },
    create: async (data: { title: string; body: string; category?: string; author?: string; role?: string; pinned?: boolean }): Promise<unknown> => {
      const res = await apiFetch<{ announcement: unknown }>({
        method: "POST",
        url: "/announcements",
        data,
      });
      return res.announcement;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    togglePin: async (_id?: string): Promise<boolean> => {
      return true; // Wait backend to support this properly
    },
  },
  matching: {
    syncMe: () => apiFetch<{ message: string }>({ method: "POST", url: "/matching/sync-me" }),
    topAlumni: async (): Promise<{ student: unknown; alumni: unknown[] }> => {
      return await apiFetch<{ student: unknown; alumni: unknown[] }>({ method: "GET", url: "/matching/top-alumni" });
    },
    skillSwap: async (): Promise<{ matches: unknown[] }> => {
      return await apiFetch<{ matches: unknown[] }>({ method: "GET", url: "/matching/skill-swap" });
    },
  },
  mentorship: {
    list: async (): Promise<{ mentorships: unknown[] }> => {
      return await apiFetch<{ mentorships: unknown[] }>({ method: "GET", url: "/mentorship" });
    },
    create: async (data: { mentorId: string; area: string; message?: string; isDirectSwap?: boolean; scheduledFor?: string; durationMins?: number }): Promise<{ mentorship: unknown }> => {
      return await apiFetch<{ mentorship: unknown }>({ method: "POST", url: "/mentorship", data });
    },
    updateStatus: async (id: string, status: string, grantVideoAccess?: boolean): Promise<{ mentorship: unknown }> => {
      return await apiFetch<{ mentorship: unknown }>({ method: "PATCH", url: `/mentorship/${id}/status`, data: { status, grantVideoAccess } });
    },
    confirm: async (id: string): Promise<{ mentorship: unknown; message: string }> => {
      return await apiFetch<{ mentorship: unknown; message: string }>({ method: "PATCH", url: `/mentorship/${id}/confirm` });
    },
  },
  chat: {
    list: async (): Promise<{ threads: Record<string, unknown>[] }> => {
      return await apiFetch<{ threads: Record<string, unknown>[] }>({ method: "GET", url: "/chat" });
    },
    getThread: async (id: string): Promise<{ messages: Record<string, unknown>[] }> => {
      return await apiFetch<{ messages: Record<string, unknown>[] }>({ method: "GET", url: `/chat/${id}` });
    },
    sendMessage: async (id: string, text: string): Promise<{ message: Record<string, unknown> }> => {
      return await apiFetch<{ message: Record<string, unknown> }>({ method: "POST", url: `/chat/${id}`, data: { text } });
    },
    createThread: async (targetUserId: string): Promise<{ thread: Record<string, unknown> }> => {
      return await apiFetch<{ thread: Record<string, unknown> }>({ method: "POST", url: "/chat", data: { targetUserId } });
    },
  },
  gamification: {
    getStatus: async () => {
      return await apiFetch<import("./types").GamificationStatus>({ method: "GET", url: "/gamification/status" });
    },
    getLeaderboard: async (role?: string) => {
      const params: Record<string, string> = {};
      if (role && role !== "all") params.role = role;
      return await apiFetch<{ leaderboard: import("./types").LeaderboardEntry[] }>({
        method: "GET",
        url: "/gamification/leaderboard",
        params: Object.keys(params).length ? params : undefined,
      });
    },
    getBadges: async () => {
      return await apiFetch<{ badges: import("./types").Badge[] }>({ method: "GET", url: "/gamification/badges" });
    },
    verifyJob: async () => {
      return await apiFetch<{ message: string; totalPoints: number }>({ method: "POST", url: "/gamification/verify-job" });
    },
    claimAction: async (actionType: string) => {
      return await apiFetch<{ message: string; totalPoints: number; pointsEarned: number }>({
        method: "POST",
        url: "/gamification/claim-action",
        data: { actionType },
      });
    },
    getWallet: async () => {
      return await apiFetch<{ wallet: Record<string, unknown> }>({ method: "GET", url: "/gamification/wallet" });
    },
  },
  newsletters: {
    list: async (year?: string, search?: string) => {
      const params: Record<string, string> = {};
      if (year && year !== "all") params.year = year;
      if (search) params.search = search;
      return await apiFetch<{ newsletters: import("./types").Newsletter[]; years: number[] }>({
        method: "GET",
        url: "/newsletters",
        params: Object.keys(params).length ? params : undefined,
      });
    },
  },
  notifications: {
    list: async (params?: { page?: number; limit?: number }) => {
      return await apiFetch<{ notifications: Record<string, unknown>[]; unreadCount: number; pagination?: Record<string, unknown> }>({
        method: "GET",
        url: "/notifications",
        params,
      });
    },
    unreadCount: async () => {
      return await apiFetch<{ count: number }>({ method: "GET", url: "/notifications/unread-count" });
    },
    readAll: async () => {
      return await apiFetch<{ message?: string; updated?: number }>({
        method: "PATCH",
        url: "/notifications/read-all",
      });
    },
    markRead: async (id: string) => {
      return await apiFetch<{ message?: string; success?: boolean }>({
        method: "PATCH",
        url: `/notifications/${id}/read`,
      });
    },
  },
  search: {
    global: async (q: string, type?: string, limit?: number) => {
      const params: Record<string, string> = { q };
      if (type) params.type = type;
      if (limit) params.limit = limit.toString();
      return await apiFetch<{ results: Record<string, unknown> }>({ method: "GET", url: "/search", params }).then((res) => res.results);
    }
  },
  video: {
    list: async (): Promise<{ videos: unknown[] }> => {
      return await apiFetch<{ videos: unknown[] }>({ method: "GET", url: "/video" });
    },
    submit: async (data: { title: string; description: string; videoUrl: string; priceInCredits?: number }): Promise<{ success: boolean; video: unknown }> => {
      return await apiFetch<{ success: boolean; video: unknown }>({ method: "POST", url: "/video", data });
    },
    unlock: async (videoId: string): Promise<{ success: boolean }> => {
      return await apiFetch<{ success: boolean }>({ method: "POST", url: `/video/${videoId}/unlock` });
    },
    heartbeat: async (videoId: string, currentTimestamp: number): Promise<{ message: string; isCompleted: boolean; watchPercentage: number }> => {
      return await apiFetch<{ message: string; isCompleted: boolean; watchPercentage: number }>({ method: "POST", url: "/video/heartbeat", data: { videoId, currentTimestamp } });
    },
    claimCertificate: async (videoId: string): Promise<{ message: string; certificate: unknown }> => {
      return await apiFetch<{ message: string; certificate: unknown }>({ method: "POST", url: "/video/claim-certificate", data: { videoId } });
    },
    getProgress: async (videoId: string): Promise<{ maxWatchedTimestamp: number; status: string; hasCertificate: boolean; certificateUrl?: string }> => {
      return await apiFetch<{ maxWatchedTimestamp: number; status: string; hasCertificate: boolean; certificateUrl?: string }>({ method: "GET", url: `/video/${videoId}/progress` });
    }
  },
  support: {
    create: async (data: { subject: string; category: string; message: string }): Promise<{ ticket: Record<string, unknown>; message: string }> => {
      return await apiFetch<{ ticket: Record<string, unknown>; message: string }>({ method: "POST", url: "/support", data });
    },
    myTickets: async (): Promise<{ tickets: Record<string, unknown>[] }> => {
      return await apiFetch<{ tickets: Record<string, unknown>[] }>({ method: "GET", url: "/support" });
    },
    allTickets: async (params?: { status?: string; category?: string }): Promise<{ tickets: Record<string, unknown>[] }> => {
      return await apiFetch<{ tickets: Record<string, unknown>[] }>({ method: "GET", url: "/support/admin/all", params: params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "ALL")) : undefined });
    },
    updateStatus: async (id: string, status: string): Promise<{ ticket: Record<string, unknown>; message: string }> => {
      return await apiFetch<{ ticket: Record<string, unknown>; message: string }>({ method: "PATCH", url: `/support/${id}/status`, data: { status } });
    }
  },
  giving: {
    campaigns: async (params?: { category?: string; status?: string; page?: number; limit?: number }) => {
      return await apiFetch<{ success: boolean; data: any[]; meta: any }>({ method: "GET", url: "/giving/campaigns", params });
    },
    campaignDetails: async (id: string) => {
      return await apiFetch<{ success: boolean; data: any }>({ method: "GET", url: `/giving/campaigns/${id}` });
    },
    pledge: async (data: { campaignId: string; amount: number; isAnonymous?: boolean; donorNote?: string }) => {
      return await apiFetch<{ success: boolean; message: string; data: any }>({ method: "POST", url: "/giving/pledge", data });
    },
    createCampaign: async (data: { title: string; description: string; category?: string; targetAmount: number; coverImage?: string; endDate?: string }) => {
      return await apiFetch<{ success: boolean; data: any }>({ method: "POST", url: "/giving/campaigns", data });
    }
  }
};
