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
  postedBy?: string;
  postedByBatch?: string;
  remote?: boolean;
};

export type EventItem = {
  id: string;
  month: string;
  day: string;
  title: string;
  detail: string;
  place: string;
  startsAt?: string;
  capacity?: number;
  attending?: number;
  category?: "reunion" | "meetup" | "webinar" | "career";
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  author: string;
  role: string;
  date: string;
  category?: string;
  pinned?: boolean;
  pinnedAt?: string;
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

export const recommendedAlumni: Alumni[] = [
  { id: "al-priya", name: "Priya Raman", email: "satyam.cv11@gmail.com", batch: "2018", company: "Northstar Labs", role: "Product Designer", location: "New York, NY", initials: "PR", match: 94, headline: "Designs tools that make everyday work more human.", department: "Design", isMentor: true, isVerified: true, skills: ["Product Design", "Figma", "User Research"] },
  { id: "al-marcus", name: "Marcus Chen", email: "satyam.cv11@gmail.com", batch: "2016", company: "Fieldwork", role: "Strategy Lead", location: "Chicago, IL", initials: "MC", match: 87, headline: "Strategy for mission-driven teams.", department: "Business", isMentor: true, isVerified: true, skills: ["Strategy", "Operations", "Leadership"] },
  { id: "al-elena", name: "Elena Torres", email: "satyam.cv11@gmail.com", batch: "2020", company: "Morrow Health", role: "Data Scientist", location: "Austin, TX", initials: "ET", match: 81, headline: "Translates messy data into clear decisions.", department: "Engineering", isMentor: false, isVerified: true, skills: ["Python", "Machine Learning", "Data Analysis"] },
  { id: "al-jon", name: "Jon Bell", email: "satyam.cv11@gmail.com", batch: "2012", company: "Civic Studio", role: "Executive Director", location: "Boston, MA", initials: "JB", match: 76, headline: "Building community programs that scale.", department: "Nonprofits", isMentor: true, isVerified: true, skills: ["Nonprofit Management", "Fundraising", "Community Building"] },
  { id: "al-nina", name: "Nina Okafor", email: "satyam.cv11@gmail.com", batch: "2019", company: "Stripe", role: "Software Engineer", location: "San Francisco, CA", initials: "NO", match: 89, headline: "Building payments infrastructure for the internet.", department: "Engineering", isMentor: true, isVerified: true, skills: ["TypeScript", "React", "Node.js"] },
  { id: "al-raj", name: "Raj Patel", email: "satyam.cv11@gmail.com", batch: "2017", company: "Goldman Sachs", role: "VP Engineering", location: "New York, NY", initials: "RP", match: 72, headline: "Scaling fintech platforms.", department: "Engineering", isMentor: true, isVerified: true, skills: ["Java", "System Design", "Team Leadership"] },
];

export const jobs: Job[] = [
  { id: "job-1", title: "Associate Product Manager", company: "Northstar Labs", type: "Full-time", location: "New York / Hybrid", posted: "2d ago", referralAvailable: true, description: "Northstar is looking for a curious operator to help shape tools that make everyday work more human. You will work closely with design, research, and engineering.", postedBy: "Priya Raman", postedByBatch: "2018", remote: false },
  { id: "job-2", title: "Research Analyst", company: "Morrow Health", type: "Full-time", location: "Remote", posted: "4d ago", referralAvailable: true, description: "Join Morrow Health to analyse evidence that informs product and policy decisions across care teams.", postedBy: "Elena Torres", postedByBatch: "2020", remote: true },
  { id: "job-3", title: "Community Programs Fellow", company: "Fieldwork", type: "Internship", location: "Chicago, IL", posted: "1w ago", referralAvailable: false, description: "A summer fellowship supporting community-led research projects across Chicago.", postedBy: "Marcus Chen", postedByBatch: "2016", remote: false },
  { id: "job-4", title: "Content Design Intern", company: "Civic Studio", type: "Internship", location: "Remote", posted: "2w ago", referralAvailable: false, description: "Write and shape the public-facing voice of Civic Studio programs.", postedBy: "Jon Bell", postedByBatch: "2012", remote: true },
  { id: "job-5", title: "Senior Frontend Engineer", company: "Stripe", type: "Full-time", location: "San Francisco, CA", posted: "3d ago", referralAvailable: true, description: "Build the next generation of payment experiences. Work with TypeScript, React, and cutting-edge web APIs.", postedBy: "Nina Okafor", postedByBatch: "2019", remote: false },
  { id: "job-6", title: "Data Analyst Intern", company: "Fieldwork", type: "Internship", location: "Chicago, IL", posted: "5d ago", referralAvailable: true, description: "Help analyze community research data and build dashboards for stakeholders.", postedBy: "Marcus Chen", postedByBatch: "2016", remote: false },
];

export const events: EventItem[] = [
  { id: "evt-1", month: "SEP", day: "06", title: "Designing your first five years", detail: "Virtual panel | 6:00 PM EST", place: "Online", startsAt: "2026-09-06T18:00:00-05:00", capacity: 200, attending: 142, category: "career" },
  { id: "evt-2", month: "SEP", day: "18", title: "Alumni studio night", detail: "Open house | 7:30 PM EST", place: "New York, NY", startsAt: "2026-09-18T19:30:00-05:00", capacity: 80, attending: 67, category: "meetup" },
  { id: "evt-3", month: "OCT", day: "10", title: "Fall Reunion Networking", detail: "Annual reunion | 5:00 PM EST", place: "Boston, MA", startsAt: "2026-10-10T17:00:00-05:00", capacity: 300, attending: 198, category: "reunion" },
  { id: "evt-4", month: "OCT", day: "22", title: "Tech Career Growth Webinar", detail: "Virtual workshop | 12:00 PM EST", place: "Online", startsAt: "2026-10-22T12:00:00-05:00", capacity: 500, attending: 312, category: "webinar" },
];

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Fall Reunion Registration Now Open",
    body: `We are thrilled to announce that registration for the **2026 Annual Alumni Fall Reunion** is officially open!

Key Highlights for this year:
- **Networking Mixer**: Connect with over 300+ alumni across tech, healthcare, and finance.
- **Keynote Panels**: Industry trends and leadership insights from distinguished alumni.
- **Campus & Lab Tours**: Explore the brand new Science & Engineering Pavilion.

Please review the [Full Reunion Schedule & RSVP Details](https://alumni.university.edu/reunion) to reserve your spot before **September 25, 2026**.`,
    author: "Dr. Sarah Williams",
    role: "Faculty",
    date: "Aug 15, 2026",
    category: "Reunion",
    pinned: true,
  },
  {
    id: "ann-2",
    title: "New 1-on-1 Mentorship Program Launch",
    body: `We are launching the **Fall 2026 Mentorship Cohort** connecting undergraduate students with seasoned alumni professionals.

### Program Timeline & Structure
1. **Application Period**: August 18 – August 31, 2026
2. **AI-Assisted Matching**: September 1 – September 5, 2026
3. **Orientation & Kickoff**: September 10, 2026

Interested mentors and mentees can apply directly on our [Mentorship Portal](/mentorship) or email <b>mentorship@alumni.university.edu</b> for inquiries.`,
    author: "Admin Team",
    role: "Administrator",
    date: "Aug 12, 2026",
    category: "Programs",
  },
  {
    id: "ann-3",
    title: "Campus Library & Career Resource Center Renovation Complete",
    body: `The extensive renovation of the <strong>University Memorial Library</strong> is now complete. The updated facility features:

<ul>
  <li><b>24/7 Dedicated Study Pods</b> with high-speed fiber connectivity</li>
  <li><b>Interview Prep Studios</b> equipped with studio lighting and 4K recording</li>
  <li><b>Alumni Career Resource Desk</b> with on-demand resume review resources</li>
</ul>

For booking guidelines and equipment access, visit the <a href="https://library.university.edu/spaces" target="_blank" rel="noopener noreferrer">Library Spaces Portal</a>.`,
    author: "Dr. James Park",
    role: "Faculty",
    date: "Aug 8, 2026",
    category: "Campus",
  },
  {
    id: "ann-4",
    title: "Annual Alumni Giving Day & Student Grant Initiative",
    body: `Thanks to the incredible generosity of our alumni community, this year's Giving Campaign raised over **$250,000** for student innovation grants!

Top funded student projects this semester:
- **EcoSense**: IoT environmental sensors for urban gardens
- **MediRoute**: Open-source medical transport logistics for rural communities
- **NeuroBridge**: Accessible assistive technology tools

Read more about the student teams in our [Spotlight Stories](/stories) and discover how you can contribute on the [Giving Page](/giving).`,
    author: "Alumni Relations Office",
    role: "Administrator",
    date: "Aug 1, 2026",
    category: "Giving",
  },
];

export const stories: Story[] = [
  { id: "story-1", title: "From campus volunteer to product lead", excerpt: "My alumni mentor helped me navigate the transition from a non-tech background into product management at a Series B startup. The referral made all the difference.", author: "Sarah Chen", authorInitials: "SC", batch: "2019", company: "Figma", role: "Product Manager", date: "Aug 10, 2026", status: "published" },
  { id: "story-2", title: "How a coffee chat changed my career", excerpt: "I reached out to an alumna in UX research through the platform. That one conversation led to an internship, which turned into a full-time role.", author: "David Park", authorInitials: "DP", batch: "2022", company: "Google", role: "UX Researcher", date: "Aug 5, 2026", status: "published" },
  { id: "story-3", title: "Building a startup with alumni support", excerpt: "Three alumni invested time and resources into my startup idea. Their guidance on fundraising and product-market fit was invaluable.", author: "Maria Santos", authorInitials: "MS", batch: "2017", company: "GreenTech Solutions", role: "Founder & CEO", date: "Jul 28, 2026", status: "published" },
  { id: "story-4", title: "Switching careers at 30", excerpt: "I was nervous about leaving finance for healthcare tech, but my alumni network connected me with the right people to make the jump.", author: "Alex Kim", authorInitials: "AK", batch: "2015", company: "Morrow Health", role: "Product Lead", date: "Aug 14, 2026", status: "pending" },
];

export const notifications: Notification[] = [
  { id: "not-1", title: "Mentorship Request Accepted", body: "Priya Raman accepted your mentorship request", time: "2m ago", read: false, type: "mentorship" },
  { id: "not-2", title: "New Event", body: "Fall Reunion Networking Night — Oct 10", time: "1h ago", read: false, type: "event" },
  { id: "not-3", title: "Referral Update", body: "Your referral request for Northstar Labs was viewed", time: "3h ago", read: true, type: "referral" },
  { id: "not-4", title: "Welcome!", body: "Welcome to PRO ALUMN v0.1", time: "1d ago", read: true, type: "system" },
  { id: "not-5", title: "New Connection", body: "Nina Okafor endorsed you for TypeScript", time: "5h ago", read: false, type: "mentorship" },
];

export const chatThreads: ChatThread[] = [
  { id: "chat-1", name: "Priya Raman", initials: "PR", lastMessage: "I'd love to help with your portfolio review!", time: "2m ago", unread: 2, isGroup: false },
  { id: "chat-2", name: "Design Career Panel", initials: "DC", lastMessage: "Elena: The recording will be shared tomorrow", time: "1h ago", unread: 0, isGroup: true },
  { id: "chat-3", name: "Marcus Chen", initials: "MC", lastMessage: "Let me know when you're free for a call", time: "3h ago", unread: 1, isGroup: false },
  { id: "chat-4", name: "Fall Reunion Planning", initials: "FR", lastMessage: "Jon: I've booked the venue", time: "1d ago", unread: 0, isGroup: true },
  { id: "chat-5", name: "Nina Okafor", initials: "NO", lastMessage: "Check out this React pattern", time: "2d ago", unread: 0, isGroup: false },
];

export const mentorshipRequests: MentorshipRequest[] = [
  { id: "mr-1", studentName: "Alex Kim", studentInitials: "AK", batch: "2024", message: "Hi! I'm interested in transitioning into product design. Would love your guidance on building a portfolio.", status: "pending", area: "Career Advice", createdAt: "2h ago" },
  { id: "mr-2", studentName: "Jordan Lee", studentInitials: "JL", batch: "2025", message: "I have an upcoming interview at Google and would appreciate mock interview practice.", status: "pending", area: "Interview Prep", createdAt: "1d ago" },
  { id: "mr-3", studentName: "Sam Rivera", studentInitials: "SR", batch: "2024", message: "Looking for advice on applying to grad schools for CS. Any tips on SOP writing?", status: "accepted", area: "Higher Studies", createdAt: "3d ago" },
];

export function getAlumniById(id: string) {
  return recommendedAlumni.find((alumni) => alumni.id === id);
}

export function getJobById(id: string) {
  return jobs.find((job) => job.id === id);
}

export function getEventById(id: string) {
  return events.find((event) => event.id === id);
}

export const adminMetrics = {
  members: 1247,
  activeMembers: 892,
  openJobs: 24,
  pendingRequests: 18,
  upcomingEvents: 6,
  verifiedAlumni: 456,
  totalReferrals: 234,
  hiredThroughReferrals: 89,
};
