import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuth } from "../auth/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Activity, Mail, LayoutDashboard, Shield, Users, Building2, Truck, ChevronRight, ArrowRight, Sparkles, Globe, Lock } from "lucide-react";

const CYCLE_WORDS = ["Center", "Hub", "Nexus", "Portal"];
const TIPS = [
  "Cases auto-escalate after 72 hours of inactivity",
  "Critical cases trigger immediate PS notifications",
  "Outlook threads are automatically linked to cases",
  "Use Oracle ID to quickly locate any trainee case",
  "SLA tracking ensures timely case resolution",
];
const STAGES = [
  { label: "Connecting to Azure AD…", duration: 800 },
  { label: "Verifying credentials…", duration: 700 },
  { label: "Loading your workspace…", duration: 600 },
];
const TRUST_FEATURES = [
  { icon: Activity, text: "Live attrition case tracking" },
  { icon: Mail, text: "Outlook thread automation" },
  { icon: LayoutDashboard, text: "Role-based dashboards" },
];
const STAKEHOLDER_GROUPS = [
  {
    id: "training",
    label: "Training",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/30",
    description: "Submit cases, track trainees, manage attrition",
    roles: ["Trainer", "Supervisor"],
  },
  {
    id: "ps",
    label: "People Solutions",
    icon: Shield,
    color: "from-teal-500 to-emerald-500",
    shadowColor: "shadow-teal-500/30",
    description: "Oversee cases, approve terminations, escalate",
    roles: ["PS", "SrManager"],
  },
  {
    id: "ta",
    label: "Talent Acquisition",
    icon: Truck,
    color: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/30",
    description: "Manage relocations, clearance approvals",
    roles: ["TA"],
  },
  {
    id: "facilities",
    label: "Facilities",
    icon: Building2,
    color: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/30",
    description: "Site operations, logistics coordination",
    roles: ["Facilities"],
  },
];

/* ─── Hooks ─────────────────────────────────────────────── */

function useCountUp(target: number, duration = 1600, delay = 600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return v;
}

function useMouseParallax() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };
    el.addEventListener("mousemove", h);
    return () => el.removeEventListener("mousemove", h);
  }, []);
  return { ref, mouseX: mouse.x, mouseY: mouse.y };
}

/* ─── LEFT PANEL: Ultra-creative data sphere canvas ──────────── */

function DataSphereCanvas({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const NUM_RINGS = 5;
    const NUM_DOTS = 80;

    type Dot = { angle: number; speed: number; ring: number; size: number; opacity: number };
    const dots: Dot[] = Array.from({ length: NUM_DOTS }, (_, i) => ({
      angle: (i / NUM_DOTS) * Math.PI * 2,
      speed: 0.0015 + Math.random() * 0.002,
      ring: i % NUM_RINGS,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.4 + Math.random() * 0.6,
    }));

    function draw() {
      t.current += 0.006;
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5 + (mouseX - 0.5) * -25;
      const cy = H * 0.5 + (mouseY - 0.5) * -18;

      /* dramatic gradient background glow */
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.65);
      bg.addColorStop(0, "rgba(20,184,166,0.08)");
      bg.addColorStop(0.4, "rgba(14,116,144,0.04)");
      bg.addColorStop(1, "transparent");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      /* rings with 3D perspective */
      const ringRadii = [W * 0.12, W * 0.20, W * 0.28, W * 0.36, W * 0.44];
      const ringTilts = [0.22, -0.28, 0.15, -0.32, 0.08];

      for (let r = 0; r < NUM_RINGS; r++) {
        const radius = ringRadii[r];
        const tilt = ringTilts[r];
        const rotOffset = t.current * (r % 2 === 0 ? 0.5 : -0.35) + r * 0.8;
        const segments = 150;
        ctx.beginPath();
        for (let s = 0; s <= segments; s++) {
          const a = (s / segments) * Math.PI * 2 + rotOffset;
          const x = cx + radius * Math.cos(a);
          const y = cy + radius * Math.sin(a) * Math.cos(tilt);
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        const ringAlpha = 0.1 + 0.06 * Math.sin(t.current * 0.5 + r);
        ctx.strokeStyle = `rgba(45,212,191,${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* orbiting dots with glow */
      dots.forEach(d => {
        d.angle += d.speed;
        const r = ringRadii[d.ring];
        const tilt = ringTilts[d.ring];
        const rotOffset = t.current * (d.ring % 2 === 0 ? 0.5 : -0.35) + d.ring * 0.8;
        const a = d.angle + rotOffset;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a) * Math.cos(tilt);
        const alpha = d.opacity * (0.6 + 0.4 * Math.sin(t.current * 1.5 + d.angle));

        /* outer glow */
        const grad = ctx.createRadialGradient(x, y, 0, x, y, d.size * 6);
        grad.addColorStop(0, `rgba(45,212,191,${alpha * 0.5})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, d.size * 6, 0, Math.PI * 2);
        ctx.fill();

        /* core */
        ctx.fillStyle = `rgba(200,255,250,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, d.size, 0, Math.PI * 2);
        ctx.fill();
      });

      /* floating data particles */
      for (let p = 0; p < 50; p++) {
        const seed = p * 137.508;
        const px2 = ((seed * 0.618) % 1) * W;
        const base = ((seed * 0.382) % 1) * H;
        const py2 = base + Math.sin(t.current * 0.4 + seed) * 25;
        const alpha = 0.15 + 0.12 * Math.sin(t.current * 0.6 + seed * 0.3);
        ctx.fillStyle = `rgba(20,184,166,${alpha})`;
        ctx.beginPath();
        ctx.arc(px2, py2, 1.5 + Math.sin(seed) * 1, 0, Math.PI * 2);
        ctx.fill();
      }

      /* connection lines */
      for (let i = 0; i < dots.length; i++) {
        const r1 = ringRadii[dots[i].ring];
        const t1 = ringTilts[dots[i].ring];
        const ro1 = t.current * (dots[i].ring % 2 === 0 ? 0.5 : -0.35) + dots[i].ring * 0.8;
        const x1 = cx + r1 * Math.cos(dots[i].angle + ro1);
        const y1 = cy + r1 * Math.sin(dots[i].angle + ro1) * Math.cos(t1);
        for (let j = i + 1; j < dots.length; j++) {
          const r2 = ringRadii[dots[j].ring];
          const t2 = ringTilts[dots[j].ring];
          const ro2 = t.current * (dots[j].ring % 2 === 0 ? 0.5 : -0.35) + dots[j].ring * 0.8;
          const x2 = cx + r2 * Math.cos(dots[j].angle + ro2);
          const y2 = cy + r2 * Math.sin(dots[j].angle + ro2) * Math.cos(t2);
          const dist = Math.hypot(x2 - x1, y2 - y1);
          if (dist < 65) {
            ctx.strokeStyle = `rgba(20,184,166,${0.1 * (1 - dist / 65)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      /* grid overlay */
      const gridSize = 48;
      ctx.strokeStyle = "rgba(20,184,166,0.025)";
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += gridSize) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [mouseX, mouseY]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ─── RIGHT PANEL: Ultra-creative immersive background ──────────── */

function ImmersiveRightCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    canvas.addEventListener("mousemove", onMove);

    let t = 0;

    // Morphing orbs
    type Orb = {
      x: number; y: number;
      baseRadius: number;
      vx: number; vy: number;
      hue: number; saturation: number;
      points: number;
      phase: number;
    };

    const orbs: Orb[] = [
      { x: 0.2, y: 0.3, baseRadius: 200, vx: 0.00008, vy: 0.00006, hue: 174, saturation: 80, points: 6, phase: 0 },
      { x: 0.8, y: 0.7, baseRadius: 250, vx: -0.00006, vy: 0.00009, hue: 200, saturation: 70, points: 8, phase: Math.PI },
      { x: 0.5, y: 0.85, baseRadius: 180, vx: 0.0001, vy: -0.00007, hue: 160, saturation: 75, points: 5, phase: Math.PI / 2 },
      { x: 0.15, y: 0.8, baseRadius: 150, vx: 0.00007, vy: -0.00005, hue: 220, saturation: 65, points: 7, phase: Math.PI * 1.5 },
    ];

    // Particles
    type Particle = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number };
    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0004,
      size: 1.5 + Math.random() * 3,
      alpha: 0.2 + Math.random() * 0.4,
      hue: 160 + Math.random() * 40,
    }));

    // Flowing lines
    type FlowLine = { points: { x: number; y: number }[]; alpha: number };
    const flowLines: FlowLine[] = Array.from({ length: 8 }, () => ({
      points: Array.from({ length: 20 }, (_, i) => ({ x: Math.random(), y: i / 20 })),
      alpha: 0.03 + Math.random() * 0.05,
    }));

    const draw = () => {
      t += 0.008;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Layer 1: Deep gradient base
      const baseGrad = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.5, H * 0.5, W);
      baseGrad.addColorStop(0, "rgba(248,250,252,1)");
      baseGrad.addColorStop(0.5, "rgba(241,245,249,1)");
      baseGrad.addColorStop(1, "rgba(248,250,252,1)");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, W, H);

      // Layer 2: Morphing organic orbs
      orbs.forEach(orb => {
        orb.x += orb.vx + Math.sin(t * 0.3 + orb.phase) * 0.00003;
        orb.y += orb.vy + Math.cos(t * 0.25 + orb.phase) * 0.00003;
        if (orb.x < -0.15) orb.x = 1.15;
        if (orb.x > 1.15) orb.x = -0.15;
        if (orb.y < -0.15) orb.y = 1.15;
        if (orb.y > 1.15) orb.y = -0.15;

        const cx = orb.x * W + (mx - 0.5) * 30;
        const cy = orb.y * H + (my - 0.5) * 20;

        // Draw morphing blob
        ctx.beginPath();
        for (let i = 0; i <= orb.points * 15; i++) {
          const angle = (i / (orb.points * 15)) * Math.PI * 2;
          const radiusVar = orb.baseRadius * (
            1 +
            0.3 * Math.sin(orb.phase + t * 0.8 + angle * 3) +
            0.2 * Math.sin(orb.phase * 2 + t * 1.2 + angle * 5) +
            0.15 * Math.sin(t * 0.6 + angle * 7)
          );
          const px = cx + radiusVar * Math.cos(angle);
          const py = cy + radiusVar * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.baseRadius * 2);
        orbGrad.addColorStop(0, `hsla(${orb.hue}, ${orb.saturation}%, 70%, 0.15)`);
        orbGrad.addColorStop(0.4, `hsla(${orb.hue}, ${orb.saturation - 10}%, 60%, 0.08)`);
        orbGrad.addColorStop(1, "transparent");
        ctx.fillStyle = orbGrad;
        ctx.fill();
      });

      // Layer 3: Flowing wave lines
      flowLines.forEach((line, li) => {
        ctx.beginPath();
        line.points.forEach((pt, pi) => {
          const px = pt.x * W + Math.sin(t * 0.5 + li + pi * 0.2) * 40;
          const py = pt.y * H + Math.sin(t * 0.3 + li * 0.5 + px * 0.002) * 30;
          if (pi === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = `rgba(20, 184, 166, ${line.alpha * (0.7 + 0.3 * Math.sin(t + li))})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Layer 4: Particles with glow trails
      particles.forEach(p => {
        p.x += p.vx + Math.sin(t * 0.4 + p.hue) * 0.0001;
        p.y += p.vy + Math.cos(t * 0.35 + p.hue) * 0.0001;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const px = p.x * W + (mx - 0.5) * 25;
        const py = p.y * H + (my - 0.5) * 15;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(t * 1.2 + p.hue));

        // Glow
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 8);
        glowGrad.addColorStop(0, `hsla(${p.hue}, 75%, 65%, ${alpha * 0.4})`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 8, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 5: Floating geometric shapes
      for (let i = 0; i < 12; i++) {
        const seed = i * 89.3;
        const gx = ((seed * 0.618) % 1) * W + Math.sin(t * 0.2 + seed) * 30;
        const gy = ((seed * 0.382) % 1) * H + Math.cos(t * 0.15 + seed) * 25;
        const size = 15 + (i % 4) * 8;
        const rotation = t * 0.1 + seed;
        const alpha = 0.04 + 0.03 * Math.sin(t * 0.5 + seed);

        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(rotation);

        if (i % 3 === 0) {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size * 0.866, size * 0.5);
          ctx.lineTo(-size * 0.866, size * 0.5);
          ctx.closePath();
        } else if (i % 3 === 1) {
          // Square
          ctx.beginPath();
          ctx.rect(-size / 2, -size / 2, size, size);
        } else {
          // Hexagon
          ctx.beginPath();
          for (let j = 0; j < 6; j++) {
            const a = (Math.PI / 3) * j;
            const hx = Math.cos(a) * size;
            const hy = Math.sin(a) * size;
            if (j === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
        }

        ctx.strokeStyle = `rgba(20, 184, 166, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Layer 6: Mouse glow
      const mouseGrad = ctx.createRadialGradient(mx * W, my * H, 0, mx * W, my * H, 200);
      mouseGrad.addColorStop(0, "rgba(45,212,191,0.08)");
      mouseGrad.addColorStop(1, "transparent");
      ctx.fillStyle = mouseGrad;
      ctx.fillRect(0, 0, W, H);

      // Layer 7: Vignette
      const vignetteGrad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W);
      vignetteGrad.addColorStop(0, "transparent");
      vignetteGrad.addColorStop(1, "rgba(15, 23, 42, 0.03)");
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ─── Small helpers ──────────────────────────────────────── */

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="font-mono text-teal-400/70 text-xs tabular-nums">
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

function TypewriterWord() {
  const [wi, setWi] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = CYCLE_WORDS[wi];
    let to: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < word.length) {
      to = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 90);
    } else if (!deleting && displayed.length === word.length) {
      to = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      to = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 50);
    } else {
      setDeleting(false);
      setWi(i => (i + 1) % CYCLE_WORDS.length);
    }
    return () => clearTimeout(to);
  }, [displayed, deleting, wi]);
  return (
    <span style={{ background: "linear-gradient(135deg,#2dd4bf,#67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      {displayed}<span style={{ WebkitTextFillColor: "#2dd4bf" }}>|</span>
    </span>
  );
}

function RotatingTip() {
  const [index, setIndex] = useState(0);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIndex(i => (i + 1) % TIPS.length); setVis(true); }, 400);
    }, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2" style={{ opacity: vis ? 1 : 0, transition: "opacity 0.4s ease" }}>
      <span className="text-teal-400/60 text-[10px] font-semibold uppercase tracking-wider">Tip:</span>
      <span className="text-white/60 text-[10px]">{TIPS[index]}</span>
    </div>
  );
}

function StatPill({ label, target, suffix = "" }: { label: string; target: number; suffix?: string }) {
  const v = useCountUp(target, 1600, 900);
  return (
    <div className="flex flex-col items-center px-5 py-3 rounded-2xl border border-white/[0.10] bg-white/[0.05] backdrop-blur-sm">
      <span className="font-barlow-condensed font-black text-white text-xl leading-none">
        {v}{suffix}
      </span>
      <span className="text-teal-300/70 text-[10px] uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

function MsLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 23 23">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#00a4ef" d="M12 1h10v10H12z" />
      <path fill="#7fba00" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

type AuthState = "idle" | "authenticating" | "success" | "blocked";

function MsSignInButton({
  buttonRef,
  onClick,
  disabled,
  authState,
  currentStage,
  ripples,
  onLogin,
}: {
  buttonRef: React.RefObject<HTMLButtonElement>;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled: boolean;
  authState: AuthState;
  currentStage: number;
  ripples: { id: number; x: number; y: number }[];
  onLogin: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (authState === "authenticating") {
    return (
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
        <div className="space-y-3">
          {STAGES.map((stage, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${currentStage >= i ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                currentStage > i ? "bg-teal-500 border-teal-500" :
                currentStage === i ? "border-teal-500 animate-spin" : "border-gray-200"
              }`}>
                {currentStage > i && <Check size={12} className="text-white" />}
              </div>
              <span className={`text-sm font-medium ${currentStage >= i ? "text-gray-700" : "text-gray-400"}`}>{stage.label}</span>
            </div>
          ))}
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%`, background: "linear-gradient(90deg,#0ea89b,#2dd4bf)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (authState === "success") {
    return (
      <div className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30">
        <Check className="w-6 h-6" />
        <span>Signed in successfully</span>
      </div>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full flex items-center gap-0 text-white font-bold rounded-2xl overflow-hidden disabled:cursor-wait group"
      style={{
        background: hovered
          ? "linear-gradient(135deg,#0a6e65 0%,#0d9488 40%,#14b8a6 100%)"
          : "linear-gradient(135deg,#0b7a70 0%,#0ea89b 45%,#25e2cc 100%)",
        padding: "0",
        minHeight: "64px",
        boxShadow: hovered ? "0 20px 40px -10px rgba(20, 184, 166, 0.4)" : "0 10px 30px -5px rgba(20, 184, 166, 0.2)",
      }}
    >
      {/* Ripple effects */}
      {ripples.map(r => (
        <span key={r.id} className="absolute rounded-full bg-white/25 pointer-events-none animate-ripple"
          style={{ left: r.x, top: r.y, transform: "translate(-50%,-50%)" }} />
      ))}

      {/* Sheen */}
      <span className="ms-btn-sheen absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)", transform: "translateX(-200%) skewX(-20deg)" }} />

      {/* Left MS logo block */}
      <span
        className="relative flex items-center justify-center w-16 h-16 shrink-0 border-r transition-all duration-200"
        style={{ borderColor: "rgba(255,255,255,0.18)", background: hovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.10)" }}
      >
        <MsLogo className="w-6 h-6" />
      </span>

      {/* Text */}
      <span className="flex-1 text-center text-base tracking-wide">
        {hovered ? "Continue with Microsoft" : "Sign in with Microsoft"}
      </span>

      {/* Right arrow */}
      <motion.span
        className="relative w-14 flex items-center justify-center"
        animate={{ x: hovered ? 0 : -5, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight className="w-5 h-5" />
      </motion.span>
    </motion.button>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Animated wordmark ───────────────────────────────── */
function AnimatedWordmark() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t); }, []);
  return (
    <div className={`flex items-center gap-3 mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
      <motion.div
        className="relative"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png" alt="Concentrix"
          className="w-12 h-12 rounded-xl object-contain relative z-10"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,196,180,0.3))" }} />
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ background: "rgba(0,196,180,0.15)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.div>
      <div>
        <div className="flex items-center gap-1.5">
          {"Concentrix".split("").map((ch, i) => (
            <motion.span
              key={i}
              className="font-barlow-condensed font-bold text-navy-800 text-base inline-block"
              initial={{ opacity: 0, y: 10 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              {ch}
            </motion.span>
          ))}
          <span className="text-gray-300 mx-1.5 text-base">&middot;</span>
          <motion.span
            className="font-barlow-condensed font-bold text-teal-600 text-base tracking-wide"
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            EEC
          </motion.span>
        </div>
        <motion.div
          className="h-[2px] rounded-full mt-1"
          initial={{ width: 0 }}
          animate={visible ? { width: "100%" } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{ background: "linear-gradient(90deg,#0ea89b,#2dd4bf,transparent)" }}
        />
      </div>
    </div>
  );
}

/* ─── Ultra-creative animated stakeholders ───────────────────────────── */
function AnimatedStakeholderShowcase() {
  const [activeGroup, setActiveGroup] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveGroup(prev => (prev + 1) % STAKEHOLDER_GROUPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={mounted ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-8 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glass container */}
      <motion.div
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 100%)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-10 opacity-[0.03]"
            style={{
              background: "conic-gradient(from 0deg, #00C4B4, #2563EB, #7C3AED, #F59E0B, #00C4B4)",
            }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-teal-500"
              style={{ boxShadow: "0 0 12px rgba(20,184,166,0.5)" }}
            />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Stakeholder Groups</span>
          </div>
          <div className="flex gap-2">
            {STAKEHOLDER_GROUPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveGroup(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeGroup ? "w-6 bg-teal-500" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-4 relative">
          {STAKEHOLDER_GROUPS.map((group, idx) => {
            const Icon = group.icon;
            const isActive = idx === activeGroup;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                onClick={() => setActiveGroup(idx)}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isActive ? "scale-105 z-10" : "scale-100 opacity-50 hover:opacity-100"
                }`}
              >
                <motion.div
                  className={`relative rounded-2xl p-4 overflow-hidden ${
                    isActive
                      ? `bg-gradient-to-br ${group.color} shadow-xl ${group.shadowColor}`
                      : "bg-white/80 border border-slate-100"
                  }`}
                  whileHover={{ y: -4 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      style={{
                        background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.1), transparent)",
                      }}
                    />
                  )}

                  <div className={`relative flex items-center justify-center mb-3 ${isActive ? "text-white" : "text-slate-500"}`}>
                    <motion.div
                      animate={isActive ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      <Icon className="w-7 h-7" />
                    </motion.div>
                  </div>

                  <p className={`text-xs font-bold text-center truncate ${isActive ? "text-white" : "text-slate-600"}`}>
                    {group.label}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Active detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mt-5 pt-5 border-t border-slate-200/80"
          >
            <div className="flex items-start gap-4">
              <motion.div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${STAKEHOLDER_GROUPS[activeGroup].color} shadow-xl ${STAKEHOLDER_GROUPS[activeGroup].shadowColor}`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {React.createElement(STAKEHOLDER_GROUPS[activeGroup].icon, { className: "w-8 h-8 text-white" })}
              </motion.div>

              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-lg">{STAKEHOLDER_GROUPS[activeGroup].label}</h4>
                <p className="text-sm text-slate-500 mt-1">{STAKEHOLDER_GROUPS[activeGroup].description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {STAKEHOLDER_GROUPS[activeGroup].roles.map((role, rIdx) => (
                    <motion.span
                      key={role}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: rIdx * 0.1 }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {role}
                    </motion.span>
                  ))}
                </div>
              </div>

              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <ChevronRight className="w-6 h-6 text-slate-300" />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${STAKEHOLDER_GROUPS[activeGroup].color}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "linear" }}
            key={activeGroup}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Floating feature cards with 3D tilt ─────────────────────────────── */
function FloatingFeatureCards() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div className="grid grid-cols-3 gap-3 mt-8">
      {TRUST_FEATURES.map(({ icon: Icon, text }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="relative rounded-2xl p-4 cursor-pointer transition-all overflow-hidden group"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)",
            boxShadow: "0 10px 30px -5px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {/* Glow on hover */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle at center, rgba(20,184,166,0.1) 0%, transparent 70%)",
            }}
          />

          <div className="relative">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(135deg, rgba(20,184,166,0.15) 0%, rgba(45,212,191,0.1) 100%)",
                border: "1px solid rgba(20,184,166,0.2)",
              }}
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-5 h-5 text-teal-600" />
            </motion.div>
            <span className="text-xs font-semibold text-slate-600 leading-tight block">{text}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { login, profileLoading: loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [authState, setAuthState] = useState<"idle" | "authenticating" | "success" | "blocked">("idle");
  const [currentStage, setCurrentStage] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const { ref: parallaxRef, mouseX, mouseY } = useMouseParallax();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-redirect when MSAL confirms authentication
  useEffect(() => {
    if (isAuthenticated && authState !== "idle") {
      const t = setTimeout(() => navigate("/", { replace: true }), 600);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, authState, navigate]);

  useEffect(() => {
    if (authState !== "authenticating") return;
    const t = setInterval(() => {
      setCurrentStage(s => (s < STAGES.length - 1 ? s + 1 : s));
    }, 700);
    return () => clearInterval(t);
  }, [authState]);

  const handleLogin = useCallback(async () => {
    if (authState === "authenticating") return;
    setAuthState("authenticating");
    setCurrentStage(1);
    try { await login(); setAuthState("success"); }
    catch { setAuthState("blocked"); }
  }, [authState, login]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Enter" && authState === "idle") { e.preventDefault(); handleLogin(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [authState, handleLogin]);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 500);
    handleLogin();
  };

  const greeting = getTimeGreeting();

  return (
    <div className="min-h-screen flex relative overflow-hidden font-inter">

      {/* ── LEFT PANEL ── */}
      <div
        ref={parallaxRef}
        className="hidden lg:flex flex-col w-[55%] relative overflow-hidden select-none"
        style={{ background: "linear-gradient(160deg, #020d18 0%, #03111e 50%, #020a14 100%)" }}
      >
        {/* Animated canvas */}
        <DataSphereCanvas mouseX={mouseX} mouseY={mouseY} />

        {/* Scan-line texture */}
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)",
          mixBlendMode: "overlay",
        }} />

        {/* Content layer */}
        <div className="relative z-10 flex flex-col h-full px-14 pt-10 pb-10">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png"
                  alt="Concentrix"
                  className="w-12 h-12 rounded-xl object-contain"
                  style={{ background: "rgba(255,255,255,0.04)", padding: "6px", boxShadow: "0 0 20px rgba(0,196,180,0.2)" }}
                />
              </motion.div>
              <div>
                <div className="text-white font-bold text-lg tracking-wide">Concentrix</div>
                <div className="text-teal-400/70 text-[11px] tracking-[0.25em] uppercase font-semibold">Internal Platform</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-teal-400"
                style={{ boxShadow: "0 0 8px rgba(45,212,191,0.6)" }}
              />
              <span className="text-teal-400/60 text-[10px] uppercase tracking-widest font-semibold">All systems operational</span>
              <LiveClock />
            </div>
          </div>

          {/* Hero */}
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-teal-400/30 bg-teal-400/[0.08] px-4 py-1.5 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#00E6D4" }} />
              <span className="text-teal-300 text-[11px] uppercase tracking-[0.3em] font-bold">{greeting}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-barlow-condensed font-black text-white mb-3"
              style={{ fontSize: "clamp(3rem,5vw,4.2rem)", lineHeight: "1.05", letterSpacing: "-0.02em" }}
            >
              Employee Exit
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-barlow-condensed font-black text-white"
              style={{ fontSize: "clamp(3rem,5vw,4.2rem)", lineHeight: "1.05", letterSpacing: "-0.02em" }}
            >
              Command <TypewriterWord />
            </motion.h1>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/60 text-base leading-relaxed max-w-md mb-10"
          >
            The central hub for managing attrition cases, tracking at-risk trainees, and coordinating with People Solutions.
          </motion.p>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mb-10">
            {TRUST_FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 hover:bg-white/[0.07] hover:border-teal-400/30 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-400/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-white/85 text-sm font-medium">{text}</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400/50" />
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-auto">
            <StatPill label="Cases" target={2400} suffix="+" />
            <div className="w-px h-12 bg-white/10" />
            <StatPill label="Uptime" target={99} suffix=".2%" />
            <div className="w-px h-12 bg-white/10" />
            <StatPill label="Response" target={2} suffix="min" />
          </div>

          {/* Bottom section */}
          <div className="mt-10 pt-6 border-t border-white/[0.07]">
            <RotatingTip />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
                  <Lock className="w-3 h-3 text-teal-400/70" />
                  <span className="text-white/50 text-[10px] font-semibold tracking-wide">ISO 27001</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
                  <Shield className="w-3 h-3 text-teal-400/70" />
                  <span className="text-white/50 text-[10px] font-semibold tracking-wide">Azure AD Protected</span>
                </div>
              </div>
              <span className="text-white/30 text-[10px]">Concentrix &copy; 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (ULTRA-CREATIVE) ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Immersive animated canvas background */}
        <ImmersiveRightCanvas />

        {/* Mobile hero */}
        <div className="lg:hidden px-8 py-10 text-center relative z-10" style={{ background: "#020d18" }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <img src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png" alt="Concentrix" className="w-14 h-14 rounded-2xl mx-auto mb-4 object-contain" style={{ boxShadow: "0 0 20px rgba(0,196,180,0.3)" }} />
          </motion.div>
          <h1 className="font-barlow-condensed text-2xl font-bold text-white">Employee Exit Command Center</h1>
          <p className="text-teal-300/60 text-sm mt-2">{greeting}</p>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-10 sm:px-14 lg:px-20 py-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full max-w-[480px]"
          >
            {/* Animated wordmark */}
            <AnimatedWordmark />

            {/* Hero text */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="font-barlow-condensed text-[2.5rem] font-black text-navy-900 leading-tight mb-3"
              style={{ letterSpacing: "-0.02em" }}
            >
              Where Every Case Finds Its Resolution
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              className="text-slate-500 text-base leading-relaxed mb-8"
            >
              Unite intelligence, streamline operations, and transform attrition challenges into opportunities. Your strategic command awaits.
            </motion.p>

            {/* Microsoft sign-in button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
            >
              <MsSignInButton
                buttonRef={buttonRef}
                onClick={handleButtonClick}
                disabled={loading || authState === "authenticating" || authState === "success"}
                authState={authState}
                currentStage={currentStage}
                ripples={ripples}
                onLogin={handleLogin}
              />

              {authState === "idle" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center text-xs text-slate-400 mt-4"
                >
                  Press <kbd className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 font-mono text-[10px] mx-1">Enter</kbd> to continue
                </motion.p>
              )}
              {authState === "blocked" && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span>Sign-in was cancelled.</span>
                  <button onClick={handleLogin} className="font-bold underline">Try again</button>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="my-8 flex items-center gap-4"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Azure AD SSO</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </motion.div>

            {/* Feature cards */}
            <FloatingFeatureCards />

            {/* Stakeholder showcase */}
            <AnimatedStakeholderShowcase />
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="relative text-center text-xs text-slate-400 pb-8 z-10"
        >
          &copy; {new Date().getFullYear()} Concentrix &middot; Secured by Concentrix IT
        </motion.p>
      </div>

      <style>{`
        @keyframes ripple {
          0% { width: 0; height: 0; opacity: 0.3; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }
        .animate-ripple { animation: ripple 0.6s ease-out forwards; }
        @keyframes sheen-slide {
          0% { transform: translateX(-250%) skewX(-20deg); }
          100% { transform: translateX(350%) skewX(-20deg); }
        }
        .ms-btn:hover .ms-btn-sheen { animation: sheen-slide 0.7s ease forwards; }
      `}</style>
    </div>
  );
}
