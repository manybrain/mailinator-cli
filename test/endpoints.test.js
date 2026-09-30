import assert from 'node:assert/strict';
import test from 'node:test';

import { getEmailUrl, getInboxUrl } from '../src/api/endpoints.js';

test('builds an inbox URL for a hyphenated name', () => {
  assert.equal(
    getInboxUrl('public', 'kenst-vibium-0722'),
    'https://api.mailinator.com/cli/v3/domains/public/inboxes/kenst-vibium-0722',
  );
});

test('encodes dynamic API path segments', () => {
  assert.equal(
    getInboxUrl('custom/domain', 'kenst/inbox'),
    'https://api.mailinator.com/cli/v3/domains/custom%2Fdomain/inboxes/kenst%2Finbox',
  );
  assert.equal(
    getEmailUrl('custom/domain', 'message/id', 'text/plain'),
    'https://api.mailinator.com/cli/v3/domains/custom%2Fdomain/messages/message%2Fid?format=text%2Fplain',
  );
});
