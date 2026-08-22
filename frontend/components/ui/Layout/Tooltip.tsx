"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  title: string;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ title, children, placement = "top", className, ...props }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {React.Children.only(children)}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={placement}
          className={cn(
            "z-50 max-w-xs rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className
          )}
          {...props}
        >
          {title}
          <TooltipPrimitive.Arrow className="fill-background" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}