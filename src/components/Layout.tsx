import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import ConcentrixLogo from "./ConcentrixLogo";
import Tooltip from "./Tooltip";
import {
  LogOut,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  Search,
  HelpCircle,
  Briefcase,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_GROUPS = [
  {
    label: "General",
    items: [
      { to: "/", label: "Dashboard", icon: IconDashboard, end: true, tooltip: "Overview and KPIs" },
      { to: "/submit", label: "Submit Case", icon: IconPlus, end: false, tooltip: "Create a new attrition case" },
      { to: "/update", label: "Update Case", icon: IconEdit, end: false, tooltip: "Modify an existing case" },
      { to: "/my-cases", label: "My Cases", icon: IconFolder, end: false, tooltip: "View all your assigned cases" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { to: "/high-risk", label: "High Risk", icon: IconAlert, end: false, tooltip: "Critical cases requiring attention" },
      { to: "/attendance", label: "Attendance Log", icon: IconCalendar, end: false, tooltip: "Track attendance history" },
      { to: "/timeline", label: "Case Timeline", icon: IconTimeline, end: false, tooltip: "View case progression" },
    ],
  },
  {
    label: "Actions",
    items: [
      { to: "/termination", label: "Termination Center", icon: IconExit, end: false, tooltip: "Manage termination process" },
      { to: "/ps-dashboard", label: "PS Dashboard", icon: IconUsers, end: false, tooltip: "People Solutions overview" },
      { to: "/investigations", label: "Investigations", icon: IconSearch, end: false, tooltip: "HR Investigation cases" },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pageTitle =
    ALL_NAV.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
    )?.label || "Dashboard";

  const initials = user?.firstName?.[0]
    ? (user.firstName[0] + (user.lastName?.[0] || "")).toUpperCase()
    : user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  // Mock notifications - in production, this would come from SharePoint/API
  const [notifications] = useState([
    { id: 1, type: "case", title: "New case assigned", message: "Case EEC-2024-0042 has been assigned to you", time: "5 min ago", read: false },
    { id: 2, type: "escalation", title: "Escalation required", message: "Case EEC-2024-0038 requires immediate attention", time: "1 hour ago", read: false },
    { id: 3, type: "update", title: "Case updated", message: "Case EEC-2024-0041 stage changed to High Risk", time: "2 hours ago", read: true },
    { id: 4, type: "investigation", title: "Investigation closed", message: "INV-2024-0012 has been closed with findings", time: "1 day ago", read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-mesh font-barlow flex">
      {/* ---------- Sidebar ---------- */}
      <aside
        className={`hidden md:flex flex-col bg-gradient-to-b from-[#002D44] to-[#004060] text-white transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        } shrink-0 relative shadow-xl`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-4 border-b border-white/10 backdrop-blur-sm">
          {collapsed ? (
            <ConcentrixLogo size="sm" variant="light" />
          ) : (
            <ConcentrixLogo size="md" variant="light" />
          )}
        </div>

        {/* User mini-card with glass-morphism */}
        {!collapsed && (
          <div className="mx-3 mt-4 mb-2 glass-card-dark rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-teal flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden ring-2 ring-white/20 shadow-glow-teal">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate leading-tight">
                  {user?.firstName || user?.displayName?.split(" ")[0] || "User"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3 h-3 text-teal-300/70 shrink-0" />
                  <p className="text-teal-200/70 text-[11px] truncate leading-tight">
                    {user?.jobTitle || "Team Member"}
                  </p>
                </div>
                {user?.isPSUser && (
                  <span className="inline-block mt-1 text-[9px] bg-teal-500/30 text-teal-200 rounded px-1.5 py-0.5 font-medium">
                    PS Team
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <div className="flex justify-center mt-4 mb-2">
            <Tooltip content={`${user?.firstName || "User"} - ${user?.jobTitle || "Team Member"}`} position="right">
              <div className="w-10 h-10 rounded-full bg-gradient-teal flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-white/20 shadow-glow-teal cursor-pointer">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </Tooltip>
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-200/40 mb-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Tooltip key={item.to} content={item.tooltip} position={collapsed ? "right" : "top"}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-white/12 text-white shadow-sm"
                            : "text-teal-100/60 hover:bg-white/6 hover:text-white"
                        } ${collapsed ? "justify-center" : ""}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-teal shadow-[0_0_8px_2px_rgba(13,148,136,0.6)]" />
                          )}
                          <item.icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? "text-teal-300" : ""}`} />
                          {!collapsed && <span>{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`m-2 flex items-center justify-center gap-2 text-xs text-teal-200/50 hover:text-white py-2 rounded-xl hover:bg-white/5 transition-all ${
            collapsed ? "px-0" : "px-3"
          }`}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>

      {/* ---------- Mobile sidebar drawer ---------- */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-[#002D44] to-[#004060] text-white flex flex-col shadow-2xl animate-slide-right">
            <div className="h-16 flex items-center px-5 border-b border-white/10">
              <ConcentrixLogo size="md" variant="light" />
              <button
                className="ml-auto text-white/60 hover:text-white transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* User card */}
            <div className="mx-4 mt-4 mb-2 glass-card-dark rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-teal flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden ring-2 ring-white/20">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">{user?.displayName || "User"}</p>
                  <p className="text-teal-200/70 text-xs truncate">{user?.jobTitle || "Team Member"}</p>
                  {user?.isPSUser && (
                    <span className="inline-block mt-1 text-[9px] bg-teal-500/30 text-teal-200 rounded px-1.5 py-0.5 font-medium">
                      PS Team
                    </span>
                  )}
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-200/40 mb-1">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileNavOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive ? "bg-white/12 text-white" : "text-teal-100/60 hover:bg-white/6 hover:text-white"
                          }`
                        }
                      >
                        <item.icon className="w-[17px] h-[17px] shrink-0" />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            {/* Mobile logout */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => { setMobileNavOpen(false); logout(); }}
                className="w-full flex items-center gap-2 text-red-300 hover:text-red-200 text-sm py-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Main column ---------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar with glass-morphism */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-30 shadow-glass-sm">
          <Tooltip content="Open navigation menu" position="right">
            <button
              className="md:hidden text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </Tooltip>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-gray-300 text-lg">/</span>
            <h1 className="font-barlow-condensed font-semibold text-base text-gray-700 tracking-wide">
              {pageTitle}
            </h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm ml-4 hidden sm:block">
            <div className="relative group">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-teal-500 transition-colors" />
              <input
                placeholder="Search case, trainee, Oracle ID..."
                className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Tooltip content="View notifications" position="bottom">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </Tooltip>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-xl z-50 animate-fade-in-up border border-gray-200/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 to-transparent">
                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                    <span className="text-xs text-teal-600 font-medium">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                          !notif.read ? "bg-teal-50/30" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            notif.type === "escalation" ? "bg-red-500" :
                            notif.type === "investigation" ? "bg-purple-500" :
                            notif.type === "case" ? "bg-teal-500" : "bg-blue-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 animate-pulse" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                    <button className="w-full text-center text-xs text-teal-600 hover:text-teal-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Tooltip content="Help & support" position="bottom">
              <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all">
                <HelpCircle className="w-[18px] h-[18px]" />
              </button>
            </Tooltip>

            {/* User section with photo + name + title */}
            <div className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-gray-200/50">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-none">
                  {user?.firstName || user?.displayName?.split(" ")[0] || "User"}
                </p>
                <p className="text-xs text-gray-400 leading-none mt-0.5 flex items-center justify-end gap-1">
                  {user?.jobTitle || "Team Member"}
                  {user?.isPSUser && (
                    <span className="text-[10px] bg-teal-100 text-teal-700 rounded px-1.5 py-0.5 font-medium">
                      PS
                    </span>
                  )}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-xl bg-gradient-teal flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-teal-300/50 transition-all overflow-hidden shrink-0 shadow-glow-teal"
                >
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 glass-card rounded-xl shadow-xl py-1 z-50 animate-fade-in-up border border-gray-200/50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-teal flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 shadow-glow-teal">
                        {user?.photoUrl ? (
                          <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <p className="text-xs text-teal-600 font-medium mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {user?.jobTitle || "Team Member"}
                        </p>
                      </div>
                    </div>
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <User className="w-4 h-4" />
                        View Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={() => { setMenuOpen(false); logout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile avatar only */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-xl bg-gradient-teal flex items-center justify-center text-white font-semibold text-sm overflow-hidden shadow-glow-teal"
              >
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-lg py-1 z-50 border border-gray-200/50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{user?.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Inline icon set ---------------- */

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="9" rx="1.5" strokeWidth={2} />
      <rect x="14" y="3" width="7" height="5" rx="1.5" strokeWidth={2} />
      <rect x="14" y="12" width="7" height="9" rx="1.5" strokeWidth={2} />
      <rect x="3" y="16" width="7" height="5" rx="1.5" strokeWidth={2} />
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.12 2.12 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86l-8.18 14A1 1 0 003 19h18a1 1 0 00.89-1.45l-8.18-14a1 1 0 00-1.72 0z" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconTimeline({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconExit({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m4 6H5a2 2 0 01-2-2V6a2 2 0 012-2h6" />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  );
}
function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
    </svg>
  );
}
