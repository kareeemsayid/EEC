import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { fetchAllCases, fetchAccounts, Account, AttritionCase } from "../../api/api";
import { fetchRelocations, RelocationRequest } from "../../api/relocationsApi";
import RiskBadge from "../../components/RiskBadge";
import CountUp from "../../components/CountUp";
import toast from "react-hot-toast";
import {
  BarChart3, AlertTriangle, Clock, Search, Filter, X, RefreshCw,
  Eye, Building2, Inbox, Activity, TrendingUp,
  Crown, MapPin, Truck, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const myAccounts = useMemo(
    () => user?.supervisorAccounts?.map((a: any) => a.accountName) || [],
    [user?.supervisorAccounts]
  );

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [relocations, setRelocations] = useState<RelocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<"all" | "mine">("mine");
  const [filterAccounts, setFilterAccounts] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCase, setSelectedCase] = useState<AttritionCase | null>(null);
  const [activeTab, setActiveTab] = useState<"cases" | "relocations">("cases");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesData, accountsData, relData] = await Promise.all([
        fetchAllCases(),
        fetchAccounts(),
        fetchRelocations({ page: 1, limit: 50 }).catch(() => null),
      ]);
      setCases(casesData);
      setAccounts(accountsData);
      if (relData) {
        setRelocations(relData.data.relocations);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const availableAccounts = accounts.filter(a => myAccounts.includes(a.title));

  const filteredCases = useMemo(() => {
    let filtered = cases;
    if (filterMode === "mine" && myAccounts.length > 0) {
      filtered = filtered.filter(c => myAccounts.includes(c.account));
    }
    if (filterAccounts.length > 0) {
      filtered = filtered.filter(c => filterAccounts.includes(c.account));
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
  }, [cases, filterMode, filterAccounts, filterStatus, filterRisk, search, myAccounts]);

  const myRelocations = useMemo(() => {
    if (myAccounts.length > 0) {
      return relocations.filter(r => myAccounts.includes(r.account));
    }
    return [];
  }, [relocations, myAccounts]);

  const totalCases = filteredCases.length;
  const activeCases = filteredCases.filter(c => c.caseStatus === "Active").length;
  const criticalCases = filteredCases.filter(c => c.riskStatus === "Critical").length;
  const highRiskCases = filteredCases.filter(c => c.riskStatus === "High Risk").length;
  const overdueCases = filteredCases.filter(c => c.totalMissedHours >= 16).length;
  const pendingRelocations = myRelocations.filter(r => r.status === "Submitted" || r.status === "PS Cleared").length;

  const accountMetrics = useMemo(() => {
    const metrics: Record<string, { total: number; critical: number; active: number }> = {};
    filteredCases.forEach(c => {
      if (!metrics[c.account]) metrics[c.account] = { total: 0, critical: 0, active: 0 };
      metrics[c.account].total++;
      if (c.riskStatus === "Critical") metrics[c.account].critical++;
      if (c.caseStatus === "Active") metrics[c.account].active++;
    });
    return Object.entries(metrics).slice(0, 5);
  }, [filteredCases]);

  const toggleAccount = (acc: string) => {
    setFilterAccounts(prev => prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]);
  };

  const clearFilters = () => {
    setFilterMode("mine");
    setFilterAccounts([]);
    setFilterStatus("all");
    setFilterRisk("all");
    setSearch("");
  };

  const hasFilters = filterMode === "all" || filterAccounts.length > 0 || filterStatus !== "all" || filterRisk !== "all" || search;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
            <Crown className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 font-medium">Loading Manager Dashboard...</p>
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
              Account Manager
            </span>
            {criticalCases > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse-slow" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                {criticalCases} Critical
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Account Performance Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Strategic oversight of attrition cases and relocations across your managed accounts</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadData} className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button onClick={() => navigate("/admin")} className="eec-btn-primary flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Admin Panel
          </button>
        </div>
      </div>

      {/* My Accounts Display */}
      {myAccounts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Your Accounts:</span>
          {myAccounts.slice(0, 6).map((acc) => (
            <span key={acc} className="px-3 py-1 rounded-full text-xs font-semibold text-navy-900" style={{ background: "rgba(37,99,235,0.1)" }}>
              {acc}
            </span>
          ))}
          {myAccounts.length > 6 && (
            <span className="px-3 py-1 rounded-full bg-blue-50 text-eecblue text-xs font-medium">
              +{myAccounts.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("cases")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "cases"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Attrition Cases
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === "cases" ? "bg-blue-50 text-eecblue" : "bg-gray-200 text-gray-600"
          }`}>
            {filteredCases.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("relocations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "relocations"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Relocations
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === "relocations" ? "bg-blue-50 text-eecblue" : "bg-gray-200 text-gray-600"
          }`}>
            {myRelocations.length}
          </span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KpiCard label="Total Cases" value={totalCases} icon={Inbox} color="#1E3A5F" />
        <KpiCard label="Active" value={activeCases} icon={Activity} color="#2563EB" />
        <KpiCard label="Critical" value={criticalCases} icon={AlertTriangle} color="#EF4444" pulse={criticalCases > 0} />
        <KpiCard label="High Risk" value={highRiskCases} icon={TrendingUp} color="#F59E0B" />
        <KpiCard label="Overdue" value={overdueCases} icon={Clock} color="#7C3AED" pulse={overdueCases > 0} />
        <KpiCard label="Relocations" value={pendingRelocations} icon={MapPin} color="#22C55E" />
      </div>

      {/* Account Performance Cards */}
      {accountMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountMetrics.map(([account, stats], idx) => (
            <AccountPerformanceCard
              key={account}
              account={account}
              total={stats.total}
              critical={stats.critical}
              active={stats.active}
              delay={idx * 0.1}
              onClick={() => {
                setFilterAccounts([account]);
                setFilterMode("all");
              }}
            />
          ))}
        </div>
      )}

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
          <Crown className="w-4 h-4" />
          My Accounts
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
            {activeTab === "cases" ? `${filteredCases.length} cases` : `${myRelocations.length} relocations`}
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
                    <Building2 className="w-3 h-3" />
                    Account
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableAccounts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => toggleAccount(a.title)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          filterAccounts.includes(a.title)
                            ? "bg-blue-50 border-blue-300 text-eecblue"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {a.title}
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

      {/* Content Based on Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "cases" ? (
          <motion.div
            key="cases"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="eec-card overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-eecblue" />
              <h3 className="font-semibold text-navy-900 text-sm">Cases Overview</h3>
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
          </motion.div>
        ) : (
          <motion.div
            key="relocations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="eec-card overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-eecblue" />
              <h3 className="font-semibold text-navy-900 text-sm">Relocations Affecting Your Accounts</h3>
            </div>

            {myRelocations.length === 0 ? (
              <div className="py-16 text-center">
                <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No relocations affecting your accounts</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Request ID</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Employee</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Account</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myRelocations.map((rel, idx) => (
                      <motion.tr
                        key={rel.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => navigate(`/relocations/${rel.id}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs font-semibold text-eecblue">{rel.requestId}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-navy-900">{rel.employeeName}</p>
                            <p className="text-xs text-gray-400 font-mono">{rel.oid}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">{rel.account}</td>
                        <td className="px-5 py-3"><RelocationStatusBadge status={rel.status} /></td>
                        <td className="px-5 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/relocations/${rel.id}`); }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case Detail Modal */}
      <AnimatePresence>
        {selectedCase && (
          <ManagerCaseModal
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
      <div className="text-2xl font-bold text-navy-900">
        <CountUp value={value} duration={600} />
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</p>
    </motion.div>
  );
}

function AccountPerformanceCard({
  account,
  total,
  critical,
  active,
  delay,
  onClick,
}: {
  account: string;
  total: number;
  critical: number;
  active: number;
  delay: number;
  onClick: () => void;
}) {
  const healthScore = total > 0 ? Math.round(((total - critical) / total) * 100) : 100;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="eec-card text-left transition-all hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(30,58,95,0.1)" }}>
          <Building2 className="w-5 h-5 text-navy-900" />
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
          healthScore >= 80 ? "bg-green-50 text-green-600" :
          healthScore >= 50 ? "bg-amber-50 text-amber-600" :
          "bg-red-50 text-red-600"
        }`}>
          {healthScore}% health
        </div>
      </div>
      <h4 className="font-semibold text-navy-900 truncate mb-3">{account}</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <p className="text-lg font-bold text-navy-900">{total}</p>
          <p className="text-[10px] text-gray-400 uppercase">Total</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50">
          <p className="text-lg font-bold text-red-600">{critical}</p>
          <p className="text-[10px] text-red-400 uppercase">Critical</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-50">
          <p className="text-lg font-bold text-eecblue">{active}</p>
          <p className="text-[10px] text-blue-400 uppercase">Active</p>
        </div>
      </div>
    </motion.button>
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

function RelocationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    "Submitted": { bg: "bg-gray-100", text: "text-gray-600" },
    "PS Cleared": { bg: "bg-blue-50", text: "text-blue-600" },
    "Pending TA": { bg: "bg-amber-50", text: "text-amber-600" },
    "TA Cleared": { bg: "bg-teal-50", text: "text-teal-600" },
    "Relocated": { bg: "bg-green-50", text: "text-green-600" },
  };
  const c = config[status] || { bg: "bg-gray-50", text: "text-gray-500" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}

function ManagerCaseModal({
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
              <RiskBadge risk={caseData.riskStatus} size="sm" />
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
