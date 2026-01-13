const HeaderManager = require('../../src/headerManager');

describe('HeaderManager', () => {
  let headerManager;

  beforeEach(() => {
    headerManager = new HeaderManager();
  });

  describe('addRule', () => {
    test('should add a new rule with all properties', () => {
      const rule = {
        action: 'add',
        type: 'request',
        headers: { 'Authorization': 'Bearer token123' }
      };

      const result = headerManager.addRule(rule);

      expect(result).toHaveProperty('id');
      expect(result.action).toBe('add');
      expect(result.type).toBe('request');
      expect(result.headers).toEqual({ 'Authorization': 'Bearer token123' });
      expect(result.enabled).toBe(true);
      expect(result).toHaveProperty('createdAt');
    });

    test('should add a rule with enabled set to false', () => {
      const rule = {
        action: 'remove',
        type: 'response',
        headers: ['Cache-Control'],
        enabled: false
      };

      const result = headerManager.addRule(rule);

      expect(result.enabled).toBe(false);
    });

    test('should generate unique IDs for multiple rules', () => {
      const rule1 = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value1' }
      });

      const rule2 = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value2' }
      });

      expect(rule1.id).not.toBe(rule2.id);
    });
  });

  describe('updateRule', () => {
    test('should update an existing rule', () => {
      const rule = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Original': 'value' }
      });

      const updated = headerManager.updateRule(rule.id, {
        headers: { 'X-Updated': 'newvalue' }
      });

      expect(updated.id).toBe(rule.id);
      expect(updated.headers).toEqual({ 'X-Updated': 'newvalue' });
      expect(updated).toHaveProperty('updatedAt');
    });

    test('should return null for non-existent rule', () => {
      const result = headerManager.updateRule('non-existent-id', {
        headers: { 'X-Test': 'value' }
      });

      expect(result).toBeNull();
    });

    test('should preserve id and createdAt when updating', () => {
      const rule = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const originalId = rule.id;
      const originalCreatedAt = rule.createdAt;

      const updated = headerManager.updateRule(rule.id, {
        enabled: false
      });

      expect(updated.id).toBe(originalId);
      expect(updated.createdAt).toBe(originalCreatedAt);
    });
  });

  describe('removeRule', () => {
    test('should remove an existing rule', () => {
      const rule = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const removed = headerManager.removeRule(rule.id);

      expect(removed).toBe(true);
      expect(headerManager.getRules()).toHaveLength(0);
    });

    test('should return false for non-existent rule', () => {
      const removed = headerManager.removeRule('non-existent-id');

      expect(removed).toBe(false);
    });
  });

  describe('getRules', () => {
    test('should return all rules', () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test-1': 'value1' }
      });

      headerManager.addRule({
        action: 'add',
        type: 'response',
        headers: { 'X-Test-2': 'value2' }
      });

      const rules = headerManager.getRules();

      expect(rules).toHaveLength(2);
    });

    test('should return a copy of rules array', () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const rules = headerManager.getRules();
      rules.push({ id: 'fake-rule' });

      expect(headerManager.getRules()).toHaveLength(1);
    });
  });

  describe('getRule', () => {
    test('should return a specific rule by ID', () => {
      const rule = headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Test': 'value' }
      });

      const found = headerManager.getRule(rule.id);

      expect(found).toEqual(rule);
    });

    test('should return null for non-existent rule', () => {
      const found = headerManager.getRule('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('clearRules', () => {
    test('should remove all rules', () => {
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

      headerManager.clearRules();

      expect(headerManager.getRules()).toHaveLength(0);
    });
  });

  describe('applyRequestHeaders', () => {
    test('should add headers to request', () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'Authorization': 'Bearer token123' }
      });

      const modifications = headerManager.applyRequestHeaders({});

      expect(modifications.add).toEqual({ 'Authorization': 'Bearer token123' });
      expect(modifications.modify).toEqual({});
      expect(modifications.remove).toEqual([]);
    });

    test('should modify existing headers in request', () => {
      headerManager.addRule({
        action: 'modify',
        type: 'request',
        headers: { 'user-agent': 'CustomAgent/1.0' }
      });

      const modifications = headerManager.applyRequestHeaders({
        'user-agent': 'Mozilla/5.0'
      });

      expect(modifications.modify).toEqual({ 'user-agent': 'CustomAgent/1.0' });
    });

    test('should not modify non-existent headers', () => {
      headerManager.addRule({
        action: 'modify',
        type: 'request',
        headers: { 'X-NonExistent': 'value' }
      });

      const modifications = headerManager.applyRequestHeaders({
        'user-agent': 'Mozilla/5.0'
      });

      expect(modifications.modify).toEqual({});
    });

    test('should remove headers from request', () => {
      headerManager.addRule({
        action: 'remove',
        type: 'request',
        headers: ['Cache-Control', 'Cookie']
      });

      const modifications = headerManager.applyRequestHeaders({
        'Cache-Control': 'no-cache',
        'Cookie': 'session=abc'
      });

      expect(modifications.remove).toEqual(['Cache-Control', 'Cookie']);
    });

    test('should not apply disabled rules', () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Enabled': 'yes' },
        enabled: true
      });

      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Disabled': 'no' },
        enabled: false
      });

      const modifications = headerManager.applyRequestHeaders({});

      expect(modifications.add).toEqual({ 'X-Enabled': 'yes' });
    });

    test('should not apply response-only rules to requests', () => {
      headerManager.addRule({
        action: 'add',
        type: 'response',
        headers: { 'X-Response-Only': 'value' }
      });

      const modifications = headerManager.applyRequestHeaders({});

      expect(modifications.add).toEqual({});
    });

    test('should apply both-type rules to requests', () => {
      headerManager.addRule({
        action: 'add',
        type: 'both',
        headers: { 'X-Both': 'value' }
      });

      const modifications = headerManager.applyRequestHeaders({});

      expect(modifications.add).toEqual({ 'X-Both': 'value' });
    });
  });

  describe('applyResponseHeaders', () => {
    test('should add headers to response', () => {
      headerManager.addRule({
        action: 'add',
        type: 'response',
        headers: { 'X-Custom-Header': 'custom-value' }
      });

      const modifications = headerManager.applyResponseHeaders({});

      expect(modifications.add).toEqual({ 'X-Custom-Header': 'custom-value' });
    });

    test('should modify existing headers in response', () => {
      headerManager.addRule({
        action: 'modify',
        type: 'response',
        headers: { 'cache-control': 'no-store' }
      });

      const modifications = headerManager.applyResponseHeaders({
        'cache-control': 'max-age=3600'
      });

      expect(modifications.modify).toEqual({ 'cache-control': 'no-store' });
    });

    test('should remove headers from response', () => {
      headerManager.addRule({
        action: 'remove',
        type: 'response',
        headers: ['X-Powered-By']
      });

      const modifications = headerManager.applyResponseHeaders({
        'X-Powered-By': 'Express'
      });

      expect(modifications.remove).toEqual(['X-Powered-By']);
    });

    test('should not apply request-only rules to responses', () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Request-Only': 'value' }
      });

      const modifications = headerManager.applyResponseHeaders({});

      expect(modifications.add).toEqual({});
    });

    test('should apply both-type rules to responses', () => {
      headerManager.addRule({
        action: 'add',
        type: 'both',
        headers: { 'X-Both': 'value' }
      });

      const modifications = headerManager.applyResponseHeaders({});

      expect(modifications.add).toEqual({ 'X-Both': 'value' });
    });
  });

  describe('multiple rules', () => {
    test('should apply multiple rules in order', () => {
      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Header-1': 'value1' }
      });

      headerManager.addRule({
        action: 'add',
        type: 'request',
        headers: { 'X-Header-2': 'value2' }
      });

      headerManager.addRule({
        action: 'remove',
        type: 'request',
        headers: ['User-Agent']
      });

      const modifications = headerManager.applyRequestHeaders({
        'User-Agent': 'Mozilla/5.0'
      });

      expect(modifications.add).toEqual({
        'X-Header-1': 'value1',
        'X-Header-2': 'value2'
      });
      expect(modifications.remove).toEqual(['User-Agent']);
    });
  });
});
