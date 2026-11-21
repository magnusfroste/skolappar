import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createMailer, parseAddress } from '../mailer.mjs';
import { quietLog } from './helpers.mjs';

function fakeFetch(status, json) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return new Response(JSON.stringify(json), { status, headers: { 'Content-Type': 'application/json' } });
  };
  return { impl, calls };
}

const MSG = { to: 'tipsare@example.se', subject: 'Hej', text: 'Text' };
const CF = { MAIL_PROVIDER: 'cloudflare', MAIL_API_KEY: 'cf-token', MAIL_CLOUDFLARE_ACCOUNT_ID: 'acc123', MAIL_FROM: 'Skolappar <hej@skolappar.com>' };
const CF_OK = { success: true, errors: [], result: { delivered: ['tipsare@example.se'], permanent_bounces: [], queued: [] } };

describe('mailer', () => {
  test('parseAddress', () => {
    assert.deepEqual(parseAddress('Skolappar <hej@skolappar.com>'), { name: 'Skolappar', address: 'hej@skolappar.com' });
    assert.deepEqual(parseAddress('"Skol Appar" <hej@skolappar.com>'), { name: 'Skol Appar', address: 'hej@skolappar.com' });
    assert.deepEqual(parseAddress('hej@skolappar.com'), { name: '', address: 'hej@skolappar.com' });
  });

  test('stub by default; incomplete settings fall back to the stub', async () => {
    const log = quietLog();
    const stub = createMailer({}, { log });
    assert.equal(stub.configured, false);
    assert.equal(stub.problem, null);
    assert.deepEqual(await stub.send(MSG), { sent: false, reason: 'not_configured' });
    const half = createMailer({ MAIL_PROVIDER: 'cloudflare', MAIL_API_KEY: 'x' }, { log });
    assert.equal(half.configured, false);
    assert.match(half.problem, /MAIL_CLOUDFLARE_ACCOUNT_ID, MAIL_FROM/);
    assert.match(createMailer({ MAIL_PROVIDER: 'pigeon' }, { log }).problem, /unknown/);
  });

  test('cloudflare: request shape and success', async () => {
    const f = fakeFetch(200, CF_OK);
    const log = quietLog();
    const m = createMailer(CF, { fetchImpl: f.impl, log });
    assert.equal(m.provider, 'cloudflare');
    assert.deepEqual(await m.send(MSG), { sent: true });
    const [c] = f.calls;
    assert.equal(c.url, 'https://api.cloudflare.com/client/v4/accounts/acc123/email/sending/send');
    assert.equal(c.init.headers.Authorization, 'Bearer cf-token');
    assert.deepEqual(c.body, { from: { address: 'hej@skolappar.com', name: 'Skolappar' }, to: 'tipsare@example.se', subject: 'Hej', text: 'Text' });
    assert.ok(!log.lines.some((l) => l.includes('tipsare@')), 'recipients are never logged');
  });

  test('cloudflare: API errors and bounces are failures', async () => {
    const log = quietLog();
    const err = fakeFetch(403, { success: false, errors: [{ code: 10000, message: 'auth' }] });
    assert.deepEqual(await createMailer(CF, { fetchImpl: err.impl, log }).send(MSG), { sent: false, reason: 'http_403_10000' });
    const bounce = fakeFetch(200, { success: true, result: { delivered: [], permanent_bounces: ['tipsare@example.se'] } });
    assert.deepEqual(await createMailer(CF, { fetchImpl: bounce.impl, log }).send(MSG), { sent: false, reason: 'bounced' });
    assert.ok(!log.lines.some((l) => l.includes('tipsare@')));
  });

  test('brevo: request shape', async () => {
    const f = fakeFetch(201, { messageId: '<x@brevo>' });
    const m = createMailer({ MAIL_PROVIDER: 'brevo', MAIL_API_KEY: 'brevo-key', MAIL_FROM: 'Skolappar <hej@skolappar.com>' }, { fetchImpl: f.impl, log: quietLog() });
    assert.deepEqual(await m.send({ ...MSG, html: '<p>Text</p>' }), { sent: true });
    const [c] = f.calls;
    assert.equal(c.url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(c.init.headers['api-key'], 'brevo-key');
    assert.deepEqual(c.body, {
      sender: { email: 'hej@skolappar.com', name: 'Skolappar' },
      to: [{ email: 'tipsare@example.se' }],
      subject: 'Hej',
      textContent: 'Text',
      htmlContent: '<p>Text</p>',
    });
  });

  test('resend-compatible API stays the default when MAIL_API_URL is set', async () => {
    const f = fakeFetch(200, { id: '1' });
    const m = createMailer({ MAIL_API_URL: 'https://mail.example/emails', MAIL_API_KEY: 'k', MAIL_FROM: 'Skolappar <hej@skolappar.com>' }, { fetchImpl: f.impl, log: quietLog() });
    assert.equal(m.provider, 'resend');
    assert.deepEqual(await m.send(MSG), { sent: true });
    assert.deepEqual(f.calls[0].body, { from: 'Skolappar <hej@skolappar.com>', to: ['tipsare@example.se'], subject: 'Hej', text: 'Text' });
  });
});
