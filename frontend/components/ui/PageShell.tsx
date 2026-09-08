import type { ReactNode } from "react";

type PageShellProps = {
  /** Small mono label above the title */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Right-side actions (buttons / links) */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Shared member-facing page chrome: plain title, optional description,
 * optional actions, consistent width. Keeps neo-brutalist pages readable.
 */
export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
}: PageShellProps) {
  return (
    <div className={`page-shell ${className}`}>
      <header className="mb-8 flex flex-col gap-4 border-b-2 border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#635f57]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-sans text-3xl font-black tracking-tight text-black sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-[#635f57]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
