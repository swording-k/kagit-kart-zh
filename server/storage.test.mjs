import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const data = await mkdtemp(path.join(os.tmpdir(), 'kart-storage-'));
const port = 18790 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}/kart/`;
let child;

async function start() {
  child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: root,
    env: { ...process.env, KART_DATA_DIR: data, KART_PORT: String(port), KART_ORIGIN: `http://127.0.0.1:${port}` },
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(base + 'api/health')).ok) return; } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('server did not start');
}

async function stop() {
  child.kill();
  await new Promise(resolve => child.once('exit', resolve));
}

test('cloud saves survive restart and stay isolated by cookie', async () => {
  try {
    await start();
    const first = await fetch(base + 'api/storage');
    const cookie = first.headers.get('set-cookie').split(';')[0];
    assert.deepEqual((await first.json()).records, {});
    const record = { bestLap: 39.13, ghost: { hz: 20, frames: [0, 1, 2, 3], checkpoints: [] } };
    const url = base + 'api/storage/tt%3Ameadow%3A120%3Atilki';
    const headers = { cookie, origin: `http://127.0.0.1:${port}`, 'content-type': 'application/json' };
    assert.equal((await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ value: record }) })).status, 200);
    assert.equal((await fetch(url, { method: 'PUT', headers: { ...headers, origin: 'https://elsewhere.invalid' }, body: '{}' })).status, 403);
    assert.equal((await fetch(base + 'api/storage/../bad', { method: 'PUT', headers, body: '{}' })).status, 404);
    assert.deepEqual((await (await fetch(base + 'api/storage', { headers: { cookie } })).json()).records['tt:meadow:120:tilki'], record);
    assert.deepEqual((await (await fetch(base + 'api/storage')).json()).records, {});
    await stop();
    await start();
    assert.deepEqual((await (await fetch(base + 'api/storage', { headers: { cookie } })).json()).records['tt:meadow:120:tilki'], record);
    assert.equal((await fetch(base + 'index.html')).status, 200);
    assert.match(await (await fetch(base)).text(), /纸艺卡丁车/);
    assert.equal((await fetch(base + 'README-zh.md')).status, 404);
    assert.equal((await fetch(base + 'src/..%2FREADME-zh.md')).status, 404);
  } finally {
    if (child?.exitCode === null) await stop();
    await rm(data, { recursive: true, force: true });
  }
});
