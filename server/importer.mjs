// One-shot import of the Supabase data (POST /api/admin/import).
// Upserts everything in one transaction and is safe to run more than once.
import { transaction } from './db.mjs';
import { APP_STATUSES } from './store.mjs';
import { isHttpUrl } from './validate.mjs';

/** Settings whose (top-level) value is an image URL. */
const IMAGE_SETTING_KEYS = new Set(['brand_logo_url', 'brand_favicon_url', 'site_image', 'site_logo']);
const isStorageUrl = (u) => /\/storage\/v1\/object\/(public|sign)\//.test(u);
/** Live screenshot URLs (WordPress mShots) are generated on demand – keep them as they are. */
const isScreenshotService = (u) => /^https?:\/\/s\.wordpress\.com\/mshots\//.test(u);

const TABLES = ['categories', 'apps', 'app_categories', 'resources', 'settings', 'ideas', 'upvotes', 'idea_upvotes', 'app_open_events'];

function ts(value, fallback) {
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback;
}
const int = (v, d = 0) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.trunc(Number(v)) : d);
const str = (v) => (v === undefined || v === null ? null : String(v));
const id = (v) => (typeof v === 'string' && v.length > 0 && v.length <= 100 ? v : null);

export class ImportError extends Error {}

export function createImporter({ store, images, fetchImpl, log = console }) {
  const { db } = store;

  async function run(payload) {
    for (const key of TABLES) {
      if (payload[key] !== undefined && !Array.isArray(payload[key])) throw new ImportError(`${key} must be an array`);
    }
    const data = Object.fromEntries(TABLES.map((k) => [k, Array.isArray(payload[k]) ? payload[k] : []]));
    for (const k of TABLES) {
      if (data[k].some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
        throw new ImportError(`${k} must contain objects`);
      }
    }

    // 1. Download images first (outside the transaction).
    const wanted = new Set();
    for (const app of data.apps) {
      const u = app.image_url;
      if (isHttpUrl(u) && !isScreenshotService(u)) wanted.add(u);
    }
    const visitSetting = (key, value, top) => {
      if (typeof value === 'string') {
        if (isHttpUrl(value) && (isStorageUrl(value) || (top && IMAGE_SETTING_KEYS.has(key)))) wanted.add(value);
      } else if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) visitSetting(k, v, false);
      }
    };
    for (const s of data.settings) visitSetting(s.key, s.value, true);

    const mapped = new Map();
    const imageErrors = [];
    let downloaded = 0;
    const queue = [...wanted];
    async function worker() {
      while (queue.length) {
        const url = queue.shift();
        try {
          const r = await images.download(url, { fetchImpl });
          mapped.set(url, r.url);
          if (!r.cached) downloaded++;
        } catch (err) {
          imageErrors.push({ url, error: String(err?.message || err) });
        }
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker));

    const rewrite = (key, value, top) => {
      if (typeof value === 'string') return mapped.get(value) ?? value;
      if (Array.isArray(value)) return value.map((v) => rewrite(key, v, false));
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(k, v, false)]));
      }
      return value;
    };

    // 2. Write everything in one transaction.
    const counts = Object.fromEntries(TABLES.map((k) => [k, 0]));
    const skipped = [];
    const nowIso = new Date().toISOString();

    transaction(db, () => {
      const upCategory = db.prepare(
        `INSERT INTO categories (id, name, slug, type, description, icon, color, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, slug = excluded.slug, type = excluded.type,
           description = excluded.description, icon = excluded.icon, color = excluded.color,
           sort_order = excluded.sort_order, created_at = excluded.created_at`
      );
      for (const c of data.categories) {
        if (!id(c.id) || !c.name || !c.slug || !c.type) {
          skipped.push({ table: 'categories', id: c.id ?? null, reason: 'id, name, slug and type are required' });
          continue;
        }
        upCategory.run(c.id, String(c.name), String(c.slug), String(c.type), str(c.description), str(c.icon), str(c.color),
          int(c.sort_order), ts(c.created_at, nowIso));
        counts.categories++;
      }

      const upApp = db.prepare(
        `INSERT INTO apps (id, user_id, creator_name, title, description, long_description, url, image_url, status,
           is_featured, upvotes_count, comments_count, clicks_count, delist_reason, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, creator_name = excluded.creator_name,
           title = excluded.title, description = excluded.description, long_description = excluded.long_description,
           url = excluded.url, image_url = excluded.image_url, status = excluded.status, is_featured = excluded.is_featured,
           upvotes_count = excluded.upvotes_count, comments_count = excluded.comments_count,
           clicks_count = excluded.clicks_count, delist_reason = excluded.delist_reason,
           created_at = excluded.created_at, updated_at = excluded.updated_at`
      );
      const importedApps = new Set();
      for (const a of data.apps) {
        if (!id(a.id) || !a.title || !a.url) {
          skipped.push({ table: 'apps', id: a.id ?? null, reason: 'id, title and url are required' });
          continue;
        }
        const status = APP_STATUSES.includes(a.status) ? a.status : 'pending';
        const image = typeof a.image_url === 'string' && a.image_url ? (mapped.get(a.image_url) ?? a.image_url) : null;
        const created = ts(a.created_at, nowIso);
        upApp.run(a.id, str(a.user_id), str(a.creator_name), String(a.title), String(a.description ?? ''),
          str(a.long_description), String(a.url), image, status, a.is_featured ? 1 : 0, int(a.upvotes_count),
          int(a.comments_count), int(a.clicks_count), str(a.delist_reason), created, ts(a.updated_at, created));
        importedApps.add(a.id);
        counts.apps++;
      }

      // Categories of imported apps are replaced by the imported set.
      if (data.app_categories.length) {
        const appExists = db.prepare('SELECT 1 FROM apps WHERE id = ?');
        const catExists = db.prepare('SELECT 1 FROM categories WHERE id = ?');
        const clear = db.prepare('DELETE FROM app_categories WHERE app_id = ?');
        const ins = db.prepare('INSERT OR IGNORE INTO app_categories (app_id, category_id) VALUES (?, ?)');
        for (const appId of importedApps) clear.run(appId);
        for (const ac of data.app_categories) {
          if (!appExists.get(ac.app_id) || !catExists.get(ac.category_id)) {
            skipped.push({ table: 'app_categories', id: `${ac.app_id}/${ac.category_id}`, reason: 'unknown app or category' });
            continue;
          }
          ins.run(ac.app_id, ac.category_id);
          counts.app_categories++;
        }
      }

      const upResource = db.prepare(
        `INSERT INTO resources (id, title, slug, excerpt, content, category, icon, sort_order, is_published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET title = excluded.title, slug = excluded.slug, excerpt = excluded.excerpt,
           content = excluded.content, category = excluded.category, icon = excluded.icon,
           sort_order = excluded.sort_order, is_published = excluded.is_published,
           created_at = excluded.created_at, updated_at = excluded.updated_at`
      );
      for (const r of data.resources) {
        if (!id(r.id) || !r.title || !r.slug || !r.category) {
          skipped.push({ table: 'resources', id: r.id ?? null, reason: 'id, title, slug and category are required' });
          continue;
        }
        const created = ts(r.created_at, nowIso);
        upResource.run(r.id, String(r.title), String(r.slug), str(r.excerpt), String(r.content ?? ''), String(r.category),
          str(r.icon), int(r.sort_order), r.is_published === false ? 0 : 1, created, ts(r.updated_at, created));
        counts.resources++;
      }

      const upSetting = db.prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      );
      for (const s of data.settings) {
        if (typeof s.key !== 'string' || !s.key || s.key.length > 200) {
          skipped.push({ table: 'settings', id: s.key ?? null, reason: 'key is required' });
          continue;
        }
        // `value` is the jsonb value as JSON (string, number, object …), not JSON text.
        upSetting.run(s.key, JSON.stringify(rewrite(s.key, s.value ?? null, true)), ts(s.updated_at, nowIso));
        counts.settings++;
      }

      const upIdea = db.prepare(
        `INSERT INTO ideas (id, user_id, creator_name, title, description, target_age, target_subject, status, claimed_by,
           claimer_name, claimed_at, built_app_id, upvotes_count, comments_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, creator_name = excluded.creator_name,
           title = excluded.title, description = excluded.description, target_age = excluded.target_age,
           target_subject = excluded.target_subject, status = excluded.status, claimed_by = excluded.claimed_by,
           claimer_name = excluded.claimer_name, claimed_at = excluded.claimed_at, built_app_id = excluded.built_app_id,
           upvotes_count = excluded.upvotes_count, comments_count = excluded.comments_count,
           created_at = excluded.created_at, updated_at = excluded.updated_at`
      );
      for (const i of data.ideas) {
        if (!id(i.id) || !i.title) {
          skipped.push({ table: 'ideas', id: i.id ?? null, reason: 'id and title are required' });
          continue;
        }
        const created = ts(i.created_at, nowIso);
        upIdea.run(i.id, str(i.user_id), str(i.creator_name), String(i.title), String(i.description ?? ''),
          str(i.target_age), str(i.target_subject), String(i.status || 'open'), str(i.claimed_by), str(i.claimer_name),
          i.claimed_at ? ts(i.claimed_at, null) : null, str(i.built_app_id), int(i.upvotes_count), int(i.comments_count),
          created, ts(i.updated_at, created));
        counts.ideas++;
      }

      // Optional: existing votes, so the old voters keep counting (they can never toggle them, though).
      const insAppVote = db.prepare(
        `INSERT OR IGNORE INTO app_upvotes (app_id, voter_hash, created_at)
         SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM apps WHERE id = ?)`
      );
      for (const u of data.upvotes) {
        if (!id(u.app_id) || !u.user_id) continue;
        if (insAppVote.run(u.app_id, store.voterHash(`import:${u.user_id}`), ts(u.created_at, nowIso), u.app_id).changes) counts.upvotes++;
      }
      const insIdeaVote = db.prepare(
        `INSERT OR IGNORE INTO idea_upvotes (idea_id, voter_hash, created_at)
         SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM ideas WHERE id = ?)`
      );
      for (const u of data.idea_upvotes) {
        if (!id(u.idea_id) || !u.user_id) continue;
        if (insIdeaVote.run(u.idea_id, store.voterHash(`import:${u.user_id}`), ts(u.created_at, nowIso), u.idea_id).changes) counts.idea_upvotes++;
      }
      const insEvent = db.prepare(
        `INSERT INTO app_open_events (app_id, opened_at)
         SELECT ?, ? WHERE EXISTS (SELECT 1 FROM apps WHERE id = ?)
           AND NOT EXISTS (SELECT 1 FROM app_open_events WHERE app_id = ? AND opened_at = ?)`
      );
      for (const e of data.app_open_events) {
        const at = ts(e.opened_at, null);
        if (!id(e.app_id) || !at) continue;
        if (insEvent.run(e.app_id, at, e.app_id, e.app_id, at).changes) counts.app_open_events++;
      }
    });

    log.info?.(`import: ${JSON.stringify(counts)}, images downloaded ${downloaded}, image errors ${imageErrors.length}`);
    return {
      imported: counts,
      images: { found: wanted.size, stored: mapped.size, downloaded, errors: imageErrors },
      skipped,
    };
  }

  return { run };
}
