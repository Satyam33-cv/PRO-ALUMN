import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { MatchRing } from "./MatchRing";

type Alumni = { id: string; name: string; batch: string; company: string; role: string; location: string; initials: string; match?: number };

export function AlumniCard({ alumni }: { alumni: Alumni }) {
  return (
    <article className="group border border-ink-900/10 bg-white/70 p-5 transition-colors hover:border-brass-500/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-500 text-sm font-semibold text-white">{alumni.initials}</div>
          <div><h3 className="font-display text-xl">{alumni.name}</h3><p className="font-mono text-[10px] uppercase tracking-wider text-ink-900/45">Class of {alumni.batch}</p></div>
        </div>
        {alumni.match ? <MatchRing percentage={alumni.match} /> : null}
      </div>
      <div className="mt-6 border-t border-ink-900/10 pt-4"><p className="text-sm font-medium">{alumni.role} <span className="text-ink-900/35">at</span> {alumni.company}</p><p className="mt-1 flex items-center gap-1 text-xs text-ink-900/50"><MapPin size={12} /> {alumni.location}</p></div>
      <Link href={`/directory/${alumni.id}`} className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-sage-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 group-hover:text-brass-500">View profile <ArrowUpRight size={13} /></Link>
    </article>
  );
}