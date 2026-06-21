import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Tooltip from "../components/Tooltip";
import { ChevronLeft, Mail, Briefcase, Building2, Calendar, User, ChevronRight, CreditCard as Edit3, Users } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const initials = user.firstName?.[0]
    ? (user.firstName[0] + (user.lastName?.[0] || "")).toUpperCase()
    : user.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Profile</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            MY PROFILE
          </h1>
          <p className="text-gray-500 text-sm mt-1">View and manage your account information</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Profile Card */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass overflow-hidden">
        {/* Hero Section */}
        <div className="relative bg-gradient-navy px-6 py-8">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent" />
          <div className="relative flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-teal flex items-center justify-center text-white text-3xl font-bold overflow-hidden ring-4 ring-white/20 shadow-glow-teal-lg shrink-0">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
              <p className="text-teal-200/80 mt-0.5">{user.jobTitle}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-teal-200/60">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'PS' ? 'bg-teal-500/30 text-teal-100' :
                    user.role === 'SrManager' ? 'bg-amber-500/30 text-amber-100' :
                    user.role === 'Manager' ? 'bg-blue-500/30 text-blue-100' :
                    user.role === 'Supervisor' ? 'bg-purple-500/30 text-purple-100' :
                    'bg-gray-500/30 text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={<User className="w-4 h-4" />} label="First Name" value={user.firstName} />
            <DetailField icon={<User className="w-4 h-4" />} label="Last Name" value={user.lastName} />
            <DetailField icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} mono />
            <DetailField icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={user.jobTitle} />
            <DetailField icon={<Building2 className="w-4 h-4" />} label="Department" value={user.department || "—"} />
            <DetailField icon={<Calendar className="w-4 h-4" />} label="Account" value={user.email?.split("@")[1] || "concentrix.com"} />
          </div>

          {/* Supervisor Accounts (if Supervisor/Manager) */}
          {user.supervisorAccounts && user.supervisorAccounts.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Assigned Accounts
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.supervisorAccounts.map((acc, i) => (
                  <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium border border-teal-100">
                    {acc.accountName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manager Chain */}
      <ManagerChain user={user} />
    </div>
  );
}

function DetailField({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <p className={`text-sm mt-0.5 text-gray-800 ${mono ? "font-mono" : "font-medium"} truncate`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function ManagerChain({ user }: { user: any }) {
  if (!user.manager1 && !user.manager2) return null;

  return (
    <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-6">
      <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-teal-500" />
        Reporting Structure
      </h3>
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {/* You */}
        <ManagerCard label="You" name={user.displayName} title={user.jobTitle} photoUrl={user.photoUrl} isYou />

        {user.manager1 && (
          <>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            <ManagerCard label="Direct Manager" name={user.manager1.displayName} title={user.manager1.jobTitle} photoUrl={user.manager1.photoUrl} />
          </>
        )}

        {user.manager2 && (
          <>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            <ManagerCard label="Senior Manager" name={user.manager2.displayName} title={user.manager2.jobTitle} photoUrl={user.manager2.photoUrl} />
          </>
        )}
      </div>
    </div>
  );
}

function ManagerCard({ label, name, title, photoUrl, isYou }: { label: string; name: string; title?: string; photoUrl?: string | null; isYou?: boolean }) {
  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className={`flex-shrink-0 w-40 p-3 rounded-xl border transition-all ${isYou ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mb-2 mx-auto overflow-hidden ${isYou ? "bg-gradient-teal shadow-glow-teal" : "bg-navy-700"}`}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wide text-center">{label}</p>
      <p className="text-sm font-semibold text-gray-800 text-center mt-0.5 truncate">{name}</p>
      {title && <p className="text-xs text-gray-500 text-center truncate">{title}</p>}
    </div>
  );
}
