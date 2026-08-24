"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { ArrowLeft, Briefcase, Building2, MapPin, Sparkles, Plus, X, Loader2, CheckCircle2 } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("Full-time");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [referralAvailable, setReferralAvailable] = useState(true);
  const [description, setDescription] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddRequirement = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (!requirementInput.trim()) return;
    if (!requirements.includes(requirementInput.trim())) {
      setRequirements([...requirements, requirementInput.trim()]);
    }
    setRequirementInput("");
  };

  const handleRemoveRequirement = (req: string) => {
    setRequirements(requirements.filter((r) => r !== req));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) {
      setError("Please fill in the job title, company, and description.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient.jobs.create({
        title: title.trim(),
        company: company.trim(),
        type,
        location: location.trim() || (remote ? "Remote" : "On-site"),
        remote,
        referralAvailable,
        description: description.trim(),
        requirements: requirements.length > 0 ? requirements : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/jobs");
      }, 1500);
    } catch (err: any) {
      console.error("Job posting error:", err);
      setError(err.message || "Failed to publish role. Please try again.");
      setLoading(false);
    }
  };

  return (
    <RoleShell>
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to job board
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/10">
              <Briefcase size={22} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">
                CAREER OPPORTUNITY
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Post an opening.
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Share career opportunities with students and fellow alumni in our verified network.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs font-medium text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Role published successfully! Redirecting to job board...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card padding="lg" className="space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Role Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Associate Product Manager"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Company / Organization *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Northstar Labs"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Employment Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA or Hybrid"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={(e) => setRemote(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Remote-friendly position
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={referralAvailable}
                  onChange={(e) => setReferralAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Open to providing alumni referrals
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Requirements / Preferred Skills
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2+ years TypeScript, Next.js, Product Design"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  onKeyDown={handleAddRequirement}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {requirements.map((req) => (
                    <span
                      key={req}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200/60 dark:border-blue-900/50"
                    >
                      {req}
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(req)}
                        className="hover:text-rose-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Description & How to Apply *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Detail role responsibilities, team culture, qualification highlights, and application instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/jobs"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? "Publishing..." : "Publish Opportunity"}
              </button>
            </div>
          </Card>
        </form>
      </div>
    </RoleShell>
  );
}