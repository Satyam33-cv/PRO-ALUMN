import type { Metadata } from "next";
import { ChatContent } from "@/components/ChatContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = {
  title: "Unified Advisory Messaging & Escrow Conduit | PRO-ALUMN",
  description: "Synchronous peer advisory sessions, real-time escrow dispatch, and encrypted code artifact sharing.",
};

export default function ChatPage() {
  return <RoleShell><ChatContent /></RoleShell>;
}
