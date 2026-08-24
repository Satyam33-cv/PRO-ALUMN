"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.push("/login?error=auth_failed");
      return;
    }

    // Set token in localStorage and AuthContext
    const fetchSession = async () => {
      try {
        localStorage.setItem("pro-alumn_token", token);
        const res = await apiClient.auth.me();
        const user = (res as unknown as { user?: typeof res })?.user ?? res;
        
        setSession({ user, token });
        if (user?.role?.toLowerCase() === "admin") {
          router.push("/admin");
        } else {
          router.push("/home");
        }
      } catch (err) {
        console.error("Auth callback me() error, attempting token decode fallback:", err);
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const decoded = JSON.parse(jsonPayload);
          const fallbackUser = {
            id: decoded.id,
            email: decoded.email || "",
            role: decoded.role || "student",
            name: decoded.name || decoded.email?.split("@")[0] || "User",
          };
          setSession({ user: fallbackUser, token });
          if (decoded.role?.toLowerCase() === "admin") {
            router.push("/admin");
          } else {
            router.push("/home");
          }
        } catch {
          localStorage.removeItem("pro-alumn_token");
          router.push("/login?error=auth_failed");
        }
      }
    };

    fetchSession();
  }, [router, searchParams, setSession]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
