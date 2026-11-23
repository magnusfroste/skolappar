// /llms.txt, /sitemap.xml and server-side meta tags for app pages.
import { escapeHtml } from './http.mjs';

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const day = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

export function buildLlmsTxt(store, siteUrl) {
  const s = store.allSettings();
  const str = (key, fallback) => (typeof s[key] === 'string' && s[key] ? s[key] : fallback);
  const siteName = str('site_name', 'Skolappar');
  const siteDesc = str('site_description', 'En community där engagerade föräldrar delar sina hemmagjorda skolappar.');
  const siteLang = str('site_language', 'sv');
  const orgName = str('organization_name', 'Skolappar');
  const intro = str('llms_txt_intro', '');
  const extra = str('llms_txt_extra', '');
  const faqs = Array.isArray(s.faq_items) ? s.faq_items.filter((f) => f && f.question) : [];

  const apps = store.listPublicApps({ sort: 'popular' }).slice(0, 50);
  const resources = store.listResources({ withContent: false });

  let out = `# ${siteName}\n\n> ${siteDesc}\n\n`;
  if (intro) out += `${intro}\n\n`;
  out += `- Language: ${siteLang}\n- Organization: ${orgName}\n- Website: ${siteUrl}\n- Sitemap: ${siteUrl}/sitemap.xml\n\n`;
  if (faqs.length) {
    out += '## Frequently Asked Questions\n\n';
    for (const f of faqs) out += `### ${f.question}\n${f.answer ?? ''}\n\n`;
  }
  if (apps.length) {
    out += `## Educational Apps (${apps.length} listed)\n\n`;
    for (const a of apps) out += `- [${a.title}](${siteUrl}/app/${a.id}): ${a.description}\n`;
    out += '\n';
  }
  if (resources.length) {
    out += '## Resources & Guides\n\n';
    for (const r of resources) out += `- [${r.title}](${siteUrl}/resurser/${r.category}/${r.slug})${r.excerpt ? `: ${r.excerpt}` : ''}\n`;
    out += '\n';
  }
  out += '## For AI agents\n\n' +
    `Built an educational web app? Submit it over MCP at ${siteUrl}/mcp (streamable HTTP, no key): ` +
    'list_categories, submit_app (needs the parent\'s first name and e-mail address), then app_status and app_stats.\n\n';
  if (extra) out += `${extra}\n\n`;
  out += `---\nGenerated: ${day()}\n`;
  return out;
}

const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/apps', 'daily', '0.9'],
  ['/ideer', 'daily', '0.8'],
  ['/resurser', 'weekly', '0.8'],
  ['/tipsa', 'monthly', '0.6'],
  ['/startmall', 'monthly', '0.6'],
  ['/testa-din-app', 'monthly', '0.5'],
  ['/villkor', 'yearly', '0.3'],
  ['/integritet', 'yearly', '0.3'],
];

export function buildSitemap(store, siteUrl) {
  const today = day();
  const urls = STATIC_PAGES.map(([path, freq, prio]) =>
    `  <url>\n    <loc>${xml(siteUrl + path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`
  );
  for (const a of store.listPublicApps({ sort: 'newest' })) {
    urls.push(`  <url>\n    <loc>${xml(`${siteUrl}/app/${a.id}`)}</loc>\n    <lastmod>${day(a.updated_at)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
  }
  for (const r of store.listResources({ withContent: false })) {
    urls.push(`  <url>\n    <loc>${xml(`${siteUrl}/resurser/${r.category}/${r.slug}`)}</loc>\n    <lastmod>${day(r.updated_at)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/**
 * Put an app's title, description and image into index.html, so link previews
 * and crawlers that do not run JavaScript see the right page.
 */
export function injectAppMeta(html, app, siteUrl) {
  const title = `${app.title} – Skolappar`;
  const desc = (app.description || app.long_description || '').slice(0, 300);
  const pageUrl = `${siteUrl}/app/${app.id}`;
  let image = app.image_url || '';
  if (image.startsWith('/')) image = siteUrl + image;
  const t = escapeHtml(title);
  const d = escapeHtml(desc);
  const setMeta = (doc, attr, name, value) => {
    const re = new RegExp(`<meta\\s+${attr}="${name}"\\s+content="[^"]*"\\s*/?>`, 'i');
    const tag = `<meta ${attr}="${name}" content="${value}" />`;
    return re.test(doc) ? doc.replace(re, tag) : doc.replace('</head>', `  ${tag}\n</head>`);
  };
  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${t}</title>`);
  out = setMeta(out, 'name', 'description', d);
  out = setMeta(out, 'property', 'og:title', t);
  out = setMeta(out, 'property', 'og:description', d);
  out = setMeta(out, 'property', 'og:url', escapeHtml(pageUrl));
  out = setMeta(out, 'name', 'twitter:title', t);
  out = setMeta(out, 'name', 'twitter:description', d);
  if (image) {
    out = setMeta(out, 'property', 'og:image', escapeHtml(image));
    out = setMeta(out, 'name', 'twitter:image', escapeHtml(image));
  }
  return out;
}
