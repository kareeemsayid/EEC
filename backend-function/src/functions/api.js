const sql = require('mssql');

const config = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  requestTimeout: 30000,
};

async function getPool() {
  return sql.connect(config);
}

module.exports = async function (context, req) {
  try {
    const pool = await getPool();
    const path = req.query.path || req.body?.path || '';

    switch (path) {
      case 'accounts': {
        const result = await pool.request().query('SELECT id, name FROM accounts ORDER BY name');
        context.res = { status: 200, body: result.recordset };
        break;
      }
      case 'lobs': {
        const accountId = req.query.accountId;
        const request = pool.request();
        if (accountId) {
          request.input('accountId', sql.Int, accountId);
          const result = await request.query('SELECT id, name, accountId FROM lobs WHERE accountId = @accountId ORDER BY name');
          context.res = { status: 200, body: result.recordset };
        } else {
          const result = await request.query('SELECT id, name, accountId FROM lobs ORDER BY name');
          context.res = { status: 200, body: result.recordset };
        }
        break;
      }
      case 'sites': {
        const result = await pool.request().query('SELECT id, name FROM sites ORDER BY name');
        context.res = { status: 200, body: result.recordset };
        break;
      }
      case 'roles': {
        const email = req.query.email;
        if (!email) {
          context.res = { status: 400, body: { error: 'Email parameter required' } };
          break;
        }
        const request = pool.request();
        request.input('email', sql.NVarChar, email);
        const result = await request.query('SELECT role FROM users WHERE email = @email');
        context.res = { status: 200, body: { role: result.recordset[0]?.role || 'Trainer' } };
        break;
      }
      case 'supervisorAccounts': {
        const email = req.query.email;
        if (!email) {
          context.res = { status: 400, body: { error: 'Email parameter required' } };
          break;
        }
        const request = pool.request();
        request.input('email', sql.NVarChar, email);
        const result = await request.query('SELECT accountId FROM supervisor_accounts WHERE email = @email');
        context.res = { status: 200, body: result.recordset };
        break;
      }
      case 'cases': {
        const trainerEmail = req.query.trainerEmail;
        if (!trainerEmail) {
          context.res = { status: 400, body: { error: 'trainerEmail parameter required' } };
          break;
        }
        const request = pool.request();
        request.input('trainerEmail', sql.NVarChar, trainerEmail);
        const result = await request.query('SELECT * FROM cases WHERE trainerEmail = @trainerEmail ORDER BY createdAt DESC');
        context.res = { status: 200, body: result.recordset };
        break;
      }
      case 'cases/all': {
        const result = await pool.request().query('SELECT * FROM cases ORDER BY createdAt DESC');
        context.res = { status: 200, body: result.recordset };
        break;
      }
      case 'cases/account': {
        const accountId = req.query.accountId;
        if (!accountId) {
          context.res = { status: 400, body: { error: 'accountId parameter required' } };
          break;
        }
        const request = pool.request();
        request.input('accountId', sql.Int, accountId);
        const result = await request.query('SELECT * FROM cases WHERE accountId = @accountId ORDER BY createdAt DESC');
        context.res = { status: 200, body: result.recordset };
        break;
      }
      default:
        context.res = { status: 400, body: { error: 'Unknown path', available: ['accounts', 'lobs', 'sites', 'roles', 'supervisorAccounts', 'cases', 'cases/all', 'cases/account'] } };
    }
  } catch (error) {
    context.log.error('SQL Error:', error);
    context.res = { status: 500, body: { error: 'Internal server error', detail: error.message } };
  }
};
