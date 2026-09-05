"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export interface PublicHeaderProps {
  activeRoute?: "directory" | "stories" | "announcements" | "education" | "events" | "jobs" | "home";
}

export function PublicHeader({ activeRoute }: PublicHeaderProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentActive =
    activeRoute ||
    (pathname.startsWith("/directory")
      ? "directory"
      : pathname.startsWith("/jobs")
      ? "jobs"
      : pathname.startsWith("/events")
      ? "events"
      : pathname.startsWith("/stories")
      ? "stories"
      : pathname.startsWith("/announcements")
      ? "announcements"
      : pathname.startsWith("/education")
      ? "education"
      : "home");

  const navItems = [
    { label: "Features", href: "/#features", id: "features" },
    { label: "AI Matching", href: "/#matching", id: "matching" },
    {
      label: currentActive === "directory" ? "Directory *" : "Directory",
      href: "/directory",
      id: "directory",
      active: currentActive === "directory",
    },
    {
      label: currentActive === "jobs" ? "Jobs *" : "Jobs",
      href: "/jobs",
      id: "jobs",
      active: currentActive === "jobs",
    },
    {
      label: currentActive === "events" ? "Events *" : "Events",
      href: "/events",
      id: "events",
      active: currentActive === "events",
    },
    {
      label: currentActive === "stories" ? "Success Spotlight *" : "Success Spotlight",
      href: "/stories",
      id: "stories",
      active: currentActive === "stories",
    },
    {
      label: currentActive === "announcements" ? "Announcements *" : "Announcements",
      href: "/announcements",
      id: "announcements",
      active: currentActive === "announcements",
    },
    {
      label: currentActive === "education" ? "Education *" : "Education",
      href: "/education",
      id: "education",
      active: currentActive === "education",
    },
  ];

  return (
    <header
      data-testid="public-global-header"
      className="w-full border-b-2 border-black bg-[#fcf9f3] sticky top-0 z-50 selection:bg-[#CCFF00] selection:text-black"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo & System Indicator */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 font-mono font-black tracking-tighter text-lg sm:text-xl text-black hover:opacity-85 transition-opacity"
            aria-label="PRO-ALUMN Home"
          >
            <span className="text-black font-extrabold tracking-tight">///// PRO-ALUMN</span>
          </Link>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold border border-black bg-white shadow-[1px_1px_0px_#000000]">
            <span className="w-2 h-2 bg-[#00E676] mr-1.5 inline-block animate-pulse" />
            SYS.V24 // NODE-ALPHA [PUBLIC_GUEST]
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav
          aria-label="Public Showcase Navigation"
          className="hidden lg:flex items-center space-x-1 font-mono text-xs font-bold uppercase tracking-wider"
        >
          {navItems.map((item) => {
            if (item.active) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="px-3 py-1.5 bg-[#CCFF00] border-2 border-black text-black font-extrabold shadow-[2px_2px_0px_#000000]"
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.id}
                href={item.href}
                className="px-3 py-1.5 border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth CTAs or Member Console Shortcut */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider uppercase bg-[#CCFF00] text-black border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#CCFF00] transition-all"
              >
                <span>Console [Dashboard →]</span>
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider uppercase border-2 border-black bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Log In
              </Link>
              <Link
                href="/login"
                className="px-4 py-1.5 text-xs font-mono font-bold tracking-wider uppercase bg-[#FF5500] text-white border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-orange-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1"
              >
                <span>Get Started</span>
                <span className="font-bold">→</span>
              </Link>
            </>
          )}

          {/* Mobile menu hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 border-2 border-black bg-white shadow-[2px_2px_0px_#000000] text-black"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full bg-[#fcf9f3] border-t-2 border-black p-4 space-y-3 font-mono text-xs font-bold uppercase shadow-[0_4px_0_#000000]">
          <div className="flex items-center justify-between pb-2 border-b border-black text-[10px] text-neutral-600">
            <span>PUBLIC SHOWCASE DIRECTORY</span>
            <span className="text-[#00A859]">NODE-ALPHA ONLINE</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 border-2 border-black text-center ${
                  item.active
                    ? "bg-[#CCFF00] font-extrabold shadow-[2px_2px_0px_#000000]"
                    : "bg-white hover:bg-black hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-black flex items-center justify-between gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-[#CCFF00] text-black border-2 border-black font-extrabold shadow-[2px_2px_0px_#000000]"
              >
                Open Member Console →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-white text-black border-2 border-black font-bold shadow-[2px_2px_0px_#000000]"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-[#FF5500] text-white border-2 border-black font-bold shadow-[2px_2px_0px_#000000]"
                >
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
