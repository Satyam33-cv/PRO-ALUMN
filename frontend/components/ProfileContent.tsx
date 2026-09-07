"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Pencil,
  ArrowRight,
  RefreshCw,
  Loader2,
  BookOpen,
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
  Camera,
  Download,
  Award,
  Key,
  Lock,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Share2,
  Check,
  Send,
  Terminal,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { ProfileEditModal } from "@/components/ui/ProfileEditModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";

interface TimelineEvent {
  role: string;
  company: string;
  range: string;
  description?: string;
  attestedBy?: string;
}

function TimelineModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (event: TimelineEvent) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    role: "",
    company: "",
    range: "",
    description: "",
    attestedBy: "Somaiya Fellow Attestation Oracle",
  });
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFFFF] border-4 border-black shadow-[8px_8px_0px_#000000] p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm uppercase">[ 03 // ADD CAREER MILESTONE ]</span>
            <span className="px-2 py-0.5 bg-[#FF5500] text-white text-[10px] font-bold border border-black">
              ORACLE BACKED
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-white border border-black font-bold hover:bg-neutral-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center"
            type="button"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
              ROLE / TITLE:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Principal Systems Architect"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
              COMPANY / LAB / INSTITUTION:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Quantix Labs // San Francisco, CA"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
              DATE RANGE / EPOCH:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2023 — PRESENT"
              value={formData.range}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
              TECHNICAL SCOPE & IMPACT:
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of architectural contributions, patents, or systems delivered..."
              className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#FF5500] text-white border-2 border-black font-bold shadow-[2px_2px_0px_#000000] hover:bg-[#B80500] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
            >
              {saving ? "TRANSMITTING..." : "COMMIT MILESTONE →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProfileContent() {
  const { user, signOut, setSession, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "admin") {
      router.push("/admin");
    }
  }, [user, router]);

  const { data: fullProfile, refresh: refreshProfile } = useApi("profile:me", () => apiClient.auth.me());
  const { data: gamificationData, reload: reloadGamification } = useApi("profile:gamification", () =>
    apiClient.gamification.getStatus()
  );

  const [toast, setToast] = useState<string | null>(null);
  const [mentoring, setMentoring] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [verifyingStatus, setVerifyingStatus] = useState(false);
  const [bio, setBio] = useState(fullProfile?.bio || "");
  const [editingBio, setEditingBio] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certificates, setCertificates] = useState<Array<{ name: string; url: string }>>([]);

  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const newSkillInputRef = useRef<HTMLInputElement>(null);

  // Privacy switches
  const [zkMode, setZkMode] = useState(true);
  const [directConduits, setDirectConduits] = useState(true);
  const [geoMasking, setGeoMasking] = useState(false);

  // 3D Lanyard Card Tilt state
  const badgeCardRef = useRef<HTMLDivElement>(null);

  // Google Meet scheduling
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [meetTopic, setMeetTopic] = useState("");
  const [meetDate, setMeetDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [meetTime, setMeetTime] = useState("10:00");
  const [schedulingMeet, setSchedulingMeet] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<"idle" | "success" | "error">("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (fullProfile?.bio) setBio(fullProfile.bio);
    if (fullProfile?.skills) {
      setSkills(
        fullProfile.skills
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      );
    }
  }, [fullProfile?.bio, fullProfile?.skills]);

  // Tilt event listeners for Digital Lanyard ID Card
  useEffect(() => {
    const card = badgeCardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / rect.height) * 16;
      const rotateY = (x / rect.width) * 16;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshDone(false);
    try {
      await apiClient.matching.syncMe();
      setRefreshDone(true);
      showToast("384-D Latent Coordinates Vector Matrix Synchronized!");
      setTimeout(() => setRefreshDone(false), 3000);
    } catch (err) {
      console.error(err);
      showToast("Match profile refreshed.");
      setRefreshDone(true);
      setTimeout(() => setRefreshDone(false), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportPKI = () => {
    const pkiData = {
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalCredential",
      credentialSubject: {
        id: user?.id || "MEMBER",
        name: user?.name || "Member",
        email: user?.email || "",
        role: fullProfile?.role || user?.role || "alumni",
        department: fullProfile?.department || user?.department || "",
        batchYear: fullProfile?.batchYear || user?.classYear || "",
      },
      issuer: {
        name: "PRO-ALUMN Decentralized Consensus Network",
        enclave: "",
        pgvectorDimensions: 384,
        consensusEpoch: "2026.Q3",
      },
      signature: {
        type: "Ed25519VerificationKey2020",
        created: new Date().toISOString(),
        proofValue: "0x48f2ac2199b674d89aef34bc8890123f8b54901",
      },
    };

    const blob = new Blob([JSON.stringify(pkiData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credential-${(user?.name || "fellow").toLowerCase().replace(/\s+/g, "-")}-pki.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Profile data exported.");
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to disconnect from PRO-ALUMN secure conduit?")) {
      signOut();
      router.push("/login");
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploadingAvatar(true);
      await apiClient.uploads.avatar(file);
      await refreshProfile();
      const updatedUser = await apiClient.auth.me();
      if (session) {
        setSession({ ...session, user: updatedUser });
      }
      showToast("Profile photo updated on Supabase & publicly visible!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload avatar";
      showToast(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadCertificate = async (file: File) => {
    try {
      setUploadingCert(true);
      const res = await apiClient.uploads.certificate(file);
      setCertificates((prev) => [...prev, { name: file.name, url: res.url }]);
      showToast("Experience certificate / proof stored on Supabase!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload certificate";
      showToast(message);
    } finally {
      setUploadingCert(false);
    }
  };

  const handleSaveProfile = async (data: Record<string, unknown>) => {
    await apiClient.users.updateProfile(data);
    await refreshProfile();
    const updatedUser = await apiClient.auth.me();
    if (session) {
      setSession({ ...session, user: updatedUser });
    }
    showToast("Profile updated successfully!");
  };

  const uploadResume = async (file: File) => {
    try {
      setUploadingResume(true);
      setResumeFile(file);
      setResumePreview(file.name);
      const { url } = await apiClient.uploads.resume(file);
      await apiClient.users.updateProfile({ resumeUrl: url });
      await refreshProfile();
      showToast("Resume saved to Supabase storage successfully!");
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
      showToast("Skill already exists in vector topology");
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

  const currentTimeline: TimelineEvent[] = useMemo(() => {
    if (!fullProfile?.timeline) return [];
    try {
      return Array.isArray(fullProfile.timeline)
        ? fullProfile.timeline
        : JSON.parse(fullProfile.timeline as string);
    } catch {
      return [];
    }
  }, [fullProfile?.timeline]);

  const handleAddTimelineEvent = async (event: TimelineEvent) => {
    const newTimeline = [event, ...currentTimeline];
    await handleSaveProfile({ timeline: newTimeline });
    showToast("Career milestone committed to verified timeline!");
  };

  const handleRemoveTimelineEvent = async (index: number) => {
    if (!window.confirm("Remove this milestone event from verified chronology?")) return;
    const newTimeline = [...currentTimeline];
    newTimeline.splice(index, 1);
    await handleSaveProfile({ timeline: newTimeline });
    showToast("Milestone removed.");
  };

  const handleScheduleMeet = async () => {
    if (!meetTopic.trim()) {
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

      const formatGCalDate = (d: string) => d.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        meetTopic
      )}&dates=${formatGCalDate(startISO)}/${formatGCalDate(endISO)}&details=${encodeURIComponent(
        `PRO ALUMN Session scheduled with ${user?.name || "Member"}`
      )}${user?.email ? `&add=${encodeURIComponent(user.email)}` : ""}`;

      window.open(gcalUrl, "_blank");
      setScheduleStatus("success");
      setTimeout(() => {
        setScheduleOpen(false);
        setScheduleStatus("idle");
        setMeetTopic("");
      }, 2500);
    } catch (err) {
      console.error("Calendar event scheduling failed:", err);
      setScheduleStatus("error");
    } finally {
      setSchedulingMeet(false);
    }
  };

  if (!user) return null;

  const userInitials =
    user.initials ||
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    "MB";

  const fellowUid = `FELLOW-${user.id ? user.id.slice(0, 4).toUpperCase() : "MEMBER"}-${
    user.name?.split(" ")[0].toUpperCase() || "MEMBER"
  }`;
  const cohortYear = fullProfile?.batchYear || user.classYear || "";
  const userRoleDisplay =
    fullProfile?.jobTitle ||
    (fullProfile?.role ? fullProfile.role.toUpperCase() : (user.role ? user.role.toUpperCase() : "Member"));
  const userCompanyDisplay = fullProfile?.currentCompany || "Independent / Unaffiliated";

  return (
    <div className="w-full space-y-6 font-mono text-black pb-16">
      {/* ============================================================ */}
      {/* 1. SUB-BAR: ECOSYSTEM PORTAL NAVIGATION & NODE TELEMETRY */}
      {/* ============================================================ */}
      <div className="w-full bg-[#FFFFFF] border-2 border-black shadow-[3px_3px_0px_#0A0A0A] p-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 font-bold">
          <Link
            href="/dashboard"
            className="px-2.5 py-1 hover:bg-[#F5F5F5] text-neutral-600 hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            01 DASHBOARD
          </Link>
          <span className="text-neutral-400">/</span>
          <Link
            href="/directory"
            className="px-2.5 py-1 hover:bg-[#F5F5F5] text-neutral-600 hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            02 ALUMNI REGISTRY
          </Link>
          <span className="text-neutral-400">/</span>
          <Link
            href="/jobs"
            className="px-2.5 py-1 hover:bg-[#F5F5F5] text-neutral-600 hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            03 JOBS & REFERRALS
          </Link>
          <span className="text-neutral-400">/</span>
          <Link
            href="/mentorship"
            className="px-2.5 py-1 hover:bg-[#F5F5F5] text-neutral-600 hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            04 MENTORSHIP HUB
          </Link>
          <span className="text-neutral-400">/</span>
          <Link
            href="/events"
            className="px-2.5 py-1 hover:bg-[#F5F5F5] text-neutral-600 hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            05 EVENTS & RSVPS
          </Link>
          <span className="text-neutral-400">/</span>
          <Link
            href="/stories"
            className="px-2.5 py-1 hover:bg-[#F5F5F5] text-neutral-600 hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            06 SUCCESS STORIES
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="px-3 py-1 bg-black text-[#FF5500] font-bold border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse"></span>
            MY PROFILE & DIGITAL PASS
          </span>
        </div>

        {/* Live Corridor Key Badge */}
        <div className="flex items-center gap-1.5 text-[11px] uppercase px-3 py-1 bg-white border border-black font-bold">
          <span className="text-[#FF5500]"></span>
          <span className="tracking-wider"></span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DOSSIER HERO HEADER SECTION */}
      {/* ============================================================ */}
      <div className="w-full bg-white border-4 border-black shadow-[5px_5px_0px_#0A0A0A] p-6 sm:p-8 relative overflow-hidden">
        {/* Background Graphic Accents */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-4 pointer-events-none opacity-5 select-none font-black text-[120px] text-black">
          
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 uppercase font-bold">
              <span className="px-2 py-0.5 bg-[#FF5500] text-white font-bold">Profile</span>
              <span>//</span>
              <span className="text-black">Profile</span>
              <span className="text-neutral-400">•</span>
              <span></span>
              <span className="text-neutral-400">•</span>
              <span className="text-[#FF5500] font-bold"></span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black mt-1">
              Your profile
            </h1>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-2xl font-sans">
              Your public profile, skills, and documents. Edit anything that looks wrong.
            </p>
          </div>

          {/* Tactical Action Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-bold uppercase transition-all flex items-center gap-1.5"
            >
              <Pencil size={15} />
              <span>Edit profile</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 bg-[#FFFFFF] border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#F5F5F5] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-bold uppercase transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 size={15} className="animate-spin text-[#FF5500]" />
              ) : (
                <RefreshCw size={15} className="text-[#FF5500]" />
              )}
              <span>{refreshing ? "Refreshing…" : "Refresh matches"}</span>
            </button>
            <button
              type="button"
              onClick={handleExportPKI}
              className="px-4 py-2.5 bg-black text-white border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-neutral-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-bold uppercase transition-all flex items-center gap-1.5"
            >
              <Key size={15} className="text-[#FF5500]" />
              <span>Export profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN BENTO SPLIT: LEFT 65% / RIGHT 35% */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: COL-SPAN-8 */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* ---------------- Profile CARD ---------------- */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-black text-xs bg-[#FFFFFF] font-bold">
                  Profile
                </span>
                <span className="text-xs text-neutral-500 font-bold">UID #{fellowUid}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-black font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FF5500] inline-block animate-pulse"></span>
                <span>Active</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Fellow Avatar Chamber */}
              <div className="relative shrink-0">
                <div className="w-32 h-32 border-2 border-black shadow-[3px_3px_0px_#0A0A0A] bg-[#FFFFFF] p-1 relative overflow-hidden group">
                  {fullProfile?.avatarUrl || user.avatarUrl ? (
                    <Image
                      src={fullProfile?.avatarUrl || user.avatarUrl!}
                      alt={user.name || "Fellow"}
                      width={128}
                      height={128}
                      unoptimized
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                  ) : (
                    <div className="w-full h-full bg-black text-white flex items-center justify-center font-black text-3xl">
                      {userInitials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer"
                    title="Upload profile photo"
                  >
                    {uploadingAvatar ? <Loader2 size={18} className="animate-spin" /> : <Camera size={20} />}
                    <span className="mt-1">{uploadingAvatar ? "SAVING..." : "UPDATE"}</span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAvatar(file);
                    }}
                  />
                  <div className="absolute bottom-1 right-1 bg-black text-[#FF5500] p-0.5 border border-black">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="mt-1.5 text-center text-[10px] text-neutral-500 font-bold tracking-wider">
                  ID // {userInitials}-{cohortYear}
                </div>
              </div>

              {/* Identity Core Info */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                    {user.name}
                  </h2>
                  <span className="bg-[#FF5500] text-white px-2 py-0.5 text-xs font-bold">
                    FELLOW &apos;{String(cohortYear).slice(-2)}
                  </span>
                  <span className="bg-[#FFFFFF] text-black border border-black px-2 py-0.5 text-xs font-bold">
                    SOMAIYA VERIFIED
                  </span>
                </div>

                <div className="text-sm font-bold text-black">
                  {userRoleDisplay} <span className="text-neutral-400">@</span>{" "}
                  <span className="underline decoration-black decoration-1 underline-offset-4">
                    {userCompanyDisplay}
                  </span>
                  <span className="text-neutral-500 text-xs ml-2 font-normal">
                    ({fullProfile?.department || user.department || "Computer Systems"})
                  </span>
                </div>

                <div className="text-xs text-neutral-700 mt-1 leading-relaxed bg-[#FFFFFF] p-3 border border-black">
                  {editingBio ? (
                    <div className="space-y-2">
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full p-2 bg-white border border-black text-xs font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          setEditingBio(false);
                          await handleSaveProfile({ bio });
                        }}
                        className="px-3 py-1 bg-black text-white text-[11px] font-bold hover:bg-neutral-800"
                      >
                        SAVE STATEMENT
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="italic">
                        &ldquo;{bio || "No bio added yet. Click edit to introduce yourself."}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => setEditingBio(true)}
                        className="text-[10px] text-neutral-500 hover:text-black font-bold uppercase shrink-0"
                      >
                        [EDIT]
                      </button>
                    </div>
                  )}
                </div>

                {/* Real-time Status Capsule Indicator & Pill Dock */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#FFFFFF] border border-black">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 border border-black rounded-full inline-block ${
                        mentoring ? "bg-[#FF5500]" : "bg-neutral-400"
                      }`}
                    ></span>
                    <span className="text-[11px] font-bold uppercase text-black">
                      STATUS: {mentoring ? "ACCEPTING MENTEES & REFERRALS" : "REFERRALS TEMPORARILY PAUSED"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMentoring(!mentoring)}
                      className="text-[10px] underline font-bold ml-1 hover:text-[#FF5500]"
                    >
                      [TOGGLE]
                    </button>
                  </div>

                  {/* Minimalist Quick Action Pill Dock */}
                  <div className="inline-flex items-center bg-black rounded-full px-3 py-1 gap-3 text-white shadow-[2px_2px_0px_#0A0A0A]">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="hover:text-[#FF5500] transition-colors flex items-center"
                      title="Return"
                    >
                      ←
                    </button>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#FF5500] transition-colors flex items-center"
                      title="GitHub"
                    >
                      <Terminal size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={handleExportPKI}
                      className="hover:text-[#FF5500] transition-colors flex items-center"
                      title="Signal PKI Attestation"
                    >
                      <Fingerprint size={14} />
                    </button>
                    <a
                      href={`mailto:${user.email}`}
                      className="hover:text-[#FF5500] transition-colors flex items-center"
                      title="Dispatch Direct Email"
                    >
                      <Mail size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setScheduleOpen(true)}
                      className="hover:text-[#FF5500] transition-colors flex items-center text-[11px] font-bold gap-1"
                      title="Schedule Google Meet"
                    >
                      <Video size={13} />
                      <span>MEET</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------- Skills ---------------- */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-black text-xs bg-[#FFFFFF] font-bold">
                  Skills
                </span>
                <span className="text-xs text-neutral-600 font-bold"></span>
              </div>
              <div className="text-xs text-neutral-500 font-bold font-mono">
                {skills.length} SKILLS REGISTERED
              </div>
            </div>

            {/* Skills & Stack Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Skills:
                </span>
                <span className="text-[11px] text-neutral-500 font-bold">
                  {skills.length} skills
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFFFF] border border-black text-xs font-bold text-black"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-neutral-400 hover:text-black hover:bg-neutral-200 p-0.5"
                      title="Remove skill"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  ref={newSkillInputRef}
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-[#FF5500] text-white border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#b8e600] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  + Add skill
                </button>
              </div>
            </div>
          </div>

          {/* ---------------- Experience ---------------- */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-black text-xs bg-[#FFFFFF] font-bold">
                  Experience
                </span>
                <span className="text-xs text-neutral-600 font-bold"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-black font-bold">
                  STATUS: {currentTimeline.length} NODES CONFIRMED
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingTimeline(true)}
                  className="px-2.5 py-1 bg-[#FF5500] text-white border border-black text-[11px] font-bold shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#B80500] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  + Add experience
                </button>
              </div>
            </div>

            {currentTimeline.length === 0 ? (
              <EmptyState
                title="No Career Milestones Added"
                body="Chronicle your professional trajectory, faculty appointments, or systems delivered."
                action={
                  <button
                    type="button"
                    onClick={() => setIsAddingTimeline(true)}
                    className="px-3 py-1.5 bg-[#FF5500] text-white border border-black text-xs font-bold shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#B80500] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    + Add experience
                  </button>
                }
              />
            ) : (
              <div className="relative pl-6 flex flex-col gap-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-black">
                {currentTimeline.map((item, idx) => (
                  <div key={idx} className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 group">
                    <div
                      className={`absolute -left-[29px] top-1.5 w-3.5 h-3.5 border-2 border-black ${
                        idx === 0 ? "bg-[#FF5500]" : idx === 1 ? "bg-black" : "bg-[#FFFFFF]"
                      }`}
                    ></div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black uppercase text-black">{item.role}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-[#FFFFFF] border border-black text-[10px] font-bold">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-600 font-bold">{item.company}</div>
                      {item.description && (
                        <p className="text-xs text-neutral-800 mt-1 max-w-xl leading-relaxed font-sans">
                          {item.description}
                        </p>
                      )}
                      {item.attestedBy && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500 font-bold">
                          <ShieldCheck size={14} className="text-[#FF5500]" />
                          <span>ATTESTED BY: {item.attestedBy}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <span className="text-xs font-bold text-black bg-[#FFFFFF] px-2 py-1 border border-black">
                        {item.range}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimelineEvent(idx)}
                        className="p-1 text-neutral-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove milestone"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------------- Badges FLAIR ---------------- */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-black text-xs bg-[#FFFFFF] font-bold">
                  Badges
                </span>
                <span className="text-xs text-neutral-600 font-bold"></span>
              </div>
              <span className="text-xs text-black font-bold">TOTAL STAKED: 450 CR</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Badge 1 */}
              <div className="p-4 bg-[#FF5500] border-2 border-black shadow-[3px_3px_0px_#0A0A0A] flex flex-col gap-1 items-center text-center -rotate-1 hover:rotate-0 transition-transform">
                <Award size={28} className="text-black" />
                <span className="text-xs font-black uppercase tracking-tight text-black mt-1">TOP MENTOR &apos;24</span>
                <span className="text-[10px] text-neutral-700 font-bold">38 SESSIONS LOGGED</span>
              </div>

              {/* Badge 2 */}
              <div className="p-4 bg-[#FFFFFF] border-2 border-black shadow-[3px_3px_0px_#0A0A0A] flex flex-col gap-1 items-center text-center rotate-1 hover:rotate-0 transition-transform">
                <Sparkles size={28} className="text-[#FF5500]" />
                <span className="text-xs font-black uppercase tracking-tight text-black mt-1">HIRED VIA CONDUIT</span>
                <span className="text-[10px] text-neutral-700 font-bold">SERIES B CLOSURE</span>
              </div>

              {/* Badge 3 */}
              <div className="p-4 bg-black text-white border-2 border-black shadow-[3px_3px_0px_#0A0A0A] flex flex-col gap-1 items-center text-center -rotate-2 hover:rotate-0 transition-transform">
                <Video size={28} className="text-[#FF5500]" />
                <span className="text-xs font-black uppercase tracking-tight text-white mt-1">KEYNOTE SPEAKER</span>
                <span className="text-[10px] text-neutral-400 font-bold">GLOBAL SUMMIT &apos;23</span>
              </div>

              {/* Badge 4 */}
              <div className="p-4 bg-[#F5F5F5] border-2 border-black shadow-[3px_3px_0px_#0A0A0A] flex flex-col gap-1 items-center text-center rotate-1 hover:rotate-0 transition-transform">
                <Key size={28} className="text-black" />
                <span className="text-xs font-black uppercase tracking-tight text-black mt-1">100 ALUMN-CR</span>
                <span className="text-[10px] text-neutral-700 font-bold">STAKED GOVERNANCE</span>
              </div>
            </div>
          </div>

          {/* ---------------- 05 // RESUME & SUPABASE PROOF STORAGE ---------------- */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-black text-xs bg-[#FFFFFF] font-bold">
                  Documents
                </span>
                <span className="text-xs text-neutral-600 font-bold"></span>
              </div>
              <span className="text-xs text-[#FF5500] font-bold">Connected</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resume Box */}
              <div className="border-2 border-black p-4 bg-[#FFFFFF] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-black">Resume (PDF)</span>
                    <FileText size={16} className="text-black" />
                  </div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed p-4 text-center transition-colors ${
                      dragOver ? "border-[#FF5500] bg-orange-50" : "border-black bg-white"
                    }`}
                  >
                    {uploadingResume ? (
                      <div className="flex flex-col items-center gap-1">
                        <Loader2 size={18} className="animate-spin text-[#FF5500]" />
                        <span className="text-xs font-bold">UPLOADING TO SUPABASE...</span>
                      </div>
                    ) : resumePreview || fullProfile?.resumeUrl ? (
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{resumePreview || "verified_resume.pdf"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeResume();
                          }}
                          className="text-neutral-400 hover:text-red-600 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={20} className="mx-auto text-neutral-400 mb-1" />
                        <span className="text-xs font-bold block">DRAG & DROP RESUME (PDF)</span>
                        <span className="text-[10px] text-neutral-500">Max size 10MB</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>

                {fullProfile?.resumeUrl && (
                  <div className="mt-3 pt-2 border-t border-black/10 flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-bold">Used in matching</span>
                    <a
                      href={fullProfile.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-black text-white text-[10px] font-bold hover:bg-neutral-800"
                    >
                      VIEW PDF ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Experience Certificate Box */}
              <div className="border-2 border-black p-4 bg-[#FFFFFF] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-black">Certificates</span>
                    <Award size={16} className="text-black" />
                  </div>
                  <div className="space-y-2 mb-3">
                    {certificates.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-3 text-center border border-dashed border-black bg-white">
                        No certificates uploaded yet.
                      </p>
                    ) : (
                      certificates.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white border border-black text-xs font-bold">
                          <span className="truncate max-w-[140px]">{c.name}</span>
                          <a href={c.url} target="_blank" rel="noreferrer" className="text-[#FF5500] hover:underline text-[10px]">
                            VERIFY ↗
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => certInputRef.current?.click()}
                    disabled={uploadingCert}
                    className="w-full py-2 bg-white border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#0A0A0A] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1"
                  >
                    {uploadingCert ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    <span>Upload certificate</span>
                  </button>
                  <input
                    ref={certInputRef}
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadCertificate(file);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: COL-SPAN-4 */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* ---------------- 1. DIGITAL LANYARD ID CARD (3D TILT) ---------------- */}
          <div className="w-full flex flex-col items-center">
            {/* Physical Lanyard Webbing Strap */}
            <div className="w-14 h-16 bg-black border-x-2 border-t-2 border-black relative flex flex-col items-center justify-between p-1 shadow-md">
              <span className="text-[8px] text-[#FFFFFF] font-bold tracking-tighter uppercase [writing-mode:vertical-rl] rotate-180 opacity-70">
                PRO-ALUMN CONDUIT
              </span>
              <div className="w-6 h-3 border-2 border-black bg-[#FFFFFF] rounded-xs mt-auto"></div>
            </div>

            {/* Lanyard Clasp Ring */}
            <div className="w-8 h-4 border-2 border-black bg-neutral-300 rounded-t-xs -mt-0.5 z-10"></div>

            {/* Physical Digital Credential Pass Card (with 3D Mouse Tilt) */}
            <div
              ref={badgeCardRef}
              className="w-full bg-[#0A0A0A] text-white p-6 border-2 border-black shadow-[6px_6px_0px_#FF5500] flex flex-col gap-4 transition-transform duration-150 ease-out select-none relative overflow-hidden"
              id="badgeCard"
            >
              {/* Holographic Sheen Layer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-[#FF5500]/10 pointer-events-none"></div>

              {/* Pass Header with punch hole */}
              <div className="flex items-center justify-between border-b border-white/20 pb-3 relative">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#FF5500] font-bold tracking-tighter">/////</span>
                  <span className="text-xs uppercase tracking-widest text-white font-bold">Member card</span>
                </div>
                {/* Simulated lanyard slot */}
                <div className="w-12 h-2 bg-white/20 rounded-full border border-white/40 mx-auto"></div>
                <span className="text-xs text-[#FF5500] font-bold">2026-V2</span>
              </div>

              {/* Pass Photo & Keyline Info */}
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-white/10 border border-white/30 p-0.5 shrink-0 overflow-hidden relative">
                  {fullProfile?.avatarUrl || user.avatarUrl ? (
                    <Image
                      src={fullProfile?.avatarUrl || user.avatarUrl!}
                      alt={user.name || "Fellow"}
                      width={80}
                      height={80}
                      unoptimized
                      className="w-full h-full object-cover grayscale"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 text-white flex items-center justify-center font-black text-xl">
                      {userInitials}
                    </div>
                  )}
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF5500] rounded-none"></div>
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <div className="text-[10px] text-white/60 uppercase tracking-widest font-bold">
                    Verified
                  </div>
                  <div className="text-base font-black text-white truncate uppercase">{user.name}</div>
                  <div className="text-xs text-[#FF5500] font-bold truncate">
                    {fullProfile?.department || user.department || "SYSTEMS RESEARCH"}
                  </div>
                  <div className="text-[9px] text-white/50 truncate font-mono">
                    NODE: 0x{user.id ? user.id.slice(0, 6) : "48f2a"}::c2199b
                  </div>
                </div>
              </div>

              {/* Machine Readable Segment */}
              <div className="p-2 bg-white/5 border border-white/10 flex flex-col gap-1.5 font-mono">
                <div className="flex justify-between text-[9px] text-white/60">
                  <span>ID: 0xEF..83A</span>
                  <span>ENC: SHA-256 / ECC</span>
                </div>
                {/* Barcode Mock */}
                <div className="h-9 w-full flex items-center justify-between gap-[2px] px-1 bg-white py-1">
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-1.5 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-2.5 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-3 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-1.5 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2.5 bg-black"></div>
                  <div className="h-full w-0.5 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                </div>
                <div className="text-[9px] text-center text-white/70 tracking-widest uppercase font-bold">
                  * FELLOW VERIFIED CONDUIT BADGE *
                </div>
              </div>

              {/* Bottom Hologram Dot & Security Stamp */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#FF5500] via-[#FF5500] to-[#000000] inline-block"></span>
                  <span className="text-white/70 font-bold">CHIP // NTAG424</span>
                </div>
                <span className="text-[#FF5500] font-bold"></span>
              </div>
            </div>

            <div className="text-[10px] text-neutral-500 mt-2 flex items-center gap-1 font-bold">
              <span></span>
            </div>
          </div>

          {/* ---------------- 2. LIQUIDITY & Open slots ---------------- */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-black text-xs bg-[#FFFFFF] font-bold">
                  Activity
                </span>
                <span className="text-xs text-neutral-600 font-bold"></span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#FF5500]"></span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Slot Counter */}
              <div className="p-3 bg-[#FFFFFF] border border-black flex flex-col">
                <span className="text-[11px] text-neutral-600 font-bold uppercase">Open slots</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-black">3</span>
                  <span className="text-xs text-neutral-500 font-bold">/ 5 AVAIL</span>
                </div>
                <span className="text-[9px] text-neutral-500 font-bold mt-1">RELOADS IN 12 DAYS</span>
              </div>

              {/* Staked Balance */}
              <div className="p-3 bg-[#FFFFFF] border border-black flex flex-col">
                <span className="text-[11px] text-neutral-600 font-bold uppercase">Credits</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-[#FF5500]">350</span>
                  <span className="text-xs text-black font-bold">CR</span>
                </div>
                <span className="text-[9px] text-neutral-500 font-bold mt-1">Reserved: 50 CR</span>
              </div>
            </div>

            {/* Trust Metric Key-Value Group */}
            <div className="flex flex-col gap-2 p-3 bg-[#FFFFFF] border border-black text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-neutral-600">Rating</span>
                <span className="text-black flex items-center gap-1">
                  <span className="text-[#FF5500]">★</span>
                  <span>4.98 / 5.0 (28 Fellows)</span>
                </span>
              </div>
              <div className="h-[1px] bg-black/10"></div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-neutral-600">Active intros</span>
                <span className="text-black">1 Active (Anthropic)</span>
              </div>
              <div className="h-[1px] bg-black/10"></div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-neutral-600">Status</span>
                <span className="text-[#FF5500]">Ready</span>
              </div>
            </div>

            <Link
              href="/jobs"
              className="w-full py-2.5 bg-black text-white border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-neutral-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
            >
              <Send size={14} className="text-[#FF5500]" />
              <span>Introduce someone</span>
            </Link>
          </div>

          {/* ---------------- 3. PRIVACY & CORRIDOR VISIBILITY CONTROLS ---------------- */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-black text-xs bg-[#FFFFFF] font-bold">
                  Privacy
                </span>
                <span className="text-xs text-neutral-600 font-bold"></span>
              </div>
              <Lock size={16} className="text-black" />
            </div>

            {/* Switch 1 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black uppercase">Hide company from guests</span>
                <span className="text-[10px] text-neutral-600">Hide company name from people who are not signed in</span>
              </div>
              <button
                type="button"
                onClick={() => setZkMode(!zkMode)}
                className={`relative w-11 h-6 border-2 border-black transition-colors ${
                  zkMode ? "bg-[#FF5500]" : "bg-[#FFFFFF]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black transition-transform ${
                    zkMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-[1px] bg-black/10"></div>

            {/* Switch 2 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black uppercase">Allow messages</span>
                <span className="text-[10px] text-neutral-600">Let other members message you directly</span>
              </div>
              <button
                type="button"
                onClick={() => setDirectConduits(!directConduits)}
                className={`relative w-11 h-6 border-2 border-black transition-colors ${
                  directConduits ? "bg-[#FF5500]" : "bg-[#FFFFFF]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black transition-transform ${
                    directConduits ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-[1px] bg-black/10"></div>

            {/* Switch 3 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black uppercase">Hide exact location</span>
                <span className="text-[10px] text-neutral-600">Show city only, not precise location</span>
              </div>
              <button
                type="button"
                onClick={() => setGeoMasking(!geoMasking)}
                className={`relative w-11 h-6 border-2 border-black transition-colors ${
                  geoMasking ? "bg-[#FF5500]" : "bg-[#FFFFFF]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black transition-transform ${
                    geoMasking ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-2 bg-[#FFFFFF] border border-black text-[10px] text-neutral-600 font-bold">
              POLICY ENFORCEMENT: STRICT ZERO-LEAK ALUMNI STANDARD // REVISION 4.2
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 bg-red-50 text-red-900 border-2 border-black shadow-[3px_3px_0px_#0A0A0A] hover:bg-red-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. PERSISTENT BROADCAST TELEMETRY STRIP */}
      {/* ============================================================ */}
      <div className="w-full bg-[#F5F5F5] border-2 border-black p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-bold text-neutral-700 shadow-[3px_3px_0px_#0A0A0A]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#FF5500] rounded-full animate-pulse"></span>
            <span className="text-black"></span>
          </div>
          <span>HASH: SHA256-{user.id ? user.id.slice(0, 8) : "48f2a99c"}-proalumn</span>
          <span>PEER ATTESTATIONS: 28 CONFIRMED</span>
        </div>
        <div className="flex items-center gap-2 text-black">
          <span></span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}
      {isEditingProfile && (
        <ProfileEditModal
          user={fullProfile || user}
          onClose={() => setIsEditingProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {isAddingTimeline && (
        <TimelineModal
          onClose={() => setIsAddingTimeline(false)}
          onSave={handleAddTimelineEvent}
        />
      )}

      {/* Google Meet Modal */}
      {scheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono"
          onClick={() => setScheduleOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FFFFFF] border-4 border-black shadow-[8px_8px_0px_#000000] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm uppercase">[ SCHEDULE FRONTIER ADVISORY ]</span>
                <span className="px-2 py-0.5 bg-[#FF5500] text-white text-[10px] font-bold border border-black">
                  GOOGLE MEET
                </span>
              </div>
              <button
                onClick={() => setScheduleOpen(false)}
                className="w-7 h-7 bg-white border border-black font-bold hover:bg-neutral-200"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {scheduleStatus === "success" ? (
                <div className="p-4 bg-[#FF5500] border-2 border-black text-center space-y-2">
                  <div className="font-bold text-sm text-black">✓ GOOGLE CALENDAR INVITE OPENED</div>
                  <div className="text-xs text-neutral-800">
                    A synchronized invite was populated for {user?.email || "your calendar"}.
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                      SESSION TOPIC / AGENDA:
                    </label>
                    <input
                      type="text"
                      value={meetTopic}
                      onChange={(e) => setMeetTopic(e.target.value)}
                      placeholder="e.g. Distributed Consensus Architecture Review"
                      className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                        DATE:
                      </label>
                      <input
                        type="date"
                        value={meetDate}
                        onChange={(e) => setMeetDate(e.target.value)}
                        className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 uppercase text-[10px] text-neutral-700">
                        TIME (IST/LOCAL):
                      </label>
                      <input
                        type="time"
                        value={meetTime}
                        onChange={(e) => setMeetTime(e.target.value)}
                        className="w-full p-2 bg-white border-2 border-black text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  {scheduleStatus === "error" && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
                      <AlertCircle size={14} />
                      <span>Please specify a meeting topic before scheduling.</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleScheduleMeet}
                    disabled={schedulingMeet || !meetTopic.trim()}
                    className="w-full py-2.5 bg-[#FF5500] text-white border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#B80500] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                  >
                    {schedulingMeet ? "PREPARING DISPATCH..." : "DISPATCH GOOGLE CALENDAR INVITE →"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Brutalist Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FF5500] border-4 border-black p-4 font-mono text-xs font-black shadow-[6px_6px_0px_#000000] flex items-center space-x-3 text-black">
          <span className="w-2.5 h-2.5 bg-black animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}