import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { HelpContent } from "./HelpContent";

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

export const metadata = {
  title: "Help & Support | PRO ALUMN",
  description: "Get assistance from the Pro Alumn support team.",
};

export default async function HelpPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return <HelpContent userSession={session} />;
}