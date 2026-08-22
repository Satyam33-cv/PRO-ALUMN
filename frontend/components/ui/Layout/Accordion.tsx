"use client";

import * as React from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionProps {
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ className, children }: AccordionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-left transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{children}</span>
            <ChevronDown className="flex h-4 w-5 shrink-0 stroke-current transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-sm text-foreground overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <p className="text-foreground/80">{/* Content passed via children */}</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}