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
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole } from "@/lib/context/AuthContext";
import { GlobalSearch } from "@/components/GlobalSearch";

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
    { label: "Network", href: "/network", icon: Users },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
  alumni: [
    { label: "Home", href: "/home", icon: LayoutDashboard },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "Network", href: "/network", icon: Users },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
  admin: [
    { label: "Command center", href: "/admin", icon: ShieldCheck },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "Directory", href: "/network", icon: Users },
    { label: "Analytics", href: "/admin/analytics", icon: LayoutDashboard },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
  faculty: [
    { label: "Home", href: "/home", icon: LayoutDashboard },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "Network", href: "/network", icon: Users },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ],
};

const secondaryNav: NavItem[] = [
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

const mockNotifications = [
  { id: 1, text: "Sarah Chen accepted your mentorship request", time: "2m ago", unread: true },
  { id: 2, text: "New event: Fall Reunion Networking Night", time: "1h ago", unread: true },
  { id: 3, text: "David Park endorsed you for Python", time: "3h ago", unread: false },
  { id: 4, text: "Your referral request was viewed", time: "5h ago", unread: false },
  { id: 5, text: "Welcome to PRO ALUMN", time: "1d ago", unread: false },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getNavClasses(
  isActive: boolean,
  activeVariant: "primary" | "secondary" | "outline"
) {
  if (activeVariant === "primary") {
    return isActive
      ? "bg-blue-50 text-blue-700 font-medium"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors";
  }
  if (activeVariant === "secondary") {
    return isActive
      ? "bg-emerald-50 text-emerald-700 font-medium"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors";
  }
  return isActive
    ? "border-b-2 border-blue-600"
    : "hover:text-slate-900 border-b-2 border-transparent transition-colors";
}

function NotificationPanel({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
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
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-ink-900/10 bg-canvas shadow-card"
    >
      <div className="flex items-center justify-between border-b border-ink-900/10 px-4 py-3">
        <p className="text-sm font-semibold text-ink">Notifications</p>
        <button
          type="button"
          onClick={() => {
            onClose();
            triggerRef.current?.focus();
          }}
          className="rounded p-0.5 text-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          aria-label="Close notifications"
        >
          <X size={16} />
        </button>
      </div>
      <ul className="max-h-80 divide-y divide-ink-900/10 overflow-y-auto">
        {mockNotifications.map((n) => (
          <li
            key={n.id}
            className={`px-4 py-3 transition-colors hover:bg-muted ${n.unread ? "bg-brass/5" : ""}`}
          >
            <p className="text-sm text-ink">{n.text}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/40">
              {n.time}
            </p>
          </li>
        ))}
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
        className="flex items-center gap-2 rounded-lg border border-ink-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-brass/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        <CurrentIcon size={14} className="text-brass" />
        {capitalize(currentRole)}
        <ChevronDown size={13} className="text-ink/40" />
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
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-ink-900/10 bg-white shadow-card"
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
                        ? "bg-brass/10 text-brass"
                        : "text-ink hover:bg-muted"
                    }`}
                  >
                    <Icon size={14} />
                    {roleMeta[r].label}
                    {r === currentRole && <Check size={13} className="ml-auto" />}
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
  const unreadCount = useMemo(
    () => mockNotifications.filter((n) => n.unread).length,
    [],
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
    const itemBase = `flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass ${
      compact ? "justify-center px-0" : ""
    }`;
    return (
      <>
      <div className={`flex items-center justify-between ${compact ? "justify-center px-2" : "px-6"} pb-6`}>
        {compact ? (
          <Link
            href="/home"
            aria-label="PRO ALUMN home"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-heading text-lg font-extrabold tracking-tight text-white shadow-sm"
          >
            A
          </Link>
        ) : (
          <>
            <Link href="/home" className="font-heading text-2xl tracking-tight text-slate-900">
              PRO <span className="text-blue-600">ALUMN</span>
            </Link>
              {mobile && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded p-1 text-canvas/60 hover:text-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                  aria-label="Close navigation"
                >
                  <X size={20} />
                </button>
              )}
            </>
          )}
        </div>

      <div className={`flex items-center gap-3 border-b border-slate-100 pb-6 ${compact ? "justify-center border-b-0 px-2" : "px-6"}`}>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm ${
            compact ? "mx-auto" : ""
          }`}
        >
          {displayInitials}
        </div>
        {!compact && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {displayName}
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              {displayRole} · {displayYear}
            </p>
          </div>
        )}
      </div>

        <nav
          className={`mt-6 flex-1 space-y-0.5 ${compact ? "px-2" : "px-3"}`}
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
              <Icon size={18} strokeWidth={1.6} className="shrink-0" />
              {!compact && label}
            </Link>
          ))}
        </nav>

      <div className={`mt-2 border-t border-slate-100 pt-4 ${compact ? "border-t-0 px-2" : "px-3"}`}>
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            {displayInitials}
          </div>
          {!compact && <span className="truncate">My Profile</span>}
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
              <Icon size={18} strokeWidth={1.6} className="shrink-0" />
              {!compact && label}
            </Link>
          ))}
        </div>

      <div className={`mt-auto space-y-3 border-t border-slate-100 pt-5 ${compact ? "border-t-0 px-2" : "px-6"}`}>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          className={`flex items-center gap-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            compact ? "justify-center px-0" : "px-3"
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {!compact && "Sign out"}
        </button>
        {!compact && (
          <p className="px-3 text-[11px] font-medium text-slate-400">
            PRO ALUMN v1.0
          </p>
        )}
      </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/10 border-t-brass" />
      </div>
    );
  }

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white text-slate-700 md:flex ${sidebarWidth} transition-[width] duration-200`}
      >
        <div className="flex h-full flex-col py-7">
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
              className="fixed inset-0 z-40 bg-ink/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink text-canvas md:hidden"
            >
              <div className="flex h-full flex-col py-7">
                {sidebarContent(true)}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? "md:pl-[72px]" : "md:pl-64"}`}>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded p-1.5 text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="hidden rounded p-1.5 text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <GlobalSearch />

        <div className="flex items-center gap-2">
          <RoleSwitcher currentRole={role} />
          <div className="relative">
            <button
              type="button"
              ref={notifTriggerRef}
              onClick={() => setNotificationsOpen((v) => !v)}
              className="relative rounded p-1.5 text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel
              open={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              triggerRef={notifTriggerRef}
            />
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {displayInitials}
          </div>
        </div>
      </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-900/10 bg-canvas/80 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Primary navigation"
      >
        <ul className="flex items-stretch">
          {items.slice(0, 5).map(({ label, href, icon: Icon }) => (
            <li key={label} className="flex-1">
              <Link
                href={href as `/${string}`}
                aria-current={active(href) ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass ${
                  active(href)
                    ? getNavClasses(true, "primary")
                    : getNavClasses(false, "primary")
                }`}
              >
                <Icon size={20} strokeWidth={active(href) ? 2 : 1.5} />
                <span className="text-[10px] leading-none">{label}</span>
                {active(href) && (
                  <span className="mt-0.5 h-0.5 w-4 rounded-full bg-brass" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}