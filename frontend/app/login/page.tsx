"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  User,
  Sparkles,
  ArrowRight,
  Terminal,
  Lock,
  Mail,
  Cpu
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";

interface RoleConfig {
  id: string;
  code: string;
  num: string;
  title: string;
  subtitle: string;
  email: string;
  token: string;
  roleBadge: string;
  name: string;
  affiliation: string;
  vector: string;
  sim: string;
  sig: string;
}

const ROLES: RoleConfig[] = [
  {
    id: "01",
    code: "ALUMNI",
    num: "[01]",
    title: "ALUMNI SPONSOR",
    subtitle: "Active sponsor node • Endorsement corridor enabled",
    email: "vikram.aditya@google.com",
    token: "Alumni@12345",
    roleBadge: "ALUMNI SPONSOR",
    name: "VIKRAM ADITYA",
    affiliation: "L6 SRE @ GOOGLE // INFRASTRUCTURE • CLASS OF 2019",
    vector: "#9842-HNSW-384D",
    sim: "SIM: 0.942",
    sig: "SIG: 489-VERIFIED",
  },
  {
    id: "02",
    code: "STUDENT",
    num: "[02]",
    title: "STUDENT / CANDIDATE",
    subtitle: "Vector portfolio ingestion & fast-track warm route",
    email: "alex.morgan@somaiya.edu",
    token: "Student@12345",
    roleBadge: "STUDENT FELLOW",
    name: "ALEX MORGAN",
    affiliation: "CANDIDATE // DISTRIBUTED SYSTEMS & AI COHORT '26",
    vector: "#4120-EMBED-FAST",
    sim: "PENDING PARSE",
    sig: "INGEST READY",
  },
  {
    id: "03",
    code: "FACULTY",
    num: "[03]",
    title: "FACULTY / DEPT LEAD",
    subtitle: "Curriculum signing & institutional endorsement hub",
    email: "dr.kulkarni@somaiya.edu",
    token: "Faculty@12345",
    roleBadge: "FACULTY CHAIR",
    name: "DR. RAJESH KULKARNI",
    affiliation: "PROF. CS & SYSTEMS ARCHITECTURE // DEPT CHAIR",
    vector: "#7720-ACAD-AUTH",
    sim: "AUTHORITY NODE",
    sig: "RSA-4096",
  },
  {
    id: "04",
    code: "ADMIN",
    num: "[04]",
    title: "SUPER ADMINISTRATOR",
    subtitle: "Full administrative dispatch, verification & vector metrics",
    email: "proalumn@yahoo.com",
    token: "Admin@12345",
    roleBadge: "ADMIN DISPATCH",
    name: "SUPER ADMIN",
    affiliation: "PRO-ALUMN CONSORTIUM // ROOT DISPATCH NODE",
    vector: "#0001-ROOT-ALL",
    sim: "FULL BYPASS",
    sig: "ROOT-AUTH-OK",
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<RoleConfig>(ROLES[3]); // Default to Super Admin for quick access
  const [email, setEmail] = useState("proalumn@yahoo.com");
  const [password, setPassword] = useState("Admin@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { setSession, signInWithGoogle } = useAuth();

  const handleSelectRole = (role: RoleConfig) => {
    setSelectedRole(role);
    setEmail(role.email);
    setPassword(role.token);
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!email.trim() || !password) {
      setServerError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
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
    <div className="min-h-screen bg-[#fcf9f3] text-[#1c1c18] font-sans flex flex-col justify-between selection:bg-[#FF5500] selection:text-white dark:bg-[#0c0e12] dark:text-[#f3f0ea]">
      {/* Top Editorial Broadsheet Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#F7F4EE]/95 dark:bg-[#0c0e12]/95 backdrop-blur-md border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-800">
        <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2" aria-label="PRO-ALUMN Home">
              <span className="text-[#FF5500] font-mono text-xs font-bold tracking-tighter">/////</span>
              <span className="font-headline text-lg sm:text-xl uppercase tracking-tight text-[#1A1A1A] dark:text-white font-bold">
                PRO-ALUMN
              </span>
              <span className="bg-[#1A1A1A] text-white px-1.5 py-0.5 font-mono text-[10px] ml-1">
                SYS.PUB
              </span>
            </Link>
            <div className="h-4 w-[1.5px] bg-[#D5CEBF] dark:bg-neutral-800 hidden lg:block"></div>
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
        <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-[#fcf9f3] dark:bg-[#0c0e12]">
          {/* LEFT HALF: Credential Form & Role Conduit Selection */}
          <div className="w-full lg:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-between bg-[#F7F4EE] dark:bg-[#12151b] border-r-0 lg:border-r-[1.5px] border-[#1A1A1A] dark:border-neutral-800">
            <div className="flex flex-col gap-6">
              {/* Header Sub-Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-[1.5px] border-[#D5CEBF]/60 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-[#FF5500] font-mono text-xs tracking-wider font-bold">/////</span>
                  <span className="font-headline text-xs uppercase font-bold tracking-tight text-[#1A1A1A] dark:text-white">
                    ID.VERIFY
                  </span>
                  <span className="bg-[#ebe8e2] dark:bg-[#1c1f26] px-2 py-0.5 font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
                    SYS.SPEC.01 // REV.09
                  </span>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-bold text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1c1f26] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-xs hover:bg-[#ebe8e2] dark:hover:bg-[#252932] transition-all"
                >
                  <span>←</span> RETURN TO LANDING
                </Link>
              </div>

              {/* Section Title & Vector Spec */}
              <div>
                <div className="inline-flex items-center gap-2 mb-2 font-mono text-[11px] text-[#a63500] font-bold tracking-widest uppercase">
                  <span>[CORRIDOR CONDUIT]</span>
                  <span className="text-neutral-400">/</span>
                  <span className="text-neutral-500">ENCLAVE SECURE GATE</span>
                </div>
                <h1 className="font-headline text-2xl md:text-3xl leading-tight font-bold tracking-tight text-[#1A1A1A] dark:text-white uppercase mb-2">
                  SELECT ACCESS ROLE &amp; CREDENTIAL PROFILE
                </h1>
                <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  [VECTOR-PROBE] AUTOMATED VERIFICATION CONDUIT // ROUTING TO VERIFIED INTERNAL HIRING CORRIDORS &amp; 384-DIMENSIONAL SEMANTIC MATCHING SPACE.
                </p>
              </div>

              {/* Role Bento Selection Grid */}
              <div className="flex flex-col gap-2.5 my-1" role="radiogroup" aria-label="Credential profiles">
                {ROLES.map((r) => {
                  const isSelected = selectedRole.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRole(r)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleSelectRole(r);
                        }
                      }}
                      className={`cursor-pointer p-3.5 border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 transition-all duration-150 flex items-center justify-between ${
                        isSelected
                          ? "bg-black text-white dark:bg-white dark:text-black shadow-[3px_3px_0px_#1A1A1A] dark:shadow-[3px_3px_0px_#ffffff]"
                          : "bg-white text-[#1A1A1A] dark:bg-[#181a20] dark:text-white hover:bg-[#f0eee8] dark:hover:bg-[#20242c]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-5 h-5 border-[1.5px] flex items-center justify-center ${
                            isSelected
                              ? "border-white bg-white text-black dark:border-black dark:bg-black dark:text-white"
                              : "border-black dark:border-neutral-500 bg-transparent text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] tracking-wider text-[#FF5500] font-bold">
                              {r.num}
                            </span>
                            <span className="font-headline text-sm uppercase font-bold tracking-tight">
                              {r.title}
                            </span>
                          </div>
                          <div className="font-sans text-xs opacity-80 mt-0.5">{r.subtitle}</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span
                          className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 ${
                            isSelected
                              ? "bg-neutral-800 text-[#D9E021] dark:bg-neutral-200 dark:text-black"
                              : "bg-[#f0eee8] dark:bg-[#252932] text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {r.sim}
                        </span>
                        <span className="font-mono text-[10px] opacity-60 mt-1">{r.sig}</span>
                      </div>
                    </div>
                  );
                })}
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
                      placeholder="e.g. proalumn@yahoo.com"
                      className="w-full bg-white dark:bg-[#181a20] text-[#1A1A1A] dark:text-white px-3.5 py-2.5 font-mono text-xs border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 focus:border-[#FF5500] focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-2.5 font-mono text-[10px] px-1.5 py-0.5 bg-[#F7F4EE] dark:bg-[#252932] text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                      ID: CHECK
                    </span>
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
                      className="text-[#FF5500] text-[10px] font-mono uppercase hover:underline"
                    >
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
                      className="w-full bg-white dark:bg-[#181a20] text-[#1A1A1A] dark:text-white px-3.5 py-2.5 font-mono text-xs border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 focus:border-[#FF5500] focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-2.5 flex items-center gap-1 font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
                      <span className="w-2 h-2 rounded-full bg-[#00E676] inline-block animate-pulse"></span>
                      <span>HW-BOUND</span>
                    </span>
                  </div>
                </div>

                {serverError && (
                  <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a] text-[#93000a] font-mono text-xs">
                    {serverError}
                  </div>
                )}

                {/* Primary Action Trigger */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-black text-white dark:bg-white dark:text-black py-3.5 px-6 font-headline text-sm uppercase tracking-wide font-bold border-[1.5px] border-black dark:border-white shadow-[3px_3px_0px_#1A1A1A] dark:shadow-[3px_3px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse"></span>
                  <span>{isSubmitting ? "AUTHENTICATING ENCLAVE..." : "CONTINUE TO MEMBER DISPATCH →"}</span>
                </button>

                {/* Alternative SSO Trigger */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full bg-white dark:bg-[#181a20] hover:bg-[#F7F4EE] text-[#1A1A1A] dark:text-white py-2.5 px-4 font-mono text-xs font-semibold tracking-wider uppercase border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex items-center justify-center gap-2.5 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>AUTHENTICATE VIA INSTITUTIONAL GOOGLE OAUTH</span>
                </button>
              </form>
            </div>

            {/* Left Bottom Legal Bar */}
            <div className="pt-6 mt-6 border-t-[1.5px] border-[#D5CEBF]/40 dark:border-neutral-800 flex flex-wrap items-center justify-between text-neutral-500 font-mono text-[11px]">
              <span>STRICT CONFIDENTIALITY: ZERO ACCESS TELEMETRY EXPORT</span>
              <span>RFC-6749 ENFORCED</span>
            </div>
          </div>

          {/* RIGHT HALF: Live Interactive 3D Holographic ID Card Pod */}
          <div className="w-full lg:w-1/2 bg-[#0c0d0e] text-[#f3f0ea] p-6 md:p-10 lg:p-12 flex flex-col justify-between items-center relative overflow-hidden select-none">
            {/* Tactical Grid Overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#635F57 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            {/* Top Status Readout */}
            <div className="w-full z-10 flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping"></span>
                <span className="text-[#00E676] font-bold">NODE: VERIFIED-CREDENTIAL-POD</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <span>TLS 1.3</span>
                <span>•</span>
                <span>AES-256-GCM</span>
                <span className="hidden sm:inline font-mono text-white/90">ID# 48F2A</span>
              </div>
            </div>

            {/* Central Physical ID Badge Stage */}
            <div className="relative w-full max-w-[380px] my-auto py-8 flex flex-col items-center z-10">
              {/* Lanyard Ribbon */}
              <div className="w-10 h-14 bg-[#161719] border-x border-white/20 relative flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="w-full h-full flex flex-col justify-between py-1 opacity-40">
                  <span className="font-mono text-[6px] tracking-tighter text-center uppercase text-white rotate-90">
                    PRO-ALUMN // PASS
                  </span>
                </div>
                <div className="absolute -bottom-2 w-6 h-4 rounded-full border border-white/40 bg-zinc-800"></div>
              </div>

              {/* The Physical Badge Outer Surface */}
              <div className="w-full bg-[#16181b]/95 backdrop-blur-xl border border-white/20 p-6 shadow-[0px_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300">
                {/* Sheen */}
                <div className="absolute -right-16 -top-16 w-44 h-44 bg-gradient-to-br from-[#D9E021]/15 via-[#FF5500]/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF5500] font-mono text-sm font-bold">▼</span>
                    <span className="font-headline text-sm uppercase tracking-widest font-bold text-white">
                      PRO-ALUMN // PASS
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-[#00E676] font-mono text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
                    <span>LIVE VERIFIED</span>
                  </div>
                </div>

                {/* Passholder Avatar & Identifiers */}
                <div className="flex items-center gap-4 my-5">
                  <div className="relative w-16 h-16 bg-zinc-900 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                    <User className="w-10 h-10 text-white/80" />
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00E676] border border-black"></div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline text-lg font-bold tracking-tight text-white uppercase truncate">
                      {selectedRole.name}
                    </span>
                    <div className="inline-block mt-0.5">
                      <span className="px-2 py-0.5 bg-[#D9E021] text-black font-mono text-[10px] font-bold tracking-wide uppercase inline-block">
                        {selectedRole.roleBadge}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-400 mt-1 line-clamp-1 leading-snug">
                      {selectedRole.affiliation}
                    </p>
                  </div>
                </div>

                {/* Cryptographic Verification Metadata Module */}
                <div className="bg-black/60 p-3 border border-white/10 flex flex-col gap-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="uppercase">VECTOR EMBEDDING:</span>
                    <span className="text-[#D9E021] font-bold font-mono text-xs">{selectedRole.vector}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="uppercase">ROUTING CONDUIT:</span>
                    <span className="text-white font-mono text-xs">INTERNAL-TLS-1.3</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="uppercase">HASH FINGERPRINT:</span>
                    <span className="text-zinc-300 font-mono text-[10px]">0x4F92 • 98BC • A81C</span>
                  </div>
                </div>

                {/* Micro Barcode Strip */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="font-mono text-[8px] text-zinc-500 tracking-widest uppercase">
                    ||| | |||| | ||| |||| || | |||| |||
                  </div>
                  <span className="font-mono text-[9px] text-[#FF5500] font-bold">PRO-ALUMN CERTIFIED</span>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="w-full z-10 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] text-zinc-500 uppercase">
              <span>DUAL-HANDSHAKE AUTHENTICATED</span>
              <span>TOKEN VALIDITY: 30 DAYS</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}