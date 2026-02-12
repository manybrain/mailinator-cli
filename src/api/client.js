/**
 * Mailinator API HTTP client
 */

import axios from 'axios';
import chalk from 'chalk';
import { APIError } from '../utils/errors.js';
import { getInboxUrl, getEmailUrl } from './endpoints.js';

export class MailinatorClient {
  /**
   * Create a new Mailinator API client
   * @param {string|null} apiToken - Optional API token for authentication
   * @param {boolean} verbose - Enable verbose logging
   */
  constructor(apiToken = null, verbose = false) {
    this.apiToken = apiToken;
    this.verbose = verbose;
  }

  /**
   * Log HTTP request in verbose mode
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} headers - Request headers
   */
  _logRequest(method, url, headers) {
    if (!this.verbose) return;

    console.error(chalk.magenta.bold('\n[HTTP REQUEST]'));
    console.error(chalk.magenta(`${method} ${url}`));
    console.error(chalk.dim('Headers:'));

    // Hide sensitive Authorization header value
    const sanitizedHeaders = { ...headers };
    if (sanitizedHeaders.Authorization) {
      sanitizedHeaders.Authorization = 'Bearer ***';
    }

    console.error(chalk.dim(JSON.stringify(sanitizedHeaders, null, 2)));
  }

  /**
   * Log HTTP response in verbose mode
   * @param {number} status - Response status code
   * @param {Object} data - Response data
   */
  _logResponse(status, data) {
    if (!this.verbose) return;

    console.error(chalk.cyan.bold('\n[HTTP RESPONSE]'));
    console.error(chalk.cyan(`Status: ${status}`));
    console.error(chalk.dim('Response:'));
    console.error(chalk.dim(JSON.stringify(data, null, 2)));
    console.error(''); // Empty line for separation
  }

  /**
   * Build request headers
   * @returns {Object} Headers object
   */
  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    return headers;
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error object
   * @throws {APIError}
   */
  _handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          throw new APIError(
            'Authentication failed. Please check your API token.',
            401,
            data
          );
        case 403:
          throw new APIError(
            'Access forbidden. You may need an API token to access this resource.',
            403,
            data
          );
        case 404:
          throw new APIError(
            'Resource not found. Check that the inbox/email exists.',
            404,
            data
          );
        case 500:
          throw new APIError(
            'Mailinator API server error. Please try again later.',
            500,
            data
          );
        default:
          throw new APIError(
            `API error: ${data.message || 'Unknown error'}`,
            status,
            data
          );
      }
    } else if (error.request) {
      throw new APIError(
        'Network error: Unable to reach Mailinator API. Check your internet connection.',
        null,
        null
      );
    } else {
      throw new APIError(`Request error: ${error.message}`, null, null);
    }
  }

  /**
   * Get inbox messages
   * @param {string} domain - Domain name
   * @param {string} inboxName - Inbox name
   * @returns {Promise<Object>} API response data
   */
  async getInbox(domain, inboxName) {
    try {
      const url = getInboxUrl(domain, inboxName);
      const headers = this._getHeaders();

      this._logRequest('GET', url, headers);

      const response = await axios.get(url, { headers });

      this._logResponse(response.status, response.data);

      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Get email by message ID
   * @param {string} domain - Domain name
   * @param {string} messageId - Message ID
   * @param {string} format - Email format (default: 'text')
   * @returns {Promise<Object>} API response data
   */
  async getEmail(domain, messageId, format = 'text') {
    try {
      const url = getEmailUrl(domain, messageId, format);
      const headers = this._getHeaders();

      this._logRequest('GET', url, headers);

      const response = await axios.get(url, { headers });

      this._logResponse(response.status, response.data);

      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
}
