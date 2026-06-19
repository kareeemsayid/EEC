import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  fetchInvestigations,
  fetchInvestigationKpis,
} from "../api/sharepoint";
import {
  HRInvestigation,
  InvestigationStatus,
  InvestigationPriority,
  InvestigationType,
  InvestigationKpiData,
} from "../utils/types";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Tooltip from "../components/Tooltip";
import { loginRequest } from "../auth/msalConfig";
import {
  Search,
  FileSearch,
  AlertTriangle,
  Clock,
  XCircle,
  Calendar,
  User,
  RefreshCw,
  Plus,
  Filter,
  ChevronRight,
  ArrowUpDown,
  TrendingUp,
  AlertCircle,
  Inbox,
} from "lucide-react";

const INVESTIGATION_TYPES: InvestigationType[] = [
  "Employee Complaint",
  "Manager Escalation",
  "Policy Violation",
  "Attendance Breach",
  "Performance Concern",
  "Client Complaint",
  "Other",
];

const STATUS_COLORS: Record<InvestigationStatus, string> = {
  "Open": "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  "Pending Review": "bg-purple-100 text-purple-700 border-purple-200",
  "Closed": "bg-green-100 text-green-700 border-green-200",
  "Cancelled": "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_COLORS: Record<InvestigationPriority, string> = {
  "Low": "bg-gray-100 text-gray-600",
  "Medium": "bg-blue-100 text-blue-600",
  "High": "bg-amber-100 text-amber-600",
  "Critical": "bg-red-100 text-red-600",
};

export default function Investigations() {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();

  const [investigations, setInvestigations] = useState<HRInvestigation[]>([]);
  const [kpis, setKpis] = useState<InvestigationKpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<InvestigationStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<InvestigationPriority | "all">("all");
  const [filterType, setFilterType] = useState<InvestigationType | "all">("all");
  const [search, setSearch] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<"createdDate" | "dueDate" | "priority">("createdDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const [investigationsData, kpisData] = await Promise.all([
        fetchInvestigations(token),
        fetchInvestigationKpis(token),
      ]);
      setInvestigations(investigationsData);
      setKpis(kpisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investigations");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = investigations
    .filter((inv) => {
      if (filterStatus !== "all" && inv.status !== filterStatus) return false;
      if (filterPriority !== "all" && inv.priority !== filterPriority) return false;
      if (filterType !== "all" && inv.investigationType !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.investigationNumber.toLowerCase().includes(q) ||
          inv.caseNumber.toLowerCase().includes(q) ||
          inv.traineeName.toLowerCase().includes(q) ||
          inv.oracleId.toLowerCase().includes(q) ||
          inv.assignedTo.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      if (sortKey === "createdDate" || sortKey === "dueDate") {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }
      if (sortKey === "priority") {
        const order: Record<InvestigationPriority, number> = {
          Critical: 0, High: 1, Medium: 2, Low: 3,
        };
        aVal = order[aVal as InvestigationPriority] ?? 4;
        bVal = order[bVal as InvestigationPriority] ?? 4;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (key: "createdDate" | "dueDate" | "priority") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterType("all");
    setSearch("");
  };

  const hasFilters = filterStatus !== "all" || filterPriority !== "all" || filterType !== "all" || search;

  const isOverdue = (inv: HRInvestigation) => {
    if (inv.status === "Closed" || inv.status === "Cancelled") return false;
    return new Date(inv.dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading investigations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-glass-sm">
          <div className="flex items-center gap-2 mb-1">
            <FileSearch className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">HR Module</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            INVESTIGATIONS
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and track HR investigations
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Tooltip content="Refresh data from SharePoint" position="bottom">
            <button
              onClick={loadData}
              className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-white/30 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </Tooltip>
          <Tooltip content="Start a new investigation" position="bottom">
            <button
              onClick={() => navigate("/investigations/new")}
              className="bg-gradient-teal hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Investigation
            </button>
          </Tooltip>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard
            label="Total"
            value={kpis.totalInvestigations}
            icon={<FileSearch className="w-5 h-5" />}
            color="teal"
          />
          <KpiCard
            label="Open"
            value={kpis.openInvestigations}
            icon={<Inbox className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="In Progress"
            value={kpis.inProgressInvestigations}
            icon={<TrendingUp className="w-5 h-5" />}
            color="amber"
          />
          <KpiCard
            label="High Priority"
            value={kpis.highPriorityInvestigations}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
            pulse={kpis.highPriorityInvestigations > 0}
          />
          <KpiCard
            label="Overdue"
            value={kpis.overdueInvestigations}
            icon={<Clock className="w-5 h-5" />}
            color="red"
            pulse={kpis.overdueInvestigations > 0}
          />
        </div>
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Filter Bar */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-glass-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search investigation, case, trainee..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all bg-white/80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
          >
            <option value="all">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            {INVESTIGATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
            >
              <XCircle className="w-3 h-3" />
              Clear
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto font-mono">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileSearch className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No investigations found</p>
            <p className="text-gray-400 text-sm mt-1">
              {hasFilters ? "Try adjusting your filters" : "Click 'New Investigation' to start one"}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-teal-600 text-sm hover:underline font-medium">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-transparent">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Investigation #
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Case / Trainee
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th
                    className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => toggleSort("priority")}
                  >
                    <span className="flex items-center gap-1">
                      Priority <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Assigned To
                  </th>
                  <th
                    className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => toggleSort("dueDate")}
                  >
                    <span className="flex items-center gap-1">
                      Due Date <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-teal-50/40 transition-colors cursor-pointer animate-fade-in-up ${
                      isOverdue(inv) ? "bg-red-50/30" : ""
                    }`}
                    style={{ animationDelay: `${idx * 20}ms` }}
                    onClick={() => navigate(`/investigations/${inv.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700">
                          {inv.investigationNumber}
                        </span>
                        {isOverdue(inv) && (
                          <Tooltip content="This investigation is overdue" position="top">
                            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-xs text-gray-400 font-mono">{inv.caseNumber}</p>
                        <p className="text-sm font-medium text-gray-800">{inv.traineeName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-600">{inv.investigationType}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[inv.priority]}`}>
                        {inv.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-700">{inv.assignedTo || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs ${isOverdue(inv) ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Tooltip content="View investigation details" position="left">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/investigations/${inv.id}`); }}
                          className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                        >
                          View
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "teal" | "blue" | "amber" | "red";
  pulse?: boolean;
}) {
  const colorMap = {
    teal: "from-teal-50 to-teal-100/50 text-teal-600 border-teal-200/50",
    blue: "from-blue-50 to-blue-100/50 text-blue-600 border-blue-200/50",
    amber: "from-amber-50 to-amber-100/50 text-amber-600 border-amber-200/50",
    red: "from-red-50 to-red-100/50 text-red-600 border-red-200/50",
  };

  return (
    <div className={`glass-card bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4 shadow-glass-sm relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <span className="opacity-70">{icon}</span>
        {pulse && value > 0 && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        )}
      </div>
      <div className="text-2xl font-barlow-condensed font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-tl-[100%]" />
    </div>
  );
}
