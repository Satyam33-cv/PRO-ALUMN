"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CalendarCheck,
  Download,
  Users,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import type { EventItem } from "@/lib/api/types";

interface CalendarEventDisplay {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  mode?: string;
  maxCapacity?: number;
  attending?: number;
  isRegistered?: boolean;
  creatorName?: string;
}

export function CalendarContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEventDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // New Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Online (Google Meet)");
  const [mode, setMode] = useState("ONLINE");
  const [capacity, setCapacity] = useState(50);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});

  const fetchEvents = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data: EventItem[] = await apiClient.events.list();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: CalendarEventDisplay[] = data.map((evt) => {
          const rawDate = evt.startsAt || evt.date || new Date().toISOString();
          const startDateObj = new Date(rawDate);
          const endDateObj = new Date(startDateObj.getTime() + 3600000 * 2); // Default 2 hr duration

          return {
            id: evt.id,
            title: evt.title || "Untitled Event",
            description: evt.detail || "",
            location: evt.place || "Campus / Online",
            startTime: startDateObj.toISOString(),
            endTime: endDateObj.toISOString(),
            mode: evt.category || "ONLINE",
            maxCapacity: evt.capacity,
            attending: evt.attending ?? 0,
            isRegistered: evt.isRegistered ?? false,
          };
        });
        setEvents(mapped);
      } else {
        setEvents([]);
      }
    } catch (err: unknown) {
      console.warn("Could not fetch events from PostgreSQL API:", err);
      setStatusMsg({
        type: "error",
        text: "Could not load events from server. Please try refreshing.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!summary.trim()) return;

    const sDate = startDate || new Date().toISOString().slice(0, 10);
    const sTime = startTime || "10:00";
    let startISO: string;
    try {
      startISO = new Date(`${sDate}T${sTime}:00`).toISOString();
    } catch {
      setStatusMsg({ type: "error", text: "Invalid start date/time format." });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.events.create({
        title: summary.trim(),
        detail: description.trim(),
        place: location.trim() || "Online",
        date: startISO,
        startsAt: startISO,
        capacity,
        category: mode,
      });

      setStatusMsg({
        type: "success",
        text: `Event "${summary}" successfully scheduled and published to the alumni portal!`,
      });
      setIsModalOpen(false);
      setSummary("");
      setDescription("");
      setLocation("Online (Google Meet)");
      await fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create event.";
      setStatusMsg({
        type: "error",
        text: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRsvp = async (event: CalendarEventDisplay) => {
    setRsvpLoading((prev) => ({ ...prev, [event.id]: true }));
    setStatusMsg(null);
    try {
      if (event.isRegistered) {
        await apiClient.events.cancelRsvp(event.id);
        setStatusMsg({
          type: "success",
          text: `RSVP cancelled for "${event.title}".`,
        });
      } else {
        await apiClient.events.rsvp(event.id);
        setStatusMsg({
          type: "success",
          text: `RSVP confirmed for "${event.title}"! See you there.`,
        });
      }
      await fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update RSVP.";
      setStatusMsg({ type: "error", text: message });
    } finally {
      setRsvpLoading((prev) => ({ ...prev, [event.id]: false }));
    }
  };

  // Generate web intent URL for Google Calendar
  const getGoogleCalendarUrl = (evt: CalendarEventDisplay) => {
    const startFormatted = evt.startTime.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const endFormatted = evt.endTime.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: evt.title,
      details: evt.description,
      location: evt.location,
      dates: `${startFormatted}/${endFormatted}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Download .ics file
  const handleDownloadICS = (evt: CalendarEventDisplay) => {
    const startFormatted = evt.startTime.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const endFormatted = evt.endTime.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PRO ALUMN//Calendar//EN
BEGIN:VEVENT
SUMMARY:${evt.title}
DESCRIPTION:${evt.description.replace(/\n/g, "\\n")}
LOCATION:${evt.location}
DTSTART:${startFormatted}
DTEND:${endFormatted}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${evt.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-[#CCFF00] border border-black" />
              <p className="font-mono text-xs uppercase font-bold tracking-[0.2em] text-black">
                [ SECTION 09 // CAMPUS SCHEDULE &amp; REUNIONS ]
              </p>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Events &amp; Reunions Calendar
            </h1>
            <p className="mt-1 font-mono text-xs text-neutral-600 max-w-2xl">
              Explore university reunions, alumni webinars, and mentorship sessions. Sync to your personal Google Calendar or Apple iCal with a single click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(user?.role === "admin" || user?.role === "alumni" || user?.role === "faculty") && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border-3 border-black bg-[#CCFF00] hover:bg-black hover:text-[#CCFF00] text-black font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <Plus size={16} />
                Schedule Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div
          className={`p-4 border-3 border-black font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_#000000] flex items-center justify-between gap-3 ${
            statusMsg.type === "success"
              ? "bg-[#00E676] text-black"
              : "bg-[#FF5500] text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0 stroke-[3]" />
            ) : (
              <AlertCircle size={18} className="shrink-0 stroke-[3]" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Events Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
            <span>Upcoming Sessions &amp; Meetups ({events.length})</span>
          </h2>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-black bg-white text-xs font-mono font-bold uppercase text-black hover:bg-black hover:text-[#CCFF00] shadow-[2px_2px_0px_#000000] transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Schedule</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center font-mono text-xs font-bold uppercase text-neutral-500 border-4 border-black bg-white shadow-[6px_6px_0px_#000000]">
            Loading university events from database...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center space-y-3 border-4 border-black bg-white shadow-[6px_6px_0px_#000000]">
            <CalendarCheck size={40} className="mx-auto text-black" />
            <h3 className="font-mono text-sm font-black uppercase text-black">
              No upcoming events scheduled
            </h3>
            <p className="font-mono text-xs text-neutral-500 max-w-sm mx-auto">
              Check back soon for new webinars, batch reunions, and workshop announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const startDateObj = evt.startTime ? new Date(evt.startTime) : null;
              const endDateObj = evt.endTime ? new Date(evt.endTime) : null;
              const isRsvpBusy = rsvpLoading[evt.id] || false;

              return (
                <div
                  key={evt.id}
                  className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-mono font-black uppercase px-2.5 py-1 border-2 border-black bg-[#CCFF00] text-black shadow-[2px_2px_0px_#000000]">
                        {startDateObj
                          ? startDateObj.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "Upcoming"}
                      </span>

                      {evt.isRegistered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-black uppercase text-black bg-[#00E676] px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
                          <CheckCircle2 size={12} className="stroke-[3]" />
                          RSVP&apos;d
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-lg font-black uppercase text-black leading-snug">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="font-mono text-xs text-neutral-600 line-clamp-2">
                        {evt.description}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-2 font-mono text-xs text-neutral-700">
                      {startDateObj && (
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-black" />
                          <span>
                            {startDateObj.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {endDateObj
                              ? ` - ${endDateObj.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : ""}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-black" />
                        <span className="truncate">{evt.location}</span>
                      </div>

                      {evt.attending !== undefined && (
                        <div className="flex items-center gap-2">
                          <Users size={13} className="text-black" />
                          <span className="text-[11px] font-bold">
                            {evt.attending} attending {evt.maxCapacity ? `(Limit: ${evt.maxCapacity})` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-black space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleRsvp(evt)}
                        disabled={isRsvpBusy}
                        className={`w-full py-2 px-3 border-2 border-black text-xs font-mono font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                          evt.isRegistered
                            ? "bg-neutral-100 hover:bg-[#FF5500] hover:text-white text-black"
                            : "bg-black text-[#CCFF00] hover:bg-[#00E676] hover:text-black"
                        }`}
                      >
                        {isRsvpBusy ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : evt.isRegistered ? (
                          <>
                            <UserCheck size={13} />
                            <span>Cancel RSVP</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            <span>RSVP to Event</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] pt-1">
                      <a
                        href={getGoogleCalendarUrl(evt)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-black hover:text-[#FF5500] transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>Google Calendar</span>
                      </a>

                      <button
                        onClick={() => handleDownloadICS(evt)}
                        className="inline-flex items-center gap-1 font-bold text-black hover:text-[#FF5500] transition-colors cursor-pointer"
                        title="Download .ics file"
                      >
                        <Download size={12} />
                        <span>iCal / Outlook</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Schedule University Event
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alumni Career AMA or Class Reunion"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Event agenda, speaker info, or discussion topics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Link
                  </label>
                  <input
                    type="text"
                    placeholder="Auditorium or Google Meet URL"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attendee Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={submitting || !summary.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                {submitting ? "Publishing..." : "Publish Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
