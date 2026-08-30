"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Bookmark,
  BriefcaseBusiness,
  Upload,
  X,
  MapPin,
  CalendarDays,
  UserCheck,
  Share2,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { Job } from "@/lib/api/types";
import {
  fadeIn,
  slideUp,
  staggerContainer,
  StaggerItem,
} from "@/lib/motion";

type FilterChip = "All" | "Full-time" | "Internship" | "Remote" | "Referral Available";

const chips: FilterChip[] = ["All", "Full-time", "Internship", "Remote", "Referral Available"];

type ReferralStatus = "none" | "pending" | "accepted" | "rejected";

export function JobListContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<FilterChip>("All");
  const { data: apiJobs } = useApi("jobs:list", () => apiClient.jobs.list());
  const jobsList = useMemo(() => (apiJobs || []) as Job[], [apiJobs]);
  const [referralStates, setReferralStates] = useState<Record<string, ReferralStatus>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      const matchesQuery =
        query === "" ||
        [job.title, job.company, job.type, job.location]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      let matchesChip = true;
      if (activeChip === "Full-time") matchesChip = job.type === "Full-time";
      else if (activeChip === "Internship") matchesChip = job.type === "Internship";
      else if (activeChip === "Remote") matchesChip = job.remote === true;
      else if (activeChip === "Referral Available") matchesChip = job.referralAvailable === true;

      return matchesQuery && matchesChip;
    });
  }, [query, activeChip, jobsList]);

  const openJob = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    setNote("");
    setResumeFile(null);
    setDragOver(false);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const closeJob = useCallback(() => {
    setSelectedJobId(null);
    setNote("");
    setResumeFile(null);
    setDragOver(false);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSubmitReferral = useCallback(async () => {
    if (!selectedJobId) return;
    setReferralStates((prev) => ({ ...prev, [selectedJobId]: "pending" }));
    closeJob();

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
        jobId: selectedJobId,
        studentNote: note || undefined,
        resumeUrl: uploadedUrl || (user as { resumeUrl?: string } | null)?.resumeUrl || undefined,
      });
      showToast("Referral request submitted to alumni! Track in Referral Tracker.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Referral request submitted! Status: Pending";
      showToast(errorMsg);
    }
  }, [selectedJobId, note, resumeFile, user, closeJob, showToast]);

  const toggleBookmark = useCallback((jobId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const selectedJob = selectedJobId ? jobsList.find((j) => j.id === selectedJobId) : null;
  const selectedStatus = selectedJobId ? referralStates[selectedJobId] || "none" : "none";

  const isAlumniOrAdmin = user?.role === "alumni" || user?.role === "admin";

  return (
    <div className="relative">
      <motion.div initial={fadeIn.initial} animate={fadeIn.animate} transition={fadeIn.transition}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Career board</p>
        <h1 className="mt-2 font-display text-5xl">Open doors.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink/55">
          Roles shared by people who know where you come from.
        </p>

        {isAlumniOrAdmin && (
          <a
            href="/jobs/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold text-paper transition-colors hover:bg-brass focus:outline-none focus:ring-2 focus:ring-brass"
          >
            Post a Job
          </a>
        )}
      </motion.div>

      <motion.div
        initial={slideUp.initial}
        animate={slideUp.animate}
        transition={slideUp.transition}
        className="mt-10 max-w-3xl"
      >
        <div className="flex items-center gap-3 rounded-full border border-ink/10 bg-white/70 px-4 py-3">
          <Search size={18} className="shrink-0 text-ink/45" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
            placeholder="Search job titles, companies, or locations"
          />
        </div>
      </motion.div>

      <motion.div
        initial={slideUp.initial}
        animate={slideUp.animate}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6 flex flex-wrap gap-2 max-w-3xl"
      >
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveChip(chip)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              activeChip === chip
                ? "bg-sage text-white"
                : "border border-ink/10 bg-white/70 text-ink/65 hover:border-ink/25"
            }`}
          >
            {chip}
          </button>
        ))}
      </motion.div>

      <div className="mt-8 flex gap-6 lg:grid lg:grid-cols-[1.2fr_1fr]">
        <div className="flex-1 min-w-0" ref={listRef}>
          <motion.section
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {filteredJobs.map((job) => {
              const status = referralStates[job.id] || "none";
              return (
                <StaggerItem key={job.id}>
                  <Card
                    padding="md"
                    className={`relative cursor-pointer transition-all ${
                      selectedJobId === job.id ? "ring-2 ring-brass" : ""
                    }`}
                    onClick={() => openJob(job.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-brass/15 text-brass">
                        <BriefcaseBusiness size={19} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-display text-lg leading-snug">
                              {job.title}
                            </h2>
                            <p className="mt-1 text-xs text-ink/50">
                              {job.company} &middot; {job.location}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(job.id);
                            }}
                            className="mt-0.5 shrink-0 text-ink/30 transition-colors hover:text-brass"
                            aria-label={bookmarks.has(job.id) ? "Remove bookmark" : "Bookmark job"}
                          >
                            <Bookmark
                              size={18}
                              fill={bookmarks.has(job.id) ? "currentColor" : "none"}
                              className={bookmarks.has(job.id) ? "text-brass" : ""}
                            />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge tone="neutral">{job.type}</Badge>
                          {job.referralAvailable && (
                            <span className="inline-flex items-center rounded-full bg-tertiaryOnContainer/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-tertiaryOnContainer">
                              Referral Available
                            </span>
                          )}
                          {status !== "none" && (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${
                                status === "pending"
                                  ? "bg-brass/15 text-brass"
                                  : status === "accepted"
                                  ? "bg-sage/10 text-sage"
                                  : "bg-clay/10 text-clay"
                              }`}
                            >
                              {status}
                            </span>
                          )}
                          <span className="ml-auto font-mono text-[10px] uppercase text-ink/40">
                            {job.posted}
                          </span>
                        </div>

                        {user?.role === "student" && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                              href={`/jobs/${job.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-paper transition-colors hover:bg-brass focus:outline-none focus:ring-2 focus:ring-brass"
                            >
                              Apply
                            </Link>
                            {job.referralAvailable && status === "none" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openJob(job.id);
                                }}
                                className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white/70 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brass hover:text-brass focus:outline-none focus:ring-2 focus:ring-brass"
                              >
                                Request Referral
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}

            {filteredJobs.length === 0 && (
              <Card padding="lg">
                <div className="flex flex-col items-start gap-4 border border-dashed border-ink/20 bg-paper/60 p-8 sm:p-10">
                  <BriefcaseBusiness size={22} className="text-brass" strokeWidth={1.6} />
                  <div>
                    <h3 className="font-display text-2xl">No roles match</h3>
                    <p className="mt-2 max-w-prose text-sm leading-6 text-ink/60">
                      Try a different search or filter to find what you&apos;re looking for.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </motion.section>
        </div>

        <AnimatePresence mode="wait">
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="lg:sticky lg:top-24 h-[calc(100vh-6rem)] overflow-y-auto"
            >
              <Card padding="lg" className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-[0.08em] text-sage">Job Details</span>
                    <h2 className="mt-2 font-display text-2xl">{selectedJob.title}</h2>
                    <p className="mt-1 text-sm text-ink/50">{selectedJob.company}</p>
                  </div>
                  <button
                    onClick={closeJob}
                    className="shrink-0 text-ink/35 transition-colors hover:text-ink"
                    aria-label="Close details"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-6">
                  <Badge tone="neutral">{selectedJob.type}</Badge>
                  {selectedJob.remote && (
                    <Badge tone="accent">Remote</Badge>
                  )}
                  {selectedJob.referralAvailable && (
                    <span className="inline-flex items-center rounded-full bg-tertiaryOnContainer/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-tertiaryOnContainer">
                      <UserCheck size={10} className="mr-1" /> Referral Available
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-ink/5">
                    <MapPin size={18} className="text-brass" />
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-ink/45">Location</p>
                      <p className="text-sm font-medium">{selectedJob.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-ink/5">
                    <CalendarDays size={18} className="text-brass" />
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-ink/45">Posted</p>
                      <p className="text-sm font-medium">{selectedJob.posted}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-ink/5">
                    <Share2 size={18} className="text-brass" />
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-ink/45">Share</p>
                      <p className="text-sm text-ink/60">Copy link to refer a friend</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink/10 pt-6">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink/45">Description</p>
                  <p className="mt-3 text-sm leading-6 text-ink/70 whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>

                <div className="border-t border-ink/10 pt-6">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink/45">Requirements</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                    {(selectedJob.requirements || []).map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex h-1.5 w-1.5 shrink-0 mt-2.5 rounded-full bg-brass" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {user?.role === "student" && selectedJob.referralAvailable && selectedStatus === "none" && (
                  <div className="border-t border-ink/10 pt-6 space-y-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-brass/5 border border-brass/20">
                      <UserCheck size={20} className="text-brass" />
                      <div>
                        <p className="font-medium text-ink">Ask for a referral</p>
                        <p className="text-xs text-ink/50">Alumni at {selectedJob.company} can refer you directly</p>
                      </div>
                    </div>

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
                      className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                        dragOver
                          ? "border-brass bg-brass/5"
                          : "border-ink/15 bg-white/50 hover:border-ink/30"
                      }`}
                    >
                      <Upload size={24} className="text-ink/35" />
                      {resumeFile ? (
                        <p className="text-sm text-ink/65">{resumeFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-ink/70">Upload your resume</p>
                          <p className="text-xs text-ink/40">Accepted formats: .pdf, .doc</p>
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
                        className="block text-xs font-semibold uppercase tracking-wider text-ink/50"
                      >
                        Write a short note to the alumni
                      </label>
                      <textarea
                        id="referral-note"
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Tell them why you&apos;re interested and how they can help..."
                        className="mt-3 w-full resize-none rounded-lg border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brass focus:ring-1 focus:ring-brass"
                      />
                    </div>

                    <button
                      onClick={handleSubmitReferral}
                      className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-brass focus:outline-none focus:ring-2 focus:ring-brass"
                    >
                      Send Referral Request
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-[60] rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}