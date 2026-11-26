// Outgoing mail behind one small interface: createMailer(env).send({to, subject, text, html}).
//
// MAIL_PROVIDER picks the provider (default: "resend" when MAIL_API_URL is set, else "stub"):
//   stub        only logs what it would have sent
//   cloudflare  Cloudflare Email Sending REST API
//               MAIL_API_KEY = API token with "Email Sending: Edit", MAIL_CLOUDFLARE_ACCOUNT_ID
//   brevo       Brevo transactional API (MAIL_API_KEY = Brevo API key)
//   resend      any Resend-compatible HTTP API (MAIL_API_URL, MAIL_API_KEY as Bearer token)
// MAIL_FROM is the sender for all providers, e.g. "Skolappar <hej@skolappar.org>".
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

export function appKeysMail({ siteUrl, token }) {
  const link = `${siteUrl}/nyckel/${token}`;
  return {
    subject: 'Nycklar till dina appar – Skolappar',
    text:
      `Hej!\n\nNågon – troligen din AI-agent – bad om nya nycklar till apparna du har skickat in till Skolappar.\n\n` +
      `Öppna länken och tryck på knappen, så får du en ny nyckel per app. Ge nyckeln till din agent; de gamla slutar gälla:\n` +
      `${link}\n\nLänken gäller i ett dygn och kan användas en gång.\n\n` +
      `Har du inte bett om det kan du bortse från det här mejlet. Ingenting ändras förrän någon öppnar länken.\n\n– Skolappar`,
  };
}

const pct = (x) => `${Math.round(x * 100)} %`;

/** The weekly letter to an app's maker: how each app did the last 7 days, and one idea for the next version. */
export function weeklyDigestMail({ siteUrl, apps, stopToken }) {
  const blocks = apps.map((a) => {
    const lines = [`${a.title}`, `– öppnad ${a.opens} ${a.opens === 1 ? 'gång' : 'gånger'} (veckan innan: ${a.opens_before})`];
    const s = a.in_app;
    if (!s) {
      lines.push(`– Lägg in kodsnutten, så ser ni hur långt barnen kommer: ${siteUrl}/bygg#kodsnutten`);
    } else {
      if (s.rounds_started) {
        lines.push(`– ${s.rounds_started} omgångar påbörjade, ${pct(s.share_of_rounds_finished)} blev klara${s.average_result != null ? `, medelresultat ${Math.round(s.average_result)} %` : ''}`);
      }
      if (s.average_minutes_played != null) lines.push(`– i snitt ${String(s.average_minutes_played).replace('.', ',')} minuter per besök`);
      const levels = s.levels || [];
      const top = levels.reduce((m, l) => (l.reached > (m?.reached || 0) ? l : m), null);
      const furthest = levels.filter((l) => l.reached).at(-1);
      if (furthest) lines.push(`– längst kom någon till nivå ${furthest.level}`);
      const stop = levels.reduce((m, l) => (l.stopped_here > (m?.stopped_here || 0) ? l : m), null);
      if (stop) lines.push(`– flest slutade på nivå ${stop.level} (${stop.stopped_here} gånger)`);
      if (s.hints) lines.push(`– ${s.hints} ${s.hints === 1 ? 'ledtråd' : 'ledtrådar'} eller nya försök`);
      if (s.voice?.share_recorded != null) lines.push(`– uppläsning: ${pct(s.voice.share_recorded)} inspelad (${s.voice.recorded + s.voice.browser} repliker)`);
      const idea = s.voice?.share_recorded != null && s.voice.share_recorded < 0.5
        ? 'Det mesta appen säger läses av webbläsarens röst. Spela in hela meningarna, också de som byggs av appens data (guidens avsnitt resurser).'
        : s.rounds_started >= 5 && s.share_of_rounds_finished < 0.5
        ? 'Många avbryter omgången. Kanske är den för lång eller för svår i början?'
        : stop && top && stop.stopped_here >= 3 && stop.level === furthest?.level && furthest.level > 1
          ? `Ingen kommer förbi nivå ${stop.level}. Är steget dit för stort?`
          : s.rounds_started >= 5 && s.share_of_rounds_finished >= 0.9 && (s.average_result ?? 0) >= 90
            ? 'Nästan alla klarar allt. Dags för en svårare nivå?'
            : null;
      if (idea) lines.push(`Idé till nästa version: ${idea}`);
    }
    lines.push(`${siteUrl}/app/${a.id}`);
    return lines.join('\n');
  });
  const subject = apps.length === 1 ? `Veckan för ${apps[0].title} – Skolappar` : 'Veckan för era appar – Skolappar';
  return {
    subject,
    text:
      `Hej!\n\nSå här gick det för ${apps.length === 1 ? 'er app' : 'era appar'} de senaste sju dagarna:\n\n${blocks.join('\n\n')}\n\n` +
      `Siffrorna är antal och snitt, inget om enskilda barn. Er agent kan läsa samma sak med app_stats på ${siteUrl}/mcp.\n\n` +
      `Vill ni inte ha veckobrevet? ${siteUrl}/brev/av/${stopToken}\n\n– Skolappar`,
  };
}
