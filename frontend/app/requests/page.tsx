import type { Metadata } from "next";
import { RoleShell } from "@/components/RoleShell";
import { RequestsContent } from "@/components/RequestsContent";

export const metadata: Metadata = {
  title: "Referral Threads | PRO ALUMN",
  description: "View and manage referral requests and introductions",
  openGraph: {
    title: "Referral Threads - PRO ALUMN",
    description: "View and manage referral requests and introductions",
    images: ["https://alumni-connect.example.com/og-requests.png"],
  },
  twitter: {
    title: "Referral Threads - PRO ALUMN",
    description: "View and manage referral requests and introductions",
    card: "summary_large_image",
  },
};

export default function RequestsPage() {
	return <RoleShell><RequestsContent /></RoleShell>;
}