# mailinator-cli

A Node.js CLI tool to interact with the Mailinator disposable email service. List emails in any inbox and retrieve individual messages in various formats.

## Features

- 📬 List emails in any Mailinator inbox with numbered, human-readable table format
- 📧 Retrieve individual emails by message ID or listing number
- 🔒 Support for both public and private domains
- 🎨 Multiple output formats (text, HTML, headers, links, JSON, etc.)
- ⚡ Fast inbox caching for quick email retrieval
- 🔑 Flexible API token configuration (environment variable or config file)
- 🌐 Wildcard inbox searches (with API token)

## Installation

### Global Install (Recommended)

```bash
npm install -g mailinator-cli
```

### NPX (No Install Required)

```bash
npx mailinator-cli inbox test public
```

### Local Development

```bash
git clone <repository-url>
cd mailinator-cli
npm install
npm link
```

## Configuration

### API Token (Optional for Public Domain)

Mailinator allows public access to the "public" domain without authentication. To access private domains or use advanced features, you'll need an API token.

Get your API token from: [Mailinator API Settings](https://www.mailinator.com/v4/index.jsp)

#### Option 1: Environment Variable

```bash
export MAILINATOR_API_KEY=your_api_token_here
```

Or create a `.env` file:

```bash
MAILINATOR_API_KEY=your_api_token_here
```

#### Option 2: Config File

Create `~/.mailinator/config.json`:

```json
{
  "apiKey": "your_api_token_here"
}
```

**Priority:** Environment variable > Config file > None (public domain only)

## Usage

### Global Options

These options can be used with any command:

- `-v, --verbose` - Show detailed HTTP request/response information
- `-V, --version` - Output the version number
- `-h, --help` - Display help for command

**Verbose Mode:**

Enable verbose mode to see all HTTP calls with URLs and JSON responses. Useful for debugging or understanding API interactions.

```bash
# Show detailed HTTP information
mailinator-cli --verbose inbox testuser public
mailinator-cli -v email 1 summary
```

### Inbox Command

List all emails in an inbox.

```bash
mailinator-cli [options] inbox <inbox_name> [domain]
```

**Arguments:**
- `inbox_name` (required): The inbox/email username to query
- `domain` (optional): Domain to use. Defaults to:
  - `"private"` if API token is configured
  - `"public"` if no API token

**Examples:**

```bash
# List emails in the public domain (no token required)
mailinator-cli inbox testuser public

# List emails in private domain (requires API token)
mailinator-cli inbox myinbox private

# Auto-detect domain based on token configuration
mailinator-cli inbox myinbox

# Use custom domain
mailinator-cli inbox support mycustomdomain.com

# Wildcard search (requires API token and private domain)
mailinator-cli inbox test* private

# Show verbose HTTP information
mailinator-cli --verbose inbox testuser public
```

**Output:**

```
Inbox: testuser@public

┌─────┬────────────────────────────────┬──────────────────────────────────────────────────┬────────────────────┐
│ #   │ From                           │ Subject                                          │ Time               │
├─────┼────────────────────────────────┼──────────────────────────────────────────────────┼────────────────────┤
│ 1   │ noreply@example.com            │ Welcome to our service                           │ 21 mins ago        │
│ 2   │ notifications@github.com       │ [GitHub] Password reset request                  │ 2 hours ago        │
│ 3   │ support@company.com            │ Your order confirmation                          │ 5 hours ago        │
└─────┴────────────────────────────────┴──────────────────────────────────────────────────┴────────────────────┘

Total: 3 emails
```

### Email Command

Retrieve and display a specific email.

```bash
mailinator-cli [options] email <message_id|listing_number> [format]
```

**Arguments:**
- `message_id|listing_number` (required): Either:
  - A listing number from the inbox command (e.g., `1`, `2`, `3`)
  - A full message ID (e.g., `testuser-1234567890-abcdef`)
- `format` (optional): Output format. Default: `text`

**Available Formats:**
- `summary` - Key-value pairs (subject, from, to, domain, time, id)
- `text` - Plain text content with headers (default)
- `textplain` - Plain text part only
- `texthtml` - HTML part only
- `full` - Complete email data as formatted JSON
- `raw` - Raw email data as JSON
- `headers` - Email headers as table
- `smtplog` - SMTP delivery log timeline
- `links` - Numbered list of links found in email
- `linksfull` - Table with link text and URLs

**Examples:**

```bash
# Retrieve email by listing number (from inbox command)
mailinator-cli email 1

# Retrieve with specific format
mailinator-cli email 1 summary
mailinator-cli email 1 headers
mailinator-cli email 1 texthtml

# Retrieve by full message ID
mailinator-cli email testuser-1234567890-abcdef text

# Extract all links from email
mailinator-cli email 1 links

# View full email data
mailinator-cli email 1 full

# Show verbose HTTP information
mailinator-cli --verbose email 1 full
```

**Example Output (text format):**

```
From: noreply@example.com
Subject: Welcome to our service
Time: Feb 12, 2026 14:30:15

────────────────────────────────────────────────────────────────────────────────

Hello and welcome!

Thank you for signing up for our service. We're excited to have you on board.

To get started, please verify your email address by clicking the link below:
https://example.com/verify?token=abc123

Best regards,
The Team
```

## Inbox Caching

The `inbox` command caches the list of emails to `~/.mailinator/inbox-cache.json`. This allows you to:

1. Quickly retrieve emails by their listing number (1, 2, 3, etc.)
2. Avoid re-running the inbox command for each email retrieval

The cache persists across CLI invocations until you run the `inbox` command again.

## Validation Rules

### Inbox Names
- Maximum 50 characters
- Alphanumeric characters and dots (`.`)
- Cannot start or end with a dot
- Pattern: `[a-zA-Z0-9]([a-zA-Z0-9.]*[a-zA-Z0-9])?`

### Wildcards
- Requires API token
- Only allowed in private domains (not public)
- Formats: `*` (all inboxes) or `prefix*` (inboxes starting with prefix)
- Only one wildcard at the end

### Domains
- Special values: `public`, `private`
- Custom domains: Valid domain name format

## Error Handling

The CLI provides clear error messages for common issues:

- **Validation Error**: Invalid input (inbox name, domain, format)
- **API Error**: Authentication failures, network issues, API errors
- **Cache Error**: No cached inbox (run `inbox` command first)
- **Config Error**: Configuration file issues (non-fatal warnings)

Exit codes:
- `0` - Success or config warning
- `1` - Validation error
- `2` - API error
- `3` - Cache error

## Examples

### Common Workflows

**Check emails for a test account:**

```bash
# List emails
mailinator-cli inbox testuser public

# Read the first email
mailinator-cli email 1

# View headers of second email
mailinator-cli email 2 headers
```

**Use with private domain:**

```bash
# Configure API token
export MAILINATOR_API_KEY=your_token_here

# List private inbox
mailinator-cli inbox myinbox

# Read email with summary
mailinator-cli email 1 summary
```

**Extract links from an email:**

```bash
mailinator-cli inbox newsletter public
mailinator-cli email 1 links
```

**Search multiple inboxes:**

```bash
# Requires API token
mailinator-cli inbox test* private
```

## Requirements

- Node.js >= 18.0.0
- Internet connection (to access Mailinator API)

## API Endpoints

This tool uses the Mailinator CLI API v3:

- **Inbox**: `GET https://api.mailinator.com/cli/v3/domains/{domain}/inboxes/{inbox_name}`
- **Email**: `GET https://api.mailinator.com/cli/v3/domains/{domain}/messages/{message_id}?format={format}`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### "Authentication failed" error
- Verify your API token is correct
- Check that the token is properly set in environment variable or config file

### "No cached inbox found" error
- Run the `inbox` command first to populate the cache
- The cache is stored at `~/.mailinator/inbox-cache.json`

### "Wildcard searches require an API token" error
- Wildcard searches (`*` or `prefix*`) require authentication
- Set your API token using environment variable or config file

### "Access forbidden" error
- You may be trying to access a private domain without an API token
- Some operations require authentication even in public domain

## Support

For issues related to the Mailinator API itself, visit: [Mailinator Support](https://www.mailinator.com/support)

For CLI tool issues, please open an issue in the repository.
