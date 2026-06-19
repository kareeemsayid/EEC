import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { useAuth } from "../auth/useAuth";
import { fetchAttritionCases, fetchCaseUpdates } from "../api/sharepoint";
import { AttritionCase, CaseUpdate, KpiData } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import ErrorBanner from "../components/ErrorBanner";
import { KpiSkeleton, CaseCardSkeleton, ActivitySkeleton } from "../components/Skeleton";
import Tooltip from "../components/Tooltip";
import { formatDate, formatHours, timeAgo } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import toast from "react-hot-toast";
import {
  FolderOpen,
  AlertTriangle,
  TrendingUp,
  Eye,
  LogOut,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Calendar,
  Activity,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const WEEKLY_TREND = [
  { week: "Wk 1", critical: 1, highRisk: 2, monitoring: 4, total: 7 },
  { week: "Wk 2", critical: 2, highRisk: 3, monitoring: 5, total: 10 },
  { week: "Wk 3", critical: 1, highRisk: 4, monitoring: 3, total: 8 },
  { week: "Wk 4", critical: 3, highRisk: 2, monitoring: 6, total: 11 },
  { week: "Wk 5", critical: 2, highRisk: 5, monitoring: 4, total: 11 },
];

const PIE_COLORS = ["#0d9488", "#f59e0b", "#ef4444", "#3b82f6"];

export default function HomeScreen() {
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const hasShownCriticalToast = useRef(false);

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [updates, setUpdates] = useState<CaseUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const [casesData, updatesData] = await Promise.all([
        fetchAttritionCases(token, user?.email),
        fetchCaseUpdates(token),
      ]);
      setCases(casesData);
      setUpdates(updatesData.slice(0, 5));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, user?.email]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  useEffect(() => {
    if (!loading && !hasShownCriticalToast.current) {
      const criticalCases = cases.filter(c => c.riskStatus === "Critical" && c.caseStatus !== "Closed");
      if (criticalCases.length > 0) {
        toast.error(`${criticalCases.length} critical case${criticalCases.length > 1 ? "s" : ""} require${criticalCases.length === 1 ? "s" : ""} immediate attention`, {
          duration: 6000,
          icon: "⚠️",
        });
        hasShownCriticalToast.current = true;
      }
    }
  }, [loading, cases]);

  const kpi: KpiData = {
    activeCases: cases.filter((c) => c.caseStatus !== "Closed").length,
    critical: cases.filter((c) => c.riskStatus === "Critical" && c.caseStatus !== "Closed").length,
    highRisk: cases.filter((c) => c.riskStatus === "High Risk" && c.caseStatus !== "Closed").length,
    monitoring: cases.filter((c) => c.riskStatus === "Monitoring" && c.caseStatus !== "Closed").length,
    terminationRecommended: cases.filter((c) => c.lifecycleStage === "Termination Recommended").length,
  };

  const activeCases = cases.filter((c) => c.caseStatus !== "Closed");
  const hasCriticalAlert = kpi.critical > 0;

  const pieData = [
    { name: "Monitoring", value: kpi.monitoring, color: PIE_COLORS[0] },
    { name: "High Risk", value: kpi.highRisk, color: PIE_COLORS[1] },
    { name: "Critical", value: kpi.critical, color: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  // Generate trend indicators (mock - in real app would compare to previous period)
  const getTrend = (current: number) => {
    if (current === 0) return { direction: "neutral", value: "0%" };
    const trend = Math.random() > 0.5 ? "up" : "down";
    const value = Math.floor(Math.random() * 15) + 1;
    return { direction: trend, value: `${value}%` };
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-6 animate-fade-in">
        {/* Header with elegant gradient card */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-glass-sm relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-teal opacity-5 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-400 opacity-10 rounded-full blur-xl" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-teal-500 animate-pulse-slow" />
                <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Dashboard</span>
              </div>
              <h1 className="font-barlow-condensed text-3xl md:text-4xl font-bold text-gray-900 tracking-wide">
                {getGreeting()}, <span className="text-gradient">{user?.firstName || user?.displayName?.split(" ")[0] || "Team Member"}</span>
              </h1>
              <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-500" />
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Tooltip content="Create a new attrition case record" position="bottom">
              <button
                onClick={() => navigate("/submit")}
                className="bg-gradient-teal hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-glow-teal hover:shadow-glow-teal-lg flex items-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Submit Case
              </button>
            </Tooltip>
            <Tooltip content="Update an existing case with new information" position="bottom">
              <button
                onClick={() => navigate("/update")}
                className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-white/30 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Update Case
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Critical Alert banner with enhanced design */}
        {hasCriticalAlert && (
          <div className="glass-card bg-gradient-to-r from-red-500/10 to-red-600/5 backdrop-blur-xl border border-red-300/30 rounded-xl px-5 py-4 flex items-center gap-4 animate-slide-up shadow-glass-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent" />
            <div className="relative flex items-center gap-4 w-full">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center animate-pulse-slow shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-700 font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 animate-pulse" />
                  {kpi.critical} critical case{kpi.critical !== 1 ? "s" : ""} require immediate attention
                </p>
                <p className="text-xs text-red-600/70 mt-0.5">Click to view all critical cases in detail</p>
              </div>
              <button
                onClick={() => navigate("/high-risk")}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5 font-medium"
              >
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Enhanced KPI Cards with glass-morphism and animations */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                label="Active Cases"
                value={kpi.activeCases}
                tone="teal"
                icon={<FolderOpen className="w-5 h-5" />}
                tooltip="All open cases currently assigned to you"
                trend={getTrend(kpi.activeCases)}
                delay={0}
              />
              <KpiCard
                label="Critical"
                value={kpi.critical}
                tone="red"
                icon={<AlertTriangle className="w-5 h-5" />}
                pulse={kpi.critical > 0}
                tooltip="Cases requiring urgent intervention within 8-16 hour threshold"
                trend={getTrend(kpi.critical)}
                onClick={() => navigate("/high-risk")}
                delay={100}
              />
              <KpiCard
                label="High Risk"
                value={kpi.highRisk}
                tone="amber"
                icon={<TrendingUp className="w-5 h-5" />}
                tooltip="Cases trending toward critical status (approaching threshold)"
                trend={getTrend(kpi.highRisk)}
                delay={200}
              />
              <KpiCard
                label="Monitoring"
                value={kpi.monitoring}
                tone="blue"
                icon={<Eye className="w-5 h-5" />}
                tooltip="Cases under active observation with low missed hours"
                trend={getTrend(kpi.monitoring)}
                delay={300}
              />
              <KpiCard
                label="Termination"
                value={kpi.terminationRecommended}
                tone="navy"
                icon={<LogOut className="w-5 h-5" />}
                tooltip="Cases approved for termination processing"
                trend={getTrend(kpi.terminationRecommended)}
                onClick={() => navigate("/termination")}
                delay={400}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Cases Table with enhanced design */}
          <div className="lg:col-span-2">
            <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white/50 to-transparent">
                <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-teal-600" />
                  </div>
                  MY ACTIVE CASES
                </h2>
                <span className="text-xs bg-gradient-teal text-white px-3 py-1 rounded-full font-mono font-bold shadow-glow-teal">
                  {activeCases.length}
                </span>
              </div>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <CaseCardSkeleton key={i} />)
              ) : activeCases.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-teal-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No active cases found</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Submit Case" to create your first case</p>
                  <button
                    onClick={() => navigate("/submit")}
                    className="mt-4 bg-gradient-teal hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-glow-teal"
                  >
                    Submit a case
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeCases.slice(0, 5).map((c, idx) => (
                    <React.Fragment key={c.id}>
                      <div
                        className="px-5 py-3.5 hover:bg-teal-50/50 cursor-pointer transition-all group animate-fade-in-up"
                        onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-teal-600 w-24 shrink-0 group-hover:text-teal-700 transition-colors font-bold">
                            {c.caseNumber}
                          </span>
                          <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                            {c.traineeName}
                          </span>
                          <RiskBadge risk={c.riskStatus} size="sm" />
                          <StageBadge stage={c.lifecycleStage} size="sm" />
                          <span className="font-mono text-xs text-gray-500 w-16 text-right shrink-0 font-bold">
                            {formatHours(c.totalMissedHours)}
                          </span>
                          {expandedCase === c.id ? (
                            <ChevronUp className="w-4 h-4 text-teal-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
                          )}
                        </div>
                      </div>
                      {expandedCase === c.id && (
                        <div className="px-5 py-4 bg-gradient-to-r from-teal-50/80 via-cyan-50/40 to-white border-t border-teal-100 animate-slide-down">
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
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-teal-100 mb-3 shadow-sm">
                              <p className="text-xs text-gray-600">{c.notes}</p>
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Tooltip content="Update this case with new information" position="top">
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/update?case=${c.caseNumber}`); }}
                                className="bg-gradient-teal hover:opacity-90 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Update
                              </button>
                            </Tooltip>
                            <Tooltip content="View full case history and timeline" position="top">
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/timeline?case=${c.caseNumber}`); }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Clock className="w-3 h-3" />
                                Timeline
                              </button>
                            </Tooltip>
                            {c.escalationRequired && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Escalation Required
                              </span>
                            )}
                            {c.documentationRequired && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
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
              {activeCases.length > 5 && (
                <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                  <Tooltip content="View all your cases" position="top">
                    <button
                      onClick={() => navigate("/my-cases")}
                      className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1"
                    >
                      View all {activeCases.length} cases
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Risk Distribution Pie with enhanced styling */}
            {!loading && pieData.length > 0 && (
              <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-5">
                <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-teal-600" />
                  </div>
                  RISK DISTRIBUTION
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(value: number) => [`${value} cases`, ""]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600 font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity with enhanced design */}
            <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white/50 to-transparent">
                <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  RECENT ACTIVITY
                </h2>
              </div>
              <div>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ActivitySkeleton key={i} />)
                ) : updates.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No recent activity</p>
                  </div>
                ) : (
                  updates.map((u, idx) => (
                    <div
                      key={u.id}
                      className="px-5 py-3 hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-b-0 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{u.updateType}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{u.caseNumber}</p>
                        </div>
                        <span className="text-xs text-teal-600 whitespace-nowrap font-medium">{timeAgo(u.updateDate)}</span>
                      </div>
                      {u.updateNotes && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{u.updateNotes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-5">
              <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                WEEKLY TRENDS
              </h2>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={WEEKLY_TREND} barSize={12} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <ChartTooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    cursor={{ fill: "#f9fafb" }}
                  />
                  <Bar dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} name="Critical" />
                  <Bar dataKey="highRisk" fill="#f59e0b" radius={[4, 4, 0, 0]} name="High Risk" />
                  <Bar dataKey="monitoring" fill="#0d9488" radius={[4, 4, 0, 0]} name="Monitoring" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Help Button */}
        <Tooltip content="Need help? Click for support resources" position="left">
          <button className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-teal hover:opacity-90 text-white rounded-full shadow-glow-teal-lg flex items-center justify-center transition-all hover:scale-110 z-50">
            <HelpCircle className="w-6 h-6" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function KpiCard({
  label,
  value,
  tone,
  icon,
  pulse,
  onClick,
  tooltip,
  trend,
  delay = 0,
}: {
  label: string;
  value: number;
  tone: "teal" | "red" | "amber" | "blue" | "navy";
  icon: React.ReactNode;
  pulse?: boolean;
  onClick?: () => void;
  tooltip: string;
  trend?: { direction: string; value: string };
  delay?: number;
}) {
  const toneMap = {
    teal: { bg: "from-teal-50 to-teal-100/50", icon: "text-teal-600", border: "border-teal-200/50", glow: "hover:shadow-[0_0_20px_rgba(13,148,136,0.2)]" },
    red: { bg: "from-red-50 to-red-100/50", icon: "text-red-600", border: "border-red-200/50", glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]" },
    amber: { bg: "from-amber-50 to-amber-100/50", icon: "text-amber-600", border: "border-amber-200/50", glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]" },
    blue: { bg: "from-blue-50 to-blue-100/50", icon: "text-blue-600", border: "border-blue-200/50", glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]" },
    navy: { bg: "from-slate-100 to-slate-200/50", icon: "text-slate-700", border: "border-slate-200/50", glow: "hover:shadow-[0_0_20px_rgba(51,65,85,0.2)]" },
  };

  const content = (
    <div
      className={`glass-card bg-white/90 backdrop-blur-xl border ${toneMap[tone].border} rounded-2xl p-5 shadow-glass-sm transition-all duration-300 animate-fade-in-up ${toneMap[tone].glow} ${
        onClick ? "cursor-pointer hover:scale-[1.02]" : ""
      }`}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${toneMap[tone].bg} shadow-sm`}>
          <span className={toneMap[tone].icon}>{icon}</span>
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`flex items-center gap-0.5 text-xs ${
              trend.direction === "up" ? "text-red-500" : trend.direction === "down" ? "text-green-500" : "text-gray-400"
            }`}>
              {trend.direction === "up" ? <ArrowUpRight className="w-3 h-3" /> : trend.direction === "down" ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trend.value}
            </span>
          )}
          {value > 0 && tone === "red" && (
            <div className={`w-2.5 h-2.5 rounded-full bg-red-500 ${pulse ? "animate-pulse" : ""} shadow-[0_0_8px_rgba(239,68,68,0.5)]`} />
          )}
        </div>
      </div>
      <div className={`text-4xl font-barlow-condensed font-bold leading-none ${pulse && value > 0 ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-2 font-medium">{label}</div>

      {/* Subtle decorative element */}
      <div className={`absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br ${toneMap[tone].bg} rounded-tl-[100%] opacity-30`} />
    </div>
  );

  return <Tooltip content={tooltip} position="bottom">{content}</Tooltip>;
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
