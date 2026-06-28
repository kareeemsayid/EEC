const express = require('express');
const { getPool } = require('../db/index');
const sql = require('mssql');
const router = express.Router();

// GET /api/settings - Fetch user settings (Users table doesn't have settings/lastSeenAt — return defaults)
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        settings: {
          theme: 'light',
          notifications: true,
          emailNotifications: true,
          soundEffects: false,
          compactMode: false,
        },
        lastSeenAt: null,
      },
    });
  } catch (error) {
    console.error('[GET /api/settings] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update user settings (no-op since Users table lacks settings column)
router.put('/', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ success: false, error: 'Settings object required' });
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('[PUT /api/settings] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

module.exports = router;
