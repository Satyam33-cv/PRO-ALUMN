"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Directory", href: "/directory" },
  { label: "Job Board", href: "/jobs" },
  { label: "Spotlight", href: "/stories" },
  { label: "Events", href: "/events" },
];

export function NavigationBarSection() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 rounded-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo text-white font-outfit font-bold text-sm">
            P
          </div>
          <span className="font-outfit text-xl font-bold text-slate-900 tracking-tight">
            PRO ALUMN
          </span>
        </Link>

        {/* Center Nav (desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-900/70">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-1 transition-colors hover:text-indigo ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-indigo"
                  : ""
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-indigo" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Log In */}
          <Link
            href="/login"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-900 hover:text-indigo transition-colors rounded-lg hover:bg-indigo/5"
          >
            Log In
          </Link>

          {/* Get Started / Dashboard */}
          <Link
            href="/register"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-indigo rounded-lg shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md"
          >
            Get Started
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-lg p-2 text-slate-900/60 hover:text-slate-900 hover:bg-slate-900/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-900/5 bg-white/95 backdrop-blur-md">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-indigo/10 text-indigo"
                    : "text-slate-900/70 hover:bg-slate-900/5 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-900/5 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-center text-sm font-semibold text-slate-900 rounded-lg hover:bg-slate-900/5"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-center text-sm font-semibold text-white bg-indigo rounded-lg hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default NavigationBarSection;