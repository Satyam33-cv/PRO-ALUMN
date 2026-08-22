"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

export type ReferralStatus = "pending" | "accepted" | "referred" | "hired" | "rejected";

const steps = ["Pending", "Accepted", "Referred", "Hired"];

export function ReferralThread({ status }: { status: ReferralStatus }) {
  const currentIndex = status === "rejected" ? -1 : steps.findIndex((step) => step.toLowerCase() === status);

  return (
    <div className="flex w-full items-start" aria-label={`Referral status: ${status}`}>
      {steps.map((step, index) => {
        const complete = currentIndex > index;
        const active = currentIndex === index;
        const rejected = status === "rejected" && index === 0;

        return (
          <div key={step} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2 relative">
              {active && (
                <motion.div
                  layoutId="referral-thread-halo"
                  className="absolute -inset-1 rounded-full bg-brass-500/20"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
              <motion.span
                layout
                initial={false}
                animate={{
                  scale: active ? 1.08 : 1,
                  backgroundColor: rejected
                    ? "#ef4444"
                    : complete
                    ? "#10b981"
                    : active
                    ? "#4f46e5"
                    : "#f1f5f9",
                  borderColor: rejected
                    ? "#dc2626"
                    : complete
                    ? "#059669"
                    : active
                    ? "#4338ca"
                    : "#e2e8f0",
                  color: complete || active || rejected ? "#ffffff" : "#64748b",
                }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-medium shadow-sm relative z-10"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {rejected ? (
                    <motion.span
                      key="rejected"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <X size={13} />
                    </motion.span>
                  ) : complete ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Check size={13} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key={`num-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {index + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
              <motion.span
                layout
                animate={{
                  color: active || complete ? "#0f172a" : "rgba(15, 23, 42, 0.4)",
                  fontWeight: active ? 600 : 500,
                }}
                className="font-mono text-[10px] uppercase tracking-[0.08em]"
              >
                {rejected ? "Declined" : step}
              </motion.span>
            </div>
            {index < steps.length - 1 && (
              <div className="relative mt-3 h-[2px] flex-1 mx-1.5 rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full"
                  initial={false}
                  animate={{
                    width: currentIndex > index ? "100%" : "0%",
                  }}
                  transition={{ type: "spring", stiffness: 240, damping: 26 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
