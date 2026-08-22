import { forwardRef, useId } from "react";

export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  dark?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "label">;

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, dark = false, id, className = "", ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = [hint ? `${inputId}-hint` : null, error ? `${inputId}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <label htmlFor={inputId} className={`block text-sm font-medium ${dark ? "text-muted-foreground" : "text-foreground"}`}>
      <span>{label}</span>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm placeholder-muted-foreground focus:border-primary transition-colors ${dark ? "dark:border-muted" : ""} ${error ? "border-destructive" : ""} outline-none ${className}`}
        {...rest}
      />
      {hint && !error ? <span id={`${inputId}-hint`} className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
      {error ? <span id={`${inputId}-err`} className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
});