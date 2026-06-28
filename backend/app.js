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

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
module.exports.PORT = PORT;
module.exports.getPool = getPool;
