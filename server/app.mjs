// The HTTP application: routes for the public API, admin API, MCP, images,
// SEO files and the single-page frontend.
import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { resolve as resolvePath, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, accessSync, constants as fsConstants } from 'node:fs';
import { tmpdir } from 'node:os';
import { openDatabase, schemaVersion } from './db.mjs';
import { createStore, APP_STATUSES, IDEA_STATUSES } from './store.mjs';
import { createImageStore, MAX_IMAGE_BYTES, sniffImage } from './images.mjs';
import { createImporter, ImportError } from './importer.mjs';
import { createMcpHandler } from './mcp.mjs';
import { createMailer } from './mailer.mjs';
import { createRateLimiter } from './ratelimit.mjs';
import { createStatic } from './static.mjs';
import { buildLlmsTxt, buildSitemap, injectAppMeta } from './seo.mjs';
import { validate, ValidationError, isUuid } from './validate.mjs';
import { HttpError, MB, readBody, readJson, sendJson, sendText, sendError, clientIp, escapeHtml } from './http.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const HOUR = 60 * 60 * 1000;

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 8080,
    dataDir: resolvePath(env.DATA_DIR || join(here, '..', 'data')),
    distDir: resolvePath(env.STATIC_DIR || join(here, '..', 'dist')),
    siteUrl: (env.SITE_URL || 'https://www.skolappar.com').replace(/\/+$/, ''),
    adminKey: env.ADMIN_KEY || '',
    agentKeyHashes: parseKeyHashes(env.AGENT_KEY_HASHES),
    submitLimit: Number(env.SUBMIT_RATE_LIMIT) || 5,
    voteLimit: Number(env.VOTE_RATE_LIMIT) || 120,
    env,
  };
}

function digest(s) {
  return createHash('sha256').update(String(s)).digest();
}

/** Constant-time comparison of a presented key with the configured one. */
function keyMatches(presented, expected) {
  return timingSafeEqual(digest(presented), digest(expected));
}

/** SHA-256 hashes (hex) of agent keys, from a comma or space separated list. */
export function parseKeyHashes(value) {
  return String(value || '').toLowerCase().split(/[\s,]+/).filter((h) => /^[0-9a-f]{64}$/.test(h));
}

/**
 * Returns a writable data directory: DATA_DIR if it can be written, otherwise a
 * temporary one (e.g. a preview without a /data disk). Data in the fallback is
 * lost on restart, so it is logged loudly.
 */
export function usableDataDir(dataDir, log = console) {
  try {
    mkdirSync(dataDir, { recursive: true });
    accessSync(dataDir, fsConstants.W_OK);
    return dataDir;
  } catch (err) {
    const fallback = join(tmpdir(), 'skolappar-data');
    mkdirSync(fallback, { recursive: true });
    log.warn(`DATA_DIR ${dataDir} is not writable (${err.code || err.message}); using ${fallback} – data will NOT survive a restart`);
    return fallback;
  }
}

export function createApp(config, { fetchImpl = globalThis.fetch, log = console } = {}) {
  config.dataDir = usableDataDir(config.dataDir, log);
  const db = openDatabase(config.dataDir);
  const mailer = createMailer(config.env || {}, { fetchImpl, log });
  const store = createStore(db, { mailer, siteUrl: config.siteUrl, log });
  const images = createImageStore(config.dataDir, db);
  const importer = createImporter({ store, images, fetchImpl, log });
  const mcp = createMcpHandler({ store, images: { ...images, download: (u) => images.download(u, { fetchImpl }) }, log });
  const statics = createStatic(config.distDir);
  const submitLimiter = createRateLimiter({ limit: config.submitLimit, windowMs: HOUR });
  const ideaLimiter = createRateLimiter({ limit: config.submitLimit, windowMs: HOUR });
  const voteLimiter = createRateLimiter({ limit: config.voteLimit, windowMs: HOUR });

  // ---------- helpers ----------

  function requireAdmin(req) {
    if (!config.adminKey) throw new HttpError(503, 'ADMIN_KEY not set');
    const m = /^Bearer\s+(\S+)\s*$/i.exec(String(req.headers.authorization || ''));
    if (!m || !keyMatches(m[1], config.adminKey)) throw new HttpError(401, 'Unauthorized');
  }

  /**
   * /mcp also accepts an agent key (Authorization: Bearer or X-Api-Key) whose
   * SHA-256 is listed in AGENT_KEY_HASHES. Agent keys open nothing but /mcp.
   */
  /**
   * Who is calling /mcp. No key at all: 'public' – the open tools. A key: it must be the admin key
   * or an agent key (SHA-256 listed in AGENT_KEY_HASHES; opens nothing but /mcp), as
   * Authorization: Bearer or X-Api-Key – a wrong key is refused, so a mistyped one is noticed.
   */
  function mcpRole(req) {
    const m = /^Bearer\s+(\S+)\s*$/i.exec(String(req.headers.authorization || ''));
    const key = m ? m[1] : String(req.headers['x-api-key'] || '').trim();
    if (!key) {
      if (req.headers.authorization) throw new HttpError(401, 'Unauthorized');
      return 'public';
    }
    if (config.adminKey && keyMatches(key, config.adminKey)) return 'admin';
    const presented = digest(key);
    let ok = false;
    for (const h of config.agentKeyHashes || []) if (timingSafeEqual(presented, Buffer.from(h, 'hex'))) ok = true;
    if (!ok) throw new HttpError(401, 'Unauthorized');
    return 'admin';
  }

  function limit(limiter, req) {
    const r = limiter.hit(clientIp(req));
    if (!r.ok) throw new HttpError(429, 'Too many requests', { retry_after: r.retryAfter });
  }

  function voterId(req) {
    const v = String(req.headers['x-voter-id'] || '');
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(v)) throw new HttpError(400, 'Missing or invalid X-Voter-Id header');
    return v;
  }

  function check(schema, body) {
    try {
      return validate(schema, body);
    } catch (err) {
      if (err instanceof ValidationError) throw new HttpError(400, err.message);
      throw err;
    }
  }

  const needId = (id) => {
    if (!isUuid(id) && !/^[A-Za-z0-9-]{1,100}$/.test(id)) throw new HttpError(404, 'Not found');
    return id;
  };
  const found = (v, what = 'Not found') => {
    if (v === null || v === undefined || v === false) throw new HttpError(404, what);
    return v;
  };
  const csv = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : undefined);

  // ---------- schemas ----------

  const uuidList = { type: 'array', items: { type: 'string', format: 'uuid' }, maxItems: 30 };
  const SUBMISSION = {
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri', maxLength: 2048 },
      email: { type: 'string', format: 'email', maxLength: 254 },
      title: { type: 'string', maxLength: 120 },
      description: { type: 'string', maxLength: 500 },
      note: { type: 'string', maxLength: 2000 },
      website: { type: 'string', maxLength: 500 }, // honeypot: humans leave it empty
    },
    required: ['url', 'email'],
  };
  const IDEA = {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', minLength: 5, maxLength: 5000 },
      target_age: { type: 'string', maxLength: 60 },
      target_subject: { type: 'string', maxLength: 60 },
      email: { type: 'string', format: 'email', maxLength: 254 },
      website: { type: 'string', maxLength: 500 },
    },
    required: ['title', 'description'],
  };
  const APP_PATCH = {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 120 },
      description: { type: 'string', maxLength: 500 },
      long_description: { type: ['string', 'null'], maxLength: 10000 },
      url: { type: 'string', format: 'uri', maxLength: 2048 },
      image_url: { type: ['string', 'null'], maxLength: 2048 },
      creator_name: { type: ['string', 'null'], maxLength: 120 },
      status: { type: 'string', enum: APP_STATUSES },
      is_featured: { type: 'boolean' },
      delist_reason: { type: ['string', 'null'], maxLength: 500 },
      category_ids: uuidList,
    },
  };
  const CATEGORY = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 60 },
      slug: { type: 'string', pattern: '^[a-z0-9-]+$', maxLength: 60 },
      type: { type: 'string', minLength: 1, maxLength: 40 },
      description: { type: ['string', 'null'], maxLength: 300 },
      icon: { type: ['string', 'null'], maxLength: 60 },
      color: { type: ['string', 'null'], maxLength: 40 },
      sort_order: { type: 'integer', minimum: 0, maximum: 9999 },
    },
  };
  const RESOURCE = {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 160 },
      slug: { type: 'string', pattern: '^[a-z0-9-]+$', maxLength: 160 },
      excerpt: { type: ['string', 'null'], maxLength: 400 },
      content: { type: 'string', maxLength: 100000 },
      category: { type: 'string', minLength: 1, maxLength: 60 },
      icon: { type: ['string', 'null'], maxLength: 60 },
      sort_order: { type: 'integer', minimum: 0, maximum: 9999 },
      is_published: { type: 'boolean' },
    },
  };
  const IDEA_PATCH = {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', maxLength: 5000 },
      target_age: { type: ['string', 'null'], maxLength: 60 },
      target_subject: { type: ['string', 'null'], maxLength: 60 },
      status: { type: 'string', enum: IDEA_STATUSES },
      claimer_name: { type: ['string', 'null'], maxLength: 120 },
      built_app_id: { type: ['string', 'null'], maxLength: 100 },
    },
  };

  function checkImageUrl(v) {
    if (v && !v.startsWith('/images/') && !/^https?:\/\//i.test(v)) throw new HttpError(400, 'image_url must be an http(s) URL or /images/…');
  }

  // ---------- routes ----------

  const routes = [];
  const route = (method, pattern, handler) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}/?$`);
    routes.push({ method, re, keys, handler });
  };

  // Public API
  route('GET', '/api/categories', () => store.listCategories());
  route('GET', '/api/apps', ({ query }) => store.listPublicApps({
    search: query.get('search')?.trim() || undefined,
    subjects: csv(query.get('subjects')),
    ages: csv(query.get('ages')),
    types: csv(query.get('types')),
    sort: query.get('sort') || 'newest',
  }));
  route('GET', '/api/apps/top', () => store.topApps(5));
  route('GET', '/api/apps/recent', () => store.recentApps(6));
  route('GET', '/api/apps/:id', ({ params }) => found(store.getApp(needId(params.id)), 'App not found'));
  route('GET', '/api/apps/:id/related', ({ params }) => store.relatedApps(needId(params.id)));
  route('POST', '/api/apps/:id/click', ({ params }) => ({ counted: store.trackClick(needId(params.id)) }));
  route('POST', '/api/apps/:id/upvote', ({ req, params }) => {
    const voter = voterId(req);
    limit(voteLimiter, req);
    return found(store.toggleUpvote('app', needId(params.id), voter), 'App not found');
  });
  route('GET', '/api/upvotes', ({ req }) => store.myUpvotes(voterId(req)));
  route('GET', '/api/stats', () => store.publicStats());
  route('GET', '/api/resources', ({ query }) => store.listResources({ category: query.get('category') || undefined }));
  route('GET', '/api/resources/:slug', ({ params }) => found(store.getResourceBySlug(params.slug), 'Resource not found'));
  route('GET', '/api/settings', () => store.allSettings());
  route('GET', '/api/ideas', ({ query }) => store.listIdeas({
    status: query.get('status') || undefined,
    target_age: query.get('target_age') || undefined,
    target_subject: query.get('target_subject') || undefined,
    search: query.get('search')?.trim() || undefined,
    sortBy: query.get('sort') || undefined,
  }));
  route('GET', '/api/ideas/top', ({ query }) => store.topIdeas(Math.min(Math.max(Number(query.get('limit')) || 3, 1), 20)));
  route('GET', '/api/ideas/:id', ({ params }) => found(store.getIdea(needId(params.id)), 'Idea not found'));
  route('POST', '/api/ideas/:id/upvote', ({ req, params }) => {
    const voter = voterId(req);
    limit(voteLimiter, req);
    return found(store.toggleUpvote('idea', needId(params.id), voter), 'Idea not found');
  });
  route('POST', '/api/ideas', async ({ req, res }) => {
    const body = check(IDEA, await readJson(req));
    limit(ideaLimiter, req);
    if (body.website) return { status: 201, body: { ok: true } }; // honeypot: pretend success
    const idea = store.createIdea(body);
    log.info?.(`idea created ${idea.id}`);
    return { status: 201, body: { ok: true, id: idea.id } };
  });
  route('POST', '/api/submissions', async ({ req }) => {
    const body = check(SUBMISSION, await readJson(req));
    limit(submitLimiter, req);
    if (body.website) return { status: 201, body: { ok: true } };
    const listed = store.listedAt(body.url);
    if (listed) throw new HttpError(409, 'This app is already listed', { app_id: listed });
    const { id } = store.createSubmission(body);
    log.info?.(`submission created ${id}`);
    store.sendConfirmation(id).catch(() => {});
    return { status: 201, body: { ok: true } };
  });

  // Admin API (Authorization: Bearer $ADMIN_KEY)
  const admin = (method, pattern, handler) => route(method, pattern, (ctx) => {
    requireAdmin(ctx.req);
    return handler(ctx);
  });
  admin('GET', '/api/admin/check', () => ({ ok: true }));
  admin('GET', '/api/admin/stats', () => store.platformStats());
  admin('GET', '/api/admin/analytics', ({ query }) => {
    const days = Number(query.get('days') || 7);
    if (![7, 30, 90].includes(days)) throw new HttpError(400, 'days must be 7, 30 or 90');
    return store.appAnalytics(days);
  });
  admin('GET', '/api/admin/apps', ({ query }) => store.listAdminApps({
    status: APP_STATUSES.includes(query.get('status')) ? query.get('status') : undefined,
    search: query.get('search') || undefined,
  }));
  admin('POST', '/api/admin/apps', async ({ req }) => {
    const body = check({ ...APP_PATCH, required: ['title', 'url'] }, await readJson(req));
    checkImageUrl(body.image_url);
    const { category_ids, ...fields } = body;
    return { status: 201, body: store.createApp(fields, category_ids) };
  });
  admin('GET', '/api/admin/apps/:id', ({ params }) => found(store.getApp(needId(params.id), { admin: true }), 'App not found'));
  admin('PATCH', '/api/admin/apps/:id', async ({ req, params }) => {
    const body = check(APP_PATCH, await readJson(req));
    checkImageUrl(body.image_url);
    const { category_ids, ...fields } = body;
    return found(store.updateApp(needId(params.id), fields, category_ids), 'App not found');
  });
  admin('POST', '/api/admin/apps/:id/resend-mail', async ({ req, params }) => {
    const body = check({ type: 'object', properties: { kind: { type: 'string', enum: ['confirm', 'published'] } }, required: ['kind'], additionalProperties: false }, await readJson(req));
    const out = found(await store.resendMail(needId(params.id), body.kind), 'App not found');
    if (out.error) throw new HttpError(409, `Cannot send this mail: ${out.error}`, { reason: out.error });
    return out;
  });
  admin('DELETE', '/api/admin/apps/:id', ({ params }) => ({ deleted: found(store.deleteApp(needId(params.id)), 'App not found') && params.id }));
  admin('POST', '/api/admin/apps/:id/image', async ({ req, params }) => {
    const body = check({ type: 'object', properties: { url: { type: 'string', format: 'uri', maxLength: 2048 } }, required: ['url'] }, await readJson(req));
    found(store.getApp(needId(params.id), { admin: true }), 'App not found');
    let saved;
    try {
      saved = await images.download(body.url, { fetchImpl });
    } catch (err) {
      throw new HttpError(422, `Could not fetch image: ${err.message}`);
    }
    return store.updateApp(params.id, { image_url: saved.url });
  });
  admin('POST', '/api/admin/upload', async ({ req }) => {
    const buf = await readBody(req, MAX_IMAGE_BYTES);
    if (!sniffImage(buf)) throw new HttpError(415, 'Not a supported image (png, jpg, gif, webp, avif, ico, svg)');
    return { status: 201, body: { url: images.save(buf).url } };
  });
  admin('GET', '/api/admin/categories', () => store.listCategories().sort((a, b) => a.type.localeCompare(b.type) || a.sort_order - b.sort_order));
  admin('POST', '/api/admin/categories', async ({ req }) => {
    const body = check({ ...CATEGORY, required: ['name', 'slug', 'type'] }, await readJson(req));
    return { status: 201, body: store.createCategory(body) };
  });
  admin('PATCH', '/api/admin/categories/:id', async ({ req, params }) =>
    found(store.updateCategory(needId(params.id), check(CATEGORY, await readJson(req))), 'Category not found'));
  admin('DELETE', '/api/admin/categories/:id', ({ params }) => ({ deleted: found(store.deleteCategory(needId(params.id)), 'Category not found') && params.id }));
  admin('GET', '/api/admin/resources', () => store.listResources({ publishedOnly: false }).sort((a, b) => a.category.localeCompare(b.category) || a.sort_order - b.sort_order));
  admin('POST', '/api/admin/resources', async ({ req }) => {
    const body = check({ ...RESOURCE, required: ['title', 'slug', 'content', 'category'] }, await readJson(req));
    return { status: 201, body: store.createResource(body) };
  });
  admin('PATCH', '/api/admin/resources/:id', async ({ req, params }) =>
    found(store.updateResource(needId(params.id), check(RESOURCE, await readJson(req))), 'Resource not found'));
  admin('DELETE', '/api/admin/resources/:id', ({ params }) => ({ deleted: found(store.deleteResource(needId(params.id)), 'Resource not found') && params.id }));
  admin('GET', '/api/admin/ideas', () => store.listIdeas({ admin: true }));
  admin('GET', '/api/admin/ideas/stats', () => store.ideaStats());
  admin('PATCH', '/api/admin/ideas/:id', async ({ req, params }) =>
    found(store.updateIdea(needId(params.id), check(IDEA_PATCH, await readJson(req))), 'Idea not found'));
  admin('DELETE', '/api/admin/ideas/:id', ({ params }) => ({ deleted: found(store.deleteIdea(needId(params.id)), 'Idea not found') && params.id }));
  admin('GET', '/api/admin/settings', () => store.listSettings());
  admin('PUT', '/api/admin/settings/:key', async ({ req, params }) => {
    const key = decodeURIComponent(params.key);
    if (!/^[A-Za-z0-9_.-]{1,120}$/.test(key)) throw new HttpError(400, 'Invalid setting key');
    const body = await readJson(req);
    if (!('value' in body)) throw new HttpError(400, 'value: required');
    return store.setSetting(key, body.value);
  });
  admin('POST', '/api/admin/import', async ({ req }) => {
    const body = await readJson(req, 20 * MB);
    try {
      return await importer.run(body);
    } catch (err) {
      if (err instanceof ImportError) throw new HttpError(400, err.message);
      throw err;
    }
  });

  // ---------- request handling ----------

  async function handleMcp(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' });
      res.end();
      return;
    }
    const role = mcpRole(req);
    const type = String(req.headers['content-type'] || '').toLowerCase();
    if (!type.startsWith('application/json')) throw new HttpError(415, 'Content-Type must be application/json');
    let body;
    try {
      body = JSON.parse((await readBody(req, MB)).toString('utf8'));
    } catch (err) {
      if (err instanceof HttpError) throw err;
      sendJson(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }
    const out = await mcp.handle(body, { role, submitAllowed: () => submitLimiter.hit(clientIp(req)) });
    if (out === null) {
      res.writeHead(202);
      res.end();
      return;
    }
    sendJson(res, 200, out);
  }

  function confirmPage(ok) {
    const title = ok ? 'Tack! Din e-postadress är bekräftad' : 'Länken fungerar inte';
    const text = ok
      ? 'Vi hör av oss när appen du tipsade om har granskats.'
      : 'Länken är ogiltig eller har redan använts på ett annat sätt. Kontrollera att du kopierat hela länken.';
    return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} – Skolappar</title>
<style>body{font-family:ui-rounded,system-ui,sans-serif;background:#fffcf5;color:#1f1f33;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}
main{max-width:480px;background:#fff;border-radius:24px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,.08);text-align:center}
a{display:inline-block;margin-top:16px;padding:12px 20px;border-radius:999px;background:#f0613a;color:#fff;text-decoration:none;font-weight:600}</style></head>
<body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p><a href="/">Till Skolappar</a></main></body></html>`;
  }

  // When the site lives on www.<domain>, the bare <domain> redirects there (one address for
  // visitors and search engines). Other hosts – <app>.shipholm.dev, previews – are served as is.
  const canonicalHost = new URL(config.siteUrl).host.toLowerCase();
  const apexHost = canonicalHost.startsWith('www.') ? canonicalHost.slice(4) : null;

  async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    const host = String(req.headers.host || '').toLowerCase().replace(/:\d+$/, '');
    if (apexHost && host === apexHost && path !== '/healthz') {
      const status = req.method === 'GET' || req.method === 'HEAD' ? 301 : 308;
      res.writeHead(status, { Location: config.siteUrl + (req.url || '/'), 'Cache-Control': 'public, max-age=86400' });
      return res.end();
    }

    if (path === '/healthz') {
      db.prepare('SELECT 1').get();
      return sendJson(res, 200, { ok: true, schema: schemaVersion(db) });
    }
    if (path === '/mcp') return handleMcp(req, res);

    if (path.startsWith('/api/')) {
      const candidates = routes.filter((r) => r.re.test(path));
      if (!candidates.length) throw new HttpError(404, 'Not found');
      const r = candidates.find((c) => c.method === req.method || (req.method === 'HEAD' && c.method === 'GET'));
      if (!r) {
        res.setHeader('Allow', [...new Set(candidates.map((c) => c.method))].join(', '));
        throw new HttpError(405, 'Method not allowed');
      }
      const m = r.re.exec(path);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const result = await r.handler({ req, res, params, query: url.searchParams });
      if (result && typeof result === 'object' && 'status' in result && 'body' in result) {
        return sendJson(res, result.status, result.body);
      }
      return sendJson(res, 200, result);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed');

    if (path.startsWith('/images/')) {
      const f = images.file(path.slice('/images/'.length));
      if (!f) throw new HttpError(404, 'Not found');
      res.writeHead(200, {
        'Content-Type': f.type,
        'Content-Length': f.size,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      });
      if (req.method === 'HEAD') return res.end();
      f.stream().pipe(res);
      return;
    }
    if (path === '/llms.txt') {
      return sendText(res, 200, buildLlmsTxt(store, config.siteUrl), 'text/plain; charset=utf-8', {
        'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*',
      });
    }
    if (path === '/sitemap.xml') {
      return sendText(res, 200, buildSitemap(store, config.siteUrl), 'application/xml; charset=utf-8', { 'Cache-Control': 'public, max-age=3600' });
    }
    const confirm = /^\/bekrafta\/([^/]+)\/?$/.exec(path);
    if (confirm) {
      const ok = store.confirmEmail(confirm[1]);
      return sendText(res, ok ? 200 : 404, confirmPage(ok), 'text/html; charset=utf-8', { 'Cache-Control': 'no-store' });
    }

    if (statics.serveFile(req, res, path)) return;

    const appPage = /^\/app\/([^/]+)\/?$/.exec(path);
    if (appPage) {
      const app = store.getApp(appPage[1]);
      if (app) return statics.serveIndex(req, res, (html) => injectAppMeta(html, app, config.siteUrl));
    }
    // Missing build assets must not turn into HTML.
    if (path.startsWith('/assets/')) throw new HttpError(404, 'Not found');
    return statics.serveIndex(req, res);
  }

  const server = http.createServer((req, res) => {
    const started = Date.now();
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.on('finish', () => {
      const p = (req.url || '').split('?')[0];
      if (p === '/healthz' || p.startsWith('/assets/') || p.startsWith('/images/')) return;
      const shown = p.startsWith('/bekrafta/') ? '/bekrafta/…' : p;
      log.info?.(`${req.method} ${shown} ${res.statusCode} ${Date.now() - started}ms`);
    });
    handle(req, res).catch((err) => sendError(res, err));
  });
  server.requestTimeout = 120_000;
  server.headersTimeout = 30_000;

  function close() {
    submitLimiter.stop();
    ideaLimiter.stop();
    voteLimiter.stop();
    return new Promise((resolve) => {
      server.close(() => {
        try { db.close(); } catch { /* already closed */ }
        resolve();
      });
      server.closeAllConnections?.();
    });
  }

  return { server, store, db, images, mailer, close, limiters: { submitLimiter, ideaLimiter, voteLimiter } };
}
