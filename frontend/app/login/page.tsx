"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { setSession, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!email.trim() || !password) {
      setServerError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Role comes back from the server on the authenticated session — it is
      // never chosen by the user. Do not add a role selector to this form.
      const session = await apiClient.auth.login({ email: email.trim(), password });
      setSession(session);
      const role = session.user?.role?.toLowerCase();
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : "Authentication failed. Check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError("");
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setServerError("Google sign in failed. Please try standard credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1c1c18] font-sans flex flex-col justify-between selection:bg-[#FF5500] selection:text-white dark:bg-[#0c0e12] dark:text-[#f3f0ea]">
      {/* Top Editorial Broadsheet Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#FFFFFF]/95 dark:bg-[#0c0e12]/95 backdrop-blur-md border-b-[1.5px] border-[#0A0A0A] dark:border-neutral-800">
        <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2" aria-label="PRO-ALUMN Home">
              <span className="text-[#FF5500] font-mono text-xs font-bold tracking-tighter">/////</span>
              <span className="font-headline text-lg sm:text-xl uppercase tracking-tight text-[#0A0A0A] dark:text-white font-bold">
                PRO-ALUMN
              </span>
              <span className="bg-[#0A0A0A] text-white px-1.5 py-0.5 font-mono text-[10px] ml-1">
                SYS.PUB
              </span>
            </Link>
            <div className="h-4 w-[1.5px] bg-[#D4D4D4] dark:bg-neutral-800 hidden lg:block"></div>
            <span className="font-mono text-xs text-neutral-500 hidden lg:inline-block tracking-wide">
              SYS.SPEC.01 // PCM 48KHZ // HNSW-384D
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-[#FF5500] transition-colors flex items-center gap-1 tracking-wider"
            >
              ← Back to Landing Page
            </Link>
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-mono text-xs font-bold">
              ID
            </div>
          </div>
        </div>
      </header>

      {/* 50/50 Desktop Broadsheet Split-Screen Interface */}
      <main className="w-full pt-16 flex-1 flex flex-col">
        <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-[#FFFFFF] dark:bg-[#0c0e12]">
          {/* LEFT HALF: Credential Form */}
          <div className="w-full lg:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-between bg-[#FFFFFF] dark:bg-[#12151b] border-r-0 lg:border-r-[1.5px] border-[#0A0A0A] dark:border-neutral-800">
            <div className="flex flex-col gap-6">
              {/* Header Sub-Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-[1.5px] border-[#D4D4D4]/60 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-[#FF5500] font-mono text-xs tracking-wider font-bold">/////</span>
                  <span className="font-headline text-xs uppercase font-bold tracking-tight text-[#0A0A0A] dark:text-white">
                    ID.VERIFY
                  </span>
                  <span className="bg-[#ebe8e2] dark:bg-[#1c1f26] px-2 py-0.5 font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
                    SYS.SPEC.01 // REV.10
                  </span>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-bold text-[#0A0A0A] dark:text-white bg-white dark:bg-[#1c1f26] border-[1.5px] border-[#0A0A0A] dark:border-neutral-700 shadow-xs hover:bg-[#ebe8e2] dark:hover:bg-[#252932] transition-all"
                >
                  <span>←</span> RETURN TO LANDING
                </Link>
              </div>

              {/* Section Title */}
              <div>
                <div className="inline-flex items-center gap-2 mb-2 font-mono text-[11px] text-[#a63500] font-bold tracking-widest uppercase">
                  <span>[CORRIDOR CONDUIT]</span>
                  <span className="text-neutral-400">/</span>
                  <span className="text-neutral-500">ENCLAVE SECURE GATE</span>
                </div>
                <h1 className="font-headline text-2xl md:text-3xl leading-tight font-bold tracking-tight text-[#0A0A0A] dark:text-white uppercase mb-2">
                  ENTER CREDENTIALS
                </h1>
                <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  [VECTOR-PROBE] AUTOMATED VERIFICATION CONDUIT // YOUR ACCESS LEVEL IS ASSIGNED BY THE SERVER ON SUCCESSFUL AUTHENTICATION — IT IS NOT SELECTED HERE.
                </p>
              </div>

              {/* Credentials Input Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 pt-2" noValidate>
                {/* Input 1: Institutional Email */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-identifier"
                    className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex justify-between"
                  >
                    <span>01 // INSTITUTIONAL EMAIL / SOMAIYA / CORP ID</span>
                    <span className="font-mono text-[10px] text-neutral-400">AUTH REQUIRED</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-identifier"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full bg-white dark:bg-[#181a20] text-[#0A0A0A] dark:text-white px-3.5 py-2.5 font-mono text-xs border-[1.5px] border-[#0A0A0A] dark:border-neutral-700 focus:border-[#FF5500] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Input 2: Password */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-token"
                    className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex justify-between"
                  >
                    <span>02 // PASSKEY / CRYPTOGRAPHIC TOKEN</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#FF5500] text-[10px] font-mono uppercase hover:underline inline-flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                      {showPassword ? "HIDE TOKEN" : "SHOW TOKEN"}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      id="input-token"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white dark:bg-[#181a20] text-[#0A0A0A] dark:text-white px-3.5 py-2.5 font-mono text-xs border-[1.5px] border-[#0A0A0A] dark:border-neutral-700 focus:border-[#FF5500] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {serverError && (
                  <div role="alert" className="p-3 bg-[#ffdad6] border border-[#ba1a1a] text-[#93000a] font-mono text-xs">
                    {serverError}
                  </div>
                )}

                {/* Primary Action Trigger */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-black text-white dark:bg-white dark:text-black py-3.5 px-6 font-headline text-sm uppercase tracking-wide font-bold border-[1.5px] border-black dark:border-white shadow-[3px_3px_0px_#0A0A0A] dark:shadow-[3px_3px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                >
                  <span className={`w-2.5 h-2.5 rounded-full bg-[#FF5500] ${isSubmitting ? "animate-ping" : "animate-pulse"}`}></span>
                  <span>{isSubmitting ? "AUTHENTICATING ENCLAVE..." : "CONTINUE TO MEMBER DISPATCH →"}</span>
                </button>

                {/* Alternative SSO Trigger */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full bg-white dark:bg-[#181a20] hover:bg-[#FFFFFF] text-[#0A0A0A] dark:text-white py-2.5 px-4 font-mono text-xs font-semibold tracking-wider uppercase border-[1.5px] border-[#0A0A0A] dark:border-neutral-700 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>AUTHENTICATE VIA INSTITUTIONAL GOOGLE OAUTH</span>
                </button>

                <p className="text-center font-mono text-[11px] text-neutral-500">
                  New here?{" "}
                  <Link href="/register" className="text-[#FF5500] font-bold hover:underline">
                    REGISTER A CREDENTIAL PROFILE
                  </Link>
                </p>
              </form>
            </div>

            {/* Left Bottom Legal Bar */}
            <div className="pt-6 mt-6 border-t-[1.5px] border-[#D4D4D4]/40 dark:border-neutral-800 flex flex-wrap items-center justify-between text-neutral-500 font-mono text-[11px] gap-2">
              <span>ZERO ACCESS TELEMETRY EXPORT</span>
              <div className="flex gap-3">
                <Link href="/privacy" className="hover:underline hover:text-[#FF5500]">Privacy Policy</Link>
                <Link href="/terms" className="hover:underline hover:text-[#FF5500]">Terms of Service</Link>
              </div>
            </div>
          </div>

          {/* RIGHT HALF: Status pod — generic idle/verifying state only.
              It never displays role, name, or any account details before a
              real session exists, so there is nothing here to fake. */}
          <div className="w-full lg:w-1/2 bg-[#0c0d0e] text-[#f3f0ea] p-6 md:p-10 lg:p-12 flex flex-col justify-between items-center relative overflow-hidden select-none">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(#635F57 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            ></div>

            {/* Top Status Readout */}
            <div className="w-full z-10 flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSubmitting ? "bg-[#FF5500] animate-ping" : "bg-[#FF5500] animate-pulse"}`}></span>
                <span className={isSubmitting ? "text-[#FF5500] font-bold" : "text-[#FF5500] font-bold"}>
                  {isSubmitting ? "NODE: VERIFYING CREDENTIALS" : "NODE: AWAITING CREDENTIALS"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <span>TLS 1.3</span>
                <span>•</span>
                <span>AES-256-GCM</span>
              </div>
            </div>

            {/* Idle badge stage — no identity, no role, no fake data */}
            <div className="relative w-full max-w-[380px] my-auto py-8 flex flex-col items-center z-10">
              <div className="w-full bg-[#16181b]/95 backdrop-blur-xl border border-white/20 p-6 shadow-[0px_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300">
                <div className="absolute -right-16 -top-16 w-44 h-44 bg-gradient-to-br from-[#FF5500]/15 via-[#FF5500]/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF5500] font-mono text-sm font-bold">▼</span>
                    <span className="font-headline text-sm uppercase tracking-widest font-bold text-white">
                      PRO-ALUMN // PASS
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800/80 border border-zinc-600/40 text-zinc-400 font-mono text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                    <span>NOT VERIFIED</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 my-5">
                  <div className="relative w-16 h-16 bg-zinc-900 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                    <User className="w-10 h-10 text-white/30" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline text-lg font-bold tracking-tight text-white/40 uppercase truncate">
                      UNIDENTIFIED
                    </span>
                    <p className="font-mono text-[11px] text-zinc-500 mt-1 leading-snug">
                      Sign in to reveal a verified credential pass.
                    </p>
                  </div>
                </div>

                <div className="bg-black/60 p-3 border border-white/10 flex flex-col gap-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="uppercase">STATUS:</span>
                    <span className="text-zinc-400 font-mono text-xs">
                      {isSubmitting ? "CHECKING…" : "IDLE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full z-10 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] text-zinc-500 uppercase">
              <span>NO SESSION ACTIVE</span>
              <span>TOKEN VALIDITY: 30 DAYS</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}