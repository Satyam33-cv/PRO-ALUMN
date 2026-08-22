"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { Button, Card, ErrorState, Field, Skeleton } from "@/components/ui";

export function JobDetailContent({ id }: { id: string }) {
  const { data: job, error, isLoading, refresh } = useApi(`job:${id}`, () => apiClient.jobs.get(id));
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestIntroduction() {
    if (!job || !message.trim()) {
      setStatus("Add a short note so the connection has context.");
      return;
    }
    setIsSubmitting(true);
    setStatus("");
    try {
      await apiClient.requests.create(job.id, message.trim());
      setStatus("Your introduction request has been sent.");
      setMessage("");
    } catch (requestError) {
      setStatus(requestError instanceof ApiError ? requestError.message : "We could not send the request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="max-w-3xl space-y-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-16" /><Skeleton variant="card" className="h-80" /></div>;
  if (error) return <ErrorState title="Job unavailable" body={error.message} retry={() => void refresh()} />;
  if (!job) return null;

  return <div className="max-w-3xl"><Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-ink-900/55 hover:text-brass-500"><ArrowLeft size={16} /> Back to jobs</Link><div className="mt-12"><p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-500">{job.company} · {job.type}</p><h1 className="mt-3 font-display text-6xl leading-none">{job.title}</h1><p className="mt-6 text-sm text-ink-900/55">{job.location} · Shared by {job.postedBy ?? "your alumni network"}{job.postedByBatch ? `, Class of ${job.postedByBatch}` : ""}</p></div><Card padding="lg" className="mt-12"><h2 className="font-display text-3xl">A role worth a closer look.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-ink-900/65">{job.description ?? "This role was shared by a member of the PRO ALUMN network."}</p><div className="mt-9 max-w-xl"><Field label="Note to your connection" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What would you like to ask?" /><Button type="button" className="mt-5" iconRight={ArrowUpRight} onClick={requestIntroduction} disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Ask for an introduction"}</Button>{status ? <p role="status" className="mt-4 text-sm text-ink-900/65">{status}</p> : null}</div></Card></div>;
}
