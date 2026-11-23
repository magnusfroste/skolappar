import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, schemaVersion, LATEST_SCHEMA_VERSION } from '../db.mjs';
import { parseKeyHashes } from '../app.mjs';
import { startServer, startImageServer, api, samplePayload, CAT, APP1, APP2, PENDING, IDEA1, PNG } from './helpers.mjs';

const KEY = 'test-admin-key';
const AGENT_KEY = 'skol_test-agent-key';
const AGENT_HASH = createHash('sha256').update(AGENT_KEY).digest('hex');

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

  test('admin API and import refuse with 503; /mcp answers with the open tools only', async () => {
    const call = api(s.base, { key: 'anything' });
    for (const [method, path, body] of [['GET', '/api/admin/check'], ['POST', '/api/admin/import', {}]]) {
      const r = await call(method, path, body);
      assert.equal(r.status, 503, `${method} ${path}`);
      assert.equal(r.json.error, 'ADMIN_KEY not set');
    }
    const list = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
    assert.equal((await call('POST', '/mcp', list)).status, 401, 'a key nobody issued is refused');
    const open = await api(s.base)('POST', '/mcp', list);
    assert.equal(open.status, 200);
    assert.ok(open.json.result.tools.some((t) => t.name === 'submit_app'));
    assert.ok(!open.json.result.tools.some((t) => t.name === 'update_app'));
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
    s = await startServer({ adminKey: KEY, agentKeyHashes: parseKeyHashes(` ${AGENT_HASH.toUpperCase()}, not-a-hash`) });
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

  test('agent key: opens /mcp (Bearer or X-Api-Key) but not the admin API', async () => {
    const list = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
    assert.equal((await api(s.base, { key: AGENT_KEY })('POST', '/mcp', list)).status, 200);
    const viaHeader = await fetch(`${s.base}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': AGENT_KEY }, body: JSON.stringify(list) });
    assert.equal(viaHeader.status, 200);
    assert.equal((await api(s.base, { key: `${AGENT_KEY}x` })('POST', '/mcp', list)).status, 401);
    assert.equal((await api(s.base, { key: AGENT_KEY })('GET', '/api/admin/check')).status, 401);
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
    // every card frames its image in the subject's colour, so each list carries the subject's slug and type
    const subject = (list) => list.map((a) => a.categories.find((c) => c.type === 'subject')?.slug);
    assert.deepEqual(subject(related), ['matte']);
    for (const path of ['/api/apps/top', '/api/apps/recent']) {
      const list = (await pub('GET', path)).json;
      assert.ok(list.length && subject(list).every((slug) => slug === 'matte'), path);
    }
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
    assert.equal(pending.mail.confirm.status, 'not_configured');
    assert.ok(pending.mail.confirm.at);
    assert.equal(pending.mail.published, null);
    const resent = await admin('POST', `/api/admin/apps/${pending.id}/resend-mail`, { kind: 'confirm' });
    assert.equal(resent.status, 200, resent.text);
    assert.equal(resent.json.result.reason, 'not_configured');
    assert.equal((await admin('POST', `/api/admin/apps/${pending.id}/resend-mail`, { kind: 'published' })).json.reason, 'email_not_confirmed');
    assert.equal((await admin('POST', `/api/admin/apps/${pending.id}/resend-mail`, { kind: 'other' })).status, 400);
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
    const afterApproval = (await admin('GET', `/api/admin/apps/${pending.id}`)).json;
    assert.equal(afterApproval.mail.published.status, 'not_configured');
    const again = await admin('POST', `/api/admin/apps/${pending.id}/resend-mail`, { kind: 'confirm' });
    assert.equal(again.status, 409);
    assert.equal(again.json.reason, 'already_confirmed');
    assert.equal((await admin('POST', `/api/admin/apps/${pending.id}/resend-mail`, { kind: 'published' })).status, 200);
    assert.equal((await admin('POST', '/api/admin/apps/00000000-0000-4000-8000-000000000000/resend-mail', { kind: 'confirm' })).status, 404);

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
    // the image guideline: a moment inside the game, no bright start page, and the card draws the frame
    const hint = list.json.result.tools.find((t) => t.name === 'set_app_image').description;
    assert.match(hint, /inifrån själva spelet/);
    assert.match(hint, /1200×900/);
    assert.match(hint, /kortet lägger själv en ram/);
    assert.doesNotMatch(hint, /ljus bild/);
    for (const n of ['list_submissions', 'resend_mail', 'list_apps', 'update_app', 'set_app_image', 'list_categories', 'set_setting', 'app_analytics', 'platform_stats']) {
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

describe('mail failures are recorded', () => {
  let s;
  let mailApi;
  before(async () => {
    mailApi = await startImageServer();
    s = await startServer({ env: { MAIL_PROVIDER: 'resend', MAIL_API_URL: `${mailApi.base}/missing`, MAIL_API_KEY: 'k', MAIL_FROM: 'Skolappar <hej@skolappar.test>' } });
  });
  after(async () => { await s.stop(); await mailApi.stop(); });

  test('a failed confirmation shows in the admin view and can be sent again', async () => {
    const pub = api(s.base);
    const admin = api(s.base, { key: KEY });
    assert.equal((await pub('POST', '/api/submissions', { url: 'https://fail.example', email: 'x@example.se' })).status, 201);
    let app;
    for (let i = 0; i < 50 && !app?.mail?.confirm; i++) {
      app = (await admin('GET', '/api/admin/apps?status=pending')).json.find((a) => a.url === 'https://fail.example');
      if (!app.mail.confirm) await new Promise((r) => setTimeout(r, 20));
    }
    assert.deepEqual({ status: app.mail.confirm.status, reason: app.mail.confirm.reason }, { status: 'failed', reason: 'http_404' });
    const hits = mailApi.hits;
    const r = await admin('POST', `/api/admin/apps/${app.id}/resend-mail`, { kind: 'confirm' });
    assert.equal(r.status, 200);
    assert.equal(r.json.result.sent, false);
    assert.equal(r.json.app.mail.confirm.reason, 'http_404');
    assert.equal(mailApi.hits, hits + 1);
    assert.ok(!s.log.lines.some((l) => l.includes('x@example.se')));
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

describe('the open MCP: an agent submits an app and follows it', () => {
  let s;
  let images;
  let admin;
  let n = 0;
  const rpc = (who, method, params) => who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method, params });
  const call = async (who, name, args = {}) => {
    const r = await rpc(who, 'tools/call', { name, arguments: args });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result };
  };
  let pub;
  const submission = { url: 'https://robot.example', title: 'Roboträknaren', description: 'Räkna äpplen med roboten, för de yngsta.', first_name: 'Anna-Karin', email: 'parent@example.com' };

  before(async () => {
    images = await startImageServer();
    s = await startServer({ adminKey: KEY, submitLimit: 3 });
    admin = api(s.base, { key: KEY });
    pub = api(s.base);
    await admin('POST', '/api/admin/import', samplePayload(images.base));
  });
  after(async () => {
    await s.stop();
    await images.stop();
  });

  test('the build guide is one text: get_guide, /guide.md, /api/guide and llms.txt', async () => {
    const whole = await call(pub, 'get_guide');
    assert.ok(whole.ok);
    assert.match(whole.text, /Så bygger du en skolapp/);
    assert.match(whole.text, /Checklista före inskick/);
    const one = await call(pub, 'get_guide', { section: 'touch' });
    assert.match(one.text, /44 × 44 px/);
    assert.doesNotMatch(one.text, /Checklista före inskick\\n\\n- \[/);
    assert.equal((await call(pub, 'get_guide', { section: 'nope' })).ok, false);

    const md = await pub('GET', '/guide.md');
    assert.equal(md.status, 200);
    assert.match(md.text, /^# Så bygger du en skolapp/);
    const json = (await pub('GET', '/api/guide')).json;
    assert.ok(json.sections.length >= 10);
    for (const sec of json.sections) assert.ok(md.text.includes(`## ${sec.title}`), sec.id);
    // every tool the guide names exists in the open part
    const open = (await rpc(pub, 'tools/list')).json.result.tools.map((t) => t.name);
    for (const [, name] of md.text.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)) if (!['app_key', 'curriculum_ids'].includes(name)) assert.ok(open.includes(name), name);
    assert.match((await pub('GET', '/llms.txt')).text, /https:\/\/skolappar\.test\/guide\.md/);
    assert.match((await pub('GET', '/sitemap.xml')).text, /\/bygg</);
  });

  test('the starter template and the skills: as files and over MCP, and they name only what exists', async () => {
    const open = (await rpc(pub, 'tools/list')).json.result.tools.map((t) => t.name);
    const guideSections = (await pub('GET', '/api/guide')).json.sections.map((x) => x.id);

    const starter = (await call(pub, 'get_starter')).data;
    const names = starter.files.map((f) => f.path);
    for (const f of ['index.html', 'style.css', 'app.js', 'tasks.js', 'manifest.webmanifest', 'icon.svg', 'README.md']) assert.ok(names.includes(f), f);
    const index = await pub('GET', '/starter/');
    assert.equal(index.status, 200);
    assert.match(index.headers.get('content-type'), /text\/html/);
    assert.match(index.headers.get('content-security-policy'), /connect-src 'none'/);
    assert.equal(index.text, starter.files.find((f) => f.path === 'index.html').content);
    // the starter follows the guide it ships with: every file it refers to is there, nothing from elsewhere
    for (const [, ref] of index.text.matchAll(/(?:href|src)="([^"]+)"/g)) assert.ok(names.includes(ref), ref);
    assert.match(index.text, /<html lang="sv">/);
    assert.match(index.text, /viewport-fit=cover/);
    assert.match((await pub('GET', '/starter/style.css')).text, /touch-action: manipulation/);
    assert.match((await pub('GET', '/starter/app.js')).headers.get('content-type'), /javascript/);
    assert.equal((await pub('GET', '/starter/../app.mjs')).status === 200 && /createApp/.test((await pub('GET', '/starter/../app.mjs')).text), false);
    for (const f of starter.files) assert.doesNotMatch(f.content, /https?:\/\/(?!www\.skolappar\.com|www\.w3\.org)/, f.path);

    const skills = (await call(pub, 'list_skills')).data;
    assert.deepEqual(skills.map((x) => x.name), ['skolappar-bygg', 'skolappar-kortbild', 'skolappar-publicera']);
    assert.deepEqual((await pub('GET', '/skills')).json.map((x) => x.name), skills.map((x) => x.name));
    for (const skill of skills) {
      assert.ok(skill.description.length > 40, skill.name);
      const md = (await pub('GET', `/skills/${skill.name}/SKILL.md`)).text;
      assert.equal(md, (await call(pub, 'get_skill', { name: skill.name })).data.markdown);
      assert.match(md, new RegExp(`^---\\nname: ${skill.name}\\ndescription: `));
      for (const [, tool] of md.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)) {
        if (!['app_key', 'long_description', 'image_url', 'curriculum_ids'].includes(tool)) assert.ok(open.includes(tool), `${skill.name}: ${tool}`);
      }
      for (const [, section] of md.matchAll(/avsnitt(?:et)? `([a-z-]+)`/g)) assert.ok(guideSections.includes(section), `${skill.name}: ${section}`);
    }
    assert.equal((await call(pub, 'get_skill', { name: 'nope' })).ok, false);
    assert.equal((await pub('GET', '/skills/nope/SKILL.md')).status === 200 && /^---/.test((await pub('GET', '/skills/nope/SKILL.md')).text), false);
    assert.match((await pub('GET', '/llms.txt')).text, /\/starter\//);
  });

  test('Lgr22: the central content is searchable, an app is linked to points, the site filters on them', async () => {
    const overview = (await call(pub, 'get_curriculum')).data;
    assert.match(overview.source, /Skolverket/);
    const maths = overview.subjects.find((x) => x.subject === 'MA');
    assert.deepEqual(maths.stages.map((x) => x.stage), ['1-3', '4-6', '7-9']);
    assert.equal(maths.stages[0].areas[0].id, 'MA.1-3.1');

    const found = (await call(pub, 'get_curriculum', { subject: 'matematik', stage: '1-3', search: 'bråk' })).data.points;
    assert.ok(found.length >= 1 && found.every((p) => p.subject === 'MA' && p.stage === '1-3' && /bråk/i.test(p.text)));
    const point = found[0].id;
    assert.match(point, /^MA\.1-3\.\d+\.\d+$/);
    assert.equal((await pub('GET', '/api/curriculum?area=MA.1-3.1')).json.points[0].area_id, 'MA.1-3.1');
    assert.ok((await pub('GET', '/api/curriculum')).json.subjects.length >= 15);

    // nothing is linked yet: no filter to offer
    assert.deepEqual((await pub('GET', '/api/curriculum/used')).json, []);
    // an unknown point is refused; known ones are kept and shown with their text
    assert.match((await call(admin, 'update_app', { id: APP1, curriculum_ids: ['MA.1-3.9.9'] })).text, /Okända punkter/);
    assert.equal((await call(admin, 'update_app', { id: APP1, curriculum_ids: [point] })).ok, true);
    const shown = (await pub('GET', `/api/apps/${APP1}`)).json.curriculum;
    assert.deepEqual(shown.map((p) => p.id), [point]);
    assert.ok(shown[0].text.length > 20 && shown[0].subject_name === 'Matematik');
    assert.deepEqual((await call(pub, 'get_app', { id: APP1 })).data.curriculum.map((p) => p.id), [point]);

    const area = shown[0].area_id;
    const used = (await pub('GET', '/api/curriculum/used')).json;
    assert.deepEqual(used.map((a) => [a.id, a.apps]), [[area, 1]]);
    assert.deepEqual((await pub('GET', `/api/apps?lgr=${area}`)).json.map((a) => a.id), [APP1]);
    assert.deepEqual((await pub('GET', '/api/apps?lgr=SV.1-3.1')).json, []);

    // an agent links its own app when it submits, and may change the link while the app waits
    s.app.limiters.submitLimiter.reset();
    const sent = await call(pub, 'submit_app', { ...submission, url: 'https://lgr.example', curriculum_ids: [point, 'XX.1-3.1.1'] });
    assert.deepEqual(sent.data.unknown_curriculum_ids, ['XX.1-3.1.1']);
    const queued = (await call(admin, 'list_submissions')).data.find((a) => a.id === sent.data.id);
    assert.deepEqual(queued.curriculum.map((p) => p.id), [point]);
    assert.equal((await call(pub, 'update_my_app', { id: sent.data.id, app_key: sent.data.app_key, curriculum_ids: [] })).ok, true);
    assert.deepEqual((await call(admin, 'get_app', { id: sent.data.id })).data.curriculum, []);
    assert.equal((await call(pub, 'withdraw_my_app', { id: sent.data.id, app_key: sent.data.app_key })).ok, true);
    assert.equal((await call(admin, 'update_app', { id: APP1, curriculum_ids: [] })).ok, true);
    s.app.limiters.submitLimiter.reset(); // the other tests count their own submissions
  });

  test('no key: the open tools and their instructions; a key: the administration as well', async () => {
    const init = await rpc(pub, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
    assert.match(init.json.result.instructions, /submit_app/);
    const open = (await rpc(pub, 'tools/list')).json.result.tools.map((t) => t.name).sort();
    assert.deepEqual(open, ['app_stats', 'app_status', 'check_app', 'get_app', 'get_curriculum', 'get_guide', 'get_skill', 'get_starter', 'list_apps', 'list_categories', 'list_ideas', 'list_resources', 'list_skills', 'set_my_app_image', 'submit_app', 'update_my_app', 'withdraw_my_app']);
    const keyed = (await rpc(admin, 'tools/list')).json.result.tools.map((t) => t.name);
    for (const name of ['update_app', 'list_submissions', 'submit_app', 'app_stats']) assert.ok(keyed.includes(name), name);
    assert.equal(keyed.length, new Set(keyed).size, 'no tool twice');
    // an admin tool is unknown without a key, and the open list never shows what is not public
    assert.equal((await rpc(pub, 'tools/call', { name: 'update_app', arguments: { id: APP1, status: 'rejected' } })).json.error.code, -32602);
    assert.equal((await rpc(pub, 'tools/call', { name: 'list_submissions', arguments: {} })).json.error.code, -32602);
    const apps = (await call(pub, 'list_apps')).data;
    assert.deepEqual(apps.map((a) => a.id).sort(), [APP1, APP2]);
    assert.ok(apps.every((a) => !('submitter_email' in a) && !('user_id' in a)));
    assert.equal((await call(pub, 'get_app', { id: PENDING })).ok, false);
    assert.deepEqual((await call(pub, 'list_categories', { type: 'subject' })).data.map((c) => c.slug), ['matte']);
  });

  test('submit_app: first name and e-mail required, a key for the app, the confirmation link, the daily review', async () => {
    for (const bad of [{ first_name: undefined }, { email: undefined }, { first_name: 'Anna Svensson' }, { email: 'nope' }]) {
      const r = await call(pub, 'submit_app', { ...submission, ...bad });
      assert.equal(r.ok, false, JSON.stringify(bad));
      assert.match(r.text, /Ogiltig indata/);
    }
    assert.match((await call(pub, 'submit_app', { ...submission, url: 'http://robot.example' })).text, /https/);
    assert.match((await call(pub, 'submit_app', { ...submission, url: 'https://plus.example' })).text, /finns redan/);

    const sent = await call(pub, 'submit_app', { ...submission, category_ids: [CAT.math, CAT.age] });
    assert.equal(sent.ok, true, sent.text);
    const { id, app_key: key } = sent.data;
    assert.match(key, /^sapp_[A-Za-z0-9_-]{32}$/);
    assert.equal(sent.data.status, 'pending');
    // only the hash of the key is stored
    const row = s.app.db.prepare('SELECT app_key_hash, confirm_token, creator_name, submitter_email FROM apps WHERE id = ?').get(id);
    assert.match(row.app_key_hash, /^[0-9a-f]{64}$/);
    assert.ok(!row.app_key_hash.includes(key));
    assert.equal(row.creator_name, 'Anna-Karin');

    // not public, and its status says why: waiting, the address not confirmed
    assert.equal((await call(pub, 'get_app', { id })).ok, false);
    assert.equal((await call(pub, 'app_stats', { id })).ok, false);
    let status = (await call(pub, 'app_status', { id })).data;
    assert.deepEqual([status.status, status.published, status.email_confirmed, status.page], ['pending', false, false, null]);
    assert.ok(!JSON.stringify(status).includes('parent@example.com'), 'the status never shows the address');

    // the reviewer sees it in the same queue as the form's suggestions, with the address and its state
    const queued = (await call(admin, 'list_submissions')).data.find((a) => a.id === id);
    assert.equal(queued.submitter_email, 'parent@example.com');
    assert.equal(queued.email_confirmed, false);
    assert.deepEqual(queued.categories.map((c) => c.slug).sort(), ['fk-2', 'matte']);

    // the agent may still change it, with the key only
    assert.equal((await call(pub, 'update_my_app', { id, app_key: 'sapp_wrongwrongwrongwrongwrongwrongwr', title: 'Kapad' })).ok, false);
    assert.equal((await call(pub, 'update_my_app', { id, app_key: key, title: 'Robotens räknespel' })).ok, true);
    assert.equal((await call(pub, 'app_status', { id })).data.title, 'Robotens räknespel');

    // the card image: drawn as SVG, fetched from an address, or uploaded as a file – with the key only
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#fc0"/></svg>';
    assert.equal((await call(pub, 'set_my_app_image', { id, app_key: 'sapp_wrongwrongwrongwrongwrongwrongwr', svg })).ok, false);
    assert.match((await call(pub, 'set_my_app_image', { id, app_key: key })).text, /svg eller image_url/);
    for (const evil of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" onload="x()"><rect/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/t.png"/></svg>']) {
      assert.match((await call(pub, 'set_my_app_image', { id, app_key: key, svg: evil })).text, /får inte innehålla/);
    }
    const drawn = await call(pub, 'set_my_app_image', { id, app_key: key, svg });
    assert.equal(drawn.ok, true, drawn.text);
    assert.match(drawn.data.image_url, /^https:\/\/skolappar\.test\/images\/[0-9a-f]{32}\.svg$/);
    assert.equal((await call(pub, 'set_my_app_image', { id, app_key: key, image_url: `${images.base}/pic.png` })).ok, true);

    const put = (k, body) => pub('PUT', `/api/apps/${id}/image`, body, { 'Content-Type': 'image/png', ...(k ? { 'X-App-Key': k } : {}) });
    assert.equal((await put(null, PNG)).status, 401);
    assert.equal((await put('sapp_wrongwrongwrongwrongwrongwrongwr', PNG)).status, 401);
    assert.equal((await put(key, Buffer.from('not an image'))).status, 415);
    const uploaded = await put(key, PNG);
    assert.equal(uploaded.status, 200, uploaded.text);
    assert.match(s.app.db.prepare('SELECT image_url FROM apps WHERE id = ?').get(id).image_url, /^\/images\/[0-9a-f]{32}\.png$/);
    assert.ok(!uploaded.text.includes('parent@example.com'));

    // the parent clicks the link; the reviewer approves; the app is public
    assert.equal((await pub('GET', `/bekrafta/${row.confirm_token}`)).status, 200);
    assert.equal((await call(pub, 'app_status', { id })).data.email_confirmed, true);
    assert.equal((await call(admin, 'update_app', { id, status: 'approved' })).ok, true);
    status = (await call(pub, 'app_status', { id })).data;
    assert.deepEqual([status.status, status.published, status.page], ['approved', true, `https://skolappar.test/app/${id}`]);
    assert.equal((await call(pub, 'get_app', { id })).data.creator_name, 'Anna-Karin');

    // published: no more changes with the key, but it can be withdrawn
    assert.match((await call(pub, 'update_my_app', { id, app_key: key, title: 'Något annat' })).text, /publicerad/);
    assert.match((await call(pub, 'set_my_app_image', { id, app_key: key, svg })).text, /publicerad/);
    assert.equal((await put(key, PNG)).status, 409);
    assert.equal((await call(pub, 'withdraw_my_app', { id, app_key: 'sapp_wrongwrongwrongwrongwrongwrongwr' })).ok, false);
    assert.deepEqual((await call(pub, 'withdraw_my_app', { id, app_key: key })).data, { id, withdrawn: true, status: 'delisted' });
    assert.equal((await call(pub, 'get_app', { id })).ok, false);
    assert.equal((await call(pub, 'app_status', { id })).data.reason, 'Tillbakadragen av skaparen');
  });

  test('app_stats: opens and likes as counts, the place within the subject', async () => {
    for (let i = 0; i < 3; i++) await pub('POST', `/api/apps/${APP1}/click`);
    const stats = (await call(pub, 'app_stats', { id: APP1 })).data;
    assert.deepEqual(stats.opens, { today: 3, last_7_days: 3, last_30_days: 3, total: 13 });
    assert.equal(stats.likes, 3);
    assert.deepEqual(stats.rank_in_subject, { subject: 'Matte', place: 1, of: 2 });
    assert.equal(stats.daily.length, 30);
    assert.equal(stats.daily.at(-1).opens, 3);
    assert.equal((await call(pub, 'app_stats', { id: PENDING })).ok, false);
  });

  test('a waiting app is withdrawn for good, and submissions share the form\'s rate limit', async () => {
    const one = await call(pub, 'submit_app', { ...submission, url: 'https://two.example' });
    assert.equal(one.ok, true, one.text);
    assert.deepEqual((await call(pub, 'withdraw_my_app', { id: one.data.id, app_key: one.data.app_key })).data.status, 'deleted');
    assert.equal((await call(pub, 'app_status', { id: one.data.id })).ok, false);
    // the limit is 3 an hour here: two used above, the third passes, the fourth does not
    assert.equal((await call(pub, 'submit_app', { ...submission, url: 'https://three.example' })).ok, true);
    assert.match((await call(pub, 'submit_app', { ...submission, url: 'https://four.example' })).text, /För många inskick/);
  });
});
