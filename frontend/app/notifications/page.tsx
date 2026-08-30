"use client";

import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { Bell, CheckCircle2, Clock, CheckCheck, Loader2 } from "lucide-react";
import { useApi } from "@/lib/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { useState } from "react";

interface NotificationItem {
  id: string;
  isRead?: boolean;
  title?: string;
  text?: string;
  message?: string;
  content?: string;
  createdAt?: string;
  time?: string;
}

export default function NotificationsPage() {
  const { data: notifData, refresh: reloadNotifs, isLoading } = useApi(
    "notifications:list",
    () => apiClient.notifications.list()
  );
  const [markingRead, setMarkingRead] = useState(false);

  const notifications = (notifData?.notifications as unknown as NotificationItem[]) || [];
  const unreadCount = notifData?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      setMarkingRead(true);
      await apiClient.notifications.readAll();
      reloadNotifs();
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await apiClient.notifications.markRead(id);
      reloadNotifs();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  return (
    <RoleShell>
      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your recent updates, messages, and alerts</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingRead}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              {markingRead ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
              Mark all as read
            </button>
          )}
        </div>

        <Card padding="none" className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-slate-500 dark:text-slate-400 text-sm">
              <Bell size={28} className="text-slate-300 dark:text-slate-600 mb-1" />
              <p className="font-semibold text-slate-800 dark:text-slate-200">No new notifications</p>
              <p className="text-xs text-slate-400">When you receive referrals, messages, or event alerts, they will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.isRead;
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && handleMarkSingleRead(n.id)}
                  className={`py-4 px-4 flex items-start gap-4 transition-colors ${
                    isUnread
                      ? "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 cursor-pointer"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isUnread
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                      {n.title || n.text || n.message}
                    </p>
                    {n.content && n.content !== n.title && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.content}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} /> {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : (n.time || "Recent")}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-2" title="Unread" />
                  )}
                </div>
              );
            })
          )}
        </Card>
      </div>
    </RoleShell>
  );
}
