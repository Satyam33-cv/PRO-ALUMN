"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSession, saveSession, clearSession, getToken } from "@/lib/auth";
import type { AuthSession } from "@/lib/api/types";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleWorkspaceAuthProvider } from "@/lib/firebase";
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
  firebaseUid?: string;
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

    // Restore Google Access Token if available
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("google_access_token");
      if (storedToken) {
        setGoogleAccessToken(storedToken);
      }
    }

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const name = fbUser.displayName || fbUser.email?.split("@")[0] || "User";
          
          // Profiles are managed via our Postgres Backend (apiClient.auth.me),
          // so we bypass Firestore completely here to avoid configuration errors.
          
          setUserState({
            name,
            email: fbUser.email || "",
            role: "student", // Default until backend syncs
            initials: getInitials(name),
            classYear: "2025",
            department: "Computer Science",
            firebaseUid: fbUser.uid,
            photoURL: fbUser.photoURL || undefined,
          });
        } catch (e) {
          console.warn("Auth sync error:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const recordLoginStreak = async () => {
      try {
        await apiClient.gamification.getStatus();
      } catch (e) {
        console.debug('Streak recording failed:', e);
      }
    };
    if (user && !loading) recordLoginStreak();
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
    try {
      const result = await signInWithPopup(auth, googleWorkspaceAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setGoogleAccessToken(token);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("google_access_token", token);
        }
      }
      return token;
    } catch (error) {
      console.error("Failed to connect Google Workspace:", error);
      throw error;
    }
  }, []);

  const setUser = useCallback((next: AuthUser) => {
    setUserState(next);
    const session = getSession();
    if (session) {
      saveSession({ ...session, user: { ...session.user, name: next.name, email: next.email } });
    }
  }, []);

  const setSession = useCallback((nextSession: AuthSession) => {
    saveSession(nextSession);
    setSessionState(nextSession);
    setUserState(userFromSession(nextSession));
  }, []);

  const signOut = useCallback(async () => {
    setUserState(null);
    setSessionState(null);
    setGoogleAccessToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("google_access_token");
    }
    clearSession();
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      signOut();
    }
    function handleWorkspaceTokenExpired() {
      setGoogleAccessToken(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("google_access_token");
      }
    }
    window.addEventListener("auth-expired", handleAuthExpired);
    window.addEventListener("workspace-token-expired", handleWorkspaceTokenExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
      window.removeEventListener("workspace-token-expired", handleWorkspaceTokenExpired);
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
    [user, role, googleAccessToken, accessToken, session, setUser, setSession, signInWithGoogle, connectGoogleWorkspace, signOut, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
