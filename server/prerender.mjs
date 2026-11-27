// What the server puts into index.html for each address, so search engines, AI crawlers and
// link previews see the page without running JavaScript: its own title, description, canonical
// address, image and structured data, and its text (heading, article, list of apps) inside #root.
// React replaces the text when it starts. An address that is no page answers 404.
import { escapeHtml } from './http.mjs';
import { markdownToHtml, markdownText } from './markdown.mjs';
import { guideMarkdown, GUIDE_TITLE } from './guide.mjs';
import { landing } from './landing.mjs';
import { TERMS } from './mailings.mjs';

const CATEGORY_SLUGS = { platforms: 'plattformar', tips: 'tips', learn: 'lara', inspiration: 'inspiration' };
const CATEGORY_TITLES = {
  platforms: 'Populära vibe-plattformar', tips: 'Tips & tricks', learn: 'Lär dig vibe-coda', inspiration: 'Inspiration',
};
const SLUG_CATEGORIES = Object.fromEntries(Object.entries(CATEGORY_SLUGS).map(([k, v]) => [v, k]));

/** The address of an article, with the Swedish category slug the site uses. */
export const resourcePath = (r) => `/resurser/${CATEGORY_SLUGS[r.category] || r.category}/${r.slug}`;

const SITE = 'Skolappar';
const fullTitle = (t) => (t ? `${t} | ${SITE}` : `${SITE} – pedagogiska appar av föräldrar för barn`);
const abs = (siteUrl, u) => (!u ? '' : u.startsWith('/') ? siteUrl + u : u);
const esc = escapeHtml;

function appList(apps, siteUrl, limit = 60) {
  return `<ul>${apps.slice(0, limit).map((a) => `<li><a href="${esc(`/app/${a.id}`)}">${esc(a.title)}</a> – ${esc(a.description || '')}</li>`).join('')}</ul>`;
}

const STATIC = {
  '/apps': { title: 'Alla appar', description: 'Pedagogiska appar för barn, byggda av föräldrar – sortera på ämne, årskurs och Lgr22. Gratis, utan inloggning och utan reklam.' },
  '/tipsa': { title: 'Tipsa om en app', description: 'Har ni byggt en pedagogisk app? Tipsa Skolappar på en minut – en länk räcker.' },
  '/ideer': { title: 'Idéer till appar', description: 'Idéer till pedagogiska appar från föräldrar, lärare och barn – rösta fram nästa app eller bygg den själv.' },
  '/resurser': { title: 'Resurser', description: 'Guider för att bygga pedagogiska appar med AI: kom igång, tips, verktyg och inspiration.' },
  '/startmall': { title: 'Startmallen', description: 'En färdig liten skolapp där det svåra redan är löst: touch, återkoppling, ljud, uppläsning och belöning. Fri att använda.' },
  '/testa-din-app': { title: 'Testa din app', description: 'Kontrollera din app mot Skolappars byggguide innan du skickar in den.' },
  '/villkor': { title: 'Villkor', description: 'Villkoren för dig som skickar in en app till Skolappar: vad du lovar om appen, granskningen, mejlen vi skickar och dina uppgifter.' },
  '/rapportera': { title: 'Rapportera en app', description: 'Har du hittat en app med olämpligt innehåll, fel ämne eller ålder, eller som inte fungerar? Berätta för oss.' },
  '/integritet': { title: 'Integritet', description: 'Hur Skolappar hanterar uppgifter: inga konton, inga cookies för spårning, ingen reklam.' },
};
const NOINDEX = /^\/(admin|min-sida|auth|reset-password|profil|ideer\/ny)(\/|$)/;

/**
 * The page at this path: {status, title, description, canonical, image, jsonLd[], body, noindex}.
 * status 404 when nothing lives there (the browser still gets the app, which shows "finns inte").
 */
export function pageFor(path, { store, siteUrl }) {
  const p = path.replace(/\/+$/, '') || '/';
  const canonical = (x) => siteUrl + (x === '/' ? '/' : x);

  if (p === '/') {
    const apps = store.listPublicApps({ sort: 'recommended' });
    return {
      status: 200, canonical: canonical('/'), title: fullTitle(),
      description: 'Bygg en app med ditt barn – och dela den med alla barn. Med en AI-agent som hjälpreda. Gratis pedagogiska appar efter svensk läroplan, utan inloggning och utan reklam.',
      body: `<h1>Bygg en app med ditt barn – och dela den med alla barn</h1><p>Barnet har idén, ni bygger den med en AI-agent som hjälpreda. Sen hamnar den här, gratis för alla barn att spela. Efter svensk läroplan.</p>` +
        `<h2>Appar</h2>${appList(apps, siteUrl, 30)}<p><a href="/apps">Alla appar</a> · <a href="/bygg">Så bygger du</a> · <a href="/resurser">Resurser</a></p>`,
    };
  }

  const app = /^\/app\/([^/]+)$/.exec(p);
  if (app) {
    const a = store.getApp(app[1]);
    if (!a) return { status: 404, noindex: true };
    const subject = a.categories.find((c) => c.type === 'subject');
    const age = a.categories.find((c) => c.type === 'age');
    const desc = (a.description || a.long_description || '').slice(0, 300);
    const lgr = (a.curriculum || []).map((c) => `<li>${esc(`${c.subject_name} ${c.stage}: ${c.area}`)} – ${esc(c.text)}</li>`).join('');
    return {
      status: 200, canonical: canonical(`/app/${a.id}`), title: fullTitle(a.title), description: desc,
      image: abs(siteUrl, a.image_url),
      jsonLd: [{
        '@context': 'https://schema.org', '@type': 'LearningResource', name: a.title, description: desc,
        url: canonical(`/app/${a.id}`), inLanguage: 'sv-SE', isAccessibleForFree: true,
        learningResourceType: a.categories.find((c) => c.type === 'app_type')?.name,
        ...(subject ? { about: subject.name } : {}),
        ...(age ? { educationalLevel: age.name } : {}),
        ...(a.image_url ? { image: abs(siteUrl, a.image_url) } : {}),
        ...(a.creator_name ? { author: { '@type': 'Person', name: a.creator_name } } : {}),
        ...(a.curriculum?.length ? { educationalAlignment: a.curriculum.map((c) => ({
          '@type': 'AlignmentObject', alignmentType: 'teaches', educationalFramework: 'Lgr22', targetName: `${c.subject_name} ${c.stage}: ${c.area}`, targetDescription: c.text,
        })) } : {}),
      }],
      body: `<h1>${esc(a.title)}</h1><p>${esc(a.description || '')}</p>` +
        (a.long_description ? markdownToHtml(a.long_description, { headingOffset: 1 }) : '') +
        `<p>${[subject && `Ämne: ${esc(subject.name)}`, age && `Årskurs: ${esc(age.name)}`, a.creator_name && `Av ${esc(a.creator_name)}`].filter(Boolean).join(' · ')}</p>` +
        (lgr ? `<h2>Lgr22</h2><ul>${lgr}</ul>` : '') + `<p><a href="${esc(a.url)}" rel="noopener">Spela ${esc(a.title)}</a></p>`,
    };
  }

  const land = /^\/appar\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/.exec(p);
  if (land) {
    const l = landing(store, land[1], land[2] || null);
    if (!l) return { status: 404, noindex: true };
    return {
      status: 200, canonical: canonical(l.path), title: fullTitle(l.title), description: l.description,
      jsonLd: [{
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: l.title, description: l.description, url: canonical(l.path),
        inLanguage: 'sv-SE',
        mainEntity: { '@type': 'ItemList', itemListElement: l.apps.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: canonical(`/app/${a.id}`), name: a.title })) },
      }],
      body: `<h1>${esc(l.title)}</h1><p>${esc(l.intro)}</p>${appList(l.apps, siteUrl)}` +
        (l.curriculum.length ? `<h2>Det här tränar apparna i Lgr22</h2><ul>${l.curriculum.map((c) => `<li>${esc(c.name)}</li>`).join('')}</ul>` : '') +
        `<p>${[...l.related, ...l.other_subjects].map((r) => `<a href="${esc(r.path)}">${esc(r.title)}</a>`).join(' · ')}</p>`,
    };
  }

  const article = /^\/resurser\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(p);
  if (article) {
    const r = store.getResourceBySlug(article[2]);
    if (!r) {
      // a hidden or renamed article: where it went (setting resource_redirects, {slug: path})
      const moved = store.getSetting('resource_redirects')?.[article[2]];
      return typeof moved === 'string' && moved.startsWith('/')
        ? { status: 301, location: moved }
        : { status: 404, noindex: true };
    }
    if (resourcePath(r) !== p) return { status: 301, location: resourcePath(r) };   // /resurser/learn/x -> /resurser/lara/x
    const desc = r.excerpt || markdownText(r.content, 200);
    return {
      status: 200, canonical: canonical(resourcePath(r)), title: fullTitle(r.title), description: desc,
      jsonLd: [{
        '@context': 'https://schema.org', '@type': 'Article', headline: r.title, description: desc, inLanguage: 'sv-SE',
        datePublished: r.created_at, dateModified: r.updated_at, url: canonical(resourcePath(r)),
        author: { '@type': 'Organization', name: SITE }, publisher: { '@type': 'Organization', name: SITE },
      }],
      body: `<article><h1>${esc(r.title)}</h1>${markdownToHtml(String(r.content || '').replace(/^#\s+.*\n/, ''), { headingOffset: 1 })}</article>`,
    };
  }

  const category = /^\/resurser\/([a-z0-9-]+)$/.exec(p);
  if (category) {
    const cat = SLUG_CATEGORIES[category[1]] || (CATEGORY_SLUGS[category[1]] ? category[1] : null);
    if (!cat) return { status: 404, noindex: true };
    const list = store.listResources({ category: cat, withContent: false });
    return {
      status: 200, canonical: canonical(`/resurser/${CATEGORY_SLUGS[cat]}`), title: fullTitle(CATEGORY_TITLES[cat]),
      description: `${CATEGORY_TITLES[cat]} – ${list.length} guider om att bygga pedagogiska appar med AI.`,
      body: `<h1>${esc(CATEGORY_TITLES[cat])}</h1><ul>${list.map((r) => `<li><a href="${esc(resourcePath(r))}">${esc(r.title)}</a>${r.excerpt ? ` – ${esc(r.excerpt)}` : ''}</li>`).join('')}</ul>`,
    };
  }

  if (p === '/bygg') {
    const md = guideMarkdown();
    return {
      status: 200, canonical: canonical('/bygg'), title: fullTitle(GUIDE_TITLE),
      description: 'Guiden för dig som bygger en pedagogisk app, själv eller med en AI-agent: iPad och touch, tryggt för barn, pedagogik, läroplanen och en checklista.',
      body: markdownToHtml(md),
    };
  }

  if (p === '/resurser') {
    const list = store.listResources({ withContent: false });
    return {
      status: 200, canonical: canonical('/resurser'), title: fullTitle(STATIC['/resurser'].title), description: STATIC['/resurser'].description,
      body: `<h1>Resurser</h1><ul>${list.map((r) => `<li><a href="${esc(resourcePath(r))}">${esc(r.title)}</a>${r.excerpt ? ` – ${esc(r.excerpt)}` : ''}</li>`).join('')}</ul>`,
    };
  }

  if (p === '/apps') {
    const apps = store.listPublicApps({ sort: 'recommended' });
    return { status: 200, canonical: canonical('/apps'), title: fullTitle(STATIC['/apps'].title), description: STATIC['/apps'].description,
      body: `<h1>Alla appar</h1>${appList(apps, siteUrl, 200)}` };
  }

  if (p === '/villkor') {
    return { status: 200, canonical: canonical(p), title: fullTitle(STATIC[p].title), description: STATIC[p].description,
      body: `<article><p>Senast uppdaterade ${esc(TERMS.version)}</p>${markdownToHtml(TERMS.markdown)}</article>` };
  }

  if (STATIC[p]) {
    return { status: 200, canonical: canonical(p), title: fullTitle(STATIC[p].title), description: STATIC[p].description,
      body: `<h1>${esc(STATIC[p].title)}</h1><p>${esc(STATIC[p].description)}</p>`, ...(p === '/rapportera' ? { noindex: true } : {}) };
  }

  const idea = /^\/ideer\/([^/]+)$/.exec(p);
  if (idea && idea[1] !== 'ny') {
    const i = store.getIdea(idea[1]);
    if (!i) return { status: 404, noindex: true };
    return { status: 200, canonical: canonical(`/ideer/${i.id}`), title: fullTitle(i.title), description: String(i.description || '').slice(0, 300),
      body: `<h1>${esc(i.title)}</h1><p>${esc(i.description || '')}</p>` };
  }

  if (NOINDEX.test(p)) return { status: 200, noindex: true };
  return { status: 404, noindex: true };
}

/** Put the page into index.html. */
export function applyPage(html, page) {
  let out = html;
  const setMeta = (attr, name, value) => {
    const re = new RegExp(`<meta\\s+${attr}="${name}"\\s+content="[^"]*"\\s*/?>`, 'i');
    const tag = `<meta ${attr}="${name}" content="${esc(value)}" />`;
    out = re.test(out) ? out.replace(re, tag) : out.replace('</head>', `  ${tag}\n</head>`);
  };
  if (page.title) {
    out = out.replace(/<title>[^<]*<\/title>/i, `<title>${esc(page.title)}</title>`);
    setMeta('property', 'og:title', page.title);
    setMeta('name', 'twitter:title', page.title);
  }
  if (page.description) {
    setMeta('name', 'description', page.description);
    setMeta('property', 'og:description', page.description);
    setMeta('name', 'twitter:description', page.description);
  }
  if (page.canonical) {
    const link = `<link rel="canonical" href="${esc(page.canonical)}" />`;
    out = /<link\s+rel="canonical"/i.test(out)
      ? out.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, link)
      : out.replace('</head>', `  ${link}\n</head>`);
    setMeta('property', 'og:url', page.canonical);
  } else {
    out = out.replace(/\s*<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '');
  }
  if (page.image) {
    setMeta('property', 'og:image', page.image);
    setMeta('name', 'twitter:image', page.image);
  }
  if (page.noindex) setMeta('name', 'robots', 'noindex, follow');
  if (page.jsonLd?.length) {
    const scripts = page.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n');
    out = out.replace('</head>', `${scripts}\n</head>`);
  }
  if (page.body) {
    // after the loading screen (it fills the first view as before); React replaces both when it starts
    const ssr = `<main class="ssr">${page.body}</main>`;
    const loading = out.indexOf('class="app-loading"');
    const end = loading >= 0 ? out.indexOf('</div>', loading) : -1;
    out = end >= 0 ? out.slice(0, end + 6) + ssr + out.slice(end + 6) : out.replace('<div id="root">', `<div id="root">${ssr}`);
  }
  return out;
}
