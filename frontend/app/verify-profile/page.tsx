"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  RefreshCw,
  Mail,
  CreditCard,
  FileText,
  Phone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui";
import { getCurrentUserVerificationStatusAction } from "@/app/actions/verification";
import Link from "next/link";

interface VerificationUser {
  name?: string;
  profileStatus?: string;
  verificationMethod?: string;
  rejectionReason?: string;
  [key: string]: unknown;
}

export default function VerifyProfileHoldingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [user, setUser] = useState<VerificationUser | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkStatus = useCallback(async (showSpinner = false) => {
    if (showSpinner) setChecking(true);
    try {
      const res = await getCurrentUserVerificationStatusAction();
      if (res.success && res.user) {
        setUser(res.user as unknown as VerificationUser);
        setLastChecked(new Date());

        if (res.user.profileStatus === "APPROVED") {
          router.push("/home");
        } else if (res.user.profileStatus === "INCOMPLETE" || res.user.profileStatus === "REJECTED") {
          router.push("/complete-profile");
        }
      }
    } catch (err) {
      console.error("Status check failed:", err);
    } finally {
      if (showSpinner) setChecking(false);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkStatus(false);
    // Poll every 8 seconds in background
    const interval = setInterval(() => checkStatus(false), 8000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-500" size={24} />
          <span className="text-sm font-bold font-mono">Loading review status...</span>
        </div>
      </div>
    );
  }

  const methodBadge = () => {
    switch (user?.verificationMethod) {
      case "paid":
        return { label: "Verified Paid Application (₹29)", icon: CreditCard, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "college_email":
        return { label: "Institutional Email Domain Verified", icon: Mail, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "id_upload":
        return { label: "Institutional ID Document Attached", icon: FileText, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case "otp":
        return { label: "Phone/Email OTP Verified", icon: Phone, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      default:
        return { label: "Standard Review Queue", icon: Clock, color: "text-slate-400 bg-slate-800 border-slate-700" };
    }
  };

  const badge = methodBadge();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Animated Status Pill */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold animate-pulse">
            <Clock size={14} />
            <span>CREDENTIAL VERIFICATION IN PROGRESS</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Profile Under Admin Review
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Thank you for completing your profile! Campus administrators are reviewing your submitted credentials to protect our alumni trust network.
          </p>
        </div>

        {/* Status Card */}
        <Card padding="lg" className="bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 font-bold font-display">
                {user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{user?.name}</h3>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              PENDING
            </span>
          </div>

          {/* Submission Details */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Department / Batch</span>
              <span className="font-bold text-slate-200">{user?.department} ({user?.batchYear})</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Verification Evidence</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-bold text-[11px] ${badge.color}`}>
                <badge.icon size={12} />
                <span>{badge.label}</span>
              </span>
            </div>

            {user?.referredByCode && (
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Referral Code</span>
                <span className="font-mono font-bold text-purple-400">{user.referredByCode} (+100 pts pending)</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Estimated Turnaround</span>
              <span className="font-bold text-emerald-400">Within 2–4 hours</span>
            </div>
          </div>

          {/* Perks Preview */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
            <h4 className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>What unlocks automatically upon approval:</span>
            </h4>
            <ul className="text-[11px] text-slate-400 space-y-1 pl-4 list-disc">
              <li>+50 Welcome Points deposited immediately into your Wallet Ledger</li>
              <li>Access to Verified Alumni Directory &amp; 1:1 Mentorship Requests</li>
              <li>Direct Referral Requests for openings at Top Companies</li>
              <li>AI 384-dimensional Career &amp; Skill Similarity Matchmaking</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => checkStatus(true)}
              disabled={checking}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={checking ? "animate-spin text-blue-400" : "text-slate-400"} />
              <span>{checking ? "Checking Status..." : "Refresh Status"}</span>
            </button>

            <Link
              href="/complete-profile"
              className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800/80 text-slate-300 text-xs font-bold transition-all text-center"
            >
              <span>Edit Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <p className="text-[10px] text-slate-500 text-center font-mono">
            Last checked: {lastChecked.toLocaleTimeString()} (auto-refreshing in background)
          </p>
        </Card>
      </div>
    </div>
  );
}
