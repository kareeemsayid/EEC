// src/api/api.ts
// EEC Frontend API Client - replaces SharePoint API calls with backend REST API

import { RiskStatus, SeverityLevel, LifecycleStage, CaseStatus } from "../utils/types";

const API_BASE = process.env.REACT_APP_API_URL || '/api';

// Types
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
  accountId: number;   // ✅ matches the API response
}

export interface Site {
  id: string;
  title: string;
  region: string;
}

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
}

export type UserRole = 'Trainer' | 'Supervisor' | 'Manager' | 'PS' | 'TA' | 'SrManager' | 'Admin';

export interface SupervisorAccount {
  accountId: string;
  accountName: string;
}

// Paginated response wrapper
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    cases: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Helper to cast case fields
function castCaseFields(item: any): any {
  if (item.severityLevel) item.severityLevel = item.severityLevel as SeverityLevel;
  if (item.riskStatus) item.riskStatus = item.riskStatus as RiskStatus;
  if (item.lifecycleStage) item.lifecycleStage = item.lifecycleStage as LifecycleStage;
  if (item.caseStatus) item.caseStatus = item.caseStatus as CaseStatus;
  return item;
}

// Helper
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }

  if (res.status === 204) return {} as T;

  const data = await res.json();

  // Handle paginated case responses
  if (data && data.success && data.data && Array.isArray(data.data.cases)) {
    data.data.cases = data.data.cases.map(castCaseFields);
    return data as T;
  }

  // Handle single case response wrapped in success/data
  if (data && data.success && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    castCaseFields(data.data);
    return data as T;
  }

  // Cast string types to proper literal types for AttritionCase arrays
  if (Array.isArray(data)) {
    return data.map(castCaseFields) as T;
  }

  // Handle single AttritionCase
  if (data && typeof data === 'object') {
    castCaseFields(data);
  }

  return data as T;
}

// Accounts
export async function fetchAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>('/accounts');
}

// LOBs
export async function fetchLOBs(accountId?: string): Promise<LOB[]> {
  const query = accountId ? `?accountId=${encodeURIComponent(accountId)}` : '';
  return apiFetch<LOB[]>(`/lobs${query}`);
}

// Sites
export async function fetchSites(): Promise<Site[]> {
  return apiFetch<Site[]>('/sites');
}

// User Role
export async function fetchUserRole(email: string): Promise<{ role: UserRole }> {
  return apiFetch<{ role: UserRole }>(`/roles?email=${encodeURIComponent(email)}`);
}

// Supervisor Accounts
export async function fetchSupervisorAccounts(email: string): Promise<SupervisorAccount[]> {
  return apiFetch<SupervisorAccount[]>(`/supervisorAccounts?email=${encodeURIComponent(email)}`);
}

// Cases - List with optional filters (backend handles role-based filtering)
export async function fetchCases(options?: {
  filter?: 'critical' | 'monitoring';
  status?: string;
  account?: string;
  lob?: string;
  site?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ cases: AttritionCase[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (options?.filter) params.set('filter', options.filter);
  if (options?.status) params.set('status', options.status);
  if (options?.account) params.set('account', options.account);
  if (options?.lob) params.set('lob', options.lob);
  if (options?.site) params.set('site', options.site);
  if (options?.search) params.set('search', options.search);
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));

  const query = params.toString();
  const result = await apiFetch<PaginatedResponse<AttritionCase>>(`/cases${query ? `?${query}` : ''}`);
  return result.data;
}

// Cases - Trainer's own cases (convenience function)
export async function fetchTrainerCases(page: number = 1, limit: number = 100): Promise<{ cases: AttritionCase[]; total: number }> {
  const result = await apiFetch<PaginatedResponse<AttritionCase>>(`/cases?page=${page}&limit=${limit}`);
  return { cases: result.data.cases, total: result.data.total };
}

// Cases - All cases (PS/SrManager/TA) - convenience for fetching all
export async function fetchAllCases(limit: number = 500): Promise<AttritionCase[]> {
  const result = await apiFetch<PaginatedResponse<AttritionCase>>(`/cases?limit=${limit}`);
  return result.data.cases;
}

// Cases - By Account name (Supervisor/Manager)
export async function fetchCasesByAccount(accountName: string): Promise<AttritionCase[]> {
  const result = await apiFetch<PaginatedResponse<AttritionCase>>(`/cases?account=${encodeURIComponent(accountName)}&limit=500`);
  return result.data.cases;
}

// Case - By identifier
export async function fetchCaseByIdentifier(identifier: string): Promise<AttritionCase | null> {
  try {
    return await apiFetch<AttritionCase>(`/cases/${encodeURIComponent(identifier)}`);
  } catch {
    return null;
  }
}

// Case Updates (Timeline)
export async function fetchCaseUpdates(caseId: string): Promise<CaseUpdate[]> {
  const result = await apiFetch<{ success: boolean; data: CaseUpdate[] }>(`/cases/${encodeURIComponent(caseId)}/timeline`);
  return result.data;
}

// Create Case
export interface CreateCasePayload {
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
  severityLevel: string;
  totalMissedHours: number;
  riskStatus: string;
  lifecycleStage: string;
  incidentDate: string;
  hireDate?: string;
  notes: string;
  outlookConversationId?: string;
  documentationRequired?: boolean;
  escalationRequired?: boolean;
  thresholdHours?: number;
  openedBy: string;
}

export async function createCase(data: CreateCasePayload): Promise<{
  success: boolean;
  id: string;
  caseNumber: string;
  message: string;
}> {
  const result = await apiFetch<{ success: boolean; id: string; caseNumber: string; message: string }>('/cases/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

// Update Case
export interface UpdateCasePayload {
  id?: string;
  caseNumber?: string;
  riskStatus?: string;
  lifecycleStage?: string;
  totalMissedHours?: number;
  caseStatus?: string;
  notes?: string;
  escalationRequired?: boolean;
  documentationRequired?: boolean;
  terminationReason?: string;
  localReason?: string;
  effectiveDate?: string;
  terminationSheetSent?: boolean;
  leaverEmailSent?: boolean;
  workdayActionTaken?: boolean;
  updateType?: string;
  updatedBy?: string;
  updatedByEmail?: string;
  hoursAdded?: number;
  previousTotalHours?: number;
  newTotalHours?: number;
  updateNotes?: string;
  emailSent?: boolean;
}

export async function updateCase(data: UpdateCasePayload): Promise<{
  success: boolean;
  caseNumber: string;
  message: string;
}> {
  const result = await apiFetch<{ success: boolean; caseNumber: string; message: string }>('/cases/update', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

// ─── Investigations API ───────────────────────────────────────────────────────

export type InvestigationStatus = 'Open' | 'In Progress' | 'Pending Review' | 'Closed' | 'Cancelled';
export type InvestigationPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type InvestigationType = 'Employee Complaint' | 'Manager Escalation' | 'Policy Violation' | 'Attendance Breach' | 'Performance Concern' | 'Client Complaint' | 'Other';

export interface Investigation {
  id: string;
  investigationNumber: string;
  traineeName: string;
  oracleId: string;
  caseNumber: string | null;
  investigationType: InvestigationType;
  priority: InvestigationPriority;
  summary: string;
  details: string;
  accountId: string | null;
  accountName: string | null;
  requestedBy: string;
  requestedByEmail: string;
  assignedTo: string;
  assignedToEmail: string;
  dueDate: string | null;
  status: InvestigationStatus;
  findings: string | null;
  resolution: string | null;
  outcome: string | null;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string;
  updates?: InvestigationUpdate[];
}

export interface InvestigationUpdate {
  id: string;
  investigationId: string;
  updateType: string;
  updatedBy: string;
  updatedByEmail: string;
  createdAt: string;
  notes: string;
  isInternal: boolean;
}

export interface InvestigationKpis {
  total: number;
  open: number;
  inProgress: number;
  pendingReview: number;
  closed: number;
  critical: number;
}

export async function fetchInvestigationCounts(): Promise<InvestigationKpis> {
  const result = await apiFetch<{ success: boolean; data: InvestigationKpis }>('/investigations/counts');
  return result.data || result as any;
}

export async function fetchInvestigations(options?: {
  status?: InvestigationStatus;
  priority?: InvestigationPriority;
  type?: InvestigationType;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ investigations: Investigation[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.priority) params.append('priority', options.priority);
  if (options?.type) params.append('type', options.type);
  if (options?.search) params.append('search', options.search);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));

  const query = params.toString();
  const result = await apiFetch<{ success: boolean; data: { investigations: Investigation[]; total: number; page: number; limit: number; totalPages: number } }>(
    `/investigations${query ? `?${query}` : ''}`
  );
  return result.data || result as any;
}

export async function fetchInvestigationById(id: string): Promise<Investigation> {
  const result = await apiFetch<{ success: boolean; data: Investigation }>(`/investigations/${id}`);
  return result.data || result as any;
}

export interface CreateInvestigationPayload {
  traineeName: string;
  oracleId: string;
  caseNumber?: string;
  investigationType: InvestigationType;
  priority: InvestigationPriority;
  summary: string;
  details: string;
  accountId?: string;
  assignedTo: string;
  assignedToEmail: string;
  dueDate: string;
}

export async function createInvestigation(data: CreateInvestigationPayload): Promise<{
  success: boolean;
  id: string;
  investigationNumber: string;
  message: string;
}> {
  const result = await apiFetch<{ success: boolean; id: string; investigationNumber: string; message: string }>('/investigations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

export interface UpdateInvestigationPayload {
  status?: InvestigationStatus;
  priority?: InvestigationPriority;
  assignedTo?: string;
  assignedToEmail?: string;
  dueDate?: string;
  findings?: string;
  resolution?: string;
  outcome?: string;
  updateNotes?: string;
}

export async function updateInvestigation(id: string, data: UpdateInvestigationPayload): Promise<{
  success: boolean;
  investigationNumber: string;
  message: string;
}> {
  const result = await apiFetch<{ success: boolean; investigationNumber: string; message: string }>(`/investigations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result;
}

export async function addInvestigationComment(id: string, comment: string, isInternal = false): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/investigations/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment, isInternal }),
  });
}

export async function resolveInvestigation(id: string, resolution: string, outcome: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/investigations/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution, outcome }),
  });
}
