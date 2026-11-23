// Fetching an address a visitor or an agent gave us. The server must not be usable to reach
// what only it can reach, so every connection – the first and each redirect – is refused when
// the name resolves to a private, loopback or link-local address. The check runs where the
// socket is opened (the lookup hook), so a name cannot resolve differently between check and use.
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { lookup as dnsLookup } from 'node:dns';

const blocked = new net.BlockList();
for (const [addr, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 3],
]) blocked.addSubnet(addr, bits, 'ipv4');
for (const [addr, bits] of [
  ['::', 127], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
]) blocked.addSubnet(addr, bits, 'ipv6');

/** True for an address on the public internet. */
export function isPublicAddress(ip) {
  const family = net.isIP(ip);
  if (!family) return false;
  if (family === 6) {
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
    if (mapped) return isPublicAddress(mapped[1]);
    return !blocked.check(ip, 'ipv6');
  }
  return !blocked.check(ip, 'ipv4');
}

const refused = (host) => Object.assign(new Error(`address not allowed: ${host}`), { code: 'EADDRNOTALLOWED' });

function guardedLookup(hostname, options, cb) {
  if (typeof options === 'function') { cb = options; options = {}; }
  dnsLookup(hostname, { ...options, all: true }, (err, found) => {
    if (err) return cb(err);
    const ok = found.filter((a) => isPublicAddress(a.address));
    if (!ok.length) return cb(refused(hostname));
    if (options.all) return cb(null, ok);
    cb(null, ok[0].address, ok[0].family);
  });
}

/**
 * A small fetch for outside addresses: GET only, http(s) only, redirects followed by hand.
 * Answers like fetch as far as the server uses it: ok, status, url, headers.get(), body (async iterable).
 * allowPrivate is for tests and local development.
 */
export function createSafeFetch({ allowPrivate = false } = {}) {
  function once(url, headers, deadline) {
    return new Promise((resolve, reject) => {
      const host = url.hostname.replace(/^\[|\]$/g, '');
      if (!allowPrivate && net.isIP(host) && !isPublicAddress(host)) return reject(refused(host));
      const left = deadline - Date.now();
      if (left <= 0) return reject(new Error('timeout'));
      const req = (url.protocol === 'https:' ? https : http).request(url, {
        method: 'GET', headers, ...(allowPrivate ? {} : { lookup: guardedLookup }),
      });
      const timer = setTimeout(() => req.destroy(new Error('timeout')), left);
      req.on('response', (res) => {
        res.on('close', () => clearTimeout(timer));
        resolve(res);
      });
      req.on('error', (err) => { clearTimeout(timer); reject(err); });
      req.end();
    });
  }

  return async function safeFetch(input, { headers = {}, timeoutMs = 30_000, maxRedirects = 5 } = {}) {
    let url = new URL(String(input));
    const deadline = Date.now() + timeoutMs;
    for (let hop = 0; ; hop++) {
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('not an http(s) URL');
      const res = await once(url, headers, deadline);
      const location = res.headers.location;
      if (res.statusCode >= 300 && res.statusCode < 400 && location) {
        res.resume();
        if (hop >= maxRedirects) throw new Error('too many redirects');
        url = new URL(location, url);
        continue;
      }
      return {
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        url: url.href,
        redirected: hop > 0,
        headers: { get: (name) => { const v = res.headers[String(name).toLowerCase()]; return Array.isArray(v) ? v.join(', ') : v ?? null; } },
        body: res,
      };
    }
  };
}

/** Read a response body up to limit bytes; {buf, truncated}. */
export async function readUpTo(res, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.length;
    if (size > limit) {
      res.body.destroy?.();
      return { buf: Buffer.concat(chunks), truncated: true };
    }
    chunks.push(Buffer.from(chunk));
  }
  return { buf: Buffer.concat(chunks), truncated: false };
}
