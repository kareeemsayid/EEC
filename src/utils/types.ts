export interface Account {
  id: string;
  title: string;
  warningHours: number;
  criticalHours: number;
  documentGraceHours: number;
}

export interface LOB {
  id: string;
  title: string;
  accountId: string;
}

export interface Site {
  id: string;
  title: string;
}

export type RiskStatus = "Monitoring" | "High Risk" | "Critical";
export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";
export type LifecycleStage =
  | "Initial Review"
  | "Coaching Plan"
  | "Final Warning"
  | "Termination Recommended"
  | "Closed";
export type CaseStatus = "Open" | "Pending" | "Escalated" | "Closed";

export interface AttritionCase {
  id: string;
  caseNumber: string;
  traineeName: string;
  oracleId: string;
  personalEmail: string;
  account: string;
  accountId: string;
  lob: string;
  lobId: string;
  site: string;
  siteId: string;
  wave: string;
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
  caseStatus: CaseStatus;
  notes: string;
  documentationRequired: boolean;
  escalationRequired: boolean;
  outlookConversationId?: string;
  created: string;
  modified: string;
}

export interface CaseUpdate {
  id: string;
  caseId: string;
  caseNumber: string;
  updateType: string;
  hoursAdded: number;
  absenceDate: string;
  absenceType: string;
  overrideStage?: string;
  notes: string;
  escalationRequired: boolean;
  documentationRequired: boolean;
  updatedBy: string;
  updatedByEmail: string;
  created: string;
}

export interface EmailThread {
  id: string;
  caseId: string;
  caseNumber: string;
  conversationId: string;
  subject: string;
  lastReplyDate: string;
  threadCount: number;
}

export interface CreateCasePayload {
  traineeName: string;
  oracleId: string;
  personalEmail: string;
  accountId: string;
  lobId: string;
  siteId: string;
  wave: string;
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
  caseStatus: CaseStatus;
  notes: string;
  documentationRequired: boolean;
  escalationRequired: boolean;
}

export interface UpdateCasePayload {
  caseId: string;
  caseNumber: string;
  hoursToAdd: number;
  absenceDate: string;
  absenceType: string;
  updateType: string;
  overrideStage?: string;
  notes: string;
  escalationRequired: boolean;
  documentationRequired: boolean;
  updatedBy: string;
  updatedByEmail: string;
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
