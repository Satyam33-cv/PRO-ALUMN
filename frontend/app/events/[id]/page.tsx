import { EventDetailContent } from "@/components/EventDetailContent";
import { RoleShell } from "@/components/RoleShell";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return <RoleShell><EventDetailContent id={params.id} /></RoleShell>;
}