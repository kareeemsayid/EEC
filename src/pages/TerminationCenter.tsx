import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchAttritionCases } from "../api/sharepoint";
import { AttritionCase } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { formatDate, formatHours } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import { TriangleAlert as AlertTriangle, X, CircleCheck as CheckCircle, FileText, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function TerminationCenter() {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AttritionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<AttritionCase | null>(null);
  const [processing, setProcessing] = useState(false);
  const [terminationStep, setTerminationStep] = useState<
    "review" | "confirm" | "process"
  >("review");

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const data = await fetchAttritionCases(token);
      const terminationCases = data.filter(
        (c) => c.lifecycleStage === "Termination Recommended"
      );
      setCases(terminationCases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleProcessTermination = async () => {
    if (!selectedCase) return;

    setProcessing(true);
    try {
      // In production, this would call a Power Automate flow to process termination
      // For now, we'll just show success
      toast.success(`Termination processed for ${selectedCase.traineeName}`);
      setSelectedCase(null);
      setTerminationStep("review");
      loadCases();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process termination");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading termination cases…" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            TERMINATION CENTER
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Cases recommended for termination
          </p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">
            {cases.length} pending terminations
          </span>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {cases.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No cases ready for termination
            </p>
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
                    Hours Missed
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Last Update
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Account
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
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
                      <span className="font-mono text-sm font-semibold text-red-600">
                        {formatHours(c.totalMissedHours)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(c.lastUpdatedDate)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {c.account}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/timeline?case=${c.caseNumber}`)}
                          className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-medium"
                        >
                          Timeline
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setTerminationStep("review");
                          }}
                          className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded transition-colors font-medium"
                        >
                          Process
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

      {/* Termination Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="font-barlow-condensed text-xl font-bold text-gray-900">
                  PROCESS TERMINATION
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCase(null);
                  setTerminationStep("review");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {terminationStep === "review" && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      You are about to process termination for this trainee. This
                      action will trigger HR workflows and cannot be undone.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Case Number</span>
                      <span className="text-sm font-mono font-semibold text-teal-700">
                        {selectedCase.caseNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Trainee</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedCase.traineeName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Oracle ID</span>
                      <span className="text-sm font-mono text-gray-700">
                        {selectedCase.oracleId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Hours Missed</span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatHours(selectedCase.totalMissedHours)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Account</span>
                      <span className="text-sm text-gray-700">
                        {selectedCase.account}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/timeline?case=${selectedCase.caseNumber}`)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Review Timeline
                    </button>
                    <button
                      onClick={() => setTerminationStep("confirm")}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {terminationStep === "confirm" && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">
                      Please confirm the termination details below:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Termination Reason
                      </label>
                      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option>Excessive Absenteeism</option>
                        <option>No Call No Show</option>
                        <option>Policy Violation</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Working Day
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setTerminationStep("review")}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setTerminationStep("process")}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Submit for Processing
                    </button>
                  </div>
                </>
              )}

              {terminationStep === "process" && (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Processing termination will trigger the following:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• HR notification workflow</li>
                      <li>• Final pay calculation</li>
                      <li>• System access revocation</li>
                      <li>• Case closure in SharePoint</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <input type="checkbox" id="confirmProcess" className="rounded" />
                    <label
                      htmlFor="confirmProcess"
                      className="text-sm text-gray-700"
                    >
                      I confirm that all documentation has been reviewed and
                      approvals have been obtained
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setTerminationStep("confirm")}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleProcessTermination}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {processing ? "Processing..." : "Process Termination"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
