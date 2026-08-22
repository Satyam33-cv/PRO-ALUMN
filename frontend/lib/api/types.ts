export type { Alumni, AlumniId, EventItem, Job, Announcement, Story, Notification, ChatThread, MentorshipRequest } from "@/lib/types";

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export type ApiError = {
  error: string;
  code?: string;
  details?: any;
};

// --- Request/Response types ---
export type UpdateProfileData = {
  name?: string;
  bio?: string;
  location?: string;
  company?: string;
  role?: string;
  batch?: string;
  skills?: string[];
  department?: string;
  jobTitle?: string;
  currentCompany?: string;
  batchYear?: number;
  linkedinUrl?: string;
};

export type SearchParams = {
  q?: string;
  page?: number;
  limit?: number;
  filter?: string;
  value?: string;
};

export type TopAlumniResponse = {
  student: any;
  alumni: import("@/lib/types").Alumni[];
};

export type CreateReferralData = {
  jobId: string;
  studentNote?: string;
  resumeUrl?: string;
};

export type ReferralRequestResponse = {
  id: string;
  jobId: string;
  status: string;
  studentNote?: string;
  createdAt: string;
  job?: import("@/lib/types").Job;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role?: "student" | "alumni" | "admin" | "faculty";
  batchYear?: number | string;
  department?: string;
  alumni?: {
    graduationYear?: number;
    department?: string;
    [key: string]: unknown;
  };
};

export type AuthSession = {
  token: string;
  user: User;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
  role?: "STUDENT" | "ALUMNI" | "FACULTY";
  currentCompany?: string;
};

export type ReferralStatus = "pending" | "accepted" | "rejected" | "referred" | "hired";

export type ReferralRequest = {
  id: string;
  status: ReferralStatus;
  message: string;
  createdAt: string;
  requester: User;
  recipient: User;
  job?: import("@/lib/types").Job;
};

export type AdminMetrics = {
  members: number;
  activeMembers: number;
  openJobs: number;
  pendingRequests: number;
  upcomingEvents: number;
  verifiedAlumni?: number;
  totalReferrals?: number;
  hiredThroughReferrals?: number;
};
