#!/usr/bin/env node
/**
 * Hälsokoll av alla publicerade appar på skolappar.com.
 *
 * Läser listan över godkända appar via Supabase REST (publik anon-nyckel)
 * och gör en HTTP-förfrågan mot varje app-URL. Skriver en tabell till stdout,
 * en Markdown-rapport till app-health-report.md och avslutar med exit-kod 1
 * om någon app inte svarar.
 *
 * Körs lokalt:   node scripts/check-apps.mjs
 * Körs i CI:     .github/workflows/app-health.yml (varje måndag)
 *
 * Miljövariabler (valfria, annars läses .env i repo-roten):
 *   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, HEALTH_REPORT
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    /* .env saknas – lita på process.env */
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Saknar VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(2);
}

const TIMEOUT_MS = 20_000;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 skolappar-healthcheck';

async function fetchApps() {
  const url = `${SUPABASE_URL}/rest/v1/apps?select=id,title,url,status,image_url&status=in.(approved,featured)&order=title.asc`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) throw new Error(`Kunde inte hämta appar: ${res.status} ${await res.text()}`);
  return res.json();
}

async function probe(url) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    });
    const html = res.ok ? await res.text() : '';
    const pageTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
    return { ok: res.ok, status: res.status, ms: Date.now() - started, finalUrl: res.url, pageTitle };
  } catch (err) {
    const reason = err?.cause?.code ?? err?.name ?? String(err);
    return { ok: false, status: 0, ms: Date.now() - started, finalUrl: url, pageTitle: '', error: reason };
  } finally {
    clearTimeout(timer);
  }
}

const apps = await fetchApps();
const results = [];
for (const app of apps) {
  results.push({ ...app, ...(await probe(app.url)) });
}

const failed = results.filter((r) => !r.ok);
const generic = results.filter((r) => r.ok && /^lovable app$/i.test(r.pageTitle));
const missingImage = results.filter((r) => !r.image_url);

const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
console.log(pad('STATUS', 12) + pad('MS', 7) + pad('APP', 26) + 'URL');
for (const r of results) {
  const status = r.ok ? r.status : r.error ? `ERR ${r.error}` : `HTTP ${r.status}`;
  console.log(pad(status, 12) + pad(r.ms, 7) + pad(r.title, 26) + r.url);
}
console.log('');
console.log(
  `${results.length} appar kontrollerade: ${failed.length} svarar inte, ` +
    `${generic.length} har generisk titel "Lovable App", ${missingImage.length} saknar bild.`
);

// Markdown-rapport (GitHub Action skapar/uppdaterar ett issue av den)
const lines = [`Kontrollerade ${results.length} appar ${new Date().toISOString().slice(0, 10)}.`, ''];
if (failed.length) {
  lines.push('## ❌ Svarar inte', '');
  for (const r of failed) lines.push(`- **${r.title}** – ${r.url} (${r.error ?? `HTTP ${r.status}`})`);
  lines.push('');
}
if (generic.length) {
  lines.push('## ⚠️ Generisk sidtitel "Lovable App"', '');
  for (const r of generic) lines.push(`- **${r.title}** – ${r.url}`);
  lines.push('');
}
if (missingImage.length) {
  lines.push('## 🖼️ Saknar bild', '');
  for (const r of missingImage) lines.push(`- **${r.title}** – ${r.url}`);
  lines.push('');
}
if (!failed.length && !generic.length && !missingImage.length) lines.push('✅ Alla appar svarar och ser bra ut.');
writeFileSync(env.HEALTH_REPORT ?? resolve(root, 'app-health-report.md'), lines.join('\n'));

process.exit(failed.length ? 1 : 0);
