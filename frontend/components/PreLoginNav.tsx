"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "AI Matching", href: "/#matching" },
  { label: "Education Center", href: "/education" },
  { label: "Find Help", href: "/help" },
];

export function PreLoginNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 glass dark:glass"
          : "py-6 md:py-8 bg-gradient-to-b from-slate-50/60 dark:from-onyx/60 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-primary-900 dark:bg-white flex items-center justify-center text-blue-600 dark:text-primary-900 font-bold font-outfit text-sm">
            P
          </span>
          <span className="font-outfit font-bold text-xl tracking-tight text-primary-900 dark:text-white">
            PRO ALUMN
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-primary-500 dark:text-white/50">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary-900 dark:hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-primary-500 dark:text-white/50 hover:text-primary-900 dark:hover:text-white transition-colors">
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary-900 dark:bg-white text-white dark:text-primary-900 text-sm px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-800 dark:hover:bg-slate-100 transition-colors"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="md:hidden p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-white/10 transition-colors">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass dark:glass mx-4 mt-3 rounded-2xl overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-sm font-medium text-primary-900 dark:text-white/70 hover:text-blue-600 transition-colors">
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-primary-200 dark:border-white/10 flex gap-3">
                <Link href="/login" onClick={() => setIsOpen(false)} className="text-sm font-medium">Log In</Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="bg-primary-900 dark:bg-white text-white dark:text-primary-900 text-sm px-4 py-2 rounded-xl font-semibold">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}