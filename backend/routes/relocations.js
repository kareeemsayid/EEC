const express = require('express');
const { getPool } = require('../db/index');
const sql = require('mssql');
const { generateRelocationId } = require('../utils/requestId');
const { addBusinessDays, businessDaysBetween, loadHolidays } = require('../utils/businessDays');
const { sendRelocationSubmitted, sendRelocationStatusChange, sendRelocationReminder, sendRelocationOverdue } = require('../services/relocationEmail');
const { sendRelocationTeamsNotification } = require('../services/teamsNotification');
const router = express.Router();

// ─── SLA computation ─────────────────────────────────────
function computeSLAStatus(relocation, holidays = []) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  let slaStatus = '✅ Within SLA';
  let slaRiskAssessment = '✅ Within SLA';
  let priorityLogic = '3 🟢 | ✅ On Track';

  if (relocation.status === 'Submitted') {
    const daysSinceSubmit = businessDaysBetween(relocation.submittedDate || relocation.submissionDate, today, holidays);
    if (daysSinceSubmit > 2) {
      slaStatus = '🔴 ATTENTION! PS Approval Overdue';
      slaRiskAssessment = '🔴 ATTENTION! PS Approval Overdue';
      priorityLogic = '1 🔴 | 👉 Escalate To PS';
    } else if (daysSinceSubmit >= 1) {
      slaStatus = '🟡 Warning';
      slaRiskAssessment = '🟡 Warning';
      priorityLogic = '2 🟡 | ⚠️ Warning';
    }
  } else if (relocation.status === 'PSCleared' && relocation.psClearedDate) {
    const daysSincePS = businessDaysBetween(relocation.psClearedDate, today, holidays);
    if (daysSincePS > 12) {
      slaStatus = '🔴 ALERT! TA Action Overdue';
      slaRiskAssessment = '🔴 ALERT! TA Action Overdue';
      priorityLogic = '1 🔴 | 🚨 Escalate To TA';
    } else if (daysSincePS >= 10) {
      slaStatus = '🟡 Warning';
      slaRiskAssessment = '🟡 Warning';
      priorityLogic = '2 🟡 | ⚠️ Warning';
    }
  } else if (relocation.status === 'TACleared' && relocation.taClearedDate) {
    const daysSinceTA = businessDaysBetween(relocation.taClearedDate, today, holidays);
    if (daysSinceTA > 10) {
      slaStatus = '🔴 Relocation Overdue';
      slaRiskAssessment = '🔴 Relocation Overdue';
      priorityLogic = '1 🔴 | 🚨 Escalate';
    }
  }

  return { slaStatus, slaRiskAssessment, priorityLogic };
}

function getMonthLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] || '';
  } catch { return ''; }
}

function getQuarterLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const m = new Date(dateStr).getMonth();
    return `Q${Math.floor(m / 3) + 1}`;
  } catch { return ''; }
}

// ─── GET /counts (MUST be before /:id) ────────────────────
router.get('/counts', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;

    let whereClause = '';
    if (user.role === 'Trainer') {
      whereClause = `WHERE LOWER(submittedByEmail) = '${user.email}'`;
    }

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'PSCleared' THEN 1 ELSE 0 END) as psCleared,
        SUM(CASE WHEN status = 'TACleared' THEN 1 ELSE 0 END) as taCleared,
        SUM(CASE WHEN status = 'Relocated' THEN 1 ELSE 0 END) as relocated,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'Submitted' AND slaStatus LIKE '%Overdue%' THEN 1 ELSE 0 END) as overduePS,
        SUM(CASE WHEN status = 'PSCleared' AND slaStatus LIKE '%Overdue%' THEN 1 ELSE 0 END) as overdueTA
      FROM RelocationRequests ${whereClause}
    `);

    const counts = result.recordset[0] || {};
    res.json({
      success: true,
      data: {
        total: counts.total || 0,
        submitted: counts.submitted || 0,
        psCleared: counts.psCleared || 0,
        taCleared: counts.taCleared || 0,
        relocated: counts.relocated || 0,
        cancelled: counts.cancelled || 0,
        overduePS: counts.overduePS || 0,
        overdueTA: counts.overdueTA || 0,
      },
    });
  } catch (error) {
    console.error('[GET /api/relocations/counts] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch relocation counts' });
  }
});

// ─── GET / (list with filters) ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const { status, account, lob, site, search, month, quarter, vertical, page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    const request = pool.request();

    // Role filter
    if (user.role === 'Trainer') {
      request.input('userEmail', user.email);
      whereClauses.push('LOWER(r.submittedByEmail) = @userEmail');
    }

    if (status) { request.input('status', status); whereClauses.push('r.status = @status'); }
    if (account) { request.input('account', account); whereClauses.push('acc.AccountName = @account'); }
    if (lob) { request.input('lob', lob); whereClauses.push('l.LOBName = @lob'); }
    if (site) { request.input('site', site); whereClauses.push('s.SiteName = @site'); }
    if (month) { whereClauses.push(`MONTH(r.submittedDate) = ${parseInt(month, 10)}`); }
    if (quarter) { whereClauses.push(`DATEPART(QUARTER, r.submittedDate) = ${parseInt(quarter, 10)}`); }
    if (search) {
      request.input('search', `%${search}%`);
      whereClauses.push('(r.employeeName LIKE @search OR r.requestNumber LIKE @search OR r.oracleId LIKE @search)');
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT r.*,
        acc.AccountName as accountName,
        l.LOBName as lobName,
        s.SiteName as siteName,
        s.City as siteRegion
      FROM RelocationRequests r
      LEFT JOIN Accounts acc ON r.currentAccountId = acc.Id
      LEFT JOIN LOBs l ON r.currentLobId = l.Id
      LEFT JOIN Sites s ON r.currentSiteId = s.Id
      ${whereSQL}
      ORDER BY r.submittedDate DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limitNum} ROWS ONLY
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM RelocationRequests r
      LEFT JOIN Accounts acc ON r.currentAccountId = acc.Id
      LEFT JOIN LOBs l ON r.currentLobId = l.Id
      LEFT JOIN Sites s ON r.currentSiteId = s.Id
      ${whereSQL}
    `;

    const result = await request.query(query);
    const countRequest = pool.request();
    for (const p of Object.values(request.parameters)) {
      countRequest.input(p.name, p.type, p.value);
    }
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    // Load holidays for SLA computation
    const holidays = await loadHolidays(pool);

    // Enrich rows with computed fields
    const enrichedRows = result.recordset.map(row => {
      const sla = computeSLAStatus(row, holidays);
      return {
        ...row,
        account: row.accountName || row.account,
        lob: row.lobName || row.lob,
        site: row.siteName || row.site,
        siteRegion: row.siteRegion || row.siteRegion,
        slaStatus: sla.slaStatus,
        slaRiskAssessment: sla.slaRiskAssessment,
        priorityLogic: sla.priorityLogic,
        month: getMonthLabel(row.submittedDate),
        quarter: getQuarterLabel(row.submittedDate),
      };
    });

    res.json({
      success: true,
      data: {
        relocations: enrichedRows,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[GET /api/relocations] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch relocations' });
  }
});

// ─── GET /:id (full detail) ───────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('id', id);

    const result = await request.query(`
      SELECT r.*,
        acc.AccountName as accountName,
        l.LOBName as lobName,
        s.SiteName as siteName,
        s.City as siteRegion
      FROM RelocationRequests r
      LEFT JOIN Accounts acc ON r.accountId = acc.Id
      LEFT JOIN LOBs l ON r.lobId = l.Id
      LEFT JOIN Sites s ON r.siteId = s.Id
      WHERE r.id = @id OR r.requestId = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Relocation not found' });
    }

    const holidays = await loadHolidays(pool);
    const row = result.recordset[0];
    const sla = computeSLAStatus(row, holidays);

    res.json({
      success: true,
      data: {
        ...row,
        account: row.accountName || row.account,
        lob: row.lobName || row.lob,
        site: row.siteName || row.site,
        slaStatus: sla.slaStatus,
        slaRiskAssessment: sla.slaRiskAssessment,
        priorityLogic: sla.priorityLogic,
        month: getMonthLabel(row.submittedDate),
        quarter: getQuarterLabel(row.submittedDate),
      },
    });
  } catch (error) {
    console.error('[GET /api/relocations/:id] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch relocation' });
  }
});

// ─── GET /:id/timeline ────────────────────────────────────
router.get('/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('id', id);

    const result = await request.query(`
      SELECT * FROM RelocationUpdates
      WHERE relocationId = @id OR relocationRequestId = @id
      ORDER BY updateDate ASC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[GET /api/relocations/:id/timeline] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

// ─── POST / (create relocation) ───────────────────────────
router.post('/', async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'Trainer') {
      return res.status(403).json({ success: false, error: 'Only Trainers can submit relocation requests' });
    }

    const pool = await getPool();
    const data = req.body;
    const requestId = generateRelocationId();
    const now = new Date().toISOString();

    // Validate required fields
    const requiredFields = ['employeeName', 'oid', 'reachableNumber', 'language', 'currentSite', 'currentLOB', 'wave', 'vertical', 'preferredSiteArea', 'relocationReason', 'releaseDate', 'attendanceAdherence', 'trainingSupervisorName', 'trainingSupervisorEmail', 'trainingManagerName', 'trainingManagerEmail'];
    const missing = requiredFields.filter(f => !data[f]);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields', missing });
    }

    // Check duplicate: active request for same OID
    let duplicateWarning = false;
    try {
      const dupReq = pool.request();
      dupReq.input('oid', data.oid);
      const dupResult = await dupReq.query(`
        SELECT COUNT(*) as cnt FROM RelocationRequests
        WHERE oid = @oid AND status NOT IN ('Relocated', 'Cancelled')
      `);
      if (dupResult.recordset[0].cnt > 0) duplicateWarning = true;
    } catch (e) { /* ignore */ }

    // Check trainee history
    let priorCases = [];
    try {
      const histReq = pool.request();
      histReq.input('oid', data.oid);
      const histResult = await histReq.query(`
        SELECT TOP 5 caseNumber, traineeName, caseStatus, caseOpenedDate
        FROM AttritionCases WHERE oracleId = @oid ORDER BY caseOpenedDate DESC
      `);
      priorCases = histResult.recordset;
    } catch (e) { /* ignore */ }

    const request = pool.request();
    request.input('requestId', requestId);
    request.input('employeeName', data.employeeName);
    request.input('oid', data.oid);
    request.input('oracleId', data.oid);
    request.input('reachableNumber', data.reachableNumber);
    request.input('language', data.language);
    request.input('preferredSiteArea', Array.isArray(data.preferredSiteArea) ? data.preferredSiteArea.join('; ') : data.preferredSiteArea);
    request.input('relocationReason', data.relocationReason);
    request.input('releaseDate', data.releaseDate);
    request.input('releaseDateCompliance', data.releaseDate);
    request.input('attendanceAdherence', data.attendanceAdherence);
    request.input('disciplinaryNotes', data.disciplinaryNotes || '');
    request.input('additionalNotes', data.additionalNotes || '');
    request.input('wave', data.wave);
    request.input('vertical', data.vertical);
    request.input('currentMSA', data.currentMSA || '');
    request.input('account', data.currentAccount || '');
    request.input('lob', data.currentLOB || '');
    request.input('site', data.currentSite || '');
    request.input('siteId', data.siteId || null);
    request.input('lobId', data.lobId || null);
    request.input('accountId', data.accountId || null);
    request.input('trainingSupervisor', data.trainingSupervisorName);
    request.input('trainingManager', data.trainingManagerName);
    request.input('trainingManagerEmail', data.trainingManagerEmail);
    request.input('supervisorEmail', data.trainingSupervisorEmail);
    request.input('submittedByEmail', user.email);
    request.input('submittedByName', user.displayName || user.email);
    request.input('submittedDate', now);
    request.input('status', 'Submitted');
    request.input('lastUpdatedDate', now);
    request.input('overdueFlag', 0);
    request.input('jobRequisitionNumber', data.jobRequisitionNumber || null);
    request.input('hireDate', data.hireDate || null);

    const insertResult = await request.query(`
      INSERT INTO RelocationRequests (
        requestId, employeeName, oid, oracleId, reachableNumber, language, hireDate,
        preferredSiteArea, relocationReason, releaseDate, releaseDateCompliance,
        attendanceAdherence, disciplinaryNotes, additionalNotes, jobRequisitionNumber,
        wave, vertical, currentMSA, account, lob, site, siteId, lobId, accountId,
        trainingSupervisor, trainingManager, trainingManagerEmail, supervisorEmail,
        submittedByEmail, submittedByName, submittedDate, status, lastUpdatedDate, overdueFlag
      )
      OUTPUT INSERTED.id
      VALUES (
        @requestId, @employeeName, @oid, @oracleId, @reachableNumber, @language, @hireDate,
        @preferredSiteArea, @relocationReason, @releaseDate, @releaseDateCompliance,
        @attendanceAdherence, @disciplinaryNotes, @additionalNotes, @jobRequisitionNumber,
        @wave, @vertical, @currentMSA, @account, @lob, @site, @siteId, @lobId, @accountId,
        @trainingSupervisor, @trainingManager, @trainingManagerEmail, @supervisorEmail,
        @submittedByEmail, @submittedByName, @submittedDate, @status, @lastUpdatedDate, @overdueFlag
      )
    `);

    const newId = insertResult.recordset[0].id;

    // Insert RelocationUpdates: StatusChange
    try {
      const updateReq = pool.request();
      updateReq.input('relocationId', newId);
      updateReq.input('updateType', 'StatusChange');
      updateReq.input('newStatus', 'Submitted');
      updateReq.input('updateDate', now);
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateNotes', 'Relocation request submitted');
      await updateReq.query(`
        INSERT INTO RelocationUpdates (relocationId, updateType, newStatus, updateDate, updatedBy, updatedByEmail, updateNotes)
        VALUES (@relocationId, @updateType, @newStatus, @updateDate, @updatedBy, @updatedByEmail, @updateNotes)
      `);
    } catch (e) {
      console.error('[POST /api/relocations] Failed to insert update record:', e.message);
    }

    // Build relocation object for notifications
    const relocation = { ...data, id: newId, requestId, status: 'Submitted' };

    // Send email + Teams notification
    try { await sendRelocationSubmitted(pool, relocation); } catch (e) { console.error('[relocations] Email failed:', e.message); }
    try { await sendRelocationTeamsNotification(relocation, 'submitted'); } catch (e) { console.error('[relocations] Teams failed:', e.message); }

    res.status(201).json({
      success: true,
      data: { id: newId, requestId },
      duplicateWarning,
      priorCases: priorCases.length > 0,
    });
  } catch (error) {
    console.error('[POST /api/relocations] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create relocation request' });
  }
});

// ─── PUT /:id/status ──────────────────────────────────────
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const user = req.user;
    const pool = await getPool();

    // Role validation
    const roleAllowed = {
      PSCleared: ['PS', 'TA', 'Admin'],
      TACleared: ['TA', 'Admin'],
      Relocated: ['TA', 'Admin'],
      Cancelled: ['Trainer', 'PS', 'TA', 'Admin'],
    };

    const allowedRoles = roleAllowed[status];
    if (!allowedRoles || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions for this status change' });
    }

    // If Trainer cancelling, verify own request
    if (status === 'Cancelled' && user.role === 'Trainer') {
      const checkReq = pool.request();
      checkReq.input('id', id);
      checkReq.input('email', user.email);
      const checkResult = await checkReq.query(`
        SELECT * FROM RelocationRequests WHERE (id = @id OR requestId = @id) AND LOWER(submittedByEmail) = @email
      `);
      if (checkResult.recordset.length === 0) {
        return res.status(403).json({ success: false, error: 'You can only cancel your own requests' });
      }
    }

    const now = new Date().toISOString();
    const request = pool.request();
    request.input('id', id);
    request.input('status', status);
    request.input('lastUpdatedDate', now);

    let dateColumn = '';
    if (status === 'PSCleared') dateColumn = ', psClearedDate = @lastUpdatedDate';
    else if (status === 'TACleared') dateColumn = ', taClearedDate = @lastUpdatedDate';
    else if (status === 'Relocated') dateColumn = ', relocatedDate = @lastUpdatedDate';
    else if (status === 'Cancelled') dateColumn = ', cancelledDate = @lastUpdatedDate';

    await request.query(`
      UPDATE RelocationRequests
      SET status = @status, lastUpdatedDate = @lastUpdatedDate ${dateColumn}
      WHERE id = @id OR requestId = @id
    `);

    // Fetch the updated relocation
    const fetchReq = pool.request();
    fetchReq.input('id', id);
    const fetchResult = await fetchReq.query(`SELECT * FROM RelocationRequests WHERE id = @id OR requestId = @id`);
    const relocation = fetchResult.recordset[0];

    // Insert RelocationUpdates
    try {
      const updateReq = pool.request();
      updateReq.input('relocationId', relocation.id);
      updateReq.input('updateType', 'StatusChange');
      updateReq.input('newStatus', status);
      updateReq.input('updateDate', now);
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateNotes', notes || `Status changed to ${status}`);
      await updateReq.query(`
        INSERT INTO RelocationUpdates (relocationId, updateType, newStatus, updateDate, updatedBy, updatedByEmail, updateNotes)
        VALUES (@relocationId, @updateType, @newStatus, @updateDate, @updatedBy, @updatedByEmail, @updateNotes)
      `);
    } catch (e) {
      console.error('[PUT /:id/status] Failed to insert update:', e.message);
    }

    // Send email + Teams notification
    try { await sendRelocationStatusChange(pool, relocation, status); } catch (e) { console.error('[relocations] Email failed:', e.message); }

    res.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/relocations/:id/status] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// ─── POST /:id/comments ───────────────────────────────────
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal } = req.body;
    const user = req.user;
    const pool = await getPool();
    const now = new Date().toISOString();

    const request = pool.request();
    request.input('relocationId', id);
    request.input('updateType', 'Comment');
    request.input('updateDate', now);
    request.input('updatedBy', user.displayName || user.email);
    request.input('updatedByEmail', user.email);
    request.input('updateNotes', comment || '');
    request.input('isInternal', isInternal ? 1 : 0);

    await request.query(`
      INSERT INTO RelocationUpdates (relocationId, updateType, updateDate, updatedBy, updatedByEmail, updateNotes, isInternal)
      VALUES (@relocationId, @updateType, @updateDate, @updatedBy, @updatedByEmail, @updateNotes, @isInternal)
    `);

    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/relocations/:id/comments] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// ─── POST /:id/remind-ta ──────────────────────────────────
router.post('/:id/remind-ta', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const pool = await getPool();

    if (user.role !== 'Trainer') {
      return res.status(403).json({ success: false, error: 'Only Trainers can send TA reminders' });
    }

    // Verify own request
    const checkReq = pool.request();
    checkReq.input('id', id);
    checkReq.input('email', user.email);
    const checkResult = await checkReq.query(`
      SELECT * FROM RelocationRequests WHERE (id = @id OR requestId = @id) AND LOWER(submittedByEmail) = @email
    `);
    if (checkResult.recordset.length === 0) {
      return res.status(403).json({ success: false, error: 'You can only remind on your own requests' });
    }

    const relocation = checkResult.recordset[0];

    // Check remindTADate cooldown (3 business days)
    if (relocation.remindTADate) {
      const holidays = await loadHolidays(pool);
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const daysSince = businessDaysBetween(relocation.remindTADate, today, holidays);
      if (daysSince < 3) {
        const countdown = 3 - daysSince;
        return res.status(429).json({ success: false, error: `Reminder cooldown: ${countdown} business day(s) remaining`, countdown });
      }
    }

    const now = new Date().toISOString();
    const request = pool.request();
    request.input('id', relocation.id);
    request.input('remindTADate', now);
    await request.query(`
      UPDATE RelocationRequests SET remindTA = 1, remindTADate = @remindTADate WHERE id = @id
    `);

    // Insert RelocationUpdates
    try {
      const updateReq = pool.request();
      updateReq.input('relocationId', relocation.id);
      updateReq.input('updateType', 'ReminderSent');
      updateReq.input('updateDate', now);
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('updateNotes', 'TA reminder sent');
      await updateReq.query(`
        INSERT INTO RelocationUpdates (relocationId, updateType, updateDate, updatedBy, updatedByEmail, updateNotes)
        VALUES (@relocationId, @updateType, @updateDate, @updatedBy, @updatedByEmail, @updateNotes)
      `);
    } catch (e) { /* ignore */ }

    // Send email + Teams
    try { await sendRelocationReminder(pool, relocation); } catch (e) { console.error('[relocations] Reminder email failed:', e.message); }
    try { await sendRelocationTeamsNotification(relocation, 'reminder'); } catch (e) { console.error('[relocations] Reminder Teams failed:', e.message); }

    res.json({ success: true });
  } catch (error) {
    console.error('[POST /api/relocations/:id/remind-ta] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send TA reminder' });
  }
});

module.exports = router;
