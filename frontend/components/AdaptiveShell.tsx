"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { RoleShell } from "@/components/RoleShell";
import { PublicHeader } from "@/components/PublicHeader";

export interface AdaptiveShellProps {
  children: React.ReactNode;
  activeRoute?: "directory" | "stories" | "announcements" | "education" | "events" | "jobs" | "home";
  forcePublic?: boolean;
}

export function AdaptiveShell({
  children,
  activeRoute,
  forcePublic = false,
}: AdaptiveShellProps) {
  const { user, loading } = useAuth();

  // If initial auth token is resolving, render minimal clean brutalist loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f3] text-black flex flex-col justify-between selection:bg-[#CCFF00]">
        <PublicHeader activeRoute={activeRoute} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="p-8 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col items-center gap-3 font-mono text-xs">
            <div className="w-8 h-8 border-2 border-black border-t-[#FF5500] animate-spin" />
            <span className="font-bold tracking-wider">[ RESOLVING IDENTITY CONDUIT... ]</span>
          </div>
        </main>
      </div>
    );
  }

  // If user is authenticated and not forced to public broadsheet, render inside member console shell
  if (user && !forcePublic) {
    return <RoleShell>{children}</RoleShell>;
  }

  // Unauthenticated visitor (Public Guest): render full-width broadsheet layout
  return (
    <div className="min-h-screen bg-[#fcf9f3] text-black flex flex-col justify-between selection:bg-[#CCFF00] selection:text-black">
      {/* 1. Public Global Showcase Header */}
      <PublicHeader activeRoute={activeRoute} />

      {/* 2. Main Full-Width Content Container (Zero Left Sidebar) */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* 3. Broadsheet Neobrutalist Footer */}
      <footer className="border-t-4 border-black bg-white py-10 px-4 sm:px-6 font-mono text-xs mt-12">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-black">
          {/* Col 1: Identity */}
          <div className="space-y-2">
            <div className="font-extrabold text-base text-black font-sans tracking-tight">
              ///// PRO-ALUMN
            </div>
            <p className="text-neutral-700 text-xs leading-relaxed font-mono">
              Federated alumni intelligence, career verification, and peer mentorship protocol for tier-one universities and technical faculties.
            </p>
            <div className="inline-flex items-center px-2 py-0.5 border border-black bg-black text-[#CCFF00] text-[10px] font-bold">
              SECURE ENCLAVE ACTIVE
            </div>
          </div>

          {/* Col 2: Showcase Pillars */}
          <div className="space-y-2">
            <div className="font-bold text-black uppercase tracking-wider text-[11px]">
              [ SHOWCASE PILLARS ]
            </div>
            <ul className="space-y-1 text-[11px] text-neutral-700">
              <li>
                <Link href="/directory" className="hover:underline font-bold text-black">
                  Pillar 01: Alumni Directory &amp; Geo-Map
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:underline font-bold text-black">
                  Pillar 02: Career &amp; Referral Hub
                </Link>
              </li>
              <li>
                <Link href="/mentorship" className="hover:underline font-bold text-black">
                  Pillar 03: Mentorship &amp; Flash 1:1
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:underline font-bold text-black">
                  Pillar 04: Events &amp; Capacity RSVPs
                </Link>
              </li>
              <li>
                <Link href="/stories" className="hover:underline font-bold text-black">
                  Pillar 05: Success Spotlight Wall
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="hover:underline font-bold text-black">
                  Pillar 06: Announcements Wire
                </Link>
              </li>
              <li>
                <Link href="/education" className="hover:underline font-bold text-black">
                  Pillar 07: Technical Sprint Center
                </Link>
              </li>
            </ul>
          </div>

            {/* Col 3: Protocols & Governance */}
            <div className="space-y-2">
              <div className="font-bold text-black uppercase tracking-wider text-[11px]">
                [ PROTOCOLS // GOVERNANCE ]
              </div>
              <ul className="space-y-1 text-[11px] text-neutral-700">
                <li>
                  <span className="text-neutral-600">RFC-814 Canonical Referral Chain</span>
                </li>
                <li>
                  <span className="text-neutral-600">Dual-Handshake Escrow Enclave</span>
                </li>
                <li>
                  <span className="text-neutral-600">384-D pgvector Cosine Topologies</span>
                </li>
                <li>
                  <span className="text-neutral-600">Confidential Admin Boundary</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Telemetry */}
            <div className="space-y-2">
              <div className="font-bold text-black uppercase tracking-wider text-[11px]">
                [ TELEMETRY ]
              </div>
              <div className="p-2.5 bg-white border-2 border-black space-y-1 text-[10px] shadow-[2px_2px_0px_#000000]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">NODE:</span>
                  <span className="bg-black text-[#CCFF00] px-1 font-bold">ALPHA-01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">LATENCY:</span>
                  <span className="font-bold">14MS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">REGISTRY:</span>
                  <span className="font-bold text-emerald-600">ACCREDITED</span>
                </div>
              </div>
              <div className="text-[9px] text-neutral-500 pt-1">
                Accreditation: Office of Academic Records &amp; University Alumni Registries.
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-600 gap-3">
            <div>
              © 2026 PRO-ALUMN CONSORTIUM. ALL RIGHTS RESERVED. PRINTED DIGITALLY.
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 bg-[#CCFF00] text-black border border-black font-bold text-[10px]">
                EDITION 14.8.2
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold">
                ED25519-STAMP VERIFIED
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
