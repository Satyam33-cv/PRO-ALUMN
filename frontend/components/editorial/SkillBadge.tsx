"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp, Award, CheckCircle2, Sparkles } from "lucide-react";
import { FadeUp } from "@/components/ui/SplitText";

type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

type SkillBadgeProps = {
  name: string;
  level: SkillLevel;
  endorsements?: number;
  verified?: boolean;
};

const levelConfig: Record<SkillLevel, { color: string; bg: string; icon: typeof Zap }> = {
  Beginner: { color: "text-editorial-ink/60", bg: "bg-editorial-muted", icon: Zap },
  Intermediate: { color: "text-editorial-green", bg: "bg-editorial-green/10", icon: TrendingUp },
  Advanced: { color: "text-indigo", bg: "bg-indigo/10", icon: Award },
  Expert: { color: "text-editorial-coral", bg: "bg-editorial-coral/10", icon: Sparkles },
};

export function SkillBadge({ name, level, endorsements = 0, verified = false }: SkillBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group"
    >
      <div className={`flex items-center gap-2 rounded-pill ${config.bg} px-4 py-2 border border-transparent hover:border-editorial-ink/5 transition-all cursor-default`}>
        <Icon className={`size-3.5 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>{name}</span>
        {verified && (
          <CheckCircle2 className="size-3 text-editorial-green fill-editorial-green/20" />
        )}
        {endorsements > 0 && (
          <span className="ml-1 text-[10px] font-bold text-editorial-ink/30">
            {endorsements}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Learning Path Card
type LearningPathCardProps = {
  title: string;
  description: string;
  steps: number;
  completedSteps: number;
  category: string;
  index?: number;
};

export function LearningPathCard({
  title,
  description,
  steps,
  completedSteps,
  category,
  index = 0,
}: LearningPathCardProps) {
  const safeSteps = Math.max(1, Math.floor(Number.isFinite(steps) ? steps : 1));
  const completed = Math.min(Math.max(Math.floor(Number.isFinite(completedSteps) ? completedSteps : 0), 0), safeSteps);
  const progress = safeSteps > 0 ? Math.round((completed / safeSteps) * 100) : 0;

  return (
    <FadeUp delay={index * 0.1}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative rounded-2xl bg-editorial-card border border-editorial-subtle/60 p-6 shadow-float hover:shadow-floatHover transition-shadow duration-300"
      >
        {/* Step indicator dots */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: safeSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < completed ? "bg-editorial-green" : "bg-editorial-muted"
              }`}
            />
          ))}
        </div>

        <span className="inline-block rounded-pill bg-editorial-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-editorial-ink/50 mb-3">
          {category}
        </span>

        <h3 className="font-outfit text-lg font-bold text-editorial-ink leading-snug mb-2">
          {title}
        </h3>
        <p className="text-sm text-editorial-ink/50 leading-relaxed mb-4">{description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-editorial-ink/40">
            {completed}/{safeSteps} steps
          </span>
          <span className="text-xs font-bold text-editorial-green">{progress}%</span>
        </div>
      </motion.div>
    </FadeUp>
  );
}

// Stats Card
type StatsCardProps = {
  icon: typeof Zap;
  value: string;
  label: string;
  color?: "green" | "coral" | "ink";
  index?: number;
};

const colorMap = {
  green: "bg-editorial-green/10 text-editorial-green",
  coral: "bg-editorial-coral/10 text-editorial-coral",
  ink: "bg-editorial-ink/5 text-editorial-ink",
};

export function StatsCard({ icon: Icon, value, label, color = "green", index = 0 }: StatsCardProps) {
  return (
    <FadeUp delay={index * 0.1}>
      <div className="rounded-2xl bg-editorial-card border border-editorial-subtle/60 p-6 shadow-float text-center">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color]} mb-3`}>
          <Icon className="size-5" />
        </div>
        <p className="font-outfit text-3xl font-extrabold text-editorial-ink">{value}</p>
        <p className="text-sm text-editorial-ink/50 mt-1">{label}</p>
      </div>
    </FadeUp>
  );
}