import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchAttritionCases } from "../api/sharepoint";
import { AttritionCase } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Tooltip from "../components/Tooltip";
import { formatDate, formatHours, timeAgo } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import {
  FolderOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Building2,
  RefreshCw,
  FileText,
  AlertTriangle,
  Download,
  Plus,
  X,
  MapPin,
  History,
} from "lucide-react";

export default function MyCases() {
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "Active" | "Closed">("all");
  const [filterRisk, setFilterRisk] = useState<"all" | "Monitoring" | "High Risk" | "Critical">("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Detail modal
  const [selectedCase, setSelectedCase] = useState<AttritionCase | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const data = await fetchAttritionCases(token, user?.email);
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, user?.email]);

  useEffect(() => {
    if (user) loadCases();
  }, [user, loadCases]);

  // Get unique accounts for filter
  const uniqueAccounts = Array.from(new Set(cases.map(c => c.account)));

  const filtered = cases
    .filter((c) => {
      if (filterStatus !== "all" && c.caseStatus !== filterStatus) return false;
      if (filterRisk !== "all" && c.riskStatus !== filterRisk) return false;
      if (filterAccount !== "all" && c.account !== filterAccount) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.traineeName.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q) ||
          c.oracleId.toLowerCase().includes(q) ||
          c.account.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by last updated date descending
      const aVal = new Date(a.lastUpdatedDate).getTime();
      const bVal = new Date(b.lastUpdatedDate).getTime();
      return bVal - aVal; // Descending
    });

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterRisk("all");
    setFilterAccount("all");
    setSearch("");
  };

  const hasFilters = filterStatus !== "all" || filterRisk !== "all" || filterAccount !== "all" || search;

  const exportToCSV = () => {
    const headers = ["Case #", "Trainee", "Oracle ID", "Risk", "Stage", "Hours", "Account", "LOB", "Status", "Updated"];
    const rows = filtered.map((c) => [
      c.caseNumber, c.traineeName, c.oracleId, c.riskStatus, c.lifecycleStage,
      c.totalMissedHours, c.account, c.lob, c.caseStatus, formatDate(c.lastUpdatedDate),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eec-my-cases-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl px-5 py-4 shadow-glass-sm">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Cases</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">MY CASES</h1>
          <p className="text-gray-500 text-sm mt-1">
            {cases.length} total · {cases.filter((c) => c.caseStatus === "Active").length} active
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Tooltip content="Create a new attrition case" position="bottom">
            <button
              onClick={() => navigate("/submit")}
              className="bg-gradient-teal hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Case
            </button>
          </Tooltip>
          <Tooltip content="Export filtered cases to CSV" position="bottom">
            <button
              onClick={exportToCSV}
              className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-white/30 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV ({filtered.length})
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-glass-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, case #, Oracle ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
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
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as any)}
          >
            <option value="all">All Risk</option>
            <option value="Critical">Critical</option>
            <option value="High Risk">High Risk</option>
            <option value="Monitoring">Monitoring</option>
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {uniqueAccounts.map((acc) => (
              <option key={acc} value={acc}>{acc}</option>
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
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" label="Loading cases..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No cases found</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasFilters ? "Try adjusting your filters" : "Click 'Submit Case' to create your first case"}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 text-teal-600 text-sm hover:underline font-medium">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        /* Card Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c, idx) => (
            <CaseCard
              key={c.id}
              caseData={c}
              delay={idx * 30}
              expanded={expandedCard === c.id}
              onToggleExpand={() => setExpandedCard(expandedCard === c.id ? null : c.id)}
              onView={() => setSelectedCase(c)}
              onUpdate={() => navigate(`/update?case=${c.caseNumber}`)}
              onTimeline={() => navigate(`/timeline?case=${c.caseNumber}`)}
            />
          ))}
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdate={() => { setSelectedCase(null); navigate(`/update?case=${selectedCase.caseNumber}`); }}
          onTimeline={() => { setSelectedCase(null); navigate(`/timeline?case=${selectedCase.caseNumber}`); }}
        />
      )}
    </div>
  );
}

// ─── Case Card Component ─────────────────────────────────────────────────────

function CaseCard({
  caseData,
  delay,
  expanded,
  onToggleExpand,
  onView,
  onUpdate,
  onTimeline,
}: {
  caseData: AttritionCase;
  delay: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onView: () => void;
  onUpdate: () => void;
  onTimeline: () => void;
}) {
  return (
    <div
      className={`glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass-sm transition-all duration-300 animate-fade-in-up hover:shadow-glass ${
        expanded ? "ring-2 ring-teal-300/50" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between cursor-pointer group" onClick={onToggleExpand}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
            {caseData.caseNumber}
          </span>
          <RiskBadge risk={caseData.riskStatus} size="sm" />
          <StageBadge stage={caseData.lifecycleStage} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-500">
            {formatHours(caseData.totalMissedHours)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-teal-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-teal-500 transition-colors" />
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-teal flex items-center justify-center text-white font-bold text-sm shrink-0">
            {caseData.traineeName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{caseData.traineeName}</p>
            <p className="text-xs text-gray-400 font-mono">{caseData.oracleId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {caseData.account}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {caseData.site}
          </span>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="pt-3 border-t border-gray-100 animate-slide-down space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoField label="LOB" value={caseData.lob} />
              <InfoField label="Wave" value={caseData.wave} />
              <InfoField label="Category" value={caseData.attritionCategory} />
              <InfoField label="Severity" value={caseData.severityLevel} />
              <InfoField label="Incident Date" value={formatDate(caseData.incidentDate)} />
              <InfoField label="Trainer" value={caseData.trainerName} />
            </div>

            {/* Flags */}
            <div className="flex gap-2 flex-wrap">
              {caseData.documentationRequired && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Docs Required
                </span>
              )}
              {caseData.escalationRequired && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Escalation
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Tooltip content="Update this case" position="top">
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdate(); }}
                  className="flex-1 bg-gradient-teal hover:opacity-90 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Update
                </button>
              </Tooltip>
              <Tooltip content="View full timeline" position="top">
                <button
                  onClick={(e) => { e.stopPropagation(); onTimeline(); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <History className="w-3 h-3" />
                  Timeline
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Meta Footer */}
        {!expanded && (
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(caseData.lastUpdatedDate)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              caseData.caseStatus === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}>
              {caseData.caseStatus}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 uppercase tracking-wide">{label}</span>
      <p className="text-gray-700 font-medium truncate">{value || "—"}</p>
    </div>
  );
}

// ─── Case Detail Modal ──────────────────────────────────────────────────────

function CaseDetailModal({
  caseData,
  onClose,
  onUpdate,
  onTimeline,
}: {
  caseData: AttritionCase;
  onClose: () => void;
  onUpdate: () => void;
  onTimeline: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass-lg max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 to-transparent">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-teal-700">{caseData.caseNumber}</span>
            <RiskBadge risk={caseData.riskStatus} />
            <StageBadge stage={caseData.lifecycleStage} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Trainee Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-teal flex items-center justify-center text-white font-bold text-xl shadow-glow-teal">
              {caseData.traineeName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">{caseData.traineeName}</p>
              <p className="text-sm text-gray-400 font-mono">{caseData.oracleId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Account" value={caseData.account} />
            <InfoField label="LOB" value={caseData.lob} />
            <InfoField label="Site" value={caseData.site} />
            <InfoField label="Wave" value={caseData.wave} />
            <InfoField label="Total Hours" value={`${caseData.totalMissedHours}h`} />
            <InfoField label="Category" value={caseData.attritionCategory} />
            <InfoField label="Sub-Reason" value={caseData.subReason} />
            <InfoField label="Severity" value={caseData.severityLevel} />
            <InfoField label="Trainer" value={caseData.trainerName} />
            <InfoField label="Manager" value={caseData.trainingManager} />
          </div>

          {caseData.notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-600">{caseData.notes}</p>
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-2 flex-wrap">
            {caseData.documentationRequired && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Documentation Required
              </span>
            )}
            {caseData.escalationRequired && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Escalation Required
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50/50">
          <Tooltip content="View case timeline" position="top">
            <button
              onClick={onTimeline}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Timeline
            </button>
          </Tooltip>
          <Tooltip content="Update this case" position="top">
            <button
              onClick={onUpdate}
              className="bg-gradient-teal hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-glow-teal flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
