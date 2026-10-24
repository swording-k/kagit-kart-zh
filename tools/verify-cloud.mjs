import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.KART_TEST_URL || 'http://127.0.0.1:8790/kart/';
const out = new URL('../tools/out/', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const failures = [];

async function open(viewport, mobile = false) {
  const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(String(error)));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(base);
  await page.waitForFunction(() => window.__kk?.ready === true, { timeout: 30000 });
  return { context, page };
}

try {
  const desktop = await open({ width: 1280, height: 720 });
  await desktop.page.screenshot({ path: fileURLToPath(new URL('cloud-desktop.png', out)) });
  const key = 'tt:meadow:120:tilki';
  const record = { bestLap: 38.75, bestRace: 118.1, ghost: { hz: 20, frames: [0, 1, 2, 3], checkpoints: [] } };
  await desktop.page.evaluate(async ({ key, record }) => {
    const { createStorage } = await import('/kart/src/core/storage.js');
    const storage = createStorage();
    await storage.ready;
    storage.set(key, record);
  }, { key, record });
  await desktop.page.waitForFunction(async key => {
    const response = await fetch('/kart/api/storage');
    return (await response.json()).records[key]?.bestLap === 38.75;
  }, key);
  await desktop.page.reload();
  await desktop.page.waitForFunction(() => window.__kk?.ready === true, { timeout: 30000 });
  const restored = await desktop.page.evaluate(async key => {
    const { createStorage } = await import('/kart/src/core/storage.js');
    const storage = createStorage();
    await storage.ready;
    return storage.get(key, null);
  }, key);
  assert.deepEqual(restored, record);
  await desktop.context.close();

  const mobile = await open({ width: 390, height: 844 }, true);
  assert.equal((await (await mobile.context.request.get(base + 'api/storage')).json()).records[key], undefined);
  await mobile.page.screenshot({ path: fileURLToPath(new URL('cloud-mobile.png', out)) });
  await mobile.context.close();
  assert.deepEqual(failures, []);
  console.log(JSON.stringify({ cloudSave: true, isolated: true, screenshots: ['cloud-desktop.png', 'cloud-mobile.png'], failures }));
} finally {
  await browser.close();
}
