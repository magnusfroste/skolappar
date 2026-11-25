import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer, api } from './helpers.mjs';
import { isoWeek } from '../store.mjs';

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

describe('the weekly letter to makers', () => {
  let s; let mail; let pub; let admin; let n = 0; let id;
  const call = async (who, name, args) => {
    const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  const wait = () => new Promise((r) => setTimeout(r, 150));

  before(async () => {
    mail = await fakeMail();
    s = await startServer({ adminKey: 'k-digest', env: { MAIL_PROVIDER: 'resend', MAIL_API_URL: mail.url, MAIL_API_KEY: 'k', MAIL_FROM: 'Skolappar <hej@skolappar.test>' } });
    pub = api(s.base);
    admin = api(s.base, { key: 'k-digest' });
    id = (await call(pub, 'submit_app', { url: 'https://klocka.example', title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', email: 'anna@example.com', accept_terms: true })).data.id;
    await wait();
    const token = /\/bekrafta\/([A-Za-z0-9_-]+)/.exec(mail.sent.at(-1).text)[1];
    await pub('GET', `/bekrafta/${token}`);
    assert.equal((await call(admin, 'update_app', { id, status: 'approved' })).ok, true);
    await wait();
  });
  after(async () => { await s.stop(); await mail.stop(); });

  test('nothing to say before anyone has played; then opens, rounds, levels and an idea', async () => {
    assert.equal((await call(admin, 'send_weekly_letter', {})).data.would_send, 0, 'no visits: no letter');
    for (let i = 0; i < 4; i++) await pub('POST', `/api/apps/${id}/click`);
    const events = [{ e: 'start' }];
    for (let i = 0; i < 6; i++) events.push({ e: 'round_start' }, { e: 'level', v: 1 });
    events.push({ e: 'round_done', v: 60 }, { e: 'level', v: 2 }, { e: 'stop', v: 1 }, { e: 'stop', v: 1 }, { e: 'hint' });
    await pub('POST', '/api/events', JSON.stringify({ events, seconds: 300 }), { 'Content-Type': 'text/plain', Origin: 'https://klocka.example' });

    const dry = (await call(admin, 'send_weekly_letter', {})).data;
    assert.equal(dry.would_send, 1);
    const letter = dry.letters[0];
    assert.equal(letter.subject, 'Veckan för Klockjakten – Skolappar');
    assert.doesNotMatch(JSON.stringify(dry), /anna@example\.com/, 'no address in the preview');
    assert.match(letter.text, /öppnad 4 gånger \(veckan innan: 0\)/);
    assert.match(letter.text, /6 omgångar påbörjade, 17 % blev klara, medelresultat 60 %/);
    assert.match(letter.text, /i snitt 5 minuter per besök/);
    assert.match(letter.text, /längst kom någon till nivå 2/);
    assert.match(letter.text, /flest slutade på nivå 1 \(2 gånger\)/);
    assert.match(letter.text, /Idé till nästa version: Många avbryter omgången/);
    assert.match(letter.text, new RegExp(`/app/${id}`));
  });

  test('sent once on Monday morning; the stop link asks first, then stops every app of the address', async () => {
    const before = mail.sent.length;
    const sunday = new Date('2026-11-29T10:00:00Z');
    const mondayEarly = new Date('2026-11-30T05:00:00Z'); // 06:00 in Stockholm
    const monday = new Date('2026-11-30T08:30:00Z'); // 09:30 in Stockholm
    assert.equal(await s.app.store.maybeSendWeeklyDigest(sunday), null);
    assert.equal(await s.app.store.maybeSendWeeklyDigest(mondayEarly), null);
    assert.deepEqual(await s.app.store.maybeSendWeeklyDigest(monday), { sent: 1, of: 1 });
    assert.equal(await s.app.store.maybeSendWeeklyDigest(new Date('2026-11-30T12:00:00Z')), null, 'once per week');
    assert.equal(isoWeek(monday), '2026-W49');
    assert.equal(mail.sent.length, before + 1);
    const message = mail.sent.at(-1);
    assert.deepEqual(message.to, ['anna@example.com']);

    const link = /\/brev\/av\/([^\s]+)/.exec(message.text)[1];
    assert.equal((await pub('GET', `/brev/av/${link}x`)).status, 404, 'a changed link does nothing');
    const page = await pub('GET', `/brev/av/${link}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /<form method="post">/);
    assert.equal((await call(admin, 'send_weekly_letter', {})).data.would_send, 1, 'opening the link changes nothing');
    const done = await pub('POST', `/brev/av/${link}`, 'x=1', { 'Content-Type': 'application/x-www-form-urlencoded' });
    assert.equal(done.status, 200);
    assert.equal((await call(admin, 'send_weekly_letter', {})).data.would_send, 0);
  });
});

describe('read aloud is counted: recorded lines against the browser voice', () => {
  let s; let pub; let admin; let n = 0; let id;
  const call = async (who, name, args) => {
    const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    return r.json.result.structuredContent?.result;
  };
  before(async () => {
    s = await startServer({ adminKey: 'k-voice' });
    pub = api(s.base); admin = api(s.base, { key: 'k-voice' });
    id = (await admin('POST', '/api/admin/apps', { title: 'Ordklassjakten', url: 'https://ord.example', description: 'Hitta ordklassen.', status: 'approved' })).json.app.id;
  });
  after(() => s.stop());

  test('voice_file and voice_browser become in_app.voice with the recorded share', async () => {
    const events = [{ e: 'start' }, ...Array(3).fill({ e: 'voice_file' }), ...Array(7).fill({ e: 'voice_browser' })];
    await pub('POST', '/api/events', JSON.stringify({ events, seconds: 60 }), { 'Content-Type': 'text/plain', Origin: 'https://ord.example' });
    const stats = await call(pub, 'app_stats', { id });
    assert.deepEqual(stats.in_app.voice, { recorded: 3, browser: 7, share_recorded: 0.3 });
  });
});
