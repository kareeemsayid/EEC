import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { createRelocation } from "../../api/relocationsApi";
import { apiFetch } from "../../api";
import { User, MapPin, Briefcase, ArrowRight, ArrowLeft, Check, CircleAlert as AlertCircle, Mail, Phone, Globe, Calendar, Building2, Users, FileText, Send, Sparkles, Clock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const VERTICALS = [
  { value: "Other", label: "Other", icon: "\u{1F4E6}" },
  { value: "Consumer Electronics", label: "Consumer Electronics", icon: "\u{1F4F1}" },
  { value: "Travel & Tourism", label: "Travel & Tourism", icon: "\u{2708}\u{FE0F}" },
  { value: "Media & Comms", label: "Media & Comms", icon: "\u{1F4E1}" },
  { value: "Technology", label: "Technology", icon: "\u{1F4BB}" },
  { value: "Retail & Ecommerce", label: "Retail & Ecommerce", icon: "\u{1F6CD}\u{FE0F}" },
];

const SITE_AREAS = ["New Cairo", "Smart Village", "Alexandria", "RHQ", "Palm Strip", "Park Street", "Hurghada", "Open to any"];

const RELOCATION_REASONS = ["Failed Nesting", "Performance", "Business Need", "Personal", "Other"];

interface FormData {
  employeeName: string;
  oid: string;
  reachableNumber: string;
  language: string;
  hireDate: string;
  employeeEmail: string;
  currentSite: string;
  currentLOB: string;
  currentAccount: string;
  siteId: string;
  lobId: string;
  accountId: string;
  wave: string;
  vertical: string;
  currentMSA: string;
  preferredSiteArea: string[];
  relocationReason: string;
  releaseDate: string;
  attendanceAdherence: string;
  disciplinaryNotes: string;
  additionalNotes: string;
  trainingSupervisorName: string;
  trainingSupervisorEmail: string;
  trainingManagerName: string;
  trainingManagerEmail: string;
}

const INITIAL_DATA: FormData = {
  employeeName: "", oid: "", reachableNumber: "", language: "", hireDate: "", employeeEmail: "",
  currentSite: "", currentLOB: "", currentAccount: "", siteId: "", lobId: "", accountId: "",
  wave: "", vertical: "", currentMSA: "",
  preferredSiteArea: [], relocationReason: "", releaseDate: "", attendanceAdherence: "",
  disciplinaryNotes: "", additionalNotes: "",
  trainingSupervisorName: "", trainingSupervisorEmail: "", trainingManagerName: "", trainingManagerEmail: "",
};

export default function SubmitRelocation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sites, setSites] = useState<any[]>([]);
  const [lobs, setLobs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ requestId: string; notifiedGroups: string[] } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<any[]>('/sites');
        setSites(res);
      } catch { /* ignore */ }
    })();
  }, []);

  // Pre-fill supervisor/manager from user profile
  useEffect(() => {
    if (user) {
      setData(d => ({
        ...d,
        trainingSupervisorName: user.manager1?.displayName || d.trainingSupervisorName,
        trainingSupervisorEmail: user.manager1?.mail || d.trainingSupervisorEmail,
        trainingManagerName: user.manager2?.displayName || d.trainingManagerName,
        trainingManagerEmail: user.manager2?.mail || d.trainingManagerEmail,
      }));
    }
  }, [user]);

  const update = (field: keyof FormData, value: any) => {
    setData(d => ({ ...d, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validateStep = (stepNum: number): boolean => {
    const e: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (stepNum === 1) {
      if (!data.employeeName) e.employeeName = "Required";
      if (!data.oid) e.oid = "Required";
      if (!data.reachableNumber) e.reachableNumber = "Required";
      if (!data.language) e.language = "Required";
      if (!data.hireDate) e.hireDate = "Required";
      if (!data.employeeEmail) e.employeeEmail = "Required";
      else if (!emailRegex.test(data.employeeEmail)) e.employeeEmail = "Invalid email";
      if (!data.currentSite) e.currentSite = "Required";
      if (!data.currentLOB) e.currentLOB = "Required";
      if (!data.wave) e.wave = "Required";
      if (!data.vertical) e.vertical = "Required";
    } else if (stepNum === 2) {
      if (data.preferredSiteArea.length === 0) e.preferredSiteArea = "Select at least one";
      if (!data.relocationReason) e.relocationReason = "Required";
      if (!data.releaseDate) e.releaseDate = "Required";
      if (!data.attendanceAdherence) e.attendanceAdherence = "Required";
    } else if (stepNum === 3) {
      if (!data.trainingSupervisorName) e.trainingSupervisorName = "Required";
      if (!data.trainingSupervisorEmail) e.trainingSupervisorEmail = "Required";
      else if (!emailRegex.test(data.trainingSupervisorEmail)) e.trainingSupervisorEmail = "Invalid email";
      if (!data.trainingManagerName) e.trainingManagerName = "Required";
      if (!data.trainingManagerEmail) e.trainingManagerEmail = "Required";
      else if (!emailRegex.test(data.trainingManagerEmail)) e.trainingManagerEmail = "Invalid email";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSiteChange = async (siteName: string) => {
    update('currentSite', siteName);
    const site = sites.find(s => s.title === siteName);
    if (site) update('siteId', site.id);
    // Load LOBs for this site
    try {
      const res = await apiFetch<any[]>(`/lobs?siteId=${site?.id || ''}`);
      setLobs(res);
    } catch { /* ignore */ }
  };

  const handleLOBChange = (lobName: string) => {
    update('currentLOB', lobName);
    const lob = lobs.find(l => l.title === lobName);
    if (lob) {
      update('lobId', lob.id);
      update('accountId', lob.accountId);
      // Auto-populate account name
      const account = sites.find(s => s.id === lob.accountId);
      if (account) update('currentAccount', account.title);
    }
  };

  const toggleSiteArea = (area: string) => {
    setData(d => ({
      ...d,
      preferredSiteArea: d.preferredSiteArea.includes(area)
        ? d.preferredSiteArea.filter(a => a !== area)
        : [...d.preferredSiteArea, area],
    }));
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitting(true);
    try {
      const result = await createRelocation(data);
      setSuccess({
        requestId: result.requestId,
        notifiedGroups: ["PS Redeployment Team", "TA Internal Transfers", "Training Supervisor", "Training Manager"],
      });
      toast.success("Relocation request submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success screen ─────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-glass overflow-hidden">
          <div className="relative bg-gradient-navy px-8 py-12 text-center">
            <div className="absolute inset-0 opacity-20" style={{
              background: "radial-gradient(circle at 50% 50%, rgba(45,212,191,0.3), transparent 60%)",
            }} />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-teal flex items-center justify-center mb-4 shadow-glow-teal-lg ring-4 ring-white/20">
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Request Submitted Successfully!</h2>
              <p className="text-teal-200/70 text-sm">Your relocation request has been sent to the relevant teams</p>
            </div>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Request ID</p>
              <p className="text-2xl font-bold text-blue-600 font-mono tracking-wide">{success.requestId}</p>
            </div>
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                The following teams have been notified automatically:
              </p>
              <div className="space-y-2">
                {success.notifiedGroups.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    {g}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/relocations')} className="flex-1 py-3 rounded-xl bg-gradient-teal text-white font-semibold text-sm hover:shadow-glow-teal transition-all">
                View My Requests
              </button>
              <button onClick={() => { setData(INITIAL_DATA); setStep(1); setSuccess(null); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all">
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-teal flex items-center justify-center shadow-glow-teal">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-barlow-condensed text-2xl font-bold text-gray-900 tracking-wide">Submit Relocation Request</h1>
          <p className="text-gray-500 text-sm">Fill in the details below to initiate a relocation</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              step === s ? "bg-gradient-teal text-white shadow-glow-teal" :
              step > s ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-400"
            }`}>
              {step > s ? <Check className="w-4 h-4" /> : <span className="text-sm font-bold">{s}</span>}
              <span className="text-sm font-medium hidden sm:inline">
                {s === 1 ? "Employee Info" : s === 2 ? "Relocation Details" : "Stakeholders"}
              </span>
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? "bg-teal-300" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-6">
        {/* Step 1: Employee Information */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <SectionTitle icon={User} title="Employee Information" subtitle="Basic details about the employee being relocated" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Employee Name" icon={User} error={errors.employeeName} required>
                <input type="text" value={data.employeeName} onChange={e => update('employeeName', e.target.value)} className={inputClass(errors.employeeName)} placeholder="Full name" />
              </Field>
              <Field label="OID" icon={Briefcase} error={errors.oid} required>
                <input type="text" value={data.oid} onChange={e => update('oid', e.target.value)} className={inputClass(errors.oid)} placeholder="Oracle ID" />
              </Field>
              <Field label="Reachable Number" icon={Phone} error={errors.reachableNumber} required>
                <input type="tel" value={data.reachableNumber} onChange={e => update('reachableNumber', e.target.value)} className={inputClass(errors.reachableNumber)} placeholder="Phone number" />
              </Field>
              <Field label="Language" icon={Globe} error={errors.language} required>
                <input type="text" value={data.language} onChange={e => update('language', e.target.value)} className={inputClass(errors.language)} placeholder="e.g. English, Arabic" />
              </Field>
              <Field label="Hire Date" icon={Calendar} error={errors.hireDate} required>
                <input type="date" value={data.hireDate} onChange={e => update('hireDate', e.target.value)} className={inputClass(errors.hireDate)} />
              </Field>
              <Field label="Employee Email" icon={Mail} error={errors.employeeEmail} required>
                <input type="email" value={data.employeeEmail} onChange={e => update('employeeEmail', e.target.value)} className={inputClass(errors.employeeEmail)} placeholder="name@concentrix.com" />
              </Field>
              <Field label="Current Site" icon={MapPin} error={errors.currentSite} required>
                <select value={data.currentSite} onChange={e => handleSiteChange(e.target.value)} className={inputClass(errors.currentSite)}>
                  <option value="">Select site...</option>
                  {sites.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                </select>
              </Field>
              <Field label="Current LOB" icon={Briefcase} error={errors.currentLOB} required>
                <select value={data.currentLOB} onChange={e => handleLOBChange(e.target.value)} className={inputClass(errors.currentLOB)} disabled={!data.currentSite}>
                  <option value="">Select LOB...</option>
                  {lobs.map(l => <option key={l.id} value={l.title}>{l.title}</option>)}
                </select>
              </Field>
              <Field label="Current Account" icon={Building2}>
                <input type="text" value={data.currentAccount} readOnly className={`${inputClass()} bg-gray-50 cursor-not-allowed`} placeholder="Auto-populated from LOB" />
              </Field>
              <Field label="Wave / WK#" icon={Calendar} error={errors.wave} required>
                <input type="text" value={data.wave} onChange={e => update('wave', e.target.value)} className={inputClass(errors.wave)} placeholder="e.g. Week 24" />
              </Field>
              <Field label="Vertical" icon={Sparkles} error={errors.vertical} required>
                <select value={data.vertical} onChange={e => update('vertical', e.target.value)} className={inputClass(errors.vertical)}>
                  <option value="">Select vertical...</option>
                  {VERTICALS.map(v => <option key={v.value} value={v.value}>{v.icon} {v.label}</option>)}
                </select>
              </Field>
              <Field label="Current MSA" icon={Building2}>
                <input type="text" value={data.currentMSA} onChange={e => update('currentMSA', e.target.value)} className={inputClass()} placeholder="e.g. Airbnb MSA" />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2: Relocation Details */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <SectionTitle icon={MapPin} title="Relocation Details" subtitle="Where should the employee be relocated and why" />
            <Field label="Preferred Site Area" icon={MapPin} error={errors.preferredSiteArea} required>
              <div className="flex flex-wrap gap-2 mt-1">
                {SITE_AREAS.map(area => (
                  <button key={area} type="button" onClick={() => toggleSiteArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      data.preferredSiteArea.includes(area)
                        ? "bg-gradient-teal text-white border-teal-500 shadow-glow-teal"
                        : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:bg-teal-50"
                    }`}>
                    {area}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Relocation Reason" icon={AlertCircle} error={errors.relocationReason} required>
                <select value={data.relocationReason} onChange={e => update('relocationReason', e.target.value)} className={inputClass(errors.relocationReason)}>
                  <option value="">Select reason...</option>
                  {RELOCATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Release Date / Compliance" icon={Calendar} error={errors.releaseDate} required>
                <input type="date" value={data.releaseDate} onChange={e => update('releaseDate', e.target.value)} className={inputClass(errors.releaseDate)} />
              </Field>
            </div>
            <Field label="Attendance & Adherence" icon={ShieldCheck} error={errors.attendanceAdherence} required>
              <div className="flex gap-3 mt-1">
                {["No Flags", "Has Flags"].map(opt => (
                  <button key={opt} type="button" onClick={() => update('attendanceAdherence', opt)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      data.attendanceAdherence === opt
                        ? "bg-gradient-teal text-white border-teal-500 shadow-glow-teal"
                        : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Disciplinary Notes" icon={FileText}>
              <textarea value={data.disciplinaryNotes} onChange={e => update('disciplinaryNotes', e.target.value)} rows={3} className={inputClass()} placeholder="None" />
            </Field>
            <Field label="Additional Notes" icon={FileText}>
              <textarea value={data.additionalNotes} onChange={e => update('additionalNotes', e.target.value)} rows={3} className={inputClass()} placeholder="Any additional information..." />
            </Field>
          </div>
        )}

        {/* Step 3: Stakeholders & Review */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <SectionTitle icon={Users} title="Stakeholders & Review" subtitle="Who should be notified about this request" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Training Supervisor Name" icon={User} error={errors.trainingSupervisorName} required>
                <input type="text" value={data.trainingSupervisorName} onChange={e => update('trainingSupervisorName', e.target.value)} className={inputClass(errors.trainingSupervisorName)} placeholder="Supervisor name" />
              </Field>
              <Field label="Training Supervisor Email" icon={Mail} error={errors.trainingSupervisorEmail} required>
                <input type="email" value={data.trainingSupervisorEmail} onChange={e => update('trainingSupervisorEmail', e.target.value)} className={inputClass(errors.trainingSupervisorEmail)} placeholder="supervisor@concentrix.com" />
              </Field>
              <Field label="Training Manager Name" icon={User} error={errors.trainingManagerName} required>
                <input type="text" value={data.trainingManagerName} onChange={e => update('trainingManagerName', e.target.value)} className={inputClass(errors.trainingManagerName)} placeholder="Manager name" />
              </Field>
              <Field label="Training Manager Email" icon={Mail} error={errors.trainingManagerEmail} required>
                <input type="email" value={data.trainingManagerEmail} onChange={e => update('trainingManagerEmail', e.target.value)} className={inputClass(errors.trainingManagerEmail)} placeholder="manager@concentrix.com" />
              </Field>
            </div>

            {/* Read-only summary */}
            <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-semibold text-gray-700">Review Summary</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <SummarySection title="Employee" items={[
                  ["Name", data.employeeName], ["OID", data.oid], ["Language", data.language], ["Site", data.currentSite], ["LOB", data.currentLOB], ["Wave", data.wave],
                ]} />
                <SummarySection title="Relocation" items={[
                  ["Preferred Areas", data.preferredSiteArea.join(', ')], ["Reason", data.relocationReason], ["Release Date", data.releaseDate], ["Attendance", data.attendanceAdherence],
                ]} />
                <SummarySection title="Stakeholders" items={[
                  ["Supervisor", data.trainingSupervisorName], ["Manager", data.trainingManagerName],
                ]} />
              </div>
              <div className="px-4 py-3 bg-teal-50/50 border-t border-teal-100">
                <p className="text-xs text-teal-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Notifications will be sent to: PS Redeployment, TA Internal Transfers, Supervisor, and Manager
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
          <button onClick={handleBack} disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < 3 ? (
            <button onClick={handleNext} className="creative-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="creative-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? <><Clock className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Request</>}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .creative-btn {
          background: linear-gradient(135deg, #0b7a70 0%, #0ea89b 45%, #25e2cc 100%);
          box-shadow: 0 4px 20px rgba(14, 168, 155, 0.3);
          transition: all 0.2s ease;
        }
        .creative-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(14, 168, 155, 0.45);
        }
        .creative-btn:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────
function inputClass(error?: string) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    error
      ? "border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-200 focus:border-red-400"
      : "border-gray-200 bg-white focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
  } outline-none`;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-teal-600" />
      </div>
      <div>
        <h3 className="font-barlow-condensed font-bold text-gray-800 text-base tracking-wide">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, error, required, children }: { label: string; icon: any; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  );
}

function SummarySection({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-gray-400">{k}:</span>
            <span className="text-gray-700 font-medium text-right truncate ml-2 max-w-[60%]">{v || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
