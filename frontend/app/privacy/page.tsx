"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-black font-sans selection:bg-[#FF5500] selection:text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between font-mono text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Portal
          </Link>
          <span className="font-bold text-neutral-500 uppercase">
            EFFECTIVE DATE: SEPTEMBER 2026 // REV 2.4
          </span>
        </div>

        {/* Main Document Box */}
        <article className="border-4 border-black bg-white shadow-[8px_8px_0px_#000000] overflow-hidden">
          {/* Header Banner */}
          <header className="bg-black text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b-4 border-black">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF5500] border-2 border-black flex items-center justify-center text-black font-black">
                <Shield size={18} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-sans">
                  PRO ALUMN PRIVACY POLICY
                </h1>
                <p className="font-mono text-[11px] text-neutral-300">
                  INSTITUTIONAL DATA PROTECTION & PRIVACY SPECIFICATION
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#FF5500] text-white border-2 border-black font-mono text-xs font-black uppercase">
              CONFIDENTIAL // GOVERNED
            </span>
          </header>

          {/* Document Content */}
          <div className="p-6 sm:p-10 space-y-8 text-neutral-900 leading-relaxed font-sans">
            {/* Overview */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#FF5500] inline-block"></span>
                1. Purpose & Scope
              </h2>
              <p className="text-sm text-neutral-700">
                PRO ALUMN is an institutional career, referral, and mentorship network connecting verified students, faculty, and alumni. This Privacy Policy governs how personal, academic, and professional information is collected, processed, and safeguarded across all platform endpoints.
              </p>
            </section>

            {/* Information Collected */}
            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-black inline-block"></span>
                2. Information We Collect
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 bg-[#FFFFFF] border-2 border-black space-y-2">
                  <div className="flex items-center gap-2 font-bold text-black">
                    <FileText size={16} className="text-[#FF5500]" />
                    <span>ACADEMIC & IDENTITY DATA</span>
                  </div>
                  <p className="text-neutral-700 font-sans text-xs">
                    Full name, institutional email address, graduation batch year, academic department, and enrollment roll number used for identity verification.
                  </p>
                </div>

                <div className="p-4 bg-[#FFFFFF] border-2 border-black space-y-2">
                  <div className="flex items-center gap-2 font-bold text-black">
                    <Lock size={16} className="text-[#FF5500]" />
                    <span>CAREER & PROFESSIONAL DATA</span>
                  </div>
                  <p className="text-neutral-700 font-sans text-xs">
                    Current employer, job title, geographic location, LinkedIn profile URL, uploaded resumes (PDF format), and self-declared skill tags.
                  </p>
                </div>

                <div className="p-4 bg-[#FFFFFF] border-2 border-black space-y-2">
                  <div className="flex items-center gap-2 font-bold text-black">
                    <Eye size={16} className="text-[#FF5500]" />
                    <span>TELEMETRY & MATCHING VECTORS</span>
                  </div>
                  <p className="text-neutral-700 font-sans text-xs">
                    High-dimensional vector embeddings generated from your public profile to compute mentorship cosine similarity and referral matching scores.
                  </p>
                </div>

                <div className="p-4 bg-[#FFFFFF] border-2 border-black space-y-2">
                  <div className="flex items-center gap-2 font-bold text-black">
                    <Shield size={16} className="text-[#FF5500]" />
                    <span>FINANCIAL TRANSACTIONS</span>
                  </div>
                  <p className="text-neutral-700 font-sans text-xs">
                    For paid verification or event registrations processed via Razorpay, we record merchant order IDs and verification timestamps. We never store credit/debit card numbers or CVVs.
                  </p>
                </div>
              </div>
            </section>

            {/* How Information Is Used */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#FF5500] inline-block"></span>
                3. Purpose of Processing
              </h2>
              <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1.5">
                <li>Verifying active student and alumni status against institutional registries.</li>
                <li>Routing internal job referral requests and peer mentorship scheduling.</li>
                <li>Generating cryptographic event access passes with QR codes.</li>
                <li>Preventing malicious impersonation, spam, or unauthorized automated scraping.</li>
              </ul>
            </section>

            {/* Data Retention & Security */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#FF5500] inline-block"></span>
                4. Cryptographic Security & Passwords
              </h2>
              <p className="text-sm text-neutral-700">
                All credentials are irreversibly hashed using standard bcrypt algorithms with individual cryptographic salts. Network transmissions are strictly encrypted via TLS 1.3. Internal database access is gated behind role-based access control (RBAC).
              </p>
            </section>

            {/* User Rights */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#FF5500] inline-block"></span>
                5. User Rights & Data Deletion
              </h2>
              <p className="text-sm text-neutral-700">
                You retain full ownership of your data. You may request an export of your personal dossier or submit an account erasure request at any time by contacting institutional administrators at{" "}
                <a
                  href="mailto:admin@proalumn.edu"
                  className="font-mono font-bold text-black underline hover:text-[#FF5500]"
                >
                  admin@proalumn.edu
                </a>
                . Deletion requests are processed within 14 calendar days.
              </p>
            </section>
          </div>

          {/* Footer Strip */}
          <footer className="bg-[#FFFFFF] border-t-4 border-black p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-neutral-600">
              <Mail size={14} />
              <span>Questions? Contact: admin@proalumn.edu</span>
            </div>
            <div className="flex gap-4">
              <Link href="/terms" className="font-bold underline hover:text-[#FF5500]">
                Terms of Service →
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
