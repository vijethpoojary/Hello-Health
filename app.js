const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.GIT_SHA || 'dev'
  });
});

app.get('/', (req, res) => {
  res.send(`
    <h1 style="font-family:sans-serif; color:blue">Hello, I'm Vijeth 🚀</h1>
    <pre>${JSON.stringify({
      status: 'ok',
      version: process.env.GIT_SHA || 'dev'
    }, null, 2)}</pre>
  `);
});

module.exports = app;
