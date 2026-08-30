"use client";

import React, { useState, useEffect } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Send,
  Inbox,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Plus,
  X,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  listGmailMessages,
  sendGmailMessage,
  GmailMessageSummary,
} from "@/lib/google-workspace";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface EmailLogItem {
  id: string;
  to: string;
  subject: string;
  snippet: string;
  senderEmail: string;
  sentAt: string;
}

const EMAIL_TEMPLATES = [
  {
    title: "Alumni Mentorship Request",
    subject: "Alumni Connect: Mentorship Request & Coffee Chat",
    body: `Hello,\n\nI hope this email finds you well. I came across your profile on the Alumni Connect network and was inspired by your career journey in software engineering.\n\nI am currently a student at the university and would love to ask for 15 minutes of your time for a brief virtual coffee chat about career advice and industry insights.\n\nThank you so much for your time and guidance!\n\nBest regards,\n`,
  },
  {
    title: "Reunion Event Invitation",
    subject: "You're Invited: Annual Campus Alumni Reunion & Mixer",
    body: `Dear Alumni Member,\n\nWe are delighted to invite you to our upcoming Annual Alumni Homecoming Reunion & Networking Gala!\n\nJoin fellow graduates, faculty, and industry partners for an evening of celebration, keynote panels, and dinner.\n\nPlease confirm your RSVP on our campus portal or Google Forms.\n\nWarm regards,\nAlumni Relations Team`,
  },
  {
    title: "Career Referral Inquiry",
    subject: "Alumni Connect: Career Opportunity & Referral Inquiry",
    body: `Dear Fellow Alum,\n\nI noticed an open opportunity at your company and wanted to reach out. As a fellow graduate from our university, I admire the work your team is doing.\n\nWould you be open to reviewing my resume or sharing insights on the hiring process for this role?\n\nThank you for supporting our alumni community!\n\nSincerely,\n`,
  },
];

export default function CommunicationsPage() {
  const { user, googleAccessToken, connectGoogleWorkspace } = useAuth();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "templates">("inbox");
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [sentLogs, setSentLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Compose modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // User Confirmation modal before destructive/email sending
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch sent logs from Firestore
  const loadSentLogs = async () => {
    try {
      const q = query(collection(db, "emails"), orderBy("sentAt", "desc"), limit(20));
      const snap = await getDocs(q);
      const list: EmailLogItem[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          to: d.to || "",
          subject: d.subject || "",
          snippet: d.snippet || "",
          senderEmail: d.senderEmail || "",
          sentAt: d.sentAt || new Date().toISOString(),
        });
      });
      setSentLogs(list);
    } catch (e) {
      console.warn("Could not load sent logs from Firestore:", e);
    }
  };

  // Fetch Gmail inbox
  const loadInbox = async () => {
    if (!googleAccessToken) return;
    setLoading(true);
    setError(null);
    try {
      const fetched = await listGmailMessages({
        token: googleAccessToken,
        maxResults: 15,
      });
      setMessages(fetched);
    } catch (err: unknown) {
      console.error("Failed to load Gmail messages:", err);
      const message = err instanceof Error ? err.message : "Failed to load Gmail inbox.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken) {
      loadInbox();
    }
    loadSentLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleAccessToken]);

  const handleApplyTemplate = (tmpl: (typeof EMAIL_TEMPLATES)[0]) => {
    setSubject(tmpl.subject);
    setBody(`${tmpl.body}${user?.name || "Student"}`);
    setIsComposeOpen(true);
    setActiveTab("inbox");
  };

  // Trigger Confirmation Modal before real Gmail send
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) return;
    setShowConfirmModal(true);
  };

  // Execute Send after User Confirmation
  const handleConfirmedSend = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setError(null);
    try {
      if (googleAccessToken) {
        // Send real email via Gmail API
        await sendGmailMessage({
          token: googleAccessToken,
          to: recipient.trim(),
          subject: subject.trim(),
          body: body.trim(),
        });
      }

      // Persist to Firestore /emails
      const newLog = {
        to: recipient.trim(),
        subject: subject.trim(),
        snippet: body.slice(0, 100),
        senderEmail: user?.email || "user@alumni.edu",
        senderId: user?.firebaseUid || "local-user",
        sentAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "emails"), newLog);

      setSentLogs((prev) => [{ id: docRef.id, ...newLog }, ...prev]);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setIsComposeOpen(false);
        setRecipient("");
        setSubject("");
        setBody("");
      }, 1500);
    } catch (err: unknown) {
      console.error("Email send failed:", err);
      const message = err instanceof Error ? err.message : "Failed to send email via Gmail API.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.subject.toLowerCase().includes(q) ||
      m.from.toLowerCase().includes(q) ||
      m.snippet.toLowerCase().includes(q)
    );
  });

  return (
    <RoleShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-500/10 shadow-xs">
              <Mail size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Gmail & Alumni Communications
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={12} />
                  OAuth Verified
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Send official emails, browse inbox messages, and manage alumni outreach via Google Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!googleAccessToken ? (
              <button
                type="button"
                onClick={() => connectGoogleWorkspace()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Connect Google Account</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-medium">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Connected as {user?.email}</span>
              </div>
            )}

            <button
              onClick={() => setIsComposeOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Compose Email</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 w-full">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "inbox"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Inbox size={16} />
              <span>Gmail Inbox ({messages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "sent"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Send size={16} />
              <span>Sent History ({sentLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "templates"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText size={16} />
              <span>Email Templates</span>
            </button>
          </div>
        </div>

        {/* Search Bar for Inbox */}
        {activeTab === "inbox" && (
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inbox by subject, sender, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            {googleAccessToken && (
              <button
                onClick={loadInbox}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Gmail Inbox */}
        {activeTab === "inbox" && (
          <div>
            {!googleAccessToken ? (
              <Card padding="lg" className="text-center py-12 border-dashed">
                <Mail size={40} className="mx-auto text-slate-400 mb-3" />
                <h3 className="text-base font-semibold text-slate-900">
                  Google Workspace Connection Ready
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Connect your Google Account to view real Gmail messages and securely send emails directly to alumni and students.
                </p>
                <button
                  onClick={() => connectGoogleWorkspace()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <span>Connect with Google</span>
                </button>
              </Card>
            ) : loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-slate-200 h-20" />
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <Card padding="lg" className="text-center py-12">
                <Inbox size={36} className="mx-auto text-slate-400 mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">No messages found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery ? "No messages match your search query." : "Your Gmail inbox is clear or all caught up."}
                </p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {msg.from}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400">{msg.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 truncate mb-1">
                        {msg.subject}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {msg.snippet}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setRecipient(msg.from.includes("<") ? msg.from.split("<")[1].replace(">", "") : msg.from);
                        setSubject(`Re: ${msg.subject.replace(/^Re:\s*/i, "")}`);
                        setIsComposeOpen(true);
                      }}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Reply via Gmail
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sent History (Firestore Persisted) */}
        {activeTab === "sent" && (
          <div className="space-y-3">
            {sentLogs.length === 0 ? (
              <Card padding="lg" className="text-center py-12">
                <Send size={36} className="mx-auto text-slate-400 mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">No sent emails recorded</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Emails you compose and send will be logged here with timestamps and delivery details.
                </p>
              </Card>
            ) : (
              sentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900">
                        To: {log.to}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{log.subject}</h4>
                    <p className="text-xs text-slate-500 mt-1">{log.snippet}...</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                    <CheckCircle2 size={12} />
                    Delivered
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Outreach Templates */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EMAIL_TEMPLATES.map((tmpl, idx) => (
              <Card key={idx} padding="md" className="flex flex-col justify-between hover:border-red-300 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-red-600">
                    <FileText size={16} />
                    <h3 className="text-sm font-bold text-slate-900">{tmpl.title}</h3>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mb-2">
                    Subject: <span className="text-slate-800 font-semibold">{tmpl.subject}</span>
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-4 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4">
                    {tmpl.body}
                  </p>
                </div>
                <button
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Use This Template</span>
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* Compose Modal */}
        <AnimatePresence>
          {isComposeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-red-600" />
                    <h3 className="text-base font-bold text-slate-900">New Message</h3>
                  </div>
                  <button
                    onClick={() => setIsComposeOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleInitiateSend} className="p-6 space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                      <AlertCircle size={15} />
                      <span>{error}</span>
                    </div>
                  )}

                  {sendSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
                      <CheckCircle2 size={15} />
                      <span>Email successfully dispatched via Gmail API!</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alumni.member@university.edu"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alumni Mentorship Inquiry"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message Body <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Write your email message here..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsComposeOpen(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSending}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>{isSending ? "Sending..." : "Review & Send"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal before Sending Email */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <Send size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Confirm Sending Email</h3>
                    <p className="text-xs text-slate-500">
                      This will send a real email from your connected Gmail address.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                  <p><strong>To:</strong> {recipient}</p>
                  <p><strong>Subject:</strong> {subject}</p>
                  <p className="line-clamp-2 text-slate-500"><strong>Snippet:</strong> {body}</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmedSend}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Confirm & Send via Gmail
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </RoleShell>
  );
}
