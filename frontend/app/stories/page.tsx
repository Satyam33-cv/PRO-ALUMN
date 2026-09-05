import type { Metadata } from "next";
import { Suspense } from "react";
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

export default async function StoriesPage({
  searchParams,
}: {
  searchParams?: { view?: string | string[] };
}) {
  const rawView = Array.isArray(searchParams?.view)
    ? searchParams.view[0]
    : searchParams?.view;
  const view = rawView === "showcase" ? "showcase" : rawView === "member" ? "member" : undefined;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcf9f3] p-8 font-mono text-xs flex items-center justify-center">[ INITIALIZING SPOTLIGHT CHRONICLES... ]</div>}>
      <AdaptiveShell activeRoute="stories" forcePublic={view === "showcase"}>
        <StoriesContent viewMode={view} />
      </AdaptiveShell>
    </Suspense>
  );
}
