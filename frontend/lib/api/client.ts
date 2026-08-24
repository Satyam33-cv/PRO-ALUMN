import { apiFetch } from "@/lib/api";
import type { Alumni, AuthSession, EventItem, Job, LoginInput, ReferralRequest, RegisterInput, User } from "./types";

export const apiClient = {
  auth: {
    login: async (input: LoginInput): Promise<AuthSession> => {
      return await apiFetch<AuthSession>({ method: "POST", url: "/auth/login", data: input });
    },
    register: async (input: RegisterInput): Promise<AuthSession> => {
      return await apiFetch<AuthSession>({ method: "POST", url: "/auth/register", data: input });
    },
    me: async (): Promise<User> => {
      return await apiFetch<User>({ method: "GET", url: "/users/me" });
    },
  },
  users: {
    updateProfile: async (data: Partial<User>) => {
      return await apiFetch<{ user: User }>({ method: "PATCH", url: "/users/me", data }).then((res) => res.user);
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
      const res = await apiFetch<{ alumni: Alumni[] }>({
        method: "GET",
        url: "/users/alumni",
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      return res.alumni;
    },
    get: async (id: string): Promise<Alumni> => {
      return await apiFetch<Alumni>({ method: "GET", url: `/users/${id}` });
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
    myPostings: async (): Promise<{ jobs: any[] }> => {
      return await apiFetch<{ jobs: any[] }>({ method: "GET", url: "/jobs/my-postings" });
    },
    updateApplicantStatus: async (jobId: string, requestId: string, status: string, alumniNote?: string): Promise<any> => {
      return await apiFetch<any>({
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
    get: async (id: string): Promise<EventItem> => {
      return await apiFetch<EventItem>({ method: "GET", url: `/events/${id}` });
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
    rsvp: async (id: string): Promise<{ attending: boolean }> => {
      return await apiFetch<{ attending: boolean }>({ method: "POST", url: `/events/${id}/rsvp` });
    },
  },
  referrals: {
    mySent: async (): Promise<{ referrals: any[]; pagination: any }> => {
      return await apiFetch<{ referrals: any[]; pagination: any }>({ method: "GET", url: "/referrals/me/sent" });
    },
    myReceived: async (status?: string): Promise<{ referrals: any[]; pagination: any }> => {
      return await apiFetch<{ referrals: any[]; pagination: any }>({
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
    create: async (data: { jobId: string; message?: string; studentNote?: string; resumeUrl?: string; coverLetter?: string } | string, legacyMsg?: string): Promise<any> => {
      const payload = typeof data === "string" ? { jobId: data, studentNote: legacyMsg } : { ...data, studentNote: data.studentNote || data.message };
      return await apiFetch<any>({ method: "POST", url: "/referrals", data: payload });
    },
    updateStatus: async (id: string, status: string): Promise<any> => {
      return await apiFetch<any>({ method: "PATCH", url: `/referrals/${id}/status`, data: { status: status.toUpperCase() } });
    },
    getById: async (id: string): Promise<any> => {
      return await apiFetch<any>({ method: "GET", url: `/referrals/${id}` });
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
      return await apiFetch<ReferralRequest>({ method: "PATCH", url: `/referrals/${id}/status`, data: { status: status.toUpperCase() as any } });
    },
  },
  admin: {
    stats: async (): Promise<any> => {
      return await apiFetch<any>({ method: "GET", url: "/admin/stats" });
    },
    systemHealth: async (): Promise<any> => {
      return await apiFetch<any>({ method: "GET", url: "/admin/system-health" });
    },
    users: async (params?: Record<string, string>): Promise<{ users: any[]; pagination: any }> => {
      return await apiFetch<{ users: any[]; pagination: any }>({ method: "GET", url: "/admin/users", params });
    },
    updateUserVerify: async (id: string, verified: boolean): Promise<any> => {
      return await apiFetch<any>({ method: "PATCH", url: `/admin/users/${id}/verify`, data: { verified } });
    },
    updateUserRole: async (id: string, role: string): Promise<any> => {
      return await apiFetch<any>({ method: "PATCH", url: `/admin/users/${id}/role`, data: { role } });
    },
    updateUserStatus: async (id: string, isActive: boolean): Promise<any> => {
      return await apiFetch<any>({ method: "PATCH", url: `/admin/users/${id}/status`, data: { isActive } });
    },
    deleteUser: async (id: string): Promise<any> => {
      return await apiFetch<any>({ method: "DELETE", url: `/admin/users/${id}` });
    },
    stories: async (status?: string): Promise<{ stories: any[] }> => {
      const params = status ? { status } : undefined;
      return await apiFetch<{ stories: any[] }>({ method: "GET", url: "/admin/stories", params });
    },
    updateStoryStatus: async (id: string, data: { isApproved?: boolean; isFeatured?: boolean }): Promise<any> => {
      return await apiFetch<any>({ method: "PATCH", url: `/admin/stories/${id}/status`, data });
    },
    jobs: async (status?: string): Promise<{ jobs: any[] }> => {
      const params = status ? { status } : undefined;
      return await apiFetch<{ jobs: any[] }>({ method: "GET", url: "/admin/jobs", params });
    },
    updateJobStatus: async (id: string, status: string): Promise<any> => {
      return await apiFetch<any>({ method: "PATCH", url: `/admin/jobs/${id}/status`, data: { status } });
    },
    deleteJob: async (id: string): Promise<any> => {
      return await apiFetch<any>({ method: "DELETE", url: `/admin/jobs/${id}` });
    },
    broadcast: async (data: { title: string; content: string; targetRole?: string; priority?: string; isPinned?: boolean }): Promise<any> => {
      return await apiFetch<any>({ method: "POST", url: "/admin/broadcast", data });
    },
    staleProfiles: async (): Promise<{ count: number; users: any[] }> => {
      return await apiFetch<{ count: number; users: any[] }>({ method: "GET", url: "/admin/stale-profiles" });
    },
    nudgeUser: async (id: string): Promise<any> => {
      return await apiFetch<any>({ method: "POST", url: `/admin/nudge-user/${id}` });
    },
    importCsv: async (formData: FormData): Promise<any> => {
      return await apiFetch<any>({
        method: "POST",
        url: "/admin/import-csv",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      const res = await apiFetch<{ announcements: unknown[] }>({ method: "GET", url: "/announcements" });
      return (res.announcements || []).sort((a: any, b: any) => {
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
    togglePin: async (id: string): Promise<boolean> => {
      return true; // Wait backend to support this properly
    },
  },
  matching: {
    syncMe: () => apiFetch<{ message: string }>({ method: "POST", url: "/matching/sync-me" }),
    topAlumni: async (): Promise<{ student: unknown; alumni: unknown[] }> => {
      return await apiFetch<{ student: unknown; alumni: unknown[] }>({ method: "GET", url: "/matching/top-alumni" });
    },
  },
  mentorship: {
    list: async (): Promise<{ mentorships: unknown[] }> => {
      return await apiFetch<{ mentorships: unknown[] }>({ method: "GET", url: "/mentorship" });
    },
    create: async (data: { mentorId: string; area: string; message?: string }): Promise<{ mentorship: unknown }> => {
      return await apiFetch<{ mentorship: unknown }>({ method: "POST", url: "/mentorship", data });
    },
    updateStatus: async (id: string, status: string): Promise<{ mentorship: unknown }> => {
      return await apiFetch<{ mentorship: unknown }>({ method: "PATCH", url: `/mentorship/${id}/status`, data: { status } });
    },
  },
  chat: {
    list: async (): Promise<{ threads: unknown[] }> => {
      return await apiFetch<{ threads: unknown[] }>({ method: "GET", url: "/chat" });
    },
    getThread: async (id: string): Promise<{ messages: unknown[] }> => {
      return await apiFetch<{ messages: unknown[] }>({ method: "GET", url: `/chat/${id}` });
    },
    sendMessage: async (id: string, text: string): Promise<{ message: unknown }> => {
      return await apiFetch<{ message: unknown }>({ method: "POST", url: `/chat/${id}`, data: { text } });
    },
    createThread: async (targetUserId: string): Promise<{ thread: unknown }> => {
      return await apiFetch<{ thread: unknown }>({ method: "POST", url: "/chat", data: { targetUserId } });
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
    list: async () => {
      return await apiFetch<{ notifications: any[]; unreadCount: number }>({
        method: "GET",
        url: "/notifications",
      });
    },
    readAll: async () => {
      return await apiFetch<{ message: string }>({
        method: "PATCH",
        url: "/notifications/read-all",
      });
    },
    markRead: async (id: string) => {
      return await apiFetch<{ message: string }>({
        method: "PATCH",
        url: `/notifications/${id}/read`,
      });
    },
  },
};
