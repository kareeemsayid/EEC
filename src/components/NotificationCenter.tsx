import React, { useState } from "react";
import { Bell, X, CircleCheck as CheckCircle2, Check } from "lucide-react";
import Tooltip from "./Tooltip";

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NotifType = "case" | "escalation" | "update" | "investigation";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  at: Date;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "case", title: "New case assigned", message: "Case EEC-2024-0042 has been assigned to you", time: "5 min ago", read: false, at: minutesAgo(5) },
  { id: 2, type: "escalation", title: "Escalation required", message: "Case EEC-2024-0038 requires immediate attention", time: "1 hour ago", read: false, at: minutesAgo(60) },
  { id: 3, type: "update", title: "Case updated", message: "Case EEC-2024-0041 stage changed to High Risk", time: "2 hours ago", read: true, at: minutesAgo(120) },
  { id: 4, type: "investigation", title: "Investigation closed", message: "INV-2024-0012 closed with findings", time: "1 day ago", read: true, at: minutesAgo(60 * 24) },
  { id: 5, type: "case", title: "Documentation due", message: "Case EEC-2024-0039 docs grace expires soon", time: "2 days ago", read: true, at: minutesAgo(60 * 48) },
];

function minutesAgo(m: number): Date {
  return new Date(Date.now() - m * 60 * 1000);
}

const TYPE_META: Record<NotifType, { chip: string; icon: React.ReactNode }> = {
  escalation: { chip: "bg-red-100 text-red-600", icon: <Bell className="w-3.5 h-3.5" /> },
  case: { chip: "bg-teal-100 text-teal-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  investigation: { chip: "bg-purple-100 text-purple-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  update: { chip: "bg-blue-100 text-blue-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

function bucketFor(date: Date): "Today" | "Yesterday" | "Earlier this week" {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  return "Earlier this week";
}

export default function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  };

  const buckets: Record<string, Notification[]> = { Today: [], Yesterday: [], "Earlier this week": [] };
  notifications.forEach((n) => {
    buckets[bucketFor(n.at)].push(n);
  });

  return (
    <>
      <Tooltip content="Notifications" position="bottom">
        <button
          onClick={() => onOpenChange(!open)}
          className="relative w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
              {unread}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
          <div className="fixed top-16 right-0 bottom-0 w-full sm:w-[360px] bg-white shadow-2xl border-l border-gray-200 z-50 animate-slide-right flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/40 to-transparent">
              <div className="flex items-center gap-2">
                <h3 className="font-barlow-condensed font-semibold text-lg text-navy-900">Notifications</h3>
                {unread > 0 && (
                  <span className="text-[10px] bg-teal-100 text-teal-700 rounded-full px-2 py-0.5 font-semibold">
                    {unread} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors"
                  disabled={unread === 0}
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
                <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-7 h-7 text-teal-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">You're all caught up</p>
                  <p className="text-xs text-gray-400 mt-1">No pending notifications.</p>
                </div>
              ) : (
                Object.entries(buckets).map(([bucketName, items]) =>
                  items.length === 0 ? null : (
                    <div key={bucketName}>
                      <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 border-b border-gray-50 z-10">
                        {bucketName}
                      </div>
                      {items.map((notif) => {
                        const meta = TYPE_META[notif.type];
                        return (
                          <div
                            key={notif.id}
                            className={`relative px-5 py-3 border-b border-gray-50 hover:bg-canvas/60 transition-colors cursor-pointer ${
                              !notif.read ? "bg-teal-50/30" : ""
                            }`}
                          >
                            {!notif.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-teal" />
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.chip}`}>
                                {meta.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-navy-900">{notif.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                              </div>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1 animate-pulse" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-canvas/50">
              <button className="w-full text-center text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
