import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Mail, Briefcase, Building2, User, MapPin, Shield, Sparkles, GitBranch, Clock, Fingerprint, Layers, CalendarDays, ChevronRight, KeyRound, Lock, Unlock, Copy, CircleCheck as CheckCircle2, Phone, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

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
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* Header with creative wording */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
            <div className="flex items-center gap-2 mb-1">
              <User className="w-5 h-5" style={{ color: "#00C4B4" }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#00C4B4" }}>
                Your Identity & Access
              </span>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#0D2B45", letterSpacing: "0.02em" }}>
              MY PROFILE
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Hello, <span className="font-semibold" style={{ color: "#0D2B45" }}>{user.displayName?.split(" ")[0] || "User"}</span> – you're in charge here.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hero Card */}
      <ProfileHero user={user} initials={initials} roleColor={roleColor} roleLabel={roleLabel} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <DetailsCard user={user} onCopy={handleCopy} copied={copied} />
          <ManagerChain userProfile={user} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <QuickStatsCard user={user} />
          <AccessCard user={user} />
          <LastLoginCard user={user} />
        </div>
      </div>
    </div>
  );
}

/* ─── Hero Card with Avatar ─────────────────────────────────── */
function ProfileHero({ user, initials, roleColor, roleLabel }: {
  user: any; initials: string; roleColor: string; roleLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-3xl overflow-hidden shadow-lg"
      style={{ border: "1px solid rgba(0,196,180,0.2)" }}
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${roleColor}`} />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15), transparent 50%)",
        }}
      />

      <div className="relative px-8 py-10 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar with pulse ring */}
        <div className="relative shrink-0">
          <style>{`
            @keyframes avatar-pulse {
              0%, 100% { transform: scale(1); opacity: 0.4; }
              50% { transform: scale(1.1); opacity: 0.2; }
            }
          `}</style>
          <div
            className="absolute -inset-2 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.1)",
              animation: "avatar-pulse 2s ease-in-out infinite",
            }}
          />
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold">
                {initials}
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#00C4B4", border: "4px solid #0D2B45" }}>
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center md:text-left">
          <h2 className="text-3xl font-bold text-white tracking-tight">{user.displayName}</h2>
          <p className="text-white/70 mt-1 font-medium text-lg">{user.jobTitle}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
            <span className="flex items-center gap-1.5 text-white/60 text-sm">
              <Mail className="w-4 h-4" />
              {user.email}
            </span>
            {user.department && (
              <span className="flex items-center gap-1.5 text-white/60 text-sm">
                <Building2 className="w-4 h-4" />
                {user.department}
              </span>
            )}
            {user.officeLocation && (
              <span className="flex items-center gap-1.5 text-white/60 text-sm">
                <MapPin className="w-4 h-4" />
                {user.officeLocation}
              </span>
            )}
          </div>
        </div>

        {/* Role badge */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
            <KeyRound className="w-4 h-4 text-white/80" />
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Role</p>
              <p className="text-sm font-semibold text-white">{roleLabel}</p>
            </div>
          </div>
        </div>
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
      transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <User className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "#0D2B45" }}>
          Personal Information
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map((f) => (
            <DetailField
              key={f.key}
              icon={f.icon}
              label={f.label}
              value={f.value}
              mono={f.mono}
              copyable={f.copyable}
              onCopy={() => f.copyable && f.value && onCopy(f.value, f.key)}
              copied={copied === f.key}
            />
          ))}
        </div>

        {/* Supervisor accounts */}
        {user.supervisorAccounts && user.supervisorAccounts.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: "#64748B" }}>
              <Layers className="w-4 h-4" />
              Assigned Accounts
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.supervisorAccounts.map((acc: any, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium border" style={{ background: "rgba(0,196,180,0.08)", color: "#00C4B4", borderColor: "rgba(0,196,180,0.2)" }}>
                  {acc.accountName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DetailField({ icon: Icon, label, value, mono, copyable, onCopy, copied }: {
  icon: any; label: string; value?: string; mono?: boolean; copyable?: boolean;
  onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 group">
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
            <button
              onClick={onCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: copied ? "#22C55E" : "#94A3B8" }}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
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
      transition={{ delay: 0.15, duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: "#0D2B45" }}>At a Glance</h3>
      </div>
      <div className="p-4 space-y-3">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ background: "rgba(0,0,0,0.02)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "#94A3B8" }}>{s.label}</p>
              <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>{s.value}</p>
            </div>
          </div>
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
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <KeyRound className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: "#0D2B45" }}>Access Permissions</h3>
      </div>
      <div className="p-4 space-y-2">
        {permissions.map((perm, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <span className="text-sm" style={{ color: "#374151" }}>{perm.label}</span>
            {perm.granted ? (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                <Unlock className="w-3 h-3" />
                Granted
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(100,116,139,0.1)", color: "#94A3B8" }}>
                <Lock className="w-3 h-3" />
                Restricted
              </span>
            )}
          </div>
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
      transition={{ delay: 0.25, duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: "#00C4B4" }} />
        <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: "#0D2B45" }}>Session Info</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,196,180,0.05)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,196,180,0.15)" }}>
            <CalendarDays className="w-4 h-4" style={{ color: "#00C4B4" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#94A3B8" }}>Last Login</p>
            <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
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
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm"
    >
      <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: "#0D2B45" }}>
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
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)", border: "1px solid rgba(0,196,180,0.3)" }}>
                    <ChevronRight size={10} style={{ color: "#00C4B4" }} className="sm:rotate-90" />
                  </div>
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
    <div className={`flex-1 min-w-0 rounded-xl border p-4 transition-all hover:shadow-md ${person.isYou ? "border-teal-200" : "border-gray-100"}`} style={{ background: col.bg }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: `0 0 0 2px ${col.ring}` }}>
          {person.data.photoUrl ? (
            <img src={person.data.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(135deg, #0D2B45, #1E3A5F)" }}>
              {initials}
            </div>
          )}
        </div>
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
    </div>
  );
}
