"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DynamicWatermarkProps {
  /** The text to display as the watermark (e.g., user email, ID) */
  identifier: string;
  /** Opacity of the watermark (default: 0.25) */
  opacity?: number;
  /** Interval in milliseconds to change position (default: 8000) */
  intervalMs?: number;
}

export function DynamicWatermark({
  identifier,
  opacity = 0.25,
  intervalMs = 8000,
}: DynamicWatermarkProps) {
  const [position, setPosition] = useState({ top: "50%", left: "50%" });

  useEffect(() => {
    // Function to generate random positions, keeping the text within bounds
    const updatePosition = () => {
      // Random value between 10% and 90% to prevent it from going off-screen
      const randomTop = Math.floor(Math.random() * 80) + 10;
      const randomLeft = Math.floor(Math.random() * 80) + 10;

      setPosition({
        top: `${randomTop}%`,
        left: `${randomLeft}%`,
      });
    };

    // Initial position set
    updatePosition();

    // Setup interval to move the watermark
    const interval = setInterval(updatePosition, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-50 select-none"
      aria-hidden="true"
    >
      <motion.div
        animate={{
          top: position.top,
          left: position.left,
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
        }}
        className="absolute whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2"
        style={{ opacity }}
      >
        <div className="flex flex-col items-center justify-center -rotate-12">
          <span className="text-white font-mono text-sm sm:text-base md:text-lg font-bold tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {identifier}
          </span>
          <span className="text-white/70 font-mono text-[10px] sm:text-xs font-semibold tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            DO NOT RECORD
          </span>
        </div>
      </motion.div>
    </div>
  );
}
