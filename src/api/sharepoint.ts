// src/api/sharepoint.ts
// Microsoft Graph API integration for EEC SharePoint lists
// Site: https://cnxmail.sharepoint.com/sites/TrainingAttritionCommandCenter

import type {
  RiskStatus,
  SeverityLevel,
  LifecycleStage,
  CaseStatus,
  InvestigationType,
  InvestigationPriority,
  InvestigationStatus,
  TaskStatus,
  HRInvestigation,
  InvestigationTask,
  InvestigationAttachment,
  InvestigationUpdate,
  CreateInvestigationPayload,
  UpdateInvestigationPayload,
  CreateTaskPayload,
} from "../utils/types";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SITE_URL =
  process.env.REACT_APP_SHAREPOINT_SITE_URL ||
  "https://cnxmail.sharepoint.com/sites/TrainingAttritionCommandCenter";

if (!process.env.REACT_APP_SHAREPOINT_SITE_URL) {
  console.warn(
    "[sharepoint.ts] REACT_APP_SHAREPOINT_SITE_URL not set in env, using fallback:",
    SITE_URL
  );
}

// Possible list name variations to try when a list is not found
const LIST_NAME_ALIASES: Record<string, string[]> = {
  "AttritionCases": ["AttritionCases", "Attrition Case", "Attrition_Cases", "Cases", "EEC Cases"],
  "Accounts": ["Accounts", "Account", "Client", "Clients", "Account List"],
  "LOBs": ["LOBs", "LOB", "Lines of Business", "LineOfBusiness", "LinesOfBusiness"],
  "Sites": ["Sites", "Site", "Site List", "Locations", "Locations List"],
  "PSUsers": ["PSUsers", "PS Users", "PS_Users", "People Solutions Users", "PeopleSolutionsUsers"],
  "CaseUpdates": ["CaseUpdates", "Case Updates", "Case_Updates", "Updates", "EEC Case Updates"],
  "EmailThreadTracking": ["EmailThreadTracking", "Email Thread Tracking", "EmailThread", "ThreadTracking", "Email Threads"],
  "AttendanceHistory": ["AttendanceHistory", "Attendance History", "Attendance_History", "Attendance", "Attendance Log"],
  "EscalationHistory": ["EscalationHistory", "Escalation History", "Escalation_History", "Escalations", "Escalation Log"],
  "HRInvestigations": ["HRInvestigations", "HR Investigations", "HR_Investigations", "Investigations"],
  "InvestigationTasks": ["InvestigationTasks", "Investigation Tasks", "Investigation_Tasks", "Tasks"],
  "InvestigationAttachments": ["InvestigationAttachments", "Investigation Attachments", "Investigation_Attachments", "Attachments"],
  "InvestigationUpdates": ["InvestigationUpdates", "Investigation Updates", "Investigation_Updates"],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function graphFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error ${res.status}: ${err}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

// Get SharePoint site ID (cached)
let _siteId: string | null = null;
async function getSiteId(token: string): Promise<string> {
  if (_siteId) return _siteId;
  try {
    const url = new URL(SITE_URL);
    const hostname = url.hostname;
    const sitePath = url.pathname;
    const data = await graphFetch<{ id: string }>(
      token,
      `/sites/${hostname}:${sitePath}`
    );
    _siteId = data.id;
    console.log("[sharepoint.ts] Site ID resolved:", _siteId);
    return _siteId;
  } catch (err) {
    console.error("[sharepoint.ts] Invalid SITE_URL:", SITE_URL, err);
    throw new Error(`Invalid SharePoint site URL: ${SITE_URL}`);
  }
}

// Try to find a list by trying different name variations
async function findList(
  token: string,
  siteId: string,
  preferredName: string
): Promise<string | null> {
  const aliases = LIST_NAME_ALIASES[preferredName] || [preferredName];

  for (const listName of aliases) {
    try {
      // Try to fetch the list metadata
      await graphFetch<any>(token, `/sites/${siteId}/lists/${listName}?$select=id`);
      if (listName !== preferredName) {
        console.log(`[sharepoint.ts] Found list "${preferredName}" as "${listName}"`);
      }
      return listName;
    } catch (err) {
      // Continue to next alias
    }
  }
  return null;
}

// Export for UI to show which lists are missing
export const missingListErrors: string[] = [];

// Get list items with optional filter/select/expand
async function getListItems<T>(
  token: string,
  listName: string,
  params?: { filter?: string; select?: string; expand?: string; top?: number }
): Promise<T[]> {
  const siteId = await getSiteId(token);

  // Try to find the correct list name
  const actualListName = await findList(token, siteId, listName);

  if (!actualListName) {
    const errorMsg = `The '${listName}' list could not be found in SharePoint. Please check the list name.`;
    console.error(`[sharepoint.ts] ${errorMsg}`);
    missingListErrors.push(listName);
    throw new Error(errorMsg);
  }

  const qs = new URLSearchParams();
  if (params?.filter) qs.set("$filter", params.filter);
  if (params?.select) qs.set("$select", params.select);
  if (params?.expand) qs.set("$expand", params.expand);
  qs.set("$top", String(params?.top ?? 500));

  const data = await graphFetch<{ value: T[] }>(
    token,
    `/sites/${siteId}/lists/${actualListName}/items?${qs.toString()}&expand=fields`
  );
  return data.value.map((item: any) => ({ id: item.id, ...item.fields }));
}

// Create a list item
async function createListItem(
  token: string,
  listName: string,
  fields: Record<string, any>
): Promise<{ id: string }> {
  const siteId = await getSiteId(token);

  // Try to find the correct list name
  const actualListName = await findList(token, siteId, listName);

  if (!actualListName) {
    throw new Error(`The '${listName}' list could not be found. Cannot create item.`);
  }

  return graphFetch(token, `/sites/${siteId}/lists/${actualListName}/items`, {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
}

// Update a list item
async function updateListItem(
  token: string,
  listName: string,
  itemId: string,
  fields: Record<string, any>
): Promise<void> {
  const siteId = await getSiteId(token);

  const actualListName = await findList(token, siteId, listName);

  if (!actualListName) {
    throw new Error(`The '${listName}' list could not be found. Cannot update item.`);
  }

  await graphFetch(
    token,
    `/sites/${siteId}/lists/${actualListName}/items/${itemId}/fields`,
    { method: "PATCH", body: JSON.stringify(fields) }
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface PSUser {
  id: string;
  email: string;
  title: string;
}

export interface EmailThread {
  id: string;
  caseNumber: string;
  conversationId: string;
  threadSubject: string;
  lastEmailDate: string;
  totalEmailsSent: number;
  threadStatus: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  photoUrl?: string | null;
}

// ─── User Profile + Photo ─────────────────────────────────────────────────────

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  try {
    console.log("[fetchUserProfile] Starting profile fetch...");

    const data = await graphFetch<any>(
      token,
      "/me?$select=id,displayName,mail,givenName,surname,jobTitle,userPrincipalName,department,officeLocation"
    );

    console.log("[fetchUserProfile] Raw Graph API response:", data);

    const displayName = data.displayName || "";
    let firstName = data.givenName || "";
    let lastName = data.surname || "";

    // Fallback: extract first/last name from displayName if givenName is empty
    if (!firstName && displayName) {
      const nameParts = displayName.split(" ").filter(Boolean);
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    // Ensure email - try multiple sources
    const email = data.mail || data.userPrincipalName || "";

    console.log("[fetchUserProfile] Processed profile:", {
      displayName,
      firstName,
      lastName,
      email,
      jobTitle: data.jobTitle || "Trainer",
    });

    return {
      id: data.id || "",
      displayName,
      email,
      firstName,
      lastName,
      jobTitle: data.jobTitle || "Team Member",
    };
  } catch (error) {
    console.error("[fetchUserProfile] Error fetching profile:", error);
    // Return a default profile instead of throwing
    return {
      id: "unknown",
      displayName: "User",
      email: "",
      firstName: "User",
      lastName: "",
      jobTitle: "Team Member",
    };
  }
}

export async function fetchUserPhotoUrl(token: string): Promise<string | null> {
  try {
    console.log("[fetchUserPhotoUrl] Fetching user photo...");
    const res = await fetch(`${GRAPH}/me/photo/$value`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.log("[fetchUserPhotoUrl] Photo not available, status:", res.status);
      return null;
    }

    const blob = await res.blob();
    const photoUrl = URL.createObjectURL(blob);
    console.log("[fetchUserPhotoUrl] Photo loaded successfully");
    return photoUrl;
  } catch (error) {
    console.log("[fetchUserPhotoUrl] Error fetching photo:", error);
    return null;
  }
}

// ─── Attrition Cases ──────────────────────────────────────────────────────────

function mapCase(f: any): AttritionCase {
  return {
    id: f.id || "",
    caseNumber: f.CaseNumber || f.Title || "",
    traineeName: f.TraineeName || "",
    oracleId: f.OracleID || "",
    personalEmail: f.PersonalEmail || "",
    workEmail: f.WorkEmail || "",
    account: f.Account || "",
    lob: f.LOB || "",
    site: f.Site || "",
    wave: f.Wave || "",
    trainerName: f.TrainerName || "",
    trainerEmail: f.TrainerEmail || "",
    trainingManager: f.TrainingManager || "",
    trainingManagerEmail: f.TrainingManagerEmail || "",
    attritionCategory: f.AttritionCategory || "",
    subReason: f.SubReason || "",
    severityLevel: (f.SeverityLevel || "Low") as SeverityLevel,
    totalMissedHours: Number(f.TotalMissedHours) || 0,
    riskStatus: (f.RiskStatus || "Monitoring") as RiskStatus,
    lifecycleStage: (f.LifecycleStage || "Monitoring") as LifecycleStage,
    incidentDate: f.IncidentDate || "",
    hireDate: f.HireDate || "",
    caseOpenedDate: f.CaseOpenedDate || "",
    lastUpdatedDate: f.LastUpdatedDate || "",
    caseStatus: (f.CaseStatus || "Active") as CaseStatus,
    notes: f.Notes || "",
    outlookConversationId: f.OutlookConversationID || "",
    documentationRequired: !!f.DocumentationRequired,
    escalationRequired: !!f.EscalationRequired,
    workdayActionTaken: !!f.WorkdayActionTaken,
    terminationReason: f.TerminationReason || "",
    localReason: f.LocalReason || "",
    effectiveDate: f.EffectiveDate || "",
    terminationSheetSent: !!f.TerminationSheetSent,
    leaverEmailSent: !!f.LeaverEmailSent,
    thresholdHours: Number(f.ThresholdHours) || 24,
    openedBy: f.OpenedBy || "",
  };
}

export async function fetchAttritionCases(
  token: string,
  trainerEmail?: string
): Promise<AttritionCase[]> {
  try {
    const filter = trainerEmail
      ? `fields/TrainerEmail eq '${trainerEmail}'`
      : undefined;
    const items = await getListItems<any>(token, "AttritionCases", { filter });
    return items.map(mapCase);
  } catch (error) {
    console.error("[fetchAttritionCases] Error:", error);
    return [];
  }
}

export async function fetchAllCases(token: string): Promise<AttritionCase[]> {
  try {
    const items = await getListItems<any>(token, "AttritionCases");
    return items.map(mapCase);
  } catch (error) {
    console.error("[fetchAllCases] Error:", error);
    return [];
  }
}

export async function fetchCaseByNumber(
  token: string,
  caseRef: string
): Promise<AttritionCase | null> {
  try {
    const items = await getListItems<any>(token, "AttritionCases", {
      filter: `fields/CaseNumber eq '${caseRef}' or fields/OracleID eq '${caseRef}'`,
    });
    if (!items.length) return null;
    return mapCase(items[0]);
  } catch (error) {
    console.error("[fetchCaseByNumber] Error:", error);
    return null;
  }
}

export async function createCase(
  token: string,
  fields: Partial<AttritionCase>
): Promise<{ id: string }> {
  return createListItem(token, "AttritionCases", {
    Title: fields.caseNumber,
    CaseNumber: fields.caseNumber,
    TraineeName: fields.traineeName,
    OracleID: fields.oracleId,
    PersonalEmail: fields.personalEmail,
    WorkEmail: fields.workEmail,
    Account: fields.account,
    LOB: fields.lob,
    Site: fields.site,
    Wave: fields.wave,
    TrainerName: fields.trainerName,
    TrainerEmail: fields.trainerEmail,
    TrainingManager: fields.trainingManager,
    TrainingManagerEmail: fields.trainingManagerEmail,
    AttritionCategory: fields.attritionCategory,
    SubReason: fields.subReason,
    SeverityLevel: fields.severityLevel,
    TotalMissedHours: fields.totalMissedHours,
    RiskStatus: fields.riskStatus,
    LifecycleStage: fields.lifecycleStage,
    IncidentDate: fields.incidentDate,
    CaseOpenedDate: new Date().toISOString(),
    LastUpdatedDate: new Date().toISOString(),
    CaseStatus: "Active",
    Notes: fields.notes,
    DocumentationRequired: fields.documentationRequired,
    EscalationRequired: fields.escalationRequired,
  });
}

export async function updateCase(
  token: string,
  itemId: string,
  fields: Partial<AttritionCase>
): Promise<void> {
  const mapped: Record<string, any> = {
    LastUpdatedDate: new Date().toISOString(),
  };
  if (fields.riskStatus !== undefined) mapped.RiskStatus = fields.riskStatus;
  if (fields.lifecycleStage !== undefined) mapped.LifecycleStage = fields.lifecycleStage;
  if (fields.totalMissedHours !== undefined) mapped.TotalMissedHours = fields.totalMissedHours;
  if (fields.caseStatus !== undefined) mapped.CaseStatus = fields.caseStatus;
  if (fields.notes !== undefined) mapped.Notes = fields.notes;
  if (fields.escalationRequired !== undefined) mapped.EscalationRequired = fields.escalationRequired;
  if (fields.documentationRequired !== undefined) mapped.DocumentationRequired = fields.documentationRequired;
  if (fields.terminationReason !== undefined) mapped.TerminationReason = fields.terminationReason;
  if (fields.localReason !== undefined) mapped.LocalReason = fields.localReason;
  if (fields.effectiveDate !== undefined) mapped.EffectiveDate = fields.effectiveDate;
  if (fields.terminationSheetSent !== undefined) mapped.TerminationSheetSent = fields.terminationSheetSent;
  if (fields.leaverEmailSent !== undefined) mapped.LeaverEmailSent = fields.leaverEmailSent;
  if (fields.workdayActionTaken !== undefined) mapped.WorkdayActionTaken = fields.workdayActionTaken;
  await updateListItem(token, "AttritionCases", itemId, mapped);
}

// ─── Case Updates ─────────────────────────────────────────────────────────────

function mapUpdate(f: any): CaseUpdate {
  return {
    id: f.id || "",
    caseId: f.CaseIDLookupId || "",
    caseNumber: f.CaseNumber || "",
    oracleId: f.OracleID || "",
    traineeName: f.TraineeName || "",
    updateType: f.UpdateType || "",
    updatedBy: f.UpdatedBy || "",
    updatedByEmail: f.UpdatedByEmail || "",
    updateDate: f.UpdateDate || "",
    previousStage: f.PreviousStage || "",
    newStage: f.NewStage || "",
    previousRisk: f.PreviousRisk || "",
    newRisk: f.NewRisk || "",
    hoursAdded: Number(f.HoursAdded) || 0,
    previousTotalHours: Number(f.PreviousTotalHours) || 0,
    newTotalHours: Number(f.NewTotalHours) || 0,
    updateNotes: f.UpdateNotes || "",
    emailSent: !!f.EmailSent,
  };
}

export async function fetchCaseUpdates(token: string): Promise<CaseUpdate[]> {
  try {
    const items = await getListItems<any>(token, "CaseUpdates", {
      top: 100,
      filter: undefined,
    });
    return items.map(mapUpdate).sort(
      (a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime()
    );
  } catch (error) {
    console.error("[fetchCaseUpdates] Error:", error);
    return [];
  }
}

export async function fetchUpdatesForCase(
  token: string,
  caseNumber: string
): Promise<CaseUpdate[]> {
  try {
    const items = await getListItems<any>(token, "CaseUpdates", {
      filter: `fields/CaseNumber eq '${caseNumber}'`,
    });
    return items.map(mapUpdate);
  } catch (error) {
    console.error("[fetchUpdatesForCase] Error:", error);
    return [];
  }
}

export async function createCaseUpdate(
  token: string,
  update: Partial<CaseUpdate> & { caseItemId: string }
): Promise<void> {
  await createListItem(token, "CaseUpdates", {
    CaseIDLookupId: update.caseItemId,
    CaseNumber: update.caseNumber,
    OracleID: update.oracleId,
    TraineeName: update.traineeName,
    UpdateType: update.updateType,
    UpdatedBy: update.updatedBy,
    UpdatedByEmail: update.updatedByEmail,
    UpdateDate: new Date().toISOString(),
    PreviousStage: update.previousStage,
    NewStage: update.newStage,
    PreviousRisk: update.previousRisk,
    NewRisk: update.newRisk,
    HoursAdded: update.hoursAdded,
    PreviousTotalHours: update.previousTotalHours,
    NewTotalHours: update.newTotalHours,
    UpdateNotes: update.updateNotes,
    EmailSent: update.emailSent ?? false,
  });
}

// ─── Lookups ──────────────────────────────────────────────────────────────────

export async function fetchAccounts(token: string): Promise<Account[]> {
  try {
    const items = await getListItems<any>(token, "Accounts");
    return items.map((f) => ({
      id: f.id,
      title: f.Title || "",
      warningHours: Number(f.WarningHours) || 8,
      criticalHours: Number(f.CriticalHours) || 16,
      documentGraceHours: Number(f.DocumentGraceHours) || 48,
    }));
  } catch (error) {
    console.error("[fetchAccounts] Error:", error);
    return [];
  }
}

export async function fetchLOBs(token: string): Promise<LOB[]> {
  try {
    const items = await getListItems<any>(token, "LOBs");
    return items.map((f) => ({
      id: f.id,
      title: f.Title || "",
      accountId: f.AccountLookupId || "",
    }));
  } catch (error) {
    console.error("[fetchLOBs] Error:", error);
    return [];
  }
}

export async function fetchSites(token: string): Promise<Site[]> {
  try {
    const items = await getListItems<any>(token, "Sites");
    return items.map((f) => ({
      id: f.id,
      title: f.Title || "",
      region: f.Region || "",
    }));
  } catch (error) {
    console.error("[fetchSites] Error:", error);
    return [];
  }
}

// ─── PS Users (role check) ────────────────────────────────────────────────────

export async function fetchPSUsers(token: string): Promise<PSUser[]> {
  try {
    const items = await getListItems<any>(token, "PSUsers");
    return items.map((f) => ({
      id: f.id,
      email: (f.Email || "").toLowerCase(),
      title: f.Title || "",
    }));
  } catch (error) {
    console.error("[fetchPSUsers] Error:", error);
    return [];
  }
}

export async function checkIsPSUser(
  token: string,
  email: string
): Promise<boolean> {
  try {
    const items = await getListItems<any>(token, "PSUsers", {
      filter: `fields/Email eq '${email.toLowerCase()}'`,
      top: 1,
    });
    return items.length > 0;
  } catch (error) {
    console.error("[checkIsPSUser] Error:", error);
    return false;
  }
}

// ─── Email Threads ────────────────────────────────────────────────────────────

export async function fetchEmailThread(
  token: string,
  caseNumber: string
): Promise<EmailThread | null> {
  try {
    const items = await getListItems<any>(token, "EmailThreadTracking", {
      filter: `fields/CaseNumber eq '${caseNumber}'`,
      top: 1,
    });
    if (!items.length) return null;
    const f = items[0];
    return {
      id: f.id,
      caseNumber: f.CaseNumber || "",
      conversationId: f.ConversationID || "",
      threadSubject: f.ThreadSubject || "",
      lastEmailDate: f.LastEmailDate || "",
      totalEmailsSent: Number(f.TotalEmailsSent) || 0,
      threadStatus: f.ThreadStatus || "Active",
    };
  } catch (error) {
    console.error("[fetchEmailThread] Error:", error);
    return null;
  }
}

// ─── Attendance History ───────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  caseId: string;
  caseNumber: string;
  oracleId: string;
  traineeName: string;
  absenceDate: string;
  hoursMissed: number;
  absenceType: string;
  absenceReason: string;
  excused: boolean;
  runningTotal: number;
  thresholdCrossed: string;
  alertSent: boolean;
  loggedBy: string;
  loggedDate: string;
}

export async function fetchAttendanceForCase(
  token: string,
  caseNumber: string
): Promise<AttendanceRecord[]> {
  try {
    const items = await getListItems<any>(token, "AttendanceHistory", {
      filter: `fields/CaseNumber eq '${caseNumber}'`,
    });
    return items.map((f: any) => ({
      id: f.id || "",
      caseId: f.CaseIDLookupId || "",
      caseNumber: f.CaseNumber || "",
      oracleId: f.OracleID || "",
      traineeName: f.TraineeName || "",
      absenceDate: f.AbsenceDate || "",
      hoursMissed: Number(f.HoursMissed) || 0,
      absenceType: f.AbsenceType || "",
      absenceReason: f.AbsenceReason || "",
      excused: !!f.Excused,
      runningTotal: Number(f.RunningTotal) || 0,
      thresholdCrossed: f.ThresholdCrossed || "None",
      alertSent: !!f.AlertSent,
      loggedBy: f.LoggedBy || "",
      loggedDate: f.LoggedDate || "",
    }));
  } catch (error) {
    console.error("[fetchAttendanceForCase] Error:", error);
    return [];
  }
}

export async function logAttendance(
  token: string,
  data: {
    caseItemId: string;
    caseNumber: string;
    oracleId: string;
    traineeName: string;
    absenceDate: string;
    hoursMissed: number;
    absenceType: string;
    absenceReason: string;
    excused: boolean;
    runningTotal: number;
    loggedBy: string;
  }
): Promise<void> {
  const thresholdCrossed =
    data.runningTotal >= 16 && data.runningTotal - data.hoursMissed < 16
      ? "16hr"
      : data.runningTotal >= 8 && data.runningTotal - data.hoursMissed < 8
      ? "8hr"
      : "None";

  await createListItem(token, "AttendanceHistory", {
    CaseIDLookupId: data.caseItemId,
    CaseNumber: data.caseNumber,
    OracleID: data.oracleId,
    TraineeName: data.traineeName,
    AbsenceDate: data.absenceDate,
    HoursMissed: data.hoursMissed,
    AbsenceType: data.absenceType,
    AbsenceReason: data.absenceReason,
    Excused: data.excused,
    RunningTotal: data.runningTotal,
    ThresholdCrossed: thresholdCrossed,
    AlertSent: false,
    LoggedBy: data.loggedBy,
    LoggedDate: new Date().toISOString(),
  });
}

// ─── Escalation History ───────────────────────────────────────────────────────

export interface EscalationRecord {
  id: string;
  caseNumber: string;
  escalationType: string;
  escalationDate: string;
  escalatedBy: string;
  escalatedTo: string;
  escalatedToEmail: string;
  acknowledgedDate: string;
  resolutionNotes: string;
}

export async function fetchEscalationsForCase(
  token: string,
  caseNumber: string
): Promise<EscalationRecord[]> {
  try {
    const items = await getListItems<any>(token, "EscalationHistory", {
      filter: `fields/CaseNumber eq '${caseNumber}'`,
    });
    return items.map((f: any) => ({
      id: f.id || "",
      caseNumber: f.CaseNumber || "",
      escalationType: f.EscalationType || "",
      escalationDate: f.EscalationDate || "",
      escalatedBy: f.EscalatedBy || "",
      escalatedTo: f.EscalatedTo || "",
      escalatedToEmail: f.EscalatedToEmail || "",
      acknowledgedDate: f.AcknowledgedDate || "",
      resolutionNotes: f.ResolutionNotes || "",
    }));
  } catch (error) {
    console.error("[fetchEscalationsForCase] Error:", error);
    return [];
  }
}

// ─── HR Investigation Module ─────────────────────────────────────────────────

let _investigationCounter = 1;

function mapInvestigation(f: any): HRInvestigation {
  return {
    id: f.id || "",
    investigationNumber: f.InvestigationNumber || f.Title || "",
    caseId: f.CaseIDLookupId || "",
    caseNumber: f.CaseNumber || "",
    traineeName: f.TraineeName || "",
    oracleId: f.OracleID || "",
    investigationType: (f.InvestigationType || "Other") as InvestigationType,
    status: (f.Status || "Open") as InvestigationStatus,
    priority: (f.Priority || "Medium") as InvestigationPriority,
    summary: f.Summary || "",
    details: f.Details || "",
    findings: f.Findings || "",
    recommendation: f.Recommendation || "",
    assignedTo: f.AssignedTo || "",
    assignedToEmail: f.AssignedToEmail || "",
    createdBy: f.CreatedBy || "",
    createdByEmail: f.CreatedByEmail || "",
    dueDate: f.DueDate || "",
    createdDate: f.CreatedDate || f.Created || "",
    lastUpdatedDate: f.LastUpdatedDate || f.Modified || "",
    closedDate: f.ClosedDate || "",
    closedBy: f.ClosedBy || "",
    approvedBy: f.ApprovedBy || "",
    approvedDate: f.ApprovedDate || "",
    hasActiveTasks: !!f.HasActiveTasks,
    tasksCount: Number(f.TasksCount) || 0,
    attachmentsCount: Number(f.AttachmentsCount) || 0,
  };
}

function mapTask(f: any): InvestigationTask {
  return {
    id: f.id || "",
    investigationId: f.InvestigationIDLookupId || "",
    investigationNumber: f.InvestigationNumber || "",
    taskDescription: f.TaskDescription || f.Title || "",
    status: (f.Status || "Pending") as TaskStatus,
    assignedTo: f.AssignedTo || "",
    assignedToEmail: f.AssignedToEmail || "",
    dueDate: f.DueDate || "",
    createdDate: f.CreatedDate || f.Created || "",
    completedDate: f.CompletedDate || "",
    completedBy: f.CompletedBy || "",
    completionNotes: f.CompletionNotes || "",
    priority: (f.Priority || "Medium") as InvestigationPriority,
  };
}

function mapAttachment(f: any): InvestigationAttachment {
  return {
    id: f.id || "",
    investigationId: f.InvestigationIDLookupId || "",
    investigationNumber: f.InvestigationNumber || "",
    fileName: f.FileName || f.Title || "",
    fileUrl: f.FileUrl || "",
    fileSize: Number(f.FileSize) || 0,
    uploadedBy: f.UploadedBy || "",
    uploadedByEmail: f.UploadedByEmail || "",
    uploadedDate: f.UploadedDate || f.Created || "",
    fileType: f.FileType || "",
  };
}

function mapInvestigationUpdate(f: any): InvestigationUpdate {
  return {
    id: f.id || "",
    investigationId: f.InvestigationIDLookupId || "",
    investigationNumber: f.InvestigationNumber || "",
    updateType: f.UpdateType || "",
    updateDescription: f.UpdateDescription || "",
    updatedBy: f.UpdatedBy || "",
    updatedByEmail: f.UpdatedByEmail || "",
    updateDate: f.UpdateDate || f.Created || "",
    previousValue: f.PreviousValue || "",
    newValue: f.NewValue || "",
  };
}

// Generate investigation number
function generateInvestigationNumber(): string {
  const year = new Date().getFullYear();
  const num = String(_investigationCounter++).padStart(4, "0");
  return `INV-${year}-${num}`;
}

// Fetch all investigations with optional filters
export async function fetchInvestigations(
  token: string,
  filters?: {
    status?: InvestigationStatus;
    priority?: InvestigationPriority;
    assignedTo?: string;
  }
): Promise<HRInvestigation[]> {
  try {
    const filterParts: string[] = [];
    if (filters?.status) filterParts.push(`fields/Status eq '${filters.status}'`);
    if (filters?.priority) filterParts.push(`fields/Priority eq '${filters.priority}'`);
    if (filters?.assignedTo) filterParts.push(`fields/AssignedToEmail eq '${filters.assignedTo}'`);

    const filter = filterParts.length > 0 ? filterParts.join(" and ") : undefined;

    const items = await getListItems<any>(token, "HRInvestigations", { filter });
    return items.map(mapInvestigation).sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  } catch (error) {
    console.error("[fetchInvestigations] Error:", error);
    return [];
  }
}

// Fetch single investigation by ID
export async function fetchInvestigationById(
  token: string,
  investigationId: string
): Promise<HRInvestigation | null> {
  try {
    const items = await getListItems<any>(token, "HRInvestigations", {
      filter: `id eq '${investigationId}'`,
      top: 1,
    });
    if (!items.length) return null;
    return mapInvestigation(items[0]);
  } catch (error) {
    console.error("[fetchInvestigationById] Error:", error);
    return null;
  }
}

// Fetch investigation by case number
export async function fetchInvestigationByCaseNumber(
  token: string,
  caseNumber: string
): Promise<HRInvestigation | null> {
  try {
    const items = await getListItems<any>(token, "HRInvestigations", {
      filter: `fields/CaseNumber eq '${caseNumber}'`,
      top: 1,
    });
    if (!items.length) return null;
    return mapInvestigation(items[0]);
  } catch (error) {
    console.error("[fetchInvestigationByCaseNumber] Error:", error);
    return null;
  }
}

// Fetch investigation with tasks and attachments
export async function fetchInvestigationDetails(
  token: string,
  investigationId: string
): Promise<{
  investigation: HRInvestigation | null;
  tasks: InvestigationTask[];
  attachments: InvestigationAttachment[];
  updates: InvestigationUpdate[];
}> {
  const investigation = await fetchInvestigationById(token, investigationId);

  if (!investigation) {
    return { investigation: null, tasks: [], attachments: [], updates: [] };
  }

  const [tasks, attachments, updates] = await Promise.all([
    fetchTasksForInvestigation(token, investigation.investigationNumber),
    fetchAttachmentsForInvestigation(token, investigation.investigationNumber),
    fetchUpdatesForInvestigation(token, investigation.investigationNumber),
  ]);

  return { investigation, tasks, attachments, updates };
}

// Create new investigation
export async function createInvestigation(
  token: string,
  data: CreateInvestigationPayload
): Promise<{ id: string; investigationNumber: string }> {
  const investigationNumber = generateInvestigationNumber();

  const result = await createListItem(token, "HRInvestigations", {
    Title: investigationNumber,
    InvestigationNumber: investigationNumber,
    CaseIDLookupId: data.caseId,
    CaseNumber: data.caseNumber,
    TraineeName: data.traineeName,
    OracleID: data.oracleId,
    InvestigationType: data.investigationType,
    Status: "Open",
    Priority: data.priority,
    Summary: data.summary,
    Details: data.details,
    AssignedTo: data.assignedTo,
    AssignedToEmail: data.assignedToEmail,
    CreatedBy: data.createdBy,
    CreatedByEmail: data.createdByEmail,
    DueDate: data.dueDate,
    CreatedDate: new Date().toISOString(),
    LastUpdatedDate: new Date().toISOString(),
  });

  // Log creation update
  await addInvestigationUpdate(token, {
    investigationId: result.id,
    investigationNumber,
    updateType: "Investigation Created",
    updateDescription: `Investigation created for case ${data.caseNumber}`,
    updatedBy: data.createdBy,
    updatedByEmail: data.createdByEmail,
  });

  return { id: result.id, investigationNumber };
}

// Update investigation
export async function updateInvestigation(
  token: string,
  investigationId: string,
  data: Partial<UpdateInvestigationPayload>,
  updatedBy: string,
  updatedByEmail: string
): Promise<void> {
  const current = await fetchInvestigationById(token, investigationId);
  if (!current) throw new Error("Investigation not found");

  const mapped: Record<string, any> = {
    LastUpdatedDate: new Date().toISOString(),
  };

  if (data.status !== undefined) mapped.Status = data.status;
  if (data.priority !== undefined) mapped.Priority = data.priority;
  if (data.summary !== undefined) mapped.Summary = data.summary;
  if (data.details !== undefined) mapped.Details = data.details;
  if (data.findings !== undefined) mapped.Findings = data.findings;
  if (data.recommendation !== undefined) mapped.Recommendation = data.recommendation;
  if (data.assignedTo !== undefined) mapped.AssignedTo = data.assignedTo;
  if (data.assignedToEmail !== undefined) mapped.AssignedToEmail = data.assignedToEmail;
  if (data.dueDate !== undefined) mapped.DueDate = data.dueDate;

  await updateListItem(token, "HRInvestigations", investigationId, mapped);

  // Log updates
  const updateDescriptions: string[] = [];
  if (data.status && data.status !== current.status) {
    updateDescriptions.push(`Status changed from ${current.status} to ${data.status}`);
  }
  if (data.priority && data.priority !== current.priority) {
    updateDescriptions.push(`Priority changed from ${current.priority} to ${data.priority}`);
  }
  if (data.assignedTo && data.assignedTo !== current.assignedTo) {
    updateDescriptions.push(`Assigned to ${data.assignedTo}`);
  }

  if (updateDescriptions.length > 0) {
    await addInvestigationUpdate(token, {
      investigationId,
      investigationNumber: current.investigationNumber,
      updateType: "Investigation Updated",
      updateDescription: updateDescriptions.join("; "),
      updatedBy,
      updatedByEmail,
    });
  }
}

// Fetch tasks for investigation
export async function fetchTasksForInvestigation(
  token: string,
  investigationNumber: string
): Promise<InvestigationTask[]> {
  try {
    const items = await getListItems<any>(token, "InvestigationTasks", {
      filter: `fields/InvestigationNumber eq '${investigationNumber}'`,
    });
    return items.map(mapTask).sort((a, b) => {
      const statusOrder = { "Pending": 0, "In Progress": 1, "Completed": 2, "Cancelled": 3 };
      return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
    });
  } catch (error) {
    console.error("[fetchTasksForInvestigation] Error:", error);
    return [];
  }
}

// Add task to investigation
export async function addTask(
  token: string,
  data: CreateTaskPayload,
  createdBy: string,
  createdByEmail: string
): Promise<{ id: string }> {
  const result = await createListItem(token, "InvestigationTasks", {
    Title: data.taskDescription.substring(0, 100),
    InvestigationIDLookupId: data.investigationId,
    InvestigationNumber: data.investigationNumber,
    TaskDescription: data.taskDescription,
    Status: "Pending",
    Priority: data.priority,
    AssignedTo: data.assignedTo,
    AssignedToEmail: data.assignedToEmail,
    DueDate: data.dueDate,
    CreatedDate: new Date().toISOString(),
  });

  // Log task creation
  await addInvestigationUpdate(token, {
    investigationId: data.investigationId,
    investigationNumber: data.investigationNumber,
    updateType: "Task Added",
    updateDescription: `Task added: "${data.taskDescription.substring(0, 50)}..." assigned to ${data.assignedTo}`,
    updatedBy: createdBy,
    updatedByEmail: createdByEmail,
  });

  return result;
}

// Complete task
export async function completeTask(
  token: string,
  taskId: string,
  investigationId: string,
  investigationNumber: string,
  completionNotes: string,
  completedBy: string,
  completedByEmail: string
): Promise<void> {
  await updateListItem(token, "InvestigationTasks", taskId, {
    Status: "Completed",
    CompletedDate: new Date().toISOString(),
    CompletedBy: completedBy,
    CompletionNotes: completionNotes,
  });

  await addInvestigationUpdate(token, {
    investigationId,
    investigationNumber,
    updateType: "Task Completed",
    updateDescription: `Task completed: ${completionNotes || "No notes provided"}`,
    updatedBy: completedBy,
    updatedByEmail: completedByEmail,
  });
}

// Fetch attachments for investigation
export async function fetchAttachmentsForInvestigation(
  token: string,
  investigationNumber: string
): Promise<InvestigationAttachment[]> {
  try {
    const items = await getListItems<any>(token, "InvestigationAttachments", {
      filter: `fields/InvestigationNumber eq '${investigationNumber}'`,
    });
    return items.map(mapAttachment).sort(
      (a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime()
    );
  } catch (error) {
    console.error("[fetchAttachmentsForInvestigation] Error:", error);
    return [];
  }
}

// Upload attachment (simplified - stores metadata, actual file upload requires SharePoint document library)
export async function uploadAttachmentMetadata(
  token: string,
  data: {
    investigationId: string;
    investigationNumber: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
    uploadedByEmail: string;
  }
): Promise<{ id: string }> {
  const result = await createListItem(token, "InvestigationAttachments", {
    Title: data.fileName,
    InvestigationIDLookupId: data.investigationId,
    InvestigationNumber: data.investigationNumber,
    FileName: data.fileName,
    FileUrl: data.fileUrl,
    FileSize: data.fileSize,
    FileType: data.fileType,
    UploadedBy: data.uploadedBy,
    UploadedByEmail: data.uploadedByEmail,
    UploadedDate: new Date().toISOString(),
  });

  await addInvestigationUpdate(token, {
    investigationId: data.investigationId,
    investigationNumber: data.investigationNumber,
    updateType: "Attachment Added",
    updateDescription: `File uploaded: ${data.fileName}`,
    updatedBy: data.uploadedBy,
    updatedByEmail: data.uploadedByEmail,
  });

  return result;
}

// Delete attachment
export async function deleteAttachment(
  token: string,
  attachmentId: string,
  investigationId: string,
  investigationNumber: string,
  deletedBy: string,
  deletedByEmail: string,
  fileName: string
): Promise<void> {
  // Note: SharePoint list item deletion requires different endpoint
  // This is a simplified version
  await addInvestigationUpdate(token, {
    investigationId,
    investigationNumber,
    updateType: "Attachment Deleted",
    updateDescription: `File deleted: ${fileName}`,
    updatedBy: deletedBy,
    updatedByEmail: deletedByEmail,
  });
}

// Fetch updates for investigation
export async function fetchUpdatesForInvestigation(
  token: string,
  investigationNumber: string
): Promise<InvestigationUpdate[]> {
  try {
    const items = await getListItems<any>(token, "InvestigationUpdates", {
      filter: `fields/InvestigationNumber eq '${investigationNumber}'`,
    });
    return items.map(mapInvestigationUpdate).sort(
      (a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime()
    );
  } catch (error) {
    console.error("[fetchUpdatesForInvestigation] Error:", error);
    return [];
  }
}

// Add investigation update
async function addInvestigationUpdate(
  token: string,
  data: {
    investigationId: string;
    investigationNumber: string;
    updateType: string;
    updateDescription: string;
    updatedBy: string;
    updatedByEmail: string;
    previousValue?: string;
    newValue?: string;
  }
): Promise<void> {
  try {
    await createListItem(token, "InvestigationUpdates", {
      InvestigationIDLookupId: data.investigationId,
      InvestigationNumber: data.investigationNumber,
      UpdateType: data.updateType,
      UpdateDescription: data.updateDescription,
      UpdatedBy: data.updatedBy,
      UpdatedByEmail: data.updatedByEmail,
      UpdateDate: new Date().toISOString(),
      PreviousValue: data.previousValue || "",
      NewValue: data.newValue || "",
    });
  } catch (error) {
    console.error("[addInvestigationUpdate] Error:", error);
  }
}

// Close investigation
export async function closeInvestigation(
  token: string,
  investigationId: string,
  findings: string,
  recommendation: string,
  closedBy: string,
  closedByEmail: string
): Promise<void> {
  const current = await fetchInvestigationById(token, investigationId);
  if (!current) throw new Error("Investigation not found");

  await updateListItem(token, "HRInvestigations", investigationId, {
    Status: "Closed",
    Findings: findings,
    Recommendation: recommendation,
    ClosedDate: new Date().toISOString(),
    ClosedBy: closedBy,
    LastUpdatedDate: new Date().toISOString(),
  });

  await addInvestigationUpdate(token, {
    investigationId,
    investigationNumber: current.investigationNumber,
    updateType: "Investigation Closed",
    updateDescription: `Investigation closed. Findings: ${findings.substring(0, 100)}...`,
    updatedBy: closedBy,
    updatedByEmail: closedByEmail,
  });

  // Update case if linked
  if (current.caseNumber) {
    // Could update the case to remove investigation flag
    console.log(`[closeInvestigation] Case ${current.caseNumber} investigation completed`);
  }
}

// Get investigation KPIs
export async function fetchInvestigationKpis(token: string): Promise<{
  totalInvestigations: number;
  openInvestigations: number;
  inProgressInvestigations: number;
  highPriorityInvestigations: number;
  overdueInvestigations: number;
}> {
  const investigations = await fetchInvestigations(token);

  const now = new Date();
  const overdue = investigations.filter(
    (i) => i.status !== "Closed" && i.status !== "Cancelled" && new Date(i.dueDate) < now
  );

  return {
    totalInvestigations: investigations.length,
    openInvestigations: investigations.filter((i) => i.status === "Open").length,
    inProgressInvestigations: investigations.filter((i) => i.status === "In Progress").length,
    highPriorityInvestigations: investigations.filter(
      (i) => (i.priority === "High" || i.priority === "Critical") && i.status !== "Closed"
    ).length,
    overdueInvestigations: overdue.length,
  };
}

// ─── Clear missing list errors ───────────────────────────────────────────────

export function clearMissingListErrors(): void {
  missingListErrors.length = 0;
}

export function getMissingListErrors(): string[] {
  return [...missingListErrors];
}
