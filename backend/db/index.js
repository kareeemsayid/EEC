const sql = require('mssql');

let pool = null;

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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

module.exports = { getPool };
