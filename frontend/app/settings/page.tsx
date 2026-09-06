"use client";

import { useState, useEffect } from "react";
import {
  User, Briefcase, HeartHandshake, Bell, Shield, Check, Loader2,
} from "lucide-react";
import { RoleShell } from "@/components/RoleShell";
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
    "w-full border-2 border-black bg-white px-4 py-2.5 font-mono text-xs text-black outline-none shadow-[2px_2px_0px_#000000] focus:bg-[#CCFF00]/10 transition-colors";

  return (
    <RoleShell>
      <div className="max-w-4xl space-y-8 pb-16">
        {/* Page Header */}
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-[#CCFF00] border border-black" />
            <p className="font-mono text-xs uppercase font-bold tracking-[0.2em] text-black">
              [ SECTION 07 // ACCOUNT &amp; SYSTEM SETTINGS ]
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-black">
            Account &amp; Platform Settings
          </h1>
          <p className="mt-1 font-mono text-xs text-neutral-600">
            Manage your personal profile, career credentials, mentorship availability, and notification preferences.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage("");
                }}
                className={`border-2 border-black px-4 py-2.5 flex items-center gap-2 font-mono text-xs font-black uppercase transition-all ${
                  isActive
                    ? "bg-black text-[#CCFF00] shadow-[3px_3px_0px_#000000] -translate-y-0.5"
                    : "bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000000]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {message && (
          <div
            className={`p-4 border-3 border-black font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_#000000] ${
              saved
                ? "bg-[#00E676] text-black"
                : "bg-[#FF5500] text-white"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* PROFILE TAB */}
          {activeTab === "Profile" && (
            <div className="p-6 border-4 border-black bg-white space-y-5 shadow-[6px_6px_0px_#000000]">
              <div className="border-b-2 border-black pb-3">
                <h2 className="font-sans font-black text-xl uppercase tracking-tight text-black">Personal Information</h2>
                <p className="font-mono text-xs text-neutral-500">Public directory and institutional identification</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Email Address (Primary)</label>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full border-2 border-black bg-neutral-100 px-4 py-2.5 font-mono text-xs text-neutral-500 cursor-not-allowed shadow-[2px_2px_0px_#000000]"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Phone Number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Current Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="e.g. Bengaluru, India" />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Batch / Graduation Year</label>
                  <input value={batchYear} onChange={(e) => setBatchYear(e.target.value)} className={inputClass} placeholder="e.g. 2024" />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Department</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} placeholder="e.g. CSE, ECE, MECH" />
                </div>
              </div>
            </div>
          )}

          {/* CAREER TAB */}
          {activeTab === "Career" && (
            <div className="p-6 border-4 border-black bg-white space-y-5 shadow-[6px_6px_0px_#000000]">
              <div className="border-b-2 border-black pb-3">
                <h2 className="font-sans font-black text-xl uppercase tracking-tight text-black">Career, Skills &amp; AI Vector Sync</h2>
                <p className="font-mono text-xs text-neutral-500">Synchronized with the platform vector matching and recommendation engine</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Current Company / Organization</label>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} placeholder="e.g. Google, Microsoft" />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Job Title / Role</label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} placeholder="e.g. Senior Software Engineer" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">LinkedIn Profile URL</label>
                  <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Skills You Can Teach / Offer (Skill Swap)</label>
                  <input value={skillsOffered} onChange={(e) => setSkillsOffered(e.target.value)} className={inputClass} placeholder="React, Node.js, TypeScript, Distributed Systems" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Skills You Want to Learn (Skill Swap)</label>
                  <input value={skillsWanted} onChange={(e) => setSkillsWanted(e.target.value)} className={inputClass} placeholder="AI Agents, Kubernetes, Product Strategy, PyTorch" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Interests &amp; Focus Areas</label>
                  <input value={interests} onChange={(e) => setInterests(e.target.value)} className={inputClass} placeholder="Mentoring, Cloud Architecture, AI Startups" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-mono text-xs font-bold uppercase text-black mb-1.5 block">Short Bio</label>
                  <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} placeholder="Brief summary of your professional journey..." />
                </div>
              </div>
            </div>
          )}

          {/* MENTORSHIP & REFERRALS TAB */}
          {activeTab === "Mentorship" && (
            <div className="p-6 border-4 border-black bg-white space-y-6 shadow-[6px_6px_0px_#000000]">
              <div className="border-b-2 border-black pb-3">
                <h2 className="font-sans font-black text-xl uppercase tracking-tight text-black">Mentorship &amp; Referral Preferences</h2>
                <p className="font-mono text-xs text-neutral-500">Configure public discovery and inbound referral bandwidth</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-2 border-black bg-neutral-50 shadow-[3px_3px_0px_#000000]">
                  <div>
                    <p className="font-bold text-sm text-black">Open to Mentoring Students</p>
                    <p className="font-mono text-xs text-neutral-600 mt-0.5">Show the &ldquo;Request Mentorship&rdquo; button on your public alumni profile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenToMentoring(!openToMentoring)}
                    className={`border-2 border-black px-4 py-1.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all ${
                      openToMentoring ? "bg-[#00E676] text-black" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {openToMentoring ? "Enabled" : "Disabled"}
                  </button>
                </div>
                <div className="p-4 border-2 border-black bg-neutral-50 space-y-2 shadow-[3px_3px_0px_#000000]">
                  <p className="font-bold text-sm text-black">Referral Slot Limits</p>
                  <p className="font-mono text-xs text-neutral-600">Manage internal job referral bandwidth per month to keep candidate quality high.</p>
                  <span className="inline-block border-2 border-black px-3 py-1 text-xs font-mono font-black uppercase bg-[#CCFF00] text-black shadow-[2px_2px_0px_#000000]">
                    Active Limit: Up to 5 requests / month
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "Notifications" && (
            <div className="p-6 border-4 border-black bg-white space-y-6 shadow-[6px_6px_0px_#000000]">
              <div className="border-b-2 border-black pb-3">
                <h2 className="font-sans font-black text-xl uppercase tracking-tight text-black">Notification Channels</h2>
                <p className="font-mono text-xs text-neutral-500">Control alerts and incoming communications</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Job Referral Inquiries", desc: "Notify when a student asks for a referral on an open role", on: notifyReferrals, set: setNotifyReferrals },
                  { label: "Direct Messages & Chat", desc: "Real-time notifications for incoming 1:1 messages", on: notifyMessages, set: setNotifyMessages },
                  { label: "Alumni Events & Tech Talks", desc: "Reminders for upcoming offline and virtual campus mixers", on: notifyEvents, set: setNotifyEvents },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 border-2 border-black bg-neutral-50 shadow-[3px_3px_0px_#000000]">
                    <div>
                      <p className="font-bold text-sm text-black">{item.label}</p>
                      <p className="font-mono text-xs text-neutral-600 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.set(!item.on)}
                      className={`border-2 border-black px-4 py-1.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all ${
                        item.on ? "bg-[#00E676] text-black" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {item.on ? "ON" : "OFF"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "Security" && (
            <div className="p-6 border-4 border-black bg-white space-y-6 shadow-[6px_6px_0px_#000000]">
              <div className="border-b-2 border-black pb-3">
                <h2 className="font-sans font-black text-xl uppercase tracking-tight text-black">Security &amp; Authentication</h2>
                <p className="font-mono text-xs text-neutral-500">Identity verification and OAuth credentials</p>
              </div>
              <div className="p-4 border-2 border-black bg-neutral-50 space-y-2 shadow-[3px_3px_0px_#000000]">
                <p className="font-bold text-sm text-black">Google OAuth SSO</p>
                <p className="font-mono text-xs text-neutral-600">Your account is secured via Google OAuth 2.0 single sign-on.</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase text-black bg-[#00E676] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Connected
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 border-3 border-black bg-[#CCFF00] hover:bg-black hover:text-[#CCFF00] text-black px-8 py-3.5 font-mono text-sm font-black uppercase shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 stroke-[3]" /> : null}
              {loading ? "Saving Changes..." : saved ? "Changes Saved" : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </RoleShell>
  );
}