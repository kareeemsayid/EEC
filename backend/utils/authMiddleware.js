const { getPool } = require('../db/index');

async function authMiddleware(req, res, next) {
  try {
    // Get user email from EasyAuth header, Authorization header, or dev env var
    let email = req.headers['x-ms-client-principal-name'];

    if (!email) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // For development/testing - assume email is passed in token position
        email = authHeader.substring(7);
      }
    }

    if (!email && process.env.DEV_USER_EMAIL) {
      email = process.env.DEV_USER_EMAIL;
    }

    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: No user email provided' });
    }

    email = email.toLowerCase().trim();

    // Check if email is a valid Concentrix email
    if (!email.endsWith('@concentrix.com')) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only Concentrix employees can access this application'
      });
    }

    const pool = await getPool();

    // Default user object
    let user = {
      email,
      displayName: email.split('@')[0],
      role: 'Trainer',
      assignedAccounts: [],
      assignedLOBs: [],
    };

    // Try to query Users table if it exists
    try {
      const userRequest = pool.request();
      userRequest.input('email', email);
      const userResult = await userRequest.query(`
        SELECT email, displayName, role FROM Users
        WHERE LOWER(email) = @email
      `);

      if (userResult.recordset.length > 0) {
        user = {
          email: userResult.recordset[0].email || email,
          displayName: userResult.recordset[0].displayName || email.split('@')[0],
          role: userResult.recordset[0].role || 'Trainer',
          assignedAccounts: [],
          assignedLOBs: [],
        };
      } else {
        // Check BlockedEmails table if it exists
        try {
          const blockedRequest = pool.request();
          blockedRequest.input('email', email);
          const blockedResult = await blockedRequest.query(`
            SELECT email FROM BlockedEmails WHERE LOWER(email) = @email
          `);

          if (blockedResult.recordset.length > 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'Your account has been blocked from accessing this application'
            });
          }
        } catch (blockedErr) {
          // BlockedEmails table may not exist, continue
          console.log('[authMiddleware] BlockedEmails table not found, skipping check');
        }

        // Auto-create user with Trainer role if Users table exists
        try {
          const insertRequest = pool.request();
          insertRequest.input('email', email);
          insertRequest.input('displayName', email.split('@')[0]);
          insertRequest.input('role', 'Trainer');

          await insertRequest.query(`
            INSERT INTO Users (email, displayName, role)
            VALUES (@email, @displayName, @role)
          `);
        } catch (insertErr) {
          // Users table may not exist, use default Trainer role
          console.log('[authMiddleware] Could not auto-create user, using defaults');
        }
      }
    } catch (userErr) {
      // Users table may not exist, use default Trainer role
      console.log('[authMiddleware] Users table not found, using default Trainer role');
    }

    // Fetch assignedAccounts and assignedLOBs based on role
    if (user.role === 'Supervisor') {
      try {
        const lobRequest = pool.request();
        lobRequest.input('email', email);
        const lobResult = await lobRequest.query(`
          SELECT lobId FROM SupervisorLOBs
          WHERE LOWER(supervisorEmail) = @email
        `);
        user.assignedLOBs = lobResult.recordset.map(row => row.lobId);
      } catch (lobErr) {
        // SupervisorLOBs table may not exist
        console.log('[authMiddleware] SupervisorLOBs table not found');
      }
    } else if (user.role === 'Manager' || user.role === 'SrManager') {
      try {
        const accountRequest = pool.request();
        accountRequest.input('email', email);
        const accountResult = await accountRequest.query(`
          SELECT accountId FROM ManagerAccounts
          WHERE LOWER(managerEmail) = @email
        `);
        user.assignedAccounts = accountResult.recordset.map(row => row.accountId);
      } catch (accountErr) {
        // ManagerAccounts table may not exist
        console.log('[authMiddleware] ManagerAccounts table not found');
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[authMiddleware] Error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
}

module.exports = authMiddleware;
