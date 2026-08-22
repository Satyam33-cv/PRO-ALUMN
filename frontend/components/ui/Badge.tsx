import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "neutral" | "accent" | "danger";

const tones: Record<BadgeTone, string> = {
  success: "bg-sage-500/10 text-sage-500",
  warning: "bg-brass-500/15 text-brass-500",
  accent: "bg-ink-900/10 text-ink-900",
  neutral: "border border-mist-200 text-ink-900/65",
  danger: "bg-clay-500/10 text-clay-500"
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
