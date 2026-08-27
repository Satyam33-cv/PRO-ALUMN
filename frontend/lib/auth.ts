import type { AuthSession } from "@/lib/api/types";

const STORAGE_KEY = "pro-alumn_session";
const OLD_SESSION_KEY = "alumni_connect_session";
const OLD_TOKEN_KEY = "alumni_connect_token";
const OLD_USER_KEY = "pro-alumn_auth_user";

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  if (session.token) {
    localStorage.setItem("pro-alumn_token", session.token);
    // Set cookie for Next.js middleware and Server Actions
    document.cookie = `pro-alumn_token=${session.token}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `token=${session.token}; path=/; max-age=604800; SameSite=Lax`;
  }
  localStorage.removeItem(OLD_SESSION_KEY);
  localStorage.removeItem(OLD_TOKEN_KEY);
  localStorage.removeItem(OLD_USER_KEY);
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return getSession()?.token ?? localStorage.getItem("pro-alumn_token") ?? null;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("pro-alumn_token");
  localStorage.removeItem(OLD_SESSION_KEY);
  localStorage.removeItem(OLD_TOKEN_KEY);
  localStorage.removeItem(OLD_USER_KEY);
  document.cookie = "pro-alumn_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "alumni_connect_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
