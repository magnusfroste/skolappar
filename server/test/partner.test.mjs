import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { startServer, api, PNG } from './helpers.mjs';

const KEY = 'sp_studio-partner-key-for-tests-0123456789';
const HASH = createHash('sha256').update(KEY).digest('hex');

describe('a partner key (Shipholm Studio): its own limits, a label, a vouched address – and nothing more', () => {
  let s; let pub; let partner; let admin; let n = 0;
  const callAs = async (who, name, args) => {
    const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    if (!r.json?.result) return { status: r.status, ok: false, text: r.text };
    const result = r.json.result;
    return { status: r.status, ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  const withPartner = (key) => async (method, path, body, headers = {}) => pub(method, path, body, { 'X-Partner-Key': key, ...headers });
  const app = (url, extra = {}) => ({ url, title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', email: 'anna@example.com', ...extra });

  before(async () => {
    s = await startServer({ adminKey: 'k-admin', submitLimit: 2, env: { PARTNER_KEYS: `shipholm-studio:${HASH}` } });
    pub = api(s.base);
    partner = withPartner(KEY);
    admin = api(s.base, { key: 'k-admin' });
  });
  after(async () => { await s.stop(); });

  test('it opens no admin tool and a wrong key is refused', async () => {
    const tools = (await partner('POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' })).json.result.tools.map((t) => t.name);
    for (const name of ['update_app', 'delete_app', 'list_submissions', 'create_app', 'set_setting']) assert.ok(!tools.includes(name), name);
    assert.equal((await callAs(partner, 'list_submissions', {})).ok, false);
    assert.equal((await withPartner('sp_wrong-key-0000000000000000')('POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' })).status, 401);
  });

  test('a vouched address skips the mail and is confirmed; the submission carries the partner name', async () => {
    const vouched = await callAs(partner, 'submit_app', app('https://a.example', { email_verified: true }));
    assert.equal(vouched.ok, true, vouched.text);
    assert.equal(vouched.data.email_confirmed, true);
    assert.equal((await callAs(pub, 'app_status', { id: vouched.data.id })).data.email_confirmed, true);
    const plain = await callAs(partner, 'submit_app', app('https://b.example'));
    assert.equal(plain.data.email_confirmed, false, 'without email_verified the address is confirmed by mail as before');
    const queue = (await callAs(admin, 'list_submissions', {})).data;
    assert.equal(queue.find((a) => a.id === vouched.data.id).source, 'shipholm-studio');
    // without the partner key email_verified counts for nothing
    const anon = await callAs(pub, 'submit_app', app('https://c.example', { email_verified: true }));
    assert.equal(anon.data.email_confirmed, false);
    assert.equal(queue.find((a) => a.id === anon.data.id), undefined);
    assert.equal((await callAs(admin, 'list_submissions', {})).data.find((a) => a.id === anon.data.id).source, null);
  });

  test('the limits are per partner, not per address', async () => {
    // the anonymous limit here is 2 an hour and was spent above by pub (1) – one more, then no
    assert.equal((await callAs(pub, 'submit_app', app('https://d.example'))).ok, true);
    assert.match((await callAs(pub, 'submit_app', app('https://e.example'))).text, /För många inskick/);
    // the partner, from the same address, goes on
    for (const u of ['https://f.example', 'https://g.example', 'https://h.example']) assert.equal((await callAs(partner, 'submit_app', app(u))).ok, true, u);
    const sent = (await callAs(partner, 'submit_app', app('https://i.example'))).data;
    const put = await partner('PUT', `/api/apps/${sent.id}/image`, PNG, { 'Content-Type': 'image/png', 'X-App-Key': sent.app_key });
    assert.equal(put.status, 200);
  });
});
