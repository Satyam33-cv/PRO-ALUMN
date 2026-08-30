"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, ArrowRight, Send, Star, AlertCircle, Loader2 } from "lucide-react";
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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];


const mockAvailability: Record<string, boolean> = {
  "Mon-09:00": true,
  "Mon-10:00": true,
  "Mon-11:00": false,
  "Tue-14:00": true,
  "Tue-15:00": true,
  "Wed-10:00": true,
  "Wed-11:00": true,
  "Thu-14:00": false,
  "Thu-15:00": true,
  "Fri-09:00": true,
  "Fri-10:00": true,
};

const mockChatPreview = [
  { id: "c1", text: "Hi! I'd love some guidance on breaking into fintech.", time: "10:00 AM", sent: true },
  { id: "c2", text: "Great choice! What's your current background?", time: "10:05 AM", sent: false },
  { id: "c3", text: "I'm a CS grad, did some React internships.", time: "10:08 AM", sent: true },
  { id: "c4", text: "Perfect. Let's schedule a call to map out a plan.", time: "10:12 AM", sent: false },
];

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
              <h2 className="font-display text-xl text-ink">
                Request Mentorship from {name}
              </h2>
              <button
                onClick={onClose}
                className="p-1 text-ink/40 transition-colors hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
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
              className="mt-5 w-full rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-secondaryContainer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? "Sending email..." : "Send Request"}
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
  const [calendarWeek, setCalendarWeek] = useState<number>(0);
  const { data: mentorshipData, refresh: refreshMentorship } = useApi("mentorship:list", () => apiClient.mentorship.list());
  
  const requests = useMemo(() => {
    if (!mentorshipData?.mentorships) return [];
    return mentorshipData.mentorships.map((m: any) => {
      const studentName = m.student?.name || m.mentor?.name || "Unknown";
      const studentInitials = studentName.split(" ").map((n: string) => n[0]).join("");
      return {
        id: m.id,
        studentName,
        studentInitials,
        role: m.student ? `${m.student.department} '${m.student.batchYear}` : m.mentor?.jobTitle || "Alumni",
        avatar: m.student?.avatarUrl || m.mentor?.avatarUrl || "",
        area: m.area,
        message: m.message,
        status: m.status?.toLowerCase() || "pending",
        createdAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "Unknown",
        batch: m.student?.batchYear || m.mentor?.batchYear || "",
      };
    });
  }, [mentorshipData]);

  const [activeArea, setActiveArea] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState<string>("Mon");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showChatPreview, setShowChatPreview] = useState(false);

  const { data: topAlumniData } = useApi("mentorship:top-alumni", () => apiClient.matching.topAlumni());
  const topMatch = (topAlumniData?.alumni?.[0] || null) as unknown as TopMatchAlumni | null;

  const skillsList: string[] = typeof topMatch?.skills === 'string' 
    ? topMatch.skills.split(',').map((s: string) => s.trim())
    : Array.isArray(topMatch?.skills) ? topMatch.skills : [];

  const filteredRequests = useMemo(
    () =>
      activeArea === "All"
        ? requests
        : requests.filter((r: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => r.area === activeArea),
    [requests, activeArea]
  );

  const pendingCount = requests.filter((r: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => r.status === "pending").length;

  const handleAccept = async (id: string) => {
    try {
      await apiClient.mentorship.updateStatus(id, "ACCEPTED");
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
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">
          Mentorship
        </p>
        <h1 className="mt-2 font-display text-5xl">Grow together.</h1>
      </div>

      <motion.div {...slideUp}>
        {topMatch ? (
          <Card tone="dark" padding="lg" className="max-w-2xl">
            <p className="text-sm font-semibold text-brass">Top Match for You</p>
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brass font-semibold text-ink overflow-hidden">
                {topMatch.avatarUrl ? (
                  <Image src={topMatch.avatarUrl} alt={topMatch.name || "Match"} width={64} height={64} unoptimized className="h-full w-full object-cover" />
                ) : (topMatch.initials || (topMatch.name ? topMatch.name.split(" ").map((n: string) => n[0]).join("") : "?"))}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl text-paper">{topMatch.name}</h2>
                <p className="mt-1 text-sm text-paper/70">
                  {topMatch.jobTitle || topMatch.role} · {topMatch.currentCompany || topMatch.company}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
                  Class of {topMatch.batchYear || topMatch.batch}
                </p>
              </div>
              <div className="shrink-0">
                <MatchRing percentage={topMatch.matchScore || topMatch.match || 0} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {skillsList.slice(0, 3).map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-full bg-paper/10 px-3 py-1 text-xs text-paper/80"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-secondaryContainer"
              >
                Request Mentorship
              </button>
              <button
                onClick={async () => {
                  try {
                    setStartingChat(true);
                    const res = await apiClient.chat.createThread(topMatch.id);
                    if (res?.thread?.id) {
                      router.push(`/chat?thread=${res.thread.id}`);
                    } else {
                      router.push("/chat");
                    }
                  } catch (err) {
                    console.error("Failed to start chat:", err);
                    router.push("/chat");
                  } finally {
                    setStartingChat(false);
                  }
                }}
                disabled={startingChat}
                className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-paper/10 transition-colors disabled:opacity-50"
              >
                {startingChat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Message
              </button>
            </div>
          </Card>
        ) : (
          <Card tone="dark" padding="lg" className="max-w-2xl">
            <p className="text-sm text-paper/70">No top match found. Try updating your profile.</p>
          </Card>
        )}
      </motion.div>

      <AnimatePresence>
        {modalOpen && topMatch && (
          <RequestModal
            name={topMatch.name}
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
        <div>
          <h2 className="font-display text-2xl text-ink">Book a Session</h2>
          <p className="mt-1 text-sm text-ink/50">Select an available slot with your top match</p>
        </div>

        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCalendarWeek((w) => w - 1)}
                className="p-1 text-ink/40 hover:text-ink transition-colors"
                aria-label="Previous week"
              >
                <ChevronDown size={18} className="-rotate-90" />
              </button>
              <span className="font-mono text-xs uppercase tracking-wider text-ink/50">
                Week of {formatDate(WEEKDAYS[0])}
              </span>
              <button
                onClick={() => setCalendarWeek((w) => w + 1)}
                className="p-1 text-ink/40 hover:text-ink transition-colors"
                aria-label="Next week"
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {WEEKDAYS.slice(0, 5).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedDate === day
                      ? "bg-brass text-white"
                      : "text-ink/60 hover:bg-muted"
                  }`}
                >
                  {day}
                  <span className="font-mono text-[10px] text-ink/45">{formatDate(day)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-ink/10">
                <span className="w-20 shrink-0 font-mono text-xs text-ink/50">{slot}</span>
                {WEEKDAYS.slice(0, 5).map((day) => {
                  const key = `${day}-${slot}`;
                  const available = mockAvailability[key];
                  const booked = selectedSlot === key;
                  return (
                    <button
                      key={key}
                      onClick={() => available && handleBookSlot(day, slot)}
                      disabled={!available}
                      className={`flex-1 h-10 rounded-lg text-xs font-medium transition-all ${
                        booked
                          ? "bg-brass text-white"
                          : available
                          ? "bg-white border border-ink/10 hover:bg-brass/5 hover:border-brass"
                          : "bg-ink/5 text-ink/20 cursor-not-allowed"
                      }`}
                      aria-label={`${day} ${slot} ${available ? "Available" : "Booked"}`}
                    >
                      {booked ? "Booked ✓" : available ? "Available" : "—"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-ink">Chat Preview</h2>
            <p className="mt-1 text-sm text-ink/50">Preview your conversation before the session</p>
          </div>
          <button
            onClick={() => setShowChatPreview(!showChatPreview)}
            className="flex items-center gap-1 text-sm font-semibold text-brass hover:text-brass-600"
          >
            {showChatPreview ? "Collapse" : "Expand"}
            <ArrowRight size={14} />
          </button>
        </div>

        <AnimatePresence>
          {showChatPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card padding="lg" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/15 text-brass font-semibold text-sm overflow-hidden">
                      {topMatch?.avatarUrl ? (
                        <Image src={topMatch.avatarUrl} alt={topMatch?.name || "Match"} width={40} height={40} unoptimized className="h-full w-full object-cover" />
                      ) : (topMatch?.initials || (topMatch?.name ? topMatch.name.split(" ").map((n: string) => n[0]).join("") : "?"))}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{topMatch?.name || "Match"}</p>
                      <p className="text-xs text-ink/50">{topMatch?.jobTitle || topMatch?.role} at {topMatch?.currentCompany || topMatch?.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2 py-0.5 text-[10px] font-medium text-sage">
                      <Star size={10} /> {topMatch?.matchScore || topMatch?.match}% Match
                    </span>
                    <button
                      onClick={() => setShowChatPreview(false)}
                      className="p-1 text-ink/40 hover:text-ink"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {mockChatPreview.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${msg.sent ? "justify-end" : "justify-start"}`}
                    >
                      {!msg.sent && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass text-[10px] font-semibold">
                          {topMatch?.initials || (topMatch?.name ? topMatch.name.split(" ").map((n: string) => n[0]).join("") : "?")}
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          msg.sent
                            ? "bg-brass/10 text-ink"
                            : "bg-ink/5 text-ink"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="mt-1 font-mono text-[9px] text-ink/40">{msg.time}</p>
                      </div>
                      {msg.sent && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-[10px] font-semibold text-white">
                          You
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 border-t border-ink/10 pt-4">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-brass"
                  />
                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass text-white transition-colors hover:bg-ink">
                    <Send size={14} />
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

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
                        className="inline-flex items-center gap-1 rounded-full bg-sage px-4 py-1.5 text-xs font-semibold text-white"
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
                    ) : (
                      <motion.div
                        key="actions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2"
                      >
                        <button
                          onClick={() => handleAccept(req.id)}
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
                      </motion.div>
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