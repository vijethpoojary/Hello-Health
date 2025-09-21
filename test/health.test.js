// test/health.test.js
const request = require('supertest');
const app = require('../app');

test('GET /health returns status ok and version', async () => {
  const res = await request(app).get('/health').expect(200);
  expect(res.body.status).toBe('ok');
  expect(res.body.version).toBeDefined();
});
