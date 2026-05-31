import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchCaseByNumber, fetchEmailThread } from "../api/sharepoint";
import { triggerUpdateCase } from "../api/powerAutomate";
import { AttritionCase, EmailThread, LifecycleStage, UpdateCasePayload } from "../utils/types";
import { calculateRiskStatus, inferLifecycleStage } from "../utils/riskLogic";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import ErrorBanner from "../components/ErrorBanner";
import { formatDate, formatDateTime } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";

const UPDATE_TYPES = [
  "Absence Logged",
  "Coaching Session",
  "Written Warning",
  "Final Warning Issued",
  "Escalation Submitted",
  "Documentation Received",
  "HR Consultation",
  "Manager Follow-Up",
  "Termination Initiated",
  "Case Closed",
  "Other",
];

const ABSENCE_TYPES = [
  "Unexcused",
  "Excused – Medical",
  "Excused – Personal",
  "NCNS",
  "Tardy",
  "Early Departure",
  "Other",
];

const LIFECYCLE_STAGES: LifecycleStage[] = [
  "Initial Review",
  "Coaching Plan",
  "Final Warning",
  "Termination Recommended",
  "Closed",
];

interface UpdateFormData {
  hoursToAdd: number;
  absenceDate: string;
  absenceType: string;
  updateType: string;
  overrideStage: string;
  notes: string;
  escalationRequired: boolean;
  documentationRequired: boolean;
}

const INITIAL_FORM: UpdateFormData = {
  hoursToAdd: 0,
  absenceDate: new Date().toISOString().split("T")[0],
  absenceType: "",
  updateType: "",
  overrideStage: "",
  notes: "",
  escalationRequired: false,
  documentationRequired: false,
};

export default function UpdateCase() {
  const { userProfile, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCaseNum = searchParams.get("case") || "";

  const [query, setQuery] = useState(initialCaseNum);
  const [searching, setSearching] = useState(false);
  const [caseData, setCaseData] = useState<AttritionCase | null>(null);
  const [emailThread, setEmailThread] = useState<EmailThread | null>(null);
  const [form, setForm] = useState<UpdateFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const newHours = (caseData?.totalMissedHours || 0) + form.hoursToAdd;
  const newRisk = caseData
    ? calculateRiskStatus(newHours, caseData.severityLevel)
    : null;
  const newStage = form.overrideStage
    ? (form.overrideStage as LifecycleStage)
    : newRisk
    ? inferLifecycleStage(newRisk, newHours)
    : null;

  const searchCase = useCallback(
    async (caseRef: string) => {
      if (!caseRef.trim()) return;
      setSearching(true);
      setError(null);
      setCaseData(null);
      setEmailThread(null);
      try {
        const token = await getAccessToken(loginRequest.scopes as string[]);
        const found = await fetchCaseByNumber(token, caseRef.trim());
        if (!found) {
          setError(`No case found for "${caseRef}"`);
        } else {
          setCaseData(found);
          setForm((prev) => ({
            ...prev,
            escalationRequired: found.escalationRequired,
            documentationRequired: found.documentationRequired,
          }));
          // Load email thread
          const thread = await fetchEmailThread(token, found.caseNumber);
          setEmailThread(thread);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setSearching(false);
      }
    },
    [getAccessToken]
  );

  // Auto-search if arriving with ?case= param
  useEffect(() => {
    if (initialCaseNum) searchCase(initialCaseNum);
  }, [initialCaseNum, searchCase]);

  function update<K extends keyof UpdateFormData>(key: K, value: UpdateFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!caseData) return;
    if (!form.updateType) { setError("Update type is required"); return; }
    if (!form.notes.trim()) { setError("Notes are required for updates"); return; }

    setError(null);
    setSubmitting(true);
    try {
      const payload: UpdateCasePayload = {
        caseId: caseData.id,
        caseNumber: caseData.caseNumber,
        hoursToAdd: form.hoursToAdd,
        absenceDate: form.absenceDate,
        absenceType: form.absenceType,
        updateType: form.updateType,
        overrideStage: form.overrideStage || undefined,
        notes: form.notes,
        escalationRequired: form.escalationRequired,
        documentationRequired: form.documentationRequired,
        updatedBy: userProfile?.displayName || "",
        updatedByEmail: userProfile?.email || "",
      };
      await triggerUpdateCase(payload);
      setSuccess(`Case ${caseData.caseNumber} updated successfully. Thread reply sent.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
          UPDATE CASE
        </h1>
        <p className="text-gray-500 text-sm mt-1">Search for a case and add an update</p>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Case Number or Oracle ID
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="e.g. EEC-2024-001 or ORG-123456"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchCase(query)}
          />
          <button
            onClick={() => searchCase(query)}
            disabled={searching || !query.trim()}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {searching && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {success && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-teal-700 font-medium">{success}</p>
          <button onClick={() => { setSuccess(null); setForm(INITIAL_FORM); }} className="ml-auto text-teal-500 hover:text-teal-700 text-xs underline">
            New Update
          </button>
        </div>
      )}

      {/* Case Snapshot */}
      {caseData && !success && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-teal-700">
                  {caseData.caseNumber}
                </span>
                <RiskBadge risk={caseData.riskStatus} />
                <StageBadge stage={caseData.lifecycleStage} />
              </div>
              {caseData.caseStatus !== "Closed" && (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  {caseData.caseStatus}
                </span>
              )}
            </div>

            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <SnapField label="Trainee" value={caseData.traineeName} />
              <SnapField label="Oracle ID" value={caseData.oracleId} mono />
              <SnapField label="Account" value={caseData.account} />
              <SnapField label="LOB" value={caseData.lob} />
              <SnapField label="Site" value={caseData.site} />
              <SnapField label="Wave" value={caseData.wave} />
              <SnapField label="Category" value={caseData.attritionCategory} />
              <SnapField label="Sub-Reason" value={caseData.subReason} />
              <SnapField label="Severity" value={caseData.severityLevel} />
              <SnapField
                label="Total Hours"
                value={`${caseData.totalMissedHours}h`}
                mono
                highlight
              />
              <SnapField label="Incident Date" value={formatDate(caseData.incidentDate)} />
              <SnapField label="Trainer" value={caseData.trainerName} />
            </div>

            {/* Email Thread Info */}
            {emailThread ? (
              <div className="px-5 py-3 border-t border-gray-100 bg-blue-50 flex items-center gap-4 text-sm">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <div className="min-w-0">
                  <span className="font-medium text-blue-700 truncate block">
                    {emailThread.subject || "Outlook Thread Active"}
                  </span>
                  <span className="text-xs text-blue-500">
                    Last reply: {formatDateTime(emailThread.lastReplyDate)} ·{" "}
                    {emailThread.threadCount} message{emailThread.threadCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-5 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                No email thread found for this case.
              </div>
            )}
          </div>

          {/* Update Form */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-5">
            <h2 className="font-barlow-condensed font-semibold text-xl text-gray-900 tracking-wide">
              ADD UPDATE
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Update Type *">
                <select
                  className={inputClass}
                  value={form.updateType}
                  onChange={(e) => update("updateType", e.target.value)}
                >
                  <option value="">Select type…</option>
                  {UPDATE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Absence Type">
                <select
                  className={inputClass}
                  value={form.absenceType}
                  onChange={(e) => update("absenceType", e.target.value)}
                >
                  <option value="">Select absence type…</option>
                  {ABSENCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Hours to Add">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={`${inputClass} font-mono`}
                  value={form.hoursToAdd}
                  onChange={(e) => update("hoursToAdd", parseFloat(e.target.value) || 0)}
                />
              </FormField>
              <FormField label="Absence Date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.absenceDate}
                  onChange={(e) => update("absenceDate", e.target.value)}
                />
              </FormField>
              <FormField label="Override Stage (optional)" className="sm:col-span-2">
                <select
                  className={inputClass}
                  value={form.overrideStage}
                  onChange={(e) => update("overrideStage", e.target.value)}
                >
                  <option value="">Auto-calculate from hours</option>
                  {LIFECYCLE_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="flex gap-6">
              <Toggle
                label="Escalation Required"
                value={form.escalationRequired}
                onChange={(v) => update("escalationRequired", v)}
              />
              <Toggle
                label="Documentation Required"
                value={form.documentationRequired}
                onChange={(v) => update("documentationRequired", v)}
              />
            </div>

            <FormField label="Update Notes *">
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Describe the update, outcome, or next steps…"
              />
            </FormField>

            {/* Live Diff Panel */}
            {form.hoursToAdd > 0 && newRisk && newStage && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-slide-up">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Before / After Preview
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <DiffColumn
                    label="Current"
                    hours={caseData.totalMissedHours}
                    risk={caseData.riskStatus}
                    stage={caseData.lifecycleStage}
                    dim
                  />
                  <DiffColumn
                    label="After Update"
                    hours={newHours}
                    risk={newRisk}
                    stage={newStage}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {submitting ? "Submitting…" : "Submit Update"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white";

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function SnapField({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className={`text-sm mt-0.5 ${highlight ? "font-bold text-teal-700" : "text-gray-800"} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className={`w-9 h-5 rounded-full transition-colors ${value ? "bg-teal-600" : "bg-gray-300"} relative`}
        onClick={() => onChange(!value)}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function DiffColumn({
  label,
  hours,
  risk,
  stage,
  dim,
}: {
  label: string;
  hours: number;
  risk: import("../utils/types").RiskStatus;
  stage: LifecycleStage;
  dim?: boolean;
}) {
  return (
    <div className={`space-y-2 ${dim ? "opacity-60" : ""}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${dim ? "text-gray-400" : "text-teal-700"}`}>
        {label}
      </p>
      <p className="font-mono text-lg font-bold text-gray-900">{hours}h</p>
      <RiskBadge risk={risk} showTooltip={false} size="sm" />
      <StageBadge stage={stage} size="sm" />
    </div>
  );
}
