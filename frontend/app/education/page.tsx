"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlayCircle, FileCode, ShieldCheck, Users, Search,
  Zap, Globe, ChevronRight, Copy, Check,
} from "lucide-react";
import { PreLoginNav } from "@/components/PreLoginNav";

type Category = "All" | "Guides" | "Tutorials" | "Best Practices" | "Developer Docs";

const categories: Category[] = ["All", "Guides", "Tutorials", "Best Practices", "Developer Docs"];

const guides = [
  { title: "AI Vector Matching Deep Dive", category: "Tutorials" as const, icon: Zap, time: "8 min read", desc: "Understand 384-dim embedding vectors and cosine similarity scoring.", color: "text-amber-500" },
  { title: "Referral Engine Masterclass", category: "Guides" as const, icon: FileCode, time: "6 min read", desc: "Craft winning referral requests with customized notes and resumes.", color: "text-blue-600" },
  { title: "Mentorship & Google Meet Scheduling", category: "Best Practices" as const, icon: ShieldCheck, time: "5 min read", desc: "Connect your calendar, set availability, and host 1:1 sessions.", color: "text-emerald-500" },
  { title: "Alumni Verification & Roles", category: "Guides" as const, icon: Users, time: "4 min read", desc: "Understand Student, Alumni, Faculty, and Admin permissions.", color: "text-indigo-600" },
  { title: "Publishing Career Success Stories", category: "Tutorials" as const, icon: PlayCircle, time: "7 min read", desc: "Draft inspiring journey spotlights and participate in community voting.", color: "text-violet-600" },
  { title: "Organizing Events & Capacity RSVPs", category: "Developer Docs" as const, icon: Globe, time: "5 min read", desc: "Manage tech talks, career mixers, and capacity limits.", color: "text-blue-600" },
];

const codeSnippets = [
  {
    title: "Search Alumni by AI Match",
    lang: "TypeScript",
    code: `import { apiClient } from "@/lib/api/client";

const topMatches = await apiClient.matching.topAlumni();
console.log(\`Top match: \${topMatches.alumni[0]?.name}\`);`,
  },
  {
    title: "Request a Referral",
    lang: "TypeScript",
    code: `import { apiClient } from "@/lib/api/client";

const request = await apiClient.requests.create(
  "job_google_swe_123",
  "Hi! I would love a referral for the Full Stack Engineer opening."
);
console.log("Status:", request.status); // "PENDING"`,
  },
  {
    title: "Book Mentorship Session",
    lang: "TypeScript",
    code: `import { apiClient } from "@/lib/api/client";

const session = await apiClient.mentorship.create({
  mentorId: "alumni_uuid",
  area: "System Design & Career Guidance",
  message: "Looking for guidance on backend scalability."
});`,
  },
];

function CodeBlock({ snippet }: { snippet: typeof codeSnippets[0] }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="ml-2 text-xs text-slate-500 font-mono">{snippet.title}.{snippet.lang === "JavaScript" ? "js" : "py"}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
        {snippet.code}
      </pre>
    </div>
  );
}

export default function EducationPage() {
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filtered = guides.filter((g) => {
    if (category !== "All" && g.category !== category) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PreLoginNav />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Education &amp; Platform Guides</h1>
          <p className="text-slate-500 dark:text-slate-400">Master AI vector matching, career referrals, mentorship scheduling, and alumni networking.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides, tutorials, docs..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                category === c
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Guide Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl group-hover:scale-110 transition-transform">
                  <g.icon className={`w-6 h-6 ${g.color}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">{g.category}</span>
                  <h3 className="font-semibold text-base">{g.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{g.desc}</p>
                  <p className="text-[10px] text-slate-400">{g.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors mt-1" />
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12">No guides match your search.</p>
        )}

        {/* Code Playground */}
        <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Interactive Code Examples</h2>
            <p className="text-sm text-slate-500">Copy and run these snippets to get started instantly.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {codeSnippets.map((s) => (
              <CodeBlock key={s.title} snippet={s} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}