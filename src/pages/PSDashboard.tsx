import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllCases, fetchAccounts, fetchLOBs, fetchSites, Account, LOB, Site, AttritionCase } from "../api/api";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { formatDate, formatHours, timeAgo } from "../utils/formatters";
import {
  Download, Search, BarChart3, TriangleAlert as AlertTriangle,
  Eye, Clock, Mail, FileText, X, Filter, RefreshCw,
  FileSearch, Shield,
} from "lucide-react";

type SortKey = "traineeName" | "totalMissedHours" | "caseOpenedDate" | "lastUpdatedDate" | "riskStatus";
type SortDir = "asc" | "desc";

const RISK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Critical":   { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  "High Risk":  { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  "Monitoring": { bg: "rgba(34,197,94,0.08)", text: "#22c55e", border: "rgba(34,197,94,0.2)" },
};

export default function PSDashboard() {
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lobs, setLOBs] = useState<LOB[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterAccount, setFilterAccount] = useState("all");
  const [filterLOB, setFilterLOB] = useState("all");
  const [filterSite, setFilterSite] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "Active" | "Closed">("all");
  const [filterRisk, setFilterRisk] = useState<"all" | "Monitoring" | "High Risk" | "Critical">("all");
  const [filterStage, setFilterStage] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdatedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedCase, setSelectedCase] = useState<AttritionCase | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesData, accountsData, lobsData, sitesData] = await Promise.all([
        fetchAllCases(), fetchAccounts(), fetchLOBs(), fetchSites(),
      ]);
      setCases(casesData);
      setAccounts(accountsData);
      setLOBs(lobsData);
      setSites(sitesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = cases
    .filter(c => {
      if (filterAccount !== "all" && c.account !== filterAccount) return false;
      if (filterLOB !== "all" && c.lob !== filterLOB) return false;
      if (filterSite !== "all" && c.site !== filterSite) return false;
      if (filterStatus !== "all" && c.caseStatus !== filterStatus) return false;
      if (filterRisk !== "all" && c.riskStatus !== filterRisk) return false;
      if (filterStage !== "all" && c.lifecycleStage !== filterStage) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.traineeName.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q) ||
          c.oracleId.toLowerCase().includes(q) || c.account.toLowerCase().includes(q) || c.trainerName.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let av: any = a[sortKey], bv: any = b[sortKey];
      if (sortKey === "caseOpenedDate" || sortKey === "lastUpdatedDate") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (sortKey === "riskStatus") { const o: Record<string, number> = { Critical: 0, "High Risk": 1, Monitoring: 2 }; av = o[av] ?? 3; bv = o[bv] ?? 3; }
      if (typeof av === "string") { av = av.toLowerCase(); bv = (bv as string).toLowerCase(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.caseStatus === "Active").length;
  const criticalCases = cases.filter(c => c.riskStatus === "Critical").length;
  const highRiskCases = cases.filter(c => c.riskStatus === "High Risk").length;
  const slaBreached = cases.filter(c => c.totalMissedHours >= 16).length;

  const uniqueStages = Array.from(new Set(cases.map(c => c.lifecycleStage)));
  const hasFilters = filterAccount !== "all" || filterLOB !== "all" || filterSite !== "all" || filterStatus !== "all" || filterRisk !== "all" || filterStage !== "all" || search;

  const clearFilters = () => { setFilterAccount("all"); setFilterLOB("all"); setFilterSite("all"); setFilterStatus("all"); setFilterRisk("all"); setFilterStage("all"); setSearch(""); };

  const exportCSV = () => {
    const headers = ["Case #", "Trainee", "Oracle ID", "Risk", "Stage", "Hours", "Account", "LOB", "Site", "Trainer", "Status", "Opened", "Updated"];
    const rows = filtered.map(c => [c.caseNumber, c.traineeName, c.oracleId, c.riskStatus, c.lifecycleStage, c.totalMissedHours, c.account, c.lob, c.site, c.trainerName, c.caseStatus, formatDate(c.caseOpenedDate), formatDate(c.lastUpdatedDate)]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ps-dashboard-${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" label="Loading PS Dashboard..." /></div>;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0B1E35 0%, #0D2D4A 100%)", padding: "24px 28px" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-16 w-56 h-56 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fb923c 0%, transparent 70%)" }} />
        </div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.2)" }}>
                <Shield className="w-3 h-3" />
                People Solutions
              </span>
            </div>
            <h1 className="font-barlow-condensed font-bold text-white leading-none mb-1" style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)" }}>
              PS Command Center
            </h1>
            <p className="text-white/40 text-sm">{filtered.length} of {cases.length} cases displayed</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate("/investigations")}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <FileSearch className="w-4 h-4" />Investigations
            </button>
            <button onClick={loadData}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: "#fb923c", color: "#0B1E35" }}>
              <Download className="w-4 h-4" />
              Export ({filtered.length})
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {[
            { label: "Total", value: totalCases, color: "#00C9B1" },
            { label: "Active", value: activeCases, color: "#38bdf8" },
            { label: "Critical", value: criticalCases, color: "#ef4444", pulse: criticalCases > 0 },
            { label: "High Risk", value: highRiskCases, color: "#f59e0b" },
            { label: "SLA Breach", value: slaBreached, color: "#f87171" },
          ].map(({ label, value, color, pulse }) => (
            <div key={label} className="rounded-xl p-3 flex items-center gap-2.5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <p className="font-barlow-condensed font-black text-2xl text-white leading-none" style={{ color: value > 0 && (label === "Critical" || label === "SLA Breach") ? color : "white" }}>{value}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
              </div>
              {pulse && value > 0 && <span className="ml-auto w-2 h-2 rounded-full animate-ping flex-shrink-0" style={{ background: color }} />}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search name, case #, Oracle ID, trainer..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={showFilters ? { background: "#0B1E35", color: "white" } : { background: "#f8fafc", color: "#374151", border: "1px solid #e5e7eb" }}>
            <Filter className="w-4 h-4" />
            Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-orange-400 ml-0.5" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
              <X className="w-3 h-3" />Clear
            </button>
          )}
          <span className="ml-auto text-xs font-mono text-gray-400">{filtered.length}/{cases.length}</span>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="px-4 pb-4 flex flex-wrap gap-2 pt-1" style={{ borderTop: "1px solid #f3f4f6" }}>
                {[
                  { label: "Account", value: filterAccount, setter: setFilterAccount, options: accounts.map(a => ({ v: a.title, l: a.title })) },
                  { label: "LOB", value: filterLOB, setter: setFilterLOB, options: Array.from(new Set(lobs.map(l => l.title))).map(t => ({ v: t, l: t })) },
                  { label: "Site", value: filterSite, setter: setFilterSite, options: sites.map(s => ({ v: s.title, l: s.title })) },
                  { label: "Status", value: filterStatus, setter: setFilterStatus as any, options: [{ v: "Active", l: "Active" }, { v: "Closed", l: "Closed" }] },
                  { label: "Risk", value: filterRisk, setter: setFilterRisk as any, options: [{ v: "Critical", l: "Critical" }, { v: "High Risk", l: "High Risk" }, { v: "Monitoring", l: "Monitoring" }] },
                  { label: "Stage", value: filterStage, setter: setFilterStage, options: uniqueStages.map(s => ({ v: s, l: s })) },
                ].map(({ label, value, setter, options }) => (
                  <select key={label} value={value} onChange={e => setter(e.target.value as any)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 cursor-pointer">
                    <option value="all">All {label}s</option>
                    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cases Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No cases match your filters</p>
            {hasFilters && <button onClick={clearFilters} className="mt-2 text-sm font-medium" style={{ color: "#00C9B1" }}>Clear filters</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f3f4f6" }}>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Case #</th>
                  <SortTh col="traineeName" current={sortKey} dir={sortDir} onSort={toggleSort}>Trainee</SortTh>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Trainer</th>
                  <SortTh col="riskStatus" current={sortKey} dir={sortDir} onSort={toggleSort}>Risk</SortTh>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Stage</th>
                  <SortTh col="totalMissedHours" current={sortKey} dir={sortDir} onSort={toggleSort}>Hours</SortTh>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Account / LOB</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Site</th>
                  <SortTh col="lastUpdatedDate" current={sortKey} dir={sortDir} onSort={toggleSort}>Updated</SortTh>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const riskStyle = RISK_STYLES[c.riskStatus] || RISK_STYLES.Monitoring;
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                      className="cursor-pointer group" style={{ borderBottom: "1px solid #f9fafb" }}
                      onClick={() => setSelectedCase(c)}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fffe")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold" style={{ color: "#00C9B1" }}>{c.caseNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-teal-700 transition-colors">{c.traineeName}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{c.oracleId}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-gray-700">{c.trainerName}</p>
                        <p className="text-[11px] text-gray-400">{c.trainerEmail}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: riskStyle.bg, color: riskStyle.text, border: `1px solid ${riskStyle.border}` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskStyle.text }} />
                          {c.riskStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StageBadge stage={c.lifecycleStage} size="sm" /></td>
                      <td className="px-5 py-3.5">
                        <span className={`font-mono text-sm font-bold ${c.totalMissedHours >= 16 ? "text-red-600" : c.totalMissedHours >= 8 ? "text-amber-600" : "text-gray-700"}`}>
                          {formatHours(c.totalMissedHours)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-gray-700">{c.account}</p>
                        <p className="text-[11px] text-gray-400">{c.lob}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500">{c.site}</span>
                      </td>
                      <td className="px-5 py-3.5"><span className="text-xs text-gray-400">{timeAgo(c.lastUpdatedDate)}</span></td>
                      <td className="px-5 py-3.5">
                        <button onClick={e => { e.stopPropagation(); setSelectedCase(c); }}
                          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ background: "rgba(0,201,177,0.08)", color: "#00C9B1" }}>
                          <Eye className="w-3 h-3" />View
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Case Detail Modal ── */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0" style={{ background: "rgba(7,14,23,0.7)", backdropFilter: "blur(8px)" }}
              onClick={() => setSelectedCase(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto"
              style={{ border: "1px solid rgba(0,201,177,0.15)" }}>
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid #f3f4f6", background: "linear-gradient(135deg, rgba(0,201,177,0.04), transparent)" }}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold" style={{ color: "#00C9B1" }}>{selectedCase.caseNumber}</span>
                  <RiskBadge risk={selectedCase.riskStatus} />
                  <StageBadge stage={selectedCase.lifecycleStage} />
                </div>
                <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[["Trainee", selectedCase.traineeName, false], ["Oracle ID", selectedCase.oracleId, true], ["Work Email", selectedCase.workEmail, false], ["Personal Email", selectedCase.personalEmail, false]].map(([l, v, m]) => (
                    <div key={String(l)}><p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p><p className={`text-sm mt-0.5 font-medium text-gray-800 ${m ? "font-mono" : ""}`}>{String(v) || "—"}</p></div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assignment</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[["Account", selectedCase.account], ["LOB", selectedCase.lob], ["Site", selectedCase.site], ["Wave", selectedCase.wave], ["Trainer", selectedCase.trainerName], ["Manager", selectedCase.trainingManager]].map(([l, v]) => (
                      <div key={l}><p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p><p className="text-sm mt-0.5 font-medium text-gray-800">{v || "—"}</p></div>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Case Details</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[["Category", selectedCase.attritionCategory], ["Sub-Reason", selectedCase.subReason], ["Severity", selectedCase.severityLevel], ["Total Hours", `${selectedCase.totalMissedHours}h`], ["Incident Date", formatDate(selectedCase.incidentDate)], ["Status", selectedCase.caseStatus]].map(([l, v]) => (
                      <div key={l}><p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p>
                        <p className="text-sm mt-0.5 font-medium" style={l === "Total Hours" ? { color: "#00C9B1", fontWeight: 700 } : { color: "#1f2937" }}>{v || "—"}</p></div>
                    ))}
                  </div>
                </div>
                {selectedCase.notes && (
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selectedCase.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {selectedCase.documentationRequired && <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}><FileText className="w-3 h-3" />Documentation Required</span>}
                  {selectedCase.escalationRequired && <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}><AlertTriangle className="w-3 h-3" />Escalation Required</span>}
                </div>
              </div>

              <div className="px-6 py-4 flex gap-2 justify-end" style={{ borderTop: "1px solid #f3f4f6", background: "#f8fafc" }}>
                <button onClick={() => { setSelectedCase(null); navigate(`/timeline?case=${selectedCase.caseNumber}`); }}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  <Clock className="w-4 h-4" />Timeline
                </button>
                <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-[#0B1E35]" style={{ background: "#00C9B1" }}>
                  <Mail className="w-4 h-4" />Notify Trainer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortTh({ col, current, dir, onSort, children }: {
  col: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void; children: React.ReactNode;
}) {
  const isActive = col === current;
  return (
    <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none transition-colors"
      style={{ color: isActive ? "#00C9B1" : "#9ca3af" }}
      onClick={() => onSort(col)}>
      <span className="flex items-center gap-1">
        {children}
        <span className="text-[10px] ml-0.5">{isActive ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </span>
    </th>
  );
}
