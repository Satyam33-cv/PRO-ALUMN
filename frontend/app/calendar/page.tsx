import type { Metadata } from "next";
import { RoleShell } from "@/components/RoleShell";
import { CalendarContent } from "@/components/CalendarContent";

export const metadata: Metadata = {
  title: "Calendar | AlumniConnect",
  description: "Schedule mentorship, webinars, and reunions directly synced with Google Calendar",
};

export default function CalendarPage() {
  return (
    <RoleShell>
      <CalendarContent />
    </RoleShell>
  );
}
