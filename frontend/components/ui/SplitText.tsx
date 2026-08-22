"use client";

import { useEffect, useRef, ReactNode } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import type { Variants } from "framer-motion";

type SplitTextProps = {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  duration?: number;
  staggerChildren?: number;
  once?: boolean;
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 20, stiffness: 100 },
  },
};

export function SplitText({
  children,
  as: Tag = "h2",
  className = "",
  delay = 0,
  duration = 0.4,
  staggerChildren = 0.04,
  once = true,
}: SplitTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-50px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const words = children.split(" ");

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren: delay } },
  };

  const MotionTag = motion[Tag];

  return (
    <MotionTag
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      aria-label={children}
      className={className}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            variants={wordVariants}
            transition={{ duration, ease: "easeOut" }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </MotionTag>
  );
}

// Character-level split for emphasis text
type SplitCharsProps = Omit<SplitTextProps, "children"> & {
  children: string;
};

export function SplitChars({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
  staggerChildren = 0.02,
  once = true,
}: SplitCharsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-50px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren: delay } },
  };

  const charVariants: Variants = {
    hidden: { opacity: 0, y: 40, rotateX: -40 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      aria-label={children}
      className="inline"
    >
      <Tag className={className}>
        {children.split("").map((char, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <motion.span
              className="inline-block"
              variants={charVariants}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          </span>
        ))}
      </Tag>
    </motion.div>
  );
}

// Fade-up paragraph block
type FadeUpProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
};

export function FadeUp({ children, className = "", delay = 0, once = true }: FadeUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}