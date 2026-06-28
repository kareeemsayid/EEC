import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/useAuth";
import { fetchCases, fetchInvestigations, fetchInvestigationCounts, AttritionCase, Investigation, InvestigationKpis } from "../../api/api";
import { fetchRelocations, RelocationRequest } from "../../api/relocationsApi";
import { apiFetch } from "../../api";
import RiskBadge from "../../components/RiskBadge";
import StageBadge from "../../components/StageBadge";
import CountUp from "../../components/CountUp";
import toast from "react-hot-toast";
import { Plus, MapPin, Search, Eye, TriangleAlert as AlertTriangle, Inbox, ChevronRight, RefreshCw, Clock, FolderOpen, Building2, FileSearch, Scale, TrendingUp, Activity as ActivityIcon, Zap, Flame, Target, CircleAlert as AlertCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  refId: string;
  entityName: string;
  action: string;
  user: string;
  timestamp: string;
  notes: string;
}

interface SlaData {
  psClearanceSla: number;
  taClearanceSla: number;
  relocationRate: number;
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [relocations, setRelocations] = useState<RelocationRequest[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [, setInvKpis] = useState<InvestigationKpis | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [slaData, setSlaData] = useState<SlaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "Critical" | "High Risk" | "Terminations Pending" | "Overdue SLA">("All");
  const [search, setSearch] = useState("");
  const [caseTypeTab, setCaseTypeTab] = useState<"attrition" | "investigations" | "relocations">("attrition");
  const [relTab, setRelTab] = useState<"pending" | "all">("pending");
  const [now, setNow] = useState(new Date());

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const [casesResult, relData, invResult, invKpisResult, actResult, slaResult] = await Promise.all([
        fetchCases(),
        fetchRelocations({ page: 1, limit: 20 }).catch(() => null),
        fetchInvestigations({ limit: 20 }).catch(() => ({ investigations: [] })),
        fetchInvestigationCounts().catch(() => null),
        apiFetch<any>("/activity/recent").catch(() => ({ data: [] })),
        apiFetch<any>("/analytics/sla-performance").catch(() => null),
      ]);
      setCases(casesResult.cases);
      if (relData) {
        setRelocations(relData.data.relocations.filter((r: RelocationRequest) =>
          r.submittedByEmail === user.email
        ));
      }
      setInvestigations(invResult.investigations || []);
      setInvKpis(invKpisResult);
      setActivities(actResult?.data || []);
      if (slaResult?.data) setSlaData(slaResult.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
  const terminationsPendingCount = cases.filter(c => c.lifecycleStage === "Termination Recommended" || c.lifecycleStage === "Workday Action Pending").length;
  const myInvestigations = investigations.filter(i => i.requestedByEmail?.toLowerCase() === user?.email?.toLowerCase());

  const pendingRels = relocations.filter(r => r.status === "Submitted" || r.status === "PSCleared");
  const displayRels = relTab === "pending" ? pendingRels : relocations;

  const getDaysOpen = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  const firstName = user?.displayName?.split(" ")[0] || user?.firstName || "Trainer";
  const hour = now.getHours();
  const greeting = hour < 12 ? "Rise & Shine" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const tagline = hour < 12 ? "Let's make today count" : hour < 17 ? "Keep the momentum going" : "Finishing strong";
  const subtitle = hour < 12 ? "Every case you handle shapes someone's journey. Let's make today count." : hour < 17 ? "Your dedication keeps the team moving forward. Stay focused, stay sharp." : "Another day of impact in the books. Your work matters.";

  const formattedDate = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const initials = user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const kpiCards = [
    { label: "Active Cases", value: activeCount, icon: FolderOpen, color: "#2563EB", bg: "rgba(37,99,235,0.1)", trend: activeCount > 0 ? "up" : "flat" as const },
    { label: "High-Risk", value: highRiskCount, icon: AlertCircle, color: "#F59E0B", bg: "rgba(245,158,11,0.1)", trend: highRiskCount > 0 ? "up" : "flat" as const },
    { label: "Critical", value: criticalCount, icon: AlertTriangle, color: "#EF4444", bg: "rgba(239,68,68,0.1)", trend: criticalCount > 0 ? "up" : "flat" as const, pulse: criticalCount > 0 },
    { label: "Terminations", value: terminationsPendingCount, icon: AlertTriangle, color: "#7C3AED", bg: "rgba(124,58,237,0.1)", trend: "flat" as const },
    { label: "Relocations", value: pendingRels.length, icon: Building2, color: "#00C4B4", bg: "rgba(0,196,180,0.1)", trend: "flat" as const },
    { label: "Investigations", value: myInvestigations.length, icon: FileSearch, color: "#0EA5E9", bg: "rgba(14,165,233,0.1)", trend: "flat" as const },
  ];

  const formatActivityTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const activityIcon = (type: string, action: string) => {
    if (action?.includes("Created")) return Plus;
    if (action?.includes("Termination")) return AlertTriangle;
    if (action?.includes("Investigation")) return FileSearch;
    if (type === "relocation") return MapPin;
    return ActivityIcon;
  };

  const activityColor = (action: string) => {
    if (action?.includes("Termination")) return "#EF4444";
    if (action?.includes("Investigation")) return "#F59E0B";
    if (action?.includes("Created")) return "#22C55E";
    return "#00C4B4";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-up">
      {/* ── HERO CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 40%, #0D2B45 70%, #00C4B4 140%)",
          minHeight: 200,
        }}
      >
        {/* Animated background atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating orbs */}
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-10 w-72 h-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,196,180,0.3) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 15, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,196,180,0.2) 0%, transparent 70%)" }}
          />
          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          {/* Shimmer sweep */}
          <motion.div
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
            className="absolute top-0 bottom-0 w-20"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,196,180,0.08), transparent)" }}
          />
          {/* Animated wave lines */}
          <svg className="absolute bottom-0 left-0 w-full h-32 opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <motion.path
              d="M0,60 C300,120 600,0 900,60 C1050,90 1150,30 1200,60 L1200,120 L0,120 Z"
              fill="rgba(0,196,180,0.15)"
              animate={{ d: ["M0,60 C300,120 600,0 900,60 C1050,90 1150,30 1200,60 L1200,120 L0,120 Z", "M0,80 C300,20 600,100 900,40 C1050,10 1150,70 1200,40 L1200,120 L0,120 Z", "M0,60 C300,120 600,0 900,60 C1050,90 1150,30 1200,60 L1200,120 L0,120 Z"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M0,80 C200,40 500,100 800,50 C1000,20 1100,60 1200,50 L1200,120 L0,120 Z"
              fill="rgba(0,196,180,0.08)"
              animate={{ d: ["M0,80 C200,40 500,100 800,50 C1000,20 1100,60 1200,50 L1200,120 L0,120 Z", "M0,50 C200,90 500,30 800,80 C1000,110 1100,40 1200,70 L1200,120 L0,120 Z", "M0,80 C200,40 500,100 800,50 C1000,20 1100,60 1200,50 L1200,120 L0,120 Z"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 md:p-8">
          {/* Left side */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap className="w-4 h-4" style={{ color: "#00C4B4" }} />
              </motion.div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,196,180,0.8)" }}>
                {tagline}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              {greeting}, {firstName}!
            </h1>
            <p className="text-sm md:text-base max-w-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
              {subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={() => navigate("/submit")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 btn-press"
                style={{ background: "linear-gradient(135deg, #00C4B4 0%, #00E6D4 100%)", boxShadow: "0 4px 16px rgba(0,196,180,0.3)" }}
              >
                <Plus className="w-4 h-4" />
                New Case
              </button>
              <button
                onClick={() => navigate("/relocations/submit")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 btn-press"
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
              >
                <MapPin className="w-4 h-4" />
                New Relocation
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{formattedDate}</p>
                <p className="text-lg font-bold font-mono" style={{ color: "#00C4B4" }}>{formattedTime}</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-glow-pulse" style={{ boxShadow: "0 0 20px rgba(0,196,180,0.4)" }} />
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover relative z-10" style={{ boxShadow: "0 0 0 2px #00C4B4" }} />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white relative z-10" style={{ background: "linear-gradient(135deg, #00C4B4 0%, #0D2B45 100%)", boxShadow: "0 0 0 2px #00C4B4" }}>
                    {initials}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(0,196,180,0.15)", color: "#00C4B4", border: "1px solid rgba(0,196,180,0.3)" }}>
              {user?.jobTitle || "Training Specialist"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="eec-card card-hover-lift relative"
            onClick={() => {
              if (kpi.label === "Critical") navigate("/high-risk");
              if (kpi.label === "Relocations") navigate("/relocation-center");
              if (kpi.label === "Investigations") navigate("/investigations");
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              {kpi.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: kpi.color }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: kpi.color }} />
                </span>
              )}
              {kpi.trend === "up" && kpi.value > 0 && (
                <TrendingUp className="w-3.5 h-3.5" style={{ color: kpi.color }} />
              )}
            </div>
            <div className="text-3xl font-bold" style={{ color: kpi.color }}>
              {loading ? "—" : <CountUp value={kpi.value} duration={600} />}
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── SLA METRICS ROW ── */}
      {slaData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SlaCard label="PS Clearance SLA" value={slaData.psClearanceSla} icon={Target} color="#00C4B4" />
          <SlaCard label="TA Clearance SLA" value={slaData.taClearanceSla} icon={Scale} color="#2563EB" />
          <SlaCard label="Relocation Rate" value={slaData.relocationRate} icon={TrendingUp} color="#22C55E" />
        </div>
      )}

      {/* ── MAIN CONTENT: Cases Table + Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cases (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
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
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }} className="dark-table-header">
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
                          <button onClick={() => navigate("/submit")} className="mt-3 eec-btn-primary">
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
                            className="group hover:bg-gray-50 dark-table-row transition-colors"
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
                                <button onClick={() => navigate(`/update?case=${c.caseNumber}`)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Update">
                                  <RefreshCw className="w-3.5 h-3.5 text-eecblue" />
                                </button>
                                <button onClick={() => navigate(`/timeline?case=${c.caseNumber}`)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Timeline">
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
                <button onClick={() => navigate("/investigations/new")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-teal-50" style={{ color: "#00C4B4" }}>
                  <Plus className="w-3 h-3" /> New Request
                </button>
              </div>
              {myInvestigations.length === 0 ? (
                <div className="py-12 text-center">
                  <FileSearch className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No investigation requests</p>
                  <button onClick={() => navigate("/investigations/new")} className="mt-3 text-sm font-medium px-4 py-2 rounded-xl text-white" style={{ background: "#00C4B4" }}>
                    Request Investigation
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {myInvestigations.map(inv => (
                    <div key={inv.id} className="px-5 py-3 hover:bg-gray-50 dark-table-row transition-colors flex items-center gap-4">
                      <div>
                        <span className="font-mono text-xs font-semibold" style={{ color: "#00C4B4" }}>{inv.investigationNumber}</span>
                        <p className="text-sm font-medium text-navy-900 mt-0.5">{inv.traineeName}</p>
                      </div>
                      <span className="text-xs text-gray-500">{inv.investigationType}</span>
                      <div className="ml-auto flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inv.status === "Open" ? "bg-blue-50 text-blue-600" : inv.status === "In Progress" ? "bg-amber-50 text-amber-600" : inv.status === "Closed" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"}`}>
                          {inv.status}
                        </span>
                        <button onClick={() => navigate(`/investigations/${inv.id}`)} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:bg-teal-50" style={{ color: "#00C4B4" }}>
                          <Eye className="w-3 h-3" />View
                        </button>
                      </div>
                    </div>
                  ))}
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
                      <button key={t} onClick={() => setRelTab(t)} className="text-xs font-medium px-3 py-1.5 transition-all" style={relTab === t ? { background: "#1E3A5F", color: "white" } : { background: "transparent", color: "#64748B" }}>
                        {t === "pending" ? `Pending (${pendingRels.length})` : `All (${relocations.length})`}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => navigate("/relocations/submit")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-50 text-eecblue">
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
              </div>
              {displayRels.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No {relTab === "pending" ? "pending " : ""}relocation requests</p>
                  <button onClick={() => navigate("/relocations/submit")} className="mt-3 text-sm font-medium px-4 py-2 rounded-xl text-white" style={{ background: "#2563EB" }}>
                    Submit Request
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {displayRels.slice(0, 5).map(rel => (
                    <div key={rel.id} className="px-5 py-3 hover:bg-gray-50 dark-table-row transition-colors flex items-center gap-4">
                      <div>
                        <span className="font-mono text-xs font-semibold text-eecblue">{rel.requestId}</span>
                        <p className="text-sm font-medium text-navy-900 mt-0.5">{rel.employeeName}</p>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">{rel.lob}</span>
                      <div className="ml-auto flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rel.status === "Submitted" ? "bg-amber-50 text-amber-600" : rel.status === "PSCleared" ? "bg-blue-50 text-blue-600" : rel.status === "Relocated" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"}`}>
                          {rel.status === "Submitted" ? "Pending PS" : rel.status === "PSCleared" ? "Pending TA" : rel.status}
                        </span>
                        {rel.overdueFlag && (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertTriangle className="w-3 h-3" />Overdue
                          </span>
                        )}
                        <button onClick={() => navigate(`/relocations/${rel.id}`)} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:bg-blue-50 text-eecblue">
                          <Eye className="w-3 h-3" />View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {displayRels.length > 5 && (
                <div className="px-5 py-3 flex justify-center border-t border-gray-100">
                  <button onClick={() => navigate("/relocation-center")} className="text-sm font-semibold text-eecblue flex items-center gap-1 hover:underline">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Activity Feed (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="eec-card sticky top-20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
                <Flame className="w-4 h-4" style={{ color: "#00C4B4" }} />
              </div>
              <h3 className="font-bold text-navy-900">Activity Feed</h3>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,196,180,0.1)", color: "#00C4B4" }}>LIVE</span>
            </div>
            {activities.length === 0 ? (
              <div className="py-8 text-center">
                <ActivityIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                {activities.slice(0, 8).map((act, idx) => {
                  const Icon = activityIcon(act.type, act.action);
                  const color = activityColor(act.action);
                  return (
                    <motion.div
                      key={act.id || idx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark-table-row transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900 truncate">
                          {act.entityName || act.refId}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {act.action?.replace(/([A-Z])/g, " $1").trim() || "Updated"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{act.user?.split("@")[0] || "System"}</span>
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400">{formatActivityTime(act.timestamp)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SLA Card Component ── */
function SlaCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="eec-card card-hover-lift"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}CC, ${color})` }}
        />
      </div>
    </motion.div>
  );
}
