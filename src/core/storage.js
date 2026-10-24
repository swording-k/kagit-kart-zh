// JSON storage with the `kk1:` prefix. Every access is guarded: localStorage can throw on lookup
// (sandboxed frames, blocked site data), so an in-memory map backs every value.

const PREFIX = 'kk1:';
const TT_PREFIX = PREFIX + 'tt:';

function isQuotaError(e) {
  return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
}

export function createStorage() {
  const memory = new Map();
  const pending = new Set();
  const versions = new Map();
  let cloud = false;
  let queue = Promise.resolve();

  function ls() {
    try { return window.localStorage || null; } catch { return null; }
  }

  function get(key, fallback) {
    const k = PREFIX + key;
    if (memory.has(k)) return memory.get(k);
    try {
      const store = ls();
      const raw = store ? store.getItem(k) : null;
      if (raw == null) return fallback;
      const v = JSON.parse(raw);
      memory.set(k, v);
      return v;
    } catch {
      return fallback;
    }
  }

  // Full storage is in practice accumulated time-trial ghosts (tens of KB each, one per track/class/
  // character). They are the most expendable data: strip their ghost payloads, largest first, keeping
  // bestLap/bestRace, until the space freed covers what the write adds, then retry it.
  function writeAfterStrippingGhosts(store, k, json) {
    const entries = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key === k || !key || !key.startsWith(TT_PREFIX)) continue;
      const raw = store.getItem(key);
      if (raw && raw.includes('"ghost"')) entries.push({ key, raw });
    }
    entries.sort((a, b) => b.raw.length - a.raw.length);
    const old = store.getItem(k);
    // Quota counts key + value characters.
    let need = old == null ? k.length + json.length : json.length - old.length;
    for (const { key, raw } of entries) {
      let rec;
      try { rec = JSON.parse(raw); } catch { continue; }
      if (!rec || typeof rec !== 'object' || !('ghost' in rec)) continue;
      delete rec.ghost;
      const slim = JSON.stringify(rec);
      try { store.setItem(key, slim); } catch { continue; }
      if (memory.has(key)) memory.set(key, rec);
      need -= raw.length - slim.length;
      if (need <= 0) {
        try { store.setItem(k, json); return true; } catch { /* quota counted differently: strip more */ }
      }
    }
    try { store.setItem(k, json); return true; } catch { /* the write's own ghost is too big */ }
    // A new time-trial record whose own ghost does not fit still keeps its times.
    if (!k.startsWith(TT_PREFIX)) return false;
    try {
      const rec = JSON.parse(json);
      if (!rec || typeof rec !== 'object' || !('ghost' in rec)) return false;
      delete rec.ghost;
      store.setItem(k, JSON.stringify(rec));
      return true;
    } catch {
      return false;
    }
  }

  function set(key, value) {
    const k = PREFIX + key;
    memory.set(k, value);
    markPending(key);
    try {
      const store = ls();
      if (!store) return true;
      const json = JSON.stringify(value);
      try {
        store.setItem(k, json);
        return true;
      } catch (e) {
        if (!isQuotaError(e)) return false;
      }
      return writeAfterStrippingGhosts(store, k, json);
    } catch {
      return false;
    }
  }

  function remove(key) {
    const k = PREFIX + key;
    memory.delete(k);
    try { ls()?.removeItem(k); } catch { /* ignored: memory copy already gone */ }
    markPending(key);
  }

  function markPending(key) {
    pending.add(key);
    versions.set(key, (versions.get(key) || 0) + 1);
    try { ls()?.setItem(PREFIX + 'pending:' + key, '1'); } catch { /* memory remains usable */ }
    if (cloud) flush(key);
  }

  function flush(key) {
    queue = queue.then(async () => {
      if (!cloud || !pending.has(key)) return;
      const version = versions.get(key);
      const value = get(key, null);
      const response = await fetch(new URL('api/storage/' + encodeURIComponent(key), document.baseURI), {
        method: value === null ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: value === null ? undefined : JSON.stringify({ value }),
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Cloud save failed: ${response.status}`);
      if (versions.get(key) !== version) { flush(key); return; }
      pending.delete(key);
      try { ls()?.removeItem(PREFIX + 'pending:' + key); } catch { /* harmless */ }
    }).catch(() => { cloud = false; });
  }

  async function connect() {
    if (!location.pathname.startsWith('/kart/')) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(new URL('api/storage', document.baseURI), {
        credentials: 'same-origin', signal: controller.signal,
      });
      if (!response.ok) return;
      const { records } = await response.json();
      if (!records || typeof records !== 'object') return;
      const store = ls();
      if (store) {
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k?.startsWith(PREFIX + 'pending:')) pending.add(k.slice((PREFIX + 'pending:').length));
        }
      }
      for (const [key, value] of Object.entries(records)) {
        if (pending.has(key)) continue;
        memory.set(PREFIX + key, value);
        try { store?.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* cloud copy remains */ }
      }
      if (store) {
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k?.startsWith(PREFIX) && !k.startsWith(PREFIX + 'pending:')) {
            const key = k.slice(PREFIX.length);
            if (!(key in records)) pending.add(key);
          }
        }
      }
      cloud = true;
      for (const key of pending) flush(key);
    } catch { /* local storage is the offline fallback */ }
    finally { clearTimeout(timeout); }
  }

  const ready = connect();
  return { get, set, remove, ready };
}
