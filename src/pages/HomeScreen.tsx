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
import { FolderOpen, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, Eye, LogOut, Plus, Calendar, Activity, ChevronRight, ChevronDown, Shield, Minus, Building2, Scale, UserCheck, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// Ultra-creative constellation particle network with mouse parallax
function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    // Constellation stars
    type Star = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; pulse: number };
    const stars: Star[] = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00008,
      vy: (Math.random() - 0.5) * 0.00008,
      size: 1 + Math.random() * 2.5,
      alpha: 0.3 + Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Teal wave particles
    type WaveParticle = { x: number; baseY: number; amplitude: number; phase: number; speed: number; size: number };
    const waveParticles: WaveParticle[] = Array.from({ length: 40 }, (_, i) => ({
      x: i / 40,
      baseY: 0.7 + Math.random() * 0.2,
      amplitude: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 2,
    }));

    const draw = () => {
      tRef.current += 0.012;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      ctx.clearRect(0, 0, W, H);

      // Layer 1: Deep gradient base
      const bgGrad = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.5, H * 0.5, W);
      bgGrad.addColorStop(0, "rgba(13,43,69,0.15)");
      bgGrad.addColorStop(0.5, "rgba(30,58,95,0.08)");
      bgGrad.addColorStop(1, "transparent");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Layer 2: Teal wave effect
      ctx.beginPath();
      for (let i = 0; i <= W; i += 3) {
        const waveY = H * 0.75 + Math.sin(i * 0.008 + tRef.current * 0.6) * 25 + Math.sin(i * 0.015 + tRef.current * 0.4) * 15;
        if (i === 0) ctx.moveTo(i, waveY);
        else ctx.lineTo(i, waveY);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      const waveGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
      waveGrad.addColorStop(0, "rgba(0,196,180,0.08)");
      waveGrad.addColorStop(1, "transparent");
      ctx.fillStyle = waveGrad;
      ctx.fill();

      // Layer 3: Wave particles
      waveParticles.forEach(p => {
        const px = p.x * W + Math.sin(tRef.current * p.speed + p.phase) * 8;
        const py = p.baseY * H + Math.sin(tRef.current * 0.8 + p.phase) * p.amplitude * H;
        const alpha = 0.4 + 0.3 * Math.sin(tRef.current * 1.2 + p.phase);

        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 8);
        glowGrad.addColorStop(0, `rgba(0,196,180,${alpha * 0.6})`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(200,255,250,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 4: Constellation stars with parallax
      stars.forEach(star => {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = 1;
        if (star.x > 1) star.x = 0;
        if (star.y < 0) star.y = 1;
        if (star.y > 1) star.y = 0;

        const parallaxX = (mx - 0.5) * 15;
        const parallaxY = (my - 0.5) * 12;
        const px = star.x * W + parallaxX;
        const py = star.y * H + parallaxY;
        const pulseAlpha = star.alpha * (0.7 + 0.3 * Math.sin(tRef.current * 2 + star.pulse));

        // Star glow
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, star.size * 10);
        glowGrad.addColorStop(0, `rgba(0,196,180,${pulseAlpha * 0.5})`);
        glowGrad.addColorStop(0.4, `rgba(0,196,180,${pulseAlpha * 0.2})`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, star.size * 10, 0, Math.PI * 2);
        ctx.fill();

        // Star core
        ctx.fillStyle = `rgba(200,255,250,${pulseAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 5: Constellation connections
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const sx1 = stars[i].x * W + (mx - 0.5) * 15;
          const sy1 = stars[i].y * H + (my - 0.5) * 12;
          const sx2 = stars[j].x * W + (mx - 0.5) * 15;
          const sy2 = stars[j].y * H + (my - 0.5) * 12;
          const dist = Math.hypot(sx2 - sx1, sy2 - sy1);
          if (dist < 120) {
            const alpha = 0.15 * (1 - dist / 120);
            ctx.strokeStyle = `rgba(0,196,180,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
          }
        }
      }

      // Layer 6: Mouse glow
      const mouseGlow = ctx.createRadialGradient(mx * W, my * H, 0, mx * W, my * H, 150);
      mouseGlow.addColorStop(0, "rgba(0,196,180,0.12)");
      mouseGlow.addColorStop(1, "transparent");
      ctx.fillStyle = mouseGlow;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.95 }}
    />
  );
}

// Morphing background blobs (available for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MorphingBlobCanvas() {
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

    type Blob = { x: number; y: number; baseRadius: number; phase: number; speedX: number; speedY: number; hue: number; points: number };
    const blobs: Blob[] = [
      { x: 0.15, y: 0.25, baseRadius: 180, phase: 0, speedX: 0.0002, speedY: 0.00015, hue: 174, points: 8 },
      { x: 0.85, y: 0.75, baseRadius: 220, phase: Math.PI, speedX: -0.00018, speedY: 0.00022, hue: 210, points: 6 },
      { x: 0.5, y: 0.5, baseRadius: 160, phase: Math.PI / 2, speedX: 0.00025, speedY: -0.0002, hue: 200, points: 7 },
    ];

    const draw = () => {
      tRef.current += 0.008;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      blobs.forEach((blob, bi) => {
        blob.x += blob.speedX + Math.sin(tRef.current * 0.3 + bi) * 0.00005;
        blob.y += blob.speedY + Math.cos(tRef.current * 0.25 + bi) * 0.00005;
        if (blob.x < -0.1) blob.x = 1.1;
        if (blob.x > 1.1) blob.x = -0.1;
        if (blob.y < -0.1) blob.y = 1.1;
        if (blob.y > 1.1) blob.y = -0.1;

        const cx = blob.x * W;
        const cy = blob.y * H;

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

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, blob.baseRadius * 1.8);
        grad.addColorStop(0, `hsla(${blob.hue}, 80%, 55%, 0.12)`);
        grad.addColorStop(0.5, `hsla(${blob.hue}, 70%, 45%, 0.06)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />;
}

// Animated hexagonal pattern background for Performance Trends card
function HexPatternBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
            <polygon
              points="28,0 56,16 56,48 28,64 0,48 0,16"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#hexPattern)" />
      </svg>
      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          top: 0,
          background: "linear-gradient(90deg, transparent, rgba(0,196,180,0.4), transparent)",
          boxShadow: "0 0 20px rgba(0,196,180,0.3)",
        }}
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
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

      {/* ULTRA-CREATIVE WELCOME SECTION WITH CONSTELLATION PARTICLE NETWORK */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl min-h-[340px]"
        style={{
          background: "linear-gradient(160deg, rgba(13,43,69,0.98) 0%, rgba(30,58,95,0.95) 40%, rgba(13,43,69,0.98) 100%)",
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,196,180,0.15) inset, 0 0 80px rgba(0,196,180,0.08)",
        }}
      >
        {/* Constellation particle network canvas */}
        <ConstellationCanvas />

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

        <div className="relative z-10 flex flex-col gap-8 p-10">
          {/* Greeting + stats - full width */}
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
        </div>
      </motion.div>

      {/* Main Grid: Hero (65%) + Right Stack (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card - 65% width */}
        <div className="lg:col-span-7 xl:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="eec-card-gradient p-7 min-h-[440px] flex flex-col relative overflow-visible group"
            style={{
              background: "linear-gradient(160deg, rgba(13,43,69,0.98) 0%, rgba(30,58,95,0.95) 40%, rgba(13,43,69,0.98) 100%)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Animated hex pattern background */}
            <HexPatternBackground />

            {/* Floating orbs */}
            <motion.div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(0,196,180,0.15) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, -20, 0],
                y: [0, 30, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Hero Header */}
            <div className="relative flex items-start justify-between mb-5 z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="flex items-center gap-2 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,196,180,0.3) 0%, rgba(0,196,180,0.1) 100%)",
                      border: "1px solid rgba(0,196,180,0.4)",
                    }}
                  >
                    <TrendingUp className="w-4 h-4" style={{ color: "#00E6D4" }} />
                  </motion.div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Overview</span>
                </motion.div>
                <h1 className="text-2xl font-black" style={{
                  color: "#FFFFFF",
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}>
                  Performance Trends
                </h1>
              </motion.div>
              <div className="relative">
                <motion.button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(0,196,180,0.2)",
                    borderColor: "rgba(0,196,180,0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedPeriod}
                  <motion.div
                    animate={{ rotate: showPeriodDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {showPeriodDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 mt-2 z-50 w-44 rounded-xl overflow-hidden"
                      style={{
                        background: "linear-gradient(180deg, rgba(13,43,69,0.98) 0%, rgba(7,28,46,0.98) 100%)",
                        border: "1px solid rgba(0,196,180,0.3)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                      }}
                    >
                      {PERIOD_OPTIONS.map((p, i) => (
                        <motion.button
                          key={p}
                          onClick={() => { setSelectedPeriod(p); setShowPeriodDropdown(false); }}
                          className="w-full text-left px-4 py-3 text-xs font-medium transition-colors flex items-center gap-2"
                          style={{
                            color: p === selectedPeriod ? "#00E6D4" : "rgba(255,255,255,0.7)",
                            background: p === selectedPeriod ? "rgba(0,196,180,0.15)" : "transparent",
                          }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ background: "rgba(0,196,180,0.1)" }}
                        >
                          {p === selectedPeriod && (
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#00E6D4" }}
                              layoutId="selectedPeriod"
                            />
                          )}
                          {p}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative z-10">
              {loading ? (
                <motion.div
                  className="h-full rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={WEEKLY_TREND} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroGradCritical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(239,68,68,0.4)" />
                        <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                      </linearGradient>
                      <linearGradient id="heroGradHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(245,158,11,0.3)" />
                        <stop offset="100%" stopColor="rgba(245,158,11,0)" />
                      </linearGradient>
                      <linearGradient id="heroGradMon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(34,197,94,0.3)" />
                        <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        fontSize: 11,
                        background: "linear-gradient(180deg, rgba(13,43,69,0.98) 0%, rgba(7,28,46,0.98) 100%)",
                        color: "white",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      }}
                      labelStyle={{ color: "white", fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="critical"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      fill="url(#heroGradCritical)"
                    />
                    <Area
                      type="monotone"
                      dataKey="highRisk"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fill="url(#heroGradHigh)"
                    />
                    <Area
                      type="monotone"
                      dataKey="monitoring"
                      stroke="#22C55E"
                      strokeWidth={2}
                      fill="url(#heroGradMon)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bottom Stats Row with animated cards */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              {[
                { label: "Total Cases", value: cases.length, color: "#00C4B4", icon: FolderOpen },
                { label: "Critical", value: kpi.critical, color: "#EF4444", icon: AlertTriangle },
                { label: "Resolved", value: resolvedCases, color: "#22C55E", icon: TrendingUp },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-4 rounded-xl relative overflow-hidden group/stat"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    background: "rgba(255,255,255,0.08)",
                    transition: { duration: 0.2 }
                  }}
                >
                  {/* Glow effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)`,
                    }}
                  />
                  <stat.icon
                    className="w-4 h-4 mx-auto mb-2 relative z-10"
                    style={{ color: stat.color }}
                  />
                  <motion.p
                    className="text-3xl font-black relative z-10"
                    style={{ color: stat.color }}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  >
                    {loading ? "—" : <CountUp value={stat.value} duration={600} />}
                  </motion.p>
                  <p className="text-xs text-white/50 mt-1 relative z-10">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Send Termination Sheet Button */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onClick={() => navigate("/termination")}
            className="w-full relative overflow-hidden rounded-2xl p-5 cursor-pointer group"
            style={{
              background: "linear-gradient(135deg, rgba(13,43,69,0.95) 0%, rgba(30,58,95,0.9) 100%)",
              border: "1px solid rgba(0,196,180,0.25)",
              boxShadow: "0 15px 35px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated gradient sweep */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(0,196,180,0.1), transparent)",
                transform: "skewX(-12deg) translateX(-150%)",
              }}
              animate={{ transform: "skewX(-12deg) translateX(150%)" }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Pulsing border glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                border: "1px solid rgba(0,196,180,0.3)",
                boxShadow: "0 0 20px rgba(0,196,180,0.15)",
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,196,180,0.2) 0%, rgba(0,196,180,0.08) 100%)",
                    border: "1px solid rgba(0,196,180,0.4)",
                  }}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >
                  <LogOut className="w-5 h-5" style={{ color: "#00E6D4" }} />
                </motion.div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white mb-0.5">Send Termination Sheet</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Routes to PS DL and stakeholders automatically
                  </p>
                </div>
              </div>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: "rgba(0,196,180,0.15)", border: "1px solid rgba(0,196,180,0.3)" }}
                whileHover={{ background: "rgba(0,196,180,0.25)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "#00E6D4" }}>Start</span>
                <ChevronRight className="w-4 h-4" style={{ color: "#00E6D4" }} />
              </motion.div>
            </div>
          </motion.button>
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
      whileHover={{
        scale: 1.05,
        y: -6,
        transition: { duration: 0.25, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-5 w-full text-center transition-all overflow-hidden group"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`
          : `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
        border: `1.5px solid ${hovered ? color : `${color}25`}`,
        boxShadow: hovered
          ? `0 20px 40px ${color}35, 0 0 0 1px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`
          : "none",
      }}
    >
      {/* Animated background gradient sweep */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)`,
          transform: "skewX(-12deg) translateX(-150%)",
        }}
        animate={hovered ? { transform: "skewX(-12deg) translateX(150%)" } : {}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Pulsing glow ring behind icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={false}
        animate={hovered ? { scale: 1.5, opacity: [0, 0.3, 0] } : { scale: 0.8, opacity: 0 }}
        transition={{ duration: 1.2, repeat: hovered ? Infinity : 0 }}
      >
        <div
          className="w-12 h-12 rounded-full"
          style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }}
        />
      </motion.div>

      {/* Icon container with morphing effect */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: hovered ? 1.15 : 1,
          rotate: hovered ? [0, -5, 5, 0] : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden"
          style={{
            background: hovered
              ? "rgba(255,255,255,0.25)"
              : `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
            boxShadow: hovered
              ? `0 8px 20px ${color}30, inset 0 1px 0 rgba(255,255,255,0.3)`
              : "none",
            border: `1px solid ${hovered ? "rgba(255,255,255,0.3)" : `${color}20`}`,
          }}
        >
          {/* Icon shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              transform: "skewX(-12deg)",
            }}
            animate={hovered ? { x: ["-100%", "100%"] } : { x: "-100%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <Icon
            className="w-5.5 h-5.5 relative z-10 transition-all duration-300"
            style={{
              color: hovered ? "#FFFFFF" : color,
              filter: hovered ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none",
            }}
          />
        </div>
      </motion.div>

      {/* Label with animated underline */}
      <motion.span
        className="relative z-10 text-xs font-bold tracking-wide transition-all duration-300"
        style={{
          color: hovered ? "#FFFFFF" : "#1E3A5F",
          textShadow: hovered ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
        }}
      >
        {label}
        {/* Animated underline */}
        <motion.div
          className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
          style={{ background: hovered ? "rgba(255,255,255,0.6)" : "transparent" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </motion.span>

      {/* Floating particles on hover */}
      {hovered && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: "rgba(255,255,255,0.6)",
                left: `${20 + i * 20}%`,
                bottom: "20%",
              }}
              initial={{ y: 0, opacity: 0, scale: 0 }}
              animate={{
                y: -30,
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
        </>
      )}
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
