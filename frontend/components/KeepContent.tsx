"use client";

import { useState, useEffect } from "react";
import {
  StickyNote,
  Plus,
  Pin,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Share2,
  FileText,
  Mail,
  Palette,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface KeepNote {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
  pinned: boolean;
  authorId: string;
  createdAt: string;
}

const NOTE_COLORS = [
  { name: "Default", bg: "bg-white", border: "border-ink/10" },
  { name: "Amber", bg: "bg-amber-50", border: "border-amber-200" },
  { name: "Emerald", bg: "bg-emerald-50", border: "border-emerald-200" },
  { name: "Sky", bg: "bg-sky-50", border: "border-sky-200" },
  { name: "Purple", bg: "bg-purple-50", border: "border-purple-200" },
  { name: "Rose", bg: "bg-rose-50", border: "border-rose-200" },
];

export function KeepContent() {
  const { user, accessToken, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [selectedCategory, setSelectedCategory] = useState("All");

  // New Note State
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [color, setColor] = useState("bg-white");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Status & Confirmation
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      let q;
      if (user?.id) {
        q = query(collection(db, "notes"), where("authorId", "==", user.id));
      } else {
        q = query(collection(db, "notes"));
      }

      const snapshot = await getDocs(q);
      const items: KeepNote[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      // Sort pinned first then date
      items.sort((a, b) => {
        if (a.pinned === b.pinned) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return a.pinned ? -1 : 1;
      });

      setNotes(items);
    } catch (err: any) {
      console.warn("Could not fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const handleCreateNote = async () => {
    if (!title.trim() && !content.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "notes"), {
        title: title.trim() || "Untitled Note",
        content: content.trim(),
        category,
        color,
        pinned,
        authorId: user?.id || "guest",
        createdAt: new Date().toISOString(),
      });

      setStatusMsg({
        type: "success",
        text: "Note saved to Google Keep workspace.",
      });
      setIsCreating(false);
      setTitle("");
      setContent("");
      setColor("bg-white");
      setPinned(false);
      fetchNotes();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to save note.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (note: KeepNote) => {
    try {
      await updateDoc(doc(db, "notes", note.id), {
        pinned: !note.pinned,
      });
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = (note: KeepNote) => {
    setConfirmDialog({
      title: "Delete Keep Note",
      description: `Are you sure you want to permanently delete the note "${note.title}"?`,
      action: async () => {
        try {
          await deleteDoc(doc(db, "notes", note.id));
          setStatusMsg({
            type: "success",
            text: "Note deleted.",
          });
          fetchNotes();
        } catch (err: any) {
          setStatusMsg({
            type: "error",
            text: err.message || "Failed to delete note.",
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const filteredNotes = notes.filter((n) => {
    const matchesCat =
      selectedCategory === "All" || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <StickyNote size={22} />
            </span>
            <h1 className="font-display text-3xl font-bold text-ink">
              Google Keep Notes
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink/60 max-w-2xl">
            Capture quick mentorship takeaways, interview reminders, alumni
            contact memos, and check-lists in one organized place.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brass hover:bg-ink text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          Take a Note
        </button>
      </div>

      {/* Status Msg */}
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["All", "General", "Mentorship", "Career", "Checklist", "Ideas"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-amber-600 text-white"
                    : "bg-paper/60 border border-ink/10 text-ink/70 hover:bg-paper"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        <div className="relative max-w-xs w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-full border border-ink/15 bg-white outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-ink/40">
          Loading Keep notes...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-ink/15 bg-paper/20">
          <StickyNote size={36} className="mx-auto text-ink/30" />
          <h3 className="font-semibold text-base text-ink/70">
            No notes found
          </h3>
          <p className="text-xs text-ink/40 max-w-xs mx-auto">
            Click &quot;Take a Note&quot; to write your thoughts, alumni advice,
            or to-dos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-5 rounded-2xl border ${note.color} ${
                note.color === "bg-white" ? "border-ink/10" : ""
              } shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-ink/5 text-ink/60">
                    {note.category}
                  </span>
                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`p-1 transition-colors ${
                      note.pinned
                        ? "text-amber-600"
                        : "text-ink/30 hover:text-ink"
                    }`}
                    title={note.pinned ? "Unpin note" : "Pin note"}
                  >
                    <Pin size={14} className={note.pinned ? "fill-amber-600" : ""} />
                  </button>
                </div>

                <h3 className="font-display text-base font-bold text-ink">
                  {note.title}
                </h3>

                <p className="text-xs text-ink/80 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
                <span className="text-[10px] text-ink/40">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push("/docs")}
                    className="p-1.5 text-ink/40 hover:text-blue-600 transition-colors"
                    title="Open in Google Docs"
                  >
                    <FileText size={13} />
                  </button>
                  <button
                    onClick={() => router.push("/communications")}
                    className="p-1.5 text-ink/40 hover:text-red-500 transition-colors"
                    title="Send via Gmail"
                  >
                    <Mail size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note)}
                    className="p-1.5 text-ink/40 hover:text-red-600 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <StickyNote size={18} className="text-amber-500" />
                New Keep Note
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-ink/40 hover:text-ink text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 font-semibold text-sm rounded-lg border border-ink/15 outline-none focus:border-amber-500"
              />

              <textarea
                rows={4}
                placeholder="Take a note, add checklist items, or memo..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 text-sm rounded-lg border border-ink/15 outline-none focus:border-amber-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-ink/15 bg-white outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Mentorship">Mentorship</option>
                    <option value="Career">Career</option>
                    <option value="Checklist">Checklist</option>
                    <option value="Ideas">Ideas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                    Card Color
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.bg)}
                        className={`w-6 h-6 rounded-full border ${c.bg} ${
                          color === c.bg
                            ? "ring-2 ring-amber-500 border-transparent"
                            : "border-ink/20"
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label
                  htmlFor="pinNote"
                  className="text-xs font-medium text-ink cursor-pointer flex items-center gap-1"
                >
                  <Pin size={12} /> Pin note to top
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-semibold text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={submitting || (!title.trim() && !content.trim())}
                className="px-5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {submitting ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-ink">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-ink/70">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-ink/10">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-semibold text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.action}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
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
