"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BentoItem = {
  id: string;
  i: string;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  move?: boolean;
  children: React.ReactNode;
};

type BentoGridProps = {
  items: BentoItem[];
  className?: string;
  gutter?: number;
};

const gridSettings: Record<string, { w: number; h: number }> = {
  stats: { w: 2, h: 1 },
  cards: { w: 3, h: 2 },
  chart: { w: 4, h: 3 },
  avatar: { w: 1, h: 1 },
  empty: { w: 1, h: 1 },
};

export function BentoGrid({ items, className, gutter = 12 }: BentoGridProps) {
  useEffect(() => {
    // Initialize positions
  }, [items]);

  return (
    <div
      className={cn(`grid gap-${gutter}px`, className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))` }}
    >
      {items.map((item) => {
        const setting = gridSettings[item.i] || { w: 2, h: 1 };

        return (
          <motion.div
            key={item.id}
            className={cn("bento-item", "p-4 rounded-lg border bg-background hover:bg-background/80 transition-colors cursor-grab")}
            style={{
              gridArea: item.i,
              width: `${setting.w * 100}%`,
              height: `${setting.h * 100}%`,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
            variants={{
              visible: {
                transition: { type: "spring", stiffness: 300, damping: 30 },
              },
            }}
            initial="hidden"
            animate="visible"
          >
            {item.children}
          </motion.div>
        );
      })}
    </div>
  );
}