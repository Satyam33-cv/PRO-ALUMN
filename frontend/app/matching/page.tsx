"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { MatchRing } from "@/components/MatchRing";
import { RoleShell } from "@/components/RoleShell";
import {
  Sparkles,
  Building,
  Briefcase,
  GraduationCap,
  MessageSquare,
  ArrowUpRight,
  ScanSearch,
  RefreshCw,
} from "lucide-react";

interface MatchItem {
  id: string;
  name: string;
  currentCompany?: string;
  department?: string;
  jobTitle?: string;
  role?: string;
  skills?: string;
  matchScore?: number;
  similarity?: number;
}

function VectorScanner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative flex h-48 w-48 items-center justify-center">
        {/* Radar Background */}
        <div className="absolute inset-0 rounded-full border border-amber-500/20 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.1)]" />
        <div className="absolute inset-4 rounded-full border border-amber-500/20" />
        <div className="absolute inset-12 rounded-full border border-amber-500/20" />
        <div className="absolute inset-20 rounded-full border border-amber-500/20 bg-amber-500/10" />

        {/* Crosshairs */}
        <div className="absolute h-full w-[1px] bg-amber-500/20" />
        <div className="absolute w-full h-[1px] bg-amber-500/20" />

        {/* Sweeping Radar Scanner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 origin-center"
        >
          <div className="h-[50%] w-[50%] origin-bottom-right bg-gradient-to-tl from-amber-500/40 to-transparent" />
        </motion.div>

        <ScanSearch className="absolute text-amber-500" size={32} />
      </div>
      <p className="mt-8 font-mono text-sm tracking-[0.2em] text-amber-500 uppercase">
        Computing 384-Dim Vectors...
      </p>
      <p className="mt-2 text-xs text-ink/40 text-center max-w-xs">
        Finding alumni with the closest semantic similarity to your career goals and technical skills.
      </p>
    </div>
  );
}

export default function MatchingPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<{ alumni: MatchItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  const isStudent = user?.role === "student" || (user?.role as string) === "STUDENT";

  useEffect(() => {
    if (isStudent) {
      loadMatches();
    } else {
      setLoading(false);
    }
  }, [user, isStudent]);

  const loadMatches = async () => {
    try {
      const data = await apiClient.matching.topAlumni();
      setMatches(data as unknown as { alumni: MatchItem[] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      await apiClient.matching.syncMe();
      setSynced(true);
      await loadMatches();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (!user) return null;

  if (!isStudent) {
    return (
      <RoleShell>
        <div className="container mx-auto py-24 px-4 text-center flex flex-col items-center">
          <div className="p-10 rounded-3xl border border-ink/10 bg-white/40 backdrop-blur-xl shadow-xl max-w-md w-full space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6">
              <GraduationCap size={32} />
            </div>
            <h2 className="text-2xl font-display text-ink">Student AI Matchmaking</h2>
            <p className="text-sm text-ink/60 leading-relaxed">
              Only student accounts can view personalized AI Alumni Career Match rankings based on 384-dimensional vector embeddings.
            </p>
          </div>
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell>
      <div className="container mx-auto py-10 px-4 max-w-6xl space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-amber-500" />
              <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-widest">
                384-Dim Vector Matcher
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display text-ink tracking-tight">
              AI Alumni Matches
            </h1>
            <p className="mt-3 text-sm text-ink/50 max-w-xl leading-relaxed">
              We've analyzed your profile against thousands of alumni using semantic embeddings to find your perfect career mentors.
            </p>
          </div>
          {!synced && !loading && (
            <button
              onClick={handleSync}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-ink px-6 py-3 font-semibold text-white transition-all hover:bg-brass hover:shadow-lg active:scale-95"
            >
              <RefreshCw className="transition-transform group-hover:rotate-180" size={16} />
              <span className="relative z-10 text-sm">Refresh Embeddings</span>
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-12"
            >
              <VectorScanner />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8"
            >
              {matches?.alumni?.length ? (
                matches.alumni.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative overflow-hidden p-6 rounded-3xl border border-ink/10 bg-white/50 backdrop-blur-xl shadow-sm transition-all hover:shadow-xl hover:border-brass/30 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={80} className="text-brass/10 -mt-6 -mr-6" />
                    </div>

                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="space-y-4 flex-1">
                        <div>
                          <h3 className="font-display text-xl text-ink leading-tight">
                            {a.name}
                          </h3>
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs font-medium text-ink/70 flex items-center gap-2">
                              <Building size={14} className="text-ink/40" />
                              <span className="truncate">{a.currentCompany || a.department || "Alumnus"}</span>
                            </p>
                            <p className="text-xs text-ink/50 flex items-center gap-2">
                              <Briefcase size={14} className="text-ink/40" />
                              <span className="truncate">{a.jobTitle || a.role || "Member"}</span>
                            </p>
                          </div>
                        </div>

                        {a.skills && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {a.skills.split(",").slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex rounded-md bg-brass/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-brass border border-brass/20"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                            {a.skills.split(",").length > 3 && (
                              <span className="inline-flex rounded-md bg-ink/5 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-ink/40 border border-ink/10">
                                +{a.skills.split(",").length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-center gap-4">
                        <MatchRing percentage={Math.round(Number(a.matchScore || a.similarity || 0.85) * 100)} />
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-ink/5 flex items-center gap-3 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ink text-paper py-2.5 text-xs font-bold hover:bg-brass transition-colors shadow-md">
                        <MessageSquare size={14} /> Message
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-ink/20 text-ink bg-white/50 py-2.5 text-xs font-bold hover:border-brass hover:text-brass transition-colors">
                        View Profile
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center text-center">
                  <div className="size-20 rounded-full bg-ink/5 flex items-center justify-center text-ink/20 mb-6">
                    <ScanSearch size={32} />
                  </div>
                  <h3 className="font-display text-2xl text-ink">No exact matches yet</h3>
                  <p className="mt-2 text-sm text-ink/50 max-w-sm">
                    Ensure your profile is complete with your skills and interests, then click 'Refresh Embeddings' to update your semantic vectors.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleShell>
  );
}
