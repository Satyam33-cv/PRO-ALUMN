"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  reasons?: string[];
  sharedSkills?: string[];
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
          <div className="p-8 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] max-w-md w-full space-y-4">
            <div className="mx-auto w-16 h-16 border-2 border-black bg-[#FF5500] flex items-center justify-center text-black mb-6 shadow-[2px_2px_0px_#000000]">
              <GraduationCap size={32} className="stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black">Student AI Matchmaking</h2>
            <p className="font-mono text-xs text-neutral-600 leading-relaxed">
              Only student accounts can view personalized AI Alumni Career Match rankings based on 384-dimensional vector embeddings.
            </p>
          </div>
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell>
      <div className="container mx-auto py-10 px-4 max-w-6xl space-y-8">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 bg-[#FF5500] border border-black" />
                <span className="font-mono text-xs font-black text-black uppercase tracking-widest">
                  [ SECTION 10 // 384-DIM VECTOR MATCHMAKER ]
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                AI Alumni Matches
              </h1>
              <p className="mt-1 font-mono text-xs text-neutral-600 max-w-xl leading-relaxed">
                Profile analyzed against thousands of alumni using semantic embeddings to surface your highest-affinity career mentors.
              </p>
            </div>
            {!synced && !loading && (
              <button
                onClick={handleSync}
                className="inline-flex items-center gap-2 border-3 border-black bg-[#FF5500] hover:bg-black hover:text-white px-6 py-3 font-mono text-xs font-black uppercase text-black transition-all shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Refresh Embeddings</span>
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 border-4 border-black bg-white shadow-[6px_6px_0px_#000000]"
            >
              <VectorScanner />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {matches?.alumni?.length ? (
                matches.alumni.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="group relative p-6 border-3 border-black bg-white shadow-[4px_4px_0px_#000000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000000] transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="space-y-3 flex-1">
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tight text-black leading-tight">
                            {a.name}
                          </h3>
                          <div className="mt-2 space-y-1 font-mono text-xs text-neutral-600">
                            <p className="flex items-center gap-2">
                              <Building size={14} className="text-black" />
                              <span className="truncate font-bold">{a.currentCompany || a.department || "Alumnus"}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Briefcase size={14} className="text-black" />
                              <span className="truncate">{a.jobTitle || a.role || "Member"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Reasons / Why this match */}
                        {a.reasons && a.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {a.reasons.map((reason, rIdx) => (
                              <span
                                key={rIdx}
                                className="inline-flex border border-black bg-[#FF5500] text-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase shadow-[1px_1px_0px_#000000]"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Shared skills tags */}
                        {a.sharedSkills && a.sharedSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1">
                            <span className="font-mono text-[9px] text-neutral-500 uppercase font-bold self-center mr-0.5">
                              SHARED:
                            </span>
                            {a.sharedSkills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex border border-black bg-[#FF5500] px-1.5 py-0.5 font-mono text-[9px] font-bold text-black"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : a.skills ? (
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {a.skills.split(",").slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-black"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        <MatchRing percentage={typeof a.matchScore === "number" ? a.matchScore : Math.round(Number(a.similarity || 0.85) * (Number(a.similarity) > 1 ? 1 : 100))} />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-black flex items-center gap-2 relative z-10">
                      <Link
                        href={`/chat?userId=${a.id}&recipient=${encodeURIComponent(a.name)}`}
                        className="flex-1 flex items-center justify-center gap-1.5 border-2 border-black bg-black text-[#FF5500] hover:bg-[#FF5500] hover:text-black py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all cursor-pointer text-center"
                      >
                        <MessageSquare size={13} /> Message
                      </Link>
                      <Link
                        href={`/directory?search=${encodeURIComponent(a.name)}`}
                        className="flex-1 flex items-center justify-center gap-1.5 border-2 border-black bg-white text-black hover:bg-neutral-100 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all cursor-pointer text-center"
                      >
                        Profile
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center text-center border-4 border-black bg-white shadow-[6px_6px_0px_#000000]">
                  <div className="size-16 border-2 border-black bg-[#FF5500] flex items-center justify-center text-black mb-4 shadow-[2px_2px_0px_#000000]">
                    <ScanSearch size={28} className="stroke-[2.5]" />
                  </div>
                  <h3 className="font-sans text-xl font-black uppercase text-black">No exact matches yet</h3>
                  <p className="mt-1 font-mono text-xs text-neutral-500 max-w-sm">
                    Ensure your profile is complete with your skills and interests, then click &apos;Refresh Embeddings&apos; to update your semantic vectors.
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
