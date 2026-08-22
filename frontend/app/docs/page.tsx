import type { Metadata } from "next";
import { RoleShell } from "@/components/RoleShell";
import { DocsContent } from "@/components/DocsContent";

export const metadata: Metadata = {
  title: "Google Docs | AlumniConnect",
  description: "Collaborative Google Docs for alumni network guides, minutes, and newsletters",
};

export default function DocsPage() {
  return (
    <RoleShell>
      <DocsContent />
    </RoleShell>
  );
}
