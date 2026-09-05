import type { Metadata } from "next";
import { Suspense } from "react";
import { DirectoryContent } from "@/components/DirectoryContent";
import { AdaptiveShell } from "@/components/AdaptiveShell";

export const metadata: Metadata = {
  title: "Alumni Directory & Talent Topology | PRO-ALUMN",
  description: "Browse 1,200+ vetted alumni fellows across frontier engineering, research laboratories, and venture-backed institutions.",
  openGraph: {
    title: "Alumni Directory & Talent Topology | PRO-ALUMN",
    description: "Search and browse alumni network by 384-D vector embeddings, company, role, and location",
    images: ["https://alumni-connect.example.com/og-directory.png"],
  },
  twitter: {
    title: "Alumni Directory & Talent Topology | PRO-ALUMN",
    description: "Search and browse alumni network",
    card: "summary_large_image",
  },
};

export default async function DirectoryPage({
	searchParams,
}: {
	searchParams?: { q?: string | string[]; view?: string | string[] };
}) {
	const query = Array.isArray(searchParams?.q)
		? searchParams.q[0]
		: searchParams?.q ?? "";
	const rawView = Array.isArray(searchParams?.view)
		? searchParams.view[0]
		: searchParams?.view;
	const view = rawView === "showcase" ? "showcase" : rawView === "member" ? "member" : undefined;

	return (
		<Suspense fallback={<div className="min-h-screen bg-[#fcf9f3] p-8 font-mono text-xs flex items-center justify-center">[ INITIALIZING DIRECTORY TOPOLOGY... ]</div>}>
			<AdaptiveShell activeRoute="directory" forcePublic={view === "showcase"}>
				<DirectoryContent initialQuery={query} viewMode={view} />
			</AdaptiveShell>
		</Suspense>
	);
}