import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-paper-50 px-6"><div className="max-w-md text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-500">404 / Not found</p><h1 className="mt-3 font-display text-5xl">That thread is missing.</h1><p className="mt-4 text-sm leading-6 text-ink-900/60">The page may have moved, or the link may be out of date.</p><Link href="/home" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-sage-500 underline underline-offset-4"><ArrowLeft size={15} /> Return to home</Link></div></main>;
}
