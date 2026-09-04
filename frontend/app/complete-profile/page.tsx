"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CreditCard,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Upload,
  User,
  GraduationCap,
  Building,
  Briefcase,
  Linkedin,
  Phone,
  Gift,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui";
import { apiClient } from "@/lib/api/client";

interface CompleteProfileUser {
  name?: string | null;
  department?: string | null;
  batchYear?: number | null;
  skillsOffered?: string | null;
  skills?: string | null;
  skillsWanted?: string | null;
  currentCompany?: string | null;
  jobTitle?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  referredByCode?: string | null;
  email?: string | null;
  rejectionReason?: string | null;
}

export default function CompleteProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<CompleteProfileUser | null>(null);
  const [config, setConfig] = useState<{ mode: "paid" | "free"; feeAmount?: number }>({ mode: "free" });
  const [hasPaid, setHasPaid] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Computer Engineering");
  const [batchYear, setBatchYear] = useState<number>(new Date().getFullYear());
  const [skillsOffered, setSkillsOffered] = useState("");
  const [skillsWanted, setSkillsWanted] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [bio, setBio] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Free Mode Sub-Method
  const [freeMethod, setFreeMethod] = useState<"college_email" | "id_upload" | "otp">("college_email");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [idCardUrl, setIdCardUrl] = useState("");
  const [otp, setOtp] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadStatus() {
      setLoading(true);
      try {
        const u = await apiClient.auth.me();
        if (u && u.id) {
          setUserData(u as unknown as CompleteProfileUser);
          setConfig({ mode: "free" });
          setHasPaid(false);

          setName(u.name || "");
          setDepartment(u.department || "Computer Engineering");
          setBatchYear(typeof u.batchYear === "number" ? u.batchYear : new Date().getFullYear());
          setSkillsOffered(u.skillsOffered || u.skills || "");
          setSkillsWanted(u.skillsWanted || "");
          setCurrentCompany(u.currentCompany || "");
          setJobTitle(u.jobTitle || "");
          setLinkedinUrl(u.linkedinUrl || "");
          setBio(u.bio || "");
          setReferralCode((u as Record<string, unknown>).referredByCode as string || "");
          setCollegeEmail(u.email || "");

          // Admins are invisible overseers — they're decoupled from the profile completion flow
          if (u.role === "admin" || (u as Record<string, unknown>).role === "ADMIN") {
            router.push("/admin");
            return;
          }

          // If user is already approved, direct to dashboard
          if ((u as Record<string, unknown>).profileStatus === "APPROVED") {
            router.push("/home");
          } else if ((u as Record<string, unknown>).profileStatus === "PENDING") {
            router.push("/verify-profile");
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load verification status:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, [router]);

  // Step 1: Submit Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await apiClient.users.updateProfile({
        name,
        department,
        batchYear,
        skillsOffered,
        skillsWanted,
        skills: skillsOffered,
        linkedinUrl,
        bio,
        currentCompany,
        jobTitle,
        ...((referralCode.trim() ? { referredByCode: referralCode.trim() } : {}) as Record<string, unknown>),
      });

      showToast("Profile details saved! Proceed to verification.");
      setStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit profile";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Paid Verification (Simulated instant test verification)
  const handlePaidVerification = async () => {
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await apiClient.users.verifyEvidence({
        method: "otp",
        otp: "123456",
      });

      if (res.success) {
        showToast("Payment verified! Profile submitted for admin approval.");
        router.push("/verify-profile");
      } else {
        setErrorMessage("Payment verification failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate payment";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Free Verification (College Email, ID Card, OTP)
  const handleFreeVerification = async () => {
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await apiClient.users.verifyEvidence({
        method: freeMethod,
        collegeEmail: freeMethod === "college_email" ? collegeEmail : undefined,
        idCardUrl: freeMethod === "id_upload" ? idCardUrl : undefined,
        otp: freeMethod === "otp" ? otp : undefined,
      });

      if (!res.success) {
        setErrorMessage("Verification failed");
        setSubmitting(false);
        return;
      }

      showToast("Verification submitted successfully!");
      router.push("/verify-profile");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-500" size={24} />
          <span className="text-sm font-bold font-mono">Checking verification credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold">
            <ShieldCheck size={14} />
            <span>ALUMNI TRUST &amp; VERIFICATION GATE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Complete Your Member Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            To unlock the alumni directory, referrals, AI career matchmaking, and the credit rewards ledger, verify your institutional identity.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              step === 1 ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-slate-800 text-slate-400"
            }`}
          >
            <span>1. Profile Details</span>
          </div>
          <ArrowRight size={14} className="text-slate-600" />
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              step === 2 ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-slate-800 text-slate-400"
            }`}
          >
            <span>2. Identity Verification</span>
          </div>
        </div>

        {/* Rejection Notice Banner (if user was previously rejected) */}
        {userData?.rejectionReason && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5"
          >
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertTriangle size={16} />
              <span>Feedback from Admin Review Team:</span>
            </div>
            <p className="leading-relaxed">{userData.rejectionReason}</p>
            {hasPaid && (
              <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                ✓ Your prior verification fee is recorded. You will NOT be charged again when resubmitting.
              </p>
            )}
          </motion.div>
        )}

        {/* Error Message Box */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
          >
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </motion.div>
        )}

        {/* ================= STEP 1: PROFILE DETAILS FORM ================= */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <Card padding="lg" className="bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-2xl">
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <User size={13} className="text-blue-400" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-purple-400" />
                      Graduation Year (Batch) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1970}
                      max={2035}
                      value={batchYear}
                      onChange={(e) => setBatchYear(parseInt(e.target.value) || 2024)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Department / Branch *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-bold outline-none focus:border-blue-500"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Telecomm">Electronics &amp; Telecomm</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Artificial Intelligence & Data Science">AI &amp; Data Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Linkedin size={13} className="text-blue-400" />
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-mono text-[11px] outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Building size={13} className="text-amber-400" />
                      Current Company / Organization
                    </label>
                    <input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. Google, Microsoft, Startup, or Student"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Briefcase size={13} className="text-emerald-400" />
                      Current Role / Job Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Software Development Engineer II"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5 text-xs">
                      <Sparkles size={13} className="text-emerald-400" />
                      Skills You Can Offer / Teach (Skill Swap)
                    </label>
                    <input
                      type="text"
                      value={skillsOffered}
                      onChange={(e) => setSkillsOffered(e.target.value)}
                      placeholder="e.g. React, Next.js, System Design, Python"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5 text-xs">
                      <Sparkles size={13} className="text-blue-400" />
                      Skills You Want to Learn / Swap
                    </label>
                    <input
                      type="text"
                      value={skillsWanted}
                      onChange={(e) => setSkillsWanted(e.target.value)}
                      placeholder="e.g. AI Agents, Kubernetes, Product Strategy"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Professional Bio &amp; Goals</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your career background or what you hope to achieve on the alumni network..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white leading-relaxed outline-none focus:border-blue-500"
                  />
                </div>

                {/* Optional Referral Code Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-2">
                  <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                    <Gift size={14} className="text-purple-400" />
                    Referral / Invite Code (Optional)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    If an existing alumnus or student referred you, enter their code here. Both you (+50 pts) and your referrer (+100 pts) will earn rewards upon admin approval!
                  </p>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PRO-8F39K2"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-500/30 bg-slate-900 text-purple-300 font-mono font-bold uppercase tracking-wider outline-none focus:border-purple-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>{submitting ? "Saving Profile..." : "Continue to Verification Step"}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* ================= STEP 2: VERIFICATION STEP ================= */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <Card padding="lg" className="bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-2xl space-y-6">
              {/* Branch A: Paid Verification (Razorpay) */}
              {config.mode === "paid" && (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">Institutional Identity Verification</h3>
                        <p className="text-xs text-slate-400">One-time nominal fee for fraud prevention &amp; background vetting.</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs">
                      <span className="text-slate-400">Verification Fee:</span>
                      <span className="font-bold text-emerald-400 text-base">₹29.00 INR</span>
                    </div>

                    {hasPaid && (
                      <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span>Previous verification fee confirmed. Resubmitting will NOT charge you again.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handlePaidVerification}
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Lock size={16} />
                      <span>
                        {submitting
                          ? "Processing..."
                          : hasPaid
                          ? "Submit Resubmission for Admin Review"
                          : "Pay ₹29 & Submit for Verification"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      ← Back to Profile Edit
                    </button>
                  </div>
                </div>
              )}

              {/* Branch B: Free Verification (College Domain, ID Upload, OTP) */}
              {config.mode === "free" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">Select Free Verification Method</h3>
                      <p className="text-xs text-slate-400">Choose one of the campus-approved credential verification options.</p>
                    </div>
                  </div>

                  {/* Method Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "college_email", label: "College Email", icon: Mail },
                      { id: "id_upload", label: "ID Card Upload", icon: Upload },
                      { id: "otp", label: "SMS/Email OTP", icon: Phone },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFreeMethod(m.id as "college_email" | "id_upload" | "otp")}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          freeMethod === m.id
                            ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-600/10"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        <m.icon size={18} className="mb-1 text-blue-400" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Free Option 1: College Email Domain */}
                  {freeMethod === "college_email" && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                      <label className="block font-bold text-slate-200">Institutional Email Address</label>
                      <p className="text-[11px] text-slate-400">
                        Must end with an accredited institutional domain (e.g. <code className="font-mono text-blue-400">@somaiya.edu</code>, <code className="font-mono text-blue-400">.edu</code>, or <code className="font-mono text-blue-400">.ac.in</code>).
                      </p>
                      <input
                        type="email"
                        value={collegeEmail}
                        onChange={(e) => setCollegeEmail(e.target.value)}
                        placeholder="student@somaiya.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Free Option 2: ID Card Upload */}
                  {freeMethod === "id_upload" && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                      <label className="block font-bold text-slate-200">Institutional ID Card URL / Document</label>
                      <p className="text-[11px] text-slate-400">
                        Provide a link to your uploaded student ID or graduation certificate for visual inspection by campus administrators.
                      </p>
                      <input
                        type="url"
                        value={idCardUrl}
                        onChange={(e) => setIdCardUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/.../id-card.jpg"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-[11px] outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Free Option 3: OTP */}
                  {freeMethod === "otp" && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                      <label className="block font-bold text-slate-200">6-Digit Verification PIN (OTP)</label>
                      <p className="text-[11px] text-slate-400">
                        Enter the 6-digit confirmation code sent to your registered contact (Test code: <code className="font-mono text-emerald-400">123456</code>).
                      </p>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono font-bold text-center text-base tracking-[0.3em] outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleFreeVerification}
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>{submitting ? "Verifying Credentials..." : "Submit Verification for Admin Review"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      ← Back to Profile Edit
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white border border-slate-700 text-xs font-bold shadow-2xl flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
