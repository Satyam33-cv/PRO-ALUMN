"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import type { RegisterInput } from "@/lib/api/types";

type NodeRole = "alumni" | "candidate" | "faculty";

const ROLE_OPTIONS: {
  id: NodeRole;
  num: string;
  title: string;
  subtitle: string;
  score: string;
  color: string;
}[] = [
  { id: "alumni", num: "[01]", title: "ALUMNI SPONSOR", subtitle: "Active sponsor node • Endorsement corridor enabled", score: "SPONSOR CORRIDOR", color: "#00FF66" },
  { id: "candidate", num: "[02]", title: "STUDENT / RESEARCH CANDIDATE", subtitle: "Vector portfolio ingestion & fast-track warm route", score: "FAST-TRACK ROUTE", color: "#00E5FF" },
  { id: "faculty", num: "[03]", title: "FACULTY / DEPT LEAD", subtitle: "Curriculum signing & institutional endorsement hub", score: "AUTHORITY NODE", color: "#FFB800" },
];

const BACKEND_ROLE: Record<NodeRole, "ALUMNI" | "STUDENT" | "FACULTY"> = {
  alumni: "ALUMNI",
  candidate: "STUDENT",
  faculty: "FACULTY",
};

const COHORTS = ["Class of 2026", "Class of 2025", "Class of 2024", "Class of 2023", "Class of 2022"];

type FormValues = {
  fullName: string;
  email: string;
  role: NodeRole;
  cohort: string;
  discipline: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  else if (!/\d/.test(values.password)) errors.password = "Include at least one number.";
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords must match.";
  return errors;
}

function entropyLabel(password: string): { pct: number; label: string; color: string } {
  const pct = Math.min(Math.round((password.length / 16) * 100), 100);
  if (pct < 30) return { pct: Math.max(pct, password.length ? 12 : 0), label: "WEAK", color: "#B91C1C" };
  if (pct < 75) return { pct, label: "MODERATE", color: "#B45309" };
  return { pct, label: "HIGH", color: "#171717" };
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormValues>({
    fullName: "",
    email: "",
    role: "alumni",
    cohort: COHORTS[0],
    discipline: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { setSession, signInWithGoogle } = useAuth();

  const entropy = useMemo(() => entropyLabel(values.password), [values.password]);
  const selectedRole = ROLE_OPTIONS.find((r) => r.id === values.role) ?? ROLE_OPTIONS[0];

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length > 0) {
      // Jump back to whichever step actually has the problem instead of
      // silently failing on a hidden panel.
      if (nextErrors.fullName || nextErrors.email) setStep(1);
      else setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const cohortYear = parseInt(values.cohort.replace(/\D/g, ""), 10);

      // batchYear/department are already accepted by POST /auth/register on
      // the backend but aren't in the RegisterInput type yet — extending
      // inline here. Worth adding them to RegisterInput properly so this
      // cast can go away.
      const payload: RegisterInput & { batchYear?: number; department?: string } = {
        name: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        role: BACKEND_ROLE[values.role],
        currentCompany: undefined,
        batchYear: Number.isFinite(cohortYear) ? cohortYear : undefined,
        department: values.discipline.trim() || undefined,
      };

      const session = await apiClient.auth.register(payload);
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
    } catch {
      setServerError("Google sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-black font-sans antialiased">
      <main className="w-full min-h-screen lg:h-screen flex flex-col lg:flex-row bg-[#080808]">
        {/* LEFT: Registration Broadsheet */}
        <section className="w-full lg:w-1/2 min-h-screen lg:h-full bg-white flex flex-col justify-between overflow-y-auto p-6 sm:p-10 lg:p-14 border-r border-black">
          <div>
            <header className="border-b border-black pb-4 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tracking-wider text-black font-semibold uppercase">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-black inline-block"></span>
                  <span>///// PRO-ALUMN // REGISTRATION CONDUIT</span>
                </div>
                <Link href="/login" className="text-neutral-600 hover:text-black underline">
                  ALREADY REGISTERED? LOG IN →
                </Link>
              </div>
            </header>

            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl leading-[1.05] font-black uppercase tracking-tight text-black mb-3">
                CREATE CREDENTIAL &amp; ENCLAVE IDENTITY
              </h1>
              <p className="font-mono text-xs text-neutral-600 leading-relaxed uppercase max-w-xl">
                YOUR ROLE AND STATUS ARE VERIFIED SERVER-SIDE AFTER SUBMISSION — SPONSOR AND FACULTY ACCOUNTS GO THROUGH REVIEW BEFORE FULL ACCESS.
              </p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
              <div className="grid grid-cols-2 border-2 border-black font-mono text-xs font-bold divide-x-2 divide-black bg-neutral-100">
                {(["01 / IDENTITY", "02 / CREDENTIALS"] as const).map((label, idx) => {
                  const stepNum = idx + 1;
                  const active = step === stepNum;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setStep(stepNum)}
                      className={`py-2.5 px-2 text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                        active ? "bg-black text-white" : "text-neutral-600 bg-white hover:bg-neutral-100"
                      }`}
                    >
                      <span className={`w-2 h-2 inline-block ${active ? "bg-[#00FF66]" : "bg-neutral-400"}`}></span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="w-full bg-neutral-200 h-1.5 border-x-2 border-b-2 border-black overflow-hidden">
                <div className="h-full bg-black transition-all duration-300 ease-out" style={{ width: step === 1 ? "50%" : "100%" }} />
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-mono text-[11px] font-bold tracking-tight uppercase">
                      <label htmlFor="fullName">[01] FULL LEGAL / ACADEMIC NAME</label>
                      <span className="text-neutral-500">REQUIRED</span>
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      value={values.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-transparent border-2 border-black p-3 font-mono text-sm font-semibold focus:ring-0 focus:outline-none focus:bg-neutral-50"
                    />
                    {errors.fullName && <p className="text-[11px] font-mono text-red-700">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-mono text-[11px] font-bold tracking-tight uppercase">
                      <label htmlFor="instEmail">[02] INSTITUTIONAL OR CORPORATE EMAIL</label>
                    </div>
                    <input
                      id="instEmail"
                      type="email"
                      value={values.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full bg-transparent border-2 border-black p-3 font-mono text-sm font-semibold focus:ring-0 focus:outline-none focus:bg-neutral-50"
                    />
                    {errors.email && <p className="text-[11px] font-mono text-red-700">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center font-mono text-[11px] font-bold uppercase tracking-tight">
                      <span>[03] CLASSIFICATION NODE &amp; ROLE</span>
                    </div>
                    <div className="space-y-2 font-mono" role="radiogroup" aria-label="Role">
                      {ROLE_OPTIONS.map((r) => {
                        const active = values.role === r.id;
                        return (
                          <label
                            key={r.id}
                            className={`relative flex items-center justify-between p-3.5 border-2 border-black cursor-pointer transition-all duration-150 ${
                              active ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-50"
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-[11px] text-neutral-400 font-bold">{r.num}</span>
                              <div>
                                <div className="text-xs font-black uppercase tracking-wider">{r.title}</div>
                                <div className={`text-[10px] font-normal ${active ? "text-neutral-300" : "text-neutral-500"}`}>{r.subtitle}</div>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="node_role"
                              value={r.id}
                              checked={active}
                              onChange={() => setField("role", r.id)}
                              className="w-4 h-4 rounded-none focus:ring-0 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                    {(values.role === "alumni" || values.role === "faculty") && (
                      <p className="font-mono text-[10px] text-neutral-500 pt-1">
                        SPONSOR AND FACULTY ACCOUNTS ARE REVIEWED BEFORE FULL ACCESS IS GRANTED.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full border-2 border-black px-4 py-3 text-xs font-mono font-bold uppercase bg-black text-white hover:bg-neutral-800"
                  >
                    NEXT STEP →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-mono text-[11px] font-bold uppercase tracking-tight">
                      <span>[04] GRADUATION BATCH &amp; SPECIALIZATION</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={values.cohort}
                        onChange={(e) => setField("cohort", e.target.value)}
                        className="border-2 border-black bg-transparent p-3 font-mono text-xs font-bold focus:ring-0 uppercase cursor-pointer"
                      >
                        {COHORTS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        value={values.discipline}
                        onChange={(e) => setField("discipline", e.target.value)}
                        placeholder="Discipline / Specialization"
                        className="sm:col-span-2 border-2 border-black bg-transparent p-3 font-mono text-xs font-semibold focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center font-mono text-[11px] font-bold uppercase tracking-tight">
                      <label htmlFor="passphrase">[05] PASSWORD</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-neutral-600 hover:text-black inline-flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                        {showPassword ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                    <input
                      id="passphrase"
                      type={showPassword ? "text" : "password"}
                      value={values.password}
                      onChange={(e) => setField("password", e.target.value)}
                      placeholder="At least 8 characters, one number"
                      className="w-full bg-transparent border-2 border-black p-3 font-mono text-sm tracking-widest focus:ring-0 focus:outline-none"
                    />
                    {values.password && (
                      <div className="flex items-center justify-between pt-1">
                        <div className="w-2/3 h-1.5 bg-neutral-200 overflow-hidden border border-neutral-300">
                          <div className="h-full transition-all duration-200" style={{ width: `${entropy.pct}%`, backgroundColor: entropy.color }} />
                        </div>
                        <span className="font-mono text-[10px] font-extrabold uppercase" style={{ color: entropy.color }}>
                          STRENGTH: {entropy.pct}% [{entropy.label}]
                        </span>
                      </div>
                    )}
                    {errors.password && <p className="text-[11px] font-mono text-red-700">{errors.password}</p>}

                    <input
                      type={showPassword ? "text" : "password"}
                      value={values.confirmPassword}
                      onChange={(e) => setField("confirmPassword", e.target.value)}
                      placeholder="Confirm password"
                      className="w-full mt-2 bg-transparent border-2 border-black p-3 font-mono text-sm tracking-widest focus:ring-0 focus:outline-none"
                    />
                    {errors.confirmPassword && <p className="text-[11px] font-mono text-red-700">{errors.confirmPassword}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-mono text-[11px] font-bold uppercase tracking-tight">
                      <label htmlFor="referralCode">[06] SPONSOR / FELLOW REFERRAL CODE (OPTIONAL)</label>
                    </div>
                    <input
                      id="referralCode"
                      value={values.referralCode}
                      onChange={(e) => setField("referralCode", e.target.value.toUpperCase())}
                      placeholder="e.g. PRO-8F2A91"
                      className="w-full bg-transparent border-2 border-black p-3 font-mono text-xs font-semibold uppercase tracking-wider focus:ring-0"
                    />
                    <p className="font-mono text-[10px] text-neutral-500">
                      NOT YET LINKED TO AN ACCOUNT — WIRING THIS UP IS A BACKEND FOLLOW-UP.
                    </p>
                  </div>

                  {serverError && (
                    <div role="alert" className="p-3 bg-[#ffdad6] border border-[#ba1a1a] text-[#93000a] font-mono text-xs">
                      {serverError}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="border-2 border-black px-4 py-2 text-xs font-mono font-bold uppercase bg-neutral-100 hover:bg-neutral-200"
                    >
                      ← PREVIOUS STEP
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-black text-white hover:bg-neutral-900 py-3 px-6 flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider border-2 border-black disabled:opacity-60"
                    >
                      <span className={`w-2.5 h-2.5 bg-[#00FF66] inline-block ${isSubmitting ? "animate-ping" : "animate-pulse"}`}></span>
                      <span>{isSubmitting ? "SUBMITTING…" : "CREATE ACCOUNT →"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="w-full bg-white hover:bg-neutral-50 text-black py-2.5 px-4 font-mono text-xs font-semibold tracking-wider uppercase border-2 border-black flex items-center justify-center gap-2.5 disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>SIGN UP VIA GOOGLE</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          <footer className="pt-8 mt-6 border-t border-black/20 font-mono text-[10px] text-neutral-600 uppercase">
            <span>YOUR PASSWORD IS HASHED — WE NEVER STORE IT IN PLAIN TEXT.</span>
          </footer>
        </section>

        {/* RIGHT: Live preview — real values only, no fabricated crypto */}
        <section className="w-full lg:w-1/2 min-h-screen lg:h-full bg-[#050505] flex flex-col justify-between items-center relative overflow-hidden p-6 sm:p-10">
          <header className="w-full flex items-center justify-between font-mono text-[11px] tracking-wider uppercase text-neutral-400 border-b border-neutral-900 pb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#00FF66] animate-pulse"></span>
              <span className="text-white font-bold">NODE: IDENTITY-REGISTRATION</span>
            </div>
          </header>

          <div className="relative w-full flex-1 flex flex-col items-center justify-center my-4">
            <article className="relative w-full max-w-[420px] rounded-lg border border-neutral-700/80 bg-[#101010]/95 p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
                <span className="font-mono text-xs font-black tracking-widest uppercase text-neutral-200">
                  PRO-ALUMN // PREVIEW
                </span>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-800/60 border border-neutral-700 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
                  <span className="font-mono text-[9px] font-black tracking-widest uppercase text-neutral-400">
                    UNVERIFIED DRAFT
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center mb-5">
                <div className="col-span-4 bg-black border border-neutral-700 p-2 flex items-center justify-center aspect-[3/4] rounded-sm">
                  <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <User className="w-10 h-10 text-neutral-500" />
                  </div>
                </div>
                <div className="col-span-8 space-y-1.5 pl-1">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
                    [PASSHOLDER]
                  </div>
                  <div className="text-xl font-black tracking-tight text-white uppercase break-words">
                    {values.fullName.trim() || "YOUR NAME"}
                  </div>
                  <span className="inline-block font-mono text-[10px] font-extrabold uppercase tracking-wider" style={{ color: selectedRole.color }}>
                    {selectedRole.title}
                  </span>
                  <div className="font-mono text-[10px] text-neutral-400 leading-tight pt-1 border-t border-neutral-800/80">
                    {values.cohort.toUpperCase()} // {(values.discipline.trim() || "UNSPECIFIED").toUpperCase()}
                  </div>
                </div>
              </div>

              <p className="font-mono text-[10px] text-neutral-500 border-t border-neutral-800 pt-3">
                THIS PREVIEW UPDATES AS YOU TYPE. YOUR REAL CREDENTIAL PASS IS ISSUED ONLY AFTER THE SERVER CREATES YOUR ACCOUNT.
              </p>
            </article>
          </div>

          <footer className="w-full flex items-center justify-between text-neutral-600 font-mono text-[9px] uppercase tracking-widest pt-2 border-t border-neutral-900">
            <div>NO ACCOUNT CREATED YET</div>
          </footer>
        </section>
      </main>
    </div>
  );
}