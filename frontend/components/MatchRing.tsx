"use client";

import { useEffect, useState } from "react";

export function MatchRing({ percentage }: { percentage: number }) {
  const [visible, setVisible] = useState(false);
  const value = Math.min(100, Math.max(0, percentage));

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative h-20 w-20 shrink-0" aria-label={`${value}% match`} role="img">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#DCE1E6" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="#B8863B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${value} 100`} pathLength="100" className={`transition-[stroke-dasharray] duration-1000 ease-out ${visible ? "" : "[stroke-dasharray:0_100]"}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl text-ink-900">{value}<sup className="ml-0.5 font-sans text-[9px]">%</sup></span>
    </div>
  );
}