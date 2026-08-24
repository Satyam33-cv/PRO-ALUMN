"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { setSession, signInWithGoogle } = useAuth();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    if (!email.trim() || !password) {
      setServerError("Enter your email and password.");
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
        router.push("/home");
      }
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "We could not sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setServerError("");
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      setServerError("Google sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">PRO ALUMN</span>
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-xs text-slate-500">Sign in to manage your alumni connections & referrals</p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className={`px-2 ${isDark ? "bg-slate-950 text-slate-500" : "bg-slate-50 text-slate-400"}`}>Quick Demo Logins (Bypass OAuth)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setEmail("arjun.sharma@somaiya.edu"); setPassword("Student@12345"); }}
              className="py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setEmail("alumni@google.com"); setPassword("Alumni@12345"); }}
              className="py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Alumni
            </button>
            <button
              type="button"
              onClick={() => { setEmail("admin@college.edu"); setPassword("Admin@12345"); }}
              className="py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Admin
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className={`px-2 ${isDark ? "bg-slate-950 text-slate-500" : "bg-slate-50 text-slate-400"}`}>Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-500 mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pro-alumn.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-500 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {serverError ? <p role="alert" className="text-xs text-red-500">{serverError}</p> : null}
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20">
              {isSubmitting ? "Signing in..." : "Sign In to Dashboard"}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-semibold underline">Sign up</Link>
          </p>
        </div>
      </div>

      {/* Right: Feature Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#ffffff08_1px,transparent_1px),linear-gradient(-45deg,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-white/10 blur-[100px]" />
        <div className="relative z-10 max-w-md space-y-8">
          <blockquote className="text-xl font-medium leading-relaxed">
            &ldquo;PRO ALUMN bridged the gap between our graduating batch and alumni at top tech firms, making warm referrals structured and transparent.&rdquo;
          </blockquote>
          <p className="text-xs text-indigo-200">— University Career &amp; Placement Cell</p>
          <div className="space-y-4">
            {["Instant AI matching with 384-dim vectors", "Verified alumni across 40+ companies", "Skillshare-style courses for career growth"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</div>
                <span className="text-sm text-indigo-100">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}