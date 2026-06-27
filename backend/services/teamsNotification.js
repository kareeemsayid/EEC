// Teams Adaptive Card notifications via incoming webhooks

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://eec.azurestaticapps.net';

const WEBHOOKS = {
  attrition: process.env.TEAMS_WEBHOOK_ATTRITION,
  relocation: process.env.TEAMS_WEBHOOK_RELOCATION,
};

// Event type → accent color mapping
const EVENT_COLORS = {
  submitted: 'Default',
  comment: 'Default',
  investigation: 'Warning',
  termination_approved: 'Attention',
  terminated: 'Attention',
  overdue: 'Attention',
  ps_cleared: 'Good',
  ta_cleared: 'Good',
  relocated: 'Good',
  cancelled: 'Warning',
  reminder: 'Warning',
};

const EVENT_LABELS = {
  submitted: 'New Case Submitted',
  comment: 'New Comment Added',
  investigation: 'Investigation Requested',
  termination_approved: 'Termination Approved',
  terminated: 'Termination Sheet Sent',
  overdue: 'OVERDUE — Action Required',
  ps_cleared: 'PS Cleared',
  ta_cleared: 'TA Cleared',
  relocated: 'Relocated',
  cancelled: 'Cancelled',
  reminder: 'Reminder — Action Needed',
};

// ─── Send raw webhook ─────────────────────────────────────
async function sendWebhook(webhookUrl, payload) {
  if (!webhookUrl) {
    console.warn('[teamsNotification] No webhook URL configured');
    return { success: false, error: 'No webhook URL' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[teamsNotification] Webhook failed:', res.status, text);
      return { success: false, error: `HTTP ${res.status}: ${text}` };
    }

    console.log('[teamsNotification] Webhook sent successfully');
    return { success: true };
  } catch (err) {
    console.error('[teamsNotification] Webhook error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Build Adaptive Card for attrition case ───────────────
function buildCaseAdaptiveCard(caseData, eventType) {
  const accent = EVENT_COLORS[eventType] || 'Default';
  const label = EVENT_LABELS[eventType] || 'Case Update';
  const caseUrl = `${APP_BASE_URL}/cases/${caseData.id || caseData.caseNumber || ''}`;

  const facts = [
    { title: 'Case Number', value: caseData.caseNumber || '—' },
    { title: 'Trainee', value: caseData.traineeName || '—' },
    { title: 'Oracle ID', value: caseData.oracleId || '—' },
    { title: 'Account', value: caseData.account || '—' },
    { title: 'LOB', value: caseData.lob || '—' },
    { title: 'Site', value: caseData.site || '—' },
    { title: 'Wave', value: caseData.wave || '—' },
    { title: 'Risk Status', value: caseData.riskStatus || '—' },
    { title: 'Case Status', value: caseData.caseStatus || '—' },
    { title: 'Trainer', value: caseData.trainerName || caseData.trainerEmail || '—' },
  ];

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: undefined,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          msteams: { width: 'Full' },
          body: [
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  width: 'auto',
                  items: [
                    {
                      type: 'Image',
                      url: `${APP_BASE_URL}/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png`,
                      size: 'Small',
                      style: 'Person',
                    },
                  ],
                },
                {
                  type: 'Column',
                  width: 'stretch',
                  items: [
                    {
                      type: 'TextBlock',
                      text: 'CONCENTRIX TRAINING OPERATIONS',
                      size: 'Small',
                      color: 'Light',
                      isSubtle: true,
                      spacing: 'None',
                    },
                    {
                      type: 'TextBlock',
                      text: label,
                      size: 'Large',
                      weight: 'Bolder',
                      color: accent,
                      spacing: 'Small',
                    },
                  ],
                },
              ],
            },
            {
              type: 'FactSet',
              facts,
              spacing: 'Medium',
            },
            {
              type: 'ActionSet',
              spacing: 'Large',
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: 'Open in EEC',
                  url: caseUrl,
                  style: 'positive',
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

// ─── Build Adaptive Card for relocation ───────────────────
function buildRelocationAdaptiveCard(relocation, eventType) {
  const accent = EVENT_COLORS[eventType] || 'Default';
  const label = EVENT_LABELS[eventType] || 'Relocation Update';
  const relocUrl = `${APP_BASE_URL}/relocations/${relocation.id || relocation.requestId || ''}`;

  const facts = [
    { title: 'Request ID', value: relocation.requestId || '—' },
    { title: 'Employee', value: relocation.employeeName || '—' },
    { title: 'OID', value: relocation.oid || '—' },
    { title: 'Account', value: relocation.account || '—' },
    { title: 'LOB', value: relocation.lob || relocation.lobName || '—' },
    { title: 'Wave', value: relocation.wave || '—' },
    { title: 'Preferred Site', value: relocation.preferredSiteArea || '—' },
    { title: 'Status', value: relocation.status || '—' },
    { title: 'Supervisor', value: relocation.trainingSupervisor || '—' },
    { title: 'Manager', value: relocation.trainingManager || '—' },
  ];

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: undefined,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          msteams: { width: 'Full' },
          body: [
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  width: 'auto',
                  items: [
                    {
                      type: 'Image',
                      url: `${APP_BASE_URL}/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png`,
                      size: 'Small',
                      style: 'Person',
                    },
                  ],
                },
                {
                  type: 'Column',
                  width: 'stretch',
                  items: [
                    {
                      type: 'TextBlock',
                      text: 'CONCENTRIX TRAINING OPERATIONS',
                      size: 'Small',
                      color: 'Light',
                      isSubtle: true,
                      spacing: 'None',
                    },
                    {
                      type: 'TextBlock',
                      text: label,
                      size: 'Large',
                      weight: 'Bolder',
                      color: accent,
                      spacing: 'Small',
                    },
                  ],
                },
              ],
            },
            {
              type: 'FactSet',
              facts,
              spacing: 'Medium',
            },
            {
              type: 'ActionSet',
              spacing: 'Large',
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: 'Open in EEC',
                  url: relocUrl,
                  style: eventType === 'overdue' ? 'destructive' : 'positive',
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

// ─── Exported notification functions ─────────────────────

async function sendCaseTeamsNotification(caseData, eventType) {
  try {
    const card = buildCaseAdaptiveCard(caseData, eventType);
    return await sendWebhook(WEBHOOKS.attrition, card);
  } catch (err) {
    console.error('[teamsNotification] sendCaseTeamsNotification error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendRelocationTeamsNotification(relocation, eventType) {
  try {
    const card = buildRelocationAdaptiveCard(relocation, eventType);
    return await sendWebhook(WEBHOOKS.relocation, card);
  } catch (err) {
    console.error('[teamsNotification] sendRelocationTeamsNotification error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendCaseTeamsNotification,
  sendRelocationTeamsNotification,
  buildCaseAdaptiveCard,
  buildRelocationAdaptiveCard,
};
