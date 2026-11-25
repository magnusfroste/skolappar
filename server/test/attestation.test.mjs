import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer, api } from './helpers.mjs';

/** Shipholm's verify_attestation, in memory: 'good' is Anna's klockan, anything else is not valid. */
function fakeShipholm() {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'DELETE') { res.writeHead(200); return res.end(); }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const msg = JSON.parse(raw);
    const send = (result) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result })); };
    if (msg.method === 'initialize') return send({ protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'fake', version: '1' } });
    if (msg.method === 'notifications/initialized') { res.writeHead(202); return res.end(); }
    const valid = msg.params.arguments.attestation === 'good';
    const data = valid ? { valid: true, app: 'klockan', email: 'anna@example.com', urls: ['https://klockan.shipholm.dev', 'https://klockan.se'] } : { valid: false };
    send({ content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { result: data } });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/mcp`, stop: () => new Promise((r) => server.close(r)) })));
}

function fakeMail() {
  const sent = [];
  const server = http.createServer(async (req, res) => { let raw = ''; for await (const c of req) raw += c; sent.push(JSON.parse(raw)); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"id":"m"}'); });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ url: `http://127.0.0.1:${server.address().port}/emails`, sent, stop: () => new Promise((d) => server.close(d)) })));
}

describe('a Shipholm attestation instead of the confirmation mail', () => {
  let s; let shipholm; let mail; let pub; let n = 0;
  const submit = async (args) => {
    const r = await pub('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name: 'submit_app', arguments: {
      title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', accept_terms: true, ...args } } });
    return r.json.result.structuredContent.result;
  };
  const wait = () => new Promise((r) => setTimeout(r, 150));
  before(async () => {
    shipholm = await fakeShipholm();
    mail = await fakeMail();
    s = await startServer({ submitLimit: 20, env: { SHIPHOLM_API_KEY: 'abt_test', SHIPHOLM_API_URL: shipholm.url,
      MAIL_PROVIDER: 'resend', MAIL_API_URL: mail.url, MAIL_API_KEY: 'k', MAIL_FROM: 'Skolappar <hej@skolappar.test>' } });
    pub = api(s.base);
  });
  after(async () => { await s.stop(); await shipholm.stop(); await mail.stop(); });

  test('a valid attestation for this address and this app: confirmed, no mail', async () => {
    const before = mail.sent.length;
    const r = await submit({ url: 'https://klockan.shipholm.dev/', email: 'Anna@Example.com', shipholm_attestation: 'good' });
    await wait();
    assert.equal(r.email_confirmed, true);
    assert.match(r.next[0], /Shipholm intygar/);
    assert.equal(mail.sent.length, before);
  });

  test('an attestation that does not fit falls back to the mail, and says why', async () => {
    for (const [args, why] of [
      [{ url: 'https://klocka2.shipholm.dev/', email: 'bo@example.com', shipholm_attestation: 'forged' }, /ogiltigt/],
      [{ url: 'https://klocka3.shipholm.dev/', email: 'cecilia@example.com', shipholm_attestation: 'good' }, /annan e-postadress/],
      [{ url: 'https://annan.shipholm.dev/', email: 'anna2@example.com', shipholm_attestation: 'good' }, /annan e-postadress|annan app/],
    ]) {
      const before = mail.sent.length;
      const r = await submit(args);
      await wait();
      assert.equal(r.email_confirmed, false, args.url);
      assert.ok(r.next.some((l) => why.test(l)), JSON.stringify(r.next));
      assert.equal(mail.sent.length, before + 1, 'the confirmation mail goes out');
    }
  });
});
