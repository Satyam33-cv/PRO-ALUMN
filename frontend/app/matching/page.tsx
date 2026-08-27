"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { MatchRing } from "@/components/MatchRing";
import { RoleShell } from "@/components/RoleShell";

export default function MatchingPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<{alumni: any[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (user?.role === "student") {
      loadMatches();
    } else {
      setLoading(false);
    }
  }, [user]);

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
  if (user?.role !== "student") {
    return (
      <RoleShell>
        <div className="container mx-auto py-8">
          <div>Only students can view AI Alumni Matches</div>
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold">AI Alumni Matches</h1>
          {!synced && (
            <button onClick={handleSync} className="mt-4 sm:mt-0 bg-primary text-primary-foreground px-4 py-2 rounded shadow hover:bg-primary/90">
              Refresh My Profile Embedding
            </button>
          )}
        </div>
        {loading ? <div>Loading...</div> : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches?.alumni?.length ? (
              matches.alumni.map((a) => (
                <MatchRing key={a.id} percentage={a.matchScore || 0} />
              ))
            ) : (
              <div>No matches found or please refresh your embedding.</div>
            )}
          </div>
        )}
      </div>
    </RoleShell>
  );
}
