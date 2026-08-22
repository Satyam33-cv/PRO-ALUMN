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
      return await apiFetch<{ url: string }>({
        method: "POST",
        url: "/uploads/resume",
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
  },
  events: {
    list: async (): Promise<EventItem[]> => {
      return await apiFetch<{ events: EventItem[] }>({ method: "GET", url: "/events" }).then((res) => res.events);
    },
    get: async (id: string): Promise<EventItem> => {
      return await apiFetch<EventItem>({ method: "GET", url: `/events/${id}` });
    },
    rsvp: async (id: string): Promise<{ attending: boolean }> => {
      return await apiFetch<{ attending: boolean }>({ method: "POST", url: `/events/${id}/rsvp` });
    },
  },
  requests: {
    list: async (): Promise<ReferralRequest[]> => {
      return await apiFetch<{ referrals: ReferralRequest[] }>({
        method: "GET",
        url: "/referrals/me/received",
      }).then((res) => res.referrals);
    },
    create: async (jobId: string, message: string): Promise<ReferralRequest> => {
      return await apiFetch<ReferralRequest>({ method: "POST", url: "/referrals", data: { jobId, message } });
    },
    updateStatus: async (id: string, status: ReferralRequest["status"]): Promise<ReferralRequest> => {
      return await apiFetch<ReferralRequest>({ method: "PATCH", url: `/referrals/${id}/status`, data: { status } });
    },
  },
  admin: {
    stats: async (): Promise<unknown> => {
      return await apiFetch<unknown>({ method: "GET", url: "/admin/stats" });
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
};
