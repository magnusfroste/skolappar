import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, api } from './helpers.mjs';

describe('how agents use /mcp', () => {
  let s; let pub; let admin; let n = 0;
  const rpc = (who, method, params, headers) => who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method, params }, headers);
  const call = async (who, name, args, headers) => {
    const r = await rpc(who, 'tools/call', { name, arguments: args }, headers);
    const result = r.json.result;
    return result ? { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent } : { ok: false, error: r.json.error };
  };
  before(async () => { s = await startServer({ adminKey: 'k-agents' }); pub = api(s.base); admin = api(s.base, { key: 'k-agents' }); });
  after(() => s.stop());

  test('an unknown field is refused with the fields the tool takes, not silently dropped', async () => {
    const r = await call(pub, 'get_guide', { section: 'kodsnutten', sektion: 'x' });
    assert.equal(r.ok, false);
    assert.match(r.text, /okänt fält sektion\. get_guide tar: section\./);
    assert.equal((await call(pub, 'get_guide', { section: 'kodsnutten' })).ok, true);
  });

  test('connections, calls, errors and missing tools are counted – without arguments or addresses', async () => {
    const ua = { 'User-Agent': 'claude-code/2.1.0 (darwin)' };
    await rpc(pub, 'initialize', { protocolVersion: '2025-06-18', clientInfo: { name: 'Cursor', version: '1' } });
    await rpc(pub, 'initialize', { protocolVersion: '2025-06-18', clientInfo: { name: 'claude-code', version: '2' } }, ua);
    await call(pub, 'list_apps', {}, ua);
    await call(pub, 'submit_app', { url: 'https://x.example', title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', email: 'anna@example.com' }, ua);
    await call(pub, 'publish_app', { url: 'https://x.example' }, ua);
    const u = (await call(admin, 'agent_usage', { days: 7 })).data;
    assert.deepEqual(u.clients.map((c) => c.client).sort(), ['claude-code', 'cursor']);
    const submit = u.tools.find((t) => t.tool === 'submit_app');
    assert.equal(submit.errors, 1);
    assert.match(submit.top_messages[0].message, /Villkoren måste godkännas/);
    assert.equal(u.tools.find((t) => t.tool === 'get_guide').invalid, 1, 'the unknown field from the test before');
    assert.deepEqual(u.unknown_tools, [{ tool: 'publish_app', n: 1 }]);
    assert.doesNotMatch(JSON.stringify(u), /anna@example\.com|x\.example|Klockjakten/, 'no arguments are kept');
    assert.equal((await admin('GET', '/api/admin/agents?days=7')).json.calls, u.calls + 1, 'the agent_usage call itself counts too');
    assert.equal((await pub('GET', '/api/admin/agents')).status, 401);
  });
});

describe('answers an agent can act on (ZeroClaw, 2026-11-25)', () => {
  let s; let pub; let n = 0;
  const call = async (name, args) => {
    const r = await pub('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result };
  };
  before(async () => { s = await startServer(); pub = api(s.base); });
  after(() => s.stop());

  test('get_starter says first what it holds, and that kotten.js is an address, not a file', async () => {
    const d = (await call('get_starter', {})).data;
    assert.equal(Object.keys(d)[0], 'summary');
    assert.match(d.summary, /kotten\.js – den är en adress i en <script>-tagg/);
    assert.ok(d.files_list.includes('index.html') && d.files_list.length === d.files.length);
  });

  test('check_app on a local file or localhost says why and what to do instead', async () => {
    for (const url of ['file:///home/anna/app/index.html', 'http://localhost:5173/', '/home/anna/app']) {
      const r = await call('check_app', { url });
      assert.equal(r.ok, false, url);
      assert.match(r.text, /når inte din dator.*checklista.*publish_on_shipholm/s, url);
    }
    assert.match((await call('check_app', {})).text, /publika https-adressen/);
  });
});

describe('submit_app without the parent\'s name or address says what to do', () => {
  let s; let pub; let n = 0;
  before(async () => { s = await startServer(); pub = api(s.base); });
  after(() => s.stop());
  test('ask the parent – not a bare "required"', async () => {
    const r = await pub('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name: 'submit_app', arguments: {
      url: 'https://x.example', title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', accept_terms: true } } });
    const text = r.json.result.content[0].text;
    assert.equal(r.json.result.isError, true);
    assert.match(text, /Fråga föräldern om förnamn \(first_name\) och e-postadress \(email\)/);
    assert.match(text, /visas aldrig/);
    assert.match(text, /app_attestation/);
  });
});

describe('submit_app takes categories as words', () => {
  let s; let pub; let n = 0;
  before(async () => {
    s = await startServer(); pub = api(s.base);
    for (const [type, slug, name] of [['subject', 'matte', 'Matematik'], ['subject', 'sprak', 'Språk'], ['age', 'fk-2', 'F–2'],
      ['app_type', 'spel', 'Spel'], ['device', 'tablet', 'Surfplatta']]) s.app.store.createCategory({ type, slug, name });
  });
  after(() => s.stop());
  const submit = async (args) => {
    const r = await pub('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name: 'submit_app', arguments: {
      url: `https://ord${n}.example`, title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.',
      first_name: 'Anna', email: `anna${n}@example.com`, accept_terms: true, ...args } } });
    return { isError: !!r.json.result.isError, text: r.json.result.content[0].text };
  };
  test('words and aliases resolve to the categories, no list_categories first', async () => {
    const r = await submit({ subject: 'Matematik', age: 'fk-2', app_type: 'spel', device: 'iPad', curriculum_ids: ['ma.1–3.3.3', 'klockan'] });
    assert.equal(r.isError, false, r.text);
    const body = JSON.parse(r.text);
    const cats = s.app.store.getApp(body.id, { admin: true }).categories.map((c) => c.slug).sort();
    assert.deepEqual(cats, ['fk-2', 'matte', 'spel', 'tablet']);
    assert.deepEqual(body.unknown_curriculum_ids, ['klockan']); // the other one was tidied to MA.1-3.3.3
    assert.ok(body.curriculum_suggestions.some((p) => p.id.startsWith('MA.')), JSON.stringify(body.curriculum_suggestions));
    assert.match(body.curriculum_hint, /MA\.1-3\.3\.3.*get_curriculum.*update_my_app/s);
  });
  test('an unknown word lists the valid ones', async () => {
    const r = await submit({ subject: 'gympa' });
    assert.equal(r.isError, true);
    assert.match(r.text, /Okänd ämne "gympa".*matte/);
  });
});
