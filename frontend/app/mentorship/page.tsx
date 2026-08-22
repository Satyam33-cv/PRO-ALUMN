import type { Metadata } from "next";
import { MentorshipContent } from "@/components/MentorshipContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Mentorship | PRO ALUMN",
  description: "Connect with alumni mentors and manage mentorship requests",
  openGraph: {
    title: "Mentorship - PRO ALUMN",
    description: "Connect with alumni mentors and manage mentorship requests",
    images: ["https://alumni-connect.example.com/og-mentorship.png"],
  },
  twitter: {
    title: "Mentorship - PRO ALUMN",
    description: "Connect with alumni mentors and manage mentorship requests",
    card: "summary_large_image",
  },
};

export default function MentorshipPage() {
  return <RoleShell><MentorshipContent /></RoleShell>;
}
