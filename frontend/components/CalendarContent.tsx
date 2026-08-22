"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CalendarCheck,
  Video,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  GoogleCalendarEvent,
} from "@/lib/google-workspace";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export function CalendarContent() {
  const { user, accessToken, signInWithGoogle } = useAuth();
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // New Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [endTime, setEndTime] = useState("11:00");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Destructive Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const fetchEvents = async () => {
    if (!accessToken) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const items = await listCalendarEvents({ token: accessToken });
      setEvents(items);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to load Google Calendar events.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEvents();
    }
  }, [accessToken]);

  const handleCreateEvent = () => {
    if (!summary.trim() || !startDate || !startTime) return;

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();

    setConfirmDialog({
      title: "Create Google Calendar Event",
      description: `You are creating the event "${summary.trim()}" on your Google Calendar scheduled for ${new Date(
        startISO
      ).toLocaleString()}.`,
      action: async () => {
        if (!accessToken) return;
        setSubmitting(true);
        try {
          const attendees = attendeeEmail.trim()
            ? attendeeEmail.split(",").map((e) => e.trim()).filter(Boolean)
            : [];

          const created = await createCalendarEvent({
            token: accessToken,
            summary: summary.trim(),
            description: description.trim(),
            location: location.trim(),
            startDateTime: startISO,
            endDateTime: endISO,
            attendees,
          });

          // Save to Firestore logs
          try {
            await addDoc(collection(db, "calendar_events"), {
              eventId: created.id,
              title: summary.trim(),
              description: description.trim(),
              location: location.trim(),
              startTime: startISO,
              endTime: endISO,
              creatorEmail: user?.email || "",
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn("Could not save to firestore:", e);
          }

          setStatusMsg({
            type: "success",
            text: `Event "${summary}" successfully scheduled on your Google Calendar!`,
          });
          setIsModalOpen(false);
          setSummary("");
          setDescription("");
          setLocation("");
          setAttendeeEmail("");
          fetchEvents();
        } catch (err: any) {
          setStatusMsg({
            type: "error",
            text: err.message || "Failed to create Google Calendar event.",
          });
        } finally {
          setSubmitting(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDeleteEvent = (eventId: string, eventSummary: string) => {
    setConfirmDialog({
      title: "Delete Google Calendar Event",
      description: `Are you sure you want to remove "${eventSummary}" from your Google Calendar? This action cannot be undone.`,
      action: async () => {
        if (!accessToken) return;
        try {
          await deleteCalendarEvent({
            token: accessToken,
            eventId,
          });
          setStatusMsg({
            type: "success",
            text: "Event deleted from Google Calendar.",
          });
          fetchEvents();
        } catch (err: any) {
          setStatusMsg({
            type: "error",
            text: err.message || "Failed to delete event.",
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CalendarIcon size={22} />
            </span>
            <h1 className="font-display text-3xl font-bold text-ink">
              Google Calendar
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink/60 max-w-2xl">
            Manage your schedule, 1-on-1 mentorship sessions, reunions, and
            alumni webinars directly synced with Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {accessToken ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brass hover:bg-ink text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              Schedule Event
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink/15 bg-white hover:bg-paper text-ink text-sm font-medium transition-colors shadow-sm"
            >
              <CalendarCheck size={16} className="text-emerald-500" />
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Auth Banner */}
      {!accessToken && (
        <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-ink text-base">
                Connect your Google Calendar
              </h3>
              <p className="text-sm text-ink/60">
                Authorize Google Calendar to see your upcoming meetings and
                schedule mentorship sessions with alumni.
              </p>
            </div>
          </div>
          <button
            onClick={signInWithGoogle}
            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shrink-0 shadow-sm"
          >
            Connect Google Calendar
          </button>
        </div>
      )}

      {/* Status Message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Events Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            Upcoming Google Calendar Events
          </h2>
          {accessToken && (
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink/15 text-xs font-semibold text-ink/70 hover:bg-paper transition-colors"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin" : ""}
              />
              Refresh Schedule
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-ink/40">
            Fetching calendar events from Google Calendar...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center space-y-3 rounded-2xl border border-dashed border-ink/15 bg-paper/20">
            <CalendarCheck size={36} className="mx-auto text-ink/30" />
            <h3 className="font-semibold text-base text-ink/70">
              No upcoming events scheduled
            </h3>
            <p className="text-xs text-ink/40 max-w-sm mx-auto">
              Schedule your first mentorship consultation or alumni meetup by
              clicking &quot;Schedule Event&quot; above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((evt) => {
              const startStr = evt.start?.dateTime || evt.start?.date || "";
              const endStr = evt.end?.dateTime || evt.end?.date || "";
              const startDateObj = startStr ? new Date(startStr) : null;
              const endDateObj = endStr ? new Date(endStr) : null;

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-2xl border border-ink/10 p-5 shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {startDateObj
                          ? startDateObj.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "Scheduled"}
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.summary)}
                        className="p-1.5 text-ink/30 hover:text-red-500 transition-colors"
                        title="Delete from Google Calendar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="font-display text-lg font-bold text-ink leading-snug">
                      {evt.summary || "Untitled Event"}
                    </h3>

                    {evt.description && (
                      <p className="text-xs text-ink/60 line-clamp-2">
                        {evt.description}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-2 text-xs text-ink/60">
                      {startDateObj && (
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-ink/40" />
                          <span>
                            {startDateObj.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {endDateObj
                              ? endDateObj.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      )}

                      {evt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-ink/40 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}

                      {evt.attendees && evt.attendees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <UserPlus size={13} className="text-ink/40" />
                          <span>{evt.attendees.length} attendee(s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
                    <a
                      href={evt.htmlLink || "https://calendar.google.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <ExternalLink size={13} />
                      View in Calendar
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-display text-xl font-bold text-ink flex items-center gap-2">
                <CalendarIcon size={20} className="text-emerald-600" />
                Schedule Google Calendar Event
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink/40 hover:text-ink text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alumni Mentorship Session: Tech Careers"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink/70 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink/70 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Location / Video Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet or Campus Alumni Hall Room 204"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Invite Attendees (Comma separated emails)
                </label>
                <input
                  type="text"
                  placeholder="mentee@university.edu, mentor@alumni.org"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Description / Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Meeting agenda, preparation points, or discussion topics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg border border-ink/15 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-semibold text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={submitting || !summary.trim()}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {submitting ? "Scheduling..." : "Add to Google Calendar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-ink">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-ink/70">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-ink/10">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-semibold text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.action}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
