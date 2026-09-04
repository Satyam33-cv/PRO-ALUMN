"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSession, saveSession, clearSession, getToken } from "@/lib/auth";
import type { AuthSession } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";

export type UserRole = "student" | "alumni" | "admin" | "faculty";

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  classYear: string;
  department: string;
  photoURL?: string;
  avatarUrl?: string;
  profileCompleteness?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  role: UserRole;
  googleAccessToken: string | null;
  accessToken: string | null;
  session: AuthSession | null;
  getToken: () => string | null;
  setUser: (user: AuthUser) => void;
  setSession: (session: AuthSession) => void;
  signInWithGoogle: () => Promise<void>;
  connectGoogleWorkspace: () => Promise<string | null>;
  signOut: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function mapRole(apiRole?: string): UserRole {
  switch (apiRole?.toLowerCase()) {
    case "admin":
      return "admin";
    case "faculty":
      return "faculty";
    case "alumni":
      return "alumni";
    default:
      return "student";
  }
}

function userFromSession(session: AuthSession): AuthUser {
  const u = session.user;
  if (!u) throw new Error("Session has no user");
  const role = mapRole(u.role);
  const email = u.email ?? "";
  const name = u.name || (email ? email.split("@")[0].replace(/[._]/g, " ") : "User");
  return {
    id: u.id,
    name,
    email,
    role,
    initials: getInitials(name),
    classYear: u.alumni?.graduationYear?.toString() ?? u.batchYear?.toString() ?? "2025",
    department: u.alumni?.department ?? u.department ?? "Computer Science",
    avatarUrl: u.avatarUrl,
    photoURL: u.avatarUrl,
  };
}

function loadSessionUser(): AuthUser | null {
  const session = getSession();
  if (session) {
    try {
      return userFromSession(session);
    } catch {
      // ignore
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession());
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const initialUser = loadSessionUser();
    setUserState(initialUser);

    // Sync user with backend API if token exists
    const token = getToken();
    if (token) {
      apiClient.auth
        .me()
        .then((user) => {
          if (user && user.id) {
            const currentSession = getSession() || { token, user };
            currentSession.user = user;
            saveSession(currentSession);
            setSessionState(currentSession);
            setUserState(userFromSession(currentSession));
          }
        })
        .catch(() => {
          // Token may be invalid or expired
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const recordLoginStreak = async () => {
      try {
        await apiClient.gamification.getStatus();
      } catch (e) {
        console.debug("Streak recording failed:", e);
      }
    };
    if (user && !loading && user.role !== "admin") recordLoginStreak();
  }, [user, loading]);

  const signInWithGoogle = useCallback(async () => {
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const backendUrl = isLocal
      ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "").replace(/\/api$/, "")
      : "https://pro-alumn-production.up.railway.app";

    if (typeof window !== "undefined") {
      window.location.href = `${backendUrl}/api/auth/google`;
    }
  }, []);

  const connectGoogleWorkspace = useCallback(async () => {
    console.info("Google Workspace SSO connection is managed directly via backend OAuth.");
    return null;
  }, []);

  const setUser = useCallback((next: AuthUser) => {
    setUserState(next);
    const s = getSession();
    if (s) {
      saveSession({ ...s, user: { ...s.user, name: next.name, email: next.email } });
    }
  }, []);

  const setSession = useCallback((nextSession: AuthSession) => {
    saveSession(nextSession);
    setSessionState(nextSession);
    setUserState(userFromSession(nextSession));
  }, []);

  const signOut = useCallback(() => {
    setUserState(null);
    setSessionState(null);
    setGoogleAccessToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("google_access_token");
      sessionStorage.removeItem("google_access_token");
    }
    clearSession();
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      signOut();
    }
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [signOut]);

  const role = user?.role ?? "student";
  const accessToken = googleAccessToken || session?.token || getToken();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      googleAccessToken,
      accessToken,
      session,
      getToken,
      setUser,
      setSession,
      signInWithGoogle,
      connectGoogleWorkspace,
      signOut,
      loading,
    }),
    [user, role, googleAccessToken, accessToken, session, setUser, setSession, signInWithGoogle, connectGoogleWorkspace, signOut, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
