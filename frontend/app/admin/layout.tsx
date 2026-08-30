import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RoleShell } from "@/components/RoleShell";
import { AdminAuthGuard } from "./AdminAuthGuard";

import { verifyJwt } from "@/lib/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("pro-alumn_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("alumni_connect_token")?.value;

  if (!token) {
    redirect("/login?redirect=/admin");
  }

  const payload = verifyJwt(token, JWT_SECRET);
  if (!payload || payload.role?.toUpperCase() !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminAuthGuard>
      <RoleShell role="admin">{children}</RoleShell>
    </AdminAuthGuard>
  );
}
