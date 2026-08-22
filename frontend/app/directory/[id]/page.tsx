import { AlumniProfileContent } from "@/components/AlumniProfileContent";
import { RoleShell } from "@/components/RoleShell";

export default function AlumniProfilePage({ params }: { params: { id: string } }) {
  return <RoleShell><AlumniProfileContent id={params.id} /></RoleShell>;
}