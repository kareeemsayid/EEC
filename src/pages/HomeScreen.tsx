import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { FolderOpen, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, Eye, LogOut, Plus, Calendar, Activity, ChevronRight, ChevronDown, Shield, Minus, Building2, Scale, UserCheck, MapPin, Sparkles, Zap, Target, Award } from "lucide-react";
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

// Ultra-creative welcome card background with morphing blobs and particles
function WelcomeCardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Morphing organic blobs
    type Blob = {
      x: number; y: number;
      baseRadius: number;
      phase: number;
      speedX: number;
      speedY: number;
      hue: number;
      points: number;
    };

    const blobs: Blob[] = [
      { x: 0.15, y: 0.25, baseRadius: 180, phase: 0, speedX: 0.0002, speedY: 0.00015, hue: 174, points: 8 },
      { x: 0.85, y: 0.75, baseRadius: 220, phase: Math.PI, speedX: -0.00018, speedY: 0.00022, hue: 210, points: 6 },
      { x: 0.5, y: 0.5, baseRadius: 160, phase: Math.PI / 2, speedX: 0.00025, speedY: -0.0002, hue: 200, points: 7 },
    ];

    // Floating particles
    type Particle = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number };
    const particles: Particle[] = Array.from({ length: 35 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      size: 1.5 + Math.random() * 3,
      alpha: 0.15 + Math.random() * 0.25,
      hue: 174 + Math.random() * 30,
    }));

    // Connection nodes
    type Node = { x: number; y: number; vx: number; vy: number; size: number };
    const nodes: Node[] = Array.from({ length: 15 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00015,
      vy: (Math.random() - 0.5) * 0.00015,
      size: 2 + Math.random() * 2,
    }));

    const draw = () => {
      tRef.current += 0.008;
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Layer 1: Morphing organic blobs with smooth edges
      blobs.forEach((blob, bi) => {
        blob.x += blob.speedX + Math.sin(tRef.current * 0.3 + bi) * 0.00005;
        blob.y += blob.speedY + Math.cos(tRef.current * 0.25 + bi) * 0.00005;
        if (blob.x < -0.1) blob.x = 1.1;
        if (blob.x > 1.1) blob.x = -0.1;
        if (blob.y < -0.1) blob.y = 1.1;
        if (blob.y > 1.1) blob.y = -0.1;

        const cx = blob.x * W;
        const cy = blob.y * H;

        // Draw morphing blob
        ctx.beginPath();
        for (let i = 0; i <= blob.points * 10; i++) {
          const angle = (i / (blob.points * 10)) * Math.PI * 2;
          const radiusVar = blob.baseRadius * (
            1 +
            0.25 * Math.sin(blob.phase + tRef.current + angle * 3) +
            0.15 * Math.sin(blob.phase * 2 + tRef.current * 1.3 + angle * 5) +
            0.1 * Math.sin(tRef.current * 0.7 + angle * 7)
          );
          const px = cx + radiusVar * Math.cos(angle);
          const py = cy + radiusVar * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        // Gradient fill
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, blob.baseRadius * 1.8);
        grad.addColorStop(0, `hsla(${blob.hue}, 80%, 55%, 0.12)`);
        grad.addColorStop(0.5, `hsla(${blob.hue}, 70%, 45%, 0.06)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Layer 2: Connection nodes with lines
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > 1) node.vx *= -1;
        if (node.y < 0 || node.y > 1) node.vy *= -1;
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const x1 = nodes[i].x * W;
          const y1 = nodes[i].y * H;
          const x2 = nodes[j].x * W;
          const y2 = nodes[j].y * H;
          const dist = Math.hypot(x2 - x1, y2 - y1);
          if (dist < 150) {
            const alpha = 0.08 * (1 - dist / 150);
            ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        const px = node.x * W;
        const py = node.y * H;

        // Glow
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, node.size * 6);
        glowGrad.addColorStop(0, "rgba(45, 212, 191, 0.15)");
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, node.size * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(45, 212, 191, ${0.4 + 0.2 * Math.sin(tRef.current * 2)})`;
        ctx.beginPath();
        ctx.arc(px, py, node.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 3: Floating particles with trails
      particles.forEach(p => {
        p.x += p.vx + Math.sin(tRef.current * 0.4 + p.hue) * 0.00008;
        p.y += p.vy + Math.cos(tRef.current * 0.35 + p.hue) * 0.00008;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const px = p.x * W;
        const py = p.y * H;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(tRef.current * 1.5 + p.hue));

        // Glow
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 5);
        glowGrad.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${alpha * 0.5})`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 4: Sweeping light rays
      const rayCount = 3;
      for (let r = 0; r < rayCount; r++) {
        const rayAngle = tRef.current * 0.15 + (r * Math.PI * 2) / rayCount;
        const rayX = W * 0.5 + Math.cos(rayAngle) * W * 0.6;
        const rayY = H * 0.5 + Math.sin(rayAngle) * H * 0.6;

        const rayGrad = ctx.createRadialGradient(rayX, rayY, 0, rayX, rayY, 100);
        rayGrad.addColorStop(0, "rgba(45, 212, 191, 0.03)");
        rayGrad.addColorStop(1, "transparent");
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.arc(rayX, rayY, 100, 0, Math.PI * 2);
        ctx.fill();
      }

      // Layer 5: Subtle grid overlay
      ctx.strokeStyle = "rgba(45, 212, 191, 0.02)";
      ctx.lineWidth = 0.5;
      const gridSize = 50;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  );
}

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
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ULTRA-CREATIVE WELCOME SECTION WITH GLASSMORPHISM */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl min-h-[320px]"
        style={{
          background: "linear-gradient(135deg, rgba(13,43,69,0.95) 0%, rgba(30,58,95,0.9) 50%, rgba(13,43,69,0.95) 100%)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
        }}
      >
        {/* Ultra-creative animated canvas background */}
        <WelcomeCardCanvas />

        {/* Glassmorphism overlay cards */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top left decorative glass element */}
          <motion.div
            animate={{ rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,196,180,0.08) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          {/* Bottom right decorative glass element */}
          <motion.div
            animate={{ rotate: [0, -5, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8 p-10">
          {/* Left: greeting + stats */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex items-center gap-4 mb-4"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="absolute -inset-2 rounded-2xl opacity-60 blur-lg" style={{ background: "linear-gradient(135deg, #00C4B4, #2563EB)" }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20" style={{ background: "rgba(0,196,180,0.15)" }}>
                  <Shield className="w-7 h-7" style={{ color: "#00E6D4" }} />
                </div>
              </motion.div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: "#00C4B4" }} />
                  </motion.div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#00E6D4" }}>Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/50">Live Updates Active</span>
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-4xl md:text-5xl font-black mb-3"
              style={{ color: "#FFFFFF", letterSpacing: "-0.03em" }}
            >
              {greetingMain},{" "}
              <span className="relative inline-block">
                <motion.span
                  style={{ color: "#00E6D4" }}
                  animate={{ textShadow: ["0 0 0px #00E6D4", "0 0 20px #00E6D4", "0 0 0px #00E6D4"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {user?.displayName?.split(" ")[0] || "Champion"}
                </motion.span>
                <motion.span
                  className="absolute -bottom-2 left-0 h-1 rounded-full"
                  style={{ background: "linear-gradient(90deg, #00C4B4, #2563EB)" }}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-base md:text-lg max-w-xl mb-6"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              {greetingSub}
            </motion.p>

            {/* Ultra-styled Quick Stats Row with glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-xl border border-white/15 cursor-pointer transition-all"
                style={{ background: "rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-green-400"
                  style={{ boxShadow: "0 0 12px rgba(74, 222, 128, 0.5)" }}
                />
                <span className="text-sm font-bold text-white">
                  {loading ? "—" : <><CountUp value={kpi.activeCases} duration={800} /> Active</>}
                </span>
              </motion.div>

              {kpi.critical > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-xl border border-red-400/30 cursor-pointer"
                  style={{ background: "rgba(239,68,68,0.15)", boxShadow: "0 8px 32px rgba(239,68,68,0.15)" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </motion.div>
                  <span className="text-sm font-bold text-red-300">
                    <CountUp value={kpi.critical} duration={800} /> Critical
                  </span>
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-xl border border-teal-400/30 cursor-pointer"
                style={{ background: "rgba(0,196,180,0.12)", boxShadow: "0 8px 32px rgba(0,196,180,0.1)" }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: "#00E6D4" }} />
                <span className="text-sm font-bold" style={{ color: "#00E6D4" }}>
                  {loading ? "—" : <><CountUp value={resolvedCases} duration={800} /> Resolved</>}
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right: user profile card with ultra-glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.6, type: "spring", stiffness: 100 }}
            className="shrink-0 md:w-64"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative rounded-3xl p-6 backdrop-blur-2xl border border-white/20"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              }}
            >
              {/* Animated conic gradient ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1 rounded-3xl opacity-30"
                style={{
                  background: "conic-gradient(from 0deg, #00C4B4, #2563EB, #7C3AED, #00C4B4)",
                  filter: "blur(8px)",
                }}
              />

              <div className="relative flex flex-col items-center gap-4">
                {/* Photo / Initials avatar with ultra-glow */}
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative group cursor-pointer"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-3 rounded-full opacity-40"
                    style={{
                      background: "conic-gradient(from 0deg, #00C4B4, transparent, #2563EB, transparent, #00C4B4)",
                    }}
                  />
                  <div
                    className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-3 border-white/30"
                    style={{
                      background: "linear-gradient(135deg, #00C4B4 0%, #0D2B45 100%)",
                      boxShadow: "0 0 40px rgba(0,196,180,0.3), inset 0 0 20px rgba(255,255,255,0.1)",
                    }}
                  >
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-white select-none">
                        {user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "EE"}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Name and title */}
                <div className="text-center">
                  <p className="font-bold text-white text-lg leading-tight">{user?.displayName || "Welcome"}</p>
                  {user?.jobTitle && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, rgba(0,196,180,0.2), rgba(37,99,235,0.2))",
                        color: "#00E6D4",
                        border: "1px solid rgba(0,196,180,0.3)",
                        boxShadow: "0 0 20px rgba(0,196,180,0.15)",
                      }}
                    >
                      {user.jobTitle}
                    </motion.span>
                  )}
                </div>

                {/* Quick stats badges */}
                <div className="grid grid-cols-3 gap-2 w-full mt-2">
                  <div className="text-center p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-center mb-1">
                      <Target className="w-3.5 h-3.5" style={{ color: "#00C4B4" }} />
                    </div>
                    <p className="text-lg font-bold text-white">{kpi.activeCases}</p>
                    <p className="text-[9px] text-white/50 uppercase">Cases</p>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-center mb-1">
                      <Award className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <p className="text-lg font-bold text-white">{kpi.highRisk}</p>
                    <p className="text-[9px] text-white/50 uppercase">High</p>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-center mb-1">
                      <Zap className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <p className="text-lg font-bold text-white">{resolvedCases}</p>
                    <p className="text-[9px] text-white/50 uppercase">Done</p>
                  </div>
                </div>
              </div>
            </motion.div>
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
