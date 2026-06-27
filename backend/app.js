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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Mount user routes
app.use('/api/user', userRoutes);

// Mount relocations routes (counts must be before :id in the router definition)
app.use('/api/relocations', relocationsRoutes);

// Mount cases routes (counts must be before :id in the router definition)
app.use('/api/cases', casesRoutes);

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

// 3. GET /api/sites - Fetch all sites (FIXED)
app.get('/api/sites', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id AS id, SiteName AS title, Region AS region
      FROM Sites
      ORDER BY Region, SiteName
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
module.exports.PORT = PORT;
module.exports.getPool = getPool;
