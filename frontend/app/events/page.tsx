import type { Metadata } from "next";
import { EventListContent } from "@/components/EventListContent";
import { AdaptiveShell } from "@/components/AdaptiveShell";

export const metadata: Metadata = {
  title: "Events, Reunions & Capacity RSVPs | PRO-ALUMN",
  description: "Capacity-gated 1-click registration using serializable database transactions to guarantee zero overbooking. Seamless sync with Google Calendar and offline encrypted QR wallet admission.",
  openGraph: {
    title: "Events & Reunions - PRO-ALUMN",
    description: "Capacity-gated 1-click registration using serializable database transactions to guarantee zero overbooking.",
    images: ["https://alumni-connect.example.com/og-events.png"],
  },
  twitter: {
    title: "Events & Reunions - PRO-ALUMN",
    description: "Capacity-gated 1-click registration using serializable database transactions to guarantee zero overbooking.",
    card: "summary_large_image",
  },
};

export default function EventsPage() {
  return (
    <AdaptiveShell activeRoute="events">
      <EventListContent />
    </AdaptiveShell>
  );
}