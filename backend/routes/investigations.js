const express = require('express');
const { getPool } = require('../db/index');
const sql = require('mssql');
const router = express.Router();

// Generate unique investigation number using HRInvestigations
async function generateInvestigationNumber(pool) {
  const year = new Date().getFullYear();
  const result = await pool.request().query(`
    SELECT COUNT(*) as count FROM HRInvestigations
    WHERE YEAR(CreatedDate) = ${year}
  `);
  const count = (result.recordset[0]?.count || 0) + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

// Log to ActivityLog helper
async function logActivity(pool, { userEmail, userRole, action, entityId, entityRef, details }) {
  try {
    const req = pool.request();
    req.input('userEmail', userEmail || '');
    req.input('userRole', userRole || '');
    req.input('action', action || '');
    req.input('moduleType', 'Investigation');
    req.input('entityId', entityId || null);
    req.input('entityRef', entityRef || '');
    req.input('details', details || '');
    await req.query(`
      INSERT INTO ActivityLog (userEmail, userRole, action, moduleType, entityId, entityRef, details, actionDate)
      VALUES (@userEmail, @userRole, @action, @moduleType, @entityId, @entityRef, @details, GETDATE())
    `);
  } catch (e) {
    console.error('[investigations] ActivityLog insert failed:', e.message);
  }
}

// Map DB PascalCase row to camelCase for frontend
function mapRow(row) {
  return {
    id: row.Id,
    investigationNumber: row.InvestigationNumber,
    caseId: row.CaseId,
    caseNumber: row.CaseNumber,
    traineeName: row.TraineeName,
    oracleId: row.OracleID,
    investigationType: row.InvestigationType,
    status: row.InvestigationStatus,
    priority: row.Priority,
    requestedBy: row.InitiatedBy,
    requestedByEmail: row.InitiatedByEmail || '',
    assignedTo: row.AssignedTo,
    assignedToEmail: row.AssignedToEmail,
    dueDate: row.DueDate,
    summary: row.Summary,
    details: row.Details,
    findings: row.Findings,
    recommendation: row.Recommendation,
    resolution: row.Resolution,
    outcome: row.Recommendation,
    approvedBy: row.ApprovedBy,
    approvalDate: row.ApprovalDate,
    closureNotes: row.ClosureNotes,
    closedAt: row.CompletedDate,
    closedBy: row.ApprovedBy,
    escalatedTo: row.EscalatedTo,
    createdAt: row.CreatedDate,
    updatedAt: row.CompletedDate || row.CreatedDate,
    accountName: row.accountName || null,
  };
}

// ─── GET /counts ─────────────────────────────────────────────
router.get('/counts', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;

    let whereClause = '';
    if (user.role === 'Trainer') {
      whereClause = `WHERE LOWER(InitiatedBy) = '${user.email.replace(/'/g, "''")}'`;
    }

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN InvestigationStatus = 'Open' THEN 1 ELSE 0 END) as openCount,
        SUM(CASE WHEN InvestigationStatus = 'InProgress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN InvestigationStatus = 'PendingReview' THEN 1 ELSE 0 END) as pendingReview,
        SUM(CASE WHEN InvestigationStatus = 'Closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN Priority = 'Critical' AND InvestigationStatus != 'Closed' THEN 1 ELSE 0 END) as critical
      FROM HRInvestigations ${whereClause}
    `);

    const c = result.recordset[0] || {};
    res.json({
      success: true,
      data: {
        total: c.total || 0,
        open: c.openCount || 0,
        inProgress: c.inProgress || 0,
        pendingReview: c.pendingReview || 0,
        closed: c.closed || 0,
        critical: c.critical || 0,
      },
    });
  } catch (error) {
    console.error('[GET /api/investigations/counts] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch investigation counts' });
  }
});

// ─── GET / (list with filters) ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const { status, priority, type, search, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    const request = pool.request();

    if (user.role === 'Trainer') {
      request.input('userEmail', user.email.toLowerCase());
      whereClauses.push('LOWER(i.InitiatedBy) = @userEmail');
    }

    if (status) {
      request.input('status', status);
      whereClauses.push('i.InvestigationStatus = @status');
    }
    if (priority) {
      request.input('priority', priority);
      whereClauses.push('i.Priority = @priority');
    }
    if (type) {
      request.input('type', type);
      whereClauses.push('i.InvestigationType = @type');
    }
    if (search) {
      request.input('search', `%${search}%`);
      whereClauses.push('(i.TraineeName LIKE @search OR i.InvestigationNumber LIKE @search OR i.OracleID LIKE @search OR i.Summary LIKE @search)');
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await request.query(`
      SELECT i.*, acc.AccountName as accountName
      FROM HRInvestigations i
      LEFT JOIN Accounts acc ON i.CaseId = acc.id
      ${whereSQL}
      ORDER BY
        CASE i.Priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
        i.CreatedDate DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limitNum} ROWS ONLY
    `);

    const countRequest = pool.request();
    if (status) countRequest.input('status', status);
    if (priority) countRequest.input('priority', priority);
    if (type) countRequest.input('type', type);
    if (search) countRequest.input('search', `%${search}%`);
    if (user.role === 'Trainer') countRequest.input('userEmail', user.email.toLowerCase());

    const countResult = await countRequest.query(`SELECT COUNT(*) as total FROM HRInvestigations i ${whereSQL}`);
    const total = countResult.recordset[0]?.total || 0;

    res.json({
      success: true,
      data: {
        investigations: result.recordset.map(mapRow),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[GET /api/investigations] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch investigations' });
  }
});

// ─── GET /:id (full detail) ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('id', id);

    const result = await request.query(`
      SELECT i.*, acc.AccountName as accountName
      FROM HRInvestigations i
      LEFT JOIN Accounts acc ON i.CaseId = acc.id
      WHERE i.Id = @id OR i.InvestigationNumber = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const investigation = mapRow(result.recordset[0]);

    // Fetch activity log entries for this investigation
    const updatesReq = pool.request();
    updatesReq.input('entityId', investigation.id);
    const updatesResult = await updatesReq.query(`
      SELECT id, action as updateType, userEmail as updatedByEmail, details as notes, actionDate as createdAt
      FROM ActivityLog
      WHERE moduleType = 'Investigation' AND entityId = @entityId
      ORDER BY actionDate ASC
    `);

    investigation.updates = updatesResult.recordset;
    res.json({ success: true, data: investigation });
  } catch (error) {
    console.error('[GET /api/investigations/:id] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch investigation' });
  }
});

// ─── POST / (create investigation) ───────────────────────────────
router.post('/', async (req, res) => {
  try {
    const user = req.user;
    const pool = await getPool();

    if (!['Trainer', 'Supervisor', 'Manager', 'PS', 'TA', 'Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized to create investigations' });
    }

    const investigationNumber = await generateInvestigationNumber(pool);
    const now = new Date();

    const request = pool.request();
    request.input('InvestigationNumber', investigationNumber);
    request.input('CaseId', req.body.caseId || null);
    request.input('CaseNumber', req.body.caseNumber || null);
    request.input('TraineeName', req.body.traineeName || '');
    request.input('OracleID', req.body.oracleId || '');
    request.input('InvestigationType', req.body.investigationType || 'Other');
    request.input('Priority', req.body.priority || 'Medium');
    request.input('InvestigationStatus', 'Open');
    request.input('Summary', req.body.summary || '');
    request.input('Details', req.body.details || '');
    request.input('InitiatedBy', user.displayName || user.email);
    request.input('AssignedTo', req.body.assignedTo || '');
    request.input('AssignedToEmail', req.body.assignedToEmail || '');
    request.input('DueDate', req.body.dueDate || null);
    request.input('CreatedDate', now);

    const insertResult = await request.query(`
      INSERT INTO HRInvestigations (
        InvestigationNumber, CaseId, CaseNumber, TraineeName, OracleID,
        InvestigationType, Priority, InvestigationStatus, Summary, Details,
        InitiatedBy, AssignedTo, AssignedToEmail, DueDate, CreatedDate
      ) OUTPUT INSERTED.Id
      VALUES (
        @InvestigationNumber, @CaseId, @CaseNumber, @TraineeName, @OracleID,
        @InvestigationType, @Priority, @InvestigationStatus, @Summary, @Details,
        @InitiatedBy, @AssignedTo, @AssignedToEmail, @DueDate, @CreatedDate
      )
    `);

    const newId = insertResult.recordset[0].Id;

    await logActivity(pool, {
      userEmail: user.email,
      userRole: user.role,
      action: 'Created',
      entityId: newId,
      entityRef: investigationNumber,
      details: 'Investigation request submitted',
    });

    res.json({ success: true, id: newId, investigationNumber, message: 'Investigation request submitted successfully' });
  } catch (error) {
    console.error('[POST /api/investigations] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create investigation' });
  }
});

// ─── PUT /:id (update investigation) ─────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const pool = await getPool();

    const findReq = pool.request();
    findReq.input('id', id);
    const findResult = await findReq.query(`SELECT * FROM HRInvestigations WHERE Id = @id OR InvestigationNumber = @id`);

    if (findResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const existing = findResult.recordset[0];

    if (user.role === 'Trainer' &&
        (existing.InitiatedBy || '').toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this investigation' });
    }

    const updateFields = [];
    const updateReq = pool.request();

    const fieldMap = {
      status: 'InvestigationStatus',
      priority: 'Priority',
      assignedTo: 'AssignedTo',
      assignedToEmail: 'AssignedToEmail',
      dueDate: 'DueDate',
      findings: 'Findings',
      resolution: 'Resolution',
      outcome: 'Recommendation',
    };

    for (const [key, dbCol] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        updateFields.push(`${dbCol} = @${dbCol}`);
        updateReq.input(dbCol, req.body[key]);
      }
    }

    if (updateFields.length === 0) {
      return res.json({ success: true, investigationNumber: existing.InvestigationNumber, message: 'No updates provided' });
    }

    updateReq.input('investigationId', existing.Id);
    await updateReq.query(`UPDATE HRInvestigations SET ${updateFields.join(', ')} WHERE Id = @investigationId`);

    await logActivity(pool, {
      userEmail: user.email,
      userRole: user.role,
      action: 'Updated',
      entityId: existing.Id,
      entityRef: existing.InvestigationNumber,
      details: req.body.updateNotes || 'Investigation updated',
    });

    res.json({ success: true, investigationNumber: existing.InvestigationNumber, message: 'Investigation updated successfully' });
  } catch (error) {
    console.error('[PUT /api/investigations/:id] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update investigation' });
  }
});

// ─── POST /:id/comments (add comment) ────────────────────────────
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const user = req.user;
    const pool = await getPool();

    const findReq = pool.request();
    findReq.input('id', id);
    const findResult = await findReq.query(`SELECT * FROM HRInvestigations WHERE Id = @id OR InvestigationNumber = @id`);

    if (findResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const existing = findResult.recordset[0];

    await logActivity(pool, {
      userEmail: user.email,
      userRole: user.role,
      action: 'Comment',
      entityId: existing.Id,
      entityRef: existing.InvestigationNumber,
      details: comment || '',
    });

    res.json({
      success: true,
      data: { updateType: 'Comment', updatedBy: user.displayName || user.email, createdAt: new Date(), notes: comment },
    });
  } catch (error) {
    console.error('[POST /api/investigations/:id/comments] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// ─── POST /:id/resolve (close investigation) ─────────────────────
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, outcome } = req.body;
    const user = req.user;
    const pool = await getPool();

    if (!['PS', 'TA', 'Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Only PS, TA, or Admin can resolve investigations' });
    }

    const findReq = pool.request();
    findReq.input('id', id);
    const findResult = await findReq.query(`SELECT * FROM HRInvestigations WHERE Id = @id OR InvestigationNumber = @id`);

    if (findResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const existing = findResult.recordset[0];
    const now = new Date();

    const updateReq = pool.request();
    updateReq.input('investigationId', existing.Id);
    updateReq.input('status', 'Closed');
    updateReq.input('resolution', resolution || '');
    updateReq.input('recommendation', outcome || 'No Action Required');
    updateReq.input('closureNotes', resolution || '');
    updateReq.input('completedDate', now);
    updateReq.input('approvedBy', user.displayName || user.email);
    updateReq.input('approvalDate', now);

    await updateReq.query(`
      UPDATE HRInvestigations SET
        InvestigationStatus = @status,
        Resolution = @resolution,
        Recommendation = @recommendation,
        ClosureNotes = @closureNotes,
        CompletedDate = @completedDate,
        ApprovedBy = @approvedBy,
        ApprovalDate = @approvalDate
      WHERE Id = @investigationId
    `);

    await logActivity(pool, {
      userEmail: user.email,
      userRole: user.role,
      action: 'Closed',
      entityId: existing.Id,
      entityRef: existing.InvestigationNumber,
      details: `Investigation closed. Resolution: ${resolution || 'N/A'}. Outcome: ${outcome || 'N/A'}`,
    });

    res.json({ success: true, investigationNumber: existing.InvestigationNumber, message: 'Investigation closed successfully' });
  } catch (error) {
    console.error('[POST /api/investigations/:id/resolve] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve investigation' });
  }
});

module.exports = router;
