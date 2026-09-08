"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, RefreshCw, User } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { RoleShell } from "@/components/RoleShell";
import { PageShell } from "@/components/ui/PageShell";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";

type MatchItem = {
  id: string;
  name: string;
  currentCompany?: string;
  company?: string;
  department?: string;
  jobTitle?: string;
  role?: string;
  skills?: string | string[];
  matchScore?: number;
  similarity?: number;
  reasons?: string[];
  sharedSkills?: string[];
};

function scorePercent(m: MatchItem): number | null {
  const raw = m.matchScore ?? m.similarity;
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  return Math.round(raw > 1 ? raw : raw * 100);
}

export default function MatchingPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.matching.topAlumni();
      const list = (data as { alumni?: MatchItem[] })?.alumni;
      setMatches(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not load matches";
      setError(msg);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient.matching.syncMe();
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not refresh profile for matching";
      setError(msg);
    } finally {
      setSyncing(false);
    }
  };

  const handleMessage = async (alumniId: string, name: string) => {
    try {
      const res = await apiClient.chat.createThread(alumniId);
      const thread = (res as { thread?: { id?: string }; id?: string })?.thread;
      const id = thread?.id || (res as { id?: string }).id;
      if (id) {
        window.location.href = `/chat?thread=${encodeURIComponent(id)}`;
      } else {
        window.location.href = `/chat?userId=${encodeURIComponent(alumniId)}&recipient=${encodeURIComponent(name)}`;
      }
    } catch {
      window.location.href = `/chat?userId=${encodeURIComponent(alumniId)}&recipient=${encodeURIComponent(name)}`;
    }
  };

  return (
    <RoleShell>
      <PageShell
        eyebrow="Matches"
        title="Alumni matches"
        description="People ranked by profile similarity (skills, department, goals). Update your profile, then refresh."
        actions={
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing || loading}
            className="nb-btn-secondary"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : undefined} />
            {syncing ? "Refreshing…" : "Refresh matches"}
          </button>
        }
      >
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-20 border-2 border-black" />
            <Skeleton className="h-20 border-2 border-black" />
            <Skeleton className="h-20 border-2 border-black" />
          </div>
        ) : error ? (
          <ErrorState title="Could not load matches" body={error} retry={() => void load()} />
        ) : matches.length === 0 ? (
          <EmptyState
            title="No matches yet"
            body="Add skills, department, and a short bio on your profile. Then refresh matches. New accounts start empty until profile data exists."
            action={
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/profile" className="nb-btn">
                  Edit profile
                </Link>
                <Link href="/directory" className="nb-btn-secondary">
                  Browse directory
                </Link>
              </div>
            }
          />
        ) : (
          <ul className="nb-card divide-y-2 divide-black">
            {matches.map((m) => {
              const company = m.currentCompany || m.company || "";
              const title = m.jobTitle || m.role || "";
              const pct = scorePercent(m);
              const skills = Array.isArray(m.sharedSkills)
                ? m.sharedSkills
                : Array.isArray(m.skills)
                  ? m.skills
                  : typeof m.skills === "string"
                    ? m.skills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[#f5f5f5]">
                    <User size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{m.name}</p>
                    <p className="truncate font-mono text-[11px] text-[#525252]">
                      {[title, company, m.department].filter(Boolean).join(" · ") || "Alumni"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(m.reasons || []).slice(0, 3).map((r) => (
                        <span key={r} className="nb-chip">
                          {r}
                        </span>
                      ))}
                      {skills.slice(0, 4).map((s) => (
                        <span key={s} className="nb-chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  {pct != null ? (
                    <span className="font-mono text-sm font-black tabular-nums">{pct}%</span>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/directory/${m.id}`} className="nb-btn-secondary !py-1.5 !px-3">
                      Profile
                    </Link>
                    <button
                      type="button"
                      className="nb-btn !py-1.5 !px-3"
                      onClick={() => void handleMessage(m.id, m.name)}
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageShell>
    </RoleShell>
  );
}
