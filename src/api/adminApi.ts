// Admin API client

import { apiFetch } from './index';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  assignedAccounts: string[];
  assignedLOBs: string[];
  createdAt: string;
  lastActive: string;
}

export interface ActivityLogEntry {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface BlockedEmail {
  email: string;
  blockedAt: string;
  blockedBy: string;
  reason: string;
}

export async function fetchUsers(): Promise<AdminUser[]> {
  const res = await apiFetch<AdminUser[]>('/admin/users');
  return res;
}

export async function createUser(email: string, displayName: string, role: string): Promise<AdminUser> {
  const res = await apiFetch<AdminUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, displayName, role }),
  });
  return res;
}

export async function updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
  const res = await apiFetch<AdminUser>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return res;
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function fetchActivityLog(limit = 50): Promise<ActivityLogEntry[]> {
  const res = await apiFetch<ActivityLogEntry[]>(`/admin/activity-log?limit=${limit}`);
  return res;
}

export async function fetchBlockedEmails(): Promise<BlockedEmail[]> {
  const res = await apiFetch<BlockedEmail[]>('/admin/blocked-emails');
  return res;
}

export async function addBlockedEmail(email: string, reason: string): Promise<void> {
  await apiFetch('/admin/blocked-emails', {
    method: 'POST',
    body: JSON.stringify({ email, reason }),
  });
}
