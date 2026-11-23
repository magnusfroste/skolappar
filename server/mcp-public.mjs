// The open part of the MCP endpoint: what any agent may do without a key. A parent's agent reads
// the catalogue, submits the app it built, follows the review and reads how the app is used.
// submit_app hands out a key for that one app; update_my_app and withdraw_my_app take it.
import { createHash, randomBytes } from 'node:crypto';
import { POINT_ID, AREA_ID } from './curriculum.mjs';
import { GUIDE_SECTIONS, guideMarkdown, guideSectionIds } from './guide.mjs';

const uuid = { type: 'string', format: 'uuid' };
const obj = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const RO = { readOnlyHint: true, openWorldHint: false };
const RW = { readOnlyHint: false, openWorldHint: false };

// A first name only: nobody is identified by it. Letters (any alphabet), hyphen, apostrophe.
const FIRST_NAME = '^[\\p{L}][\\p{L}\'’-]{0,39}$';

export const PUBLIC_INSTRUCTIONS =
  'Skolappar.com är en katalog med pedagogiska webbappar som föräldrar byggt, ofta tillsammans med sina barn. ' +
  'Du behöver ingen nyckel. Arbetsgången finns som skills (list_skills, get_skill) och en färdig startmall med get_starter. Läs get_guide INNAN du bygger: den säger vad en skolapp ska klara (iPad och touch, inget konto, ' +
  'svenska, återkoppling) och slutar med en checklista. Gör så här när appen är byggd och ligger på en egen https-adress: ' +
  '0) check_app – kontrollera adressen och rätta det som är fail. ' +
  'Välj vad appen ska träna med get_curriculum (Lgr22) och ange punkterna som curriculum_ids. ' +
  '1) list_categories – välj ämne, årskurs och typ. 2) list_apps – se att appen inte redan finns. ' +
  '3) submit_app – skicka in den med förälderns förnamn och e-postadress. Spara app_key ur svaret: den visas en gång. ' +
  '4) Be föräldern klicka på länken i mejlet från Skolappar; utan det publiceras appen inte. ' +
  '5) app_status – appar granskas en gång om dagen. 6) app_stats – berätta för barnet hur många som har spelat. ' +
  'Saknas en idé? list_ideas visar vad lärare och föräldrar önskar sig.';

/** Tools open to everyone. `fail` throws the caller's ToolFailure; ctx carries the request's rate limit. */
export function createPublicTools({ store, images, checkApp, content, curriculum, siteUrl, fail, imageHint, categoryHint }) {
  const curriculumIds = { type: 'array', items: { type: 'string', pattern: POINT_ID }, maxItems: 8, description: 'Vad i läroplanen (Lgr22) appen tränar: id för en till tre punkter i det centrala innehållet, från get_curriculum. Välj bara det appen faktiskt övar.' };
  const linkCurriculum = (id, ids) => {
    const unknown = store.setCurriculum(id, ids);
    if (unknown.length) fail(`Okända punkter i Lgr22: ${unknown.join(', ')}. Hämta id med get_curriculum.`);
  };
  const own = ({ id, app_key }) => {
    if (!store.appKeyMatches(id, app_key)) fail('Fel app eller nyckel. Nyckeln är den som submit_app svarade med.');
    return store.getApp(id, { admin: true });
  };
  const publicView = (a) => a && {
    id: a.id, title: a.title, description: a.description, long_description: a.long_description, url: a.url,
    curriculum: a.curriculum,
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
      name: 'get_starter',
      title: 'Hämta startmallen',
      description:
        'Startmallen: en liten färdig skolapp i ren HTML, CSS och JavaScript (inget byggsteg) där touch för iPad, omgångar, återkoppling, ' +
        'svårighet, ljud, uppläsning, belöning och sparning på enheten redan finns. Svarar med alla filer som text. ' +
        'Skriv dem till en mapp, byt tasks.js (innehållet) och låt app.js (motorn) vara. README.md säger hur.',
      inputSchema: obj({}),
      annotations: RO,
      handler: () => ({
        demo: `${siteUrl}/starter/`,
        license: 'Fri att använda och ändra.',
        files: (content?.starter || []).map(({ path, content: text }) => ({ path, content: text })),
      }),
    },
    {
      name: 'list_skills',
      title: 'Lista skills',
      description: 'Skolappars skills för agenter (formatet SKILL.md): bygga en skolapp, publicera den och göra kortbilden. Hämta en med get_skill.',
      inputSchema: obj({}),
      annotations: RO,
      handler: () => (content?.skills || []).map((s) => ({ name: s.name, description: s.description, url: `${siteUrl}/skills/${s.name}/SKILL.md` })),
    },
    {
      name: 'get_skill',
      title: 'Hämta en skill',
      description: 'En skill som text (SKILL.md), att följa direkt eller spara i agentens skills-mapp som <name>/SKILL.md.',
      inputSchema: obj({ name: { type: 'string', minLength: 1, maxLength: 60 } }, ['name']),
      annotations: RO,
      handler: ({ name }) => {
        const skill = content?.skill(name) ?? fail('Ingen skill med det namnet. Se list_skills.');
        return { name: skill.name, description: skill.description, markdown: skill.content };
      },
    },
    {
      name: 'get_curriculum',
      title: 'Läroplanen (Lgr22): centralt innehåll',
      description:
        'Det centrala innehållet i grundskolans kursplaner (Lgr22), från Skolverkets öppna data. Utan argument: ämnena med stadier (1-3, 4-6, 7-9) och områden. ' +
        'Med subject, stage, area eller search: punkterna, var och en med ett id (t.ex. MA.1-3.1.2). Använd det för att välja vad appen ska träna innan du bygger, ' +
        'och ange sedan id:n som curriculum_ids i submit_app. Skolappars årskurser: FK–2 och delar av 3–6 hör till stadiet 1-3, 3–6 annars till 4-6.',
      inputSchema: obj({
        subject: { type: 'string', maxLength: 40, description: 'Ämnets kod eller namn, t.ex. MA eller Matematik.' },
        stage: { type: 'string', enum: ['1-3', '4-6', '7-9', '1-6'], description: 'Stadium. Hem- och konsumentkunskap har 1-6.' },
        area: { type: 'string', pattern: AREA_ID, description: 'Ett områdes id, t.ex. MA.1-3.1.' },
        search: { type: 'string', minLength: 2, maxLength: 80, description: 'Ord som ska finnas i punkten eller områdets namn, t.ex. bråk eller klockan.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 60 },
      }),
      annotations: RO,
      handler: ({ subject, stage, area, search, limit = 60 }) => {
        if (!curriculum) fail('Läroplanen är inte tillgänglig just nu.');
        const source = `Skolverket, ${curriculum.source.name} (hämtad ${curriculum.source.fetched})`;
        if (!subject && !stage && !area && !search) return { source, subjects: curriculum.overview() };
        return { source, points: curriculum.search({ subject, stage, area, q: search, limit }) };
      },
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
        'Kortbild sätts efteråt med set_my_app_image.',
      inputSchema: obj({
        url: { type: 'string', format: 'uri', maxLength: 2048, description: 'Appens adress (https).' },
        title: { type: 'string', minLength: 2, maxLength: 120, description: 'Appens namn, två till fyra ord.' },
        description: { type: 'string', minLength: 10, maxLength: 500, description: 'Vad man övar på och hur, i en eller två meningar.' },
        long_description: { type: 'string', maxLength: 10000, description: 'Valfri längre text: hur appen fungerar och gärna vad i läroplanen (Lgr22) den tränar.' },
        first_name: { type: 'string', pattern: FIRST_NAME, description: 'Förälderns förnamn – bara förnamnet, inget efternamn och inte barnets namn.' },
        email: { type: 'string', format: 'email', maxLength: 254, description: 'Förälderns e-postadress, för bekräftelse och besked.' },
        category_ids: { type: 'array', items: uuid, maxItems: 20, description: categoryHint },
        curriculum_ids: curriculumIds,
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
        const unknownPoints = input.curriculum_ids ? store.setCurriculum(id, input.curriculum_ids) : [];
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
          ...(unknownPoints.length ? { unknown_curriculum_ids: unknownPoints } : {}),
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
      name: 'set_my_app_image',
      title: 'Sätt kortbilden på min app',
      description:
        'Sätter bilden som visas på appens kort, med appens app_key. Tre sätt: svg (bilden som SVG-text, det enklaste för en ritad bild), ' +
        'image_url (en bild på en publik adress, laddas ner) eller – för en bildfil som en skärmdump – ladda upp filen direkt: ' +
        `curl -X PUT --data-binary @bild.png -H "X-App-Key: <app_key>" ${siteUrl}/api/apps/<id>/image (png, jpg, webp, gif, avif eller svg, högst 10 MB). ` +
        'Går så länge appen väntar på granskning eller har avslagits. Utan bild får kortet ämnets färg och symbol. ' + imageHint,
      inputSchema: obj({
        id: uuid,
        app_key: { type: 'string', minLength: 10, maxLength: 100 },
        svg: { type: 'string', minLength: 20, maxLength: 400000, description: 'Hela SVG-dokumentet, från <svg …> till </svg>. viewBox i 4:3, t.ex. 0 0 1200 900. Inga skript och inga externa bilder eller typsnitt.' },
        image_url: { type: 'string', format: 'uri', maxLength: 2048 },
      }, ['id', 'app_key']),
      annotations: { ...RW, openWorldHint: true },
      handler: async ({ id, app_key, svg, image_url }) => {
        own({ id, app_key });
        if (Boolean(svg) === Boolean(image_url)) fail('Ange svg eller image_url (en av dem). En bildfil laddas upp med PUT enligt beskrivningen.');
        let saved;
        try {
          if (svg) {
            if (/<script|\son\w+\s*=|<foreignObject|href\s*=\s*["'](?!#|data:image\/)/i.test(svg)) fail('SVG-bilden får inte innehålla skript, händelser, foreignObject eller länkar till andra adresser.');
            saved = images.save(Buffer.from(svg, 'utf8'));
          } else {
            saved = await images.download(image_url);
          }
        } catch (err) {
          if (err.constructor?.name === 'ToolFailure') throw err;
          fail(`Bilden kunde inte sparas: ${err.message}`);
        }
        const out = store.setOwnImage(id, app_key, saved.url);
        if (out.error) fail('Appen är publicerad och kan inte ändras här. Dra tillbaka den (withdraw_my_app) och skicka in på nytt.');
        return { ...out, image_url: `${siteUrl}${saved.url}` };
      },
    },
    {
      name: 'update_my_app',
      title: 'Ändra min inskickade app',
      description:
        'Ändra text eller kategorier (kortbilden: set_my_app_image) på en app du skickat in, med dess app_key. Går så länge appen väntar på granskning, eller har avslagits ' +
        '(den ställs då i kö igen). En publicerad app ändras inte här: dra tillbaka den och skicka in på nytt. ' + imageHint,
      inputSchema: obj({
        id: uuid,
        app_key: { type: 'string', minLength: 10, maxLength: 100 },
        title: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', minLength: 10, maxLength: 500 },
        long_description: { type: 'string', maxLength: 10000 },
        category_ids: { type: 'array', items: uuid, maxItems: 20, description: `Ersätter appens samtliga kategorier. ${categoryHint}` },
        curriculum_ids: { ...curriculumIds, description: `Ersätter appens koppling till Lgr22. ${curriculumIds.description}` },
        image_url: { type: 'string', format: 'uri', maxLength: 2048, description: 'En bild på en publik adress; den laddas ner och sparas hos Skolappar.' },
      }, ['id', 'app_key']),
      annotations: { ...RW, openWorldHint: true },
      handler: async ({ id, app_key, category_ids, curriculum_ids, image_url, ...fields }) => {
        const app = own({ id, app_key });
        if (!['pending', 'rejected'].includes(app.status)) {
          fail('Appen är publicerad och kan inte ändras här. Dra tillbaka den (withdraw_my_app) och skicka in på nytt.');
        }
        const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
        if (image_url) patch.image_url = (await images.download(image_url)).url;
        if (app.status === 'rejected') patch.status = 'pending';
        if (!Object.keys(patch).length && !category_ids && !curriculum_ids) fail('Inget att ändra.');
        if (curriculum_ids) linkCurriculum(id, curriculum_ids);
        if (Object.keys(patch).length || category_ids) store.updateApp(id, patch, category_ids);
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
