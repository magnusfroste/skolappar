import http from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../app.mjs';

// A valid 1×1 PNG.
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export const INDEX_HTML = `<!doctype html><html lang="sv"><head>
<title>Skolappar - Pedagogiska appar</title>
<meta name="description" content="Standard">
<meta property="og:title" content="Standard">
<meta property="og:image" content="https://www.skolappar.com/og-image.jpg">
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://www.skolappar.com/" />
</head><body><div id="root"><div class="app-loading" role="status">Laddar</div></div></body></html>`;

export function quietLog() {
  const lines = [];
  return { lines, info: (m) => lines.push(m), warn: (m) => lines.push(m), error: (m) => lines.push(m) };
}

/** Start the app on a random port with a temp DATA_DIR and a fake dist/. */
export async function startServer({ adminKey = 'test-admin-key', agentKeyHashes = [], env = {}, submitLimit = 5, checkLimit = 30, fetchOutside, siteUrl = 'https://skolappar.test' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'skolappar-test-'));
  const distDir = join(root, 'dist');
  mkdirSync(join(distDir, 'assets'), { recursive: true });
  writeFileSync(join(distDir, 'index.html'), INDEX_HTML);
  writeFileSync(join(distDir, 'assets', 'app-abc123.js'), 'console.log("hi")');
  const log = quietLog();
  const app = createApp({
    port: 0,
    dataDir: join(root, 'data'),
    distDir,
    siteUrl,
    adminKey,
    agentKeyHashes,
    submitLimit,
    checkLimit,
    voteLimit: 1000,
    allowPrivateFetch: true,
    env,
  }, { log, fetchOutside });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  return {
    app,
    base,
    log,
    root,
    async stop() {
      await app.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/** A tiny server that hands out images (and counts requests). */
export async function startImageServer() {
  let hits = 0;
  const server = http.createServer((req, res) => {
    hits++;
    if (req.url.startsWith('/missing')) {
      res.writeHead(404);
      res.end();
      return;
    }
    if (req.url.startsWith('/not-an-image')) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end('<html>nope</html>');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': PNG.length });
    res.end(PNG);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    get hits() { return hits; },
    stop: () => new Promise((r) => server.close(r)),
  };
}

export function api(base, { key } = {}) {
  return async (method, path, body, headers = {}) => {
    const h = { ...headers };
    if (key) h.Authorization = `Bearer ${key}`;
    let payload;
    if (body !== undefined) {
      h['Content-Type'] = h['Content-Type'] || 'application/json';
      payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    }
    const res = await fetch(base + path, { method, headers: h, body: payload });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: res.status, headers: res.headers, text, json };
  };
}

export const CAT = {
  math: '11111111-1111-4111-8111-111111111111',
  age: '22222222-2222-4222-8222-222222222222',
  game: '33333333-3333-4333-8333-333333333333',
};
export const APP1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const APP2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const PENDING = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const IDEA1 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

export function samplePayload(imageBase) {
  return {
    categories: [
      { id: CAT.math, name: 'Matte', slug: 'matte', type: 'subject', icon: 'calculator', color: '#f00', sort_order: 1, created_at: '2025-12-05T09:44:04.123456+00:00' },
      { id: CAT.age, name: 'FK–2', slug: 'fk-2', type: 'age', sort_order: 1 },
      { id: CAT.game, name: 'Spel', slug: 'spel', type: 'app_type', sort_order: 1 },
    ],
    apps: [
      { id: APP1, user_id: 'u1', creator_name: 'Magnus', title: 'Plusspelet', description: 'Öva plus', url: 'https://plus.example', image_url: `${imageBase}/storage/v1/object/public/app-images/u1/plus.png`, status: 'approved', is_featured: true, upvotes_count: 3, comments_count: 0, clicks_count: 10, created_at: '2025-12-06T10:00:00+00:00', updated_at: '2025-12-07T10:00:00+00:00' },
      { id: APP2, user_id: 'u2', creator_name: 'Anna', title: 'Minus', description: 'Öva minus', url: 'https://minus.example', image_url: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fminus.example?w=1200', status: 'approved', upvotes_count: 1, clicks_count: 2, created_at: '2025-12-08T10:00:00Z' },
      { id: PENDING, user_id: 'u3', title: 'Hemlig', description: 'Ej granskad', url: 'https://pending.example', status: 'pending' },
    ],
    app_categories: [
      { app_id: APP1, category_id: CAT.math },
      { app_id: APP1, category_id: CAT.age },
      { app_id: APP2, category_id: CAT.math },
      { app_id: APP2, category_id: CAT.game },
    ],
    resources: [
      { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', title: 'Kom igång', slug: 'kom-igang', excerpt: 'Så börjar du', content: '# Hej', category: 'tips', sort_order: 1, is_published: true },
      { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', title: 'Utkast', slug: 'utkast', content: 'x', category: 'tips', is_published: false },
    ],
    settings: [
      { key: 'brand_name', value: 'skolappar' },
      { key: 'brand_logo_url', value: `${imageBase}/storage/v1/object/public/branding/logo.png` },
      { key: 'theme_colors', value: { primary: '12 90% 58%' } },
      { key: 'site_url', value: 'https://www.skolappar.com' },
      { key: 'show_top_ideas', value: true },
    ],
    ideas: [
      { id: IDEA1, user_id: 'u1', creator_name: 'Magnus', title: 'Klockan', description: 'Lär dig klockan', status: 'open', upvotes_count: 2, comments_count: 1 },
    ],
  };
}
