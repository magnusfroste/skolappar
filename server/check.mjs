// check_app: what can be seen of an app from its address without opening a browser – the page,
// its head and the scripts and styles it loads from its own address. Each finding points to a
// section of the build guide (server/guide.mjs). It does not play the app: touch, pedagogy and
// language are for the reviewer, and the answer says so.
import { readUpTo } from './safefetch.mjs';

const MAX_HTML = 2 * 1024 * 1024;
const MAX_ASSET = 3 * 1024 * 1024;
const MAX_ASSETS = 12;
const HEAVY = 3 * 1024 * 1024;

// Advertising and visitor tracking: not in an app for children.
const TRACKERS = [
  'googletagmanager.com', 'google-analytics.com', 'googlesyndication.com', 'doubleclick.net', 'googleadservices.com',
  'connect.facebook.net', 'facebook.com/tr', 'hotjar.com', 'clarity.ms', 'segment.com', 'segment.io', 'mixpanel.com',
  'amplitude.com', 'fullstory.com', 'plausible.io', 'posthog.com', 'adsbygoogle', 'analytics.tiktok.com', 'snap.licdn.com',
  'matomo.cloud', 'umami.is', 'logrocket.com', 'hs-scripts.com',
];
// What needs the internet while the app is used – read from the app's own code, so the catalogue can
// say it on the card without anyone declaring it (guide section natet). Shipholm's own services first.
export const NEEDS_INTERNET = {
  ai: { label: 'AI', patterns: ['api.shipholm.com/ai/', 'api.openai.com', 'generativelanguage.googleapis.com', 'api.anthropic.com', 'api.mistral.ai', 'api.groq.com', 'openrouter.ai/api'] },
  read_aloud: { label: 'uppläsning', patterns: ['api.shipholm.com/speak', 'api.elevenlabs.io', 'texttospeech.googleapis.com'] },
  listen: { label: 'taligenkänning', patterns: ['api.shipholm.com/listen'] },
};

/** "AI och uppläsning" for ['ai', 'read_aloud']. */
export function needsPhrase(needs) {
  const words = needs.map((n) => NEEDS_INTERNET[n]?.label).filter(Boolean);
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} och ${words.at(-1)}`;
}

export const KOTTEN_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

const GENERIC_TITLES = /^(vite( \+ \w+)*( \+ ts)?|react app|lovable( app| generated project)?|document|untitled|my app|new project|bolt|v0 app|home|index|app)$/i;
const LOGIN_PATH = /\/(login|signin|sign-in|auth|oauth|sso|accounts?)(\/|\?|$)/i;

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
};
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export function createChecker({ fetchPage, now = () => Date.now() }) {
  const get = (url, timeoutMs) => fetchPage(url, {
    timeoutMs, headers: { 'User-Agent': 'skolappar-check/1.0 (+https://www.skolappar.org/bygg)', Accept: 'text/html,*/*;q=0.8', 'Accept-Language': 'sv' },
  });

  /** Check one address. Never throws for what the address does; the findings say it. */
  return async function checkApp(input) {
    const checks = [];
    const add = (id, status, message, section) => checks.push({ id, status, message, guide_section: section });
    const done = (extra = {}) => {
      const failed = checks.filter((c) => c.status === 'fail').length;
      const warnings = checks.filter((c) => c.status === 'warn').length;
      return {
        url: input, ...extra, passed: failed === 0, failed, warnings, checks,
        not_checked: [
          'Att appen går att spela med bara fingret på en iPad, liggande och stående (avsnitt touch och enheter).',
          'Återkoppling, svårighet och omgångar (avsnitt pedagogik).',
          'Språket och att innehållet passar åldern (avsnitt sprak).',
          'Kontrast, textstorlek och att appen fungerar utan ljud (avsnitt tillganglighet).',
        ],
        guide: 'https://www.skolappar.org/bygg',
        checked_at: new Date(now()).toISOString(),
      };
    };

    let start;
    try { start = new URL(input); } catch { add('address', 'fail', 'Adressen går inte att läsa som en webbadress.', 'teknik'); return done(); }
    if (start.protocol !== 'https:') { add('https', 'fail', 'Adressen måste börja med https://.', 'teknik'); return done(); }

    const t0 = now();
    let res; let html;
    try {
      res = await get(start.href, 15_000);
      ({ buf: html } = await readUpTo(res, MAX_HTML));
      html = html.toString('utf8');
    } catch (err) {
      const why = err.code === 'EADDRNOTALLOWED' ? 'adressen är inte en publik webbadress'
        : err.message === 'timeout' ? 'den svarade inte inom 15 sekunder'
          : `den gick inte att nå (${err.code || err.message})`;
      add('reachable', 'fail', `Appen kunde inte öppnas: ${why}.`, 'teknik');
      return done();
    }
    const ms = now() - t0;
    const final = new URL(res.url);
    const type = res.headers.get('content-type') || '';

    if (final.protocol !== 'https:') add('https', 'fail', `Adressen leder vidare till en sida utan https (${final.host}).`, 'teknik');
    else add('https', 'ok', 'Appen har en https-adress.', 'teknik');

    if (!res.ok) { add('reachable', 'fail', `Adressen svarade med HTTP ${res.status}.`, 'teknik'); return done({ final_url: final.href }); }
    if (!/html/i.test(type)) { add('reachable', 'fail', `Adressen svarade inte med en webbsida (${type || 'okänd typ'}).`, 'teknik'); return done({ final_url: final.href }); }
    add('reachable', 'ok', 'Appen öppnas direkt på sin adress.', 'teknik');

    const moved = final.host !== start.host;
    if (moved && LOGIN_PATH.test(final.pathname + final.search)) {
      add('no_login', 'fail', `Adressen leder till en inloggning hos ${final.host}. Lägg ut appen på en adress som öppnas utan konto.`, 'barnet');
    } else if (tags(html, 'input').some((t) => (attr(t, 'type') || '').toLowerCase() === 'password')) {
      add('no_login', 'fail', 'Sidan har ett lösenordsfält. En skolapp ska starta utan inloggning.', 'barnet');
    } else {
      add('no_login', 'ok', 'Ingen inloggning syns på första sidan.', 'barnet');
    }

    add('speed', ms > 3000 ? 'warn' : 'ok',
      ms > 3000 ? `Sidan tog ${(ms / 1000).toFixed(1)} s att svara. Första skärmen bör komma inom ett par sekunder.` : `Sidan svarade på ${ms} ms.`, 'teknik');

    const title = decode((/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] || '').trim());
    if (!title) add('title', 'fail', 'Sidan saknar <title>. Sätt appens namn där.', 'teknik');
    else if (GENERIC_TITLES.test(title)) add('title', 'warn', `Sidans titel är "${title}", byggverktygets standard. Sätt appens namn.`, 'teknik');
    else add('title', 'ok', `Titel: "${title}".`, 'teknik');

    const lang = (attr(tags(html, 'html')[0] || '', 'lang') || '').toLowerCase();
    if (lang.startsWith('sv')) add('language', 'ok', 'Sidan är märkt som svenska (lang="sv").', 'sprak');
    else add('language', 'warn', lang ? `Sidan är märkt med lang="${lang}". Sätt <html lang="sv"> om appen är på svenska.` : 'Sidan saknar lang. Sätt <html lang="sv">.', 'sprak');

    const metas = tags(html, 'meta');
    const viewport = metas.map((m) => ((attr(m, 'name') || '').toLowerCase() === 'viewport' ? attr(m, 'content') || '' : null)).find((v) => v !== null);
    if (viewport === undefined) add('viewport', 'fail', 'Sidan saknar <meta name="viewport">. Utan den visas appen förminskad på platta och mobil.', 'teknik');
    else if (!/width\s*=\s*device-width/i.test(viewport)) add('viewport', 'warn', `Viewport är "${viewport}". Använd width=device-width, initial-scale=1, viewport-fit=cover.`, 'teknik');
    else add('viewport', 'ok', 'Viewport är satt för platta och mobil.', 'teknik');

    const links = tags(html, 'link').map((l) => ({ rel: (attr(l, 'rel') || '').toLowerCase(), href: attr(l, 'href') }));
    if (links.some((l) => /\bicon\b/.test(l.rel) && l.href)) add('icon', 'ok', 'Sidan har en ikon.', 'teknik');
    else add('icon', 'warn', 'Sidan saknar ikon (<link rel="icon">).', 'teknik');
    if (links.some((l) => l.rel === 'manifest')) add('manifest', 'ok', 'Sidan har ett webbmanifest och går att lägga på hemskärmen.', 'teknik');
    else add('manifest', 'warn', 'Inget webbmanifest. Med ett går appen att lägga på hemskärmen.', 'teknik');

    // what the page loads: its own files are read (weight, content), others are named
    const resolve = (href) => { try { return new URL(decode(href), final); } catch { return null; } };
    const scripts = tags(html, 'script').map((s) => attr(s, 'src')).filter(Boolean).map(resolve).filter(Boolean);
    const styles = links.filter((l) => /\bstylesheet\b/.test(l.rel) && l.href).map((l) => resolve(l.href)).filter(Boolean);
    const own = [...scripts, ...styles].filter((u) => u.host === final.host);
    const isSkolappar = (u) => /(^|\.)skolappar\.(com|org)$/.test(u.host);
    const foreignScripts = [...new Set(scripts.filter((u) => u.host !== final.host && !isSkolappar(u)).map((u) => u.host))];
    const snippet = scripts.some((u) => isSkolappar(u) && u.pathname === '/kotten.js');

    let weight = Buffer.byteLength(html);
    let text = html;
    let partial = own.length > MAX_ASSETS;
    await Promise.all(own.slice(0, MAX_ASSETS).map(async (u) => {
      try {
        const r = await get(u.href, 10_000);
        const { buf, truncated } = await readUpTo(r, MAX_ASSET);
        weight += buf.length;
        if (truncated) partial = true;
        text += `\n${buf.toString('utf8')}`;
      } catch { partial = true; }
    }));

    const found = [...new Set(TRACKERS.filter((t) => text.includes(t)))];
    if (found.length) add('no_tracking', 'fail', `Appen laddar reklam eller spårning: ${found.join(', ')}. Ta bort det; ingenting om barnet ska lämna enheten.`, 'barnet');
    else add('no_tracking', 'ok', 'Ingen känd reklam eller spårning hittades.', 'barnet');

    if (foreignScripts.length) add('own_files', 'warn', `Skript hämtas från andra webbplatser: ${foreignScripts.join(', ')}. Lägg dem i appen, så fungerar den även när de inte svarar.`, 'teknik');
    else add('own_files', 'ok', 'Alla skript ligger på appens egen adress.', 'teknik');

    if (snippet) add('snippet', 'ok', 'Kodsnutten kotten.js är med: skaparen får se hur appen används.', 'kodsnutten');
    else add('snippet', 'warn', 'Kodsnutten kotten.js saknas. Med den ser skaparen hur långt barnen kommer och var de slutar – anonymt.', 'kodsnutten');

    const out = [...new Set(tags(html, 'a').map((a) => attr(a, 'href')).filter((h) => h && /^https?:/i.test(h)).map(resolve)
      .filter((u) => u && u.host !== final.host && !/(^|\.)skolappar\.(com|org)$/.test(u.host)).map((u) => u.host))];
    if (out.length) add('no_links_out', 'warn', `Första sidan länkar ut till: ${out.slice(0, 5).join(', ')}. En skolapp ska inte leda barnet ut ur appen.`, 'barnet');
    else add('no_links_out', 'ok', 'Inga länkar ut ur appen på första sidan.', 'barnet');

    if (/touch-action/.test(text)) add('touch', 'ok', 'touch-action används, så dubbeltryck zoomar inte.', 'touch');
    else add('touch', 'warn', 'Hittade ingen touch-action. Sätt touch-action: manipulation på spelytan så att dubbeltryck inte zoomar.', 'touch');

    // where Kotten (Skolappar's floating home button) sits while the app is played on skolappar.org
    const corner = metas.map((m) => ((attr(m, 'name') || '').toLowerCase() === 'skolappar:kotten' ? (attr(m, 'content') || '').trim().toLowerCase() : null)).find((v) => v !== null);
    const kotten = KOTTEN_CORNERS.includes(corner) ? corner : null;
    if (corner !== undefined && !kotten) add('kotten', 'warn', `skolappar:kotten är "${corner}". Välj top-left, top-right, bottom-left eller bottom-right.`, 'touch');
    else add('kotten', 'ok', kotten ? `Kotten, Skolappars hemknapp, sitter i hörnet ${kotten} när appen spelas på skolappar.org.`
      : 'Kotten, Skolappars hemknapp, sitter uppe till vänster när appen spelas på skolappar.org. Ligger något viktigt där: välj ett annat hörn med <meta name="skolappar:kotten" content="top-right">.', 'touch');

    const needs = Object.keys(NEEDS_INTERNET).filter((k) => NEEDS_INTERNET[k].patterns.some((p) => text.includes(p)));
    if (needs.length) {
      add('needs_internet', 'ok', `Appen använder ${needsPhrase(needs)} över nätet. Katalogen visar det på kortet ("Använder internet för ${needsPhrase(needs)}") – inget att fylla i. ` +
        'Visa ett vänligt besked om tjänsten inte svarar.', 'natet');
    } else {
      add('needs_internet', 'ok', 'Appen verkar inte behöva internet medan den används.', 'natet');
    }

    if (/speechSynthesis|SpeechSynthesisUtterance/.test(text)) {
      add('voice', 'warn', 'Appen använder webbläsarens talsyntes (speechSynthesis). Ersätt den helt med inspelade repliker – Shipholms speak med rösten omni – inte ens som reserv: annars låter appen dubbelt eller byter röst.', 'resurser');
    } else {
      add('voice', 'ok', 'Ingen webbläsartalsyntes.', 'resurser');
    }

    const mb = (weight / 1024 / 1024).toFixed(1);
    add('weight', weight > HEAVY ? 'warn' : 'ok',
      `Sidan, dess skript och stilmallar väger ${partial ? 'minst ' : ''}${mb} MB${weight > HEAVY ? '. Det är tungt för en platta på skolans nät; komprimera och ladda bara det som behövs' : ''}.`, 'teknik');

    return done({ final_url: final.href, title: title || null, needs_internet: needs, kotten });
  };
}
