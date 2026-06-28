import React, { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { UserRole } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings as SettingsIcon, Menu, X, Search, CircleHelp as HelpCircle, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Home, MapPin, TriangleAlert as AlertTriangle, Plus, FolderOpen, SquarePen as PenSquare, FileSearch, BarChart2, Calendar, UserCog, Bell, Activity, User } from "lucide-react";

interface LayoutProps { children: React.ReactNode; }

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badge?: string;
  tooltip?: string;
}

interface NavGroup {
  label: string;
  tooltip?: string;
  items: NavItem[];
}

const ROLE_LABELS: Record<string, string> = {
  Trainer:   "Training Specialist",
  Supervisor:"Training Supervisor",
  Manager:   "Training Manager",
  SrManager: "Senior Manager",
  PS:        "People Solutions",
  TA:        "Talent Acquisition",
  Admin:     "System Admin",
};

const ROLE_COLORS: Record<string, { bg: string }> = {
  Trainer:   { bg: "#2563EB" },
  Supervisor:{ bg: "#0EA5E9" },
  Manager:   { bg: "#7C3AED" },
  SrManager: { bg: "#1E3A5F" },
  PS:        { bg: "#F59E0B" },
  TA:        { bg: "#7C3AED" },
  Admin:     { bg: "#EF4444" },
};

function getRoleDashboard(role?: string): string {
  switch (role) {
    case "Trainer":   return "/dashboard/trainer";
    case "Supervisor":return "/dashboard/supervisor";
    case "Manager":
    case "SrManager": return "/dashboard/manager";
    case "PS":        return "/ps-dashboard";
    case "TA":        return "/dashboard/ta";
    case "Admin":     return "/admin";
    default:          return "/";
  }
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { to: "/", label: "Home", icon: Home, tooltip: "Your command center" },
    ],
  },
  {
    label: "Attrition",
    tooltip: "Manage attrition cases and exit processes",
    items: [
      { to: "/submit",        label: "Submit Case",        icon: Plus,          tooltip: "Open a new attrition case" },
      { to: "/my-cases",      label: "My Cases",           icon: FolderOpen,    tooltip: "View all your cases" },
      { to: "/update",        label: "Update Case",        icon: PenSquare,     tooltip: "Update an existing case" },
      { to: "/termination",   label: "Termination Center", icon: LogOut,        tooltip: "Review termination workflows", roles: ["PS","SrManager","Manager"] },
      { to: "/investigations",label: "Investigations",     icon: FileSearch,    tooltip: "HR investigation queue",     roles: ["PS","SrManager","Manager"] },
      { to: "/high-risk",     label: "High Risk",          icon: AlertTriangle, tooltip: "Critical & high-risk cases", roles: ["TA","PS","SrManager","Manager","Supervisor"], badge: "!" },
    ],
  },
  {
    label: "Relocations",
    tooltip: "Handle employee relocation requests",
    items: [
      { to: "/relocations",        label: "All Relocations",   icon: MapPin, tooltip: "View all relocation requests" },
      { to: "/relocations/submit", label: "Submit Relocation", icon: Plus,   tooltip: "Submit a new relocation request" },
    ],
  },
  {
    label: "Analytics",
    tooltip: "Performance metrics and reporting",
    items: [
      { to: "/analytics",  label: "Analytics Dashboard", icon: BarChart2, tooltip: "View SLA and performance data", roles: ["TA","PS","SrManager","Manager","Admin"] },
      { to: "/attendance", label: "Attendance Log",      icon: Calendar,  tooltip: "Track attendance records",      roles: ["TA","PS","SrManager","Manager"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin", label: "User Management", icon: UserCog, tooltip: "Manage users and permissions", roles: ["Admin"] },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/":                    "Home",
  "/dashboard/trainer":   "My Dashboard",
  "/dashboard/supervisor":"My Teams",
  "/dashboard/manager":   "Account Overview",
  "/dashboard/ta":        "Relocation Hub",
  "/ps-dashboard":        "Command Center",
  "/admin":               "Administration",
  "/submit":              "Submit Case",
  "/my-cases":            "My Cases",
  "/update":              "Update Case",
  "/termination":         "Termination Center",
  "/investigations":      "Investigations",
  "/high-risk":           "High Risk Cases",
  "/relocations":         "Relocations",
  "/relocations/submit":  "Submit Relocation",
  "/analytics":           "Analytics",
  "/attendance":          "Attendance Log",
  "/settings":            "Settings",
  "/profile":             "Profile",
  "/help":                "Help & Support",
  "/support":             "Support",
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; }
    catch { return false; }
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed)); }
    catch { /* no-op */ }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(s => !s); }
      if (e.key === "Escape") { setSearchOpen(false); setDropdownOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const userRole = user?.role as UserRole | undefined;
  const roleLabel = ROLE_LABELS[userRole || ""] || userRole || "User";
  const roleColors = ROLE_COLORS[userRole || ""] || ROLE_COLORS.Trainer;
  const roleDashboard = getRoleDashboard(userRole);

  const initials = useMemo(() => {
    if (!user?.displayName) return "?";
    return user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  }, [user?.displayName]);

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.filter(item => !item.roles || (userRole && item.roles.includes(userRole))),
    })).filter(g => g.items.length > 0);
  }, [userRole]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    const key = Object.keys(PAGE_TITLES).find(k => k !== "/" && path.startsWith(k));
    return key ? PAGE_TITLES[key] : "EEC";
  }, [location.pathname]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    toast.success("Signed out successfully");
  };

  const allItems = visibleGroups.flatMap(g => g.items);
  const filteredSearch = useMemo(() => {
    if (!searchVal.trim()) return allItems;
    const q = searchVal.toLowerCase();
    return allItems.filter(i => i.label.toLowerCase().includes(q));
  }, [allItems, searchVal]);

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <div className="min-h-screen" style={{ background: "#EEF2FF" }}>

      {/* Sidebar CSS animations */}
      <style>{`
        @keyframes sidebar-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.08); }
        }
        @keyframes sidebar-shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes logo-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.12); opacity: 0.9; }
        }
        @keyframes avatar-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(0,196,180,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(0,196,180,0.7), 0 0 12px rgba(0,196,180,0.3); }
        }
        @keyframes nav-underline-slide {
          from { width: 0; opacity: 0; }
          to { width: 100%; opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes eec-text-glow {
          0%, 100% { text-shadow: 0 0 8px rgba(0,196,180,0.3); }
          50% { text-shadow: 0 0 20px rgba(0,196,180,0.8), 0 0 40px rgba(0,196,180,0.3); }
        }

        .sidebar-nav-item {
          position: relative;
          overflow: hidden;
          will-change: transform;
        }
        .sidebar-nav-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.05);
          opacity: 0;
          transition: opacity 200ms ease;
          border-radius: 12px;
        }
        .sidebar-nav-item:hover::before {
          opacity: 1;
        }
        .sidebar-nav-item .nav-icon {
          transition: transform 200ms ease, color 200ms ease;
          will-change: transform;
        }
        .sidebar-nav-item:hover .nav-icon {
          transform: scale(1.15) rotate(5deg);
        }
        .sidebar-nav-item .nav-label-underline {
          position: absolute;
          bottom: -1px;
          left: 0;
          height: 1px;
          background: rgba(0,196,180,0.6);
          width: 0;
          transition: width 250ms ease;
        }
        .sidebar-nav-item:hover .nav-label-underline {
          width: 100%;
        }

        .logo-glow-ring {
          animation: logo-ring-pulse 3s ease-in-out infinite;
        }
        .avatar-online {
          animation: avatar-ring-pulse 2.5s ease-in-out infinite;
        }
        .eec-text-animated {
          animation: eec-text-glow 3s ease-in-out infinite;
        }
        .sidebar-shimmer-sweep {
          animation: sidebar-shimmer 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .sidebar-bg-glow {
          animation: sidebar-glow 8s ease-in-out infinite;
        }

        .nav-active-bar {
          position: absolute;
          left: 0;
          top: 4px;
          bottom: 4px;
          width: 3px;
          background: #00C4B4;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 8px rgba(0,196,180,0.6);
        }

        .sidebar-tooltip {
          pointer-events: none;
          opacity: 0;
          transition: opacity 150ms ease 200ms;
        }
        .sidebar-nav-item:hover .sidebar-tooltip {
          opacity: 1;
        }

        .profile-section:hover {
          transform: translateY(-2px);
        }
        .profile-section {
          transition: transform 200ms ease;
        }
      `}</style>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(7,28,46,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: sidebarWidth,
          background: "linear-gradient(180deg, #0D2B45 0%, #071C2E 60%, #0A2030 100%)",
          boxShadow: sidebarCollapsed ? "4px 0 16px rgba(0,0,0,0.2)" : "4px 0 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,196,180,0.08)",
          transition: "width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          borderRight: "1px solid rgba(0,196,180,0.08)",
        }}>

        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Radial glow from logo area */}
          <div
            className="absolute sidebar-bg-glow"
            style={{
              top: -40,
              left: -40,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,196,180,0.2) 0%, transparent 70%)",
            }}
          />
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          {/* Shimmer sweep */}
          <div
            className="absolute top-0 bottom-0 sidebar-shimmer-sweep"
            style={{
              width: 60,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
            }}
          />
        </div>

        {/* ── LOGO AREA ── */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            height: 80,
            borderBottom: "1px solid rgba(0,196,180,0.12)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => navigate("/")}
            className="group relative flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-300"
            style={{ minWidth: 0 }}
          >
            {/* Logo wrapper with glow ring */}
            <div className="relative shrink-0">
              {/* Outer glow ring */}
              <div
                className="absolute logo-glow-ring"
                style={{
                  inset: -8,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(0,196,180,0.4)",
                  transition: "all 300ms ease",
                }}
              />
              {/* Inner glow on hover */}
              <div
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  inset: -4,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,196,180,0.25) 0%, transparent 70%)",
                }}
              />
              {/* Logo image */}
              <div
                className="relative z-10 flex items-center justify-center rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  width: sidebarCollapsed ? 36 : 42,
                  height: sidebarCollapsed ? 36 : 42,
                  background: "rgba(0,196,180,0.12)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  transition: "width 300ms ease, height 300ms ease",
                }}
              >
                <img
                  src="/assets/images/concentrix-mark.png"
                  alt="Concentrix"
                  style={{
                    width: sidebarCollapsed ? 24 : 30,
                    height: "auto",
                    filter: "brightness(0) invert(1)",
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            </div>

            {/* EEC Text */}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative overflow-hidden"
                >
                  <div className="flex flex-col leading-none">
                    <span
                      className="font-bold text-xl tracking-[0.08em] eec-text-animated group-hover:tracking-[0.12em] transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, #00C4B4 0%, #FFFFFF 60%, #00C4B4 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        backgroundSize: "200% 100%",
                      }}
                    >
                      EEC
                    </span>
                    <span
                      className="text-[9px] font-medium uppercase tracking-[0.18em] transition-all duration-300"
                      style={{ color: "rgba(0,196,180,0.5)" }}
                    >
                      Command Center
                    </span>
                  </div>
                  {/* Underline slide-in on hover */}
                  <div
                    className="absolute bottom-0 left-0 h-px opacity-0 group-hover:opacity-100 group-hover:w-full"
                    style={{
                      width: 0,
                      background: "linear-gradient(90deg, #00C4B4, transparent)",
                      transition: "width 350ms ease, opacity 200ms ease",
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed tooltip */}
            {sidebarCollapsed && (
              <div
                className="sidebar-tooltip absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                style={{
                  background: "#0D2B45",
                  color: "#00C4B4",
                  border: "1px solid rgba(0,196,180,0.3)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  letterSpacing: "0.08em",
                }}
              >
                EEC
              </div>
            )}
          </button>
        </div>

        {/* ── NAVIGATION ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin" style={{ paddingLeft: sidebarCollapsed ? 0 : 8, paddingRight: sidebarCollapsed ? 0 : 8 }}>
          {visibleGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5 px-3 mb-1.5"
                    title={group.tooltip}
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: "rgba(0,196,180,0.45)" }}
                    >
                      {group.label}
                    </span>
                    {group.tooltip && (
                      <div
                        className="w-3 h-3 rounded-full flex items-center justify-center cursor-help"
                        style={{ background: "rgba(0,196,180,0.15)", color: "rgba(0,196,180,0.5)", fontSize: 7, fontWeight: 700 }}
                        title={group.tooltip}
                      >
                        ?
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {group.items.map((item, idx) => {
                  const isActive = item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname === item.to || location.pathname.startsWith(item.to + "/");

                  return (
                    <SidebarNavItem
                      key={item.to}
                      item={item}
                      collapsed={sidebarCollapsed}
                      isActive={isActive}
                      delay={idx * 30}
                      onNavigate={(to) => { navigate(to); setMobileOpen(false); }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* My Dashboard shortcut */}
          {roleDashboard !== "/" && (
            <div className="mt-5">
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: "rgba(0,196,180,0.45)" }}
                  >
                    Dashboard
                  </motion.p>
                )}
              </AnimatePresence>
              <SidebarNavItem
                item={{ to: roleDashboard, label: "My Dashboard", icon: Activity, tooltip: "Your personalized dashboard" }}
                collapsed={sidebarCollapsed}
                isActive={location.pathname === roleDashboard}
                delay={0}
                onNavigate={(to) => { navigate(to); setMobileOpen(false); }}
              />
            </div>
          )}
        </nav>

        {/* ── PROFILE SECTION ── */}
        <div style={{ borderTop: "1px solid rgba(0,196,180,0.1)" }}>
          <button
            onClick={() => navigate("/profile")}
            className="profile-section w-full flex items-center gap-3 px-3 py-3 transition-colors group"
            style={{
              background: "transparent",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,196,180,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {/* Avatar with pulsing ring */}
            <div className="relative shrink-0">
              <div
                className="avatar-online rounded-full overflow-hidden"
                style={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg, #00C4B4 0%, #0D2B45 100%)",
                }}
              >
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.displayName || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
                style={{ background: "#22C55E", border: "2px solid #071C2E" }}
              />
            </div>

            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 text-left min-w-0"
                >
                  <p
                    className="text-sm font-semibold truncate leading-none"
                    style={{ color: "#FFFFFF", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                  >
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-[11px] mt-0.5 font-medium truncate" style={{ color: "#00C4B4" }}>
                    {user?.jobTitle || roleLabel}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed tooltip */}
            {sidebarCollapsed && (
              <div
                className="sidebar-tooltip absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{
                  background: "white",
                  color: "#0D2B45",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  border: "1px solid #E2E8F0",
                }}
              >
                {user?.displayName || "User"}
              </div>
            )}
          </button>

          {/* Bottom actions (expanded only) */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 pb-1 space-y-0.5"
              >
                <SidebarBottomAction icon={SettingsIcon} label="Settings" onClick={() => navigate("/settings")} />
                <SidebarBottomAction icon={HelpCircle} label="Help & Support" onClick={() => navigate("/help")} />
                <SidebarBottomAction icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <div className="flex justify-center pb-3 pt-1">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                width: 32,
                height: 32,
                background: "linear-gradient(135deg, #0D2B45 0%, rgba(0,196,180,0.3) 100%)",
                border: "1px solid rgba(0,196,180,0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.div
                animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 20 }}
              >
                {sidebarCollapsed
                  ? <ChevronsRight className="w-3.5 h-3.5" style={{ color: "#00C4B4" }} />
                  : <ChevronsLeft className="w-3.5 h-3.5" style={{ color: "#00C4B4" }} />
                }
              </motion.div>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl shadow-lg"
        style={{ background: "#0D2B45", border: "1px solid rgba(0,196,180,0.3)" }}
      >
        {mobileOpen
          ? <X className="w-5 h-5" style={{ color: "#00C4B4" }} />
          : <Menu className="w-5 h-5" style={{ color: "#00C4B4" }} />
        }
      </button>

      {/* ── MAIN CONTENT ── */}
      <div
        className="min-h-screen flex flex-col"
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >

        {/* ── TOP BAR ── */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 px-6 lg:px-8"
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #F1F5F9",
            height: 64,
            boxShadow: "0 1px 3px rgba(30,58,95,0.06)",
          }}
        >
          <div className="hidden lg:block min-w-0">
            <h1 className="text-lg font-bold truncate" style={{ color: "#0F172A" }}>{pageTitle}</h1>
          </div>
          <div className="flex-1" />

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-3 px-4 h-10 rounded-xl transition-all hover:border-teal-300 hover:shadow-sm"
            style={{ background: "#F8FAFF", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: 14, minWidth: 280 }}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Search cases, employees...</span>
            <kbd className="text-[11px] px-1.5 py-0.5 rounded font-mono" style={{ background: "#F1F5F9", color: "#94A3B8", border: "1px solid #E2E8F0" }}>⌘K</kbd>
          </button>

          {/* Bell */}
          <button className="relative p-2 rounded-xl transition-colors hover:bg-slate-50" style={{ color: "#64748B" }}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#EF4444", border: "2px solid white" }} />
          </button>

          <div style={{ width: 1, height: 24, background: "#F1F5F9" }} />

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-colors hover:bg-slate-50"
            >
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2" style={{ boxShadow: "0 0 0 2px rgba(0,196,180,0.25)" }} />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${roleColors.bg}, ${roleColors.bg}CC)` }}
                >
                  {initials}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold leading-none" style={{ color: "#0F172A" }}>{user?.displayName?.split(" ")[0] || "User"}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{roleLabel}</p>
              </div>
              <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 hidden md:block" style={{ color: "#94A3B8" }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50"
                  style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
                    <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{user?.displayName}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem icon={User} label="Profile" onClick={() => { navigate("/profile"); setDropdownOpen(false); }} />
                    <DropdownMenuItem icon={SettingsIcon} label="Settings" onClick={() => { navigate("/settings"); setDropdownOpen(false); }} />
                    <DropdownMenuItem icon={HelpCircle} label="Help & Support" onClick={() => { navigate("/help"); setDropdownOpen(false); }} />
                  </div>
                  <div className="border-t py-1" style={{ borderColor: "#F1F5F9" }}>
                    <DropdownMenuItem icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 p-5 lg:p-8 page-enter">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── COMMAND SEARCH MODAL ── */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => { setSearchOpen(false); setSearchVal(""); }}
            />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "#00C4B4" }} />
                <input
                  ref={searchRef}
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search pages and actions..."
                  className="flex-1 text-sm outline-none"
                  style={{ color: "#0F172A" }}
                />
                <kbd className="text-[10px] px-2 py-1 rounded" style={{ background: "#F1F5F9", color: "#94A3B8" }}>ESC</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto py-2">
                {filteredSearch.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>No results</div>
                ) : (
                  filteredSearch.map(item => (
                    <button
                      key={item.to}
                      onClick={() => { navigate(item.to); setSearchOpen(false); setSearchVal(""); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,196,180,0.1)" }}>
                        <item.icon className="w-4 h-4" style={{ color: "#00C4B4" }} />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium" style={{ color: "#0F172A" }}>{item.label}</span>
                        {item.tooltip && <p className="text-xs" style={{ color: "#94A3B8" }}>{item.tooltip}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#94A3B8" }} />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sidebar Nav Item ── */
function SidebarNavItem({ item, collapsed, isActive, delay, onNavigate }: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  delay: number;
  onNavigate: (to: string) => void;
}) {
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
    onNavigate(item.to);
  };

  return (
    <button
      onClick={handleClick}
      className="sidebar-nav-item relative w-full flex items-center rounded-xl transition-all duration-150 text-left"
      style={{
        height: 42,
        gap: collapsed ? 0 : 10,
        paddingLeft: collapsed ? 0 : 10,
        paddingRight: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        background: isActive
          ? "linear-gradient(135deg, rgba(0,196,180,0.2) 0%, rgba(0,196,180,0.08) 100%)"
          : "transparent",
        boxShadow: isActive ? "inset 0 0 0 1px rgba(0,196,180,0.25)" : "none",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
        }
      }}
      title={collapsed ? item.label : undefined}
    >
      {/* Active left bar */}
      {isActive && <div className="nav-active-bar" />}

      {/* Icon */}
      <item.icon
        className="nav-icon shrink-0"
        style={{
          width: 18,
          height: 18,
          color: isActive ? "#00C4B4" : "rgba(255,255,255,0.45)",
          filter: isActive ? "drop-shadow(0 0 4px rgba(0,196,180,0.5))" : "none",
        }}
      />

      {/* Label */}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: delay / 1000, duration: 0.2 }}
            className="relative flex-1 truncate text-[13px] font-medium"
            style={{
              color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)",
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {item.label}
            <span className="nav-label-underline" />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      {item.badge && !collapsed && (
        <span
          className="text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#EF4444", color: "white", boxShadow: "0 0 6px rgba(239,68,68,0.5)" }}
        >
          {item.badge}
        </span>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <div
          className="sidebar-tooltip absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50"
          style={{
            background: "white",
            color: "#0D2B45",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          {item.label}
          {item.tooltip && <span className="text-[10px] block" style={{ color: "#94A3B8" }}>{item.tooltip}</span>}
        </div>
      )}

      {/* Ripple effect */}
      {ripple && (
        <span
          className="pointer-events-none absolute rounded-full"
          style={{
            left: ripple.x - 12,
            top: ripple.y - 12,
            width: 24,
            height: 24,
            background: "rgba(0,196,180,0.3)",
            animation: "ripple 600ms ease-out forwards",
          }}
        />
      )}
    </button>
  );
}

/* ── Sidebar Bottom Action ── */
function SidebarBottomAction({ icon: Icon, label, onClick, danger }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 rounded-xl transition-all duration-150 text-left"
      style={{ height: 36, color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500 }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? "rgba(239,68,68,0.12)" : "rgba(0,196,180,0.1)";
        e.currentTarget.style.color = danger ? "#EF4444" : "#00C4B4";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "rgba(255,255,255,0.45)";
      }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

/* ── Dropdown Menu Item ── */
function DropdownMenuItem({ icon: Icon, label, onClick, danger }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
      style={{ color: danger ? "#EF4444" : "#374151" }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
