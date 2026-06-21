import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { UserRole } from "../api/api";
import ConcentrixLogo from "./ConcentrixLogo";
import Tooltip from "./Tooltip";
import ScrollProgress from "./ScrollProgress";
import NotificationCenter from "./NotificationCenter";
import {
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
  Menu,
  X,
  Search,
  CircleHelp as HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command as CommandIcon,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ filled?: boolean; className?: string }>;
  end: boolean;
  tooltip: string;
  roles?: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Icons support a filled prop for active state
const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { to: "/", label: "Dashboard", icon: IconDashboard, end: true, tooltip: "Overview and KPIs" },
      { to: "/submit", label: "Submit Case", icon: IconPlus, end: false, tooltip: "Create a new attrition case" },
      { to: "/update", label: "Update Case", icon: IconEdit, end: false, tooltip: "Modify an existing case" },
      { to: "/my-cases", label: "My Cases", icon: IconFolder, end: false, tooltip: "View your assigned cases" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { to: "/high-risk", label: "High Risk", icon: IconAlert, end: false, tooltip: "Critical cases" },
      { to: "/attendance", label: "Attendance Log", icon: IconCalendar, end: false, tooltip: "Track attendance history" },
      { to: "/timeline", label: "Case Timeline", icon: IconTimeline, end: false, tooltip: "View case progression" },
    ],
  },
  {
    label: "Actions",
    items: [
      { to: "/termination", label: "Termination Center", icon: IconExit, end: false, tooltip: "Manage termination process", roles: ["PS", "SrManager", "Manager"] },
      { to: "/ps-dashboard", label: "PS Dashboard", icon: IconUsers, end: false, tooltip: "People Solutions overview", roles: ["PS", "SrManager"] },
      { to: "/investigations", label: "Investigations", icon: IconSearch, end: false, tooltip: "HR Investigation cases", roles: ["PS", "SrManager", "Manager"] },
    ],
  },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Filter nav items based on user role
  const filteredNavGroups = useMemo(() => {
    const userRole = user?.role || 'Trainer';
    return NAV_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item =>
        !item.roles || item.roles.includes(userRole)
      ),
    })).filter(group => group.items.length > 0);
  }, [user?.role]);

  const ALL_NAV = filteredNavGroups.flatMap((g) => g.items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Q") {
        e.preventDefault();
        logout();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logout]);

  const pageTitle =
    ALL_NAV.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
    )?.label || "Dashboard";

  const initials = user?.firstName?.[0]
    ? (user.firstName[0] + (user.lastName?.[0] || "")).toUpperCase()
    : user?.displayName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const toggleGroup = (label: string) =>
    setCollapsedGroups((g) => ({ ...g, [label]: !g[label] }));

  const sidebar = (
    <SidebarContent
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      user={user}
      initials={initials}
      collapsedGroups={collapsedGroups}
      onToggleGroup={toggleGroup}
      onNavigate={(_p?: string) => {
        setMobileNavOpen(false);
      }}
      onOpenProfile={() => {
        setMobileNavOpen(false);
        navigate("/profile");
      }}
      onOpenUtility={(key: string) => {
        setMobileNavOpen(false);
        navigate(`/${key}`);
      }}
      onLogout={logout}
      location={location}
      filteredNavGroups={filteredNavGroups}
    />
  );

  return (
    <div className="min-h-screen bg-canvas font-barlow">
      <ScrollProgress />

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-gradient-navy text-white transition-all duration-300 shadow-xl ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-gradient-navy text-white flex flex-col shadow-2xl animate-slide-right">
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 md:ml-[76px] ${collapsed ? "md:ml-[76px]" : "md:ml-64"}`}>
        {/* Topbar */}
        <header
          className={`h-16 border-b border-gray-200/60 flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20 transition-all duration-300 ${
            scrolled ? "bg-white/85 backdrop-blur-xl shadow-sm" : "bg-white"
          }`}
        >
          <button
            className="md:hidden text-gray-500 hover:text-navy-800 transition-colors"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-gray-300">/</span>
            <h1 className="font-barlow-condensed font-semibold text-base text-navy-800 tracking-wide">
              {pageTitle}
            </h1>
          </div>

          {/* Global search */}
          <Tooltip content="Search anything (press / )" position="bottom">
            <button
              onClick={() => {
                const input = document.getElementById("topbar-search") as HTMLInputElement | null;
                input?.focus();
              }}
              className="hidden sm:flex items-center gap-2 ml-4 px-3 py-2 bg-gray-100/70 border border-gray-200/50 rounded-xl text-sm text-gray-400 hover:bg-gray-100 transition-colors max-w-xs"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search cases, trainees, ID…</span>
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-mono">/</kbd>
            </button>
          </Tooltip>

          <div className="flex-1" />

          {/* Right cluster — no duplicate identity (lives in sidebar) */}
          <div className="flex items-center gap-1.5">
            <Tooltip content="Command palette (Cmd+K)" position="bottom">
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"
                aria-label="Command palette"
              >
                <CommandIcon className="w-[16px] h-[16px]" />
              </button>
            </Tooltip>

            <NotificationCenter open={notificationsOpen} onOpenChange={setNotificationsOpen} />

            <Tooltip content="Help & support" position="bottom">
              <button
                onClick={() => navigate("/help")}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"
                aria-label="Help"
              >
                <HelpCircle className="w-[18px] h-[18px]" />
              </button>
            </Tooltip>

            {/* Slim avatar — opens profile, no duplicate name text */}
            <Tooltip content="Open profile" position="bottom">
              <button
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-xl bg-gradient-teal flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-teal-300/40 transition-all overflow-hidden shrink-0 shadow-glow-teal"
                aria-label="Profile"
              >
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </button>
            </Tooltip>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ===== Sidebar content (shared between desktop + mobile) =====

function SidebarContent({
  collapsed,
  setCollapsed,
  user,
  initials,
  collapsedGroups,
  onToggleGroup,
  onNavigate,
  onOpenProfile,
  onOpenUtility,
  onLogout,
  location,
  filteredNavGroups,
}: {
  collapsed: boolean;
  setCollapsed?: (c: boolean) => void;
  user: any;
  initials: string;
  collapsedGroups: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  onNavigate: (path?: string) => void;
  onOpenProfile: () => void;
  onOpenUtility: (key: string) => void;
  onLogout: () => void;
  location: ReturnType<typeof useLocation>;
  filteredNavGroups: NavGroup[];
}) {
  const [utilityOpen, setUtilityOpen] = useState(false);

  return (
    <>
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
        {collapsed ? (
          <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow-teal">
            <span className="text-white font-bold text-sm">EEC</span>
          </div>
        ) : (
          <ConcentrixLogo size="md" variant="light" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin">
        {filteredNavGroups.map((group, gIdx) => {
          const isGroupCollapsed = collapsedGroups[group.label];
          return (
            <div key={group.label} className="mb-3">
              {!collapsed && (
                <button
                  onClick={() => onToggleGroup(group.label)}
                  className="flex items-center w-full px-3 mb-1 group"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-teal-200/40 flex-1 text-left">
                    {group.label}
                  </p>
                  <ChevronDown
                    className={`w-3 h-3 text-teal-200/30 transition-transform duration-200 ${isGroupCollapsed ? "-rotate-90" : ""}`}
                  />
                </button>
              )}
              {!isGroupCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map((item, iIdx) => (
                    <SidebarLink
                      key={item.to}
                      item={item}
                      collapsed={collapsed}
                      location={location}
                      onNavigate={onNavigate}
                      delay={gIdx * 40 + iIdx * 20}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Utility section (Settings, Help) - separate from workflow */}
        {!collapsed && (
          <div className="pt-3 border-t border-white/10">
            <p className="px-3 mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-200/40">
              Utility
            </p>
            <div className="space-y-0.5">
              <UtilityLink to="/settings" label="Settings" icon={SettingsIcon} onNavigate={() => onOpenUtility("settings")} />
              <UtilityLink to="/help" label="Help & Support" icon={HelpCircle} onNavigate={() => onOpenUtility("help")} />
            </div>
          </div>
        )}
      </nav>

      {/* User mini-card (bottom) */}
      <div className="px-2 pb-2 border-t border-white/10 pt-2 shrink-0">
        {collapsed ? (
          <Tooltip content={`${user?.displayName || "User"} · ${user?.jobTitle || ""}`} position="right">
            <button
              onClick={onOpenProfile}
              className="w-10 h-10 mx-auto rounded-full bg-gradient-teal flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-white/20 shadow-glow-teal"
            >
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </Tooltip>
        ) : (
          <div className="relative">
            <button
              onClick={() => setUtilityOpen(!utilityOpen)}
              className="w-full glass-card-dark rounded-xl p-2.5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-teal flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden ring-2 ring-white/20">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-white text-xs font-semibold truncate leading-tight">
                  {user?.firstName || user?.displayName?.split(" ")[0] || "User"}
                </p>
                <p className="text-teal-200/50 text-[10px] truncate">{user?.jobTitle || "Team Member"}</p>
                {user?.manager1?.displayName && (
                  <p className="text-teal-200/40 text-[9px] truncate mt-0.5">
                    Reports to: {user.manager1.displayName}
                  </p>
                )}
              </div>
              <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${utilityOpen ? "rotate-180" : ""}`} />
            </button>

            {utilityOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 glass-card-dark rounded-xl shadow-glass-lg border border-white/10 py-1 animate-fade-in-up z-10">
                <button
                  onClick={() => { setUtilityOpen(false); onOpenProfile(); }}
                  className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Profile
                </button>
                <button
                  onClick={() => { setUtilityOpen(false); onOpenUtility("settings"); }}
                  className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Settings
                </button>
                <button
                  onClick={() => { setUtilityOpen(false); onOpenUtility("help"); }}
                  className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Help
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => { setUtilityOpen(false); onLogout(); }}
                  className="w-full text-left px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setCollapsed?.(!collapsed)}
        className="hidden md:flex items-center justify-center gap-1 m-2 py-1.5 text-[10px] text-teal-200/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : (<><ChevronLeft className="w-3.5 h-3.5" /><span>Collapse</span></>)}
      </button>
    </>
  );
}

function SidebarLink({
  item,
  collapsed,
  location,
  onNavigate,
  delay,
}: {
  item: NavItem;
  collapsed: boolean;
  location: ReturnType<typeof useLocation>;
  onNavigate: (path?: string) => void;
  delay: number;
}) {
  return (
    <Tooltip content={collapsed ? item.label : item.tooltip} position="right">
      <NavLink
        to={item.to}
        end={item.end}
        onClick={() => onNavigate(item.to)}
        className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
        style={{ animationDelay: `${delay}ms` }}
      >
        {({ isActive: active }) => (
          <>
            {/* Sliding pill active indicator */}
            <span
              className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                active ? "bg-white/10 opacity-100" : "opacity-0 group-hover:bg-white/5 group-hover:opacity-100"
              }`}
            />
            {active && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-teal shadow-[0_0_8px_2px_rgba(37,226,204,0.5)] breathing-glow" />
            )}
            <item.icon filled={active} className={`w-[17px] h-[17px] shrink-0 transition-colors ${active ? "text-teal-300" : "text-teal-100/55 group-hover:text-white"}`} />
            {!collapsed && (
              <span className={`relative transition-opacity duration-200 ${active ? "text-white" : "text-teal-100/60 group-hover:text-white"}`}>
                {item.label}
              </span>
            )}
          </>
        )}
      </NavLink>
    </Tooltip>
  );
}

function UtilityLink({ label, icon: Icon, onNavigate }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-teal-100/55 hover:bg-white/5 hover:text-white font-medium transition-all duration-200 w-full"
    >
      <Icon className="w-[17px] h-[17px] shrink-0" />
      <span>{label}</span>
    </button>
  );
}

/* ---------------- Inline icon set (outline + filled variants) ---------------- */

function IconDashboard({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="9" rx="1.5" strokeWidth={2} />
      <rect x="14" y="3" width="7" height="5" rx="1.5" strokeWidth={2} />
      <rect x="14" y="12" width="7" height="9" rx="1.5" strokeWidth={2} />
      <rect x="3" y="16" width="7" height="5" rx="1.5" strokeWidth={2} />
    </svg>
  );
}
function IconPlus({ filled: _filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IconEdit({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.12 2.12 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconFolder({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconAlert({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L1 21h22L12 2zm0 6v5m0 3h.01" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86l-8.18 14A1 1 0 003 19h18a1 1 0 00.89-1.45l-8.18-14a1 1 0 00-1.72 0z" />
    </svg>
  );
}
function IconCalendar({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="white" strokeWidth="2" fill="none" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconTimeline({ filled: _filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconExit({ filled: _filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m4 6H5a2 2 0 01-2-2V6a2 2 0 012-2h6" />
    </svg>
  );
}
function IconUsers({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5zm10.5-3.5a3 3 0 100-6 3 3 0 000 6zm.5 2c-1 0-1.9.2-2.7.5 1.1.9 1.7 2 1.7 3.5v2H24v-2c0-2.4-2-4-4-4z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8" />
    </svg>
  );
}
function IconSearch({ filled: _filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
    </svg>
  );
}
