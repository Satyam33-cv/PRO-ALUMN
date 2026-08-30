"use client";

import { useState, useEffect } from "react";
import {
  User, Briefcase, HeartHandshake, Bell, Shield, Check, Loader2,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";

type Tab = "Profile" | "Career" | "Mentorship" | "Notifications" | "Security";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "Profile", label: "Profile", icon: User },
  { id: "Career", label: "Career & Skills", icon: Briefcase },
  { id: "Mentorship", label: "Mentorship & Referrals", icon: HeartHandshake },
  { id: "Notifications", label: "Notifications", icon: Bell },
  { id: "Security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const { user, setSession, session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [bio, setBio] = useState("");
  const [skillsOffered, setSkillsOffered] = useState("");
  const [skillsWanted, setSkillsWanted] = useState("");
  const [interests, setInterests] = useState("");
  const [openToMentoring, setOpenToMentoring] = useState(true);
  const [notifyReferrals, setNotifyReferrals] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);

  // Sync initial state from user context or backend
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await apiClient.auth.me();
        if (profile) {
          setName(profile.name || "");
          setPhone(profile.phone || "");
          setBatchYear(profile.batchYear ? String(profile.batchYear) : "");
          setDepartment(profile.department || "");
          setLocation(profile.location || "");
          setCompany(profile.currentCompany || "");
          setJobTitle(profile.jobTitle || "");
          setLinkedinUrl(profile.linkedinUrl || "");
          setBio(profile.bio || "");
          setSkillsOffered(profile.skillsOffered || profile.skills || "");
          setSkillsWanted(profile.skillsWanted || "");
          setInterests(profile.interests || "");
        }
      } catch (err) {
        console.warn("Error fetching profile in settings:", err);
      }
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const updated = await apiClient.users.updateProfile({
        name,
        phone,
        batchYear: batchYear ? parseInt(batchYear) : undefined,
        department,
        location,
        currentCompany: company,
        jobTitle,
        linkedinUrl,
        bio,
        skills: skillsOffered,
        skillsOffered,
        skillsWanted,
        interests,
      });

      if (session?.token) {
        setSession({ user: updated, token: session.token });
      }

      setSaved(true);
      setMessage("Settings saved successfully!");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save settings error:", err);
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-900 dark:text-slate-100 transition-colors";

  return (
    <DashboardShell>
      <div className="max-w-4xl space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account &amp; Platform Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile, career credentials, mentorship availability, and notification preferences.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 sm:gap-6 text-sm font-medium">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage("");
                }}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-sm font-medium ${
              saved
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* PROFILE TAB */}
          {activeTab === "Profile" && (
            <div className="p-6 rounded-2xl border space-y-4 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-lg">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address (Primary)</label>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Phone Number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Current Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="e.g. Bengaluru, India" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Batch / Graduation Year</label>
                  <input value={batchYear} onChange={(e) => setBatchYear(e.target.value)} className={inputClass} placeholder="e.g. 2024" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Department</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} placeholder="e.g. CSE, ECE, MECH" />
                </div>
              </div>
            </div>
          )}

          {/* CAREER TAB */}
          {activeTab === "Career" && (
            <div className="p-6 rounded-2xl border space-y-4 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-lg">Career, Skills &amp; AI Vector Sync</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Current Company / Organization</label>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} placeholder="e.g. Google, Microsoft" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Job Title / Role</label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} placeholder="e.g. Senior Software Engineer" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">LinkedIn Profile URL</label>
                  <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Skills You Can Teach / Offer (Skill Swap)</label>
                  <input value={skillsOffered} onChange={(e) => setSkillsOffered(e.target.value)} className={inputClass} placeholder="React, Node.js, TypeScript, Distributed Systems" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Skills You Want to Learn (Skill Swap)</label>
                  <input value={skillsWanted} onChange={(e) => setSkillsWanted(e.target.value)} className={inputClass} placeholder="AI Agents, Kubernetes, Product Strategy, PyTorch" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Interests &amp; Focus Areas</label>
                  <input value={interests} onChange={(e) => setInterests(e.target.value)} className={inputClass} placeholder="Mentoring, Cloud Architecture, AI Startups" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Short Bio</label>
                  <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} placeholder="Brief summary of your professional journey..." />
                </div>
              </div>
            </div>
          )}

          {/* MENTORSHIP & REFERRALS TAB */}
          {activeTab === "Mentorship" && (
            <div className="p-6 rounded-2xl border space-y-6 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-lg">Mentorship &amp; Referral Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div>
                    <p className="font-semibold text-sm">Open to Mentoring Students</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Show the &ldquo;Request Mentorship&rdquo; button on your public alumni profile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenToMentoring(!openToMentoring)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${openToMentoring ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${openToMentoring ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                  <p className="font-semibold text-sm">Referral Slot Limits</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage internal job referral bandwidth per month to keep candidate quality high.</p>
                  <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Active Limit: Up to 5 requests / month
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "Notifications" && (
            <div className="p-6 rounded-2xl border space-y-6 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-lg">Notification Channels</h2>
              <div className="space-y-3">
                {[
                  { label: "Job Referral Inquiries", desc: "Notify when a student asks for a referral on an open role", on: notifyReferrals, set: setNotifyReferrals },
                  { label: "Direct Messages & Chat", desc: "Real-time notifications for incoming 1:1 messages", on: notifyMessages, set: setNotifyMessages },
                  { label: "Alumni Events & Tech Talks", desc: "Reminders for upcoming offline and virtual campus mixers", on: notifyEvents, set: setNotifyEvents },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.set(!item.on)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${item.on ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${item.on ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "Security" && (
            <div className="p-6 rounded-2xl border space-y-6 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-lg">Security &amp; Authentication</h2>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <p className="font-semibold text-sm">Google OAuth SSO</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your account is secured via Google OAuth 2.0 single sign-on.</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3.5 h-3.5" /> Connected
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-md shadow-indigo-600/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {loading ? "Saving Changes..." : saved ? "Changes Saved" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}