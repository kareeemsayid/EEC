import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchAttritionCases } from "../api/sharepoint";
import {
  Search,
  CornerDownLeft as EnterIcon,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  FolderOpen,
  Home,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: "Navigation" | "Actions" | "Cases";
  icon: React.ReactNode;
  onSelect: () => void;
  keywords?: string;
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette() {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [cases, setCases] = useState<{ caseNumber: string; traineeName: string; oracleId: string }[]>([]);

  // Global Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load cases when palette opens (lazy)
  useEffect(() => {
    if (!open || cases.length) return;
    (async () => {
      try {
        const token = await getAccessToken(["openid", "profile", "email", "User.Read"]);
        const data = await fetchAttritionCases(token);
        setCases(data.slice(0, 50).map((c) => ({ caseNumber: c.caseNumber, traineeName: c.traineeName, oracleId: c.oracleId })));
      } catch {
        /* ignore — palette still useful for navigation actions */
      }
    })();
  }, [open, cases.length, getAccessToken]);

  // Reset when closed
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        items[activeIndex]?.onSelect();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const staticItems: CommandItem[] = useMemo(
    () => [
      { id: "nav-home", label: "Go to Dashboard", group: "Navigation", icon: <Home className="w-4 h-4" />, onSelect: () => navigate("/") },
      { id: "nav-my", label: "My Cases", group: "Navigation", icon: <FolderOpen className="w-4 h-4" />, onSelect: () => navigate("/my-cases") },
      { id: "action-submit", label: "Submit new case", hint: "N", group: "Actions", icon: <Plus className="w-4 h-4" />, onSelect: () => navigate("/submit") },
      { id: "action-update", label: "Update a case", group: "Actions", icon: <RefreshCw className="w-4 h-4" />, onSelect: () => navigate("/update") },
      { id: "action-theme-light", label: "Toggle light theme", group: "Actions", icon: <Sun className="w-4 h-4" />, onSelect: () => document.documentElement.classList.remove("dark") },
      { id: "action-theme-dark", label: "Toggle dark theme", group: "Actions", icon: <Moon className="w-4 h-4" />, onSelect: () => document.documentElement.classList.add("dark") },
    ],
    [navigate]
  );

  const caseItems: CommandItem[] = useMemo(
    () =>
      cases.slice(0, 20).map((c) => ({
        id: `case-${c.caseNumber}`,
        label: c.traineeName,
        hint: c.caseNumber,
        group: "Cases" as const,
        icon: <FolderOpen className="w-4 h-4" />,
        keywords: `${c.caseNumber} ${c.oracleId} ${c.traineeName}`,
        onSelect: () => navigate(`/timeline?case=${c.caseNumber}`),
      })),
    [cases, navigate]
  );

  const items: CommandItem[] = useMemo(() => {
    const all = [...staticItems, ...caseItems];
    if (!query.trim()) return all;
    return all.filter((item) => fuzzyMatch(query, `${item.label} ${item.hint || ""} ${item.keywords || ""}`));
  }, [staticItems, caseItems, query]);

  // Group filtered items
  const grouped = useMemo(() => {
    const map: Record<string, CommandItem[]> = {};
    items.forEach((item) => {
      (map[item.group] = map[item.group] || []).push(item);
    });
    return map;
  }, [items]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search cases, navigate, run actions…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            className="flex-1 text-sm bg-transparent focus:outline-none text-navy-900 placeholder:text-gray-400"
          />
          <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-mono text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin py-2">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No matches for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group}>
                <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                  {group}
                </p>
                {groupItems.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        item.onSelect();
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        activeIndex === idx ? "bg-teal-50 text-navy-900" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`shrink-0 ${activeIndex === idx ? "text-teal-600" : "text-gray-400"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                      {item.hint && (
                        <span className="font-mono text-[11px] text-gray-400">{item.hint}</span>
                      )}
                      {activeIndex === idx && (
                        <EnterIcon className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint bar */}
        <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> <ArrowDown className="w-3 h-3" /> navigate
            </span>
            <span className="flex items-center gap-1">
              <EnterIcon className="w-3 h-3" /> select
            </span>
          </div>
          <span className="font-mono">Cmd+K</span>
        </div>
      </div>
    </div>
  );
}
