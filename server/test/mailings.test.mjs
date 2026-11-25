import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer, api } from './helpers.mjs';
import { MAILINGS, render, appsPhrase, TERMS } from '../mailings.mjs';

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

/** Days from now at 10:00 UTC (11:00 or 12:00 in Stockholm, inside the sending hours). */
const daysOn = (d) => { const t = new Date(Date.now() + d * 86400000); t.setUTCHours(10, 0, 0, 0); return t; };

test('the templates: five, in order, each with a subject; placeholders filled, empty ones take their space along', () => {
  assert.deepEqual(MAILINGS.map((m) => m.id), ['godkand', 'en-vecka', 'en-manad', 'villkor', 'nyheter']);
  for (const m of MAILINGS) assert.ok(m.subject && m.body && m.schedule, m.id);
  assert.deepEqual(render({ subject: 'Om {{app}}', body: 'Hej {{namn}}! {{okand}}' }, { app: 'Klockjakten', namn: '' }), { subject: 'Om Klockjakten', text: 'Hej! {{okand}}' });
  assert.equal(appsPhrase(['A']), 'appen A');
  assert.equal(appsPhrase(['A', 'B', 'C']), 'apparna A, B och C');
  assert.match(TERMS.version, /^\d{4}-\d{2}-\d{2}$/);
  for (const m of MAILINGS.filter((x) => x.stoppable)) assert.match(m.body, /\{\{av\}\}/, `${m.id} has the stop link`);
});

describe('mails to makers', () => {
  let s; let mail; let pub; let admin; let n = 0; let id; let other;
  const call = async (who, name, args) => {
    const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  const wait = () => new Promise((r) => setTimeout(r, 150));
  const app = (url, email, first_name) => ({ url, title: url.includes('klocka') ? 'Klockjakten' : 'Ordjakten', description: 'Öva klockan med hela och halva timmar.', first_name, email });
  async function publish(url, email, name) {
    const sent = await call(pub, 'submit_app', { ...app(url, email, name), accept_terms: true });
    assert.equal(sent.ok, true, sent.text);
    await wait();
    const token = /\/bekrafta\/([A-Za-z0-9_-]+)/.exec(mail.sent.filter((m) => m.to[0] === email).at(-1).text)[1];
    await pub('GET', `/bekrafta/${token}`);
    assert.equal((await call(admin, 'update_app', { id: sent.data.id, status: 'approved' })).ok, true);
    await wait();
    return sent.data.id;
  }

  before(async () => {
    mail = await fakeMail();
    s = await startServer({ adminKey: 'k-mail', env: { MAIL_PROVIDER: 'resend', MAIL_API_URL: mail.url, MAIL_API_KEY: 'k', MAIL_FROM: 'Skolappar <hej@skolappar.test>' } });
    pub = api(s.base);
    admin = api(s.base, { key: 'k-mail' });
    assert.equal(await s.app.store.maybeSendFollowUps(), null, 'the first tick only marks when the follow-ups began');
  });
  after(async () => { await s.stop(); await mail.stop(); });

  test('the terms: a page, an API and a tool; a submission without them is refused, with them the version is kept', async () => {
    const terms = (await pub('GET', '/api/terms')).json;
    assert.equal(terms.version, TERMS.version);
    assert.match(terms.html, /<h2>6\. Mejl vi skickar<\/h2>/);
    assert.equal((await call(pub, 'get_terms', {})).data.version, TERMS.version);
    const page = await pub('GET', '/villkor');
    assert.match(page.text, /Senast uppdaterade/);

    const refused = await call(pub, 'submit_app', app('https://utan.example', 'x@example.com', 'Bo'));
    assert.equal(refused.ok, false);
    const refusedFalse = await call(pub, 'submit_app', { ...app('https://utan.example', 'x@example.com', 'Bo'), accept_terms: false });
    assert.match(refusedFalse.text, /Villkoren måste godkännas/);
    const form = await pub('POST', '/api/submissions', { url: 'https://utan.example', email: 'x@example.com' }, { 'X-Forwarded-For': '203.0.113.9' });
    assert.equal(form.status, 400);
    assert.equal(form.json.terms_version, TERMS.version);
    const ok = await pub('POST', '/api/submissions', { url: 'https://med.example', email: 'x@example.com', accept_terms: true }, { 'X-Forwarded-For': '203.0.113.9' });
    assert.equal(ok.status, 201);
    const listed = (await admin('GET', '/api/admin/apps?search=med.example')).json;
    const row = (listed.apps || listed).find((a) => a.url === 'https://med.example');
    assert.equal(row.terms_version, TERMS.version);
    assert.ok(row.terms_accepted_at);
  });

  test('approval: the godkand template with the first name, logged once', async () => {
    id = await publish('https://klocka.example', 'anna@example.com', 'Anna');
    const m = mail.sent.at(-1);
    assert.equal(m.subject, 'Nu finns Klockjakten på Skolappar');
    assert.match(m.text, /^Hej Anna!/);
    assert.match(m.text, new RegExp(`/app/${id}`));
    const overview = (await admin('GET', '/api/admin/mailings')).json;
    assert.deepEqual(overview.log.filter((l) => l.kind === 'godkand').map((l) => [l.address, l.result, l.app_title]), [['anna@example.com', 'sent', 'Klockjakten']]);
    assert.equal(overview.templates.find((t) => t.id === 'godkand').sent, 1);
    assert.ok(overview.placeholders.namn);
  });

  test('follow-ups: a week, then a month, each once, only in the daytime; the stop link ends them', async () => {
    assert.deepEqual(s.app.store.dueFollowUps(daysOn(3)), [], 'nothing after three days');
    const week = s.app.store.dueFollowUps(daysOn(8));
    assert.deepEqual(week.map((f) => f.kind), ['en-vecka']);
    assert.match(week[0].text, /Den har öppnats 0 gånger|Den har inte öppnats än/);
    const night = daysOn(8); night.setUTCHours(1);
    assert.equal(await s.app.store.maybeSendFollowUps(night), null, 'not at night');
    const before = mail.sent.length;
    assert.deepEqual(await s.app.store.maybeSendFollowUps(daysOn(8)), { sent: 1, of: 1 });
    assert.equal(mail.sent.at(-1).subject, 'En vecka med Klockjakten');
    assert.deepEqual(await s.app.store.maybeSendFollowUps(daysOn(9)), { sent: 0, of: 0 }, 'once');
    assert.deepEqual(s.app.store.dueFollowUps(daysOn(31)).map((f) => f.kind), ['en-manad']);
    assert.deepEqual(await s.app.store.maybeSendFollowUps(daysOn(31)), { sent: 1, of: 1 });
    assert.equal(mail.sent.at(-1).subject, 'En månad med Klockjakten');
    assert.equal(mail.sent.length, before + 2);
    assert.deepEqual(s.app.store.dueFollowUps(daysOn(60)), []);

    other = await publish('https://ord.example', 'bo@example.com', 'Bo');
    assert.equal(s.app.store.dueFollowUps(daysOn(8)).length, 1);
    const link = /\/brev\/av\/([^\s]+)/.exec(s.app.store.dueFollowUps(daysOn(8))[0].text)[1];
    await pub('POST', `/brev/av/${link}`, 'x=1', { 'Content-Type': 'application/x-www-form-urlencoded' });
    assert.deepEqual(s.app.store.dueFollowUps(daysOn(8)), [], 'stopped');
  });

  test('news: a dry run first, then once per ref, not to an address that stopped', async () => {
    const dry = (await admin('POST', '/api/admin/mailings/send', { kind: 'nyheter', ref: '2026-12-ljud-ai' })).json;
    assert.equal(dry.would_send, 1, 'Bo stopped his mails');
    assert.equal(dry.recipients, 1);
    assert.match(dry.example.subject, /ljud och AI/);
    assert.match(dry.example.text, /^Hej Anna!/);
    assert.doesNotMatch(JSON.stringify(dry), /@example\.com/);
    assert.equal((await admin('POST', '/api/admin/mailings/send', { kind: 'nyheter', dry_run: false })).status, 400, 'news needs a ref');
    const before = mail.sent.length;
    const sent = (await admin('POST', '/api/admin/mailings/send', { kind: 'nyheter', ref: '2026-12-ljud-ai', dry_run: false })).json;
    assert.deepEqual([sent.sent, sent.of], [1, 1]);
    assert.equal(mail.sent.length, before + 1);
    assert.match(mail.sent.at(-1).text, /\/brev\/av\//);
    const again = (await admin('POST', '/api/admin/mailings/send', { kind: 'nyheter', ref: '2026-12-ljud-ai', dry_run: false })).json;
    assert.deepEqual([again.sent, again.already_sent], [0, 1]);
    const custom = (await call(admin, 'send_mailing', { kind: 'nyheter', ref: 'x-2', subject: 'Hej {{namn}}', body: 'Om {{app}}.' })).data;
    assert.deepEqual(custom.example, { subject: 'Hej Anna', text: 'Om Klockjakten.' });
  });

  test('changed terms: needs what changes and from when, and reaches every maker, also those who stopped', async () => {
    assert.match((await call(admin, 'send_mailing', { kind: 'villkor', dry_run: false })).text, /andringar/);
    const dry = (await call(admin, 'send_mailing', { kind: 'villkor', andringar: '- Ny punkt om AI.', galler_fran: '1 januari 2027' })).data;
    assert.equal(dry.ref, TERMS.version);
    assert.equal(dry.would_send, 2);
    assert.match(dry.example.subject, /1 januari 2027/);
    assert.match(dry.example.text, /Ny punkt om AI/);
    assert.match(dry.example.text, /appen Klockjakten/);
    const preview = (await call(admin, 'preview_mailing', { kind: 'en-vecka', app_id: other })).data;
    assert.equal(preview.subject, 'En vecka med Ordjakten');
    assert.equal((await call(admin, 'list_mailings', {})).data.templates.length, 5);
    const open = await pub('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name: 'list_mailings', arguments: {} } });
    assert.ok(open.json.error || open.json.result?.isError, 'admin only');
  });
});

describe('an admin vouches for an address', () => {
  let s; let pub; let admin; let n = 0;
  const call = async (who, name, args) => {
    const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  before(async () => { s = await startServer({ adminKey: 'k-vouch' }); pub = api(s.base); admin = api(s.base, { key: 'k-vouch' }); });
  after(() => s.stop());

  test('every app of the address counts as confirmed; nothing is sent; only for admins', async () => {
    const one = { title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Enzo', email: 'Enzo@Example.com', accept_terms: true };
    const a = (await call(pub, 'submit_app', { ...one, url: 'https://a.example' })).data.id;
    const b = (await call(pub, 'submit_app', { ...one, url: 'https://b.example' })).data.id;
    for (const id of [a, b]) await call(admin, 'update_app', { id, status: 'approved' });
    assert.equal((await pub('POST', '/api/admin/confirm-email', { email: 'enzo@example.com' })).status, 401);
    const r = (await admin('POST', '/api/admin/confirm-email', { email: 'enzo@example.com' })).json;
    assert.equal(r.confirmed_apps, 2);
    for (const id of [a, b]) assert.equal((await admin('GET', `/api/admin/apps/${id}`)).json.email_confirmed, true);
    assert.equal((await call(admin, 'confirm_email', { email: 'enzo@example.com' })).data.confirmed_apps, 0, 'already done');
    assert.equal((await call(admin, 'send_mailing', { kind: 'nyheter', ref: 'x-1' })).data.would_send, 1);
  });
});

describe('reports: anyone flags a listed app, the owner is told, an admin handles it', () => {
  let s; let mail; let pub; let admin; let n = 0; let appId;
  const call = async (who, name, args) => {
    const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  const wait = () => new Promise((r) => setTimeout(r, 150));
  before(async () => {
    mail = await fakeMail();
    s = await startServer({ adminKey: 'k-rep', env: { MAIL_PROVIDER: 'resend', MAIL_API_URL: mail.url, MAIL_API_KEY: 'k', MAIL_FROM: 'Skolappar <hej@skolappar.test>' } });
    pub = api(s.base); admin = api(s.base, { key: 'k-rep' });
    appId = (await call(pub, 'submit_app', { url: 'https://rapport.example', title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Bo', email: 'bo@example.com', accept_terms: true })).data.id;
    await call(admin, 'update_app', { id: appId, status: 'approved' });
    await call(admin, 'set_setting', { key: 'report_email', value: 'owner@example.com' });
  });
  after(async () => { await s.stop(); await mail.stop(); });

  test('validation: a listed app, a known reason, words for "other"; a pending app cannot be reported', async () => {
    const ip = { 'X-Forwarded-For': '198.51.100.40' };
    assert.equal((await pub('POST', '/api/reports', { app_id: appId, reason: 'boring' }, ip)).status, 400);
    assert.equal((await pub('POST', '/api/reports', { app_id: appId, reason: 'other' }, ip)).status, 400);
    assert.equal((await pub('POST', '/api/reports', { app_id: '99999999-9999-4999-8999-999999999999', reason: 'broken' }, ip)).status, 404);
  });

  test('a report mails the owner once; the same reporter again is not a second report', async () => {
    const ip = { 'X-Forwarded-For': '198.51.100.41' };
    const before = mail.sent.length;
    assert.equal((await pub('POST', '/api/reports', { app_id: appId, reason: 'inappropriate', message: 'Fula ord på nivå 3', email: 'larare@example.com' }, ip)).status, 201);
    assert.equal((await pub('POST', '/api/reports', { app_id: appId, reason: 'inappropriate' }, ip)).status, 201);
    await wait();
    assert.equal(mail.sent.length, before + 1);
    const m = mail.sent.at(-1);
    assert.deepEqual(m.to, ['owner@example.com']);
    assert.equal(m.subject, 'Rapport: Klockjakten – Olämpligt innehåll');
    assert.match(m.text, /Fula ord på nivå 3/);
    assert.match(m.text, /larare@example\.com/);
    await pub('POST', '/api/reports', { app_id: appId, reason: 'mistagged', message: 'Är för åk 7–9' }, { 'X-Forwarded-For': '198.51.100.42' });
    const list = (await admin('GET', '/api/admin/reports')).json;
    assert.equal(list.open, 2);
    assert.equal(list.reports[0].open_reports_for_app, 2);
    assert.equal((await pub('GET', '/api/admin/reports')).status, 401);
  });

  test('resolved closes one; delist takes the app out of the catalogue and closes the rest', async () => {
    const [mistagged, inappropriate] = (await call(admin, 'list_reports', {})).data.reports;
    assert.equal(mistagged.reason, 'mistagged');
    const r1 = (await admin('POST', `/api/admin/reports/${mistagged.id}`, { action: 'resolved', note: 'Ändrade årskurs' })).json;
    assert.equal(r1.report.status, 'resolved');
    const r2 = (await call(admin, 'handle_report', { id: inappropriate.id, action: 'delist', note: 'Olämpligt språk' })).data;
    assert.equal(r2.delisted_app_id, appId);
    const app = (await admin('GET', `/api/admin/apps/${appId}`)).json;
    assert.deepEqual([app.status, app.delist_reason], ['delisted', 'Olämpligt språk']);
    assert.equal((await pub('GET', `/api/apps/${appId}`)).status, 404);
    assert.equal((await admin('GET', '/api/admin/reports')).json.open, 0);
    assert.equal((await admin('GET', '/api/admin/reports?status=handled')).json.reports.length, 2);
    assert.equal((await pub('POST', '/api/reports', { app_id: appId, reason: 'broken' }, { 'X-Forwarded-For': '198.51.100.43' })).status, 404, 'a delisted app cannot be reported');
  });
});

describe('an admin sets the address on an app', () => {
  let s; let admin; let n = 0;
  const call = async (name, args) => {
    const r = await admin('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
    const result = r.json.result;
    return { ok: !result.isError, text: result.content[0].text, data: result.structuredContent?.result ?? result.structuredContent };
  };
  before(async () => { s = await startServer({ adminKey: 'k-set' }); admin = api(s.base, { key: 'k-set' }); });
  after(() => s.stop());

  test('set (counts as confirmed, nothing sent), changed by PATCH, removed with null; a bad address is refused', async () => {
    const id = (await admin('POST', '/api/admin/apps', { title: 'Kotten snickrar', url: 'https://snickrar.example', description: 'Bygg med Kotten och räkna.', status: 'approved' })).json.app.id;
    assert.equal((await call('update_app', { id, submitter_email: 'magnus@example.com' })).ok, true);
    let app = (await admin('GET', `/api/admin/apps/${id}`)).json;
    assert.deepEqual([app.submitter_email, app.email_confirmed, app.status], ['magnus@example.com', true, 'approved']);
    assert.equal(app.published_notified_at, null, 'no approval mail for an app that was already listed');
    assert.equal((await admin('PATCH', `/api/admin/apps/${id}`, { submitter_email: 'inte-en-adress' })).status, 400);
    assert.equal((await admin('PATCH', `/api/admin/apps/${id}`, { submitter_email: null })).status, 200);
    app = (await admin('GET', `/api/admin/apps/${id}`)).json;
    assert.deepEqual([app.submitter_email, app.email_confirmed], [null, false]);
  });
});
