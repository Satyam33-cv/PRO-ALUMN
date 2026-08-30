"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { ArrowLeft, Calendar, Sparkles, Loader2, CheckCircle2 } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"reunion" | "meetup" | "webinar" | "career">("meetup");
  const [date, setDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [startsAt, setStartsAt] = useState("18:00");
  const [place, setPlace] = useState("");
  const [mode, setMode] = useState("In-Person");
  const [capacity, setCapacity] = useState("100");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !place.trim() || !detail.trim()) {
      setError("Please fill in the event title, venue/link, and event details.");
      return;
    }

    setLoading(true);
    setError(null);

    const parsedDate = new Date(date);
    const month = parsedDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const day = parsedDate.getDate().toString();

    try {
      await apiClient.events.create({
        title: title.trim(),
        detail: detail.trim(),
        place: place.trim(),
        date,
        month,
        day,
        startsAt,
        category,
        capacity: capacity ? parseInt(capacity) : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/events");
      }, 1500);
    } catch (err: unknown) {
      console.error("Event creation error:", err);
      const message = err instanceof Error ? err.message : "Failed to publish event. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <RoleShell>
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to events
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/10">
              <Calendar size={22} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                COMMUNITY GATHERING
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Host an event.
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Bring alumni, students, and faculty together for networking, panels, or campus reunions.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs font-medium text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Event created successfully! Redirecting to events calendar...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card padding="lg" className="space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AI & Engineering Alumni Career Summit 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "reunion" | "meetup" | "webinar" | "career")}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                >
                  <option value="meetup">Networking Meetup</option>
                  <option value="reunion">Homecoming & Reunion</option>
                  <option value="webinar">Virtual Webinar</option>
                  <option value="career">Career Fair & Mixer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Event Format
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                >
                  <option value="In-Person">In-Person (Campus / Venue)</option>
                  <option value="Virtual">Virtual (Google Meet / Zoom)</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  RSVP Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Venue Location or Meeting Link *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main Auditorium Hall A or https://meet.google.com/xyz"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Event Agenda & Description *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe keynote speakers, panel topics, agenda schedule, networking opportunities, and RSVP guidelines..."
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/events"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? "Publishing..." : "Publish Event"}
              </button>
            </div>
          </Card>
        </form>
      </div>
    </RoleShell>
  );
}