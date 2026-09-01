"use client";

import React, { useState, useEffect } from "react";
import { RoleShell } from "@/components/RoleShell";
import { useAuth } from "@/lib/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import {
  FiLifeBuoy,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCheck,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiMail,
  FiMessageSquare,
  FiShield,
  FiFilter,
} from "react-icons/fi";
import {
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Settings,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Award,
  BookOpen,
} from "lucide-react";

interface SupportTicket {
  id: string;
  userId: string;
  category: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
}

export function HelpContent({ userSession }: { userSession?: any }) {
  const { user, role: currentRole } = useAuth();
  const role = currentRole || userSession?.role || "student";
  const isAdmin = (role || "").toLowerCase() === "admin";

  const [activeTab, setActiveTab] = useState<"submit" | "my-tickets" | "admin" | "faq">("submit");
  
  // Ticket Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Account Issue");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tickets state
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [adminTickets, setAdminTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [adminFilterStatus, setAdminFilterStatus] = useState("ALL");
  const [adminFilterCategory, setAdminFilterCategory] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqSearch, setFaqSearch] = useState("");

  const categories = [
    { name: "Account Issue", icon: <Settings className="w-4 h-4" /> },
    { name: "Mentorship", icon: <GraduationCap className="w-4 h-4" /> },
    { name: "Job & Referral", icon: <Briefcase className="w-4 h-4" /> },
    { name: "Bug Report", icon: <AlertTriangle className="w-4 h-4" /> },
    { name: "Feature Request", icon: <Lightbulb className="w-4 h-4" /> },
    { name: "Verification & ID", icon: <ShieldCheck className="w-4 h-4" /> },
    { name: "Other", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const faqs = [
    {
      q: "How does Alumni and Student Profile Verification work?",
      a: "Our administration verifies accounts through college domain emails, institutional roll numbers, or uploaded ID cards. Once approved by our team, you will receive an official verification confirmation email and full badge privileges across the platform.",
    },
    {
      q: "How do I request a Job Referral from an Alumni?",
      a: "Navigate to the Opportunities > Job Board section. Find the job opening you are interested in and click 'Request Referral'. Fill out your brief student note and attach your resume. The alumni who posted the opening will receive an immediate notification to review your profile.",
    },
    {
      q: "How can I book a Mentorship Session?",
      a: "Visit the Mentorship Hub under the Engage menu. Browse available alumni or faculty mentors by domain expertise (e.g., Software Engineering, Data Science, Product). Submit your session request with your discussion topics.",
    },
    {
      q: "How do Activity Points and Daily Streaks work?",
      a: "You earn points by logging in daily, participating in mentorship sessions, posting jobs, or publishing spotlight success stories. Maintain your daily streak to climb the Leaderboard and unlock exclusive platform rewards and verified badges.",
    },
    {
      q: "What should I do if an email notification is not received?",
      a: "Please check your spam or promotions folder for messages from support@proalumn.dpdns.org. Ensure that your account email in your Profile settings is up to date.",
    },
  ];

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await apiClient.support.myTickets();
      setMyTickets((res.tickets || []) as unknown as SupportTicket[]);
    } catch (err: any) {
      console.error("Failed to fetch my tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchAdminTickets = async () => {
    if (!isAdmin) return;
    try {
      setLoadingTickets(true);
      const res = await apiClient.support.allTickets({
        status: adminFilterStatus,
        category: adminFilterCategory,
      });
      setAdminTickets((res.tickets || []) as unknown as SupportTicket[]);
    } catch (err: any) {
      console.error("Failed to fetch admin tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my-tickets") {
      fetchMyTickets();
    } else if (activeTab === "admin" && isAdmin) {
      fetchAdminTickets();
    }
  }, [activeTab, adminFilterStatus, adminFilterCategory, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await apiClient.support.create({ subject, category, message });

      setSuccess(true);
      setSubject("");
      setMessage("");
      setCategory("Account Issue");
      
      setTimeout(() => {
        setSuccess(false);
      }, 6000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit support ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      setActionLoadingId(ticketId);
      await apiClient.support.updateStatus(ticketId, newStatus);
      fetchAdminTickets();
    } catch (err: any) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><FiCheck size={12} /> Resolved</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"><FiClock size={12} /> In Progress</span>;
      case "CLOSED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">Closed</span>;
      case "OPEN":
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"><FiAlertCircle size={12} /> Open</span>;
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <RoleShell role={role}>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl mb-3 text-blue-600 dark:text-blue-400">
            <FiLifeBuoy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Help & Support Center
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl mx-auto mt-2">
            Get instant guidance, resolve issues, or submit a support ticket to our administration team.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-2xl mx-auto mb-8 border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("submit")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "submit"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FiSend className="w-4 h-4" />
            <span>Submit Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my-tickets")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "my-tickets"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FiClock className="w-4 h-4" />
            <span>My Tickets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("faq")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "faq"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Knowledge Base / FAQ</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                  : "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold"
              }`}
            >
              <FiShield className="w-4 h-4" />
              <span>Admin Tickets</span>
            </button>
          )}
        </div>

        {/* ================= TAB 1: SUBMIT TICKET ================= */}
        {activeTab === "submit" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar Categories & Info */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Issue Categories</h3>
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        category === cat.name
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                  <FiMail className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Automated Email Dispatch</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Every submitted ticket is instantly assigned a tracking ID and dispatches confirmation emails to both you and our support administrators.
                </p>
              </div>
            </div>

            {/* Form Area */}
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create Support Request</h2>
                
                {success ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                      <FiCheckCircle className="w-9 h-9" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ticket Submitted Successfully!</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md">
                      We have logged your ticket and sent a confirmation email. You can monitor the resolution status in the <strong>My Tickets</strong> tab.
                    </p>
                    <div className="flex items-center gap-3 mt-6">
                      <button 
                        onClick={() => setSuccess(false)}
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
                      >
                        Submit another ticket
                      </button>
                      <button 
                        onClick={() => setActiveTab("my-tickets")}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                      >
                        View My Tickets
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {errorMsg && (
                      <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
                        <FiAlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-xs sm:text-sm font-medium">{errorMsg}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Selected Category
                      </label>
                      <div className="flex items-center gap-2 w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 font-medium">
                        {categories.find(c => c.name === category)?.icon}
                        <span>{category}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Subject / Summary
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Issue claiming certificate for video completion"
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Detailed Message
                      </label>
                      <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe the issue, steps to reproduce, or details of your request..."
                        rows={6}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading || !subject.trim() || !message.trim()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <FiSend className="w-4 h-4" />
                            <span>Submit Support Ticket</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MY TICKETS ================= */}
        {activeTab === "my-tickets" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Submitted Tickets</h2>
                <p className="text-xs text-slate-500 mt-1">Track real-time status and resolutions for your tickets.</p>
              </div>
              <button
                type="button"
                onClick={fetchMyTickets}
                className="self-start sm:self-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              >
                Refresh List
              </button>
            </div>

            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-xs">Loading your tickets...</p>
              </div>
            ) : myTickets.length === 0 ? (
              <div className="text-center py-16">
                <FiLifeBuoy className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Tickets Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You haven&apos;t submitted any support requests yet. If you ever experience issues, submit a ticket anytime.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("submit")}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  <FiSend size={13} /> Create First Ticket
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-slate-400">#{ticket.id.substring(0, 8)}</span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{ticket.subject}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          {ticket.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(ticket.status)}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800">
                      {ticket.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ADMIN TICKETS CENTER ================= */}
        {isAdmin && activeTab === "admin" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold uppercase">
                    Admin Command
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Platform Support Queue</h2>
                <p className="text-xs text-slate-500">Review student & alumni tickets, update resolution statuses.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={adminFilterStatus}
                  onChange={(e) => setAdminFilterStatus(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  value={adminFilterCategory}
                  onChange={(e) => setAdminFilterCategory(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-purple-600 rounded-full animate-spin mb-3" />
                <p className="text-xs">Fetching support tickets...</p>
              </div>
            ) : adminTickets.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
                <p className="text-xs text-slate-500 mt-1">No support tickets match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminTickets.map((ticket) => (
                  <div key={ticket.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-400">#{ticket.id.substring(0, 8)}</span>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">{ticket.subject}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-xs font-semibold">
                            {ticket.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted by: <strong>{ticket.user?.name || "User"}</strong> ({ticket.user?.email || "No email"}) · Role: <span className="uppercase font-mono text-[10px]">{ticket.user?.role}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-200/60 dark:border-slate-700/60">
                      {ticket.message}
                    </div>

                    {/* Admin Action Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Created {new Date(ticket.createdAt).toLocaleString()}
                      </span>

                      <div className="flex items-center gap-2">
                        {ticket.status !== "IN_PROGRESS" && ticket.status !== "RESOLVED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === ticket.id}
                            onClick={() => handleUpdateTicketStatus(ticket.id, "IN_PROGRESS")}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 font-semibold transition-all disabled:opacity-50"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {ticket.status !== "RESOLVED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === ticket.id}
                            onClick={() => handleUpdateTicketStatus(ticket.id, "RESOLVED")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-semibold transition-all disabled:opacity-50 shadow-xs"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {ticket.status !== "CLOSED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === ticket.id}
                            onClick={() => handleUpdateTicketStatus(ticket.id, "CLOSED")}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 font-semibold transition-all disabled:opacity-50"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: FAQ KNOWLEDGE BASE ================= */}
        {activeTab === "faq" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Knowledge Base & FAQ</h2>
                <p className="text-xs text-slate-500 mt-1">Frequently asked questions by students, faculty, and alumni.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search articles & questions..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <FiChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RoleShell>
  );
}
