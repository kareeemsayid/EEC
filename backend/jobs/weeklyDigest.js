const cron = require('node-cron');
const { transporter, logNotification } = require('../services/emailService');

const SMTP_FROM = process.env.SMTP_FROM || 'EEC Notifications <Training.AttritionCommandCenter@concentrix.com>';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://eec.azurestaticapps.net';

// Hardcoded digest recipients
const DIGEST_TO = [
  'mina.mahernaguib@concentrix.com',
  'ahmed.abdelraoufmohamedsaeedezz@concentrix.com',
  'EG.PS.Redeployment@concentrix.com',
  'marwa.nosseir@concentrix.com',
  'EG.PS.West@concentrix.com',
  'EG.PS.Central@concentrix.com',
  'EG.PS.East@concentrix.com',
];

const DIGEST_CC = [
  'mohamed.ibrahimfarahatabdelatty@concentrix.com',
  'EgyptTrainingManagers@concentrix.com',
  'EG_CAI_All_TrainingSup@concentrix.com',
  'baber.zaman@concentrix.com',
  'ibtehaladel.el-naka@concentrix.com',
  'sarah.elmissiry@concentrix.com',
  'ahmed.dawood@concentrix.com',
  'aliaa.ismail1@concentrix.com',
  'fadi.iskander@concentrix.com',
  'hatem.selim@concentrix.com',
  'ahmed.elnahas@concentrix.com',
  'amr.sobhybaioumy@concentrix.com',
  'waleed.ismail@concentrix.com',
  'EG_CAI_SMART_caironewimplementations@concentrix.com',
];

// ─── Get ISO week number ──────────────────────────────────
function getWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// ─── Query all digest counts ──────────────────────────────
async function getDigestCounts(pool) {
  const counts = {
    totalOpenCases: 0,
    criticalCases: 0,
    casesOverdue: 0,
    investigationsPending: 0,
    totalOpenRelocations: 0,
    pendingPSClearance: 0,
    pendingTAClearance: 0,
    relocationsOverdue: 0,
  };

  const queries = {
    totalOpenCases: `SELECT COUNT(*) as cnt FROM AttritionCases WHERE caseStatus = 'Active'`,
    criticalCases: `SELECT COUNT(*) as cnt FROM AttritionCases WHERE caseStatus = 'Active' AND (riskStatus = 'Critical' OR severity = 'Critical')`,
    casesOverdue: `SELECT COUNT(*) as cnt FROM AttritionCases WHERE caseStatus = 'Active' AND overdueFlag = 1`,
    investigationsPending: `SELECT COUNT(*) as cnt FROM AttritionCases WHERE investigationRequested = 1 AND terminationApproved = 0`,
    totalOpenRelocations: `SELECT COUNT(*) as cnt FROM RelocationRequests WHERE status NOT IN ('Relocated', 'Cancelled')`,
    pendingPSClearance: `SELECT COUNT(*) as cnt FROM RelocationRequests WHERE status = 'Submitted'`,
    pendingTAClearance: `SELECT COUNT(*) as cnt FROM RelocationRequests WHERE status = 'PSCleared'`,
    relocationsOverdue: `SELECT COUNT(*) as cnt FROM RelocationRequests WHERE status NOT IN ('Relocated', 'Cancelled') AND overdueFlag = 1`,
  };

  for (const [key, query] of Object.entries(queries)) {
    try {
      const result = await pool.request().query(query);
      counts[key] = result.recordset[0]?.cnt || 0;
    } catch (err) {
      console.error(`[weeklyDigest] Query failed for ${key}:`, err.message);
    }
  }

  return counts;
}

// ─── Get overdue items for attention section ──────────────
async function getOverdueItems(pool) {
  const items = [];

  try {
    const result = await pool.request().query(`
      SELECT TOP 10
        caseNumber, traineeName, account, lob, site,
        riskStatus, caseStatus, submittedDate, overdueFlag
      FROM AttritionCases
      WHERE caseStatus = 'Active' AND overdueFlag = 1
      ORDER BY submittedDate ASC
    `);
    items.push(...result.recordset.map(r => ({ ...r, type: 'Attrition' })));
  } catch (err) {
    console.error('[weeklyDigest] Overdue attrition query failed:', err.message);
  }

  try {
    const result = await pool.request().query(`
      SELECT TOP 10
        requestId, employeeName, account, lob, status, submittedDate
      FROM RelocationRequests
      WHERE status NOT IN ('Relocated', 'Cancelled') AND overdueFlag = 1
      ORDER BY submittedDate ASC
    `);
    items.push(...result.recordset.map(r => ({ ...r, type: 'Relocation' })));
  } catch (err) {
    console.error('[weeklyDigest] Overdue relocation query failed:', err.message);
  }

  return items.slice(0, 10);
}

// ─── Build digest HTML ────────────────────────────────────
function buildDigestHTML(counts, overdueItems, weekNum) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date());

  const countRow = (label, value, isRed = false) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:16px;font-weight:700;color:${isRed ? '#dc2626' : '#0ea89b'};">${value}</td>
    </tr>
  `;

  const overdueRows = overdueItems.length > 0
    ? overdueItems.map(item => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;margin-right:8px;background:${item.type === 'Attrition' ? '#fef2f2' : '#fffbeb'};color:${item.type === 'Attrition' ? '#dc2626' : '#d97706'};">${item.type}</span>
          ${item.traineeName || item.employeeName || '—'}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${item.account || '—'} | ${item.lob || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;font-family:monospace;">${item.caseNumber || item.requestId || '—'}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">No overdue items. Great work!</td></tr>`;

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Calibri,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr><td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F 0%,#1e40af 100%);padding:28px 32px;">
              <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;font-weight:600;">Concentrix Training Operations</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">EEC Weekly Summary</p>
              <p style="margin:4px 0 0;font-size:13px;color:#93c5fd;">Week ${weekNum} | ${today}</p>
            </td>
          </tr>

          <!-- Section 1: Attrition Summary -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1f2937;border-left:4px solid #0ea89b;padding-left:10px;">Attrition Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                ${countRow('Total Open Cases', counts.totalOpenCases)}
                ${countRow('Critical Cases', counts.criticalCases, counts.criticalCases > 0)}
                ${countRow('Cases Overdue (past SLA)', counts.casesOverdue, counts.casesOverdue > 0)}
                ${countRow('Investigation Requests Pending', counts.investigationsPending)}
              </table>
            </td>
          </tr>

          <!-- Section 2: Relocation Summary -->
          <tr>
            <td style="padding:16px 32px 8px;">
              <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1f2937;border-left:4px solid #1e40af;padding-left:10px;">Relocation Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                ${countRow('Total Open Relocations', counts.totalOpenRelocations)}
                ${countRow('Pending PS Clearance (SLA: 2 days)', counts.pendingPSClearance)}
                ${countRow('Pending TA Clearance (SLA: 12 days)', counts.pendingTAClearance)}
                ${countRow('Relocations Overdue', counts.relocationsOverdue, counts.relocationsOverdue > 0)}
              </table>
            </td>
          </tr>

          <!-- Section 3: Items needing immediate attention -->
          <tr>
            <td style="padding:16px 32px 8px;">
              <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1f2937;border-left:4px solid #dc2626;padding-left:10px;">Items Needing Immediate Attention</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr style="background:#f9fafb;">
                  <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Name</td>
                  <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Account / LOB</td>
                  <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Reference</td>
                </tr>
                ${overdueRows}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:24px 32px 32px;">
              <a href="${APP_BASE_URL}" style="display:inline-block;background:linear-gradient(135deg,#0ea89b,#2dd4bf);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;letter-spacing:0.5px;">Open EEC Dashboard</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
                Concentrix Corporation &copy; 2026 | Training Attrition Command Center | Auto-generated weekly digest
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

// ─── Run the weekly digest ────────────────────────────────
async function runWeeklyDigest(pool) {
  try {
    console.log('[weeklyDigest] Starting weekly digest...');

    const counts = await getDigestCounts(pool);
    const overdueItems = await getOverdueItems(pool);
    const weekNum = getWeekNumber();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date());

    const subject = `[EEC] Weekly Summary — Week ${weekNum} | ${today}`;
    const html = buildDigestHTML(counts, overdueItems, weekNum);

    const mailOptions = {
      from: SMTP_FROM,
      to: DIGEST_TO.join(', '),
      cc: DIGEST_CC.join(', '),
      subject,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('[weeklyDigest] Digest sent:', info.messageId);
      await logNotification(pool, {
        recipient: DIGEST_TO.join(','),
        subject,
        eventType: 'weekly_digest',
        status: 'sent',
        channel: 'email',
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[weeklyDigest] Email send failed:', err.message);
      await logNotification(pool, {
        recipient: DIGEST_TO.join(','),
        subject,
        eventType: 'weekly_digest',
        status: 'failed',
        channel: 'email',
      });
      return { success: false, error: err.message };
    }
  } catch (err) {
    console.error('[weeklyDigest] Error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Schedule the cron job ────────────────────────────────
function scheduleWeeklyDigest(pool) {
  // Every Monday at 08:00 Africa/Cairo
  cron.schedule('0 8 * * 1', async () => {
    console.log('[weeklyDigest] Cron triggered — running weekly digest');
    await runWeeklyDigest(pool);
  }, {
    timezone: 'Africa/Cairo',
  });

  console.log('[weeklyDigest] Scheduled: every Monday at 08:00 Africa/Cairo');
}

module.exports = {
  runWeeklyDigest,
  scheduleWeeklyDigest,
  getDigestCounts,
  getOverdueItems,
  buildDigestHTML,
};
