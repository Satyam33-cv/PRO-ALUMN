"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundPattern } from "@/components/ui/Layout/BackgroundPattern";
import { ScrollReveal } from "@/components/ui/Layout/ScrollReveal";
import {
  BriefcaseBusiness,
  GraduationCap,
  Calendar,
  Megaphone,
  ArrowRight,
  Clock,
  Users,
  Briefcase,
  Send,
  Sparkles,
  Target,
  Award,
  Pin,
  Flame,
  CheckCircle2,
  Coins,
  ShieldCheck,
  X,
  FileText,
  StickyNote,
  Video,
  Download,
  Check,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { staggerContainer } from "@/lib/motion";
import { Card, Badge as UiBadge } from "@/components/ui";
import { AnnouncementBody } from "@/components/AnnouncementBody";

interface HomeJob {
  id: string;
  title: string;
  company: string;
  location?: string;
  status?: string;
  referrals?: Array<{
    id: string;
    requestedBy?: { name?: string; email?: string; department?: string; rollNumber?: string; resumeUrl?: string };
    resumeUrl?: string;
    note?: string;
    studentNote?: string;
    status?: string;
  }>;
}

interface HomeMentorship {
  id: string;
  student?: { name?: string; department?: string; rollNumber?: string };
  area?: string;
  message?: string;
  status?: string;
}

interface HomeAlumni {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
  batchYear?: string | number;
  batch?: string | number;
  department?: string;
  jobTitle?: string;
  role?: string;
  currentCompany?: string;
  company?: string;
  location?: string;
}

interface HomeAnnouncement {
  id: string;
  title: string;
  body?: string;
  content?: string;
  isPinned?: boolean;
  pinned?: boolean;
  createdAt?: string;
}

export const HomeContent = memo(function HomeContent() {
  const { user } = useAuth();
  const [verifyingJob, setVerifyingJob] = useState(false);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);
  const [nudgeSuccess, setNudgeSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Queries
  const { data: alumniData } = useApi("home:alumni", () => apiClient.alumni.list(undefined, { filter: "role", value: "ALUMNI" }));
  const { data: announcementsData } = useApi("home:announcements", () => apiClient.announcements.list());
  const { data: topAlumniData } = useApi("home:top-alumni", () => apiClient.matching.topAlumni(), { enabled: user?.role === "student" });
  const { data: gamificationData, reload: reloadGamification } = useApi("home:gamification", () => apiClient.gamification.getStatus());
  const { data: myJobsData, reload: reloadMyJobs } = useApi("home:my-jobs", () => apiClient.jobs.myPostings(), { enabled: user?.role === "alumni" || user?.role === "admin" });
  const { data: mentorshipData, reload: reloadMentorship } = useApi("home:mentorship", () => apiClient.mentorship.list(), { enabled: user?.role === "faculty" || user?.role === "alumni" });

  const announcements = (announcementsData as unknown as HomeAnnouncement[]) || [];
  const myJobs = (myJobsData?.jobs as unknown as HomeJob[]) || [];
  const mentorships = (mentorshipData?.mentorships as unknown as HomeMentorship[]) || [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const recommendedAlumni = (user?.role === "student" && topAlumniData?.alumni 
    ? (topAlumniData.alumni as unknown as HomeAlumni[]) 
    : ((alumniData || []) as unknown as HomeAlumni[]));

  if (!user) return null;
  const firstName = user.name.split(" ")[0];
  const userRole = (user.role || "student").toLowerCase();

  const handleVerifyJob = async () => {
    setVerifyingJob(true);
    try {
      const res = await apiClient.gamification.verifyJob();
      setNudgeSuccess(res.message);
      reloadGamification();
      setTimeout(() => setNudgeSuccess(null), 5000);
    } catch (err) {
      console.error("Job verify error:", err);
    } finally {
      setVerifyingJob(false);
    }
  };

  // Alumni candidate hiring action
  const handleUpdateApplicant = async (jobId: string, reqId: string, status: string) => {
    try {
      await apiClient.jobs.updateApplicantStatus(jobId, reqId, status);
      showToast(`Candidate status marked as ${status}!`);
      reloadMyJobs();
      reloadGamification();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update candidate status";
      showToast(message);
    }
  };

  // Faculty mentorship response
  const handleMentorshipAction = async (id: string, status: string) => {
    try {
      await apiClient.mentorship.updateStatus(id, status);
      showToast(`Mentorship request ${status.toLowerCase()}!`);
      reloadMentorship();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update mentorship";
      showToast(message);
    }
  };

  const activeNudges = (gamificationData?.freshness?.nudges || []).filter(
    (n) => !dismissedNudges.includes(n.id)
  );

  return (
    <>
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <BackgroundPattern color="blue" speed={30} className="absolute -top-20 left-0 right-0 h-40 opacity-20 pointer-events-none" />
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-10 relative"
        >
          {/* ================= HERO WELCOME BANNER ================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b border-ink/10 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-bold">
                  {userRole.toUpperCase()} DASHBOARD
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-500">{user.department || "Somaiya Vidyavihar"}</span>
              </div>
              <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back, {firstName} 👋
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {userRole === "student" && "Explore alumni referrals, upcoming hackathons, and Google collaborative workspace."}
                {userRole === "faculty" && "Manage student mentorship sessions, office hours, and academic collaborative tools."}
                {userRole === "alumni" && "Post jobs, review student applicants, hire talent, and guide fellow students."}
                {userRole === "admin" && "Monitor platform health, verify new registrations, and manage broadcasts."}
              </p>
            </div>

            {/* Header Gamification Badge */}
            <div className="flex items-center gap-3">
              <Link
                href="/rewards"
                className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:scale-105 transition-all shadow-xs"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-base shadow-xs">
                  <Flame size={18} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">Streak</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {gamificationData?.streak?.current || 1} Days
                  </p>
                </div>
              </Link>

              <Link
                href="/wallet"
                className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:scale-105 transition-all shadow-xs"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-xs">
                  <Coins size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">Points</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {gamificationData?.totalPoints || 50} pts
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* ================= SMART PROFILE NUDGE BANNER ================= */}
          {nudgeSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-emerald-500" />
                <span>{nudgeSuccess}</span>
              </div>
              <button onClick={() => setNudgeSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
                <X size={16} />
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {activeNudges.length > 0 && (
              <div className="space-y-3">
                {activeNudges.map((nudge) => (
                  <motion.div
                    key={nudge.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                          {nudge.type === "JOB_UPDATE" || nudge.type === "ANNIVERSARY" ? (
                            <Briefcase size={20} />
                          ) : nudge.type === "SEMESTER_UPDATE" ? (
                            <GraduationCap size={20} />
                          ) : (
                            <Sparkles size={20} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {nudge.title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                              +{nudge.points} pts
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {nudge.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {nudge.type === "JOB_UPDATE" && (
                          <button
                            onClick={handleVerifyJob}
                            disabled={verifyingJob}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            {verifyingJob ? "Verifying..." : "Confirm Still Here"}
                          </button>
                        )}
                        <Link
                          href={nudge.actionHref}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
                        >
                          {nudge.actionLabel}
                          <ArrowRight size={13} />
                        </Link>
                        <button
                          onClick={() => setDismissedNudges((prev) => [...prev, nudge.id])}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Dismiss"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* ================= ROLE-SPECIFIC QUICK PORTALS ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-blue-600" />
                Quick Launch Portals
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {userRole === "student" && (
                <>
                  <Link href="/referrals" className="p-4 rounded-2xl border border-ink/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center group">
                    <Target size={24} className="mx-auto text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Referral Tracker</p>
                    <p className="text-[10px] text-slate-500">Kanban & outreach</p>
                  </Link>
                  <Link href="/jobs" className="p-4 rounded-2xl border border-ink/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center group">
                    <BriefcaseBusiness size={24} className="mx-auto text-blue-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Job Finder</p>
                    <p className="text-[10px] text-slate-500">1-click referrals</p>
                  </Link>
                  <Link href="/directory" className="p-4 rounded-2xl border border-ink/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center group">
                    <Users size={24} className="mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Alumni Directory</p>
                    <p className="text-[10px] text-slate-500">2.4k+ mentors</p>
                  </Link>
                  <Link href="/calendar" className="p-4 rounded-2xl border border-ink/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all text-center group">
                    <Calendar size={24} className="mx-auto text-purple-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Campus Events</p>
                    <p className="text-[10px] text-slate-500">Google Calendar</p>
                  </Link>
                  <Link href="/docs" className="p-4 rounded-2xl border border-ink/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center group">
                    <FileText size={24} className="mx-auto text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Google Docs</p>
                    <p className="text-[10px] text-slate-500">Resume editor</p>
                  </Link>
                  <Link href="/stories" className="p-4 rounded-2xl border border-ink/10 hover:border-rose-500 hover:bg-rose-500/5 transition-all text-center group">
                    <Sparkles size={24} className="mx-auto text-rose-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Success Stories</p>
                    <p className="text-[10px] text-slate-500">Alumni journeys</p>
                  </Link>
                </>
              )}

              {userRole === "faculty" && (
                <>
                  <Link href="/mentorship" className="p-4 rounded-2xl border border-ink/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all text-center group">
                    <GraduationCap size={24} className="mx-auto text-purple-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Student Mentorship</p>
                    <p className="text-[10px] text-slate-500">{mentorships.length} active sessions</p>
                  </Link>
                  <Link href="/profile" className="p-4 rounded-2xl border border-ink/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center group">
                    <Video size={24} className="mx-auto text-blue-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Google Meet</p>
                    <p className="text-[10px] text-slate-500">Schedule office hrs</p>
                  </Link>
                  <Link href="/docs" className="p-4 rounded-2xl border border-ink/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center group">
                    <FileText size={24} className="mx-auto text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Research Docs</p>
                    <p className="text-[10px] text-slate-500">Google Drive sync</p>
                  </Link>
                  <Link href="/keep" className="p-4 rounded-2xl border border-ink/10 hover:border-amber-500 hover:bg-amber-500/5 transition-all text-center group">
                    <StickyNote size={24} className="mx-auto text-amber-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Mentoring Memos</p>
                    <p className="text-[10px] text-slate-500">Google Keep</p>
                  </Link>
                  <Link href="/directory" className="p-4 rounded-2xl border border-ink/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center group">
                    <Users size={24} className="mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Student Directory</p>
                    <p className="text-[10px] text-slate-500">Department roster</p>
                  </Link>
                  <Link href="/announcements" className="p-4 rounded-2xl border border-ink/10 hover:border-rose-500 hover:bg-rose-500/5 transition-all text-center group">
                    <Megaphone size={24} className="mx-auto text-rose-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Announcements</p>
                    <p className="text-[10px] text-slate-500">Notices</p>
                  </Link>
                </>
              )}

              {userRole === "alumni" && (
                <>
                  <Link href="/jobs" className="p-4 rounded-2xl border border-ink/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center group">
                    <BriefcaseBusiness size={24} className="mx-auto text-blue-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Post a Job</p>
                    <p className="text-[10px] text-slate-500">Earn +50 pts</p>
                  </Link>
                  <Link href="/mentorship" className="p-4 rounded-2xl border border-ink/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all text-center group">
                    <GraduationCap size={24} className="mx-auto text-purple-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Mentorship Hub</p>
                    <p className="text-[10px] text-slate-500">Earn +40 pts</p>
                  </Link>
                  <Link href="/stories" className="p-4 rounded-2xl border border-ink/10 hover:border-rose-500 hover:bg-rose-500/5 transition-all text-center group">
                    <Sparkles size={24} className="mx-auto text-rose-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Share Story</p>
                    <p className="text-[10px] text-slate-500">Inspire students</p>
                  </Link>
                  <Link href="/newsletter" className="p-4 rounded-2xl border border-ink/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center group">
                    <BookOpen size={24} className="mx-auto text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Somaiya Sparsh</p>
                    <p className="text-[10px] text-slate-500">Magazine archive</p>
                  </Link>
                  <Link href="/rewards" className="p-4 rounded-2xl border border-ink/10 hover:border-amber-500 hover:bg-amber-500/5 transition-all text-center group">
                    <Flame size={24} className="mx-auto text-amber-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Rewards Hub</p>
                    <p className="text-[10px] text-slate-500">Badges & rank</p>
                  </Link>
                  <Link href="/directory" className="p-4 rounded-2xl border border-ink/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center group">
                    <Users size={24} className="mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Batch Directory</p>
                    <p className="text-[10px] text-slate-500">Find classmates</p>
                  </Link>
                </>
              )}

              {userRole === "admin" && (
                <>
                  <Link href="/admin" className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-center group">
                    <ShieldCheck size={24} className="mx-auto text-blue-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Command Center</p>
                    <p className="text-[10px] text-blue-600 font-bold">Super Admin</p>
                  </Link>
                  <Link href="/announcements" className="p-4 rounded-2xl border border-ink/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all text-center group">
                    <Megaphone size={24} className="mx-auto text-purple-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Broadcasts</p>
                    <p className="text-[10px] text-slate-500">Send alerts</p>
                  </Link>
                  <Link href="/directory" className="p-4 rounded-2xl border border-ink/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center group">
                    <Users size={24} className="mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">All Members</p>
                    <p className="text-[10px] text-slate-500">Verify & manage</p>
                  </Link>
                  <Link href="/jobs" className="p-4 rounded-2xl border border-ink/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center group">
                    <BriefcaseBusiness size={24} className="mx-auto text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Job Board</p>
                    <p className="text-[10px] text-slate-500">Moderation</p>
                  </Link>
                  <Link href="/stories" className="p-4 rounded-2xl border border-ink/10 hover:border-rose-500 hover:bg-rose-500/5 transition-all text-center group">
                    <Sparkles size={24} className="mx-auto text-rose-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Story Approvals</p>
                    <p className="text-[10px] text-slate-500">Review submissions</p>
                  </Link>
                  <Link href="/newsletter" className="p-4 rounded-2xl border border-ink/10 hover:border-amber-500 hover:bg-amber-500/5 transition-all text-center group">
                    <BookOpen size={24} className="mx-auto text-amber-600 group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Somaiya Sparsh</p>
                    <p className="text-[10px] text-slate-500">Issue manager</p>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ================= ALUMNI RECRUITMENT & HIRING HUB ================= */}
          {(userRole === "alumni" || userRole === "admin") && myJobs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-2xl font-bold flex items-center gap-2">
                    <BriefcaseBusiness size={22} className="text-blue-600" />
                    My Recruitment & Candidate Hiring Hub
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review student applicants, hire candidates (+100 pts), and export all resumes in 1-click.
                  </p>
                </div>
                <Link
                  href="/jobs"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  + Post New Job
                </Link>
              </div>

              <div className="space-y-4">
                {myJobs.map((job) => (
                  <Card key={job.id} padding="lg" className="space-y-4 border-blue-200 dark:border-blue-900/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">{job.title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
                            {job.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{job.company} · {job.location} · {job.referrals?.length || 0} Applicants</p>
                      </div>

                      {/* 1-CLICK RESUME EXPORT BUTTON */}
                      <a
                        href={`/api/jobs/${job.id}/applicants/export`}
                        download
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
                        title="Download CSV with student roll numbers, emails, and direct resume links"
                      >
                        <Download size={14} />
                        Export All Resumes (CSV)
                      </a>
                    </div>

                    {/* Applicants List */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
                        Candidate Applicants ({job.referrals?.length || 0})
                      </p>

                      {job.referrals && job.referrals.length > 0 ? (
                        <div className="divide-y divide-ink/5 border border-ink/10 rounded-xl overflow-hidden">
                          {job.referrals.map((refReq) => (
                            <div key={refReq.id} className="p-3 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold">
                                  {refReq.requestedBy?.name?.split(" ").map((n: string) => n[0]).join("") || "S"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 dark:text-slate-100">{refReq.requestedBy?.name}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      refReq.status === "HIRED" ? "bg-emerald-500 text-white" :
                                      refReq.status === "ACCEPTED" ? "bg-blue-500/15 text-blue-600" :
                                      "bg-amber-500/15 text-amber-600"
                                    }`}>
                                      {refReq.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {refReq.requestedBy?.department} · Roll: {refReq.requestedBy?.rollNumber || "N/A"} · {refReq.requestedBy?.email}
                                  </p>
                                  {refReq.studentNote && (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-0.5">
                                      &ldquo;{refReq.studentNote}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {(refReq.resumeUrl || refReq.requestedBy?.resumeUrl) && (
                                  <a
                                    href={refReq.resumeUrl || refReq.requestedBy?.resumeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                                  >
                                    <FileText size={13} />
                                    Resume
                                  </a>
                                )}

                                {refReq.status !== "HIRED" && (
                                  <button
                                    onClick={() => handleUpdateApplicant(job.id, refReq.id, "HIRED")}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                  >
                                    <Check size={13} />
                                    Hire (+100 pts)
                                  </button>
                                )}

                                {refReq.status === "PENDING" && (
                                  <button
                                    onClick={() => handleUpdateApplicant(job.id, refReq.id, "ACCEPTED")}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-3">No applicants yet for this job posting.</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ================= FACULTY MENTORSHIP HUB ================= */}
          {userRole === "faculty" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-2xl font-bold flex items-center gap-2">
                    <GraduationCap size={22} className="text-purple-600" />
                    Faculty Student Mentorship Queue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review academic guidance and capstone project requests from students.
                  </p>
                </div>
              </div>

              {mentorships.length === 0 ? (
                <Card padding="lg" className="text-center py-8 text-slate-400 text-xs">
                  <CheckCircle2 size={28} className="mx-auto text-purple-500 mb-2" />
                  No pending student mentorship requests right now!
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorships.map((m) => (
                    <Card key={m.id} padding="lg" className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {m.student?.name || "Student"}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {m.student?.department || "CSE"} · Roll: {m.student?.rollNumber || "N/A"}
                          </p>
                        </div>
                        <UiBadge tone="neutral">{m.area || "Career Guidance"}</UiBadge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                        &ldquo;{m.message || "Requesting mentorship for capstone project & career roadmap."}&rdquo;
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                        {m.status === "PENDING" ? (
                          <>
                            <button
                              onClick={() => handleMentorshipAction(m.id, "DECLINED")}
                              className="px-3 py-1.5 rounded-xl border border-ink/15 text-xs font-bold hover:bg-slate-100"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleMentorshipAction(m.id, "ACCEPTED")}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs"
                            >
                              Accept & Schedule
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Accepted
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= STUDENT ACTIVE REFERRAL PIPELINE ================= */}
          {userRole === "student" && (
            <ScrollReveal direction="up">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                      <Target size={20} />
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl font-bold">Referral Request Tracking Pipeline</h2>
                      <p className="text-xs text-slate-500">Live 4-stage tracking from internal submission to hiring</p>
                    </div>
                  </div>
                  <Link
                    href="/referrals"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto"
                  >
                    Open Kanban Board <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link href="/referrals" className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">1. Pending</span>
                      <Clock size={15} className="text-amber-500" />
                    </div>
                    <p className="text-xl font-extrabold mt-1 text-slate-900 dark:text-slate-100 font-mono">3 Requests</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Awaiting alumni review</p>
                  </Link>

                  <Link href="/referrals" className="p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">2. Accepted</span>
                      <CheckCircle2 size={15} className="text-indigo-500" />
                    </div>
                    <p className="text-xl font-extrabold mt-1 text-slate-900 dark:text-slate-100 font-mono">2 Ready</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Send Job ID & highlights</p>
                  </Link>

                  <Link href="/referrals" className="p-3.5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono">3. Referred</span>
                      <Send size={15} className="text-cyan-500" />
                    </div>
                    <p className="text-xl font-extrabold mt-1 text-slate-900 dark:text-slate-100 font-mono">2 Active</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Submitted to recruiter</p>
                  </Link>

                  <Link href="/referrals" className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">4. Hired</span>
                      <Award size={15} className="text-emerald-500" />
                    </div>
                    <p className="text-xl font-extrabold mt-1 text-slate-900 dark:text-slate-100 font-mono">2 Offers</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Offer accepted (+100 pts)</p>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* ================= STUDENT: TOP AI ALUMNI MATCHES ================= */}
          {userRole === "student" && recommendedAlumni.length > 0 && (
            <ScrollReveal direction="up">
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-600">
                      Gemini 384-Dim Matching
                    </span>
                  </div>
                  <h2 className="font-heading text-3xl font-bold">Recommended Alumni Mentors</h2>
                </div>
                <Link
                  href="/directory"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  View full directory <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendedAlumni.slice(0, 6).map((alumni) => (
                  <Card
                    key={alumni.id}
                    padding="md"
                    className="flex flex-col group relative overflow-hidden border-border hover:border-blue-500/30 hover:shadow-cardHover transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 text-base font-bold">
                        {alumni.avatarUrl ? (
                          <Image src={alumni.avatarUrl} alt={alumni.name} width={48} height={48} unoptimized className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          alumni.initials || alumni.name.split(" ").map((n: string) => n[0]).join("")
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{alumni.name}</h3>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                          Class of {alumni.batchYear || alumni.batch} · {alumni.department}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {alumni.jobTitle || alumni.role} <span className="text-slate-400">at</span> <strong>{alumni.currentCompany || alumni.company}</strong>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock size={11} /> {alumni.location || "Bengaluru / Remote"}
                      </p>
                    </div>

                    <Link
                      href={`/directory/${alumni.id}`}
                      className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Connect & Request Referral
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* ================= CAMPUS ANNOUNCEMENTS ================= */}
          <ScrollReveal direction="up">
            <div className="mb-4 flex items-baseline justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600">
                  <Megaphone size={20} />
                </div>
                <h2 className="font-heading text-3xl font-bold">Institutional Announcements</h2>
              </div>
              <Link
                href="/announcements"
                className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
              >
                View all notices <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[...announcements]
                .sort((a, b) => (Boolean(a.isPinned || a.pinned) !== Boolean(b.isPinned || b.pinned) ? (a.isPinned || a.pinned ? -1 : 1) : 0))
                .slice(0, 2)
                .map((ann) => (
                  <Card
                    key={ann.id}
                    padding="md"
                    className={`group relative overflow-hidden transition-all duration-300 ${
                      ann.isPinned || ann.pinned
                        ? "border-blue-500/40 ring-1 ring-blue-500/20 bg-linear-to-br from-blue-500/5 to-transparent"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                        <Megaphone size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{ann.title}</h3>
                          {(ann.isPinned || ann.pinned) && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                              <Pin size={10} className="fill-amber-500 rotate-45" />
                              Pinned
                            </span>
                          )}
                        </div>
                        <AnnouncementBody content={ann.content || ann.body || ""} className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed" />
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </ScrollReveal>
        </motion.div>
      </div>

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
    </>
  );
});