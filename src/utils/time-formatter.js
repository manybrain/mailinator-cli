/**
 * Time and date formatting utilities
 */

import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format timestamp as relative time (e.g., "21 mins ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {number} secondsAgo - Optional seconds_ago value from API
 * @returns {string} Formatted time string
 */
export function formatTimeAgo(timestamp, secondsAgo = null) {
  // If seconds_ago is provided, use it for more accurate relative time
  if (secondsAgo !== null && secondsAgo !== undefined) {
    const minutes = Math.floor(secondsAgo / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (secondsAgo < 60) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 7) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  // For older messages or if seconds_ago not provided, use date-fns
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    // For messages older than 7 days, show absolute date
    if (diffInDays > 7) {
      return format(date, 'MMM d, yyyy');
    }

    // For recent messages, show relative time
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Format timestamp as absolute date/time
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatAbsoluteTime(timestamp) {
  try {
    return format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss');
  } catch (error) {
    return 'unknown';
  }
}
