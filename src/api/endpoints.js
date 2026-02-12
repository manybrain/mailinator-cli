/**
 * API endpoint URL builders for Mailinator API
 */

const BASE_URL = 'https://api.mailinator.com/cli/v3';

/**
 * Build URL for inbox listing endpoint
 * @param {string} domain - Domain name (e.g., "public", "private", or custom domain)
 * @param {string} inboxName - Inbox name to query
 * @returns {string} Full API URL
 */
export function getInboxUrl(domain, inboxName) {
  return `${BASE_URL}/domains/${domain}/inboxes/${inboxName}`;
}

/**
 * Build URL for email retrieval endpoint
 * @param {string} domain - Domain name
 * @param {string} messageId - Message ID
 * @param {string} format - Email format (optional, defaults to 'text')
 * @returns {string} Full API URL
 */
export function getEmailUrl(domain, messageId, format = 'text') {
  return `${BASE_URL}/domains/${domain}/messages/${messageId}?format=${format}`;
}
