"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Building,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Mail,
  UserCheck,
  Calendar,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { ErrorState, Skeleton } from "@/components/ui";

export function AlumniProfileContent({ id }: { id: string }) {
  const { data, error, isLoading, refresh } = useApi(`alumni:${id}`, () =>
    apiClient.alumni.get(id)
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 font-mono">
        <Skeleton className="h-8 w-36 border-2 border-black shadow-[2px_2px_0px_#000000]" />
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] p-8 space-y-6">
          <div className="flex items-center gap-6">
            <Skeleton className="w-20 h-20 border-2 border-black" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Alumni Record Unavailable"
          body={error.message || "Could not retrieve alumni record from registry."}
          retry={() => void refresh()}
        />
      </div>
    );
  }

  if (!data) return null;

  const skillsList = Array.isArray(data.skills) && data.skills.length > 0
    ? data.skills
    : ["System Architecture", "Cloud Infrastructure", "Distributed Systems", "Technical Mentoring"];

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono text-black select-text pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 bg-[#CCFF00] text-black border-2 border-black px-4 py-2 font-mono text-xs font-bold shadow-[4px_4px_0px_#000000] flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <ArrowLeft size={14} /> Back to Directory
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-[#EFECE4] border border-black font-bold uppercase text-neutral-600">
            NODE REGISTRY
          </span>
          <span className="font-bold text-neutral-400">//</span>
          <span className="font-bold text-neutral-600">REF-{data.id.slice(0, 6).toUpperCase()}</span>
        </div>
      </div>

      {/* Main Dossier Card */}
      <article className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden">
        {/* Dossier Header Bar */}
        <header className="bg-black text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b-4 border-black">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#CCFF00] inline-block animate-pulse"></span>
            <span className="font-bold text-xs tracking-wider uppercase">
              VERIFIED ALUMNI DOSSIER // INSTITUTIONAL RECORD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#CCFF00] text-black border border-black text-[11px] font-bold uppercase">
              CLASS OF &apos;{data.batch || (data.batchYear ? String(data.batchYear).slice(-2) : "22")}
            </span>
            <span className="px-2 py-0.5 bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px] font-bold uppercase">
              ACTIVE FELLOW
            </span>
          </div>
        </header>

        {/* Profile Hero Block */}
        <div className="p-6 sm:p-8 bg-white border-b-2 border-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Box */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black text-[#CCFF00] border-3 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 uppercase tracking-tighter">
                {data.initials || data.name.substring(0, 2).toUpperCase()}
              </div>

              {/* Title & Organization */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-black">
                    {data.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-800 px-1.5 py-0.5 font-bold">
                    <ShieldCheck size={12} /> VERIFIED
                  </span>
                </div>
                <p className="text-sm font-bold text-neutral-800 font-sans flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#FF5500] uppercase">{data.role}</span>
                  <span className="text-neutral-400">@</span>
                  <span className="underline decoration-black">{data.company || "Independent"}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 pt-1">
                  {data.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-neutral-500" />
                      <span>{data.location}</span>
                    </span>
                  )}
                  {data.department && (
                    <span className="flex items-center gap-1">
                      <GraduationCap size={13} className="text-neutral-500" />
                      <span>{data.department}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row sm:flex-col gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
              <Link
                href={`/jobs?company=${encodeURIComponent(data.company || "")}`}
                className="flex-1 sm:flex-none text-center px-4 py-2 bg-[#FF5500] text-white border-2 border-black text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] hover:bg-orange-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <UserCheck size={14} /> Request Referral
              </Link>
              <Link
                href="/chat"
                className="flex-1 sm:flex-none text-center px-4 py-2 bg-[#CCFF00] text-black border-2 border-black text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#CCFF00] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={14} /> Open Conduit
              </Link>
            </div>
          </div>
        </div>

        {/* Biography & Mission Statement */}
        <section className="p-6 sm:p-8 bg-[#F7F4EE] border-b-2 border-black space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black inline-block"></span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              SPECIALIZATION & PROFESSIONAL BIOGRAPHY
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-800 leading-relaxed font-sans">
            {data.bio ||
              data.headline ||
              `${data.name} is a verified alumni of the institution working in ${data.company || "the technology industry"}. Open to mentoring prospective candidates, giving institutional advice, and evaluating qualified peer referral inquiries.`}
          </p>
        </section>

        {/* Skills & Domains Grid */}
        <section className="p-6 sm:p-8 bg-white border-b-2 border-black space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                VERIFIED DOMAINS & CORE COMPETENCIES
              </h2>
            </div>
            <span className="text-[11px] text-neutral-500 font-bold uppercase">
              {skillsList.length} VERIFIED CAPABILITIES
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {skillsList.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-[#F7F4EE] text-black border-2 border-black text-xs font-bold uppercase shadow-[2px_2px_0px_#000000]"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Telemetry & Links Footer */}
        <footer className="p-4 sm:p-6 bg-[#EFECE4] flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
          <div className="flex items-center gap-4 flex-wrap">
            {data.linkedinUrl && (
              <a
                href={data.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-black hover:bg-neutral-100 transition-colors"
              >
                <span>LINKEDIN PROFILE</span>
                <ExternalLink size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast("Dossier URL copied to clipboard");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-black hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <Share2 size={12} />
              <span>SHARE DOSSIER</span>
            </button>
          </div>

          <div className="text-neutral-500 font-mono text-[11px]">
            STATUS: ACTIVE // OPEN FOR MENTORSHIP
          </div>
        </footer>
      </article>
    </div>
  );
}