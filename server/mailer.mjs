// Outgoing mail behind one small interface: createMailer(env).send({to, subject, text, html}).
//
// MAIL_PROVIDER picks the provider (default: "resend" when MAIL_API_URL is set, else "stub"):
//   stub        only logs what it would have sent
//   cloudflare  Cloudflare Email Sending REST API
//               MAIL_API_KEY = API token with "Email Sending: Edit", MAIL_CLOUDFLARE_ACCOUNT_ID
//   brevo       Brevo transactional API (MAIL_API_KEY = Brevo API key)
//   resend      any Resend-compatible HTTP API (MAIL_API_URL, MAIL_API_KEY as Bearer token)
// MAIL_FROM is the sender for all providers, e.g. "Skolappar <hej@skolappar.com>".
// A missing setting falls back to the stub (logged at start). Recipient addresses are never logged.

const TIMEOUT_MS = 15_000;

export function parseAddress(value) {
  const m = /^\s*(?:"?([^"<]*?)"?\s*)?<([^<>\s]+@[^<>\s]+)>\s*$/.exec(value || '');
  if (m) return { name: m[1] || '', address: m[2] };
  return { name: '', address: String(value || '').trim() };
}

// Each provider turns a message into one HTTP request and judges the response.
const PROVIDERS = {
  cloudflare: {
    needs: ['MAIL_API_KEY', 'MAIL_CLOUDFLARE_ACCOUNT_ID', 'MAIL_FROM'],
    request(env, from, { to, subject, text, html }) {
      const account = encodeURIComponent(env.MAIL_CLOUDFLARE_ACCOUNT_ID);
      return {
        url: `https://api.cloudflare.com/client/v4/accounts/${account}/email/sending/send`,
        headers: { Authorization: `Bearer ${env.MAIL_API_KEY}` },
        body: {
          from: from.name ? { address: from.address, name: from.name } : from.address,
          to,
          subject,
          text,
          ...(html ? { html } : {}),
        },
      };
    },
    async check(res) {
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const code = data?.errors?.[0]?.code;
        return `http_${res.status}${code ? `_${code}` : ''}`;
      }
      if (data.result?.permanent_bounces?.length) return 'bounced';
      return null;
    },
  },
  brevo: {
    needs: ['MAIL_API_KEY', 'MAIL_FROM'],
    request(env, from, { to, subject, text, html }) {
      return {
        url: 'https://api.brevo.com/v3/smtp/email',
        headers: { 'api-key': env.MAIL_API_KEY, Accept: 'application/json' },
        body: {
          sender: { email: from.address, ...(from.name ? { name: from.name } : {}) },
          to: [{ email: to }],
          subject,
          textContent: text,
          ...(html ? { htmlContent: html } : {}),
        },
      };
    },
    async check(res) {
      return res.ok ? null : `http_${res.status}`;
    },
  },
  resend: {
    needs: ['MAIL_API_URL', 'MAIL_API_KEY', 'MAIL_FROM'],
    request(env, _from, { to, subject, text, html }) {
      return {
        url: env.MAIL_API_URL,
        headers: { Authorization: `Bearer ${env.MAIL_API_KEY}` },
        body: { from: env.MAIL_FROM, to: [to], subject, text, ...(html ? { html } : {}) },
      };
    },
    async check(res) {
      return res.ok ? null : `http_${res.status}`;
    },
  },
};

export function createMailer(env = process.env, { fetchImpl = globalThis.fetch, log = console } = {}) {
  const requested = (env.MAIL_PROVIDER || (env.MAIL_API_URL ? 'resend' : 'stub')).trim().toLowerCase();
  const provider = PROVIDERS[requested];
  let problem = null;
  if (requested !== 'stub' && !provider) problem = `unknown MAIL_PROVIDER "${requested}"`;
  const missing = provider ? provider.needs.filter((k) => !env[k]) : [];
  if (missing.length) problem = `MAIL_PROVIDER=${requested} needs ${missing.join(', ')}`;
  const configured = Boolean(provider) && !problem;
  const name = configured ? requested : 'stub';
  const from = parseAddress(env.MAIL_FROM);

  async function send({ to, subject, text, html }) {
    if (!configured) {
      log.info?.(`mail not configured – would send "${subject}"`);
      return { sent: false, reason: 'not_configured' };
    }
    const { url, headers, body } = provider.request(env, from, { to, subject, text, html });
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const failure = await provider.check(res);
      if (failure) {
        log.error?.(`mail "${subject}" via ${name} failed: ${failure}`);
        return { sent: false, reason: failure };
      }
      log.info?.(`mail "${subject}" sent via ${name}`);
      return { sent: true };
    } catch (err) {
      log.error?.(`mail "${subject}" via ${name} failed: ${err?.name || 'error'}`);
      return { sent: false, reason: 'error' };
    }
  }

  return { configured, provider: name, problem, send };
}

// --- Messages (Swedish, the site's language) ---

export function confirmSubmissionMail({ siteUrl, token, appUrl }) {
  const link = `${siteUrl}/bekrafta/${token}`;
  return {
    subject: 'Bekräfta din e-postadress – Skolappar',
    text:
      `Tack för att du tipsade om en app till Skolappar!\n\n` +
      `App: ${appUrl}\n\n` +
      `Bekräfta din e-postadress genom att öppna länken nedan, så hör vi av oss när appen har granskats:\n` +
      `${link}\n\n` +
      `Har du inte skickat något tips kan du bortse från det här mejlet.\n\n– Skolappar`,
  };
}

export function appPublishedMail({ siteUrl, appId, title }) {
  const link = `${siteUrl}/app/${appId}`;
  return {
    subject: `Nu finns "${title}" på Skolappar`,
    text:
      `Hej!\n\nAppen du tipsade om, "${title}", är nu publicerad på Skolappar:\n${link}\n\n` +
      `Tack för att du delar med dig!\n\n– Skolappar`,
  };
}
