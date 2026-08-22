"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Star,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Briefcase,
} from "lucide-react";

type Role = "student" | "alumni" | "faculty";

const roles: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "alumni", label: "Alumni" },
  { value: "faculty", label: "Faculty/Admin" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Meta",
    batch: "2020",
    text: "PRO ALUMN helped me land my dream job through a referral from a senior I never knew existed.",
    initials: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager at Stripe",
    batch: "2018",
    text: "The AI matching is incredible. I found 3 mentors in my exact industry within minutes.",
    initials: "MJ",
  },
  {
    name: "Priya Patel",
    role: "Data Scientist at Netflix",
    batch: "2021",
    text: "I've referred 5 juniors so far. The platform makes it easy to give back to my college community.",
    initials: "PP",
  },
];

const features = [
  { icon: Zap, text: "Instant profile matching with AI" },
  { icon: Shield, text: "Verified college email required" },
  { icon: Users, text: "Connect with 2,400+ alumni" },
  { icon: Briefcase, text: "Access exclusive referral opportunities" },
];

export function LoginPage() {
  const [activeRole, setActiveRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate login
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    window.location.href = "/home";
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#FAFBFF]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white font-heading font-bold text-lg">
                A
              </div>
              <span className="font-heading text-2xl font-bold text-[#0F172A]">
                PRO ALUMN
              </span>
            </Link>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="font-heading text-3xl font-bold text-[#0F172A]">
              Welcome back
            </h1>
            <p className="mt-2 text-[#0F172A]/60">
              Sign in to access your alumni network
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 rounded-2xl border border-[#0F172A]/10 bg-white p-6 shadow-lg shadow-[#0F172A]/5"
          >
            {/* Role Tabs */}
            <div className="flex rounded-xl bg-[#0F172A]/5 p-1 mb-6">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setActiveRole(role.value)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    activeRole === role.value
                      ? "bg-white text-[#0F172A] shadow-sm"
                      : "text-[#0F172A]/50 hover:text-[#0F172A]/70"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#0F172A] mb-2"
                >
                  College Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#0F172A]/30" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full rounded-xl border border-[#0F172A]/10 bg-[#FAFBFF] py-3 pl-10 pr-4 text-sm text-[#0F172A] placeholder-[#0F172A]/30 transition-colors focus:border-[#4F46E5]/40 focus:ring-2 focus:ring-[#4F46E5]/20 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#0F172A] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#0F172A]/30" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#0F172A]/10 bg-[#FAFBFF] py-3 pl-10 pr-12 text-sm text-[#0F172A] placeholder-[#0F172A]/30 transition-colors focus:border-[#4F46E5]/40 focus:ring-2 focus:ring-[#4F46E5]/20 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F172A]/30 hover:text-[#0F172A]/60 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-[#0F172A]/20 text-[#4F46E5] focus:ring-[#4F46E5]/20"
                  />
                  <span className="text-sm text-[#0F172A]/60">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4F46E5]/25 transition-all hover:bg-[#4338CA] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#0F172A]/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-[#0F172A]/40">
                  New to PRO ALUMN?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              href="/register"
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#0F172A]/15 px-6 py-3.5 text-sm font-semibold text-[#0F172A] transition-all hover:border-[#4F46E5]/40 hover:bg-[#4F46E5]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
            >
              Create your account
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Right: Testimonials & Features */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-12 items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Glows */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#4F46E5]/[0.15] blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#06B6D4]/[0.1] blur-[80px]" />

        <div className="relative z-10 w-full max-w-lg">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 mb-8 border border-white/10"
          >
            <Shield className="size-4 text-[#10B981]" />
            <span className="text-sm font-medium text-white/90">
              Verified College Portal
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="font-heading text-3xl font-bold mb-4"
          >
            Your network is your net worth
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-white/60 mb-10"
          >
            Join thousands of alumni who are helping the next generation succeed.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-4 mb-10"
          >
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5]/20">
                  <feature.icon className="size-4 text-[#4F46E5]" />
                </div>
                <span className="text-sm text-white/80">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-4"
          >
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-sm font-bold">
                    {testimonial.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className="size-3 text-[#FBBF24] fill-[#FBBF24]"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mb-2">
                      {testimonial.role} · Class of {testimonial.batch}
                    </p>
                    <p className="text-sm text-white/70 leading-relaxed">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;