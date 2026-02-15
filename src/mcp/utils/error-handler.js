/**
 * MCP error handler utility
 * Maps application errors to JSON-RPC 2.0 error format
 */

import { ValidationError, APIError, CacheError, ConfigError } from '../../utils/errors.js';

// JSON-RPC 2.0 error codes
export const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
  CACHE_ERROR: -32001,
};

/**
 * Sanitizes error messages to remove API tokens
 * @param {string} message - Error message
 * @returns {string} Sanitized message
 */
function sanitizeMessage(message) {
  if (!message) return message;

  // Remove API tokens from error messages
  return message.replace(/Bearer\s+[A-Za-z0-9_-]+/gi, 'Bearer [REDACTED]')
    .replace(/api[_-]?key[:\s=]+[A-Za-z0-9_-]+/gi, 'api_key=[REDACTED]')
    .replace(/token[:\s=]+[A-Za-z0-9_-]+/gi, 'token=[REDACTED]');
}

/**
 * Maps application errors to JSON-RPC 2.0 error format
 * @param {Error} error - Application error
 * @param {number|string} id - JSON-RPC request ID
 * @returns {Object} JSON-RPC error response
 */
export function mapErrorToJSONRPC(error, id = null) {
  let code;
  let message;
  let data = {};

  if (error instanceof ValidationError) {
    code = ErrorCodes.INVALID_PARAMS;
    message = sanitizeMessage(error.message);
    data.type = 'ValidationError';
  } else if (error instanceof APIError) {
    code = ErrorCodes.SERVER_ERROR;
    message = sanitizeMessage(error.message);
    data.type = 'APIError';
    if (error.statusCode) {
      data.statusCode = error.statusCode;
    }
  } else if (error instanceof CacheError) {
    code = ErrorCodes.CACHE_ERROR;
    message = sanitizeMessage(error.message);
    data.type = 'CacheError';
  } else if (error instanceof ConfigError) {
    code = ErrorCodes.INTERNAL_ERROR;
    message = sanitizeMessage(error.message);
    data.type = 'ConfigError';
  } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
    code = ErrorCodes.PARSE_ERROR;
    message = 'Invalid JSON';
    data.details = sanitizeMessage(error.message);
  } else {
    // Unknown error
    code = ErrorCodes.INTERNAL_ERROR;
    message = 'Internal server error';
    data.details = sanitizeMessage(error.message || String(error));
    data.type = error.name || 'Error';
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

/**
 * Creates a JSON-RPC error response for method not found
 * @param {number|string} id - JSON-RPC request ID
 * @param {string} method - Method name that was not found
 * @returns {Object} JSON-RPC error response
 */
export function methodNotFoundError(id, method) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: ErrorCodes.METHOD_NOT_FOUND,
      message: 'Method not found',
      data: { method },
    },
  };
}

/**
 * Creates a JSON-RPC error response for invalid request
 * @param {number|string} id - JSON-RPC request ID
 * @param {string} reason - Reason for invalid request
 * @returns {Object} JSON-RPC error response
 */
export function invalidRequestError(id, reason) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: ErrorCodes.INVALID_REQUEST,
      message: 'Invalid Request',
      data: { reason: sanitizeMessage(reason) },
    },
  };
}

/**
 * Express error handling middleware for MCP server
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function errorMiddleware(err, req, res, next) {
  const requestId = req.body?.id || null;
  const errorResponse = mapErrorToJSONRPC(err, requestId);

  // Log error for debugging (sanitized)
  console.error('[MCP Error]', {
    code: errorResponse.error.code,
    message: errorResponse.error.message,
    data: errorResponse.error.data,
  });

  res.status(200).json(errorResponse); // JSON-RPC always returns 200
}
