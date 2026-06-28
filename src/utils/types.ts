// src/utils/types.ts
//
// IMPORTANT: AttritionCase, CaseUpdate, Account, LOB, Site, EmailThread,
// PSUser, and UserProfile are NOT redefined here. api/sharepoint.ts is the
// single source of truth for those shapes, because its mapCase()/mapUpdate()
// functions are what actually populate them at runtime. Redefining them here
// with extra fields (accountId, created, absenceDate, etc.) that sharepoint.ts
// never sets is what caused the repeated "Type X is missing properties"
// build failures. If you need one of those extra fields, add it to the
// interface AND the corresponding mapCase/mapUpdate in sharepoint.ts —
// never just here.
export type {
  AttritionCase,
  CaseUpdate,
  Account,
  LOB,
  Site,
  EmailThread,
  PSUser,
  UserProfile,
  AttendanceRecord,
  EscalationRecord,
} from "../api/sharepoint";

// ─── Shared status vocabulary ──────────────────────────────────────────────
// These values match the actual Choice columns in the AttritionCases
// SharePoint list (see the list-structure spec). Keep riskLogic.ts's
// getStageColor/getRiskColor keyed off these exact strings.

export type RiskStatus = "Monitoring" | "High Risk" | "Critical";

export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

export type LifecycleStage =
  | "Monitoring"
  | "Under Review"
  | "High Risk"
  | "Critical Escalation"
  | "PS Review"
  | "Termination Recommended"
  | "Workday Action Pending"
  | "Terminated"
  | "Exit Coordination"
  | "Closed";

export type CaseStatus = "Active" | "Closed";

// ─── HR Investigation Types ─────────────────────────────────────────────────

export type InvestigationType =
  | "Employee Complaint"
  | "Manager Escalation"
  | "Policy Violation"
  | "Attendance Breach"
  | "Performance Concern"
  | "Client Complaint"
  | "Other";

export type InvestigationPriority = "Low" | "Medium" | "High" | "Critical";

export type InvestigationStatus = "Open" | "In Progress" | "Pending Review" | "Closed" | "Cancelled";

export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export interface HRInvestigation {
  id: string;
  investigationNumber: string;
  caseId: string;
  caseNumber: string;
  traineeName: string;
  oracleId: string;
  investigationType: InvestigationType;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  summary: string;
  details: string;
  findings: string;
  recommendation: string;
  assignedTo: string;
  assignedToEmail: string;
  createdBy: string;
  createdByEmail: string;
  dueDate: string;
  createdDate: string;
  lastUpdatedDate: string;
  closedDate: string;
  closedBy: string;
  approvedBy: string;
  approvedDate: string;
  hasActiveTasks: boolean;
  tasksCount: number;
  attachmentsCount: number;
}

export interface InvestigationTask {
  id: string;
  investigationId: string;
  investigationNumber: string;
  taskDescription: string;
  status: TaskStatus;
  assignedTo: string;
  assignedToEmail: string;
  dueDate: string;
  createdDate: string;
  completedDate: string;
  completedBy: string;
  completionNotes: string;
  priority: InvestigationPriority;
}

export interface InvestigationAttachment {
  id: string;
  investigationId: string;
  investigationNumber: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByEmail: string;
  uploadedDate: string;
  fileType: string;
}

export interface InvestigationUpdate {
  id: string;
  investigationId: string;
  investigationNumber: string;
  updateType: string;
  updateDescription: string;
  updatedBy: string;
  updatedByEmail: string;
  updateDate: string;
  previousValue: string;
  newValue: string;
}

// ─── Form payload types ─────────────────────────────────────────────────────
// NOTE: createCase() in sharepoint.ts takes Partial<AttritionCase> and posts
// Account/LOB/Site as their *title strings* (e.g. fields.account), not as
// lookup IDs. If SubmitCase.tsx builds a payload with accountId/lobId/siteId,
// that mismatch will surface as its own type error — flag it when we get to
// SubmitCase and I'll align this shape with what createCase actually expects.
export interface CreateCasePayload {
  traineeName: string;
  oracleId: string;
  personalEmail: string;
  workEmail: string;
  account: string;
  lob: string;
  site: string;
  wave: string;
  hireDate: string;
  trainerName: string;
  trainerEmail: string;
  trainingManager: string;
  trainingManagerEmail: string;
  attritionCategory: string;
  subReason: string;
  severityLevel: SeverityLevel;
  totalMissedHours: number;
  incidentDate: string;
  riskStatus: RiskStatus;
  lifecycleStage: LifecycleStage;
  notes: string;
  documentationRequired: boolean;
  escalationRequired: boolean;
  openedBy?: string;
}

export interface UpdateCasePayload {
  caseId: string;
  caseNumber: string;
  hoursToAdd: number;
  absenceDate: string;
  absenceType: string;
  updateType: string;
  overrideStage?: LifecycleStage;
  notes: string;
  escalationRequired: boolean;
  documentationRequired: boolean;
  updatedBy: string;
  updatedByEmail: string;
}

export interface CreateInvestigationPayload {
  caseId: string;
  caseNumber: string;
  traineeName: string;
  oracleId: string;
  investigationType: InvestigationType;
  priority: InvestigationPriority;
  summary: string;
  details: string;
  assignedTo: string;
  assignedToEmail: string;
  dueDate: string;
  createdBy: string;
  createdByEmail: string;
}

export interface UpdateInvestigationPayload {
  status?: InvestigationStatus;
  priority?: InvestigationPriority;
  summary?: string;
  details?: string;
  findings?: string;
  recommendation?: string;
  assignedTo?: string;
  assignedToEmail?: string;
  dueDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  closedBy?: string;
  closedDate?: string;
}

export interface CreateTaskPayload {
  investigationId: string;
  investigationNumber: string;
  taskDescription: string;
  assignedTo: string;
  assignedToEmail: string;
  dueDate: string;
  priority: InvestigationPriority;
}

export interface PowerAutomateCreateResponse {
  caseNumber: string;
  conversationId: string;
}

export interface PowerAutomateUpdateResponse {
  caseNumber: string;
  updated: boolean;
}

export interface KpiData {
  activeCases: number;
  critical: number;
  highRisk: number;
  monitoring: number;
  terminationRecommended: number;
}

export interface InvestigationKpiData {
  totalInvestigations: number;
  openInvestigations: number;
  inProgressInvestigations: number;
  highPriorityInvestigations: number;
  overdueInvestigations: number;
}
