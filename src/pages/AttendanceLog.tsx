import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  fetchCaseByNumber,
  fetchAttendanceForCase,
  logAttendance,
} from "../api/sharepoint";
import { AttritionCase, AttendanceRecord } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { formatDate, formatHours, formatDateTime } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import { Calendar, Clock, Plus, ArrowLeft, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Save } from "lucide-react";
import toast from "react-hot-toast";

const ABSENCE_TYPES = [
  "Unexcused Absence",
  "Excused Absence",
  "No Call No Show",
  "Late",
  "Left Early",
  "Other",
];

export default function AttendanceLog() {
  const { getAccessToken, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseNumber = searchParams.get("case") || "";

  const [caseData, setCaseData] = useState<AttritionCase | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    absenceDate: new Date().toISOString().split("T")[0],
    hoursMissed: 8,
    absenceType: "Unexcused Absence",
    absenceReason: "",
    excused: false,
  });

  const loadData = useCallback(async () => {
    if (!caseNumber) {
      setError("No case specified");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const [caseInfo, attendanceData] = await Promise.all([
        fetchCaseByNumber(token, caseNumber),
        fetchAttendanceForCase(token, caseNumber),
      ]);

      setCaseData(caseInfo);
      setAttendance(attendanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case data");
    } finally {
      setLoading(false);
    }
  }, [caseNumber, getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    setSaving(true);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const newRunningTotal = caseData.totalMissedHours + formData.hoursMissed;
      await logAttendance(token, {
        caseItemId: caseData.id,
        caseNumber: caseData.caseNumber,
        oracleId: caseData.oracleId,
        traineeName: caseData.traineeName,
        absenceDate: formData.absenceDate,
        hoursMissed: formData.hoursMissed,
        absenceType: formData.absenceType,
        absenceReason: formData.absenceReason,
        excused: formData.excused,
        runningTotal: newRunningTotal,
        loggedBy: user?.email || "Unknown",
      });

      toast.success(`${formData.hoursMissed}h logged for ${formatDate(formData.absenceDate)}`);
      setFormData({
        absenceDate: new Date().toISOString().split("T")[0],
        hoursMissed: 8,
        absenceType: "Unexcused Absence",
        absenceReason: "",
        excused: false,
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log attendance");
    } finally {
      setSaving(false);
    }
  };

  const hoursRemaining = caseData
    ? Math.max(0, caseData.thresholdHours - caseData.totalMissedHours)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading attendance log…" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="space-y-5 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <p className="text-gray-500">Case not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            ATTENDANCE LOG
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {caseData.caseNumber} — {caseData.traineeName}
          </p>
        </div>
        <div className="flex gap-2">
          <RiskBadge risk={caseData.riskStatus} size="md" />
          <StageBadge stage={caseData.lifecycleStage} size="md" />
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {formatHours(caseData.totalMissedHours)}
              </p>
              <p className="text-xs text-gray-500">Hours Missed</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {caseData.thresholdHours}h
              </p>
              <p className="text-xs text-gray-500">Threshold</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                hoursRemaining <= 8
                  ? "bg-red-100"
                  : hoursRemaining <= 16
                  ? "bg-orange-100"
                  : "bg-green-100"
              }`}
            >
              <CheckCircle
                className={`w-5 h-5 ${
                  hoursRemaining <= 8
                    ? "text-red-600"
                    : hoursRemaining <= 16
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              />
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  hoursRemaining <= 8
                    ? "text-red-600"
                    : hoursRemaining <= 16
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {formatHours(hoursRemaining)}
              </p>
              <p className="text-xs text-gray-500">Hours Remaining</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-barlow-condensed text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            ATTENDANCE RECORDS
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Log Hours
          </button>
        </div>

        {attendance.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No attendance records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Hours
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Running Total
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Excused
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Logged By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(a.absenceDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-800">{a.absenceType}</span>
                      {a.absenceReason && (
                        <p className="text-xs text-gray-400">{a.absenceReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-red-600">
                        +{a.hoursMissed}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-gray-700">
                        {formatHours(a.runningTotal)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.excused ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                          Excused
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-medium">
                          Unexcused
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {a.loggedBy}
                      <p className="text-gray-400">{formatDateTime(a.loggedDate)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Attendance Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-gray-200">
              <h2 className="font-barlow-condensed text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                LOG MISSED HOURS
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Absence Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.absenceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, absenceDate: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Missed
                  </label>
                  <input
                    type="number"
                    required
                    min={0.5}
                    max={24}
                    step={0.5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.hoursMissed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hoursMissed: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    value={formData.absenceType}
                    onChange={(e) =>
                      setFormData({ ...formData, absenceType: e.target.value })
                    }
                  >
                    {ABSENCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason / Notes
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  placeholder="Optional notes..."
                  value={formData.absenceReason}
                  onChange={(e) =>
                    setFormData({ ...formData, absenceReason: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="excused"
                  className="rounded border-gray-300"
                  checked={formData.excused}
                  onChange={(e) =>
                    setFormData({ ...formData, excused: e.target.checked })
                  }
                />
                <label htmlFor="excused" className="text-sm text-gray-700">
                  Mark as excused absence
                </label>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">New Total:</span>
                <span className="font-mono font-bold text-lg text-red-600">
                  {formatHours(caseData.totalMissedHours + formData.hoursMissed)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
