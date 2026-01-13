const express = require('express');

/**
 * Create API router for managing header rules
 * @param {HeaderManager} headerManager - Instance of HeaderManager
 * @returns {Router} Express router
 */
function createApiRouter(headerManager) {
  const router = express.Router();

  /**
   * GET /api/rules
   * Get all header rules
   */
  router.get('/rules', (req, res) => {
    try {
      const rules = headerManager.getRules();
      res.json({
        success: true,
        count: rules.length,
        data: rules
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/rules/:id
   * Get a specific rule by ID
   */
  router.get('/rules/:id', (req, res) => {
    try {
      const rule = headerManager.getRule(req.params.id);
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/rules
   * Create a new header rule
   */
  router.post('/rules', (req, res) => {
    try {
      const { action, type, headers, enabled } = req.body;

      // Validation
      if (!action || !type || !headers) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: action, type, headers'
        });
      }

      if (!['add', 'modify', 'remove'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be: add, modify, or remove'
        });
      }

      if (!['request', 'response', 'both'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid type. Must be: request, response, or both'
        });
      }

      const rule = headerManager.addRule({ action, type, headers, enabled });
      
      res.status(201).json({
        success: true,
        data: rule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PUT /api/rules/:id
   * Update an existing rule
   */
  router.put('/rules/:id', (req, res) => {
    try {
      const updates = req.body;
      const rule = headerManager.updateRule(req.params.id, updates);
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }

      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/rules/:id
   * Delete a rule
   */
  router.delete('/rules/:id', (req, res) => {
    try {
      const removed = headerManager.removeRule(req.params.id);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }

      res.json({
        success: true,
        message: 'Rule deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/rules
   * Clear all rules
   */
  router.delete('/rules', (req, res) => {
    try {
      headerManager.clearRules();
      res.json({
        success: true,
        message: 'All rules cleared successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createApiRouter;
