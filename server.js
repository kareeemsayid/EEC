require('dotenv').config({ path: './backend/.env' });
process.env.PORT = process.env.PORT || '5000';

const path = require('path');
const backendApp = require('./backend/app');

const PORT = 5000;

backendApp.use(require('express').static(path.join(__dirname, 'build')));

backendApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

backendApp.listen(PORT, '0.0.0.0', () => {
  console.log(`EEC production server running on http://0.0.0.0:${PORT}`);
  console.log(`API health: http://0.0.0.0:${PORT}/api/health`);
});
