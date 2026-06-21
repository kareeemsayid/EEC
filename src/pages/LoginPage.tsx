import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/useAuth";
import MagneticButton from "../components/MagneticButton";
import { ShieldCheck, Lock, Users, Zap, Activity, Mail, LayoutDashboard } from "lucide-react";

const TRUST_FEATURES = [
  { icon: Activity,        text: "Live attrition case tracking" },
  { icon: Mail,            text: "Outlook thread automation"    },
  { icon: LayoutDashboard, text: "Role-based dashboards"        },
];

const LIVE_STATS = [
  { value: "72",  label: "accounts tracked"  },
  { value: "98%", label: "SLA compliance"     },
  { value: "24/7",label: "case monitoring"    },
];

const ROTATING_STATUSES = [
  "Connecting to Microsoft…",
  "Verifying your account…",
  "Almost there…",
];

// Stage nodes for the lifecycle path illustration
const STAGE_NODES = [
  { cx: 120, cy: 420, label: "MONITORING"  },
  { cx: 400, cy: 170, label: "REVIEW"      },
  { cx: 680, cy: 420, label: "RESOLVED"    },
];

export default function LoginPage() {
  const { login, profileLoading: loading } = useAuth();
  const [mounted, setMounted]         = useState(false);
  const [typedText, setTypedText]     = useState("");
  const [authState, setAuthState]     = useState<"idle"|"authenticating"|"success"|"blocked">("idle");
  const [statusIndex, setStatusIndex] = useState(0);
  const [returningName, setReturningName] = useState<string | null>(null);
  const [cursorPos, setCursorPos]     = useState({ x: 0.5, y: 0.5 });
  const [statIndex, setStatIndex]     = useState(0);
  const navyRef     = useRef<HTMLDivElement>(null);
  const loginStart  = useRef(0);

  const HEADLINE = "Employee Exit Command Center";
  const greeting = getTimeGreeting();

  // Mount flag
  useEffect(() => { setMounted(true); }, []);

  // Typewriter headline
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedText(HEADLINE); return;
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTypedText(HEADLINE.slice(0, i));
      if (i >= HEADLINE.length) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, []);

  // Detect cached MSAL user for "Welcome back" personalisation
  useEffect(() => {
    try {
      const keys: string[] = JSON.parse(sessionStorage.getItem("msal.account.keys") || "[]");
      if (!keys.length) return;
      const acct = JSON.parse(sessionStorage.getItem(keys[0]) || "{}");
      const first = (acct.name || acct.username?.split("@")[0] || "").split(" ")[0];
      if (first) setReturningName(first);
    } catch { /* ignore */ }
  }, []);

  // Rotate status text while popup is open
  useEffect(() => {
    if (authState !== "authenticating") return;
    const t = setInterval(() => setStatusIndex(i => Math.min(i + 1, ROTATING_STATUSES.length - 1)), 1500);
    return () => clearInterval(t);
  }, [authState]);

  // Auto-rotate live stat chip
  useEffect(() => {
    if (!mounted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setStatIndex(i => (i + 1) % LIVE_STATS.length), 3200);
    return () => clearInterval(t);
  }, [mounted]);

  // Mouse parallax on navy panel
  const onNavyMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = navyRef.current?.getBoundingClientRect();
    if (!r) return;
    setCursorPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };

  const px = (cursorPos.x - 0.5) * 18;
  const py = (cursorPos.y - 0.5) * 18;

  // Sign-in handler
  const handleLogin = async () => {
    if (authState === "authenticating") return;
    setAuthState("authenticating");
    setStatusIndex(0);
    loginStart.current = performance.now();
    try {
      await login();
      setAuthState("success");
      setTimeout(() => setAuthState("idle"), 1400);
    } catch (e: any) {
      setAuthState("blocked");
    }
  };

  // Enter key shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Enter" && authState === "idle") { e.preventDefault(); handleLogin(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  return (
    <div className="min-h-screen flex relative overflow-hidden font-inter">

      {/* ════════════════════════════════════════════════════
          NAVY HERO PANEL  (hidden on mobile → stacks top)
          ════════════════════════════════════════════════════ */}
      <div
        ref={navyRef}
        onMouseMove={onNavyMove}
        className={`hidden md:flex flex-col items-center justify-between w-[55%] relative bg-gradient-navy overflow-hidden
          transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
      >
        {/* ── Grain texture ── */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* ── Cursor spotlight ── */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{ background: `radial-gradient(500px circle at ${cursorPos.x*100}% ${cursorPos.y*100}%, rgba(37,226,204,0.10), transparent 65%)` }}
        />

        {/* ── Dot-grid ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(37,226,204,0.55) 1px, transparent 1px)`,
            backgroundSize: "34px 34px",
            opacity: 0.06,
          }}
        />

        {/* ── Glow orbs ── */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] animate-breathing pointer-events-none"
          style={{ top: "15%", left: "10%", transform: `translate(${px*0.35}px,${py*0.35}px)` }}
        />
        <div
          className="absolute w-[360px] h-[360px] rounded-full bg-teal-400/8 blur-[90px] animate-breathing pointer-events-none"
          style={{ animationDelay: "2.5s", bottom: "10%", right: "5%", transform: `translate(${-px*0.25}px,${-py*0.25}px)` }}
        />

        {/* ── Lifecycle SVG illustration ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.45, transform: `translate(${px*0.5}px,${py*0.5}px)` }}
        >
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#25E2CC" stopOpacity="0.05" />
              <stop offset="50%"  stopColor="#25E2CC" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#25E2CC" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d="M120 420 C 260 420, 270 170, 400 170 C 530 170, 540 420, 680 420"
            fill="none" stroke="url(#lg)" strokeWidth="1.8" strokeDasharray="5 7"
          />
          {/* Traveling dot */}
          <circle r="4.5" fill="#25E2CC" opacity="0.9">
            <animateMotion dur="8s" repeatCount="indefinite">
              <mpath href="#lp" />
            </animateMotion>
          </circle>
          <path id="lp" d="M120 420 C 260 420, 270 170, 400 170 C 530 170, 540 420, 680 420" fill="none" stroke="none" />
          {/* Stage nodes */}
          {STAGE_NODES.map((n, i) => (
            <g key={i}>
              <circle cx={n.cx} cy={n.cy} r="8"  fill="#003D5C" stroke="#25E2CC" strokeWidth="2" />
              <circle cx={n.cx} cy={n.cy} r="14" fill="none"    stroke="#25E2CC" strokeWidth="1" opacity="0">
                <animate attributeName="r"       values="14;22;14" dur="3s" begin={`${i*0.9}s`} repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.45;0;0.45" dur="3s" begin={`${i*0.9}s`} repeatCount="indefinite"/>
              </circle>
              <text
                x={n.cx} y={n.cy - 26}
                fill="#25E2CC" fontSize="10" fontFamily="'Space Mono',monospace" textAnchor="middle"
                letterSpacing="2"
              >{n.label}</text>
            </g>
          ))}
        </svg>

        {/* ════ CENTERED CONTENT BLOCK ════ */}
        <div className="relative z-10 flex flex-col items-center text-center w-full h-full px-12 py-10">

          {/* Top: Logo + brand */}
          <div className="flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-glow-teal hover:scale-105 transition-transform">
              <span className="text-white font-barlow-condensed font-bold text-lg tracking-tight">EEC</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm tracking-widest uppercase">Concentrix</p>
              <p className="text-teal-300/60 text-[10px] tracking-[0.22em] uppercase mt-0.5">Trainer Portal</p>
            </div>
          </div>

          {/* Centre: Greeting + Headline + Sub-copy */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-lg">

            {/* Greeting pill */}
            <div
              className="inline-flex items-center gap-2 bg-white/6 border border-teal-400/20 rounded-full px-4 py-1.5 mb-6 animate-fade-in"
              style={{ animationDelay: "150ms" }}
            >
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-200/80 text-xs tracking-wide">
                {greeting}
                {returningName
                  ? <>, <span className="text-teal-300 font-semibold">Welcome back, {returningName}</span></>
                  : null}
              </span>
            </div>

            {/* Headline — typed + gradient last word */}
            <h1
              className="font-barlow-condensed font-bold text-white leading-[1.0] mb-5 typing-cursor min-h-[3.4em]"
              style={{ fontSize: "clamp(2.6rem, 4vw, 3.6rem)" }}
              aria-label={HEADLINE}
            >
              {typedText.split(" ").map((word, i, arr) => {
                const isLast = i === arr.length - 1 && typedText.length === HEADLINE.length;
                return (
                  <React.Fragment key={i}>
                    {isLast
                      ? <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">{word}</span>
                      : word}
                    {i < arr.length - 1 && " "}
                  </React.Fragment>
                );
              })}
            </h1>

            {/* Sub-copy */}
            <p
              className="text-teal-100/70 text-base leading-relaxed max-w-sm animate-fade-in-up"
              style={{ animationDelay: "600ms" }}
            >
              The central hub for managing attrition cases, tracking at-risk trainees, and coordinating with People Solutions.
            </p>

            {/* ── Feature chips (centered row) ── */}
            <div
              className="mt-8 flex flex-col items-center gap-2.5 w-full animate-fade-in-up"
              style={{ animationDelay: "800ms" }}
            >
              {TRUST_FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-3 bg-white/5 border border-teal-400/15 rounded-xl px-5 py-2.5 w-full max-w-xs
                    hover:bg-white/10 hover:border-teal-400/35 hover:shadow-glow-teal transition-all duration-200 group"
                  style={{ animationDelay: `${900 + i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-400/20 flex items-center justify-center shrink-0
                    group-hover:bg-teal-500/30 transition-all">
                    <f.icon className="w-4 h-4 text-teal-400" />
                  </div>
                  <span className="text-sm font-medium text-teal-100/85">{f.text}</span>
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500/50 group-hover:bg-teal-400 transition-colors shrink-0" />
                </div>
              ))}
            </div>

            {/* ── Rotating live-stat glass chip ── */}
            <div
              className="mt-7 glass-card-dark border border-teal-500/20 rounded-2xl px-6 py-3 flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: "1100ms" }}
            >
              <div className="text-center">
                <p className="font-barlow-condensed font-bold text-3xl text-white leading-none">
                  {LIVE_STATS[statIndex].value}
                </p>
                <p className="text-teal-200/60 text-[11px] tracking-wide mt-0.5">
                  {LIVE_STATS[statIndex].label}
                </p>
              </div>
              <div className="w-px h-8 bg-teal-400/20" />
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300/50 font-medium">Live snapshot</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-[11px] text-teal-200/70">Real-time data</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: trust badges + clock + version */}
          <div className="flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-center flex-wrap gap-4">
              <TrustBadge icon={ShieldCheck} label="Azure AD Secured" />
              <TrustBadge icon={Lock}        label="SOC 2-aligned" />
              <TrustBadge icon={Users}       label="72 accounts" />
            </div>
            <div className="flex items-center gap-3 text-teal-300/30 text-[10px]">
              <LiveClock />
              <span className="w-px h-3 bg-teal-400/20" />
              <span className="font-mono">EEC v1.0</span>
            </div>
          </div>

        </div>{/* end centered content */}
      </div>{/* end navy panel */}

      {/* ════════════════════════════════════════════════════
          WHITE SIGN-IN PANEL  (~45%)
          ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-white relative">

        {/* Mobile hero band */}
        <div className="md:hidden bg-gradient-navy px-6 py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-glow-teal mx-auto mb-3">
            <span className="text-white font-barlow-condensed font-bold">EEC</span>
          </div>
          <h1 className="font-barlow-condensed text-2xl font-bold text-white">Employee Exit Command Center</h1>
          <p className="text-teal-300/60 text-xs mt-1">{greeting}</p>
        </div>

        {/* Sign-in content */}
        <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-12 lg:px-16 py-12">
          <div
            className={`w-full max-w-[400px] transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Wordmark */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-800 to-navy-700 flex items-center justify-center">
                <span className="text-teal-400 font-bold text-xs">EEC</span>
              </div>
              <span className="font-barlow-condensed font-semibold text-sm text-navy-800 tracking-wide">
                Concentrix · EEC
              </span>
            </div>

            {/* Heading */}
            <h2 className="font-barlow-condensed text-3xl font-bold text-navy-900 leading-tight">
              {returningName ? `Welcome back, ${returningName}` : "Sign in to your workspace"}
            </h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Use your Concentrix Microsoft account to continue. Authorized trainers only.
            </p>

            {/* Sign-in button */}
            <div className="mt-7 relative">
              <MagneticButton
                onClick={handleLogin}
                disabled={loading || authState === "authenticating" || authState === "success"}
                className={`relative w-full flex items-center justify-center gap-3 text-white font-semibold py-3.5 rounded-xl overflow-hidden
                  transition-all duration-200 sheen-pass conic-border
                  ${authState === "success" ? "bg-teal-600" : "bg-gradient-teal hover:shadow-glow-teal-lg hover:-translate-y-0.5"}
                  disabled:cursor-wait`}
                style={{ minHeight: "52px" }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                {authState === "success" ? (
                  <SuccessCheck />
                ) : authState === "authenticating" ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="relative z-10">{ROTATING_STATUSES[statusIndex]}</span>
                  </>
                ) : (
                  <div className="flex items-center gap-3 relative z-10">
                    <MsLogo />
                    <span>Sign in with Microsoft</span>
                  </div>
                )}
              </MagneticButton>

              {/* Press Enter hint */}
              {authState === "idle" && (
                <p className="text-center text-[11px] text-gray-400 mt-3 animate-fade-in" style={{ animationDelay: "3s" }}>
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[10px]">
                    Enter ↵
                  </kbd>{" "}
                  to continue
                </p>
              )}

              {/* Blocked / popup closed */}
              {authState === "blocked" && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 animate-fade-in">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Popup closed or blocked —</span>
                  <button onClick={handleLogin} className="font-semibold underline">try again</button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-7 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Azure AD SSO</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 p-3.5 bg-canvas border border-gray-200 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-700">Authorized Concentrix trainers only.</p>
                <p className="text-xs text-gray-400 mt-0.5">All actions are audited. Unauthorized use is prohibited.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 pb-6">
          &copy; {new Date().getFullYear()} Concentrix · Secured by Concentrix IT
        </p>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function TrustBadge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-teal-200/50 text-[11px]">
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
}

function MsLogo() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#00a4ef" d="M12 1h10v10H12z" />
      <path fill="#7fba00" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function SuccessCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
      <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.2)" />
      <path
        d="M7 12.5 L10.5 16 L17 9"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="check-path animated"
      />
    </svg>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono">
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}
