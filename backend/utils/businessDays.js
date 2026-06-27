// Egyptian public holidays (fixed dates — Eid dates are configurable via HolidayCalendar table)
const EGYPT_HOLIDAYS = {
  2025: ['2025-01-07', '2025-01-25', '2025-04-25', '2025-05-01', '2025-06-30', '2025-07-23', '2025-10-06'],
  2026: ['2026-01-07', '2026-01-25', '2026-04-25', '2026-05-01', '2026-06-30', '2026-07-23', '2026-10-06'],
};

// Returns current date in Africa/Cairo timezone as 'YYYY-MM-DD'
function cairoDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Returns day of week in Africa/Cairo (0=Sunday ... 6=Saturday)
function cairoDayOfWeek(date) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = cairoDate(d).split('-');
  const local = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return local.getDay();
}

// Normalize any input to a 'YYYY-MM-DD' string
function toDateString(date) {
  if (date instanceof Date) return cairoDate(date);
  if (typeof date === 'string') return date;
  return cairoDate(new Date(date));
}

// Build the full holiday set: hardcoded Egyptian holidays + custom holidays from DB
function buildHolidaySet(holidays = []) {
  const set = new Set();
  for (const year of Object.keys(EGYPT_HOLIDAYS)) {
    for (const h of EGYPT_HOLIDAYS[year]) set.add(h);
  }
  for (const h of holidays) set.add(toDateString(h));
  return set;
}

// Returns true if date is Mon-Fri and not in holidays array
function isBusinessDay(date, holidays = []) {
  const dow = cairoDayOfWeek(date);
  if (dow === 0 || dow === 6) return false;
  const set = buildHolidaySet(holidays);
  return !set.has(toDateString(date));
}

// Returns the date that is numDays business days after startDate (skips weekends + holidays)
function addBusinessDays(startDate, numDays, holidays = []) {
  const ds = toDateString(startDate);
  const parts = ds.split('-').map(Number);
  let current = new Date(parts[0], parts[1] - 1, parts[2]);
  const set = buildHolidaySet(holidays);

  let remaining = numDays;
  while (remaining > 0) {
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    const ds2 = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6 && !set.has(ds2)) {
      remaining--;
    }
  }
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
}

// Returns number of business days between two dates (exclusive of startDate, inclusive of endDate)
function businessDaysBetween(startDate, endDate, holidays = []) {
  const startParts = toDateString(startDate).split('-').map(Number);
  const endParts = toDateString(endDate).split('-').map(Number);
  let current = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
  const set = buildHolidaySet(holidays);

  let count = 0;
  while (current < end) {
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    const ds = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6 && !set.has(ds)) {
      count++;
    }
  }
  return count;
}

// Returns SLA deadline info
function getSLADeadline(submittedDate, slaDays, holidays = []) {
  const deadline = addBusinessDays(submittedDate, slaDays, holidays);
  const today = cairoDate(new Date());

  const daysElapsed = businessDaysBetween(submittedDate, today, holidays);
  const daysRemaining = businessDaysBetween(today, deadline, holidays);
  const isOverdue = daysRemaining < 0;
  const overdueBy = isOverdue ? Math.abs(daysRemaining) : 0;

  return { deadline, daysElapsed, daysRemaining, isOverdue, overdueBy };
}

// Queries HolidayCalendar table, returns array of date strings 'YYYY-MM-DD'
async function loadHolidays(pool) {
  try {
    const result = await pool.request().query(`
      SELECT holidayDate FROM HolidayCalendar
      WHERE holidayDate IS NOT NULL
      ORDER BY holidayDate ASC
    `);
    return result.recordset.map(row => {
      const d = row.holidayDate;
      if (d instanceof Date) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return toDateString(d);
    });
  } catch (err) {
    console.error('[businessDays] Could not load HolidayCalendar:', err.message);
    return [];
  }
}

module.exports = {
  EGYPT_HOLIDAYS,
  isBusinessDay,
  addBusinessDays,
  businessDaysBetween,
  getSLADeadline,
  loadHolidays,
};
