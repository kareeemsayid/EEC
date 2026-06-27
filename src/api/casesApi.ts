// Attrition case API client

import { apiFetch } from './index';
import { RiskStatus, SeverityLevel, LifecycleStage, CaseStatus } from '../utils/types';

export interface AttritionCase {
  id: string;
  caseNumber: string;
  traineeName: string;
  oracleId: string;
  personalEmail: string;
  workEmail: string;
  account: string;
  lob: string;
  site: string;
  wave: string;
  trainerName: string;
  trainerEmail: string;
  trainingManager: string;
  trainingManagerEmail: string;
  attritionCategory: string;
  subReason: string;
  severityLevel: SeverityLevel;
  totalMissedHours: number;
  riskStatus: RiskStatus;
  lifecycleStage: LifecycleStage;
  incidentDate: string;
  hireDate: string;
  caseOpenedDate: string;
  lastUpdatedDate: string;
  caseStatus: CaseStatus;
  notes: string;
  outlookConversationId: string;
  documentationRequired: boolean;
  escalationRequired: boolean;
  workdayActionTaken: boolean;
  terminationReason: string;
  localReason: string;
  effectiveDate: string;
  terminationSheetSent: boolean;
  leaverEmailSent: boolean;
  thresholdHours: number;
  openedBy: string;
  // Computed SLA fields
  daysOpen?: number;
  slaStatus?: string;
  overdueBy?: number;
  priorityLogic?: string;
}

export interface CaseUpdate {
  id: string;
  caseId: string;
  caseNumber: string;
  oracleId: string;
  traineeName: string;
  updateType: string;
  updatedBy: string;
  updatedByEmail: string;
  updateDate: string;
  previousStage: string;
  newStage: string;
  previousRisk: string;
  newRisk: string;
  hoursAdded: number;
  previousTotalHours: number;
  newTotalHours: number;
  updateNotes: string;
  emailSent: boolean;
  isInternal: boolean;
}

export interface CaseCounts {
  total: number;
  newToday: number;
  critical: number;
  monitoring: number;
  overdue: number;
  investigationPending: number;
  terminationPending: number;
}

export interface CreateCasePayload {
  traineeName: string;
  oracleId: string;
  personalEmail?: string;
  workEmail?: string;
  account: string;
  lob: string;
  site: string;
  wave: string;
  trainerName: string;
  trainerEmail: string;
  trainingManager: string;
  trainingManagerEmail: string;
  attritionCategory: string;
  subReason: string;
  severityLevel: SeverityLevel;
  totalMissedHours: number;
  riskStatus: RiskStatus;
  lifecycleStage: LifecycleStage;
  incidentDate: string;
  hireDate: string;
  notes: string;
  documentationRequired: boolean;
  escalationRequired: boolean;
  thresholdHours: number;
  openedBy: string;
}

export interface CaseListResponse {
  success: boolean;
  data: {
    cases: AttritionCase[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CaseListParams {
  filter?: 'all' | 'critical' | 'monitoring';
  status?: string;
  account?: string;
  lob?: string;
  site?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchCaseCounts(): Promise<CaseCounts> {
  const res = await apiFetch<{ success: boolean; data: CaseCounts }>('/cases/counts');
  return res.data;
}

export async function fetchCases(params: CaseListParams = {}): Promise<CaseListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
  });
  const qs = query.toString();
  return apiFetch<CaseListResponse>(`/cases${qs ? `?${qs}` : ''}`);
}

export async function fetchCaseDetail(caseId: string): Promise<AttritionCase> {
  const res = await apiFetch<{ success: boolean; data: AttritionCase }>(`/cases/${caseId}`);
  return res.data;
}

export async function fetchCaseTimeline(caseId: string): Promise<CaseUpdate[]> {
  const res = await apiFetch<{ success: boolean; data: CaseUpdate[] }>(`/cases/${caseId}/timeline`);
  return res.data;
}

export async function addCaseComment(caseId: string, comment: string, isInternal = false): Promise<void> {
  await apiFetch(`/cases/${caseId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment, isInternal }),
  });
}

export async function requestInvestigation(caseId: string): Promise<void> {
  await apiFetch(`/cases/${caseId}/request-investigation`, { method: 'POST' });
}

export async function approveTermination(caseId: string): Promise<void> {
  await apiFetch(`/cases/${caseId}/approve-termination`, { method: 'POST' });
}

export async function sendTerminationSheet(caseId: string): Promise<void> {
  await apiFetch(`/cases/${caseId}/send-termination-sheet`, { method: 'POST' });
}

export async function resolveCase(caseId: string, resolutionNotes: string): Promise<void> {
  await apiFetch(`/cases/${caseId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolutionNotes }),
  });
}

export async function transferCase(caseId: string, newTrainerEmail: string, reason: string): Promise<void> {
  await apiFetch(`/cases/${caseId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ newTrainerEmail, reason }),
  });
}

export async function watchCase(caseId: string): Promise<void> {
  await apiFetch(`/cases/${caseId}/watch`, { method: 'POST' });
}

export async function unwatchCase(caseId: string): Promise<void> {
  await apiFetch(`/cases/${caseId}/watch`, { method: 'DELETE' });
}
