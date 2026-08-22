"use client";

import { cn } from "@/lib/utils";

type StickySidebarProps = {
  children: React.ReactNode;
  className?: string;
  offsetTop?: number;
  offsetBottom?: number;
};

export function StickySidebar({
  children,
  className,
  offsetTop = 100,
  offsetBottom = 100,
}: StickySidebarProps) {
  return (
    <div
      className={cn(
        "sticky",
        `top-[${offsetTop}px]`,
        `bottom-[${offsetBottom}px]`,
        "max-h-[calc(100vh-200px)] overflow-y-auto",
        className
      )}
    >
      {children}
    </div>
  );
}