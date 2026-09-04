import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { getApiBaseUrl } from "@/lib/api";
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
    return { ...decoded, token };
  } catch {
    return null;
  }
}

export default async function EducationPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  const baseUrl = getApiBaseUrl();
  let videos: any[] = [];
  let balance = 0;
  const unlockedIds: string[] = [];

  try {
    const [videoRes, walletRes] = await Promise.all([
      fetch(`${baseUrl}/video`, {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : { videos: [] })),
      fetch(`${baseUrl}/gamification/wallet`, {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : { wallet: { balance: 0 } })),
    ]);

    videos = videoRes.videos || [];
    balance = walletRes.wallet?.balance || 0;
  } catch {
    // Graceful fallback
  }

  return (
    <EducationContent 
      initialVideos={videos.map((v: any) => ({ ...v, description: v.description || "" }))} 
      balance={balance} 
      unlockedIds={unlockedIds}
    />
  );
}
