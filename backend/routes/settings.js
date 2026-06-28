const express = require('express');
const { getPool } = require('../db/index');
const sql = require('mssql');
const router = express.Router();

// GET /api/settings - Fetch user settings
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;

    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());

    const result = await request.query(`
      SELECT settings, lastSeenAt
      FROM Users
      WHERE LOWER(email) = @email
    `);

    let settings = null;
    let lastSeenAt = null;

    if (result.recordset.length > 0) {
      const row = result.recordset[0];
      try {
        settings = row.settings ? JSON.parse(row.settings) : null;
      } catch { settings = null; }
      lastSeenAt = row.lastSeenAt;
    }

    // Update lastSeenAt
    try {
      const updateReq = pool.request();
      updateReq.input('email', sql.NVarChar(255), user.email.toLowerCase());
      updateReq.input('lastSeenAt', new Date().toISOString());
      await updateReq.query(`
        UPDATE Users SET lastSeenAt = @lastSeenAt WHERE LOWER(email) = @email
      `);
    } catch { /* ignore */ }

    res.json({
      success: true,
      data: {
        settings: settings || {
          theme: 'light',
          notifications: true,
          emailNotifications: true,
          soundEffects: false,
          compactMode: false,
        },
        lastSeenAt,
      },
    });
  } catch (error) {
    console.error('[GET /api/settings] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update user settings
router.put('/', async (req, res) => {
  try {
    const pool = await getPool();
    const user = req.user;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ success: false, error: 'Settings object required' });
    }

    const settingsJson = JSON.stringify(settings);
    const request = pool.request();
    request.input('email', sql.NVarChar(255), user.email.toLowerCase());
    request.input('settings', sql.NVarChar(sql.MAX), settingsJson);

    // Try to update; if user row doesn't exist, try to create it
    const checkResult = await request.query(`
      SELECT id FROM Users WHERE LOWER(email) = @email
    `);

    if (checkResult.recordset.length > 0) {
      await request.query(`
        UPDATE Users SET settings = @settings WHERE LOWER(email) = @email
      `);
    } else {
      const insertReq = pool.request();
      insertReq.input('email', sql.NVarChar(255), user.email.toLowerCase());
      insertReq.input('displayName', user.displayName || user.email.split('@')[0]);
      insertReq.input('role', sql.NVarChar(50), user.role || 'Trainer');
      insertReq.input('settings', sql.NVarChar(sql.MAX), settingsJson);
      await insertReq.query(`
        INSERT INTO Users (email, displayName, role, settings)
        VALUES (@email, @displayName, @role, @settings)
      `);
    }

    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('[PUT /api/settings] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

module.exports = router;
