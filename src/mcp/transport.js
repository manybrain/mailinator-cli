/**
 * MCP HTTP Transport Layer
 * Provides Express-based HTTP transport for MCP JSON-RPC 2.0 protocol
 */

import express from 'express';
import { errorMiddleware } from './utils/error-handler.js';

/**
 * Create and configure Express app for MCP server
 * @param {Function} messageHandler - Function to handle JSON-RPC messages
 * @returns {express.Application} Configured Express app
 */
export function createMCPTransport(messageHandler) {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // Log incoming requests
  app.use((req, res, next) => {
    if (req.path === '/mcp') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'mailinator-mcp-server' });
  });

  // Main MCP endpoint - handles JSON-RPC 2.0 messages
  app.post('/mcp', async (req, res, next) => {
    try {
      const request = req.body;

      // Validate JSON-RPC 2.0 request format
      if (!request || request.jsonrpc !== '2.0') {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: request?.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: { reason: 'Missing or invalid jsonrpc version' },
          },
        });
      }

      if (!request.method || typeof request.method !== 'string') {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: request?.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: { reason: 'Missing or invalid method' },
          },
        });
      }

      // Handle the request
      const response = await messageHandler(request);

      // Send response
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.path} not found. Use POST /mcp for MCP requests.`,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorMiddleware);

  return app;
}

/**
 * Start HTTP server
 * @param {express.Application} app - Express app
 * @param {string} host - Host to bind to
 * @param {number} port - Port to listen on
 * @returns {Promise<http.Server>} HTTP server instance
 */
export function startServer(app, host, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, (error) => {
      if (error) {
        reject(error);
      } else {
        console.log(`\nMailinator MCP Server started`);
        console.log(`Listening on: http://${host}:${port}/mcp`);
        console.log(`Health check: http://${host}:${port}/health`);
        console.log('\nPress Ctrl+C to stop the server\n');
        resolve(server);
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Error: Port ${port} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`Error: Permission denied to bind to ${host}:${port}`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        reject(error);
      }
    });
  });
}
