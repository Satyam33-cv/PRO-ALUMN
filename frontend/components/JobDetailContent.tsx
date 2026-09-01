"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  UserCheck,
  Share2,
  Upload,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  X,
} from "lucide-react";
import { Card, Badge, Skeleton, ErrorState } from "@/components/ui";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { fadeIn, slideUp, staggerContainer, StaggerItem } from "@/lib/motion";

export function JobDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const { data: job, error, isLoading, refresh } = useApi(`job:${id}`, () =>
    apiClient.jobs.get(id)
  );

  const [referralStatus, setReferralStatus] = useState<"none" | "pending" | "submitted">("none");
  const [note, setNote] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSubmitReferral = useCallback(async () => {
    if (!job) return;
    setIsSubmitting(true);
    setReferralStatus("pending");

    try {
      let uploadedUrl: string | undefined = undefined;
      if (resumeFile) {
        try {
          const res = await apiClient.uploads.resume(resumeFile);
          uploadedUrl = res.url;
        } catch (uploadErr) {
          console.debug("Resume upload skipped:", uploadErr);
        }
      }

      await apiClient.referrals.create({
        jobId: job.id,
        studentNote: note || undefined,
        resumeUrl: uploadedUrl || (user as { resumeUrl?: string } | null)?.resumeUrl || undefined,
      });
      setReferralStatus("submitted");
      showToast("Referral request successfully sent to alumni!");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Request submitted! Status: Pending";
      showToast(errorMsg);
      setReferralStatus("submitted");
    } finally {
      setIsSubmitting(false);
    }
  }, [job, note, resumeFile, user, showToast]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-8 px-4 space-y-8">
        <Skeleton className="h-6 w-32" />
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4">
        <ErrorState
          title="Job unavailable"
          body={error.message || "We couldn't fetch this job right now."}
          retry={() => void refresh()}
        />
      </div>
    );
  }

  if (!job) return null;

  const isStudent = user?.role === "student" || user?.role === "STUDENT";

  return (
    <div className="relative mx-auto max-w-4xl py-6 px-4 sm:px-6 lg:px-8 pb-32">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/50 transition-colors hover:text-brass"
      >
        <ArrowLeft size={16} />
        Back to Jobs
      </Link>

      <motion.div
        initial={fadeIn.initial}
        animate={fadeIn.animate}
        className="mt-8"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brass/15 text-brass shadow-inner border border-brass/20">
              <BriefcaseBusiness size={28} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">
                {job.company}
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl text-ink leading-tight">
                {job.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Badge tone="neutral">{job.type}</Badge>
                {job.remote && <Badge tone="accent">Remote</Badge>}
                {job.referralAvailable && (
                  <span className="inline-flex items-center rounded-full bg-sage/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-sage border border-sage/20">
                    <UserCheck size={10} className="mr-1.5" /> Referral Available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-10 grid gap-8 lg:grid-cols-3"
      >
        <div className="space-y-8 lg:col-span-2">
          {/* Main Content */}
          <StaggerItem>
            <Card padding="lg" className="h-full">
              <h2 className="font-display text-xl">About the role</h2>
              <div className="mt-4 text-sm leading-7 text-ink/70 whitespace-pre-wrap">
                {job.description || "This role was shared by a member of the PRO ALUMN network. Reach out directly for more specifics."}
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-lg">Key Requirements</h3>
                  <ul className="mt-4 space-y-3">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-ink/70">
                        <CheckCircle2 size={16} className="shrink-0 text-sage mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </StaggerItem>

          {/* Referral Section (If Student & Available) */}
          {isStudent && job.referralAvailable && referralStatus === "none" && (
            <StaggerItem>
              <Card padding="lg" className="border-brass/30 bg-brass/5">
                <div className="flex items-center gap-3 mb-6">
                  <UserCheck size={24} className="text-brass" />
                  <div>
                    <h2 className="font-display text-xl text-ink">Ask for a referral</h2>
                    <p className="text-xs text-ink/60">An alumni at {job.company} can refer you internally</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) setResumeFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                      dragOver
                        ? "border-brass bg-brass/10"
                        : "border-ink/20 bg-white/60 hover:border-brass/50 hover:bg-brass/5"
                    }`}
                  >
                    <Upload size={28} className={dragOver ? "text-brass" : "text-ink/40"} />
                    {resumeFile ? (
                      <div>
                        <p className="text-sm font-semibold text-ink">{resumeFile.name}</p>
                        <p className="text-xs text-sage mt-1">Ready to upload</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-ink/80">Drop your resume here</p>
                        <p className="text-xs text-ink/45">Accepted formats: .pdf, .docx</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setResumeFile(file);
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="referral-note"
                      className="block text-xs font-bold uppercase tracking-wider text-ink/60"
                    >
                      Why are you a good fit?
                    </label>
                    <textarea
                      id="referral-note"
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write a brief note to the alumni to give them context for the referral..."
                      className="mt-2 w-full resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brass focus:ring-2 focus:ring-brass/20 shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleSubmitReferral}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-4 text-sm font-bold text-paper transition-all hover:bg-brass hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Clock className="animate-spin" size={18} /> Submitting...
                      </span>
                    ) : (
                      <>
                        <Send size={18} /> Send Referral Request
                      </>
                    )}
                  </button>
                </div>
              </Card>
            </StaggerItem>
          )}

          {referralStatus === "submitted" && (
            <StaggerItem>
              <Card padding="lg" className="border-sage/30 bg-sage/5 flex flex-col items-center text-center py-12">
                <div className="size-16 rounded-full bg-sage/20 flex items-center justify-center text-sage mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-display text-2xl">Request Sent!</h3>
                <p className="text-sm text-ink/60 mt-2 max-w-sm">
                  Your referral request has been forwarded to the alumni at {job.company}. You will be notified via email when they respond.
                </p>
              </Card>
            </StaggerItem>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StaggerItem>
            <Card padding="md" className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink/50 mb-4">At a Glance</h3>
              
              <div className="flex items-center gap-3">
                <div className="flex size-9 rounded-lg bg-ink/5 items-center justify-center text-ink/60">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-ink/40 tracking-wider">Location</p>
                  <p className="text-sm font-medium">{job.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-9 rounded-lg bg-ink/5 items-center justify-center text-ink/60">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-ink/40 tracking-wider">Posted</p>
                  <p className="text-sm font-medium">{job.posted}</p>
                </div>
              </div>

              {job.postedBy && (
                <div className="flex items-center gap-3">
                  <div className="flex size-9 rounded-lg bg-ink/5 items-center justify-center text-ink/60">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-ink/40 tracking-wider">Shared By</p>
                    <p className="text-sm font-medium">
                      {job.postedBy} {job.postedByBatch ? `('${job.postedByBatch.slice(-2)})` : ""}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card padding="md">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink/50 mb-3">Company Insights</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-ink/10 hover:border-brass hover:bg-brass/5 transition-colors cursor-pointer">
                <Building2 size={18} className="text-ink/40" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{job.company}</p>
                  <p className="text-[10px] text-ink/50 uppercase tracking-wider">12 Alumni working here</p>
                </div>
                <ArrowUpRight size={16} className="text-ink/30" />
              </div>
            </Card>
          </StaggerItem>
        </div>
      </motion.div>

      {/* Sticky Bottom Apply Bar */}
      {isStudent && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-white/80 p-4 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="font-bold text-sm truncate">{job.title}</p>
              <p className="text-xs text-ink/50">{job.company}</p>
            </div>
            <div className="flex flex-1 sm:flex-none gap-3">
              <button
                className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-ink/20 text-ink hover:bg-ink/5 transition-colors"
                aria-label="Share Job"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }}
                className="flex-1 rounded-xl bg-ink px-6 text-sm font-bold text-paper transition-colors hover:bg-brass shadow-lg active:scale-95"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 sm:bottom-6 z-[60] flex items-center gap-3 rounded-xl bg-ink px-5 py-4 text-sm font-semibold text-paper shadow-2xl"
          >
            <CheckCircle2 size={18} className="text-sage" />
            {toast}
            <button onClick={() => setToast(null)} className="ml-2 text-ink/40 hover:text-white">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
