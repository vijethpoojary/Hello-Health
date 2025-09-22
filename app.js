const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.GIT_SHA || 'dev'
  });
});

// Redirect root / to /health  (redirect->health)
app.get('/', (req, res) => {
  res.redirect('/health');
});

module.exports = app;
