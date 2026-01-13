const request = require('supertest');
const express = require('express');
const apiRouter = require('../../src/api');
const HeaderManager = require('../../src/headerManager');

describe('API Routes', () => {
  let app;
  let headerManager;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    headerManager = new HeaderManager();
    app.use('/api', apiRouter(headerManager));
  });

  describe('GET /api/rules', () => {
    test('should return empty array when no rules exist', async () => {
      const response = await request(app).get('/api/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    test('should return all rules', async () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const response = await request(app).get('/api/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/rules/:id', () => {
    test('should return a specific rule', async () => {
      const rule = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const response = await request(app).get(`/api/rules/${rule.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(rule.id);
    });

    test('should return 404 for non-existent rule', async () => {
      const response = await request(app).get('/api/rules/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Rule not found');
    });
  });

  describe('POST /api/rules', () => {
    test('should create a new rule', async () => {
      const newRule = {
        action: 'add',
        type: 'request',
        headers: { 'Authorization': 'Bearer token123' }
      };

      const response = await request(app)
        .post('/api/rules')
        .send(newRule);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.action).toBe('add');
      expect(response.body.data.type).toBe('request');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/rules')
        .send({ action: 'add' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 for invalid action', async () => {
      const response = await request(app)
        .post('/api/rules')
        .send({
          action: 'invalid',
          type: 'request',
          headers: { 'X-Test': 'value' }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid action');
    });

    test('should return 400 for invalid type', async () => {
      const response = await request(app)
        .post('/api/rules')
        .send({
          action: 'add',
          type: 'invalid',
          headers: { 'X-Test': 'value' }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid type');
    });
  });

  describe('PUT /api/rules/:id', () => {
    test('should update an existing rule', async () => {
      const rule = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const response = await request(app)
        .put(`/api/rules/${rule.id}`)
        .send({ enabled: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(false);
    });

    test('should return 404 for non-existent rule', async () => {
      const response = await request(app)
        .put('/api/rules/non-existent')
        .send({ enabled: false });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Rule not found');
    });
  });

  describe('DELETE /api/rules/:id', () => {
    test('should delete an existing rule', async () => {
      const rule = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const response = await request(app).delete(`/api/rules/${rule.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    test('should return 404 for non-existent rule', async () => {
      const response = await request(app).delete('/api/rules/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Rule not found');
    });
  });

  describe('DELETE /api/rules', () => {
    test('should clear all rules', async () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test-1': 'value1' }
      });

      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test-2': 'value2' }
      });

      const response = await request(app).delete('/api/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cleared successfully');
      expect(headerManager.getRules()).toHaveLength(0);
    });
  });
});
