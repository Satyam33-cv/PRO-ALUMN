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
  { title: "Webhook Integration Guide", category: "Developer Docs" as const, icon: FileCode, time: "5 min read", desc: "Set up webhooks for real-time referral notifications.", color: "text-blue-600" },
  { title: "Building Deep Research Agents", category: "Tutorials" as const, icon: PlayCircle, time: "12 min video", desc: "Learn to build AI agents that browse and extract alumni data.", color: "text-violet-600" },
  { title: "Optimizing API Key Security", category: "Best Practices" as const, icon: ShieldCheck, time: "4 min read", desc: "Rotate keys, use scopes, and audit access patterns.", color: "text-emerald-500" },
  { title: "Configuring Multi-Tenant Workspaces", category: "Guides" as const, icon: Users, time: "8 min read", desc: "Manage alumni groups, departments, and access levels.", color: "text-indigo-600" },
  { title: "FindAll Crawler Configuration", category: "Developer Docs" as const, icon: Globe, time: "6 min read", desc: "Configure deep crawling patterns for web discovery.", color: "text-blue-600" },
  { title: "AI Matching Deep Dive", category: "Tutorials" as const, icon: Zap, time: "15 min video", desc: "Understand 384-dim vectors and similarity scoring.", color: "text-amber-500" },
];

const codeSnippets = [
  {
    title: "Search Alumni",
    lang: "JavaScript",
    code: `const results = await pro-alumn.search({
  company: "Google",
  skills: ["React", "System Design"],
  minMatchScore: 85,
});

console.log(\`Found \${results.length} alumni\`);`,
  },
  {
    title: "Create a Referral",
    lang: "JavaScript",
    code: `const referral = await pro-alumn.referrals.create({
  alumniId: "al_abc123",
  message: "Hi! I'd love to connect about the SWE role.",
  resumeUrl: "https://my-resume.pdf",
});`,
  },
  {
    title: "Configure Webhook",
    lang: "JavaScript",
    code: `await pro-alumn.webhooks.create({
  url: "https://my-app.com/webhook",
  events: ["referral.accepted", "referral.completed"],
  secret: process.env.WEBHOOK_SECRET,
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
          <h1 className="text-3xl font-extrabold tracking-tight">Education &amp; Developer Guides</h1>
          <p className="text-slate-500 dark:text-slate-400">Master API webhooks, web agents, and AI-powered alumni matching.</p>
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