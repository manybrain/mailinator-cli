/**
 * Cache for inbox listings to enable numeric references
 */

import Conf from 'conf';
import { CacheError } from '../utils/errors.js';

const cache = new Conf({
  projectName: 'mailinator',
  configName: 'inbox-cache',
});

/**
 * Store inbox listing in cache
 * @param {string} domain - Domain name
 * @param {string} inboxName - Inbox name
 * @param {Array} messages - Array of message objects from API
 */
export function set(domain, inboxName, messages) {
  try {
    // Number the messages starting from 1
    const numberedMessages = messages.map((msg, index) => ({
      number: index + 1,
      id: msg.id,
      from: msg.from,
      subject: msg.subject,
      time: msg.time,
      seconds_ago: msg.seconds_ago,
    }));

    cache.set('cache', {
      domain,
      inboxName,
      timestamp: Date.now(),
      messages: numberedMessages,
    });
  } catch (error) {
    throw new CacheError(`Failed to save cache: ${error.message}`);
  }
}

/**
 * Get message by listing number
 * @param {number} listingNumber - The numbered position from inbox listing (1-based)
 * @returns {Object} Message object with id, domain, etc.
 * @throws {CacheError} If cache doesn't exist or number is invalid
 */
export function get(listingNumber) {
  try {
    const cached = cache.get('cache');

    if (!cached) {
      throw new CacheError(
        'No cached inbox found. Run "inbox" command first to list emails.'
      );
    }

    const message = cached.messages.find(msg => msg.number === listingNumber);

    if (!message) {
      throw new CacheError(
        `No email found at position ${listingNumber}. Valid range: 1-${cached.messages.length}`
      );
    }

    return {
      ...message,
      domain: cached.domain,
      inboxName: cached.inboxName,
    };
  } catch (error) {
    if (error instanceof CacheError) {
      throw error;
    }
    throw new CacheError(`Failed to read cache: ${error.message}`);
  }
}

/**
 * Get the domain from the cached inbox
 * @returns {string|null} Domain name or null if no cache
 */
export function getDomain() {
  try {
    const cached = cache.get('cache');
    return cached ? cached.domain : null;
  } catch (error) {
    return null;
  }
}

/**
 * Clear the cache
 */
export function clear() {
  try {
    cache.delete('cache');
  } catch (error) {
    throw new CacheError(`Failed to clear cache: ${error.message}`);
  }
}

/**
 * Get cache file path
 * @returns {string} Path to cache file
 */
export function getCachePath() {
  return cache.path;
}
