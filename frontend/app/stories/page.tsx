import type { Metadata } from "next";
import { StoriesContent } from "@/components/StoriesContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Stories | PRO ALUMN",
  description: "Read and share alumni success stories and experiences",
  openGraph: {
    title: "Stories - PRO ALUMN",
    description: "Read and share alumni success stories and experiences",
    images: ["https://alumni-connect.example.com/og-stories.png"],
  },
  twitter: {
    title: "Stories - PRO ALUMN",
    description: "Read and share alumni success stories and experiences",
    card: "summary_large_image",
  },
};

export default function StoriesPage() {
  return <RoleShell><StoriesContent /></RoleShell>;
}
