#!/usr/bin/env node

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const HeaderManager = require('./headerManager');
const apiRouter = require('./api');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';

// Initialize header manager
const headerManager = new HeaderManager();

// Middleware to parse JSON
app.use(express.json());

// API routes for managing headers
app.use('/api', apiRouter(headerManager));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rulesCount: headerManager.getRules().length
  });
});

// Proxy middleware with header modification
app.use('/', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Apply header modifications to request
    const modifications = headerManager.applyRequestHeaders(req.headers);
    
    // Apply additions
    Object.entries(modifications.add).forEach(([key, value]) => {
      proxyReq.setHeader(key, value);
    });
    
    // Apply modifications
    Object.entries(modifications.modify).forEach(([key, value]) => {
      proxyReq.setHeader(key, value);
    });
    
    // Apply deletions
    modifications.remove.forEach(key => {
      proxyReq.removeHeader(key);
    });
    
    console.log(`[Request] ${req.method} ${req.path} - Modified headers:`, {
      added: Object.keys(modifications.add),
      modified: Object.keys(modifications.modify),
      removed: modifications.remove
    });
  },
  onProxyRes: (proxyRes, req) => {
    // Apply header modifications to response
    const modifications = headerManager.applyResponseHeaders(proxyRes.headers);
    
    // Apply additions
    Object.entries(modifications.add).forEach(([key, value]) => {
      proxyRes.headers[key.toLowerCase()] = value;
    });
    
    // Apply modifications
    Object.entries(modifications.modify).forEach(([key, value]) => {
      proxyRes.headers[key.toLowerCase()] = value;
    });
    
    // Apply deletions
    modifications.remove.forEach(key => {
      delete proxyRes.headers[key.toLowerCase()];
    });
    
    console.log(`[Response] ${req.method} ${req.path} - Modified headers:`, {
      added: Object.keys(modifications.add),
      modified: Object.keys(modifications.modify),
      removed: modifications.remove
    });
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      error: 'Proxy error',
      message: err.message
    });
  }
}));

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`ModHeader proxy server running at http://${HOST}:${PORT}`);
  console.log(`Proxying to: ${TARGET_URL}`);
  console.log(`API available at: http://${HOST}:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server };
