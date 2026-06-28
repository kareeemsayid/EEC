const express = require('express');
const router = express.Router();

// Permission mappings by role
const PERMISSIONS = {
  Trainer: {
    canComment: false,
    canApproveTermination: false,
    canRequestInvestigation: true,
    canViewAllCases: false,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: false,
  },
  PS: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: true,
    canClearTA: true,
    canResolveCase: true,
  },
  TA: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: true,
    canClearTA: true,
    canResolveCase: true,
  },
  Supervisor: {
    canComment: true,
    canApproveTermination: false,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: false,
  },
  Manager: {
    canComment: true,
    canApproveTermination: false,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: false,
  },
  SrManager: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: true,
  },
  Admin: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: true,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: true,
    canClearTA: true,
    canResolveCase: true,
  },
};

// GET /api/user/me - Get current user info with permissions
router.get('/me', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, displayName, role, assignedAccounts, assignedLOBs } = req.user;

    // Get permissions for this role, default to Trainer permissions
    const permissions = PERMISSIONS[role] || PERMISSIONS.Trainer;

    res.json({
      email,
      displayName,
      role,
      assignedAccounts,
      assignedLOBs,
      permissions,
    });
  } catch (error) {
    console.error('[GET /api/user/me] Error:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// GET /api/users - List all users (for trainer dropdowns etc.)
router.get('/', async (req, res) => {
  try {
    const { getPool } = require('../db/index');
    const pool = await getPool();
    const { role } = req.query;

    const request = pool.request();
    let query = `SELECT email, displayName, role FROM Users WHERE active = 1 OR active IS NULL`;
    if (role) {
      request.input('role', role);
      query += ` AND role = @role`;
    }
    query += ` ORDER BY displayName`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('[GET /api/users] Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
