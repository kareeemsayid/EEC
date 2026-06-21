import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { fetchManagerChain, ManagerChain } from "../api/sharepoint";
import { loginRequest } from "../auth/msalConfig";
import Skeleton from "../components/Skeleton";
import {
  User,
  Mail,
  Briefcase,
  Building,
  Calendar,
  Shield,
  UserCheck,
  Users,
  ArrowRight,
} from "lucide-react";

export default function Profile() {
  const { user, profileLoading, getAccessToken } = useAuth();
  const [chain, setChain] = useState<ManagerChain | null>(null);
  const [chainLoading, setChainLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      try {
        // loginRequest.scopes now includes User.Read.All (admin consent required)
        const token = await getAccessToken(loginRequest.scopes as string[]);
        const c = await fetchManagerChain(token);
        if (!cancelled) setChain(c);
      } catch {
        /* graceful — cards simply omit */
      } finally {
        if (!cancelled) setChainLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, getAccessToken]);

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="h-40 shimmer-bg rounded-2xl mb-6" />
        <div className="h-40 shimmer-bg rounded-2xl mb-6" />
        <div className="h-64 shimmer-bg rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-gray-500">Unable to load profile. Please try again.</p>
        </div>
      </div>
    );
  }

  const initials =
    user.firstName?.[0]
      ? (user.firstName[0] + (user.lastName?.[0] || "")).toUpperCase()
      : user.displayName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const hasChain = chain?.manager || chain?.skipLevelManager;

  const isPSOrManager = user.role === 'PS' || user.role === 'SrManager' || user.role === 'Manager';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header band */}
      <div className="glass-card bg-white rounded-2xl overflow-hidden border border-gray-200 animate-fade-in-up">
        <div className="h-28 bg-gradient-navy relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="-mt-14">
              <div className="w-28 h-28 rounded-2xl bg-gradient-teal flex items-center justify-center text-white text-3xl font-bold overflow-hidden ring-4 ring-white shadow-xl">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
            <div className="flex-1 pt-4 sm:pt-0 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="font-barlow-condensed text-2xl font-bold text-navy-900">
                  {user.displayName}
                </h1>
                {isPSOrManager && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200">
                    <Shield className="w-3 h-3" />
                    {user.role === 'PS' ? 'PS Team' : user.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" />
                {user.jobTitle || "Team Member"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manager chain (org chart) */}
      {chainLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <Skeleton variant="circle" width={48} height={48} className="mb-3" />
              <Skeleton variant="text" height={14} className="mb-2" width="70%" />
              <Skeleton variant="text" height={11} width="50%" />
            </div>
          ))}
        </div>
      ) : hasChain ? (
        <div className="glass-card rounded-2xl p-6 border border-gray-200 animate-fade-in-up">
          <h2 className="font-barlow-condensed text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            Reporting Line
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
            {/* You */}
            <OrgCard
              label="You"
              name={user.displayName}
              title={user.jobTitle || "Team Member"}
              initials={initials}
              photoUrl={user.photoUrl}
              isYou
            />
            {chain?.manager && (
              <>
                <ArrowConnector />
                <OrgCard
                  label="Manager"
                  name={chain.manager.displayName}
                  title={chain.manager.jobTitle || "Manager"}
                  email={chain.manager.email}
                  initials={getInitials(chain.manager.displayName)}
                  photoUrl={chain.manager.photoUrl}
                />
              </>
            )}
            {chain?.skipLevelManager && (
              <>
                <ArrowConnector />
                <OrgCard
                  label="Skip-level"
                  name={chain.skipLevelManager.displayName}
                  title={chain.skipLevelManager.jobTitle || "Director"}
                  email={chain.skipLevelManager.email}
                  initials={getInitials(chain.skipLevelManager.displayName)}
                  photoUrl={chain.skipLevelManager.photoUrl}
                />
              </>
            )}
          </div>
          {!chain?.manager && (
            <p className="text-xs text-gray-400 mt-4 italic">
              No direct manager found in Azure AD. If you believe this is incorrect, contact IT.
            </p>
          )}
          {chain?.manager && !chain?.skipLevelManager && (
            <p className="text-xs text-gray-400 mt-4 italic">
              Skip-level manager not available (requires <code className="font-mono text-[11px]">User.Read.All</code> admin consent on the Azure AD app).
            </p>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card bg-white rounded-2xl p-6 border border-gray-200 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <h2 className="font-barlow-condensed text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="First Name" value={user.firstName} />
              <InfoField label="Last Name" value={user.lastName} />
              <InfoField label="Display Name" value={user.displayName} />
              <InfoField label="Job Title" value={user.jobTitle || "Team Member"} />
            </div>
          </div>

          <div className="glass-card bg-white rounded-2xl p-6 border border-gray-200 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <h2 className="font-barlow-condensed text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Email Address" value={user.email} />
              <InfoField label="User ID" value={user.id} mono />
            </div>
          </div>

          {user.directReports && user.directReports.length > 0 && (
            <div className="glass-card bg-white rounded-2xl p-6 border border-gray-200 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <h2 className="font-barlow-condensed text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Direct Reports
                <span className="ml-auto text-xs bg-teal-100 text-teal-700 rounded-full px-2.5 py-0.5 font-semibold">
                  {user.directReports.length}
                </span>
              </h2>
              <div className="space-y-2">
                {user.directReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-3 p-3 bg-canvas rounded-xl hover:bg-teal-50/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(report.displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{report.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{report.jobTitle || "Team Member"}</p>
                    </div>
                    <a href={`mailto:${report.mail}`} className="text-xs font-medium text-teal-600 hover:underline shrink-0">
                      Email
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="glass-card bg-white rounded-2xl p-6 border border-gray-200 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            <h2 className="font-barlow-condensed text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Roles & Permissions
            </h2>
            <div className="space-y-2">
              <RoleRow label="Standard User" active />
              {isPSOrManager && <RoleRow label={user.role === 'PS' ? 'People Solutions' : user.role || 'Team Member'} active variant="teal" />}
              <RoleRow label="Case Manager" active />
            </div>
          </div>

          <div className="glass-card bg-white rounded-2xl p-6 border border-gray-200 animate-fade-in-up" style={{ animationDelay: "170ms" }}>
            <h2 className="font-barlow-condensed text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-600" />
              Organization
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-canvas rounded-xl">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Department</p>
                <p className="text-sm font-medium text-navy-900">Training &amp; Operations</p>
              </div>
              <div className="p-3 bg-canvas rounded-xl">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Company</p>
                <p className="text-sm font-medium text-navy-900">Concentrix</p>
              </div>
            </div>
          </div>

          <div className="glass-card bg-white rounded-2xl p-6 border border-gray-200 animate-fade-in-up" style={{ animationDelay: "220ms" }}>
            <h2 className="font-barlow-condensed text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Activity
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-canvas rounded-xl">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Last Login</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <p className="text-sm font-medium text-navy-900">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgCard({
  label,
  name,
  title,
  email,
  initials,
  photoUrl,
  isYou,
}: {
  label: string;
  name: string;
  title: string;
  email?: string;
  initials: string;
  photoUrl?: string | null;
  isYou?: boolean;
}) {
  return (
    <div
      className={`flex-1 rounded-xl p-4 border transition-all ${
        isYou
          ? "bg-navy-900 border-navy-700 text-white shadow-glow-teal"
          : "bg-white border-gray-200 hover:border-teal-300 hover:shadow-card-hover"
      }`}
    >
      <p className={`text-[10px] uppercase tracking-wider font-bold mb-2 ${isYou ? "text-teal-300" : "text-teal-600"}`}>
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
          isYou ? "bg-teal-500 text-white" : "bg-gradient-to-br from-navy-700 to-navy-900 text-white"
        }`}>
          {photoUrl ? <img src={photoUrl} alt={name} className="w-full h-full object-cover rounded-xl" /> : initials}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isYou ? "text-white" : "text-navy-900"}`}>{name}</p>
          <p className={`text-xs truncate ${isYou ? "text-teal-200/70" : "text-gray-500"}`}>{title}</p>
          {email && (
            <a href={`mailto:${email}`} className={`text-xs hover:underline block truncate ${isYou ? "text-teal-300" : "text-teal-600"}`}>
              {email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowConnector() {
  return (
    <div className="hidden sm:flex items-center justify-center px-1">
      <ArrowRight className="w-4 h-4 text-teal-400" />
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="p-3 bg-canvas rounded-xl">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-sm font-medium text-navy-900 ${mono ? "font-mono text-xs break-all" : ""}`}>{value || "N/A"}</p>
    </div>
  );
}

function RoleRow({ label, active, variant = "green" }: { label: string; active?: boolean; variant?: "green" | "teal" }) {
  const badge =
    variant === "teal"
      ? "bg-teal-100 text-teal-700"
      : "bg-green-100 text-green-700";
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-canvas">
      <span className="text-sm text-gray-700">{label}</span>
      {active && <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${badge}`}>Active</span>}
    </div>
  );
}
