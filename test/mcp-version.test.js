import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import test from 'node:test';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

async function getAvailablePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => {
    if (error) reject(error);
    else resolve();
  }));
  return port;
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The child process may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test('MCP server reports the package version', async (t) => {
  const port = await getAvailablePort();
  const child = spawn(
    process.execPath,
    ['bin/index.js', '--start-mcp-server', '--port', String(port)],
    { cwd: new URL('..', import.meta.url), stdio: 'ignore' },
  );

  t.after(() => child.kill());

  await waitForServer(`http://127.0.0.1:${port}/health`);
  const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'version-test', version: '1.0.0' },
      },
    }),
  });

  assert.equal(response.status, 200);
  const responseText = await response.text();
  const dataLine = responseText
    .split('\n')
    .find((line) => line.startsWith('data: '));
  assert.ok(dataLine, 'expected an SSE data event');
  const body = JSON.parse(dataLine.slice('data: '.length));
  assert.equal(body.result.serverInfo.version, packageJson.version);
});
