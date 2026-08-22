"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
} as const;

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
} as const;

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
} as const;

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 },
} as const;

type MotionDivProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function MotionDiv({ children, className, onClick }: MotionDivProps) {
  return (
    <motion.div
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      transition={fadeIn.transition}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, onClick }: MotionDivProps) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function AnimatePage({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
