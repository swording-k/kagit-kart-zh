import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/';
const out = new URL('../../evidence/', import.meta.url);
const shot = name => fileURLToPath(new URL(name, out));
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'],
});

async function makePage(viewport, mobile = false) {
  const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  const external = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${m.text()} @ ${m.location().url}`); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:8765/')) external.push(r.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await page.waitForFunction(() => window.__kk?.ready === true, { timeout: 30000 });
  assert.deepEqual(external, [], 'The game should make no external requests');
  return { context, page, errors };
}

async function key(page, keyName) {
  await page.keyboard.press(keyName);
  await page.waitForTimeout(300);
}

async function state(page) {
  return page.evaluate(() => window.__kk.state());
}

try {
  const desktop = await makePage({ width: 1280, height: 720 });
  const { page } = desktop;
  await page.screenshot({ path: shot('cover-final.png') });
  assert.equal(await page.evaluate(() => JSON.parse(window.render_game_to_text()).menu), 'title');
  await key(page, 'Enter');
  assert.equal(await page.evaluate(() => window.__kk.game.menuScreen), 'mode');
  await key(page, 'ArrowRight');
  await key(page, 'Enter');
  assert.equal(await page.evaluate(() => window.__kk.game.menuScreen), 'class');
  await key(page, 'Enter');
  assert.equal(await page.evaluate(() => window.__kk.game.menuScreen), 'character');
  await key(page, 'Enter');
  assert.equal(await page.evaluate(() => window.__kk.game.menuScreen), 'track');
  await key(page, 'Enter');
  await page.waitForFunction(() => window.__kk.game.phase === 'intro' || window.__kk.game.phase === 'countdown' || window.__kk.game.phase === 'race', { timeout: 30000 });
  await page.evaluate(() => window.__kk.game.api.skipCinematic());
  await page.waitForFunction(() => window.__kk.game.phase === 'race', { timeout: 15000 });
  assert.equal(await page.evaluate(() => window.__kk.game.mode), 'single');
  assert.equal((await state(page)).player.autopilot, false);
  const before = (await state(page)).player;
  await page.keyboard.down('w');
  await page.waitForTimeout(120);
  await page.evaluate(() => window.advanceTime(2000));
  const accelerated = (await state(page)).player;
  assert.ok(accelerated.speed > before.speed + 1, `W should accelerate: ${before.speed} -> ${accelerated.speed}`);
  await page.keyboard.down('d');
  await page.waitForTimeout(120);
  await page.evaluate(() => window.advanceTime(500));
  const steered = (await state(page)).player;
  assert.notEqual(steered.heading, accelerated.heading, 'D should steer');
  await page.keyboard.down('Space');
  await page.waitForTimeout(120);
  await page.evaluate(() => window.advanceTime(600));
  const drifted = (await state(page)).player;
  assert.ok(drifted.drift.active || drifted.airTime > 0 || drifted.drift.charge > 0, 'Space should hop or drift');
  await page.keyboard.up('Space');
  await page.keyboard.up('d');
  await page.keyboard.up('w');
  await page.evaluate(() => window.__kk.giveItem(window.__kk.game.player.index, 'rocket'));
  await key(page, 'x');
  await page.evaluate(() => window.advanceTime(100));
  const item = (await state(page)).player.item;
  assert.equal(item, null, 'X should use the held item');
  await key(page, 'Escape');
  assert.equal((await state(page)).paused, true);
  await page.screenshot({ path: shot('pause-final.png') });
  await key(page, 'Escape');
  assert.equal((await state(page)).paused, false);
  await page.screenshot({ path: shot('race-keyboard-final.png') });
  const desktopResult = { accelerated: accelerated.speed, headingChange: steered.heading - accelerated.heading, drift: drifted.drift, itemUsed: item === null, errors: desktop.errors };
  assert.deepEqual(desktop.errors, []);
  await desktop.context.close();

  const mobile = await makePage({ width: 390, height: 844 }, true);
  const mp = mobile.page;
  await mp.evaluate(async () => {
    window.__kk.game.api.setSetting('touchControls', 'on');
    await window.__kk.startRace({ mode: 'single', track: 'meadow', cls: '120', character: 'tilki', autopilot: false, skipIntro: true });
  });
  await mp.waitForFunction(() => window.__kk.game.phase === 'race', { timeout: 15000 });
  await mp.screenshot({ path: shot('mobile-portrait-final.png') });
  const controlPositions = await mp.evaluate(() => {
    const center = selector => {
      const el = document.querySelector(selector);
      if (!el || el.getClientRects().length === 0) throw new Error(`Missing ${selector}`);
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    };
    return { steer: center('.kk-steer'), gas: center('.kk-tgas'), drift: center('.kk-tdrift'), item: center('.kk-titem'), pause: center('.kk-tpause') };
  });
  const cdp = await mp.context().newCDPSession(mp);
  const point = (id, p) => ({ id, x: p.x, y: p.y });
  const touch = async (type, points, changed = points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points, changedTouches: changed.map(p => p.id) });
  const gas = point(1, controlPositions.gas);
  const steer = point(2, controlPositions.steer);
  await touch('touchStart', [gas]);
  await touch('touchStart', [gas, steer]);
  await touch('touchMove', [gas, { ...steer, x: steer.x + 55 }]);
  await mp.waitForTimeout(100);
  const activeTouch = await mp.evaluate(() => ({ ...window.__kk.game.input.touch }));
  assert.equal(activeTouch.throttle, 1);
  assert.ok(activeTouch.steer > 0.3, `Touch steering should respond: ${activeTouch.steer}`);
  await mp.evaluate(() => window.advanceTime(1500));
  assert.ok((await state(mp)).player.speed > 1, 'Touch gas should accelerate');
  await touch('touchEnd', []);
  await mp.waitForTimeout(100);
  const released = await mp.evaluate(() => ({ ...window.__kk.game.input.touch }));
  assert.equal(released.throttle, 0);
  assert.equal(released.steer, 0);
  const driftPoint = point(3, controlPositions.drift);
  await touch('touchStart', [driftPoint]);
  await mp.waitForTimeout(100);
  assert.equal(await mp.evaluate(() => window.__kk.game.input.touch.drift), true);
  await touch('touchCancel', []);
  await mp.waitForTimeout(100);
  assert.equal(await mp.evaluate(() => window.__kk.game.input.touch.drift), false);
  await mp.touchscreen.tap(controlPositions.pause.x, controlPositions.pause.y);
  assert.equal((await state(mp)).paused, true);
  await mp.screenshot({ path: shot('mobile-pause-final.png') });
  await mp.locator('.kk-pause .kk-tocrow').first().tap();
  assert.equal((await state(mp)).paused, false);
  await mp.evaluate(() => window.__kk.giveItem(window.__kk.game.player.index, 'rocket'));
  await touch('touchStart', [point(4, controlPositions.item)]);
  await mp.evaluate(() => window.advanceTime(100));
  await touch('touchEnd', []);
  assert.equal((await state(mp)).player.item, null, 'Touch item button should use the held item');
  const mobileResult = { activeTouch, released, controlPositions, errors: mobile.errors };
  assert.deepEqual(mobile.errors, []);
  await mobile.context.close();

  const landscape = await makePage({ width: 844, height: 390 }, true);
  await landscape.page.evaluate(async () => {
    window.__kk.game.api.setSetting('touchControls', 'on');
    await window.__kk.startRace({ mode: 'single', track: 'meadow', cls: '120', character: 'tilki', autopilot: false, skipIntro: true });
  });
  await landscape.page.waitForFunction(() => window.__kk.game.phase === 'race', { timeout: 15000 });
  await landscape.page.screenshot({ path: shot('mobile-landscape-final.png') });
  const landscapeControls = await landscape.page.evaluate(() => {
    const required = ['.kk-steer', '.kk-tgas', '.kk-tdrift', '.kk-titem', '.kk-tpause'];
    return required.map(selector => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return { selector, visible: !!rect && rect.width > 0 && rect.height > 0 && rect.x < innerWidth && rect.y < innerHeight && rect.right > 0 && rect.bottom > 0 };
    });
  });
  assert.ok(landscapeControls.every(control => control.visible), 'All landscape touch controls should be on screen');
  assert.deepEqual(landscape.errors, []);
  await landscape.context.close();

  console.log(JSON.stringify({ desktop: desktopResult, mobile: mobileResult, landscapeControls }));
} finally {
  await browser.close();
}
