import React, { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { UserRole } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Settings as SettingsIcon, Menu, X, Search,
  CircleHelp as HelpCircle, ChevronDown, ChevronRight,
  Home, MapPin, TriangleAlert as AlertTriangle,
  Plus, FolderOpen, PenSquare, FileSearch,
  BarChart2, Calendar, UserCog, Bell,
  Activity,
} from "lucide-react";

interface LayoutProps { children: React.ReactNode; }

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badge?: string;
}

interface NavGroup {
  label: string;
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

const ROLE_COLORS: Record<string, { bg: string; text: string; light: string }> = {
  Trainer:   { bg: "#2563EB", text: "#2563EB", light: "#EFF6FF" },
  Supervisor:{ bg: "#0EA5E9", text: "#0EA5E9", light: "#F0F9FF" },
  Manager:   { bg: "#7C3AED", text: "#7C3AED", light: "#F5F3FF" },
  SrManager: { bg: "#1E3A5F", text: "#1E3A5F", light: "#EFF6FF" },
  PS:        { bg: "#F59E0B", text: "#D97706", light: "#FFFBEB" },
  TA:        { bg: "#7C3AED", text: "#7C3AED", light: "#F5F3FF" },
  Admin:     { bg: "#EF4444", text: "#DC2626", light: "#FEF2F2" },
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
      { to: "/", label: "Home", icon: Home },
    ],
  },
  {
    label: "Attrition",
    items: [
      { to: "/submit",       label: "Submit Case",        icon: Plus },
      { to: "/my-cases",     label: "My Cases",           icon: FolderOpen },
      { to: "/update",       label: "Update Case",        icon: PenSquare },
      { to: "/termination",  label: "Termination Center", icon: LogOut,     roles: ["PS","SrManager","Manager"] },
      { to: "/investigations",label: "Investigations",   icon: FileSearch,  roles: ["PS","SrManager","Manager"] },
      { to: "/high-risk",    label: "High Risk",          icon: AlertTriangle, roles: ["TA","PS","SrManager","Manager","Supervisor"], badge: "!" },
    ],
  },
  {
    label: "Relocations",
    items: [
      { to: "/relocations",        label: "All Relocations",    icon: MapPin },
      { to: "/relocations/submit", label: "Submit Relocation",  icon: Plus },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/analytics",  label: "Analytics Dashboard", icon: BarChart2, roles: ["TA","PS","SrManager","Manager","Admin"] },
      { to: "/attendance", label: "Attendance Log",      icon: Calendar,  roles: ["TA","PS","SrManager","Manager"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin", label: "User Management", icon: UserCog, roles: ["Admin"] },
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
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

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
    logout();
    toast.success("Signed out successfully");
  };

  const allItems = visibleGroups.flatMap(g => g.items);
  const filteredSearch = useMemo(() => {
    if (!searchVal.trim()) return allItems;
    const q = searchVal.toLowerCase();
    return allItems.filter(i => i.label.toLowerCase().includes(q));
  }, [allItems, searchVal]);

  return (
    <div className="min-h-screen" style={{ background: "#EEF2FF" }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-screen z-50 flex flex-col w-60
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        transition-transform duration-300`}
        style={{
          background: "#FFFFFF",
          borderRight: "1px solid #F1F5F9",
          boxShadow: "4px 0 24px rgba(30,58,95,0.04)",
        }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid #F1F5F9", height: 72 }}>
          <button onClick={() => navigate("/")}
            className="flex items-center gap-3 w-full group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 6V10C3 13.87 6.13 17.5 10 18C13.87 17.5 17 13.87 17 10V6L10 2Z" fill="white" fillOpacity="0.9"/>
                <path d="M7 10L9 12L13 8" stroke="#1E3A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-bold text-[17px] leading-none" style={{ color: "#0F172A" }}>EEC</div>
              <div className="text-[10px] mt-0.5 font-medium tracking-wider uppercase" style={{ color: "#94A3B8" }}>Concentrix</div>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
          {visibleGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#94A3B8", letterSpacing: "0.1em" }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <SidebarItem
                    key={item.to}
                    item={item}
                    isActive={
                      item.to === "/"
                        ? location.pathname === "/"
                        : location.pathname === item.to || location.pathname.startsWith(item.to + "/")
                    }
                    onNavigate={(to) => { navigate(to); setMobileOpen(false); }}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* My Dashboard shortcut */}
          {roleDashboard !== "/" && (
            <div className="mt-4">
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Dashboard</p>
              <SidebarItem
                item={{ to: roleDashboard, label: "My Dashboard", icon: Activity }}
                isActive={location.pathname === roleDashboard}
                onNavigate={(to) => { navigate(to); setMobileOpen(false); }}
              />
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: "1px solid #F1F5F9" }}>
          {/* User card */}
          <button onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${roleColors.bg}, ${roleColors.bg}CC)` }}>
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>{user?.displayName || "User"}</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: roleColors.light, color: roleColors.text }}>
                {roleLabel}
              </span>
            </div>
          </button>

          {/* Bottom actions */}
          <div className="px-3 pb-3 space-y-0.5">
            <BottomAction icon={SettingsIcon} label="Settings" onClick={() => navigate("/settings")} />
            <BottomAction icon={HelpCircle} label="Help & Support" onClick={() => navigate("/help")} />
            <BottomAction icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
          </div>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl shadow-md"
        style={{ background: "white", border: "1px solid #E2E8F0" }}>
        {mobileOpen ? <X className="w-5 h-5" style={{ color: "#0F172A" }} /> : <Menu className="w-5 h-5" style={{ color: "#0F172A" }} />}
      </button>

      {/* Main content area */}
      <div className="lg:ml-60 min-h-screen flex flex-col">

        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 lg:px-8"
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #F1F5F9",
            height: 64,
            boxShadow: "0 1px 3px rgba(30,58,95,0.06)",
          }}>

          {/* Page title */}
          <div className="hidden lg:block min-w-0">
            <h1 className="text-lg font-bold truncate" style={{ color: "#0F172A" }}>{pageTitle}</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search bar */}
          <button onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-3 px-4 h-10 rounded-xl transition-all"
            style={{
              background: "#F8FAFF",
              border: "1px solid #E2E8F0",
              color: "#94A3B8",
              fontSize: 14,
              minWidth: 280,
            }}>
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Search cases, employees... </span>
            <kbd className="text-[11px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: "#F1F5F9", color: "#94A3B8", border: "1px solid #E2E8F0" }}>⌘K</kbd>
          </button>

          {/* Notification bell */}
          <button className="relative p-2 rounded-xl transition-colors hover:bg-slate-50"
            style={{ color: "#64748B" }}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "#EF4444", border: "2px solid white" }} />
          </button>

          {/* User info */}
          <div style={{ width: 1, height: 24, background: "#F1F5F9" }} />
          <button onClick={() => navigate("/profile")}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-colors hover:bg-slate-50">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${roleColors.bg}, ${roleColors.bg}CC)` }}>
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-none" style={{ color: "#0F172A" }}>{user?.displayName?.split(" ")[0] || "User"}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{roleLabel}</p>
            </div>
            <ChevronDown className="w-4 h-4 hidden md:block" style={{ color: "#94A3B8" }} />
          </button>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-5 lg:p-8 page-enter">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── Command Search Modal ── */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => { setSearchOpen(false); setSearchVal(""); }} />
            <motion.div initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.15 }}
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "#2563EB" }} />
                <input ref={searchRef} value={searchVal} onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search pages and actions..."
                  className="flex-1 text-sm outline-none" style={{ color: "#0F172A" }} />
                <kbd className="text-[10px] px-2 py-1 rounded" style={{ background: "#F1F5F9", color: "#94A3B8" }}>ESC</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto py-2">
                {filteredSearch.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>No results</div>
                ) : (
                  filteredSearch.map(item => (
                    <button key={item.to}
                      onClick={() => { navigate(item.to); setSearchOpen(false); setSearchVal(""); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "#EFF6FF" }}>
                        <item.icon className="w-4 h-4" style={{ color: "#2563EB" }} />
                      </div>
                      <span className="flex-1 text-sm font-medium" style={{ color: "#0F172A" }}>{item.label}</span>
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

/* ── Sidebar Item ── */
function SidebarItem({ item, isActive, onNavigate }: {
  item: NavItem;
  isActive: boolean;
  onNavigate: (to: string) => void;
}) {
  return (
    <button onClick={() => onNavigate(item.to)}
      className="w-full flex items-center gap-3 px-3 rounded-xl transition-all duration-150 text-left"
      style={{
        height: 44,
        background: isActive ? "#2563EB" : "transparent",
        color: isActive ? "#FFFFFF" : "#64748B",
        fontWeight: isActive ? 600 : 500,
        fontSize: 14,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = "#F8FAFF";
          e.currentTarget.style.color = "#1E3A5F";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#64748B";
        }
      }}>
      <item.icon className="w-5 h-5 shrink-0" style={{ color: isActive ? "white" : "#94A3B8" }} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: isActive ? "rgba(255,255,255,0.25)" : "#FEE2E2", color: isActive ? "white" : "#EF4444" }}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* ── Bottom Action ── */
function BottomAction({ icon: Icon, label, onClick, danger }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 rounded-xl transition-all duration-150 text-left"
      style={{ height: 40, color: danger ? "#94A3B8" : "#94A3B8", fontSize: 13, fontWeight: 500 }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? "#FEF2F2" : "#F8FAFF";
        e.currentTarget.style.color = danger ? "#EF4444" : "#1E3A5F";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#94A3B8";
      }}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
