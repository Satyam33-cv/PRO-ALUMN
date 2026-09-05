import type { Metadata } from "next";
import { JobListContent } from "@/components/JobListContent";
import { AdaptiveShell } from "@/components/AdaptiveShell";

export const metadata: Metadata = {
  title: "Career & Referral Hub | PRO-ALUMN",
  description: "Explore high-velocity engineering roles and direct employee referrals verified by alumni fellows.",
  openGraph: {
    title: "Career & Referral Hub - PRO-ALUMN",
    description: "Explore high-velocity engineering roles and direct employee referrals verified by alumni fellows.",
    images: ["https://alumni-connect.example.com/og-jobs.png"],
  },
  twitter: {
    title: "Career & Referral Hub - PRO-ALUMN",
    description: "Explore high-velocity engineering roles and direct employee referrals verified by alumni fellows.",
    card: "summary_large_image",
  },
};

export default function JobsPage() {
  return (
    <AdaptiveShell activeRoute="jobs">
      <JobListContent />
    </AdaptiveShell>
  );
}