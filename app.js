const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || '1.0.0';
const BUILD_ID = process.env.BUILD_ID || 'local';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/info', (req, res) => {
  res.json({
    status: 'running',
    version: VERSION,
    build: BUILD_ID,
    timestamp: new Date().toISOString(),
    pipeline: 'Jenkins → DockerHub → AWS EC2'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`🚀 App running on port ${PORT}`);
  console.log(`📦 Version: ${VERSION} | Build: ${BUILD_ID}`);
});
