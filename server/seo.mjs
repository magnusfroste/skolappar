// /llms.txt and /sitemap.xml. The meta tags and text of each page: prerender.mjs.
import { resourcePath } from './prerender.mjs';
import { landingPages, landingPath } from './landing.mjs';

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
  const subjects = landingPages(store);
  if (subjects.length) {
    out += '## Apps by subject and grade\n\n';
    for (const l of subjects) out += `- ${siteUrl}${landingPath(l.subject, l.age)} (${l.count} apps)\n`;
    out += '\n';
  }
  if (resources.length) {
    out += '## Resources & Guides\n\n';
    for (const r of resources) out += `- [${r.title}](${siteUrl}${resourcePath(r)})${r.excerpt ? `: ${r.excerpt}` : ''}\n`;
    out += '\n';
  }
  out += '## For AI agents\n\n' +
    `Building an educational web app for children? Read the build guide first: ${siteUrl}/guide.md ` +
    `(for people: ${siteUrl}/bygg). It says what an app must do to work for the children and to be listed.\n\n` +
    `A starter template with the hard parts solved: ${siteUrl}/starter/ (files: get_starter over MCP). ` +
    `Agent skills (SKILL.md): ${siteUrl}/skills\n\n` +
    `Submit the finished app over MCP at ${siteUrl}/mcp (streamable HTTP, no key): ` +
    'get_guide, list_categories, submit_app (needs the parent\'s first name and e-mail address), then app_status and app_stats.\n\n';
  if (extra) out += `${extra}\n\n`;
  out += `---\nGenerated: ${day()}\n`;
  return out;
}

const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/apps', 'daily', '0.9'],
  ['/ideer', 'daily', '0.8'],
  ['/resurser', 'weekly', '0.8'],
  ['/bygg', 'monthly', '0.8'],
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
    urls.push(`  <url>\n    <loc>${xml(siteUrl + resourcePath(r))}</loc>\n    <lastmod>${day(r.updated_at)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  }
  for (const l of landingPages(store)) {
    urls.push(`  <url>\n    <loc>${xml(siteUrl + landingPath(l.subject, l.age))}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${l.age ? '0.7' : '0.8'}</priority>\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
