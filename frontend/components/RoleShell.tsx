"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Users,
  BookOpen,
  X,
  Check,
  Mail,
  FileQuestion,
  Megaphone,
  FileText,
  Calendar,
  StickyNote,
  Flame,
  Coins,
  Award,
  Newspaper,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole } from "@/lib/context/AuthContext";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";

type Role = UserRole;

type NavItem = {
  label: string;
  href: `/${string}` | string;
  icon: typeof LayoutDashboard;
};

const primaryNav: Record<Role, NavItem[]> = {
  student: [
    { label: "Home", href: "/home", icon: LayoutDashboard },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "Directory", href: "/directory", icon: Users },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Rewards", href: "/rewards", icon: Flame },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
  alumni: [
    { label: "Home", href: "/home", icon: LayoutDashboard },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "Directory", href: "/directory", icon: Users },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Rewards", href: "/rewards", icon: Flame },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
  admin: [
    { label: "Command center", href: "/admin", icon: ShieldCheck },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "Directory", href: "/directory", icon: Users },
    { label: "Analytics", href: "/admin/analytics", icon: LayoutDashboard },
    { label: "Rewards", href: "/rewards", icon: Trophy },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
  faculty: [
    { label: "Home", href: "/home", icon: LayoutDashboard },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "Directory", href: "/directory", icon: Users },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Rewards", href: "/rewards", icon: Flame },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
};

const secondaryNav: NavItem[] = [
  { label: "Somaiya Sparsh", href: "/newsletter", icon: Newspaper },
  { label: "Google Docs", href: "/docs", icon: FileText },
  { label: "Google Keep", href: "/keep", icon: StickyNote },
  { label: "Gmail", href: "/communications", icon: Mail },
  { label: "Forms & Surveys", href: "/forms", icon: FileQuestion },
  { label: "Mentorship", href: "/mentorship", icon: GraduationCap },
  { label: "Giving", href: "/giving", icon: Heart },
  { label: "Stories", href: "/stories", icon: BookOpen },
];

const roleMeta: Record<Role, { label: string; icon: typeof Users }> = {
  student: { label: "Student", icon: GraduationCap },
  alumni: { label: "Alumni", icon: BriefcaseBusiness },
  faculty: { label: "Faculty", icon: Users },
  admin: { label: "Admin", icon: ShieldCheck },
};

function NotificationPanel({
  open,
  onClose,
  triggerRef,
  notifications,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  notifications: any[];
  onMarkAllRead: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const firstButton = panel.querySelector<HTMLElement>("button");
    firstButton?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, triggerRef]);

  if (!open) return null;
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onClose();
            triggerRef.current?.focus();
          }}
          className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
          aria-label="Close notifications"
        >
          <X size={16} />
        </button>
      </div>
      <ul className="max-h-80 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="px-4 py-6 text-center text-xs text-slate-400">
            No notifications yet
          </li>
        ) : (
          notifications.map((n) => (
            <li
              key={n.id}
              className={`px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                !n.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
              }`}
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title || n.message || n.text}</p>
              {n.message && n.title && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
              )}
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function RoleSwitcher({ currentRole }: { currentRole: Role }) {
  const { switchRole } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const CurrentIcon = roleMeta[currentRole].icon;

  function select(next: Role) {
    setOpen(false);
    if (next === currentRole) return;
    switchRole(next);
    router.push(next === "admin" ? "/admin" : "/home");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs transition-colors hover:border-blue-500/50 dark:hover:border-blue-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <CurrentIcon size={14} className="text-blue-600 dark:text-blue-400" />
        {capitalize(currentRole)}
        <ChevronDown size={13} className="text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Switch role"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
          >
            {(Object.keys(roleMeta) as Role[]).map((r) => {
              const Icon = roleMeta[r].icon;
              return (
                <li key={r}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={r === currentRole}
                    onClick={() => select(r)}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                      r === currentRole
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <Icon size={14} />
                    {roleMeta[r].label}
                    {r === currentRole && <Check size={13} className="ml-auto text-blue-600 dark:text-blue-400" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RoleShell({
  children,
  role: roleOverride,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { user, role: authRole, signOut, loading } = useAuth();
  const role = roleOverride ?? authRole;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedHydrated, setCollapsedHydrated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const notifTriggerRef = useRef<HTMLButtonElement>(null);
  const items = primaryNav[role];

  const { data: notifData, reload: reloadNotifs } = useApi(
    "shell:notifications",
    () => apiClient.notifications.list(),
    { enabled: Boolean(user) }
  );

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount ?? notifications.filter((n: any) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await apiClient.notifications.readAll();
      reloadNotifs();
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const { data: gamificationData } = useApi(
    "shell:gamification",
    () => apiClient.gamification.getStatus(),
    { enabled: Boolean(user) }
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pro-alumn_sidebar_collapsed");
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setCollapsedHydrated(true);
  }, []);

  useEffect(() => {
    if (!collapsedHydrated) return;
    try {
      localStorage.setItem("pro-alumn_sidebar_collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, collapsedHydrated]);

  useEffect(() => {
    setSidebarOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null;

  function handleSignOut() {
    signOut();
    router.push("/login");
  }

  function active(href: string) {
    return isActive(pathname, href);
  }

  const displayName = user?.name ?? "Guest";
  const displayInitials = user?.initials ?? "G";
  const displayRole = capitalize(role);
  const displayYear = user?.classYear ?? "—";

  function sidebarContent(mobile: boolean) {
    const compact = collapsed && !mobile;
    const itemBase = `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
      compact ? "justify-center px-0" : ""
    }`;
    return (
      <>
        <div className={`flex items-center justify-between ${compact ? "justify-center px-2" : "px-6"} pb-6`}>
          {compact ? (
            <Link
              href="/home"
              aria-label="PRO ALUMN home"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-heading text-lg font-extrabold tracking-tight text-white shadow-md shadow-blue-600/20"
            >
              P
            </Link>
          ) : (
            <>
              <Link href="/home" className="font-heading text-2xl tracking-tight text-slate-900 dark:text-slate-100 font-extrabold">
                PRO <span className="text-blue-600 dark:text-blue-400">ALUMN</span>
              </Link>
              {mobile && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label="Close navigation"
                >
                  <X size={20} />
                </button>
              )}
            </>
          )}
        </div>

        <div className={`flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 ${compact ? "justify-center border-b-0 px-2" : "px-6"}`}>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/20 ${
              compact ? "mx-auto" : ""
            }`}
          >
            {displayInitials}
          </div>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {displayRole} · {displayYear}
              </p>
            </div>
          )}
        </div>

        <nav
          className={`mt-5 flex-1 space-y-1 ${compact ? "px-2" : "px-3"}`}
          aria-label="Primary navigation"
        >
          {items.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href as `/${string}`}
              onClick={() => mobile && setSidebarOpen(false)}
              aria-current={active(href) ? "page" : undefined}
              title={compact ? label : undefined}
              className={`${itemBase} ${
                active(href)
                  ? getNavClasses(true, "primary")
                  : getNavClasses(false, "primary")
              }`}
            >
              <Icon size={18} strokeWidth={active(href) ? 2 : 1.6} className="shrink-0" />
              {!compact && label}
            </Link>
          ))}
        </nav>

        <div className={`mt-2 border-t border-slate-100 dark:border-slate-800 pt-4 ${compact ? "border-t-0 px-2" : "px-3"}`}>
          <Link
            href="/profile"
            onClick={() => mobile && setSidebarOpen(false)}
            aria-current={active("/profile") ? "page" : undefined}
            title={compact ? "My Profile" : undefined}
            className={`${itemBase} ${
              active("/profile")
                ? getNavClasses(true, "primary")
                : getNavClasses(false, "primary")
            }`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs">
              {displayInitials}
            </div>
            {!compact && <span className="truncate font-medium">My Profile</span>}
          </Link>
          {secondaryNav.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href as `/${string}`}
              onClick={() => mobile && setSidebarOpen(false)}
              aria-current={active(href) ? "page" : undefined}
              title={compact ? label : undefined}
              className={`${itemBase} ${
                active(href)
                  ? getNavClasses(true, "secondary")
                  : getNavClasses(false, "secondary")
              }`}
            >
              <Icon size={18} strokeWidth={active(href) ? 2 : 1.6} className="shrink-0" />
              {!compact && label}
            </Link>
          ))}
        </div>

        <div className={`mt-auto space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 ${compact ? "border-t-0 px-2" : "px-6"}`}>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className={`flex items-center gap-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer ${
              compact ? "justify-center px-0" : "px-3 w-full"
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!compact && "Sign out"}
          </button>
          {!compact && (
            <p className="px-3 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              PRO ALUMN v2.0 · Google Cloud
            </p>
          )}
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600" />
      </div>
    );
  }

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 md:flex ${sidebarWidth} transition-[width] duration-200`}
      >
        <div className="flex h-full flex-col py-6">
          {sidebarContent(false)}
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 md:hidden"
            >
              <div className="flex h-full flex-col py-6">
                {sidebarContent(true)}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? "md:pl-[72px]" : "md:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="hidden rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gamification Streak & Points Header Indicators */}
            <Link
              href="/rewards"
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:scale-105 hover:border-amber-500/50 transition-all shadow-xs"
              title="Daily Active Streak — Visit rewards to view achievements"
            >
              <Flame size={15} className="text-orange-500 animate-pulse fill-orange-500/20" />
              <span>{gamificationData?.streak?.current || 1}d</span>
            </Link>

            <Link
              href="/rewards"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:scale-105 hover:border-blue-500/50 transition-all shadow-xs"
              title="Alumni Contribution Points"
            >
              <Coins size={14} className="text-blue-500" />
              <span>{gamificationData?.totalPoints || 50} pts</span>
            </Link>

            <ThemeToggle className="shrink-0" />
            <RoleSwitcher currentRole={role} />
            
            <div className="relative">
              <button
                type="button"
                ref={notifTriggerRef}
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute 1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                triggerRef={notifTriggerRef}
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
              />
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700">
              {displayInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Primary navigation"
      >
        <ul className="flex items-stretch">
          {items.slice(0, 5).map(({ label, href, icon: Icon }) => (
            <li key={label} className="flex-1">
              <Link
                href={href as `/${string}`}
                aria-current={active(href) ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-1 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active(href)
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon size={19} strokeWidth={active(href) ? 2.2 : 1.6} />
                <span className="text-[10px] leading-none mt-0.5">{label}</span>
                {active(href) && (
                  <span className="mt-0.5 h-0.5 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  );
}