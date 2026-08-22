"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  ExternalLink,
  Search,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FilePlus2,
  FolderOpen,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  createGoogleDoc,
  getGoogleDoc,
  insertDocText,
  listUserDocsFromDrive,
  GoogleDocDetails,
} from "@/lib/google-workspace";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

interface SavedDocRef {
  id: string;
  docId: string;
  title: string;
  category: string;
  author: string;
  createdAt: string;
}

export function DocsContent() {
  const { user, accessToken, signInWithGoogle } = useAuth();
  const [docsList, setDocsList] = useState<SavedDocRef[]>([]);
  const [driveDocs, setDriveDocs] = useState<
    Array<{ id: string; name: string; modifiedTime: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<GoogleDocDetails | null>(null);
  const [docLoading, setDocLoading] = useState(false);

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
      // 1. Fetch from Firestore
      try {
        const q = query(collection(db, "docs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const docs: SavedDocRef[] = [];
        snapshot.forEach((docSnap) => {
          docs.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setDocsList(docs);
      } catch (err) {
        console.warn("Could not fetch docs from Firestore:", err);
      }

      // 2. Fetch directly from Google Drive if token is available
      if (accessToken) {
        try {
          const driveFiles = await listUserDocsFromDrive({ token: accessToken });
          setDriveDocs(driveFiles);
        } catch (err) {
          console.warn("Could not fetch drive docs:", err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [accessToken]);

  const handleSelectDoc = async (documentId: string) => {
    if (!accessToken) return;
    setDocLoading(true);
    setStatusMsg(null);
    try {
      const doc = await getGoogleDoc({ token: accessToken, documentId });
      setActiveDoc(doc);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to load Google Doc content.",
      });
    } finally {
      setDocLoading(false);
    }
  };

  const handleCreateDocSubmit = () => {
    if (!newTitle.trim()) return;

    setConfirmModal({
      title: "Create Google Document",
      description: `You are about to create a new Google Doc named "${newTitle.trim()}" in your Google Drive.`,
      action: async () => {
        if (!accessToken) return;
        setSubmitting(true);
        try {
          const created = await createGoogleDoc({
            token: accessToken,
            title: newTitle.trim(),
            initialContent:
              initialContent.trim() ||
              `Alumni Network Document: ${newTitle.trim()}\nAuthor: ${
                user?.name || "Member"
              }\nCreated: ${new Date().toLocaleDateString()}`,
          });

          // Save reference to Firestore
          try {
            await addDoc(collection(db, "docs"), {
              docId: created.documentId,
              title: created.title || newTitle.trim(),
              category: newCategory,
              author: user?.name || "Alumni Member",
              authorId: user?.id || "",
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn("Could not save doc reference to Firestore:", e);
          }

          setStatusMsg({
            type: "success",
            text: `Document "${newTitle}" created successfully!`,
          });
          setIsCreating(false);
          setNewTitle("");
          setInitialContent("");
          loadDocuments();
          handleSelectDoc(created.documentId);
        } catch (err: any) {
          setStatusMsg({
            type: "error",
            text: err.message || "Failed to create Google Doc.",
          });
        } finally {
          setSubmitting(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleAppendContent = () => {
    if (!appendText.trim() || !activeDoc || !accessToken) return;

    setConfirmModal({
      title: "Append Text to Google Doc",
      description: `You are about to insert text into "${activeDoc.title}". This will modify the document in Google Drive.`,
      action: async () => {
        setAppending(true);
        try {
          await insertDocText({
            token: accessToken,
            documentId: activeDoc.documentId,
            text: `\n\n[${new Date().toLocaleString()} - ${
              user?.name || "Member"
            }]\n${appendText.trim()}`,
            index: 1,
          });
          setAppendText("");
          setStatusMsg({
            type: "success",
            text: "Text added to document!",
          });
          // Refresh active doc
          await handleSelectDoc(activeDoc.documentId);
        } catch (err: any) {
          setStatusMsg({
            type: "error",
            text: err.message || "Failed to append text.",
          });
        } finally {
          setAppending(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Helper to extract text from Google Doc structure
  const extractDocText = (doc: GoogleDocDetails): string => {
    if (!doc.body?.content) return "No content in document.";
    let fullText = "";
    doc.body.content.forEach((elem) => {
      if (elem.paragraph?.elements) {
        elem.paragraph.elements.forEach((el) => {
          if (el.textRun?.content) {
            fullText += el.textRun.content;
          }
        });
      }
    });
    return fullText || "(Empty Document)";
  };

  const filteredDocs = docsList.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <FileText size={22} />
            </span>
            <h1 className="font-display text-3xl font-bold text-ink">
              Google Docs
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink/60 max-w-2xl">
            Collaborate on alumni newsletter drafts, mentorship agreements,
            reunion meeting minutes, and career guides in Google Docs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {accessToken ? (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brass hover:bg-ink text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              New Google Doc
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink/15 bg-white hover:bg-paper text-ink text-sm font-medium transition-colors shadow-sm"
            >
              <FilePlus2 size={16} className="text-blue-500" />
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Auth Banner if not logged in with Google */}
      {!accessToken && (
        <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-ink text-base">
                Connect your Google Workspace Account
              </h3>
              <p className="text-sm text-ink/60">
                Sign in with Google to create and sync real Google Docs directly
                inside the alumni network.
              </p>
            </div>
          </div>
          <button
            onClick={signInWithGoogle}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shrink-0 shadow-sm"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* Feedback message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Docs Directory & Drive Files */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-ink/10 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
                <BookOpen size={18} className="text-brass" />
                Community Documents
              </h2>
              <button
                onClick={loadDocuments}
                disabled={loading}
                className="p-1.5 rounded-md text-ink/40 hover:text-ink hover:bg-paper transition-colors"
                title="Refresh documents"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-ink/15 bg-paper/30 outline-none focus:border-brass"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-ink/40">
                Loading Google Docs...
              </div>
            ) : filteredDocs.length === 0 && driveDocs.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-ink/10 rounded-xl bg-paper/20">
                <FileText size={28} className="mx-auto text-ink/30" />
                <p className="text-sm font-medium text-ink/70">
                  No documents found
                </p>
                <p className="text-xs text-ink/50 max-w-xs mx-auto">
                  Click &quot;New Google Doc&quot; above to start your first
                  collaborative document.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc.docId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      activeDoc?.documentId === doc.docId
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-ink/10 hover:border-ink/20 hover:bg-paper/40"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {doc.category}
                        </span>
                        <span className="text-[11px] text-ink/40">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-ink truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-ink/50">By {doc.author}</p>
                    </div>

                    <a
                      href={`https://docs.google.com/document/d/${doc.docId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-ink/40 hover:text-blue-600 transition-colors"
                      title="Open in Google Docs"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                ))}

                {driveDocs.length > 0 && (
                  <div className="pt-3 border-t border-ink/10 mt-3">
                    <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FolderOpen size={13} />
                      Your Google Drive Docs
                    </p>
                    {driveDocs.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => handleSelectDoc(file.id)}
                        className={`p-2.5 rounded-lg border mb-1.5 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          activeDoc?.documentId === file.id
                            ? "border-blue-500 bg-blue-50/40"
                            : "border-transparent hover:bg-paper/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-blue-500 shrink-0" />
                          <span className="text-xs font-medium text-ink truncate">
                            {file.name}
                          </span>
                        </div>
                        <a
                          href={`https://docs.google.com/document/d/${file.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-ink/40 hover:text-blue-600"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doc Templates Preset Card */}
          <div className="p-5 rounded-2xl border border-ink/10 bg-gradient-to-br from-paper/80 to-paper/30 space-y-3">
            <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
              <Sparkles size={16} className="text-brass" />
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
                  className="p-3 text-left rounded-xl border border-ink/10 bg-white hover:border-brass hover:shadow-xs transition-all text-xs space-y-1 cursor-pointer"
                >
                  <p className="font-semibold text-ink">{tpl.title}</p>
                  <p className="text-[10px] text-ink/50">{tpl.cat}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview / Reader & Writer */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-ink/10 p-6 shadow-sm min-h-[560px] flex flex-col justify-between">
            {docLoading ? (
              <div className="py-24 text-center text-ink/40 text-sm space-y-2">
                <RefreshCw size={24} className="mx-auto animate-spin text-blue-500" />
                <p>Loading document contents from Google Docs...</p>
              </div>
            ) : activeDoc ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-ink">
                      {activeDoc.title}
                    </h2>
                    <p className="text-xs text-ink/40 mt-0.5">
                      Doc ID: {activeDoc.documentId}
                    </p>
                  </div>
                  <a
                    href={`https://docs.google.com/document/d/${activeDoc.documentId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink size={13} />
                    Open in Docs
                  </a>
                </div>

                {/* Document Body */}
                <div className="p-5 rounded-xl bg-paper/40 border border-ink/10 max-h-[340px] overflow-y-auto font-serif text-sm leading-relaxed text-ink/85 whitespace-pre-wrap">
                  {extractDocText(activeDoc)}
                </div>

                {/* Append Section */}
                {accessToken && (
                  <div className="pt-4 border-t border-ink/10 space-y-3">
                    <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      <Edit3 size={14} className="text-brass" />
                      Append Note or Paragraph to Document
                    </label>
                    <textarea
                      value={appendText}
                      onChange={(e) => setAppendText(e.target.value)}
                      placeholder="Write feedback, additions, or minutes to insert into this Google Doc..."
                      rows={3}
                      className="w-full p-3 rounded-xl border border-ink/15 text-sm bg-paper/20 outline-none focus:border-brass"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAppendContent}
                        disabled={appending || !appendText.trim()}
                        className="px-4 py-2 rounded-full bg-brass hover:bg-ink text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        {appending ? "Inserting..." : "Insert into Google Doc"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="my-auto py-16 text-center space-y-3">
                <FileText size={40} className="mx-auto text-ink/20" />
                <h3 className="font-display text-lg font-semibold text-ink/70">
                  Select a Google Doc to preview
                </h3>
                <p className="text-xs text-ink/40 max-w-sm mx-auto">
                  Choose a document from the left list or create a new one to
                  view live content and append notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-display text-xl font-bold text-ink flex items-center gap-2">
                <FilePlus2 size={20} className="text-brass" />
                Create New Google Doc
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-ink/40 hover:text-ink text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fall Reunion Planning Notes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ink/15 outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ink/15 bg-white outline-none focus:border-brass"
                >
                  <option value="General">General</option>
                  <option value="Mentorship">Mentorship</option>
                  <option value="Events">Events</option>
                  <option value="Career">Career</option>
                  <option value="Publishing">Publishing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Initial Content / Outline
                </label>
                <textarea
                  rows={4}
                  placeholder="Initial outline or notes for the document..."
                  value={initialContent}
                  onChange={(e) => setInitialContent(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg border border-ink/15 outline-none focus:border-brass"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-semibold text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocSubmit}
                disabled={submitting || !newTitle.trim()}
                className="px-5 py-2 rounded-full bg-brass hover:bg-ink text-white text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {submitting ? "Creating..." : "Create in Google Drive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Destructive / Mutating Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-ink">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-ink/70">{confirmModal.description}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-ink/10">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-semibold text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action}
                className="px-5 py-2 rounded-full bg-brass hover:bg-ink text-white text-xs font-semibold transition-colors"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
