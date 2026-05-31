import {
  CreateCasePayload,
  UpdateCasePayload,
  PowerAutomateCreateResponse,
  PowerAutomateUpdateResponse,
} from "../utils/types";

const CREATE_URL = process.env.REACT_APP_POWER_AUTOMATE_CREATE_CASE_URL || "";
const UPDATE_URL = process.env.REACT_APP_POWER_AUTOMATE_UPDATE_CASE_URL || "";

export async function triggerCreateCase(
  payload: CreateCasePayload
): Promise<PowerAutomateCreateResponse> {
  if (!CREATE_URL) throw new Error("Power Automate Create URL not configured");

  const res = await fetch(CREATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Power Automate Create failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    caseNumber: data.caseNumber || data.body?.caseNumber || "UNKNOWN",
    conversationId: data.conversationId || data.body?.conversationId || "",
  };
}

export async function triggerUpdateCase(
  payload: UpdateCasePayload
): Promise<PowerAutomateUpdateResponse> {
  if (!UPDATE_URL) throw new Error("Power Automate Update URL not configured");

  const res = await fetch(UPDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Power Automate Update failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    caseNumber: data.caseNumber || data.body?.caseNumber || payload.caseNumber,
    updated: data.updated ?? data.body?.updated ?? true,
  };
}
