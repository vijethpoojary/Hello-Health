// app.js
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.GIT_SHA || 'dev'
  });
});

module.exports = app;
