// Teaching: the first-race controls card and one-time contextual hints (each shown once ever), plus the
// hardware-acceleration note on the title and menus (sysEl, above the menus) until the player closes it.
import { h, svg, lt } from './dom.js';
import { sheet } from './menus.js';
import { controlRows } from './forms.js';
import { ROTATE_PHONE } from './icons.js';

const G = (a) => h('span', { 'data-glyph': a });

const TEXT = {
  corner: () => ['漂移：', G('drift'), ' 按住并转向'],
  tier: () => ['出现火花后：', G('drift'), ' 松开 → 涡轮加速'],
  ramp: () => ['在坡道边缘按漂移键 ', G('drift')],
  item: () => [G('item'), ' 使用，', G('brake'), ' + ', G('item'), ' 向后投掷'],
  portrait: () => [svg(ROTATE_PHONE, 'kk-rot'), '横屏游玩，视野更开阔'],
};

export function createHints(ctx) {
  const { game } = ctx;
  const el = h('div', { class: 'kk-layer' });
  const queue = [];
  let current = null;
  let teach = null;
  let teachLeft = 0;
  let race = null; // { turn: Float32Array, n, length, ramps: [t] }
  let seen = ctx.store.get('uiHints', {}) || {};
  const sysEl = h('div', { class: 'kk-layer' });
  let hw = null;

  function once(key) {
    if (seen[key] || queue.includes(key) || current?.key === key) return;
    queue.push(key);
  }

  function show(key) {
    seen = { ...seen, [key]: true };
    ctx.store.set('uiHints', seen);
    const note = h('div', { class: key === 'portrait' ? 'kk-hint kk-hint-top' : 'kk-hint' }, h('div', { class: 'kk-hint-in' }, h('i', { class: 'kk-tape' }),
      sheet(TEXT[key](ctx.device()), { dk: 4 })));
    el.appendChild(note);
    ctx.glyphs(note);
    current = { key, el: note, t: key === 'portrait' ? 4.5 : 3.8 };
  }

  function closeHw(e) {
    e?.stopPropagation();
    if (!hw) return;
    hw.remove();
    hw = null;
    seen = { ...seen, hwaccel: true };
    ctx.store.set('uiHints', seen);
    ctx.click();
  }

  function updateHw(view) {
    const want = !!game.renderer?.software && !seen.hwaccel && (view === 'title' || view.startsWith('menu:'));
    if (want === !!hw) return;
    if (!want) { hw.remove(); hw = null; return; }
    hw = h('div', { class: 'kk-hw', 'data-kk-hint': 'hwaccel', role: 'note', onclick: closeHw }, h('div', { class: 'kk-hint-in' },
      sheet([
        h('span', null, '当前浏览器未启用硬件加速，可在浏览器的“设置 › 系统”中开启以提高流畅度。'),
        h('button', { class: 'kk-hw-x', 'aria-label': '关闭', onclick: closeHw }, '×'),
      ], { dk: 2 })));
    sysEl.appendChild(hw);
  }

  function bind({ track, def }) {
    race = null;
    const S = track?.samples;
    const n = track?.sampleCount || S?.tx?.length || 0;
    if (!S?.tx || n < 60) return;
    const turn = new Float32Array(n);
    const hd = (i) => Math.atan2(S.tx[i % n], S.tz[i % n]);
    for (let i = 0; i < n; i++) {
      let d = hd(i + 50) - hd(i + 10);
      d = Math.atan2(Math.sin(d), Math.cos(d));
      turn[i] = Math.abs(d);
    }
    const ramps = (def?.ramps || track?.def?.ramps || []).filter((r) => r.trick !== false).map((r) => r.t);
    race = { turn, n, length: track.length || n, ramps };
  }

  function unbind() {
    race = null;
    closeTeach(false);
    if (current) { current.el.remove(); current = null; }
    queue.length = 0;
  }

  function openTeach() {
    if (teach || game.settings?.seenTutorial) return;
    if (current?.key === 'portrait') { current.el.remove(); current = null; }
    const dev = ctx.device();
    teach = h('div', { class: 'kk-teach kk-pop' }, sheet([
      h('div', { class: 'kk-kicker' }, '首次出发'),
      h('div', { class: 'kk-h' }, lt('准备好出发了吗？')),
      controlRows(dev, ['转向', '加速', '漂移 / 跳跃', '道具'])], { dk: 3 }));
    el.appendChild(teach);
    teachLeft = 7;
  }

  function closeTeach(markSeen = true) {
    if (!teach) return;
    teach.remove();
    teach = null;
    if (markSeen) ctx.api('setSetting', 'seenTutorial', true);
  }

  return {
    el, sysEl, bind, unbind,
    onCountdown({ n }) { if (n === 3) openTeach(); },
    onDrift({ kart, state, tier }) { if (kart === game.player && state === 'tier' && tier === 1) once('tier'); },
    onItemGet({ kart }) { if (kart === game.player) once('item'); },

    update(dt, view) {
      updateHw(view);
      if (current && view !== 'race' && current.key !== 'portrait') { current.el.remove(); current = null; }
      if (game.touch && innerHeight > innerWidth * 1.1) once('portrait');
      if (teach) {
        if (game.phase === 'race') teachLeft -= dt;
        if (teachLeft <= 0 || view !== 'race') closeTeach(true);
      }
      const p = game.player;
      if (view === 'race' && game.phase === 'race' && p && race) {
        const ti = p.trackInfo;
        const idx = ti?.index;
        if (!seen.corner && typeof idx === 'number' && (p.speed || 0) > 8 && race.turn[idx % race.n] > 0.6) once('corner');
        if (!seen.ramp && typeof ti?.t === 'number') {
          for (const rt of race.ramps) {
            const ahead = (((rt - ti.t) % 1) + 1) % 1 * race.length;
            if (ahead > 20 && ahead < 80) { once('ramp'); break; }
          }
        }
      }
      if (current) {
        current.t -= dt;
        if (current.t <= 0) { current.el.remove(); current = null; }
      }
      const canShow = view === 'race' || (queue[0] === 'portrait' && view !== 'none');
      // a contextual hint waits for the first-race controls card to go: on a phone they would overlap
      if (!current && queue.length && canShow && !game.paused && !teach) show(queue.shift());
    },
    dispose() { unbind(); },
  };
}
