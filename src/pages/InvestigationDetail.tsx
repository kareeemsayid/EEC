import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  fetchInvestigationDetails,
  addTask,
  completeTask,
  closeInvestigation,
} from "../api/sharepoint";
import {
  HRInvestigation,
  InvestigationTask,
  InvestigationAttachment,
  InvestigationUpdate,
  InvestigationStatus,
  InvestigationPriority,
} from "../utils/types";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Tooltip from "../components/Tooltip";
import { formatDate, formatDateTime, timeAgo } from "../utils/formatters";
import { loginRequest } from "../auth/msalConfig";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  FileSearch,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Paperclip,
  History,
  RefreshCw,
  Plus,
  X,
  Upload,
  Download,
  Check,
  AlertCircle,
  MessageSquare,
  Inbox,
} from "lucide-react";

type TabType = "summary" | "tasks" | "attachments" | "timeline";

const STATUS_COLORS: Record<InvestigationStatus, string> = {
  "Open": "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  "Pending Review": "bg-purple-100 text-purple-700 border-purple-200",
  "Closed": "bg-green-100 text-green-700 border-green-200",
  "Cancelled": "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_COLORS: Record<InvestigationPriority, string> = {
  "Low": "bg-gray-100 text-gray-600",
  "Medium": "bg-blue-100 text-blue-600",
  "High": "bg-amber-100 text-amber-600",
  "Critical": "bg-red-100 text-red-600",
};

export default function InvestigationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState<HRInvestigation | null>(null);
  const [tasks, setTasks] = useState<InvestigationTask[]>([]);
  const [attachments, setAttachments] = useState<InvestigationAttachment[]>([]);
  const [updates, setUpdates] = useState<InvestigationUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const data = await fetchInvestigationDetails(token, id);
      if (!data.investigation) {
        setError("Investigation not found");
      } else {
        setInvestigation(data.investigation);
        setTasks(data.tasks);
        setAttachments(data.attachments);
        setUpdates(data.updates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investigation");
    } finally {
      setLoading(false);
    }
  }, [id, getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTaskComplete = async (taskId: string, notes: string) => {
    if (!investigation || !user) return;
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      await completeTask(
        token,
        taskId,
        investigation.id,
        investigation.investigationNumber,
        notes,
        user.displayName || "Unknown",
        user.email || ""
      );
      toast.success("Task completed");
      loadData();
    } catch (err) {
      toast.error("Failed to complete task");
    }
  };

  const isOverdue = investigation && investigation.status !== "Closed" && investigation.status !== "Cancelled" && new Date(investigation.dueDate) < new Date();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading investigation..." />
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="text-center py-16">
        <ErrorBanner message={error || "Investigation not found"} onDismiss={() => navigate("/investigations")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Tooltip content="Back to investigations list" position="right">
            <button
              onClick={() => navigate("/investigations")}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Tooltip>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileSearch className="w-5 h-5 text-teal-500" />
              <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Investigation</span>
            </div>
            <h1 className="font-barlow-condensed text-2xl font-bold text-gray-900 tracking-wide flex items-center gap-3">
              <span className="font-mono text-teal-700">{investigation.investigationNumber}</span>
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[investigation.status]}`}>
                {investigation.status}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Case: <span className="font-mono text-teal-600">{investigation.caseNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Tooltip content="Refresh investigation data" position="bottom">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-white/30 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </Tooltip>
          {investigation.status !== "Closed" && investigation.status !== "Cancelled" && (
            <>
              <Tooltip content={`Update investigation (status: ${investigation.status})`} position="bottom">
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="glass-card bg-white/90 backdrop-blur-xl hover:bg-white border border-white/30 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </Tooltip>
              <Tooltip content="Close this investigation" position="bottom">
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="bg-gradient-teal hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-glow-teal flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Close Investigation
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="glass-card bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <p className="text-sm text-red-700 font-semibold">This investigation is overdue</p>
            <p className="text-xs text-red-600">Due date was {formatDate(investigation.dueDate)}</p>
          </div>
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-glass-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Priority</span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[investigation.priority]}`}>
            {investigation.priority}
          </span>
        </div>
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-glass-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <User className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Assigned To</span>
          </div>
          <p className="text-sm font-medium text-gray-800">{investigation.assignedTo || "Unassigned"}</p>
        </div>
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-glass-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Due Date</span>
          </div>
          <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-gray-800"}`}>
            {investigation.dueDate ? formatDate(investigation.dueDate) : "Not set"}
          </p>
        </div>
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-glass-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Last Updated</span>
          </div>
          <p className="text-sm font-medium text-gray-800">{timeAgo(investigation.lastUpdatedDate)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass overflow-hidden">
        <div className="border-b border-gray-100 flex">
          {[
            { key: "summary" as TabType, label: "Summary", icon: <FileText className="w-4 h-4" /> },
            { key: "tasks" as TabType, label: `Tasks (${tasks.length})`, icon: <CheckCircle2 className="w-4 h-4" /> },
            { key: "attachments" as TabType, label: `Attachments (${attachments.length})`, icon: <Paperclip className="w-4 h-4" /> },
            { key: "timeline" as TabType, label: "Timeline", icon: <History className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.key
                  ? "text-teal-700 border-teal-500 bg-teal-50/50"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Summary Tab */}
          {activeTab === "summary" && (
            <div className="space-y-4 animate-fade-in">
              <InfoSection title="Trainee Information">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Name" value={investigation.traineeName} />
                  <InfoField label="Oracle ID" value={investigation.oracleId} mono />
                  <InfoField label="Case Number" value={investigation.caseNumber} mono />
                </div>
              </InfoSection>

              <InfoSection title="Investigation Details">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Type" value={investigation.investigationType} />
                  <InfoField label="Priority" value={investigation.priority} />
                  <InfoField label="Status" value={investigation.status} />
                  <InfoField label="Created" value={formatDateTime(investigation.createdDate)} />
                  <InfoField label="Due Date" value={investigation.dueDate ? formatDate(investigation.dueDate) : "—"} />
                  <InfoField label="Created By" value={investigation.createdBy} />
                </div>
              </InfoSection>

              <InfoSection title="Summary">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{investigation.summary || "No summary provided"}</p>
              </InfoSection>

              <InfoSection title="Details">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{investigation.details || "No details provided"}</p>
              </InfoSection>

              {investigation.status === "Closed" && (
                <>
                  <InfoSection title="Findings">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{investigation.findings || "No findings recorded"}</p>
                  </InfoSection>
                  <InfoSection title="Recommendation">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{investigation.recommendation || "No recommendation recorded"}</p>
                  </InfoSection>
                </>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tasks</h3>
                {investigation.status !== "Closed" && (
                  <Tooltip content="Add a new task" position="left">
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="bg-teal-100 hover:bg-teal-200 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Task
                    </button>
                  </Tooltip>
                )}
              </div>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        task.status === "Completed"
                          ? "bg-green-50 border-green-200"
                          : task.status === "Cancelled"
                          ? "bg-gray-50 border-gray-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        task.status === "Completed"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {task.status === "Completed" ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Inbox className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{task.taskDescription}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignedTo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                          </span>
                        </div>
                        {task.completionNotes && (
                          <p className="text-xs text-gray-600 mt-2 bg-white/50 rounded px-2 py-1">
                            {task.completionNotes}
                          </p>
                        )}
                      </div>
                      {task.status !== "Completed" && investigation.status !== "Closed" && (
                        <Tooltip content="Mark as completed" position="left">
                          <button
                            onClick={() => {
                              const notes = prompt("Completion notes (optional):");
                              if (notes !== null) handleTaskComplete(task.id, notes);
                            }}
                            className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-2 py-1 rounded transition-colors"
                          >
                            Complete
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === "attachments" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Attachments</h3>
                {investigation.status !== "Closed" && (
                  <Tooltip content="Upload a file" position="left">
                    <button className="bg-teal-100 hover:bg-teal-200 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Upload
                    </button>
                  </Tooltip>
                )}
              </div>
              {attachments.length === 0 ? (
                <div className="text-center py-8">
                  <Paperclip className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No attachments</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{att.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {att.fileSize > 0 ? `${(att.fileSize / 1024).toFixed(1)} KB` : "—"} · {timeAgo(att.uploadedDate)}
                        </p>
                      </div>
                      {att.fileUrl && (
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Activity Timeline</h3>
              {updates.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {updates.map((update, idx) => (
                      <div key={update.id} className="relative flex gap-4" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 z-10">
                          <MessageSquare className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-teal-700">{update.updateType}</span>
                            <span className="text-xs text-gray-400">{timeAgo(update.updateDate)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{update.updateDescription}</p>
                          <p className="text-xs text-gray-400 mt-1">by {update.updatedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <AddTaskModal
          investigation={investigation}
          user={user}
          onClose={() => setShowAddTaskModal(false)}
          onSuccess={() => {
            setShowAddTaskModal(false);
            loadData();
          }}
          getAccessToken={getAccessToken}
        />
      )}

      {/* Close Investigation Modal */}
      {showCloseModal && (
        <CloseInvestigationModal
          investigation={investigation}
          user={user}
          onClose={() => setShowCloseModal(false)}
          onSuccess={() => {
            setShowCloseModal(false);
            loadData();
          }}
          getAccessToken={getAccessToken}
        />
      )}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-b-0">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-gray-400">{label}</span>
      <p className={`text-sm text-gray-800 ${mono ? "font-mono" : "font-medium"}`}>{value || "—"}</p>
    </div>
  );
}

// ─── Add Task Modal ──────────────────────────────────────────────────────────

function AddTaskModal({
  investigation,
  user,
  onClose,
  onSuccess,
  getAccessToken,
}: {
  investigation: HRInvestigation;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
  getAccessToken: () => Promise<string>;
}) {
  const [taskDescription, setTaskDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim() || !user) return;

    setSubmitting(true);
    try {
      const token = await getAccessToken();
      await addTask(
        token,
        {
          investigationId: investigation.id,
          investigationNumber: investigation.investigationNumber,
          taskDescription,
          assignedTo,
          assignedToEmail: "",
          dueDate,
          priority: "Medium",
        },
        user.displayName || "Unknown",
        user.email || ""
      );
      toast.success("Task added");
      onSuccess();
    } catch (err) {
      toast.error("Failed to add task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass-lg w-full max-w-md animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-barlow-condensed text-lg font-semibold text-gray-900">Add Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Task Description *</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe the task..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Name or email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !taskDescription.trim()}
              className="bg-gradient-teal hover:opacity-90 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Close Investigation Modal ──────────────────────────────────────────────

function CloseInvestigationModal({
  investigation,
  user,
  onClose,
  onSuccess,
  getAccessToken,
}: {
  investigation: HRInvestigation;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
  getAccessToken: () => Promise<string>;
}) {
  const [findings, setFindings] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim() || !user) return;

    setSubmitting(true);
    try {
      const token = await getAccessToken();
      await closeInvestigation(
        token,
        investigation.id,
        findings,
        recommendation,
        user.displayName || "Unknown",
        user.email || ""
      );
      toast.success("Investigation closed");
      onSuccess();
    } catch (err) {
      toast.error("Failed to close investigation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass-lg w-full max-w-md animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-barlow-condensed text-lg font-semibold text-gray-900">Close Investigation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            Closing this investigation will mark it as resolved. All pending tasks will be cancelled.
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Findings *</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
              rows={4}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Document your findings from this investigation..."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Recommendation</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
              rows={3}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Recommended actions based on findings..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !findings.trim()}
              className="bg-gradient-teal hover:opacity-90 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Close Investigation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
