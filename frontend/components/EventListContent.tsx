"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, MessageCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";

type Category = "all" | "reunion" | "meetup" | "webinar" | "career";

const tabs: { label: string; value: Category }[] = [
  { label: "All", value: "all" },
  { label: "Reunions", value: "reunion" },
  { label: "Meetups", value: "meetup" },
  { label: "Webinars", value: "webinar" },
  { label: "Career", value: "career" },
];

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export function EventListContent() {
  const [activeTab, setActiveTab] = useState<Category>("all");
  const { data: apiEvents } = useApi("events:list", () => apiClient.events.list());
  const events = apiEvents || [];

  const [registeredEvents, setRegisteredEvents] = useState<Record<string, boolean>>({});
  const [attendingCounts, setAttendingCounts] = useState<Record<string, number>>({});

  // Initialize attending counts once events are loaded
  useState(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      if (e.attending != null) counts[e.id] = e.attending;
    });
    setAttendingCounts(counts);
  });

  const featured = events[0];
  const featuredAttending = attendingCounts[featured?.id ?? ""] ?? featured?.attending ?? 0;
  const featuredCapacity = featured?.capacity ?? 1;
  const featuredIsFull = featuredAttending >= featuredCapacity;
  const featuredRegistered = registeredEvents[featured?.id ?? ""] ?? false;
  const featuredDays = daysUntil(featured?.startsAt);

  const filtered =
    activeTab === "all"
      ? events
      : events.filter((e) => e.category === activeTab);

  function handleFeaturedRegister() {
    if (!featured || featuredIsFull || featuredRegistered) return;
    setRegisteredEvents((prev) => ({ ...prev, [featured.id]: true }));
    setAttendingCounts((prev) => ({
      ...prev,
      [featured.id]: (prev[featured.id] ?? featured.attending ?? 0) + 1,
    }));
  }

  function handleRsvp(eventId: string, currentAttending: number, capacity: number) {
    if (registeredEvents[eventId]) return;
    if (currentAttending >= capacity) return;
    setRegisteredEvents((prev) => ({ ...prev, [eventId]: true }));
    setAttendingCounts((prev) => ({
      ...prev,
      [eventId]: currentAttending + 1,
    }));
  }

  return (
    <div className="space-y-10">
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="overflow-hidden rounded-lg bg-ink-900 p-6 text-paper-50 sm:p-8"
        >
          <span className="font-mono text-xs uppercase tracking-wider text-brass-500">
            Featured Event
          </span>
          <h2 className="mt-3 font-display text-3xl">{featured.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-paper-50/70">
            <span>
              {featured.month} {featured.day}
            </span>
            <span>·</span>
            <span>{featured.detail}</span>
            <span>·</span>
            <span>{featured.place}</span>
          </div>
          {featuredDays !== null && (
            <p className="mt-2 text-xs text-brass-500">
              {featuredDays} day{featuredDays !== 1 ? "s" : ""} away
            </p>
          )}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-paper-50/60">
              <span>
                {featuredAttending}/{featuredCapacity} attending
              </span>
              <span>
                {Math.round((featuredAttending / featuredCapacity) * 100)}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-50/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(featuredAttending / featuredCapacity) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-brass-500"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleFeaturedRegister}
              disabled={featuredIsFull || featuredRegistered}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                featuredRegistered
                  ? "bg-sage-500 text-white"
                  : featuredIsFull
                    ? "cursor-not-allowed bg-paper-50/10 text-paper-50/40"
                    : "bg-brass-500 text-ink-900 hover:bg-brass-500/80"
              }`}
            >
              {featuredRegistered
                ? "Registered ✓"
                : featuredIsFull
                  ? "Full"
                  : "Register Now"}
            </button>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full border border-paper-50/30 px-6 py-2.5 text-sm font-medium text-paper-50 transition-colors hover:bg-paper-50/10"
            >
              <MessageCircle size={14} />
              Discuss
            </Link>
          </div>
        </motion.div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-ink-900/10">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
              activeTab === tab.value
                ? "border-brass-500 font-semibold text-ink-900"
                : "border-transparent text-ink-900/50 hover:text-ink-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((event, i) => {
          const count = attendingCounts[event.id] ?? event.attending ?? 0;
          const cap = event.capacity ?? 100;
          const isFull = count >= cap;
          const isRegistered = registeredEvents[event.id] ?? false;

          return (
            <motion.div
              key={event.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="flex gap-4 rounded-lg border border-ink-900/10 bg-white/70 p-5"
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded bg-brass-500/10">
                <span className="font-mono text-[10px] uppercase text-brass-500">
                  {event.month}
                </span>
                <span className="font-display text-xl leading-none">{event.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{event.title}</p>
                <p className="mt-1 text-xs text-ink-900/55">{event.detail}</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-900/45">
                  <MapPin size={12} />
                  {event.place}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-ink-900/45">
                    <span>
                      {count}/{cap}
                    </span>
                    <span>{Math.round((count / cap) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-900/5">
                    <div
                      className="h-full rounded-full bg-brass-500 transition-all duration-500"
                      style={{ width: `${(count / cap) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  {isRegistered ? (
                    <span className="inline-flex items-center rounded-full bg-sage-500 px-4 py-1.5 text-xs font-medium text-white">
                      Registered ✓
                    </span>
                  ) : isFull ? (
                    <span className="inline-flex rounded-full bg-ink-900/10 px-4 py-1.5 text-xs font-medium text-ink-900/40">
                      Full
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRsvp(event.id, count, cap)}
                      className="rounded-full bg-brass-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brass-500/80"
                    >
                      RSVP
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
