"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth, type UserRole } from "@/lib/context/AuthContext";
import { Card } from "@/components/ui";

export function RoleGate({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (user?.role && allow.includes(user.role)) return <>{children}</>;

  return (
    <Card padding="lg" className="mx-auto max-w-xl text-center">
      <ShieldAlert size={28} className="mx-auto text-brass-500" />
      <h1 className="mt-4 font-display text-3xl">This area is restricted</h1>
      <p className="mt-3 text-sm leading-6 text-ink-900/60">
        Sign in with an {allow.join(" or ")} account to continue.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-paper-50 hover:bg-brass-500"
      >
        Switch account
      </Link>
    </Card>
  );
}
