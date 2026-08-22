import { type LucideIcon } from "lucide-react";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "lg" | "md" | "sm" | "xs";

const base = "inline-flex items-center justify-center gap-2 rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&:has(svg)]:flex-shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent/5 text-accent focus-visible:ring-accent",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizes: Record<Size, string> = {
  lg: "px-8 py-3 text-lg font-semibold",
  md: "px-6 py-2.5 text-sm font-medium",
  sm: "px-4 py-1.5 text-sm",
  xs: "px-3 py-1 text-xs",
};

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: Variant;
  size?: Size;
  iconRight?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    iconRight: Icon,
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
      {Icon ? (
        <Icon className="shrink-0" />
      ) : null}
    </button>
  );
});