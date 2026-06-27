const crypto = require('crypto');

// Returns current date in Africa/Cairo timezone as 'YYYYMMDD'
function cairoDateCompact(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replace(/-/g, '');
}

// Returns current year in Africa/Cairo timezone
function cairoYear(date = new Date()) {
  return parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
  }).format(date), 10);
}

// Format: RR-YYYYMMDD-[5 random hex chars], e.g. RR-20260625-f930c
function generateRelocationId() {
  const dateStr = cairoDateCompact();
  const hex = crypto.randomBytes(3).toString('hex').slice(0, 5);
  return `RR-${dateStr}-${hex}`;
}

// Format: ATT-YYYY-XXXX (sequential, padded to 4 digits)
// Uses AttritionSequence table with atomic transaction-based increment
async function generateCaseNumber(pool) {
  const year = cairoYear();
  const prefix = 'ATT';
  const sql = require('mssql');

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const req = new sql.Request(transaction);

    // Create table if not exists
    await req.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AttritionSequence')
      CREATE TABLE AttritionSequence (yearKey INT PRIMARY KEY, lastSeq INT DEFAULT 0)
    `);

    // Insert row for current year if not exists
    await req.query(`
      IF NOT EXISTS (SELECT 1 FROM AttritionSequence WHERE yearKey = ${year})
      INSERT INTO AttritionSequence (yearKey, lastSeq) VALUES (${year}, 0)
    `);

    // Atomically increment and get the new value
    const result = await req.query(`
      UPDATE AttritionSequence
      SET lastSeq = lastSeq + 1
      OUTPUT INSERTED.lastSeq
      WHERE yearKey = ${year}
    `);

    const nextSeq = result.recordset[0].lastSeq;
    await transaction.commit();

    return `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  generateRelocationId,
  generateCaseNumber,
};
