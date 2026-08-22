import { JobDetailContent } from "@/components/JobDetailContent";
import { RoleShell } from "@/components/RoleShell";

export default function JobDetailPage({ params }: { params: { id: string } }) {
	return <RoleShell><JobDetailContent id={params.id} /></RoleShell>;
}