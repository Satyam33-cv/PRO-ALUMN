"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { Button, Field } from "@/components/ui";

type FormValues = { email: string; password: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const session = await apiClient.auth.login({ email: values.email.trim(), password: values.password });
      setSession(session);
      router.push("/dashboard");
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "We could not sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-10 space-y-5" onSubmit={handleSubmit} noValidate>
      {serverError ? <p role="alert" className="border border-clay-500/30 bg-clay-500/5 p-3 text-sm text-clay-500">{serverError}</p> : null}
      <Field label="Email address" type="email" autoComplete="email" placeholder="you@university.edu" value={values.email} error={errors.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
      <Field label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" value={values.password} error={errors.password} onChange={(event) => setValues({ ...values, password: event.target.value })} />
      <Button type="submit" className="mt-5 w-full justify-between" iconRight={ArrowUpRight} disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
