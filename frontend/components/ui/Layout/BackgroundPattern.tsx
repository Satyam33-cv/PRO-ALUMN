"use client";

type BackgroundPatternProps = {
  className?: string;
  speed?: number;
  color?: string;
  children?: React.ReactNode;
};

const colorMap: Record<string, string> = {
  brass: "#b8863b",
  sage: "#5c7a6b",
  clay: "#b5573f",
  ink: "#12213d",
  paper: "#f7f5f0",
};

export function BackgroundPattern({
  className,
  color = "slate",
  children,
}: BackgroundPatternProps) {
  // We ignore `speed` since moving patterns are distracting.
  // Use a subtle dotted grid typical in modern minimalist UI (e.g., Vercel, Linear).
  return (
    <div className={className || "min-h-[400px] relative overflow-hidden bg-slate-50"}>
      {/* Subtle Dot Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(15, 23, 42, 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />
      {/* Top radial gradient for depth */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.7),transparent_50%)]"
      />
      
      {/* Content wrapper to ensure z-index is above background */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
