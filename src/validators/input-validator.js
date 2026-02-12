/**
 * Input validation for CLI arguments
 */

import { ValidationError } from '../utils/errors.js';

const INBOX_NAME_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9.]*[a-zA-Z0-9])?$/;
const MAX_INBOX_LENGTH = 50;

const VALID_FORMATS = [
  'summary',
  'text',
  'textplain',
  'texthtml',
  'full',
  'raw',
  'headers',
  'smtplog',
  'links',
  'linksfull',
];

/**
 * Validate inbox name
 * @param {string} inboxName - Inbox name to validate
 * @throws {ValidationError} If inbox name is invalid
 */
export function validateInboxName(inboxName) {
  if (!inboxName || typeof inboxName !== 'string') {
    throw new ValidationError('Inbox name is required and must be a string.');
  }

  if (inboxName.length > MAX_INBOX_LENGTH) {
    throw new ValidationError(
      `Inbox name must be ${MAX_INBOX_LENGTH} characters or less.`
    );
  }

  if (!INBOX_NAME_PATTERN.test(inboxName)) {
    throw new ValidationError(
      'Inbox name must be alphanumeric with optional dots (not at the beginning or end).'
    );
  }
}

/**
 * Validate domain name
 * @param {string} domain - Domain to validate
 * @throws {ValidationError} If domain is invalid
 */
export function validateDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    throw new ValidationError('Domain is required and must be a string.');
  }

  // Allow "public" and "private" as special domains
  if (domain === 'public' || domain === 'private') {
    return;
  }

  // Basic domain validation (allow alphanumeric, hyphens, and dots)
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  if (!domainPattern.test(domain)) {
    throw new ValidationError(
      'Domain must be "public", "private", or a valid domain name.'
    );
  }
}

/**
 * Validate wildcard usage in inbox name
 * @param {string} inboxName - Inbox name to check for wildcards
 * @param {string} domain - Domain being accessed
 * @param {boolean} hasToken - Whether user has an API token
 * @throws {ValidationError} If wildcard is used incorrectly
 */
export function validateWildcard(inboxName, domain, hasToken) {
  const hasWildcard = inboxName.includes('*');

  if (!hasWildcard) {
    return; // No wildcard, validation passes
  }

  // Wildcards require API token
  if (!hasToken) {
    throw new ValidationError(
      'Wildcard searches require an API token. Please configure your token.'
    );
  }

  // Wildcards only allowed in private domain
  if (domain === 'public') {
    throw new ValidationError(
      'Wildcard searches are not allowed in the public domain.'
    );
  }

  // Only allow '*' or 'prefix*' format
  if (inboxName !== '*' && !inboxName.endsWith('*')) {
    throw new ValidationError(
      'Wildcard must be "*" or "prefix*" (wildcard at the end only).'
    );
  }

  // If prefix*, ensure prefix is valid
  if (inboxName !== '*') {
    const prefix = inboxName.slice(0, -1); // Remove trailing *
    if (prefix.includes('*')) {
      throw new ValidationError('Only one wildcard (*) is allowed at the end.');
    }
  }
}

/**
 * Validate email format option
 * @param {string} format - Format to validate
 * @throws {ValidationError} If format is invalid
 */
export function validateFormat(format) {
  if (!format || typeof format !== 'string') {
    throw new ValidationError('Format is required and must be a string.');
  }

  if (!VALID_FORMATS.includes(format)) {
    throw new ValidationError(
      `Invalid format "${format}". Valid formats: ${VALID_FORMATS.join(', ')}`
    );
  }
}
