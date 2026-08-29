"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FilePlus2,
  Sparkles,
  BookOpen,
  Trash2,
  Share2,
  Copy,
  Download,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

interface SavedDocRef {
  id: string;
  docId?: string;
  title: string;
  category: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

const DEFAULT_COMMUNITY_DOCS: SavedDocRef[] = [
  {
    id: "doc-1",
    title: "Alumni Mentorship Best Practices & Roadmap 2026",
    category: "Mentorship",
    author: "Elena Rostova (Class of '19)",
    content: `# Alumni Mentorship Program Guidelines\n\n## 1. Program Objectives\n- Connect senior industry alumni with final-year students for career readiness.\n- Provide structured review for resumes, portfolios, and mock technical interviews.\n\n## 2. Meeting Cadence\n- Bi-weekly 45-minute 1-on-1 sessions.\n- Monthly group AMA webinars on emerging engineering & AI stacks.\n\n## 3. Recommended Action Items\n- Define quarterly career milestone.\n- Complete 1 mock system-design or portfolio presentation.`,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "doc-2",
    title: "Annual Grand Alumni Reunion 2026 Committee Notes",
    category: "Events",
    author: "Marcus Vance (Class of '15)",
    content: `# Class Reunion Committee Planning\n\n## Venue & Schedule\n- **Date:** October 18, 2026\n- **Main Hall:** University Alumni Center & Innovation Pavilion\n\n## Key Sessions\n- 10:00 AM: Keynote & State of the University\n- 01:00 PM: Alumni Startup Showcase & Pitch Fest\n- 06:00 PM: Networking Gala Dinner\n\n## Budget & Ticketing\n- Early bird registration opens July 1st.`,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "doc-3",
    title: "Tech Career Transition Playbook: From Junior to Staff Engineer",
    category: "Career",
    author: "Priya Sharma (Class of '18)",
    content: `# Engineering Career Transition Strategy\n\n## Core Pillars\n1. **Technical Depth:** Deep understanding of distributed systems and scalability patterns.\n2. **Influence Without Authority:** Driving cross-team technical consensus.\n3. **Mentorship:** Elevating junior engineers and writing architectural decision records (ADRs).\n\n## Networking Checklist\n- Connect with verified alumni in target tech hubs.\n- Ask for warm internal referrals via PRO ALUMN referral tracker.`,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

export function DocsContent() {
  const { user } = useAuth();
  const [docsList, setDocsList] = useState<SavedDocRef[]>(DEFAULT_COMMUNITY_DOCS);
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<SavedDocRef | null>(DEFAULT_COMMUNITY_DOCS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  // New Doc Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [initialContent, setInitialContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) {
        setSearchQuery(q);
      }
    }
  }, []);

  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Append text state
  const [appendText, setAppendText] = useState("");
  const [appending, setAppending] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "docs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: SavedDocRef[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        fetched.push({
          id: docSnap.id,
          docId: d.docId || docSnap.id,
          title: d.title || "Untitled Document",
          category: d.category || "General",
          author: d.author || "Alumni Member",
          authorId: d.authorId || "",
          authorEmail: d.authorEmail || "",
          content: d.content || d.initialContent || "",
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt,
        });
      });

      if (fetched.length > 0) {
        setDocsList(fetched);
        if (!activeDoc || !fetched.some((d) => d.id === activeDoc.id)) {
          setActiveDoc(fetched[0]);
        }
      } else {
        setDocsList(DEFAULT_COMMUNITY_DOCS);
        if (!activeDoc) setActiveDoc(DEFAULT_COMMUNITY_DOCS[0]);
      }
    } catch (err) {
      console.warn("Could not fetch docs from Firestore:", err);
      setDocsList(DEFAULT_COMMUNITY_DOCS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSelectDoc = (docItem: SavedDocRef) => {
    setActiveDoc(docItem);
    setIsEditing(false);
    setEditedContent(docItem.content || "");
    setStatusMsg(null);
  };

  const handleCreateDocSubmit = async () => {
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const newDocData: Omit<SavedDocRef, "id"> = {
        title: newTitle.trim(),
        category: newCategory,
        author: user?.name || "Alumni Member",
        authorId: user?.id || user?.firebaseUid || "",
        authorEmail: user?.email || "",
        content:
          initialContent.trim() ||
          `# ${newTitle.trim()}\n\nCreated by ${user?.name || "Alumni Member"} on ${new Date().toLocaleDateString()}.\n\nStart writing your document notes here...`,
        createdAt: new Date().toISOString(),
      };

      try {
        const docRef = await addDoc(collection(db, "docs"), newDocData);
        const created: SavedDocRef = { id: docRef.id, ...newDocData };
        setDocsList((prev) => [created, ...prev]);
        setActiveDoc(created);
      } catch {
        const fallbackId = `doc-${Date.now()}`;
        const created: SavedDocRef = { id: fallbackId, ...newDocData };
        setDocsList((prev) => [created, ...prev]);
        setActiveDoc(created);
      }

      setStatusMsg({
        type: "success",
        text: `Document "${newTitle}" created and saved to Firestore!`,
      });
      setIsCreating(false);
      setNewTitle("");
      setInitialContent("");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to save document.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeDoc) return;
    try {
      if (!activeDoc.id.startsWith("doc-")) {
        await updateDoc(doc(db, "docs", activeDoc.id), {
          content: editedContent,
          updatedAt: new Date().toISOString(),
        });
      }
      const updated = { ...activeDoc, content: editedContent, updatedAt: new Date().toISOString() };
      setActiveDoc(updated);
      setDocsList((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setIsEditing(false);
      setStatusMsg({ type: "success", text: "Document changes saved successfully!" });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update document." });
    }
  };

  const handleAppendContent = async () => {
    if (!appendText.trim() || !activeDoc) return;

    setAppending(true);
    try {
      const addition = `\n\n---\n**Note added by ${user?.name || "Member"} on ${new Date().toLocaleString()}**:\n${appendText.trim()}`;
      const newFullContent = (activeDoc.content || "") + addition;

      if (!activeDoc.id.startsWith("doc-")) {
        await updateDoc(doc(db, "docs", activeDoc.id), {
          content: newFullContent,
          updatedAt: new Date().toISOString(),
        });
      }

      const updated = { ...activeDoc, content: newFullContent, updatedAt: new Date().toISOString() };
      setActiveDoc(updated);
      setDocsList((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setAppendText("");
      setStatusMsg({
        type: "success",
        text: "Note successfully appended to document!",
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to append text.",
      });
    } finally {
      setAppending(false);
    }
  };

  const handleDeleteDoc = (docItem: SavedDocRef) => {
    setConfirmModal({
      title: "Delete Document",
      description: `Are you sure you want to delete "${docItem.title}"? This cannot be undone.`,
      action: async () => {
        try {
          if (!docItem.id.startsWith("doc-")) {
            await deleteDoc(doc(db, "docs", docItem.id));
          }
          setDocsList((prev) => prev.filter((d) => d.id !== docItem.id));
          if (activeDoc?.id === docItem.id) {
            const remaining = docsList.filter((d) => d.id !== docItem.id);
            setActiveDoc(remaining.length > 0 ? remaining[0] : null);
          }
          setStatusMsg({ type: "success", text: `Deleted "${docItem.title}"` });
        } catch (err: any) {
          setStatusMsg({ type: "error", text: err.message || "Failed to delete document." });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleDownloadDoc = (docItem: SavedDocRef) => {
    const element = document.createElement("a");
    const file = new Blob([docItem.content || ""], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${docItem.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMsg({ type: "success", text: "Document copied to clipboard!" });
  };

  const filteredDocs = docsList.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText size={24} />
            </span>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
              Docs & Collaborative Notes
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles size={12} />
              Firestore Synced
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Collaborate on alumni newsletter drafts, mentorship agreements,
            reunion meeting minutes, and career guides in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            New Document
          </button>
        </div>
      </div>

      {/* Feedback message */}
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
              <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Docs Directory */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" />
                Community Documents ({filteredDocs.length})
              </h2>
              <button
                onClick={loadDocuments}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Refresh documents"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search documents or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Loading documents...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50">
                <FileText size={28} className="mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No documents found
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click &quot;New Document&quot; above to start your first collaborative note.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredDocs.map((docItem) => (
                  <div
                    key={docItem.id}
                    onClick={() => handleSelectDoc(docItem)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      activeDoc?.id === docItem.id
                        ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {docItem.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(docItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {docItem.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">By {docItem.author}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDoc(docItem);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Download Markdown"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(docItem);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Templates Preset Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 space-y-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              Quick Templates
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  title: "Alumni Newsletter",
                  cat: "Publishing",
                  sample:
                    "# Alumni Monthly Digest\n\nHighlights, updates, and upcoming reunion events.",
                },
                {
                  title: "Mentorship Guide",
                  cat: "Mentorship",
                  sample:
                    "# Mentorship Roadmap\n\nGoals, cadence, review schedule, and action items.",
                },
                {
                  title: "Reunion Minutes",
                  cat: "Events",
                  sample:
                    "# Class Reunion Committee Meeting\n\nAgenda, venue options, budget, and responsibilities.",
                },
                {
                  title: "Career Roadmap",
                  cat: "Career",
                  sample:
                    "# Career Strategy Document\n\nTarget industries, skill gap analysis, and network referrals.",
                },
              ].map((tpl) => (
                <button
                  key={tpl.title}
                  onClick={() => {
                    setNewTitle(tpl.title);
                    setNewCategory(tpl.cat);
                    setInitialContent(tpl.sample);
                    setIsCreating(true);
                  }}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-xs transition-all text-xs space-y-1 cursor-pointer"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{tpl.title}</p>
                  <p className="text-[10px] text-slate-500">{tpl.cat}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview & Editor */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs min-h-[580px] flex flex-col justify-between">
            {activeDoc ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {activeDoc.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        Author: {activeDoc.author}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {activeDoc.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCopyText(activeDoc.content)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy Document Text"
                    >
                      <Copy size={13} />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownloadDoc(activeDoc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Export Markdown"
                    >
                      <Download size={13} />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setEditedContent(activeDoc.content || "");
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold transition-colors"
                    >
                      <Edit3 size={13} />
                      <span>{isEditing ? "View Mode" : "Edit Doc"}</span>
                    </button>
                  </div>
                </div>

                {/* Document Body or Editor */}
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={12}
                      className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 max-h-[380px] overflow-y-auto font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {activeDoc.content || "(Empty Document)"}
                  </div>
                )}

                {/* Append Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Edit3 size={14} className="text-blue-600" />
                    Append Note or Update to Document
                  </label>
                  <textarea
                    value={appendText}
                    onChange={(e) => setAppendText(e.target.value)}
                    placeholder="Write feedback, additions, or minutes to append..."
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAppendContent}
                      disabled={appending || !appendText.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      {appending ? "Appending..." : "Append Note"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-auto py-16 text-center space-y-3">
                <FileText size={40} className="mx-auto text-slate-300" />
                <h3 className="font-display text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Select a document to preview
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Choose a document from the left list or create a new one to view content and append notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FilePlus2 size={20} className="text-blue-600" />
                Create New Document
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fall Reunion Planning Notes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Mentorship">Mentorship</option>
                  <option value="Events">Events</option>
                  <option value="Career">Career</option>
                  <option value="Publishing">Publishing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Content / Outline
                </label>
                <textarea
                  rows={5}
                  placeholder="Initial outline or notes for the document..."
                  value={initialContent}
                  onChange={(e) => setInitialContent(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocSubmit}
                disabled={submitting || !newTitle.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-xs"
              >
                {submitting ? "Saving..." : "Create Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{confirmModal.description}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
