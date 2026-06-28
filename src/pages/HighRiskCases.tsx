import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchAllCases, updateCase, AttritionCase } from "../api/api";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, formatHours } from "../utils/formatters";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  TriangleAlert as AlertTriangle,
  X,
  Search,
  RefreshCw,
  FileText,
  Clock,
  TrendingUp,
  Flame,
  Shield,
  ArrowUp,
  Loader as Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Zap,
  Activity,
} from "lucide-react";

const REFRESH_INTERVAL = 5 * 60 * 1000;

type SortKey = "caseNumber" | "traineeName" | "totalMissedHours" | "lastUpdatedDate";
type SortDir = "asc" | "desc";
type RiskFilter = "all" | "Critical" | "High Risk";

export default function HighRiskCases() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [accountFilter, setAccountFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalMissedHours");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [escalateCase, setEscalateCase] = useState<AttritionCase | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set());

  const loadCases = useCallback(async (showSync = false) => {
    if (showSync) setSyncing(true);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllCases(500);
      const highRisk = data.filter(
        (c) => c.riskStatus === "High Risk" || c.riskStatus === "Critical"
      );
      setCases(highRisk);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load high-risk cases");
    } finally {
      setLoading(false);
      if (showSync) setTimeout(() => setSyncing(false), 600);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    const interval = setInterval(() => loadCases(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadCases]);

  const uniqueAccounts = useMemo(() => {
    return Array.from(new Set(cases.map((c) => c.account).filter(Boolean))).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    let result = [...cases];
    if (riskFilter !== "all") {
      result = result.filter((c) => c.riskStatus === riskFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.traineeName?.toLowerCase().includes(q) ||
          c.caseNumber?.toLowerCase().includes(q) ||
          c.oracleId?.toLowerCase().includes(q) ||
          c.account?.toLowerCase().includes(q)
      );
    }
    if (accountFilter) {
      result = result.filter((c) => c.account === accountFilter);
    }
    result.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "caseNumber":
          av = a.caseNumber || "";
          bv = b.caseNumber || "";
          break;
        case "traineeName":
          av = a.traineeName || "";
          bv = b.traineeName || "";
          break;
        case "totalMissedHours":
          av = a.totalMissedHours || 0;
          bv = b.totalMissedHours || 0;
          break;
        case "lastUpdatedDate":
          av = new Date(a.lastUpdatedDate || 0).getTime();
          bv = new Date(b.lastUpdatedDate || 0).getTime();
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [cases, riskFilter, search, accountFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredCases.length / pageSize);
  const paginatedCases = filteredCases.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const critical = cases.filter((c) => c.riskStatus === "Critical").length;
    const highRisk = cases.filter((c) => c.riskStatus === "High Risk").length;
    const terminationReady = cases.filter(
      (c) => c.lifecycleStage === "Termination Recommended"
    ).length;
    const escalated = cases.filter((c) => c.escalationRequired).length;
    const totalHours = cases.reduce((sum, c) => sum + (c.totalMissedHours || 0), 0);
    return { total: cases.length, critical, highRisk, terminationReady, escalated, totalHours };
  }, [cases]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleEscalate = async (c: AttritionCase) => {
    setEscalating(true);
    try {
      await updateCase({
        id: c.id,
        caseNumber: c.caseNumber,
        escalationRequired: true,
        riskStatus: "Critical",
        updateType: "Escalation",
        updateNotes: `Case escalated by ${user?.displayName || user?.email || "user"}`,
      });
      toast.success(`Case ${c.caseNumber} escalated to Critical`);
      setEscalatedIds((prev) => new Set(prev).add(c.id));
      setEscalateCase(null);
      loadCases(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to escalate case");
    } finally {
      setEscalating(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setRiskFilter("all");
    setAccountFilter("");
    setPage(1);
  };

  const hasActiveFilters = search || riskFilter !== "all" || accountFilter;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #2a0a1a 0%, #4a0f2d 30%, #6b1538 60%, #8b1d3d 100%)" }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        {/* Animated Orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <AlertTriangle className="w-6 h-6 text-rose-300" />
              </motion.div>
              <span className="text-xs font-semibold text-rose-200 uppercase tracking-widest">Critical Attention</span>
              <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-medium text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${syncing ? "bg-rose-200 animate-ping" : "bg-rose-300"}`} />
                {syncing ? "Syncing..." : "Live"}
              </span>
            </div>
            <h1 className="font-barlow-condensed text-4xl md:text-5xl font-bold text-white tracking-wide">
              HIGH RISK CASES
            </h1>
            <p className="text-rose-100/80 text-sm mt-2 max-w-lg">
              Cases flagged as High Risk or Critical requiring immediate attention and potential escalation.
            </p>

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <StatPill icon={AlertTriangle} label="Total" value={stats.total} color="white" />
              <StatPill icon={Flame} label="Critical" value={stats.critical} color="red" pulse={stats.critical > 0} />
              <StatPill icon={Shield} label="High Risk" value={stats.highRisk} color="amber" />
              <StatPill icon={Zap} label="Escalated" value={stats.escalated} color="purple" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              onClick={() => loadCases(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              Refresh
            </motion.button>
            {stats.terminationReady > 0 && (
              <motion.button
                onClick={() => navigate("/termination")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                <Flame className="w-5 h-5" />
                Termination Center ({stats.terminationReady})
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Total High Risk" value={stats.total} color="red" />
        <StatCard icon={Flame} label="Critical Cases" value={stats.critical} color="red" pulse={stats.critical > 0} />
        <StatCard icon={Shield} label="High Risk Cases" value={stats.highRisk} color="amber" />
        <StatCard icon={TrendingUp} label="Total Hours Missed" value={stats.totalHours} color="blue" isHours />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-rose-100/50 p-4 shadow-lg shadow-rose-500/5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, case #, OID, account..."
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Risk filter tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            {(["all", "Critical", "High Risk"] as RiskFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => { setRiskFilter(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  riskFilter === r
                    ? r === "Critical"
                      ? "bg-red-600 text-white shadow-sm"
                      : r === "High Risk"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-slate-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r === "all" ? "All" : r}
              </button>
            ))}
          </div>

          <select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          >
            <option value="">All Accounts</option>
            {uniqueAccounts.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
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

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-rose-100/50 overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" label="Loading high-risk cases..." />
          </div>
        ) : paginatedCases.length === 0 ? (
          <div className="py-20 text-center">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center">
                <Shield className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No High Risk Cases</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              All cases are currently within normal risk parameters. No escalations needed at this time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-rose-50/50 to-red-50/50">
                  <SortableTh label="Case #" sortKey="caseNumber" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="Trainee" sortKey="traineeName" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                    <span className="text-xs uppercase tracking-wider">Risk</span>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                    <span className="text-xs uppercase tracking-wider">Stage</span>
                  </th>
                  <SortableTh label="Hours Missed" sortKey="totalMissedHours" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                    <span className="text-xs uppercase tracking-wider">Account</span>
                  </th>
                  <SortableTh label="Last Update" sortKey="lastUpdatedDate" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3.5 text-center font-semibold text-slate-600 whitespace-nowrap">
                    <span className="text-xs uppercase tracking-wider">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedCases.map((c, idx) => {
                  const isEscalated = c.escalationRequired || escalatedIds.has(c.id);
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`hover:bg-rose-50/30 transition-colors ${
                        c.riskStatus === "Critical" ? "bg-red-50/20" : ""
                      } ${isEscalated ? "bg-purple-50/10" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-teal-700 font-bold">{c.caseNumber}</span>
                          {isEscalated && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                              Escalated
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                            {c.traineeName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{c.traineeName}</p>
                            <p className="text-xs text-slate-400 font-mono">{c.oracleId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskBadge risk={c.riskStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <StageBadge stage={c.lifecycleStage} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono text-sm font-semibold text-red-600">
                          {formatHours(c.totalMissedHours)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-600">{c.account}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-400 font-mono">
                          {formatDate(c.lastUpdatedDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => navigate(`/timeline?case=${c.caseNumber}`)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="View Timeline"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {!isEscalated && c.riskStatus !== "Critical" && (
                            <motion.button
                              onClick={() => setEscalateCase(c)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white text-xs font-semibold transition-colors shadow-sm"
                              title="Escalate to Critical"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                              Escalate
                            </motion.button>
                          )}
                          {isEscalated && (
                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-purple-50 text-purple-600 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Escalated
                            </span>
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
              Page {page} of {totalPages} - {filteredCases.length} cases
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold">
                {page}
              </span>
              <motion.button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Escalate Modal */}
      <AnimatePresence>
        {escalateCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => !escalating && setEscalateCase(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, #faf5ff 0%, #fff 100%)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <ArrowUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-barlow-condensed text-xl font-bold text-slate-900">
                      ESCALATE CASE
                    </h2>
                    <p className="text-xs text-slate-500">Escalate to Critical priority</p>
                  </div>
                </div>
                <button
                  onClick={() => !escalating && setEscalateCase(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={escalating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Warning */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-700">
                    You are about to escalate <strong>{escalateCase.traineeName}</strong>'s case to
                    <strong> Critical</strong> priority. This will flag the case for immediate PS/Senior Manager attention.
                  </p>
                </div>

                {/* Case Details */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <DetailRow icon={FileText} label="Case Number" value={escalateCase.caseNumber} mono />
                  <DetailRow icon={User} label="Trainee" value={escalateCase.traineeName} />
                  <DetailRow icon={User} label="Oracle ID" value={escalateCase.oracleId} mono />
                  <DetailRow icon={Building2} label="Account" value={escalateCase.account} />
                  <DetailRow icon={Activity} label="Current Risk" value={escalateCase.riskStatus} />
                  <DetailRow icon={TrendingUp} label="Hours Missed" value={formatHours(escalateCase.totalMissedHours)} valueColor="text-red-600" />
                  <DetailRow icon={Clock} label="Last Updated" value={formatDate(escalateCase.lastUpdatedDate)} />
                </div>

                {/* What happens next */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">What happens next:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 mt-1 shrink-0" />
                      Risk status changes to "Critical"
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 mt-1 shrink-0" />
                      Escalation flag is set on the case
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 mt-1 shrink-0" />
                      Case update is logged in the timeline
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setEscalateCase(null)}
                  disabled={escalating}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={() => handleEscalate(escalateCase)}
                  disabled={escalating}
                  whileHover={{ scale: escalating ? 1 : 1.02 }}
                  whileTap={{ scale: escalating ? 1 : 0.98 }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                >
                  {escalating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Escalating...
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-4 h-4" />
                      Escalate to Critical
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatPill({ icon: Icon, label, value, color, pulse }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "white" | "red" | "amber" | "purple";
  pulse?: boolean;
}) {
  const colors = {
    white: "bg-white/10 text-white border-white/20",
    red: "bg-red-500/20 text-red-100 border-red-400/30",
    amber: "bg-amber-500/20 text-amber-100 border-amber-400/30",
    purple: "bg-purple-500/20 text-purple-100 border-purple-400/30",
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

function StatCard({ icon: Icon, label, value, color, pulse, isHours }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "red" | "amber" | "blue";
  pulse?: boolean;
  isHours?: boolean;
}) {
  const colors = {
    red: { bg: "from-red-50 to-rose-50", iconBg: "bg-red-100", iconText: "text-red-600", border: "border-red-200" },
    amber: { bg: "from-amber-50 to-orange-50", iconBg: "bg-amber-100", iconText: "text-amber-600", border: "border-amber-200" },
    blue: { bg: "from-blue-50 to-indigo-50", iconBg: "bg-blue-100", iconText: "text-blue-600", border: "border-blue-200" },
  };
  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`relative p-4 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} transition-all overflow-hidden`}
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
      <p className="font-barlow-condensed font-black text-3xl text-slate-800">
        {isHours ? formatHours(value) : value}
      </p>
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
    </motion.div>
  );
}

function SortableTh({ label, sortKey, currentSort, sortDir, onSort, align }: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-rose-600 transition-colors select-none ${align === "right" ? "text-right" : ""}`}
    >
      <span className="text-xs uppercase tracking-wider inline-flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-rose-500">{sortDir === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );
}

function DetailRow({ icon: Icon, label, value, mono, valueColor }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className={`text-sm font-medium ${valueColor || "text-slate-800"} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
