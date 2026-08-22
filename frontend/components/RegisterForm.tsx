"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { Button, Field } from "@/components/ui";

type FormValues = { firstName: string; lastName: string; email: string; password: string; confirmPassword: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!values.lastName.trim()) errors.lastName = "Enter your last name.";
  if (!values.email.trim()) errors.email = "Enter your university email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords must match.";
  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [values, setValues] = useState<FormValues>({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
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
      const session = await apiClient.auth.register({ name: `${values.firstName.trim()} ${values.lastName.trim()}`, email: values.email.trim(), password: values.password });
      setSession(session);
      router.push("/dashboard");
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "We could not create your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-10 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
      {serverError ? <p role="alert" className="border border-clay-500/50 bg-clay-500/10 p-3 text-sm text-paper-50 sm:col-span-2">{serverError}</p> : null}
      <Field dark label="First name" autoComplete="given-name" value={values.firstName} error={errors.firstName} onChange={(event) => setValues({ ...values, firstName: event.target.value })} />
      <Field dark label="Last name" autoComplete="family-name" value={values.lastName} error={errors.lastName} onChange={(event) => setValues({ ...values, lastName: event.target.value })} />
      <Field dark label="University email" type="email" autoComplete="email" placeholder="you@university.edu" className="sm:col-span-2" value={values.email} error={errors.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
      <Field dark label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." value={values.password} error={errors.password} onChange={(event) => setValues({ ...values, password: event.target.value })} />
      <Field dark label="Confirm password" type="password" autoComplete="new-password" value={values.confirmPassword} error={errors.confirmPassword} onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })} />
      <Button type="submit" variant="secondary" className="mt-4 justify-between sm:col-span-2" iconRight={ArrowUpRight} disabled={isSubmitting}>
        {isSubmitting ? "Creating profile..." : "Create my profile"}
      </Button>
    </form>
  );
}
