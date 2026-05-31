import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAuth } from "../auth/useAuth";
import { fetchAttritionCases, fetchCaseUpdates } from "../api/sharepoint";
import { AttritionCase, CaseUpdate, KpiData } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { formatDate, formatHours, timeAgo } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";

// Mock weekly trend data – replace with real data from CaseUpdates aggregation
const WEEKLY_TREND = [
  { week: "Wk 1", critical: 1, highRisk: 2, monitoring: 4 },
  { week: "Wk 2", critical: 2, highRisk: 3, monitoring: 5 },
  { week: "Wk 3", critical: 1, highRisk: 4, monitoring: 3 },
  { week: "Wk 4", critical: 3, highRisk: 2, monitoring: 6 },
  { week: "Wk 5", critical: 2, highRisk: 5, monitoring: 4 },
];

export default function HomeScreen() {
  const { userProfile, getAccessToken } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [updates, setUpdates] = useState<CaseUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const [casesData, updatesData] = await Promise.all([
        fetchAttritionCases(token, userProfile?.email),
        fetchCaseUpdates(token),
      ]);
      setCases(casesData);
      setUpdates(updatesData.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, userProfile?.email]);

  useEffect(() => {
    if (userProfile) loadData();
  }, [userProfile, loadData]);

  const kpi: KpiData = {
    activeCases: cases.filter((c) => c.caseStatus !== "Closed").length,
    critical: cases.filter((c) => c.riskStatus === "Critical" && c.caseStatus !== "Closed").length,
    highRisk: cases.filter((c) => c.riskStatus === "High Risk" && c.caseStatus !== "Closed").length,
    monitoring: cases.filter((c) => c.riskStatus === "Monitoring" && c.caseStatus !== "Closed").length,
    terminationRecommended: cases.filter((c) => c.lifecycleStage === "Termination Recommended").length,
  };

  const activeCases = cases.filter((c) => c.caseStatus !== "Closed");
  const hasCriticalAlert = kpi.critical > 0;
  const total = kpi.critical + kpi.highRisk + kpi.monitoring || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            Good {getGreeting()}, {userProfile?.firstName || "Trainer"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/submit")}
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Submit Case
          </button>
          <button
            onClick={() => navigate("/update")}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Update Case
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {hasCriticalAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3 animate-slide-up">
          <span className="text-red-500 animate-pulse-slow text-lg">⚠</span>
          <p className="text-sm text-red-700 font-medium">
            {kpi.critical} critical case{kpi.critical !== 1 ? "s" : ""} require immediate attention
          </p>
        </div>
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label="Loading your cases…" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Active Cases" value={kpi.activeCases} color="teal" icon="📋" />
            <KpiCard label="Critical" value={kpi.critical} color="red" icon="🔴" pulse />
            <KpiCard label="High Risk" value={kpi.highRisk} color="amber" icon="🟠" />
            <KpiCard label="Monitoring" value={kpi.monitoring} color="teal" icon="🟢" />
            <KpiCard
              label="Termination"
              value={kpi.terminationRecommended}
              color="gray"
              icon="🚨"
              onClick={() => navigate("/update")}
              clickLabel="View →"
            />
          </div>

          {/* Risk Distribution Bar */}
          {total > 1 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 mb-4 tracking-wide">
                RISK DISTRIBUTION
              </h2>
              <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                {kpi.critical > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(kpi.critical / total) * 100}%` }}
                    title={`Critical: ${kpi.critical}`}
                  />
                )}
                {kpi.highRisk > 0 && (
                  <div
                    className="bg-amber-500 transition-all"
                    style={{ width: `${(kpi.highRisk / total) * 100}%` }}
                    title={`High Risk: ${kpi.highRisk}`}
                  />
                )}
                {kpi.monitoring > 0 && (
                  <div
                    className="bg-teal-500 transition-all"
                    style={{ width: `${(kpi.monitoring / total) * 100}%` }}
                    title={`Monitoring: ${kpi.monitoring}`}
                  />
                )}
              </div>
              <div className="flex gap-6 mt-3">
                {[
                  { label: "Critical", count: kpi.critical, color: "bg-red-500" },
                  { label: "High Risk", count: kpi.highRisk, color: "bg-amber-500" },
                  { label: "Monitoring", count: kpi.monitoring, color: "bg-teal-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-gray-600">
                      {item.label} ({Math.round((item.count / total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Cases Table */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide">
                  MY ACTIVE CASES
                </h2>
                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-mono">
                  {activeCases.length}
                </span>
              </div>
              {activeCases.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-gray-400 text-sm">No active cases found.</p>
                  <button
                    onClick={() => navigate("/submit")}
                    className="mt-3 text-teal-600 text-sm hover:underline"
                  >
                    Submit a case →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeCases.map((c) => (
                    <React.Fragment key={c.id}>
                      <div
                        className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedCase(expandedCase === c.id ? null : c.id)
                        }
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-gray-400 w-24 shrink-0">
                            {c.caseNumber}
                          </span>
                          <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                            {c.traineeName}
                          </span>
                          <RiskBadge risk={c.riskStatus} size="sm" />
                          <StageBadge stage={c.lifecycleStage} size="sm" />
                          <span className="font-mono text-xs text-gray-500 w-12 text-right shrink-0">
                            {formatHours(c.totalMissedHours)}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedCase === c.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {expandedCase === c.id && (
                        <div className="px-5 py-4 bg-teal-50 border-t border-teal-100 animate-fade-in">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                            <Field label="Oracle ID" value={c.oracleId} mono />
                            <Field label="Account" value={c.account} />
                            <Field label="LOB" value={c.lob} />
                            <Field label="Site" value={c.site} />
                            <Field label="Incident Date" value={formatDate(c.incidentDate)} />
                            <Field label="Category" value={c.attritionCategory} />
                            <Field label="Sub-Reason" value={c.subReason} />
                            <Field label="Severity" value={c.severityLevel} />
                          </div>
                          {c.notes && (
                            <p className="text-xs text-gray-600 bg-white rounded px-3 py-2 border border-teal-100 mb-3">
                              {c.notes}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                navigate(`/update?case=${c.caseNumber}`)
                              }
                              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                            >
                              Update Case
                            </button>
                            {c.escalationRequired && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                Escalation Required
                              </span>
                            )}
                            {c.documentationRequired && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                Docs Required
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide">
                    RECENT ACTIVITY
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {updates.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">
                      No recent activity.
                    </p>
                  ) : (
                    updates.map((u) => (
                      <div key={u.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-medium text-gray-800">
                              {u.updateType}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {u.caseNumber}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {timeAgo(u.created)}
                          </span>
                        </div>
                        {u.notes && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{u.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Weekly Trend Chart */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <h2 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4">
                  WEEKLY TRENDS
                </h2>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={WEEKLY_TREND} barSize={8} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="critical" fill="#ef4444" radius={[2, 2, 0, 0]} name="Critical" />
                    <Bar dataKey="highRisk" fill="#f59e0b" radius={[2, 2, 0, 0]} name="High Risk" />
                    <Bar dataKey="monitoring" fill="#0d9488" radius={[2, 2, 0, 0]} name="Monitoring" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function KpiCard({
  label,
  value,
  color,
  icon,
  pulse,
  onClick,
  clickLabel,
}: {
  label: string;
  value: number;
  color: "teal" | "red" | "amber" | "gray";
  icon: string;
  pulse?: boolean;
  onClick?: () => void;
  clickLabel?: string;
}) {
  const colorMap = {
    teal: "text-teal-700 bg-teal-50 border-teal-100",
    red: "text-red-700 bg-red-50 border-red-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100",
    gray: "text-gray-700 bg-gray-50 border-gray-100",
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorMap[color]}`}>
          {icon}
        </span>
        {onClick && (
          <span className="text-xs text-teal-600">{clickLabel}</span>
        )}
      </div>
      <div className={`text-3xl font-barlow-condensed font-bold ${pulse && value > 0 ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <p className={`text-sm text-gray-800 ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}
