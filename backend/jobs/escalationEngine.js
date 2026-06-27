const cron = require('node-cron');
const { addBusinessDays, loadHolidays } = require('../utils/businessDays');
const { notifyCaseOverdue } = require('../services/emailService');
const { sendCaseTeamsNotification } = require('../services/teamsNotification');
const { sendRelocationOverdue } = require('../services/relocationEmail');

const SR_MANAGER_EMAIL = 'abdelrahmankadrimohamed.yassin@concentrix.com';

// ─── Get date string N business days ago ──────────────────
function businessDaysAgo(numDays, holidays = []) {
  // addBusinessDays adds days from a start date; we need to go backwards
  // So we compute: today - numDays business days
  const today = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(today);

  // Start from today and subtract calendar days, checking business days
  const parts = todayStr.split('-').map(Number);
  let current = new Date(parts[0], parts[1] - 1, parts[2]);
  const holidaySet = new Set(holidays);

  let remaining = numDays;
  while (remaining > 0) {
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1);
    const ds = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6 && !holidaySet.has(ds)) {
      remaining--;
    }
  }
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
}

// ─── Check if escalation was already sent today ───────────
function wasEscalatedToday(record) {
  if (!record.lastEscalationDate) return false;
  try {
    const last = new Date(record.lastEscalationDate);
    const today = new Date();
    return last.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

// ─── Attrition escalation checks ──────────────────────────
async function checkAttritionEscalations(pool, holidays) {
  const results = { rule1: 0, rule2: 0, rule3: 0 };

  // Rule 1: Submitted cases with no PS action in 3 business days
  const cutoff3 = businessDaysAgo(3, holidays);
  try {
    const result = await pool.request().query(`
      SELECT * FROM AttritionCases
      WHERE caseStatus = 'Active' AND terminationApproved = 0
      AND investigationRequested = 0
      AND submittedDate < '${cutoff3}'
    `);

    for (const caseData of result.recordset) {
      if (wasEscalatedToday(caseData)) continue;

      try {
        const overdueBy = Math.ceil(
          (new Date() - new Date(caseData.submittedDate)) / (1000 * 60 * 60 * 24)
        );
        await notifyCaseOverdue(pool, caseData, overdueBy);
        await sendCaseTeamsNotification(caseData, 'overdue');

        // Update overdue flag
        const req = pool.request();
        req.input('caseId', caseData.id || caseData.caseNumber);
        await req.query(`
          UPDATE AttritionCases SET overdueFlag = 1, lastEscalationDate = GETDATE()
          WHERE id = @caseId OR caseNumber = @caseId
        `);
        results.rule1++;
      } catch (err) {
        console.error('[escalationEngine] Rule 1 escalation failed:', err.message);
      }
    }
  } catch (err) {
    console.error('[escalationEngine] Rule 1 query failed:', err.message);
  }

  // Rule 2: Investigation requested but no PS action in 2 business days
  const cutoff2 = businessDaysAgo(2, holidays);
  try {
    const result = await pool.request().query(`
      SELECT * FROM AttritionCases
      WHERE investigationRequested = 1 AND investigationDate < '${cutoff2}'
      AND terminationApproved = 0
    `);

    for (const caseData of result.recordset) {
      if (wasEscalatedToday(caseData)) continue;

      try {
        const overdueBy = Math.ceil(
          (new Date() - new Date(caseData.investigationDate)) / (1000 * 60 * 60 * 24)
        );
        await notifyCaseOverdue(pool, caseData, overdueBy);
        await sendCaseTeamsNotification(caseData, 'overdue');

        const req = pool.request();
        req.input('caseId', caseData.id || caseData.caseNumber);
        await req.query(`
          UPDATE AttritionCases SET lastEscalationDate = GETDATE()
          WHERE id = @caseId OR caseNumber = @caseId
        `);
        results.rule2++;
      } catch (err) {
        console.error('[escalationEngine] Rule 2 escalation failed:', err.message);
      }
    }
  } catch (err) {
    console.error('[escalationEngine] Rule 2 query failed:', err.message);
  }

  // Rule 3: Cases open > 30 business days → SrManager
  const cutoff30 = businessDaysAgo(30, holidays);
  try {
    const result = await pool.request().query(`
      SELECT * FROM AttritionCases
      WHERE caseStatus = 'Active' AND submittedDate < '${cutoff30}'
    `);

    for (const caseData of result.recordset) {
      if (wasEscalatedToday(caseData)) continue;

      try {
        // Send to SrManager directly
        const { sendEmail } = require('../services/emailService');
        const overdueBy = Math.ceil(
          (new Date() - new Date(caseData.submittedDate)) / (1000 * 60 * 60 * 24)
        );
        await sendEmail({
          to: [SR_MANAGER_EMAIL],
          cc: [],
          subject: `[EEC] SR MANAGER ESCALATION | #${caseData.caseNumber} — ${caseData.traineeName} | Open ${overdueBy} days`,
          html: `<p>This case has been open for over 30 business days and requires senior management attention.</p>
                 <p>Case: ${caseData.caseNumber} | Trainee: ${caseData.traineeName} | Account: ${caseData.account}</p>
                 <p><a href="${process.env.APP_BASE_URL || ''}/cases/${caseData.id || caseData.caseNumber || ''}">Open in EEC</a></p>`,
        });

        const req = pool.request();
        req.input('caseId', caseData.id || caseData.caseNumber);
        await req.query(`
          UPDATE AttritionCases SET lastEscalationDate = GETDATE()
          WHERE id = @caseId OR caseNumber = @caseId
        `);
        results.rule3++;
      } catch (err) {
        console.error('[escalationEngine] Rule 3 escalation failed:', err.message);
      }
    }
  } catch (err) {
    console.error('[escalationEngine] Rule 3 query failed:', err.message);
  }

  return results;
}

// ─── Relocation escalation checks ─────────────────────────
async function checkRelocationEscalations(pool, holidays) {
  const results = { rule1: 0, rule2: 0, rule3: 0 };

  // Rule 1: Submitted but no PS action in 2 business days
  const cutoff2 = businessDaysAgo(2, holidays);
  try {
    const result = await pool.request().query(`
      SELECT * FROM RelocationRequests
      WHERE status = 'Submitted' AND submittedDate < '${cutoff2}'
    `);

    for (const relocation of result.recordset) {
      if (wasEscalatedToday(relocation)) continue;

      try {
        const overdueBy = Math.ceil(
          (new Date() - new Date(relocation.submittedDate)) / (1000 * 60 * 60 * 24)
        );
        await sendRelocationOverdue(pool, relocation, overdueBy, 'PS');

        const req = pool.request();
        req.input('relocId', relocation.id || relocation.requestId);
        await req.query(`
          UPDATE RelocationRequests
          SET lastEscalationDate = GETDATE(),
              slaStatus = 'OVERDUE — PS Action Required',
              overdueFlag = 1
          WHERE id = @relocId OR requestId = @relocId
        `);
        results.rule1++;
      } catch (err) {
        console.error('[escalationEngine] Relocation Rule 1 failed:', err.message);
      }
    }
  } catch (err) {
    console.error('[escalationEngine] Relocation Rule 1 query failed:', err.message);
  }

  // Rule 2: PSCleared but no TA action in 12 business days
  const cutoff12 = businessDaysAgo(12, holidays);
  try {
    const result = await pool.request().query(`
      SELECT * FROM RelocationRequests
      WHERE status = 'PSCleared' AND psClearedDate < '${cutoff12}'
    `);

    for (const relocation of result.recordset) {
      if (wasEscalatedToday(relocation)) continue;

      try {
        const overdueBy = Math.ceil(
          (new Date() - new Date(relocation.psClearedDate)) / (1000 * 60 * 60 * 24)
        );
        await sendRelocationOverdue(pool, relocation, overdueBy, 'TA');

        const req = pool.request();
        req.input('relocId', relocation.id || relocation.requestId);
        await req.query(`
          UPDATE RelocationRequests
          SET lastEscalationDate = GETDATE(),
              slaStatus = '\uD83D\uDD34 ALERT! TA Action Overdue',
              priorityLogic = '1 \uD83D\uDD34 | \uD83D\uDEA8 Escalate To TA',
              overdueFlag = 1
          WHERE id = @relocId OR requestId = @relocId
        `);
        results.rule2++;
      } catch (err) {
        console.error('[escalationEngine] Relocation Rule 2 failed:', err.message);
      }
    }
  } catch (err) {
    console.error('[escalationEngine] Relocation Rule 2 query failed:', err.message);
  }

  // Rule 3: TACleared but not relocated in 10 business days
  const cutoff10 = businessDaysAgo(10, holidays);
  try {
    const result = await pool.request().query(`
      SELECT * FROM RelocationRequests
      WHERE status = 'TACleared' AND taClearedDate < '${cutoff10}'
    `);

    for (const relocation of result.recordset) {
      if (wasEscalatedToday(relocation)) continue;

      try {
        const overdueBy = Math.ceil(
          (new Date() - new Date(relocation.taClearedDate)) / (1000 * 60 * 60 * 24)
        );
        await sendRelocationOverdue(pool, relocation, overdueBy, 'Relocation');

        const req = pool.request();
        req.input('relocId', relocation.id || relocation.requestId);
        await req.query(`
          UPDATE RelocationRequests
          SET lastEscalationDate = GETDATE(),
              overdueFlag = 1
          WHERE id = @relocId OR requestId = @relocId
        `);
        results.rule3++;
      } catch (err) {
        console.error('[escalationEngine] Relocation Rule 3 failed:', err.message);
      }
    }
  } catch (err) {
    console.error('[escalationEngine] Relocation Rule 3 query failed:', err.message);
  }

  return results;
}

// ─── Main escalation runner ────────────────────────────────
async function runEscalationCheck(pool) {
  try {
    console.log('[escalationEngine] Running escalation check...');

    const holidays = await loadHolidays(pool);

    const attritionResults = await checkAttritionEscalations(pool, holidays);
    const relocationResults = await checkRelocationEscalations(pool, holidays);

    const summary = {
      attrition: attritionResults,
      relocation: relocationResults,
      total: attritionResults.rule1 + attritionResults.rule2 + attritionResults.rule3 +
             relocationResults.rule1 + relocationResults.rule2 + relocationResults.rule3,
    };

    console.log('[escalationEngine] Complete:', JSON.stringify(summary));
    return summary;
  } catch (err) {
    console.error('[escalationEngine] Error:', err.message);
    return { error: err.message };
  }
}

// ─── Schedule the cron job ────────────────────────────────
function scheduleEscalationEngine(pool) {
  // Every day at 07:00 Africa/Cairo
  cron.schedule('0 7 * * *', async () => {
    console.log('[escalationEngine] Cron triggered — running escalation check');
    await runEscalationCheck(pool);
  }, {
    timezone: 'Africa/Cairo',
  });

  console.log('[escalationEngine] Scheduled: daily at 07:00 Africa/Cairo');
}

module.exports = {
  runEscalationCheck,
  scheduleEscalationEngine,
  checkAttritionEscalations,
  checkRelocationEscalations,
  businessDaysAgo,
};
