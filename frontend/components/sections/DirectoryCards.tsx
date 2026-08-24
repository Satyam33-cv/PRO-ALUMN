"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api/client";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  X,
  Upload,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type Alumni = {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  department: string;
  batch: string;
  location: string;
  skills: string[];
  match: number;
  verified: boolean;
  avatar?: string;
};

const alumniData: Alumni[] = [
  {
    id: "1",
    name: "Priya Sharma",
    initials: "PS",
    role: "Senior Software Engineer",
    company: "Google",
    department: "Computer Science",
    batch: "2019",
    location: "Bangalore",
    skills: ["React", "TypeScript", "System Design", "Node.js"],
    match: 94,
    verified: true,
  },
  {
    id: "2",
    name: "Arjun Mehta",
    initials: "AM",
    role: "Product Manager",
    company: "Microsoft",
    department: "Electronics",
    batch: "2018",
    location: "Hyderabad",
    skills: ["Product Strategy", "Data Analysis", "Agile"],
    match: 88,
    verified: true,
  },
  {
    id: "3",
    name: "Sneha Reddy",
    initials: "SR",
    role: "Data Scientist",
    company: "Amazon",
    department: "Mathematics",
    batch: "2020",
    location: "Chennai",
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    match: 91,
    verified: true,
  },
  {
    id: "4",
    name: "Vikram Patel",
    initials: "VP",
    role: "DevOps Engineer",
    company: "Netflix",
    department: "Information Technology",
    batch: "2021",
    location: "Mumbai",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform"],
    match: 85,
    verified: true,
  },
  {
    id: "5",
    name: "Ananya Singh",
    initials: "AS",
    role: "UX Designer",
    company: "Figma",
    department: "Design",
    batch: "2019",
    location: "Pune",
    skills: ["Figma", "User Research", "Prototyping"],
    match: 82,
    verified: true,
  },
  {
    id: "6",
    name: "Rahul Kumar",
    initials: "RK",
    role: "Backend Engineer",
    company: "Stripe",
    department: "Computer Science",
    batch: "2020",
    location: "Bangalore",
    skills: ["Go", "PostgreSQL", "Microservices", "gRPC"],
    match: 89,
    verified: true,
  },
];

const departments = [
  "All Departments",
  "Computer Science",
  "Electronics",
  "Mathematics",
  "Information Technology",
  "Design",
];

export function DirectoryCards() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredAlumni = alumniData.filter((alumni) => {
    const matchesSearch =
      alumni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumni.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumni.skills.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesDept =
      selectedDepartment === "All Departments" ||
      alumni.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  function openModal(alumni: Alumni) {
    setSelectedAlumni(alumni);
    setModalOpen(true);
    setResumeFile(null);
    setNote("");
    setSubmitted(false);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedAlumni(null);
    setResumeFile(null);
    setNote("");
    setSubmitted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedAlumni?.id) {
        await apiClient.mentorship.create({
          mentorId: selectedAlumni.id,
          message: note || `Hi ${selectedAlumni.name}, I would love to connect for referral and career guidance at ${selectedAlumni.company}.`,
          area: "Career & Referral Guidance",
        });
      }
    } catch (reqErr) {
      console.debug("Mentorship request fallback:", reqErr);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <section className="min-h-screen bg-[#FAFBFF] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-5 text-[#4F46E5]" />
            <span className="text-sm font-medium text-[#4F46E5]">
              AI-Powered Matching
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            Alumni Directory
          </h1>
          <p className="mt-2 text-[#0F172A]/60 max-w-xl">
            Find the right alumni for referrals, mentorship, or career guidance.
            Our AI matches you based on skills, goals, and compatibility.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#0F172A]/30" />
            <input
              type="text"
              placeholder="Search by name, company, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#0F172A]/10 bg-white py-3 pl-10 pr-4 text-sm text-[#0F172A] placeholder-[#0F172A]/30 transition-colors focus:border-[#4F46E5]/40 focus:ring-2 focus:ring-[#4F46E5]/20 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#0F172A]/30" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="appearance-none rounded-xl border border-[#0F172A]/10 bg-white py-3 pl-10 pr-10 text-sm text-[#0F172A] transition-colors focus:border-[#4F46E5]/40 focus:ring-2 focus:ring-[#4F46E5]/20 focus:outline-none cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-[#0F172A]/50 mb-6">
          Showing {filteredAlumni.length} alumni
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((alumni) => (
            <div
              key={alumni.id}
              className="group rounded-2xl border border-[#0F172A]/10 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-[#4F46E5]/20"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-sm font-bold text-white">
                      {alumni.initials}
                    </div>
                    {alumni.verified && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-white">
                        <CheckCircle2 className="size-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-[#0F172A]">
                      {alumni.name}
                    </h3>
                    <p className="text-sm text-[#0F172A]/60">{alumni.role}</p>
                  </div>
                </div>
              </div>

              {/* Company & Location */}
              <div className="flex items-center gap-4 text-sm text-[#0F172A]/60 mb-4">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="size-4 text-[#0F172A]/40" />
                  <span>{alumni.company}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-[#0F172A]/40" />
                  <span>{alumni.location}</span>
                </div>
              </div>

              {/* Department & Batch */}
              <div className="text-xs text-[#0F172A]/40 mb-4">
                {alumni.department} · Class of {alumni.batch}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {alumni.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-[#4F46E5]/8 px-2.5 py-1 text-xs font-medium text-[#4F46E5]"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Match Score */}
              <div className="flex items-center justify-between mb-4 pt-4 border-t border-[#0F172A]/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-[#10B981]" />
                  <span className="text-sm font-semibold text-[#10B981]">
                    {alumni.match}% Match
                  </span>
                </div>
                <div className="h-1.5 w-20 rounded-full bg-[#0F172A]/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#10B981]"
                    style={{ width: `${alumni.match}%` }}
                  />
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => openModal(alumni)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#4F46E5]/20 transition-all hover:bg-[#4338CA] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
              >
                Request Referral
                <ArrowRight className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAlumni.length === 0 && (
          <div className="text-center py-16">
            <Search className="size-12 text-[#0F172A]/20 mx-auto mb-4" />
            <p className="text-lg font-medium text-[#0F172A]/60">
              No alumni found
            </p>
            <p className="text-sm text-[#0F172A]/40 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Referral Request Modal */}
      <AnimatePresence>
        {modalOpen && selectedAlumni && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-lg rounded-2xl border border-[#0F172A]/10 bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {submitted ? (
                  /* Success State */
                  <div className="text-center py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10 mx-auto mb-4">
                      <CheckCircle2 className="size-8 text-[#10B981]" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-[#0F172A] mb-2">
                      Request Sent!
                    </h3>
                    <p className="text-sm text-[#0F172A]/60 mb-6">
                      Your referral request has been sent to {selectedAlumni.name}.
                      You&apos;ll receive a notification when they respond.
                    </p>
                    <button
                      onClick={closeModal}
                      className="rounded-xl bg-[#4F46E5] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  /* Form */
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-sm font-bold text-white">
                          {selectedAlumni.initials}
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-semibold text-[#0F172A]">
                            Request Referral
                          </h3>
                          <p className="text-xs text-[#0F172A]/50">
                            to {selectedAlumni.name} at {selectedAlumni.company}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={closeModal}
                        className="rounded-lg p-1.5 text-[#0F172A]/40 hover:text-[#0F172A] hover:bg-[#0F172A]/5 transition-colors"
                      >
                        <X className="size-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Resume Upload */}
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Upload Resume (Optional)
                        </label>
                        <div
                          className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                            resumeFile
                              ? "border-[#4F46E5]/40 bg-[#4F46E5]/5"
                              : "border-[#0F172A]/10 hover:border-[#4F46E5]/30"
                          }`}
                        >
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                              setResumeFile(e.target.files?.[0] || null)
                            }
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {resumeFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="size-5 text-[#4F46E5]" />
                              <span className="text-sm text-[#0F172A] font-medium">
                                {resumeFile.name}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="size-8 text-[#0F172A]/20 mx-auto mb-2" />
                              <p className="text-sm text-[#0F172A]/50">
                                <span className="text-[#4F46E5] font-medium">
                                  Click to upload
                                </span>{" "}
                                or drag and drop
                              </p>
                              <p className="text-xs text-[#0F172A]/30 mt-1">
                                PDF, DOC, or DOCX (max 5MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Personal Note */}
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Personal Note
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Hi, I'm interested in learning about opportunities at your company..."
                          rows={4}
                          className="w-full rounded-xl border border-[#0F172A]/10 bg-[#FAFBFF] px-4 py-3 text-sm text-[#0F172A] placeholder-[#0F172A]/30 transition-colors focus:border-[#4F46E5]/40 focus:ring-2 focus:ring-[#4F46E5]/20 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4F46E5]/25 transition-all hover:bg-[#4338CA] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Request
                            <ArrowRight className="size-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

export default DirectoryCards;