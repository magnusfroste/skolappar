// The test parent ("provföräldern"): once a day the whole way a parent's agent goes, from the outside,
// so a broken seam between Shipholm, Studio and Skolappar is seen the same morning instead of when a
// parent gets stuck. Each step is what a real agent does; nothing is left in the catalogue:
//
//   mcp      Shipholm's MCP with one plain POST (no initialize, no session) – the weakest agent
//   publish  upload_site + publish_site of a tiny site, provforaldern.shipholm.dev, a new version a day
//   served   the new version answers from Shipholm's shared server for sites
//   voice    POST api.shipholm.com/speak from the site's own address (one short sentence)
//   ai       the AI for apps without a server answers its pre-flight (no tokens spent)
//   attest   app_attestation – a signed word that the account's address is verified (skipped when the
//            account signs in with GitHub only)
//   submit   Skolappar's own MCP, submit_app with dry_run: categories by word, curriculum, terms,
//            the attestation checked back with Shipholm, check_app on the site – nothing is stored
//   studio   Shipholm Studio answers
//
// The result is kept (setting journey_last, admin tool journey). A failing day is mailed to
// report_email once a day, and a mail says when it works again.
import { gzipSync } from 'node:zlib';

export const JOURNEY_APP = 'provforaldern';
const STUDIO_URL = 'https://studio.shipholm.com/';
const SPEAK_URL = 'https://api.shipholm.com/speak';
const AI_URL = (app) => `https://api.shipholm.com/ai/${app}`;

/** A .tar.gz of a few small files: [{name, data}] – enough for upload_site, no dependency. */
export function tarGz(files) {
  const blocks = [];
  for (const { name, data } of files) {
    const body = Buffer.from(data);
    const h = Buffer.alloc(512);
    h.write(name, 0, 100, 'utf8');
    h.write('0000644\0', 100); h.write('0000000\0', 108); h.write('0000000\0', 116);
    h.write(`${body.length.toString(8).padStart(11, '0')}\0`, 124);
    h.write(`${Math.floor(Date.now() / 1000).toString(8).padStart(11, '0')}\0`, 136);
    h.write('        ', 148); h.write('0', 156); h.write('ustar\0', 257); h.write('00', 263);
    let sum = 0;
    for (const b of h) sum += b;
    h.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148);
    blocks.push(h, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

function page(stamp) {
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Provföräldern</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="data:,"><style>body{font-family:system-ui;touch-action:manipulation}</style></head>
<body><h1>Provföräldern</h1><p>Skolappars dagliga prov av vägen en förälders agent går. Version ${stamp}.</p></body></html>`;
}

export function createJourney({ shipholm, store, mailer, siteUrl, fetchImpl = globalThis.fetch, now = () => new Date(), log = console, wait = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  async function step(steps, id, fn) {
    const t0 = Date.now();
    try {
      const detail = await fn();
      steps.push({ id, ok: detail !== 'skipped', skipped: detail === 'skipped', ms: Date.now() - t0, ...(detail && detail !== 'skipped' ? { detail } : {}) });
      return true;
    } catch (err) {
      steps.push({ id, ok: false, ms: Date.now() - t0, error: String(err?.message || err).slice(0, 300) });
      return false;
    }
  }

  async function run() {
    const stamp = now().toISOString();
    const steps = [];
    const app = JOURNEY_APP;
    const host = `https://${app}.shipholm.dev`;
    const sh = shipholm?.configured ? shipholm : null;
    if (!sh) {
      steps.push({ id: 'mcp', ok: false, error: 'SHIPHOLM_API_KEY saknas' });
    } else {
      await step(steps, 'mcp', async () => {
        const r = await sh.callDirect('list_skills', {});
        if (!JSON.stringify(r).includes('shipholm')) throw new Error('list_skills svarade utan skills');
        return 'ett anrop utan session fungerar';
      });
      const published = await step(steps, 'publish', async () => {
        const up = await sh.callDirect('upload_site', { app });
        const put = await fetchImpl(up.upload_url, { method: 'PUT', body: tarGz([{ name: 'index.html', data: page(stamp) }]), signal: AbortSignal.timeout(60_000) });
        if (!put.ok) throw new Error(`uppladdningen svarade HTTP ${put.status}`);
        const out = await sh.callDirect('publish_site', { app, upload_id: up.upload_id });
        return `publicerad (${out.served || 'pod'})`;
      });
      if (published) {
        await step(steps, 'served', async () => {
          for (let i = 0; i < 18; i++) {
            const r = await fetchImpl(`${host}/?v=${Date.now()}`, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
            const body = r?.ok ? await r.text() : '';
            if (body.includes(stamp)) {
              if (!/shipholm/i.test(r.headers.get('server') || '')) throw new Error('nya versionen visas, men inte från den delade servern');
              return 'nya versionen från den delade servern';
            }
            await wait(10_000);
          }
          throw new Error('nya versionen syntes inte inom tre minuter');
        });
      }
      await step(steps, 'voice', async () => {
        const r = await fetchImpl(SPEAK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: host }, body: JSON.stringify({ text: 'Hej!' }), signal: AbortSignal.timeout(60_000) });
        if (!r.ok || !/audio\/mpeg/.test(r.headers.get('content-type') || '')) throw new Error(`uppläsningen svarade HTTP ${r.status}`);
        return 'uppläsning från appens adress';
      });
      await step(steps, 'ai', async () => {
        const r = await fetchImpl(AI_URL(app), { method: 'OPTIONS', headers: { Origin: host, 'Access-Control-Request-Method': 'POST' }, signal: AbortSignal.timeout(20_000) });
        if (r.status !== 204) throw new Error(`AI:ns förfrågan svarade HTTP ${r.status}`);
        return 'AI för appen svarar';
      });
      let attestation = null;
      let email = 'provforaldern@skolappar.com';
      await step(steps, 'attest', async () => {
        try {
          attestation = (await sh.callDirect('app_attestation', { app })).attestation;
        } catch (err) {
          if (/no verified e-mail/.test(err.message)) return 'skipped';
          throw err;
        }
        const v = await sh.verifyAttestation(attestation);
        if (!v.valid) throw new Error('Shipholm godtog inte sitt eget intyg');
        email = v.email || email;
        return 'intyget godtas';
      });
      await step(steps, 'submit', async () => {
        const r = await fetchImpl(`${siteUrl}/mcp`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'User-Agent': 'skolappar-provforaldern/1.0' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'submit_app', arguments: {
            url: `${host}/`, title: 'Provföräldern', description: 'Skolappars dagliga prov av vägen en förälders agent går.',
            first_name: 'Prov', email, accept_terms: true, subject: 'matte', age: 'fk-2', app_type: 'spel', curriculum_ids: ['MA.1-3.3.3'],
            ...(attestation ? { shipholm_attestation: attestation } : {}), dry_run: true,
          } } }),
          signal: AbortSignal.timeout(90_000),
        });
        const raw = await r.text();
        const data = raw.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5)).pop() || raw;
        const result = JSON.parse(data).result || {};
        const text = (result.content || []).map((c) => c.text).join('');
        if (result.isError) throw new Error(text);
        const out = JSON.parse(text);
        const problems = [
          out.categories?.length !== 3 && 'kategorierna med ord',
          out.unknown_curriculum_ids?.length && 'läroplanens id',
          attestation && out.attestation !== 'ok' && `intyget (${out.attestation})`,
          !out.check?.passed && `kontrollen: ${(out.check?.failed || []).join(' ')}`,
        ].filter(Boolean);
        if (problems.length) throw new Error(`inskicket (dry_run) brister: ${problems.join(', ')}`);
        return 'inskick prövat utan att något sparas';
      });
    }
    await step(steps, 'studio', async () => {
      const r = await fetchImpl(STUDIO_URL, { signal: AbortSignal.timeout(20_000) });
      if (!r.ok) throw new Error(`Studio svarade HTTP ${r.status}`);
      return 'Studio svarar';
    });
    const result = { at: stamp, ok: steps.every((s) => s.ok || s.skipped), steps };
    await report(result);
    store.setSetting('journey_last', result);
    return result;
  }

  async function report(result) {
    const to = store.getSetting('report_email');
    const before = store.getSetting('journey_last');
    const day = result.at.slice(0, 10);
    const failing = !result.ok;
    const mailed = store.getSetting('journey_mailed');
    let subject = null;
    if (failing && mailed !== day) subject = `Provföräldern: ${result.steps.filter((s) => !s.ok && !s.skipped).map((s) => s.id).join(', ')} fungerar inte`;
    else if (!failing && before && !before.ok && mailed) subject = 'Provföräldern: hela vägen fungerar igen';
    if (!subject) return;
    const text = `${subject}.\n\n${result.steps.map((s) => `${s.ok ? 'OK ' : s.skipped ? '–  ' : 'FEL'} ${s.id}: ${s.error || s.detail || (s.skipped ? 'hoppades över' : '')}`).join('\n')}\n\n` +
      `Kör om: journey med run: true på ${siteUrl}/mcp (admin).\n\n– Skolappar`;
    store.setSetting('journey_mailed', failing ? day : null);
    if (!mailer || typeof to !== 'string' || !to.includes('@')) return;
    try { await mailer.send({ to, subject, text }); } catch (err) { log.warn?.(`journey mail failed: ${err?.message || err}`); }
  }

  /** Once a day, from 05 UTC. */
  async function maybeRun() {
    const n = now();
    const last = store.getSetting('journey_last');
    if (n.getUTCHours() < 5 || (last && last.at?.slice(0, 10) === n.toISOString().slice(0, 10))) return null;
    return run();
  }

  return { run, maybeRun, last: () => store.getSetting('journey_last') };
}
