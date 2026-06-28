const express = require('express');
const { getPool } = require('../db/index');
const sql = require('mssql');
const router = express.Router();

// Generate unique investigation number
async function generateInvestigationNumber(pool) {
  const year = new Date().getFullYear();
  const result = await pool.request().query(`
    SELECT COUNT(*) as count FROM Investigations
    WHERE YEAR(createdAt) = ${year}
  `);
  const count = (result.recordset[0]?.count || 0) + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

// ─── GET /counts ─────────────────────────────────────────────
router.get('/counts', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;

    let whereClause = '';
    if (user.role === 'Trainer') {
      whereClause = `WHERE LOWER(requestedByEmail) = '${user.email.replace(/'/g, "''")}'`;
    } else if (user.role === 'Supervisor' || user.role === 'Manager') {
      // Supervisors can see investigations from their accounts
      whereClause = `WHERE 1=1`;
    }

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'InProgress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'PendingReview' THEN 1 ELSE 0 END) as pendingReview,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN priority = 'Critical' AND status != 'Closed' THEN 1 ELSE 0 END) as critical
      FROM Investigations ${whereClause}
    `);

    const c = result.recordset[0] || {};
    res.json({
      success: true,
      data: {
        total: c.total || 0,
        open: c.open || 0,
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

    // Role filter
    if (user.role === 'Trainer') {
      request.input('userEmail', user.email);
      whereClauses.push('LOWER(i.requestedByEmail) = @userEmail');
    } else if (user.role === 'Supervisor' || user.role === 'Manager') {
      // Can see investigations from their teams
    }

    if (status) {
      request.input('status', status);
      whereClauses.push('i.status = @status');
    }
    if (priority) {
      request.input('priority', priority);
      whereClauses.push('i.priority = @priority');
    }
    if (type) {
      request.input('type', type);
      whereClauses.push('i.investigationType = @type');
    }
    if (search) {
      request.input('search', `%${search}%`);
      whereClauses.push('(i.traineeName LIKE @search OR i.investigationNumber LIKE @search OR i.oracleId LIKE @search OR i.summary LIKE @search)');
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT i.*,
        acc.AccountName as accountName
      FROM Investigations i
      LEFT JOIN Accounts acc ON i.accountId = acc.id
      ${whereSQL}
      ORDER BY
        CASE i.priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          ELSE 4
        END,
        i.createdAt DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limitNum} ROWS ONLY
    `;

    const result = await request.query(query);

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM Investigations i ${whereSQL}`;
    const countRequest = pool.request();
    for (const p of request.parameters) {
      countRequest.input(p.name, p.value);
    }
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    res.json({
      success: true,
      data: {
        investigations: result.recordset,
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
      SELECT i.*,
        acc.AccountName as accountName
      FROM Investigations i
      LEFT JOIN Accounts acc ON i.accountId = acc.id
      WHERE i.id = @id OR i.investigationNumber = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const investigation = result.recordset[0];

    // Fetch updates/timeline
    const updatesReq = pool.request();
    updatesReq.input('investigationId', investigation.id);
    const updatesResult = await updatesReq.query(`
      SELECT * FROM InvestigationUpdates
      WHERE investigationId = @investigationId
      ORDER BY createdAt ASC
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

    // Only Trainers and Supervisors can create investigations
    if (!['Trainer', 'Supervisor', 'Manager', 'PS', 'TA'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized to create investigations' });
    }

    const investigationNumber = await generateInvestigationNumber(pool);
    const now = new Date().toISOString();

    const request = pool.request();
    request.input('investigationNumber', investigationNumber);
    request.input('traineeName', req.body.traineeName || '');
    request.input('oracleId', req.body.oracleId || '');
    request.input('caseNumber', req.body.caseNumber || null);
    request.input('investigationType', req.body.investigationType || 'Other');
    request.input('priority', req.body.priority || 'Medium');
    request.input('summary', req.body.summary || '');
    request.input('details', req.body.details || '');
    request.input('accountId', req.body.accountId || null);
    request.input('requestedBy', user.displayName || user.email);
    request.input('requestedByEmail', user.email);
    request.input('assignedTo', req.body.assignedTo || '');
    request.input('assignedToEmail', req.body.assignedToEmail || '');
    request.input('dueDate', req.body.dueDate || null);
    request.input('status', 'Open');
    request.input('createdAt', now);
    request.input('updatedAt', now);

    const insertResult = await request.query(`
      INSERT INTO Investigations (
        investigationNumber, traineeName, oracleId, caseNumber, investigationType, priority,
        summary, details, accountId, requestedBy, requestedByEmail, assignedTo,
        assignedToEmail, dueDate, status, createdAt, updatedAt
      ) OUTPUT INSERTED.id
      VALUES (
        @investigationNumber, @traineeName, @oracleId, @caseNumber, @investigationType, @priority,
        @summary, @details, @accountId, @requestedBy, @requestedByEmail, @assignedTo,
        @assignedToEmail, @dueDate, @status, @createdAt, @updatedAt
      )
    `);

    const newId = insertResult.recordset[0].id;

    // Insert initial update
    try {
      const updateReq = pool.request();
      updateReq.input('investigationId', newId);
      updateReq.input('updateType', 'Created');
      updateReq.input('updatedBy', user.displayName || user.email);
      updateReq.input('updatedByEmail', user.email);
      updateReq.input('createdAt', now);
      updateReq.input('notes', 'Investigation request submitted');
      await updateReq.query(`
        INSERT INTO InvestigationUpdates (investigationId, updateType, updatedBy, updatedByEmail, createdAt, notes)
        VALUES (@investigationId, @updateType, @updatedBy, @updatedByEmail, @createdAt, @notes)
      `);
    } catch (e) { console.error('[investigations] Failed to insert update:', e.message); }

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

    // Find investigation
    const findReq = pool.request();
    findReq.input('id', id);
    const findResult = await findReq.query(`SELECT * FROM Investigations WHERE id = @id OR investigationNumber = @id`);

    if (findResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const existing = findResult.recordset[0];
    const now = new Date().toISOString();

    // Authorization: Trainers can only update own, PS/TA/Admin can update any
    if (user.role === 'Trainer' && existing.requestedByEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this investigation' });
    }

    const updateFields = [];
    const updateReq = pool.request();

    const allowedFields = ['status', 'priority', 'assignedTo', 'assignedToEmail', 'dueDate', 'findings', 'resolution', 'outcome'];
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        updateReq.input(key, value);
      }
    }

    if (updateFields.length === 0) {
      return res.json({ success: true, investigationNumber: existing.investigationNumber, message: 'No updates provided' });
    }

    updateFields.push('updatedAt = @updatedAt');
    updateReq.input('updatedAt', now);
    updateReq.input('investigationId', existing.id);

    await updateReq.query(`UPDATE Investigations SET ${updateFields.join(', ')} WHERE id = @investigationId`);

    // Insert update record
    try {
      const insertReq = pool.request();
      insertReq.input('investigationId', existing.id);
      insertReq.input('updateType', 'Updated');
      insertReq.input('updatedBy', user.displayName || user.email);
      insertReq.input('updatedByEmail', user.email);
      insertReq.input('createdAt', now);
      insertReq.input('notes', req.body.updateNotes || 'Investigation updated');
      await insertReq.query(`
        INSERT INTO InvestigationUpdates (investigationId, updateType, updatedBy, updatedByEmail, createdAt, notes)
        VALUES (@investigationId, @updateType, @updatedBy, @updatedByEmail, @createdAt, @notes)
      `);
    } catch (e) { /* ignore */ }

    res.json({ success: true, investigationNumber: existing.investigationNumber, message: 'Investigation updated successfully' });
  } catch (error) {
    console.error('[PUT /api/investigations/:id] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update investigation' });
  }
});

// ─── POST /:id/comments (add comment) ────────────────────────────
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal = false } = req.body;
    const user = req.user;
    const pool = await getPool();

    // Find investigation
    const findReq = pool.request();
    findReq.input('id', id);
    const findResult = await findReq.query(`SELECT * FROM Investigations WHERE id = @id OR investigationNumber = @id`);

    if (findResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const existing = findResult.recordset[0];
    const now = new Date().toISOString();

    // isInternal only for PS, TA, Admin
    let internalFlag = false;
    if (isInternal && ['PS', 'TA', 'Admin'].includes(user.role)) {
      internalFlag = true;
    }

    const insertReq = pool.request();
    insertReq.input('investigationId', existing.id);
    insertReq.input('updateType', 'Comment');
    insertReq.input('updatedBy', user.displayName || user.email);
    insertReq.input('updatedByEmail', user.email);
    insertReq.input('createdAt', now);
    insertReq.input('notes', comment || '');
    insertReq.input('isInternal', internalFlag ? 1 : 0);

    await insertReq.query(`
      INSERT INTO InvestigationUpdates (investigationId, updateType, updatedBy, updatedByEmail, createdAt, notes, isInternal)
      VALUES (@investigationId, @updateType, @updatedBy, @updatedByEmail, @createdAt, @notes, @isInternal)
    `);

    res.json({ success: true, data: { updateType: 'Comment', updatedBy: user.displayName || user.email, createdAt: now, notes: comment, isInternal: internalFlag } });
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

    // Only PS, TA, Admin can resolve
    if (!['PS', 'TA', 'Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Only PS, TA, or Admin can resolve investigations' });
    }

    // Find investigation
    const findReq = pool.request();
    findReq.input('id', id);
    const findResult = await findReq.query(`SELECT * FROM Investigations WHERE id = @id OR investigationNumber = @id`);

    if (findResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Investigation not found' });
    }

    const existing = findResult.recordset[0];
    const now = new Date().toISOString();

    // Update status
    const updateReq = pool.request();
    updateReq.input('investigationId', existing.id);
    updateReq.input('status', 'Closed');
    updateReq.input('resolution', resolution || '');
    updateReq.input('outcome', outcome || 'No Action Required');
    updateReq.input('closedAt', now);
    updateReq.input('closedBy', user.displayName || user.email);
    updateReq.input('updatedAt', now);

    await updateReq.query(`
      UPDATE Investigations SET
        status = @status,
        resolution = @resolution,
        outcome = @outcome,
        closedAt = @closedAt,
        closedBy = @closedBy,
        updatedAt = @updatedAt
      WHERE id = @investigationId
    `);

    // Insert update record
    try {
      const insertReq = pool.request();
      insertReq.input('investigationId', existing.id);
      insertReq.input('updateType', 'Closed');
      insertReq.input('updatedBy', user.displayName || user.email);
      insertReq.input('updatedByEmail', user.email);
      insertReq.input('createdAt', now);
      insertReq.input('notes', `Investigation closed. Resolution: ${resolution || 'N/A'}. Outcome: ${outcome || 'N/A'}`);
      await insertReq.query(`
        INSERT INTO InvestigationUpdates (investigationId, updateType, updatedBy, updatedByEmail, createdAt, notes)
        VALUES (@investigationId, @updateType, @updatedBy, @updatedByEmail, @createdAt, @notes)
      `);
    } catch (e) { /* ignore */ }

    res.json({ success: true, investigationNumber: existing.investigationNumber, message: 'Investigation closed successfully' });
  } catch (error) {
    console.error('[POST /api/investigations/:id/resolve] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve investigation' });
  }
});

module.exports = router;
