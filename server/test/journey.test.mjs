import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJourney, tarGz } from '../journey.mjs';
import { startServer, api } from './helpers.mjs';

test('tarGz makes an archive tar can read', () => {
  const dir = mkdtempSync(join(tmpdir(), 'journey-'));
  writeFileSync(join(dir, 'a.tar.gz'), tarGz([{ name: 'index.html', data: '<h1>Hej å</h1>' }]));
  execFileSync('tar', ['-xzf', join(dir, 'a.tar.gz'), '-C', dir]);
  assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), '<h1>Hej å</h1>');
});

function world({ breakStep } = {}) {
  const settings = {};
  const store = { getSetting: (k) => settings[k] ?? null, setSetting: (k, v) => { settings[k] = v; } };
  settings.report_email = 'admin@example.org';
  const mails = [];
  let site = '';
  const calls = [];
  const shipholm = {
    configured: true,
    async callDirect(tool, args) {
      calls.push(tool);
      if (breakStep === 'mcp' && tool === 'list_skills') throw new Error('Shipholm answered HTTP 400');
      return { list_skills: { skills: [{ name: 'shipholm' }] }, upload_site: { upload_id: 'u1', upload_url: 'https://bucket.example/put' },
        publish_site: { served: 'shared' }, app_attestation: { attestation: 'att' } }[tool];
    },
    async verifyAttestation() { return { valid: true, email: 'parent@example.org' }; },
  };
  const res = (status, body = '', headers = {}) => ({ ok: status < 300, status, headers: { get: (n) => headers[n.toLowerCase()] ?? null }, text: async () => body });
  const fetchImpl = async (url, opts = {}) => {
    const u = String(url);
    if (u === 'https://bucket.example/put') { site = opts.body.length ? 'stamped' : ''; return res(200); }
    if (u.startsWith('https://provforaldern.shipholm.dev/')) return res(200, `<p>Version ${world.stamp}</p>`, { server: breakStep === 'served' ? 'nginx' : 'shipholm' });
    if (u === 'https://api.shipholm.com/speak') return res(200, '', { 'content-type': 'audio/mpeg' });
    if (u.startsWith('https://api.shipholm.com/ai/')) return res(204);
    if (u === 'https://skolappar.test/mcp') {
      const args = JSON.parse(opts.body).params.arguments;
      assert.equal(args.dry_run, true);
      assert.equal(args.email, 'parent@example.org');
      const out = { categories: [{}, {}, {}], unknown_curriculum_ids: [], attestation: 'ok', check: { passed: true, failed: [] } };
      return res(200, JSON.stringify({ result: { content: [{ type: 'text', text: JSON.stringify(out) }] } }));
    }
    if (u === 'https://studio.shipholm.com/') return res(200);
    throw new Error(`unexpected ${u}`);
  };
  const at = new Date('2026-11-27T05:10:00Z');
  world.stamp = at.toISOString();
  const journey = createJourney({ shipholm, store, mailer: { send: async (m) => { mails.push(m); return { sent: true }; } }, siteUrl: 'https://skolappar.test',
    fetchImpl, now: () => at, wait: async () => {} });
  return { journey, settings, mails, calls, site: () => site };
}

describe('the test parent', () => {
  test('goes the whole way and keeps the result', async () => {
    const w = world();
    const r = await w.journey.run();
    assert.equal(r.ok, true, JSON.stringify(r.steps));
    assert.deepEqual(r.steps.map((s) => s.id), ['mcp', 'publish', 'served', 'voice', 'ai', 'attest', 'submit', 'studio']);
    assert.equal(w.settings.journey_last.ok, true);
    assert.equal(w.mails.length, 0);
    assert.equal(await w.journey.maybeRun(), null, 'once a day');
  });

  test('a broken seam is mailed once, and its recovery too', async () => {
    const w = world({ breakStep: 'served' });
    const r = await w.journey.run();
    assert.equal(r.ok, false);
    assert.match(r.steps.find((s) => s.id === 'served').error, /delade servern/);
    assert.equal(w.mails.length, 1);
    assert.match(w.mails[0].subject, /served fungerar inte/);
    await w.journey.run();
    assert.equal(w.mails.length, 1, 'not again the same day');
  });

  test('without Shipholm the first step says so', async () => {
    const w = world({ breakStep: 'mcp' });
    const r = await w.journey.run();
    assert.equal(r.steps[0].ok, false);
    assert.match(r.steps[0].error, /HTTP 400/);
  });
});

describe('submit_app with dry_run', () => {
  test('says what would happen and stores nothing', async () => {
    const s = await startServer();
    try {
      for (const [type, slug, name] of [['subject', 'matte', 'Matematik'], ['age', 'fk-2', 'F–2'], ['app_type', 'spel', 'Spel']]) s.app.store.createCategory({ type, slug, name });
      const pub = api(s.base);
      const before = s.app.store.listAdminApps().length;
      const r = await pub('POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'submit_app', arguments: {
        url: 'https://prov.example/', title: 'Provet', description: 'Ett prov av inskicket utan att spara.', first_name: 'Prov',
        email: 'prov@example.org', accept_terms: true, subject: 'matte', age: 'fk-2', app_type: 'spel', curriculum_ids: ['MA.1-3.3.3', 'MA.9-9.9.9'], dry_run: true } } });
      const out = JSON.parse(r.json.result.content[0].text);
      assert.equal(out.dry_run, true);
      assert.deepEqual(out.categories.map((c) => c.slug).sort(), ['fk-2', 'matte', 'spel']);
      assert.deepEqual(out.unknown_curriculum_ids, ['MA.9-9.9.9']);
      assert.equal(s.app.store.listAdminApps().length, before, 'nothing stored');
    } finally { s.stop(); }
  });
});
