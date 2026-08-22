import type { Metadata } from "next";
import { RoleShell } from "@/components/RoleShell";
import { KeepContent } from "@/components/KeepContent";

export const metadata: Metadata = {
  title: "Google Keep Notes | AlumniConnect",
  description: "Keep notes, checklists, and memos synced across the alumni community",
};

export default function KeepPage() {
  return (
    <RoleShell>
      <KeepContent />
    </RoleShell>
  );
}
