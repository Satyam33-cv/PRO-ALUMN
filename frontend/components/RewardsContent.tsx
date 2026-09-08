"use client";

import { memo } from "react";
import Link from "next/link";
import { Award, Flame, Trophy, Activity } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/context/AuthContext";
import { RoleShell } from "@/components/RoleShell";
import { PageShell } from "@/components/ui/PageShell";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";

type BadgeRow = {
  id: string;
  name: string;
  description?: string;
  requiredPts: number;
  isUnlocked?: boolean;
  progress?: number;
};

type LeaderRow = {
  rank: number;
  id: string;
  name: string;
  role?: string;
  department?: string;
  totalPoints?: number;
  currentStreak?: number;
};

type ActivityRow = {
  id: string;
  actionType: string;
  pointsEarned: number;
  createdAt?: string;
};

function formatAction(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const RewardsContent = memo(function RewardsContent() {
  const { user } = useAuth();
  const key = user?.id ? `rewards:status:${user.id}` : "rewards:status";
  const lbKey = user?.id ? `rewards:lb:${user.id}` : "rewards:lb";

  const { data: status, error: statusErr, reload: reloadStatus } = useApi(key, () =>
    apiClient.gamification.getStatus()
  );
  const { data: lbData, error: lbErr } = useApi(lbKey, () =>
    apiClient.gamification.getLeaderboard("all")
  );

  const totalPoints = status?.totalPoints ?? 0;
  const currentStreak = status?.streak?.current ?? 0;
  const longestStreak = status?.streak?.longest ?? 0;
  const rank = status?.rank ?? null;
  const completeness = status?.completeness ?? 0;
  const badges = (status?.badges || []) as BadgeRow[];
  const activities = (status?.recentActivities || []) as ActivityRow[];
  const leaderboard = ((lbData as { leaderboard?: LeaderRow[] })?.leaderboard || []) as LeaderRow[];

  const loading = !status && !statusErr;

  return (
    <RoleShell>
      <PageShell
        eyebrow="Rewards"
        title="Points & badges"
        description="Earn points by keeping your profile fresh, posting jobs or stories, and mentoring. Badges unlock automatically. Chat and matches are never locked behind points."
      >
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 border-2 border-black" />
            <Skeleton className="h-40 border-2 border-black" />
          </div>
        ) : statusErr ? (
          <ErrorState
            title="Could not load rewards"
            body={String(statusErr)}
            retry={() => reloadStatus?.()}
          />
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Points", value: totalPoints, icon: Trophy },
                { label: "Rank", value: rank != null ? `#${rank}` : "—", icon: Award },
                { label: "Streak", value: `${currentStreak}d`, icon: Flame },
                { label: "Best streak", value: `${longestStreak}d`, icon: Activity },
              ].map((s) => (
                <div key={s.label} className="nb-card p-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase text-[#525252]">
                    <s.icon size={14} />
                    {s.label}
                  </div>
                  <p className="mt-2 font-mono text-2xl font-black tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            {completeness > 0 && completeness < 80 ? (
              <div className="nb-card border-l-4 border-l-[#FF5500] p-4 text-sm">
                Profile {completeness}% complete — reach 80% for a one-time +50 point bonus.{" "}
                <Link href="/profile" className="font-bold underline">
                  Edit profile
                </Link>
              </div>
            ) : null}

            {/* How to earn */}
            <section className="nb-card p-4">
              <h2 className="text-sm font-black uppercase">How to earn</h2>
              <ul className="mt-3 grid gap-2 text-sm text-[#525252] sm:grid-cols-2">
                {[
                  ["Update profile", "+20"],
                  ["Upload resume / photo / certificate", "+25–40"],
                  ["Post a job or story", "+40–50"],
                  ["Request or complete mentorship", "+15–40"],
                  ["Daily login streak", "+5 (+bonus day 7)"],
                  ["Profile 80% complete (once)", "+50"],
                ].map(([a, p]) => (
                  <li key={a} className="flex justify-between border-b border-neutral-200 py-1.5">
                    <span>{a}</span>
                    <span className="font-mono font-bold text-black">{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Badges */}
            <section>
              <h2 className="mb-3 text-sm font-black uppercase">Badges</h2>
              {badges.length === 0 ? (
                <EmptyState title="No badges yet" body="Earn points to unlock the first badge." />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((b) => (
                    <li
                      key={b.id}
                      className={`nb-card p-4 ${b.isUnlocked ? "" : "opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold">{b.name}</p>
                        <span className={b.isUnlocked ? "nb-chip-accent" : "nb-chip"}>
                          {b.isUnlocked ? "Unlocked" : `${b.requiredPts} pts`}
                        </span>
                      </div>
                      {b.description ? (
                        <p className="mt-1 text-xs text-[#525252]">{b.description}</p>
                      ) : null}
                      {!b.isUnlocked ? (
                        <div className="mt-3 h-2 border border-black bg-[#f5f5f5]">
                          <div
                            className="h-full bg-[#FF5500]"
                            style={{ width: `${Math.min(100, b.progress || 0)}%` }}
                          />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent activity */}
            <section>
              <h2 className="mb-3 text-sm font-black uppercase">Recent activity</h2>
              {activities.length === 0 ? (
                <p className="text-sm text-[#525252]">No points earned yet — update your profile to start.</p>
              ) : (
                <ul className="nb-card divide-y-2 divide-black">
                  {activities.map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span>{formatAction(a.actionType)}</span>
                      <span className="font-mono font-bold">+{a.pointsEarned}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Leaderboard */}
            <section>
              <h2 className="mb-3 text-sm font-black uppercase">Leaderboard</h2>
              {lbErr ? (
                <p className="text-sm text-[#525252]">Could not load leaderboard.</p>
              ) : leaderboard.length === 0 ? (
                <EmptyState title="Board is empty" body="Points from real activity will appear here." />
              ) : (
                <ul className="nb-card divide-y-2 divide-black">
                  {leaderboard.slice(0, 15).map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="w-8 font-mono text-sm font-black">#{row.rank}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{row.name}</p>
                        <p className="truncate font-mono text-[11px] text-[#525252]">
                          {[row.role, row.department].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold tabular-nums">
                        {row.totalPoints ?? 0} pts
                      </span>
                      {row.currentStreak ? (
                        <span className="nb-chip">{row.currentStreak}d</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </PageShell>
    </RoleShell>
  );
});
