import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuth } from "../auth/useAuth";
import { motion } from "framer-motion";
import { Check, Activity, Mail, LayoutDashboard, Shield, Users, Building2, Truck, ChevronRight } from "lucide-react";

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
    pattern: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
  },
  {
    id: "ps",
    label: "People Solutions",
    icon: Shield,
    color: "from-teal-500 to-emerald-500",
    shadowColor: "shadow-teal-500/30",
    description: "Oversee cases, approve terminations, escalate",
    roles: ["PS", "SrManager"],
    pattern: "M9 12l2 2 4-4m5.618-4.504a3.736 3.736 0 00-1.56-1.56c-1.116-.549-2.517-.549-5.318-.549H9.31c-2.8 0-4.202 0-5.318.549a3.736 3.736 0 00-1.56 1.56C2.382 8.966 2.382 10.367 2.382 13.168v.314c0 2.8 0 4.202.549 5.318a3.736 3.736 0 001.56 1.56c1.116.549 2.517.549 5.318.549h2.936c2.8 0 4.202 0 5.318-.549a3.736 3.736 0 001.56-1.56c.549-1.116.549-2.517.549-5.318v-.314c0-2.8 0-4.202-.549-5.318z",
  },
  {
    id: "ta",
    label: "Talent Acquisition",
    icon: Truck,
    color: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/30",
    description: "Manage relocations, clearance approvals",
    roles: ["TA"],
    pattern: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  },
  {
    id: "facilities",
    label: "Facilities",
    icon: Building2,
    color: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/30",
    description: "Site operations, logistics coordination",
    roles: ["Facilities"],
    pattern: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H4m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
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

/* ─── Animated background: flowing orbs + grid ──────────── */

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

    const NUM_RINGS = 4;
    const NUM_DOTS = 60;

    type Dot = { angle: number; speed: number; ring: number; size: number; opacity: number };
    const dots: Dot[] = Array.from({ length: NUM_DOTS }, (_, i) => ({
      angle: (i / NUM_DOTS) * Math.PI * 2,
      speed: 0.0015 + Math.random() * 0.002,
      ring: i % NUM_RINGS,
      size: 1.5 + Math.random() * 2,
      opacity: 0.4 + Math.random() * 0.6,
    }));

    function draw() {
      t.current += 0.005;
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5 + (mouseX - 0.5) * -18;
      const cy = H * 0.5 + (mouseY - 0.5) * -12;

      /* subtle gradient background glow */
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.55);
      bg.addColorStop(0, "rgba(20,184,166,0.06)");
      bg.addColorStop(0.5, "rgba(14,116,144,0.03)");
      bg.addColorStop(1, "transparent");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      /* rings */
      const ringRadii = [W * 0.14, W * 0.22, W * 0.30, W * 0.38];
      const ringTilts = [0.18, -0.22, 0.12, -0.28];

      for (let r = 0; r < NUM_RINGS; r++) {
        const radius = ringRadii[r];
        const tilt = ringTilts[r];
        const rotOffset = t.current * (r % 2 === 0 ? 0.4 : -0.3) + r * 0.8;
        const segments = 120;
        ctx.beginPath();
        for (let s = 0; s <= segments; s++) {
          const a = (s / segments) * Math.PI * 2 + rotOffset;
          const x = cx + radius * Math.cos(a);
          const y = cy + radius * Math.sin(a) * Math.cos(tilt);
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        const ringAlpha = 0.08 + 0.06 * Math.sin(t.current * 0.5 + r);
        ctx.strokeStyle = `rgba(45,212,191,${ringAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      /* orbiting dots on rings */
      dots.forEach(d => {
        d.angle += d.speed;
        const r = ringRadii[d.ring];
        const tilt = ringTilts[d.ring];
        const rotOffset = t.current * (d.ring % 2 === 0 ? 0.4 : -0.3) + d.ring * 0.8;
        const a = d.angle + rotOffset;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a) * Math.cos(tilt);
        const alpha = d.opacity * (0.7 + 0.3 * Math.sin(t.current * 1.5 + d.angle));

        /* glow */
        const grad = ctx.createRadialGradient(x, y, 0, x, y, d.size * 4);
        grad.addColorStop(0, `rgba(45,212,191,${alpha})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, d.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(200,255,250,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, d.size, 0, Math.PI * 2);
        ctx.fill();
      });

      /* floating data particles */
      for (let p = 0; p < 30; p++) {
        const seed = p * 137.508;
        const px2 = ((seed * 0.618) % 1) * W;
        const base = ((seed * 0.382) % 1) * H;
        const py2 = base + Math.sin(t.current * 0.4 + seed) * 18;
        const alpha = 0.15 + 0.12 * Math.sin(t.current * 0.6 + seed * 0.3);
        ctx.fillStyle = `rgba(20,184,166,${alpha})`;
        ctx.beginPath();
        ctx.arc(px2, py2, 1 + Math.sin(seed) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      /* connecting lines between nearby dots */
      for (let i = 0; i < dots.length; i++) {
        const r1 = ringRadii[dots[i].ring];
        const t1 = ringTilts[dots[i].ring];
        const ro1 = t.current * (dots[i].ring % 2 === 0 ? 0.4 : -0.3) + dots[i].ring * 0.8;
        const x1 = cx + r1 * Math.cos(dots[i].angle + ro1);
        const y1 = cy + r1 * Math.sin(dots[i].angle + ro1) * Math.cos(t1);
        for (let j = i + 1; j < dots.length; j++) {
          const r2 = ringRadii[dots[j].ring];
          const t2 = ringTilts[dots[j].ring];
          const ro2 = t.current * (dots[j].ring % 2 === 0 ? 0.4 : -0.3) + dots[j].ring * 0.8;
          const x2 = cx + r2 * Math.cos(dots[j].angle + ro2);
          const y2 = cy + r2 * Math.sin(dots[j].angle + ro2) * Math.cos(t2);
          const dist = Math.hypot(x2 - x1, y2 - y1);
          if (dist < 55) {
            ctx.strokeStyle = `rgba(20,184,166,${0.08 * (1 - dist / 55)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      /* grid overlay */
      const gridSize = 48;
      ctx.strokeStyle = "rgba(20,184,166,0.03)";
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
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          {STAGES.map((stage, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${currentStage >= i ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                currentStage > i ? "bg-teal-500 border-teal-500" :
                currentStage === i ? "border-teal-500 animate-spin" : "border-gray-200"
              }`}>
                {currentStage > i && <Check size={10} className="text-white" />}
              </div>
              <span className={`text-sm ${currentStage >= i ? "text-gray-700" : "text-gray-400"}`}>{stage.label}</span>
            </div>
          ))}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%`, background: "linear-gradient(90deg,#0ea89b,#2dd4bf)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (authState === "success") {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-teal-500 text-white font-semibold shadow-lg shadow-teal-500/25">
        <Check className="w-5 h-5" />
        <span>Signed in successfully</span>
      </div>
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      className="ms-btn ms-btn-idle relative w-full flex items-center gap-0 text-white font-semibold rounded-2xl overflow-hidden disabled:cursor-wait group"
      style={{
        background: hovered
          ? "linear-gradient(135deg,#0a6e65 0%,#0d9488 40%,#14b8a6 100%)"
          : "linear-gradient(135deg,#0b7a70 0%,#0ea89b 45%,#25e2cc 100%)",
        padding: "0",
        minHeight: "56px",
      }}
    >
      {/* Ripple effects */}
      {ripples.map(r => (
        <span key={r.id} className="absolute rounded-full bg-white/25 pointer-events-none animate-ripple"
          style={{ left: r.x, top: r.y, transform: "translate(-50%,-50%)" }} />
      ))}

      {/* Sheen */}
      <span className="ms-btn-sheen absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)", transform: "translateX(-200%) skewX(-20deg)" }} />

      {/* Left MS logo block */}
      <span
        className="relative flex items-center justify-center w-14 h-14 shrink-0 border-r transition-all duration-200"
        style={{ borderColor: "rgba(255,255,255,0.18)", background: hovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.10)" }}
      >
        <MsLogo className="w-5 h-5" />
      </span>

      {/* Text */}
      <span className="flex-1 text-center text-sm tracking-wide">
        {hovered ? "Continue with Microsoft →" : "Sign in with Microsoft"}
      </span>

      {/* Right arrow indicator */}
      <span className={`relative w-12 flex items-center justify-center transition-all duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </button>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Right panel: Constellation canvas ─────────────────── */
function AuroraCanvas() {
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

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; baseAlpha: number; phase: number;
    };

    const NUM_PARTICLES = 45;
    const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0004,
      size: 1.2 + Math.random() * 2.5,
      baseAlpha: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    }));

    type Wave = { amp: number; freq: number; speed: number; offset: number; alpha: number };
    const waves: Wave[] = [
      { amp: 30, freq: 0.008, speed: 0.3, offset: 0, alpha: 0.04 },
      { amp: 20, freq: 0.012, speed: 0.5, offset: 100, alpha: 0.03 },
      { amp: 15, freq: 0.016, speed: 0.7, offset: 200, alpha: 0.025 },
    ];

    const draw = () => {
      t += 0.005;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Layer 1: Flowing gradient waves
      waves.forEach((wave, wi) => {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const y = H * 0.5
            + Math.sin(x * wave.freq + t * wave.speed + wave.offset) * wave.amp
            + Math.sin(x * wave.freq * 0.5 + t * wave.speed * 0.7) * wave.amp * 0.5
            + (my - 0.5) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, H * 0.3, 0, H);
        grad.addColorStop(0, `rgba(14,168,155,${wave.alpha})`);
        grad.addColorStop(1, "rgba(14,168,155,0)");
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Layer 2: Hexagonal grid pattern (subtle, pulsing)
      const hexSize = 40;
      const hexW = hexSize * Math.sqrt(3);
      const hexH = hexSize * 1.5;
      const pulseAlpha = 0.015 + 0.01 * Math.sin(t * 0.5);
      ctx.strokeStyle = `rgba(14,168,155,${pulseAlpha})`;
      ctx.lineWidth = 0.5;
      for (let row = -1; row * hexH < H + hexH; row++) {
        for (let col = -1; col * hexW < W + hexW; col++) {
          const cx = col * hexW + (row % 2 === 0 ? 0 : hexW / 2);
          const cy = row * hexH;
          const distFromMouse = Math.hypot(cx / W - mx, cy / H - my);
          const localAlpha = Math.max(0, 0.04 - distFromMouse * 0.08);
          if (localAlpha > 0.005) {
            ctx.strokeStyle = `rgba(14,168,155,${localAlpha})`;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i + Math.PI / 6;
              const px = cx + hexSize * 0.45 * Math.cos(a);
              const py = cy + hexSize * 0.45 * Math.sin(a);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      }

      // Layer 3: Particle constellation network
      particles.forEach(p => {
        p.x += p.vx + Math.sin(t * 0.3 + p.phase) * 0.0002;
        p.y += p.vy + Math.cos(t * 0.25 + p.phase * 1.3) * 0.0002;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;

        const px = p.x * W + (mx - 0.5) * 15;
        const py = p.y * H + (my - 0.5) * 10;
        const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(t * 1.2 + p.phase));

        // Glow
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 5);
        glowGrad.addColorStop(0, `rgba(45,212,191,${alpha * 0.4})`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(14,168,155,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();

        (p as any)._px = px;
        (p as any)._py = py;
      });

      // Connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i] as any;
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j] as any;
          const dist = Math.hypot(p2._px - p1._px, p2._py - p1._py);
          if (dist < 120) {
            const lineAlpha = 0.12 * (1 - dist / 120);
            ctx.strokeStyle = `rgba(14,168,155,${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p1._px, p1._py);
            ctx.lineTo(p2._px, p2._py);
            ctx.stroke();
          }
        }
      }

      // Layer 4: Sweeping light beam (subtle, horizontal)
      const beamY = ((Math.sin(t * 0.12) + 1) / 2) * H;
      const beamGrad = ctx.createLinearGradient(0, beamY - 60, 0, beamY + 60);
      beamGrad.addColorStop(0, "transparent");
      beamGrad.addColorStop(0.5, "rgba(45,212,191,0.025)");
      beamGrad.addColorStop(1, "transparent");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, beamY - 60, W, 120);

      // Layer 5: Mouse glow
      const mouseGrad = ctx.createRadialGradient(mx * W, my * H, 0, mx * W, my * H, 150);
      mouseGrad.addColorStop(0, "rgba(45,212,191,0.06)");
      mouseGrad.addColorStop(1, "transparent");
      ctx.fillStyle = mouseGrad;
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

/* ─── 3D tilt card ───────────────────────────────────────── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glowX: 50, glowY: 50 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({
      rx: (py - 0.5) * -10,
      ry: (px - 0.5) * 10,
      glowX: px * 100,
      glowY: py * 100,
    });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0, glowX: 50, glowY: 50 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(45,212,191,0.12), transparent 50%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ─── Animated wordmark v2 ───────────────────────────────── */
function AnimatedWordmark() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t); }, []);
  return (
    <div className={`flex items-center gap-2.5 mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
      <div className="relative">
        <img src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png" alt="Concentrix"
          className="w-9 h-9 rounded-xl object-contain relative z-10"
          style={{ filter: "drop-shadow(0 0 8px rgba(45,212,191,0.35))" }} />
        <div className="absolute inset-0 rounded-xl bg-teal-400/15 animate-ping" style={{ animationDuration: "2.5s" }} />
      </div>
      <div>
        <div className="flex items-center gap-1">
          {"Concentrix".split("").map((ch, i) => (
            <span key={i} className="font-barlow-condensed font-bold text-navy-800 text-sm inline-block"
              style={{ animationDelay: `${i * 40}ms`, animation: visible ? `fadeInUp 0.4s ease ${i * 40}ms both` : "none" }}>
              {ch}
            </span>
          ))}
          <span className="text-gray-300 mx-1 text-sm">&middot;</span>
          <span className="font-barlow-condensed font-bold text-teal-600 text-sm tracking-wide" style={{ animation: visible ? "fadeInUp 0.4s ease 500ms both" : "none" }}>EEC</span>
        </div>
        <div className={`h-[2px] rounded-full mt-0.5 transition-all duration-1000 ${visible ? "w-full" : "w-0"}`}
          style={{ background: "linear-gradient(90deg,#0ea89b,#2dd4bf,transparent)", transitionDelay: "600ms" }} />
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
    <div
      className="mt-6 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container with glass effect */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white/80 via-slate-50/50 to-white/90 backdrop-blur-sm p-5 shadow-xl shadow-slate-200/50">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Stakeholder Groups</span>
          </div>
          <div className="flex gap-1.5">
            {STAKEHOLDER_GROUPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveGroup(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === activeGroup ? "w-5 bg-teal-500" : "w-1 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stakeholder grid - all visible with highlighted active */}
        <div className="grid grid-cols-4 gap-3 relative">
          {STAKEHOLDER_GROUPS.map((group, idx) => {
            const Icon = group.icon;
            const isActive = idx === activeGroup;
            const delay = idx * 100;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: delay / 1000, duration: 0.4 }}
                onClick={() => setActiveGroup(idx)}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isActive ? "scale-105 z-10" : "scale-100 opacity-60 hover:opacity-100"
                }`}
              >
                {/* Card */}
                <div
                  className={`relative rounded-xl p-3 border transition-all duration-300 overflow-hidden ${
                    isActive
                      ? `bg-gradient-to-br ${group.color} border-transparent shadow-lg ${group.shadowColor}`
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  {/* Animated background pattern for active card */}
                  {isActive && (
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Animated particles */}
                      {[...Array(8)].map((_, pIdx) => (
                        <motion.div
                          key={pIdx}
                          className="absolute w-1 h-1 rounded-full bg-white/40"
                          initial={{ x: Math.random() * 100, y: 100 }}
                          animate={{
                            y: -20,
                            x: Math.random() * 100,
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            delay: pIdx * 0.15,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{ left: `${Math.random() * 100}%` }}
                        />
                      ))}
                      {/* Pulsing ring */}
                      <motion.div
                        className="absolute inset-0 border-2 border-white/20 rounded-xl"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  )}

                  {/* Icon with animation */}
                  <div className={`relative flex items-center justify-center mb-2 ${isActive ? "text-white" : "text-slate-600"}`}>
                    <motion.div
                      animate={isActive ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>

                    {/* Glow effect for active */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)`,
                        }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <p className={`text-[10px] font-semibold text-center truncate transition-colors duration-300 ${
                    isActive ? "text-white" : "text-slate-600"
                  }`}>
                    {group.label}
                  </p>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                      initial={{ width: 0 }}
                      animate={{ width: 24 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="h-1 rounded-full bg-white/60" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Active group detail panel */}
        <motion.div
          key={activeGroup}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-4 pt-4 border-t border-slate-200"
        >
          <div className="flex items-start gap-4">
            {/* Large animated icon */}
            <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${STAKEHOLDER_GROUPS[activeGroup].color} shadow-lg ${STAKEHOLDER_GROUPS[activeGroup].shadowColor}`}>
              {React.createElement(STAKEHOLDER_GROUPS[activeGroup].icon, { className: "w-7 h-7 text-white" })}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-white/30"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            {/* Details */}
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 text-sm">
                {STAKEHOLDER_GROUPS[activeGroup].label}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {STAKEHOLDER_GROUPS[activeGroup].description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {STAKEHOLDER_GROUPS[activeGroup].roles.map((role, rIdx) => (
                  <motion.span
                    key={role}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rIdx * 0.1 }}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      activeGroup === 0
                        ? "bg-blue-100 text-blue-700"
                        : activeGroup === 1
                        ? "bg-teal-100 text-teal-700"
                        : activeGroup === 2
                        ? "bg-amber-100 text-amber-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {role}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Animated arrow */}
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Progress bar */}
        <div className="mt-4 h-1 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${STAKEHOLDER_GROUPS[activeGroup].color}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "linear" }}
            key={activeGroup}
          />
        </div>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 opacity-60 blur-lg"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 opacity-40 blur-lg"
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}

/* ─── Floating feature cards ─────────────────────────────── */
function FloatingFeatureCards() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div className="grid grid-cols-3 gap-2.5 mt-5">
      {TRUST_FEATURES.map(({ icon: Icon, text }, i) => (
        <TiltCard
          key={i}
          className={`rounded-xl border border-teal-400/15 bg-white/60 backdrop-blur-md p-3 cursor-default transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div style={{ transitionDelay: `${500 + i * 120}ms` }} className="transition-all duration-500">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/15 to-cyan-500/5 border border-teal-400/20 flex items-center justify-center mb-2">
              <Icon className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-[10px] font-medium text-slate-600 leading-tight block">{text}</span>
          </div>
        </TiltCard>
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
        className="hidden lg:flex flex-col w-[58%] relative overflow-hidden select-none"
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
        <div className="relative z-10 flex flex-col h-full px-12 pt-8 pb-8">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              {/* Concentrix logo */}
              <img
                src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png"
                alt="Concentrix"
                className="w-11 h-11 rounded-xl object-contain shadow-lg"
                style={{ background: "rgba(255,255,255,0.04)", padding: "4px" }}
              />
              <div>
                <div className="text-white font-semibold text-sm tracking-wide">Concentrix</div>
                <div className="text-teal-400/70 text-[10px] tracking-[0.2em] uppercase">Internal Platform</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-400/60 text-[9px] uppercase tracking-widest">All systems operational</span>
              <LiveClock />
            </div>
          </div>

          {/* Hero */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/[0.07] px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-300 text-[10px] uppercase tracking-[0.3em] font-semibold">{greeting}</span>
            </div>

            <h1 className="font-barlow-condensed font-black text-white mb-2"
              style={{ fontSize: "clamp(2.6rem,4.2vw,3.6rem)", lineHeight: "1.05" }}>
              Employee Exit
            </h1>
            <h1 className="font-barlow-condensed font-black text-white"
              style={{ fontSize: "clamp(2.6rem,4.2vw,3.6rem)", lineHeight: "1.05" }}>
              Command <TypewriterWord />
            </h1>
          </div>

          {/* Description — always visible */}
          <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-8">
            The central hub for managing attrition cases, tracking at-risk trainees, and coordinating with People Solutions.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mb-10">
            {TRUST_FEATURES.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 hover:bg-white/[0.07] hover:border-teal-400/30 transition-all duration-200"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-400/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <span className="text-white/85 text-sm font-medium">{text}</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400/50" />
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-auto">
            <StatPill label="Cases" target={2400} suffix="+" />
            <div className="w-px h-10 bg-white/10" />
            <StatPill label="Uptime" target={99} suffix=".2%" />
            <div className="w-px h-10 bg-white/10" />
            <StatPill label="Response" target={2} suffix="min" />
          </div>

          {/* Bottom section */}
          <div className="mt-8 pt-5 border-t border-white/[0.07]">
            <RotatingTip />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
                  <svg className="w-3 h-3 text-teal-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.058-.52-3.997-1.44-5.691" />
                  </svg>
                  <span className="text-white/50 text-[9px] font-medium tracking-wide">ISO 27001</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
                  <svg className="w-3 h-3 text-teal-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-white/50 text-[9px] font-medium tracking-wide">Azure AD Protected</span>
                </div>
              </div>
              <span className="text-white/30 text-[9px]">Concentrix &copy; 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] relative overflow-hidden">

        {/* Aurora canvas background */}
        <AuroraCanvas />

        {/* Mobile hero */}
        <div className="lg:hidden px-6 py-8 text-center relative z-10" style={{ background: "#020d18" }}>
          <img src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png" alt="Concentrix" className="w-12 h-12 rounded-2xl mx-auto mb-3 object-contain" />
          <h1 className="font-barlow-condensed text-2xl font-bold text-white">Employee Exit Command Center</h1>
          <p className="text-teal-300/60 text-xs mt-1">{greeting}</p>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-8 sm:px-12 lg:px-16 py-12">
          <div
            className={`w-full max-w-[400px] transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Animated wordmark */}
            <AnimatedWordmark />

            <h2 className="font-barlow-condensed text-[2.1rem] font-bold text-navy-900 leading-tight">
              Where Every Case Finds Its Resolution
            </h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Unite intelligence, streamline operations, and transform attrition challenges into opportunities. Your strategic command awaits.
            </p>

            {/* Microsoft sign-in button with advanced hover */}
            <div className="mt-7">
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
                <p className="text-center text-[11px] text-gray-400 mt-3">
                  Press <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[10px]">Enter</kbd> to continue
                </p>
              )}
              {authState === "blocked" && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span>Sign-in was cancelled.</span>
                  <button onClick={handleLogin} className="font-semibold underline">Try again</button>
                </div>
              )}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200/70" />
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Azure AD SSO</span>
              <div className="flex-1 h-px bg-gray-200/70" />
            </div>

            {/* Floating feature cards with 3D tilt */}
            <FloatingFeatureCards />

            {/* Ultra-creative animated stakeholders */}
            <AnimatedStakeholderShowcase />
          </div>
        </div>

        <p className="relative text-center text-[11px] text-gray-400 pb-6">
          &copy; {new Date().getFullYear()} Concentrix &middot; Secured by Concentrix IT
        </p>
      </div>

      <style>{`
        @keyframes ripple {
          0% { width: 0; height: 0; opacity: 0.3; }
          100% { width: 320px; height: 320px; opacity: 0; }
        }
        .animate-ripple { animation: ripple 0.5s ease-out forwards; }
        @keyframes sheen-slide {
          0% { transform: translateX(-200%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        .ms-btn:hover .ms-btn-sheen { animation: sheen-slide 0.65s ease forwards; }
        @keyframes border-glow {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .ms-btn-idle:hover { box-shadow: 0 0 0 2px rgba(45,212,191,0.45), 0 10px 40px rgba(14,168,155,0.25); }
        .ms-btn-idle { transition: box-shadow 0.25s ease, transform 0.15s ease, background 0.2s ease; }
        .ms-btn-idle:hover { transform: translateY(-1px); }
        .ms-btn-idle:active { transform: translateY(0) scale(0.985); }
      `}</style>
    </div>
  );
}
