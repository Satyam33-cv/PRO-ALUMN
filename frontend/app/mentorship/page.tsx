import type { Metadata } from "next";
import { MentorshipContent } from "@/components/MentorshipContent";
import { AdaptiveShell } from "@/components/AdaptiveShell";

export const metadata: Metadata = {
  title: "Mentorship & Flash 1-on-1 Sessions | PRO ALUMN",
  description: "Connect with verified alumni fellows for tactical guidance, career architecture, and 1-on-1 advisory sessions.",
  openGraph: {
    title: "Mentorship & Flash 1-on-1 Sessions - PRO ALUMN",
    description: "Connect with verified alumni fellows for tactical guidance and 1-on-1 advisory sessions",
    images: ["https://alumni-connect.example.com/og-mentorship.png"],
  },
  twitter: {
    title: "Mentorship & Flash 1-on-1 Sessions - PRO ALUMN",
    description: "Connect with verified alumni fellows for tactical guidance and 1-on-1 advisory sessions",
    card: "summary_large_image",
  },
};

export default function MentorshipPage() {
  return (
    <AdaptiveShell activeRoute="mentorship">
      <MentorshipContent />
    </AdaptiveShell>
  );
}
