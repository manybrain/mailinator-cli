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
 * @param {Object} options - Command options
 * @param {boolean} options.verbose - Enable verbose output
 * @param {boolean} options.returnJSON - Return JSON instead of printing (for MCP mode)
 */
export async function inboxCommand(inboxName, domain, options = {}) {
  const { verbose = false, returnJSON = false } = options;

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

  // 7. Cache messages for email command
  if (messages.length > 0) {
    cacheSet(resolvedDomain, inboxName, messages);
  }

  // 8. Return JSON or display table based on mode
  if (returnJSON) {
    return {
      inbox_name: inboxName,
      domain: resolvedDomain,
      messages: messages.map((msg, index) => ({
        number: index + 1,
        id: msg.id,
        from: msg.from,
        subject: msg.subject,
        time: msg.time,
        seconds_ago: msg.seconds_ago,
      })),
      count: messages.length,
    };
  }

  // 9. Format and display table (CLI mode)
  const formattedOutput = formatInboxTable(messages, inboxName, resolvedDomain);
  console.log(formattedOutput);
}
