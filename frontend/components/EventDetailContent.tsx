"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Users,
  X,
  ShieldCheck,
  CheckCircle2,
  Ticket,
  Share2,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import { ErrorState, Skeleton } from "@/components/ui";
import { useApi } from "@/lib/hooks/useApi";
import type { EventAttendee } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function EventDetailContent({ id }: { id: string }) {
  const { data: event, error, isLoading, refresh } = useApi(`event:${id}`, () =>
    apiClient.events.get(id)
  );
  const [attending, setAttending] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
        setStatus("Your RSVP pass has been released.");
        showToast("RSVP cancelled");
      } else {
        const result = await apiClient.events.rsvp(id);
        setAttending(result.attending);
        setStatus("Admission pass confirmed on official enclave roster!");
        showToast("Admission pass generated!");
      }
      await refresh();
    } catch (requestError) {
      setStatus(
        requestError instanceof ApiError
          ? requestError.message
          : "We could not update your RSVP."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 font-mono">
        <Skeleton className="h-8 w-36 border-2 border-black" />
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] p-8 space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Assemblage Unavailable"
          body={error.message || "Could not retrieve event record from registry."}
          retry={() => void refresh()}
        />
      </div>
    );
  }

  if (!event) return null;

  const eventDate =
    event.date || event.startsAt ? new Date(event.date || event.startsAt!) : null;
  const displayMonth =
    event.month ||
    (eventDate
      ? eventDate.toLocaleString("en", { month: "short" }).toUpperCase()
      : "EVENT");
  const displayDay =
    event.day || (eventDate ? String(eventDate.getDate()).padStart(2, "0") : "--");
  const displayLocation = event.place || event.location || "Main Campus Auditorium";
  const displayDescription =
    event.detail ||
    event.description ||
    "Official alumni and student gathering hosted by the institution.";
  const displayTime =
    formatDate(event.startsAt || event.date) ?? "18:00 EST // Scheduled";

  const rsvps = event.rsvps || [];
  const attendeeCount = event._count?.rsvps ?? rsvps.length;
  const maxCapacity = event.maxCapacity ?? event.capacity ?? 150;
  const isFull = maxCapacity != null && attendeeCount >= maxCapacity;
  const capacityPct = Math.min(100, Math.round((attendeeCount / maxCapacity) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono text-black select-text pb-16">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 bg-[#FF5500] text-white border-2 border-black px-4 py-2 font-mono text-xs font-bold shadow-[4px_4px_0px_#000000] flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <ArrowLeft size={14} /> Back to Events
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-[#F5F5F5] border border-black font-bold uppercase text-neutral-600">
            ASSEMBLAGE
          </span>
          <span className="font-bold text-neutral-400">//</span>
          <span className="font-bold text-neutral-600">EV-{event.id.slice(0, 6).toUpperCase()}</span>
        </div>
      </div>

      {/* Main Assemblage Container */}
      <article className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden">
        {/* Header Bar */}
        <header className="bg-black text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b-4 border-black">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block animate-pulse"></span>
            <span className="font-bold text-xs tracking-wider uppercase">
              CONCLAVE SPECIFICATION // TICKETING PROTOCOL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#FF5500] text-white border border-black text-[11px] font-bold uppercase">
              {event.mode || "PHYSICAL"}
            </span>
            <span className="px-2 py-0.5 bg-[#FF5500] text-white border border-black text-[11px] font-bold uppercase">
              {capacityPct}% CAPACITY
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="p-6 sm:p-8 bg-white border-b-2 border-black">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              {/* Date Block */}
              <div className="w-18 h-20 sm:w-22 sm:h-24 bg-black text-white border-3 border-black shadow-[3px_3px_0px_#000000] flex flex-col items-center justify-center shrink-0">
                <span className="text-[11px] font-bold tracking-widest text-[#FF5500] uppercase">
                  {displayMonth}
                </span>
                <span className="text-3xl sm:text-4xl font-black font-sans text-white leading-none">
                  {displayDay}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-[#FFFFFF] border border-black text-[10px] font-bold uppercase text-neutral-600 inline-block">
                  FLAGSHIP GATHERING
                </span>
                <h1 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-black">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-700 pt-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <MapPin size={14} className="text-[#FF5500]" />
                    <span>{displayLocation}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <Clock3 size={14} className="text-neutral-500" />
                    <span>{displayTime}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast("Event link copied to clipboard");
              }}
              className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-black hover:text-white border-2 border-black text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] transition-colors flex items-center gap-1.5 cursor-pointer self-start"
            >
              <Share2 size={13} /> Share
            </button>
          </div>

          {/* Capacity Meter Bar */}
          <div className="mt-6 pt-4 border-t-2 border-neutral-200 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-600 uppercase">AUDITORIUM ENCLAVE SEATING:</span>
              <span className="text-black">
                {attendeeCount} OF {maxCapacity} SEATS RESERVED
              </span>
            </div>
            <div className="w-full bg-[#FFFFFF] border-2 border-black h-3 overflow-hidden p-0.5">
              <div
                className="bg-black h-full transition-all duration-500"
                style={{ width: `${capacityPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <section className="p-6 sm:p-8 bg-[#FFFFFF] border-b-2 border-black space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black inline-block"></span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              PROGRAM OVERVIEW & ITINERARY
            </h2>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-neutral-800 font-sans whitespace-pre-wrap">
            {displayDescription}
          </p>

          {/* RSVP Action Box */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleToggleRsvp}
              disabled={isSubmitting || (!attending && isFull)}
              className={`px-6 py-3 border-2 border-black text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                attending
                  ? "bg-black text-[#FF5500] hover:bg-neutral-900"
                  : isFull
                  ? "bg-neutral-200 text-neutral-500 cursor-not-allowed shadow-none"
                  : "bg-[#FF5500] text-white hover:bg-black hover:text-white"
              }`}
            >
              <Ticket size={16} />
              <span>
                {isSubmitting
                  ? "Updating Pass..."
                  : attending
                  ? "Cancel Reservation Pass"
                  : isFull
                  ? "Auditorium Full"
                  : "Claim Admission Pass →"}
              </span>
            </button>

            {attending && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-800">
                <Check size={14} /> ADMISSION GRANTED // PASS ISSUED
              </span>
            )}

            {status && (
              <p role="status" className="text-xs font-bold text-[#FF5500]">
                {status}
              </p>
            )}
          </div>
        </section>

        {/* Attendees Section */}
        <section className="p-6 sm:p-8 bg-white space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#FF5500]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-black">
                CONFIRMED ATTENDEE ROSTER ({attendeeCount})
              </h2>
            </div>
            <span className="text-[11px] text-neutral-500 font-bold uppercase">
              LIVE NETWORK ROSTER
            </span>
          </div>

          {rsvps.length === 0 ? (
            <div className="p-8 text-center bg-[#FFFFFF] border-2 border-black text-xs space-y-2">
              <p className="font-bold uppercase text-black">NO ATTENDEES ENROLLED YET</p>
              <p className="text-neutral-600 font-sans">
                Claim your pass above to be registered as the first confirmed participant on the guest list!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rsvps.map((rsvp) => {
                const u: EventAttendee = rsvp.user || { id: rsvp.userId, name: "Attendee" };
                const initials = (u.name || "A")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={rsvp.userId}
                    className="p-3 bg-[#FFFFFF] border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-3"
                  >
                    <div className="w-9 h-9 bg-black text-[#FF5500] border border-black flex items-center justify-center font-bold text-xs shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-bold text-xs text-black truncate">{u.name}</p>
                      <p className="text-[10px] text-neutral-600 truncate uppercase">
                        {u.jobTitle ? `${u.jobTitle} • ` : ""}
                        {u.currentCompany || u.department || "Member"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
