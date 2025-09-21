const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.send(`
    <h1 style="color:blue;">Hello, I'm Vijeth </h1>
    <pre>${JSON.stringify({
      status: 'ok',
      version: process.env.GIT_SHA || 'dev'
    }, null, 2)}</pre>
  `);
});

app.get('/', (req, res) => {
  res.redirect('/health');
});

module.exports = app;
