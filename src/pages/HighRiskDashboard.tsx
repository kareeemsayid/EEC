import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchAttritionCases } from "../api/sharepoint";
import { AttritionCase } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { formatHours } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import { TriangleAlert as AlertTriangle, TrendingUp, Clock } from "lucide-react";

export default function HighRiskDashboard() {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const data = await fetchAttritionCases(token);
      const highRiskOnly = data.filter(
        (c) => c.riskStatus === "High Risk" || c.riskStatus === "Critical"
      );
      setCases(highRiskOnly);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const criticalCount = cases.filter((c) => c.riskStatus === "Critical").length;
  const highRiskCount = cases.filter((c) => c.riskStatus === "High Risk").length;
  const terminationReady = cases.filter(
    (c) => c.lifecycleStage === "Termination Recommended"
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading high-risk cases…" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            HIGH RISK DASHBOARD
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Cases requiring immediate attention
          </p>
        </div>
        <button
          onClick={() => navigate("/termination")}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          Termination Center ({terminationReady})
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
              <p className="text-xs text-gray-500">Critical Cases</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{highRiskCount}</p>
              <p className="text-xs text-gray-500">High Risk Cases</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{terminationReady}</p>
              <p className="text-xs text-gray-500">Ready for Termination</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {cases.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No high-risk cases at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Case #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Trainee
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Risk
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Stage
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Hours Missed
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Threshold
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cases
                  .sort((a, b) => {
                    if (a.riskStatus === "Critical" && b.riskStatus !== "Critical")
                      return -1;
                    if (a.riskStatus !== "Critical" && b.riskStatus === "Critical")
                      return 1;
                    return b.totalMissedHours - a.totalMissedHours;
                  })
                  .map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        c.riskStatus === "Critical" ? "bg-red-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-teal-700 font-bold">
                          {c.caseNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {c.traineeName}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {c.oracleId}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge risk={c.riskStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={c.lifecycleStage} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-sm font-semibold ${
                            c.totalMissedHours >= 24
                              ? "text-red-600"
                              : c.totalMissedHours >= 16
                              ? "text-orange-600"
                              : "text-gray-700"
                          }`}
                        >
                          {formatHours(c.totalMissedHours)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {c.thresholdHours}h
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/update?case=${c.caseNumber}`)}
                            className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-2 py-1 rounded transition-colors font-medium"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => navigate(`/timeline?case=${c.caseNumber}`)}
                            className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-medium"
                          >
                            Timeline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
