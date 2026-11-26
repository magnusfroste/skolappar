// The terms for makers and the five mails to them, as files under server/content/ (villkor.md,
// mail/*.md) so they are read and changed as text. A template has a front matter (subject, when)
// and a body; {{name}} is filled in when the mail is made. This module only reads and renders –
// who gets what, and when, is in the store (sendBroadcast, maybeSendFollowUps).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'content');

function parse(text) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text.replace(/\r\n?/g, '\n'));
  const head = m ? m[1] : '';
  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(head)?.[1].trim() || '';
  return { field, body: (m ? m[2] : text).trim() };
}

const termsFile = parse(readFileSync(join(root, 'villkor.md'), 'utf8'));
/** The terms makers accept when they submit: {version (a date), markdown}. */
export const TERMS = { version: termsFile.field('version'), markdown: termsFile.body };

/**
 * The mails, in the order a maker meets them. `auto`: sent by the server on its own; otherwise an
 * admin sends it (preview and dry run first). `stoppable`: the stop link in the mail turns it off.
 */
export const MAILINGS = [
  { id: 'godkand', auto: true, stoppable: false, schedule: 'När appen godkänns och e-postadressen är bekräftad' },
  { id: 'en-vecka', auto: true, stoppable: true, schedule: '7 dagar efter publiceringen', days: 7 },
  { id: 'en-manad', auto: true, stoppable: true, schedule: '30 dagar efter publiceringen', days: 30 },
  { id: 'villkor', auto: false, stoppable: false, schedule: 'När villkoren ändras, minst 30 dagar innan de nya gäller – en gång per version' },
  { id: 'nyheter', auto: false, stoppable: true, schedule: 'När det finns nyheter, högst ungefär en gång i månaden – en gång per utskick' },
].map((m) => {
  const t = parse(readFileSync(join(root, 'mail', `${m.id}.md`), 'utf8'));
  return { ...m, subject: t.field('subject'), when: t.field('when'), body: t.body };
});

export const mailing = (id) => MAILINGS.find((m) => m.id === id) || null;

/** The placeholders a template may use, besides those a broadcast adds (andringar, galler_fran). */
export const PLACEHOLDERS = {
  namn: 'förnamnet den som skickade in angav',
  app: 'appens namn (vid flera appar: den första)',
  appar: '"appen X" eller "apparna X, Y och Z"',
  lank: 'appens sida på Skolappar',
  statistik: 'en mening om hur appen har använts (en vecka, en månad)',
  webbplats: 'https://www.skolappar.org',
  av: 'länken som stänger av veckobrev, uppföljningar och nyheter',
  shipholm: 'ett stycke om Shipholm för appar som ligger någon annanstans (tomt för appar på Shipholm)',
  andringar: 'vad som ändras i villkoren (skrivs vid utskicket)',
  galler_fran: 'datumet de nya villkoren gäller från (skrivs vid utskicket)',
};

/**
 * Fill in a template. An empty value takes the space before it along ("Hej {{namn}}!" -> "Hej!");
 * an unknown placeholder is left as it is, so a preview shows it.
 */
export function render({ subject, body }, vars) {
  const fill = (s) => String(s).replace(/( ?)\{\{\s*([a-z_]+)\s*\}\}/g, (all, space, key) => {
    if (!(key in vars)) return all;
    const v = vars[key] == null ? '' : String(vars[key]);
    return v ? space + v : '';
  });
  return { subject: fill(subject).trim(), text: fill(body).replace(/\n{3,}/g, '\n\n') };
}

/** "appen X" / "apparna X och Y" / "apparna X, Y och Z". */
export function appsPhrase(titles) {
  if (titles.length <= 1) return `appen ${titles[0] || ''}`.trim();
  return `apparna ${titles.slice(0, -1).join(', ')} och ${titles.at(-1)}`;
}

/**
 * Does the app already run on Shipholm? Its address is <name>.shipholm.dev, or <name>.skolappar.org,
 * which only an app on Shipholm gets (origin_url keeps where it came from).
 */
export function onShipholm(...urls) {
  return urls.some((u) => {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return h.endsWith('.shipholm.dev') || ['skolappar.org', 'skolappar.com'].some((d) => h.endsWith(`.${d}`) && h !== `www.${d}`);
    } catch { return false; }
  });
}

/**
 * What a maker whose app runs elsewhere gets by moving it to Shipholm – one paragraph for the mails
 * (the {{shipholm}} placeholder), empty for an app that is already there. An offer, never a demand.
 */
export function shipholmOffer({ app }) {
  return 'Ligger appen någon annanstans? Med ett gratis Shipholm-konto (europeisk drift) får den adressen ' +
    `namn.skolappar.org och kan läsa upp med en riktig svensk röst. Säg till din AI-agent: "Lägg ut ${app} på Shipholm ` +
    'med Skolappars publish_on_shipholm." Du godkänner kontot själv i webbläsaren. Appen får lika gärna ligga kvar där den är.';
}
