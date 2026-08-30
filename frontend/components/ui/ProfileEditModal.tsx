"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, User, Building2, Briefcase, GraduationCap, MapPin, Linkedin, AlignLeft, AlertCircle } from "lucide-react";

export interface ProfileEditModalProps {
  user: {
    name?: string;
    department?: string;
    batchYear?: number | string;
    classYear?: number | string;
    jobTitle?: string;
    currentCompany?: string;
    location?: string;
    linkedinUrl?: string;
    bio?: string;
    phone?: string;
  } | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

export function ProfileEditModal({
  user,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    department: user?.department || "",
    batchYear: user?.batchYear?.toString() || user?.classYear?.toString() || "",
    jobTitle: user?.jobTitle || "",
    currentCompany: user?.currentCompany || "",
    location: user?.location || "",
    linkedinUrl: user?.linkedinUrl || "",
    bio: user?.bio || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (formData.batchYear && (isNaN(Number(formData.batchYear)) || Number(formData.batchYear) < 1950 || Number(formData.batchYear) > 2035)) {
      newErrors.batchYear = "Please enter a valid class year (e.g. 2024)";
    }
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith("http://") && !formData.linkedinUrl.startsWith("https://")) {
      newErrors.linkedinUrl = "URL must start with https://";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        batchYear: formData.batchYear ? parseInt(formData.batchYear, 10) : undefined,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update profile:", err);
      setErrors((prev) => ({ ...prev, form: "Failed to save profile. Please try again." }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 backdrop-blur-sm pt-8 sm:pt-16 px-4 pb-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-ink/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4 bg-paper/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brass/15 text-brass">
              <User size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl text-ink font-semibold">Edit Profile</h2>
              <p className="text-xs text-ink/50">Update your public alumni identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
            type="button"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle size={15} />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Row 1: Name & Class Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <User size={13} className="text-ink/40" /> Full Name *
              </span>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g. Priya Raman"
                className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors ${
                  errors.name ? "border-red-400 focus:border-red-500" : "border-ink/15 focus:border-brass"
                }`}
              />
              {errors.name && <span className="text-[11px] text-red-500 mt-1 block">{errors.name}</span>}
            </label>

            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <GraduationCap size={13} className="text-ink/40" /> Class Year
              </span>
              <input
                type="number"
                value={formData.batchYear}
                onChange={(e) => {
                  setFormData({ ...formData, batchYear: e.target.value });
                  if (errors.batchYear) setErrors((prev) => ({ ...prev, batchYear: "" }));
                }}
                placeholder="e.g. 2024"
                className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors ${
                  errors.batchYear ? "border-red-400 focus:border-red-500" : "border-ink/15 focus:border-brass"
                }`}
              />
              {errors.batchYear && <span className="text-[11px] text-red-500 mt-1 block">{errors.batchYear}</span>}
            </label>
          </div>

          {/* Row 2: Department & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <Building2 size={13} className="text-ink/40" /> Department
              </span>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science"
                className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <MapPin size={13} className="text-ink/40" /> Location
              </span>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
              />
            </label>
          </div>

          {/* Row 3: Job Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <Briefcase size={13} className="text-ink/40" /> Job Title
              </span>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <Building2 size={13} className="text-ink/40" /> Company / Organization
              </span>
              <input
                type="text"
                value={formData.currentCompany}
                onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                placeholder="e.g. Google"
                className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass"
              />
            </label>
          </div>

          {/* Row 4: LinkedIn */}
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
              <Linkedin size={13} className="text-ink/40" /> LinkedIn URL
            </span>
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => {
                setFormData({ ...formData, linkedinUrl: e.target.value });
                if (errors.linkedinUrl) setErrors((prev) => ({ ...prev, linkedinUrl: "" }));
              }}
              placeholder="https://linkedin.com/in/username"
              className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors ${
                errors.linkedinUrl ? "border-red-400 focus:border-red-500" : "border-ink/15 focus:border-brass"
              }`}
            />
            {errors.linkedinUrl && <span className="text-[11px] text-red-500 mt-1 block">{errors.linkedinUrl}</span>}
          </label>

          {/* Row 5: Bio */}
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
              <AlignLeft size={13} className="text-ink/40" /> Bio / Summary
            </span>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Write a brief intro about your journey, interests, or what you can offer..."
              className="mt-1.5 w-full resize-none rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brass placeholder:text-ink/35"
            />
          </label>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/40 hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brass px-6 py-2 text-sm font-semibold text-ink transition-colors hover:bg-secondaryContainer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
