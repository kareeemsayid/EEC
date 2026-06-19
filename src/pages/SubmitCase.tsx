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
import Tooltip from "../components/Tooltip";
import { loginRequest } from "../auth/msalConfig";
import {
  User,
  Mail,
  Briefcase,
  AlertTriangle,
  FileText,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Info,
  Zap,
  RefreshCw,
} from "lucide-react";

const STEPS = ["Trainee Info", "Incident Details", "Manager & Notes"];

interface FormData {
  traineeName: string;
  oracleId: string;
  personalEmail: string;
  workEmail: string;
  accountId: string;
  lobId: string;
  siteId: string;
  wave: string;
  attritionCategory: string;
  subReason: string;
  severityLevel: SeverityLevel;
  totalMissedHours: number;
  incidentDate: string;
  documentationRequired: boolean;
  escalationRequired: boolean;
  trainingManager: string;
  trainingManagerEmail: string;
  notes: string;
}

const INITIAL: FormData = {
  traineeName: "",
  oracleId: "",
  personalEmail: "",
  workEmail: "",
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
  const { user, getAccessToken } = useAuth();
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
      const accountTitle = accounts.find((a) => a.id === form.accountId)?.title || form.accountId;
      const lobTitle = lobs.find((l) => l.id === form.lobId)?.title || form.lobId;
      const siteTitle = sites.find((s) => s.id === form.siteId)?.title || form.siteId;

      const payload: CreateCasePayload = {
        traineeName: form.traineeName,
        oracleId: form.oracleId,
        personalEmail: form.personalEmail,
        workEmail: form.workEmail,
        account: accountTitle,
        lob: lobTitle,
        site: siteTitle,
        wave: form.wave,
        trainerName: user?.displayName || "",
        trainerEmail: user?.email || "",
        trainingManager: form.trainingManager,
        trainingManagerEmail: form.trainingManagerEmail,
        attritionCategory: form.attritionCategory,
        subReason: form.subReason,
        severityLevel: form.severityLevel,
        totalMissedHours: form.totalMissedHours,
        incidentDate: form.incidentDate,
        riskStatus,
        lifecycleStage,
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
        <LoadingSpinner size="lg" label="Loading form data..." />
      </div>
    );
  }

  // Success State with animation
  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center animate-scale-in">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-teal rounded-full opacity-20 animate-ping" />
          <div className="relative w-24 h-24 bg-gradient-teal rounded-full flex items-center justify-center shadow-glow-teal-lg">
            <Check className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-teal-500" />
          <h2 className="font-barlow-condensed text-2xl font-bold text-gray-900 tracking-wide">
            CASE SUBMITTED
          </h2>
        </div>
        <p className="text-gray-500 mb-4">
          Case <span className="font-mono font-bold text-teal-700 text-lg">{success.caseNumber}</span> has been created and the team has been notified.
        </p>
        {success.conversationId && (
          <p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-1">
            <Mail className="w-4 h-4" />
            Outlook thread ID: <span className="font-mono">{success.conversationId}</span>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(null); setForm(INITIAL); setStep(1); }}
            className="bg-gradient-teal hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-glow-teal flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Submit Another
          </button>
          <button
            onClick={() => navigate("/")}
            className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 text-gray-700 hover:bg-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedAccount = accounts.find((a) => a.id === form.accountId);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-teal-500" />
          <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">New Case</span>
        </div>
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

      {/* Account thresholds hint */}
      {selectedAccount && step === 2 && (
        <div className="mb-4 glass-card bg-gradient-to-r from-teal-50/80 to-white border border-teal-200/50 rounded-xl px-4 py-3 text-sm text-teal-700 flex gap-6 items-center animate-fade-in">
          <Info className="w-4 h-4 text-teal-500 shrink-0" />
          <span className="font-mono">Warning: <strong>{selectedAccount.warningHours}h</strong></span>
          <span className="font-mono">Critical: <strong>{selectedAccount.criticalHours}h</strong></span>
          <span className="font-mono">Doc grace: <strong>{selectedAccount.documentGraceHours}h</strong></span>
        </div>
      )}

      {/* Form Card with glass-morphism */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-6 space-y-6">
        {/* Step 1: Trainee Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in-up">
            <SectionTitle icon={<User className="w-5 h-5" />}>Trainee Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Tooltip content="Full name as per HR records" position="top">
                <FormField label="Trainee Full Name" required>
                  <input
                    type="text"
                    className={inputClass}
                    value={form.traineeName}
                    onChange={(e) => update("traineeName", e.target.value)}
                    placeholder="First Last"
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="Unique Oracle employee identifier" position="top">
                <FormField label="Oracle ID" required>
                  <input
                    type="text"
                    className={`${inputClass} font-mono`}
                    value={form.oracleId}
                    onChange={(e) => update("oracleId", e.target.value)}
                    placeholder="ORG-123456"
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="Personal email for emergency contact" position="top">
                <FormField label="Personal Email" required>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.personalEmail}
                    onChange={(e) => update("personalEmail", e.target.value)}
                    placeholder="trainee@personal.com"
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="Concentrix work email (optional)" position="top">
                <FormField label="Work Email">
                  <input
                    type="email"
                    className={inputClass}
                    value={form.workEmail}
                    onChange={(e) => update("workEmail", e.target.value)}
                    placeholder="trainee@concentrix.com"
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="Training batch or cohort identifier" position="top">
                <FormField label="Wave">
                  <input
                    type="text"
                    className={inputClass}
                    value={form.wave}
                    onChange={(e) => update("wave", e.target.value)}
                    placeholder="e.g. 2024-Q3-01"
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="Client or business unit" position="top">
                <FormField label="Account" required>
                  <select
                    className={inputClass}
                    value={form.accountId}
                    onChange={(e) => update("accountId", e.target.value)}
                  >
                    <option value="">Select account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </FormField>
              </Tooltip>
              <Tooltip content="Line of business within the account" position="top">
                <FormField label="LOB" required>
                  <select
                    className={inputClass}
                    value={form.lobId}
                    onChange={(e) => update("lobId", e.target.value)}
                    disabled={!form.accountId}
                  >
                    <option value="">
                      {form.accountId ? "Select LOB..." : "Select account first"}
                    </option>
                    {filteredLOBs.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </FormField>
              </Tooltip>
              <Tooltip content="Office or location" position="top">
                <FormField label="Site" required>
                  <select
                    className={inputClass}
                    value={form.siteId}
                    onChange={(e) => update("siteId", e.target.value)}
                  >
                    <option value="">Select site...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </FormField>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Step 2: Incident Details */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in-up">
            <SectionTitle icon={<AlertTriangle className="w-5 h-5" />}>Incident Details</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Tooltip content="Primary reason for attrition tracking" position="top">
                <FormField label="Attrition Category" required>
                  <select
                    className={inputClass}
                    value={form.attritionCategory}
                    onChange={(e) => update("attritionCategory", e.target.value)}
                  >
                    <option value="">Select category...</option>
                    {ATTRITION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </FormField>
              </Tooltip>
              <Tooltip content="Specific reason within the category" position="top">
                <FormField label="Sub-Reason" required>
                  <select
                    className={inputClass}
                    value={form.subReason}
                    onChange={(e) => update("subReason", e.target.value)}
                    disabled={!form.attritionCategory}
                  >
                    <option value="">
                      {form.attritionCategory ? "Select sub-reason..." : "Select category first"}
                    </option>
                    {(SUB_REASON_MAP[form.attritionCategory] || []).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </FormField>
              </Tooltip>
              <Tooltip content="Impact level of this incident" position="top">
                <FormField label="Severity Level" required>
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
              </Tooltip>
              <Tooltip content="Total hours missed from training" position="top">
                <FormField label="Hours Missed" required>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={`${inputClass} font-mono`}
                    value={form.totalMissedHours}
                    onChange={(e) => update("totalMissedHours", parseFloat(e.target.value) || 0)}
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="When the incident occurred" position="top">
                <FormField label="Incident Date" required className="sm:col-span-2">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.incidentDate}
                    onChange={(e) => update("incidentDate", e.target.value)}
                  />
                </FormField>
              </Tooltip>
            </div>

            {/* Toggles */}
            <div className="flex gap-8 pt-2">
              <Tooltip content="Mark if supporting documents are needed" position="top">
                <Toggle
                  label="Documentation Required"
                  value={form.documentationRequired}
                  onChange={(v) => update("documentationRequired", v)}
                />
              </Tooltip>
              <Tooltip content="Flag for management escalation" position="top">
                <Toggle
                  label="Escalation Required"
                  value={form.escalationRequired}
                  onChange={(v) => update("escalationRequired", v)}
                />
              </Tooltip>
            </div>

            {/* Live Risk Preview */}
            <RiskPreview hours={form.totalMissedHours} severity={form.severityLevel} />
          </div>
        )}

        {/* Step 3: Manager & Notes */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in-up">
            <SectionTitle icon={<UserCog className="w-5 h-5" />}>Manager & Notes</SectionTitle>

            {/* Auto-filled trainer info */}
            <div className="glass-card bg-gradient-to-r from-teal-50/80 to-white border border-teal-200/50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <User className="w-3 h-3" />
                Submitting Trainer
              </p>
              <p className="text-teal-900 font-semibold">{user?.displayName || "—"}</p>
              <p className="text-teal-600 text-sm flex items-center gap-2 mt-0.5">
                <Mail className="w-3 h-3" />
                {user?.email || "—"}
                <span className="text-teal-400">·</span>
                <Briefcase className="w-3 h-3" />
                {user?.jobTitle || "Trainer"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Tooltip content="Direct supervisor or manager name" position="top">
                <FormField label="Training Manager Name" required>
                  <input
                    type="text"
                    className={inputClass}
                    value={form.trainingManager}
                    onChange={(e) => update("trainingManager", e.target.value)}
                    placeholder="Manager Full Name"
                  />
                </FormField>
              </Tooltip>
              <Tooltip content="Manager's email for notifications" position="top">
                <FormField label="Training Manager Email" required>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.trainingManagerEmail}
                    onChange={(e) => update("trainingManagerEmail", e.target.value)}
                    placeholder="manager@concentrix.com"
                  />
                </FormField>
              </Tooltip>
            </div>
            <Tooltip content="Additional context or observations" position="top">
              <FormField label="Notes">
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={4}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Additional context, observations, or action items..."
                />
              </FormField>
            </Tooltip>

            {/* Case Summary with enhanced design */}
            <div className="glass-card bg-gray-50/80 border border-gray-200/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Case Summary
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Summary label="Trainee" value={form.traineeName} />
                <Summary label="Oracle ID" value={form.oracleId} mono />
                <Summary label="Account" value={accounts.find((a) => a.id === form.accountId)?.title || "—"} />
                <Summary label="Category" value={form.attritionCategory} />
                <Summary label="Hours" value={`${form.totalMissedHours}h`} mono highlight />
                <Summary label="Severity" value={form.severityLevel} />
              </div>
              <RiskPreview hours={form.totalMissedHours} severity={form.severityLevel} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100">
          <button
            onClick={() => (step === 1 ? navigate("/") : setStep((s) => s - 1))}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={nextStep}
              className="bg-gradient-teal hover:opacity-90 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <Tooltip content="Submit case and notify stakeholders" position="left">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-teal hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
              >
                {submitting && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {submitting ? "Submitting..." : "Submit Case"}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all bg-white/80 backdrop-blur-sm disabled:bg-gray-50 disabled:text-gray-400";

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

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <h2 className="font-barlow-condensed font-semibold text-xl text-gray-900 tracking-wide flex items-center gap-2 mb-4">
      <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
        {icon}
      </span>
      {children}
    </h2>
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

function Summary({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex gap-2 items-baseline">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <span className={`text-xs ${mono ? "font-mono" : ""} ${highlight ? "font-bold text-teal-700" : "text-gray-800"}`}>
        {value || "—"}
      </span>
    </div>
  );
}
