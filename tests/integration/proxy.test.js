const request = require('supertest');
const express = require('express');

// Mock backend server
function createMockBackend() {
  const app = express();
  
  app.get('/test', (req, res) => {
    res.json({
      message: 'Test endpoint',
      receivedHeaders: req.headers
    });
  });

  app.post('/api/data', (req, res) => {
    res.json({
      message: 'Data received',
      receivedHeaders: req.headers
    });
  });

  return app;
}

describe('Integration Tests - Full Proxy Flow', () => {
  let proxyApp;
  let backendApp;
  let backendServer;
  let HeaderManager;
  let apiRouter;

  beforeAll(() => {
    // Import modules
    HeaderManager = require('../../src/headerManager');
    apiRouter = require('../../src/api');
  });

  beforeEach((done) => {
    // Create mock backend
    backendApp = createMockBackend();
    backendServer = backendApp.listen(0, () => {
      const backendPort = backendServer.address().port;

      // Create proxy app
      const { createProxyMiddleware } = require('http-proxy-middleware');
      proxyApp = express();
      proxyApp.use(express.json());

      const headerManager = new HeaderManager();
      proxyApp.use('/api', apiRouter(headerManager));

      // Health check
      proxyApp.get('/health', (req, res) => {
        res.json({
          status: 'ok',
          rulesCount: headerManager.getRules().length
        });
      });

      // Proxy middleware
      proxyApp.use('/', createProxyMiddleware({
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        onProxyReq: (proxyReq, req) => {
          const modifications = headerManager.applyRequestHeaders(req.headers);

          Object.entries(modifications.add).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
          });

          Object.entries(modifications.modify).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
          });

          modifications.remove.forEach(key => {
            proxyReq.removeHeader(key);
          });
        },
        onProxyRes: (proxyRes) => {
          const modifications = headerManager.applyResponseHeaders(proxyRes.headers);

          Object.entries(modifications.add).forEach(([key, value]) => {
            proxyRes.headers[key.toLowerCase()] = value;
          });

          Object.entries(modifications.modify).forEach(([key, value]) => {
            proxyRes.headers[key.toLowerCase()] = value;
          });

          modifications.remove.forEach(key => {
            delete proxyRes.headers[key.toLowerCase()];
          });
        }
      }));

      done();
    });
  });

  afterEach((done) => {
    if (backendServer) {
      backendServer.close(done);
    } else {
      done();
    }
  });

  test('should proxy request without modifications when no rules exist', async () => {
    const response = await request(proxyApp)
      .get('/test')
      .set('User-Agent', 'TestAgent/1.0');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Test endpoint');
    expect(response.body.receivedHeaders['user-agent']).toBe('TestAgent/1.0');
  });

  test('should add authorization header to proxied request', async () => {
    // Add rule via API
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'Authorization': 'Bearer token123' }
      });

    // Make proxied request
    const response = await request(proxyApp).get('/test');

    expect(response.status).toBe(200);
    expect(response.body.receivedHeaders.authorization).toBe('Bearer token123');
  });

  test('should modify user-agent header in proxied request', async () => {
    // Add rule via API
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'modify',
        type: 'request',
        headers: { 'user-agent': 'CustomBot/2.0' }
      });

    // Make proxied request
    const response = await request(proxyApp)
      .get('/test')
      .set('User-Agent', 'OriginalAgent/1.0');

    expect(response.status).toBe(200);
    expect(response.body.receivedHeaders['user-agent']).toBe('CustomBot/2.0');
  });

  test('should remove cookie header from proxied request', async () => {
    // Add rule via API
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'remove',
        type: 'request',
        headers: ['cookie']
      });

    // Make proxied request
    const response = await request(proxyApp)
      .get('/test')
      .set('Cookie', 'session=abc123');

    expect(response.status).toBe(200);
    expect(response.body.receivedHeaders.cookie).toBeUndefined();
  });

  test('should add custom header to proxied response', async () => {
    // Add rule via API
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'response',
        headers: { 'X-Custom-Response': 'custom-value' }
      });

    // Make proxied request
    const response = await request(proxyApp).get('/test');

    expect(response.status).toBe(200);
    expect(response.headers['x-custom-response']).toBe('custom-value');
  });

  test('should apply multiple rules in sequence', async () => {
    // Add multiple rules
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'X-Custom-1': 'value1' }
      });

    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'X-Custom-2': 'value2' }
      });

    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'response',
        headers: { 'X-Response-Header': 'response-value' }
      });

    // Make proxied request
    const response = await request(proxyApp).get('/test');

    expect(response.status).toBe(200);
    expect(response.body.receivedHeaders['x-custom-1']).toBe('value1');
    expect(response.body.receivedHeaders['x-custom-2']).toBe('value2');
    expect(response.headers['x-response-header']).toBe('response-value');
  });

  test('should not apply disabled rules', async () => {
    // Add enabled rule
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'X-Enabled': 'yes' },
        enabled: true
      });

    // Add disabled rule
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'X-Disabled': 'no' },
        enabled: false
      });

    // Make proxied request
    const response = await request(proxyApp).get('/test');

    expect(response.status).toBe(200);
    expect(response.body.receivedHeaders['x-enabled']).toBe('yes');
    expect(response.body.receivedHeaders['x-disabled']).toBeUndefined();
  });

  test('should be able to update rule via API and see changes', async () => {
    // Add rule
    const createResponse = await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'original' }
      });

    const ruleId = createResponse.body.data.id;

    // Make request and verify original value
    let response = await request(proxyApp).get('/test');
    expect(response.body.receivedHeaders['x-test']).toBe('original');

    // Update rule
    await request(proxyApp)
      .put(`/api/rules/${ruleId}`)
      .send({
        headers: { 'X-Test': 'updated' }
      });

    // Make request and verify updated value
    response = await request(proxyApp).get('/test');
    expect(response.body.receivedHeaders['x-test']).toBe('updated');
  });

  test('should be able to delete rule via API and see changes', async () => {
    // Add rule
    const createResponse = await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

    const ruleId = createResponse.body.data.id;

    // Make request and verify header is added
    let response = await request(proxyApp).get('/test');
    expect(response.body.receivedHeaders['x-test']).toBe('value');

    // Delete rule
    await request(proxyApp).delete(`/api/rules/${ruleId}`);

    // Make request and verify header is not added
    response = await request(proxyApp).get('/test');
    expect(response.body.receivedHeaders['x-test']).toBeUndefined();
  });

  test('health check should return correct status and rule count', async () => {
    // Check initial health
    let response = await request(proxyApp).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.rulesCount).toBe(0);

    // Add rules
    await request(proxyApp)
      .post('/api/rules')
      .send({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

    // Check health again
    response = await request(proxyApp).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.rulesCount).toBe(1);
  });
});
