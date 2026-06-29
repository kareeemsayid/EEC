const ROLE_MAP = {
  trainer: 'Trainer',
  supervisor: 'Supervisor',
  manager: 'Manager',
  ps: 'PS',
  ta: 'TA',
  srmanager: 'SrManager',
  admin: 'Admin',
};

function normalizeRole(role) {
  if (!role || typeof role !== 'string') return 'Trainer';
  const trimmed = role.trim();
  const mapped = ROLE_MAP[trimmed.toLowerCase()];
  if (mapped) return mapped;
  if (Object.values(ROLE_MAP).includes(trimmed)) return trimmed;
  return 'Trainer';
}

module.exports = { normalizeRole };
