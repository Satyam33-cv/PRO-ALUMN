"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Card, ErrorState, Skeleton } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";

export function AlumniProfileContent({ id }: { id: string }) {
  const { data, error, isLoading, refresh } = useApi(`alumni:${id}`, () => apiClient.alumni.get(id));

  if (isLoading) return <div className="max-w-3xl space-y-5"><Skeleton className="h-4 w-24" /><Skeleton variant="card" className="h-72" /></div>;
  if (error) return <ErrorState title="Profile unavailable" body={error.message} retry={() => void refresh()} />;
  if (!data) return null;

  return <div className="max-w-3xl"><Link href="/directory" className="inline-flex items-center gap-2 text-sm text-ink-900/55 hover:text-brass-500"><ArrowLeft size={16} /> Back to directory</Link><Card padding="lg" className="mt-10"><div className="flex flex-wrap items-start justify-between gap-6"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-500 text-lg font-semibold text-white">{data.initials}</div><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-500">Class of {data.batch}</p><h1 className="mt-2 font-display text-4xl">{data.name}</h1><p className="mt-2 text-sm text-ink-900/60">{data.role} at {data.company}</p></div></div><p className="flex items-center gap-1 text-xs text-ink-900/50"><MapPin size={13} /> {data.location}</p></div><p className="mt-10 max-w-2xl text-base leading-7 text-ink-900/70">{data.bio ?? data.headline ?? `${data.name} is part of the PRO ALUMN network.`}</p></Card></div>;
}