import type { Metadata } from "next";
import { StoriesContent } from "@/components/StoriesContent";
import { AdaptiveShell } from "@/components/AdaptiveShell";

export const metadata: Metadata = {
  title: "Success Spotlight & Alumni Breakthroughs | PRO-ALUMN",
  description: "Peer-attested achievements, career pivots, venture funding rounds, and research breakthroughs from verified alumni fellows.",
  openGraph: {
    title: "Success Spotlight & Alumni Breakthroughs | PRO-ALUMN",
    description: "Peer-attested achievements, career pivots, venture funding rounds, and research breakthroughs from verified alumni fellows.",
    images: ["https://alumni-connect.example.com/og-stories.png"],
  },
  twitter: {
    title: "Success Spotlight & Alumni Breakthroughs | PRO-ALUMN",
    description: "Peer-attested achievements and venture dispatches from verified alumni fellows.",
    card: "summary_large_image",
  },
};

export default function StoriesPage() {
  return (
    <AdaptiveShell activeRoute="stories">
      <StoriesContent />
    </AdaptiveShell>
  );
}
