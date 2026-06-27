import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  fetchRelocations,
  fetchRelocationCounts,
  updateRelocationStatus,
  remindTA,
  RelocationRequest,
  RelocationCounts,
  RelocationListParams,
} from "../../api/relocationsApi";
import { formatDate } from "../../utils/formatters";
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
  Building2,
  ClipboardList,
  Layers,
  Globe,
} from "lucide-react";

const REFRESH_INTERVAL = 5 * 60 * 1000;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; gradient: string }> = {
  Submitted: { label: "Pending PS", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", gradient: "from-amber-400 to-orange-500" },
  PSCleared: { label: "Pending TA", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500", gradient: "from-blue-400 to-indigo-500" },
  Relocated: { label: "Relocated", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", gradient: "from-emerald-400 to-teal-500" },
  Cancelled: { label: "Cancelled", bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", gradient: "from-red-400 to-rose-500" },
};

const RISK_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  "PS Overdue": { label: "ATTENTION! PS Approval Overdue", bg: "bg-red-50 border-red-200", text: "text-red-700", icon: <span className="text-red-500">&#x1F534;</span> },
  "TA Overdue": { label: "ALERT! TA Action Overdue", bg: "bg-red-50 border-red-200", text: "text-red-700", icon: <span className="text-red-500">&#x1F534;</span> },
  Warning: { label: "Warning", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <span className="text-amber-500">&#x1F7E1;</span> },
  "Within SLA": { label: "Within SLA", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: <span>&#x2705;</span> },
};

const VERTICALS = ["Other", "Consumer Electronics", "Travel & Tourism", "Media & Comms", "Technology", "Retail & Ecommerce"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

type ColumnDef = {
  key: string;
  label: string;
  sticky?: boolean;
};

const COLUMNS: ColumnDef[] = [
  { key: "requestId", label: "Request ID", sticky: true },
  { key: "submittedDate", label: "Date", sticky: true },
  { key: "oid", label: "OID", sticky: true },
  { key: "wave", label: "WK#" },
  { key: "employeeName", label: "Employee" },
  { key: "vertical", label: "Vertical" },
  { key: "account", label: "Account" },
  { key: "language", label: "Language" },
  { key: "lob", label: "LOB" },
  { key: "site", label: "Site" },
  { key: "siteRegion", label: "Site Region" },
  { key: "trainingSupervisor", label: "Supervisor" },
  { key: "trainingManager", label: "Manager" },
  { key: "status", label: "Status" },
  { key: "slaRiskAssessment", label: "Risk" },
  { key: "priorityLogic", label: "Priority" },
  { key: "actions", label: "Actions" },
];

export default function Relocations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "Trainer";

  const [relocations, setRelocations] = useState<RelocationRequest[]>([]);
  const [counts, setCounts] = useState<RelocationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const [filters, setFilters] = useState<RelocationListParams>({});
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [myAccountsOnly, setMyAccountsOnly] = useState(false);

  const isPSOrTA = role === "PS" || role === "SrManager";
  const isSupervisorOrManager = role === "Supervisor" || role === "Manager";
  const isTrainer = role === "Trainer";
  const canManage = isPSOrTA || isSupervisorOrManager;

  const loadData = useCallback(async (showSync = false) => {
    if (showSync) setSyncing(true);
    setLoading(true);
    setError(null);
    try {
      const params: RelocationListParams = {
        ...filters,
        page,
        limit: 25,
        search: searchInput || undefined,
      };
      if (myAccountsOnly && user?.supervisorAccounts?.length) {
        const accountIds = user.supervisorAccounts.map(a => a.accountId).join(",");
        params.account = accountIds;
      }

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
      toast.error(msg);
    } finally {
      setLoading(false);
      if (showSync) setTimeout(() => setSyncing(false), 600);
    }
  }, [filters, page, searchInput, myAccountsOnly, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => loadData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSearch = useCallback(() => {
    setPage(1);
    loadData();
  }, [loadData]);

  const handleClearFilters = () => {
    setFilters({});
    setSearchInput("");
    setMyAccountsOnly(false);
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || searchInput || myAccountsOnly;

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

  const uniqueAccounts = useMemo(() => {
    return Array.from(new Set(relocations.map(r => r.account).filter(Boolean)));
  }, [relocations]);

  const uniqueLOBs = useMemo(() => {
    return Array.from(new Set(relocations.map(r => r.lob).filter(Boolean)));
  }, [relocations]);

  const uniqueSites = useMemo(() => {
    return Array.from(new Set(relocations.map(r => r.site).filter(Boolean)));
  }, [relocations]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-6 md:p-8 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        {/* Animated Orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <MapPin className="w-6 h-6 text-teal-100" />
              </motion.div>
              <span className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Relocation Tracker</span>
              <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-medium text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${syncing ? "bg-teal-200 animate-ping" : "bg-teal-300"}`} />
                {syncing ? "Syncing..." : "Live"}
              </span>
            </div>
            <h1 className="font-barlow-condensed text-4xl md:text-5xl font-bold text-white tracking-wide">
              RELOCATION CENTER
            </h1>
            <p className="text-teal-100 text-sm mt-2 max-w-lg">
              Track, manage, and process employee relocation requests across all accounts and sites.
            </p>

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {counts && (
                <>
                  <StatPill label="Total" value={counts.total} color="white" />
                  <StatPill label="Pending PS" value={counts.submitted} color="amber" />
                  <StatPill label="Pending TA" value={counts.psCleared} color="blue" />
                  <StatPill label="Overdue" value={(counts.overduePS || 0) + (counts.overdueTA || 0)} color="red" pulse />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              onClick={() => loadData(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              Refresh
            </motion.button>

            {/* View Toggle */}
            <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-sm border border-white/20">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "cards" ? "bg-white text-teal-700 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "table" ? "bg-white text-teal-700 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                Table
              </button>
            </div>

            {isTrainer && (
              <motion.button
                onClick={() => navigate("/relocations/submit")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-teal-700 hover:bg-teal-50 text-sm font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                <PlusCircle className="w-5 h-5" />
                New Request
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Cards for PS/TA */}
      {canManage && counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Clock}
            label="Pending PS Approval"
            value={counts.submitted}
            color="amber"
            onClick={() => { setFilters({ status: "Submitted" }); setPage(1); }}
            active={filters.status === "Submitted"}
          />
          <QuickActionCard
            icon={ClipboardList}
            label="Pending TA Action"
            value={counts.psCleared}
            color="blue"
            onClick={() => { setFilters({ status: "PSCleared" }); setPage(1); }}
            active={filters.status === "PSCleared"}
          />
          <QuickActionCard
            icon={AlertTriangle}
            label="Overdue Requests"
            value={(counts.overduePS || 0) + (counts.overdueTA || 0)}
            color="red"
            pulse={(counts.overduePS || 0) + (counts.overdueTA || 0) > 0}
          />
          <QuickActionCard
            icon={CheckCircle2}
            label="Successfully Relocated"
            value={counts.relocated}
            color="emerald"
            onClick={() => { setFilters({ status: "Relocated" }); setPage(1); }}
            active={filters.status === "Relocated"}
          />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-teal-100/50 dark:border-slate-700/50 p-4 shadow-lg shadow-teal-500/5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, OID, request ID..."
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            )}
          </button>

          {isSupervisorOrManager && (
            <button
              onClick={() => { setMyAccountsOnly(!myAccountsOnly); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center gap-2 ${
                myAccountsOnly
                  ? "bg-slate-800 border-slate-800 text-white shadow-lg"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-300"
              }`}
            >
              <Building2 className="w-4 h-4" />
              My Accounts
            </button>
          )}

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
              className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <FilterSelect
                  label="Status"
                  value={filters.status || ""}
                  onChange={(v) => { setFilters({ ...filters, status: v || undefined }); setPage(1); }}
                  options={[
                    { value: "Submitted", label: "Pending PS" },
                    { value: "PSCleared", label: "Pending TA" },
                    { value: "Relocated", label: "Relocated" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                />
                <FilterSelect
                  label="Account"
                  value={filters.account || ""}
                  onChange={(v) => { setFilters({ ...filters, account: v || undefined }); setPage(1); }}
                  options={uniqueAccounts.map(a => ({ value: a, label: a }))}
                />
                <FilterSelect
                  label="LOB"
                  value={filters.lob || ""}
                  onChange={(v) => { setFilters({ ...filters, lob: v || undefined }); setPage(1); }}
                  options={uniqueLOBs.map(l => ({ value: l, label: l }))}
                />
                <FilterSelect
                  label="Site"
                  value={filters.site || ""}
                  onChange={(v) => { setFilters({ ...filters, site: v || undefined }); setPage(1); }}
                  options={uniqueSites.map(s => ({ value: s, label: s }))}
                />
                <FilterSelect
                  label="Vertical"
                  value={filters.vertical || ""}
                  onChange={(v) => { setFilters({ ...filters, vertical: v || undefined }); setPage(1); }}
                  options={VERTICALS.map(v => ({ value: v, label: v }))}
                />
                <FilterSelect
                  label="Month"
                  value={filters.month || ""}
                  onChange={(v) => { setFilters({ ...filters, month: v || undefined }); setPage(1); }}
                  options={MONTHS.map(m => ({ value: m, label: m }))}
                />
                <FilterSelect
                  label="Quarter"
                  value={filters.quarter || ""}
                  onChange={(v) => { setFilters({ ...filters, quarter: v || undefined }); setPage(1); }}
                  options={QUARTERS.map(q => ({ value: q, label: q }))}
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

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Card View */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RelocationCardSkeleton key={i} />
                ))}
              </div>
            ) : relocations.length === 0 ? (
              <EmptyState onNewRequest={() => navigate("/relocations/submit")} canCreate={isTrainer} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relocations.map((rel, idx) => (
                  <RelocationCard
                    key={rel.id}
                    relocation={rel}
                    index={idx}
                    onView={() => navigate(`/relocations/${rel.id}`)}
                    onRemindTA={() => handleRemindTA(rel.id)}
                    onApprovePS={() => handleStatusUpdate(rel.id, "PSCleared")}
                    onMarkRelocated={() => handleStatusUpdate(rel.id, "Relocated")}
                    onCancel={() => handleStatusUpdate(rel.id, "Cancelled")}
                    isTrainer={isTrainer}
                    isPSOrTA={isPSOrTA}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Table View */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-teal-100/50 dark:border-slate-700/50 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-900/20 dark:to-emerald-900/20">
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className={`px-4 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap ${
                            col.sticky ? "sticky left-0 z-10 bg-teal-50/50 dark:bg-teal-900/30" : ""
                          }`}
                        >
                          <span className="text-xs uppercase tracking-wider">{col.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {COLUMNS.map((col, j) => (
                            <td
                              key={j}
                              className={`px-4 py-4 ${col.sticky ? "sticky left-0 z-10 bg-white dark:bg-slate-800" : ""}`}
                            >
                              <div className="h-3 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" style={{ width: `${50 + (j % 4) * 15}%` }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : relocations.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length} className="py-16">
                          <EmptyState onNewRequest={() => navigate("/relocations/submit")} canCreate={isTrainer} />
                        </td>
                      </tr>
                    ) : (
                      relocations.map((rel, idx) => (
                        <motion.tr
                          key={rel.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors ${rel.overdueFlag ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}
                        >
                          {COLUMNS.map((col) => {
                            if (col.key === "actions") {
                              return (
                                <td key={col.key} className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => navigate(`/relocations/${rel.id}`)} className="p-2 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-600 dark:text-teal-400 transition-colors">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    {isTrainer && rel.status === "PSCleared" && (
                                      <button onClick={() => handleRemindTA(rel.id)} disabled={actionLoading === `remind-${rel.id}`} className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 transition-colors disabled:opacity-50">
                                        {actionLoading === `remind-${rel.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            }

                            if (col.key === "status") {
                              const cfg = STATUS_CONFIG[rel.status] || STATUS_CONFIG.Submitted;
                              return (
                                <td key={col.key} className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                    {cfg.label}
                                  </span>
                                </td>
                              );
                            }

                            if (col.key === "slaRiskAssessment") {
                              const riskKey = rel.slaRiskAssessment || "Within SLA";
                              const cfg = RISK_CONFIG[riskKey] || RISK_CONFIG["Within SLA"];
                              return (
                                <td key={col.key} className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text}`}>
                                    {cfg.icon}
                                    <span className="truncate max-w-[100px]">{cfg.label}</span>
                                  </span>
                                </td>
                              );
                            }

                            if (col.key === "submittedDate") {
                              return (
                                <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                    {rel.submittedDate ? formatDate(rel.submittedDate) : "—"}
                                  </span>
                                </td>
                              );
                            }

                            if (col.key === "requestId") {
                              return (
                                <td key={col.key} className="px-4 py-3">
                                  <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">{rel.requestId || "—"}</span>
                                </td>
                              );
                            }

                            if (col.key === "oid") {
                              return (
                                <td key={col.key} className="px-4 py-3">
                                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{rel.oid || rel.oracleId || "—"}</span>
                                </td>
                              );
                            }

                            if (col.key === "employeeName") {
                              return (
                                <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{rel.employeeName || "—"}</span>
                                </td>
                              );
                            }

                            const value = rel[col.key as keyof RelocationRequest];
                            return (
                              <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                                <span className="text-xs text-slate-600 dark:text-slate-400">{value || "—"}</span>
                              </td>
                            );
                          })}
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages} - {total} requests
          </span>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className="px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-sm font-semibold">
              {page}
            </span>
            <motion.button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatPill({ label, value, color, pulse }: { label: string; value: number; color: "white" | "amber" | "blue" | "red"; pulse?: boolean }) {
  const colors = {
    white: "bg-white/20 text-white border-white/30",
    amber: "bg-amber-500/20 text-amber-100 border-amber-400/30",
    blue: "bg-blue-500/20 text-blue-100 border-blue-400/30",
    red: "bg-red-500/20 text-red-100 border-red-400/30",
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      <span>{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, value, color, onClick, active, pulse }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "amber" | "blue" | "red" | "emerald";
  onClick?: () => void;
  active?: boolean;
  pulse?: boolean;
}) {
  const colors = {
    amber: { bg: "from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30", iconBg: "bg-amber-100 dark:bg-amber-800", iconText: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", ring: "ring-amber-400/30" },
    blue: { bg: "from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30", iconBg: "bg-blue-100 dark:bg-blue-800", iconText: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", ring: "ring-blue-400/30" },
    red: { bg: "from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30", iconBg: "bg-red-100 dark:bg-red-800", iconText: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800", ring: "ring-red-400/30" },
    emerald: { bg: "from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30", iconBg: "bg-emerald-100 dark:bg-emerald-800", iconText: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", ring: "ring-emerald-400/30" },
  };
  const c = colors[color];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-4 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} transition-all text-left overflow-hidden group ${active ? `ring-2 ${c.ring}` : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Hover Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative z-10">
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
        <p className="font-barlow-condensed font-black text-3xl text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
      </div>
    </motion.button>
  );
}

function RelocationCard({ relocation, index, onView, onRemindTA, onApprovePS, onMarkRelocated, onCancel, isTrainer, isPSOrTA, actionLoading }: {
  relocation: RelocationRequest;
  index: number;
  onView: () => void;
  onRemindTA: () => void;
  onApprovePS: () => void;
  onMarkRelocated: () => void;
  onCancel: () => void;
  isTrainer: boolean;
  isPSOrTA: boolean;
  actionLoading: string | null;
}) {
  const statusCfg = STATUS_CONFIG[relocation.status] || STATUS_CONFIG.Submitted;
  const isOverdue = relocation.overdueFlag;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={`relative bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-lg transition-all hover:shadow-xl ${
        isOverdue ? "border-red-200 dark:border-red-800 ring-2 ring-red-400/20" : "border-teal-100/50 dark:border-slate-700/50 hover:border-teal-200 dark:hover:border-teal-700"
      }`}
    >
      {/* Status Bar */}
      <div className={`h-1.5 bg-gradient-to-r ${statusCfg.gradient}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                {relocation.requestId}
              </span>
              {isOverdue && (
                <span className="text-[10px] text-red-600 font-bold uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{relocation.employeeName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{relocation.oid || relocation.oracleId}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoItem icon={Building2} label="Account" value={relocation.account} />
          <InfoItem icon={Layers} label="LOB" value={relocation.lob} />
          <InfoItem icon={MapPin} label="Site" value={relocation.site} />
          <InfoItem icon={Globe} label="Vertical" value={relocation.vertical} />
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <Clock className="w-3.5 h-3.5" />
          <span>Submitted {relocation.submittedDate ? formatDate(relocation.submittedDate) : "—"}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={onView}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-800/40 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Details
          </motion.button>

          {isTrainer && relocation.status === "PSCleared" && (
            <motion.button
              onClick={onRemindTA}
              disabled={actionLoading?.startsWith("remind-")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors disabled:opacity-50"
            >
              {actionLoading?.startsWith("remind-") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Remind TA
            </motion.button>
          )}

          {isPSOrTA && relocation.status === "Submitted" && (
            <motion.button
              onClick={onApprovePS}
              disabled={actionLoading?.includes(relocation.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors disabled:opacity-50"
            >
              {actionLoading?.includes(relocation.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve PS
            </motion.button>
          )}

          {isPSOrTA && relocation.status === "PSCleared" && (
            <motion.button
              onClick={onMarkRelocated}
              disabled={actionLoading?.includes(relocation.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors disabled:opacity-50"
            >
              {actionLoading?.includes(relocation.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Relocated
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">{value || "—"}</p>
    </div>
  );
}

function RelocationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 animate-pulse">
      <div className="h-2 w-24 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
      <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
      <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-slate-100 dark:bg-slate-700" />
        ))}
      </div>
      <div className="h-8 rounded bg-slate-200 dark:bg-slate-700 mt-4" />
    </div>
  );
}

function EmptyState({ onNewRequest, canCreate }: { onNewRequest: () => void; canCreate: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-16 px-4"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border border-teal-100 dark:border-teal-800 flex items-center justify-center">
          <MapPin className="w-10 h-10 text-teal-500 dark:text-teal-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Relocation Requests</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
        No relocation requests match your current filters. Try adjusting your search or submit a new request.
      </p>
      {canCreate && (
        <motion.button
          onClick={onNewRequest}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Submit New Request
        </motion.button>
      )}
    </motion.div>
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
      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
