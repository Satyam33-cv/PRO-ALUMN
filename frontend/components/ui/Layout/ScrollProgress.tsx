"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type ScrollProgressProps = {
  className?: string;
  color?: "purple" | "blue" | "ink" | "destructive";
  height?: number;
};

export function ScrollProgress({ className, color = "purple", height = 3 }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const colors = {
    purple: "bg-purple",
    blue: "bg-blue",
    ink: "bg-ink",
    destructive: "bg-destructive",
  };

  return (
    <motion.div
      className={`fixed top-0 left-0 z-50 h-${height} w-full ${colors[color]} ${className}`}
      style={{ transformOrigin: "left center" }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      transition={{ duration: 0.1, ease: "linear" }}
      aria-hidden="true"
    />
  );
}