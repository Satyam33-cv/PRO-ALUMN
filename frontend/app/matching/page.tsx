"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { MatchRing } from "@/components/MatchRing";
import { RoleShell } from "@/components/RoleShell";
import { Sparkles, Building, Briefcase, GraduationCap } from "lucide-react";

export default function MatchingPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<{ alumni: any[] } | null>(null);
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
      setMatches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await apiClient.matching.syncMe();
      setSynced(true);
      loadMatches();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;
  if (!isStudent) {
    return (
      <RoleShell>
        <div className="container mx-auto py-12 px-4 text-center">
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-md mx-auto space-y-3">
            <GraduationCap className="mx-auto text-blue-500" size={32} />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Student AI Matchmaking</h2>
            <p className="text-xs text-slate-500">Only student accounts can view personalized AI Alumni Career Match rankings.</p>
          </div>
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell>
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider">384-Dim Vector Matcher</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
              AI Alumni Matches
            </h1>
            <p className="text-xs text-slate-500">Alumni ranked by skill, career goals, and institutional background similarity</p>
          </div>
          {!synced && (
            <button
              onClick={handleSync}
              className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-700 transition-all cursor-pointer"
            >
              Refresh My Profile Embedding
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400">Computing AI semantic matches...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches?.alumni?.length ? (
              matches.alumni.map((a) => (
                <div
                  key={a.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{a.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building size={12} className="text-slate-400" />
                      <span>{a.currentCompany || a.department || "Alumnus"}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Briefcase size={12} className="text-slate-400" />
                      <span>{a.jobTitle || a.role || "Member"}</span>
                    </p>
                    {a.skills && (
                      <p className="text-[10px] text-slate-400 font-mono line-clamp-1 pt-1">Skills: {a.skills}</p>
                    )}
                  </div>
                  <MatchRing percentage={Math.round(Number(a.matchScore || a.similarity || 0.85) * 100)} />
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                No matches found yet. Please click &ldquo;Refresh My Profile Embedding&rdquo; to analyze your profile.
              </div>
            )}
          </div>
        )}
      </div>
    </RoleShell>
  );
}
