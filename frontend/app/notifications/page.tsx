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
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]">
                <Bell size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase font-bold tracking-[0.2em] text-black">
                  [ SECTION 06 // SYSTEM ALERTS ]
                </p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-black">Notifications</h1>
                <p className="font-mono text-xs text-neutral-600">Your recent updates, messages, referrals, and campus alerts</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white text-xs font-mono font-black uppercase text-black hover:bg-black hover:text-white shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                {markingRead ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] divide-y-2 divide-black overflow-hidden">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-black font-mono text-xs uppercase">
              <Loader2 size={22} className="animate-spin text-black" />
              Loading system notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-black font-mono text-xs">
              <Bell size={32} className="text-black mb-1" />
              <p className="font-black uppercase text-sm">No new notifications</p>
              <p className="text-neutral-500">When you receive referrals, messages, or event alerts, they will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.isRead;
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && handleMarkSingleRead(n.id)}
                  className={`py-4 px-5 flex items-start gap-4 transition-colors ${
                    isUnread
                      ? "bg-[#FFFBEA] hover:bg-[#FFF4C2] cursor-pointer"
                      : "bg-white hover:bg-neutral-50"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000000] ${
                    isUnread
                      ? "bg-[#FF5500] text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}>
                    <CheckCircle2 size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? "font-black text-black" : "font-bold text-neutral-800"}`}>
                      {n.title || n.text || n.message}
                    </p>
                    {n.content && n.content !== n.title && (
                      <p className="font-mono text-xs text-neutral-600 mt-1 line-clamp-2">
                        {n.content}
                      </p>
                    )}
                    <p className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-neutral-500 font-bold">
                      <Clock size={12} /> {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : (n.time || "Recent")}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="h-3 w-3 border-2 border-black bg-[#FF5500] shrink-0 mt-2 shadow-[1px_1px_0px_#000000]" title="Unread" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </RoleShell>
  );
}
