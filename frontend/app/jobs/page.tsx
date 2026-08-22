import type { Metadata } from "next";
import { JobListContent } from "@/components/JobListContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Jobs | PRO ALUMN",
  description: "Explore roles shared by your alumni network",
  openGraph: {
    title: "Job Board - PRO ALUMN",
    description: "Explore roles shared by your alumni network",
    images: ["https://alumni-connect.example.com/og-jobs.png"],
  },
  twitter: {
    title: "Job Board - PRO ALUMN",
    description: "Explore roles shared by your alumni network",
    card: "summary_large_image",
  },
};

export default function JobsPage() {
	return <RoleShell><JobListContent /></RoleShell>;
}