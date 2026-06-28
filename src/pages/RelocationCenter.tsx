import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  fetchRelocations,
  fetchRelocationCounts,
  updateRelocationStatus,
  remindTA,
  RelocationRequest,
  RelocationCounts,
  RelocationListParams,
} from "../api/relocationsApi";
import { formatDate } from "../utils/formatters";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CirclePlus as PlusCircle,
  Search,
  Filter,
  X,
  RefreshCw,
  MapPin,
  Eye,
  Bell,
  Clock,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle2,
  Loader as Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Activity,
} from "lucide-react";

const REFRESH_INTERVAL = 5 * 60 * 1000;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; gradient: string }> = {
  Submitted: { label: "Pending PS", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", gradient: "from-amber-400 to-orange-500" },
  PSCleared: { label: "Pending TA", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500", gradient: "from-blue-400 to-indigo-500" },
  Relocated: { label: "Relocated", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", gradient: "from-emerald-400 to-teal-500" },
  Cancelled: { label: "Cancelled", bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", gradient: "from-red-400 to-rose-500" },
};

const RISK_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  "PS Overdue": { label: "PS Overdue", bg: "bg-red-50 border-red-200", text: "text-red-700" },
  "TA Overdue": { label: "TA Overdue", bg: "bg-red-50 border-red-200", text: "text-red-700" },
  Warning: { label: "Warning", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  "Within SLA": { label: "Within SLA", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
};

const VERTICALS = ["Other", "Consumer Electronics", "Travel & Tourism", "Media & Comms", "Technology", "Retail & Ecommerce"];

type SortKey = "requestId" | "employeeName" | "submittedDate" | "status";
type SortDir = "asc" | "desc";

const COLUMNS = [
  { key: "requestId", label: "Request ID" },
  { key: "submittedDate", label: "Date" },
  { key: "oid", label: "OID" },
  { key: "wave", label: "WK#" },
  { key: "employeeName", label: "Employee" },
  { key: "vertical", label: "Vertical" },
  { key: "account", label: "Account" },
  { key: "language", label: "Language" },
  { key: "lob", label: "LOB" },
  { key: "site", label: "Site" },
  { key: "siteRegion", label: "Region" },
  { key: "trainingSupervisor", label: "Supervisor" },
  { key: "trainingManager", label: "Manager" },
  { key: "status", label: "Status" },
  { key: "slaRiskAssessment", label: "Risk" },
  { key: "actions", label: "Actions" },
];

export default function RelocationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "Trainer";

  const [relocations, setRelocations] = useState<RelocationRequest[]>([]);
  const [counts, setCounts] = useState<RelocationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("submittedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const isPSOrTA = role === "PS" || role === "SrManager";
  const isTrainer = role === "Trainer";

  const loadData = useCallback(async (showSync = false) => {
    if (showSync) setSyncing(true);
    setLoading(true);
    setError(null);
    try {
      const params: RelocationListParams = {
        page,
        limit: 25,
        search: search || undefined,
        status: statusFilter || undefined,
        account: accountFilter || undefined,
        vertical: verticalFilter || undefined,
      };

      const [listRes, countsRes] = await Promise.all([
        fetchRelocations(params),
        fetchRelocationCounts(),
      ]);
      setRelocations(listRes.data.relocations);
      setTotal(listRes.data.total);
      setTotalPages(listRes.data.totalPages);
      setCounts(countsRes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load relocations";
      setError(msg);
    } finally {
      setLoading(false);
      if (showSync) setTimeout(() => setSyncing(false), 600);
    }
  }, [page, search, statusFilter, accountFilter, verticalFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => loadData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const uniqueAccounts = useMemo(() => {
    return Array.from(new Set(relocations.map((r) => r.account).filter(Boolean))).sort();
  }, [relocations]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setActionLoading(`status-${id}`);
    try {
      await updateRelocationStatus(id, status);
      toast.success(`Status updated to ${STATUS_CONFIG[status]?.label || status}`);
      loadData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemindTA = async (id: string) => {
    setActionLoading(`remind-${id}`);
    try {
      await remindTA(id);
      toast.success("TA reminder sent successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setAccountFilter("");
    setVerticalFilter("");
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter || accountFilter || verticalFilter;

  const sortedRelocations = useMemo(() => {
    const result = [...relocations];
    result.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "requestId":
          av = a.requestId || "";
          bv = b.requestId || "";
          break;
        case "employeeName":
          av = a.employeeName || "";
          bv = b.employeeName || "";
          break;
        case "submittedDate":
          av = new Date(a.submittedDate || 0).getTime();
          bv = new Date(b.submittedDate || 0).getTime();
          break;
        case "status":
          av = a.status || "";
          bv = b.status || "";
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [relocations, sortKey, sortDir]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 40%, #0D2B45 70%, #00C4B4 140%)" }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        {/* Animated Orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <MapPin className="w-6 h-6 text-teal-100" />
              </motion.div>
              <span className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Relocation Hub</span>
              <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-medium text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${syncing ? "bg-teal-200 animate-ping" : "bg-teal-300"}`} />
                {syncing ? "Syncing..." : "Live"}
              </span>
            </div>
            <h1 className="font-barlow-condensed text-4xl md:text-5xl font-bold text-white tracking-wide">
              RELOCATION CENTER
            </h1>
            <p className="text-teal-100/80 text-sm mt-2 max-w-lg">
              Central hub for tracking, managing, and processing all employee relocation requests across accounts and sites.
            </p>

            {/* Quick Stats Pills */}
            {counts && (
              <div className="flex flex-wrap gap-2 mt-4">
                <StatPill icon={ClipboardList} label="Total" value={counts.total} color="white" />
                <StatPill icon={Clock} label="Pending PS" value={counts.submitted} color="amber" />
                <StatPill icon={Activity} label="Pending TA" value={counts.psCleared} color="blue" />
                <StatPill icon={AlertTriangle} label="Overdue" value={(counts.overduePS || 0) + (counts.overdueTA || 0)} color="red" pulse />
                <StatPill icon={CheckCircle2} label="Relocated" value={counts.relocated} color="emerald" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              onClick={() => loadData(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              Refresh
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard icon={ClipboardList} label="Total Requests" value={counts.total} color="teal" onClick={() => { setStatusFilter(""); setPage(1); }} active={!statusFilter} />
          <StatCard icon={Clock} label="Pending PS" value={counts.submitted} color="amber" onClick={() => { setStatusFilter("Submitted"); setPage(1); }} active={statusFilter === "Submitted"} pulse={counts.submitted > 0} />
          <StatCard icon={Activity} label="Pending TA" value={counts.psCleared} color="blue" onClick={() => { setStatusFilter("PSCleared"); setPage(1); }} active={statusFilter === "PSCleared"} />
          <StatCard icon={AlertTriangle} label="Overdue" value={(counts.overduePS || 0) + (counts.overdueTA || 0)} color="red" pulse={(counts.overduePS || 0) + (counts.overdueTA || 0) > 0} />
          <StatCard icon={CheckCircle2} label="Relocated" value={counts.relocated} color="emerald" onClick={() => { setStatusFilter("Relocated"); setPage(1); }} active={statusFilter === "Relocated"} />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100/50 p-4 shadow-lg shadow-teal-500/5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === "Enter" && loadData()}
              placeholder="Search by name, OID, request ID..."
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            {[
              { value: "", label: "All" },
              { value: "Submitted", label: "Pending PS" },
              { value: "PSCleared", label: "Pending TA" },
              { value: "Relocated", label: "Relocated" },
              { value: "Cancelled", label: "Cancelled" },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => { setStatusFilter(s.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === s.value
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center gap-2 ${
              showFilters || verticalFilter
                ? "bg-teal-50 border-teal-200 text-teal-700"
                : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            More Filters
            {verticalFilter && (
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <FilterSelect
                  label="Account"
                  value={accountFilter}
                  onChange={(v) => { setAccountFilter(v); setPage(1); }}
                  options={uniqueAccounts.map((a) => ({ value: a, label: a }))}
                />
                <FilterSelect
                  label="Vertical"
                  value={verticalFilter}
                  onChange={(v) => { setVerticalFilter(v); setPage(1); }}
                  options={VERTICALS.map((v) => ({ value: v, label: v }))}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-5 py-4 flex items-center gap-4 shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-red-800 font-medium flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* Full Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100/50 overflow-hidden shadow-lg">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-emerald-50/50">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                      <span className="text-xs uppercase tracking-wider">{col.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.map((col, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 rounded bg-slate-100 animate-pulse" style={{ width: `${50 + (j % 4) * 15}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : sortedRelocations.length === 0 ? (
          <div className="py-20 text-center">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-teal-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Relocation Requests</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              No relocation requests match your current filters. Try adjusting your search or submit a new request.
            </p>
            {isTrainer && (
              <motion.button
                onClick={() => navigate("/relocations/submit")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                Submit New Request
              </motion.button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-emerald-50/50">
                  {COLUMNS.map((col) => {
                    const isSortable = col.key === "requestId" || col.key === "employeeName" || col.key === "submittedDate" || col.key === "status";
                    const isActiveSort = isSortable && sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => isSortable && handleSort(col.key as SortKey)}
                        className={`px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap ${isSortable ? "cursor-pointer hover:text-teal-600 transition-colors select-none" : ""}`}
                      >
                        <span className="text-xs uppercase tracking-wider inline-flex items-center gap-1">
                          {col.label}
                          {isActiveSort && (
                            <span className="text-teal-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedRelocations.map((rel, idx) => {
                  const statusCfg = STATUS_CONFIG[rel.status] || STATUS_CONFIG.Submitted;
                  const riskKey = rel.slaRiskAssessment || "Within SLA";
                  const riskCfg = RISK_CONFIG[riskKey] || RISK_CONFIG["Within SLA"];
                  const isOverdue = rel.overdueFlag;

                  return (
                    <motion.tr
                      key={rel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`hover:bg-teal-50/30 transition-colors ${isOverdue ? "bg-red-50/20" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-teal-600">{rel.requestId || "—"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-slate-500 font-mono">
                          {rel.submittedDate ? formatDate(rel.submittedDate) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-600">{rel.oid || rel.oracleId || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.wave || "—"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-[10px] font-bold text-teal-700 shrink-0">
                            {rel.employeeName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{rel.employeeName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.vertical || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.account || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.language || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.lob || rel.lobName || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.site || rel.siteName || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.siteRegion || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.trainingSupervisor || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{rel.trainingManager || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${riskCfg.bg} ${riskCfg.text}`}>
                          {isOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                          {riskCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/relocations/${rel.id}`)}
                            className="p-2 rounded-lg hover:bg-teal-100 text-teal-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isTrainer && rel.status === "PSCleared" && (
                            <button
                              onClick={() => handleRemindTA(rel.id)}
                              disabled={actionLoading === `remind-${rel.id}`}
                              className="p-2 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors disabled:opacity-50"
                              title="Remind TA"
                            >
                              {actionLoading === `remind-${rel.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                            </button>
                          )}
                          {isPSOrTA && rel.status === "Submitted" && (
                            <motion.button
                              onClick={() => handleStatusUpdate(rel.id, "PSCleared")}
                              disabled={actionLoading?.includes(rel.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                              title="Approve PS"
                            >
                              {actionLoading?.includes(rel.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              PS Clear
                            </motion.button>
                          )}
                          {isPSOrTA && rel.status === "PSCleared" && (
                            <motion.button
                              onClick={() => handleStatusUpdate(rel.id, "Relocated")}
                              disabled={actionLoading?.includes(rel.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              title="Mark Relocated"
                            >
                              {actionLoading?.includes(rel.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Relocate
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} - {total} requests
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm font-semibold">
                {page}
              </span>
              <motion.button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Floating New Relocation Button */}
      {isTrainer && (
        <motion.button
          onClick={() => navigate("/relocations/submit")}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-6 py-4 rounded-2xl text-white font-bold shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #00C4B4 0%, #0D9488 100%)",
            boxShadow: "0 10px 40px rgba(0,196,180,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
          }}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-sm">New Relocation</span>
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.2)" }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatPill({ icon: Icon, label, value, color, pulse }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "white" | "amber" | "blue" | "red" | "emerald";
  pulse?: boolean;
}) {
  const colors = {
    white: "bg-white/10 text-white border-white/20",
    amber: "bg-amber-500/20 text-amber-100 border-amber-400/30",
    blue: "bg-blue-500/20 text-blue-100 border-blue-400/30",
    red: "bg-red-500/20 text-red-100 border-red-400/30",
    emerald: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[color]}`}>
      <Icon className="w-3 h-3" />
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      <span>{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick, active, pulse }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "teal" | "amber" | "blue" | "red" | "emerald";
  onClick?: () => void;
  active?: boolean;
  pulse?: boolean;
}) {
  const colors = {
    teal: { bg: "from-teal-50 to-emerald-50", iconBg: "bg-teal-100", iconText: "text-teal-600", border: "border-teal-200", ring: "ring-teal-400/30" },
    amber: { bg: "from-amber-50 to-orange-50", iconBg: "bg-amber-100", iconText: "text-amber-600", border: "border-amber-200", ring: "ring-amber-400/30" },
    blue: { bg: "from-blue-50 to-indigo-50", iconBg: "bg-blue-100", iconText: "text-blue-600", border: "border-blue-200", ring: "ring-blue-400/30" },
    red: { bg: "from-red-50 to-rose-50", iconBg: "bg-red-100", iconText: "text-red-600", border: "border-red-200", ring: "ring-red-400/30" },
    emerald: { bg: "from-emerald-50 to-teal-50", iconBg: "bg-emerald-100", iconText: "text-emerald-600", border: "border-emerald-200", ring: "ring-emerald-400/30" },
  };
  const c = colors[color];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-4 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} transition-all text-left overflow-hidden group ${active ? `ring-2 ${c.ring}` : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconText}`}>
          <Icon className="w-5 h-5" />
        </div>
        {pulse && value > 0 && (
          <span className="relative flex h-3 w-3">
            <span className={`absolute inline-flex h-full w-full rounded-full ${c.iconText.replace('text-', 'bg-')} opacity-60 animate-ping`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${c.iconText.replace('text-', 'bg-')}`} />
          </span>
        )}
      </div>
      <p className="font-barlow-condensed font-black text-3xl text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
    </motion.button>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
