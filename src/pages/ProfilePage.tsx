import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ChevronLeft, Mail, Briefcase, Building2, User, MapPin, Shield, Sparkles, GitBranch, Clock, Award, Fingerprint, Layers, Globe, CalendarDays, ChevronRight, KeyRound, Activity, Lock, Clock as Unlock, Copy, CircleCheck as CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "security" | "activity">("overview");
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Your Profile</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            MY PROFILE
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your identity, reporting line, and access within Concentrix</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Hero Card */}
      <ProfileHero user={user} initials={initials} roleColor={roleColor} roleLabel={roleLabel} />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl w-fit">
        {(["overview", "security", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "overview" ? "Overview" : tab === "security" ? "Security" : "Activity"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DetailsCard user={user} onCopy={handleCopy} copied={copied} />
            <ManagerChain userProfile={user} />
          </div>
          <div className="space-y-6">
            <QuickStatsCard user={user} />
            <AccessCard user={user} />
          </div>
        </div>
      )}

      {activeTab === "security" && <SecurityTab user={user} onCopy={handleCopy} copied={copied} />}
      {activeTab === "activity" && <ActivityTab />}
    </div>
  );
}

/* ─── Hero Card ──────────────────────────────────────────── */
function ProfileHero({ user, initials, roleColor, roleLabel }: {
  user: any; initials: string; roleColor: string; roleLabel: string;
}) {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-lg border border-white/20">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${roleColor}`} />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15), transparent 50%)",
          animation: "pulse 4s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />

      <div className="relative px-8 py-10 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl" />
          <div className="relative w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold overflow-hidden ring-4 ring-white/20 shadow-2xl">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center">
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
            <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-white/15 text-white border-white/20 backdrop-blur-sm`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Quick info pills */}
        <div className="flex flex-col gap-2 shrink-0">
          <InfoPill icon={CalendarDays} label="Member Since" value="2023" />
          <InfoPill icon={Activity} label="Status" value="Active" />
          <InfoPill icon={Shield} label="Auth" value="Azure AD" />
        </div>
      </div>
    </div>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
      <Icon className="w-3.5 h-3.5 text-white/60" />
      <div>
        <p className="text-[9px] text-white/40 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-semibold text-white">{value}</p>
      </div>
    </div>
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
    { icon: Globe, label: "Domain", value: user.email?.split("@")[1], key: "domain" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <User className="w-4 h-4 text-teal-600" />
        <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Personal Information</h3>
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
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Assigned Accounts
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.supervisorAccounts.map((acc: any, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium border border-teal-100 hover:bg-teal-100 transition-colors">
                  {acc.accountName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({ icon: Icon, label, value, mono, copyable, onCopy, copied }: {
  icon: any; label: string; value?: string; mono?: boolean; copyable?: boolean;
  onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 group">
      <span className="text-gray-300 mt-0.5 shrink-0 group-hover:text-teal-500 transition-colors">
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <p className={`text-sm mt-0.5 text-gray-800 ${mono ? "font-mono text-xs" : "font-medium"} truncate`}>
            {value || "—"}
          </p>
          {copyable && value && (
            <button
              onClick={onCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-teal-600"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Quick Stats Sidebar ────────────────────────────────── */
function QuickStatsCard({ user }: { user: any }) {
  const directReportCount = user.directReports?.length || 0;
  const managerChainDepth = (user.manager1 ? 1 : 0) + (user.manager2 ? 1 : 0);

  const stats = [
    { icon: Shield, label: "Access Level", value: user.role, color: "text-teal-600", bg: "bg-teal-50", ring: "ring-teal-200" },
    { icon: GitBranch, label: "Reporting Depth", value: `${managerChainDepth} level${managerChainDepth !== 1 ? "s" : ""}`, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" },
    { icon: User, label: "Direct Reports", value: directReportCount.toString(), color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" },
    { icon: Building2, label: "Domain", value: user.email?.split("@")[1]?.split(".")[0] || "concentrix", color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-200" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-teal-600" />
        <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">At a Glance</h3>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-xl border border-gray-100 p-3 hover:border-teal-200 hover:shadow-sm transition-all group ring-1 ${s.ring} ring-opacity-0 hover:ring-opacity-100`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-bold text-gray-800 font-barlow-condensed leading-none">{s.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
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
    { label: "HR Investigations", granted: user.role === "PS" || user.role === "SrManager" || user.role === "Manager" || user.role === "Admin" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-teal-600" />
        <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Access Permissions</h3>
      </div>
      <div className="p-5 space-y-2.5">
        {permissions.map((perm, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-700">{perm.label}</span>
            {perm.granted ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Unlock className="w-3 h-3" />
                Granted
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Restricted
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Manager Chain ──────────────────────────────────────── */
interface ManagerChainPerson {
  label: string;
  data: any;
  isYou: boolean;
}

function ManagerChain({ userProfile }: { userProfile: any }) {
  const people: ManagerChainPerson[] = [
    { label: "You", data: { displayName: userProfile.displayName, email: userProfile.email, jobTitle: userProfile.jobTitle, photoUrl: userProfile.photoUrl, department: userProfile.department }, isYou: true },
    ...(userProfile.manager1 ? [{ label: "Direct Manager", data: userProfile.manager1, isYou: false }] : []),
    ...(userProfile.manager2 ? [{ label: "Senior Manager", data: userProfile.manager2, isYou: false }] : []),
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-teal-400" />
          <h3 className="text-white font-semibold text-sm tracking-wide">Reporting Line</h3>
        </div>
        <span className="text-teal-300/50 text-[10px] uppercase tracking-widest">{people.length - 1} level{people.length !== 2 ? "s" : ""} up</span>
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-0">
          {people.map((person, i) => (
            <React.Fragment key={i}>
              <PersonCard person={person} levelIndex={i} total={people.length} />
              {i < people.length - 1 && (
                <div className="flex sm:flex-col items-center justify-center px-2 py-2 sm:py-0 sm:px-0 sm:pt-8">
                  <div className="hidden sm:block w-px h-4 bg-gradient-to-b from-teal-400/40 to-teal-400/10" />
                  <div className="sm:hidden h-px w-8 bg-gradient-to-r from-teal-400/40 to-teal-400/10" />
                  <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">
                    <ChevronRight size={10} className="text-teal-500 sm:rotate-90" />
                  </div>
                  <div className="hidden sm:block text-[8px] text-gray-400 uppercase tracking-wider mt-1">reports to</div>
                  <div className="hidden sm:block w-px h-4 bg-gradient-to-b from-teal-400/10 to-transparent" />
                </div>
              )}
            </React.Fragment>
          ))}

          {people.length === 1 && (
            <p className="text-gray-400 text-sm italic mt-4 ml-2">No manager information found in the directory.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonCard({ person, levelIndex, total }: { person: ManagerChainPerson; levelIndex: number; total: number }) {
  const initials = person.data.displayName?.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2) || "?";
  const levelColors = [
    { ring: "ring-teal-400/40", badge: "bg-teal-500/15 text-teal-700 border-teal-200", gradient: "from-teal-500 to-teal-700" },
    { ring: "ring-blue-400/40",  badge: "bg-blue-50 text-blue-700 border-blue-200",    gradient: "from-blue-500 to-blue-700" },
    { ring: "ring-amber-400/40", badge: "bg-amber-50 text-amber-700 border-amber-200", gradient: "from-amber-500 to-amber-600" },
  ];
  const col = levelColors[Math.min(levelIndex, levelColors.length - 1)];

  return (
    <div className={`flex-1 min-w-0 rounded-xl border p-4 ${person.isYou ? "border-teal-300/40 bg-teal-50/40" : "border-gray-100 bg-gray-50/40"} hover:border-gray-200 hover:shadow-md transition-all group`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden ring-2 ${col.ring} shadow-sm`}>
          {person.data.photoUrl ? (
            <img src={person.data.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${col.gradient} flex items-center justify-center text-white font-bold text-base`}>
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm truncate">{person.data.displayName}</span>
            {person.isYou && (
              <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${col.badge}`}>You</span>
            )}
          </div>
          <p className="text-teal-700 text-xs font-semibold mt-0.5 truncate">
            {person.data.jobTitle || "No title on record"}
          </p>
          {person.data.department && (
            <p className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 shrink-0" />
              {person.data.department}
            </p>
          )}
          {person.data.email && (
            <p className="text-gray-400 text-[10px] font-mono mt-1 truncate">{person.data.email}</p>
          )}
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
        <Briefcase className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{person.label}</span>
        {levelIndex === total - 1 && total > 1 && (
          <span className="ml-auto text-[9px] text-gray-300 italic">top of chain</span>
        )}
      </div>
    </div>
  );
}

/* ─── Security Tab ───────────────────────────────────────── */
function SecurityTab({ user, onCopy, copied }: { user: any; onCopy: (text: string, label: string) => void; copied: string | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600" />
          <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Authentication</h3>
        </div>
        <div className="p-5 space-y-4">
          <SecurityRow icon={Shield} label="Provider" value="Microsoft Azure AD" status="active" />
          <SecurityRow icon={KeyRound} label="Method" value="OAuth 2.0 / OpenID Connect" status="active" />
          <SecurityRow icon={Clock} label="Session" value="Active" status="active" />
          <SecurityRow icon={Fingerprint} label="User ID" value={user.id} status="neutral" mono copyable onCopy={() => onCopy(user.id, "userid")} copied={copied === "userid"} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-600" />
          <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Role & Permissions</h3>
        </div>
        <div className="p-5 space-y-4">
          <SecurityRow icon={Shield} label="Current Role" value={user.role} status="active" />
          <SecurityRow icon={Building2} label="Department" value={user.department || "Not set"} status={user.department ? "active" : "warning"} />
          <SecurityRow icon={Briefcase} label="Job Title" value={user.jobTitle || "Not set"} status={user.jobTitle ? "active" : "warning"} />
          <SecurityRow icon={Layers} label="Assigned Accounts" value={`${user.supervisorAccounts?.length || 0} accounts`} status="neutral" />
        </div>
      </div>
    </div>
  );
}

function SecurityRow({ icon: Icon, label, value, status, mono, copyable, onCopy, copied }: {
  icon: any; label: string; value: string; status: "active" | "warning" | "neutral";
  mono?: boolean; copyable?: boolean; onCopy?: () => void; copied?: boolean;
}) {
  const statusConfig = {
    active: { dot: "bg-emerald-500", text: "text-emerald-600" },
    warning: { dot: "bg-amber-500", text: "text-amber-600" },
    neutral: { dot: "bg-gray-300", text: "text-gray-500" },
  };
  const cfg = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""} text-gray-800`}>{value}</span>
        {copyable && (
          <button onClick={onCopy} className="text-gray-400 hover:text-teal-600 transition-colors">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      </div>
    </div>
  );
}

/* ─── Activity Tab ───────────────────────────────────────── */
function ActivityTab() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-teal-600" />
        <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Recent Activity</h3>
      </div>
      <div className="p-8 text-center">
        <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Activity tracking coming soon</p>
        <p className="text-gray-400 text-sm mt-1">Your recent actions and case updates will appear here.</p>
      </div>
    </div>
  );
}
