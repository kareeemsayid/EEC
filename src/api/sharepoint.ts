import { Account, LOB, Site, AttritionCase, CaseUpdate, EmailThread, CreateCasePayload } from "../utils/types";

const SITE_URL = process.env.REACT_APP_SHAREPOINT_SITE_URL || "";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// Extract site path for Graph API
function getSiteGraphPath(): string {
  try {
    const url = new URL(SITE_URL);
    const hostname = url.hostname; // e.g. contoso.sharepoint.com
    const sitePath = url.pathname; // e.g. /sites/mysite
    return `${GRAPH_BASE}/sites/${hostname}:${sitePath}`;
  } catch {
    return "";
  }
}

async function getSiteId(token: string): Promise<string> {
  const path = getSiteGraphPath();
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to get site: ${res.statusText}`);
  const data = await res.json();
  return data.id;
}

async function getListItems(
  token: string,
  siteId: string,
  listName: string,
  select?: string,
  expand?: string,
  filter?: string
): Promise<any[]> {
  let url = `${GRAPH_BASE}/sites/${siteId}/lists/${listName}/items?$expand=${expand || "fields"}`;
  if (select) url += `&$select=${select}`;
  if (filter) url += `&$filter=${filter}`;

  const allItems: any[] = [];
  let nextLink: string | undefined = url;

  while (nextLink) {
    const res: Response = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to get list ${listName}: ${res.statusText}`);
    const data: { value?: any[]; "@odata.nextLink"?: string } = await res.json();
    allItems.push(...(data.value || []));
    nextLink = data["@odata.nextLink"];
  }

  return allItems;
}

async function createListItem(
  token: string,
  siteId: string,
  listName: string,
  fields: Record<string, any>
): Promise<any> {
  const res = await fetch(
    `${GRAPH_BASE}/sites/${siteId}/lists/${listName}/items`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create item in ${listName}: ${err}`);
  }
  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchAccounts(token: string): Promise<Account[]> {
  const siteId = await getSiteId(token);
  const items = await getListItems(token, siteId, "Accounts");
  return items.map((item: any) => ({
    id: item.id,
    title: item.fields?.Title || "",
    warningHours: item.fields?.WarningHours ?? 8,
    criticalHours: item.fields?.CriticalHours ?? 16,
    documentGraceHours: item.fields?.DocumentGraceHours ?? 24,
  }));
}

export async function fetchLOBs(token: string): Promise<LOB[]> {
  const siteId = await getSiteId(token);
  const items = await getListItems(token, siteId, "LOBs", undefined, "fields($expand=Account)");
  return items.map((item: any) => ({
    id: item.id,
    title: item.fields?.Title || "",
    accountId: item.fields?.AccountLookupId || item.fields?.Account?.id || "",
  }));
}

export async function fetchSites(token: string): Promise<Site[]> {
  const siteId = await getSiteId(token);
  const items = await getListItems(token, siteId, "Sites");
  return items.map((item: any) => ({
    id: item.id,
    title: item.fields?.Title || "",
  }));
}

export async function fetchAttritionCases(
  token: string,
  trainerEmail?: string
): Promise<AttritionCase[]> {
  const siteId = await getSiteId(token);
  const filter = trainerEmail
    ? `fields/TrainerEmail eq '${trainerEmail}'`
    : undefined;
  const items = await getListItems(token, siteId, "AttritionCases", undefined, undefined, filter);

  return items.map((item: any) => ({
    id: item.id,
    caseNumber: item.fields?.CaseNumber || item.id,
    traineeName: item.fields?.TraineeName || "",
    oracleId: item.fields?.OracleID || "",
    personalEmail: item.fields?.PersonalEmail || "",
    account: item.fields?.Account?.Title || "",
    accountId: item.fields?.AccountLookupId || "",
    lob: item.fields?.LOB?.Title || "",
    lobId: item.fields?.LOBLookupId || "",
    site: item.fields?.Site?.Title || item.fields?.SiteLookupId || "",
    siteId: item.fields?.SiteLookupId || "",
    wave: item.fields?.Wave || "",
    trainerName: item.fields?.TrainerName || "",
    trainerEmail: item.fields?.TrainerEmail || "",
    trainingManager: item.fields?.TrainingManager || "",
    trainingManagerEmail: item.fields?.TrainingManagerEmail || "",
    attritionCategory: item.fields?.AttritionCategory || "",
    subReason: item.fields?.SubReason || "",
    severityLevel: item.fields?.SeverityLevel || "Low",
    totalMissedHours: item.fields?.TotalMissedHours || 0,
    incidentDate: item.fields?.IncidentDate || "",
    riskStatus: item.fields?.RiskStatus || "Monitoring",
    lifecycleStage: item.fields?.LifecycleStage || "Initial Review",
    caseStatus: item.fields?.CaseStatus || "Open",
    notes: item.fields?.Notes || "",
    documentationRequired: item.fields?.DocumentationRequired || false,
    escalationRequired: item.fields?.EscalationRequired || false,
    outlookConversationId: item.fields?.OutlookConversationID || "",
    created: item.createdDateTime || "",
    modified: item.lastModifiedDateTime || "",
  }));
}

export async function fetchCaseByNumber(
  token: string,
  caseNumberOrOracleId: string
): Promise<AttritionCase | null> {
  const siteId = await getSiteId(token);
  const byCase = await getListItems(
    token,
    siteId,
    "AttritionCases",
    undefined,
    undefined,
    `fields/CaseNumber eq '${caseNumberOrOracleId}'`
  );
  if (byCase.length > 0) {
    const cases = byCase.map((item: any) => mapCase(item));
    return cases[0];
  }
  const byOracle = await getListItems(
    token,
    siteId,
    "AttritionCases",
    undefined,
    undefined,
    `fields/OracleID eq '${caseNumberOrOracleId}'`
  );
  if (byOracle.length > 0) {
    return mapCase(byOracle[0]);
  }
  return null;
}

function mapCase(item: any): AttritionCase {
  return {
    id: item.id,
    caseNumber: item.fields?.CaseNumber || item.id,
    traineeName: item.fields?.TraineeName || "",
    oracleId: item.fields?.OracleID || "",
    personalEmail: item.fields?.PersonalEmail || "",
    account: item.fields?.Account?.Title || "",
    accountId: item.fields?.AccountLookupId || "",
    lob: item.fields?.LOB?.Title || "",
    lobId: item.fields?.LOBLookupId || "",
    site: item.fields?.Site?.Title || "",
    siteId: item.fields?.SiteLookupId || "",
    wave: item.fields?.Wave || "",
    trainerName: item.fields?.TrainerName || "",
    trainerEmail: item.fields?.TrainerEmail || "",
    trainingManager: item.fields?.TrainingManager || "",
    trainingManagerEmail: item.fields?.TrainingManagerEmail || "",
    attritionCategory: item.fields?.AttritionCategory || "",
    subReason: item.fields?.SubReason || "",
    severityLevel: item.fields?.SeverityLevel || "Low",
    totalMissedHours: item.fields?.TotalMissedHours || 0,
    incidentDate: item.fields?.IncidentDate || "",
    riskStatus: item.fields?.RiskStatus || "Monitoring",
    lifecycleStage: item.fields?.LifecycleStage || "Initial Review",
    caseStatus: item.fields?.CaseStatus || "Open",
    notes: item.fields?.Notes || "",
    documentationRequired: item.fields?.DocumentationRequired || false,
    escalationRequired: item.fields?.EscalationRequired || false,
    outlookConversationId: item.fields?.OutlookConversationID || "",
    created: item.createdDateTime || "",
    modified: item.lastModifiedDateTime || "",
  };
}

export async function fetchCaseUpdates(
  token: string,
  caseNumber?: string
): Promise<CaseUpdate[]> {
  const siteId = await getSiteId(token);
  const filter = caseNumber
    ? `fields/CaseNumber eq '${caseNumber}'`
    : undefined;
  const items = await getListItems(token, siteId, "CaseUpdates", undefined, undefined, filter);
  return items.map((item: any) => ({
    id: item.id,
    caseId: item.fields?.CaseId || "",
    caseNumber: item.fields?.CaseNumber || "",
    updateType: item.fields?.UpdateType || "",
    hoursAdded: item.fields?.HoursAdded || 0,
    absenceDate: item.fields?.AbsenceDate || "",
    absenceType: item.fields?.AbsenceType || "",
    overrideStage: item.fields?.OverrideStage,
    notes: item.fields?.Notes || "",
    escalationRequired: item.fields?.EscalationRequired || false,
    documentationRequired: item.fields?.DocumentationRequired || false,
    updatedBy: item.fields?.UpdatedBy || "",
    updatedByEmail: item.fields?.UpdatedByEmail || "",
    created: item.createdDateTime || "",
  }));
}

export async function fetchEmailThread(
  token: string,
  caseNumber: string
): Promise<EmailThread | null> {
  const siteId = await getSiteId(token);
  const items = await getListItems(
    token,
    siteId,
    "EmailThreadTracking",
    undefined,
    undefined,
    `fields/CaseNumber eq '${caseNumber}'`
  );
  if (items.length === 0) return null;
  const item = items[0];
  return {
    id: item.id,
    caseId: item.fields?.CaseId || "",
    caseNumber: item.fields?.CaseNumber || "",
    conversationId: item.fields?.ConversationId || "",
    subject: item.fields?.Subject || "",
    lastReplyDate: item.fields?.LastReplyDate || "",
    threadCount: item.fields?.ThreadCount || 0,
  };
}

export async function createCaseAudit(
  token: string,
  payload: Record<string, any>
): Promise<void> {
  const siteId = await getSiteId(token);
  await createListItem(token, siteId, "CaseUpdates", payload);
}

export async function writeEmailThread(
  token: string,
  payload: Record<string, any>
): Promise<void> {
  const siteId = await getSiteId(token);
  await createListItem(token, siteId, "EmailThreadTracking", payload);
}
