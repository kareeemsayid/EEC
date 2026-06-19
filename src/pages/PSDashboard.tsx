import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchAttritionCases, fetchAccounts, fetchLOBs, fetchSites } from "../api/sharepoint";
import { AttritionCase, Account, LOB, Site } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Tooltip from "../components/Tooltip";
import { formatDate, formatHours, timeAgo } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import {
  Download,
  Search,
  BarChart3,
  Users,
  TriangleAlert as AlertTriangle,
  TrendingUp,
  Eye,
  Clock,
  Mail,
  FileText,
  X,
  Filter,
  RefreshCw,
  Briefcase,
  MapPin,
  FileSearch,
} from "lucide-react";

type SortKey = "traineeName" | "totalMissedHours" | "caseOpenedDate" | "lastUpdatedDate" | "riskStatus";
type SortDir = "asc" | "desc";

export default function PSDashboard() {
  const { getAccessToken } = useAuth();
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

  // Detail modal state
  const [selectedCase, setSelectedCase] = useState<AttritionCase | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const [casesData, accountsData, lobsData, sitesData] = await Promise.all([
        fetchAttritionCases(token),
        fetchAccounts(token),
        fetchLOBs(token),
        fetchSites(token),
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
  }, [getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = cases
    .filter((c) => {
      if (filterAccount !== "all" && c.account !== filterAccount) return false;
      if (filterLOB !== "all" && c.lob !== filterLOB) return false;
      if (filterSite !== "all" && c.site !== filterSite) return false;
      if (filterStatus !== "all" && c.caseStatus !== filterStatus) return false;
      if (filterRisk !== "all" && c.riskStatus !== filterRisk) return false;
      if (filterStage !== "all" && c.lifecycleStage !== filterStage) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.traineeName.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q) ||
          c.oracleId.toLowerCase().includes(q) ||
          c.account.toLowerCase().includes(q) ||
          c.trainerName.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      if (sortKey === "caseOpenedDate" || sortKey === "lastUpdatedDate") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (sortKey === "riskStatus") {
        const order: Record<string, number> = {
          Critical: 0,
          "High Risk": 1,
          Monitoring: 2,
        };
        aVal = order[aVal] ?? 3;
        bVal = order[bVal] ?? 3;
      }
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalCases = cases.length;
  const activeCases = cases.filter((c) => c.caseStatus === "Active").length;
  const criticalCases = cases.filter((c) => c.riskStatus === "Critical").length;
  const highRiskCases = cases.filter((c) => c.riskStatus === "High Risk").length;
  const slaBreached = cases.filter((c) => c.totalMissedHours >= 16).length;

  const uniqueLOBs = Array.from(new Set(lobs.map(l => l.title)));
  const uniqueStages = Array.from(new Set(cases.map(c => c.lifecycleStage)));

  const exportToCSV = () => {
    const headers = [
      "Case #",
      "Trainee",
      "Oracle ID",
      "Risk",
      "Stage",
      "Hours Missed",
      "Account",
      "LOB",
      "Site",
      "Trainer",
      "Status",
      "Opened",
      "Updated",
    ];
    const rows = filtered.map((c) => [
      c.caseNumber,
      c.traineeName,
      c.oracleId,
      c.riskStatus,
      c.lifecycleStage,
      c.totalMissedHours,
      c.account,
      c.lob,
      c.site,
      c.trainerName,
      c.caseStatus,
      formatDate(c.caseOpenedDate),
      formatDate(c.lastUpdatedDate),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eec-ps-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterAccount("all");
    setFilterLOB("all");
    setFilterSite("all");
    setFilterStatus("all");
    setFilterRisk("all");
    setFilterStage("all");
    setSearch("");
  };

  const hasFilters = filterAccount !== "all" || filterLOB !== "all" || filterSite !== "all" || filterStatus !== "all" || filterRisk !== "all" || filterStage !== "all" || search;

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className={`ml-1 ${sortKey === col ? "text-teal-500" : "text-gray-300"}`}>
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-glass-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">People Solutions</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            PS DASHBOARD
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor all attrition cases across the organisation
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Tooltip content="View HR Investigation cases" position="bottom">
            <button
              onClick={() => navigate("/investigations")}
              className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-white/30 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <FileSearch className="w-4 h-4" />
              Investigations
            </button>
          </Tooltip>
          <Tooltip content="Refresh data from SharePoint" position="bottom">
            <button
              onClick={loadData}
              className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-white/30 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </Tooltip>
          <Tooltip content="Export filtered cases to CSV file" position="bottom">
            <button
              onClick={exportToCSV}
              className="bg-gradient-teal hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV ({filtered.length})
            </button>
          </Tooltip>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          label="Total Cases"
          value={totalCases}
          icon={<BarChart3 className="w-5 h-5" />}
          color="teal"
        />
        <KPICard
          label="Active Cases"
          value={activeCases}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          label="Critical"
          value={criticalCases}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          pulse={criticalCases > 0}
        />
        <KPICard
          label="High Risk"
          value={highRiskCases}
          icon={<TrendingUp className="w-5 h-5" />}
          color="amber"
        />
        <KPICard
          label="SLA Breached"
          value={slaBreached}
          icon={<Clock className="w-5 h-5" />}
          color="red"
        />
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Enhanced Filter Bar */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-glass-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, case #, Oracle ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.title}>
                {a.title}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={filterLOB}
            onChange={(e) => setFilterLOB(e.target.value)}
          >
            <option value="all">All LOBs</option>
            {uniqueLOBs.map((lob) => (
              <option key={lob} value={lob}>
                {lob}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
          >
            <option value="all">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as any)}
          >
            <option value="all">All Risk</option>
            <option value="Critical">Critical</option>
            <option value="High Risk">High Risk</option>
            <option value="Monitoring">Monitoring</option>
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <option value="all">All Stages</option>
            {uniqueStages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto font-mono">
            {filtered.length} of {cases.length} cases
          </span>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No cases match your filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-2 text-teal-600 text-sm hover:underline">
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
                    Case #
                  </th>
                  <th
                    className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => toggleSort("traineeName")}
                  >
                    <span className="flex items-center gap-1">
                      Trainee <SortIcon col="traineeName" />
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Trainer
                  </th>
                  <th
                    className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => toggleSort("riskStatus")}
                  >
                    <span className="flex items-center gap-1">
                      Risk <SortIcon col="riskStatus" />
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Stage
                  </th>
                  <th
                    className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => toggleSort("totalMissedHours")}
                  >
                    <span className="flex items-center gap-1">
                      Hours <SortIcon col="totalMissedHours" />
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Account / LOB
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Site
                  </th>
                  <th
                    className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => toggleSort("lastUpdatedDate")}
                  >
                    <span className="flex items-center gap-1">
                      Updated <SortIcon col="lastUpdatedDate" />
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="hover:bg-teal-50/40 transition-colors cursor-pointer animate-fade-in-up group"
                    style={{ animationDelay: `${idx * 20}ms` }}
                    onClick={() => setSelectedCase(c)}
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-teal-700 font-bold">
                        {c.caseNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-teal-700 transition-colors">
                          {c.traineeName}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {c.oracleId}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-xs font-medium text-gray-700">{c.trainerName}</p>
                        <p className="text-xs text-gray-400">{c.trainerEmail}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <RiskBadge risk={c.riskStatus} size="sm" />
                    </td>
                    <td className="px-5 py-3">
                      <StageBadge stage={c.lifecycleStage} size="sm" />
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-mono text-sm font-bold ${
                        c.totalMissedHours >= 16 ? "text-red-600" :
                        c.totalMissedHours >= 8 ? "text-amber-600" : "text-gray-700"
                      }`}>
                        {formatHours(c.totalMissedHours)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700 font-medium">{c.account}</p>
                          <p className="text-xs text-gray-400">{c.lob}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{c.site}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-400">
                        {timeAgo(c.lastUpdatedDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Tooltip content="View case details" position="left">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedCase(c); }}
                          className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-2 py-1 rounded transition-colors font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
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

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
          <div className="relative glass-card bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 to-transparent">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-teal-700">{selectedCase.caseNumber}</span>
                <RiskBadge risk={selectedCase.riskStatus} />
                <StageBadge stage={selectedCase.lifecycleStage} />
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Trainee Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Trainee" value={selectedCase.traineeName} />
                <InfoCard label="Oracle ID" value={selectedCase.oracleId} mono />
                <InfoCard label="Email (Work)" value={selectedCase.workEmail} />
                <InfoCard label="Email (Personal)" value={selectedCase.personalEmail} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assignment Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoCard label="Account" value={selectedCase.account} />
                  <InfoCard label="LOB" value={selectedCase.lob} />
                  <InfoCard label="Site" value={selectedCase.site} />
                  <InfoCard label="Wave" value={selectedCase.wave} />
                  <InfoCard label="Trainer" value={selectedCase.trainerName} />
                  <InfoCard label="Manager" value={selectedCase.trainingManager} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Case Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoCard label="Category" value={selectedCase.attritionCategory} />
                  <InfoCard label="Sub-Reason" value={selectedCase.subReason} />
                  <InfoCard label="Severity" value={selectedCase.severityLevel} />
                  <InfoCard label="Total Hours" value={`${selectedCase.totalMissedHours}h`} highlight />
                  <InfoCard label="Incident Date" value={formatDate(selectedCase.incidentDate)} />
                  <InfoCard label="Status" value={selectedCase.caseStatus} />
                </div>
              </div>

              {selectedCase.notes && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedCase.notes}</p>
                </div>
              )}

              {selectedCase.outlookConversationId && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4" />
                    <span className="font-mono text-xs">Thread: {selectedCase.outlookConversationId}</span>
                  </div>
                </div>
              )}

              {/* Flags */}
              <div className="flex gap-2 flex-wrap">
                {selectedCase.documentationRequired && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                    <FileText className="w-3 h-3" />
                    Documentation Required
                  </span>
                )}
                {selectedCase.escalationRequired && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    Escalation Required
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50/50">
              <Tooltip content="View full case timeline and history" position="top">
                <button
                  onClick={() => { setSelectedCase(null); navigate(`/timeline?case=${selectedCase.caseNumber}`); }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  View Timeline
                </button>
              </Tooltip>
              <Tooltip content="Send email notification to trainer" position="top">
                <button className="bg-gradient-teal hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-glow-teal flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Notify Trainer
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  color,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "teal" | "blue" | "red" | "amber";
  pulse?: boolean;
}) {
  const colorMap = {
    teal: "from-teal-50 to-teal-100/50 text-teal-600 border-teal-200/50",
    blue: "from-blue-50 to-blue-100/50 text-blue-600 border-blue-200/50",
    red: "from-red-50 to-red-100/50 text-red-600 border-red-200/50",
    amber: "from-amber-50 to-amber-100/50 text-amber-600 border-amber-200/50",
  };

  return (
    <div className={`glass-card bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4 shadow-glass-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="opacity-70">{icon}</span>
        {pulse && value > 0 && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        )}
      </div>
      <div className="text-2xl font-barlow-condensed font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}

function InfoCard({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className={`text-sm mt-0.5 ${highlight ? "font-bold text-teal-700" : "text-gray-800"} ${mono ? "font-mono" : "font-medium"}`}>
        {value || "—"}
      </p>
    </div>
  );
}
