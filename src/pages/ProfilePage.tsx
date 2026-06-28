import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Mail, Briefcase, Building2, User, MapPin, Shield, Sparkles, GitBranch, Clock, Fingerprint, Layers, CalendarDays, ChevronRight, KeyRound, Lock, Clock as Unlock, Copy, CircleCheck as CheckCircle2, Phone, ArrowLeft, TrendingUp, Activity, FolderOpen, Eye, Zap } from "lucide-react";
import { motion } from "framer-motion";

// Mock statistics data
const USER_STATS = {
  casesSubmitted: 47,
  casesResolved: 42,
  avgResponseTime: "2.3h",
  slaCompliance: 94,
};

const RECENT_ACTIVITY = [
  { id: 1, type: "case_created", message: "Created case #EEC-2024-0089", time: "5 minutes ago", icon: FolderOpen },
  { id: 2, type: "case_updated", message: "Updated status for #EEC-2024-0085", time: "1 hour ago", icon: Activity },
  { id: 3, type: "escalation", message: "Escalated #EEC-2024-0072 to PS", time: "3 hours ago", icon: Zap },
  { id: 4, type: "viewed", message: "Viewed trainee profile for John D.", time: "Yesterday", icon: Eye },
  { id: 5, type: "case_resolved", message: "Marked #EEC-2024-0080 as Resolved", time: "Yesterday", icon: CheckCircle2 },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated gradient background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const orbs: { x: number; y: number; radius: number; vx: number; vy: number; color: string }[] = [
      { x: canvas.offsetWidth * 0.2, y: canvas.offsetHeight * 0.3, radius: 150, vx: 0.3, vy: 0.2, color: "0,196,180" },
      { x: canvas.offsetWidth * 0.8, y: canvas.offsetHeight * 0.7, radius: 200, vx: -0.2, vy: 0.3, color: "13,43,69" },
      { x: canvas.offsetWidth * 0.5, y: canvas.offsetHeight * 0.5, radius: 180, vx: 0.2, vy: -0.2, color: "37,99,235" },
    ];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      orbs.forEach(orb => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < 0 || orb.x > canvas.offsetWidth) orb.vx *= -1;
        if (orb.y < 0 || orb.y > canvas.offsetHeight) orb.vy *= -1;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        gradient.addColorStop(0, `rgba(${orb.color},0.15)`);
        gradient.addColorStop(0.5, `rgba(${orb.color},0.05)`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 animate-pulse mb-4" />
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const initials = user.firstName?.[0]
    ? (user.firstName[0] + (user.lastName?.[0] || "")).toUpperCase()
    : user.displayName?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const roleColor = user.role === "PS" ? "from-teal-500 to-emerald-600" :
    user.role === "SrManager" ? "from-amber-500 to-orange-600" :
    user.role === "Manager" ? "from-blue-500 to-indigo-600" :
    user.role === "Supervisor" ? "from-violet-500 to-purple-600" :
    "from-slate-600 to-slate-800";

  const roleLabel = user.role === "PS" ? "People Solutions" :
    user.role === "SrManager" ? "Senior Manager" :
    user.role === "TA" ? "Talent Acquisition" :
    user.role;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6 relative">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }} />

      {/* Header with creative wording */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium mb-4 transition-colors hover:opacity-80"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <motion.div
              className="flex items-center gap-2 mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #00C4B4, #0D2B45)" }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <User className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#00C4B4" }}>
                Your Identity & Access
              </span>
            </motion.div>
            <motion.h1
              className="text-3xl font-bold"
              style={{ color: "#0D2B45", letterSpacing: "0.02em" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              MY PROFILE
            </motion.h1>
            <motion.p
              className="text-sm mt-1"
              style={{ color: "#64748B" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Hello, <span className="font-semibold" style={{ color: "#0D2B45" }}>{user.displayName?.split(" ")[0] || "User"}</span> — your hub for everything you.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Ultra-Creative Hero Card with Enhanced Glassmorphism */}
      <ProfileHero user={user} initials={initials} roleColor={roleColor} roleLabel={roleLabel} />

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "#00C4B4" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Your Statistics</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FolderOpen}
            label="Cases Submitted"
            value={USER_STATS.casesSubmitted}
            color="#2563EB"
            delay={0.25}
          />
          <StatCard
            icon={CheckCircle2}
            label="Cases Resolved"
            value={USER_STATS.casesResolved}
            color="#22C55E"
            delay={0.3}
          />
          <StatCard
            icon={Clock}
            label="Avg Response"
            value={USER_STATS.avgResponseTime}
            color="#F59E0B"
            delay={0.35}
          />
          <StatCard
            icon={Zap}
            label="SLA Compliance"
            value={`${USER_STATS.slaCompliance}%`}
            color="#00C4B4"
            delay={0.4}
          />
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <DetailsCard user={user} onCopy={handleCopy} copied={copied} />
          <RecentActivityCard />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <QuickStatsCard user={user} />
          <AccessCard user={user} />
          <LastLoginCard user={user} />
        </div>
      </div>

      {/* Manager Chain */}
      <div className="relative z-10">
        <ManagerChain userProfile={user} />
      </div>
    </div>
  );
}

/* ─── Hero Card with Avatar - ULTRA PREMIUM ───────────────────────────── */
function ProfileHero({ user, initials, roleColor, roleLabel }: {
  user: any; initials: string; roleColor: string; roleLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden z-10"
      style={{
        border: "1px solid rgba(0,196,180,0.25)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,196,180,0.1) inset",
      }}
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${roleColor}`} />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.25), transparent 60%)",
        }}
      />

      {/* Constellation particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 2 + Math.random() * 4,
              height: 2 + Math.random() * 4,
              background: "rgba(255,255,255,0.3)",
            }}
            animate={{
              y: [0, -30 - Math.random() * 20, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Morphing blob background */}
      <motion.div
        className="absolute -right-32 -top-32 w-80 h-80 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 45, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative px-8 py-12 flex flex-col md:flex-row items-center gap-8">
        {/* Avatar with multi-layer glowing ring */}
        <div className="relative shrink-0">
          {/* Outermost glow ring */}
          <motion.div
            className="absolute -inset-6 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, rgba(0,196,180,0.5), transparent 20%, rgba(255,255,255,0.3), transparent 40%, rgba(0,196,180,0.5), transparent 60%, rgba(255,255,255,0.3), transparent 80%, rgba(0,196,180,0.5))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle rotating ring */}
          <motion.div
            className="absolute -inset-4 rounded-full"
            style={{
              background: "conic-gradient(from 90deg, transparent, rgba(255,255,255,0.4), transparent, rgba(0,196,180,0.4), transparent)",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner pulse ring */}
          <motion.div
            className="absolute -inset-2 rounded-full bg-white/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          {/* Avatar container */}
          <motion.div
            className="relative w-36 h-36 rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 0 60px rgba(0,196,180,0.4), 0 0 100px rgba(0,196,180,0.2), inset 0 0 30px rgba(255,255,255,0.15)",
              border: "4px solid rgba(255,255,255,0.25)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))",
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-5xl font-black text-white drop-shadow-lg">{initials}</span>
              </div>
            )}
          </motion.div>

          {/* Verified badge */}
          <motion.div
            className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #00C4B4, #0D2B45)",
              border: "4px solid white",
              boxShadow: "0 4px 15px rgba(0,196,180,0.5)",
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          {/* Animated gradient name */}
          <motion.h2
            className="text-4xl font-black text-white tracking-tight relative"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #00E6D4 50%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              backgroundSize: "200% 200%",
            }}>
              {user.displayName}
            </span>
          </motion.h2>

          <motion.p
            className="text-white/80 mt-2 font-semibold text-xl"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            {user.jobTitle}
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {[
              { icon: Mail, value: user.email },
              { icon: Building2, value: user.department },
              { icon: MapPin, value: user.officeLocation },
            ].filter(item => item.value).map((item, i) => (
              <motion.span
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                  color: "rgba(255,255,255,0.85)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.value}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Role badge */}
        <motion.div
          className="flex flex-col gap-2 shrink-0"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              }}
              animate={{ x: ["-150%", "150%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
            />
            <KeyRound className="w-5 h-5 text-white/80 relative z-10" />
            <div className="relative z-10">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Role</p>
              <p className="text-base font-bold text-white">{roleLabel}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Statistics Card ────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, delay }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl p-5 border relative overflow-hidden group"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle at center, ${color}10, transparent)` }}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
          <motion.p
            className="text-2xl font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.1 }}
          >
            {value}
          </motion.p>
        </div>
        <motion.div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}
          whileHover={{ rotate: [0, -10, 10, 0] }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Recent Activity Card ───────────────────────────────── */
function RecentActivityCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
        <Activity className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>Recent Activity</h3>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(0,196,180,0.1)", color: "#00C4B4" }}>
          {RECENT_ACTIVITY.length} actions
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(0,196,180,0.05)" }}>
        {RECENT_ACTIVITY.map((activity, idx) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.05, duration: 0.3 }}
              className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
            >
              <motion.div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(0,196,180,0.1)" }}
                whileHover={{ scale: 1.1 }}
              >
                <Icon className="w-4 h-4" style={{ color: "#00C4B4" }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>{activity.message}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{activity.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Details Card ───────────────────────────────────────── */
function DetailsCard({ user, onCopy, copied }: { user: any; onCopy: (text: string, label: string) => void; copied: string | null }) {
  const fields = [
    { icon: User, label: "First Name", value: user.firstName, key: "firstName" },
    { icon: User, label: "Last Name", value: user.lastName, key: "lastName" },
    { icon: Mail, label: "Email", value: user.email, key: "email", mono: true, copyable: true },
    { icon: Fingerprint, label: "Azure AD ID", value: user.id, key: "id", mono: true, copyable: true },
    { icon: Briefcase, label: "Job Title", value: user.jobTitle, key: "jobTitle" },
    { icon: Building2, label: "Department", value: user.department, key: "department" },
    { icon: MapPin, label: "Office Location", value: user.officeLocation, key: "officeLocation" },
    { icon: Phone, label: "Phone", value: user.mobilePhone || user.businessPhones?.[0], key: "phone", copyable: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
        <User className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "#0D2B45" }}>
          Personal Information
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map((f, idx) => (
            <DetailField
              key={f.key}
              icon={f.icon}
              label={f.label}
              value={f.value}
              mono={f.mono}
              copyable={f.copyable}
              onCopy={() => f.copyable && f.value && onCopy(f.value, f.key)}
              copied={copied === f.key}
              delay={idx * 0.05}
            />
          ))}
        </div>

        {/* Supervisor accounts */}
        {user.supervisorAccounts && user.supervisorAccounts.length > 0 && (
          <div className="mt-5 pt-4 border-t" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: "#64748B" }}>
              <Layers className="w-4 h-4" />
              Assigned Accounts
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.supervisorAccounts.map((acc: any, i: number) => (
                <motion.span
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border"
                  style={{ background: "rgba(0,196,180,0.08)", color: "#00C4B4", borderColor: "rgba(0,196,180,0.2)" }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {acc.accountName}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DetailField({ icon: Icon, label, value, mono, copyable, onCopy, copied, delay }: {
  icon: any; label: string; value?: string; mono?: boolean; copyable?: boolean;
  onCopy?: () => void; copied?: boolean; delay?: number;
}) {
  return (
    <motion.div
      className="flex items-start gap-3 group"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay || 0, duration: 0.3 }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: "#94A3B8" }}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-xs uppercase tracking-wide" style={{ color: "#94A3B8" }}>{label}</span>
        <div className="flex items-center gap-2">
          <p className={`text-sm mt-0.5 truncate ${mono ? "font-mono text-xs" : "font-medium"}`} style={{ color: "#0D2B45" }}>
            {value || "—"}
          </p>
          {copyable && value && (
            <motion.button
              onClick={onCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: copied ? "#22C55E" : "#94A3B8" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Quick Stats Card ────────────────────────────────── */
function QuickStatsCard({ user }: { user: any }) {
  const directReportCount = user.directReports?.length || 0;
  const managerChainDepth = (user.manager1 ? 1 : 0) + (user.manager2 ? 1 : 0);

  const stats = [
    { icon: Shield, label: "Access Level", value: user.role, color: "#00C4B4" },
    { icon: GitBranch, label: "Reporting", value: `${managerChainDepth} level${managerChainDepth !== 1 ? "s" : ""}`, color: "#2563EB" },
    { icon: User, label: "Direct Reports", value: directReportCount.toString(), color: "#F59E0B" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
        <Sparkles className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: "#0D2B45" }}>At a Glance</h3>
      </div>
      <div className="p-4 space-y-3">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
            style={{ background: "rgba(0,0,0,0.02)" }}
            whileHover={{ scale: 1.02, x: 4 }}
          >
            <motion.div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${s.color}15` }}
              whileHover={{ rotate: [0, -10, 10, 0] }}
            >
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "#94A3B8" }}>{s.label}</p>
              <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Access Card ────────────────────────────────────────── */
function AccessCard({ user }: { user: any }) {
  const permissions = [
    { label: "View Cases", granted: true },
    { label: "Submit Cases", granted: true },
    { label: "View All Cases", granted: user.role === "PS" || user.role === "SrManager" || user.role === "Admin" },
    { label: "Approve Terminations", granted: user.role === "PS" || user.role === "SrManager" || user.role === "Admin" },
    { label: "Manage Relocations", granted: user.role === "PS" || user.role === "TA" || user.role === "SrManager" || user.role === "Admin" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
        <KeyRound className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: "#0D2B45" }}>Access Permissions</h3>
      </div>
      <div className="p-4 space-y-2">
        {permissions.map((perm, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between py-1.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
          >
            <span className="text-sm" style={{ color: "#374151" }}>{perm.label}</span>
            {perm.granted ? (
              <motion.span
                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 + i * 0.05 }}
              >
                <Unlock className="w-3 h-3" />
                Granted
              </motion.span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(100,116,139,0.1)", color: "#94A3B8" }}>
                <Lock className="w-3 h-3" />
                Restricted
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Last Login Card ───────────────────────────────────── */
function LastLoginCard({ user }: { user: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
        <Clock className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: "#0D2B45" }}>Session Info</h3>
      </div>
      <div className="p-4">
        <motion.div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "rgba(0,196,180,0.05)" }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,196,180,0.15)" }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <CalendarDays className="w-4 h-4" style={{ color: "#00C4B4" }} />
          </motion.div>
          <div>
            <p className="text-xs" style={{ color: "#94A3B8" }}>Last Login</p>
            <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Manager Chain ──────────────────────────────────────── */
function ManagerChain({ userProfile }: { userProfile: any }) {
  const people = [
    { label: "You", data: { displayName: userProfile.displayName, email: userProfile.email, jobTitle: userProfile.jobTitle, photoUrl: userProfile.photoUrl, department: userProfile.department }, isYou: true },
    ...(userProfile.manager1 ? [{ label: "Direct Manager", data: userProfile.manager1, isYou: false }] : []),
    ...(userProfile.manager2 ? [{ label: "Senior Manager", data: userProfile.manager2, isYou: false }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-2xl overflow-hidden border"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0D2B45, #1E3A5F)" }}>
        <div className="flex items-center gap-2">
          <GitBranch size={15} style={{ color: "#00C4B4" }} />
          <h3 className="text-white font-semibold text-sm tracking-wide">Reporting Line</h3>
        </div>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{people.length - 1} level{people.length !== 2 ? "s" : ""} up</span>
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-0">
          {people.map((person, i) => (
            <React.Fragment key={i}>
              <PersonCard person={person} levelIndex={i} total={people.length} />
              {i < people.length - 1 && (
                <div className="flex sm:flex-col items-center justify-center px-2 py-2 sm:py-0 sm:px-0 sm:pt-8">
                  <div className="hidden sm:block w-px h-4" style={{ background: "linear-gradient(to bottom, rgba(0,196,180,0.4), transparent)" }} />
                  <motion.div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,196,180,0.1)", border: "1px solid rgba(0,196,180,0.3)" }}
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight size={10} style={{ color: "#00C4B4" }} className="sm:rotate-90" />
                  </motion.div>
                  <div className="hidden sm:block text-[8px] uppercase tracking-wider mt-1" style={{ color: "#94A3B8" }}>reports to</div>
                </div>
              )}
            </React.Fragment>
          ))}

          {people.length === 1 && (
            <p className="text-sm italic mt-4 ml-2" style={{ color: "#94A3B8" }}>No manager information found in the directory.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PersonCard({ person, levelIndex, total }: { person: any; levelIndex: number; total: number }) {
  const initials = person.data.displayName?.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2) || "?";
  const levelColors = [
    { ring: "rgba(0,196,180,0.4)", bg: "rgba(0,196,180,0.08)" },
    { ring: "rgba(37,99,235,0.4)", bg: "rgba(37,99,235,0.08)" },
    { ring: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.08)" },
  ];
  const col = levelColors[Math.min(levelIndex, levelColors.length - 1)];

  return (
    <motion.div
      className={`flex-1 min-w-0 rounded-xl border p-4 transition-all hover:shadow-md ${person.isYou ? "border-teal-200" : "border-gray-100"}`}
      style={{ background: col.bg }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + levelIndex * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
          style={{ boxShadow: `0 0 0 2px ${col.ring}` }}
          whileHover={{ rotate: [0, -5, 5, 0] }}
        >
          {person.data.photoUrl ? (
            <img src={person.data.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(135deg, #0D2B45, #1E3A5F)" }}>
              {initials}
            </div>
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate" style={{ color: "#0D2B45" }}>{person.data.displayName}</span>
            {person.isYou && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md" style={{ background: "#00C4B4", color: "white" }}>You</span>
            )}
          </div>
          <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: "#00C4B4" }}>
            {person.data.jobTitle || "No title on record"}
          </p>
          {person.data.email && (
            <p className="text-[10px] font-mono mt-1 truncate" style={{ color: "#94A3B8" }}>{person.data.email}</p>
          )}
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
        <Briefcase className="w-3 h-3" style={{ color: "#94A3B8" }} />
        <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "#94A3B8" }}>{person.label}</span>
      </div>
    </motion.div>
  );
}
