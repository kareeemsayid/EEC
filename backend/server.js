// backend/server.js
// EEC Backend API - Node.js + Express + Azure SQL Database
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 5000;

// Database configuration
const dbConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection pool
let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. GET /api/accounts - Fetch all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, title, warningHours, criticalHours, documentGraceHours
      FROM Accounts
      ORDER BY title
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/accounts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// 2. GET /api/lobs - Fetch LOBs filtered by account
app.get('/api/lobs', async (req, res) => {
  try {
    const { accountId } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = 'SELECT id, title, accountId FROM LOBs';
    if (accountId) {
      query += ' WHERE accountId = @accountId';
      request.input('accountId', sql.NVarChar(50), accountId);
    }
    query += ' ORDER BY title';

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
      SELECT id, title, region
      FROM Sites
      ORDER BY region, title
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

    // Check PSUsers table first
    const psResult = await request.query(`
      SELECT role FROM PSUsers
      WHERE LOWER(email) = @email
    `);

    if (psResult.recordset.length > 0) {
      const role = psResult.recordset[0].role;
      return res.json({ role: role || 'PS' });
    }

    // Check Supervisors table
    const supervisorResult = await request.query(`
      SELECT role FROM Supervisors
      WHERE LOWER(email) = @email
    `);

    if (supervisorResult.recordset.length > 0) {
      const role = supervisorResult.recordset[0].role;
      return res.json({ role: role || 'Supervisor' });
    }

    // Check Managers table
    const managerResult = await request.query(`
      SELECT role FROM Managers
      WHERE LOWER(email) = @email
    `);

    if (managerResult.recordset.length > 0) {
      const role = managerResult.recordset[0].role;
      return res.json({ role: role || 'Manager' });
    }

    // Default to Trainer
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

    const result = await request.query(`
      SELECT sa.accountId, a.title as accountName
      FROM SupervisorAccounts sa
      JOIN Accounts a ON sa.accountId = a.id
      WHERE LOWER(sa.supervisorEmail) = @email
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/supervisorAccounts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor accounts' });
  }
});

// 6. GET /api/cases - Fetch cases for trainer
app.get('/api/cases', async (req, res) => {
  try {
    const { trainerEmail } = req.query;
    if (!trainerEmail) {
      return res.status(400).json({ error: 'trainerEmail parameter required' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('trainerEmail', sql.NVarChar(255), trainerEmail.toLowerCase());

    const result = await request.query(`
      SELECT
        id, caseNumber, traineeName, oracleId, personalEmail, workEmail,
        account, lob, site, wave, trainerName, trainerEmail,
        trainingManager, trainingManagerEmail, attritionCategory, subReason,
        severityLevel, totalMissedHours, riskStatus, lifecycleStage,
        incidentDate, hireDate, caseOpenedDate, lastUpdatedDate, caseStatus,
        notes, outlookConversationId, documentationRequired, escalationRequired,
        workdayActionTaken, terminationReason, localReason, effectiveDate,
        terminationSheetSent, leaverEmailSent, thresholdHours, openedBy
      FROM AttritionCases
      WHERE LOWER(trainerEmail) = @trainerEmail
      ORDER BY lastUpdatedDate DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/cases] Error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// 7. GET /api/cases/all - Fetch all cases (PS/SrManager)
app.get('/api/cases/all', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        id, caseNumber, traineeName, oracleId, personalEmail, workEmail,
        account, lob, site, wave, trainerName, trainerEmail,
        trainingManager, trainingManagerEmail, attritionCategory, subReason,
        severityLevel, totalMissedHours, riskStatus, lifecycleStage,
        incidentDate, hireDate, caseOpenedDate, lastUpdatedDate, caseStatus,
        notes, outlookConversationId, documentationRequired, escalationRequired,
        workdayActionTaken, terminationReason, localReason, effectiveDate,
        terminationSheetSent, leaverEmailSent, thresholdHours, openedBy
      FROM AttritionCases
      ORDER BY lastUpdatedDate DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/cases/all] Error:', error);
    res.status(500).json({ error: 'Failed to fetch all cases' });
  }
});

// 8. GET /api/cases/account - Fetch cases by account (Supervisor/Manager)
app.get('/api/cases/account', async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) {
      return res.status(400).json({ error: 'accountId parameter required' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('accountId', sql.NVarChar(50), accountId);

    const result = await request.query(`
      SELECT
        id, caseNumber, traineeName, oracleId, personalEmail, workEmail,
        account, lob, site, wave, trainerName, trainerEmail,
        trainingManager, trainingManagerEmail, attritionCategory, subReason,
        severityLevel, totalMissedHours, riskStatus, lifecycleStage,
        incidentDate, hireDate, caseOpenedDate, lastUpdatedDate, caseStatus,
        notes, outlookConversationId, documentationRequired, escalationRequired,
        workdayActionTaken, terminationReason, localReason, effectiveDate,
        terminationSheetSent, leaverEmailSent, thresholdHours, openedBy
      FROM AttritionCases
      WHERE account = @accountId OR account IN (
        SELECT title FROM Accounts WHERE id = @accountId
      )
      ORDER BY lastUpdatedDate DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/cases/account] Error:', error);
    res.status(500).json({ error: 'Failed to fetch cases by account' });
  }
});

// Generate case number
async function generateCaseNumber(pool) {
  const year = new Date().getFullYear();
  const prefix = 'ATR';

  // Get the last case number for this year
  const result = await pool.request().query(`
    SELECT TOP 1 caseNumber
    FROM AttritionCases
    WHERE caseNumber LIKE '${prefix}-${year}-%'
    ORDER BY caseNumber DESC
  `);

  let nextNum = 1;
  if (result.recordset.length > 0) {
    const lastNum = parseInt(result.recordset[0].caseNumber.split('-')[2], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}-${year}-${String(nextNum).padStart(5, '0')}`;
}

// 9. POST /api/cases/create - Create new case
app.post('/api/cases/create', async (req, res) => {
  try {
    const pool = await getPool();
    const caseNumber = await generateCaseNumber(pool);
    const now = new Date().toISOString();

    const data = req.body;
    const request = pool.request();

    request.input('caseNumber', sql.NVarChar(50), caseNumber);
    request.input('traineeName', sql.NVarChar(255), data.traineeName || '');
    request.input('oracleId', sql.NVarChar(50), data.oracleId || '');
    request.input('personalEmail', sql.NVarChar(255), data.personalEmail || '');
    request.input('workEmail', sql.NVarChar(255), data.workEmail || '');
    request.input('account', sql.NVarChar(255), data.account || '');
    request.input('lob', sql.NVarChar(255), data.lob || '');
    request.input('site', sql.NVarChar(255), data.site || '');
    request.input('wave', sql.NVarChar(100), data.wave || '');
    request.input('trainerName', sql.NVarChar(255), data.trainerName || '');
    request.input('trainerEmail', sql.NVarChar(255), data.trainerEmail || '');
    request.input('trainingManager', sql.NVarChar(255), data.trainingManager || '');
    request.input('trainingManagerEmail', sql.NVarChar(255), data.trainingManagerEmail || '');
    request.input('attritionCategory', sql.NVarChar(255), data.attritionCategory || '');
    request.input('subReason', sql.NVarChar(500), data.subReason || '');
    request.input('severityLevel', sql.NVarChar(50), data.severityLevel || 'Low');
    request.input('totalMissedHours', sql.Int, data.totalMissedHours || 0);
    request.input('riskStatus', sql.NVarChar(50), data.riskStatus || 'Monitoring');
    request.input('lifecycleStage', sql.NVarChar(50), data.lifecycleStage || 'Monitoring');
    request.input('incidentDate', sql.NVarChar(50), data.incidentDate || '');
    request.input('hireDate', sql.NVarChar(50), data.hireDate || '');
    request.input('caseStatus', sql.NVarChar(50), 'Active');
    request.input('notes', sql.NVarChar(sql.MAX), data.notes || '');
    request.input('outlookConversationId', sql.NVarChar(255), data.outlookConversationId || '');
    request.input('documentationRequired', sql.Bit, data.documentationRequired || false);
    request.input('escalationRequired', sql.Bit, data.escalationRequired || false);
    request.input('thresholdHours', sql.Int, data.thresholdHours || 24);
    request.input('openedBy', sql.NVarChar(255), data.openedBy || '');
    request.input('caseOpenedDate', sql.NVarChar(50), now);
    request.input('lastUpdatedDate', sql.NVarChar(50), now);

    const insertResult = await request.query(`
      INSERT INTO AttritionCases (
        caseNumber, traineeName, oracleId, personalEmail, workEmail,
        account, lob, site, wave, trainerName, trainerEmail,
        trainingManager, trainingManagerEmail, attritionCategory, subReason,
        severityLevel, totalMissedHours, riskStatus, lifecycleStage,
        incidentDate, hireDate, caseOpenedDate, lastUpdatedDate, caseStatus,
        notes, outlookConversationId, documentationRequired, escalationRequired,
        thresholdHours, openedBy
      )
      OUTPUT INSERTED.id
      VALUES (
        @caseNumber, @traineeName, @oracleId, @personalEmail, @workEmail,
        @account, @lob, @site, @wave, @trainerName, @trainerEmail,
        @trainingManager, @trainingManagerEmail, @attritionCategory, @subReason,
        @severityLevel, @totalMissedHours, @riskStatus, @lifecycleStage,
        @incidentDate, @hireDate, @caseOpenedDate, @lastUpdatedDate, @caseStatus,
        @notes, @outlookConversationId, @documentationRequired, @escalationRequired,
        @thresholdHours, @openedBy
      )
    `);

    const newId = insertResult.recordset[0].id;

    res.status(201).json({
      success: true,
      id: newId,
      caseNumber,
      message: 'Case created successfully'
    });
  } catch (error) {
    console.error('[POST /api/cases/create] Error:', error);
    res.status(500).json({ error: 'Failed to create case', details: error.message });
  }
});

// 10. POST /api/cases/update - Update case + insert into CaseUpdates
app.post('/api/cases/update', async (req, res) => {
  try {
    const pool = await getPool();
    const data = req.body;
    const now = new Date().toISOString();

    if (!data.id && !data.caseNumber) {
      return res.status(400).json({ error: 'Case id or caseNumber required' });
    }

    // Fetch current case for update logging
    const fetchRequest = pool.request();
    let fetchQuery = 'SELECT * FROM AttritionCases WHERE ';
    if (data.id) {
      fetchRequest.input('id', sql.NVarChar(50), data.id);
      fetchQuery += 'id = @id';
    } else {
      fetchRequest.input('caseNumber', sql.NVarChar(50), data.caseNumber);
      fetchQuery += 'caseNumber = @caseNumber';
    }
    const currentResult = await fetchRequest.query(fetchQuery);

    if (currentResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const currentCase = currentResult.recordset[0];
    const caseId = currentCase.id;

    // Build update query dynamically
    const updateFields = [];
    const updateRequest = pool.request();
    updateRequest.input('lastUpdatedDate', sql.NVarChar(50), now);

    const fieldMapping = {
      riskStatus: 'riskStatus',
      lifecycleStage: 'lifecycleStage',
      totalMissedHours: { field: 'totalMissedHours', type: sql.Int },
      caseStatus: 'caseStatus',
      notes: { field: 'notes', type: sql.NVarChar(sql.MAX) },
      escalationRequired: { field: 'escalationRequired', type: sql.Bit },
      documentationRequired: { field: 'documentationRequired', type: sql.Bit },
      terminationReason: 'terminationReason',
      localReason: 'localReason',
      effectiveDate: 'effectiveDate',
      terminationSheetSent: { field: 'terminationSheetSent', type: sql.Bit },
      leaverEmailSent: { field: 'leaverEmailSent', type: sql.Bit },
      workdayActionTaken: { field: 'workdayActionTaken', type: sql.Bit },
    };

    for (const [key, config] of Object.entries(fieldMapping)) {
      if (data[key] !== undefined) {
        const fieldName = typeof config === 'string' ? config : config.field;
        const fieldType = typeof config === 'object' ? config.type : sql.NVarChar(255);
        updateRequest.input(key, fieldType, data[key]);
        updateFields.push(`${fieldName} = @${key}`);
      }
    }

    if (updateFields.length > 0) {
      updateRequest.input('id', sql.NVarChar(50), caseId);
      await updateRequest.query(`
        UPDATE AttritionCases
        SET ${updateFields.join(', ')}, lastUpdatedDate = @lastUpdatedDate
        WHERE id = @id
      `);
    }

    // Insert into CaseUpdates if update details provided
    if (data.updateType) {
      const updateInsert = pool.request();
      updateInsert.input('caseId', sql.NVarChar(50), caseId);
      updateInsert.input('caseNumber', sql.NVarChar(50), currentCase.caseNumber);
      updateInsert.input('oracleId', sql.NVarChar(50), currentCase.oracleId);
      updateInsert.input('traineeName', sql.NVarChar(255), currentCase.traineeName);
      updateInsert.input('updateType', sql.NVarChar(100), data.updateType || 'Manual Update');
      updateInsert.input('updatedBy', sql.NVarChar(255), data.updatedBy || '');
      updateInsert.input('updatedByEmail', sql.NVarChar(255), data.updatedByEmail || '');
      updateInsert.input('updateDate', sql.NVarChar(50), now);
      updateInsert.input('previousStage', sql.NVarChar(50), currentCase.lifecycleStage || '');
      updateInsert.input('newStage', sql.NVarChar(50), data.lifecycleStage || currentCase.lifecycleStage || '');
      updateInsert.input('previousRisk', sql.NVarChar(50), currentCase.riskStatus || '');
      updateInsert.input('newRisk', sql.NVarChar(50), data.riskStatus || currentCase.riskStatus || '');
      updateInsert.input('hoursAdded', sql.Int, data.hoursAdded || 0);
      updateInsert.input('previousTotalHours', sql.Int, currentCase.totalMissedHours || 0);
      updateInsert.input('newTotalHours', sql.Int, data.totalMissedHours || currentCase.totalMissedHours || 0);
      updateInsert.input('updateNotes', sql.NVarChar(sql.MAX), data.updateNotes || '');
      updateInsert.input('emailSent', sql.Bit, data.emailSent || false);

      await updateInsert.query(`
        INSERT INTO CaseUpdates (
          caseId, caseNumber, oracleId, traineeName, updateType,
          updatedBy, updatedByEmail, updateDate, previousStage, newStage,
          previousRisk, newRisk, hoursAdded, previousTotalHours, newTotalHours,
          updateNotes, emailSent
        )
        VALUES (
          @caseId, @caseNumber, @oracleId, @traineeName, @updateType,
          @updatedBy, @updatedByEmail, @updateDate, @previousStage, @newStage,
          @previousRisk, @newRisk, @hoursAdded, @previousTotalHours, @newTotalHours,
          @updateNotes, @emailSent
        )
      `);
    }

    res.json({
      success: true,
      caseNumber: currentCase.caseNumber,
      message: 'Case updated successfully'
    });
  } catch (error) {
    console.error('[POST /api/cases/update] Error:', error);
    res.status(500).json({ error: 'Failed to update case', details: error.message });
  }
});

// Get case by case number or Oracle ID
app.get('/api/cases/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('identifier', sql.NVarChar(100), identifier);

    const result = await request.query(`
      SELECT *
      FROM AttritionCases
      WHERE caseNumber = @identifier OR oracleId = @identifier
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('[GET /api/cases/:identifier] Error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Get updates for a case
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await getPool();
    console.log('Connected to Azure SQL Database');

    app.listen(PORT, () => {
      console.log(`EEC Backend API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.log('Starting server without database connection...');
    app.listen(PORT, () => {
      console.log(`EEC Backend API running on port ${PORT} (no DB connection)`);
    });
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});
