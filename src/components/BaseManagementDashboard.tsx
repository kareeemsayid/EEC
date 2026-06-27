import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  fetchAllCases, fetchAccounts, fetchLOBs,
  Account, LOB, AttritionCase,
} from "../api/api";
import { fetchRelocations, RelocationRequest } from "../api/relocationsApi";
import toast from "react-hot-toast";
import { Users, BarChart3, TriangleAlert as AlertTriangle, Clock, Search, Filter, X, RefreshCw, Eye, Building2, Layers, ChevronRight, MapPin, Inbox, Activity } from "lucide-react";

interface BaseManagementDashboardProps {
  title: string;
  role: "Supervisor" | "Manager";
}

export default function BaseManagementDashboard({ title, role }: BaseManagementDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || role;

  // Get user's assigned accounts/LOBs (memoized for stable references)
  const myAccounts = useMemo(
    () => user?.supervisorAccounts?.map((a: any) => a.accountName) || [],
    [user?.supervisorAccounts]
  );
  const myLOBs = useMemo(
    () => user?.assignedLOBs || [],
    [user?.assignedLOBs]
  );

  // Redirect if wrong role
  useEffect(() => {
    if (userRole !== role) {
      navigate("/");
    }
  }, [userRole, role, navigate]);

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lobs, setLOBs] = useState<LOB[]>([]);
  const [relocations, setRelocations] = useState<RelocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterMode, setFilterMode] = useState<"all" | "mine">("all");
  const [filterAccounts, setFilterAccounts] = useState<string[]>([]);
  const [filterLOBs, setFilterLOBs] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterSite, setFilterSite] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 20;

  // Available accounts/LOBs based on role
  const availableAccounts = role === "Manager" ? accounts.filter(a => myAccounts.includes(a.title)) : accounts;
  const availableLOBs = role === "Supervisor" ? Array.from(new Set(lobs.map(l => l.title))).filter(l => myLOBs.includes(l)) : Array.from(new Set(lobs.map(l => l.title)));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesData, accountsData, lobsData, relData] = await Promise.all([
        fetchAllCases(),
        fetchAccounts(),
        fetchLOBs(),
        fetchRelocations({ page: 1, limit: 50 }).catch(() => null),
      ]);
      setCases(casesData);
      setAccounts(accountsData);
      setLOBs(lobsData);
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCases = useMemo(() => {
    let filtered = cases;

    // My Accounts filter
    if (filterMode === "mine") {
      if (role === "Supervisor" && myLOBs.length > 0) {
        filtered = filtered.filter(c => myLOBs.includes(c.lob));
      } else if (role === "Manager" && myAccounts.length > 0) {
        filtered = filtered.filter(c => myAccounts.includes(c.account));
      }
    }

    // Multi-select filters
    if (filterAccounts.length > 0) {
      filtered = filtered.filter(c => filterAccounts.includes(c.account));
    }
    if (filterLOBs.length > 0) {
      filtered = filtered.filter(c => filterLOBs.includes(c.lob));
    }

    if (filterStatus !== "all" && filterStatus !== "") {
      filtered = filtered.filter(c => c.caseStatus === filterStatus);
    }
    if (filterRisk !== "all" && filterRisk !== "") {
      filtered = filtered.filter(c => c.riskStatus === filterRisk);
    }
    if (filterSite !== "all" && filterSite !== "") {
      filtered = filtered.filter(c => c.site === filterSite);
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
  }, [cases, filterMode, filterAccounts, filterLOBs, filterStatus, filterRisk, filterSite, search, role, myAccounts, myLOBs]);

  const paginatedCases = filteredCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredCases.length / PAGE_SIZE);

  // Metrics
  const totalCases = filteredCases.length;
  const activeCases = filteredCases.filter(c => c.caseStatus === "Active").length;
  const criticalCases = filteredCases.filter(c => c.riskStatus === "Critical").length;
  const overdueCases = filteredCases.filter(c => c.totalMissedHours >= 16).length;

  // Filtered relocations touching their accounts
  const myRelocations = useMemo(() => {
    if (role === "Manager" && myAccounts.length > 0) {
      return relocations.filter(r => myAccounts.includes(r.account));
    }
    return [];
  }, [relocations, role, myAccounts]);

  const toggleAccount = (acc: string) => {
    setFilterAccounts(prev => prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]);
    setPage(1);
  };

  const toggleLOB = (lob: string) => {
    setFilterLOBs(prev => prev.includes(lob) ? prev.filter(l => l !== lob) : [...prev, lob]);
    setPage(1);
  };

  const clearFilters = () => {
    setFilterMode("all");
    setFilterAccounts([]);
    setFilterLOBs([]);
    setFilterStatus("all");
    setFilterRisk("all");
    setFilterSite("all");
    setSearch("");
    setPage(1);
  };

  const hasFilters = filterMode === "mine" || filterAccounts.length > 0 || filterLOBs.length > 0 || filterStatus !== "all" || filterRisk !== "all" || filterSite !== "all" || search;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">{role}</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            {title.toUpperCase()}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {role === "Supervisor" ? "Monitor cases across your assigned LOBs" : "Monitor cases across your assigned accounts"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadData()}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setFilterMode("all"); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filterMode === "all"
              ? "bg-slate-800 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All Accounts
        </button>
        <button
          onClick={() => { setFilterMode("mine"); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filterMode === "mine"
              ? "bg-teal-600 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          My {role === "Supervisor" ? "LOBs" : "Accounts"}
        </button>
        {filterMode === "mine" && (
          <span className="text-xs text-teal-600 font-medium bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
            Filtered to: {role === "Supervisor" ? myLOBs.join(", ") : myAccounts.join(", ")}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Cases" value={totalCases} icon={<Inbox className="w-5 h-5" />} color="navy" />
        <SummaryCard label="Active" value={activeCases} icon={<Activity className="w-5 h-5" />} color="teal" />
        <SummaryCard label="Critical" value={criticalCases} icon={<AlertTriangle className="w-5 h-5" />} color="red" pulse={criticalCases > 0} />
        <SummaryCard label="Overdue" value={overdueCases} icon={<Clock className="w-5 h-5" />} color="amber" pulse={overdueCases > 0} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 font-medium flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
              showFilters || hasFilters
                ? "bg-teal-50 border-teal-200 text-teal-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <span className="px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-[9px] font-bold">!</span>}
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-fade-in">
            {/* Account multi-select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Account
              </label>
              <div className="flex flex-wrap gap-2">
                {availableAccounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleAccount(a.title)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      filterAccounts.includes(a.title)
                        ? "bg-teal-50 border-teal-200 text-teal-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>

            {/* LOB multi-select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                LOB
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLOBs.map((lob) => (
                  <button
                    key={lob}
                    onClick={() => toggleLOB(lob)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      filterLOBs.includes(lob)
                        ? "bg-teal-50 border-teal-200 text-teal-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {lob}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={[
                { value: "Active", label: "Active" },
                { value: "Closed", label: "Closed" },
              ]} />
              <FilterSelect label="Risk" value={filterRisk} onChange={setFilterRisk} options={[
                { value: "Monitoring", label: "Monitoring" },
                { value: "High Risk", label: "High Risk" },
                { value: "Critical", label: "Critical" },
              ]} />
              <FilterSelect label="Site" value={filterSite} onChange={setFilterSite} options={Array.from(new Set(cases.map(c => c.site))).map(s => ({ value: s, label: s }))} />
            </div>
          </div>
        )}
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Cases</h3>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Case #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trainee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Oracle ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">LOB</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Open</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 rounded bg-gray-100 shimmer-bg" style={{ width: `${60 + (j % 3) * 15}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No cases found</p>
                  </td>
                </tr>
              ) : (
                paginatedCases.map((c) => {
                  const daysOpen = Math.floor((Date.now() - new Date(c.caseOpenedDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={c.id} className="hover:bg-teal-50/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-teal-700 font-bold">{c.caseNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.traineeName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.oracleId}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.account}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.lob}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.site}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          c.riskStatus === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
                          c.riskStatus === "High Risk" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {c.riskStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          c.caseStatus === "Active" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}>
                          {c.caseStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono font-medium ${
                          daysOpen > 7 ? "text-red-600" : daysOpen > 3 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {daysOpen}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/cases/${c.caseNumber}`)}
                          className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relocation Section (read-only for Manager) */}
      {role === "Manager" && myRelocations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Relocations Touching Your Accounts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Request ID</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Account</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myRelocations.map((rel) => (
                  <tr key={rel.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs text-teal-700 font-bold">{rel.requestId}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{rel.employeeName}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{rel.account}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        rel.status === "Submitted" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        rel.status === "PSCleared" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>
                        {rel.status === "Submitted" ? "Pending PS" : rel.status === "PSCleared" ? "Pending TA" : rel.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => navigate(`/relocations/${rel.id}`)}
                        className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color, pulse }: {
  label: string; value: number; icon: React.ReactNode; color: string;
  pulse?: boolean;
}) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    navy: { bg: "from-slate-700 to-slate-800", text: "text-white", iconBg: "bg-white/10" },
    teal: { bg: "from-teal-500 to-teal-600", text: "text-white", iconBg: "bg-white/10" },
    red: { bg: "from-red-500 to-red-600", text: "text-white", iconBg: "bg-white/10" },
    amber: { bg: "from-amber-500 to-amber-600", text: "text-white", iconBg: "bg-white/10" },
  };
  const c = colorMap[color] || colorMap.navy;

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${c.bg} p-4 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        {pulse && value > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        )}
      </div>
      <p className={`text-2xl font-barlow-condensed font-black ${c.text}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${c.text} opacity-70`}>{label}</p>
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
        onChange={(e) => { onChange(e.target.value); }}
        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
      >
        <option value="all">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
