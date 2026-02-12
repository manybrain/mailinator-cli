/**
 * Email command implementation
 */

import { MailinatorClient } from '../api/client.js';
import { loadConfig } from '../config/loader.js';
import { validateFormat } from '../validators/input-validator.js';
import { formatEmail } from '../formatters/email-formatter.js';
import { get as cacheGet } from '../cache/inbox-cache.js';

/**
 * Execute email command
 * @param {string} messageIdentifier - Message ID or listing number
 * @param {string} format - Email format (default: 'text')
 * @param {boolean} verbose - Enable verbose output
 */
export async function emailCommand(messageIdentifier, format = 'text', verbose = false) {
  // 1. Validate format
  validateFormat(format);

  // 2. Determine if identifier is a number (listing reference) or message ID
  const isListingNumber = /^\d+$/.test(messageIdentifier);

  let messageId;
  let domain;

  if (isListingNumber) {
    // 3. If number, read cache to get message ID and domain
    const listingNumber = parseInt(messageIdentifier, 10);
    const cachedMessage = cacheGet(listingNumber);
    messageId = cachedMessage.id;
    domain = cachedMessage.domain;
  } else {
    // Message ID provided directly - need to get domain from cache or fail
    messageId = messageIdentifier;
    const { apiToken } = loadConfig();
    domain = apiToken ? 'private' : 'public';

    // Try to get domain from cache if available
    const cachedDomain = await import('../cache/inbox-cache.js').then(m => m.getDomain());
    if (cachedDomain) {
      domain = cachedDomain;
    }
  }

  // 4. Load config for API token
  const { apiToken } = loadConfig();

  // 5. Create API client and fetch email
  const client = new MailinatorClient(apiToken, verbose);
  const email = await client.getEmail(domain, messageId, format);

  // 6. Format response based on format type
  const formattedOutput = formatEmail(email, format);

  // 7. Display formatted output
  console.log(formattedOutput);
}
