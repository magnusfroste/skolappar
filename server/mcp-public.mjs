// The open part of the MCP endpoint: what any agent may do without a key. A parent's agent reads
// the catalogue, submits the app it built, follows the review and reads how the app is used.
// submit_app hands out a key for that one app; update_my_app and withdraw_my_app take it.
import { createHash, randomBytes } from 'node:crypto';
import { GUIDE_SECTIONS, guideMarkdown, guideSectionIds } from './guide.mjs';

const uuid = { type: 'string', format: 'uuid' };
const obj = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const RO = { readOnlyHint: true, openWorldHint: false };
const RW = { readOnlyHint: false, openWorldHint: false };

// A first name only: nobody is identified by it. Letters (any alphabet), hyphen, apostrophe.
const FIRST_NAME = '^[\\p{L}][\\p{L}\'’-]{0,39}$';

export const PUBLIC_INSTRUCTIONS =
  'Skolappar.com är en katalog med pedagogiska webbappar som föräldrar byggt, ofta tillsammans med sina barn. ' +
  'Du behöver ingen nyckel. Läs get_guide INNAN du bygger: den säger vad en skolapp ska klara (iPad och touch, inget konto, ' +
  'svenska, återkoppling) och slutar med en checklista. Gör så här när appen är byggd och ligger på en egen https-adress: ' +
  '0) check_app – kontrollera adressen och rätta det som är fail. ' +
  '1) list_categories – välj ämne, årskurs och typ. 2) list_apps – se att appen inte redan finns. ' +
  '3) submit_app – skicka in den med förälderns förnamn och e-postadress. Spara app_key ur svaret: den visas en gång. ' +
  '4) Be föräldern klicka på länken i mejlet från Skolappar; utan det publiceras appen inte. ' +
  '5) app_status – appar granskas en gång om dagen. 6) app_stats – berätta för barnet hur många som har spelat. ' +
  'Saknas en idé? list_ideas visar vad lärare och föräldrar önskar sig.';

/** Tools open to everyone. `fail` throws the caller's ToolFailure; ctx carries the request's rate limit. */
export function createPublicTools({ store, images, checkApp, fail, imageHint, categoryHint }) {
  const own = ({ id, app_key }) => {
    if (!store.appKeyMatches(id, app_key)) fail('Fel app eller nyckel. Nyckeln är den som submit_app svarade med.');
    return store.getApp(id, { admin: true });
  };
  const publicView = (a) => a && {
    id: a.id, title: a.title, description: a.description, long_description: a.long_description, url: a.url,
    image_url: a.image_url, creator_name: a.creator_name, opens: a.clicks_count, likes: a.upvotes_count,
    categories: a.categories, created_at: a.created_at,
  };

  return [
    {
      name: 'get_guide',
      title: 'Så bygger du en skolapp',
      description:
        'Byggguiden: vad en skolapp ska klara för att fungera för barnen och bli godkänd. Läs den innan du bygger och gå igenom ' +
        'avsnittet checklista före submit_app. Utan section kommer hela guiden (Markdown); med section ett avsnitt: ' +
        GUIDE_SECTIONS.map((s) => `${s.id} (${s.title})`).join(', ') + '.',
      inputSchema: obj({ section: { type: 'string', enum: guideSectionIds() } }),
      annotations: RO,
      handler: ({ section }) => ({
        url: 'https://www.skolappar.com/bygg',
        sections: GUIDE_SECTIONS.map((s) => ({ id: s.id, title: s.title })),
        markdown: guideMarkdown(section),
      }),
    },
    {
      name: 'list_categories',
      title: 'Lista kategorier',
      description: 'Ämnen (subject), årskurser (age), typer (app_type) och enheter (device) med id att ange i submit_app.',
      inputSchema: obj({ type: { type: 'string', enum: ['subject', 'age', 'app_type', 'device'] } }),
      annotations: RO,
      handler: ({ type }) => store.listCategories({ type }).sort((a, b) => a.type.localeCompare(b.type) || a.sort_order - b.sort_order)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug, type: c.type, description: c.description })),
    },
    {
      name: 'list_apps',
      title: 'Lista publicerade appar',
      description: 'Apparna i katalogen, för inspiration och för att se om en app redan finns. Sök i titel och beskrivning, filtrera på ämne och årskurs (slug).',
      inputSchema: obj({
        search: { type: 'string', minLength: 1, maxLength: 100 },
        subject: { type: 'string', maxLength: 60, description: 'Ämnets slug, t.ex. matte.' },
        age: { type: 'string', maxLength: 60, description: 'Årskursens slug, t.ex. fk-2.' },
        sort: { type: 'string', enum: ['newest', 'popular', 'clicks'], default: 'popular' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      }),
      annotations: RO,
      handler: ({ search, subject, age, sort = 'popular', limit = 50 }) =>
        store.listPublicApps({ search, subjects: subject ? [subject] : undefined, ages: age ? [age] : undefined, sort })
          .slice(0, limit).map(publicView),
    },
    {
      name: 'get_app',
      title: 'Hämta en publicerad app',
      description: 'En app i katalogen med beskrivning och kategorier.',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: RO,
      handler: ({ id }) => publicView(store.getApp(id)) ?? fail('Appen finns inte i katalogen. En inskickad app som väntar: använd app_status.'),
    },
    {
      name: 'list_ideas',
      title: 'Lista app-idéer',
      description: 'Idéer som lärare och föräldrar önskar sig. status open = ingen bygger den än.',
      inputSchema: obj({
        status: { type: 'string', enum: ['open', 'claimed', 'built'], default: 'open' },
        search: { type: 'string', minLength: 1, maxLength: 100 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
      }),
      annotations: RO,
      handler: ({ status = 'open', search, limit = 25 }) => store.listIdeas({ status, search, limit }),
    },
    {
      name: 'list_resources',
      title: 'Lista resurser',
      description: 'Skolappars artiklar och tips för den som bygger en app. with_content ger hela texten (Markdown).',
      inputSchema: obj({
        category: { type: 'string', minLength: 1, maxLength: 60 },
        with_content: { type: 'boolean', default: false },
      }),
      annotations: RO,
      handler: ({ category, with_content = false }) => store.listResources({ category, publishedOnly: true, withContent: with_content }),
    },
    {
      name: 'check_app',
      title: 'Kontrollera en app mot byggguiden',
      description:
        'Öppnar appens adress och svarar med en lista: https, öppnas utan inloggning, titel, lang, viewport, ikon, reklam eller spårning, ' +
        'skript från andra webbplatser, länkar ut, touch-action och vikt. Varje punkt är ok, warn eller fail och pekar på ett avsnitt i get_guide. ' +
        'Kör den före submit_app, rätta det som är fail och kör igen. Kontrollen spelar inte appen: not_checked säger vad den inte ser.',
      inputSchema: obj({
        url: { type: 'string', format: 'uri', maxLength: 2048, description: 'Appens adress (https).' },
        id: { ...uuid, description: 'I stället för url: en app i katalogen eller kön. Resultatet sparas på appen (kräver administrationsnyckel).' },
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async ({ url, id }, ctx) => {
        if (!checkApp) fail('Kontrollen är inte tillgänglig just nu.');
        if (id) {
          if (ctx.role !== 'admin') fail('Kontroll med id kräver administrationsnyckel. Ange appens url.');
          const app = store.getApp(id, { admin: true }) ?? fail('Appen hittades inte.');
          const result = await checkApp(app.url);
          store.saveCheck(id, result);
          return result;
        }
        if (!url) fail('Ange appens url.');
        const limit = ctx.checkAllowed?.();
        if (limit && !limit.ok) fail(`För många kontroller härifrån just nu. Försök igen om ${Math.ceil((limit.retryAfter || 3600) / 60)} minuter.`);
        return checkApp(url);
      },
    },
    {
      name: 'submit_app',
      title: 'Skicka in en app',
      description:
        'Skicka in en app du har byggt och lagt ut på en egen https-adress. Den granskas (en gång om dagen) och publiceras sedan i katalogen. ' +
        'Kräver förälderns förnamn och e-postadress: föräldern får ett mejl med en länk att klicka på, och appen publiceras inte förrän det är gjort. ' +
        'Bara förnamnet visas; adressen visas aldrig. Svaret innehåller app_key – spara den, den visas bara nu – för update_my_app och withdraw_my_app. ' +
        'Kortbild sätts efteråt med update_my_app.',
      inputSchema: obj({
        url: { type: 'string', format: 'uri', maxLength: 2048, description: 'Appens adress (https).' },
        title: { type: 'string', minLength: 2, maxLength: 120, description: 'Appens namn, två till fyra ord.' },
        description: { type: 'string', minLength: 10, maxLength: 500, description: 'Vad man övar på och hur, i en eller två meningar.' },
        long_description: { type: 'string', maxLength: 10000, description: 'Valfri längre text: hur appen fungerar och gärna vad i läroplanen (Lgr22) den tränar.' },
        first_name: { type: 'string', pattern: FIRST_NAME, description: 'Förälderns förnamn – bara förnamnet, inget efternamn och inte barnets namn.' },
        email: { type: 'string', format: 'email', maxLength: 254, description: 'Förälderns e-postadress, för bekräftelse och besked.' },
        category_ids: { type: 'array', items: uuid, maxItems: 20, description: categoryHint },
        note: { type: 'string', maxLength: 2000, description: 'Valfritt meddelande till den som granskar.' },
      }, ['url', 'title', 'description', 'first_name', 'email']),
      annotations: RW,
      handler: (input, ctx) => {
        if (!/^https:\/\//i.test(input.url)) fail('Appens adress måste börja med https://.');
        const listed = store.listedAt(input.url);
        if (listed) fail(`Appen finns redan i katalogen (id ${listed}).`);
        const limit = ctx.submitAllowed?.();
        if (limit && !limit.ok) fail(`För många inskick härifrån just nu. Försök igen om ${Math.ceil((limit.retryAfter || 3600) / 60)} minuter.`);
        const appKey = `sapp_${randomBytes(24).toString('base64url')}`;
        const { id, unknown_category_ids } = store.createSubmission({
          url: input.url, email: input.email, title: input.title, description: input.description,
          long_description: input.long_description, note: input.note, creator_name: input.first_name,
          categoryIds: input.category_ids, keyHash: createHash('sha256').update(appKey).digest('hex'),
        });
        store.sendConfirmation(id).catch(() => {});
        // the reviewer sees the outcome next to the submission; app_status shows it to the agent
        checkApp?.(input.url).then((result) => store.saveCheck(id, result)).catch(() => {});
        return {
          id, app_key: appKey, status: 'pending',
          next: [
            `Be ${input.first_name} öppna mejlet från Skolappar och klicka på länken. Utan det publiceras appen inte.`,
            'Appar granskas en gång om dagen. Läs läget med app_status.',
            'Spara app_key: den visas inte igen.',
          ],
          ...(unknown_category_ids.length ? { unknown_category_ids } : {}),
        };
      },
    },
    {
      name: 'app_status',
      title: 'Var är min app i granskningen?',
      description: 'Läget för en inskickad app: pending (väntar), approved eller featured (publicerad), rejected eller delisted (med skäl), och om e-postadressen är bekräftad.',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: RO,
      handler: ({ id }) => store.appStatus(id) ?? fail('Ingen app med det id:t.'),
    },
    {
      name: 'app_stats',
      title: 'Hur används appen?',
      description:
        'Öppningar i dag, senaste 7 och 30 dagarna och totalt, gilla-markeringar, placering i sitt ämne och öppningar per dag i 30 dagar (UTC). ' +
        'Öppet för alla publicerade appar. En öppning är inte en unik besökare; ingenting om enskilda besökare finns.',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: RO,
      handler: ({ id }) => store.appStats(id) ?? fail('Appen är inte publicerad (än). Läs läget med app_status.'),
    },
    {
      name: 'update_my_app',
      title: 'Ändra min inskickade app',
      description:
        'Ändra text, kategorier eller kortbild på en app du skickat in, med dess app_key. Går så länge appen väntar på granskning, eller har avslagits ' +
        '(den ställs då i kö igen). En publicerad app ändras inte här: dra tillbaka den och skicka in på nytt. ' + imageHint,
      inputSchema: obj({
        id: uuid,
        app_key: { type: 'string', minLength: 10, maxLength: 100 },
        title: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', minLength: 10, maxLength: 500 },
        long_description: { type: 'string', maxLength: 10000 },
        category_ids: { type: 'array', items: uuid, maxItems: 20, description: `Ersätter appens samtliga kategorier. ${categoryHint}` },
        image_url: { type: 'string', format: 'uri', maxLength: 2048, description: 'En bild på en publik adress; den laddas ner och sparas hos Skolappar.' },
      }, ['id', 'app_key']),
      annotations: { ...RW, openWorldHint: true },
      handler: async ({ id, app_key, category_ids, image_url, ...fields }) => {
        const app = own({ id, app_key });
        if (!['pending', 'rejected'].includes(app.status)) {
          fail('Appen är publicerad och kan inte ändras här. Dra tillbaka den (withdraw_my_app) och skicka in på nytt.');
        }
        const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
        if (image_url) patch.image_url = (await images.download(image_url)).url;
        if (app.status === 'rejected') patch.status = 'pending';
        if (!Object.keys(patch).length && !category_ids) fail('Inget att ändra.');
        store.updateApp(id, patch, category_ids);
        return store.appStatus(id);
      },
    },
    {
      name: 'withdraw_my_app',
      title: 'Dra tillbaka min app',
      description: 'Ta bort en app du skickat in, med dess app_key. En app som väntar raderas; en publicerad avlistas och försvinner ur katalogen.',
      inputSchema: obj({ id: uuid, app_key: { type: 'string', minLength: 10, maxLength: 100 } }, ['id', 'app_key']),
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
      handler: ({ id, app_key }) => {
        const app = own({ id, app_key });
        if (['approved', 'featured'].includes(app.status)) {
          store.updateApp(id, { status: 'delisted', delist_reason: 'Tillbakadragen av skaparen' });
          return { id, withdrawn: true, status: 'delisted' };
        }
        store.deleteApp(id);
        return { id, withdrawn: true, status: 'deleted' };
      },
    },
  ];
}
