/**
 * Inbox command implementation
 */

import { MailinatorClient } from '../api/client.js';
import { loadConfig } from '../config/loader.js';
import {
  validateInboxName,
  validateDomain,
  validateWildcard,
} from '../validators/input-validator.js';
import { formatInboxTable } from '../formatters/inbox-formatter.js';
import { set as cacheSet } from '../cache/inbox-cache.js';

/**
 * Execute inbox command
 * @param {string} inboxName - Inbox name to query
 * @param {string|undefined} domain - Optional domain (defaults based on token)
 * @param {boolean} verbose - Enable verbose output
 */
export async function inboxCommand(inboxName, domain, verbose = false) {
  // 1. Validate inbox name
  validateInboxName(inboxName);

  // 2. Load config to determine if token exists
  const { apiToken } = loadConfig();
  const hasToken = apiToken !== null;

  // 3. Resolve domain
  let resolvedDomain = domain;
  if (!resolvedDomain) {
    // Default to "private" if token exists, "public" otherwise
    resolvedDomain = hasToken ? 'private' : 'public';
  }

  // 4. Validate domain and wildcard rules
  validateDomain(resolvedDomain);
  validateWildcard(inboxName, resolvedDomain, hasToken);

  // 5. Create API client and fetch inbox
  const client = new MailinatorClient(apiToken, verbose);
  const response = await client.getInbox(resolvedDomain, inboxName);

  // 6. Extract messages from response
  const messages = response.msgs || response.messages || [];

  // 7. Format response as numbered table
  const formattedOutput = formatInboxTable(messages, inboxName, resolvedDomain);

  // 8. Cache messages for email command
  if (messages.length > 0) {
    cacheSet(resolvedDomain, inboxName, messages);
  }

  // 9. Display table
  console.log(formattedOutput);
}
