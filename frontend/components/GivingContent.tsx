"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Info,
  ChevronRight,
  Trophy,
  Heart,
  BookOpen,
  GraduationCap,
  X,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion";

const initiatives = [
  {
    title: "Library Renovation",
    description:
      "Help modernize our campus library with new study spaces, digital resources, and a career resource center.",
    icon: BookOpen,
  },
  {
    title: "Student Emergency Fund",
    description:
      "Provide emergency financial support to students facing unexpected hardships during their studies.",
    icon: Heart,
  },
  {
    title: "Research Grants",
    description:
      "Fund student-led research projects that tackle real-world problems across disciplines.",
    icon: GraduationCap,
  },
];

const topDonors = [
  { rank: 1, name: "Priya Raman", batch: "2018", amount: "$25,000" },
  { rank: 2, name: "Marcus Chen", batch: "2016", amount: "$18,500" },
  { rank: 3, name: "Nina Okafor", batch: "2019", amount: "$15,000" },
  { rank: 4, name: "Jon Bell", batch: "2012", amount: "$12,000" },
  { rank: 5, name: "Raj Patel", batch: "2017", amount: "$10,000" },
];

const giftAmounts = ["$25", "$50", "$100", "$250", "Other"];

export function GivingContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const progress = 68;
  const goal = 50000;
  const raised = Math.round(goal * (progress / 100));

  const handleContribute = () => {
    setModalOpen(false);
    setSelectedAmount(null);
    showToast("Preview only — this feature is not yet active.");
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl space-y-12"
    >
      <motion.div
        variants={fadeIn}
        className="rounded-lg border border-brass-500/30 bg-brass-500/10 px-5 py-4"
      >
        <p className="flex items-center gap-2 text-sm text-ink-900/70">
          <Info size={16} className="shrink-0 text-brass-500" />
          Preview only — donations are not yet wired to a payment backend.
        </p>
      </motion.div>

      <motion.div variants={slideUp}>
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-500">
            Featured Campaign
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">
            Alumni Scholarship Fund
          </h1>
        </div>
        <Card padding="lg">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl">${raised.toLocaleString()}</p>
              <p className="mt-1 text-xs text-ink-900/55">
                raised of ${goal.toLocaleString()} goal
              </p>
            </div>
            <Badge tone="success">{progress}%</Badge>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-900/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-tertiaryOnContainer"
            />
          </div>
          <button
            onClick={() => {
              setSelectedAmount(null);
              setModalOpen(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brass-500 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brass-600"
          >
            Contribute Now <ChevronRight size={15} />
          </button>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-sage-500">
          Initiatives
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {initiatives.map((init) => (
            <Card key={init.title} padding="md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass-500/15 text-brass-500">
                <init.icon size={18} />
              </div>
              <h3 className="mt-4 font-display text-lg">{init.title}</h3>
              <p className="mt-2 text-xs leading-5 text-ink-900/60">
                {init.description}
              </p>
              <button
                onClick={() =>
                  showToast(
                    "Preview only — this feature is not yet active."
                  )
                }
                className="mt-4 text-xs font-semibold text-brass-500 hover:text-brass-600"
              >
                Support →
              </button>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={slideUp}>
        <div className="mb-5 flex items-center gap-2">
          <Trophy size={16} className="text-brass-500" />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-500">
            Top Donors
          </p>
        </div>
        <Card padding="md">
          <div className="divide-y divide-ink-900/10">
            {topDonors.map((donor) => (
              <div
                key={donor.rank}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900/10 font-mono text-xs font-semibold text-ink-900">
                  {donor.rank}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {donor.name}
                  </p>
                  <p className="text-xs text-ink-900/50">Batch {donor.batch}</p>
                </div>
                <span className="font-mono text-sm font-semibold text-brass-500">
                  {donor.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Select gift amount</h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedAmount(null);
                }}
                className="text-ink-900/40 hover:text-ink-900"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {giftAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                    selectedAmount === amt
                      ? "border-brass-500 bg-brass-500/10 text-brass-500"
                      : "border-ink-900/15 text-ink-900 hover:border-brass-500/50"
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleContribute()}
              disabled={!selectedAmount}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brass-500 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brass-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Contribute {selectedAmount ? selectedAmount : ""}
            </button>
          </motion.div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-900 px-5 py-3 text-sm text-paper-50 shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}
