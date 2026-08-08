import assert from 'node:assert/strict';
import test from 'node:test';

import { validateInboxName } from '../src/validators/input-validator.js';
import { listInboxSchema } from '../src/mcp/tools/list-inbox-tool.js';
import { ValidationError } from '../src/utils/errors.js';

test('accepts inbox names containing internal hyphens', () => {
  for (const inboxName of [
    'jango555',
    'kenst.vibium',
    'kenst-vibium-0722',
    'test-inbox.example',
  ]) {
    assert.doesNotThrow(() => validateInboxName(inboxName), inboxName);
  }
});

test('rejects inbox names with punctuation at either end', () => {
  for (const inboxName of ['-kenst', 'kenst-', '.kenst', 'kenst.']) {
    assert.throws(
      () => validateInboxName(inboxName),
      ValidationError,
      inboxName,
    );
  }
});

test('rejects unsupported inbox-name characters', () => {
  assert.throws(
    () => validateInboxName('kenst/inbox'),
    ValidationError,
  );
});

test('MCP input schema accepts a hyphenated inbox name', () => {
  assert.deepEqual(
    listInboxSchema.parse({
      inbox_name: 'kenst-vibium-0722',
      domain: 'public',
    }),
    {
      inbox_name: 'kenst-vibium-0722',
      domain: 'public',
    },
  );
});
