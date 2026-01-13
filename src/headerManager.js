/**
 * HeaderManager class
 * Manages header modification rules and applies them to HTTP requests and responses
 */
class HeaderManager {
  constructor() {
    this.rules = [];
  }

  /**
   * Add a new header rule
   * @param {Object} rule - Rule object containing action, type, headers
   * @returns {Object} The created rule with ID
   */
  addRule(rule) {
    const newRule = {
      id: this._generateId(),
      action: rule.action, // 'add', 'modify', 'remove'
      type: rule.type, // 'request', 'response', 'both'
      headers: rule.headers, // Object with header key-value pairs or array of header names
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      createdAt: new Date().toISOString()
    };
    
    this.rules.push(newRule);
    return newRule;
  }

  /**
   * Update an existing rule
   * @param {string} id - Rule ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated rule or null if not found
   */
  updateRule(id, updates) {
    const ruleIndex = this.rules.findIndex(r => r.id === id);
    if (ruleIndex === -1) return null;
    
    this.rules[ruleIndex] = {
      ...this.rules[ruleIndex],
      ...updates,
      id: this.rules[ruleIndex].id, // Preserve ID
      createdAt: this.rules[ruleIndex].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    return this.rules[ruleIndex];
  }

  /**
   * Remove a rule by ID
   * @param {string} id - Rule ID
   * @returns {boolean} True if removed, false if not found
   */
  removeRule(id) {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(r => r.id !== id);
    return this.rules.length < initialLength;
  }

  /**
   * Get all rules
   * @returns {Array} Array of all rules
   */
  getRules() {
    return [...this.rules];
  }

  /**
   * Get a rule by ID
   * @param {string} id - Rule ID
   * @returns {Object|null} Rule or null if not found
   */
  getRule(id) {
    return this.rules.find(r => r.id === id) || null;
  }

  /**
   * Clear all rules
   */
  clearRules() {
    this.rules = [];
  }

  /**
   * Apply header modifications to request headers
   * @param {Object} headers - Current request headers
   * @returns {Object} Object containing add, modify, and remove arrays
   */
  applyRequestHeaders(headers) {
    return this._applyHeaders(headers, 'request');
  }

  /**
   * Apply header modifications to response headers
   * @param {Object} headers - Current response headers
   * @returns {Object} Object containing add, modify, and remove arrays
   */
  applyResponseHeaders(headers) {
    return this._applyHeaders(headers, 'response');
  }

  /**
   * Internal method to apply header rules
   * @private
   */
  _applyHeaders(headers, type) {
    const modifications = {
      add: {},
      modify: {},
      remove: []
    };

    const applicableRules = this.rules.filter(
      r => r.enabled && (r.type === type || r.type === 'both')
    );

    for (const rule of applicableRules) {
      if (rule.action === 'add') {
        Object.entries(rule.headers).forEach(([key, value]) => {
          modifications.add[key] = value;
        });
      } else if (rule.action === 'modify') {
        Object.entries(rule.headers).forEach(([key, value]) => {
          // Only modify if header exists
          const headerKey = Object.keys(headers).find(
            h => h.toLowerCase() === key.toLowerCase()
          );
          if (headerKey) {
            modifications.modify[key] = value;
          }
        });
      } else if (rule.action === 'remove') {
        // headers can be an array of header names to remove
        const headersToRemove = Array.isArray(rule.headers) 
          ? rule.headers 
          : Object.keys(rule.headers);
        modifications.remove.push(...headersToRemove);
      }
    }

    return modifications;
  }

  /**
   * Generate a unique ID for rules
   * @private
   */
  _generateId() {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = HeaderManager;
