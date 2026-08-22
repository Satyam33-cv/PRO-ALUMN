"use client";

import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { Bell, CheckCircle2, Clock } from "lucide-react";

export default function NotificationsPage() {
  const notifications: any[] = []; // Replaced mock data

  return (
    <RoleShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500">Your recent updates, messages, and alerts</p>
          </div>
        </div>

        <Card padding="md" className="border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No new notifications</div>
          ) : notifications.map((n) => (
            <div key={n.id} className="py-4 px-2 flex items-start gap-4 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <CheckCircle2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{n.text}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} /> {n.time}
                </p>
              </div>
              {n.unread && (
                <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </Card>
      </div>
    </RoleShell>
  );
}
