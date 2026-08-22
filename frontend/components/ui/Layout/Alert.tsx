"use client";

import * as React from "react";
import { AlertCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "destructive" | "success";

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
};

export function Alert({ variant = "default", title, description, action, dismissible }: AlertProps) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  const colors = {
    default: { bg: "bg-border", border: "border-border", icon: "text-ink-900/80" },
    destructive: {
      bg: "bg-destructive/5",
      border: "border-destructive",
      icon: "text-destructive",
    },
    success: { bg: "bg-sage-500/10", border: "border-sage-500", icon: "text-sage-500" },
  };

  const color = colors[variant];

  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border p-4 flex items-start gap-4 transition-colors shadow-sm",
        `border-${color.border.replace("border-", "")}`,
        color.bg
      )}
    >
      <AlertCircle className={cn("flex-shrink-0 size-5", color.icon)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-foreground">{title}</p>}
        <p className="mt-1 text-sm text-foreground/80">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90"
        >
          {action.label}
        </button>
      )}
      {dismissible && (
        <button
          onClick={() => setOpen(false)}
          className="ml-2 opacity-50 hover:text-foreground/60"
          aria-label="Dismiss alert"
        >
          <XCircle className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}