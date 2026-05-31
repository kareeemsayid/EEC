import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchAccounts, fetchLOBs, fetchSites } from "../api/sharepoint";
import { triggerCreateCase } from "../api/powerAutomate";
import { Account, LOB, Site, SeverityLevel, CreateCasePayload } from "../utils/types";
import { calculateRiskStatus, inferLifecycleStage } from "../utils/riskLogic";
import { SUB_REASON_MAP, ATTRITION_CATEGORIES } from "../utils/subReasons";
import StepIndicator from "../components/StepIndicator";
import RiskPreview from "../components/RiskPreview";
import ErrorBanner from "../components/ErrorBanner";
import LoadingSpinner from "../components/LoadingSpinner";
import { loginRequest } from "../auth/msalConfig";

const STEPS = ["Trainee Info", "Incident Details", "Manager & Notes"];

interface FormData {
  // Step 1
  traineeName: string;
  oracleId: string;
  personalEmail: string;
  accountId: string;
  lobId: string;
  siteId: string;
  wave: string;
  // Step 2
  attritionCategory: string;
  subReason: string;
  severityLevel: SeverityLevel;
  totalMissedHours: number;
  incidentDate: string;
  documentationRequired: boolean;
  escalationRequired: boolean;
  // Step 3
  trainingManager: string;
  trainingManagerEmail: string;
  notes: string;
}

const INITIAL: FormData = {
  traineeName: "",
  oracleId: "",
  personalEmail: "",
  accountId: "",
  lobId: "",
  siteId: "",
  wave: "",
  attritionCategory: "",
  subReason: "",
  severityLevel: "Low",
  totalMissedHours: 0,
  incidentDate: new Date().toISOString().split("T")[0],
  documentationRequired: false,
  escalationRequired: false,
  trainingManager: "",
  trainingManagerEmail: "",
  notes: "",
};

export default function SubmitCase() {
  const { userProfile, getAccessToken } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lobs, setLOBs] = useState<LOB[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ caseNumber: string; conversationId: string } | null>(null);

  const filteredLOBs = lobs.filter((l) => l.accountId === form.accountId);
  const riskStatus = calculateRiskStatus(form.totalMissedHours, form.severityLevel);
  const lifecycleStage = inferLifecycleStage(riskStatus, form.totalMissedHours);

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const [a, l, s] = await Promise.all([
        fetchAccounts(token),
        fetchLOBs(token),
        fetchSites(token),
      ]);
      setAccounts(a);
      setLOBs(l);
      setSites(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lookups");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "accountId" ? { lobId: "" } : {}),
      ...(key === "attritionCategory" ? { subReason: "" } : {}),
    }));
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.traineeName.trim()) return "Trainee name is required";
      if (!form.oracleId.trim()) return "Oracle ID is required";
      if (!form.personalEmail.trim() || !/\S+@\S+\.\S+/.test(form.personalEmail))
        return "Valid personal email is required";
      if (!form.accountId) return "Account is required";
      if (!form.lobId) return "LOB is required";
      if (!form.siteId) return "Site is required";
    }
    if (step === 2) {
      if (!form.attritionCategory) return "Attrition category is required";
      if (!form.subReason) return "Sub-reason is required";
      if (form.totalMissedHours < 0) return "Hours missed cannot be negative";
      if (!form.incidentDate) return "Incident date is required";
    }
    if (step === 3) {
      if (!form.trainingManager.trim()) return "Training manager name is required";
      if (!form.trainingManagerEmail.trim() || !/\S+@\S+\.\S+/.test(form.trainingManagerEmail))
        return "Valid training manager email is required";
    }
    return null;
  }

  function nextStep() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setSubmitting(true);

    try {
      const payload: CreateCasePayload = {
        traineeName: form.traineeName,
        oracleId: form.oracleId,
        personalEmail: form.personalEmail,
        accountId: form.accountId,
        lobId: form.lobId,
        siteId: form.siteId,
        wave: form.wave,
        trainerName: userProfile?.displayName || "",
        trainerEmail: userProfile?.email || "",
        trainingManager: form.trainingManager,
        trainingManagerEmail: form.trainingManagerEmail,
        attritionCategory: form.attritionCategory,
        subReason: form.subReason,
        severityLevel: form.severityLevel,
        totalMissedHours: form.totalMissedHours,
        incidentDate: form.incidentDate,
        riskStatus,
        lifecycleStage,
        caseStatus: "Open",
        notes: form.notes,
        documentationRequired: form.documentationRequired,
        escalationRequired: form.escalationRequired,
      };

      const result = await triggerCreateCase(payload);
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" label="Loading form data…" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center animate-fade-in">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="font-barlow-condensed text-2xl font-bold text-gray-900 tracking-wide mb-2">
          CASE SUBMITTED
        </h2>
        <p className="text-gray-500 mb-4">
          Case <span className="font-mono font-bold text-teal-700">{success.caseNumber}</span> has been created.
        </p>
        {success.conversationId && (
          <p className="text-xs text-gray-400 mb-6">
            Outlook thread ID: <span className="font-mono">{success.conversationId}</span>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(null); setForm(INITIAL); setStep(1); }}
            className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Submit Another
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
          SUBMIT CASE
        </h1>
        <p className="text-gray-500 text-sm mt-1">Create a new attrition case record</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
        {/* Step 1: Trainee Info */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <SectionTitle>Trainee Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Trainee Full Name *">
                <input
                  type="text"
                  className={inputClass}
                  value={form.traineeName}
                  onChange={(e) => update("traineeName", e.target.value)}
                  placeholder="First Last"
                />
              </FormField>
              <FormField label="Oracle ID *">
                <input
                  type="text"
                  className={`${inputClass} font-mono`}
                  value={form.oracleId}
                  onChange={(e) => update("oracleId", e.target.value)}
                  placeholder="ORG-123456"
                />
              </FormField>
              <FormField label="Personal Email *">
                <input
                  type="email"
                  className={inputClass}
                  value={form.personalEmail}
                  onChange={(e) => update("personalEmail", e.target.value)}
                  placeholder="trainee@personal.com"
                />
              </FormField>
              <FormField label="Wave">
                <input
                  type="text"
                  className={inputClass}
                  value={form.wave}
                  onChange={(e) => update("wave", e.target.value)}
                  placeholder="e.g. 2024-Q3-01"
                />
              </FormField>
              <FormField label="Account *">
                <select
                  className={inputClass}
                  value={form.accountId}
                  onChange={(e) => update("accountId", e.target.value)}
                >
                  <option value="">Select account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="LOB *">
                <select
                  className={inputClass}
                  value={form.lobId}
                  onChange={(e) => update("lobId", e.target.value)}
                  disabled={!form.accountId}
                >
                  <option value="">
                    {form.accountId ? "Select LOB…" : "Select account first"}
                  </option>
                  {filteredLOBs.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Site *" className="sm:col-span-2">
                <select
                  className={inputClass}
                  value={form.siteId}
                  onChange={(e) => update("siteId", e.target.value)}
                >
                  <option value="">Select site…</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        )}

        {/* Step 2: Incident Details */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <SectionTitle>Incident Details</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Attrition Category *">
                <select
                  className={inputClass}
                  value={form.attritionCategory}
                  onChange={(e) => update("attritionCategory", e.target.value)}
                >
                  <option value="">Select category…</option>
                  {ATTRITION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sub-Reason *">
                <select
                  className={inputClass}
                  value={form.subReason}
                  onChange={(e) => update("subReason", e.target.value)}
                  disabled={!form.attritionCategory}
                >
                  <option value="">
                    {form.attritionCategory ? "Select sub-reason…" : "Select category first"}
                  </option>
                  {(SUB_REASON_MAP[form.attritionCategory] || []).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Severity Level *">
                <select
                  className={inputClass}
                  value={form.severityLevel}
                  onChange={(e) => update("severityLevel", e.target.value as SeverityLevel)}
                >
                  {(["Low", "Medium", "High", "Critical"] as SeverityLevel[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Hours Missed *">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={`${inputClass} font-mono`}
                  value={form.totalMissedHours}
                  onChange={(e) => update("totalMissedHours", parseFloat(e.target.value) || 0)}
                />
              </FormField>
              <FormField label="Incident Date *" className="sm:col-span-2">
                <input
                  type="date"
                  className={inputClass}
                  value={form.incidentDate}
                  onChange={(e) => update("incidentDate", e.target.value)}
                />
              </FormField>
            </div>

            {/* Toggles */}
            <div className="flex gap-6 pt-1">
              <Toggle
                label="Documentation Required"
                value={form.documentationRequired}
                onChange={(v) => update("documentationRequired", v)}
              />
              <Toggle
                label="Escalation Required"
                value={form.escalationRequired}
                onChange={(v) => update("escalationRequired", v)}
              />
            </div>

            {/* Live Risk Preview */}
            <RiskPreview hours={form.totalMissedHours} severity={form.severityLevel} />
          </div>
        )}

        {/* Step 3: Manager & Notes */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <SectionTitle>Manager & Notes</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Training Manager Name *">
                <input
                  type="text"
                  className={inputClass}
                  value={form.trainingManager}
                  onChange={(e) => update("trainingManager", e.target.value)}
                  placeholder="Manager Full Name"
                />
              </FormField>
              <FormField label="Training Manager Email *">
                <input
                  type="email"
                  className={inputClass}
                  value={form.trainingManagerEmail}
                  onChange={(e) => update("trainingManagerEmail", e.target.value)}
                  placeholder="manager@concentrix.com"
                />
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea
                className={`${inputClass} resize-none`}
                rows={5}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Additional context, observations, or action items…"
              />
            </FormField>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Case Summary</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <Summary label="Trainee" value={form.traineeName} />
                <Summary label="Oracle ID" value={form.oracleId} mono />
                <Summary label="Category" value={form.attritionCategory} />
                <Summary label="Hours" value={`${form.totalMissedHours}h`} mono />
              </div>
              <RiskPreview hours={form.totalMissedHours} severity={form.severityLevel} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => (step === 1 ? navigate("/") : setStep((s) => s - 1))}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={nextStep}
              className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {submitting ? "Submitting…" : "Submit Case"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-barlow-condensed font-semibold text-xl text-gray-900 tracking-wide">
      {children}
    </h2>
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

function Summary({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <span className={`text-xs text-gray-800 ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}
