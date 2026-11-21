// Static files from the Vite build (dist/), with SPA fallback to index.html.
import { readFileSync, statSync } from 'node:fs';
import { join, normalize, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.txt', '.xml', '.svg', '.map']);

export function createStatic(distDir) {
  const cache = new Map(); // path -> {mtimeMs, body, gz}

  function load(path) {
    let st;
    try {
      st = statSync(path);
    } catch {
      return null;
    }
    if (!st.isFile()) return null;
    const hit = cache.get(path);
    if (hit && hit.mtimeMs === st.mtimeMs) return hit;
    const body = readFileSync(path);
    const ext = extname(path).toLowerCase();
    const entry = {
      mtimeMs: st.mtimeMs,
      body,
      gz: COMPRESSIBLE.has(ext) && body.length > 1024 ? gzipSync(body) : null,
      type: TYPES[ext] || 'application/octet-stream',
    };
    cache.set(path, entry);
    return entry;
  }

  /** Map a URL path to a file inside distDir (never outside it). */
  function resolve(urlPath) {
    let decoded;
    try {
      decoded = decodeURIComponent(urlPath);
    } catch {
      return null;
    }
    if (decoded.includes('\0')) return null;
    const full = normalize(join(distDir, decoded));
    if (full !== distDir && !full.startsWith(distDir.endsWith(sep) ? distDir : distDir + sep)) return null;
    return full;
  }

  function cacheControl(urlPath) {
    if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
    if (urlPath.endsWith('.html')) return 'no-cache';
    return 'public, max-age=3600';
  }

  function send(req, res, entry, { cache: cacheHeader, body: overrideBody, status = 200 } = {}) {
    let body = overrideBody ?? entry.body;
    const headers = { 'Content-Type': entry.type, 'Cache-Control': cacheHeader, Vary: 'Accept-Encoding' };
    const acceptsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
    if (acceptsGzip) {
      const gz = overrideBody ? (body.length > 1024 ? gzipSync(body) : null) : entry.gz;
      if (gz) {
        body = gz;
        headers['Content-Encoding'] = 'gzip';
      }
    }
    headers['Content-Length'] = body.length;
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  /** Try to serve a real file. Returns true when handled. */
  function serveFile(req, res, urlPath) {
    if (urlPath === '/' || urlPath === '/index.html') return false; // index goes through the SPA path
    const full = resolve(urlPath);
    if (!full) return false;
    const entry = load(full);
    if (!entry) return false;
    send(req, res, entry, { cache: cacheControl(urlPath) });
    return true;
  }

  function indexHtml() {
    const entry = load(join(distDir, 'index.html'));
    return entry;
  }

  /** Serve index.html, optionally transformed (meta tags for app pages). */
  function serveIndex(req, res, transform, status = 200) {
    const entry = indexHtml();
    if (!entry) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Frontend not built (run npm run build)');
      return;
    }
    const body = transform ? Buffer.from(transform(entry.body.toString('utf8'))) : undefined;
    send(req, res, entry, { cache: 'no-cache', body, status });
  }

  return { serveFile, serveIndex };
}
