import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CircleCheck as CheckCircle2, Loader as Loader2, User, Building2, FileText, CircleAlert as AlertCircle } from "lucide-react";
import { apiFetch } from "../api";
import { useAuth } from "../auth/useAuth";
import toast from "react-hot-toast";

type YNValue = "Yes" | "No" | "N/A";

interface FormData {
  account: string;
  lob: string;
  employeeName: string;
  oracleId: string;
  status: string;
  lastDayWorking: string;
  terminationReason: string;
  comment: string;
  resignationSubmitted: YNValue;
  headsetReturned: YNValue;
  medicalCardReturned: YNValue;
  accessCardReturned: YNValue;
  tokenReturned: YNValue;
  userDeactivated: YNValue;
  signedResign: YNValue;
  freezeDocuments: YNValue;
  freezeSalary: YNValue;
}

const EMPTY_FORM: FormData = {
  account: "",
  lob: "",
  employeeName: "",
  oracleId: "",
  status: "",
  lastDayWorking: "",
  terminationReason: "",
  comment: "",
  resignationSubmitted: "N/A",
  headsetReturned: "N/A",
  medicalCardReturned: "N/A",
  accessCardReturned: "N/A",
  tokenReturned: "N/A",
  userDeactivated: "N/A",
  signedResign: "N/A",
  freezeDocuments: "N/A",
  freezeSalary: "N/A",
};

const STATUS_OPTIONS = ["New Hire", "In Training", "On Production", "Probation", "Terminated"];

export default function TerminationSheetForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [accounts, setAccounts] = useState<{ id: number; title: string }[]>([]);
  const [lobs, setLobs] = useState<{ id: number; title: string; accountId: number }[]>([]);
  const [filteredLobs, setFilteredLobs] = useState<{ id: number; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadAccounts = useCallback(async () => {
    try {
      const data = await apiFetch<{ id: number; title: string }[]>("/accounts");
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  }, []);

  const loadLobs = useCallback(async () => {
    try {
      const data = await apiFetch<{ id: number; title: string; accountId: number }[]>("/lobs");
      setLobs(data);
    } catch (err) {
      console.error("Failed to load LOBs:", err);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    loadLobs();
  }, [loadAccounts, loadLobs]);

  useEffect(() => {
    if (form.account) {
      const accountRecord = accounts.find(a => a.title === form.account);
      if (accountRecord) {
        setFilteredLobs(lobs.filter(l => l.accountId === accountRecord.id));
      } else {
        setFilteredLobs([]);
      }
    } else {
      setFilteredLobs([]);
    }
  }, [form.account, accounts, lobs]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.account) e.account = "Account is required";
    if (!form.lob) e.lob = "LOB is required";
    if (!form.employeeName.trim()) e.employeeName = "Employee name is required";
    if (!form.oracleId.trim()) e.oracleId = "Oracle ID is required";
    if (!form.status) e.status = "Status is required";
    if (!form.lastDayWorking.trim()) e.lastDayWorking = "Last day working is required";
    if (!form.terminationReason.trim()) e.terminationReason = "Termination reason is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/termination/sheet", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          submittedBy: user?.email,
          submittedByName: user?.displayName,
        }),
      });
      setSuccess(true);
      toast.success("Termination sheet submitted successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit termination sheet";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 150, delay: 0.2 }}
            className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sheet Submitted!</h2>
          <p className="text-sm text-gray-500 mb-6">
            The termination sheet has been submitted. PS team and relevant stakeholders have been notified via email and in-app notifications.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 100%)" }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => { setForm(EMPTY_FORM); setSuccess(false); }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate("/termination/workday")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workday Check
        </button>
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 50%, #0D2B45 100%)" }}
        >
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
          />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.2)" }}>
              <FileText className="w-6 h-6" style={{ color: "#F97316" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Termination Sheet</h1>
              <p className="text-sm text-white/60 mt-0.5">Fill out all required fields to submit the termination sheet</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6"
      >
        {/* Section: Employee Information */}
        <FormSection title="Employee Information" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Account" required error={errors.account}>
              <select
                value={form.account}
                onChange={e => { updateField("account", e.target.value); updateField("lob", ""); }}
                className="form-input"
              >
                <option value="">Select account...</option>
                {accounts.map(a => <option key={a.id} value={a.title}>{a.title}</option>)}
              </select>
            </FormField>
            <FormField label="LOB" required error={errors.lob}>
              <select
                value={form.lob}
                onChange={e => updateField("lob", e.target.value)}
                className="form-input"
                disabled={!form.account}
              >
                <option value="">{form.account ? "Select LOB..." : "Select account first..."}</option>
                {filteredLobs.map(l => <option key={l.id} value={l.title}>{l.title}</option>)}
              </select>
            </FormField>
            <FormField label="Employee Name" required error={errors.employeeName} placeholder="e.g., Mahmoud Taher Mustafa Mahmoud">
              <input
                type="text"
                value={form.employeeName}
                onChange={e => updateField("employeeName", e.target.value)}
                className="form-input"
                placeholder="e.g., Mahmoud Taher Mustafa Mahmoud"
              />
            </FormField>
            <FormField label="Oracle ID" required error={errors.oracleId} placeholder="e.g., 103615002">
              <input
                type="text"
                value={form.oracleId}
                onChange={e => updateField("oracleId", e.target.value)}
                className="form-input"
                placeholder="e.g., 103615002"
              />
            </FormField>
            <FormField label="Status" required error={errors.status}>
              <select
                value={form.status}
                onChange={e => updateField("status", e.target.value)}
                className="form-input"
              >
                <option value="">Select status...</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Last Day Working" required error={errors.lastDayWorking} placeholder="e.g., 26/6/2026">
              <input
                type="text"
                value={form.lastDayWorking}
                onChange={e => updateField("lastDayWorking", e.target.value)}
                className="form-input"
                placeholder="e.g., 26/6/2026"
              />
            </FormField>
          </div>
        </FormSection>

        {/* Section: Termination Details */}
        <FormSection title="Termination Details" icon={FileText}>
          <FormField label="Termination Reason" required error={errors.terminationReason}>
            <textarea
              value={form.terminationReason}
              onChange={e => updateField("terminationReason", e.target.value)}
              className="form-input min-h-[60px] resize-y"
              placeholder="e.g., Dissatisfied w/ type of work > Unhappy with call center job"
            />
          </FormField>
          <FormField label="Comment">
            <textarea
              value={form.comment}
              onChange={e => updateField("comment", e.target.value)}
              className="form-input min-h-[80px] resize-y"
              placeholder="Additional comments..."
            />
          </FormField>
        </FormSection>

        {/* Section: Equipment & System Status */}
        <FormSection title="Equipment & System Status" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <YNField label="Employee submitted resignation on system" value={form.resignationSubmitted} onChange={v => updateField("resignationSubmitted", v)} />
            <YNField label="Headset Returned" value={form.headsetReturned} onChange={v => updateField("headsetReturned", v)} />
            <YNField label="Medical Card Returned" value={form.medicalCardReturned} onChange={v => updateField("medicalCardReturned", v)} />
            <YNField label="Access Card Returned" value={form.accessCardReturned} onChange={v => updateField("accessCardReturned", v)} />
            <YNField label="Token Returned" value={form.tokenReturned} onChange={v => updateField("tokenReturned", v)} />
            <YNField label="User Deactivated" value={form.userDeactivated} onChange={v => updateField("userDeactivated", v)} />
            <YNField label="Signed Resign." value={form.signedResign} onChange={v => updateField("signedResign", v)} />
            <YNField label="Freeze Documents" value={form.freezeDocuments} onChange={v => updateField("freezeDocuments", v)} />
            <YNField label="Freeze Salary" value={form.freezeSalary} onChange={v => updateField("freezeSalary", v)} />
          </div>
        </FormSection>

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 100%)" }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Termination Sheet
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      <style>{`
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          font-size: 14px;
          color: #1f2937;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: #1E3A5F;
          box-shadow: 0 0 0 3px rgba(30,58,95,0.1);
        }
        .form-input:disabled {
          background: #F9FAFB;
          color: #9CA3AF;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(30,58,95,0.1)" }}>
          <Icon className="w-4 h-4" style={{ color: "#1E3A5F" }} />
        </div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-4 ml-10">{children}</div>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  placeholder,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function YNField({ label, value, onChange }: { label: string; value: YNValue; onChange: (v: YNValue) => void }) {
  const options: YNValue[] = ["Yes", "No", "N/A"];
  const colors: Record<YNValue, { bg: string; text: string; border: string; activeBg: string }> = {
    "Yes": { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", activeBg: "#10B981" },
    "No": { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", activeBg: "#EF4444" },
    "N/A": { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", activeBg: "#9CA3AF" },
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="flex gap-2">
        {options.map(opt => {
          const isActive = value === opt;
          const c = colors[opt];
          return (
            <motion.button
              key={opt}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(opt)}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all border-2"
              style={{
                background: isActive ? c.activeBg : c.bg,
                color: isActive ? "#fff" : c.text,
                borderColor: isActive ? c.activeBg : c.border,
              }}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
