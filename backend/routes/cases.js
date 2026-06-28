const express = require('express');
const { getPool } = require('../db/index');
const sql = require('mssql');
const { businessDaysBetween, loadHolidays } = require('../utils/businessDays');
const { generateCaseNumber } = require('../utils/requestId');
const { notifyCaseComment, notifyInvestigationRequested, notifyTerminationApproved, notifyTerminationSheetSent } = require('../services/emailService');
const router = express.Router();

// ─── SLA computation ─────────────────────────────────────
function computeCaseSLA(caseData, holidays = []) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  const daysOpen = businessDaysBetween(caseData.caseOpenedDate || caseData.submittedDate, today, holidays);

  let slaStatus = 'On Track';
  let overdueBy = 0;
  let priorityLogic = '3 🟢 | ✅ On Track';

  // 3 business day SLA for PS action
  if (caseData.caseStatus === 'Active' && !caseData.terminationApproved && !caseData.investigationRequested) {
    if (daysOpen > 3) {
      slaStatus = 'Overdue';
      overdueBy = daysOpen - 3;
      priorityLogic = '1 🔴 | 👉 Escalate To PS';
    } else if (daysOpen >= 2) {
      slaStatus = 'Warning';
      priorityLogic = '2 🟡 | ⚠️ Warning';
    }
  }

  // Investigation SLA: 2 business days
  if (caseData.investigationRequested && !caseData.terminationApproved) {
    const invDays = businessDaysBetween(caseData.investigationDate, today, holidays);
    if (invDays > 2) {
      slaStatus = 'Overdue';
      overdueBy = invDays - 2;
      priorityLogic = '1 🔴 | 🚨 Investigation Overdue';
    }
  }

  // 30 business day max
  if (daysOpen > 30) {
    slaStatus = 'Overdue';
    overdueBy = daysOpen - 30;
    priorityLogic = '1 🔴 | 🚨 SrManager Escalation';
  }

  return { daysOpen, slaStatus, overdueBy, priorityLogic };
}

// ─── GET /counts ──────────────────────────────────────────
router.get('/counts', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;

    let whereClause = '';
    if (user.role === 'Trainer') {
      whereClause = `WHERE LOWER(trainerEmail) = '${user.email.replace(/'/g, "''")}'`;
    }

    const today = new Date().toISOString().split('T')[0];
    const result = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN CAST(caseOpenedDate AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) as newToday,
        SUM(CASE WHEN riskStatus = 'Critical' OR severityLevel = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN riskStatus = 'Monitoring' THEN 1 ELSE 0 END) as monitoring,
        SUM(CASE WHEN caseStatus = 'Active' AND DATEDIFF(day, caseOpenedDate, GETDATE()) > 3 AND terminationApproved = 0 AND investigationRequested = 0 THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN investigationRequested = 1 AND terminationApproved = 0 THEN 1 ELSE 0 END) as investigationPending,
        SUM(CASE WHEN terminationApproved = 1 AND terminationSheetSent = 0 THEN 1 ELSE 0 END) as terminationPending
      FROM AttritionCases ${whereClause}
    `);

    const c = result.recordset[0] || {};
    res.json({
      success: true,
      data: {
        total: c.total || 0,
        newToday: c.newToday || 0,
        critical: c.critical || 0,
        monitoring: c.monitoring || 0,
        overdue: c.overdue || 0,
        investigationPending: c.investigationPending || 0,
        terminationPending: c.terminationPending || 0,
      },
    });
  } catch (error) {
    console.error('[GET /api/cases/counts] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch case counts' });
  }
});

// ─── GET / (list with filters) ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const { filter, status, account, lob, site, search, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    const request = pool.request();

    // Role filter: Trainer = own only. All others = ALL.
    if (user.role === 'Trainer') {
      request.input('trainerEmail', user.email);
      whereClauses.push('LOWER(a.trainerEmail) = @trainerEmail');
    }

    if (filter === 'critical') whereClauses.push("(a.riskStatus = 'Critical' OR a.severityLevel = 'Critical')");
    if (filter === 'monitoring') whereClauses.push("a.riskStatus = 'Monitoring'");
    if (status) { request.input('status', status); whereClauses.push('a.caseStatus = @status'); }
    if (account) { request.input('account', account); whereClauses.push('a.account = @account'); }
    if (lob) { request.input('lob', lob); whereClauses.push('a.lob = @lob'); }
    if (site) { request.input('site', site); whereClauses.push('a.site = @site'); }
    if (search) {
      request.input('search', `%${search}%`);
      whereClauses.push('(a.traineeName LIKE @search OR a.caseNumber LIKE @search OR a.oracleId LIKE @search OR a.trainerName LIKE @search)');
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT a.*,
        acc.AccountName as accountName,
        l.LOBName as lobName,
        s.SiteName as siteName
      FROM AttritionCases a
      LEFT JOIN Accounts acc ON a.account = acc.AccountName
      LEFT JOIN LOBs l ON a.lob = l.LOBName
      LEFT JOIN Sites s ON a.site = s.SiteName
      ${whereSQL}
      ORDER BY a.lastUpdatedDate DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limitNum} ROWS ONLY
    `;

    const result = await request.query(query);

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM AttritionCases a ${whereSQL}`;
    const countRequest = pool.request();
    for (const p of Object.values(request.parameters)) {
      countRequest.input(p.name, p.type, p.value);
    }
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    // Enrich with SLA
    const holidays = await loadHolidays(pool);
    const enrichedCases = result.recordset.map(c => {
      const sla = computeCaseSLA(c, holidays);
      return { ...c, ...sla };
    });

    res.json({
      success: true,
      data: {
        cases: enrichedCases,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[GET /api/cases] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cases' });
  }
});

// ─── GET /:caseId (full detail) ───────────────────────────
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('caseId', caseId);

    const result = await request.query(`
      SELECT a.*,
        acc.AccountName as accountName,
        l.LOBName as lobName,
        s.SiteName as siteName
      FROM AttritionCases a
      LEFT JOIN Accounts acc ON a.account = acc.AccountName
      LEFT JOIN LOBs l ON a.lob = l.LOBName
      LEFT JOIN Sites s ON a.site = s.SiteName
      WHERE a.Id = @caseId OR a.caseNumber = @caseId OR a.oracleId = @caseId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const holidays = await loadHolidays(pool);
    const caseData = result.recordset[0];
    const sla = computeCaseSLA(caseData, holidays);

    res.json({ success: true, data: { ...caseData, ...sla } });
  } catch (error) {
    console.error('[GET /api/cases/:caseId] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch case' });
  }
});

// ─── GET /:caseId/timeline ────────────────────────────────
router.get('/:caseId/timeline', async (req, res) => {
  try {
    const { caseId } = req.params;
    const user = req.user;
    const pool = await getPool();
    const request = pool.request();
    request.input('caseId', caseId);

    let query = `
      SELECT * FROM CaseUpdates
      WHERE caseId = @caseId OR caseNumber = @caseId
    `;

    // Trainers cannot see internal updates
    if (user.role === 'Trainer') {
      query += ` AND (isInternal = 0 OR isInternal IS NULL)`;
    }

    query += ` ORDER BY updateDate ASC`;

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[GET /api/cases/:caseId/timeline] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

// ─── POST /:caseId/comments ───────────────────────────────
router.post('/:caseId/comments', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { comment, isInternal = false } = req.body;
    const user = req.user;
    const pool = await getPool();

    // Block Trainer
    if (user.role === 'Trainer') {
      return res.status(403).json({ success: false, error: 'Trainers cannot add comments' });
    }

    // isInternal only for PS, TA, Admin
    let internalFlag = false;
    if (isInternal && ['PS', 'TA', 'Admin'].includes(user.role)) {
      internalFlag = true;
    }

    const now = new Date().toISOString();
    const request = pool.request();
    request.input('caseId', caseId);
    request.input('updateType', 'Comment');
    request.input('updatedBy', user.displayName || user.email);
    request.input('updatedByEmail', user.email);
    request.input('updateDate', now);
    request.input('updateNotes', comment || '');
    request.input('isInternal', internalFlag ? 1 : 0);

    await request.query(`
      INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes, isInternal)
      VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes, @isInternal)
    `);

    // Notify (skip if internal)
    if (!internalFlag) {
      try {
        const caseReq = pool.request();
        caseReq.input('caseId', caseId);
        const caseResult = await caseReq.query(`SELECT * FROM AttritionCases WHERE id = @caseId OR caseNumber = @caseId`);
        if (caseResult.recordset.length > 0) {
          await notifyCaseComment(pool, caseResult.recordset[0], comment, user.displayName || user.email);
        }
      } catch (e) { console.error('[cases] Comment notification failed:', e.message); }
    }

    res.json({ success: true, data: { updateType: 'Comment', updatedBy: user.displayName || user.email, updateDate: now, updateNotes: comment, isInternal: internalFlag } });
  } catch (error) {
    console.error('[POST /api/cases/:caseId/comments] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// ─── POST /:caseId/request-investigation ──────────────────
router.post('/:caseId/request-investigation', async (req, res) => {
  try {
    const { caseId } = req.params;
    const user = req.user;
    const pool = await getPool();

    if (user.role !== 'Trainer') {
      return res.status(403).json({ success: false, error: 'Only Trainers can request investigations' });
    }

    // Verify case belongs to trainer
    const checkReq = pool.request();
    checkReq.input('caseId', caseId);
    checkReq.input('email', user.email);
    const checkResult = await checkReq.query(`
      SELECT * FROM AttritionCases WHERE (id = @caseId OR caseNumber = @caseId) AND LOWER(trainerEmail) = @email
    `);
    if (checkResult.recordset.length === 0) {
      return res.status(403).json({ success: false, error: 'You can only request investigations on your own cases' });
    }

    const caseData = checkResult.recordset[0];
    const now = new Date().toISOString();

    const request = pool.request();
    request.input('caseId', caseData.id);
    request.input('investigationDate', now);
    request.input('lastUpdatedDate', now);
    await request.query(`
      UPDATE AttritionCases SET investigationRequested = 1, investigationDate = @investigationDate, lastUpdatedDate = @lastUpdatedDate WHERE id = @caseId
    `);

    // Insert CaseUpdate
    try {
      const updateReq = pool.request();
      updateReq.input('caseId', caseData.id);
      updateReq.input('updateType', 'InvestigationRequested');
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateDate', now);
      updateReq.input('updateNotes', 'Investigation requested by trainer');
      await updateReq.query(`
        INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
        VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    // Notify
    try { await notifyInvestigationRequested(pool, caseData); } catch (e) { console.error('[cases] Investigation notification failed:', e.message); }

    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/cases/:caseId/request-investigation] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to request investigation' });
  }
});

// ─── POST /:caseId/approve-termination ────────────────────
router.post('/:caseId/approve-termination', async (req, res) => {
  try {
    const { caseId } = req.params;
    const user = req.user;
    const pool = await getPool();

    if (!['PS', 'TA', 'Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Only PS, TA, or Admin can approve terminations' });
    }

    const now = new Date().toISOString();
    const request = pool.request();
    request.input('caseId', caseId);
    request.input('approvalDate', now);
    request.input('lastUpdatedDate', now);
    await request.query(`
      UPDATE AttritionCases SET terminationApproved = 1, terminationApprovalDate = @approvalDate, lastUpdatedDate = @lastUpdatedDate
      WHERE id = @caseId OR caseNumber = @caseId
    `);

    // Fetch case
    const caseReq = pool.request();
    caseReq.input('caseId', caseId);
    const caseResult = await caseReq.query(`SELECT * FROM AttritionCases WHERE id = @caseId OR caseNumber = @caseId`);
    const caseData = caseResult.recordset[0];

    // Insert CaseUpdate
    try {
      const updateReq = pool.request();
      updateReq.input('caseId', caseData.id);
      updateReq.input('updateType', 'TerminationApproved');
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateDate', now);
      updateReq.input('updateNotes', 'Termination approved');
      await updateReq.query(`
        INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
        VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    // Notify
    try { await notifyTerminationApproved(pool, caseData); } catch (e) { console.error('[cases] Termination approval notification failed:', e.message); }

    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/cases/:caseId/approve-termination] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve termination' });
  }
});

// ─── POST /:caseId/send-termination-sheet ────────────────
router.post('/:caseId/send-termination-sheet', async (req, res) => {
  try {
    const { caseId } = req.params;
    const user = req.user;
    const pool = await getPool();

    if (user.role !== 'Trainer') {
      return res.status(403).json({ success: false, error: 'Only Trainers can send termination sheets' });
    }

    // Fetch case and verify terminationApproved
    const caseReq = pool.request();
    caseReq.input('caseId', caseId);
    caseReq.input('email', user.email);
    const caseResult = await caseReq.query(`
      SELECT * FROM AttritionCases WHERE (id = @caseId OR caseNumber = @caseId) AND LOWER(trainerEmail) = @email
    `);
    if (caseResult.recordset.length === 0) {
      return res.status(403).json({ success: false, error: 'You can only send sheets for your own cases' });
    }

    const caseData = caseResult.recordset[0];
    if (!caseData.terminationApproved) {
      return res.status(400).json({ success: false, error: 'Termination must be approved before sending the sheet' });
    }

    // Generate PDF
    let pdfBuffer;
    try {
      const { generateTerminationPDF } = require('../services/pdfService');
      pdfBuffer = await generateTerminationPDF(caseData);
    } catch (e) {
      console.error('[cases] PDF generation failed:', e.message);
      return res.status(500).json({ success: false, error: 'Failed to generate termination PDF' });
    }

    const now = new Date().toISOString();
    const request = pool.request();
    request.input('caseId', caseData.id);
    request.input('sentDate', now);
    request.input('lastUpdatedDate', now);
    await request.query(`
      UPDATE AttritionCases SET terminationSheetSent = 1, terminationSheetSentDate = @sentDate, lastUpdatedDate = @lastUpdatedDate WHERE id = @caseId
    `);

    // Insert CaseUpdate
    try {
      const updateReq = pool.request();
      updateReq.input('caseId', caseData.id);
      updateReq.input('updateType', 'TerminationSheetSent');
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateDate', now);
      updateReq.input('updateNotes', 'Termination sheet sent');
      await updateReq.query(`
        INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
        VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    // Notify with PDF attachment
    try { await notifyTerminationSheetSent(pool, caseData, pdfBuffer); } catch (e) { console.error('[cases] Termination sheet notification failed:', e.message); }

    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/cases/:caseId/send-termination-sheet] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send termination sheet' });
  }
});

// ─── POST /:caseId/resolve ────────────────────────────────
router.post('/:caseId/resolve', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { resolutionNotes } = req.body;
    const user = req.user;
    const pool = await getPool();

    if (!['PS', 'TA', 'Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Only PS, TA, or Admin can resolve cases' });
    }

    const now = new Date().toISOString();
    const request = pool.request();
    request.input('caseId', caseId);
    request.input('resolvedDate', now);
    request.input('resolutionNotes', resolutionNotes || '');
    request.input('lastUpdatedDate', now);
    await request.query(`
      UPDATE AttritionCases SET caseStatus = 'Resolved', resolvedDate = @resolvedDate, resolutionNotes = @resolutionNotes, lastUpdatedDate = @lastUpdatedDate
      WHERE id = @caseId OR caseNumber = @caseId
    `);

    // Insert CaseUpdate
    try {
      const updateReq = pool.request();
      updateReq.input('caseId', caseId);
      updateReq.input('updateType', 'CaseResolved');
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateDate', now);
      updateReq.input('updateNotes', resolutionNotes || 'Case resolved');
      await updateReq.query(`
        INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
        VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/cases/:caseId/resolve] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve case' });
  }
});

// ─── POST /:caseId/transfer ───────────────────────────────
router.post('/:caseId/transfer', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { newTrainerEmail, reason } = req.body;
    const user = req.user;
    const pool = await getPool();

    if (!['PS', 'Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Only PS or Admin can transfer cases' });
    }

    // Verify new trainer email exists (auto-create if @concentrix.com)
    if (!newTrainerEmail || !newTrainerEmail.endsWith('@concentrix.com')) {
      return res.status(400).json({ success: false, error: 'Valid Concentrix email required' });
    }

    try {
      const userReq = pool.request();
      userReq.input('email', newTrainerEmail.toLowerCase());
      const userResult = await userReq.query(`SELECT email FROM Users WHERE LOWER(email) = @email`);
      if (userResult.recordset.length === 0) {
        const insertReq = pool.request();
        insertReq.input('email', newTrainerEmail.toLowerCase());
        insertReq.input('displayName', newTrainerEmail.split('@')[0]);
        insertReq.input('role', 'Trainer');
        await insertReq.query(`INSERT INTO Users (email, displayName, role) VALUES (@email, @displayName, @role)`);
      }
    } catch (e) { /* Users table may not exist */ }

    const now = new Date().toISOString();
    const request = pool.request();
    request.input('caseId', caseId);
    request.input('newTrainerEmail', newTrainerEmail.toLowerCase());
    request.input('lastUpdatedDate', now);
    await request.query(`
      UPDATE AttritionCases SET trainerEmail = @newTrainerEmail, lastUpdatedDate = @lastUpdatedDate
      WHERE id = @caseId OR caseNumber = @caseId
    `);

    // Insert CaseUpdate
    try {
      const updateReq = pool.request();
      updateReq.input('caseId', caseId);
      updateReq.input('updateType', 'CaseTransferred');
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateDate', now);
      updateReq.input('updateNotes', `Case transferred to ${newTrainerEmail}. Reason: ${reason || 'N/A'}`);
      await updateReq.query(`
        INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
        VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/cases/:caseId/transfer] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to transfer case' });
  }
});

// ─── POST /:caseId/watch ──────────────────────────────────
router.post('/:caseId/watch', async (req, res) => {
  try {
    const { caseId } = req.params;
    const user = req.user;
    const pool = await getPool();

    const request = pool.request();
    request.input('caseId', caseId);
    request.input('userEmail', user.email);
    await request.query(`
      IF NOT EXISTS (SELECT 1 FROM CaseWatchers WHERE (caseId = @caseId OR caseNumber = @caseId) AND userEmail = @userEmail)
      INSERT INTO CaseWatchers (caseId, userEmail, watchedAt) VALUES (@caseId, @userEmail, GETDATE())
    `);

    res.json({ success: true, data: { watching: true } });
  } catch (error) {
    console.error('[POST /api/cases/:caseId/watch] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to watch case' });
  }
});

// ─── DELETE /:caseId/watch ────────────────────────────────
router.delete('/:caseId/watch', async (req, res) => {
  try {
    const { caseId } = req.params;
    const user = req.user;
    const pool = await getPool();

    const request = pool.request();
    request.input('caseId', caseId);
    request.input('userEmail', user.email);
    await request.query(`
      DELETE FROM CaseWatchers WHERE (caseId = @caseId OR caseNumber = @caseId) AND userEmail = @userEmail
    `);

    res.json({ success: true, data: { watching: false } });
  } catch (error) {
    console.error('[DELETE /api/cases/:caseId/watch] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to unwatch case' });
  }
});

// ─── POST /create - Create new case ─────────────────────────
router.post('/create', async (req, res) => {
  try {
    const user = req.user;
    const pool = await getPool();

    // Only Trainers and Supervisors can create cases
    if (!['Trainer', 'Supervisor', 'Manager', 'PS', 'TA'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized to create cases' });
    }

    const caseNumber = await generateCaseNumber(pool);
    const now = new Date().toISOString();

    const request = pool.request();
    request.input('caseNumber', caseNumber);
    request.input('traineeName', req.body.traineeName || '');
    request.input('oracleId', req.body.oracleId || '');
    request.input('personalEmail', req.body.personalEmail || '');
    request.input('workEmail', req.body.workEmail || '');
    request.input('account', req.body.account || '');
    request.input('lob', req.body.lob || '');
    request.input('site', req.body.site || '');
    request.input('wave', req.body.wave || '');
    request.input('trainerName', req.body.trainerName || '');
    request.input('trainerEmail', req.body.trainerEmail || user.email);
    request.input('trainingManager', req.body.trainingManager || '');
    request.input('trainingManagerEmail', req.body.trainingManagerEmail || '');
    request.input('attritionCategory', req.body.attritionCategory || '');
    request.input('subReason', req.body.subReason || '');
    request.input('severityLevel', req.body.severityLevel || 'Minor');
    request.input('totalMissedHours', req.body.totalMissedHours || 0);
    request.input('riskStatus', req.body.riskStatus || 'Monitoring');
    request.input('lifecycleStage', req.body.lifecycleStage || 'Monitoring');
    request.input('incidentDate', req.body.incidentDate || now.split('T')[0]);
    request.input('hireDate', req.body.hireDate || null);
    request.input('caseOpenedDate', now);
    request.input('lastUpdatedDate', now);
    request.input('notes', req.body.notes || '');
    request.input('outlookConversationId', req.body.outlookConversationId || '');
    request.input('documentationRequired', req.body.documentationRequired ? 1 : 0);
    request.input('escalationRequired', req.body.escalationRequired ? 1 : 0);
    request.input('thresholdHours', req.body.thresholdHours || 16);
    request.input('openedBy', req.body.openedBy || user.email);
    request.input('caseStatus', 'Active');

    const insertResult = await request.query(`
      INSERT INTO AttritionCases (
        caseNumber, traineeName, oracleId, personalEmail, workEmail, account, lob, site, wave,
        trainerName, trainerEmail, trainingManager, trainingManagerEmail, attritionCategory, subReason,
        severityLevel, totalMissedHours, riskStatus, lifecycleStage, incidentDate, hireDate,
        caseOpenedDate, lastUpdatedDate, notes, outlookConversationId, documentationRequired,
        escalationRequired, thresholdHours, openedBy, caseStatus
      ) OUTPUT INSERTED.id
      VALUES (
        @caseNumber, @traineeName, @oracleId, @personalEmail, @workEmail, @account, @lob, @site, @wave,
        @trainerName, @trainerEmail, @trainingManager, @trainingManagerEmail, @attritionCategory, @subReason,
        @severityLevel, @totalMissedHours, @riskStatus, @lifecycleStage, @incidentDate, @hireDate,
        @caseOpenedDate, @lastUpdatedDate, @notes, @outlookConversationId, @documentationRequired,
        @escalationRequired, @thresholdHours, @openedBy, @caseStatus
      )
    `);

    const newId = insertResult.recordset[0].id;

    // Insert CaseUpdate for creation
    try {
      const updateReq = pool.request();
      updateReq.input('caseId', newId);
      updateReq.input('updateType', 'CaseCreated');
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateDate', now);
      updateReq.input('updateNotes', 'Case created');
      await updateReq.query(`
        INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
        VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    res.json({ success: true, id: newId, caseNumber, message: 'Case created successfully' });
  } catch (error) {
    console.error('[POST /api/cases/create] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create case' });
  }
});

// ─── POST /update - Update existing case ──────────────────────
router.post('/update', async (req, res) => {
  try {
    const user = req.user;
    const pool = await getPool();
    const { id, caseNumber, ...updates } = req.body;

    if (!id && !caseNumber) {
      return res.status(400).json({ success: false, error: 'Case ID or caseNumber required' });
    }

    // Find the case
    const findReq = pool.request();
    findReq.input('id', id || null);
    findReq.input('caseNumber', caseNumber || null);
    const findResult = await findReq.query(`
      SELECT * FROM AttritionCases
      WHERE (id = @id OR @id IS NULL) AND (caseNumber = @caseNumber OR @caseNumber IS NULL)
    `);

    if (findResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const existingCase = findResult.recordset[0];

    // Authorization: Trainers can only update their own cases
    if (user.role === 'Trainer' && existingCase.trainerEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this case' });
    }

    const now = new Date().toISOString();
    const updateFields = [];
    const updateReq = pool.request();

    // Build dynamic update
    const allowedFields = [
      'riskStatus', 'lifecycleStage', 'totalMissedHours', 'caseStatus', 'notes',
      'escalationRequired', 'documentationRequired', 'terminationReason',
      'localReason', 'effectiveDate', 'terminationSheetSent', 'leaverEmailSent',
      'workdayActionTaken', 'trainerName', 'trainerEmail', 'trainingManager',
      'trainingManagerEmail', 'attritionCategory', 'subReason', 'severityLevel'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        if (typeof value === 'boolean') {
          updateReq.input(key, value ? 1 : 0);
        } else {
          updateReq.input(key, value);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.json({ success: true, caseNumber: existingCase.caseNumber, message: 'No updates provided' });
    }

    updateFields.push('lastUpdatedDate = @lastUpdatedDate');
    updateReq.input('lastUpdatedDate', now);
    updateReq.input('caseId', existingCase.id);

    await updateReq.query(`UPDATE AttritionCases SET ${updateFields.join(', ')} WHERE id = @caseId`);

    // Insert CaseUpdate
    try {
      const insertReq = pool.request();
      insertReq.input('caseId', existingCase.id);
      insertReq.input('updateType', 'CaseUpdated');
      insertReq.input('updatedBy', user.displayName || user.email);
      insertReq.input('updatedByEmail', user.email);
      insertReq.input('updateDate', now);
      insertReq.input('updateNotes', req.body.updateNotes || 'Case updated');

      if (req.body.hoursAdded !== undefined) {
        insertReq.input('previousTotalHours', req.body.previousTotalHours || existingCase.totalMissedHours);
        insertReq.input('newTotalHours', req.body.newTotalHours || updates.totalMissedHours);
        insertReq.input('hoursAdded', req.body.hoursAdded);
        await insertReq.query(`
          INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes, previousTotalHours, newTotalHours, hoursAdded)
          VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes, @previousTotalHours, @newTotalHours, @hoursAdded)
        `);
      } else {
        await insertReq.query(`
          INSERT INTO CaseUpdates (caseId, updateType, updatedBy, updatedByEmail, updateDate, updateNotes)
          VALUES (@caseId, @updateType, @updatedBy, @updatedByEmail, @updateDate, @updateNotes)
        `);
      }
    } catch (e) { /* ignore */ }

    res.json({ success: true, caseNumber: existingCase.caseNumber, message: 'Case updated successfully' });
  } catch (error) {
    console.error('[POST /api/cases/update] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update case' });
  }
});

module.exports = router;
