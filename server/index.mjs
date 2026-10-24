import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataDir = path.resolve(process.env.KART_DATA_DIR || path.join(root, 'data'));
const port = Number(process.env.KART_PORT || 8790);
const origin = process.env.KART_ORIGIN || 'https://yanchuan.online';
const mount = '/kart/';
await mkdir(dataDir, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path.join(dataDir, 'kart.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA max_page_count=25600; CREATE TABLE IF NOT EXISTS saves (session TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(session,key));');
const list = db.prepare('SELECT key,value FROM saves WHERE session=?');
const upsert = db.prepare('INSERT INTO saves(session,key,value,updated_at) VALUES(?,?,?,?) ON CONFLICT(session,key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at');
const remove = db.prepare('DELETE FROM saves WHERE session=? AND key=?');
const count = db.prepare('SELECT COUNT(*) AS n FROM saves WHERE session=?');
const mime = new Map([['.js', 'text/javascript; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8']]);
const head = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui;background:#fafaf7}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';

function reply(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function session(req, res) {
  const id = /(?:^|;\s*)kart_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  if (id) return id;
  const fresh = randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie', `kart_session=${fresh}; Path=/kart/; HttpOnly; SameSite=Strict${origin.startsWith('https:') ? '; Secure' : ''}`);
  return fresh;
}

function validKey(key) {
  return key === 'settings' || key === 'uiHints' || /^tt:[a-z0-9_-]+:(80|120|200):[a-z0-9_-]+$/.test(key);
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 262144) throw new Error('too large');
  }
  return JSON.parse(raw);
}

async function serveFile(res, pathname) {
  let relative;
  try { relative = decodeURIComponent(pathname.slice(mount.length)); } catch { return reply(res, 400, { error: 'bad path' }); }
  if (relative === '' || relative === 'index.html') {
    const html = await readFile(path.join(root, 'index.html'), 'utf8');
    return reply(res, 200, head + html + '</body></html>', 'text/html; charset=utf-8');
  }
  if (relative === 'favicon.ico') {
    res.writeHead(302, { Location: '/kart/favicon.svg' }); res.end(); return;
  }
  if (!/^(src|vendor)\/[a-zA-Z0-9_./-]+$/.test(relative) && relative !== 'favicon.svg') return reply(res, 404, { error: 'not found' });
  const filename = path.resolve(root, relative);
  const allowed = relative === 'favicon.svg' || ['src', 'vendor'].some(dir => filename.startsWith(path.join(root, dir) + path.sep));
  if (!allowed) return reply(res, 404, { error: 'not found' });
  try {
    if (!(await stat(filename)).isFile()) return reply(res, 404, { error: 'not found' });
    return reply(res, 200, await readFile(filename), mime.get(path.extname(filename)) || 'application/octet-stream');
  } catch { return reply(res, 404, { error: 'not found' }); }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    if (url.pathname === '/favicon.ico') { res.writeHead(302, { Location: '/kart/favicon.svg' }); res.end(); return; }
    if (url.pathname === '/kart') { res.writeHead(308, { Location: '/kart/' }); res.end(); return; }
    if (!url.pathname.startsWith(mount)) return reply(res, 404, { error: 'not found' });
    if (url.pathname === '/kart/api/health') return reply(res, 200, { ok: true });
    if (url.pathname === '/kart/api/storage' && req.method === 'GET') {
      const id = session(req, res);
      const records = {};
      for (const row of list.all(id)) records[row.key] = JSON.parse(row.value);
      return reply(res, 200, { records });
    }
    if (url.pathname.startsWith('/kart/api/storage/')) {
      if (req.headers.origin !== origin) return reply(res, 403, { error: 'origin' });
      let key;
      try { key = decodeURIComponent(url.pathname.slice('/kart/api/storage/'.length)); } catch { return reply(res, 400, { error: 'key' }); }
      if (!validKey(key)) return reply(res, 400, { error: 'key' });
      const id = session(req, res);
      if (req.method === 'DELETE') { remove.run(id, key); return reply(res, 200, { ok: true }); }
      if (req.method !== 'PUT' || !req.headers['content-type']?.startsWith('application/json')) return reply(res, 405, { error: 'method' });
      let payload;
      try { payload = await body(req); } catch { return reply(res, 400, { error: 'invalid body' }); }
      if (!payload || !Object.hasOwn(payload, 'value')) return reply(res, 400, { error: 'value' });
      if (count.get(id).n >= 100 && !list.all(id).some(row => row.key === key)) return reply(res, 429, { error: 'save limit' });
      upsert.run(id, key, JSON.stringify(payload.value), Date.now());
      return reply(res, 200, { ok: true });
    }
    if (url.pathname.startsWith('/kart/api/')) return reply(res, 404, { error: 'not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, { error: 'method' });
    await serveFile(res, url.pathname);
  } catch (error) {
    console.error('Kart request failed:', error);
    reply(res, 500, { error: 'server' });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Kart listening on 127.0.0.1:${port}`));
