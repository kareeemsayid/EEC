import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAuth } from "../auth/useAuth";
import { fetchCases, fetchAllCases, fetchCasesByAccount, AttritionCase } from "../api/api";
import { KpiData } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import CountUp from "../components/CountUp";
import { formatHours, timeAgo } from "../utils/formatters";
import toast from "react-hot-toast";
import {
  FolderOpen, AlertTriangle, TrendingUp, TrendingDown,
  Eye, LogOut, Plus, RefreshCw, Calendar, Activity,
  ChevronRight, ChevronDown, MapPin, Shield,
  ArrowUpRight, Minus, UserCheck, Building2,
} from "lucide-react";
import { motion } from "framer-motion";

const WEEKLY_TREND = [
  { week: "Wk 1", critical: 1, highRisk: 2, monitoring: 4, resolved: 2 },
  { week: "Wk 2", critical: 2, highRisk: 3, monitoring: 5, resolved: 3 },
  { week: "Wk 3", critical: 1, highRisk: 4, monitoring: 3, resolved: 4 },
  { week: "Wk 4", critical: 3, highRisk: 2, monitoring: 6, resolved: 2 },
  { week: "Wk 5", critical: 2, highRisk: 5, monitoring: 4, resolved: 5 },
  { week: "Wk 6", critical: 1, highRisk: 3, monitoring: 5, resolved: 4 },
];

const PERIOD_OPTIONS = ["Last 6 weeks", "Last 30 days", "Last quarter", "This year"];

export default function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Last 6 weeks");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      if (user.role === "PS" || user.role === "SrManager" || user.role === "TA") {
        setCases(await fetchAllCases());
      } else if (user.role === "Supervisor" || user.role === "Manager") {
        const names = user.supervisorAccounts?.map(a => a.accountName) || [];
        if (names.length > 0) {
          const all = await Promise.all(names.map(n => fetchCasesByAccount(n)));
          setCases(all.flat());
        } else {
          setCases((await fetchCases()).cases);
        }
      } else {
        setCases((await fetchCases()).cases);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const kpi: KpiData = useMemo(() => ({
    activeCases: cases.filter(c => c.caseStatus !== "Closed").length,
    critical: cases.filter(c => c.riskStatus === "Critical" && c.caseStatus !== "Closed").length,
    highRisk: cases.filter(c => c.riskStatus === "High Risk" && c.caseStatus !== "Closed").length,
    monitoring: cases.filter(c => c.riskStatus === "Monitoring" && c.caseStatus !== "Closed").length,
    terminationRecommended: cases.filter(c => c.lifecycleStage === "Termination Recommended").length,
  }), [cases]);

  const activeCases = cases.filter(c => c.caseStatus !== "Closed");
  const resolvedCases = cases.filter(c => c.caseStatus === "Closed").length;
  const relocationRequests = 12;
  const psClearanceSLA = 87;
  const taClearanceSLA = 94;
  const relocationRate = 68;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Main Grid: Hero (65%) + Right Stack (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hero Card - 65% width */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="eec-card-gradient p-6 min-h-[420px] flex flex-col">
            {/* Hero Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Dashboard</span>
                <h1 className="text-2xl font-bold text-white">Overview</h1>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedPeriod}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showPeriodDropdown && (
                  <div className="absolute right-0 mt-1 z-20 w-40 rounded-xl overflow-hidden shadow-dropdown" style={{ background: "white" }}>
                    {PERIOD_OPTIONS.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setSelectedPeriod(p); setShowPeriodDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${p === selectedPeriod ? "bg-navy-800 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative">
              {loading ? (
                <div className="h-full rounded-xl bg-white/5 shimmer-bg" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={WEEKLY_TREND} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                    <ChartTooltip
                      contentStyle={{ borderRadius: 12, border: "none", fontSize: 11, background: "#1E3A5F", color: "white" }}
                      labelStyle={{ color: "white" }}
                    />
                    <Area type="monotone" dataKey="critical" stroke="#EF4444" strokeWidth={2} fill="url(#heroGrad)" />
                    <Area type="monotone" dataKey="highRisk" stroke="#F59E0B" strokeWidth={2} fill="transparent" />
                    <Area type="monotone" dataKey="monitoring" stroke="#22C55E" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bottom Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{loading ? "—" : <CountUp value={cases.length} duration={600} />}</p>
                <p className="text-xs text-white/60 mt-1">Total Cases</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{loading ? "—" : <CountUp value={kpi.critical} duration={600} />}</p>
                <p className="text-xs text-white/60 mt-1">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-400">{loading ? "—" : <CountUp value={resolvedCases} duration={600} />}</p>
                <p className="text-xs text-white/60 mt-1">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack - 35% width */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Relocation Requests Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="eec-card p-5 hover:shadow-card-hover cursor-pointer transition-all group"
            onClick={() => navigate("/relocations")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.1)" }}>
                  <Building2 className="w-5 h-5 text-eecblue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">Relocation Requests</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pending clearance review</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-eecblue">{relocationRequests}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-eecblue transition-colors" />
              </div>
            </div>
          </motion.div>

          {/* Critical Cases Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-5 cursor-pointer transition-all group relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)" }}
            onClick={() => navigate("/high-risk")}
          >
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }} />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Critical Cases</p>
                  <p className="text-xs text-white/70 mt-0.5">Immediate attention</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{loading ? "—" : kpi.critical}</span>
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="eec-card p-5"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/submit")}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-navy-900 hover:text-white text-navy-900"
                style={{ background: "rgba(30,58,95,0.05)" }}
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Submit New Case
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </button>
              <button
                onClick={() => navigate("/my-cases")}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-navy-900 hover:text-white text-gray-700"
                style={{ background: "#f8fafc" }}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  View All Cases
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </button>
              <button
                onClick={loadData}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-navy-900 hover:text-white text-gray-700"
                style={{ background: "#f8fafc" }}
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh Data
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Cases"
          value={kpi.activeCases}
          trend={{ dir: "up", val: "+8%" }}
          icon={FolderOpen}
          color="#2563EB"
          delay={0}
          loading={loading}
        />
        <KpiCard
          label="High Risk"
          value={kpi.highRisk}
          trend={{ dir: "up", val: "+12%" }}
          icon={TrendingUp}
          color="#F59E0B"
          delay={60}
          loading={loading}
          onClick={() => navigate("/high-risk")}
        />
        <KpiCard
          label="Monitoring"
          value={kpi.monitoring}
          trend={{ dir: "down", val: "-3%" }}
          icon={Eye}
          color="#22C55E"
          delay={120}
          loading={loading}
        />
        <KpiCard
          label="Terminations"
          value={kpi.terminationRecommended}
          trend={{ dir: "up", val: "+2" }}
          icon={LogOut}
          color="#7C3AED"
          delay={180}
          loading={loading}
          onClick={() => navigate("/termination")}
        />
      </div>

      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard
          label="PS Clearance SLA"
          value={psClearanceSLA}
          target={90}
          countdown="2h 15m"
          icon={Shield}
          color="#2563EB"
          loading={loading}
        />
        <ProgressCard
          label="TA Clearance SLA"
          value={taClearanceSLA}
          target={95}
          countdown="4h 30m"
          icon={UserCheck}
          color="#22C55E"
          loading={loading}
        />
        <ProgressCard
          label="Relocation Rate"
          value={relocationRate}
          target={75}
          countdown="—"
          icon={MapPin}
          color="#7C3AED"
          loading={loading}
        />
      </div>

      {/* Bottom Row: Recent Activity + Active Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="eec-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-eecblue" />
              <h2 className="font-semibold text-navy-900">Recent Activity</h2>
            </div>
            <span className="text-xs text-gray-400">{activeCases.length} updates</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <EmptyState icon={Activity} title="No activity" message="Updates will appear here" />
          ) : (
            <div className="divide-y divide-gray-50">
              {cases.slice(0, 5).map((c, i) => (
                <div key={c.id} className="px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
                      {c.traineeName?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-900 truncate">{c.traineeName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Case {c.caseNumber} updated</p>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(c.lastUpdatedDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Cases Table */}
        <div className="lg:col-span-2 eec-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-eecblue" />
              <h2 className="font-semibold text-navy-900">Active Cases</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-navy-900">{activeCases.length}</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : activeCases.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No active cases"
              message="Click 'Submit New Case' to open your first case"
              action={{ label: "Submit a case", onClick: () => navigate("/submit") }}
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {activeCases.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
                  onClick={() => navigate(`/timeline?case=${c.caseNumber}`)}
                >
                  <span className="font-mono text-xs font-semibold w-24 shrink-0 text-eecblue">{c.caseNumber}</span>
                  <span className="flex-1 text-sm font-medium text-navy-900 truncate">{c.traineeName}</span>
                  <span className="hidden sm:block"><RiskBadge risk={c.riskStatus} size="sm" showTooltip={false} /></span>
                  <span className="hidden md:block"><StageBadge stage={c.lifecycleStage} size="sm" /></span>
                  <span className="font-mono text-xs text-gray-500 w-14 text-right shrink-0">{formatHours(c.totalMissedHours)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          )}
          {activeCases.length > 6 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => navigate("/my-cases")}
                className="w-full text-center text-sm font-semibold text-eecblue flex items-center justify-center gap-1 hover:underline"
              >
                View all {activeCases.length} cases <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  color,
  delay,
  loading,
  onClick,
}: {
  label: string;
  value: number;
  trend: { dir: string; val: string };
  icon: React.ElementType;
  color: string;
  delay: number;
  loading: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
      className={`eec-card ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderColor: hovered ? `${color}30` : undefined,
        boxShadow: hovered ? `0 8px 24px ${color}15` : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            trend.dir === "up"
              ? "bg-red-50 text-red-600"
              : trend.dir === "down"
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {trend.dir === "up" ? (
            <TrendingUp className="w-2.5 h-2.5" />
          ) : trend.dir === "down" ? (
            <TrendingDown className="w-2.5 h-2.5" />
          ) : (
            <Minus className="w-2.5 h-2.5" />
          )}
          {trend.val}
        </span>
      </div>
      <div className="text-3xl font-bold text-navy-900 mb-1" style={{ color: hovered ? color : undefined }}>
        {loading ? "—" : <CountUp value={value} duration={600} />}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    </motion.div>
  );
}

function ProgressCard({
  label,
  value,
  target,
  countdown,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  target: number;
  countdown: string;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  const progress = Math.min(100, (value / target) * 100);
  const isOnTrack = value >= target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="eec-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}12` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <p className="text-sm font-semibold text-navy-900">{label}</p>
        </div>
        {countdown !== "—" && (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: `${color}12`, color }}>
            {countdown} left
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: isOnTrack ? color : "#F59E0B" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-navy-900">
          {loading ? "—" : <>{value}<span className="text-sm font-normal text-gray-400">%</span></>}
        </div>
        <span className={`text-xs font-medium ${isOnTrack ? "text-green-600" : "text-amber-600"}`}>
          Target: {target}%
        </span>
      </div>
    </motion.div>
  );
}
