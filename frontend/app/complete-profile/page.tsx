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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] text-black font-mono">
        <div className="flex items-center gap-3 p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#000000]">
          <RefreshCw className="animate-spin text-black" size={24} />
          <span className="text-sm font-black uppercase tracking-wider">Checking verification credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CCFF00] border-2 border-black text-black text-xs font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
            <ShieldCheck size={14} />
            <span>ALUMNI TRUST &amp; VERIFICATION GATE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-black uppercase">
            Complete Your Member Profile
          </h1>
          <p className="text-xs sm:text-sm text-neutral-700 font-medium max-w-lg mx-auto">
            To unlock the alumni directory, referrals, AI career matchmaking, and the credit rewards ledger, verify your institutional identity.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all ${
              step === 1 ? "bg-black text-white shadow-[3px_3px_0px_#CCFF00]" : "bg-white text-neutral-600 shadow-[2px_2px_0px_#000000]"
            }`}
          >
            <span>1. Profile Details</span>
          </div>
          <ArrowRight size={14} className="text-black" />
          <div
            className={`flex items-center gap-2 px-4 py-1.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all ${
              step === 2 ? "bg-black text-white shadow-[3px_3px_0px_#CCFF00]" : "bg-white text-neutral-600 shadow-[2px_2px_0px_#000000]"
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
            className="p-4 bg-red-100 border-3 border-black text-red-950 text-xs space-y-1.5 shadow-[4px_4px_0px_#000000]"
          >
            <div className="flex items-center gap-2 font-black uppercase tracking-wide text-red-800">
              <AlertTriangle size={16} />
              <span>Feedback from Admin Review Team:</span>
            </div>
            <p className="leading-relaxed font-medium">{userData.rejectionReason}</p>
            {hasPaid && (
              <p className="text-[11px] text-emerald-800 font-black uppercase tracking-wider pt-1">
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
            className="p-4 bg-red-100 border-3 border-black text-red-950 text-xs flex items-start gap-2.5 shadow-[4px_4px_0px_#000000]"
          >
            <AlertTriangle size={16} className="text-red-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-bold">{errorMessage}</p>
          </motion.div>
        )}

        {/* ================= STEP 1: PROFILE DETAILS FORM ================= */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                      <User size={13} className="text-black" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-bold outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-black" />
                      Graduation Year (Batch) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1970}
                      max={2035}
                      value={batchYear}
                      onChange={(e) => setBatchYear(parseInt(e.target.value) || 2024)}
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-mono font-black outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1">Department / Branch *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-bold outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Telecomm">Electronics &amp; Telecomm</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Artificial Intelligence & Data Science">AI &amp; Data Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                      <Linkedin size={13} className="text-black" />
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-mono text-[11px] font-bold outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                      <Building size={13} className="text-black" />
                      Current Company / Organization
                    </label>
                    <input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. Google, Microsoft, Startup, or Student"
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-bold outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                      <Briefcase size={13} className="text-black" />
                      Current Role / Job Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Software Development Engineer II"
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-bold outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-black" />
                      Skills You Can Offer / Teach (Skill Swap)
                    </label>
                    <input
                      type="text"
                      value={skillsOffered}
                      onChange={(e) => setSkillsOffered(e.target.value)}
                      placeholder="e.g. React, Next.js, System Design, Python"
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-bold outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-black" />
                      Skills You Want to Learn / Swap
                    </label>
                    <input
                      type="text"
                      value={skillsWanted}
                      onChange={(e) => setSkillsWanted(e.target.value)}
                      placeholder="e.g. AI Agents, Kubernetes, Product Strategy"
                      className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-bold outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-1">Professional Bio &amp; Goals</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your career background or what you hope to achieve on the alumni network..."
                    className="w-full px-3.5 py-2.5 border-2 border-black bg-[#F7F4EE] text-black font-medium leading-relaxed outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                {/* Optional Referral Code Box */}
                <div className="p-4 border-2 border-black bg-[#CCFF00]/20 space-y-2 shadow-[3px_3px_0px_#000000]">
                  <label className="block font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Gift size={14} className="text-black" />
                    Referral / Invite Code (Optional)
                  </label>
                  <p className="text-[11px] text-neutral-700 font-medium">
                    If an existing alumnus or student referred you, enter their code here. Both you (+50 pts) and your referrer (+100 pts) will earn rewards upon admin approval!
                  </p>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PRO-8F39K2"
                    className="w-full px-3.5 py-2 border-2 border-black bg-white text-black font-mono font-black uppercase tracking-wider outline-none focus:shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 border-3 border-black bg-[#CCFF00] hover:bg-black hover:text-[#CCFF00] text-black font-mono font-black uppercase tracking-wider text-sm shadow-[4px_4px_0px_#000000] hover:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>{submitting ? "Saving Profile..." : "Continue to Verification Step"}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: VERIFICATION STEP ================= */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
              {/* Branch A: Paid Verification (Razorpay) */}
              {config.mode === "paid" && (
                <div className="space-y-5">
                  <div className="p-5 border-3 border-black bg-[#F7F4EE] shadow-[4px_4px_0px_#000000] space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 border-2 border-black bg-[#CCFF00] text-black shadow-[2px_2px_0px_#000000]">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="font-mono text-base font-black uppercase tracking-wider text-black">Institutional Identity Verification</h3>
                        <p className="text-xs text-neutral-600 font-medium">One-time nominal fee for fraud prevention &amp; background vetting.</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border-2 border-black bg-white font-mono text-xs">
                      <span className="text-neutral-700 font-bold uppercase tracking-wider">Verification Fee:</span>
                      <span className="font-black text-black text-base">₹29.00 INR</span>
                    </div>

                    {hasPaid && (
                      <div className="p-3 border-2 border-black bg-[#00E676]/20 text-emerald-950 text-xs flex items-center gap-2 font-bold">
                        <CheckCircle2 size={16} className="text-emerald-800 shrink-0" />
                        <span>Previous verification fee confirmed. Resubmitting will NOT charge you again.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handlePaidVerification}
                      disabled={submitting}
                      className="w-full py-3.5 border-3 border-black bg-[#CCFF00] hover:bg-black hover:text-[#CCFF00] text-black font-mono font-black uppercase tracking-wider text-sm shadow-[4px_4px_0px_#000000] hover:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
                      className="w-full py-2.5 border-2 border-black bg-white text-xs font-mono font-black uppercase text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000000] transition-all"
                    >
                      ← Back to Profile Edit
                    </button>
                  </div>
                </div>
              )}

              {/* Branch B: Free Verification (College Domain, ID Upload, OTP) */}
              {config.mode === "free" && (
                <div className="space-y-5">
                  <div className="border-b-2 border-black pb-3">
                    <h3 className="font-mono text-base font-black uppercase tracking-wider text-black">Select Verification Credential</h3>
                    <p className="text-xs text-neutral-600 font-medium">Choose one of the campus-approved credential verification options.</p>
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
                        className={`flex flex-col items-center justify-center p-3 border-2 border-black text-xs font-mono font-black uppercase transition-all cursor-pointer ${
                          freeMethod === m.id
                            ? "bg-[#CCFF00] text-black shadow-[3px_3px_0px_#000000]"
                            : "bg-white text-neutral-600 hover:bg-neutral-100 shadow-[2px_2px_0px_#000000]"
                        }`}
                      >
                        <m.icon size={18} className="mb-1 text-black" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Free Option 1: College Email Domain */}
                  {freeMethod === "college_email" && (
                    <div className="p-4 border-2 border-black bg-[#F7F4EE] space-y-3 text-xs shadow-[3px_3px_0px_#000000]">
                      <label className="block font-mono text-xs font-black uppercase tracking-wider text-black">Institutional Email Address</label>
                      <p className="text-[11px] text-neutral-700 font-medium">
                        Must end with an accredited institutional domain (e.g. <code className="font-mono font-bold bg-white px-1 border border-black text-black">@somaiya.edu</code>, <code className="font-mono font-bold bg-white px-1 border border-black text-black">.edu</code>, or <code className="font-mono font-bold bg-white px-1 border border-black text-black">.ac.in</code>).
                      </p>
                      <input
                        type="email"
                        value={collegeEmail}
                        onChange={(e) => setCollegeEmail(e.target.value)}
                        placeholder="student@somaiya.edu"
                        className="w-full px-3.5 py-2.5 border-2 border-black bg-white text-black font-mono font-bold outline-none focus:shadow-[2px_2px_0px_#000000]"
                      />
                    </div>
                  )}

                  {/* Free Option 2: ID Card Upload */}
                  {freeMethod === "id_upload" && (
                    <div className="p-4 border-2 border-black bg-[#F7F4EE] space-y-3 text-xs shadow-[3px_3px_0px_#000000]">
                      <label className="block font-mono text-xs font-black uppercase tracking-wider text-black">Institutional ID Card URL / Document</label>
                      <p className="text-[11px] text-neutral-700 font-medium">
                        Provide a link to your uploaded student ID or graduation certificate for visual inspection by campus administrators.
                      </p>
                      <input
                        type="url"
                        value={idCardUrl}
                        onChange={(e) => setIdCardUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/.../id-card.jpg"
                        className="w-full px-3.5 py-2.5 border-2 border-black bg-white text-black font-mono text-[11px] font-bold outline-none focus:shadow-[2px_2px_0px_#000000]"
                      />
                    </div>
                  )}

                  {/* Free Option 3: OTP */}
                  {freeMethod === "otp" && (
                    <div className="p-4 border-2 border-black bg-[#F7F4EE] space-y-3 text-xs shadow-[3px_3px_0px_#000000]">
                      <label className="block font-mono text-xs font-black uppercase tracking-wider text-black">6-Digit Verification PIN (OTP)</label>
                      <p className="text-[11px] text-neutral-700 font-medium">
                        Enter the 6-digit confirmation code sent to your registered contact (Test code: <code className="font-mono font-bold bg-[#CCFF00] px-1 border border-black text-black">123456</code>).
                      </p>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3.5 py-2.5 border-2 border-black bg-white text-black font-mono font-black text-center text-base tracking-[0.3em] outline-none focus:shadow-[2px_2px_0px_#000000]"
                      />
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleFreeVerification}
                      disabled={submitting}
                      className="w-full py-3.5 border-3 border-black bg-[#CCFF00] hover:bg-black hover:text-[#CCFF00] text-black font-mono font-black uppercase tracking-wider text-sm shadow-[4px_4px_0px_#000000] hover:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>{submitting ? "Verifying Credentials..." : "Submit Verification for Admin Review"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full py-2.5 border-2 border-black bg-white text-xs font-mono font-black uppercase text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000000] transition-all"
                    >
                      ← Back to Profile Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 border-3 border-black bg-[#00E676] text-black text-xs font-mono font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-black" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
