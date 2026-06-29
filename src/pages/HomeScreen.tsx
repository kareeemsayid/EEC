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
import { FolderOpen, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, Eye, LogOut, Plus, Calendar, Activity, ChevronRight, ChevronDown, Shield, Minus, Building2, Scale, UserCheck, MapPin, Sparkles, FileText } from "lucide-react";
import { motion } from "framer-motion";

// Dynamic greeting based on time of day with creative messaging
function getGreeting(): { main: string; sub: string } {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isMonday = day === 1;
  const isFriday = day === 5;
  const isWeekend = day === 0 || day === 6;

  if (hour < 12) {
    if (isMonday) return { main: "Happy Monday", sub: "Fresh start energy — let's make this week count" };
    if (isWeekend) return { main: "Rise & Shine", sub: "Even on weekends, excellence never sleeps" };
    return { main: "Rise & Grind", sub: "The early bird catches the wins — let's make today legendary" };
  }
  if (hour < 17) {
    if (isFriday) return { main: "Friday Fuel", sub: "One final push before the weekend — finish strong!" };
    return { main: "Power Through", sub: "Peak performance hours — let's turn challenges into victories" };
  }
  if (hour < 21) {
    return { main: "Evening Drive", sub: "Wrapping up with purpose — every action counts" };
  }
  return { main: "Night Owl Mode", sub: "Burning the midnight oil — dedication defines you" };
}

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

  const resolvedCases = cases.filter(c => c.caseStatus === "Closed").length;
  const relocationRequests = 12;
  const psClearanceSLA = 87;
  const taClearanceSLA = 94;
  const relocationRate = 68;
  const activeCases = cases.filter(c => c.caseStatus !== "Closed");

  const { main: greetingMain, sub: greetingSub } = getGreeting();

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Subtle background animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #00C4B4 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-[0.02]"
          style={{ background: "radial-gradient(circle, #00C4B4 0%, transparent 70%)" }}
        />
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Welcome Section - Enhanced Creative Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 50%, #0D2B45 100%)",
        }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #00C4B4 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          {/* Left: greeting + stats */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-3 mb-3"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,196,180,0.2)" }}>
                <Shield className="w-6 h-6" style={{ color: "#00C4B4" }} />
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400/60" />
                <span className="text-xs font-medium text-teal-300/70 uppercase tracking-wider">Dashboard</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: "#FFFFFF", letterSpacing: "-0.02em" }}
            >
              {greetingMain},{" "}
              <span className="relative inline-block">
                <span style={{ color: "#00C4B4" }}>{user?.displayName?.split(" ")[0] || "Champion"}</span>
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 bg-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                />
              </span>{" "}✨
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-sm md:text-base max-w-xl"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {greetingSub}
            </motion.p>

            {/* Quick Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex flex-wrap gap-3 mt-6"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-white/90">
                  {loading ? "—" : <><CountUp value={kpi.activeCases} duration={800} /> Active Cases</>}
                </span>
              </div>
              {kpi.critical > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.2)" }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-medium text-red-300">
                    <CountUp value={kpi.critical} duration={800} /> Critical
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "rgba(0,196,180,0.15)" }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: "#00C4B4" }} />
                <span className="text-xs font-medium" style={{ color: "#00C4B4" }}>
                  {loading ? "—" : <><CountUp value={resolvedCases} duration={800} /> Resolved</>}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: user profile card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 120 }}
            className="shrink-0 flex flex-col items-center gap-3 md:w-52"
          >
            {/* Photo / Initials avatar */}
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative group cursor-pointer"
            >
              <div
                className="absolute -inset-1 rounded-full opacity-60 blur-md group-hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #00C4B4, #2563EB)" }}
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 group-hover:border-teal-300 transition-all"
                style={{ background: "linear-gradient(135deg, #00C4B4 0%, #0D2B45 100%)" }}
              >
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white select-none">
                    {user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "EE"}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Name */}
            <div className="text-center">
              <p className="font-bold text-white text-base leading-tight">{user?.displayName || "Welcome"}</p>
              {user?.jobTitle && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: "rgba(0,196,180,0.2)",
                    color: "#00E6D4",
                    border: "1px solid rgba(0,196,180,0.3)",
                    boxShadow: "0 0 12px rgba(0,196,180,0.15)",
                  }}
                >
                  {user.jobTitle}
                </motion.span>
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-2 flex items-center justify-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-white/50 font-medium">Welcome back</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Grid: Hero (65%) + Right Stack (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card - 65% width */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="eec-card-gradient p-7 min-h-[440px] flex flex-col relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />

            {/* Hero Header */}
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Overview</span>
                <h1 className="text-2xl font-bold text-white">Performance Trends</h1>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white/80 hover:text-white transition-colors"
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
                <ResponsiveContainer width="100%" height={260}>
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
            <div className="grid grid-cols-3 gap-5 mt-5 pt-5 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
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
            className="eec-card p-6 hover:shadow-card-hover cursor-pointer transition-all group"
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
            className="rounded-2xl p-6 cursor-pointer transition-all group relative overflow-hidden"
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
            className="eec-card p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                icon={Plus}
                label="New Case"
                color="#1E3A5F"
                onClick={() => navigate("/submit")}
              />
              <QuickActionCard
                icon={MapPin}
                label="Relocation"
                color="#00C4B4"
                onClick={() => navigate("/relocations/submit")}
              />
              <QuickActionCard
                icon={Scale}
                label="Investigation"
                color="#7C3AED"
                onClick={() => navigate("/investigations/new")}
              />
              <QuickActionCard
                icon={FolderOpen}
                label="All Cases"
                color="#2563EB"
                onClick={() => navigate("/my-cases")}
              />
              <TerminationSheetButton onClick={() => navigate("/termination/workday")} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="eec-card overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-eecblue" />
              <h2 className="font-semibold text-navy-900">Recent Activity</h2>
            </div>
            <span className="text-xs text-gray-400">{activeCases.length} updates</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
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
                <div key={c.id} className="px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
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
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-eecblue" />
              <h2 className="font-semibold text-navy-900">Active Cases</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-navy-900">{activeCases.length}</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
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
                  className="px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
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
            <div className="px-6 py-3 border-t border-gray-100">
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

function QuickActionCard({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center justify-center gap-2.5 rounded-2xl p-4 w-full text-center transition-all overflow-hidden border"
      style={{
        background: hovered ? color : `${color}10`,
        borderColor: hovered ? color : `${color}30`,
        boxShadow: hovered ? `0 8px 24px ${color}40` : "none",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: hovered ? "rgba(255,255,255,0.2)" : `${color}18`,
        }}
      >
        <Icon
          className="w-5 h-5 transition-all"
          style={{ color: hovered ? "#fff" : color }}
        />
      </div>
      <span
        className="text-xs font-bold tracking-wide transition-all"
        style={{ color: hovered ? "#fff" : "#1E3A5F" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

function TerminationSheetButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className="relative col-span-2 flex items-center justify-center gap-3 rounded-2xl p-4 w-full text-left transition-all overflow-hidden"
      style={{
        background: hovered
          ? "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #F43F5E 100%)"
          : "linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)",
        border: hovered ? "1.5px solid #DC2626" : "1.5px solid #FECACA",
        boxShadow: hovered
          ? "0 10px 30px rgba(220,38,38,0.35), 0 0 20px rgba(244,63,94,0.2)"
          : "0 2px 8px rgba(220,38,38,0.08)",
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: hovered
            ? "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)"
            : "none",
        }}
        animate={hovered ? { x: ["-100%", "100%"] } : {}}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: hovered ? "rgba(255,255,255,0.25)" : "rgba(220,38,38,0.12)",
        }}
      >
        <motion.div
          animate={hovered ? { rotate: [0, -8, 8, 0], scale: 1.1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <FileText
            className="w-5 h-5 transition-all"
            style={{ color: hovered ? "#fff" : "#DC2626" }}
          />
        </motion.div>
      </div>
      <div className="relative flex-1">
        <span
          className="text-sm font-bold tracking-wide transition-all block"
          style={{ color: hovered ? "#fff" : "#991B1B" }}
        >
          Send Termination Sheet
        </span>
        <span
          className="text-[10px] font-medium transition-all block mt-0.5"
          style={{ color: hovered ? "rgba(255,255,255,0.8)" : "#B91C1C" }}
        >
          Workday confirmation & termination form
        </span>
      </div>
      <motion.div
        animate={hovered ? { x: [0, 4, 0] } : {}}
        transition={{ duration: 0.8, repeat: hovered ? Infinity : 0 }}
        className="relative"
      >
        <ChevronRight
          className="w-5 h-5 transition-all"
          style={{ color: hovered ? "#fff" : "#DC2626" }}
        />
      </motion.div>
    </motion.button>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`eec-card relative overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      style={{ transition: "box-shadow 0.2s, border-color 0.2s" }}
    >
      {/* Glow layer on hover via CSS */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}18 0%, transparent 70%)` }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
            transition={{ duration: 0.4 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </motion.div>
          <span
            className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
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
        <div className="text-4xl font-extrabold mb-1" style={{ color }}>
          {loading ? <span className="text-gray-300">—</span> : <CountUp value={value} duration={800} />}
        </div>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">{label}</p>
      </div>
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
