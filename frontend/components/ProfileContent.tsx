"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Pencil,
  ArrowRight,
  RefreshCw,
  Loader2,
  BookOpen,
  Heart,
  BookMarked,
  Settings,
  LogOut,
  Upload,
  X,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  CalendarPlus,
  Video,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, Badge, ProfileEditModal } from "@/components/ui";
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { createCalendarEvent } from "@/lib/google-workspace";

const timelineEntries = [
  {
    role: "Software Engineer",
    company: "Stripe",
    range: "2022 — Present",
  },
  {
    role: "Junior Developer",
    company: "Northstar Labs",
    range: "2020 — 2022",
  },
  {
    role: "Intern",
    company: "Fieldwork",
    range: "2019 — 2020",
  },
  {
    role: "B.S. Computer Science",
    company: "State University",
    range: "2016 — 2020",
  },
];

const achievements = [
  { label: "10 referrals given", tone: "success" as const },
  { label: "Top mentor 2025", tone: "accent" as const },
  { label: "Active since 2024", tone: "neutral" as const },
  { label: "5 mentees helped", tone: "warning" as const },
];

const quickLinks = [
  { label: "Mentorship Hub", href: "/mentorship", icon: BookOpen },
  { label: "Giving", href: "/giving", icon: Heart },
  { label: "Stories", href: "/stories", icon: BookMarked },
  { label: "Settings", href: "#", icon: Settings },
];

const DEFAULT_SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "GraphQL",
  "AWS",
  "Docker",
  "CI/CD",
];

function TimelineModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (event: { role: string; company: string; range: string }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({ role: "", company: "", range: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 pt-10 sm:pt-20 px-4 pb-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4 bg-paper/30">
          <h2 className="font-display text-xl text-ink">Add Timeline Event</h2>
          <button onClick={onClose} className="p-1 text-ink/40 transition-colors hover:text-ink" type="button">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">Role / Title</span>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">Company / Organization</span>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">Date Range</span>
            <input
              type="text"
              required
              placeholder="e.g. 2022 — Present"
              value={formData.range}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
            />
          </label>
          <div className="mt-6 flex justify-end gap-3 border-t border-ink/10 pt-5">
            <button type="button" onClick={onClose} className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/40">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-full bg-brass px-6 py-2 text-sm font-semibold text-ink transition-colors hover:bg-secondaryContainer disabled:opacity-50">
              {saving ? "Saving..." : "Add Event"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}



export function ProfileContent() {
  const { user, signOut, setUser, setSession, googleAccessToken } = useAuth();
  const router = useRouter();
  const { data: fullProfile, mutate: mutateProfile } = useApi("profile:me", () => apiClient.auth.me());
  const [mentoring, setMentoring] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [bio, setBio] = useState(
    fullProfile?.bio || "Passionate about building products that make everyday work more human. Open to mentoring students and early-career professionals."
  );
  const [editingBio, setEditingBio] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [skills, setSkills] = useState<string[]>(DEFAULT_SKILLS);
  const [newSkill, setNewSkill] = useState("");
  const newSkillInputRef = useRef<HTMLInputElement>(null);

  // Schedule Google Meet state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [meetTopic, setMeetTopic] = useState("");
  const [meetDate, setMeetDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [meetTime, setMeetTime] = useState("10:00");
  const [schedulingMeet, setSchedulingMeet] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<"idle" | "success" | "error">("idle");

  const handleScheduleMeet = async () => {
    if (!meetTopic.trim() || !googleAccessToken) {
      setScheduleStatus("error");
      return;
    }
    setSchedulingMeet(true);
    setScheduleStatus("idle");
    try {
      const startISO = new Date(`${meetDate}T${meetTime}:00`).toISOString();
      const endDate = new Date(`${meetDate}T${meetTime}:00`);
      endDate.setHours(endDate.getHours() + 1);
      const endISO = endDate.toISOString();

      await createCalendarEvent({
        token: googleAccessToken,
        summary: meetTopic,
        description: `PRO ALUMN Meeting scheduled by ${user.name}`,
        startDateTime: startISO,
        endDateTime: endISO,
        attendees: [user.email],
      });
      setScheduleStatus("success");
      setTimeout(() => {
        setScheduleOpen(false);
        setScheduleStatus("idle");
        setMeetTopic("");
      }, 2500);
    } catch (err) {
      console.error("Calendar event creation failed:", err);
      setScheduleStatus("error");
    } finally {
      setSchedulingMeet(false);
    }
  };

  useEffect(() => {
    if (fullProfile) {
      if (fullProfile.bio) setBio(fullProfile.bio);
      if (fullProfile.skills) setSkills(fullProfile.skills.split(",").map((s: string) => s.trim()).filter(Boolean));
    }
  }, [fullProfile]);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshDone(false);
    try {
      await apiClient.matching.syncMe();
      setRefreshDone(true);
      showToast("AI match profile refreshed!");
    } catch (err) {
      console.error(err);
      showToast("Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOut();
      router.push("/login");
    }
  };

  const handleSaveProfile = async (data: any) => {
    await apiClient.users.updateProfile(data);
    await mutateProfile();
    const updatedUser = await apiClient.auth.me();
    // Rebuild session by grabbing local token if necessary, or just rely on context
    const token = localStorage.getItem("auth-token") || "";
    setSession({ user: updatedUser, token });
    showToast("Profile updated successfully!");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const uploadResume = async (file: File) => {
    try {
      setUploadingResume(true);
      setResumeFile(file);
      setResumePreview(file.name);
      const { url } = await apiClient.uploads.resume(file);
      await apiClient.users.updateProfile({ resumeUrl: url });
      showToast("Resume uploaded successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload resume");
      setResumeFile(null);
      setResumePreview(null);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      uploadResume(file);
    } else if (file) {
      showToast("Please upload a PDF file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      uploadResume(file);
    } else if (file) {
      showToast("Please upload a PDF file");
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addSkill = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      showToast("Skill already exists");
      return;
    }
    const updatedSkills = [...skills, trimmed];
    setSkills(updatedSkills);
    setNewSkill("");
    await handleSaveProfile({ skills: updatedSkills.join(",") });
  };

  const removeSkill = async (skill: string) => {
    const updatedSkills = skills.filter((s) => s !== skill);
    setSkills(updatedSkills);
    await handleSaveProfile({ skills: updatedSkills.join(",") });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const currentTimeline = fullProfile?.timeline ? (Array.isArray(fullProfile.timeline) ? fullProfile.timeline : JSON.parse(fullProfile.timeline as string)) : timelineEntries;

  const handleAddTimelineEvent = async (event: { role: string; company: string; range: string }) => {
    const newTimeline = [event, ...currentTimeline];
    await handleSaveProfile({ timeline: newTimeline });
  };

  const handleRemoveTimelineEvent = async (index: number) => {
    if (!window.confirm("Remove this timeline event?")) return;
    const newTimeline = [...currentTimeline];
    newTimeline.splice(index, 1);
    await handleSaveProfile({ timeline: newTimeline });
  };

  if (!user) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl space-y-12"
    >
      <motion.div variants={fadeIn}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">
          My Profile
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">
          {user.name}
        </h1>
        <p className="mt-3 text-sm text-ink/55">
          {fullProfile?.role || user.role} · {fullProfile?.department || user.department}
        </p>
      </motion.div>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brass text-2xl font-semibold text-white">
                {user.initials}
              </div>
              <div>
                <h2 className="font-display text-3xl">{fullProfile?.name || user.name}</h2>
                <p className="mt-1 text-sm text-ink/60">
                  {fullProfile?.jobTitle ? `${fullProfile.jobTitle} at ${fullProfile.currentCompany || 'Company'}` : `${fullProfile?.role || user.role} · ${fullProfile?.department || user.department}`}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone="neutral">
                    Class of {fullProfile?.batchYear || user.classYear} · {fullProfile?.department || user.department}
                  </Badge>
                  <ShieldCheck size={16} className="text-sage" />
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brass hover:text-brass"
            >
              <span className="flex items-center gap-2">
                <Pencil size={14} /> Edit profile
              </span>
            </button>
            <button 
              onClick={() => setScheduleOpen(true)}
              className="rounded-full border border-sage/30 bg-sage/10 px-4 py-2.5 text-sm font-semibold text-sage transition-colors hover:bg-sage/20"
            >
              <span className="flex items-center gap-2">
                <Video size={14} /> Schedule Google Meet
              </span>
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Schedule Google Meet Modal */}
      <AnimatePresence>
        {scheduleOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 pt-10 sm:pt-20 px-4 pb-20"
            onClick={() => setScheduleOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4 bg-paper/30">
                <h2 className="font-display text-xl text-ink flex items-center gap-2">
                  <CalendarPlus size={20} className="text-sage" />
                  Schedule Google Meet
                </h2>
                <button onClick={() => setScheduleOpen(false)} className="p-1 text-ink/40 transition-colors hover:text-ink" type="button">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {scheduleStatus === "success" ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <CheckCircle2 size={40} className="text-sage" />
                    <p className="font-display text-lg text-ink">Meeting Scheduled!</p>
                    <p className="text-xs text-ink/50">A Google Calendar invite has been sent to {user.email}</p>
                  </div>
                ) : (
                  <>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">Meeting Topic</span>
                      <input
                        type="text"
                        value={meetTopic}
                        onChange={(e) => setMeetTopic(e.target.value)}
                        placeholder="e.g. Career Guidance Session"
                        className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">Date</span>
                        <input
                          type="date"
                          value={meetDate}
                          onChange={(e) => setMeetDate(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">Time</span>
                        <input
                          type="time"
                          value={meetTime}
                          onChange={(e) => setMeetTime(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
                        />
                      </label>
                    </div>
                    {scheduleStatus === "error" && (
                      <div className="flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={14} />
                        <span>Failed to schedule. Please ensure you are signed in with Google.</span>
                      </div>
                    )}
                    <button
                      onClick={handleScheduleMeet}
                      disabled={schedulingMeet || !meetTopic.trim()}
                      className="w-full rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {schedulingMeet ? "Creating event..." : "Schedule & Send Invite"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditingProfile && (
          <ProfileEditModal
            user={fullProfile || user}
            onClose={() => setIsEditingProfile(false)}
            onSave={handleSaveProfile}
          />
        )}
      </AnimatePresence>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <h3 className="font-display text-xl">About</h3>
          {editingBio ? (
            <div className="mt-4">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-ink/20 bg-transparent px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-brass"
              />
              <button
                onClick={async () => {
                  setEditingBio(false);
                  await handleSaveProfile({ bio });
                }}
                className="mt-3 text-xs font-semibold text-brass hover:text-brass-600"
              >
                Done
              </button>
            </div>
          ) : (
            <p
              onClick={() => setEditingBio(true)}
              className="mt-4 cursor-pointer text-sm leading-6 text-ink/70 transition-colors hover:text-ink"
            >
              {bio}
            </p>
          )}
          <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-5">
            <span className="text-sm font-medium text-ink">
              Open to mentoring
            </span>
            <button
              onClick={() => setMentoring(!mentoring)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                mentoring ? "bg-sage" : "bg-ink/20"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  mentoring ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <h3 className="font-display text-xl">Resume & AI Profile</h3>
          <p className="mt-3 text-sm text-ink/60">
            Upload your resume to improve AI matching accuracy
          </p>

          <div className="mt-6 space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver
                  ? "border-brass bg-brass/5"
                  : "border-ink/15 bg-white/50 hover:border-ink/30"
              }`}
            >
              <Upload size={24} className="text-ink/35" />
              {uploadingResume ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-brass" />
                  <span className="text-sm text-ink/70">Uploading...</span>
                </div>
              ) : resumePreview ? (
                <div className="flex items-center gap-2 text-sm text-ink/65">
                  <FileText size={14} />
                  <span>{resumePreview}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeResume();
                    }}
                    className="ml-2 p-1 text-ink/40 hover:text-clay"
                    aria-label="Remove resume"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-ink/70">
                    Upload your resume
                  </p>
                  <p className="text-xs text-ink/40">
                    Accepted formats: .pdf
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </div>

            {resumeFile && (
              <div className="p-4 rounded-lg bg-brass/5 border border-brass/20">
                <p className="font-mono text-xs uppercase tracking-wider text-brass">Resume uploaded</p>
                <p className="mt-1 text-sm text-ink/60">
                  Your resume will be parsed to extract skills and experience for better AI matching.
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl">Skills & Tags</h3>
            <button
              onClick={() => {
                newSkillInputRef.current?.focus();
              }}
              className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brass hover:text-brass"
            >
              <Plus size={12} /> Add Skill
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} tone="neutral" className="gap-1">
                {skill}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSkill(skill);
                  }}
                  className="p-0.5 text-ink/40 hover:text-clay"
                  aria-label={`Remove ${skill}`}
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
          <div className="mt-4">
            <input
              ref={newSkillInputRef}
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill and press Enter..."
              className="w-full rounded-lg border border-ink/20 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-brass placeholder:text-ink/35"
            />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl">Career Timeline</h3>
            <button
              onClick={() => setIsAddingTimeline(true)}
              className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brass hover:text-brass"
            >
              <Plus size={12} /> Add Event
            </button>
          </div>
          
          <div className="space-y-0">
            {currentTimeline.length === 0 ? (
              <p className="text-sm text-ink/50 text-center py-4">No timeline events added yet.</p>
            ) : (
              currentTimeline.map((entry: any, i: number) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-brass mt-1" />
                    {i < currentTimeline.length - 1 && (
                      <div className="w-px flex-1 bg-ink/15 my-1" />
                    )}
                  </div>
                  <div className="pb-6 flex-1 flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-ink">{entry.role}</p>
                      <p className="text-xs text-ink/60">{entry.company}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/40">{entry.range}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveTimelineEvent(i)}
                      className="p-1.5 text-ink/30 opacity-0 group-hover:opacity-100 transition-all hover:text-clay hover:bg-clay/10 rounded-md"
                      title="Remove event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isAddingTimeline && (
          <TimelineModal
            onClose={() => setIsAddingTimeline(false)}
            onSave={handleAddTimelineEvent}
          />
        )}
      </AnimatePresence>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <h3 className="font-display text-xl">Achievements</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {achievements.map((a) => (
              <Badge key={a.label} tone={a.tone}>
                {a.label}
              </Badge>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <h3 className="font-display text-xl">AI Match Profile</h3>
          <p className="mt-3 text-sm text-ink/60">
            Your embedding was last updated 3 days ago
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brass hover:text-brass disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : refreshDone ? (
              <span className="text-sage">Updated! <Sparkles size={14} className="ml-1" /></span>
            ) : (
              <>
                <RefreshCw size={15} /> Refresh my AI match profile
              </>
            )}
          </button>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <Card padding="lg">
          <h3 className="font-display text-xl">Quick Links</h3>
          <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex items-center justify-between py-4 transition-colors hover:bg-paper/50"
              >
                <span className="flex items-center gap-3 text-sm font-medium text-ink">
                  <link.icon size={16} className="text-ink/50" />
                  {link.label}
                </span>
                <ArrowRight
                  size={14}
                  className="text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brass"
                />
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-clay/10 px-6 py-3.5 text-sm font-semibold text-clay transition-colors hover:bg-clay/20"
        >
          <LogOut size={16} /> Sign out
        </button>
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </motion.div>
  );
}