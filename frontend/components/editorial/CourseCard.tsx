"use client";

import { motion } from "framer-motion";
import { Clock, Users, Star, BookOpen } from "lucide-react";
import Image from "next/image";
import { FadeUp } from "@/components/ui/SplitText";

type CourseCardProps = {
  title: string;
  instructor: string;
  instructorInitials: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  students: number;
  rating: number;
  progress?: number;
  thumbnail?: string;
  tags: string[];
  index?: number;
};

const levelColors: Record<string, string> = {
  Beginner: "bg-editorial-green/15 text-editorial-ink",
  Intermediate: "bg-indigo/10 text-indigo",
  Advanced: "bg-editorial-coral/15 text-editorial-coral",
};

export function CourseCard({
  title,
  instructor,
  instructorInitials,
  category,
  level,
  duration,
  students,
  rating,
  progress,
  thumbnail,
  tags,
  index = 0,
}: CourseCardProps) {
  const safeProgress = progress === undefined || !Number.isFinite(progress)
    ? undefined
    : Math.min(100, Math.max(0, progress));

  return (
    <FadeUp delay={index * 0.08} className="group">
      <div className="relative rounded-2xl bg-editorial-card border border-editorial-subtle/60 shadow-float hover:shadow-floatHover transition-all duration-300 overflow-hidden hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative h-44 bg-gradient-to-br from-editorial-ink via-editorial-ink/90 to-editorial-ink/70 overflow-hidden">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="absolute inset-0 h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#00FF8420_1px,transparent_1px),linear-gradient(-45deg,#FF6B5220_1px,transparent_1px)] bg-[size:16px_16px]" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="size-10 text-editorial-green/40" />
          </div>
          {/* Category pill */}
          <span className="absolute top-3 left-3 rounded-pill bg-editorial-ink/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            {category}
          </span>
          {/* Level pill */}
          <span className={`absolute top-3 right-3 rounded-pill px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${levelColors[level]}`}>
            {level}
          </span>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-outfit text-lg font-bold text-editorial-ink leading-snug line-clamp-2 group-hover:text-editorial-green/80 transition-colors">
            {title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-editorial-ink text-[10px] font-bold text-white">
              {instructorInitials}
            </div>
            <span className="text-sm text-editorial-ink/60">{instructor}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-editorial-muted px-2.5 py-0.5 text-[11px] font-semibold text-editorial-ink/60"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Progress bar */}
          {safeProgress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-editorial-ink/50">Progress</span>
                <span className="text-xs font-bold text-editorial-green">{safeProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-editorial-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-editorial-green"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${safeProgress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-editorial-subtle/50">
            <div className="flex items-center gap-1 text-editorial-ink/40">
              <Clock className="size-3.5" />
              <span className="text-xs font-medium">{duration}</span>
            </div>
            <div className="flex items-center gap-1 text-editorial-ink/40">
              <Users className="size-3.5" />
              <span className="text-xs font-medium">{students.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-editorial-ink/40">
              <Star className="size-3.5 fill-editorial-green text-editorial-green" />
              <span className="text-xs font-bold">{rating}</span>
            </div>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}