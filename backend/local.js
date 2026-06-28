// backend/local.js
// Local development runner. Start with `npm run dev`.
// azure-functions-core-tools is NOT required for local Express testing.
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`EEC Backend API (local) running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
});
