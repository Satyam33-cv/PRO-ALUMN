import type { Metadata } from "next";
import { ProfileContent } from "@/components/ProfileContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Profile | PRO ALUMN",
  description: "Your personal alumni profile and settings",
  openGraph: {
    title: "Profile - PRO ALUMN",
    description: "Your personal alumni profile and settings",
    images: ["https://alumni-connect.example.com/og-profile.png"],
  },
  twitter: {
    title: "Profile - PRO ALUMN",
    description: "Your personal alumni profile and settings",
    card: "summary_large_image",
  },
};

export default function ProfilePage() {
  return <RoleShell><ProfileContent /></RoleShell>;
}
