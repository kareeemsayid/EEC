import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  User,
  Building2,
  Calendar,
  TrendingUp,
  Mail,
  Send,
  Loader2,
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { AttritionCase } from "../api/api";
import { formatHours, formatDate } from "../utils/formatters";

interface TerminationSheetModalProps {
  selectedCase: AttritionCase;
  sending: boolean;
  onSend: (formData: TerminationFormData) => Promise<void>;
  onClose: () => void;
}

export interface TerminationFormData {
  recipientEmail: string;
  ccEmails: string;
  subject: string;
  notes: string;
  // Extended fields from the form
  account?: string;
  lob?: string;
  employeeName?: string;
  oracleId?: string;
  status?: string;
  lastDayWorking?: string;
  terminationReason?: string;
  comment?: string;
  employeeSubmittedResignation?: boolean;
  headsetReturned?: boolean;
  medicalCardReturned?: boolean;
  accessCardReturned?: boolean;
  tokenReturned?: boolean;
  userDeactivated?: boolean;
  signedResignation?: boolean;
  freezeDocuments?: boolean;
  freezeSalary?: boolean;
}

const WORKDAY_URL = "https://www.myworkday.com/cnx/d/home.htmld";

export default function TerminationSheetModal({
  selectedCase,
  sending,
  onSend,
  onClose,
}: TerminationSheetModalProps) {
  const [step, setStep] = useState<"workday-check" | "form">("workday-check");
  const [workdayCompleted, setWorkdayCompleted] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<TerminationFormData>({
    recipientEmail: "",
    ccEmails: "",
    subject: "",
    notes: "",
    account: selectedCase.account || "",
    lob: "",
    employeeName: selectedCase.traineeName || "",
    oracleId: selectedCase.oracleId || "",
    status: "Pending",
    lastDayWorking: "",
    terminationReason: "",
    comment: "",
    employeeSubmittedResignation: false,
    headsetReturned: false,
    medicalCardReturned: false,
    accessCardReturned: false,
    tokenReturned: false,
    userDeactivated: false,
    signedResignation: false,
    freezeDocuments: false,
    freezeSalary: false,
  });

  const handleWorkdayResponse = (completed: boolean) => {
    setWorkdayCompleted(completed);
    if (completed) {
      setTimeout(() => setStep("form"), 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSend(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => !sending && onClose()}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{
            background: "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,196,180,0.1)",
          }}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-32 opacity-[0.03]"
              style={{
                background: "conic-gradient(from 0deg, #00C4B4, #EF4444, #2563EB, #00C4B4)",
              }}
            />
          </div>

          {/* Header */}
          <div
            className="relative p-6 border-b"
            style={{
              background: "linear-gradient(135deg, #FEF2F2 0%, #FFF 100%)",
              borderColor: "rgba(239,68,68,0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                    boxShadow: "0 8px 24px rgba(239,68,68,0.3)",
                  }}
                >
                  <Send className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ border: "2px solid rgba(239,68,68,0.3)" }}
                  />
                </motion.div>
                <div>
                  <h2 className="font-barlow-condensed text-2xl font-bold text-slate-900">
                    SEND TERMINATION SHEET
                  </h2>
                  <p className="text-sm text-slate-500">
                    {step === "workday-check" ? "Verify Workday completion" : "Complete the termination form"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={sending}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step === "workday-check"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {step === "workday-check" ? "1. Workday Check" : "1. Completed"}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step === "form"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                2. Termination Form
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6">
            <AnimatePresence mode="wait">
              {step === "workday-check" ? (
                // Step 1: Workday Check
                <motion.div
                  key="workday-check"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Question */}
                  <div className="text-center py-6">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4"
                      style={{
                        background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))",
                        border: "2px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      Is the termination action completed in Workday?
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Before sending the termination sheet, please ensure the termination has been processed in Workday.
                    </p>
                  </div>

                  {/* Response buttons */}
                  <div className="flex gap-4 justify-center">
                    <motion.button
                      onClick={() => handleWorkdayResponse(false)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 max-w-[200px] px-6 py-4 rounded-2xl border-2 transition-all"
                      style={{
                        background: workdayCompleted === false ? "rgba(239,68,68,0.1)" : "white",
                        borderColor: workdayCompleted === false ? "#EF4444" : "#E2E8F0",
                        color: workdayCompleted === false ? "#EF4444" : "#64748B",
                      }}
                    >
                      <X className="w-6 h-6 mx-auto mb-2" />
                      <span className="font-semibold">No, not yet</span>
                    </motion.button>
                    <motion.button
                      onClick={() => handleWorkdayResponse(true)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 max-w-[200px] px-6 py-4 rounded-2xl border-2 transition-all"
                      style={{
                        background: workdayCompleted === true ? "linear-gradient(135deg, #EF4444, #DC2626)" : "white",
                        borderColor: workdayCompleted === true ? "#EF4444" : "#E2E8F0",
                        color: workdayCompleted === true ? "white" : "#64748B",
                      }}
                    >
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                      <span className="font-semibold">Yes, completed</span>
                    </motion.button>
                  </div>

                  {/* Workday link shown when "No" is clicked */}
                  <AnimatePresence>
                    {workdayCompleted === false && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-amber-800 mb-2">
                              Please complete the termination in Workday first.
                            </p>
                            <p className="text-sm text-amber-700 mb-4">
                              The termination action must be processed in Workday before sending the termination sheet to HR stakeholders.
                            </p>
                            <a
                              href={WORKDAY_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                              style={{
                                background: "linear-gradient(135deg, #00C4B4, #0D2B45)",
                                color: "white",
                                boxShadow: "0 4px 12px rgba(0,196,180,0.3)",
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Workday
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Case preview */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Selected Case</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600">
                        {selectedCase.traineeName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{selectedCase.traineeName}</p>
                        <p className="text-xs text-slate-500 font-mono">{selectedCase.caseNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{formatHours(selectedCase.totalMissedHours)} hours</p>
                        <p className="text-xs text-slate-400">missed</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Step 2: Full Form
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSubmit}>
                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        You are about to send a termination sheet for <strong>{selectedCase.traineeName}</strong>.
                        This action will trigger HR workflows and cannot be undone.
                      </p>
                    </div>

                    {/* Case Details Card */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 mb-6 border border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Employee Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailField icon={FileText} label="Case #" value={selectedCase.caseNumber} mono />
                        <DetailField icon={User} label="Employee" value={selectedCase.traineeName} />
                        <DetailField icon={User} label="Oracle ID" value={selectedCase.oracleId} mono />
                        <DetailField icon={Building2} label="Account" value={selectedCase.account} />
                        <DetailField icon={TrendingUp} label="Hours Missed" value={formatHours(selectedCase.totalMissedHours)} valueColor="text-red-600" />
                        <DetailField icon={Calendar} label="Last Update" value={formatDate(selectedCase.lastUpdatedDate)} />
                      </div>
                    </div>

                    {/* Extended Fields */}
                    <div className="space-y-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Termination Details</h4>

                      {/* Row 1 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1.5">Account</label>
                          <input
                            type="text"
                            value={formData.account}
                            onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1.5">LOB</label>
                          <input
                            type="text"
                            value={formData.lob}
                            onChange={(e) => setFormData({ ...formData, lob: e.target.value })}
                            placeholder="Line of Business"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1.5">Last Day Working</label>
                          <input
                            type="date"
                            value={formData.lastDayWorking}
                            onChange={(e) => setFormData({ ...formData, lastDayWorking: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1.5">Termination Reason</label>
                          <select
                            value={formData.terminationReason}
                            onChange={(e) => setFormData({ ...formData, terminationReason: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                          >
                            <option value="">Select reason...</option>
                            <option value="Voluntary Resignation">Voluntary Resignation</option>
                            <option value="Involuntary Termination">Involuntary Termination</option>
                            <option value="End of Contract">End of Contract</option>
                            <option value="Retirement">Retirement</option>
                            <option value="Absconding">Absconding</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 3 - Checkbox grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { key: "employeeSubmittedResignation", label: "Employee submitted resignation" },
                          { key: "headsetReturned", label: "Headset Returned" },
                          { key: "medicalCardReturned", label: "Medical Card Returned" },
                          { key: "accessCardReturned", label: "Access Card Returned" },
                          { key: "tokenReturned", label: "Token Returned" },
                          { key: "userDeactivated", label: "User Deactivated" },
                          { key: "signedResignation", label: "Signed Resign." },
                          { key: "freezeDocuments", label: "Freeze Documents" },
                        ].map((cb) => (
                          <label
                            key={cb.key}
                            className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData[cb.key as keyof TerminationFormData] as boolean}
                              onChange={(e) => setFormData({ ...formData, [cb.key]: e.target.checked })}
                              className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                            />
                            <span className="text-xs text-slate-600">{cb.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Comment</label>
                        <textarea
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                          placeholder="Additional comments..."
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
                        />
                      </div>

                      {/* Email Section */}
                      <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-red-500" />
                          Email Details
                        </h4>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Recipient Email</label>
                            <input
                              type="email"
                              value={formData.recipientEmail}
                              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                              placeholder="hr@concentrix.com"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">CC Emails</label>
                            <input
                              type="text"
                              value={formData.ccEmails}
                              onChange={(e) => setFormData({ ...formData, ccEmails: e.target.value })}
                              placeholder="manager@concentrix.com"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-600 mb-1.5">Subject Line</label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder={`Termination Sheet - ${selectedCase.traineeName} (${selectedCase.caseNumber})`}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1.5">Additional Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add context for HR team..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>

                      {/* What happens next */}
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4">
                        <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          What happens next:
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>HR team receives termination sheet with all details</li>
                          <li>Case is flagged as termination sheet sent</li>
                          <li>All actions are logged in the case timeline</li>
                        </ul>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setStep("workday-check")}
                        disabled={sending}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        disabled={sending}
                        whileHover={{ scale: sending ? 1 : 1.02 }}
                        whileTap={{ scale: sending ? 1 : 0.98 }}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                        style={{
                          background: "linear-gradient(135deg, #EF4444, #DC2626)",
                          boxShadow: "0 8px 24px rgba(239,68,68,0.3)",
                        }}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Termination Sheet
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DetailField({ icon: Icon, label, value, mono, valueColor }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 uppercase">{label}</p>
        <p className={`text-sm font-medium truncate ${valueColor || "text-slate-800"} ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
