import assert from 'node:assert/strict';
import { launch } from './pw.mjs';

const url = 'http://127.0.0.1:8765/';
const { browser, renderer } = await launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });

try {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await page.waitForFunction(() => window.__kk?.ready, { timeout: 30000 });

  const tt = await page.evaluate(async () => {
    const kk = window.__kk;
    const game = kk.game;
    kk.setAutoPause(false);
    game.storage.remove('tt:meadow:120:tilki');
    await kk.startRace({ track: 'meadow', mode: 'tt', laps: 1, cls: '120', character: 'tilki', seed: 4, autopilot: true, skipIntro: true });
    kk.simulate(90);
    const finished = kk.state();
    const best = game.api.getBest({ track: 'meadow', cls: '120', character: 'tilki' });
    const stored = game.storage.get('tt:meadow:120:tilki', null);
    return { phase: finished.phase, finishTime: finished.player.finishTime, best, ghostFrames: stored?.ghost?.frames?.length / 4 || 0 };
  });
  assert.equal(tt.phase, 'results', 'A real one-lap time trial must finish');
  assert.ok(tt.finishTime > 0 && tt.best?.race > 0 && tt.ghostFrames > 0, 'Time trial must save a usable ghost');

  await page.reload();
  await page.waitForFunction(() => window.__kk?.ready, { timeout: 30000 });
  const persisted = await page.evaluate(async () => {
    const kk = window.__kk;
    const best = kk.game.api.getBest({ track: 'meadow', cls: '120', character: 'tilki' });
    await kk.startRace({ track: 'meadow', mode: 'tt', laps: 1, cls: '120', character: 'tilki', autopilot: false, skipIntro: true });
    return { best, ghost: !!kk.game.ghost, mode: kk.game.mode };
  });
  assert.equal(persisted.best.race, tt.best.race, 'Personal best must survive reload');
  assert.equal(persisted.ghost, true, 'Saved ghost must load into the next time trial');
  await page.keyboard.press('r');
  await page.waitForFunction(() => window.__kk.game.phase === 'countdown', { timeout: 30000 });
  assert.equal(await page.evaluate(() => !!window.__kk.game.ghost), true, 'R must restart time trial with the ghost');

  const gp = await page.evaluate(async () => {
    const kk = window.__kk;
    const game = kk.game;
    const startAndSkip = async start => {
      const timer = setInterval(() => { if (game.phase === 'intro') game.api.skipCinematic(); }, 20);
      try { await start(); } finally { clearInterval(timer); }
    };
    await startAndSkip(() => kk.startGP({ cls: '120', character: 'tilki', seed: 3, autopilot: true }));
    const tracks = [];
    for (let i = 0; i < 4; i++) {
      tracks.push(game.trackDef.id);
      kk.finishNow();
      if (game.phase !== 'results') throw new Error(`GP chapter ${i + 1} did not produce results`);
      if (i < 3) await startAndSkip(() => game.api.nextRace());
    }
    const standings = { ...game.gp.standings };
    const timer = setInterval(() => { if (game.phase === 'podium') game.api.skipCinematic(); }, 20);
    try { await game.api.nextRace(); } finally { clearInterval(timer); }
    return { tracks, standings, phase: game.phase, active: game.gp.active };
  });
  assert.deepEqual(gp.tracks, ['meadow', 'bosphorus', 'glacier', 'desk']);
  assert.ok(Object.keys(gp.standings).length === 8, 'GP standings must include all drivers');
  assert.equal(gp.phase, 'podium');

  await page.evaluate(() => window.__kk.game.api.quitToTitle());
  await page.keyboard.press('m');
  await page.waitForTimeout(100);
  const muted = await page.evaluate(() => window.__kk.game.settings.muted);
  assert.equal(typeof muted, 'boolean');
  await page.keyboard.press('f');
  await page.waitForFunction(() => !!document.fullscreenElement, { timeout: 10000 });
  await page.keyboard.press('f');
  await page.waitForFunction(() => !document.fullscreenElement, { timeout: 10000 });
  await page.reload();
  await page.waitForFunction(() => window.__kk?.ready, { timeout: 30000 });
  assert.equal(await page.evaluate(() => window.__kk.game.settings.muted), muted, 'Mute setting must persist');
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.__kk.errors.slice()), []);

  console.log(JSON.stringify({ renderer, timeTrial: tt, persisted, gp, fullscreen: true, mutePersisted: true, errors }));
} finally {
  await context.close();
  await browser.close();
}
