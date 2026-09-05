import { JobDetailContent } from "@/components/JobDetailContent";
import { RoleShell } from "@/components/RoleShell";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return (
    <RoleShell>
      <JobDetailContent id={resolved.id} />
    </RoleShell>
  );
}