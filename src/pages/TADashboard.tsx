import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchRelocationCounts,
  fetchRelocations,
  updateRelocationStatus,
  remindTA,
  RelocationRequest,
  RelocationCounts,
} from "../api/relocationsApi";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import CountUp from "../components/CountUp";
import { formatDate, timeAgo } from "../utils/formatters";
import toast from "react-hot-toast";
import {
  BarChart3, MapPin, Truck, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Download, Search, ChevronRight, ExternalLink, Eye, ClipboardCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SortKey = "employeeName" | "submissionDate" | "lastUpdatedDate" | "status";
type SortDir = "asc" | "desc";

export default function TADashboard() {
  const navigate = useNavigate();

  const [relocations, setRelocations] = useState<RelocationRequest[]>([]);
  const [counts, setCounts] = useState<RelocationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdatedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedRelocation, setSelectedRelocation] = useState<RelocationRequest | null>(null);

  const loadData = useCallback(async () => {
    setSyncing(true);
    setLoading(true);
    setError(null);
    try {
      const [relocationsRes, countsRes] = await Promise.all([
        fetchRelocations({ limit: 500 }),
        fetchRelocationCounts(),
      ]);
      setRelocations(relocationsRes.data.relocations);
      setCounts(countsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to load TA dashboard data");
    } finally {
      setLoading(false);
      setTimeout(() => setSyncing(false), 600);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const uniqueAccounts = useMemo(() =>
    Array.from(new Set(relocations.map(r => r.account).filter(Boolean))),
    [relocations]
  );

  const filtered = useMemo(() => {
    return relocations
      .filter(r => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterAccount !== "all" && r.account !== filterAccount) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.employeeName?.toLowerCase().includes(q) ||
            r.requestId?.toLowerCase().includes(q) ||
            r.oid?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let aVal: any = a[sortKey];
        let bVal: any = b[sortKey];
        if (sortKey === "submissionDate" || sortKey === "lastUpdatedDate") {
          aVal = new Date(aVal || 0).getTime();
          bVal = new Date(bVal || 0).getTime();
        }
        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [relocations, filterStatus, filterAccount, search, sortKey, sortDir]);

  const handleTAAction = useCallback(async (id: string, action: "approve" | "clear" | "reject") => {
    try {
      const statusMap: Record<string, string> = {
        approve: "TA Approved",
        clear: "TA Cleared",
        reject: "Cancelled",
      };
      await updateRelocationStatus(id, statusMap[action]);
      toast.success(`Relocation ${action === "reject" ? "rejected" : action + "d"} successfully`);
      loadData();
    } catch (err) {
      toast.error(`Failed to ${action} relocation`);
    }
  }, [loadData]);

  const handleRemind = useCallback(async (id: string) => {
    try {
      await remindTA(id);
      toast.success("Reminder sent successfully");
    } catch {
      toast.error("Failed to send reminder");
    }
  }, []);

  const exportToCSV = () => {
    const headers = ["Request ID", "Employee", "OID", "Account", "Status", "Submitted"];
    const rows = filtered.map(r => [
      r.requestId, r.employeeName, r.oid, r.account, r.status, formatDate(r.submissionDate),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ta-relocations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingTAClearance = relocations.filter(r => r.status === "PS Cleared" || r.status === "Pending TA").length;
  const overdueRelocations = relocations.filter(r => r.overdueFlag).length;
  const completedThisMonth = relocations.filter(r => {
    if (!r.taClearedDate) return false;
    const d = new Date(r.taClearedDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className={`ml-1 ${sortKey === col ? "text-eecblue" : "text-gray-300"}`}>
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading TA Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>
              Talent Acquisition
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">TA Relocation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee relocations and clearance approvals</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate("/relocations")} className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
            <MapPin className="w-4 h-4" />
            All Relocations
          </button>
          <button onClick={loadData} className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={exportToCSV} className="eec-btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export ({filtered.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Total Requests" value={counts?.total || relocations.length} icon={BarChart3} color="#1E3A5F" />
        <KpiCard label="Pending TA" value={counts?.taCleared || pendingTAClearance} icon={Clock} color="#F59E0B" pulse={pendingTAClearance > 0} />
        <KpiCard label="Overdue" value={counts?.overdueTA || overdueRelocations} icon={AlertTriangle} color="#EF4444" pulse={overdueRelocations > 0} />
        <KpiCard label="Completed" value={completedThisMonth} icon={CheckCircle} color="#22C55E" />
        <KpiCard label="Relocated" value={counts?.relocated || 0} icon={MapPin} color="#2563EB" />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Pending TA Clearance"
          value={pendingTAClearance}
          description="Relocations cleared by PS, awaiting TA approval"
          icon={ClipboardCheck}
          color="#F59E0B"
          onClick={() => setFilterStatus("PS Cleared")}
        />
        <QuickActionCard
          title="Overdue Relocations"
          value={overdueRelocations}
          description="Past SLA deadline, immediate attention"
          icon={AlertTriangle}
          color="#EF4444"
          pulse={overdueRelocations > 0}
          onClick={() => { setSearch(""); setFilterStatus("all"); }}
        />
        <QuickActionCard
          title="Recently Completed"
          value={completedThisMonth}
          description="Successfully cleared this month"
          icon={CheckCircle}
          color="#22C55E"
          onClick={() => setFilterStatus("TA Cleared")}
        />
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Filters */}
      <div className="eec-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, request ID, OID..."
              className="eec-input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="PS Cleared">PS Cleared</option>
            <option value="Pending TA">Pending TA</option>
            <option value="TA Cleared">TA Cleared</option>
            <option value="Relocated">Relocated</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {uniqueAccounts.map(acc => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
          </select>

          <span className="text-xs text-gray-400 ml-auto font-mono">
            {filtered.length} of {relocations.length} requests
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="eec-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No relocation requests match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Request ID</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("employeeName")}>
                    <span className="flex items-center gap-1">Employee <SortIcon col="employeeName" /></span>
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Account</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("lastUpdatedDate")}>
                    <span className="flex items-center gap-1">Updated <SortIcon col="lastUpdatedDate" /></span>
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, idx) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRelocation(r)}
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-semibold text-eecblue">{r.requestId}</span>
                      {r.overdueFlag && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 font-medium">OVERDUE</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-navy-900">{r.employeeName}</p>
                        <p className="text-xs text-gray-400 font-mono">{r.oid}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">{r.account}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-400">{timeAgo(r.lastUpdatedDate)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        {(r.status === "PS Cleared" || r.status === "Pending TA") && (
                          <>
                            <button
                              onClick={() => handleTAAction(r.id, "clear")}
                              className="text-xs bg-blue-50 text-eecblue hover:bg-blue-100 px-2 py-1 rounded transition-colors font-medium flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Clear
                            </button>
                            <button
                              onClick={() => handleTAAction(r.id, "reject")}
                              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-colors font-medium"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedRelocation(r)}
                          className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRelocation && (
          <RelocationDetailModal
            relocation={selectedRelocation}
            onClose={() => setSelectedRelocation(null)}
            onAction={handleTAAction}
            onRemind={handleRemind}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, pulse }: {
  label: string; value: number; icon: React.ElementType; color: string; pulse?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="eec-card">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {pulse && value > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">
        <CountUp value={value} duration={600} />
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</p>
    </motion.div>
  );
}

function QuickActionCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  pulse,
  onClick,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
  pulse?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="eec-card text-left transition-all hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-navy-900">
            <CountUp value={value} duration={800} />
          </p>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <div className="relative p-3 rounded-xl" style={{ background: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
          {pulse && value > 0 && (
            <div className="absolute inset-0 rounded-xl animate-ping" style={{ background: `${color}20` }} />
          )}
        </div>
      </div>
      {onClick && (
        <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-eecblue">
          View all <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </motion.button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    "Submitted": { bg: "bg-gray-100", text: "text-gray-700" },
    "PS Cleared": { bg: "bg-amber-50", text: "text-amber-600" },
    "Pending TA": { bg: "bg-amber-50", text: "text-amber-600" },
    "TA Cleared": { bg: "bg-blue-50", text: "text-blue-600" },
    "Relocated": { bg: "bg-green-50", text: "text-green-600" },
    "Cancelled": { bg: "bg-red-50", text: "text-red-600" },
  };
  const config = statusConfig[status] || statusConfig["Submitted"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {status}
    </span>
  );
}

function RelocationDetailModal({
  relocation,
  onClose,
  onAction,
  onRemind,
}: {
  relocation: RelocationRequest;
  onClose: () => void;
  onAction: (id: string, action: "approve" | "clear" | "reject") => void;
  onRemind: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-eecblue">{relocation.requestId}</span>
              <StatusBadge status={relocation.status} />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Employee" value={relocation.employeeName} />
            <InfoField label="OID" value={relocation.oid} mono />
            <InfoField label="Account" value={relocation.account} />
            <InfoField label="Current Site" value={relocation.siteName} />
            <InfoField label="Preferred Site" value={relocation.preferredSiteArea} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Submitted" value={formatDate(relocation.submissionDate)} />
              <InfoField label="PS Cleared" value={formatDate(relocation.psClearedDate) || "Pending"} />
              <InfoField label="TA Cleared" value={formatDate(relocation.taClearedDate) || "Pending"} />
            </div>
          </div>

          {relocation.additionalNotes && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{relocation.additionalNotes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50/50">
          {(relocation.status === "PS Cleared" || relocation.status === "Pending TA") && (
            <>
              <button
                onClick={() => { onAction(relocation.id, "clear"); onClose(); }}
                className="eec-btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Clear Relocation
              </button>
            </>
          )}
          <button
            onClick={() => { onClose(); window.open(`/relocations/${relocation.id}`, "_blank"); }}
            className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Full Details
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className={`text-sm mt-0.5 text-navy-900 ${mono ? "font-mono" : "font-medium"}`}>
        {value || "—"}
      </p>
    </div>
  );
}
