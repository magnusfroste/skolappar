import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createChecker } from '../check.mjs';
import { createSafeFetch, isPublicAddress } from '../safefetch.mjs';
import { startServer, api } from './helpers.mjs';

/** A fetchPage over a map of address -> {status, type, body, redirect}. */
function fakeWeb(pages) {
  return async (url) => {
    let href = String(url);
    for (let i = 0; i < 5 && pages[href]?.redirect; i++) href = pages[href].redirect;
    const page = pages[href];
    if (!page) throw Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
    const body = Buffer.from(page.body ?? '');
    return {
      ok: (page.status ?? 200) < 300, status: page.status ?? 200, url: href,
      headers: { get: (n) => (n.toLowerCase() === 'content-type' ? page.type ?? 'text/html; charset=utf-8' : null) },
      body: (async function* () { yield body; })(),
    };
  };
}

const GOOD = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Klockjakten</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="/icon.png"><link rel="manifest" href="/app.webmanifest">
<link rel="stylesheet" href="/app.css"><script type="module" src="/app.js"></script>
<script src="https://www.skolappar.com/kotten.js" defer></script></head><body><div id="root"></div></body></html>`;

const status = (result, id) => result.checks.find((c) => c.id === id)?.status;

describe('check_app', () => {
  test('an app that follows the guide passes, and says what was not looked at', async () => {
    const check = createChecker({ fetchPage: fakeWeb({
      'https://klocka.example/': { body: GOOD },
      'https://klocka.example/app.css': { type: 'text/css', body: '.board{touch-action:manipulation}' },
      'https://klocka.example/app.js': { type: 'text/javascript', body: 'localStorage.setItem("level", 2)' },
    }) });
    const r = await check('https://klocka.example/');
    assert.equal(r.passed, true, JSON.stringify(r.checks.filter((c) => c.status !== 'ok')));
    assert.equal(r.failed, 0);
    assert.equal(r.warnings, 0);
    assert.equal(r.title, 'Klockjakten');
    assert.ok(r.not_checked.length >= 3);
    assert.ok(r.checks.every((c) => c.guide_section));
  });

  test('what the app uses the internet for is read from its code – for the card, nothing to declare', async () => {
    const web = (js) => createChecker({ fetchPage: fakeWeb({
      'https://saga.example/': { body: GOOD },
      'https://saga.example/app.css': { type: 'text/css', body: '.board{touch-action:manipulation}' },
      'https://saga.example/app.js': { type: 'text/javascript', body: js },
    }) })('https://saga.example/');
    const both = await web('fetch("https://api.shipholm.com/speak",{method:"POST"});fetch("https://api.shipholm.com/ai/saga")');
    assert.deepEqual(both.needs_internet, ['ai', 'read_aloud']);
    assert.equal(status(both, 'needs_internet'), 'ok');
    assert.equal(both.passed, true);
    assert.match(both.checks.find((c) => c.id === 'needs_internet').message, /AI och uppläsning.*inget att fylla i/);
    assert.deepEqual((await web('new Audio("/ljud/hej.mp3")')).needs_internet, []);
    assert.deepEqual((await web('x("https://api.shipholm.com/listen")')).needs_internet, ['listen']);
  });

  test('what breaks the guide is a fail; what could be better is a warning', async () => {
    const bad = `<html><head><title>Vite + React</title>
      <script src="https://www.googletagmanager.com/gtag/js?id=G-1"></script><script src="https://cdn.example.net/lib.js"></script></head>
      <body><input type="password"><a href="https://shop.example.org/buy">Köp</a></body></html>`;
    const r = await createChecker({ fetchPage: fakeWeb({ 'https://bad.example/': { body: bad } }) })('https://bad.example/');
    assert.equal(r.passed, false);
    assert.equal(status(r, 'viewport'), 'fail');
    assert.equal(status(r, 'no_login'), 'fail');
    assert.equal(status(r, 'no_tracking'), 'fail');
    assert.equal(status(r, 'title'), 'warn');
    assert.equal(status(r, 'language'), 'warn');
    assert.equal(status(r, 'own_files'), 'warn');
    assert.equal(status(r, 'no_links_out'), 'warn');
    assert.equal(status(r, 'touch'), 'warn');
    assert.equal(status(r, 'snippet'), 'warn');
  });

  test('not https, not there, not a page, behind a login', async () => {
    const check = createChecker({ fetchPage: fakeWeb({
      'https://pdf.example/': { type: 'application/pdf', body: '%PDF' },
      'https://gone.example/': { status: 404, body: 'no' },
      'https://preview.example/': { redirect: 'https://builder.example/login?next=x' },
      'https://builder.example/login?next=x': { body: GOOD },
    }) });
    assert.equal(status(await check('http://klocka.example/'), 'https'), 'fail');
    assert.equal(status(await check('not a url'), 'address'), 'fail');
    assert.equal(status(await check('https://missing.example/'), 'reachable'), 'fail');
    assert.equal(status(await check('https://pdf.example/'), 'reachable'), 'fail');
    assert.equal(status(await check('https://gone.example/'), 'reachable'), 'fail');
    assert.equal(status(await check('https://preview.example/'), 'no_login'), 'fail');
  });
});

describe('fetching an address someone gave us', () => {
  test('private, loopback and link-local addresses are not public', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0',
      '::1', '::', 'fe80::1', 'fd00::1', '::ffff:10.0.0.1', '::ffff:127.0.0.1', 'not-an-ip']) assert.equal(isPublicAddress(ip), false, ip);
    for (const ip of ['1.1.1.1', '93.184.216.34', '2606:4700:4700::1111', '::ffff:1.1.1.1']) assert.equal(isPublicAddress(ip), true, ip);
  });

  test('the server does not fetch from its own network, by address, by name or after a redirect', async () => {
    let hits = 0;
    const inside = http.createServer((req, res) => { hits++; res.end('secret'); });
    await new Promise((r) => inside.listen(0, '127.0.0.1', r));
    const port = inside.address().port;
    const safe = createSafeFetch();
    try {
      await assert.rejects(safe(`http://127.0.0.1:${port}/`), { code: 'EADDRNOTALLOWED' });
      await assert.rejects(safe(`http://localhost:${port}/`), { code: 'EADDRNOTALLOWED' });
      await assert.rejects(safe(`http://[::1]:${port}/`), { code: 'EADDRNOTALLOWED' });
      await assert.rejects(safe('file:///etc/passwd'), /http/);
      assert.equal(hits, 0);
      // allowed in tests and local development only
      const open = createSafeFetch({ allowPrivate: true });
      const hop = http.createServer((req, res) => { res.writeHead(302, { Location: `http://127.0.0.1:${port}/x` }); res.end(); });
      await new Promise((r) => hop.listen(0, '127.0.0.1', r));
      const res = await open(`http://127.0.0.1:${hop.address().port}/`);
      assert.equal(res.status, 200);
      assert.equal(res.redirected, true);
      res.body.resume();
      hop.close();
      assert.equal(hits, 1);
    } finally {
      inside.close();
    }
  });
});

describe('check_app over MCP', () => {
  test('open for an address with a limit; by id only with a key, and then kept on the app', async () => {
    const KEY = 'k-check';
    const pages = { 'https://klocka.example/': { body: GOOD.replace('viewport', 'x-viewport') } };
    const s = await startServer({ adminKey: KEY, checkLimit: 2, fetchOutside: fakeWeb(pages) });
    let n = 0;
    const call = async (who, name, args) => {
      const r = await who('POST', '/mcp', { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } });
      const result = r.json.result;
      return { ok: !result.isError, text: result.content[0].text };
    };
    const pub = api(s.base);
    const admin = api(s.base, { key: KEY });
    try {
      const first = await call(pub, 'check_app', { url: 'https://klocka.example/' });
      assert.ok(first.ok);
      assert.match(first.text, /"passed":\s*false/);
      assert.match(first.text, /viewport/);

      const sub = await call(pub, 'submit_app', { url: 'https://klocka.example/', title: 'Klockjakten', description: 'Öva klockan med hela och halva timmar.', first_name: 'Anna', email: 'p@example.com', accept_terms: true });
      const id = /"id":\s*"([0-9a-f-]{36})"/.exec(sub.text)[1];
      await new Promise((r) => setTimeout(r, 50));
      const st = await call(pub, 'app_status', { id });
      assert.match(st.text, /"passed":\s*false/, 'submit_app runs the check and app_status shows it');
      assert.equal((await call(pub, 'check_app', { id })).ok, false, 'by id needs a key');

      pages['https://klocka.example/'] = { body: GOOD };
      pages['https://klocka.example/app.css'] = { type: 'text/css', body: '*{touch-action:manipulation}' };
      const again = await call(admin, 'check_app', { id });
      assert.match(again.text, /"passed":\s*true/);
      const queue = await call(admin, 'list_submissions', {});
      assert.match(queue.text, /"check":\s*\{\s*"passed":\s*true/);

      assert.ok((await call(pub, 'check_app', { url: 'https://klocka.example/' })).ok);
      const third = await call(pub, 'check_app', { url: 'https://klocka.example/' });
      assert.equal(third.ok, false);
      assert.match(third.text, /För många kontroller/);
      assert.ok((await call(admin, 'check_app', { url: 'https://klocka.example/' })).ok, 'no limit with a key');
    } finally {
      await s.stop();
    }
  });
});

describe('check_app: where Kotten sits', () => {
  test('the corner an app asks for is read from its HTML', async () => {
    const page = (meta) => GOOD.replace('<link rel="icon"', `${meta}<link rel="icon"`);
    const run = (meta) => createChecker({ fetchPage: fakeWeb({
      'https://k.example/': { body: page(meta) },
      'https://k.example/app.css': { type: 'text/css', body: '.b{touch-action:manipulation}' },
      'https://k.example/app.js': { type: 'text/javascript', body: '' },
    }) })('https://k.example/');
    assert.equal((await run('<meta name="skolappar:kotten" content="Top-Right">')).kotten, 'top-right');
    const none = await run('');
    assert.equal(none.kotten, null);
    assert.match(none.checks.find((c) => c.id === 'kotten').message, /uppe till vänster/);
    const odd = await run('<meta name="skolappar:kotten" content="middle">');
    assert.equal(odd.kotten, null);
    assert.equal(odd.checks.find((c) => c.id === 'kotten').status, 'warn');
  });
});

describe('check_app: browser speech', () => {
  test('speechSynthesis is a warning, recorded lines are fine', async () => {
    const run = (js) => createChecker({ fetchPage: fakeWeb({
      'https://v.example/': { body: GOOD },
      'https://v.example/app.css': { type: 'text/css', body: '.b{touch-action:manipulation}' },
      'https://v.example/app.js': { type: 'text/javascript', body: js },
    }) })('https://v.example/');
    const tts = await run('speechSynthesis.speak(new SpeechSynthesisUtterance("Hej"))');
    assert.equal(tts.checks.find((c) => c.id === 'voice').status, 'warn');
    assert.equal(tts.passed, true);
    assert.equal((await run('new Audio("ljud/hej.mp3").play()')).checks.find((c) => c.id === 'voice').status, 'ok');
  });
});
