import prisma from "@/lib/prisma";
import LandingPage from "@/components/LandingPage";

export const metadata = {
  title: "PRO ALUMN | AI-Powered Alumni Ecosystem",
  description: "Join the next-generation alumni network featuring AI matching, dynamic mentorship, and a premium video marketplace.",
};

export default async function Page() {
  // Fetch up to 6 published videos for the preview section
  const previewVideos = await prisma.video.findMany({
    where: { status: "PUBLISHED" },
    include: {
      uploader: {
        select: { name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return <LandingPage previewVideos={previewVideos} />;
}
