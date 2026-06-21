import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { KpiSkeleton, CaseCardSkeleton, ActivitySkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import Tooltip from "../components/Tooltip";
import CountUp from "../components/CountUp";
import Sparkline from "../components/Sparkline";
import InsightStrip from "../components/InsightStrip";
import { formatDate, formatHours, timeAgo } from "../utils/formatters";
import toast from "react-hot-toast";
import { FolderOpen, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, Eye, LogOut, Plus, RefreshCw, FileText, Clock, Calendar, Activity, CircleHelp as HelpCircle, ChevronRight, MoveHorizontal as MoreHorizontal, Minus, Sparkles } from "lucide-react";

const TIME_RANGES = ["Today", "This Week", "This Month"] as const;
type TimeRange = typeof TIME_RANGES[number];

const WEEKLY_TREND = [
  { week: "Wk 1", critical: 1, highRisk: 2, monitoring: 4, total: 7 },
  { week: "Wk 2", critical: 2, highRisk: 3, monitoring: 5, total: 10 },
  { week: "Wk 3", critical: 1, highRisk: 4, monitoring: 3, total: 8 },
  { week: "Wk 4", critical: 3, highRisk: 2, monitoring: 6, total: 11 },
  { week: "Wk 5", critical: 2, highRisk: 5, monitoring: 4, total: 11 },
  { week: "Wk 6", critical: 1, highRisk: 3, monitoring: 5, total: 9 },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasShownCriticalToast = useRef(false);

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("This Week");
  const [showInsight, setShowInsight] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setSyncing(true);
    setLoading(true);
    setError(null);
    try {
      // Role-based case fetching
      if (user.role === 'PS' || user.role === 'SrManager') {
        const casesData = await fetchAllCases();
        setCases(casesData);
      } else if (user.role === 'Supervisor' || user.role === 'Manager') {
        // Fetch cases for supervisor's accounts
        const accountIds = user.supervisorAccounts?.map(a => a.accountId) || [];
        if (accountIds.length > 0) {
          const allCases = await Promise.all(
            accountIds.map(id => fetchCasesByAccount(id))
          );
          setCases(allCases.flat());
        } else {
          // Fallback to own cases
          const casesData = await fetchCases(user.email);
          setCases(casesData);
        }
      } else {
        // Trainer - own cases
        const casesData = await fetchCases(user.email);
        setCases(casesData);
      }
      setLastSync(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setTimeout(() => setSyncing(false), 600);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  useEffect(() => {
    if (!loading && !hasShownCriticalToast.current) {
      const criticalCases = cases.filter(c => c.riskStatus === "Critical" && c.caseStatus !== "Closed");
      if (criticalCases.length > 0) {
        toast.error(`${criticalCases.length} critical case${criticalCases.length > 1 ? "s" : ""} require attention`, { duration: 6000 });
        hasShownCriticalToast.current = true;
      }
    }
  }, [loading, cases]);

  const kpi: KpiData = useMemo(() => ({
    activeCases: cases.filter((c) => c.caseStatus !== "Closed").length,
    critical: cases.filter((c) => c.riskStatus === "Critical" && c.caseStatus !== "Closed").length,
    highRisk: cases.filter((c) => c.riskStatus === "High Risk" && c.caseStatus !== "Closed").length,
    monitoring: cases.filter((c) => c.riskStatus === "Monitoring" && c.caseStatus !== "Closed").length,
    terminationRecommended: cases.filter((c) => c.lifecycleStage === "Termination Recommended").length,
  }), [cases]);

  const activeCases = cases.filter((c) => c.caseStatus !== "Closed");
  const hasCriticalAlert = kpi.critical > 0;

  // SLA compliance gauge value
  const resolvedCases = cases.filter((c) => c.caseStatus === "Closed").length;
  const slaCompliance = cases.length > 0 ? Math.round((resolvedCases / Math.max(cases.length, 1)) * 100) : 0;

  const insightMessage = useMemo(() => {
    if (loading) return "";
    if (kpi.critical > 0) {
      const acctCount = new Set(cases.filter(c => c.riskStatus === "Critical").map(c => c.account));
      return `Critical cases are active across ${acctCount.size} account${acctCount.size !== 1 ? "s" : ""} — ${kpi.critical} past the 16h threshold. Escalation recommended.`;
    }
    if (kpi.highRisk > 0) {
      return `${kpi.highRisk} case${kpi.highRisk !== 1 ? "s" : ""} approaching the critical threshold. Proactive coaching advised this ${timeRange.toLowerCase()}.`;
    }
    if (kpi.activeCases === 0) {
      return "No active attrition cases right now. All clear.";
    }
    return `${kpi.activeCases} active cases under monitoring. No escalations needed this ${timeRange.toLowerCase()}.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, kpi, cases, timeRange]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ===== Header ===== */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Dashboard</span>
              <StatusDot lastSync={lastSync} syncing={syncing} onRefresh={loadData} />
            </div>
            <h1 className="font-barlow-condensed text-3xl md:text-4xl font-bold text-navy-900 tracking-wide">
              {getGreeting()}, <span className="text-gradient">{user?.firstName || user?.displayName?.split(" ")[0] || "Team Member"}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-500" />
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{activeCases.length} active cases</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time-range pill group */}
          <div className="inline-flex bg-gray-100 rounded-xl p-0.5 border border-gray-200">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  timeRange === range
                    ? "bg-navy-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-navy-800"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Tooltip content="Create a new attrition case" position="bottom">
            <button
              onClick={() => navigate("/submit")}
              className="bg-gradient-teal hover:shadow-glow-teal text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Submit Case
            </button>
          </Tooltip>
          <Tooltip content="Update an existing case" position="bottom">
            <button
              onClick={() => navigate("/update")}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Update Case
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ===== Insight Strip ===== */}
      {showInsight && !loading && insightMessage && (
        <InsightStrip message={insightMessage} onDismiss={() => setShowInsight(false)} />
      )}

      {/* ===== Critical alert ===== */}
      {hasCriticalAlert && (
        <div className="relative overflow-hidden rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="flex-1 text-sm text-red-800 font-medium">
            {kpi.critical} critical case{kpi.critical !== 1 ? "s" : ""} require immediate attention
          </p>
          <button
            onClick={() => navigate("/high-risk")}
            className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            View All
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ===== KPI Row ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Active Cases"
              value={kpi.activeCases}
              total={cases.length}
              tone="teal"
              icon={<FolderOpen className="w-5 h-5" />}
              tooltip="All open cases currently tracked"
              sparkData={[3, 5, 4, 7, 6, 8, kpi.activeCases]}
              trend={{ direction: "up", value: "+8%" }}
              delay={0}
            />
            <KpiCard
              label="Critical"
              value={kpi.critical}
              total={kpi.activeCases}
              tone="red"
              icon={<AlertTriangle className="w-5 h-5" />}
              pulse={kpi.critical > 0}
              tooltip="16+ missed hours — urgent intervention"
              sparkData={[1, 2, 1, 3, 2, 3, kpi.critical]}
              trend={{ direction: kpi.critical > 1 ? "up" : "down", value: `${kpi.critical > 0 ? "+12%" : "0%"}` }}
              onClick={() => navigate("/high-risk")}
              delay={60}
            />
            <KpiCard
              label="High Risk"
              value={kpi.highRisk}
              total={kpi.activeCases}
              tone="amber"
              icon={<TrendingUp className="w-5 h-5" />}
              tooltip="8–15.99 missed hours — coaching plan needed"
              sparkData={[2, 3, 4, 2, 5, 4, kpi.highRisk]}
              trend={{ direction: "up", value: "+5%" }}
              delay={120}
            />
            <KpiCard
              label="Monitoring"
              value={kpi.monitoring}
              total={kpi.activeCases}
              tone="green"
              icon={<Eye className="w-5 h-5" />}
              tooltip="Under 8 missed hours — observation phase"
              sparkData={[5, 5, 3, 6, 4, 5, kpi.monitoring]}
              trend={{ direction: "down", value: "-3%" }}
              delay={180}
            />
            <KpiCard
              label="Termination"
              value={kpi.terminationRecommended}
              total={kpi.activeCases}
              tone="purple"
              icon={<LogOut className="w-5 h-5" />}
              tooltip="Approved for termination processing"
              sparkData={[0, 1, 1, 2, 1, 2, kpi.terminationRecommended]}
              trend={{ direction: "up", value: "+2%" }}
              onClick={() => navigate("/termination")}
              delay={240}
            />
          </>
        )}
      </div>

      {/* ===== Main analytics row (chart + gauge) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-barlow-condensed font-semibold text-lg text-navy-900 tracking-wide">
                Case Risk Trend
              </h2>
              <p className="text-xs text-gray-400">Weekly distribution by risk severity</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Legend color="bg-red-500" label="Critical" />
              <Legend color="bg-amber-500" label="High" />
              <Legend color="bg-teal-500" label="Monitoring" />
            </div>
          </div>
          {loading ? (
            <div className="h-64 shimmer-bg rounded-xl opacity-50" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={WEEKLY_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-critical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-high" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-monitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA89B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0EA89B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <ChartTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px -6px rgba(0,61,92,0.15)", fontSize: 12 }}
                  labelStyle={{ color: "#003D5C", fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="monitoring" stroke="#0EA89B" strokeWidth={2} fill="url(#g-monitor)" animationDuration={800} />
                <Area type="monotone" dataKey="highRisk" stroke="#F59E0B" strokeWidth={2} fill="url(#g-high)" animationDuration={1000} />
                <Area type="monotone" dataKey="critical" stroke="#EF4444" strokeWidth={2} fill="url(#g-critical)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* SLA compliance gauge */}
        <div className="glass-card rounded-2xl p-5 hover-lift flex flex-col">
          <div className="mb-4">
            <h2 className="font-barlow-condensed font-semibold text-lg text-navy-900 tracking-wide">
              SLA Compliance
            </h2>
            <p className="text-xs text-gray-400">Resolved vs total cases</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <RadialGauge value={slaCompliance} loading={loading} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-center">
            <div className="rounded-lg bg-canvas py-2">
              <p className="font-mono text-lg font-bold text-navy-900">{resolvedCases}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Resolved</p>
            </div>
            <div className="rounded-lg bg-canvas py-2">
              <p className="font-mono text-lg font-bold text-navy-900">{cases.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Lower row: Recent Activity + Cases table ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="glass-card rounded-2xl overflow-hidden hover-lift">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-barlow-condensed font-semibold text-lg text-navy-900 tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              Recent Activity
            </h2>
          </div>
          <div>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <ActivitySkeleton key={i} />)
            ) : cases.length === 0 ? (
              <EmptyState icon={Activity} title="No recent activity" message="Case updates will appear here." />
            ) : (
              cases.slice(0, 5).map((c, idx) => (
                <div
                  key={c.id}
                  className="px-5 py-3 hover:bg-canvas transition-colors border-b border-gray-50 last:border-b-0 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-navy-900">{c.traineeName}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{c.caseNumber}</p>
                    </div>
                    <span className="text-[11px] text-teal-600 whitespace-nowrap font-medium">{timeAgo(c.lastUpdatedDate)}</span>
                  </div>
                  {c.notes && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{c.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cases table */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden hover-lift">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-barlow-condensed font-semibold text-lg text-navy-900 tracking-wide flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-teal-600" />
              My Active Cases
            </h2>
            <span className="text-xs bg-navy-900 text-white px-2.5 py-1 rounded-full font-mono font-bold">
              {activeCases.length}
            </span>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CaseCardSkeleton key={i} />)
          ) : activeCases.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No active cases"
              message="Click 'Submit Case' to create your first case."
              action={{ label: "Submit a case", onClick: () => navigate("/submit") }}
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {activeCases.slice(0, 6).map((c, idx) => (
                <React.Fragment key={c.id}>
                  <div
                    className="px-5 py-3 hover:bg-canvas cursor-pointer transition-colors group animate-fade-in-up"
                    onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-teal-600 w-24 shrink-0 font-bold">
                        {c.caseNumber}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                        {c.traineeName}
                      </span>
                      <RiskBadge risk={c.riskStatus} size="sm" showTooltip={false} />
                      <StageBadge stage={c.lifecycleStage} size="sm" />
                      <span className="font-mono text-xs text-gray-600 w-16 text-right shrink-0 font-bold">
                        {formatHours(c.totalMissedHours)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/update?case=${c.caseNumber}`); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  {expandedCase === c.id && (
                    <div className="px-5 py-4 bg-canvas border-t border-teal-100 animate-slide-down">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm mb-3">
                        <Field label="Oracle ID" value={c.oracleId} mono />
                        <Field label="Account" value={c.account} />
                        <Field label="LOB" value={c.lob} />
                        <Field label="Site" value={c.site} />
                        <Field label="Incident Date" value={formatDate(c.incidentDate)} icon={<Calendar className="w-3 h-3" />} />
                        <Field label="Category" value={c.attritionCategory} />
                        <Field label="Sub-Reason" value={c.subReason} />
                        <Field label="Severity" value={c.severityLevel} />
                      </div>
                      {c.notes && (
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 mb-3">
                          <p className="text-xs text-gray-600">{c.notes}</p>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/update?case=${c.caseNumber}`); }}
                          className="bg-gradient-teal hover:opacity-90 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Update
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/timeline?case=${c.caseNumber}`); }}
                          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          Timeline
                        </button>
                        {c.escalationRequired && (
                          <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            Escalation Required
                          </span>
                        )}
                        {c.documentationRequired && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium border border-amber-200">
                            <FileText className="w-3 h-3" />
                            Docs Required
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          {activeCases.length > 6 && (
            <div className="px-5 py-3 bg-canvas border-t border-gray-100">
              <button
                onClick={() => navigate("/my-cases")}
                className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1"
              >
                View all {activeCases.length} cases
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating help button */}
      <Tooltip content="Help & keyboard shortcuts (?)" position="left">
        <button
          onClick={() => navigate("/help")}
          className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-teal hover:shadow-glow-teal-lg text-white rounded-full shadow-glow-teal flex items-center justify-center transition-all hover:scale-110 z-40"
          aria-label="Help"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </Tooltip>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatusDot({
  lastSync,
  syncing,
  onRefresh,
}: {
  lastSync: Date;
  syncing: boolean;
  onRefresh: () => void;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1.5" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${syncing ? "bg-teal-400 animate-ping" : "bg-teal-500"}`} />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
      </span>
      <span className="text-[10px] text-gray-400">Live</span>
      <button onClick={onRefresh} className="text-gray-400 hover:text-teal-600 transition-colors" aria-label="Refresh">
        <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
      </button>
      {showTip && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-navy-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-glass-lg whitespace-nowrap animate-fade-in">
          Last synced {timeAgo(lastSync.toISOString())}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  total,
  tone,
  icon,
  pulse,
  onClick,
  tooltip,
  sparkData,
  trend,
  delay = 0,
}: {
  label: string;
  value: number;
  total?: number;
  tone: "teal" | "red" | "amber" | "green" | "purple";
  icon: React.ReactNode;
  pulse?: boolean;
  onClick?: () => void;
  tooltip: string;
  sparkData: number[];
  trend?: { direction: string; value: string };
  delay?: number;
}) {
  const toneMap = {
    teal: { chip: "bg-teal-50 text-teal-600 border-teal-100", bar: "from-teal-500 to-teal-400" },
    red: { chip: "bg-red-50 text-red-600 border-red-100", bar: "from-red-500 to-red-400" },
    amber: { chip: "bg-amber-50 text-amber-600 border-amber-100", bar: "from-amber-500 to-amber-400" },
    green: { chip: "bg-green-50 text-green-600 border-green-100", bar: "from-green-500 to-green-400" },
    purple: { chip: "bg-purple-50 text-purple-600 border-purple-100", bar: "from-purple-500 to-purple-400" },
  };

  const percentage = total && total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Tooltip content={tooltip} position="bottom">
      <div
        className={`glass-card rounded-2xl p-5 animate-fade-in-up hover-lift relative overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
        onClick={onClick}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${toneMap[tone].chip}`}>
            {icon}
          </div>
          <button className="text-gray-300 hover:text-gray-500 transition-colors" aria-label="More options">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-end gap-3 mb-1">
          <CountUp
            value={value}
            duration={400}
            className={`font-barlow-condensed font-bold text-4xl leading-none ${pulse && value > 0 ? "text-red-600" : "text-navy-900"}`}
          />
          {trend && (
            <span className={`flex items-center gap-0.5 text-[11px] font-semibold mb-1 ${
              trend.direction === "up" ? "text-red-600" : trend.direction === "down" ? "text-teal-600" : "text-gray-400"
            }`}>
              {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> : trend.direction === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trend.value}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">{label}</span>
          <Sparkline data={sparkData} width={56} height={20} />
        </div>

        {total !== undefined && total > 0 && (
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${toneMap[tone].bar} rounded-full transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}

        {pulse && value > 0 && (
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        )}
      </div>
    </Tooltip>
  );
}

function RadialGauge({ value, loading }: { value: number; loading: boolean }) {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [animatedValue, setAnimatedValue] = useState(reduce ? value : 0);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(t);
  }, [value, loading]);

  const radius = 72;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="relative w-44 h-44">
      <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#003D5C" />
            <stop offset="100%" stopColor="#25E2CC" />
          </linearGradient>
        </defs>
        <circle cx="88" cy="88" r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp
          value={loading ? 0 : value}
          duration={800}
          suffix="%"
          className="font-barlow-condensed font-bold text-3xl text-navy-900"
        />
        <span className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">compliance</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

function Field({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1 font-medium">
        {icon}
        {label}
      </span>
      <p className={`text-sm text-gray-800 mt-0.5 ${mono ? "font-mono" : "font-medium"}`}>{value || "—"}</p>
    </div>
  );
}
