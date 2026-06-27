// backend/local.js
// Local development runner. Start with `npm run dev`.
// azure-functions-core-tools is NOT required for local Express testing.
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`EEC Backend API (local) running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
