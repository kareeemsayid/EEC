// src/api/api.ts
// EEC Frontend API Client - replaces SharePoint API calls with backend REST API

import { RiskStatus, SeverityLevel, LifecycleStage, CaseStatus } from "../utils/types";

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  accountId: string;
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

export type UserRole = 'Trainer' | 'Supervisor' | 'Manager' | 'PS' | 'SrManager';

export interface SupervisorAccount {
  accountId: string;
  accountName: string;
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

  // Cast string types to proper literal types for AttritionCase arrays
  if (Array.isArray(data)) {
    return data.map((item: any) => {
      if (item.severityLevel) item.severityLevel = item.severityLevel as SeverityLevel;
      if (item.riskStatus) item.riskStatus = item.riskStatus as RiskStatus;
      if (item.lifecycleStage) item.lifecycleStage = item.lifecycleStage as LifecycleStage;
      if (item.caseStatus) item.caseStatus = item.caseStatus as CaseStatus;
      return item;
    }) as T;
  }

  // Handle single AttritionCase
  if (data && typeof data === 'object') {
    if (data.severityLevel) data.severityLevel = data.severityLevel as SeverityLevel;
    if (data.riskStatus) data.riskStatus = data.riskStatus as RiskStatus;
    if (data.lifecycleStage) data.lifecycleStage = data.lifecycleStage as LifecycleStage;
    if (data.caseStatus) data.caseStatus = data.caseStatus as CaseStatus;
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

// Cases - Trainer's own cases
export async function fetchCases(trainerEmail: string): Promise<AttritionCase[]> {
  return apiFetch<AttritionCase[]>(`/cases?trainerEmail=${encodeURIComponent(trainerEmail)}`);
}

// Cases - All cases (PS/SrManager)
export async function fetchAllCases(): Promise<AttritionCase[]> {
  return apiFetch<AttritionCase[]>('/cases/all');
}

// Cases - By Account (Supervisor/Manager)
export async function fetchCasesByAccount(accountId: string): Promise<AttritionCase[]> {
  return apiFetch<AttritionCase[]>(`/cases/account?accountId=${encodeURIComponent(accountId)}`);
}

// Case - By identifier
export async function fetchCaseByIdentifier(identifier: string): Promise<AttritionCase | null> {
  try {
    return await apiFetch<AttritionCase>(`/cases/${encodeURIComponent(identifier)}`);
  } catch {
    return null;
  }
}

// Case Updates
export async function fetchCaseUpdates(caseNumber: string): Promise<CaseUpdate[]> {
  return apiFetch<CaseUpdate[]>(`/case-updates/${encodeURIComponent(caseNumber)}`);
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
  return apiFetch('/cases/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  updateNotes?: string;
  emailSent?: boolean;
}

export async function updateCase(data: UpdateCasePayload): Promise<{
  success: boolean;
  caseNumber: string;
  message: string;
}> {
  return apiFetch('/cases/update', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
