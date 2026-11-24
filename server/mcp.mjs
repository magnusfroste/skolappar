// MCP endpoint (POST /mcp): JSON-RPC 2.0 over "streamable HTTP" with plain JSON
// responses. Two faces on one address: without a key, the open tools of mcp-public.mjs (read the
// catalogue, submit an app, follow it); with the admin or an agent key, the administration below
// (ported from the old Supabase mcp-key function, minus users, roles and comments) plus the
// open tools that have no admin counterpart.
import { POINT_ID } from './curriculum.mjs';
import { editMarkdown } from './markdown.mjs';
import { IMAGE_HINT } from './guide.mjs';
import { validate, ValidationError } from './validate.mjs';
import { APP_STATUSES, IDEA_STATUSES } from './store.mjs';
import { createPublicTools, PUBLIC_INSTRUCTIONS } from './mcp-public.mjs';

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const uuid = { type: 'string', format: 'uuid' };
const CATEGORY_HINT =
  'Appens kategorier. Ange exakt en av varje typ: subject (ämne), age (årskurs) och app_type (typ), ' +
  'gärna även device. Hämta id:n med list_categories. Utan rätt kategorier syns inte appen i startsidans filter.';

const obj = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const RO = { readOnlyHint: true, openWorldHint: false };
const RW = { readOnlyHint: false, openWorldHint: false };
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, openWorldHint: false };

const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

export function createTools({ store, images }) {
  const tools = [
    {
      name: 'platform_stats',
      title: 'Plattformsöversikt',
      description: 'Nyckeltal: antal appar per status, idéer, resurser, röster och klick.',
      inputSchema: obj({}),
      annotations: { ...RO, idempotentHint: true },
      handler: () => store.platformStats(),
    },
    {
      name: 'app_analytics',
      title: 'Apparnas öppningsstatistik',
      description:
        'Appöppningar för 7, 30 eller 90 UTC-kalenderdagar, daglig utveckling och upp till 100 appar sorterade efter öppningar. ' +
        'Öppningar är inte unika besökare. Äldre klick ingår bara i total_opens; tidsserien börjar 18 november 2026.',
      inputSchema: obj({ days: { type: 'integer', enum: [7, 30, 90], default: 7, description: 'Antal UTC-kalenderdagar inklusive idag.' } }),
      annotations: { ...RO, idempotentHint: true },
      handler: ({ days }) => store.appAnalytics(days),
    },
    {
      name: 'list_submissions',
      title: 'Lista inskickade tips',
      description:
        'Appar som besökare eller deras agenter skickat in och som väntar på granskning (status pending), äldst först, med tipsarens e-post, ' +
        'om adressen är bekräftad, tipsarens meddelande och mail (utfallet av bekräftelse- och publiceringsmejlet: ' +
        'status sent, not_configured eller failed med reason och tid) och check (den automatiska kontrollen mot byggguiden: passed, failed, warnings; ' +
        'kör om den med check_app och appens id). Godkänn med update_app (status approved) efter att ha provat appen – ' +
        'och bara när email_confirmed är true: en obekräftad adress betyder att föräldern inte har klickat på länken i mejlet än.',
      inputSchema: obj({ limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 } }),
      annotations: RO,
      handler: ({ limit }) => store.listAdminApps({ status: 'pending', limit: 1000 })
        .sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, limit),
    },
    {
      name: 'list_changes',
      title: 'Lista ändringar som väntar',
      description:
        'Ändringar som skaparna föreslagit för publicerade appar (text, kategorier, Lgr22, kortbild), äldst först, med den publicerade versionen bredvid. ' +
        'Den publicerade versionen ligger kvar tills ändringen godkänns med review_change.',
      inputSchema: obj({}),
      annotations: RO,
      handler: () => store.listChanges(),
    },
    {
      name: 'review_change',
      title: 'Godkänn eller avslå en ändring',
      description: 'approve true: ändringen ersätter den publicerade versionen. approve false: ändringen kastas och reason visas för skaparens agent i app_status.',
      inputSchema: obj({ id: uuid, approve: { type: 'boolean' }, reason: { type: 'string', maxLength: 500 } }, ['id', 'approve']),
      annotations: RW,
      handler: ({ id, approve, reason }) => {
        if (!approve && !reason) return fail('Ange reason när en ändring avslås: skaparens agent behöver veta vad som ska rättas.');
        return store.reviewChange(id, approve, reason) ?? fail('Ingen ändring väntar för den appen.');
      },
    },
    {
      name: 'resend_mail',
      title: 'Skicka mejl till tipsaren igen',
      description:
        'Skicka bekräftelsemejlet (kind confirm, bara om adressen inte är bekräftad) eller publiceringsmejlet ' +
        '(kind published, bara för publicerade appar med bekräftad adress) till tipsaren igen. Returnerar utfallet och appen.',
      inputSchema: obj({ id: uuid, kind: { type: 'string', enum: ['confirm', 'published'] } }, ['id', 'kind']),
      annotations: RW,
      handler: async ({ id, kind }) => {
        const out = await store.resendMail(id, kind);
        if (!out) return fail('Appen hittades inte.');
        if (out.error) return fail(`Mejlet kan inte skickas: ${out.error}`);
        return out;
      },
    },
    {
      name: 'list_apps',
      title: 'Lista appar',
      description: 'Lista appar på skolappar, med filter på status, sökord och sortering.',
      inputSchema: obj({
        status: { type: 'string', enum: APP_STATUSES },
        search: { type: 'string', minLength: 1, description: 'Fritext i titel/beskrivning/url.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 25 },
        order_by: { type: 'string', enum: ['created_at', 'upvotes_count', 'clicks_count', 'title'], default: 'created_at' },
      }),
      annotations: RO,
      handler: (input) => store.listAdminApps(input),
    },
    {
      name: 'get_app',
      title: 'Hämta app',
      description: 'Hämta en app med kategorier (alla statusar, inklusive tipsarens uppgifter).',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: RO,
      handler: ({ id }) => store.getApp(id, { admin: true }) ?? fail('Appen hittades inte.'),
    },
    {
      name: 'create_app',
      title: 'Skapa app',
      description: 'Lägg till en ny app i galleriet (publiceras direkt som approved om inte status anges), valfritt med kategorier.',
      inputSchema: obj({
        title: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', minLength: 5, maxLength: 500 },
        url: { type: 'string', format: 'uri', maxLength: 2048 },
        long_description: { type: 'string', maxLength: 10000 },
        image_url: { type: 'string', format: 'uri', maxLength: 2048, description: `${IMAGE_HINT} Bilden laddas ner och sparas lokalt.` },
        creator_name: { type: 'string', maxLength: 120, description: 'Namnet som visas som skapare.' },
        status: { type: 'string', enum: APP_STATUSES, default: 'approved' },
        category_ids: { type: 'array', items: uuid, maxItems: 20, description: CATEGORY_HINT },
      }, ['title', 'description', 'url']),
      annotations: RW,
      handler: async ({ category_ids, image_url, ...fields }) => {
        const result = store.createApp(fields, category_ids);
        if (image_url) {
          const { url } = await images.download(image_url);
          result.app = store.updateApp(result.app.id, { image_url: url }).app;
        }
        return result;
      },
    },
    {
      name: 'update_app',
      title: 'Uppdatera app',
      description:
        'Uppdatera en app: innehåll, status (approved = godkänn, rejected = avslå, featured = utvald, delisted = avlista), ' +
        'utvald-flagga och kategorier. När ett tips godkänns för första gången får tipsaren (om e-posten är bekräftad) ett mejl. ' +
        'En app som ligger på Shipholm (<namn>.shipholm.dev) får adressen <namn>.skolappar.com när den godkänns och lämnar tillbaka den när den avlistas; ' +
        'svaret har då address: {url, changed, note}. note säger varför en adress inte kunde ges.',
      inputSchema: obj({
        id: uuid,
        title: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', minLength: 5, maxLength: 500 },
        long_description: { type: 'string', maxLength: 10000 },
        url: { type: 'string', format: 'uri', maxLength: 2048 },
        image_url: { type: 'string', maxLength: 2048, description: 'Lokal bild (/images/…) eller extern URL. Använd set_app_image för att ladda ner en bild.' },
        creator_name: { type: 'string', maxLength: 120 },
        status: { type: 'string', enum: APP_STATUSES },
        is_featured: { type: 'boolean' },
        delist_reason: { type: 'string', maxLength: 500 },
        category_ids: { type: 'array', items: uuid, maxItems: 20, description: `Ersätter appens samtliga kategorier. ${CATEGORY_HINT}` },
        curriculum_ids: { type: 'array', items: { type: 'string', pattern: POINT_ID }, maxItems: 8, description: 'Ersätter appens koppling till Lgr22: id för de punkter i det centrala innehållet som appen tränar (get_curriculum). Tom lista tar bort kopplingen.' },
      }, ['id']),
      annotations: RW,
      handler: async ({ id, category_ids, curriculum_ids, ...fields }) => {
        if (curriculum_ids) {
          if (!store.getApp(id, { admin: true })) return fail('Appen hittades inte.');
          const unknown = store.setCurriculum(id, curriculum_ids);
          if (unknown.length) return fail(`Okända punkter i Lgr22: ${unknown.join(', ')}. Hämta id med get_curriculum.`);
          if (!Object.keys(defined(fields)).length && !category_ids) return { app: store.getApp(id, { admin: true }) };
        }
        if (fields.image_url && !fields.image_url.startsWith('/images/') && !/^https?:\/\//.test(fields.image_url)) {
          return fail('image_url måste vara en http(s)-URL eller /images/…');
        }
        const result = store.updateApp(id, defined(fields), category_ids);
        if (!result) return fail('Appen hittades inte.');
        // listed or no longer listed: an app on Shipholm gets, or gives back, its skolappar address
        const address = fields.status ? await store.syncAddress(id) : null;
        return address?.changed || address?.note ? { ...result, app: store.getApp(id, { admin: true }), address } : result;
      },
    },
    {
      name: 'set_app_image',
      title: 'Sätt appens bild från URL',
      description: `Laddar ner en bild (png, jpg, gif, webp, avif, svg; max 10 MB) och sätter den som appens bild. ${IMAGE_HINT}`,
      inputSchema: obj({ id: uuid, image_url: { type: 'string', format: 'uri', maxLength: 2048 } }, ['id', 'image_url']),
      annotations: { ...RW, openWorldHint: true },
      handler: async ({ id, image_url }) => {
        if (!store.getApp(id, { admin: true })) return fail('Appen hittades inte.');
        const { url } = await images.download(image_url);
        return store.updateApp(id, { image_url: url });
      },
    },
    {
      name: 'delete_app',
      title: 'Ta bort app',
      description: "Radera en app permanent. Överväg status 'delisted' eller 'rejected' istället för att bevara historik.",
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: DESTRUCTIVE,
      handler: async ({ id }) => {
        await store.releaseAddress(id);
        return store.deleteApp(id) ? { deleted: id } : fail('Appen hittades inte.');
      },
    },
    {
      name: 'list_ideas',
      title: 'Lista app-idéer',
      description: 'Lista idéer från besökare med status open/claimed/built.',
      inputSchema: obj({
        status: { type: 'string', enum: IDEA_STATUSES },
        search: { type: 'string', minLength: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 25 },
      }),
      annotations: RO,
      handler: ({ status, search, limit }) => store.listIdeas({ status, search, limit, admin: true }),
    },
    {
      name: 'get_idea',
      title: 'Hämta app-idé',
      description: 'Hämta alla detaljer om en enskild app-idé.',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: RO,
      handler: ({ id }) => store.getIdea(id, { admin: true }) ?? fail('Idén hittades inte.'),
    },
    {
      name: 'create_idea',
      title: 'Skapa app-idé',
      description: 'Lägg till en ny app-idé i listan.',
      inputSchema: obj({
        title: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', minLength: 5, maxLength: 5000 },
        target_age: { type: 'string', maxLength: 60 },
        target_subject: { type: 'string', maxLength: 60 },
        creator_name: { type: 'string', maxLength: 120 },
        status: { type: 'string', enum: IDEA_STATUSES },
      }, ['title', 'description']),
      annotations: RW,
      handler: (input) => store.createIdea(input),
    },
    {
      name: 'update_idea',
      title: 'Uppdatera app-idé',
      description: 'Redigera en idé eller ändra dess status (open, claimed, built). built_app_id länkar till den byggda appen.',
      inputSchema: obj({
        id: uuid,
        title: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', minLength: 5, maxLength: 5000 },
        target_age: { type: 'string', maxLength: 60 },
        target_subject: { type: 'string', maxLength: 60 },
        status: { type: 'string', enum: IDEA_STATUSES },
        claimer_name: { type: 'string', maxLength: 120, description: 'Vem som bygger idén (visas på sajten).' },
        built_app_id: uuid,
      }, ['id']),
      annotations: RW,
      handler: ({ id, ...fields }) => {
        const patch = defined(fields);
        if (!Object.keys(patch).length) return fail('Inget att uppdatera.');
        return store.updateIdea(id, patch) ?? fail('Idén hittades inte.');
      },
    },
    {
      name: 'claim_idea',
      title: 'Ta an eller släpp app-idé',
      description: 'Markera en idé som påbörjad (claimed) av någon, eller släpp den tillbaka som öppen.',
      inputSchema: obj({
        id: uuid,
        name: { type: 'string', maxLength: 120, description: 'Namnet som visas som byggare.' },
        release: { type: 'boolean', description: 'Sätt true för att släppa idén som öppen igen.' },
      }, ['id']),
      annotations: RW,
      handler: ({ id, name, release }) => {
        const patch = release
          ? { status: 'open' }
          : { status: 'claimed', claimer_name: name ?? null, claimed_at: new Date().toISOString() };
        return store.updateIdea(id, patch) ?? fail('Idén hittades inte.');
      },
    },
    {
      name: 'delete_idea',
      title: 'Ta bort app-idé',
      description: 'Radera en app-idé permanent.',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: DESTRUCTIVE,
      handler: ({ id }) => (store.deleteIdea(id) ? { deleted: id } : fail('Idén hittades inte.')),
    },
    {
      name: 'list_resources',
      title: 'Lista resurser',
      description: 'Lista kunskapsartiklar (resurser), inklusive opublicerade.',
      inputSchema: obj({
        category: { type: 'string', minLength: 1 },
        include_unpublished: { type: 'boolean', default: true },
        with_content: { type: 'boolean', default: false },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      }),
      annotations: RO,
      handler: ({ category, include_unpublished, with_content, limit }) =>
        store.listResources({ category, publishedOnly: !include_unpublished, withContent: with_content, limit }),
    },
    {
      name: 'upsert_resource',
      title: 'Skapa eller uppdatera resurs',
      description: 'Skapa en ny kunskapsartikel, eller uppdatera en befintlig när id anges. Innehållet är Markdown.',
      inputSchema: obj({
        id: { ...uuid, description: 'Utelämna för att skapa en ny resurs.' },
        title: { type: 'string', minLength: 2, maxLength: 160 },
        slug: { type: 'string', pattern: '^[a-z0-9-]+$', maxLength: 160 },
        excerpt: { type: 'string', maxLength: 400 },
        content: { type: 'string', maxLength: 100000 },
        category: { type: 'string', minLength: 1, maxLength: 60 },
        icon: { type: 'string', maxLength: 60 },
        sort_order: { type: 'integer', minimum: 0, maximum: 9999 },
        is_published: { type: 'boolean' },
      }),
      annotations: RW,
      handler: ({ id, ...fields }) => {
        const patch = defined(fields);
        if (id) {
          if (!Object.keys(patch).length) return fail('Inget att uppdatera.');
          return store.updateResource(id, patch) ?? fail('Resursen hittades inte.');
        }
        if (!patch.title || !patch.slug || !patch.content || !patch.category) {
          return fail('title, slug, content och category krävs för en ny resurs.');
        }
        return store.createResource(patch);
      },
    },
    {
      name: 'get_resource',
      title: 'Läs resurs',
      description: 'En kunskapsartikel med hela innehållet (Markdown), även opublicerad. Ange id eller slug. Läs den innan du ändrar delar av den med edit_resource.',
      inputSchema: obj({ id: uuid, slug: { type: 'string', pattern: '^[a-z0-9-]+$', maxLength: 160 } }),
      annotations: RO,
      handler: ({ id, slug }) => {
        const r = id ? store.getResource(id) : slug ? store.listResources({ publishedOnly: false }).find((x) => x.slug === slug) : null;
        return r ?? fail(id || slug ? 'Resursen hittades inte.' : 'Ange id eller slug.');
      },
    },
    {
      name: 'edit_resource',
      title: 'Ändra delar av en resurs',
      description:
        'Ändra delar av en kunskapsartikels innehåll utan att skicka hela texten. Varje ändring är antingen ' +
        '{old_str, new_str} (old_str måste finnas exakt en gång; tom new_str tar bort) eller ' +
        '{section, content} (ersätter texten under rubriken section fram till nästa rubrik på samma eller högre nivå; ' +
        'remove: true tar bort avsnittet med rubrik). Allt eller inget: misslyckas en ändring sparas ingen. ' +
        'Titel, utdrag, kategori och publicering ändras med upsert_resource.',
      inputSchema: obj({
        id: uuid,
        edits: {
          type: 'array', minItems: 1, maxItems: 50,
          items: obj({
            old_str: { type: 'string', maxLength: 20000 },
            new_str: { type: 'string', maxLength: 20000 },
            section: { type: 'string', maxLength: 200 },
            content: { type: 'string', maxLength: 50000 },
            remove: { type: 'boolean' },
          }),
        },
      }, ['id', 'edits']),
      annotations: RW,
      handler: ({ id, edits }) => {
        const r = store.getResource(id);
        if (!r) return fail('Resursen hittades inte.');
        const out = editMarkdown(r.content, edits);
        if (out.error) return fail(out.error);
        if (out.content.length > 100000) return fail('Innehållet blir för långt (högst 100 000 tecken).');
        return store.updateResource(id, { content: out.content });
      },
    },
    {
      name: 'delete_resource',
      title: 'Ta bort resurs',
      description: 'Radera en kunskapsartikel permanent.',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: DESTRUCTIVE,
      handler: ({ id }) => (store.deleteResource(id) ? { deleted: id } : fail('Resursen hittades inte.')),
    },
    {
      name: 'list_categories',
      title: 'Lista kategorier',
      description: 'Lista alla kategorier (subject, age, app_type, device) med id att använda vid app-uppdateringar.',
      inputSchema: obj({ type: { type: 'string', minLength: 1 } }),
      annotations: RO,
      handler: ({ type }) => store.listCategories({ type }).sort((a, b) => a.type.localeCompare(b.type) || a.sort_order - b.sort_order),
    },
    {
      name: 'upsert_category',
      title: 'Skapa eller uppdatera kategori',
      description: 'Skapa en ny kategori, eller uppdatera en befintlig när id anges.',
      inputSchema: obj({
        id: uuid,
        name: { type: 'string', minLength: 1, maxLength: 60 },
        slug: { type: 'string', pattern: '^[a-z0-9-]+$', maxLength: 60 },
        type: { type: 'string', minLength: 1, maxLength: 40 },
        description: { type: 'string', maxLength: 300 },
        icon: { type: 'string', maxLength: 60 },
        color: { type: 'string', maxLength: 40 },
        sort_order: { type: 'integer', minimum: 0, maximum: 9999 },
      }),
      annotations: RW,
      handler: ({ id, ...fields }) => {
        const patch = defined(fields);
        if (id) {
          if (!Object.keys(patch).length) return fail('Inget att uppdatera.');
          return store.updateCategory(id, patch) ?? fail('Kategorin hittades inte.');
        }
        if (!patch.name || !patch.slug || !patch.type) return fail('name, slug och type krävs för en ny kategori.');
        return store.createCategory(patch);
      },
    },
    {
      name: 'delete_category',
      title: 'Ta bort kategori',
      description: 'Radera en kategori permanent (den tas bort från alla appar).',
      inputSchema: obj({ id: uuid }, ['id']),
      annotations: DESTRUCTIVE,
      handler: ({ id }) => (store.deleteCategory(id) ? { deleted: id } : fail('Kategorin hittades inte.')),
    },
    {
      name: 'list_settings',
      title: 'Lista inställningar',
      description: 'Läs plattformens inställningar: varumärke, tema, typsnitt, SEO/AEO, analys och startsidans sektioner.',
      inputSchema: obj({ key_prefix: { type: 'string', minLength: 1 } }),
      annotations: RO,
      handler: ({ key_prefix }) => store.listSettings({ keyPrefix: key_prefix }),
    },
    {
      name: 'send_weekly_letter',
      title: 'Veckobrevet till skaparna',
      description: 'Veckobrevet går ut av sig själv på måndagar kl. 08 (svensk tid). dry_run (standard) visar vad som skulle skickas, utan adresser; dry_run: false skickar nu.',
      inputSchema: obj({ dry_run: { type: 'boolean', default: true } }),
      annotations: RW,
      handler: ({ dry_run = true }) => store.sendWeeklyDigest({ dryRun: dry_run }),
    },
    {
      name: 'set_setting',
      title: 'Ändra inställning',
      description: 'Skriv en plattformsinställning (varumärke, tema, typsnitt, SEO/AEO, analys, startsidans sektioner). Värdet är JSON.',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', minLength: 1, maxLength: 120 },
          value: { description: 'Valfritt JSON-värde (sträng, tal, boolean, objekt, lista eller null).' },
        },
        required: ['key'],
        additionalProperties: false,
      },
      annotations: RW,
      handler: ({ key, value }) => store.setSetting(key, value),
    },
  ];
  return tools;
}

class ToolFailure extends Error {}
function fail(message) {
  throw new ToolFailure(message);
}

export function createMcpHandler({ store, images, checkApp, content, curriculum, siteUrl = 'https://www.skolappar.com', log = console }) {
  const adminTools = createTools({ store, images });
  const publicTools = createPublicTools({ store, images, checkApp, content, curriculum, siteUrl, fail, imageHint: IMAGE_HINT, categoryHint: CATEGORY_HINT });
  // With a key: the administration, plus the open tools it has no version of (submit_app, app_status …).
  const adminNames = new Set(adminTools.map((t) => t.name));
  const toolsFor = {
    public: publicTools,
    admin: [...adminTools, ...publicTools.filter((t) => !adminNames.has(t.name))],
  };
  const byName = {
    public: new Map(toolsFor.public.map((t) => [t.name, t])),
    admin: new Map(toolsFor.admin.map((t) => [t.name, t])),
  };

  async function callTool(params, ctx) {
    const tool = byName[ctx.role].get(params?.name);
    if (!tool) return { error: { code: -32602, message: `Unknown tool: ${params?.name}` } };
    let input;
    try {
      input = validate(tool.inputSchema, params.arguments ?? {});
    } catch (err) {
      if (err instanceof ValidationError) {
        return { result: { content: [{ type: 'text', text: `Ogiltig indata: ${err.message}` }], isError: true } };
      }
      throw err;
    }
    try {
      const data = await tool.handler(input, ctx);
      return {
        result: {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          structuredContent: { result: data },
        },
      };
    } catch (err) {
      if (!(err instanceof ToolFailure)) log.error?.(`mcp tool ${tool.name} failed: ${err?.message || err}`);
      return { result: { content: [{ type: 'text', text: err instanceof ToolFailure ? err.message : `Fel: ${err?.message || 'okänt fel'}` }], isError: true } };
    }
  }

  async function handleMessage(msg, ctx) {
    if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid Request' } };
    }
    const isNotification = msg.id === undefined;
    let outcome;
    switch (msg.method) {
      case 'initialize': {
        const requested = msg.params?.protocolVersion;
        outcome = {
          result: {
            protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'skolappar', title: ctx.role === 'admin' ? 'Skolappar admin' : 'Skolappar', version: '1.1.0' },
            instructions: ctx.role === 'admin'
              ? 'Administrera skolappar.com: granska tips (list_submissions) och ändringar av publicerade appar (list_changes, review_change), prova appen, sätt kategorier och bild, ' +
                'godkänn (update_app status approved, bara när e-postadressen är bekräftad) eller avslå (rejected). ' +
                'Hantera även idéer, resurser, kategorier och inställningar. Veckans spelraket på startsidan väljs med set_setting weekly_app_id (en publicerad apps id; tom sträng döljer platsen) – ' +
                'helst en app där barnen stannar enligt in_app i app_stats (andel klara omgångar, minuter per besök). ' +
                'Artiklar (resurser, Markdown): läs med get_resource, ändra delar med edit_resource (exakt text eller ett helt avsnitt), skapa eller ändra titel och publicering med upsert_resource; ' +
                'en dold eller flyttad artikel pekas vidare med set_setting resource_redirects ({slug: sökväg}). ' +
                'Veckobrevet till skaparna går ut av sig självt på måndagar kl. 08; send_weekly_letter visar vad som skulle skickas.'
              : PUBLIC_INSTRUCTIONS,
          },
        };
        break;
      }
      case 'ping':
        outcome = { result: {} };
        break;
      case 'tools/list':
        outcome = {
          result: {
            tools: toolsFor[ctx.role].map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })),
          },
        };
        break;
      case 'tools/call':
        outcome = await callTool(msg.params, ctx);
        break;
      default:
        if (msg.method.startsWith('notifications/')) outcome = { result: null };
        else outcome = { error: { code: -32601, message: `Method not found: ${msg.method}` } };
    }
    if (isNotification) return null;
    return { jsonrpc: '2.0', id: msg.id, ...outcome };
  }

  /**
   * Handle a parsed JSON-RPC body (single message or batch). Returns the response body or null (202).
   * ctx.role: 'admin' (a valid key) or 'public' (no key); ctx.submitAllowed: the caller's rate limit.
   */
  async function handle(body, ctx = { role: 'admin' }) {
    if (Array.isArray(body)) {
      const out = (await Promise.all(body.map((m) => handleMessage(m, ctx)))).filter(Boolean);
      return out.length ? out : null;
    }
    return handleMessage(body, ctx);
  }

  return { handle, tools: toolsFor.admin, publicTools: toolsFor.public };
}
