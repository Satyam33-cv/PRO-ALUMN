import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RoleShell } from "@/components/RoleShell";
import { AdminAuthGuard } from "./AdminAuthGuard";

function decodeJwt(token: string): { id?: string; role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("pro-alumn_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("alumni_connect_token")?.value;

  if (!token) {
    redirect("/login?redirect=/admin");
  }

  const payload = decodeJwt(token);
  if (!payload || payload.role?.toUpperCase() !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminAuthGuard>
      <RoleShell role="admin">{children}</RoleShell>
    </AdminAuthGuard>
  );
}
