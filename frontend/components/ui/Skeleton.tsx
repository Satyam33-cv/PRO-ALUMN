export function Skeleton({ variant = "line", className = "" }: { variant?: "line" | "card" | "circle" | "block"; className?: string }) {
  const base = "animate-pulse bg-ink-900/10";
  switch (variant) {
    case "line":
      return <span className={`inline-block h-3 w-full ${base} ${className}`} aria-hidden />;
    case "card":
      return <span className={`block h-32 w-full ${base} ${className}`} aria-hidden />;
    case "circle":
      return <span className={`inline-block h-10 w-10 rounded-full ${base} ${className}`} aria-hidden />;
    case "block":
    default:
      return <span className={`block h-full w-full ${base} ${className}`} aria-hidden />;
  }
}
