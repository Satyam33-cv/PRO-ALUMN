"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, LayoutDashboard, Users, FileText, Briefcase, CalendarDays,
  Settings, LogOut, ChevronRight, X, Search as SearchIcon, FileText as FileIcon,
  Cpu, Globe, Database, Moon, Sun, Sparkles, BookOpen, DollarSign, Menu,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/context/AuthContext";

const sidebarGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Web Tools",
    items: [
      { name: "Search", href: "/tools/search", icon: SearchIcon },
      { name: "Extract", href: "/tools/extract", icon: FileIcon },
    ],
  },
  {
    label: "Web Agents",
    items: [
      { name: "Deep Research", href: "/agents/research", icon: Cpu },
      { name: "FindAll", href: "/agents/findall", icon: Globe },
      { name: "Enrichment", href: "/agents/enrich", icon: Database },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Alumni Directory", href: "/directory", icon: Users },
      { name: "My Referrals", href: "/referrals", icon: FileText },
      { name: "Job Board", href: "/jobs", icon: Briefcase },
      { name: "Events", href: "/events", icon: CalendarDays },
    ],
  },
];

const bottomLinks = [
  { name: "Documentation", href: "/docs", icon: BookOpen },
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Settings", href: "/settings", icon: Settings, active: true },
];

const notifications = [
  { id: 1, text: "Priya accepted your referral request", time: "2m ago", unread: true },
  { id: 2, text: "New AI match in your field", time: "1h ago", unread: true },
  { id: 3, text: "Arjun viewed your profile", time: "3h ago", unread: false },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const isDark = theme === "dark";

  function handleLogout() {
    setProfileOpen(false);
    signOut();
    router.push("/login");
  }

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 border-r flex flex-col justify-between p-4 shrink-0
        transform transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
      `}>
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">PRO ALUMN</span>
          </div>

          {/* Nav Groups */}
          <nav className="space-y-5 text-sm font-medium">
            {/* Home */}
            <div>
              <Link href="/dashboard" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === "/dashboard" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold" : isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            </div>

            {/* Web Tools */}
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Web Tools</p>
              <div className="space-y-1">
                {sidebarGroups.find((g) => g.label === "Web Tools")?.items.map((item) => (
                  <Link key={item.name} href={item.href} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === item.href ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold" : isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}>
                    <item.icon className="w-4 h-4" /> {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Web Agents */}
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Web Agents</p>
              <div className="space-y-1">
                {sidebarGroups.find((g) => g.label === "Web Agents")?.items.map((item) => (
                  <Link key={item.name} href={item.href} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === item.href ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold" : isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}>
                    <item.icon className="w-4 h-4" /> {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Resources</p>
              <div className="space-y-1">
                {sidebarGroups.find((g) => g.label === "Resources")?.items.map((item) => (
                  <Link key={item.name} href={item.href} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === item.href ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold" : isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}>
                    <item.icon className="w-4 h-4" /> {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Links */}
            <div>
              <div className="space-y-1">
                {bottomLinks.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold" : isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}>
                      <item.icon className="w-4 h-4" /> {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Profile Flyout */}
        <div className="relative pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Dropdown Menu */}
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className={`absolute bottom-16 left-0 w-full rounded-xl p-2 border shadow-xl z-50 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <button
                  onClick={toggle}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </button>
                <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-rose-500 ${isDark ? "hover:bg-rose-950/30" : "hover:bg-rose-50"}`}>
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                {user?.initials ?? "U"}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold">{user?.name ?? "Guest"}</p>
                <p className="text-slate-400">{user ? `${user.department} '${user.classYear.slice(-2)}` : "Not signed in"}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className={`h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b shrink-0 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-full uppercase tracking-wider">
              Workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className={`absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border shadow-xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-bold">Notifications</p>
                      <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <ul className="max-h-72 divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.map((n) => (
                        <li key={n.id} className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${n.unread ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""}`}>
                          <p className="text-sm">{n.text}</p>
                          <p className="mt-1 text-[10px] text-slate-400 font-mono">{n.time}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}