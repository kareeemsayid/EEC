import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, FileText, MapPin, TriangleAlert as AlertTriangle, UserCog, Clock } from "lucide-react";
import { apiFetch } from "../api";

interface Notification {
  id: string;
  type: "attrition" | "relocation" | "escalation" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const POLL_INTERVAL = 30000;

const ICON_MAP: Record<string, React.ElementType> = {
  attrition: FileText,
  relocation: MapPin,
  escalation: AlertTriangle,
  system: UserCog,
};

const COLOR_MAP: Record<string, string> = {
  attrition: "#2563EB",
  relocation: "#7C3AED",
  escalation: "#EF4444",
  system: "#00C4B4",
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "attrition" | "relocation">("all");
  const [ringing, setRinging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ count: number }>("/notifications/unread-count");
      const count = data.count || 0;
      if (count > prevCount.current && prevCount.current !== 0) {
        setRinging(true);
        setTimeout(() => setRinging(false), 600);
      }
      prevCount.current = count;
      setUnreadCount(count);
    } catch {
      // Endpoint may not exist yet; silently ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<Notification[]>("/notifications");
      setNotifications(data || []);
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/read/${id}`, { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently ignore
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently ignore
    }
  };

  const filtered = activeTab === "all"
    ? notifications
    : activeTab === "attrition"
    ? notifications.filter(n => n.type === "attrition" || n.type === "escalation")
    : notifications.filter(n => n.type === "relocation");

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  const formatTime = (time: string) => {
    const diff = Date.now() - new Date(time).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl transition-colors hover:bg-slate-50 ${ringing ? "animate-bell-ring" : ""}`}
        style={{ color: "#64748B" }}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {displayCount ? (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: "#EF4444", boxShadow: "0 0 6px rgba(239,68,68,0.4)" }}
          >
            {displayCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl overflow-hidden z-50"
            style={{
              background: "white",
              border: "1px solid #E2E8F0",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: "#00C4B4" }} />
                <h3 className="text-sm font-bold" style={{ color: "#0D2B45" }}>Notifications</h3>
                {displayCount ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#EF4444" }}>
                    {displayCount}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-teal-50"
                    style={{ color: "#00C4B4" }}
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" style={{ color: "#94A3B8" }} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid #F1F5F9" }}>
              {([
                { key: "all", label: "All" },
                { key: "attrition", label: "Attrition" },
                { key: "relocation", label: "Relocation" },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={activeTab === tab.key
                    ? { background: "rgba(0,196,180,0.1)", color: "#00C4B4" }
                    : { color: "#94A3B8" }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications</p>
                  <p className="text-xs text-gray-300 mt-1">You're all caught up!</p>
                </div>
              ) : (
                filtered.slice(0, 20).map((n, idx) => {
                  const Icon = ICON_MAP[n.type] || Bell;
                  const color = COLOR_MAP[n.type] || "#00C4B4";
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                      style={{
                        borderBottom: "1px solid #F8FAFC",
                        background: n.read ? "transparent" : "rgba(0,196,180,0.03)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate" style={{ color: "#0D2B45" }}>{n.title}</p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#00C4B4" }} />
                          )}
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#64748B" }}>{n.message}</p>
                        <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "#94A3B8" }}>
                          <Clock className="w-3 h-3" />
                          {formatTime(n.time)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
