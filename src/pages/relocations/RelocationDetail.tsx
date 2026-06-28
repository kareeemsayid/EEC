import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  fetchRelocationDetail,
  fetchRelocationTimeline,
  updateRelocationStatus,
  addRelocationComment,
  remindTA,
  RelocationRequest,
  RelocationUpdate,
} from "../../api/relocationsApi";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin, User, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Circle as XCircle, Send, Lock, MessageSquare, Bell, Loader as Loader2, Shield, Briefcase, Users, FileText, CircleDot, Check } from "lucide-react";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  PS: { bg: "bg-slate-700", text: "text-white" },
  TA: { bg: "bg-violet-600", text: "text-white" },
  Trainer: { bg: "bg-blue-600", text: "text-white" },
  Supervisor: { bg: "bg-teal-600", text: "text-white" },
  Manager: { bg: "bg-orange-500", text: "text-white" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Submitted: { label: "Pending PS", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  PSCleared: { label: "Pending TA", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  TACleared: { label: "Pending Relocation", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  Relocated: { label: "Relocated", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  Cancelled: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

const TEMPLATES = [
  "Approved for relocation.",
  "TA clearance completed.",
  "Employee has been relocated successfully.",
  "Request cancelled due to change in business needs.",
  "Pending additional documentation.",
  "SLA approaching - please expedite.",
];

export default function RelocationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || "Trainer";

  const [relocation, setRelocation] = useState<RelocationRequest | null>(null);
  const [timeline, setTimeline] = useState<RelocationUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    action: string;
    title: string;
    message: string;
    status?: string;
    requiresDate?: boolean;
  } | null>(null);
  const [relocatedDate, setRelocatedDate] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [rel, tl] = await Promise.all([
        fetchRelocationDetail(id),
        fetchRelocationTimeline(id),
      ]);
      setRelocation(rel);
      setTimeline(tl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load relocation";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusUpdate = async (status: string, notes?: string) => {
    if (!id) return;
    setActionLoading(`status-${status}`);
    try {
      await updateRelocationStatus(id, status, notes);
      toast.success(`Status updated to ${STATUS_CONFIG[status]?.label || status}`);
      setConfirmModal(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddComment = async () => {
    if (!id || !comment.trim()) return;
    setActionLoading("comment");
    try {
      await addRelocationComment(id, comment, isInternal);
      toast.success("Comment added");
      setComment("");
      setIsInternal(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemindTA = async () => {
    if (!id) return;
    setActionLoading("remind");
    try {
      await remindTA(id);
      toast.success("TA reminder sent");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setActionLoading(null);
    }
  };

  const canManage = role === "PS" || role === "TA" || role === "SrManager";
  const isTrainer = role === "Trainer";

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 rounded-lg shimmer-bg" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-64 bg-gray-100 rounded-2xl shimmer-bg" />
            <div className="h-48 bg-gray-100 rounded-2xl shimmer-bg" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-gray-100 rounded-2xl shimmer-bg" />
            <div className="h-64 bg-gray-100 rounded-2xl shimmer-bg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !relocation) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Not Found</h2>
        <p className="text-gray-500 mb-6">{error || "The relocation request could not be loaded."}</p>
        <button
          onClick={() => navigate("/relocations")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Relocations
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[relocation.status] || STATUS_CONFIG.Submitted;
  const isOverdue = relocation.overdueFlag;
  const releaseDatePassed = relocation.releaseDate && new Date(relocation.releaseDate) < new Date();

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/relocations")}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Relocation Request</span>
            </div>
            <h1 className="font-barlow-condensed text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">
              {relocation.requestId}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
            <CircleDot className="w-3 h-3" />
            {statusCfg.label}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-600 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              OVERDUE
            </span>
          )}
          {relocation.priorityLogic && (
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${
              relocation.priorityLogic === "1" ? "bg-red-50 border-red-200 text-red-700" :
              relocation.priorityLogic === "2" ? "bg-orange-50 border-orange-200 text-orange-700" :
              "bg-gray-50 border-gray-200 text-gray-600"
            }`}>
              Priority {relocation.priorityLogic}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Request Details Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Request Details</h3>
              <span className="ml-auto text-xs text-gray-400">Submitted {formatDate(relocation.submittedDate)}</span>
            </div>
            <div className="p-5 space-y-6">
              {/* Employee Information */}
              <Section icon={User} title="Employee Information">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem label="Employee Name" value={relocation.employeeName} />
                  <InfoItem label="OID" value={relocation.oid || relocation.oracleId} mono />
                  <InfoItem label="Reachable Number" value={relocation.reachableNumber} />
                  <InfoItem label="Language" value={relocation.language} />
                  <InfoItem label="Hire Date" value={relocation.hireDate ? formatDate(relocation.hireDate) : undefined} />
                  <InfoItem label="Site" value={relocation.siteName || relocation.site} />
                  <InfoItem label="LOB" value={relocation.lobName || relocation.lob} />
                  <InfoItem label="Account" value={relocation.account} />
                  <InfoItem label="Wave" value={relocation.wave} />
                  <InfoItem label="Vertical" value={relocation.vertical} />
                  <InfoItem label="Current MSA" value={relocation.currentMSA} />
                  <InfoItem label="Site Region" value={relocation.siteRegion} />
                </div>
              </Section>

              {/* Relocation Details */}
              <Section icon={MapPin} title="Relocation Details">
                <div className="space-y-3">
                  {relocation.preferredSiteArea && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Preferred Site Area</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {relocation.preferredSiteArea.split(/,\s*/).map((area, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 text-xs font-medium">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoItem label="Relocation Reason" value={relocation.relocationReason} />
                    <InfoItem label="Release Date" value={formatDate(relocation.releaseDate)} />
                    <InfoItem label="Attendance & Adherence" value={relocation.attendanceAdherence} />
                    <InfoItem label="Job Requisition (JR#)" value={relocation.jobRequisitionNumber} mono />
                    <InfoItem label="Disciplinary Notes" value={relocation.disciplinaryNotes} />
                    <InfoItem label="Additional Notes" value={relocation.additionalNotes} />
                  </div>
                </div>
              </Section>

              {/* Stakeholders */}
              <Section icon={Users} title="Stakeholders">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{relocation.trainingSupervisor}</p>
                      <p className="text-xs text-gray-400">Training Supervisor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{relocation.trainingManager}</p>
                      <p className="text-xs text-gray-400">Training Manager</p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* SLA Timeline */}
              <Section icon={Clock} title="SLA Timeline">
                <SLATimeline relocation={relocation} />
              </Section>

              {/* MSA Validation Warning */}
              {releaseDatePassed && relocation.status !== "Relocated" && relocation.status !== "Cancelled" && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">MSA Validation Required</p>
                    <p className="text-xs text-amber-600">Release date has passed. Please validate MSA status before proceeding.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - 40% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actions Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Actions</h3>
            </div>
            <div className="p-5 space-y-3">
              {/* Mark PS Cleared */}
              {canManage && relocation.status === "Submitted" && (
                <ActionButton
                  onClick={() => setConfirmModal({
                    action: "mark-ps",
                    title: "Mark PS Cleared",
                    message: "Confirm that People Solutions has reviewed and cleared this relocation request?",
                    status: "PSCleared",
                  })}
                  loading={actionLoading === "status-PSCleared"}
                  icon={CheckCircle2}
                  label="Mark PS Cleared"
                  color="green"
                />
              )}

              {/* Mark TA Cleared */}
              {canManage && relocation.status === "PSCleared" && (
                <ActionButton
                  onClick={() => setConfirmModal({
                    action: "mark-ta",
                    title: "Mark TA Cleared",
                    message: "Confirm that TA has cleared this relocation request?",
                    status: "TACleared",
                  })}
                  loading={actionLoading === "status-TACleared"}
                  icon={CheckCircle2}
                  label="Mark TA Cleared"
                  color="blue"
                />
              )}

              {/* Mark as Relocated */}
              {canManage && relocation.status === "TACleared" && (
                <ActionButton
                  onClick={() => setConfirmModal({
                    action: "mark-relocated",
                    title: "Mark as Relocated",
                    message: "Confirm that the employee has been relocated?",
                    status: "Relocated",
                    requiresDate: true,
                  })}
                  loading={actionLoading === "status-Relocated"}
                  icon={CheckCircle2}
                  label="Mark as Relocated"
                  color="emerald"
                  filled
                />
              )}

              {/* Remind TA */}
              {isTrainer && relocation.status === "PSCleared" && (
                <ActionButton
                  onClick={() => setConfirmModal({
                    action: "remind-ta",
                    title: "Remind TA",
                    message: "Send a reminder to the TA team about this relocation request?",
                  })}
                  loading={actionLoading === "remind"}
                  icon={Bell}
                  label="Remind TA"
                  color="amber"
                />
              )}
              {isTrainer && relocation.status === "PSCleared" && relocation.remindTADate && (
                <p className="text-xs text-gray-400 text-center">
                  Last reminded: {formatDate(relocation.remindTADate)}
                </p>
              )}

              {/* Cancel Request */}
              {relocation.status !== "Relocated" && relocation.status !== "Cancelled" && (
                <ActionButton
                  onClick={() => setConfirmModal({
                    action: "cancel",
                    title: "Cancel Request",
                    message: "Are you sure you want to cancel this relocation request? This action cannot be undone.",
                    status: "Cancelled",
                  })}
                  loading={actionLoading === "status-Cancelled"}
                  icon={XCircle}
                  label="Cancel Request"
                  color="red"
                  outline
                />
              )}
            </div>
          </div>

          {/* Thread & Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <h3 className="font-barlow-condensed font-bold text-gray-800 text-sm uppercase tracking-wide">Thread & Timeline</h3>
              <span className="ml-auto text-xs text-gray-400">{timeline.length} updates</span>
            </div>
            <div className="p-5 max-h-[500px] overflow-y-auto space-y-4">
              {timeline.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No updates yet</p>
                </div>
              ) : (
                timeline.map((update, i) => (
                  <TimelineItem key={i} update={update} role={role} />
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-3">
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none"
                />
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="absolute right-2 top-2 text-xs text-gray-400 hover:text-teal-600 transition-colors"
                >
                  Templates
                </button>
              </div>
              {showTemplates && (
                <div className="flex flex-wrap gap-2 animate-fade-in">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => { setComment(t); setShowTemplates(false); }}
                      className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                {canManage && (
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <Lock className="w-3 h-3" />
                    Internal note
                  </label>
                )}
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim() || actionLoading === "comment"}
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  {actionLoading === "comment" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                confirmModal.action === "cancel" ? "bg-red-100 text-red-600" :
                confirmModal.action === "remind-ta" ? "bg-amber-100 text-amber-600" :
                "bg-teal-100 text-teal-600"
              }`}>
                {confirmModal.action === "cancel" ? <XCircle className="w-5 h-5" /> :
                 confirmModal.action === "remind-ta" ? <Bell className="w-5 h-5" /> :
                 <CheckCircle2 className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{confirmModal.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{confirmModal.message}</p>
            {confirmModal.requiresDate && (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">Relocation Date</label>
                <input
                  type="date"
                  value={relocatedDate}
                  onChange={(e) => setRelocatedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.action === "remind-ta") {
                    handleRemindTA();
                    setConfirmModal(null);
                  } else if (confirmModal.status) {
                    handleStatusUpdate(confirmModal.status, confirmModal.requiresDate ? `Relocated on ${relocatedDate}` : undefined);
                  }
                }}
                disabled={confirmModal.requiresDate && !relocatedDate}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-40 ${
                  confirmModal.action === "cancel" ? "bg-red-600 hover:bg-red-700" :
                  confirmModal.action === "remind-ta" ? "bg-amber-600 hover:bg-amber-700" :
                  "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <Icon className="w-4 h-4 text-teal-500" />
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
      <p className={`text-sm text-gray-800 font-medium ${mono ? "font-mono" : ""} truncate`}>
        {value || "—"}
      </p>
    </div>
  );
}

function SLATimeline({ relocation }: { relocation: RelocationRequest }) {
  const steps = [
    { key: "submitted", label: "Submitted", date: relocation.submittedDate, bd: 0 },
    { key: "ps", label: "PS Cleared", date: relocation.psClearedDate, bd: 2 },
    { key: "ta", label: "TA Cleared", date: relocation.taClearedDate, bd: 12 },
    { key: "relocated", label: "Relocated", date: relocation.relocatedDate, bd: 0 },
  ];

  const currentStep = relocation.status === "Submitted" ? 0 :
    relocation.status === "PSCleared" ? 1 :
    relocation.status === "TACleared" ? 2 :
    relocation.status === "Relocated" ? 3 : -1;

  return (
    <div className="flex items-start gap-2">
      {steps.map((step, i) => {
        const isDone = i <= currentStep;
        const isCurrent = i === currentStep;
        const isOverdue = relocation.overdueFlag && isCurrent;

        return (
          <React.Fragment key={step.key}>
            <div className="flex-1 text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                isOverdue ? "bg-red-500 text-white animate-pulse" :
                isDone ? "bg-teal-500 text-white" :
                "bg-gray-100 text-gray-400 border-2 border-gray-200"
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <p className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wide ${
                isOverdue ? "text-red-600" : isDone ? "text-teal-600" : "text-gray-400"
              }`}>
                {step.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {step.date ? formatDate(step.date) : "—"}
              </p>
              {step.bd > 0 && (
                <p className="text-[9px] text-gray-300 mt-0.5">{step.bd} BD SLA</p>
              )}
              {isOverdue && (
                <p className="text-[9px] text-red-500 font-semibold mt-0.5 animate-pulse">OVERDUE</p>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="pt-4 flex-1">
                <div className={`h-0.5 rounded-full ${
                  i < currentStep ? "bg-teal-400" : "bg-gray-200"
                }`} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TimelineItem({ update, role }: { update: RelocationUpdate; role: string }) {
  const initials = update.updatedBy?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const roleColor = ROLE_COLORS[update.updatedBy?.includes("PS") ? "PS" : update.updatedBy?.includes("TA") ? "TA" : "Trainer"] || ROLE_COLORS.Trainer;
  const isInternal = update.isInternal;
  const canSeeInternal = role === "PS" || role === "TA" || role === "SrManager";

  if (isInternal && !canSeeInternal) return null;

  return (
    <div className={`flex gap-3 ${isInternal ? "opacity-80" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${roleColor.bg} ${roleColor.text}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-800">{update.updatedBy}</span>
          <TypePill type={update.updateType} />
          <span className="text-[10px] text-gray-400">{formatDate(update.updateDate)}</span>
        </div>
        {update.updateNotes && (
          <p className={`text-sm text-gray-600 mt-1 p-2.5 rounded-xl ${
            isInternal ? "bg-amber-50 border border-amber-100" : "bg-gray-50"
          }`}>
            {isInternal && <Lock className="w-3 h-3 text-amber-500 inline mr-1" />}
            {update.updateNotes}
          </p>
        )}
      </div>
    </div>
  );
}

function TypePill({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    StatusChange: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Status Change" },
    Comment: { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", label: "Comment" },
    ReminderSent: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Reminder Sent" },
  };
  const cfg = config[type] || config.Comment;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.text}`}>
      {type === "ReminderSent" && <Bell className="w-2.5 h-2.5" />}
      {cfg.label}
    </span>
  );
}

function ActionButton({ onClick, loading, icon: Icon, label, color, outline, filled }: {
  onClick: () => void;
  loading: boolean;
  icon: any;
  label: string;
  color: "green" | "blue" | "emerald" | "amber" | "red";
  outline?: boolean;
  filled?: boolean;
}) {
  const colorMap = {
    green: { solid: "bg-emerald-600 hover:bg-emerald-700 text-white", outline: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
    blue: { solid: "bg-blue-600 hover:bg-blue-700 text-white", outline: "border-blue-200 text-blue-700 hover:bg-blue-50" },
    emerald: { solid: "bg-emerald-600 hover:bg-emerald-700 text-white", outline: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
    amber: { solid: "bg-amber-600 hover:bg-amber-700 text-white", outline: "border-amber-200 text-amber-700 hover:bg-amber-50" },
    red: { solid: "bg-red-600 hover:bg-red-700 text-white", outline: "border-red-200 text-red-700 hover:bg-red-50" },
  };
  const style = outline ? colorMap[color].outline : colorMap[color].solid;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-40 ${style}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}
