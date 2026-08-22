import { forwardRef } from "react";

type Tone = "default" | "muted" | "glass" | "dark";
type Padding = "sm" | "md" | "lg";

const tones: Record<Tone, string> = {
  default: "border bg-card hover:bg-card/80 transition-colors",
  muted: "border bg-muted/50 hover:bg-muted/80 transition-colors",
  glass: "bg-glass border-glass backdrop-blur-sm hover:bg-glass/80 transition-all",
  dark: "bg-dark text-dark-border border-dark-border",
};

const padding: Record<Padding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  padding?: Padding;
  className?: string;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = "default", padding: pad = "md", className = "", ...rest },
  ref
) {
  return <div ref={ref} className={`${tones[tone]} ${padding[pad]} ${className}`} {...rest} />;
});