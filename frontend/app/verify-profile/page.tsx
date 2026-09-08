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
import { apiClient } from "@/lib/api/client";
import Link from "next/link";

interface VerificationUser {
  name?: string | null;
  profileStatus?: string | null;
  verificationMethod?: string | null;
  rejectionReason?: string | null;
  email?: string | null;
  department?: string | null;
  batchYear?: number | string | null;
  referredByCode?: string | null;
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
      const currentUser = await apiClient.auth.me();
      if (currentUser && currentUser.id) {
        setUser(currentUser as unknown as VerificationUser);
        setLastChecked(new Date());

        if (currentUser.profileStatus === "APPROVED") {
          router.push("/home");
        } else if (currentUser.profileStatus === "INCOMPLETE" || currentUser.profileStatus === "REJECTED") {
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
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] text-black">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] flex items-center gap-3">
          <RefreshCw className="animate-spin text-black" size={24} />
          <span className="text-sm font-bold font-mono uppercase">Loading review status...</span>
        </div>
      </div>
    );
  }

  const methodBadge = () => {
    switch (user?.verificationMethod) {
      case "paid":
        return { label: "Verified Paid Application (₹29)", icon: CreditCard, color: "bg-[#FF5500] text-black border-2 border-black" };
      case "college_email":
        return { label: "Institutional Email Domain Verified", icon: Mail, color: "bg-[#FF5500] text-white border-2 border-black" };
      case "id_upload":
        return { label: "Institutional ID Document Attached", icon: FileText, color: "bg-purple-200 text-black border-2 border-black" };
      case "otp":
        return { label: "Phone/Email OTP Verified", icon: Phone, color: "bg-cyan-200 text-black border-2 border-black" };
      default:
        return { label: "Standard Review Queue", icon: Clock, color: "bg-neutral-100 text-black border-2 border-black" };
    }
  };

  const badge = methodBadge();

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Animated Status Pill */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-black bg-[#FF5500] text-white text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#000000]">
            <Clock size={14} className="stroke-[3]" />
            <span>CREDENTIAL VERIFICATION IN PROGRESS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Profile Under Admin Review
          </h1>

          <p className="font-mono text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Thank you for completing your profile! Campus administrators are reviewing your submitted credentials to protect our alumni trust network.
          </p>
        </div>

        {/* Status Card */}
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] space-y-5">
          <div className="flex items-center justify-between border-b-2 border-black pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FF5500] text-white font-mono font-black text-sm shadow-[2px_2px_0px_#000000]">
                {user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
              </div>
              <div>
                <h3 className="font-bold text-sm text-black">{user?.name}</h3>
                <p className="font-mono text-xs text-neutral-500">{user?.email}</p>
              </div>
            </div>

            <span className="px-3 py-1 text-xs font-mono font-black uppercase border-2 border-black bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]">
              PENDING
            </span>
          </div>

          {/* Submission Details */}
          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between py-2 border-b border-neutral-200">
              <span className="text-neutral-500">Department / Batch</span>
              <span className="font-bold text-black">{user?.department} ({user?.batchYear})</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-200">
              <span className="text-neutral-500">Verification Evidence</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 font-bold text-[11px] shadow-[1px_1px_0px_#000000] ${badge.color}`}>
                <badge.icon size={12} />
                <span>{badge.label}</span>
              </span>
            </div>

            {user?.referredByCode && (
              <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                <span className="text-neutral-500">Referral Code</span>
                <span className="font-bold text-black">{user.referredByCode} (+100 pts pending)</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <span className="text-neutral-500">Estimated Turnaround</span>
              <span className="font-bold text-emerald-700">Within 2–4 hours</span>
            </div>
          </div>

          {/* Perks Preview */}
          <div className="p-4 border-2 border-black bg-[#FFFBEA] space-y-2 shadow-[3px_3px_0px_#000000]">
            <h4 className="font-black text-xs uppercase text-black flex items-center gap-1.5">
              <Sparkles size={14} className="stroke-[3]" />
              <span>What unlocks automatically upon approval:</span>
            </h4>
            <ul className="font-mono text-xs text-neutral-700 space-y-1 pl-4 list-disc">
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
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 border-2 border-black bg-black text-[#FF5500] hover:bg-[#FF5500] hover:text-black font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
              <span>{checking ? "Checking Status..." : "Refresh Status"}</span>
            </button>

            <Link
              href="/complete-profile"
              className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 py-2.5 border-2 border-black bg-white text-black hover:bg-neutral-100 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-center"
            >
              <span>Edit Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <p className="text-[10px] text-neutral-500 text-center font-mono font-bold">
            Last checked: {lastChecked.toLocaleTimeString()} (auto-refreshing in background)
          </p>
        </div>
      </div>
    </div>
  );
}
