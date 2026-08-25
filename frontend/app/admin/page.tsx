import type { Metadata } from "next";
import { AdminContent } from "@/components/AdminContent";

export const metadata: Metadata = {
  title: "Command Center | PRO ALUMN",
  description: "Admin command center with metrics and CSV import",
  openGraph: {
    title: "Admin Command Center - PRO ALUMN",
    description: "Admin command center with metrics and CSV import",
    images: ["https://alumni-connect.example.com/og-admin.png"],
  },
  twitter: {
    title: "Admin Command Center - PRO ALUMN",
    description: "Admin command center with metrics and CSV import",
    card: "summary_large_image",
  },
};

export default function AdminPage() {
  return <AdminContent />;
}