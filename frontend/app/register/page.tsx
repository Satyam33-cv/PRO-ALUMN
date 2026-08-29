"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Building, Sparkles } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";

type Role = "student" | "alumni";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(values: FormValues, role: Role): FormErrors {
  const errors: FormErrors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!values.lastName.trim()) errors.lastName = "Enter your last name.";
  const email = values.email.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (role === "alumni" && !values.company.trim()) errors.company = "Enter your company.";
  if (values.password.length < 6) errors.password = "Use at least 6 characters.";
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords must match.";
  return errors;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [values, setValues] = useState<FormValues>({ firstName: "", lastName: "", email: "", company: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { setSession, signInWithGoogle } = useAuth();

  function setField(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values, role);
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const session = await apiClient.auth.register({
        name: `${values.firstName.trim()} ${values.lastName.trim()}`,
        email: values.email.trim(),
        password: values.password,
        role: role === "alumni" ? "ALUMNI" : "STUDENT",
        currentCompany: role === "alumni" ? values.company.trim() : undefined,
      });
      setSession(session);
      router.push("/complete-profile");
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "We could not create your account. Please try again.");
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

  const inputClass = `w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`;

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">PRO ALUMN</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-xs text-slate-500">Join 1,200+ alumni and students building careers together</p>
          </div>

          {/* Role Toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
            {(["student", "alumni"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  role === r ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {r === "student" ? "I'm a Student" : "I'm an Alumni"}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="register-first-name" className="text-xs font-semibold text-slate-500 mb-1 block">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="register-first-name" autoComplete="given-name" placeholder="John" value={values.firstName} onChange={(e) => setField("firstName", e.target.value)} className={inputClass} />
                </div>
                {errors.firstName ? <p className="text-xs text-red-500 mt-1">{errors.firstName}</p> : null}
              </div>
              <div>
                <label htmlFor="register-last-name" className="text-xs font-semibold text-slate-500 mb-1 block">Last Name</label>
                <input id="register-last-name" autoComplete="family-name" placeholder="Smith" value={values.lastName} onChange={(e) => setField("lastName", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                {errors.lastName ? <p className="text-xs text-red-500 mt-1">{errors.lastName}</p> : null}
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="text-xs font-semibold text-slate-500 mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="register-email" type="email" autoComplete="email" placeholder="you@university.edu" value={values.email} onChange={(e) => setField("email", e.target.value)} className={inputClass} />
              </div>
              {errors.email ? <p className="text-xs text-red-500 mt-1">{errors.email}</p> : null}
            </div>

            {role === "alumni" && (
              <div>
                <label htmlFor="register-company" className="text-xs font-semibold text-slate-500 mb-1 block">Company</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="register-company" autoComplete="organization" placeholder="Google" value={values.company} onChange={(e) => setField("company", e.target.value)} className={inputClass} />
                </div>
                {errors.company ? <p className="text-xs text-red-500 mt-1">{errors.company}</p> : null}
              </div>
            )}

            <div>
              <label htmlFor="register-password" className="text-xs font-semibold text-slate-500 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={values.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-xs text-red-500 mt-1">{errors.password}</p> : null}
            </div>

            <div>
              <label htmlFor="register-confirm" className="text-xs font-semibold text-slate-500 mb-1 block">Confirm Password</label>
              <input
                id="register-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={values.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
              {errors.confirmPassword ? <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p> : null}
            </div>

            {serverError ? <p role="alert" className="text-xs text-red-500">{serverError}</p> : null}

            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20">
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-semibold underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right: Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#ffffff08_1px,transparent_1px),linear-gradient(-45deg,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-white/10 blur-[100px]" />
        <div className="relative z-10 max-w-md space-y-8">
          <div className="text-4xl font-extrabold leading-tight">Your network is your net worth.</div>
          <p className="text-indigo-100">Connect with verified alumni from 40+ companies, get personalized referrals, and access exclusive Skillshare-style courses.</p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { n: "1,200+", l: "Alumni" },
              { n: "85%", l: "Referral Rate" },
              { n: "384-Dim", l: "AI Matching" },
              { n: "450+", l: "Courses" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-extrabold">{s.n}</p>
                <p className="text-xs text-indigo-200">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}