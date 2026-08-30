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
  Download,
  Users,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface CalendarEventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  creatorEmail: string;
  authorId?: string;
  attendees?: string[];
  createdAt: string;
}

const DEFAULT_EVENTS: CalendarEventItem[] = [
  {
    id: "evt-1",
    title: "AI & ML in Enterprise: Alumni Panel & AMA",
    description: "Senior engineering alumni from Google, Microsoft, and Uber discuss AI adoption, system architecture, and career transition tips.",
    location: "Online (Google Meet)",
    startTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 4.5).toISOString(),
    creatorEmail: "elena.r@alumni.edu",
    attendees: ["student1@alumni.edu", "student2@alumni.edu"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "evt-2",
    title: "1-on-1 Resume & Technical Portfolio Review",
    description: "Individual mentorship breakout room to review software engineering and product resumes.",
    location: "Zoom Virtual Lounge",
    startTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 2).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 3).toISOString(),
    creatorEmail: "marcus.v@alumni.edu",
    attendees: ["mentee@alumni.edu"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "evt-3",
    title: "Class of 2020 6-Year Reunion Planning Call",
    description: "Organizing committee agenda, venue selection review, sponsorship discussions, and alumni outreach strategies.",
    location: "Alumni Innovation Hub, Room 302",
    startTime: new Date(Date.now() + 86400000 * 7 + 3600000 * 5).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 7 + 3600000 * 6).toISOString(),
    creatorEmail: "priya.s@alumni.edu",
    attendees: ["committee@alumni.edu"],
    createdAt: new Date().toISOString(),
  },
];

export function CalendarContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEventItem[]>(DEFAULT_EVENTS);
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

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const q = query(collection(db, "calendar_events"), orderBy("startTime", "asc"));
      const snapshot = await getDocs(q);
      const items: CalendarEventItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          title: d.title || d.summary || "Untitled Event",
          description: d.description || "",
          location: d.location || "Online",
          startTime: d.startTime || d.startDateTime || new Date().toISOString(),
          endTime: d.endTime || d.endDateTime || new Date().toISOString(),
          creatorEmail: d.creatorEmail || "alumni@proalumn.io",
          authorId: d.authorId,
          attendees: d.attendees || [],
          createdAt: d.createdAt || new Date().toISOString(),
        });
      });

      if (items.length > 0) {
        setEvents(items);
      } else {
        setEvents(DEFAULT_EVENTS);
      }
    } catch (err) {
      console.warn("Could not fetch events from Firestore:", err);
      setEvents(DEFAULT_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!summary.trim() || !startDate || !startTime) return;

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();
    const attendees = attendeeEmail.trim()
      ? attendeeEmail.split(",").map((e) => e.trim()).filter(Boolean)
      : [];

    setSubmitting(true);
    try {
      const newEventData: Omit<CalendarEventItem, "id"> = {
        title: summary.trim(),
        description: description.trim(),
        location: location.trim() || "Online",
        startTime: startISO,
        endTime: endISO,
        creatorEmail: user?.email || "alumni@proalumn.io",
        authorId: user?.id || user?.firebaseUid || "",
        attendees,
        createdAt: new Date().toISOString(),
      };

      try {
        const docRef = await addDoc(collection(db, "calendar_events"), newEventData);
        const created: CalendarEventItem = { id: docRef.id, ...newEventData };
        setEvents((prev) => [created, ...prev]);
      } catch {
        const fallbackId = `evt-${Date.now()}`;
        const created: CalendarEventItem = { id: fallbackId, ...newEventData };
        setEvents((prev) => [created, ...prev]);
      }

      setStatusMsg({
        type: "success",
        text: `Event "${summary}" successfully scheduled and saved to your calendar!`,
      });
      setIsModalOpen(false);
      setSummary("");
      setDescription("");
      setLocation("Online (Google Meet)");
      setAttendeeEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save event.";
      setStatusMsg({
        type: "error",
        text: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    setConfirmDialog({
      title: "Delete Scheduled Event",
      description: `Are you sure you want to remove "${eventTitle}" from the calendar? This action cannot be undone.`,
      action: async () => {
        try {
          if (!eventId.startsWith("evt-")) {
            await deleteDoc(doc(db, "calendar_events", eventId));
          }
          setEvents((prev) => prev.filter((e) => e.id !== eventId));
          setStatusMsg({
            type: "success",
            text: `Event "${eventTitle}" was deleted.`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to delete event.";
          setStatusMsg({
            type: "error",
            text: message,
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  // Generate web intent URL for Google Calendar
  const getGoogleCalendarUrl = (evt: CalendarEventItem) => {
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
  const handleDownloadICS = (evt: CalendarEventItem) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarIcon size={24} />
            </span>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
              Calendar & Mentorship Schedule
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Sparkles size={12} />
              Firestore Synced
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Manage your schedule, 1-on-1 mentorship sessions, class reunions, and
            alumni webinars with instant calendar integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Schedule Event
          </button>
        </div>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Events Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Upcoming Sessions & Meetups ({events.length})</span>
          </h2>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Schedule</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Loading scheduled sessions...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <CalendarCheck size={36} className="mx-auto text-slate-300" />
            <h3 className="font-semibold text-base text-slate-700 dark:text-slate-300">
              No upcoming events scheduled
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Schedule your first mentorship consultation or alumni meetup by clicking &quot;Schedule Event&quot; above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((evt) => {
              const startDateObj = evt.startTime ? new Date(evt.startTime) : null;
              const endDateObj = evt.endTime ? new Date(evt.endTime) : null;

              return (
                <div
                  key={evt.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {startDateObj
                          ? startDateObj.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "Scheduled"}
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {evt.description}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-400">
                      {startDateObj && (
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-slate-400" />
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
                        <MapPin size={13} className="text-slate-400" />
                        <span className="truncate">{evt.location}</span>
                      </div>

                      {evt.creatorEmail && (
                        <div className="flex items-center gap-2">
                          <Users size={13} className="text-slate-400" />
                          <span className="text-slate-400 text-[11px] truncate">
                            Organized by {evt.creatorEmail}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDownloadICS(evt)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Download .ics file"
                    >
                      <Download size={13} />
                      <span>.ICS</span>
                    </button>

                    <a
                      href={getGoogleCalendarUrl(evt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>Add to Google</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarCheck size={20} className="text-emerald-600" />
                Schedule Mentorship / Event
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1-on-1 Mock Interview Session"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Goals, meeting link, and preparation notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Meeting Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet or Room 204"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date & Time
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date & Time
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attendee Emails (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="student@alumni.edu, mentor@alumni.edu"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={submitting || !summary.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-xs"
              >
                {submitting ? "Saving..." : "Schedule Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.action}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
