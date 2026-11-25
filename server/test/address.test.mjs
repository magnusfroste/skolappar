import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer, api } from './helpers.mjs';

/** A stand-in for Shipholm's MCP endpoint: answers initialize and the two tools, remembers the calls. */
function fakeShipholm() {
  const calls = [];
  const state = { refuse: null };
  const server = http.createServer(async (req, res) => {
    if (req.method === 'DELETE') { res.writeHead(200); return res.end(); }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const msg = JSON.parse(raw);
    if (req.headers.authorization !== 'Bearer abt_test') { res.writeHead(401); return res.end(); }
    const send = (result) => { res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Mcp-Session-Id': 's1' }); res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: msg.id, result })}\n\n`); };
    if (msg.method === 'initialize') return send({ protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'fake', version: '1' } });
    if (msg.method === 'notifications/initialized') { res.writeHead(202); return res.end(); }
    const { name, arguments: args } = msg.params;
    calls.push([name, args]);
    if (state.refuse) return send({ isError: true, content: [{ type: 'text', text: state.refuse }] });
    send({ content: [{ type: 'text', text: '{}' }], structuredContent: { domain: args.domain, host: args.host } });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}/mcp`, calls, state, stop: () => new Promise((r) => server.close(r)),
  })));
}

describe('an app on Shipholm gets <name>.skolappar.com while it is listed', () => {
  const KEY = 'k-address';
  let s; let shipholm; let admin; let pub; let n = 0;
  const call = async (who, name, args = {}) => {
    const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  const submit = async (url) => {
    s.app.limiters.submitLimiter.reset();
    const sent = (await call(pub, 'submit_app', { url, title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', email: 'p@example.com', accept_terms: true })).data;
    return sent;
  };

  before(async () => {
    shipholm = await fakeShipholm();
    s = await startServer({ adminKey: KEY, env: { SHIPHOLM_API_KEY: 'abt_test', SHIPHOLM_API_URL: shipholm.url } });
    admin = api(s.base, { key: KEY });
    pub = api(s.base);
  });
  after(async () => { await s.stop(); await shipholm.stop(); });

  test('given at approval, used in the catalogue, taken back when the app leaves it', async () => {
    const { id, app_key: key } = await submit('https://klockjakten.shipholm.dev/');
    assert.equal(shipholm.calls.length, 0, 'nothing is given while the app waits');

    const approved = (await call(admin, 'update_app', { id, status: 'approved' })).data;
    assert.deepEqual(shipholm.calls, [['grant_subdomain', { domain: 'klockjakten.skolappar.com', host: 'klockjakten.shipholm.dev' }]]);
    assert.deepEqual(approved.address, { url: 'https://klockjakten.skolappar.com/', changed: true, note: null });
    assert.equal(approved.app.url, 'https://klockjakten.skolappar.com/');
    assert.equal(approved.app.origin_url, 'https://klockjakten.shipholm.dev/');
    assert.equal((await call(pub, 'get_app', { id })).data.url, 'https://klockjakten.skolappar.com/');
    assert.equal((await call(pub, 'app_status', { id })).data.url, 'https://klockjakten.skolappar.com/');
    // the address it came with is still "this app": it cannot be submitted a second time
    assert.match((await call(pub, 'submit_app', { url: 'https://klockjakten.shipholm.dev/', title: 'Igen', description: 'Samma app en gång till.', first_name: 'Anna', email: 'p@example.com', accept_terms: true })).text, /finns redan/);
    // featured is still listed: nothing more is asked of Shipholm
    await call(admin, 'update_app', { id, status: 'featured' });
    assert.equal(shipholm.calls.length, 1);

    const gone = (await call(pub, 'withdraw_my_app', { id, app_key: key })).data;
    assert.equal(gone.status, 'delisted');
    assert.deepEqual(shipholm.calls[1], ['revoke_subdomain', { domain: 'klockjakten.skolappar.com' }]);
    const after = (await call(admin, 'get_app', { id })).data;
    assert.deepEqual([after.url, after.origin_url], ['https://klockjakten.shipholm.dev/', null]);
  });

  test('an app elsewhere keeps its own address, and a reserved name is not given', async () => {
    const before = shipholm.calls.length;
    const other = await submit('https://klockan.vercel.app/');
    const out = (await call(admin, 'update_app', { id: other.id, status: 'approved' })).data;
    assert.equal(out.address, undefined);
    assert.equal(out.app.url, 'https://klockan.vercel.app/');

    const reserved = await submit('https://admin.shipholm.dev/');
    const res = (await call(admin, 'update_app', { id: reserved.id, status: 'approved' })).data;
    assert.match(res.address.note, /reserverat/);
    assert.equal(res.app.url, 'https://admin.shipholm.dev/');
    assert.equal(shipholm.calls.length, before);
  });

  test('when Shipholm says no the app is listed anyway, with the reason for the reviewer', async () => {
    shipholm.state.refuse = "'pianot.skolappar.com' is already in use";
    const { id } = await submit('https://pianot.shipholm.dev/');
    const out = (await call(admin, 'update_app', { id, status: 'approved' })).data;
    assert.equal(out.app.status, 'approved');
    assert.equal(out.app.url, 'https://pianot.shipholm.dev/');
    assert.match(out.address.note, /already in use/);
    assert.match(out.app.address_note, /already in use/);
    assert.ok(!JSON.stringify((await call(pub, 'app_status', { id })).data).includes('already in use'), 'the note is for the reviewer');
    shipholm.state.refuse = null;
  });

  test('deleting a listed app takes the address back first', async () => {
    const { id } = await submit('https://tabeller.shipholm.dev/');
    await call(admin, 'update_app', { id, status: 'approved' });
    const before = shipholm.calls.length;
    assert.equal((await call(admin, 'delete_app', { id })).ok, true);
    assert.deepEqual(shipholm.calls[before], ['revoke_subdomain', { domain: 'tabeller.skolappar.com' }]);
  });

  test('without a key nothing is asked of Shipholm', async () => {
    const plain = await startServer({ adminKey: KEY });
    try {
      const a = api(plain.base, { key: KEY });
      const p = api(plain.base);
      const sent = (await call(p, 'submit_app', { url: 'https://klockjakten.shipholm.dev/', title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', email: 'p@example.com', accept_terms: true })).data;
      const out = (await call(a, 'update_app', { id: sent.id, status: 'approved' })).data;
      assert.match(out.address.note, /SHIPHOLM_API_KEY/);
      assert.equal(out.app.url, 'https://klockjakten.shipholm.dev/');
    } finally { await plain.stop(); }
  });

  test('publish_on_shipholm tells an agent the way', async () => {
    const out = (await call(pub, 'publish_on_shipholm', { name: 'klockjakten' })).data;
    assert.equal(out.address_when_listed, 'https://klockjakten.skolappar.com');
    assert.ok(out.steps.some((x) => x.includes('api.shipholm.com/agent/start')));
  });
});
