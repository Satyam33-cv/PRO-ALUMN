"use client";

import React, { useState, useEffect } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileQuestion,
  Plus,
  ExternalLink,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  RefreshCw,
  X,
  AlertCircle,
  Link2,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  createGoogleForm,
  getGoogleFormResponses,
  GoogleFormResponse,
} from "@/lib/google-workspace";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface FormItem {
  id: string;
  formId?: string;
  title: string;
  description: string;
  responderUri?: string;
  category: string;
  createdBy: string;
  createdAt: string;
  responseCount?: number;
}

const DEFAULT_FORMS: FormItem[] = [
  {
    id: "form-1",
    formId: "1FAIpQLScReunion2026",
    title: "Alumni Homecoming & Reunion Registration 2026",
    description: "Register attendance, dietary preferences, and panel interests for our annual reunion gala.",
    responderUri: "https://docs.google.com/forms",
    category: "Events",
    createdBy: "Alumni Relations Office",
    createdAt: "2026-08-15T10:00:00Z",
    responseCount: 142,
  },
  {
    id: "form-2",
    formId: "1FAIpQLScMentorFeedback",
    title: "Mentorship Program Mid-Year Feedback Survey",
    description: "Share your experience as a student mentee or alumni mentor to help improve match pairings.",
    responderUri: "https://docs.google.com/forms",
    category: "Mentorship",
    createdBy: "Career Center",
    createdAt: "2026-08-10T14:30:00Z",
    responseCount: 89,
  },
  {
    id: "form-3",
    formId: "1FAIpQLScCareerSurvey",
    title: "Class of 2025 Career & Compensation Survey",
    description: "Anonymous survey gathering early career salaries, relocation hubs, and industry trends.",
    responderUri: "https://docs.google.com/forms",
    category: "Careers",
    createdBy: "Department of Computer Science",
    createdAt: "2026-08-01T09:00:00Z",
    responseCount: 215,
  },
];

export default function GoogleFormsPage() {
  const { user, googleAccessToken, signInWithGoogle } = useAuth();
  const [formsList, setFormsList] = useState<FormItem[]>(DEFAULT_FORMS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Surveys");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form responses modal
  const [viewingForm, setViewingForm] = useState<FormItem | null>(null);
  const [responses, setResponses] = useState<GoogleFormResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Load forms from Firestore
  const loadFormsFromFirestore = async () => {
    try {
      const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const items: FormItem[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: doc.id,
          formId: d.formId,
          title: d.title || "",
          description: d.description || "",
          responderUri: d.responderUri,
          category: d.category || "General",
          createdBy: d.createdBy || "Alumni Admin",
          createdAt: d.createdAt || new Date().toISOString(),
          responseCount: d.responseCount || 0,
        });
      });
      if (items.length > 0) {
        setFormsList([...items, ...DEFAULT_FORMS]);
      }
    } catch (e) {
      console.warn("Could not load forms from Firestore:", e);
    }
  };

  useEffect(() => {
    loadFormsFromFirestore();
  }, []);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      let createdFormId = `form-${Date.now()}`;
      let responderUri = "https://docs.google.com/forms";

      if (googleAccessToken) {
        // Create real Google Form via Google Forms API
        const created = await createGoogleForm({
          token: googleAccessToken,
          title: title.trim(),
          description: description.trim(),
        });
        createdFormId = created.formId;
        responderUri = created.responderUri || responderUri;
      }

      const newFormDoc: FormItem = {
        id: `form-item-${Date.now()}`,
        formId: createdFormId,
        title: title.trim(),
        description: description.trim(),
        responderUri,
        category,
        createdBy: user?.name || "Campus Administrator",
        createdAt: new Date().toISOString(),
        responseCount: 0,
      };

      // Save to Firestore /forms
      await addDoc(collection(db, "forms"), newFormDoc);

      setFormsList((prev) => [newFormDoc, ...prev]);
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      console.error("Failed to create Google Form:", err);
      setError(err.message || "Failed to create Google Form.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewResponses = async (form: FormItem) => {
    setViewingForm(form);
    if (!googleAccessToken || !form.formId || form.formId.startsWith("1FAIp")) {
      // Mock demonstration responses for pre-seeded forms
      setResponses([
        {
          responseId: "resp-1",
          createTime: "2026-08-20T14:20:00Z",
          lastSubmittedTime: "2026-08-20T14:20:00Z",
          answers: {
            q1: { questionId: "q1", textAnswers: { answers: [{ value: "Sarah Chen (Class of 2020)" }] } },
            q2: { questionId: "q2", textAnswers: { answers: [{ value: "Attending in-person, interested in AI panel" }] } },
          },
        },
        {
          responseId: "resp-2",
          createTime: "2026-08-21T09:15:00Z",
          lastSubmittedTime: "2026-08-21T09:15:00Z",
          answers: {
            q1: { questionId: "q1", textAnswers: { answers: [{ value: "David Park (Class of 2018)" }] } },
            q2: { questionId: "q2", textAnswers: { answers: [{ value: "Excited to connect with current students!" }] } },
          },
        },
      ]);
      return;
    }

    setLoadingResponses(true);
    try {
      const resps = await getGoogleFormResponses({
        token: googleAccessToken,
        formId: form.formId,
      });
      setResponses(resps);
    } catch (err) {
      console.warn("Could not fetch live Google Form responses:", err);
    } finally {
      setLoadingResponses(false);
    }
  };

  const filteredForms = formsList.filter((f) => {
    if (selectedCategory === "All") return true;
    return f.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <RoleShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-500/10 shadow-xs">
              <FileQuestion size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Google Forms & Alumni Surveys
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                  <Sparkles size={12} />
                  Google Workspace
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Collect alumni feedback, conduct program surveys, and manage event registrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!googleAccessToken && (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Connect Google</span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-700 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Google Form</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["All", "Events", "Mentorship", "Careers", "Surveys"].map((cat) => {
            const active = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredForms.map((item) => (
            <Card key={item.id} padding="lg" className="flex flex-col justify-between hover:border-purple-300 transition-all shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-xs font-semibold">
                    {item.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users size={14} className="text-purple-600" />
                  <span>{item.responseCount || responses.length || 0} Submissions</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewResponses(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <BarChart3 size={13} />
                    <span>View Analytics</span>
                  </button>

                  <a
                    href={item.responderUri || "https://docs.google.com/forms"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-purple-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Open Form</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Google Form Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <FileQuestion size={18} className="text-purple-600" />
                    <h3 className="text-base font-bold text-slate-900">Create New Google Form</h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateForm} className="p-6 space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                      <AlertCircle size={15} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Form Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026 Alumni Career Survey"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="Events">Events</option>
                      <option value="Mentorship">Mentorship</option>
                      <option value="Careers">Careers</option>
                      <option value="Surveys">Surveys</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description & Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief instructions for respondents..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div className="p-3 bg-purple-50 text-purple-800 text-xs rounded-xl border border-purple-200">
                    <p className="font-semibold mb-0.5">Automated Template Setup</p>
                    <p className="text-purple-600">
                      Standard questions (Full Name, Batch Year, Feedback) will be added automatically via Google Forms batchUpdate API.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles size={15} />
                      <span>{isCreating ? "Creating in Google Workspace..." : "Create Form"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Responses / Analytics Modal */}
        <AnimatePresence>
          {viewingForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-purple-600" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{viewingForm.title}</h3>
                      <p className="text-xs text-slate-500">Google Forms Submissions & Insights</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingForm(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <p className="text-xs font-semibold text-purple-700">Total Responses</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {viewingForm.responseCount || responses.length || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-700">Status</p>
                      <p className="text-2xl font-bold text-emerald-900 mt-1">Active</p>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
                    Recent Submissions
                  </h4>

                  {loadingResponses ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Loading submissions from Google Forms API...
                    </div>
                  ) : responses.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No submissions recorded yet for this form.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {responses.map((r, i) => (
                        <div key={r.responseId || i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-semibold text-slate-700">Submission #{i + 1}</span>
                            <span>{new Date(r.lastSubmittedTime).toLocaleString()}</span>
                          </div>
                          {r.answers &&
                            Object.entries(r.answers).map(([qid, ans]) => (
                              <p key={qid} className="text-slate-800">
                                <strong>Answer:</strong> {ans.textAnswers?.answers?.[0]?.value || "—"}
                              </p>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingForm(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Close
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
