// Relocation API client

import { apiFetch } from './index';

export interface RelocationRequest {
  id: string;
  requestId: string;
  submissionDate: string;
  submittedDate: string;
  oracleId: string;
  oid: string;
  wave: string;
  employeeName: string;
  vertical: string;
  account: string;
  language: string;
  lob: string;
  lobName: string;
  site: string;
  siteName: string;
  siteRegion: string;
  trainingSupervisor: string;
  trainingManager: string;
  status: string;
  psApprovalDate: string;
  psClearedDate: string;
  taActionDate: string;
  taClearedDate: string;
  relocatedDate: string;
  cancelledDate: string;
  slaStatus: string;
  slaRiskAssessment: string;
  priorityLogic: string;
  notations: string;
  msaValidation: string;
  currentMSA: string;
  currentStatus: string;
  month: string;
  quarter: string;
  reachableNumber: string;
  preferredSiteArea: string;
  releaseDate: string;
  releaseDateCompliance: string;
  attendanceAdherence: string;
  disciplinaryNotes: string;
  additionalNotes: string;
  relocationReason: string;
  submittedByEmail: string;
  submittedByName: string;
  supervisorEmail: string;
  trainingManagerEmail: string;
  overdueFlag: boolean;
  remindTA: boolean;
  remindTADate: string;
  lastUpdatedDate: string;
  hireDate?: string;
  jobRequisitionNumber?: string;
}

export interface RelocationUpdate {
  id: string;
  relocationId: string;
  updateType: string;
  newStatus: string;
  updateDate: string;
  updatedBy: string;
  updatedByEmail: string;
  updateNotes: string;
  isInternal: boolean;
}

export interface RelocationCounts {
  total: number;
  submitted: number;
  psCleared: number;
  taCleared: number;
  relocated: number;
  cancelled: number;
  overduePS: number;
  overdueTA: number;
}

export interface CreateRelocationPayload {
  employeeName: string;
  oid: string;
  reachableNumber: string;
  language: string;
  hireDate: string;
  currentSite: string;
  currentLOB: string;
  currentAccount: string;
  siteId?: string;
  lobId?: string;
  accountId?: string;
  wave: string;
  vertical: string;
  currentMSA: string;
  preferredSiteArea: string[];
  relocationReason: string;
  releaseDate: string;
  attendanceAdherence: string;
  disciplinaryNotes: string;
  additionalNotes: string;
  jobRequisitionNumber?: string;
  trainingSupervisorName: string;
  trainingSupervisorEmail: string;
  trainingManagerName: string;
  trainingManagerEmail: string;
}

export interface RelocationListResponse {
  success: boolean;
  data: {
    relocations: RelocationRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RelocationListParams {
  status?: string;
  account?: string;
  lob?: string;
  site?: string;
  search?: string;
  month?: string;
  quarter?: string;
  vertical?: string;
  page?: number;
  limit?: number;
}

export async function fetchRelocationCounts(): Promise<RelocationCounts> {
  const res = await apiFetch<{ success: boolean; data: RelocationCounts }>('/relocations/counts');
  return res.data;
}

export async function fetchRelocations(params: RelocationListParams = {}): Promise<RelocationListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
  });
  const qs = query.toString();
  return apiFetch<RelocationListResponse>(`/relocations${qs ? `?${qs}` : ''}`);
}

export async function fetchRelocationDetail(id: string): Promise<RelocationRequest> {
  const res = await apiFetch<{ success: boolean; data: RelocationRequest }>(`/relocations/${id}`);
  return res.data;
}

export async function fetchRelocationTimeline(id: string): Promise<RelocationUpdate[]> {
  const res = await apiFetch<{ success: boolean; data: RelocationUpdate[] }>(`/relocations/${id}/timeline`);
  return res.data;
}

export async function createRelocation(payload: CreateRelocationPayload): Promise<{ id: string; requestId: string; duplicateWarning: boolean; priorCases: boolean }> {
  const res = await apiFetch<{ success: boolean; data: { id: string; requestId: string }; duplicateWarning: boolean; priorCases: boolean }>(`/relocations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { ...res.data, duplicateWarning: res.duplicateWarning, priorCases: res.priorCases };
}

export async function updateRelocationStatus(id: string, status: string, notes?: string): Promise<void> {
  await apiFetch(`/relocations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  });
}

export async function addRelocationComment(id: string, comment: string, isInternal = false): Promise<void> {
  await apiFetch(`/relocations/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment, isInternal }),
  });
}

export async function remindTA(id: string): Promise<void> {
  await apiFetch(`/relocations/${id}/remind-ta`, { method: 'POST' });
}
