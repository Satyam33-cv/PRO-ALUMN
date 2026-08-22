import type { Metadata } from "next";
import { DirectoryContent } from "@/components/DirectoryContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Directory | PRO ALUMN",
  description: "Find alumni by experience, company, role, and location",
  openGraph: {
    title: "Alumni Directory - Find Your People",
    description: "Search and browse alumni network by experience, company, role, and location",
    images: ["https://alumni-connect.example.com/og-directory.png"],
  },
  twitter: {
    title: "Alumni Directory - Find Your People",
    description: "Search and browse alumni network",
    card: "summary_large_image",
  },
};

export default async function DirectoryPage({
	searchParams,
}: {
	searchParams?: { q?: string | string[] };
}) {
	const query = Array.isArray(searchParams?.q)
		? searchParams.q[0]
		: searchParams?.q ?? "";
	return <RoleShell><DirectoryContent initialQuery={query} /></RoleShell>;
}