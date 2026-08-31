import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { EducationContent } from "./EducationContent";

export const metadata = {
  title: "Education Centre | PRO ALUMN",
  description: "Browse and share videos.",
};

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

async function getUserSession() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("pro-alumn_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("alumni_connect_token")?.value;

  if (!token) return null;

  try {
    const decoded = verifyJwt(token, JWT_SECRET);
    if (!decoded || !decoded.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

export default async function EducationPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  const videos = await prisma.video.findMany({
    where: { status: "PUBLISHED" },
    include: {
      uploader: {
        select: { name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.id },
    select: { balance: true },
  });

  const unlocked = await prisma.unlockedVideo.findMany({
    where: { userId: session.id },
    select: { videoId: true },
  });
  const unlockedIds = unlocked.map((u: any) => u.videoId);

  return (
    <EducationContent 
      initialVideos={videos.map((v: any) => ({ ...v, description: v.description || "" }))} 
      balance={wallet?.balance || 0} 
      unlockedIds={unlockedIds}
    />
  );
}
