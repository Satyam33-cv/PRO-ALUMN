import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { WalletContent } from "./WalletContent";

export const metadata = {
  title: "Wallet Ledger | PRO ALUMN",
  description: "View your points, rewards, and transaction history.",
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

export default async function WalletPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return <WalletContent wallet={wallet} />;
}
