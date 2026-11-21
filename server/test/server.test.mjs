import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, schemaVersion, LATEST_SCHEMA_VERSION } from '../db.mjs';
import { startServer, startImageServer, api, samplePayload, CAT, APP1, APP2, PENDING, IDEA1, PNG } from './helpers.mjs';

const KEY = 'test-admin-key';

describe('schema', () => {
  test('creates the latest schema and is stable when reopened', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skolappar-db-'));
    try {
      const db = openDatabase(dir);
      assert.equal(schemaVersion(db), LATEST_SCHEMA_VERSION);
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all().map((r) => r.name);
      for (const t of ['apps', 'categories', 'app_categories', 'resources', 'settings', 'ideas', 'app_upvotes', 'idea_upvotes', 'app_open_events', 'schema_version']) {
        assert.ok(tables.includes(t), `table ${t} exists`);
      }
      assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
      db.close();
      const again = openDatabase(dir);
      assert.equal(schemaVersion(again), LATEST_SCHEMA_VERSION);
      assert.equal(again.prepare('SELECT COUNT(*) AS n FROM schema_version').get().n, 1);
      again.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('without ADMIN_KEY', () => {
  let s;
  before(async () => { s = await startServer({ adminKey: '' }); });
  after(() => s.stop());

  test('healthz answers 200', async () => {
    const r = await api(s.base)('GET', '/healthz');
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test('admin API, import and MCP refuse with 503', async () => {
    const call = api(s.base, { key: 'anything' });
    for (const [method, path, body] of [['GET', '/api/admin/check'], ['POST', '/api/admin/import', {}], ['POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' }]]) {
      const r = await call(method, path, body);
      assert.equal(r.status, 503, `${method} ${path}`);
      assert.equal(r.json.error, 'ADMIN_KEY not set');
    }
  });

  test('public site still works', async () => {
    const call = api(s.base);
    assert.equal((await call('GET', '/api/apps')).status, 200);
    const page = await call('GET', '/apps');
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    assert.equal(page.headers.get('cache-control'), 'no-cache');
  });
});

describe('with ADMIN_KEY', () => {
  let s;
  let images;
  let admin;
  let pub;
  let importResult;

  before(async () => {
    images = await startImageServer();
    s = await startServer({ adminKey: KEY });
    admin = api(s.base, { key: KEY });
    pub = api(s.base);
    importResult = await admin('POST', '/api/admin/import', samplePayload(images.base));
  });
  after(async () => {
    await s.stop();
    await images.stop();
  });

  test('admin auth: wrong or missing key is 401, right key is 200', async () => {
    assert.equal((await pub('GET', '/api/admin/check')).status, 401);
    assert.equal((await api(s.base, { key: 'wrong' })('GET', '/api/admin/check')).status, 401);
    assert.equal((await admin('GET', '/api/admin/check')).status, 200);
    assert.equal((await api(s.base, { key: 'wrong' })('POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' })).status, 401);
  });

  test('import stores rows and downloads images', async () => {
    assert.equal(importResult.status, 200, importResult.text);
    const { imported, images: img } = importResult.json;
    assert.deepEqual(
      [imported.categories, imported.apps, imported.app_categories, imported.resources, imported.settings, imported.ideas],
      [3, 3, 4, 2, 5, 1]
    );
    assert.equal(img.found, 2); // app image + branding logo; the mShots URL is left alone
    assert.equal(img.stored, 2);
    assert.equal(img.errors.length, 0);

    const app = (await pub('GET', `/api/apps/${APP1}`)).json;
    assert.match(app.image_url, /^\/images\/[0-9a-f]{32}\.png$/);
    assert.equal(app.profile.display_name, 'Magnus');
    assert.equal(app.is_featured, true);
    assert.equal(app.created_at, '2025-12-06T10:00:00.000Z');
    assert.deepEqual(app.categories.map((c) => c.slug).sort(), ['fk-2', 'matte']);

    const imgRes = await fetch(s.base + app.image_url);
    assert.equal(imgRes.status, 200);
    assert.equal(imgRes.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await imgRes.arrayBuffer()), PNG);

    const settings = (await pub('GET', '/api/settings')).json;
    assert.match(settings.brand_logo_url, /^\/images\/[0-9a-f]{32}\.png$/);
    assert.equal(settings.site_url, 'https://www.skolappar.com'); // not an image – unchanged
    assert.deepEqual(settings.theme_colors, { primary: '12 90% 58%' });
    assert.equal(settings.show_top_ideas, true);
    const mshots = (await pub('GET', `/api/apps/${APP2}`)).json;
    assert.match(mshots.image_url, /^https:\/\/s\.wordpress\.com\/mshots/);
  });

  test('import is idempotent', async () => {
    const hitsBefore = images.hits;
    const again = await admin('POST', '/api/admin/import', samplePayload(images.base));
    assert.equal(again.status, 200);
    assert.equal(again.json.images.downloaded, 0);
    assert.equal(images.hits, hitsBefore, 'no image downloaded twice');
    const { db } = s.app;
    const n = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
    assert.deepEqual([n('categories'), n('apps'), n('app_categories'), n('resources'), n('settings'), n('ideas')], [3, 3, 4, 2, 5, 1]);
    assert.equal(db.prepare('SELECT upvotes_count FROM apps WHERE id = ?').get(APP1).upvotes_count, 3);
  });

  test('import rejects bad input and reports failed images', async () => {
    assert.equal((await admin('POST', '/api/admin/import', { apps: 'nope' })).status, 400);
    assert.equal((await admin('POST', '/api/admin/import', '{bad', { 'Content-Type': 'application/json' })).status, 400);
    const r = await admin('POST', '/api/admin/import', {
      apps: [{ id: '99999999-9999-4999-8999-999999999999', title: 'Trasig bild', url: 'https://x.example', status: 'approved', image_url: `${images.base}/missing.png` }],
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.images.errors.length, 1);
    const app = (await pub('GET', '/api/apps/99999999-9999-4999-8999-999999999999')).json;
    assert.equal(app.image_url, `${images.base}/missing.png`); // kept as it was
    await admin('DELETE', '/api/admin/apps/99999999-9999-4999-8999-999999999999');
  });

  test('public catalogue: only approved apps, filters, search, related', async () => {
    const all = (await pub('GET', '/api/apps?sort=popular')).json;
    assert.deepEqual(all.map((a) => a.id), [APP1, APP2]);
    assert.equal(all[0].submitter_email, undefined);
    assert.deepEqual((await pub('GET', '/api/apps?subjects=matte&ages=fk-2')).json.map((a) => a.id), [APP1]);
    assert.deepEqual((await pub('GET', '/api/apps?types=spel')).json.map((a) => a.id), [APP2]);
    assert.deepEqual((await pub('GET', '/api/apps?search=minus')).json.map((a) => a.id), [APP2]);
    assert.deepEqual((await pub('GET', '/api/apps?search=%25')).json, []);
    assert.equal((await pub('GET', `/api/apps/${PENDING}`)).status, 404);
    const related = (await pub('GET', `/api/apps/${APP1}/related`)).json;
    assert.deepEqual(related.map((a) => a.id), [APP2]);
    const stats = (await pub('GET', '/api/stats')).json;
    assert.deepEqual(stats, { apps: 2, creators: 2, subjects: 1, upvotes: 4 });
    assert.equal((await pub('GET', '/api/resources')).json.length, 1);
    assert.equal((await pub('GET', '/api/resources/utkast')).status, 404);
    assert.equal((await pub('GET', '/api/resources/kom-igang')).json.content, '# Hej');
  });

  test('click counting only counts public apps and is logged as an event', async () => {
    assert.equal((await pub('POST', `/api/apps/${APP1}/click`)).json.counted, true);
    assert.equal((await pub('POST', `/api/apps/${PENDING}/click`)).json.counted, false);
    assert.equal((await pub('GET', `/api/apps/${APP1}`)).json.clicks_count, 11);
    const report = (await admin('GET', '/api/admin/analytics?days=7')).json;
    assert.equal(report.period_opens, 1);
    assert.equal(report.daily.length, 7);
    assert.equal(report.apps[0].id, APP1);
  });

  test('upvotes toggle per anonymous voter', async () => {
    const voter = { 'X-Voter-Id': 'browser-0123456789abcdef' };
    const other = { 'X-Voter-Id': 'browser-fedcba9876543210' };
    assert.equal((await pub('POST', `/api/apps/${APP2}/upvote`)).status, 400);
    let r = await pub('POST', `/api/apps/${APP2}/upvote`, undefined, voter);
    assert.deepEqual(r.json, { upvoted: true, upvotes_count: 2 });
    r = await pub('POST', `/api/apps/${APP2}/upvote`, undefined, other);
    assert.deepEqual(r.json, { upvoted: true, upvotes_count: 3 });
    assert.deepEqual((await pub('GET', '/api/upvotes', undefined, voter)).json, { apps: [APP2], ideas: [] });
    r = await pub('POST', `/api/apps/${APP2}/upvote`, undefined, voter);
    assert.deepEqual(r.json, { upvoted: false, upvotes_count: 2 });
    assert.deepEqual((await pub('GET', '/api/upvotes', undefined, voter)).json, { apps: [], ideas: [] });
    r = await pub('POST', `/api/ideas/${IDEA1}/upvote`, undefined, voter);
    assert.deepEqual(r.json, { upvoted: true, upvotes_count: 3 });
    assert.equal((await pub('POST', `/api/apps/${PENDING}/upvote`, undefined, voter)).status, 404);
    // Only a hash is stored, never the browser's id.
    const rows = s.app.db.prepare('SELECT voter_hash FROM app_upvotes').all();
    assert.ok(rows.every((x) => /^[0-9a-f]{64}$/.test(x.voter_hash)));
  });

  test('ideas: anonymous creation and admin status changes', async () => {
    const bad = await pub('POST', '/api/ideas', { title: 'x' });
    assert.equal(bad.status, 400);
    const r = await pub('POST', '/api/ideas', { title: 'Glosor', description: 'Ett glosspel för engelska', target_age: 'Mellanstadiet', email: 'a@b.se' });
    assert.equal(r.status, 201);
    const idea = (await pub('GET', `/api/ideas/${r.json.id}`)).json;
    assert.equal(idea.status, 'open');
    assert.equal(idea.submitter_email, undefined);
    const patched = await admin('PATCH', `/api/admin/ideas/${r.json.id}`, { status: 'claimed', claimer_name: 'Hermes' });
    assert.equal(patched.json.status, 'claimed');
    assert.equal(patched.json.claimer.display_name, 'Hermes');
    assert.ok(patched.json.claimed_at);
    assert.equal((await pub('GET', '/api/ideas/top')).json[0].id, IDEA1);
  });

  test('settings and app edits via the admin API', async () => {
    const put = await admin('PUT', '/api/admin/settings/brand_tagline', { value: 'Ny slogan' });
    assert.equal(put.status, 200);
    assert.equal((await pub('GET', '/api/settings')).json.brand_tagline, 'Ny slogan');
    const patch = await admin('PATCH', `/api/admin/apps/${APP2}`, { title: 'Minusmästaren', category_ids: [CAT.math] });
    assert.equal(patch.status, 200);
    assert.equal(patch.json.app.title, 'Minusmästaren');
    assert.deepEqual(patch.json.app.categories.map((c) => c.id), [CAT.math]);
    assert.equal((await admin('PATCH', `/api/admin/apps/${APP2}`, { image_url: 'javascript:alert(1)' })).status, 400);
    const upload = await admin('POST', '/api/admin/upload', PNG, { 'Content-Type': 'image/png' });
    assert.equal(upload.status, 201);
    assert.match(upload.json.url, /^\/images\//);
    assert.equal((await admin('POST', '/api/admin/upload', Buffer.from('hello'), { 'Content-Type': 'image/png' })).status, 415);
  });

  test('submissions: validation, confirmation link, approval mail and rate limit', async () => {
    const ip = { 'X-Forwarded-For': '203.0.113.7' };
    const bad = [
      { email: 'a@b.se' },
      { url: 'https://ok.example' },
      { url: 'javascript:alert(1)', email: 'a@b.se' },
      { url: 'ftp://x.example', email: 'a@b.se' },
      { url: `https://x.example/${'a'.repeat(2100)}`, email: 'a@b.se' },
      { url: 'https://ok.example', email: 'not-an-email' },
    ];
    for (const body of bad) assert.equal((await pub('POST', '/api/submissions', body, ip)).status, 400, JSON.stringify(body).slice(0, 80));
    assert.equal((await pub('POST', '/api/submissions', 'url=x', { ...ip, 'Content-Type': 'application/x-www-form-urlencoded' })).status, 415);

    const ok = await pub('POST', '/api/submissions', { url: 'https://nytt.example/spel', email: 'Tipsare@Example.se', title: 'Nytt spel', note: 'Min dotter älskar det' }, ip);
    assert.equal(ok.status, 201, ok.text);
    assert.ok(s.log.lines.some((l) => l.startsWith('mail not configured – would send')));
    assert.ok(!s.log.lines.some((l) => /tipsare@example\.se/i.test(l)), 'email addresses are never logged');

    // Already listed apps are refused.
    const dup = await pub('POST', '/api/submissions', { url: 'https://plus.example', email: 'a@b.se' }, { 'X-Forwarded-For': '198.51.100.1' });
    assert.equal(dup.status, 409);

    const pending = (await admin('GET', '/api/admin/apps?status=pending')).json.find((a) => a.url === 'https://nytt.example/spel');
    assert.equal(pending.status, 'pending');
    assert.equal(pending.submitter_email, 'Tipsare@Example.se');
    assert.equal(pending.email_confirmed, false);
    assert.equal(pending.submitter_note, 'Min dotter älskar det');
    assert.equal((await pub('GET', `/api/apps/${pending.id}`)).status, 404);

    const { confirm_token: token } = s.app.db.prepare('SELECT confirm_token FROM apps WHERE id = ?').get(pending.id);
    assert.equal((await pub('GET', '/bekrafta/not-a-valid-token-at-all')).status, 404);
    const page = await pub('GET', `/bekrafta/${token}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /bekräftad/);
    assert.equal((await admin('GET', `/api/admin/apps/${pending.id}`)).json.email_confirmed, true);

    const before = s.log.lines.length;
    const approved = await admin('PATCH', `/api/admin/apps/${pending.id}`, { status: 'approved' });
    assert.equal(approved.json.app.status, 'approved');
    assert.ok(approved.json.app.published_notified_at);
    assert.ok(s.log.lines.slice(before).some((l) => l.includes('would send "Nu finns')));

    // Rate limit: 5 per hour per IP (this IP has used 1).
    for (let i = 0; i < 4; i++) {
      assert.equal((await pub('POST', '/api/submissions', { url: `https://flood${i}.example`, email: 'a@b.se' }, ip)).status, 201);
    }
    const limited = await pub('POST', '/api/submissions', { url: 'https://flood9.example', email: 'a@b.se' }, ip);
    assert.equal(limited.status, 429);
    assert.ok(limited.json.retry_after > 0);
    assert.equal((await pub('POST', '/api/submissions', { url: 'https://other.example', email: 'a@b.se' }, { 'X-Forwarded-For': '198.51.100.2' })).status, 201);
  });

  test('request bodies are limited', async () => {
    const huge = JSON.stringify({ url: 'https://x.example', email: 'a@b.se', note: 'x'.repeat(1.2 * 1024 * 1024) });
    const r = await pub('POST', '/api/submissions', huge, { 'X-Forwarded-For': '198.51.100.3' });
    assert.equal(r.status, 413);
  });

  test('MCP: initialize, tools/list and tools/call', async () => {
    const init = await admin('POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
    assert.equal(init.status, 200);
    assert.equal(init.json.result.protocolVersion, '2025-06-18');
    assert.ok(init.json.result.capabilities.tools);

    const note = await admin('POST', '/mcp', { jsonrpc: '2.0', method: 'notifications/initialized' });
    assert.equal(note.status, 202);

    const list = await admin('POST', '/mcp', { jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const names = list.json.result.tools.map((t) => t.name);
    for (const n of ['list_submissions', 'list_apps', 'update_app', 'set_app_image', 'list_categories', 'set_setting', 'app_analytics', 'platform_stats']) {
      assert.ok(names.includes(n), n);
    }
    for (const n of ['list_users', 'set_user_role', 'list_comments', 'delete_comment', 'admin_users']) assert.ok(!names.includes(n), n);
    assert.ok(list.json.result.tools.every((t) => t.inputSchema.type === 'object'));

    const call = await admin('POST', '/mcp', { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'list_categories', arguments: { type: 'subject' } } });
    assert.equal(call.status, 200);
    assert.equal(call.json.result.isError, undefined);
    assert.deepEqual(call.json.result.structuredContent.result.map((c) => c.slug), ['matte']);

    const image = await admin('POST', '/mcp', { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'set_app_image', arguments: { id: APP2, image_url: `${images.base}/shot.png` } } });
    assert.match(image.json.result.structuredContent.result.app.image_url, /^\/images\//);

    const invalid = await admin('POST', '/mcp', { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_app', arguments: { id: 'nope' } } });
    assert.equal(invalid.json.result.isError, true);
    const unknown = await admin('POST', '/mcp', { jsonrpc: '2.0', id: 6, method: 'nope' });
    assert.equal(unknown.json.error.code, -32601);
  });

  test('app pages, llms.txt and sitemap.xml', async () => {
    const page = await pub('GET', `/app/${APP1}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /<title>Plusspelet – Skolappar<\/title>/);
    assert.match(page.text, /og:image" content="https:\/\/skolappar\.test\/images\//);
    const pendingPage = await pub('GET', `/app/${PENDING}`);
    assert.doesNotMatch(pendingPage.text, /Hemlig/);

    const llms = await pub('GET', '/llms.txt');
    assert.equal(llms.status, 200);
    assert.match(llms.text, new RegExp(`https://skolappar\\.test/app/${APP1}`));
    assert.doesNotMatch(llms.text, /Hemlig/);
    const sitemap = await pub('GET', '/sitemap.xml');
    assert.match(sitemap.headers.get('content-type'), /application\/xml/);
    assert.match(sitemap.text, new RegExp(`<loc>https://skolappar\\.test/app/${APP1}</loc>`));
    assert.match(sitemap.text, /resurser\/tips\/kom-igang/);
    assert.doesNotMatch(sitemap.text, /utkast/);
  });

  test('static files: hashed assets are immutable, unknown API paths are JSON 404', async () => {
    const asset = await pub('GET', '/assets/app-abc123.js');
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('cache-control'), /immutable/);
    assert.equal((await pub('GET', '/assets/missing.js')).status, 404);
    assert.equal((await pub('GET', '/../../etc/passwd')).status, 200); // normalised to the SPA, never a file outside dist
    const nf = await pub('GET', '/api/nope');
    assert.equal(nf.status, 404);
    assert.equal(nf.json.error, 'Not found');
    assert.equal((await pub('DELETE', '/api/apps')).status, 405);
  });
});

describe('apex redirects to www', () => {
  let srv;
  before(async () => { srv = await startServer({ siteUrl: 'https://www.skolappar.test' }); });
  after(() => srv.stop());

  async function get(host, path, method = 'GET') {
    const http = await import('node:http');
    const { port } = srv.app.server.address();
    return new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path, method, headers: { Host: host } }, (res) => {
        res.resume();
        res.on('end', () => resolve(res));
      });
      req.on('error', reject);
      req.end();
    });
  }

  test('the bare domain gets a permanent redirect with path and query', async () => {
    const res = await get('skolappar.test', '/app/abc?x=1');
    assert.equal(res.statusCode, 301);
    assert.equal(res.headers.location, 'https://www.skolappar.test/app/abc?x=1');
    assert.equal((await get('SKOLAPPAR.test:443', '/')).statusCode, 301);
    assert.equal((await get('skolappar.test', '/api/ideas', 'POST')).statusCode, 308);
  });

  test('www, other hosts and the health check are served', async () => {
    assert.equal((await get('www.skolappar.test', '/')).statusCode, 200);
    assert.equal((await get('skolappar.shipholm.dev', '/')).statusCode, 200);
    assert.equal((await get('skolappar.test', '/healthz')).statusCode, 200);
  });
});
