import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/useAuth";
import { fetchCases, fetchInvestigations, fetchInvestigationCounts, AttritionCase, Investigation, InvestigationKpis } from "../../api/api";
import { fetchRelocations, RelocationRequest } from "../../api/relocationsApi";
import RiskBadge from "../../components/RiskBadge";
import StageBadge from "../../components/StageBadge";
import CountUp from "../../components/CountUp";
import toast from "react-hot-toast";
import { Plus, MapPin, Search, Eye, TriangleAlert as AlertTriangle, Inbox, ChevronRight, RefreshCw, Clock, FolderOpen, Building2, FileSearch, Scale } from "lucide-react";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [relocations, setRelocations] = useState<RelocationRequest[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [invKpis, setInvKpis] = useState<InvestigationKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "Critical" | "High Risk" | "Terminations Pending" | "Overdue SLA">("All");
  const [search, setSearch] = useState("");
  const [caseTypeTab, setCaseTypeTab] = useState<"attrition" | "investigations" | "relocations">("attrition");
  const [relTab, setRelTab] = useState<"pending" | "all">("pending");

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const [casesResult, relData, invResult, invKpisResult] = await Promise.all([
        fetchCases(),
        fetchRelocations({ page: 1, limit: 20 }).catch(() => null),
        fetchInvestigations({ limit: 20 }).catch(() => ({ investigations: [] })),
        fetchInvestigationCounts().catch(() => null),
      ]);
      setCases(casesResult.cases);
      if (relData) {
        setRelocations(relData.data.relocations.filter((r: RelocationRequest) =>
          r.submittedByEmail === user.email
        ));
      }
      setInvestigations(invResult.investigations || []);
      setInvKpis(invKpisResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCases = useMemo(() => {
    let list = cases;
    if (activeTab === "Critical") list = list.filter(c => c.riskStatus === "Critical");
    if (activeTab === "High Risk") list = list.filter(c => c.riskStatus === "High Risk");
    if (activeTab === "Terminations Pending") list = list.filter(c => c.lifecycleStage === "Termination Recommended" || c.lifecycleStage === "Workday Action Pending");
    if (activeTab === "Overdue SLA") {
      list = list.filter(c => {
        const daysOpen = Math.floor((Date.now() - new Date(c.caseOpenedDate).getTime()) / 86400000);
        return daysOpen > 7;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.traineeName.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.oracleId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cases, activeTab, search]);

  const totalCases = cases.length;
  const criticalCount = cases.filter(c => c.riskStatus === "Critical").length;
  const highRiskCount = cases.filter(c => c.riskStatus === "High Risk").length;
  const activeCount = cases.filter(c => c.caseStatus === "Active").length;
  const monitoringCount = cases.filter(c => c.riskStatus === "Monitoring").length;
  const terminationsPendingCount = cases.filter(c => c.lifecycleStage === "Termination Recommended" || c.lifecycleStage === "Workday Action Pending").length;
  const overdueSlaCount = cases.filter(c => {
    const daysOpen = Math.floor((Date.now() - new Date(c.caseOpenedDate).getTime()) / 86400000);
    return daysOpen > 7;
  }).length;
  const myInvestigations = investigations.filter(i => i.requestedByEmail?.toLowerCase() === user?.email?.toLowerCase());

  const pendingRels = relocations.filter(r => r.status === "Submitted" || r.status === "PSCleared");
  const displayRels = relTab === "pending" ? pendingRels : relocations;

  const getDaysOpen = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>
              Training Specialist
            </span>
            {criticalCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse-slow" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                {criticalCount} Critical
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy-900">My Cases Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.displayName} · {activeCount} attrition · {myInvestigations.length} investigations · {pendingRels.length} relocations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/investigations/new")}
            className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "rgba(0,196,180,0.1)", color: "#00C4B4" }}
          >
            <Scale className="w-4 h-4" />
            Request Investigation
          </button>
          <button
            onClick={() => navigate("/relocations/submit")}
            className="eec-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <MapPin className="w-4 h-4" />
            Submit Relocation
          </button>
          <button
            onClick={() => navigate("/submit")}
            className="eec-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="eec-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.1)" }}>
              <FolderOpen className="w-5 h-5 text-eecblue" />
            </div>
          </div>
          <div className="text-3xl font-bold text-navy-900">
            {loading ? "—" : <CountUp value={totalCases} duration={600} />}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Attrition Cases</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="eec-card"
          onClick={() => navigate("/high-risk")}
          style={{ cursor: criticalCount > 0 ? "pointer" : "default" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            {criticalCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping bg-red-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-red-500">
            {loading ? "—" : <CountUp value={criticalCount} duration={600} />}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Critical</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="eec-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
              <Eye className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {loading ? "—" : <CountUp value={monitoringCount} duration={600} />}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Monitoring</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="eec-card cursor-pointer"
          onClick={() => navigate("/investigations")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
              <FileSearch className="w-5 h-5" style={{ color: "#00C4B4" }} />
            </div>
            {invKpis && invKpis.critical > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping bg-red-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </div>
          <div className="text-3xl font-bold" style={{ color: "#00C4B4" }}>
            {loading ? "—" : <CountUp value={myInvestigations.length} duration={600} />}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">My Investigations</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="eec-card cursor-pointer"
          onClick={() => navigate("/relocations")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
              <Building2 className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {loading ? "—" : <CountUp value={pendingRels.length} duration={600} />}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Relocations</p>
        </motion.div>
      </div>

      {/* Case Type Tabs */}
      <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl p-1.5 border border-gray-100 max-w-max">
        {([
          { key: "attrition", label: "Attrition Cases", icon: FolderOpen, count: totalCases },
          { key: "investigations", label: "Investigations", icon: FileSearch, count: myInvestigations.length },
          { key: "relocations", label: "Relocations", icon: Building2, count: relocations.length },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setCaseTypeTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={caseTypeTab === tab.key
              ? { background: "#1E3A5F", color: "white" }
              : { background: "transparent", color: "#64748B" }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${caseTypeTab === tab.key ? "bg-white/20" : "bg-gray-100"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Search */}
      {caseTypeTab === "attrition" && (
        <div className="flex items-center gap-3 flex-wrap">
          {(["All", "Critical", "High Risk", "Terminations Pending", "Overdue SLA"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={activeTab === tab
                ? { background: "#0D2B45", color: "white", boxShadow: "0 4px 12px rgba(13,43,69,0.2)" }
                : { background: "white", color: "#64748B", border: "1px solid #E2E8F0" }}
            >
              {tab}
              {tab === "Critical" && criticalCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{criticalCount}</span>
              )}
              {tab === "High Risk" && highRiskCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">{highRiskCount}</span>
              )}
              {tab === "Terminations Pending" && terminationsPendingCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500 text-white">{terminationsPendingCount}</span>
              )}
              {tab === "Overdue SLA" && overdueSlaCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white">{overdueSlaCount}</span>
              )}
            </button>
          ))}
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="eec-input pl-9"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-eecblue hover:border-eecblue transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      {/* Attrition Cases Table */}
      {caseTypeTab === "attrition" && (
        <div className="eec-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Case #", "Trainee", "Oracle ID", "Account", "LOB", "Risk", "Stage", "Days", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded-lg bg-gray-100 shimmer-bg" style={{ width: `${60 + (j % 3) * 15}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No cases found</p>
                    <button
                      onClick={() => navigate("/submit")}
                      className="mt-3 eec-btn-primary"
                    >
                      Submit your first case
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c, idx) => {
                  const days = getDaysOpen(c.caseOpenedDate);
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: "1px solid #F1F5F9" }}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-eecblue">{c.caseNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-navy-900">{c.traineeName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.oracleId}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.account}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.lob}</td>
                      <td className="px-4 py-3"><RiskBadge risk={c.riskStatus} size="sm" showTooltip={false} /></td>
                      <td className="px-4 py-3"><StageBadge stage={c.lifecycleStage} size="sm" /></td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-semibold ${days > 7 ? "text-red-500" : days > 3 ? "text-amber-500" : "text-green-500"}`}>
                          {days}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/update?case=${c.caseNumber}`)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Update"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-eecblue" />
                          </button>
                          <button
                            onClick={() => navigate(`/timeline?case=${c.caseNumber}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Timeline"
                          >
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Investigations Section */}
      {caseTypeTab === "investigations" && (
        <div className="eec-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
                <FileSearch className="w-4 h-4" style={{ color: "#00C4B4" }} />
              </div>
              <h3 className="font-semibold text-navy-900">My Investigation Requests</h3>
            </div>
            <button
              onClick={() => navigate("/investigations/new")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-teal-50"
              style={{ color: "#00C4B4" }}
            >
              <Plus className="w-3 h-3" /> New Request
            </button>
          </div>

          {myInvestigations.length === 0 ? (
            <div className="py-12 text-center">
              <FileSearch className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No investigation requests</p>
              <button
                onClick={() => navigate("/investigations/new")}
                className="mt-3 text-sm font-medium px-4 py-2 rounded-xl text-white"
                style={{ background: "#00C4B4" }}
              >
                Request Investigation
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myInvestigations.map(inv => (
                <div key={inv.id} className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4">
                  <div>
                    <span className="font-mono text-xs font-semibold" style={{ color: "#00C4B4" }}>{inv.investigationNumber}</span>
                    <p className="text-sm font-medium text-navy-900 mt-0.5">{inv.traineeName}</p>
                  </div>
                  <span className="text-xs text-gray-500">{inv.investigationType}</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inv.status === "Open" ? "bg-blue-50 text-blue-600" :
                      inv.status === "In Progress" ? "bg-amber-50 text-amber-600" :
                      inv.status === "Closed" ? "bg-green-50 text-green-600" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {inv.status}
                    </span>
                    <button
                      onClick={() => navigate(`/investigations/${inv.id}`)}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:bg-teal-50"
                      style={{ color: "#00C4B4" }}
                    >
                      <Eye className="w-3 h-3" />View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {myInvestigations.length > 5 && (
            <div className="px-5 py-3 flex justify-center border-t border-gray-100">
              <button
                onClick={() => navigate("/investigations")}
                className="text-sm font-semibold flex items-center gap-1 hover:underline"
                style={{ color: "#00C4B4" }}
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Relocation Requests */}
      {caseTypeTab === "relocations" && (
        <div className="eec-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.1)" }}>
                <Building2 className="w-4 h-4 text-eecblue" />
              </div>
              <h3 className="font-semibold text-navy-900">My Relocation Requests</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {(["pending", "all"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setRelTab(t)}
                    className="text-xs font-medium px-3 py-1.5 transition-all"
                    style={relTab === t
                      ? { background: "#1E3A5F", color: "white" }
                      : { background: "transparent", color: "#64748B" }}
                  >
                    {t === "pending" ? `Pending (${pendingRels.length})` : `All (${relocations.length})`}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate("/relocations/submit")}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-50 text-eecblue"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
          </div>

        {displayRels.length === 0 ? (
          <div className="py-12 text-center">
            <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No {relTab === "pending" ? "pending " : ""}relocation requests</p>
            <button
              onClick={() => navigate("/relocations/submit")}
              className="mt-3 text-sm font-medium px-4 py-2 rounded-xl text-white"
              style={{ background: "#2563EB" }}
            >
              Submit Request
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayRels.slice(0, 5).map(rel => (
              <div key={rel.id} className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4">
                <div>
                  <span className="font-mono text-xs font-semibold text-eecblue">{rel.requestId}</span>
                  <p className="text-sm font-medium text-navy-900 mt-0.5">{rel.employeeName}</p>
                </div>
                <span className="text-xs text-gray-500 ml-2">{rel.lob}</span>
                <div className="ml-auto flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    rel.status === "Submitted" ? "bg-amber-50 text-amber-600" :
                    rel.status === "PSCleared" ? "bg-blue-50 text-blue-600" :
                    rel.status === "Relocated" ? "bg-green-50 text-green-600" :
                    "bg-gray-50 text-gray-500"
                  }`}>
                    {rel.status === "Submitted" ? "Pending PS" : rel.status === "PSCleared" ? "Pending TA" : rel.status}
                  </span>
                  {rel.overdueFlag && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertTriangle className="w-3 h-3" />Overdue
                    </span>
                  )}
                  <button
                    onClick={() => navigate(`/relocations/${rel.id}`)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:bg-blue-50 text-eecblue"
                  >
                    <Eye className="w-3 h-3" />View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayRels.length > 5 && (
          <div className="px-5 py-3 flex justify-center border-t border-gray-100">
            <button
              onClick={() => navigate("/relocations")}
              className="text-sm font-semibold text-eecblue flex items-center gap-1 hover:underline"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
