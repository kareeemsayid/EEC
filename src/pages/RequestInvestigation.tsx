import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { playSound } from "../utils/sound";
import {
  ChevronLeft,
  FileSearch,
  TriangleAlert as AlertTriangle,
  Send,
  User,
  Calendar,
  ChevronRight,
  Check,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { createInvestigation, InvestigationType, InvestigationPriority } from "../api/api";

const INVESTIGATION_TYPES: InvestigationType[] = [
  "Employee Complaint",
  "Manager Escalation",
  "Policy Violation",
  "Attendance Breach",
  "Performance Concern",
  "Client Complaint",
  "Other",
];

const PRIORITIES: { value: InvestigationPriority; label: string; color: string }[] = [
  { value: "Low", label: "Low", color: "bg-green-500" },
  { value: "Medium", label: "Medium", color: "bg-amber-500" },
  { value: "High", label: "High", color: "bg-orange-500" },
  { value: "Critical", label: "Critical", color: "bg-red-500" },
];

export default function RequestInvestigation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    traineeName: "",
    oracleId: "",
    caseNumber: "",
    investigationType: "Employee Complaint" as InvestigationType,
    priority: "Medium" as InvestigationPriority,
    summary: "",
    details: "",
    assignedTo: "",
    assignedToEmail: "",
    dueDate: "",
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await createInvestigation({
        traineeName: form.traineeName,
        oracleId: form.oracleId,
        caseNumber: form.caseNumber || undefined,
        investigationType: form.investigationType,
        priority: form.priority,
        summary: form.summary,
        details: form.details,
        assignedTo: form.assignedTo,
        assignedToEmail: form.assignedToEmail,
        dueDate: form.dueDate,
      });
      playSound("success");
      toast.success(
        <div>
          <div className="font-bold">Investigation request created!</div>
          <div className="text-xs mt-1">Reference: {result.investigationNumber}</div>
        </div>,
        { duration: 5000 }
      );
      navigate("/investigations");
    } catch (err) {
      toast.error("Failed to create investigation. Please try again.");
      playSound("error");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = form.traineeName && form.oracleId;
  const isStep2Valid = form.summary && form.details;
  const isStep3Valid = form.assignedTo && form.assignedToEmail && form.dueDate;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSearch className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">
              Investigations
            </span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            REQUEST HR INVESTIGATION
          </h1>
          <p className="text-gray-500 text-sm mt-1">Submit a request for HR investigation review</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${step === s ? "bg-gradient-teal text-white shadow-glow-teal" : step > s ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-0.5 rounded-full transition-all ${step > s ? "bg-teal-500" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-6 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide flex items-center gap-2">
              <User className="w-5 h-5 text-teal-500" />
              Trainee Information
            </h3>
            <InputField
              label="Trainee Name"
              value={form.traineeName}
              onChange={(v) => updateForm("traineeName", v)}
              placeholder="Enter trainee's full name"
              required
            />
            <InputField
              label="Oracle ID"
              value={form.oracleId}
              onChange={(v) => updateForm("oracleId", v)}
              placeholder="Enter Oracle ID"
              required
            />
            <InputField
              label="Case Number (optional)"
              value={form.caseNumber}
              onChange={(v) => updateForm("caseNumber", v)}
              placeholder="Existing case number if applicable"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Investigation Type</label>
              <div className="grid grid-cols-2 gap-2">
                {INVESTIGATION_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateForm("investigationType", type)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all
                      ${form.investigationType === type ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-teal-500" />
              Investigation Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => updateForm("priority", p.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all
                      ${form.priority === p.value ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${p.color}`} />
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <TextAreaField
              label="Summary"
              value={form.summary}
              onChange={(v) => updateForm("summary", v)}
              placeholder="Brief summary of the investigation request"
              required
              rows={2}
            />
            <TextAreaField
              label="Details"
              value={form.details}
              onChange={(v) => updateForm("details", v)}
              placeholder="Detailed description of the incident or concern"
              required
              rows={4}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-500" />
              Assignment &amp; Due Date
            </h3>
            <InputField
              label="Assign To"
              value={form.assignedTo}
              onChange={(v) => updateForm("assignedTo", v)}
              placeholder="HR representative name"
              required
            />
            <InputField
              label="Assignee Email"
              value={form.assignedToEmail}
              onChange={(v) => updateForm("assignedToEmail", v)}
              placeholder="Email address"
              required
              type="email"
            />
            <InputField
              label="Due Date"
              value={form.dueDate}
              onChange={(v) => updateForm("dueDate", v)}
              placeholder="Select due date"
              required
              type="date"
              icon={<Calendar className="w-4 h-4 text-gray-400" />}
            />

            <div className="bg-canvas border border-gray-200 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-800">Request Summary</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  <span className="font-medium">Trainee:</span> {form.traineeName}
                </div>
                <div>
                  <span className="font-medium">Oracle ID:</span> {form.oracleId}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {form.investigationType}
                </div>
                <div>
                  <span className="font-medium">Priority:</span> {form.priority}
                </div>
                <div>
                  <span className="font-medium">Assigned To:</span> {form.assignedTo}
                </div>
                <div>
                  <span className="font-medium">Due Date:</span> {form.dueDate}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Previous
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="bg-gradient-teal hover:shadow-glow-teal text-white font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStep3Valid || loading}
              className="bg-gradient-teal hover:shadow-glow-teal text-white font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  required,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors ${
            icon ? "pl-10" : ""
          }`}
          required={required}
        />
      </div>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors resize-none"
        required={required}
      />
    </div>
  );
}
