"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Clock3, MapPin, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import { Badge, Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { useApi } from "@/lib/hooks/useApi";
import type { EventAttendee } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function getRoleBadge(role?: string) {
  const normalized = (role || "").toUpperCase();
  if (normalized === "ALUMNI") return <Badge tone="success">Alumni</Badge>;
  if (normalized === "STUDENT") return <Badge tone="accent">Student</Badge>;
  if (normalized === "FACULTY") return <Badge tone="warning">Faculty</Badge>;
  if (normalized === "ADMIN") return <Badge tone="neutral">Admin</Badge>;
  return null;
}

export function EventDetailContent({ id }: { id: string }) {
  const { data: event, error, isLoading, refresh } = useApi(`event:${id}`, () => apiClient.events.get(id));
  const [attending, setAttending] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setAttending(Boolean(event.hasRsvp));
    }
  }, [event?.hasRsvp]);

  async function handleToggleRsvp() {
    setIsSubmitting(true);
    setStatus("");
    try {
      if (attending) {
        const result = await apiClient.events.cancelRsvp(id);
        setAttending(result.attending);
        setStatus("Your RSVP has been cancelled.");
      } else {
        const result = await apiClient.events.rsvp(id);
        setAttending(result.attending);
        setStatus("You are confirmed on the guest list!");
      }
      await refresh();
    } catch (requestError) {
      setStatus(requestError instanceof ApiError ? requestError.message : "We could not update your RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-5" aria-busy="true" aria-label="Loading event details">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-16" />
        <Skeleton variant="card" className="h-72" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Event unavailable" body={error.message} retry={() => void refresh()} />;
  }

  if (!event) return null;

  const eventDate = event.date || event.startsAt ? new Date(event.date || event.startsAt!) : null;
  const displayMonth = event.month || (eventDate ? eventDate.toLocaleString("en", { month: "short" }).toUpperCase() : "EVENT");
  const displayDay = event.day || (eventDate ? String(eventDate.getDate()) : "--");
  const displayLocation = event.place || event.location || "Location to be announced";
  const displayDescription = event.detail || event.description || "Join us for this gathering.";
  const displayTime = formatDate(event.startsAt || event.date) ?? displayDescription;

  const rsvps = event.rsvps || [];
  const attendeeCount = event._count?.rsvps ?? rsvps.length;
  const maxCapacity = event.maxCapacity ?? event.capacity;
  const isFull = maxCapacity != null && attendeeCount >= maxCapacity;

  return (
    <div className="max-w-3xl space-y-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-ink-900/55 hover:text-brass-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-500"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to events
      </Link>

      <Card padding="lg" className="mt-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <Badge tone="warning">Alumni gathering</Badge>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl leading-tight text-ink-900">{event.title}</h1>
          </div>
          <div
            className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center border border-brass-500/40 text-center"
            aria-label={`Event date: ${displayMonth} ${displayDay}`}
          >
            <span className="font-mono text-[10px] text-brass-500">{displayMonth}</span>
            <span className="font-display text-3xl text-ink-900">{displayDay}</span>
          </div>
        </div>

        <div className="mt-8 space-y-3 border-y border-ink-900/10 py-5 text-sm text-ink-900/65">
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-brass-500 flex-shrink-0" aria-hidden="true" />
            <span>{displayLocation}</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock3 size={16} className="text-brass-500 flex-shrink-0" aria-hidden="true" />
            <span>{displayTime}</span>
          </p>
        </div>

        <p className="mt-8 max-w-2xl text-base leading-7 text-ink-900/70">{displayDescription}</p>

        {/* RSVP Action Bar */}
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant={attending ? "secondary" : "primary"}
            iconRight={attending ? X : CalendarDays}
            onClick={handleToggleRsvp}
            disabled={isSubmitting || (!attending && isFull)}
            aria-pressed={attending}
          >
            {isSubmitting
              ? "Updating..."
              : attending
              ? "Cancel RSVP"
              : isFull
              ? "Event Full"
              : "RSVP to this event"}
          </Button>

          {attending && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 bg-sage-500/10 px-3 py-1.5 rounded-full">
              <Check size={14} aria-hidden="true" /> You are attending
            </span>
          )}

          {status ? (
            <p role="status" aria-live="polite" className="text-sm text-ink-900/65">
              {status}
            </p>
          ) : null}
        </div>
      </Card>

      {/* Attendees Section */}
      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Users size={20} className="text-brass-500" aria-hidden="true" />
            <h2 className="font-display text-2xl text-ink-900">Attendees</h2>
            <Badge tone="neutral">
              {attendeeCount} {attendeeCount === 1 ? "person" : "people"}
            </Badge>
          </div>
          {maxCapacity != null && (
            <span className="font-mono text-xs text-ink-900/60">
              {attendeeCount} / {maxCapacity} spots filled
            </span>
          )}
        </div>

        {rsvps.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-900/55">
            <Users size={32} className="mx-auto mb-2 text-ink-900/25" aria-hidden="true" />
            <p className="font-medium text-ink-900/80">No RSVPs yet</p>
            <p className="mt-1 text-xs">Be the first to RSVP and let fellow members know you will be there!</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Event attendee list">
            {rsvps.map((rsvp) => {
              const u: EventAttendee = rsvp.user || { id: rsvp.userId, name: "Attendee" };
              const initials = (u.name || "A")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const subtitle = [
                u.jobTitle && u.currentCompany ? `${u.jobTitle} at ${u.currentCompany}` : u.jobTitle || u.currentCompany,
                u.department,
                u.batchYear ? `'${String(u.batchYear).slice(-2)}` : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <div
                  key={rsvp.userId}
                  role="listitem"
                  className="flex items-center gap-3.5 rounded-lg border border-ink-900/10 bg-paper-100/50 p-3 transition hover:border-brass-500/40"
                >
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded-full object-cover border border-ink-900/10"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brass-500/15 font-mono text-xs font-semibold text-brass-600"
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink-900">{u.name}</span>
                      {getRoleBadge(u.role)}
                    </div>
                    {subtitle ? (
                      <p className="truncate text-xs text-ink-900/60 mt-0.5">{subtitle}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
