/**
 * Formatter for inbox listing output
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import { formatTimeAgo } from '../utils/time-formatter.js';

/**
 * Format inbox messages as a table
 * @param {Array} messages - Array of message objects from API
 * @param {string} inboxName - Name of the inbox
 * @param {string} domain - Domain name
 * @returns {string} Formatted table as string
 */
export function formatInboxTable(messages, inboxName, domain) {
  if (!messages || messages.length === 0) {
    return chalk.yellow(`No emails found in inbox "${inboxName}" (${domain})`);
  }

  const table = new Table({
    head: [
      chalk.bold('#'),
      chalk.bold('From'),
      chalk.bold('Subject'),
      chalk.bold('Time'),
    ],
    colWidths: [5, 30, 50, 20],
    wordWrap: true,
    style: {
      head: [],
      border: ['grey'],
    },
  });

  messages.forEach((msg, index) => {
    const number = chalk.green(String(index + 1));
    const from = chalk.cyan(msg.from || '(no sender)');
    const subject = msg.subject || '(no subject)';
    const time = chalk.dim(formatTimeAgo(msg.time, msg.seconds_ago));

    table.push([number, from, subject, time]);
  });

  const header = chalk.bold.blue(`\nInbox: ${inboxName}@${domain}\n`);
  const footer = chalk.dim(
    `\nTotal: ${messages.length} email${messages.length !== 1 ? 's' : ''}`
  );

  return `${header}${table.toString()}${footer}`;
}
