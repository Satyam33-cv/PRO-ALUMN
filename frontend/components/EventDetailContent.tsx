"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import { Badge, Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { useApi } from "@/lib/hooks/useApi";

function formatDate(value?: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export function EventDetailContent({ id }: { id: string }) {
  const { data: event, error, isLoading, refresh } = useApi(`event:${id}`, () => apiClient.events.get(id));
  const [attending, setAttending] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRsvp() {
    setIsSubmitting(true);
    setStatus("");
    try {
      const result = await apiClient.events.rsvp(id);
      setAttending(result.attending);
      setStatus(result.attending ? "You are on the guest list." : "Your RSVP was removed.");
    } catch (requestError) {
      setStatus(requestError instanceof ApiError ? requestError.message : "We could not update your RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="max-w-3xl space-y-5"><Skeleton className="h-4 w-28" /><Skeleton className="h-16" /><Skeleton variant="card" className="h-72" /></div>;
  if (error) return <ErrorState title="Event unavailable" body={error.message} retry={() => void refresh()} />;
  if (!event) return null;

  return <div className="max-w-3xl"><Link href="/events" className="inline-flex items-center gap-2 text-sm text-ink-900/55 hover:text-brass-500"><ArrowLeft size={16} /> Back to events</Link><Card padding="lg" className="mt-10"><div className="flex flex-wrap items-start justify-between gap-4"><div><Badge tone="warning">Alumni gathering</Badge><h1 className="mt-4 font-display text-5xl leading-tight">{event.title}</h1></div><div className="flex h-16 w-16 flex-col items-center justify-center border border-brass-500/40 text-center"><span className="font-mono text-[10px] text-brass-500">{event.month}</span><span className="font-display text-3xl">{event.day}</span></div></div><div className="mt-8 space-y-3 border-y border-ink-900/10 py-5 text-sm text-ink-900/65"><p className="flex items-center gap-2"><MapPin size={16} className="text-brass-500" /> {event.place}</p><p className="flex items-center gap-2"><Clock3 size={16} className="text-brass-500" /> {formatDate(event.startsAt) ?? event.detail}</p></div><p className="mt-8 max-w-2xl text-base leading-7 text-ink-900/70">{event.detail}. Make space for a useful conversation, a familiar face, or a new beginning.</p><div className="mt-9 flex flex-wrap items-center gap-4"><Button type="button" variant={attending ? "secondary" : "primary"} iconRight={CalendarDays} onClick={handleRsvp} disabled={isSubmitting}>{isSubmitting ? "Updating..." : attending ? "Attending" : "RSVP to this event"}</Button>{status ? <p role="status" className="text-sm text-ink-900/65">{status}</p> : null}</div></Card></div>;
}
