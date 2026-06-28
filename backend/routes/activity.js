const express = require('express');
const { getPool } = require('../db/index');
const router = express.Router();

// GET /api/activity/recent - Last 20 activities from CaseUpdates + RelocationUpdates
router.get('/recent', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;

    let caseWhere = '';
    if (user.role === 'Trainer') {
      caseWhere = `AND LOWER(c.trainerEmail) = '${user.email.replace(/'/g, "''")}'`;
    }

    const result = await pool.request().query(`
      SELECT TOP 20 * FROM (
        SELECT * FROM (
          SELECT TOP 10
            'case' AS type,
            c.caseNumber AS refId,
            c.traineeName AS entityName,
            cu.updateType,
            cu.updatedBy,
            cu.updatedByEmail,
            cu.updateDate,
            cu.updateNotes,
            c.riskStatus,
            c.lifecycleStage
          FROM CaseUpdates cu
          INNER JOIN AttritionCases c ON cu.caseId = c.Id
          WHERE 1=1 ${caseWhere}
          ORDER BY cu.updateDate DESC
        ) AS caseData
        UNION ALL
        SELECT * FROM (
          SELECT TOP 10
            'relocation' AS type,
            r.requestNumber AS refId,
            r.employeeName AS entityName,
            ru.updateType,
            ru.updatedByDisplayName AS updatedBy,
            ru.updatedByEmail,
            ru.updateDate,
            ru.updateNotes,
            r.status AS riskStatus,
            r.status AS lifecycleStage
          FROM RelocationUpdates ru
          INNER JOIN RelocationRequests r ON ru.relocationRequestId = r.id
          ORDER BY ru.updateDate DESC
        ) AS relocationData
      ) AS combined
      ORDER BY updateDate DESC
    `);

    const activities = result.recordset.map(row => ({
      id: `${row.type}-${row.refId}-${row.updateDate}`,
      type: row.type,
      refId: row.refId,
      entityName: row.entityName,
      action: row.updateType,
      user: row.updatedBy,
      userEmail: row.updatedByEmail,
      timestamp: row.updateDate,
      notes: row.updateNotes,
      riskStatus: row.riskStatus,
      stage: row.lifecycleStage,
    }));

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('[GET /api/activity/recent] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
