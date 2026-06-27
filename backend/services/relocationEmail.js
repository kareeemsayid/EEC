const nodemailer = require('nodemailer');

// SMTP transport — same config as emailService.js
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false,
  },
});

const SMTP_FROM = process.env.SMTP_FROM || 'EEC Notifications <Training.AttritionCommandCenter@concentrix.com>';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://eec.azurestaticapps.net';

const TA_FALLBACK = 'EG_CAI_PALMS_ta_internal_transfers@concentrix.com';
const PS_FALLBACK = 'EG.PS.Redeployment@concentrix.com';

// ─── Routing lookup ───────────────────────────────────────
async function getRoutingForLOB(pool, lobName) {
  const routing = {
    supervisorEmails: [],
    managerEmails: [],
    taEmails: [],
    psEmails: [],
  };

  try {
    const req = pool.request();
    req.input('lobName', lobName);
    const result = await req.query(`
      SELECT supervisorEmails, managerEmails, taEmails, psEmails
      FROM RelocationRoutingRules WHERE lobName = @lobName
    `);

    if (result.recordset.length > 0) {
      const row = result.recordset[0];
      const parse = (val) => (val || '').split(';').map(e => e.trim()).filter(Boolean);
      routing.supervisorEmails = parse(row.supervisorEmails);
      routing.managerEmails = parse(row.managerEmails);
      routing.taEmails = parse(row.taEmails);
      routing.psEmails = parse(row.psEmails);
    }
  } catch (err) {
    console.error('[relocationEmail] Routing lookup failed:', err.message);
  }

  // Always add fallbacks
  routing.taEmails.push(TA_FALLBACK);
  routing.psEmails.push(PS_FALLBACK);

  // Deduplicate
  const dedupe = (arr) => [...new Set(arr)];
  routing.supervisorEmails = dedupe(routing.supervisorEmails);
  routing.managerEmails = dedupe(routing.managerEmails);
  routing.taEmails = dedupe(routing.taEmails);
  routing.psEmails = dedupe(routing.psEmails);

  return routing;
}

// ─── Status tracker steps ─────────────────────────────────
function buildStatusTracker(currentStatus) {
  const steps = [
    { key: 'Submitted', label: 'Pending PS' },
    { key: 'PSCleared', label: 'PS Cleared' },
    { key: 'TACleared', label: 'TA Cleared' },
    { key: 'Relocated', label: 'Relocated' },
  ];

  const currentIdx = steps.findIndex(s => s.key === currentStatus);

  return steps.map((step, i) => {
    if (i < currentIdx) return { ...step, color: '#3b82f6', bg: '#eff6ff' };       // completed = blue
    if (i === currentIdx) return { ...step, color: '#10b981', bg: '#ecfdf5' };      // current = green
    return { ...step, color: '#9ca3af', bg: '#f3f4f6' };                            // pending = gray
  });
}

// ─── HTML email template ──────────────────────────────────
function buildRelocationEmail(relocation, eventType, extra = {}) {
  const tracker = buildStatusTracker(relocation.status);
  const relocUrl = `${APP_BASE_URL}/relocations/${relocation.id || relocation.requestId || ''}`;

  // Overdue banner
  let overdueBanner = '';
  if (extra.overdueBy) {
    overdueBanner = `
      <tr>
        <td style="padding:0 32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 20px;text-align:center;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#dc2626;">&#9888;&#65039; This request is OVERDUE by ${extra.overdueBy} business days</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  // Reminder banner
  let reminderBanner = '';
  if (eventType === 'reminder') {
    reminderBanner = `
      <tr>
        <td style="padding:0 32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 20px;text-align:center;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#d97706;">&#9200; Reminder: This request is awaiting TA action</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  const infoRows = [
    { label: 'Employee Name', value: relocation.employeeName },
    { label: 'OID', value: relocation.oid },
    { label: 'Reachable Number', value: relocation.reachableNumber },
    { label: 'Language', value: relocation.language },
    { label: 'Preferred Site Area', value: relocation.preferredSiteArea },
    { label: 'Relocation Reason', value: relocation.relocationReason },
    { label: 'Release Date / Compliance', value: relocation.releaseDateCompliance },
    { label: 'Attendance & Adherence', value: relocation.attendanceAdherence },
    { label: 'Disciplinary Notes', value: relocation.disciplinaryNotes },
    { label: 'Wave', value: relocation.wave },
    { label: 'Training Supervisor', value: relocation.trainingSupervisor || relocation.supervisorEmail },
    { label: 'Training Manager', value: relocation.trainingManager || relocation.trainingManagerEmail },
  ];

  const trackerHtml = tracker.map(s => `
    <td style="padding:8px 12px;text-align:center;border-radius:8px;background:${s.bg};border:1px solid ${s.color}30;">
      <p style="margin:0;font-size:11px;font-weight:600;color:${s.color};">${s.label}</p>
    </td>
  `).join('<td style="width:8px;"></td>');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Calibri,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F 0%,#1e40af 100%);padding:28px 32px;">
              <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;font-weight:600;">Concentrix Training Operations</p>
              <p style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Relocation Request</p>
              <p style="margin:0;font-size:13px;color:#93c5fd;">Action Required — Please review and respond</p>
            </td>
          </tr>

          <!-- Greeting + body -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 12px;font-size:14px;color:#1f2937;">Hi Team,</p>
              <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
                We've got a relocation request that needs your attention!<br>
                Please take a moment to review the details below and help us get this agent moved smoothly.
              </p>
            </td>
          </tr>

          ${overdueBanner}
          ${reminderBanner}

          <!-- Account/LOB banner -->
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
                <tr>
                  <td style="padding:10px 16px;text-align:center;width:50%;border-right:1px solid #bfdbfe;">
                    <span style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Account</span><br>
                    <span style="font-size:14px;font-weight:600;color:#1e40af;">${relocation.account || '—'}</span>
                  </td>
                  <td style="padding:10px 16px;text-align:center;width:50%;">
                    <span style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Line of Business</span><br>
                    <span style="font-size:14px;font-weight:600;color:#1e40af;">${relocation.lob || relocation.lobName || '—'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Relocation info table -->
          <tr>
            <td style="padding:0 32px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                ${infoRows.map(row => `
                  <tr>
                    <td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;width:40%;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${row.label}</span></td>
                    <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${row.value || '—'}</td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- Status tracker -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>${trackerHtml}</tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <a href="${relocUrl}" style="display:inline-block;background:linear-gradient(135deg,#0ea89b,#2dd4bf);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;letter-spacing:0.5px;">View in EEC</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-align:center;">
                Auto-generated Relocation Request ID: ${relocation.requestId || '—'}
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                Concentrix Corporation &copy; 2026 | Training Attrition Command Center
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

// ─── Core send helper ─────────────────────────────────────
async function sendEmail({ to, cc, subject, html }) {
  const mailOptions = {
    from: SMTP_FROM,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[relocationEmail] Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[relocationEmail] Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Notification functions ───────────────────────────────

async function sendRelocationSubmitted(pool, relocation) {
  try {
    const routing = await getRoutingForLOB(pool, relocation.lobName || relocation.lob);
    const to = [...routing.psEmails, ...routing.taEmails];
    const cc = [
      relocation.trainingManagerEmail,
      relocation.supervisorEmail,
      ...routing.supervisorEmails,
      ...routing.managerEmails,
    ].filter(Boolean);

    const subject = `[EEC] New Relocation Request ${relocation.requestId || ''} | ${relocation.account || ''} - ${relocation.lob || relocation.lobName || ''} | ${relocation.wave || ''}`;
    const html = buildRelocationEmail(relocation, 'submitted');

    const result = await sendEmail({ to, cc, subject, html });

    try {
      const { sendRelocationTeamsNotification } = require('./teamsNotification');
      await sendRelocationTeamsNotification(relocation, 'submitted');
    } catch (err) {
      console.error('[relocationEmail] Teams notification failed:', err.message);
    }

    return result;
  } catch (err) {
    console.error('[relocationEmail] sendRelocationSubmitted error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendRelocationStatusChange(pool, relocation, newStatus) {
  try {
    const routing = await getRoutingForLOB(pool, relocation.lobName || relocation.lob);
    let to = [];
    let cc = [];

    const statusLabels = {
      PSCleared: 'PS Cleared',
      TACleared: 'TA Cleared',
      Relocated: 'Relocated',
      Cancelled: 'Cancelled',
    };
    const statusLabel = statusLabels[newStatus] || newStatus;

    if (newStatus === 'PSCleared') {
      to = [...routing.taEmails];
      cc = [...routing.psEmails, relocation.submittedByEmail, ...routing.supervisorEmails].filter(Boolean);
    } else if (newStatus === 'TACleared') {
      to = [relocation.submittedByEmail, ...routing.supervisorEmails].filter(Boolean);
      cc = [...routing.psEmails, ...routing.taEmails].filter(Boolean);
    } else if (newStatus === 'Relocated') {
      to = [relocation.submittedByEmail, relocation.trainingManagerEmail, ...routing.supervisorEmails, ...routing.managerEmails].filter(Boolean);
      cc = [...routing.psEmails, ...routing.taEmails].filter(Boolean);
    } else if (newStatus === 'Cancelled') {
      to = [...routing.psEmails, ...routing.taEmails];
      cc = [relocation.trainingManagerEmail, relocation.supervisorEmail].filter(Boolean);
    }

    const subject = `[EEC] ${statusLabel} | Relocation ${relocation.requestId || ''} | ${relocation.employeeName || ''} | ${relocation.account || ''}`;
    const html = buildRelocationEmail({ ...relocation, status: newStatus }, newStatus === 'Cancelled' ? 'cancelled' : newStatus.toLowerCase());

    const result = await sendEmail({ to, cc, subject, html });

    // Teams for all except Cancelled
    if (newStatus !== 'Cancelled') {
      try {
        const { sendRelocationTeamsNotification } = require('./teamsNotification');
        await sendRelocationTeamsNotification({ ...relocation, status: newStatus }, newStatus.toLowerCase().replace('cleared', '_cleared'));
      } catch (err) {
        console.error('[relocationEmail] Teams notification failed:', err.message);
      }
    }

    return result;
  } catch (err) {
    console.error('[relocationEmail] sendRelocationStatusChange error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendRelocationReminder(pool, relocation) {
  try {
    const routing = await getRoutingForLOB(pool, relocation.lobName || relocation.lob);
    const to = [...routing.taEmails];
    const cc = [...routing.psEmails];

    const subject = `[EEC] \u23F0 Reminder | Relocation ${relocation.requestId || ''} | ${relocation.employeeName || ''} awaiting TA action`;
    const html = buildRelocationEmail(relocation, 'reminder');

    const result = await sendEmail({ to, cc, subject, html });

    try {
      const { sendRelocationTeamsNotification } = require('./teamsNotification');
      await sendRelocationTeamsNotification(relocation, 'reminder');
    } catch (err) {
      console.error('[relocationEmail] Teams notification failed:', err.message);
    }

    return result;
  } catch (err) {
    console.error('[relocationEmail] sendRelocationReminder error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendRelocationOverdue(pool, relocation, overdueBy, overdueStage) {
  try {
    const routing = await getRoutingForLOB(pool, relocation.lobName || relocation.lob);
    const to = [...routing.psEmails, ...routing.taEmails];
    const cc = ['abdelrahmankadrimohamed.yassin@concentrix.com'];

    const subject = `[EEC] \uD83D\uDD34 OVERDUE | Relocation ${relocation.requestId || ''} | ${relocation.employeeName || ''} | ${overdueBy} days`;
    const html = buildRelocationEmail(relocation, 'overdue', { overdueBy });

    const result = await sendEmail({ to, cc, subject, html });

    try {
      const { sendRelocationTeamsNotification } = require('./teamsNotification');
      await sendRelocationTeamsNotification(relocation, 'overdue');
    } catch (err) {
      console.error('[relocationEmail] Teams notification failed:', err.message);
    }

    return result;
  } catch (err) {
    console.error('[relocationEmail] sendRelocationOverdue error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getRoutingForLOB,
  buildRelocationEmail,
  sendEmail,
  sendRelocationSubmitted,
  sendRelocationStatusChange,
  sendRelocationReminder,
  sendRelocationOverdue,
};
