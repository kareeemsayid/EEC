const nodemailer = require('nodemailer');

// SMTP transport — Office 365 requires SSLv3 cipher + rejectUnauthorized: false
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

// ─── PS Distribution List lookup ───────────────────────────
async function getPSDLForSite(pool, siteName) {
  try {
    const req = pool.request();
    req.input('siteName', siteName);
    const result = await req.query(`
      SELECT dlEmail FROM PSDistributionLists WHERE siteName = @siteName
    `);
    if (result.recordset.length > 0 && result.recordset[0].dlEmail) {
      return result.recordset[0].dlEmail;
    }
  } catch (err) {
    console.error('[emailService] PSDistributionLists lookup failed:', err.message);
  }
  return 'EG.PS.Central@concentrix.com';
}

// ─── Notification log ──────────────────────────────────────
async function logNotification(pool, logEntry) {
  try {
    const req = pool.request();
    req.input('moduleType', logEntry.channel || 'email');
    req.input('entityId', logEntry.recordId || null);
    req.input('type', logEntry.eventType || '');
    req.input('recipient', logEntry.recipient || '');
    req.input('subject', logEntry.subject || '');
    req.input('success', logEntry.status === 'sent' ? 1 : 0);
    await req.query(`
      INSERT INTO NotificationLogs (moduleType, entityId, type, recipient, sentDate, subject, success)
      VALUES (@moduleType, @entityId, @type, @recipient, GETDATE(), @subject, @success)
    `);
  } catch (err) {
    console.error('[emailService] Failed to log notification:', err.message);
  }
}

// ─── HTML email template ──────────────────────────────────
function buildAttritionEmail(caseData, eventType, bodyText) {
  const riskColors = {
    Critical: '#ef4444',
    Monitoring: '#f59e0b',
    Low: '#10b981',
  };
  const riskColor = riskColors[caseData.riskStatus] || '#6b7280';
  const eventColors = {
    submitted: '#0ea89b',
    comment: '#6366f1',
    investigation: '#f59e0b',
    termination_approved: '#ef4444',
    terminated: '#7f1d1d',
    overdue: '#dc2626',
  };
  const eventColor = eventColors[eventType] || '#0ea89b';

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
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;font-weight:600;">Concentrix Training Operations</p>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Attrition Case Management</p>
                  </td>
                  <td style="vertical-align:top;text-align:right;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:600;color:#ffffff;font-family:monospace;">${caseData.caseNumber || '—'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Case summary table -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;width:35%;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Trainee Name</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#1f2937;">${caseData.traineeName || '—'}</td>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Oracle ID</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#1f2937;font-family:monospace;">${caseData.oracleId || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Account</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${caseData.account || '—'}</td>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">LOB</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${caseData.lob || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Site</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${caseData.site || '—'}</td>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Wave</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${caseData.wave || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Severity</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${caseData.severity || '—'}</td>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Risk Status</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:${riskColor};">${caseData.riskStatus || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Total Missed Hours</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${caseData.missedHours || '0'}</td>
                  <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Case Status</span></td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${caseData.caseStatus || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Trainer</span></td>
                  <td style="padding:10px 16px;font-size:14px;color:#1f2937;">${caseData.trainerName || caseData.trainerEmail || '—'}</td>
                  <td style="padding:10px 16px;background:#f9fafb;border-right:1px solid #e5e7eb;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Training Manager</span></td>
                  <td style="padding:10px 16px;font-size:14px;color:#1f2937;">${caseData.trainingManagerName || caseData.trainingManagerEmail || '—'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Event message block -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${eventColor}15;border-left:4px solid ${eventColor};border-radius:0 8px 8px 0;padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">${bodyText}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <a href="${APP_BASE_URL}/cases/${caseData.id || caseData.caseNumber || ''}" style="display:inline-block;background:linear-gradient(135deg,#0ea89b,#2dd4bf);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;letter-spacing:0.5px;">View Case in EEC</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
                Concentrix Corporation &copy; 2026 | Do not reply to this email. Use EEC to manage this case. | Support: Training.AttritionCommandCenter@concentrix.com
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

// ─── Email subject format ─────────────────────────────────
function buildSubject(caseData) {
  return `[EEC] ${caseData.account || ''} | ${caseData.lob || ''} | #${caseData.caseNumber || ''} — ${caseData.traineeName || ''} | ${caseData.site || ''}`;
}

// ─── Core send helper ─────────────────────────────────────
async function sendEmail({ to, cc, subject, html, attachments }) {
  const mailOptions = {
    from: SMTP_FROM,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
    subject,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[emailService] Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[emailService] Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Notification functions ───────────────────────────────

async function notifyCaseCreated(pool, caseData) {
  try {
    const psDL = await getPSDLForSite(pool, caseData.site);
    const to = [caseData.trainerEmail, caseData.trainingManagerEmail, psDL].filter(Boolean);

    // Get supervisor emails from RelocationRoutingRules
    let cc = [];
    try {
      const req = pool.request();
      req.input('lobName', caseData.lob);
      const result = await req.query(`
        SELECT supervisorEmails FROM RelocationRoutingRules WHERE lobName = @lobName
      `);
      if (result.recordset.length > 0 && result.recordset[0].supervisorEmails) {
        cc = result.recordset[0].supervisorEmails.split(';').map(e => e.trim()).filter(Boolean);
      }
    } catch (err) {
      console.error('[emailService] Supervisor lookup failed:', err.message);
    }

    const subject = buildSubject(caseData);
    const html = buildAttritionEmail(caseData, 'submitted', `A new attrition case has been submitted for <strong>${caseData.traineeName}</strong>. Please review and take appropriate action.`);

    const result = await sendEmail({ to, cc, subject, html });

    // Send Teams notification
    try {
      const { sendCaseTeamsNotification } = require('./teamsNotification');
      await sendCaseTeamsNotification(caseData, 'submitted');
    } catch (err) {
      console.error('[emailService] Teams notification failed:', err.message);
    }

    await logNotification(pool, { recipient: to.join(','), subject, eventType: 'case_created', recordId: caseData.caseNumber, status: result.success ? 'sent' : 'failed', channel: 'email' });
    return result;
  } catch (err) {
    console.error('[emailService] notifyCaseCreated error:', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyCaseComment(pool, caseData, comment, commenterName) {
  try {
    const psDL = await getPSDLForSite(pool, caseData.site);
    const to = [caseData.trainerEmail, caseData.trainingManagerEmail, psDL].filter(Boolean);

    const subject = buildSubject(caseData);
    const html = buildAttritionEmail(caseData, 'comment', `<strong>${commenterName}</strong> added a comment:<br><br><em style="color:#4b5563;">"${comment}"</em>`);

    const result = await sendEmail({ to, cc: [], subject, html });

    await logNotification(pool, { recipient: to.join(','), subject, eventType: 'case_comment', recordId: caseData.caseNumber, status: result.success ? 'sent' : 'failed', channel: 'email' });
    return result;
  } catch (err) {
    console.error('[emailService] notifyCaseComment error:', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyInvestigationRequested(pool, caseData) {
  try {
    const psDL = await getPSDLForSite(pool, caseData.site);
    const to = [psDL];
    const cc = [caseData.trainingManagerEmail].filter(Boolean);

    // Get supervisor emails
    try {
      const req = pool.request();
      req.input('lobName', caseData.lob);
      const result = await req.query(`
        SELECT supervisorEmails FROM RelocationRoutingRules WHERE lobName = @lobName
      `);
      if (result.recordset.length > 0 && result.recordset[0].supervisorEmails) {
        cc.push(...result.recordset[0].supervisorEmails.split(';').map(e => e.trim()).filter(Boolean));
      }
    } catch (err) {
      console.error('[emailService] Supervisor lookup failed:', err.message);
    }

    const subject = buildSubject(caseData);
    const html = buildAttritionEmail(caseData, 'investigation', `An HR investigation has been requested for <strong>${caseData.traineeName}</strong>. Please review and initiate the investigation process.`);

    const result = await sendEmail({ to, cc, subject, html });

    try {
      const { sendCaseTeamsNotification } = require('./teamsNotification');
      await sendCaseTeamsNotification(caseData, 'investigation');
    } catch (err) {
      console.error('[emailService] Teams notification failed:', err.message);
    }

    await logNotification(pool, { recipient: to.join(','), subject, eventType: 'investigation_requested', recordId: caseData.caseNumber, status: result.success ? 'sent' : 'failed', channel: 'email' });
    return result;
  } catch (err) {
    console.error('[emailService] notifyInvestigationRequested error:', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyTerminationApproved(pool, caseData) {
  try {
    const to = [caseData.trainerEmail].filter(Boolean);
    const cc = [caseData.trainingManagerEmail].filter(Boolean);

    const subject = buildSubject(caseData);
    const html = buildAttritionEmail(caseData, 'termination_approved', `The termination for <strong>${caseData.traineeName}</strong> has been approved. Please proceed with the termination workflow.`);

    const result = await sendEmail({ to, cc, subject, html });

    try {
      const { sendCaseTeamsNotification } = require('./teamsNotification');
      await sendCaseTeamsNotification(caseData, 'termination_approved');
    } catch (err) {
      console.error('[emailService] Teams notification failed:', err.message);
    }

    await logNotification(pool, { recipient: to.join(','), subject, eventType: 'termination_approved', recordId: caseData.caseNumber, status: result.success ? 'sent' : 'failed', channel: 'email' });
    return result;
  } catch (err) {
    console.error('[emailService] notifyTerminationApproved error:', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyTerminationSheetSent(pool, caseData, pdfBuffer) {
  try {
    const to = [caseData.trainerEmail].filter(Boolean);
    const cc = [caseData.trainingManagerEmail].filter(Boolean);

    const subject = buildSubject(caseData);
    const html = buildAttritionEmail(caseData, 'terminated', `The termination sheet for <strong>${caseData.traineeName}</strong> has been generated and is attached to this email.`);

    const attachments = [{
      filename: `Termination-${caseData.caseNumber || 'case'}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }];

    const result = await sendEmail({ to, cc, subject, html, attachments });

    await logNotification(pool, { recipient: to.join(','), subject, eventType: 'termination_sheet_sent', recordId: caseData.caseNumber, status: result.success ? 'sent' : 'failed', channel: 'email' });
    return result;
  } catch (err) {
    console.error('[emailService] notifyTerminationSheetSent error:', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyCaseOverdue(pool, caseData, overdueBy) {
  try {
    const psDL = await getPSDLForSite(pool, caseData.site);
    const to = [psDL, 'mina.mahernaguib@concentrix.com'];
    const cc = ['abdelrahmankadrimohamed.yassin@concentrix.com'];

    const subject = `[EEC] OVERDUE | #${caseData.caseNumber} — ${caseData.traineeName} | ${overdueBy} business days past SLA`;
    const html = buildAttritionEmail(caseData, 'overdue', `This case is <strong style="color:#dc2626;">OVERDUE by ${overdueBy} business days</strong>. Immediate action is required to resolve this case.`);

    const result = await sendEmail({ to, cc, subject, html });

    try {
      const { sendCaseTeamsNotification } = require('./teamsNotification');
      await sendCaseTeamsNotification(caseData, 'overdue');
    } catch (err) {
      console.error('[emailService] Teams notification failed:', err.message);
    }

    await logNotification(pool, { recipient: to.join(','), subject, eventType: 'case_overdue', recordId: caseData.caseNumber, status: result.success ? 'sent' : 'failed', channel: 'email' });
    return result;
  } catch (err) {
    console.error('[emailService] notifyCaseOverdue error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  transporter,
  getPSDLForSite,
  buildAttritionEmail,
  buildSubject,
  sendEmail,
  logNotification,
  notifyCaseCreated,
  notifyCaseComment,
  notifyInvestigationRequested,
  notifyTerminationApproved,
  notifyTerminationSheetSent,
  notifyCaseOverdue,
};
