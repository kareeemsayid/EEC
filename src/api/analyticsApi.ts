// Analytics API client

import { apiFetch } from './index';

export interface AnalyticsData {
  totalCases: number;
  criticalCases: number;
  monitoringCases: number;
  resolvedCases: number;
  attritionRate: number;
  casesByAccount: { account: string; count: number }[];
  casesByLOB: { lob: string; count: number }[];
  casesBySite: { site: string; count: number }[];
  casesByMonth: { month: string; count: number }[];
  riskDistribution: { risk: string; count: number }[];
}

export interface AttritionRateData {
  overallRate: number;
  byAccount: { account: string; rate: number }[];
  byMonth: { month: string; rate: number }[];
}

export interface TopAccountData {
  account: string;
  caseCount: number;
  criticalCount: number;
  attritionRate: number;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await apiFetch<AnalyticsData>('/analytics');
  return res;
}

export async function fetchAttritionRate(): Promise<AttritionRateData> {
  const res = await apiFetch<AttritionRateData>('/analytics/attrition-rate');
  return res;
}

export async function fetchTopAccounts(): Promise<TopAccountData[]> {
  const res = await apiFetch<TopAccountData[]>('/analytics/top-accounts');
  return res;
}
