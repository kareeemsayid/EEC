const express = require('express');
const { getPool } = require('../db/index');
const { businessDaysBetween, loadHolidays } = require('../utils/businessDays');
const router = express.Router();

// GET /api/analytics/sla-performance - PS and TA SLA percentages
router.get('/sla-performance', async (req, res) => {
  try {
    const pool = await getPool();
    const holidays = await loadHolidays(pool);

    // PS SLA: cases that were acted on within 3 business days
    const psResult = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN caseStatus != 'Active' OR terminationApproved = 1 OR investigationRequested = 1 THEN 1 ELSE 0 END) as actedOn
      FROM AttritionCases
      WHERE caseStatus = 'Active' OR caseStatus = 'Resolved'
    `);

    const psTotal = psResult.recordset[0]?.total || 0;
    const psActed = psResult.recordset[0]?.actedOn || 0;
    const psSlaRate = psTotal > 0 ? Math.round((psActed / psTotal) * 100) : 100;

    // TA SLA: relocations cleared by TA within 12 business days of PS clearance
    const taResult = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN taClearedDate IS NOT NULL THEN 1 ELSE 0 END) as cleared
      FROM RelocationRequests
      WHERE status != 'Cancelled'
    `);

    const taTotal = taResult.recordset[0]?.total || 0;
    const taCleared = taResult.recordset[0]?.cleared || 0;
    const taSlaRate = taTotal > 0 ? Math.round((taCleared / taTotal) * 100) : 100;

    // Relocation rate
    const relResult = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Relocated' THEN 1 ELSE 0 END) as relocated
      FROM RelocationRequests
    `);

    const relTotal = relResult.recordset[0]?.total || 0;
    const relRelocated = relResult.recordset[0]?.relocated || 0;
    const relocationRate = relTotal > 0 ? Math.round((relRelocated / relTotal) * 100) : 0;

    res.json({
      success: true,
      data: {
        psClearanceSla: psSlaRate,
        taClearanceSla: taSlaRate,
        relocationRate,
        psTotal,
        psActed,
        taTotal,
        taCleared,
        relTotal,
        relRelocated,
      },
    });
  } catch (error) {
    console.error('[GET /api/analytics/sla-performance] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch SLA performance' });
  }
});

// GET /api/analytics/case-counts - Counts by status/risk/severity
router.get('/case-counts', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;

    let whereClause = '';
    if (user.role === 'Trainer') {
      whereClause = `WHERE LOWER(trainerEmail) = '${user.email.replace(/'/g, "''")}'`;
    }

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN caseStatus = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN riskStatus = 'Critical' OR severityLevel = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN riskStatus = 'High Risk' THEN 1 ELSE 0 END) as highRisk,
        SUM(CASE WHEN riskStatus = 'Monitoring' THEN 1 ELSE 0 END) as monitoring,
        SUM(CASE WHEN lifecycleStage = 'Termination Recommended' THEN 1 ELSE 0 END) as terminations,
        SUM(CASE WHEN investigationRequested = 1 AND terminationApproved = 0 THEN 1 ELSE 0 END) as investigations,
        SUM(CASE WHEN overdueFlag = 1 AND caseStatus = 'Active' THEN 1 ELSE 0 END) as overdue
      FROM AttritionCases ${whereClause}
    `);

    const relResult = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'PSCleared' THEN 1 ELSE 0 END) as psCleared,
        SUM(CASE WHEN status = 'Relocated' THEN 1 ELSE 0 END) as relocated,
        SUM(CASE WHEN overdueFlag = 1 THEN 1 ELSE 0 END) as overdue
      FROM RelocationRequests
    `);

    const c = result.recordset[0] || {};
    const r = relResult.recordset[0] || {};

    res.json({
      success: true,
      data: {
        cases: {
          total: c.total || 0,
          active: c.active || 0,
          critical: c.critical || 0,
          highRisk: c.highRisk || 0,
          monitoring: c.monitoring || 0,
          terminations: c.terminations || 0,
          investigations: c.investigations || 0,
          overdue: c.overdue || 0,
        },
        relocations: {
          total: r.total || 0,
          submitted: r.submitted || 0,
          psCleared: r.psCleared || 0,
          relocated: r.relocated || 0,
          overdue: r.overdue || 0,
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/analytics/case-counts] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch case counts' });
  }
});

module.exports = router;
