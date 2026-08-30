"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  BookOpen,
  X,
  Mail,
  FileQuestion,
  Megaphone,
  FileText,
  Calendar,
  StickyNote,
  Flame,
  Coins,
  Trophy,
  Target,
  Sparkles,
  MonitorCheck,
  Compass,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole } from "@/lib/context/AuthContext";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { getSocket } from "@/lib/socket";

type Role = UserRole;

type SubItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

type NavItemConfig = {
  title: string;
  href?: string;
  icon: React.ElementType;
  subItems?: SubItem[];
};

const navConfig: NavItemConfig[] = [
  { 
    title: 'Dashboard', 
    href: '/home', 
    icon: LayoutDashboard 
  },
  { 
    title: 'Network', 
    href: '/directory', 
    icon: Users 
  },
  { 
    title: 'Opportunities', 
    icon: BriefcaseBusiness,
    subItems: [
      { title: 'Job Board', href: '/jobs', icon: BriefcaseBusiness },
      { title: 'Referral Tracker', href: '/referrals', icon: Target },
      { title: 'AI Match', href: '/matching', icon: Sparkles },
    ],
  },
  {
    title: 'Engage',
    icon: Compass,
    subItems: [
      { title: 'Announcements', href: '/announcements', icon: Megaphone },
      { title: 'Messages & Chat', href: '/chat', icon: MessageCircle },
      { title: 'Mentorship Hub', href: '/mentorship', icon: GraduationCap },
      { title: 'Spotlight Stories', href: '/stories', icon: BookOpen },
      { title: 'Events & RSVPs', href: '/events', icon: Calendar },
      { title: 'Rewards & Streaks', href: '/rewards', icon: Trophy },
    ],
  },
  {
    title: 'Workspace',
    icon: MonitorCheck,
    subItems: [
      { title: 'Gmail', href: '/communications', icon: Mail },
      { title: 'Google Docs', href: '/docs', icon: FileText },
      { title: 'Google Keep', href: '/keep', icon: StickyNote },
      { title: 'Forms & Surveys', href: '/forms', icon: FileQuestion },
      { title: 'Calendar', href: '/calendar', icon: Calendar },
    ],
  },
];

function capitalize(s?: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export interface NotificationShellItem {
  id: string;
  isRead?: boolean;
  title?: string;
  text?: string;
  message?: string;
  createdAt?: string;
  time?: string;
  [key: string]: unknown;
}

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
  notifications: NotificationShellItem[];
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
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const notifTriggerRef = useRef<HTMLButtonElement>(null);

  const { data: notifData, reload: reloadNotifs } = useApi(
    "shell:notifications",
    () => apiClient.notifications.list(),
    { enabled: Boolean(user) }
  );

  const notifications = (notifData?.notifications as unknown as NotificationShellItem[]) || [];
  const unreadCount = notifData?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

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

    // Auto-open parent dropdown if child route is active
    const activeSection = navConfig.find((item) =>
      item.subItems?.some((sub) => isActive(pathname, sub.href))
    );
    if (activeSection) {
      setOpenSection(activeSection.title);
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
        const token = localStorage.getItem("pro-alumn_token") || localStorage.getItem("token") || localStorage.getItem("alumni_connect_token");
        if (token) {
          socket.emit("authenticate", token);
        }
      }
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

  const handleToggle = (title: string) => {
    if (collapsed) setCollapsed(false);
    setOpenSection(openSection === title ? null : title);
  };

  const isActiveDropdown = (item: NavItemConfig) => {
    if (!item.subItems) return false;
    return item.subItems.some((sub) => active(sub.href));
  };

  const displayName = user?.name ?? "Guest";
  const displayInitials = user?.initials ?? "G";
  const displayRole = capitalize(role);
  const displayYear = user?.classYear ?? "—";

  function sidebarContent(mobile: boolean) {
    const compact = collapsed && !mobile;
    
    return (
      <>
        <div className={`flex items-center justify-between ${compact ? "justify-center px-2" : "px-6"} pb-4`}>
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

        <nav className={`flex-1 overflow-y-auto px-3 py-2 space-y-1 ${compact ? "px-2" : ""}`}>
          {navConfig.map((item) => {
            const isStandardLink = !item.subItems;
            const isExactActive = item.href ? active(item.href) : false;
            const isDropActive = isActiveDropdown(item);
            
            const baseItemClasses = `w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isExactActive || (isDropActive && !openSection)
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
            } ${compact ? "justify-center px-0" : ""}`;

            if (isStandardLink) {
              return (
                <Link 
                  key={item.title} 
                  href={item.href as `/${string}`} 
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={baseItemClasses}
                  title={compact ? item.title : undefined}
                  aria-current={isExactActive ? "page" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 shrink-0 ${isExactActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {!compact && item.title}
                  </div>
                </Link>
              );
            }

            const isOpen = openSection === item.title;

            return (
              <div key={item.title} className="space-y-1">
                <button 
                  onClick={() => handleToggle(item.title)}
                  className={baseItemClasses}
                  title={compact ? item.title : undefined}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 shrink-0 ${isDropActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {!compact && item.title}
                  </div>
                  {!compact && (
                    isOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )
                  )}
                </button>
                
                {!compact && (
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pl-10 pr-2 py-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = active(subItem.href);
                        return (
                          <Link
                            key={subItem.title}
                            href={subItem.href as `/${string}`}
                            onClick={() => mobile && setSidebarOpen(false)}
                            aria-current={isSubActive ? "page" : undefined}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                              isSubActive 
                                ? 'text-blue-700 bg-blue-50/50 dark:text-blue-400 dark:bg-blue-500/10 font-semibold' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <subItem.icon className="w-4 h-4 opacity-70 shrink-0" />
                            {subItem.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`mt-auto space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4 bg-slate-50/50 dark:bg-slate-900/50 ${compact ? "px-2 pb-4" : "p-4"}`}>
          {compact ? (
            <Link
              href="/rewards"
              title={`Rewards: ${gamificationData?.totalPoints ?? 0} pts • 🔥 ${gamificationData?.streak?.current ?? 0}d streak`}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700/80 text-amber-700 dark:text-amber-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shadow-xs group"
            >
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold mt-1 text-slate-900 dark:text-slate-100">
                {gamificationData?.totalPoints ?? 0}
              </span>
            </Link>
          ) : (
            <Link
              href="/rewards"
              className="group block bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700/80 rounded-xl p-3 shadow-xs hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold tracking-wider text-amber-800 dark:text-amber-400 uppercase">Rewards</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-100/80 dark:bg-orange-950/60 px-1.5 py-0.5 rounded-md border border-orange-200/60 dark:border-orange-800/40">
                  <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                  {gamificationData?.streak?.current ?? 0}d streak
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {gamificationData?.totalPoints ?? 0}
                  </span>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-500">pts</span>
                </div>
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          )}

          <Link href="/profile" className={`flex items-center gap-3 rounded-lg py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${compact ? "justify-center" : "px-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm border-2 border-white dark:border-slate-800 ring-2 ring-slate-100 dark:ring-slate-700">
              {displayInitials}
            </div>
            {!compact && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {displayRole} • {displayYear}
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 cursor-pointer ${
              compact 
                ? "justify-center px-0 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400" 
                : "px-2 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            }`}
          >
            <LogOut size={18} className="shrink-0 opacity-75" />
            {!compact && "Sign out"}
          </button>
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
          <div className="flex flex-1 items-center gap-3">
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
            <Link
              href="/rewards"
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:scale-105 hover:border-amber-500/50 transition-all shadow-xs"
              title="Daily Active Streak"
            >
              <Flame size={15} className="text-orange-500 animate-pulse fill-orange-500/20" />
              <span>{gamificationData?.streak?.current ?? 0}d</span>
            </Link>

            <Link
              href="/rewards"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:scale-105 hover:border-blue-500/50 transition-all shadow-xs"
              title="Alumni Contribution Points"
            >
              <Coins size={14} className="text-blue-500" />
              <span>{gamificationData?.totalPoints ?? 0} pts</span>
            </Link>

            <ThemeToggle className="shrink-0" />
            
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
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
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
          {navConfig.slice(0, 5).map(({ title, href, icon: Icon, subItems }) => {
            const destHref = href || (subItems ? subItems[0].href : "");
            const isItemActive = (href && active(href)) || (subItems && subItems.some((s) => active(s.href)));
            
            return (
              <li key={title} className="flex-1">
                <Link
                  href={destHref as `/${string}`}
                  aria-current={isItemActive ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isItemActive
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon size={19} strokeWidth={isItemActive ? 2.2 : 1.6} />
                  <span className="text-[10px] leading-none mt-0.5">{title}</span>
                  {isItemActive && (
                    <span className="mt-0.5 h-0.5 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  );
}