import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchCaseByIdentifier, fetchCaseUpdates, updateCase, AttritionCase, CaseUpdate } from "../api/api";
import { LifecycleStage } from "../utils/types";
import { calculateRiskStatus, inferLifecycleStage } from "../utils/riskLogic";
import RiskBadge from "../components/RiskBadge";
import StageBadge from "../components/StageBadge";
import ErrorBanner from "../components/ErrorBanner";
import Tooltip from "../components/Tooltip";
import { formatDate } from "../utils/formatters";
import { Search, RefreshCw, Calendar, Clock, TriangleAlert as AlertTriangle, ChevronLeft, ChevronRight, User, Building2, Briefcase, MapPin, Zap, ArrowRight, Check, History, Info } from "lucide-react";

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
  "Monitoring",
  "Under Review",
  "High Risk",
  "Critical Escalation",
  "PS Review",
  "Termination Recommended",
  "Workday Action Pending",
  "Exit Coordination",
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCaseNum = searchParams.get("case") || "";

  const [query, setQuery] = useState(initialCaseNum);
  const [searching, setSearching] = useState(false);
  const [caseData, setCaseData] = useState<AttritionCase | null>(null);
  const [caseUpdates, setCaseUpdates] = useState<CaseUpdate[]>([]);
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
      setCaseUpdates([]);
      try {
        const found = await fetchCaseByIdentifier(caseRef.trim());
        if (!found) {
          setError(`No case found for "${caseRef}"`);
        } else {
          setCaseData(found);
          setForm((prev) => ({
            ...prev,
            escalationRequired: found.escalationRequired,
            documentationRequired: found.documentationRequired,
          }));
          const updates = await fetchCaseUpdates(found.caseNumber);
          setCaseUpdates(updates);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setSearching(false);
      }
    },
    []
  );

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
      await updateCase({
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        riskStatus: newRisk || undefined,
        lifecycleStage: newStage || undefined,
        totalMissedHours: newHours,
        notes: form.notes,
        escalationRequired: form.escalationRequired,
        documentationRequired: form.documentationRequired,
        updateType: form.updateType,
        updatedBy: user?.displayName || "",
        updatedByEmail: user?.email || "",
        hoursAdded: form.hoursToAdd,
        updateNotes: form.notes,
      });
      setSuccess(`Case ${caseData.caseNumber} updated successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Modify Case</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            UPDATE CASE
          </h1>
          <p className="text-gray-500 text-sm mt-1">Search for a case and add an update</p>
        </div>
      </div>

      {/* Search Card with glass-morphism */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass-sm p-5">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Case Number or Oracle ID
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all bg-white/80"
              placeholder="e.g. EEC-2024-001 or ORG-123456"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchCase(query)}
            />
          </div>
          <button
            onClick={() => searchCase(query)}
            disabled={searching || !query.trim()}
            className="bg-gradient-teal hover:opacity-90 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
          >
            {searching && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Success State */}
      {success && (
        <div className="glass-card bg-gradient-to-r from-teal-50/80 to-white border border-teal-200/50 rounded-xl px-5 py-4 flex items-center gap-4 animate-scale-in">
          <div className="w-10 h-10 rounded-full bg-gradient-teal flex items-center justify-center shadow-glow-teal">
            <Check className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-teal-700 font-medium flex-1">{success}</p>
          <button
            onClick={() => { setSuccess(null); setForm(INITIAL_FORM); setCaseData(null); }}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
          >
            New Update
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Case Snapshot with enhanced design */}
      {caseData && !success && (
        <>
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass overflow-hidden animate-slide-up">
            {/* Case Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                  {caseData.caseNumber}
                </span>
                <RiskBadge risk={caseData.riskStatus} />
                <StageBadge stage={caseData.lifecycleStage} />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                caseData.caseStatus === "Active"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}>
                {caseData.caseStatus}
              </span>
            </div>

            {/* Case Details Grid */}
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoField icon={<User className="w-4 h-4" />} label="Trainee" value={caseData.traineeName} />
              <InfoField icon={<Briefcase className="w-4 h-4" />} label="Oracle ID" value={caseData.oracleId} mono />
              <InfoField icon={<Building2 className="w-4 h-4" />} label="Account" value={caseData.account} />
              <InfoField icon={<Building2 className="w-4 h-4" />} label="LOB" value={caseData.lob} />
              <InfoField icon={<MapPin className="w-4 h-4" />} label="Site" value={caseData.site} />
              <InfoField icon={<Calendar className="w-4 h-4" />} label="Incident" value={formatDate(caseData.incidentDate)} />
              <InfoField icon={<AlertTriangle className="w-4 h-4" />} label="Category" value={caseData.attritionCategory} />
              <InfoField icon={<Clock className="w-4 h-4" />} label="Total Hours" value={`${caseData.totalMissedHours}h`} mono highlight />
            </div>

            {/* Case Updates Info */}
            {caseUpdates.length > 0 ? (
              <div className="px-5 py-3 border-t border-gray-100 bg-gradient-to-r from-blue-50/50 to-white flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-blue-700 text-sm truncate block">
                    {caseUpdates.length} update{caseUpdates.length !== 1 ? "s" : ""} recorded
                  </span>
                  <span className="text-xs text-blue-500">
                    Last: {caseUpdates[0]?.updateType} by {caseUpdates[0]?.updatedBy}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-5 py-2 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400 flex items-center gap-2">
                <History className="w-4 h-4" />
                No previous updates found for this case.
              </div>
            )}
          </div>

          {/* Update Form */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass p-5 space-y-5">
            <h2 className="font-barlow-condensed font-semibold text-xl text-gray-900 tracking-wide flex items-center gap-2">
              <History className="w-5 h-5 text-teal-500" />
              ADD UPDATE
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Tooltip content="Select the type of update you're recording" position="top">
                <FormField label="Update Type" required>
                  <select
                    className={inputClass}
                    value={form.updateType}
                    onChange={(e) => update("updateType", e.target.value)}
                  >
                    <option value="">Select type...</option>
                    {UPDATE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
              </Tooltip>
              <Tooltip content="Type of absence if applicable" position="top">
                <FormField label="Absence Type">
                  <select
                    className={inputClass}
                    value={form.absenceType}
                    onChange={(e) => update("absenceType", e.target.value)}
                  >
                    <option value="">Select absence type...</option>
                    {ABSENCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
              </Tooltip>
              <Tooltip content="Hours to add to the total (optional)" position="top">
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
              </Tooltip>
              <Tooltip content="Date of absence if applicable" position="top">
                <FormField label="Absence Date">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.absenceDate}
                    onChange={(e) => update("absenceDate", e.target.value)}
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="Override automatic stage calculation (optional)" position="top">
                <FormField label="Override Stage" className="sm:col-span-2">
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
              </Tooltip>
            </div>

            {/* Toggles */}
            <div className="flex gap-8">
              <Tooltip content="Flag for escalation to management" position="top">
                <Toggle
                  label="Escalation Required"
                  value={form.escalationRequired}
                  onChange={(v) => update("escalationRequired", v)}
                />
              </Tooltip>
              <Tooltip content="Mark if documents are needed" position="top">
                <Toggle
                  label="Documentation Required"
                  value={form.documentationRequired}
                  onChange={(v) => update("documentationRequired", v)}
                />
              </Tooltip>
            </div>

            <Tooltip content="Describe the update details" position="top">
              <FormField label="Update Notes" required>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={4}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Describe the update, outcome, or next steps..."
                />
              </FormField>
            </Tooltip>

            {/* Live Diff Panel with enhanced design */}
            {form.hoursToAdd > 0 && newRisk && newStage && (
              <div className="glass-card bg-gradient-to-r from-gray-50/80 to-white border border-gray-200/50 rounded-xl p-4 animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Before / After Preview
                  </p>
                </div>

                {/* Threshold Warnings */}
                {(newHours >= 8 && caseData.totalMissedHours < 8) && (
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warning threshold (8h) crossed - escalation email will be triggered
                  </div>
                )}
                {(newHours >= 16 && caseData.totalMissedHours < 16) && (
                  <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Critical threshold (16h) crossed - PS notification will be sent
                  </div>
                )}

                {/* Diff Columns */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <DiffColumn
                    label="Current"
                    hours={caseData.totalMissedHours}
                    risk={caseData.riskStatus}
                    stage={caseData.lifecycleStage}
                    dim
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ArrowRight className="w-6 h-6 text-teal-500" />
                    <span className="text-xs font-mono text-teal-600 font-bold">+{form.hoursToAdd}h</span>
                  </div>
                  <DiffColumn
                    label="After Update"
                    hours={newHours}
                    risk={newRisk}
                    stage={newStage}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-5 border-t border-gray-100">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-teal hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {submitting ? "Submitting..." : "Submit Update"}
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
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all bg-white/80 backdrop-blur-sm";

function InfoField({ icon, label, value, mono, highlight }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <p className={`text-sm mt-0.5 ${highlight ? "font-bold text-teal-700" : "text-gray-800"} ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function FormField({ label, children, className = "", required }: { label: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={`w-11 h-6 rounded-full transition-all ${value ? "bg-gradient-teal shadow-glow-teal" : "bg-gray-300"} relative`}
        onClick={() => onChange(!value)}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
      </div>
      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
    </label>
  );
}

function DiffColumn({ label, hours, risk, stage, dim }: {
  label: string;
  hours: number;
  risk: import("../utils/types").RiskStatus;
  stage: LifecycleStage;
  dim?: boolean;
}) {
  return (
    <div className={`space-y-2 text-center rounded-xl p-3 ${dim ? "opacity-60 bg-gray-100/50" : "bg-teal-50/50 border border-teal-100"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${dim ? "text-gray-400" : "text-teal-700"}`}>
        {label}
      </p>
      <p className="font-mono text-2xl font-bold text-gray-900">{hours}h</p>
      <div className="flex justify-center">
        <RiskBadge risk={risk} showTooltip={false} size="sm" />
      </div>
      <div className="flex justify-center">
        <StageBadge stage={stage} size="sm" />
      </div>
    </div>
  );
}
