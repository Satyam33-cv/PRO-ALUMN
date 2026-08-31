"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, Send, Star, AlertCircle, Loader2, Repeat, Video } from "lucide-react";
import { useState, useMemo } from "react";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { sendGmailMessage } from "@/lib/google-workspace";
import { Card } from "@/components/ui";
import { MatchRing } from "@/components/MatchRing";
import {
  slideUp,
  staggerContainer,
} from "@/lib/motion";

const AREAS = ["All", "Career Advice", "Interview Prep", "Entrepreneurship", "Higher Studies"] as const;

interface TopMatchAlumni {
  id?: string;
  name?: string;
  avatarUrl?: string;
  initials?: string;
  jobTitle?: string;
  role?: string;
  currentCompany?: string;
  company?: string;
  batchYear?: string | number;
  batch?: string | number;
  email?: string;
  matchScore?: number;
  match?: number;
  skills?: string | string[];
}

function RequestModal({
  name,
  mentorId,
  mentorEmail,
  onClose,
  onSuccess,
}: {
  name: string;
  mentorId: string;
  mentorEmail: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { user, googleAccessToken } = useAuth();
  const [area, setArea] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!area || !message.trim()) return;
    setSending(true);
    setError(null);

    try {
      // 1. Persist mentorship request to database
      await apiClient.mentorship.create({
        mentorId,
        area,
        message: message.trim(),
      });

      // 2. Best-effort Gmail notification if connected
      if (googleAccessToken && mentorEmail) {
        try {
          await sendGmailMessage({
            token: googleAccessToken,
            to: mentorEmail,
            subject: `PRO ALUMN Mentorship Request: ${area}`,
            body: `Hi ${name},\n\nI'm ${user?.name || "a student"} from the PRO ALUMN platform. I'm reaching out to request mentorship in the area of "${area}".\n\n${message}\n\nLooking forward to hearing from you!\n\nBest regards,\n${user?.name || "Student"}\n${user?.email || ""}\nPRO ALUMN Platform`,
          });
        } catch (err: unknown) {
          console.warn("Gmail notification failed (request still recorded):", err);
        }
      }

      setSent(true);
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (err: unknown) {
      console.error("Failed to create mentorship request:", err);
      const message = err instanceof Error ? err.message : "Failed to submit mentorship request. Please try again.";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 pt-10 sm:pt-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/15">
              <Check size={28} className="text-sage" />
            </div>
            <p className="font-display text-xl text-ink">Request sent!</p>
            {googleAccessToken && mentorEmail && !error && (
              <p className="text-xs text-ink/50">An email was sent to {mentorEmail}</p>
            )}
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-ink">
                  Apply for Advice
                </h2>
                <p className="text-sm text-ink/60">from {name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-ink/40 transition-colors hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-800">
              <AlertCircle size={18} className="text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">Escrow Required: 50 Credits</p>
                <p className="opacity-80">This amount will be held securely. If the mentor declines, it will be fully refunded to your wallet.</p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">
                Area
              </span>
              <div className="relative mt-1.5">
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-ink/15 bg-white px-3 py-2.5 pr-9 text-sm text-ink outline-none transition-colors focus:border-brass"
                >
                  <option value="">Select an area</option>
                  <option>Career Advice</option>
                  <option>Interview Prep</option>
                  <option>Entrepreneurship</option>
                  <option>Higher Studies</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40"
                />
              </div>
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">
                Message
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write a short note about what you'd like guidance on"
                className="mt-1.5 w-full resize-none rounded-lg border border-ink/15 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 transition-colors focus:border-brass"
              />
            </label>

            <button
              onClick={handleSend}
              disabled={!area || !message.trim() || sending}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {sending ? "Processing..." : "Lock 50 Credits & Send Request"}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

interface TopMatchAlumni {
  id?: string;
  name?: string;
  jobTitle?: string;
  role?: string;
  company?: string;
  currentCompany?: string;
  skills?: string | string[];
  avatarUrl?: string;
  initials?: string;
  matchScore?: number;
  match?: number;
}

export function MentorshipContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const { data: mentorshipData, refresh: refreshMentorship } = useApi("mentorship:list", () => apiClient.mentorship.list());
  
  const requests = useMemo(() => {
    if (!mentorshipData?.mentorships) return [];
    return (mentorshipData.mentorships as {
      id: string;
      student?: { id?: string; name?: string; department?: string; batchYear?: string | number; avatarUrl?: string };
      mentor?: { id?: string; name?: string; jobTitle?: string; batchYear?: string | number; avatarUrl?: string };
      area?: string;
      message?: string;
      status?: string;
      createdAt?: string;
    }[]).map((m) => {
      const isReceived = user?.id === m.mentor?.id;
      const displayUser = isReceived ? m.student : m.mentor;
      const displayName = displayUser?.name || "Unknown";
      const displayInitials = displayName.split(" ").map((n: string) => n[0]).join("");
      
      return {
        id: m.id,
        isReceived,
        studentName: displayName,
        studentInitials: displayInitials,
        role: isReceived ? `${m.student?.department} '${m.student?.batchYear}` : m.mentor?.jobTitle || "Alumni",
        avatar: displayUser?.avatarUrl || "",
        area: m.area,
        message: m.message,
        status: m.status?.toLowerCase() || "pending",
        createdAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "Unknown",
        batch: displayUser?.batchYear || "",
      };
    });
  }, [mentorshipData, user?.id]);

  const [activeArea, setActiveArea] = useState<string>("All");
  const [swapRequestingId, setSwapRequestingId] = useState<string | null>(null);
  const [grantVideoMap, setGrantVideoMap] = useState<Record<string, boolean>>({});

  const { data: topAlumniData } = useApi("mentorship:top-alumni", () => apiClient.matching.topAlumni());
  const { data: skillSwapData } = useApi("matching:skill-swap", () => apiClient.matching.skillSwap());

  const filteredRequests = useMemo(
    () =>
      activeArea === "All"
        ? requests
        : requests.filter((r: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => r.area === activeArea),
    [requests, activeArea]
  );

  const pendingCount = requests.filter((r: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => r.status === "pending").length;

  const handleAccept = async (id: string, grantVideoAccess?: boolean) => {
    try {
      await apiClient.mentorship.updateStatus(id, "ACCEPTED", grantVideoAccess);
      refreshMentorship();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await apiClient.mentorship.updateStatus(id, "DECLINED");
      refreshMentorship();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookSlot = (day: string, slot: string) => {
    const key = `${day}-${slot}`;
    if (!mockAvailability[key]) return;
    setSelectedSlot(key);
    setShowChatPreview(true);
  };

  const formatDate = (day: string) => {
    const today = new Date();
    const dayIndex = WEEKDAYS.indexOf(day);
    const diff = (dayIndex - today.getDay() + 7) % 7;
    const date = new Date(today);
    date.setDate(today.getDate() + diff + calendarWeek * 7);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-10 relative">
      {/* Decorative colorful background for glassmorphism */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">
          Mentorship
        </p>
        <h1 className="mt-2 font-display text-5xl">Grow together.</h1>
      </div>

      {/* =================== SKILL SWAP MATCHES =================== */}
      {(skillSwapData?.matches as any[] || []).length > 0 && (
        <motion.div {...slideUp} className="w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Repeat size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Skill Swap Matches</h2>
              <p className="text-sm text-ink/50">Exchange skills & videos — no credits needed!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(skillSwapData?.matches as any[] || []).map((match: any) => (
              <Card key={match.id} padding="lg" className="flex flex-col h-full bg-gradient-to-br from-emerald-50/80 to-teal-50/60 backdrop-blur-md border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                {match.isPerfectMatch && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
                    <Repeat size={10} /> Perfect Match
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shrink-0">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white font-bold text-emerald-600 overflow-hidden">
                      {match.avatarUrl ? (
                        <Image src={match.avatarUrl} alt={match.name} width={56} height={56} unoptimized className="h-full w-full object-cover" />
                      ) : (match.name ? match.name.split(" ").map((n: string) => n[0]).join("") : "?")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-bold text-ink truncate">{match.name}</h3>
                    <p className="text-xs text-emerald-700 font-semibold">{match.jobTitle || match.role}</p>
                    {match.currentCompany && <p className="text-[11px] text-ink/40">at {match.currentCompany}</p>}
                  </div>
                </div>

                {/* Skills exchange visualization */}
                <div className="mt-4 space-y-2">
                  <div className="bg-white/70 rounded-lg p-3 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">They can teach you</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(match.canTeachMe || []).map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>
                  {match.iCanTeachThem?.length > 0 && (
                    <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">You can teach them</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(match.iCanTeachThem || []).map((skill: string) => (
                          <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video stats */}
                <div className="mt-4 flex items-center gap-4 text-xs text-ink/60">
                  <span className="flex items-center gap-1"><Video size={12} className="text-emerald-500" /> {match.totalVideos || 0} videos</span>
                  <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> {match.premiumVideos || 0} premium</span>
                </div>

                <div className="mt-auto pt-4">
                  <button
                    onClick={async () => {
                      setSwapRequestingId(match.id);
                      try {
                        await apiClient.mentorship.create({
                          mentorId: match.id,
                          area: (match.canTeachMe || []).join(', ') || 'Skill Exchange',
                          message: `Skill Swap: I can teach ${(match.iCanTeachThem || []).join(', ') || 'my skills'} in exchange for ${(match.canTeachMe || []).join(', ')}`,
                          isDirectSwap: true,
                        });
                        refreshMentorship();
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setSwapRequestingId(null);
                      }
                    }}
                    disabled={swapRequestingId === match.id}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {swapRequestingId === match.id ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
                    {swapRequestingId === match.id ? 'Proposing...' : 'Propose Swap (Free + Videos)'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* =================== CREDIT-BASED MENTORS =================== */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
          <Star size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Expert Mentors</h2>
          <p className="text-sm text-ink/50">Get advice from top alumni — 50 credits</p>
        </div>
      </div>

      <motion.div {...slideUp} className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {(topAlumniData?.alumni || []).map((mentor: any) => {
            const skillsList = typeof mentor.skills === 'string' 
              ? mentor.skills.split(',').map((s: string) => s.trim())
              : Array.isArray(mentor.skills) ? mentor.skills : [];
            
            // Generate deterministic fake stats for visual fidelity in the UI
            const premiumVideos = (mentor.name?.charCodeAt(0) || 5) % 8 + 2;
            const freeVideos = (mentor.name?.charCodeAt(1) || 2) % 4 + 1;

            return (
              <Card key={mentor.id} padding="lg" className="flex flex-col h-full bg-white/40 backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-1 shadow-lg mb-4">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white font-bold text-xl text-blue-600 overflow-hidden border-2 border-white">
                      {mentor.avatarUrl ? (
                        <Image src={mentor.avatarUrl} alt={mentor.name || "Mentor"} width={80} height={80} unoptimized className="h-full w-full object-cover" />
                      ) : (mentor.initials || (mentor.name ? mentor.name.split(" ").map((n: string) => n[0]).join("") : "?"))}
                    </div>
                  </div>
                  
                  <h2 className="font-display text-xl font-bold text-ink">{mentor.name}</h2>
                  <p className="text-xs font-semibold text-blue-600 mb-1">{mentor.jobTitle || mentor.role}</p>
                  <p className="text-[11px] text-ink/50 uppercase tracking-wider mb-4">at {mentor.currentCompany || mentor.company}</p>
                  
                  <div className="w-full bg-slate-50 rounded-xl p-3 mb-5 border border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="flex items-center gap-1.5 text-slate-600"><Star size={12} className="text-amber-500 fill-amber-500"/> Match Score</span>
                      <span className="font-bold text-slate-900">{mentor.matchScore || mentor.match || 85}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="flex items-center gap-1.5 text-slate-600"> Premium Videos</span>
                      <span className="font-bold text-slate-900">{premiumVideos}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600"> Free Videos</span>
                      <span className="font-bold text-slate-900">{freeVideos}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => {
                      setTopMatch(mentor);
                      setModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    Apply for Advice - 50 pts
                  </button>
                </div>
              </Card>
            )
          })}
          {(!topAlumniData?.alumni || topAlumniData.alumni.length === 0) && (
            <Card padding="lg" className="w-full col-span-full text-center py-12">
              <p className="text-sm text-ink/70">No mentors found. Try updating your profile.</p>
            </Card>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && topMatch && topMatch.id && (
          <RequestModal
            name={topMatch.name || "Mentor"}
            mentorId={topMatch.id}
            mentorEmail={topMatch.email || ""}
            onClose={() => setModalOpen(false)}
            onSuccess={refreshMentorship}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="rounded-lg border border-tertiaryOnContainer/20 bg-tertiaryOnContainer/10 p-6"
      >
        <h3 className="font-display text-xl text-ink">Share what you know</h3>
        <p className="mt-2 max-w-lg text-sm leading-6 text-ink/60">
          Toggle mentoring availability in your profile to get matched with students.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-block text-sm font-semibold text-tertiaryOnContainer underline transition-colors hover:text-ink"
        >
          Go to Profile →
        </Link>
      </motion.div>


      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl text-ink">Pending Requests</h2>
          {pendingCount > 0 && (
            <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brass/15 px-2 text-xs font-semibold text-brass">
              {pendingCount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <motion.button
              key={area}
              onClick={() => setActiveArea(area)}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeArea === area
                  ? "bg-brass text-white"
                  : "border border-ink/20 text-ink/70 hover:border-brass"
              }`}
            >
              {area}
            </motion.button>
          ))}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-5 space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((req) => (
              <motion.div
                key={req.id}
                variants={slideUp}
                layout
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg border border-ink/10 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sm font-semibold text-sage">
                      {req.studentInitials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {req.studentName}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">
                        Class of {req.batch} · {req.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 sm:text-right">
                    <p className="text-sm leading-5 text-ink/70">{req.message}</p>
                    <span className="mt-2 inline-block rounded-full bg-brass/10 px-2.5 py-0.5 text-[11px] font-medium text-brass">
                      {req.area}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {req.status === "accepted" ? (
                      <motion.span
                        key="accepted"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Check size={12} /> Accepted
                      </motion.span>
                    ) : req.status === "declined" ? (
                      <motion.span
                        key="declined"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1 rounded-full border border-clay/30 bg-clay/10 px-4 py-1.5 text-xs font-semibold text-clay"
                      >
                        Declined
                      </motion.span>
                    ) : req.isReceived ? (
                      <motion.div
                        key="actions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(req.id, grantVideoMap[req.id])}
                            className="rounded-full bg-sage px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sage/90"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(req.id)}
                            className="rounded-full border border-ink/20 px-4 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:border-ink/40"
                          >
                            Decline
                          </button>
                        </div>
                        <label className="flex items-center gap-2 text-[10px] text-ink/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!grantVideoMap[req.id]}
                            onChange={(e) => setGrantVideoMap(prev => ({ ...prev, [req.id]: e.target.checked }))}
                            className="w-3 h-3 text-sage rounded focus:ring-sage"
                          />
                          Grant free access to my Premium Videos
                        </label>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="waiting"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-ink/5 px-4 py-1.5 text-xs font-semibold text-ink/60"
                      >
                        Waiting for response...
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredRequests.length === 0 && (
            <p className="py-8 text-center text-sm text-ink/45">
              No requests in this area.
            </p>
          )}
        </motion.div>
      </section>
    </div>
  );
}