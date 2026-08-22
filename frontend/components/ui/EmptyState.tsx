import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-ink-900/20 bg-paper-50/60 p-8 sm:p-10">
      {Icon ? <Icon size={22} className="text-brass-500" strokeWidth={1.6} /> : null}
      <div>
        <h3 className="font-display text-2xl">{title}</h3>
        {body ? <p className="mt-2 max-w-prose text-sm leading-6 text-ink-900/60">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}
