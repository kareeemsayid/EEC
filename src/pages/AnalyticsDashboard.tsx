import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllCases, AttritionCase } from "../api/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import TooltipComp from "../components/Tooltip";
import { formatDate } from "../utils/formatters";
import toast from "react-hot-toast";
import {
  BarChart3, TrendingUp, Clock, TriangleAlert as AlertTriangle,
  RefreshCw, Download, MapPin, FileText, Target, Zap,
  Activity, ArrowUpRight, ArrowDownRight, Minus, ChevronRight,
  LayoutDashboard, PieChart as PieChartIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = {
  teal: "#0d9488",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  navy: "#003d5c",
};

const STATUS_COLORS = {
  "Active": COLORS.blue,
  "Closed": COLORS.navy,
};

type TimeRange = "7d" | "30d" | "90d" | "year";
type ViewMode = "overview" | "trends" | "breakdown";

export default function AnalyticsDashboard() {
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const casesData = await fetchAllCases();
      setCases(casesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter cases by time range
  const filteredCases = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    switch (timeRange) {
      case "7d": cutoff.setDate(now.getDate() - 7); break;
      case "30d": cutoff.setDate(now.getDate() - 30); break;
      case "90d": cutoff.setDate(now.getDate() - 90); break;
      case "year": cutoff.setFullYear(now.getFullYear() - 1); break;
    }
    return cases.filter(c => new Date(c.caseOpenedDate) >= cutoff);
  }, [cases, timeRange]);

  // Computed metrics
  const metrics = useMemo(() => {
    const total = filteredCases.length;
    const active = filteredCases.filter(c => c.caseStatus === "Active").length;
    const resolved = filteredCases.filter(c => c.caseStatus === "Closed").length;
    const critical = filteredCases.filter(c => c.riskStatus === "Critical").length;
    const highRisk = filteredCases.filter(c => c.riskStatus === "High Risk").length;
    const monitoring = filteredCases.filter(c => c.riskStatus === "Monitoring").length;
    const avgHours = total > 0 ? filteredCases.reduce((sum, c) => sum + (c.totalMissedHours || 0), 0) / total : 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Trend calculation (compare with previous period)
    const prevCutoff = new Date();
    switch (timeRange) {
      case "7d": prevCutoff.setDate(prevCutoff.getDate() - 14); break;
      case "30d": prevCutoff.setDate(prevCutoff.getDate() - 60); break;
      case "90d": prevCutoff.setDate(prevCutoff.getDate() - 180); break;
      case "year": prevCutoff.setFullYear(prevCutoff.getFullYear() - 2); break;
    }
    const prevCases = cases.filter(c => {
      const d = new Date(c.caseOpenedDate);
      return d >= prevCutoff && d < new Date(Date.now() - (timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365) * 24 * 60 * 60 * 1000);
    });
    const prevTotal = prevCases.length;
    const trend = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

    return { total, active, resolved, critical, highRisk, monitoring, avgHours, resolutionRate, trend };
  }, [filteredCases, cases, timeRange]);

  // Risk distribution for pie chart
  const riskDistribution = useMemo(() => [
    { name: "Critical", value: metrics.critical, color: COLORS.red },
    { name: "High Risk", value: metrics.highRisk, color: COLORS.amber },
    { name: "Monitoring", value: metrics.monitoring, color: COLORS.teal },
  ].filter(d => d.value > 0), [metrics]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const statusMap = new Map<string, number>();
    filteredCases.forEach(c => {
      const status = c.caseStatus || "Active";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    return Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || COLORS.navy,
    }));
  }, [filteredCases]);

  // Account breakdown
  const accountBreakdown = useMemo(() => {
    const accountMap = new Map<string, { total: number; critical: number; resolved: number }>();
    filteredCases.forEach(c => {
      const acc = c.account || "Unknown";
      const curr = accountMap.get(acc) || { total: 0, critical: 0, resolved: 0 };
      accountMap.set(acc, {
        total: curr.total + 1,
        critical: curr.critical + (c.riskStatus === "Critical" ? 1 : 0),
        resolved: curr.resolved + (c.caseStatus === "Closed" ? 1 : 0),
      });
    });
    return Array.from(accountMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredCases]);

  // Site breakdown
  const siteBreakdown = useMemo(() => {
    const siteMap = new Map<string, number>();
    filteredCases.forEach(c => {
      const site = c.site || "Unknown";
      siteMap.set(site, (siteMap.get(site) || 0) + 1);
    });
    return Array.from(siteMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredCases]);

  // Timeline data (cases opened per week)
  const timelineData = useMemo(() => {
    const weekMap = new Map<string, { opened: number; resolved: number; critical: number }>();
    filteredCases.forEach(c => {
      const d = new Date(c.caseOpenedDate);
      const weekNum = `W${Math.ceil(d.getDate() / 7)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`;
      const curr = weekMap.get(weekNum) || { opened: 0, resolved: 0, critical: 0 };
      weekMap.set(weekNum, {
        opened: curr.opened + 1,
        resolved: curr.resolved + (c.caseStatus === "Closed" ? 1 : 0),
        critical: curr.critical + (c.riskStatus === "Critical" ? 1 : 0),
      });
    });
    return Array.from(weekMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .slice(-12);
  }, [filteredCases]);

  // Category breakdown for radar chart
  const categoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    filteredCases.forEach(c => {
      const cat = c.attritionCategory || "Other";
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return Array.from(catMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredCases]);

  const exportToCSV = () => {
    const headers = [
      "Case #", "Trainee", "Oracle ID", "Risk", "Stage", "Hours Missed",
      "Account", "LOB", "Site", "Status", "Opened", "Category"
    ];
    const rows = filteredCases.map(c => [
      c.caseNumber, c.traineeName, c.oracleId, c.riskStatus, c.lifecycleStage,
      c.totalMissedHours, c.account, c.lob, c.site, c.caseStatus,
      formatDate(c.caseOpenedDate), c.attritionCategory
    ]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eec-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wider text-teal-300">Analytics Center</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold tracking-wide">
            ATTRITION ANALYTICS
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Comprehensive insights into case trends and patterns
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Time range selector */}
          <div className="inline-flex bg-white rounded-xl p-0.5 border border-gray-200 shadow-sm">
            {(["7d", "30d", "90d", "year"] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-navy-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-navy-800"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
              </button>
            ))}
          </div>
          <TooltipComp content="Refresh data" position="bottom">
            <button
              onClick={loadData}
              className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </TooltipComp>
          <TooltipComp content="Export data to CSV" position="bottom">
            <button
              onClick={exportToCSV}
              className="bg-gradient-teal hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </TooltipComp>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          label="Total Cases"
          value={metrics.total}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={metrics.trend}
          color="teal"
        />
        <KPICard
          label="Active"
          value={metrics.active}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          label="Critical"
          value={metrics.critical}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          pulse={metrics.critical > 0}
        />
        <KPICard
          label="Resolved"
          value={metrics.resolved}
          icon={<Target className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          label="Avg Hours"
          value={metrics.avgHours.toFixed(1)}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <KPICard
          label="Resolution Rate"
          value={`${metrics.resolutionRate}%`}
          icon={<Zap className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2">
        {(["overview", "trends", "breakdown"] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === mode
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {mode === "overview" && <LayoutDashboard className="w-4 h-4" />}
            {mode === "trends" && <TrendingUp className="w-4 h-4" />}
            {mode === "breakdown" && <PieChartIcon className="w-4 h-4" />}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Timeline Chart */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-barlow-condensed font-semibold text-lg text-navy-900">Case Timeline</h3>
                  <p className="text-xs text-gray-400">Opened vs resolved cases over time</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="opened" stroke={COLORS.teal} strokeWidth={2} fill="url(#colorOpened)" name="Opened" />
                  <Area type="monotone" dataKey="resolved" stroke={COLORS.emerald} strokeWidth={2} fill="url(#colorResolved)" name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Distribution */}
            <div className="glass-card rounded-2xl p-5 border border-gray-100">
              <div className="mb-4">
                <h3 className="font-barlow-condensed font-semibold text-lg text-navy-900">Risk Distribution</h3>
                <p className="text-xs text-gray-400">Breakdown by risk level</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {riskDistribution.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "trends" && (
          <motion.div
            key="trends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Account Trends */}
            <div className="glass-card rounded-2xl p-5 border border-gray-100">
              <div className="mb-4">
                <h3 className="font-barlow-condensed font-semibold text-lg text-navy-900">Cases by Account</h3>
                <p className="text-xs text-gray-400">Top accounts by case volume</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accountBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="total" fill={COLORS.teal} radius={[0, 4, 4, 0]} name="Total" />
                  <Bar dataKey="critical" fill={COLORS.red} radius={[0, 4, 4, 0]} name="Critical" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Site Distribution */}
            <div className="glass-card rounded-2xl p-5 border border-gray-100">
              <div className="mb-4">
                <h3 className="font-barlow-condensed font-semibold text-lg text-navy-900">Cases by Site</h3>
                <p className="text-xs text-gray-400">Geographic distribution</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={siteBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="value" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {viewMode === "breakdown" && (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Status Distribution */}
            <div className="glass-card rounded-2xl p-5 border border-gray-100">
              <div className="mb-4">
                <h3 className="font-barlow-condensed font-semibold text-lg text-navy-900">Status Breakdown</h3>
                <p className="text-xs text-gray-400">Cases by current status</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Radar */}
            <div className="glass-card rounded-2xl p-5 border border-gray-100">
              <div className="mb-4">
                <h3 className="font-barlow-condensed font-semibold text-lg text-navy-900">Attrition Categories</h3>
                <p className="text-xs text-gray-400">Top attrition reasons</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={categoryData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <Radar name="Cases" dataKey="count" stroke={COLORS.teal} fill={COLORS.teal} fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard
          title="View Critical Cases"
          description={`${metrics.critical} cases need immediate attention`}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          onClick={() => navigate("/high-risk")}
        />
        <QuickActionCard
          title="Manage Cases"
          description="Open the PS dashboard"
          icon={<LayoutDashboard className="w-5 h-5 text-teal-500" />}
          onClick={() => navigate("/ps-dashboard")}
        />
        <QuickActionCard
          title="Relocations"
          description="View relocation requests"
          icon={<MapPin className="w-5 h-5 text-blue-500" />}
          onClick={() => navigate("/relocations")}
        />
        <QuickActionCard
          title="Submit Case"
          description="Create a new attrition case"
          icon={<FileText className="w-5 h-5 text-purple-500" />}
          onClick={() => navigate("/submit")}
        />
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({
  label,
  value,
  icon,
  trend,
  color,
  pulse,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: "teal" | "blue" | "red" | "amber" | "green" | "purple";
  pulse?: boolean;
}) {
  const colorClasses = {
    teal: "from-teal-50 to-teal-100/50 border-teal-200/50",
    blue: "from-blue-50 to-blue-100/50 border-blue-200/50",
    red: "from-red-50 to-red-100/50 border-red-200/50",
    amber: "from-amber-50 to-amber-100/50 border-amber-200/50",
    green: "from-green-50 to-green-100/50 border-green-200/50",
    purple: "from-purple-50 to-purple-100/50 border-purple-200/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500">{icon}</span>
        {pulse && value !== 0 && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        )}
      </div>
      <div className="text-2xl font-barlow-condensed font-bold text-gray-900">{value}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-600">{label}</span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
            trend > 0 ? "text-red-500" : trend < 0 ? "text-green-500" : "text-gray-400"
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-left transition-all hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </motion.button>
  );
}
