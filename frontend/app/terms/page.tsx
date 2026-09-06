"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, AlertTriangle, Scale, Mail } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-black font-sans selection:bg-[#CCFF00] selection:text-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between font-mono text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Portal
          </Link>
          <span className="font-bold text-neutral-500 uppercase">
            DOCUMENT: TERMS_CONDITIONS // REV 2026.1
          </span>
        </div>

        {/* Main Document Box */}
        <article className="border-4 border-black bg-white shadow-[8px_8px_0px_#000000] overflow-hidden">
          {/* Header Banner */}
          <header className="bg-black text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b-4 border-black">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF5500] border-2 border-black flex items-center justify-center text-white font-black">
                <Scale size={18} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-sans">
                  PRO ALUMN TERMS OF SERVICE
                </h1>
                <p className="font-mono text-[11px] text-neutral-300">
                  NETWORK GOVERNANCE, CONDUCT & DISCLOSURE SPECIFICATION
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#FF5500] text-white border-2 border-black font-mono text-xs font-black uppercase">
              BINDING AGREEMENT
            </span>
          </header>

          {/* Document Content */}
          <div className="p-6 sm:p-10 space-y-8 text-neutral-900 leading-relaxed font-sans">
            {/* Acceptance */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#CCFF00] inline-block"></span>
                1. Acceptance of Terms
              </h2>
              <p className="text-sm text-neutral-700">
                By creating an account, accessing, or utilizing the PRO ALUMN network, you agree to comply with and be bound by these Terms of Service. If you do not accept these terms, you may not register or access the network conduits.
              </p>
            </section>

            {/* Eligibility & Accounts */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-black inline-block"></span>
                2. Eligibility & Verification
              </h2>
              <p className="text-sm text-neutral-700">
                Membership is restricted to verified students, enrolled fellows, faculty members, and graduated alumni of accredited partner institutions. Providing falsified graduation years, fabricated company affiliations, or stolen identities results in immediate and permanent account termination.
              </p>
            </section>

            {/* Code of Conduct */}
            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#FF5500] inline-block"></span>
                3. Network Code of Conduct
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 bg-[#F7F4EE] border-2 border-black space-y-2">
                  <div className="flex items-center gap-2 font-bold text-black">
                    <CheckCircle size={16} className="text-[#00E676]" />
                    <span>ACCEPTABLE CONDUCT</span>
                  </div>
                  <ul className="text-neutral-700 font-sans text-xs space-y-1 list-disc pl-4">
                    <li>Professional mentorship inquiries and constructive advice.</li>
                    <li>Submitting genuine referral requests with honest credentials.</li>
                    <li>Respecting alumni response times and mentor schedule availability.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#F7F4EE] border-2 border-black space-y-2">
                  <div className="flex items-center gap-2 font-bold text-black">
                    <AlertTriangle size={16} className="text-[#FF5500]" />
                    <span>PROHIBITED ACTIVITIES</span>
                  </div>
                  <ul className="text-neutral-700 font-sans text-xs space-y-1 list-disc pl-4">
                    <li>Automated scraping or harvesting of alumni contact details.</li>
                    <li>Unsolicited commercial spam or off-platform harassment.</li>
                    <li>Commercial resale of referral slots or mentorship introductions.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Mentorship & Referral Disclaimer */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#2E5BFF] inline-block"></span>
                4. Advisory Disclaimer: No Employment Guarantee
              </h2>
              <div className="p-4 bg-[#EFECE4] border-2 border-black font-mono text-xs leading-relaxed text-neutral-800">
                <p className="font-bold mb-1 uppercase">IMPORTANT NOTICE:</p>
                PRO ALUMN is a networking conduit. Acceptance of a referral request or completion of a mentorship session does NOT constitute a guarantee or offer of employment from any alumni or sponsoring corporation. All corporate hiring decisions remain exclusively with hiring organizations.
              </div>
            </section>

            {/* Paid Verification & Fees */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-[#CCFF00] inline-block"></span>
                5. Paid Verification & Transaction Terms
              </h2>
              <p className="text-sm text-neutral-700">
                Any administrative verification fees paid via Razorpay cover manual institutional credential verification and identity check procedures. Fees are non-refundable once verification processing has initiated. In the event of a technical processing duplicate, contact our support desk with your payment reference ID.
              </p>
            </section>

            {/* Termination */}
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-3 h-3 bg-black inline-block"></span>
                6. Platform Suspension & Jurisdiction
              </h2>
              <p className="text-sm text-neutral-700">
                Administrators reserve the right to suspend or revoke access to any member violating community safety standards. These terms are governed by the applicable laws of the institution&apos;s home jurisdiction.
              </p>
            </section>
          </div>

          {/* Footer Strip */}
          <footer className="bg-[#F7F4EE] border-t-4 border-black p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-neutral-600">
              <Mail size={14} />
              <span>Questions? Contact: admin@proalumn.edu</span>
            </div>
            <div className="flex gap-4">
              <Link href="/privacy" className="font-bold underline hover:text-[#FF5500]">
                Privacy Policy →
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
