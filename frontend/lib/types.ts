export type AlumniId = string;

export type Alumni = {
  id: AlumniId;
  name: string;
  email: string;
  batch: string;
  company: string;
  role: string;
  location: string;
  initials: string;
  match?: number;
  headline?: string;
  bio?: string;
  department?: string;
  isMentor?: boolean;
  isVerified?: boolean;
  skills?: string[];
  avatarUrl?: string;
  batchYear?: number;
  currentCompany?: string;
  jobTitle?: string;
  linkedinUrl?: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string;
  posted: string;
  referralAvailable?: boolean;
  description?: string;
  requirements?: string[];
  postedBy?: string;
  postedByBatch?: string;
  remote?: boolean;
};

export type EventItem = {
  id: string;
  month?: string;
  day?: string;
  title: string;
  detail?: string;
  place?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  capacity?: number;
  maxCapacity?: number | null;
  attending?: number;
  category?: "reunion" | "meetup" | "webinar" | "career";
  date?: string;
  mode?: string;
  hasRsvp?: boolean;
  isRegistered?: boolean;
};

export type EventAttendee = {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
  batchYear?: number | null;
  department?: string | null;
  currentCompany?: string | null;
  jobTitle?: string | null;
};

export type EventDetailItem = EventItem & {
  coverImage?: string | null;
  createdBy?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    currentCompany?: string | null;
    jobTitle?: string | null;
  };
  rsvps?: Array<{
    userId: string;
    user: EventAttendee;
  }>;
  _count?: {
    rsvps: number;
  };
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  author: string | { name: string };
  role?: string;
  date?: string;
  createdAt?: string;
  category?: string;
  pinned?: boolean;
  pinnedAt?: string;
  content?: string;
};

export type Story = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorInitials: string;
  batch: string;
  company: string;
  role: string;
  date: string;
  status: "published" | "pending" | "rejected";
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "referral" | "event" | "mentorship" | "system";
};

export type ChatThread = {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup: boolean;
};

export type MentorshipRequest = {
  id: string;
  studentName: string;
  studentInitials: string;
  batch: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  area: string;
  createdAt: string;
};
