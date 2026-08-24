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
  phone?: string;
  bio?: string;
  location?: string;
  company?: string;
  role?: string;
  batch?: string;
  skills?: string | string[];
  department?: string;
  jobTitle?: string;
  currentCompany?: string;
  batchYear?: number;
  linkedinUrl?: string;
  interests?: string;
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
  phone?: string;
  role?: "student" | "alumni" | "admin" | "faculty";
  batchYear?: number | string;
  department?: string;
  currentCompany?: string;
  jobTitle?: string;
  location?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  bio?: string;
  skills?: string;
  interests?: string;
  timeline?: any;
  resumeUrl?: string;
  currentStreak?: number;
  longestStreak?: number;
  totalPoints?: number;
  lastActiveDate?: string;
  lastProfileUpdate?: string;
  lastJobUpdate?: string;
  lastEducationUpdate?: string;
  lastProjectUpdate?: string;
  profileCompleteness?: number;
  freshness?: ProfileFreshness;
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

// =================== GAMIFICATION & PROFILE TRACKING ===================
export type Badge = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  requiredPts: number;
  isUnlocked?: boolean;
  unlockedAt?: string | null;
  progress?: number;
  _count?: {
    users: number;
  };
};

export type ActivityLog = {
  id: string;
  userId: string;
  actionType: string;
  pointsEarned: number;
  createdAt: string;
};

export type ProfileNudge = {
  id: string;
  type: "JOB_UPDATE" | "ANNIVERSARY" | "SEMESTER_UPDATE" | "SKILLS_UPDATE" | "COMPLETENESS";
  title: string;
  message: string;
  points: number;
  actionLabel: string;
  actionHref: string;
};

export type ProfileFreshness = {
  completeness: number;
  nudges: ProfileNudge[];
  isStale: boolean;
  lastJobUpdate?: string;
  lastEducationUpdate?: string;
  lastProjectUpdate?: string;
};

export type GamificationStatus = {
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
  };
  totalPoints: number;
  rank: number;
  completeness: number;
  freshness: ProfileFreshness;
  badges: Badge[];
  recentActivities: ActivityLog[];
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  department?: string;
  batchYear?: number;
  currentCompany?: string;
  jobTitle?: string;
  totalPoints: number;
  currentStreak: number;
  badges: Badge[];
};

// =================== NEWSLETTER ===================
export type Newsletter = {
  id: string;
  title: string;
  issueDate: string;
  year: number;
  coverImage: string;
  fileUrl: string;
  createdAt?: string;
  updatedAt?: string;
};

