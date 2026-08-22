import type { Metadata } from "next";
import { EventListContent } from "@/components/EventListContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Events | PRO ALUMN",
  description: "Make time for gatherings, panels, and alumni conversations.",
  openGraph: {
    title: "Events - PRO ALUMN",
    description: "Make time for gatherings, panels, and alumni conversations.",
    images: ["https://alumni-connect.example.com/og-events.png"],
  },
  twitter: {
    title: "Events - PRO ALUMN",
    description: "Make time for gatherings, panels, and alumni conversations.",
    card: "summary_large_image",
  },
};

export default function EventsPage() {
	return <RoleShell><EventListContent /></RoleShell>;
}