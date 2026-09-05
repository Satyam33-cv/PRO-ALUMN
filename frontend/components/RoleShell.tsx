"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  ChevronRight,
  LogOut,
  Menu,
  X,
  User,
  Activity,
  Cpu,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole } from "@/lib/context/AuthContext";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import { getSocket } from "@/lib/socket";

type Role = UserRole;

export interface NavProtocolItem {
  id: string;
  index: string;
  title: string;
  href: string;
  adminOnly?: boolean;
}

const PROTOCOLS: NavProtocolItem[] = [
  { id: "dashboard", index: "01", title: "Dashboard", href: "/dashboard" },
  { id: "directory", index: "02", title: "Alumni Directory", href: "/directory" },
  { id: "jobs", index: "03", title: "Jobs & Referrals", href: "/jobs" },
  { id: "mentorship", index: "04", title: "Mentorship Hub", href: "/mentorship" },
  { id: "events", index: "05", title: "Events & RSVPs", href: "/events" },
  { id: "stories", index: "06", title: "Success Stories", href: "/stories" },
  { id: "admin", index: "07", title: "Admin Command Center", href: "/admin", adminOnly: true },
];

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
      const focusable = panel.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
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
      aria-label="System Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-80 md:w-96 overflow-hidden border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 bg-[#F7F4EE] dark:bg-[#12151b] shadow-[4px_4px_0_#1A1A1A] dark:shadow-[4px_4px_0_#333]"
    >
      <div className="flex items-center justify-between border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-800 px-4 py-3 bg-[#EFECE4] dark:bg-[#181a20]">
        <div className="flex items-center gap-2">
          <span className="text-[#FF5500] font-mono text-xs font-bold">/////</span>
          <p className="font-headline text-xs uppercase font-bold text-[#1A1A1A] dark:text-white tracking-tight">
            NOTIFICATIONS WIRE
          </p>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={onMarkAllRead}
              className="font-mono text-[10px] text-[#FF5500] hover:underline font-bold ml-2 cursor-pointer"
            >
              [CLEAR ALL]
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onClose();
            triggerRef.current?.focus();
          }}
          className="p-1 text-[#1A1A1A] dark:text-neutral-300 hover:bg-[#D5CEBF] dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close notifications"
        >
          <X size={16} />
        </button>
      </div>
      <ul className="max-h-80 divide-y-[1.5px] divide-[#D5CEBF]/60 dark:divide-neutral-800 overflow-y-auto font-sans">
        {notifications.length === 0 ? (
          <li className="px-4 py-8 text-center font-mono text-xs text-neutral-500">
            [QUEUE EMPTY] • ZERO PENDING PROTOCOLS
          </li>
        ) : (
          notifications.map((n) => (
            <li
              key={n.id}
              className={`p-3.5 transition-colors hover:bg-[#ebe8e2] dark:hover:bg-[#181a20] ${
                !n.isRead ? "bg-white dark:bg-[#15181f]" : ""
              }`}
            >
              <p className="font-headline text-xs font-bold text-[#1A1A1A] dark:text-neutral-100">
                {n.title || n.message || n.text}
              </p>
              {n.message && n.title && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  {n.message}
                </p>
              )}
              <p className="mt-1 font-mono text-[10px] uppercase text-neutral-500">
                {n.createdAt
                  ? new Date(n.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "JUST NOW"}
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

  const markAllRead = async () => {
    try {
      await apiClient.notifications.readAll();
      reloadNotifs();
    } catch {
      // Non-blocking UI update
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
        const token =
          localStorage.getItem("pro-alumn_token") ||
          localStorage.getItem("token") ||
          localStorage.getItem("alumni_connect_token");
        if (token) {
          socket.emit("authenticate", token);
        }
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcf9f3] dark:bg-[#0c0e12]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin border-2 border-[#1A1A1A] dark:border-white border-t-[#FF5500]" />
          <span className="font-mono text-xs tracking-wider text-neutral-600 dark:text-neutral-400">
            INITIALIZING CORE ROUTING...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  function handleSignOut() {
    signOut();
    router.push("/login");
  }

  const isProtocolActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const displayName = user?.name || "Elena Vance, Ph.D.";
  const displayRoleLabel =
    role === "admin"
      ? "SUPER ADMIN // CORE DISPATCH"
      : role === "alumni"
      ? `ALUMNI SPONSOR • COHORT '${user?.classYear ? user.classYear.slice(-2) : "22"}`
      : `FELLOW / COHORT '${user?.classYear ? user.classYear.slice(-2) : "26"}`;

  const AsideNav = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside className="h-full w-72 bg-[#F7F4EE] dark:bg-[#12151b] flex flex-col justify-between border-r-[1.5px] border-[#1A1A1A] dark:border-neutral-800">
      <div className="flex flex-col">
        {/* Aside Header */}
        <div className="h-16 px-4 flex items-center justify-between bg-[#F7F4EE] dark:bg-[#12151b] border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-800">
          <Link
            href="/dashboard"
            onClick={() => isMobile && setSidebarOpen(false)}
            className="flex items-center gap-2.5"
          >
            <span className="flex items-center justify-center w-8 h-8 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#ffffff]">
              PA
            </span>
            <div className="flex flex-col">
              <span className="font-headline text-base tracking-tight text-[#1A1A1A] dark:text-white font-bold leading-none uppercase">
                PRO-ALUMN
              </span>
              <span className="font-mono text-[10px] text-neutral-500 tracking-tight mt-0.5">
                NETWORK CORE v2.4
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#e5e2dc] dark:bg-[#1c1f26] text-[#1A1A1A] dark:text-neutral-300 border border-[#1A1A1A] dark:border-neutral-700 font-bold">
              SYS.OK
            </span>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 border border-[#1A1A1A] dark:border-neutral-700"
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Index Protocols Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <span className="font-headline text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
            INDEX PROTOCOLS
          </span>
          <span className="font-mono text-[11px] text-neutral-500">[07]</span>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col px-3 gap-1.5" aria-label="System navigation">
          {PROTOCOLS.map((p) => {
            const active = isProtocolActive(p.href);
            // If adminOnly, still visible if user is admin or as preview
            if (p.adminOnly && role !== "admin") return null;

            return (
              <Link
                key={p.id}
                href={p.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-bold uppercase transition-all duration-150 border-[1.5px] ${
                  active
                    ? "bg-black text-white dark:bg-white dark:text-black border-[#1A1A1A] dark:border-neutral-300 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#FFFFFF]"
                    : "bg-transparent text-neutral-700 dark:text-neutral-300 border-transparent hover:border-[#1A1A1A] dark:hover:border-neutral-700 hover:bg-[#ebe8e2] dark:hover:bg-[#181a20]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-[11px] ${
                      active ? "text-[#FF5500]" : "text-neutral-400"
                    }`}
                  >
                    {p.index}
                  </span>
                  <span className="font-headline tracking-tight">{p.title}</span>
                </span>
                <span className="font-mono text-xs opacity-70">→</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Aside Footer: Vector Runtime Status & Sign Out */}
      <div className="p-3.5 flex flex-col gap-2.5 bg-[#EFECE4] dark:bg-[#181a20] border-t-[1.5px] border-[#1A1A1A] dark:border-neutral-800">
        <div className="flex items-center justify-between px-1">
          <span className="font-headline text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            VECTOR RUNTIME
          </span>
          <span className="font-mono text-[10px] text-[#FF5500] font-bold">HNSW:OK</span>
        </div>

        <div className="p-2.5 bg-white dark:bg-[#12151b] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 flex items-center justify-between shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333]">
          <div className="flex flex-col">
            <span className="font-headline text-[9px] uppercase font-bold text-neutral-500">
              EMBEDDING DIM
            </span>
            <span className="font-mono text-xs font-bold text-[#1A1A1A] dark:text-white">
              1536_ADA002
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]" />
        </div>

        {/* User quick badge & sign out */}
        <div className="pt-2 border-t border-[#D5CEBF] dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-mono text-[10px] font-bold border border-[#1A1A1A]">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "ID"}
            </div>
            <div className="truncate">
              <p className="font-headline text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                {user.name}
              </p>
              <p className="font-mono text-[9px] text-neutral-500 uppercase truncate">
                {role}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 border border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#12151b] hover:bg-[#FF5500] hover:text-white transition-colors cursor-pointer"
            aria-label="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#fcf9f3] dark:bg-[#0c0e12] text-[#1c1c18] dark:text-[#f3f0ea] font-sans antialiased">
      {/* Desktop Fixed Aside Rail */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-50">
        <AsideNav />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-2xl"
            >
              <AsideNav isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content wrapper offset by 72 (18rem) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Broadsheet Header */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#F7F4EE]/95 dark:bg-[#0c0e12]/95 backdrop-blur-md z-40 px-4 sm:px-6 flex items-center justify-between border-b-[1.5px] border-[#1A1A1A] dark:border-neutral-800">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 bg-white dark:bg-[#181a20] shadow-[2px_2px_0_#1A1A1A] lg:hidden"
              aria-label="Open Navigation"
            >
              <Menu size={18} />
            </button>

            {/* Global Search integrated */}
            <div className="flex-1">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* PGVector Latency Pill */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00E676] shadow-[0_0_4px_#00E676]" />
                <span className="font-headline text-[10px] uppercase font-bold text-[#1A1A1A] dark:text-white">
                  PGVECTOR
                </span>
              </div>
              <span className="text-neutral-400 font-mono text-[10px]">|</span>
              <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
                LATENCY: 14ms
              </span>
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                ref={notifTriggerRef}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className="relative flex items-center justify-center w-9 h-9 bg-white dark:bg-[#181a20] border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333] hover:bg-[#ebe8e2] dark:hover:bg-[#20242c] transition-colors cursor-pointer"
                type="button"
              >
                <Bell size={18} className="text-[#1A1A1A] dark:text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5500]" />
                )}
              </button>
              <NotificationPanel
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                triggerRef={notifTriggerRef}
                notifications={notifications}
                onMarkAllRead={markAllRead}
              />
            </div>

            {/* Theme Toggle */}
            <div className="border-[1.5px] border-[#1A1A1A] dark:border-neutral-700 shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#333]">
              <ThemeToggle />
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l-[1.5px] border-[#D5CEBF] dark:border-neutral-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="font-headline text-xs font-bold text-[#1A1A1A] dark:text-white leading-tight">
                  {displayName}
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#D9E021] text-black border border-[#1A1A1A] uppercase font-bold leading-none mt-1">
                  {displayRoleLabel}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center border-[1.5px] border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] dark:shadow-[2px_2px_0_#ffffff] font-mono text-xs font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="w-full pt-16 flex-1 bg-[#fcf9f3] dark:bg-[#0c0e12]">
          {children}
        </main>
      </div>
    </div>
  );
}