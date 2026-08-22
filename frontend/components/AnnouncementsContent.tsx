"use client";

import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { Card } from "@/components/ui";
import { Megaphone, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/motion";

export function AnnouncementsContent() {
  const { data: announcements, isLoading } = useApi("announcements:list", () => apiClient.announcements.list());

  return (
    <div className="space-y-10 max-w-4xl mx-auto w-full">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">
          Updates
        </p>
        <h1 className="mt-2 font-display text-5xl">Announcements.</h1>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-ink/5 rounded-2xl w-full"></div>
          <div className="h-40 bg-ink/5 rounded-2xl w-full"></div>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {announcements?.length === 0 ? (
            <p className="text-ink/60">No announcements found at this time.</p>
          ) : (
            announcements?.map((ann: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
              <motion.div key={ann.id} variants={slideUp}>
                <Card padding="lg" className="border-border">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple">
                      <Megaphone size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-xl">{ann.title}</h3>
                      <div className="mt-3 text-sm text-ink/70 leading-relaxed whitespace-pre-wrap">
                        {ann.content || ann.body}
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-ink/50">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : ann.date}
                        </span>
                        <span className="flex items-center gap-1.5 border-l border-ink/10 pl-4">
                          <User size={14} />
                          {ann.author?.name || ann.author || "Admin"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
