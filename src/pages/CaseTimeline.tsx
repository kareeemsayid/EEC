import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  fetchCaseByNumber,
  fetchAttendanceForCase,
  fetchEscalationsForCase,
} from "../api/sharepoint";
import { AttritionCase, AttendanceRecord, EscalationRecord } from "../utils/types";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { formatDate, formatHours, formatDateTime } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import { Calendar, Clock, TriangleAlert as AlertTriangle, FileText, ArrowLeft, User, Building, TrendingUp } from "lucide-react";

type TimelineEvent = {
  id: string;
  type: "case" | "attendance" | "escalation";
  date: string;
  title: string;
  description: string;
  metadata?: Record<string, string | number | boolean>;
};

export default function CaseTimeline() {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseNumber = searchParams.get("case") || "";

  const [caseData, setCaseData] = useState<AttritionCase | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [caseInfo, attendanceData, escalationData] = await Promise.all([
        fetchCaseByNumber(token, caseNumber),
        fetchAttendanceForCase(token, caseNumber),
        fetchEscalationsForCase(token, caseNumber),
      ]);

      setCaseData(caseInfo);
      setAttendance(attendanceData);
      setEscalations(escalationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case data");
    } finally {
      setLoading(false);
    }
  }, [caseNumber, getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const buildTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    if (caseData) {
      events.push({
        id: `case-${caseData.id}`,
        type: "case",
        date: caseData.caseOpenedDate,
        title: "Case Opened",
        description: `Attrition case opened for ${caseData.traineeName}`,
        metadata: {
          "Opened by": caseData.openedBy || "System",
          "Initial hours": caseData.totalMissedHours,
        },
      });

      if (caseData.lastUpdatedDate !== caseData.caseOpenedDate) {
        events.push({
          id: `case-update-${caseData.id}`,
          type: "case",
          date: caseData.lastUpdatedDate,
          title: "Case Updated",
          description: `Last status update`,
          metadata: {
            "Risk status": caseData.riskStatus,
            Stage: caseData.lifecycleStage,
            "Total hours": caseData.totalMissedHours,
          },
        });
      }
    }

    attendance.forEach((a) => {
      events.push({
        id: `attendance-${a.id}`,
        type: "attendance",
        date: a.absenceDate,
        title: `${a.hoursMissed}h ${a.absenceType}`,
        description: a.absenceReason || "Missed attendance",
        metadata: {
          "Logged by": a.loggedBy,
          "Excused": a.excused ? "Yes" : "No",
          "Running total": `${formatHours(a.runningTotal)} missed`,
        },
      });
    });

    escalations.forEach((e) => {
      events.push({
        id: `escalation-${e.id}`,
        type: "escalation",
        date: e.escalationDate,
        title: e.escalationType,
        description: e.resolutionNotes || "Escalation triggered",
        metadata: {
          "Escalated to": e.escalatedTo,
          "Escalated by": e.escalatedBy,
          Response: e.acknowledgedDate ? `Acknowledged ${formatDate(e.acknowledgedDate)}` : "Pending",
        },
      });
    });

    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const timeline = buildTimeline();

  const getEventIcon = (type: string) => {
    switch (type) {
      case "case":
        return <FileText className="w-4 h-4" />;
      case "attendance":
        return <Clock className="w-4 h-4" />;
      case "escalation":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "case":
        return "bg-teal-100 text-teal-600 border-teal-200";
      case "attendance":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "escalation":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading case timeline…" />
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
            CASE TIMELINE
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="font-barlow-condensed text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              TIMELINE
            </h2>

            {timeline.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No events recorded
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div key={event.id} className="relative pl-10">
                      <div
                        className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(
                          event.type
                        )}`}
                      >
                        {getEventIcon(event.type)}
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDateTime(event.date)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.description}
                        </p>
                        {event.metadata && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="text-gray-400">{key}:</span>{" "}
                                <span className="text-gray-600">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="font-barlow-condensed text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              TRAINEE INFO
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {caseData.traineeName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Oracle ID</p>
                <p className="text-sm font-mono text-gray-700">{caseData.oracleId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Hire Date</p>
                <p className="text-sm text-gray-700">
                  {formatDate(caseData.hireDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="font-barlow-condensed text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600" />
              WORK INFO
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400">Account</p>
                <p className="text-sm font-medium text-gray-900">{caseData.account}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">LOB</p>
                <p className="text-sm text-gray-700">{caseData.lob}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Site</p>
                <p className="text-sm text-gray-700">{caseData.site}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Trainer</p>
                <p className="text-sm text-gray-700">{caseData.trainerName || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="font-barlow-condensed text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              CASE STATS
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">Total Missed</p>
                <p className="text-lg font-bold text-red-600">
                  {formatHours(caseData.totalMissedHours)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">Threshold</p>
                <p className="text-sm font-semibold text-gray-700">
                  {caseData.thresholdHours}h
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">Status</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    caseData.caseStatus === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {caseData.caseStatus}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/update?case=${caseData.caseNumber}`)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Update Case
          </button>
        </div>
      </div>
    </div>
  );
}
