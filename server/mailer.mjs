// Outgoing mail. Without configuration it only logs what it would have sent.
//
// Configure an HTTP mail API (Resend-compatible JSON) with:
//   MAIL_API_URL  e.g. https://api.resend.com/emails
//   MAIL_API_KEY  sent as "Authorization: Bearer <key>"
//   MAIL_FROM     e.g. "Skolappar <hej@skolappar.com>"
// The request body is {from, to: [address], subject, text, html}.
// Recipient addresses are never logged.

export function createMailer(env = process.env, { fetchImpl = globalThis.fetch, log = console } = {}) {
  const url = env.MAIL_API_URL;
  const key = env.MAIL_API_KEY;
  const from = env.MAIL_FROM;
  const configured = Boolean(url && key && from);

  async function send({ to, subject, text, html }) {
    if (!configured) {
      log.info?.(`mail not configured – would send "${subject}"`);
      return { sent: false, reason: 'not_configured' };
    }
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, ...(html ? { html } : {}) }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        log.error?.(`mail "${subject}" failed: HTTP ${res.status}`);
        return { sent: false, reason: `http_${res.status}` };
      }
      return { sent: true };
    } catch (err) {
      log.error?.(`mail "${subject}" failed: ${err?.name || 'error'}`);
      return { sent: false, reason: 'error' };
    }
  }

  return { configured, send };
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
