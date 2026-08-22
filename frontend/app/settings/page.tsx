"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle, Copy, Eye, EyeOff, RefreshCw, Check,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Tab = "Org" | "API Keys" | "Team" | "Usage" | "Billing" | "Webhooks";

const tabs: Tab[] = ["Org", "API Keys", "Team", "Usage", "Billing", "Webhooks"];

const apiKeys = [
  { name: "Production Key", id: "prod_1", created: "Aug 10, 2026", lastUsed: "2 hours ago" },
  { name: "Development Key", id: "dev_1", created: "Aug 15, 2026", lastUsed: "5 minutes ago" },
];

function SecretBar({ value, label }: { value: string; label?: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isIdentifier = value.startsWith("prod_") || value.startsWith("dev_");
  const displayValue = isIdentifier ? value : `${value.substring(0, 7)}••••••••••••••••••••${value.slice(-4)}`;
  const masked = isIdentifier ? value : `${value.substring(0, 7)}••••••••••••••••••••${value.slice(-4)}`;

  return (
    <div className="p-3 rounded-xl border flex items-center justify-between font-mono text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 gap-3">
      <span className="truncate max-w-[180px] sm:max-w-[280px] md:max-w-md text-slate-600 dark:text-slate-300 min-w-0">
        {show ? value : masked}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {!isIdentifier && (
          <button onClick={handleCopy} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500" title="Copy">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
        {!isIdentifier && (
          <button onClick={() => setShow(!show)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500" title={show ? "Hide" : "Show"}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {label && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md ml-2 border border-emerald-200 dark:border-emerald-800">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

function OrgTab() {
  const [orgName, setOrgName] = useState("PRO ALUMN Inc.");
  const [domain, setDomain] = useState("pro-alumn.io");
  const [twoFA, setTwoFA] = useState(true);
  const [sso, setSSO] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, domain, twoFA, sso }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handling could be added here
    } finally {
      setSaving(false);
    }
  }

  async function handleSecurityChange(setter: (v: boolean) => void, newValue: boolean) {
    setter(newValue);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, domain, twoFA, sso }),
      });
    } catch {
      // Revert on failure
      setter(!newValue);
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border space-y-4 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="font-bold text-lg">Organization Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="org-name" className="text-xs font-semibold text-slate-500 mb-1.5 block">Organization Name</label>
            <input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div>
            <label htmlFor="org-domain" className="text-xs font-semibold text-slate-500 mb-1.5 block">Domain</label>
            <input
              id="org-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      <div className="p-6 rounded-2xl border space-y-4 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="font-bold text-lg">Security</h2>
        <div className="space-y-3">
          {[
            { label: "Two-Factor Authentication", desc: "Require 2FA for all team members", on: twoFA, set: setTwoFA },
            { label: "SSO Integration", desc: "Enable SAML-based single sign-on", on: sso, set: setSSO },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              role="switch"
              aria-checked={item.on}
              onClick={() => handleSecurityChange(item.set, !item.on)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left"
            >
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <span className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${item.on ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.on ? "left-5" : "left-1"}`} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border space-y-6 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg">API Keys</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">BETA</span>
          </div>
        </div>
        <div className="space-y-4">
          {apiKeys.map((k) => (
            <div key={k.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{k.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Created {k.created} · Last used {k.lastUsed}</p>
                </div>
              </div>
              <SecretBar value={k.key} label="Active" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  const members = [
    { name: "John Smith", email: "john@pro-alumn.io", role: "Admin", initials: "JS" },
    { name: "Priya Sharma", email: "priya@pro-alumn.io", role: "Editor", initials: "PS" },
    { name: "Alex Rivera", email: "alex@pro-alumn.io", role: "Viewer", initials: "AR" },
  ];
  return (
    <div className="p-6 rounded-2xl border bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Team Members</h2>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {members.map((m) => (
          <div key={m.email} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{m.initials}</div>
              <div>
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-slate-400">{m.email}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsageTab() {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {[
        { label: "API Calls", value: "12,847", limit: "50,000", pct: 25.7 },
        { label: "Search Queries", value: "3,291", limit: "10,000", pct: 32.9 },
        { label: "AI Matches", value: "1,042", limit: "5,000", pct: 20.8 },
      ].map((u) => (
        <div key={u.label} className="p-5 rounded-2xl border bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">{u.label}</p>
          <p className="text-2xl font-extrabold">{u.value}</p>
          <p className="text-[10px] text-slate-400 mt-1">of {u.limit}</p>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${u.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BillingTab() {
  return (
    <div className="p-6 rounded-2xl border bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
      <h2 className="font-bold text-lg mb-4">Current Plan</h2>
      <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">P</div>
        <div>
          <p className="font-bold">Pro Plan</p>
          <p className="text-xs text-slate-500">$49/month · Renews Sep 15, 2026</p>
        </div>
      </div>
    </div>
  );
}

function WebhooksTab() {
  const [secretKey, setSecretKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  async function fetchSecret() {
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks/secret");
      const data = await res.json();
      setSecretKey(data.secret);
    } catch (err) {
      console.error("Failed to load webhook secret", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSecret();
  }, []);

  const handleRegenerateSecret = async () => {
    if (!confirm("Rotating the secret invalidates existing integrations. Continue?")) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/webhooks/regenerate", { method: "POST" });
      const data = await res.json();
      setSecretKey(data.secret);
    } catch (err) {
      console.error("Error regenerating secret", err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 rounded-xl border flex items-center gap-3 text-sm bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-300">
        <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
        <span>Learn how to trigger webhooks. Check out the <a href="/docs/webhooks" className="underline font-semibold hover:text-indigo-600">Webhooks Documentation</a>.</span>
      </div>

      {/* Webhook Config */}
      <div className="p-6 rounded-2xl border space-y-6 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg">Webhooks</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">BETA</span>
          </div>
          <button onClick={fetchSecret} className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>
        {loading ? (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-400">
            Fetching secret...
          </div>
        ) : (
          <SecretBar value={secretKey} label="Active Secret" />
        )}
      </div>

      {/* Regenerate Secret */}
      <div className="p-6 rounded-2xl border space-y-4 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-semibold text-base">Regenerate Secret</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rotating your signing secret will invalidate the previous key immediately.</p>
        </div>
        <button
          onClick={handleRegenerateSecret}
          disabled={regenerating}
          className="flex items-center gap-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {regenerating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          GENERATE NEW SECRET
        </button>
      </div>
    </div>
  );
}

const tabContent: Record<Tab, () => JSX.Element> = {
  Org: OrgTab,
  "API Keys": ApiKeysTab,
  Team: TeamTab,
  Usage: UsageTab,
  Billing: BillingTab,
  Webhooks: WebhooksTab,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Webhooks");
  const Content = tabContent[activeTab];

  return (
    <DashboardShell>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your team workspace, API security, and environment webhooks.</p>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Content />
    </DashboardShell>
  );
}