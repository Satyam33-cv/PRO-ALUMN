import { Skeleton } from "@/components/ui";

export default function Loading() {
  return <main className="min-h-screen bg-paper-50 px-6 py-16 lg:pl-80" aria-busy="true" aria-label="Loading page"><div className="max-w-3xl"><Skeleton className="h-3 w-32" /><Skeleton className="mt-5 h-14 max-w-xl" /><Skeleton className="mt-4 h-4 max-w-md" /><Skeleton variant="card" className="mt-12 h-64" /></div></main>;
}
