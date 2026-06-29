// backend/app.js
// EEC Backend API - Node.js + Express + Azure SQL Database
//
// This module exports the configured Express `app` only. The HTTP listener
// (app.listen) was removed so the app can be hosted inside an Azure Function
// via `azure-function-express` (see /api/index.js). For local development,
// run `npm run dev` which calls `local.js` to start the listener.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const { getPool } = require('./db/index');
const authMiddleware = require('./utils/authMiddleware');
const userRoutes = require('./routes/user');
const relocationsRoutes = require('./routes/relocations');
const casesRoutes = require('./routes/cases');
const investigationsRoutes = require('./routes/investigations');
const activityRoutes = require('./routes/activity');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — allow Azure Static Web Apps, Azure Functions, Replit, and localhost
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('.azurestaticapps.net') ||
      origin.includes('.azurewebsites.net') ||
      origin.includes('.replit.dev') ||
      origin.includes('.replit.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check (no auth required) - includes DB connectivity status
app.get('/api/health', async (req, res) => {
  const { checkDbConnection } = require('./db/index');
  const db = await checkDbConnection();
  res.json({
    status: db.connected ? 'ok' : 'degraded',
    db: db.connected ? 'connected' : 'unavailable',
    dbError: db.error || null,
    timestamp: new Date().toISOString(),
  });
});

// Mount authMiddleware on all /api routes (except health check above)
app.use('/api', authMiddleware);

// Mount user routes (both singular and plural paths for compatibility)
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);

// Mount relocations routes (counts must be before :id in the router definition)
app.use('/api/relocations', relocationsRoutes);

// Mount cases routes (counts must be before :id in the router definition)
app.use('/api/cases', casesRoutes);

// Mount investigations routes
app.use('/api/investigations', investigationsRoutes);

// Mount activity routes
app.use('/api/activity', activityRoutes);

// Mount analytics routes
app.use('/api/analytics', analyticsRoutes);

// Mount settings routes
app.use('/api/settings', settingsRoutes);

// Notifications endpoints
app.get('/api/notifications', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());

    const result = await request.query(`
      SELECT TOP 20
        n.id, n.message, n.linkUrl, n.createdAt,
        CASE WHEN n.readAt IS NULL THEN 0 ELSE 1 END as read
      FROM UserNotifications n
      WHERE LOWER(n.userEmail) = @email
      ORDER BY n.createdAt DESC
    `);

    const notifications = result.recordset.map(n => ({
      id: String(n.id),
      type: 'system',
      title: '',
      message: n.message || '',
      link: n.linkUrl || '',
      time: n.createdAt,
      read: !!n.read,
    }));

    res.json(notifications);
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error);
    res.json([]);
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());

    const result = await request.query(`
      SELECT COUNT(*) as count
      FROM UserNotifications
      WHERE LOWER(userEmail) = @email AND readAt IS NULL
    `);

    res.json({ count: result.recordset[0]?.count || 0 });
  } catch (error) {
    console.error('[GET /api/notifications/unread-count] Error:', error);
    res.json({ count: 0 });
  }
});

app.post('/api/notifications/read/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const request = pool.request();
    request.input('id', sql.Int, parseInt(id, 10) || 0);

    await request.query(`UPDATE UserNotifications SET readAt = GETDATE() WHERE id = @id`);
    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/notifications/read/:id] Error:', error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());

    await request.query(`UPDATE UserNotifications SET readAt = GETDATE() WHERE LOWER(userEmail) = @email`);
    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/notifications/read-all] Error:', error);
    res.status(500).json({ success: false });
  }
});

// Termination send endpoint
app.post('/api/termination/send', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const { caseId, caseNumber } = req.body;

    if (!['PS', 'SrManager', 'Manager', 'Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const request = pool.request();
    request.input('caseId', sql.NVarChar(100), caseId || caseNumber);
    const caseResult = await request.query(`
      SELECT * FROM AttritionCases WHERE id = @caseId OR caseNumber = @caseId
    `);

    if (caseResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const caseData = caseResult.recordset[0];
    const now = new Date().toISOString();

    const updateReq = pool.request();
    updateReq.input('caseId', sql.Int, caseData.id);
    updateReq.input('sentDate', now);
    updateReq.input('lastUpdatedDate', now);
    await updateReq.query(`
      UPDATE AttritionCases
      SET terminationSheetSent = 1, terminationSheetSentDate = @sentDate, lastUpdatedDate = @lastUpdatedDate
      WHERE id = @caseId
    `);

    try {
      const insertReq = pool.request();
      insertReq.input('caseId', sql.Int, caseData.id);
      insertReq.input('updateType', 'TerminationSheetSent');
      insertReq.input('updatedBy', user.displayName || user.email);
      insertReq.input('updatedByEmail', user.email);
      insertReq.input('updateDate', now);
      insertReq.input('updateNotes', 'Termination sheet sent via Termination Center');
      await insertReq.query(`
        INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
        VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    res.json({ success: true, message: 'Termination sheet sent' });
  } catch (error) {
    console.error('[POST /api/termination/send] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send termination sheet' });
  }
});

// Termination sheet submission endpoint — stores the sheet, routes emails to stakeholders, and notifies PS
app.post('/api/termination/sheet', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const sheet = req.body;

    if (!sheet || !sheet.account || !sheet.lob || !sheet.employeeName || !sheet.oracleId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: account, lob, employeeName, oracleId' });
    }

    const now = new Date().toISOString();
    const sheetId = `TS-${Date.now()}`;

    // 1. Insert the termination sheet record
    try {
      const insertReq = pool.request();
      insertReq.input('sheetId', sql.NVarChar(50), sheetId);
      insertReq.input('account', sql.NVarChar(200), sheet.account);
      insertReq.input('lob', sql.NVarChar(200), sheet.lob);
      insertReq.input('employeeName', sql.NVarChar(300), sheet.employeeName);
      insertReq.input('oracleId', sql.NVarChar(50), sheet.oracleId);
      insertReq.input('status', sql.NVarChar(100), sheet.status || '');
      insertReq.input('lastDayWorking', sql.NVarChar(50), sheet.lastDayWorking || '');
      insertReq.input('terminationReason', sql.NVarChar(sql.MAX), sheet.terminationReason || '');
      insertReq.input('comment', sql.NVarChar(sql.MAX), sheet.comment || '');
      insertReq.input('resignationSubmitted', sql.NVarChar(10), sheet.resignationSubmitted || 'N/A');
      insertReq.input('headsetReturned', sql.NVarChar(10), sheet.headsetReturned || 'N/A');
      insertReq.input('medicalCardReturned', sql.NVarChar(10), sheet.medicalCardReturned || 'N/A');
      insertReq.input('accessCardReturned', sql.NVarChar(10), sheet.accessCardReturned || 'N/A');
      insertReq.input('tokenReturned', sql.NVarChar(10), sheet.tokenReturned || 'N/A');
      insertReq.input('userDeactivated', sql.NVarChar(10), sheet.userDeactivated || 'N/A');
      insertReq.input('signedResign', sql.NVarChar(10), sheet.signedResign || 'N/A');
      insertReq.input('freezeDocuments', sql.NVarChar(10), sheet.freezeDocuments || 'N/A');
      insertReq.input('freezeSalary', sql.NVarChar(10), sheet.freezeSalary || 'N/A');
      insertReq.input('submittedBy', sql.NVarChar(255), user.email);
      insertReq.input('submittedByName', sql.NVarChar(255), user.displayName || user.email);
      insertReq.input('submittedDate', now);

      await insertReq.query(`
        INSERT INTO TerminationSheets (
          sheetId, account, lob, employeeName, oracleId, status,
          lastDayWorking, terminationReason, comment,
          resignationSubmitted, headsetReturned, medicalCardReturned,
          accessCardReturned, tokenReturned, userDeactivated,
          signedResign, freezeDocuments, freezeSalary,
          submittedBy, submittedByName, submittedDate
        ) VALUES (
          @sheetId, @account, @lob, @employeeName, @oracleId, @status,
          @lastDayWorking, @terminationReason, @comment,
          @resignationSubmitted, @headsetReturned, @medicalCardReturned,
          @accessCardReturned, @tokenReturned, @userDeactivated,
          @signedResign, @freezeDocuments, @freezeSalary,
          @submittedBy, @submittedByName, @submittedDate
        )
      `);
    } catch (insertErr) {
      console.error('[POST /api/termination/sheet] Insert failed (table may not exist yet):', insertErr.message);
      // Continue even if table doesn't exist — we still send emails
    }

    // 2. Route based on account/LOB using RelocationRoutingRules (same pattern as relocation)
    let routing = { supervisorEmails: [], managerEmails: [], taEmails: [], psEmails: [] };
    try {
      const { getRoutingForLOB } = require('./services/relocationEmail');
      routing = await getRoutingForLOB(pool, sheet.lob);
    } catch (e) {
      console.error('[POST /api/termination/sheet] Routing lookup failed:', e.message);
    }

    // 3. Send email notification to stakeholders
    try {
      const { sendEmail } = require('./services/emailService');
      const to = [...routing.psEmails];
      const cc = [...routing.taEmails, ...routing.supervisorEmails, ...routing.managerEmails, user.email].filter(Boolean);

      const subject = `[EEC] Termination Sheet | ${sheet.account} | ${sheet.lob} | ${sheet.employeeName} | ${sheet.oracleId}`;

      const ynRows = [
        ['Employee submitted resignation on system', sheet.resignationSubmitted],
        ['Headset Returned', sheet.headsetReturned],
        ['Medical Card Returned', sheet.medicalCardReturned],
        ['Access Card Returned', sheet.accessCardReturned],
        ['Token Returned', sheet.tokenReturned],
        ['User Deactivated', sheet.userDeactivated],
        ['Signed Resign.', sheet.signedResign],
        ['Freeze Documents', sheet.freezeDocuments],
        ['Freeze Salary', sheet.freezeSalary],
      ];

      const ynHtml = ynRows.map(([label, val]) => {
        const color = val === 'Yes' ? '#10B981' : val === 'No' ? '#EF4444' : '#6B7280';
        return `<tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${label}</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;color:${color};">${val || 'N/A'}</td></tr>`;
      }).join('');

      const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Calibri,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);padding:28px 32px;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fecaca;font-weight:600;">Concentrix Training Operations</p>
                  <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Termination Sheet Submitted</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#fecaca;">Sheet ID: ${sheetId}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;">
                  <p style="margin:0 0 16px;font-size:14px;color:#1f2937;">A termination sheet has been submitted by <strong>${user.displayName || user.email}</strong> and requires your review.</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;width:40%;font-size:11px;color:#6b7280;text-transform:uppercase;">Account</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#1f2937;">${sheet.account}</td></tr>
                    <tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;">LOB</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#1f2937;">${sheet.lob}</td></tr>
                    <tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;">Employee Name</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#1f2937;">${sheet.employeeName}</td></tr>
                    <tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;">Oracle ID</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-family:monospace;color:#1f2937;">${sheet.oracleId}</td></tr>
                    <tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;">Status</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${sheet.status || '—'}</td></tr>
                    <tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;">Last Day Working</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${sheet.lastDayWorking || '—'}</td></tr>
                    <tr><td style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:uppercase;">Termination Reason</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${sheet.terminationReason || '—'}</td></tr>
                    ${sheet.comment ? `<tr><td style="padding:8px 16px;background:#f9fafb;font-size:11px;color:#6b7280;text-transform:uppercase;">Comment</td><td style="padding:8px 16px;font-size:13px;color:#1f2937;">${sheet.comment}</td></tr>` : ''}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 24px;">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Equipment & System Status</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    ${ynHtml}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                    Concentrix Corporation &copy; 2026 | Training Attrition Command Center | Sheet ID: ${sheetId}
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>`;

      await sendEmail({ to, cc, subject, html });
    } catch (emailErr) {
      console.error('[POST /api/termination/sheet] Email send failed:', emailErr.message);
    }

    // 4. Create in-app notifications for PS team members
    try {
      const psEmails = routing.psEmails;
      for (const psEmail of psEmails) {
        try {
          const notifReq = pool.request();
          notifReq.input('userEmail', sql.NVarChar(255), psEmail.toLowerCase());
          notifReq.input('message', sql.NVarChar(sql.MAX), `Termination Sheet: ${sheet.employeeName} (${sheet.oracleId}) — ${sheet.account} / ${sheet.lob}`);
          notifReq.input('linkUrl', sql.NVarChar(500), '/ps-dashboard');
          notifReq.input('createdAt', now);
          await notifReq.query(`
            INSERT INTO UserNotifications (userEmail, message, linkUrl, createdAt)
            VALUES (@userEmail, @message, @linkUrl, @createdAt)
          `);
        } catch (nErr) {
          console.error('[POST /api/termination/sheet] Notification insert failed for', psEmail, ':', nErr.message);
        }
      }
    } catch (notifErr) {
      console.error('[POST /api/termination/sheet] Notification block failed:', notifErr.message);
    }

    res.json({ success: true, sheetId, message: 'Termination sheet submitted and stakeholders notified' });
  } catch (error) {
    console.error('[POST /api/termination/sheet] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit termination sheet' });
  }
});

// 1. GET /api/accounts - Fetch all accounts (FIXED)
app.get('/api/accounts', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id AS id, AccountName AS title, WarningHours AS warningHours, CriticalHours AS criticalHours, DocumentGraceHours AS documentGraceHours
      FROM Accounts
      ORDER BY AccountName
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/accounts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// 2. GET /api/lobs - Fetch LOBs filtered by account (FIXED)
app.get('/api/lobs', async (req, res) => {
  try {
    const { accountId } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = 'SELECT Id AS id, LOBName AS title, AccountId AS accountId FROM LOBs';
    if (accountId) {
      query += ' WHERE AccountId = @accountId';
      request.input('accountId', sql.NVarChar(50), accountId);
    }
    query += ' ORDER BY LOBName';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/lobs] Error:', error);
    res.status(500).json({ error: 'Failed to fetch LOBs' });
  }
});

// 3. GET /api/sites - Fetch all sites
app.get('/api/sites', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id AS id, SiteName AS title, City AS region
      FROM Sites
      WHERE active = 1 OR active IS NULL
      ORDER BY City, SiteName
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/sites] Error:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// 4. GET /api/roles - Get user role by email
app.get('/api/roles', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('email', sql.NVarChar(255), email.toLowerCase());

    const result = await request.query(`
      SELECT role FROM Users
      WHERE LOWER(email) = @email AND (active = 1 OR active IS NULL)
    `);

    if (result.recordset.length > 0) {
      return res.json({ role: result.recordset[0].role || 'Trainer' });
    }

    res.json({ role: 'Trainer' });
  } catch (error) {
    console.error('[GET /api/roles] Error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// 5. GET /api/supervisorAccounts - Get account mappings for supervisor
app.get('/api/supervisorAccounts', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('email', sql.NVarChar(255), email.toLowerCase());

    // Try SupervisorLOBs for supervisors
    try {
      const lobResult = await request.query(`
        SELECT supervisorEmail, lobName AS accountId, accountName
        FROM SupervisorLOBs
        WHERE LOWER(supervisorEmail) = @email
      `);
      if (lobResult.recordset.length > 0) {
        return res.json(lobResult.recordset);
      }
    } catch (e) { /* table may not exist for this role */ }

    // Try ManagerAccounts for managers
    try {
      const mgrRequest = pool.request();
      mgrRequest.input('email', sql.NVarChar(255), email.toLowerCase());
      const mgrResult = await mgrRequest.query(`
        SELECT accountName AS accountId, accountName
        FROM ManagerAccounts
        WHERE LOWER(managerEmail) = @email
      `);
      return res.json(mgrResult.recordset);
    } catch (e) { /* table may not exist for this role */ }

    res.json([]);
  } catch (error) {
    console.error('[GET /api/supervisorAccounts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor accounts' });
  }
});

// Case routes are now handled by the cases router (mounted above)

// Get updates for a case (legacy endpoint — kept for backward compatibility)
app.get('/api/case-updates/:caseNumber', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('caseNumber', sql.NVarChar(50), caseNumber);

    const result = await request.query(`
      SELECT *
      FROM CaseUpdates
      WHERE caseNumber = @caseNumber
      ORDER BY updateDate DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/case-updates] Error:', error);
    res.status(500).json({ error: 'Failed to fetch case updates' });
  }
});

// POST /api/email/send - Send an email via SMTP
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, cc, subject, body, html, attachments } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ success: false, error: 'Missing required fields: to, subject' });
    }
    const { sendEmail } = require('./services/emailService');
    const result = await sendEmail({
      to,
      cc,
      subject,
      html: html || `<p>${(body || '').replace(/\n/g, '<br>')}</p>`,
      attachments,
    });
    res.json(result);
  } catch (error) {
    console.error('[POST /api/email/send] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// POST /api/teams/send - Send a message to a Teams channel via webhook
app.post('/api/teams/send', async (req, res) => {
  try {
    const { channel, message, title } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Missing required field: message' });
    }
    const webhookUrl = channel === 'relocation'
      ? process.env.TEAMS_WEBHOOK_RELOCATION
      : process.env.TEAMS_WEBHOOK_ATTRITION;

    if (!webhookUrl) {
      return res.json({ success: false, error: 'Teams webhook URL not configured for this channel' });
    }

    const payload = {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            ...(title ? [{ type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium' }] : []),
            { type: 'TextBlock', text: message, wrap: true },
          ],
        },
      }],
    };

    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args)).catch(() => globalThis.fetch(...args));
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    res.json({ success: response.ok });
  } catch (error) {
    console.error('[POST /api/teams/send] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send Teams message' });
  }
});

// ─── GET /api/accounts/:id/lobs ─────────────────────────────
app.get('/api/accounts/:id/lobs', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('accountId', sql.Int, parseInt(id, 10));
    const result = await request.query(`SELECT Id AS id, LOBName AS title, AccountId AS accountId FROM LOBs WHERE AccountId = @accountId ORDER BY LOBName`);
    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/accounts/:id/lobs] Error:', error);
    res.status(500).json({ error: 'Failed to fetch LOBs' });
  }
});

// ─── Pins endpoints ──────────────────────────────────────────
app.get('/api/pins', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());
    const result = await request.query(`
      SELECT id, itemType, itemId, pinnedDate FROM PinnedItems
      WHERE LOWER(userEmail) = @email ORDER BY pinnedDate DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[GET /api/pins] Error:', error);
    res.json({ success: true, data: [] });
  }
});

app.post('/api/pins/:type/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const { type, id } = req.params;
    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());
    request.input('type', sql.NVarChar(20), type);
    request.input('itemId', sql.Int, parseInt(id, 10));
    await request.query(`
      IF NOT EXISTS (SELECT 1 FROM PinnedItems WHERE LOWER(userEmail) = @email AND itemType = @type AND itemId = @itemId)
      INSERT INTO PinnedItems (userEmail, itemType, itemId, pinnedDate) VALUES (@email, @type, @itemId, GETDATE())
    `);
    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/pins] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to pin item' });
  }
});

app.delete('/api/pins/:type/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const { type, id } = req.params;
    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());
    request.input('type', sql.NVarChar(20), type);
    request.input('itemId', sql.Int, parseInt(id, 10));
    await request.query(`DELETE FROM PinnedItems WHERE LOWER(userEmail) = @email AND itemType = @type AND itemId = @itemId`);
    res.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/pins] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to unpin item' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  // Return structured error so the frontend can display a meaningful message
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message, success: false });
});

module.exports = app;
module.exports.PORT = PORT;
module.exports.getPool = getPool;
