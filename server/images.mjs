// Image storage in DATA_DIR/images. Files are content-addressed (sha256), so
// storing the same image twice yields the same name.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import { isHttpUrl } from './validate.mjs';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const IMAGE_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

/** Detect the image type from the file's first bytes (never trust the sender). */
export function sniffImage(buf) {
  if (buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (buf.length >= 12 && buf.subarray(4, 8).toString('latin1') === 'ftyp' && /avi[fs]/.test(buf.subarray(8, 12).toString('latin1'))) return 'avif';
  if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) return 'ico';
  const head = buf.subarray(0, 1024).toString('utf8').replace(/^﻿/, '').trimStart().toLowerCase();
  if ((head.startsWith('<?xml') || head.startsWith('<svg') || head.startsWith('<!--')) && head.includes('<svg')) return 'svg';
  return null;
}

export function createImageStore(dataDir, db) {
  const dir = join(dataDir, 'images');
  mkdirSync(dir, { recursive: true });

  function save(buf) {
    const ext = sniffImage(buf);
    if (!ext) throw new Error('not a supported image');
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('image too large');
    const name = `${createHash('sha256').update(buf).digest('hex').slice(0, 32)}.${ext}`;
    const path = join(dir, name);
    if (!existsSync(path)) writeFileSync(path, buf);
    return { name, url: `/images/${name}` };
  }

  /** Download a remote image and store it. Returns {url} (a local /images path). */
  async function download(remoteUrl, { fetchImpl = globalThis.fetch } = {}) {
    if (!isHttpUrl(remoteUrl)) throw new Error('not an http(s) URL');
    const known = db.prepare('SELECT file FROM image_sources WHERE url = ?').get(remoteUrl);
    if (known && existsSync(join(dir, known.file))) return { url: `/images/${known.file}`, cached: true };

    const res = await fetchImpl(remoteUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
      headers: { 'User-Agent': 'skolappar-image-import/1.0', Accept: 'image/*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) throw new Error('image too large');
    const buf = await readLimited(res, MAX_IMAGE_BYTES);
    const saved = save(buf);
    db.prepare(
      `INSERT INTO image_sources (url, file, created_at) VALUES (?, ?, ?)
       ON CONFLICT(url) DO UPDATE SET file = excluded.file`
    ).run(remoteUrl, saved.name, new Date().toISOString());
    return { url: saved.url, cached: false };
  }

  /** Resolve /images/<name> to a file, or null. */
  function file(name) {
    if (!/^[0-9a-f]{32}\.(png|jpg|gif|webp|avif|ico|svg)$/.test(name)) return null;
    const path = join(dir, name);
    try {
      const st = statSync(path);
      if (!st.isFile()) return null;
      const ext = name.split('.').pop();
      return { path, size: st.size, type: IMAGE_TYPES[ext], stream: () => createReadStream(path) };
    } catch {
      return null;
    }
  }

  return { dir, save, download, file };
}

async function readLimited(res, limit) {
  if (!res.body) return Buffer.from(await res.arrayBuffer());
  const chunks = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.length;
    if (size > limit) throw new Error('image too large');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
