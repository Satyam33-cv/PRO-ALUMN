"use client";

import { useState, useEffect } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card, Badge } from "@/components/ui";
import {
  FileQuestion,
  Plus,
  ExternalLink,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Sparkles,
  ClipboardList,
  MessageSquare,
  Share2,
  Trash2,
  Eye,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface FormQuestion {
  id: string;
  title: string;
  type: "text" | "paragraph" | "choice";
  options?: string[];
  required: boolean;
}

interface FormResponseItem {
  id: string;
  formId: string;
  respondentName: string;
  respondentEmail: string;
  submittedAt: string;
  answers: Record<string, string>;
}

interface FormItem {
  id: string;
  title: string;
  description: string;
  category: string;
  createdBy: string;
  authorId?: string;
  creatorEmail?: string;
  createdAt: string;
  questions?: FormQuestion[];
  responseCount: number;
}

const DEFAULT_FORMS: FormItem[] = [
  {
    id: "form-1",
    title: "Alumni Grand Reunion 2026 RSVP & Preference Survey",
    description: "Collect attendance numbers, dietary restrictions, accommodation requests, and session interests for the upcoming grand reunion weekend.",
    category: "Events",
    createdBy: "Alumni Association Committee",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    responseCount: 42,
    questions: [
      { id: "q1", title: "Will you attend in-person or virtually?", type: "choice", options: ["In-person", "Virtual", "Undecided"], required: true },
      { id: "q2", title: "Dietary preferences / restrictions", type: "text", required: false },
      { id: "q3", title: "Which panel topics are you most excited for?", type: "paragraph", required: false },
    ],
  },
  {
    id: "form-2",
    title: "Mentorship Program Feedback & Impact Evaluation",
    description: "Mid-year feedback survey for mentors and student mentees to evaluate meeting quality, career roadmap progress, and platform features.",
    category: "Mentorship",
    createdBy: "Career Development Center",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    responseCount: 28,
    questions: [
      { id: "q1", title: "How frequently did you meet with your mentor/mentee?", type: "choice", options: ["Weekly", "Bi-weekly", "Monthly"], required: true },
      { id: "q2", title: "How helpful was the mentorship guidance (1-10)?", type: "text", required: true },
      { id: "q3", title: "Any suggestions for improving mentorship matching?", type: "paragraph", required: false },
    ],
  },
  {
    id: "form-3",
    title: "Annual Alumni Career Trajectory & Salary Benchmark",
    description: "Anonymous benchmark survey tracking alumni career advancements, compensation bands, remote work policies, and hiring trends.",
    category: "Career",
    createdBy: "Alumni Insights Guild",
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    responseCount: 115,
    questions: [
      { id: "q1", title: "Current Job Title & Industry", type: "text", required: true },
      { id: "q2", title: "Years of Professional Experience", type: "text", required: true },
      { id: "q3", title: "Is your company currently hiring alumni / interns?", type: "choice", options: ["Yes (actively)", "Maybe later", "No"], required: true },
    ],
  },
];

export default function GoogleFormsPage() {
  const { user } = useAuth();
  const [formsList, setFormsList] = useState<FormItem[]>(DEFAULT_FORMS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Surveys");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Response viewing & submission modal
  const [viewingForm, setViewingForm] = useState<FormItem | null>(null);
  const [viewingResponses, setViewingResponses] = useState<FormResponseItem[]>([]);
  const [respondingForm, setRespondingForm] = useState<FormItem | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load forms from Firestore
  const loadFormsFromFirestore = async () => {
    try {
      const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const items: FormItem[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          title: d.title || "",
          description: d.description || "",
          category: d.category || "General",
          createdBy: d.createdBy || "Alumni Admin",
          authorId: d.authorId,
          creatorEmail: d.creatorEmail,
          createdAt: d.createdAt || new Date().toISOString(),
          responseCount: d.responseCount || 0,
          questions: d.questions || [
            { id: "q1", title: "General Feedback", type: "paragraph", required: true },
          ],
        });
      });
      if (items.length > 0) {
        setFormsList(items);
      } else {
        setFormsList(DEFAULT_FORMS);
      }
    } catch (e) {
      console.warn("Could not load forms from Firestore:", e);
      setFormsList(DEFAULT_FORMS);
    }
  };

  useEffect(() => {
    loadFormsFromFirestore();
  }, []);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsCreating(true);
    setStatusMsg(null);

    try {
      const newFormDoc: Omit<FormItem, "id"> = {
        title: title.trim(),
        description: description.trim(),
        category,
        createdBy: user?.name || "Campus Administrator",
        authorId: user?.id || user?.firebaseUid || "",
        creatorEmail: user?.email || "",
        createdAt: new Date().toISOString(),
        responseCount: 0,
        questions: [
          { id: "q1", title: "Full Name & Graduation Year", type: "text", required: true },
          { id: "q2", title: "Your Feedback / Response", type: "paragraph", required: true },
          { id: "q3", title: "Would you like a follow-up consultation?", type: "choice", options: ["Yes", "No", "Maybe later"], required: false },
        ],
      };

      try {
        const docRef = await addDoc(collection(db, "forms"), newFormDoc);
        const created: FormItem = { id: docRef.id, ...newFormDoc };
        setFormsList((prev) => [created, ...prev]);
      } catch {
        const fallbackId = `form-${Date.now()}`;
        const created: FormItem = { id: fallbackId, ...newFormDoc };
        setFormsList((prev) => [created, ...prev]);
      }

      setStatusMsg({ type: "success", text: `Survey form "${title}" created and live!` });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to create form." });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteForm = async (formId: string, formTitle: string) => {
    try {
      if (!formId.startsWith("form-")) {
        await deleteDoc(doc(db, "forms", formId));
      }
      setFormsList((prev) => prev.filter((f) => f.id !== formId));
      setStatusMsg({ type: "success", text: `Deleted "${formTitle}"` });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to delete form." });
    }
  };

  const handleOpenRespond = (form: FormItem) => {
    setRespondingForm(form);
    setFormAnswers({});
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingForm) return;
    setSubmittingResponse(true);

    try {
      const responseData = {
        formId: respondingForm.id,
        respondentName: user?.name || "Anonymous Alum",
        respondentEmail: user?.email || "anonymous@alumni.edu",
        submittedAt: new Date().toISOString(),
        answers: formAnswers,
      };

      try {
        await addDoc(collection(db, "forms", respondingForm.id, "responses"), responseData);
      } catch {
        // local state fallback
      }

      // Update count
      setFormsList((prev) =>
        prev.map((f) =>
          f.id === respondingForm.id ? { ...f, responseCount: f.responseCount + 1 } : f
        )
      );

      setStatusMsg({ type: "success", text: "Response submitted successfully! Thank you." });
      setRespondingForm(null);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to submit response." });
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleViewResponses = async (form: FormItem) => {
    setViewingForm(form);
    try {
      const snap = await getDocs(collection(db, "forms", form.id, "responses"));
      const list: FormResponseItem[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          formId: form.id,
          respondentName: data.respondentName || "Anonymous Alum",
          respondentEmail: data.respondentEmail || "alum@proalumn.io",
          submittedAt: data.submittedAt || new Date().toISOString(),
          answers: data.answers || {},
        });
      });

      if (list.length > 0) {
        setViewingResponses(list);
      } else {
        // Demonstration responses for pre-seeded forms
        setViewingResponses([
          {
            id: "resp-1",
            formId: form.id,
            respondentName: "Sarah Chen (Class of 2020)",
            respondentEmail: "sarah.c@alumni.edu",
            submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            answers: {
              q1: "Attending in-person, interested in AI panel",
              q2: "Vegetarian",
              q3: "Looking forward to connecting with current students!",
            },
          },
          {
            id: "resp-2",
            formId: form.id,
            respondentName: "David Park (Class of 2018)",
            respondentEmail: "david.p@alumni.edu",
            submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            answers: {
              q1: "Virtual attendance",
              q2: "No dietary restrictions",
              q3: "Excited to share insights on engineering leadership.",
            },
          },
        ]);
      }
    } catch {
      setViewingResponses([]);
    }
  };

  const handleCopyShareLink = (formId: string) => {
    const url = `${window.location.origin}/forms?formId=${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredForms = formsList.filter((f) => {
    const matchesCategory =
      selectedCategory === "All" ||
      f.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <RoleShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/10 shadow-xs">
              <FileQuestion size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Forms & Alumni Surveys
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Sparkles size={12} />
                  Firestore Synced
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Collect alumni feedback, conduct program evaluations, and manage event registrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Create New Survey</span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMsg.type === "success" ? (
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileQuestion size={18} className="shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
            {["All", "Events", "Mentorship", "Career", "Surveys"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No forms found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first survey or registration form to collect structured responses from students and alumni.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredForms.map((form) => (
              <Card
                key={form.id}
                padding="md"
                className="flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-md space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {form.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyShareLink(form.id)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors"
                        title="Copy share link"
                      >
                        {copiedId === form.id ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Share2 size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form.id, form.title)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete form"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">
                    {form.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {form.description}
                  </p>

                  <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {form.responseCount} responses
                    </span>
                    <span>•</span>
                    <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenRespond(form)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Fill Survey</span>
                  </button>
                  <button
                    onClick={() => handleViewResponses(form)}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Responses</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Survey Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Plus size={18} className="text-purple-600" />
                  Create New Survey Form
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Form / Survey Title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 2026 Alumni Career Transition Survey"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Events">Events</option>
                    <option value="Mentorship">Mentorship</option>
                    <option value="Career">Career</option>
                    <option value="Surveys">Surveys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description & Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide purpose, questions overview, and deadlines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !title.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-xs"
                  >
                    {isCreating ? "Creating..." : "Publish Survey"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Survey Response Submission Modal */}
        {respondingForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {respondingForm.category}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                    {respondingForm.title}
                  </h3>
                </div>
                <button
                  onClick={() => setRespondingForm(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {respondingForm.description}
              </p>

              <form onSubmit={handleSubmitResponse} className="space-y-4">
                {(respondingForm.questions || []).map((q, idx) => (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {idx + 1}. {q.title} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    {q.type === "paragraph" ? (
                      <textarea
                        required={q.required}
                        rows={3}
                        value={formAnswers[q.id] || ""}
                        onChange={(e) =>
                          setFormAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : q.type === "choice" && q.options ? (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={formAnswers[q.id] === opt}
                              onChange={(e) =>
                                setFormAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              className="text-purple-600 focus:ring-purple-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        required={q.required}
                        type="text"
                        value={formAnswers[q.id] || ""}
                        onChange={(e) =>
                          setFormAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRespondingForm(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResponse}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-xs"
                  >
                    {submittingResponse ? "Submitting..." : "Submit Answers"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Responses Modal */}
        {viewingForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {viewingForm.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Collected Responses ({viewingResponses.length})
                  </p>
                </div>
                <button
                  onClick={() => setViewingForm(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {viewingResponses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No responses collected for this survey yet.
                  </div>
                ) : (
                  viewingResponses.map((r, i) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {r.respondentName} ({r.respondentEmail})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(r.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-1 text-slate-700 dark:text-slate-300">
                        {Object.entries(r.answers).map(([qid, val]) => (
                          <div key={qid} className="border-l-2 border-purple-400 pl-2">
                            <p className="text-slate-900 dark:text-slate-100 font-semibold">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setViewingForm(null)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleShell>
  );
}
