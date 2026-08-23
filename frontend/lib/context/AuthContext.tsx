"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSession, saveSession, clearSession } from "@/lib/auth";
import type { AuthSession } from "@/lib/api/types";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleAuthProvider } from "@/lib/firebase";

export type UserRole = "student" | "alumni" | "admin" | "faculty";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  classYear: string;
  department: string;
  firebaseUid?: string;
  photoURL?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  role: UserRole;
  googleAccessToken: string | null;
  setUser: (user: AuthUser) => void;
  setSession: (session: AuthSession) => void;
  switchRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
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
    name,
    email,
    role,
    initials: getInitials(name),
    classYear: u.alumni?.graduationYear?.toString() ?? u.batchYear?.toString() ?? "2025",
    department: u.alumni?.department ?? u.department ?? "Computer Science",
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
  return {
    name: "Alex Kim",
    email: "alex.kim@alumni.edu",
    role: "student",
    initials: "AK",
    classYear: "2025",
    department: "Computer Science",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
          const userDocRef = doc(db, "users", fbUser.uid);
          const snap = await getDoc(userDocRef);
          let assignedRole: UserRole = "student";
          let dept = "Computer Science";
          let yr = "2025";

          if (snap.exists()) {
            const d = snap.data();
            if (d.role) assignedRole = d.role as UserRole;
            if (d.department) dept = d.department;
            if (d.classYear) yr = d.classYear;
          } else {
            // Write initial profile to Firestore
            await setDoc(
              userDocRef,
              {
                id: fbUser.uid,
                email: fbUser.email || "",
                name: fbUser.displayName || "Alumni Member",
                role: "student",
                department: dept,
                classYear: yr,
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }

          const name = fbUser.displayName || fbUser.email?.split("@")[0] || "User";
          setUserState({
            name,
            email: fbUser.email || "",
            role: assignedRole,
            initials: getInitials(name),
            classYear: yr,
            department: dept,
            firebaseUid: fbUser.uid,
            photoURL: fbUser.photoURL || undefined,
          });
        } catch (e) {
          console.warn("Firestore profile fetch error:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Redirect to the Express backend Google OAuth endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    window.location.href = `${backendUrl}/api/auth/google`;
  }, []);

  const setUser = useCallback((next: AuthUser) => {
    setUserState(next);
    const session = getSession();
    if (session) {
      saveSession({ ...session, user: { ...session.user, name: next.name, email: next.email } });
    }
  }, []);

  const setSession = useCallback((session: AuthSession) => {
    saveSession(session);
    setUserState(userFromSession(session));
  }, []);

  const switchRole = useCallback((next: UserRole) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const nextUser: AuthUser = { ...prev, role: next };
      const session = getSession();
      if (session) {
        saveSession({
          ...session,
          user: { ...session.user, role: next.toUpperCase() as AuthSession["user"]["role"] },
        });
      }
      if (prev.firebaseUid) {
        setDoc(doc(db, "users", prev.firebaseUid), { role: next }, { merge: true }).catch(() => {});
      }
      return nextUser;
    });
  }, []);

  const signOut = useCallback(async () => {
    setUserState(null);
    setGoogleAccessToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("google_access_token");
    }
    setGoogleAccessToken(null);
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
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, [signOut]);

  const role = user?.role ?? "student";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      googleAccessToken,
      setUser,
      setSession,
      switchRole,
      signInWithGoogle,
      signOut,
      loading,
    }),
    [user, role, googleAccessToken, setUser, setSession, switchRole, signInWithGoogle, signOut, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
