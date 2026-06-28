import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  fetchAllCases, fetchAccounts,
  Account, AttritionCase,
} from "../../api/api";
import {
  fetchRelocationCounts, fetchRelocations,
  RelocationCounts, RelocationRequest,
} from "../../api/relocationsApi";
import RiskBadge from "../../components/RiskBadge";
import StageBadge from "../../components/StageBadge";
import CountUp from "../../components/CountUp";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import {
  BarChart3, AlertTriangle, Clock, Search, Filter, X, RefreshCw,
  Eye, TrendingUp, MapPin, ChevronRight, ChevronDown, Briefcase,
  FileSearch, Activity, Inbox, ClipboardList, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  Active: "#2563EB",
  Critical: "#EF4444",
  Monitoring: "#22C55E",
  Resolved: "#22C55E",
  Closed: "#94A3B8",
};

export default function PSDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [relocationCounts, setRelocationCounts] = useState<RelocationCounts | null>(null);
  const [overdueRelocations, setOverdueRelocations] = useState<RelocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [showRelocationPanel, setShowRelocationPanel] = useState(false);

  const role = user?.role || "PS";
  const allowedRoles = ["PS", "TA", "SrManager", "Admin"];
  const isAllowed = allowedRoles.includes(role);

  const PAGE_SIZE = 20;

  const loadData = useCallback(async () => {
    if (!isAllowed) return;
    setLoading(true);
    setError(null);
    try {
      const [casesData, accountsData, relCounts] = await Promise.all([
        fetchAllCases(),
        fetchAccounts(),
        fetchRelocationCounts(),
      ]);
      setCases(casesData);
      setAccounts(accountsData);
      setRelocationCounts(relCounts);

      try {
        const relList = await fetchRelocations({ page: 1, limit: 5 });
        const overdue = relList.data.relocations.filter((r: RelocationRequest) => r.overdueFlag);
        setOverdueRelocations(overdue);
      } catch { /* ignore */ }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isAllowed]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!isAllowed) {
      navigate("/dashboard");
    }
  }, [isAllowed, navigate]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (filterStatus !== "all" && c.caseStatus !== filterStatus) return false;
      if (filterRisk !== "all" && c.riskStatus !== filterRisk) return false;
      if (filterAccount !== "all" && c.account !== filterAccount) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.traineeName.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q) ||
          c.oracleId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cases, filterStatus, filterRisk, filterAccount, search]);

  const paginatedCases = filteredCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredCases.length / PAGE_SIZE);

  const totalCases = cases.length;
  const criticalCases = cases.filter((c) => c.riskStatus === "Critical").length;
  const highRiskCases = cases.filter((c) => c.riskStatus === "High Risk").length;
  const overdueCases = cases.filter((c) => c.totalMissedHours >= 16).length;
  const investigationPending = cases.filter((c) => c.lifecycleStage === "PS Review").length;
  const terminationPending = cases.filter((c) => c.lifecycleStage === "Termination Recommended").length;

  const accountCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => { counts[c.account] = (counts[c.account] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({ name, value }));
  }, [cases]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => { counts[c.caseStatus] = (counts[c.caseStatus] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || "#94A3B8",
    }));
  }, [cases]);

  if (!isAllowed) {
    return null;
  }

  const hasFilters = filterStatus !== "all" || filterRisk !== "all" || filterAccount !== "all" || search;

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterRisk("all");
    setFilterAccount("all");
    setSearch("");
    setPage(1);
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-12 h-12 rounded-full border-4 border-navy-200 border-t-eecblue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>
              People Solutions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">PS Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor all attrition cases and relocations across the organisation</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadData} className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={() => navigate("/investigations")} className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
            <FileSearch className="w-4 h-4" />
            Investigations
          </button>
          <button onClick={() => navigate("/analytics")} className="eec-btn-primary flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Cases" value={totalCases} icon={Inbox} color="#1E3A5F" />
        <KpiCard label="Critical" value={criticalCases} icon={AlertTriangle} color="#EF4444" pulse={criticalCases > 0} />
        <KpiCard label="High Risk" value={highRiskCases} icon={TrendingUp} color="#F59E0B" />
        <KpiCard label="Overdue" value={overdueCases} icon={Clock} color="#7C3AED" pulse={overdueCases > 0} />
        <KpiCard label="PS Review" value={investigationPending} icon={FileSearch} color="#2563EB" />
        <KpiCard label="Termination" value={terminationPending} icon={ClipboardList} color="#EF4444" />
      </div>

      {/* Relocation Metrics */}
      {relocationCounts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Relocations" value={relocationCounts.total} icon={MapPin} color="#1E3A5F" />
          <KpiCard label="Pending PS" value={relocationCounts.submitted} icon={Clock} color="#F59E0B" pulse={relocationCounts.overduePS > 0} />
          <KpiCard label="Pending TA" value={relocationCounts.psCleared} icon={ClipboardList} color="#2563EB" />
          <KpiCard label="Overdue" value={(relocationCounts.overduePS || 0) + (relocationCounts.overdueTA || 0)} icon={AlertTriangle} color="#EF4444" pulse={(relocationCounts.overduePS + relocationCounts.overdueTA) > 0} />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 font-medium flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Cases per Account" icon={<BarChart3 className="w-4 h-4" />}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={accountCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="value" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Distribution" icon={<Activity className="w-4 h-4" />}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Distribution" icon={<Shield className="w-4 h-4" />}>
          <div className="flex flex-col justify-center h-[220px] gap-3">
            {[
              { label: "Critical", value: criticalCases, color: "#EF4444" },
              { label: "High Risk", value: highRiskCases, color: "#F59E0B" },
              { label: "Monitoring", value: cases.filter(c => c.riskStatus === "Monitoring").length, color: "#22C55E" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="font-bold text-navy-900">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="eec-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, case #, Oracle ID..."
              className="eec-input pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
              showFilters || hasFilters
                ? "bg-blue-50 border-blue-200 text-eecblue"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <span className="px-1.5 py-0.5 rounded-full bg-eecblue text-white text-[9px] font-bold">{[filterStatus, filterRisk, filterAccount].filter(f => f !== "all").length + (search ? 1 : 0)}</span>}
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
              <X className="w-4 h-4" />
              Clear
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto font-mono">
            {filteredCases.length} of {cases.length} cases
          </span>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={[
                  { value: "Active", label: "Active" },
                  { value: "Closed", label: "Closed" },
                ]} />
                <FilterSelect label="Risk" value={filterRisk} onChange={setFilterRisk} options={[
                  { value: "Critical", label: "Critical" },
                  { value: "High Risk", label: "High Risk" },
                  { value: "Monitoring", label: "Monitoring" },
                ]} />
                <FilterSelect label="Account" value={filterAccount} onChange={setFilterAccount} options={accounts.map(a => ({ value: a.title, label: a.title }))} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cases Table */}
      <div className="eec-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-eecblue" />
            <h3 className="font-semibold text-navy-900 text-sm">Attrition Cases</h3>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Case #</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Trainee</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Account</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">LOB</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Risk</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Stage</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Hours</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No cases match your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedCases.map((c, idx) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/cases/${c.caseNumber}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-eecblue">{c.caseNumber}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-navy-900">{c.traineeName}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.account}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.lob}</td>
                    <td className="px-4 py-3"><RiskBadge risk={c.riskStatus} size="sm" showTooltip={false} /></td>
                    <td className="px-4 py-3"><StageBadge stage={c.lifecycleStage} size="sm" /></td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-semibold ${
                        c.totalMissedHours >= 16 ? "text-red-500" :
                        c.totalMissedHours >= 8 ? "text-amber-500" : "text-green-500"
                      }`}>
                        {c.totalMissedHours}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.caseNumber}`); }}
                        className="text-xs bg-blue-50 text-eecblue hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relocation Quick View */}
      <div className="eec-card overflow-hidden">
        <button
          onClick={() => setShowRelocationPanel(!showRelocationPanel)}
          className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-eecblue" />
            <h3 className="font-semibold text-navy-900 text-sm">Relocation Requests</h3>
            {overdueRelocations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
                {overdueRelocations.length} overdue
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRelocationPanel ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showRelocationPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-gray-100">
                {overdueRelocations.length > 0 ? (
                  <div className="overflow-x-auto pt-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Request ID</th>
                          <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Employee</th>
                          <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</th>
                          <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {overdueRelocations.map((rel) => (
                          <tr key={rel.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 font-mono text-xs font-semibold text-eecblue">{rel.requestId}</td>
                            <td className="px-3 py-2 text-sm text-navy-900">{rel.employeeName}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                rel.status === "Submitted" ? "bg-amber-50 text-amber-600" :
                                rel.status === "PSCleared" ? "bg-blue-50 text-blue-600" :
                                "bg-gray-50 text-gray-600"
                              }`}>
                                {rel.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <button onClick={() => navigate(`/relocations/${rel.id}`)} className="text-xs bg-blue-50 text-eecblue hover:bg-blue-100 px-2 py-1 rounded transition-colors font-medium">
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <MapPin className="w-8 h-8 text-green-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No overdue relocations</p>
                  </div>
                )}
                <div className="mt-4 flex justify-center">
                  <button onClick={() => navigate("/relocations")} className="text-sm font-semibold text-eecblue flex items-center gap-1 hover:underline">
                    View All Relocations <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="eec-card overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-eecblue">{icon}</span>
        <h3 className="font-semibold text-navy-900 text-sm">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-eecblue transition-all"
      >
        <option value="all">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
