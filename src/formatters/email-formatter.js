/**
 * Formatter for email output in various formats
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import { formatAbsoluteTime } from '../utils/time-formatter.js';

/**
 * Format email based on format type
 * @param {Object} email - Email data from API
 * @param {string} format - Format type
 * @returns {string} Formatted email output
 */
export function formatEmail(email, format) {
  switch (format) {
    case 'summary':
      return formatSummary(email);
    case 'text':
      return formatText(email);
    case 'textplain':
      return formatTextPart(email, 'text/plain');
    case 'texthtml':
      return formatTextPart(email, 'text/html');
    case 'full':
    case 'raw':
      return formatJSON(email);
    case 'headers':
      return formatHeaders(email);
    case 'smtplog':
      return formatSmtpLog(email);
    case 'links':
      return formatLinks(email, false);
    case 'linksfull':
      return formatLinks(email, true);
    default:
      return formatText(email);
  }
}

/**
 * Format email as summary (key-value pairs)
 */
function formatSummary(email) {
  const lines = [
    chalk.bold.blue('\nEmail Summary\n'),
    `${chalk.bold('Subject:')} ${email.subject || '(no subject)'}`,
    `${chalk.bold('From:')} ${email.from || '(unknown)'}`,
    `${chalk.bold('To:')} ${email.to || '(unknown)'}`,
    `${chalk.bold('Domain:')} ${email.domain || '(unknown)'}`,
    `${chalk.bold('Time:')} ${email.time ? formatAbsoluteTime(email.time) : '(unknown)'}`,
    `${chalk.bold('ID:')} ${email.id || '(unknown)'}`,
  ];

  if (email.origfrom) {
    lines.push(`${chalk.bold('Original From:')} ${email.origfrom}`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Format email as plain text
 */
function formatText(email) {
  let output = chalk.bold.blue('\n') +
               chalk.bold(`From: ${email.from || '(unknown)'}\n`) +
               chalk.bold(`Subject: ${email.subject || '(no subject)'}\n`) +
               chalk.dim(`Time: ${email.time ? formatAbsoluteTime(email.time) : '(unknown)'}\n`) +
               chalk.bold.blue('\n' + '─'.repeat(80) + '\n\n');

  // Try to extract text content
  const textContent = extractTextContent(email);
  output += textContent || chalk.dim('(no text content)');

  return output + '\n';
}

/**
 * Format specific text part (plain or html)
 */
function formatTextPart(email, mimeType) {
  const header = chalk.bold.blue(`\n${mimeType} content:\n\n`);

  if (email.parts) {
    const part = email.parts.find(p => p.headers && p.headers['content-type']?.includes(mimeType));
    if (part && part.body) {
      return header + part.body + '\n';
    }
  }

  return header + chalk.dim(`(no ${mimeType} content found)`) + '\n';
}

/**
 * Format email as JSON
 */
function formatJSON(email) {
  return '\n' + JSON.stringify(email, null, 2) + '\n';
}

/**
 * Format headers as table
 */
function formatHeaders(email) {
  const table = new Table({
    head: [chalk.bold('Header'), chalk.bold('Value')],
    colWidths: [30, 70],
    wordWrap: true,
    style: {
      head: [],
      border: ['grey'],
    },
  });

  if (email.headers) {
    Object.entries(email.headers).forEach(([key, value]) => {
      table.push([chalk.cyan(key), String(value)]);
    });
  }

  return chalk.bold.blue('\nEmail Headers\n') + table.toString() + '\n';
}

/**
 * Format SMTP log as timeline
 */
function formatSmtpLog(email) {
  let output = chalk.bold.blue('\nSMTP Log\n\n');

  // Check for SMTP log in different possible locations
  let logEntries = null;
  if (email.smtplog && Array.isArray(email.smtplog.log)) {
    logEntries = email.smtplog.log;
  } else if (email.log && Array.isArray(email.log)) {
    logEntries = email.log;
  } else if (email.smtplog && Array.isArray(email.smtplog)) {
    logEntries = email.smtplog;
  }

  if (logEntries && logEntries.length > 0) {
    logEntries.forEach((entry, index) => {
      const time = entry.time || '0';
      const event = entry.event || 'unknown';
      const logMessage = entry.log || '';

      output += chalk.dim(`[${time}ms] `) +
                chalk.green(event) +
                (logMessage ? ` - ${logMessage}` : '') +
                '\n';
    });
  } else {
    output += chalk.dim('(no SMTP log available)') + '\n';
  }

  return output;
}

/**
 * Format links (numbered list or table)
 */
function formatLinks(email, fullDetails) {
  const links = extractLinks(email);

  if (links.length === 0) {
    return chalk.bold.blue('\nLinks\n\n') + chalk.dim('(no links found)') + '\n';
  }

  if (fullDetails) {
    const table = new Table({
      head: [chalk.bold('#'), chalk.bold('Link Text'), chalk.bold('URL')],
      colWidths: [5, 35, 80],
      wordWrap: true,
      style: {
        head: [],
        border: ['grey'],
      },
    });

    links.forEach((link, index) => {
      table.push([
        chalk.green(String(index + 1)),
        link.text || '(no text)',
        link.url,
      ]);
    });

    return chalk.bold.blue('\nLinks\n') + table.toString() + '\n';
  } else {
    let output = chalk.bold.blue('\nLinks\n\n');
    links.forEach((link, index) => {
      output += chalk.green(`${index + 1}. `) + link.url + '\n';
    });
    return output;
  }
}

/**
 * Extract text content from email
 */
function extractTextContent(email) {
  // Try parts first
  if (email.parts) {
    // Prefer plain text
    const plainPart = email.parts.find(p =>
      p.headers && p.headers['content-type']?.includes('text/plain')
    );
    if (plainPart && plainPart.body) {
      return plainPart.body;
    }

    // Fall back to HTML
    const htmlPart = email.parts.find(p =>
      p.headers && p.headers['content-type']?.includes('text/html')
    );
    if (htmlPart && htmlPart.body) {
      return htmlPart.body;
    }
  }

  // Try direct body field
  if (email.body) {
    return email.body;
  }

  return null;
}

/**
 * Extract links from email content
 */
function extractLinks(email) {
  const links = [];

  // First check if the API provides structured links data
  if (email.links && Array.isArray(email.links)) {
    email.links.forEach(link => {
      links.push({
        url: link.url || link.href || '',
        text: link.text || link.title || ''
      });
    });
    return links;
  }

  // Pattern for HTML anchor tags
  const anchorPattern = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*?>(.*?)<\/a>/gi;
  // Pattern for plain URLs
  const urlPattern = /(https?:\/\/[^\s<>"]+)/g;

  // Extract from parts
  if (email.parts) {
    email.parts.forEach(part => {
      if (part.body) {
        // Try to extract from anchor tags first
        const anchorMatches = part.body.matchAll(anchorPattern);
        for (const match of anchorMatches) {
          const url = match[2];
          const text = match[3].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags from text
          links.push({ url, text });
        }

        // Also extract plain URLs not in anchor tags
        const plainText = part.body.replace(/<a[^>]*>.*?<\/a>/gi, ''); // Remove anchors
        const urlMatches = plainText.matchAll(urlPattern);
        for (const match of urlMatches) {
          links.push({ url: match[1], text: '' });
        }
      }
    });
  }

  // Extract from body
  if (email.body) {
    // Try to extract from anchor tags first
    const anchorMatches = email.body.matchAll(anchorPattern);
    for (const match of anchorMatches) {
      const url = match[2];
      const text = match[3].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags from text
      links.push({ url, text });
    }

    // Also extract plain URLs not in anchor tags
    const plainText = email.body.replace(/<a[^>]*>.*?<\/a>/gi, ''); // Remove anchors
    const urlMatches = plainText.matchAll(urlPattern);
    for (const match of urlMatches) {
      links.push({ url: match[1], text: '' });
    }
  }

  // Deduplicate
  const seen = new Set();
  return links.filter(link => {
    if (seen.has(link.url)) {
      return false;
    }
    seen.add(link.url);
    return true;
  });
}
