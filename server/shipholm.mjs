// The address <name>.skolappar.com for an app that runs on Shipholm: given when the app is
// listed, taken back when it leaves the catalogue. Shipholm's tools grant_subdomain and
// revoke_subdomain do it, called with an API key of the account that serves skolappar.com
// (SHIPHOLM_API_KEY). Without the key nothing happens and apps keep the address they came with.

const PROTOCOL_VERSION = '2025-06-18';

/** The last JSON message of an answer that is plain JSON or a server-sent event stream. */
function parse(raw) {
  const events = raw.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim());
  const text = events.length ? events[events.length - 1] : raw.trim();
  return text ? JSON.parse(text) : null;
}

export function createShipholm(env = process.env, { fetchImpl = globalThis.fetch, log = console } = {}) {
  const apiKey = env.SHIPHOLM_API_KEY || '';
  const apiUrl = env.SHIPHOLM_API_URL || 'https://api.shipholm.com/mcp';
  const platformDomain = (env.SHIPHOLM_APP_DOMAIN || 'shipholm.dev').toLowerCase();
  const ownDomain = (env.ADDRESS_DOMAIN || 'skolappar.com').toLowerCase();

  async function post(body, extra = {}) {
    const res = await fetchImpl(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${apiKey}`, 'X-Shipholm-Client': 'skolappar', ...extra },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Shipholm answered HTTP ${res.status}`);
    return { session: res.headers.get('mcp-session-id'), message: parse(await res.text()) };
  }

  /** Call one tool; the answer's object, or an Error with Shipholm's own words. */
  async function call(tool, args) {
    const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'skolappar', version: '1.0.0' } } });
    const sid = init.session ? { 'Mcp-Session-Id': init.session } : {};
    try {
      await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
      const { message } = await post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: args } }, sid);
      if (!message) throw new Error('Shipholm sent an empty answer');
      if (message.error) throw new Error(message.error.message || 'Shipholm refused');
      const result = message.result || {};
      const text = (result.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      if (result.isError) throw new Error(text || 'Shipholm refused');
      return result.structuredContent?.result ?? result.structuredContent ?? {};
    } finally {
      // the API keeps a session in memory until it is told it is over
      if (init.session) fetchImpl(apiUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${apiKey}`, ...sid } }).catch(() => {});
    }
  }

  return {
    configured: Boolean(apiKey),
    ownDomain,
    /** 'klockan' for https://klockan.shipholm.dev/…; null for an app that does not run on Shipholm. */
    labelOf(url) {
      try {
        const host = new URL(url).hostname.toLowerCase();
        const suffix = `.${platformDomain}`;
        const label = host.endsWith(suffix) ? host.slice(0, -suffix.length) : '';
        return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(label) ? label : null;
      } catch { return null; }
    },
    hostOf: (label) => `${label}.${platformDomain}`,
    async grant(label) {
      const out = await call('grant_subdomain', { domain: `${label}.${ownDomain}`, host: `${label}.${platformDomain}` });
      log.info?.(`shipholm: ${label}.${ownDomain} given`);
      return out;
    },
    async revoke(label) {
      const out = await call('revoke_subdomain', { domain: `${label}.${ownDomain}` });
      log.info?.(`shipholm: ${label}.${ownDomain} taken back`);
      return out;
    },
  };
}
