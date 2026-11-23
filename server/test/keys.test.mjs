import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer, api } from './helpers.mjs';

/** A stand-in for the mail provider that keeps every message. */
function fakeMail() {
  const sent = [];
  const server = http.createServer(async (req, res) => {
    let raw = '';
    for await (const c of req) raw += c;
    sent.push(JSON.parse(raw));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"id":"m1"}');
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ url: `http://127.0.0.1:${server.address().port}/emails`, sent, stop: () => new Promise((d) => server.close(d)) })));
}

describe('a lost app key: new keys through a link mailed to the parent', () => {
  let s; let mail; let pub; let n = 0;
  const call = async (name, args) => {
    const r = await pub('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  const form = (path) => pub('POST', path, 'x=1', { 'Content-Type': 'application/x-www-form-urlencoded' });

  before(async () => {
    mail = await fakeMail();
    s = await startServer({ adminKey: 'k-keys', submitLimit: 10, env: { MAIL_PROVIDER: 'resend', MAIL_API_URL: mail.url, MAIL_API_KEY: 'k', MAIL_FROM: 'Skolappar <hej@skolappar.test>' } });
    pub = api(s.base);
  });
  after(async () => { await s.stop(); await mail.stop(); });

  test('the link gives a new key per app, once; the old keys stop working', async () => {
    const sub = (url) => call('submit_app', { url, title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', email: 'Anna@Example.com' });
    const a = (await sub('https://a.example')).data;
    const b = (await sub('https://b.example')).data;
    await new Promise((r) => setTimeout(r, 150)); // the confirmation mails go out in the background
    const before = mail.sent.length;

    // the answer is the same for an address with apps and one without, and nothing changes yet
    const known = await call('recover_app_keys', { email: 'anna@example.com' });
    const unknown = await call('recover_app_keys', { email: 'nobody@example.com' });
    assert.deepEqual(known.data, unknown.data);
    assert.equal(mail.sent.length, before + 1, 'one mail, to the address that has apps');
    const message = mail.sent.at(-1);
    assert.deepEqual(message.to, ['anna@example.com']);
    const token = /\/nyckel\/([A-Za-z0-9_-]+)/.exec(message.text)[1];
    assert.equal((await call('update_my_app', { id: a.id, app_key: a.app_key, title: 'Fortfarande min' })).ok, true, 'old key still works until the link is used');

    // opening the link only shows a button (a mail scanner changes nothing)
    const page = await pub('GET', `/nyckel/${token}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /<form method="post">/);
    assert.equal((await pub('GET', `/nyckel/${token}`)).status, 200);

    const done = await form(`/nyckel/${token}`);
    assert.equal(done.status, 200);
    const keys = [...done.text.matchAll(/nyckel: <code>(sapp_[A-Za-z0-9_-]+)<\/code>/g)].map((m) => m[1]);
    assert.equal(keys.length, 2);
    assert.ok(done.text.includes(a.id) && done.text.includes(b.id));
    assert.equal((await form(`/nyckel/${token}`)).status, 410, 'once');
    assert.equal((await pub('GET', `/nyckel/${token}`)).status, 410);

    const ids = [...done.text.matchAll(/id: <code>([0-9a-f-]{36})<\/code>/g)].map((m) => m[1]);
    const newA = keys[ids.indexOf(a.id)];
    assert.equal((await call('update_my_app', { id: a.id, app_key: a.app_key, title: 'Gammal nyckel' })).ok, false, 'the old key is gone');
    assert.equal((await call('update_my_app', { id: a.id, app_key: newA, title: 'Ny nyckel' })).ok, true);
    assert.equal((await call('app_status', { id: a.id })).data.email_confirmed, true, 'the link went to the address');
  });

  test('a bad or unknown link does nothing, and asking is limited per address', async () => {
    assert.equal((await pub('GET', '/nyckel/not-a-real-token-at-all-xxxxxx')).status, 410);
    assert.equal((await form('/nyckel/not-a-real-token-at-all-xxxxxx')).status, 410);
    await call('submit_app', { url: 'https://c.example', title: 'Tredje', description: 'En tredje app för att prova gränsen.', first_name: 'Bo', email: 'bo@example.com' });
    const before = mail.sent.filter((m) => m.to[0] === 'bo@example.com' && /nyckel/.test(m.text)).length;
    for (let i = 0; i < 4; i++) await call('recover_app_keys', { email: 'bo@example.com' });
    const after = mail.sent.filter((m) => m.to[0] === 'bo@example.com' && /nyckel/.test(m.text)).length;
    assert.equal(after - before, 3, 'at most three links a day per address');
  });
});
