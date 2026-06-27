import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { fetchAllCases, fetchLOBs, LOB, AttritionCase } from "../../api/api";
import RiskBadge from "../../components/RiskBadge";
import CountUp from "../../components/CountUp";
import toast from "react-hot-toast";
import {
  BarChart3, AlertTriangle, Clock, Search, Filter, X, RefreshCw,
  Eye, Building2, Layers, ChevronRight, Inbox, Activity, TrendingUp,
  Target, AlertCircle, Shield, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const myLOBs = useMemo(() => user?.assignedLOBs || [], [user?.assignedLOBs]);

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [lobs, setLOBs] = useState<LOB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<"all" | "mine">("mine");
  const [filterLOBs, setFilterLOBs] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCase, setSelectedCase] = useState<AttritionCase | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesData, lobsData] = await Promise.all([fetchAllCases(), fetchLOBs()]);
      setCases(casesData);
      setLOBs(lobsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const availableLOBs = Array.from(new Set(lobs.map(l => l.title)));

  const filteredCases = useMemo(() => {
    let filtered = cases;
    if (filterMode === "mine" && myLOBs.length > 0) {
      filtered = filtered.filter(c => myLOBs.includes(c.lob));
    }
    if (filterLOBs.length > 0) {
      filtered = filtered.filter(c => filterLOBs.includes(c.lob));
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter(c => c.caseStatus === filterStatus);
    }
    if (filterRisk !== "all") {
      filtered = filtered.filter(c => c.riskStatus === filterRisk);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.traineeName.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.oracleId.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [cases, filterMode, filterLOBs, filterStatus, filterRisk, search, myLOBs]);

  const totalCases = filteredCases.length;
  const activeCases = filteredCases.filter(c => c.caseStatus === "Active").length;
  const criticalCases = filteredCases.filter(c => c.riskStatus === "Critical").length;
  const highRiskCases = filteredCases.filter(c => c.riskStatus === "High Risk").length;
  const monitoringCases = filteredCases.filter(c => c.riskStatus === "Monitoring").length;
  const overdueCases = filteredCases.filter(c => c.totalMissedHours >= 16).length;

  const casesByLOB = useMemo(() => {
    const grouped: Record<string, { total: number; critical: number }> = {};
    filteredCases.forEach(c => {
      if (!grouped[c.lob]) grouped[c.lob] = { total: 0, critical: 0 };
      grouped[c.lob].total++;
      if (c.riskStatus === "Critical") grouped[c.lob].critical++;
    });
    return grouped;
  }, [filteredCases]);

  const toggleLOB = (lob: string) => {
    setFilterLOBs(prev => prev.includes(lob) ? prev.filter(l => l !== lob) : [...prev, lob]);
  };

  const clearFilters = () => {
    setFilterMode("mine");
    setFilterLOBs([]);
    setFilterStatus("all");
    setFilterRisk("all");
    setSearch("");
  };

  const hasFilters = filterMode === "all" || filterLOBs.length > 0 || filterStatus !== "all" || filterRisk !== "all" || search;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 font-medium">Loading Supervisor Dashboard...</p>
        </div>
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
              Training Supervisor
            </span>
            {criticalCases > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse-slow" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                {criticalCases} Critical
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy-900">LOB Performance Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor attrition cases across your assigned Lines of Business</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadData} className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button onClick={() => navigate("/cases/submit")} className="eec-btn-primary flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Action
          </button>
        </div>
      </div>

      {/* My LOBs Display */}
      {myLOBs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Your LOBs:</span>
          {myLOBs.map((lob) => (
            <span key={lob} className="px-3 py-1 rounded-full text-xs font-semibold text-navy-900" style={{ background: "rgba(37,99,235,0.1)" }}>
              {lob}
            </span>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Total Cases" value={totalCases} icon={Inbox} color="#1E3A5F" />
        <KpiCard label="Active" value={activeCases} icon={Activity} color="#2563EB" />
        <KpiCard label="Critical" value={criticalCases} icon={AlertTriangle} color="#EF4444" pulse={criticalCases > 0} />
        <KpiCard label="High Risk" value={highRiskCases} icon={TrendingUp} color="#F59E0B" />
        <KpiCard label="Overdue" value={overdueCases} icon={Clock} color="#7C3AED" pulse={overdueCases > 0} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStatCard
          title="LOB Performance"
          subtitle="Risk distribution across your LOBs"
          icon={Layers}
          data={Object.entries(casesByLOB).slice(0, 4).map(([lob, stats]) => ({
            label: lob,
            value: stats.total,
            critical: stats.critical,
          }))}
        />
        <QuickStatCard
          title="Risk Status Breakdown"
          subtitle="Current case risk levels"
          icon={Target}
          data={[
            { label: "Critical", value: criticalCases },
            { label: "High Risk", value: highRiskCases },
            { label: "Monitoring", value: monitoringCases },
          ]}
        />
        <QuickActionPanel
          title="Supervisor Actions"
          actions={[
            { label: "View All Cases", icon: Eye, onClick: () => setFilterMode("all") },
            { label: "Critical Cases", icon: AlertCircle, onClick: () => setFilterRisk("Critical"), alert: criticalCases },
            { label: "My LOBs Only", icon: Layers, onClick: () => setFilterMode("mine") },
          ]}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 font-medium flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter Mode Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setFilterMode("mine")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            filterMode === "mine"
              ? "bg-navy-900 text-white shadow-lg"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Layers className="w-4 h-4" />
          My LOBs
        </button>
        <button
          onClick={() => setFilterMode("all")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            filterMode === "all"
              ? "bg-navy-900 text-white shadow-lg"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          All Accounts
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="ml-auto px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="eec-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, case #, or OID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="eec-input pl-10"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center gap-2 ${
              showFilters || hasFilters
                ? "bg-blue-50 border-blue-200 text-eecblue"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-eecblue text-white text-[10px] font-bold flex items-center justify-center">!</span>
            )}
          </button>

          <div className="ml-auto text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1.5 rounded-lg">
            {filteredCases.length} cases
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Line of Business
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableLOBs.map((lob) => (
                      <button
                        key={lob}
                        onClick={() => toggleLOB(lob)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          filterLOBs.includes(lob)
                            ? "bg-blue-50 border-blue-300 text-eecblue"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {lob}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Risk Level</label>
                    <select
                      value={filterRisk}
                      onChange={(e) => setFilterRisk(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="all">All Levels</option>
                      <option value="Critical">Critical</option>
                      <option value="High Risk">High Risk</option>
                      <option value="Monitoring">Monitoring</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cases Table */}
      <div className="eec-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-eecblue" />
            <h3 className="font-semibold text-navy-900 text-sm">Cases Overview</h3>
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No cases match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Case #</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Trainee</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Account</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">LOB</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Site</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Risk</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCases.map((c, idx) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => setSelectedCase(c)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-semibold text-eecblue">{c.caseNumber}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-navy-900">{c.traineeName}</p>
                        <p className="text-xs text-gray-400 font-mono">{c.oracleId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">{c.account}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{c.lob}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{c.site}</td>
                    <td className="px-5 py-3"><RiskBadge risk={c.riskStatus} size="sm" showTooltip={false} /></td>
                    <td className="px-5 py-3"><StatusBadge status={c.caseStatus} /></td>
                    <td className="px-5 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.caseNumber}`); }}
                        className="text-xs bg-blue-50 text-eecblue hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      <AnimatePresence>
        {selectedCase && (
          <CaseDetailModal
            caseData={selectedCase}
            onClose={() => setSelectedCase(null)}
            onNavigate={(path) => { setSelectedCase(null); navigate(path); }}
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="eec-card">
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
      <div className="text-3xl font-bold text-navy-900">
        <CountUp value={value} duration={600} />
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</p>
    </motion.div>
  );
}

function QuickStatCard({
  title,
  subtitle,
  icon: Icon,
  data,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  data: { label: string; value: number; critical?: number }[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="eec-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(37,99,235,0.1)" }}>
          <Icon className="w-4 h-4 text-eecblue" />
        </div>
        <div>
          <h4 className="font-semibold text-navy-900">{title}</h4>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-xs font-medium text-gray-600">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-navy-900">{item.value}</span>
              {item.critical !== undefined && item.critical > 0 && (
                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                  {item.critical} critical
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function QuickActionPanel({
  title,
  actions,
}: {
  title: string;
  actions: { label: string; icon: React.ElementType; onClick: () => void; alert?: number }[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="eec-card">
      <h4 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-eecblue" />
        {title}
      </h4>
      <div className="space-y-2">
        {actions.map((action, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-eecblue transition-colors group"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <action.icon className="w-4 h-4" />
              {action.label}
            </span>
            <div className="flex items-center gap-1">
              {action.alert !== undefined && action.alert > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {action.alert}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-eecblue transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    "Active": { bg: "bg-blue-50", text: "text-blue-600" },
    "Closed": { bg: "bg-gray-50", text: "text-gray-500" },
  };
  const c = config[status] || config["Active"];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}

function CaseDetailModal({
  caseData,
  onClose,
  onNavigate,
}: {
  caseData: AttritionCase;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const daysOpen = Math.floor((Date.now() - new Date(caseData.caseOpenedDate).getTime()) / (1000 * 60 * 60 * 24));

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
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-eecblue">{caseData.caseNumber}</span>
              <RiskBadge risk={caseData.riskStatus} />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Trainee" value={caseData.traineeName} />
            <InfoField label="Oracle ID" value={caseData.oracleId} mono />
            <InfoField label="Account" value={caseData.account} />
            <InfoField label="LOB" value={caseData.lob} />
            <InfoField label="Site" value={caseData.site} />
            <InfoField label="Days Open" value={`${daysOpen} days`} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50/50">
          <button
            onClick={() => onNavigate(`/cases/${caseData.caseNumber}`)}
            className="eec-btn-primary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
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
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <p className={`text-sm mt-0.5 text-navy-900 font-medium ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}
