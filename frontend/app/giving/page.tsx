import type { Metadata } from "next";
import { GivingContent } from "@/components/GivingContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Giving | PRO ALUMN",
  description: "Support alumni causes and view impact stories",
  openGraph: {
    title: "Giving - PRO ALUMN",
    description: "Support alumni causes and view impact stories",
    images: ["https://alumni-connect.example.com/og-giving.png"],
  },
  twitter: {
    title: "Giving - PRO ALUMN",
    description: "Support alumni causes and view impact stories",
    card: "summary_large_image",
  },
};

export default function GivingPage() {
  return <RoleShell><GivingContent /></RoleShell>;
}
