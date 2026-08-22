import type { Metadata } from "next";
import { ChatContent } from "@/components/ChatContent";
import { RoleShell } from "@/components/RoleShell";

export const metadata: Metadata = { title: "Messages | PRO ALUMN" };

export default function ChatPage() {
  return <RoleShell><ChatContent /></RoleShell>;
}
