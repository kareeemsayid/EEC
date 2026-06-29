const sql = require('mssql');

let pool = null;
let connecting = false;

const dbConfig = {
  server: process.env.SQL_SERVER || process.env.DB_SERVER,
  database: process.env.SQL_DATABASE || process.env.DB_NAME,
  user: process.env.SQL_USER || process.env.DB_USER,
  password: process.env.SQL_PASSWORD || process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function getPool() {
  // Return healthy pool if it exists
  if (pool && pool.connected) {
    return pool;
  }

  // If a connection attempt is already in progress, wait for it
  if (connecting) {
    let attempts = 0;
    while (connecting && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (pool && pool.connected) return pool;
  }

  // Close any stale/errored pool
  if (pool) {
    try { await pool.close(); } catch (_) { /* ignore */ }
    pool = null;
  }

  connecting = true;
  try {
    pool = await sql.connect(dbConfig);

    // Reset on pool error so the next request reconnects
    pool.on('error', (err) => {
      console.error('[DB] Pool error — will reconnect on next request:', err.message);
      pool = null;
    });
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    pool = null;
    throw err;
  } finally {
    connecting = false;
  }

  return pool;
}

async function checkDbConnection() {
  try {
    const p = await getPool();
    await p.request().query('SELECT 1 AS ok');
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = { getPool, checkDbConnection };
