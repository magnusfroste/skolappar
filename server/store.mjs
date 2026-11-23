// Data access: every read and write of the catalogue goes through here, so the
// public API, the admin API and the MCP tools share one set of rules.
import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { transaction, serverSecret } from './db.mjs';
import { appPublishedMail, confirmSubmissionMail } from './mailer.mjs';

export const APP_STATUSES = ['pending', 'approved', 'rejected', 'featured', 'delisted'];
export const PUBLIC_STATUSES = ['approved', 'featured'];
export const IDEA_STATUSES = ['open', 'claimed', 'built'];
export const TRACKING_SINCE = '2026-11-18T00:00:00Z';

const now = () => new Date().toISOString();
const nul = (v) => (v === undefined ? null : v);
const bool = (v) => (v ? 1 : 0);
const likeEscape = (s) => `%${String(s).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const placeholders = (n) => Array.from({ length: n }, () => '?').join(',');

function parseJson(text) {
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** 'sent' | 'not_configured' | 'failed:<reason>' (+ time) -> {status, reason, at} or null. */
function mailState(value, at) {
  if (!value) return null;
  const [status, ...rest] = value.split(':');
  return { status, reason: rest.join(':') || null, at };
}

function personOrNull(name) {
  return name ? { display_name: name, avatar_url: null } : null;
}

export function createStore(db, { mailer, curriculum, shipholm, siteUrl = 'https://www.skolappar.com', log = console } = {}) {
  const voterSalt = serverSecret(db);

  /** sha256(voter id + server secret) – the raw browser id is never stored. */
  const voterHash = (voterId) => createHash('sha256').update(`${voterId}:${voterSalt}`).digest('hex');

  // ---------- categories ----------

  function categoryRow(r) {
    return {
      id: r.id, name: r.name, slug: r.slug, type: r.type, description: r.description,
      icon: r.icon, color: r.color, sort_order: r.sort_order, created_at: r.created_at,
    };
  }

  function listCategories({ type } = {}) {
    const rows = type
      ? db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order, name').all(type)
      : db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
    return rows.map(categoryRow);
  }

  function getCategory(id) {
    const r = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return r ? categoryRow(r) : null;
  }

  const CATEGORY_FIELDS = ['name', 'slug', 'type', 'description', 'icon', 'color', 'sort_order'];

  function createCategory(fields) {
    const id = fields.id || randomUUID();
    db.prepare(
      `INSERT INTO categories (id, name, slug, type, description, icon, color, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, fields.name, fields.slug, fields.type, nul(fields.description), nul(fields.icon),
      nul(fields.color), fields.sort_order ?? 0, fields.created_at || now());
    return getCategory(id);
  }

  function updateCategory(id, patch) {
    const sets = CATEGORY_FIELDS.filter((f) => patch[f] !== undefined);
    if (sets.length) {
      db.prepare(`UPDATE categories SET ${sets.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`)
        .run(...sets.map((f) => nul(patch[f])), id);
    }
    return getCategory(id);
  }

  function deleteCategory(id) {
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;
  }

  // ---------- apps ----------

  /** The last automatic check, short: what failed and what was warned about. */
  function checkSummary(r) {
    if (!r.check_result) return null;
    let result;
    try { result = JSON.parse(r.check_result); } catch { return null; }
    const of = (status) => (result.checks || []).filter((c) => c.status === status).map((c) => c.message);
    return { passed: r.check_passed === 1, checked_at: r.checked_at, failed: of('fail'), warnings: of('warn') };
  }

  /**
   * Set the card image of an app its creator's agent submitted. Only while the app waits or was
   * rejected (it is then queued again): a listed app does not change without a review.
   * Returns the app's status, or {error} with 'key' or 'listed'.
   */
  function setOwnImage(id, key, imageUrl) {
    if (!appKeyMatches(id, key)) return { error: 'key' };
    const r = db.prepare('SELECT status FROM apps WHERE id = ?').get(id);
    if (!['pending', 'rejected'].includes(r.status)) return { error: 'listed' };
    updateApp(id, { image_url: imageUrl, ...(r.status === 'rejected' ? { status: 'pending' } : {}) });
    return appStatus(id);
  }

  /** Keep the outcome of a check on the app. */
  function saveCheck(id, result) {
    db.prepare('UPDATE apps SET check_result = ?, check_passed = ?, checked_at = ? WHERE id = ?')
      .run(JSON.stringify(result), result.passed ? 1 : 0, result.checked_at, id);
  }

  function appRow(r, { admin = false } = {}) {
    const app = {
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description,
      long_description: r.long_description,
      url: r.url,
      image_url: r.image_url,
      status: r.status,
      is_featured: Boolean(r.is_featured),
      upvotes_count: r.upvotes_count,
      comments_count: r.comments_count,
      clicks_count: r.clicks_count,
      delist_reason: r.delist_reason,
      creator_name: r.creator_name,
      profile: personOrNull(r.creator_name),
      // true when the last automatic check of the address found nothing that breaks the build guide
      guide_ok: r.check_passed === 1,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
    if (admin) {
      app.check = checkSummary(r);
      app.origin_url = r.origin_url;
      app.address_note = r.address_note;
      app.submitter_email = r.submitter_email;
      app.submitter_note = r.submitter_note;
      app.email_confirmed = Boolean(r.email_confirmed);
      app.published_notified_at = r.published_notified_at;
      app.mail = {
        confirm: mailState(r.confirm_mail, r.confirm_mail_at),
        published: mailState(r.published_mail, r.published_mail_at),
      };
    }
    return app;
  }

  /** Attach categories ({id,name,slug,type,icon,color}) to a list of apps. */
  function withCategories(apps) {
    if (!apps.length) return apps;
    const ids = apps.map((a) => a.id);
    const byApp = new Map(ids.map((id) => [id, []]));
    // Chunk to stay well below SQLite's parameter limit.
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const rows = db.prepare(
        `SELECT ac.app_id, c.id, c.name, c.slug, c.type, c.icon, c.color, c.sort_order
         FROM app_categories ac JOIN categories c ON c.id = ac.category_id
         WHERE ac.app_id IN (${placeholders(chunk.length)})
         ORDER BY c.sort_order, c.name`
      ).all(...chunk);
      for (const r of rows) {
        byApp.get(r.app_id).push({ id: r.id, name: r.name, slug: r.slug, type: r.type, icon: r.icon, color: r.color });
      }
    }
    for (const app of apps) app.categories = byApp.get(app.id) || [];
    return withCurriculum(apps);
  }

  /** Attach the points of Lgr22 an app trains ({id, subject_name, stage, area, text}); ids no longer in the data are left out. */
  function withCurriculum(apps) {
    const byApp = new Map(apps.map((a) => [a.id, []]));
    const ids = [...byApp.keys()];
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const rows = db.prepare(`SELECT app_id, point_id FROM app_curriculum WHERE app_id IN (${placeholders(chunk.length)}) ORDER BY point_id`).all(...chunk);
      for (const r of rows) {
        const point = curriculum?.point(r.point_id);
        if (point) byApp.get(r.app_id).push(point);
      }
    }
    for (const app of apps) app.curriculum = byApp.get(app.id) || [];
    return apps;
  }

  /** Replace the points of Lgr22 an app trains. Returns the ids that are not in the curriculum (not stored). */
  function setCurriculum(appId, pointIds) {
    const { known, unknown } = curriculum ? curriculum.sort(pointIds) : { known: [], unknown: pointIds };
    transaction(db, () => {
      db.prepare('DELETE FROM app_curriculum WHERE app_id = ?').run(appId);
      const add = db.prepare('INSERT INTO app_curriculum (app_id, point_id) VALUES (?, ?)');
      for (const id of known) add.run(appId, id);
    });
    return unknown;
  }

  /** The areas of Lgr22 that listed apps train, with the number of apps: what the site's filter offers. */
  function curriculumUsed() {
    const rows = db.prepare(
      `SELECT ac.point_id, ac.app_id FROM app_curriculum ac JOIN apps a ON a.id = ac.app_id WHERE a.status IN ('approved','featured')`
    ).all();
    const byArea = new Map();
    for (const r of rows) {
      const point = curriculum?.point(r.point_id);
      if (!point) continue;
      if (!byArea.has(point.area_id)) byArea.set(point.area_id, new Set());
      byArea.get(point.area_id).add(r.app_id);
    }
    return [...byArea].map(([id, apps]) => ({ ...curriculum.area(id), apps: apps.size }))
      .sort((a, b) => a.subject_name.localeCompare(b.subject_name, 'sv') || a.id.localeCompare(b.id));
  }

  const SORTS = {
    newest: 'created_at DESC',
    popular: 'upvotes_count DESC, clicks_count DESC, created_at DESC',
    comments: 'comments_count DESC, created_at DESC',
    clicks: 'clicks_count DESC, created_at DESC',
    oldest: 'created_at ASC',
  };

  function listPublicApps({ search, subjects, ages, types, curriculumArea, sort = 'newest' } = {}) {
    const where = [`status IN ('approved','featured')`];
    const params = [];
    if (search) {
      where.push(`(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')`);
      params.push(likeEscape(search), likeEscape(search));
    }
    const rows = db.prepare(`SELECT * FROM apps WHERE ${where.join(' AND ')} ORDER BY ${SORTS[sort] || SORTS.newest}`).all(...params);
    let apps = withCategories(rows.map((r) => appRow(r)));
    const filterBy = (type, slugs) => {
      if (!slugs?.length) return;
      apps = apps.filter((a) => a.categories.some((c) => c.type === type && slugs.includes(c.slug)));
    };
    filterBy('subject', subjects);
    filterBy('age', ages);
    filterBy('app_type', types);
    if (curriculumArea) apps = apps.filter((a) => a.curriculum.some((p) => p.area_id === curriculumArea || p.id === curriculumArea));
    return apps;
  }

  function listAdminApps({ status, search, limit = 1000, order_by = 'created_at' } = {}) {
    const where = [];
    const params = [];
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    if (search) {
      where.push(`(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR url LIKE ? ESCAPE '\\')`);
      params.push(likeEscape(search), likeEscape(search), likeEscape(search));
    }
    const order = ['created_at', 'upvotes_count', 'clicks_count', 'comments_count', 'title'].includes(order_by) ? order_by : 'created_at';
    const dir = order === 'title' ? 'ASC' : 'DESC';
    const rows = db.prepare(
      `SELECT * FROM apps ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} ${dir} LIMIT ?`
    ).all(...params, limit);
    return withCategories(rows.map((r) => appRow(r, { admin: true })));
  }

  function getApp(id, { admin = false } = {}) {
    const r = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    if (!r) return null;
    if (!admin && !PUBLIC_STATUSES.includes(r.status)) return null;
    return withCategories([appRow(r, { admin })])[0];
  }

  function topApps(limit = 5) {
    const rows = db.prepare(
      `SELECT * FROM apps WHERE status IN ('approved','featured') ORDER BY clicks_count DESC LIMIT 6`
    ).all();
    // with categories: the cards frame the image in the colour of the app's subject
    return withCategories(rows
      .map((r) => {
        const a = appRow(r);
        return { ...a, score: (a.clicks_count || 0) + (a.upvotes_count || 0) * 2 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit));
  }

  function recentApps(limit = 6) {
    return withCategories(db.prepare(
      `SELECT * FROM apps WHERE status IN ('approved','featured') ORDER BY created_at DESC LIMIT ?`
    ).all(limit).map((r) => appRow(r)));
  }

  /** Up to 4 public apps sharing the most (non-device) categories with the app. */
  function relatedApps(id, limit = 4) {
    const rows = db.prepare(
      `SELECT a.*, COUNT(*) AS shared
       FROM app_categories mine
       JOIN categories c ON c.id = mine.category_id AND c.type <> 'device'
       JOIN app_categories other ON other.category_id = mine.category_id AND other.app_id <> mine.app_id
       JOIN apps a ON a.id = other.app_id AND a.status IN ('approved','featured')
       WHERE mine.app_id = ?
       GROUP BY a.id
       ORDER BY shared DESC, a.upvotes_count DESC, a.created_at DESC
       LIMIT ?`
    ).all(id, limit);
    return withCategories(rows.map((r) => appRow(r))).map((a) => ({
      id: a.id, title: a.title, description: a.description, image_url: a.image_url, url: a.url,
      categories: a.categories.filter((c) => c.type !== 'device').map((c) => ({ id: c.id, name: c.name, icon: c.icon, slug: c.slug, type: c.type })),
    }));
  }

  function setAppCategories(appId, categoryIds) {
    db.prepare('DELETE FROM app_categories WHERE app_id = ?').run(appId);
    const exists = db.prepare('SELECT 1 FROM categories WHERE id = ?');
    const insert = db.prepare('INSERT OR IGNORE INTO app_categories (app_id, category_id) VALUES (?, ?)');
    const unknown = [];
    for (const cid of new Set(categoryIds)) {
      if (exists.get(cid)) insert.run(appId, cid);
      else unknown.push(cid);
    }
    return unknown;
  }

  const APP_FIELDS = ['title', 'description', 'long_description', 'url', 'image_url', 'status', 'is_featured',
    'delist_reason', 'creator_name', 'user_id'];

  function createApp(fields, categoryIds) {
    const id = randomUUID();
    const t = now();
    return transaction(db, () => {
      db.prepare(
        `INSERT INTO apps (id, user_id, creator_name, title, description, long_description, url, image_url,
           status, is_featured, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, nul(fields.user_id), nul(fields.creator_name), fields.title, fields.description ?? '',
        nul(fields.long_description), fields.url, nul(fields.image_url), fields.status || 'approved',
        bool(fields.is_featured), t, t);
      const unknown = categoryIds?.length ? setAppCategories(id, categoryIds) : [];
      return { app: getApp(id, { admin: true }), unknown_category_ids: unknown };
    });
  }

  /**
   * Update an app. `patch` may hold any of APP_FIELDS; categoryIds (if given)
   * replaces all categories. Sends the "published" mail when a submission is
   * approved for the first time.
   */
  function updateApp(id, patch, categoryIds) {
    const before = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    if (!before) return null;
    const fields = { ...patch };
    if (fields.status && fields.status !== 'delisted' && fields.delist_reason === undefined) fields.delist_reason = null;
    if (fields.is_featured !== undefined) fields.is_featured = bool(fields.is_featured);
    const sets = APP_FIELDS.filter((f) => fields[f] !== undefined);
    let unknown = [];
    transaction(db, () => {
      if (sets.length) {
        db.prepare(`UPDATE apps SET ${sets.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
          .run(...sets.map((f) => nul(fields[f])), now(), id);
      }
      if (categoryIds) {
        unknown = setAppCategories(id, categoryIds);
        if (!sets.length) db.prepare('UPDATE apps SET updated_at = ? WHERE id = ?').run(now(), id);
      }
    });
    maybeNotifyPublished(db.prepare('SELECT * FROM apps WHERE id = ?').get(id), before.status);
    return { app: getApp(id, { admin: true }), unknown_category_ids: unknown };
  }

  // Names under skolappar.com that are never given to an app, whatever it is called on Shipholm.
  const RESERVED_LABELS = new Set(['www', 'api', 'admin', 'app', 'apps', 'mail', 'mcp', 'bygg', 'starter', 'skills', 'images', 'cf-bounce',
    'hermes', 'marre', 'skolappar', 'login', 'konto', 'help', 'hjalp', 'status', 'docs', 'blog', 'test', 'dev', 'staging', 'cdn', 'static']);

  /**
   * Make the app's address match its place in the catalogue. An app on Shipholm that is listed
   * gets <name>.skolappar.com; when it leaves the catalogue it goes back to the address it came
   * with. Safe to call at any time and more than once. Returns {url, changed, note}.
   */
  async function syncAddress(id) {
    const r = db.prepare('SELECT id, url, status, origin_url FROM apps WHERE id = ?').get(id);
    if (!r) return null;
    const live = PUBLIC_STATUSES.includes(r.status);
    const note = (text) => { db.prepare('UPDATE apps SET address_note = ? WHERE id = ?').run(text, id); return { url: r.url, changed: false, note: text }; };
    if (live && !r.origin_url) {
      const label = shipholm?.labelOf(r.url);
      if (!label) return { url: r.url, changed: false, note: null };          // not on Shipholm: its own address stays
      if (!shipholm.configured) return note('Ingen skolappar-adress: SHIPHOLM_API_KEY är inte satt.');
      if (RESERVED_LABELS.has(label)) return note(`Ingen skolappar-adress: namnet "${label}" är reserverat.`);
      try {
        await shipholm.grant(label);
      } catch (err) {
        log.warn?.(`address for ${id}: ${err.message}`);
        return note(`Ingen skolappar-adress: ${err.message}`);
      }
      const url = `https://${label}.${shipholm.ownDomain}/`;
      db.prepare('UPDATE apps SET origin_url = url, url = ?, address_note = NULL, updated_at = ? WHERE id = ?').run(url, now(), id);
      return { url, changed: true, note: null };
    }
    if (!live && r.origin_url) return releaseAddress(id);
    return { url: r.url, changed: false, note: null };
  }

  /** Take the skolappar address back (before an app is deleted, or when it leaves the catalogue). */
  async function releaseAddress(id) {
    const r = db.prepare('SELECT url, origin_url FROM apps WHERE id = ?').get(id);
    if (!r?.origin_url) return r ? { url: r.url, changed: false, note: null } : null;
    const label = shipholm?.labelOf(r.origin_url);
    let failed = null;
    try {
      if (label && shipholm.configured) await shipholm.revoke(label);
    } catch (err) {
      // the catalogue stops using the address either way; the note tells the reviewer it may still answer
      failed = `Adressen ${r.url} kunde inte tas tillbaka hos Shipholm: ${err.message}`;
      log.warn?.(`address for ${id}: ${err.message}`);
    }
    db.prepare('UPDATE apps SET url = origin_url, origin_url = NULL, address_note = ?, updated_at = ? WHERE id = ?').run(failed, now(), id);
    return { url: r.origin_url, changed: true, note: failed };
  }

  function maybeNotifyPublished(row, previousStatus) {
    if (!PUBLIC_STATUSES.includes(row.status) || PUBLIC_STATUSES.includes(previousStatus)) return;
    if (!row.submitter_email || !row.email_confirmed || row.published_notified_at) return;
    db.prepare('UPDATE apps SET published_notified_at = ? WHERE id = ?').run(now(), row.id);
    sendMail(row, 'published').catch(() => {});
  }

  // ---------- submission mails ----------

  const MAIL_KINDS = {
    confirm: (row) => confirmSubmissionMail({ siteUrl, token: row.confirm_token, appUrl: row.url }),
    published: (row) => appPublishedMail({ siteUrl, appId: row.id, title: row.title }),
  };

  /** Send one of the submission mails and remember the outcome on the app. */
  async function sendMail(row, kind) {
    if (!mailer) return { sent: false, reason: 'not_configured' };
    let result;
    try {
      result = await mailer.send({ to: row.submitter_email, ...MAIL_KINDS[kind](row) });
    } catch {
      result = { sent: false, reason: 'error' };
    }
    const value = result.sent ? 'sent' : result.reason === 'not_configured' ? 'not_configured' : `failed:${result.reason || 'error'}`;
    db.prepare(`UPDATE apps SET ${kind}_mail = ?, ${kind}_mail_at = ? WHERE id = ?`).run(value, now(), row.id);
    return result;
  }

  /** Why a mail cannot be (re)sent for this app, or null when it can. */
  function mailBlocker(row, kind) {
    if (!row.submitter_email) return 'no_submitter_email';
    if (kind === 'confirm') {
      if (row.email_confirmed) return 'already_confirmed';
      if (!row.confirm_token) return 'no_confirm_token';
    } else {
      if (!row.email_confirmed) return 'email_not_confirmed';
      if (!PUBLIC_STATUSES.includes(row.status)) return 'not_published';
    }
    return null;
  }

  /** Send the confirmation mail for a new submission (fire and forget from the API). */
  function sendConfirmation(id) {
    const row = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    if (!row || mailBlocker(row, 'confirm')) return Promise.resolve({ sent: false, reason: 'not_applicable' });
    return sendMail(row, 'confirm');
  }

  /** Admin: send a submission mail again. null = no such app; {error} = not applicable. */
  async function resendMail(id, kind) {
    if (!MAIL_KINDS[kind]) return { error: 'unknown_kind' };
    const row = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    if (!row) return null;
    const blocker = mailBlocker(row, kind);
    if (blocker) return { error: blocker };
    if (kind === 'published' && !row.published_notified_at) {
      db.prepare('UPDATE apps SET published_notified_at = ? WHERE id = ?').run(now(), id);
    }
    const result = await sendMail(row, kind);
    return { result, app: getApp(id, { admin: true }) };
  }

  function deleteApp(id) {
    return db.prepare('DELETE FROM apps WHERE id = ?').run(id).changes > 0;
  }

  /** increment_clicks: only public apps count; every open is also logged as an event. */
  function trackClick(id) {
    return transaction(db, () => {
      const changed = db.prepare(
        `UPDATE apps SET clicks_count = clicks_count + 1 WHERE id = ? AND status IN ('approved','featured')`
      ).run(id).changes;
      if (changed) db.prepare('INSERT INTO app_open_events (app_id, opened_at) VALUES (?, ?)').run(id, now());
      return changed > 0;
    });
  }

  // ---------- submissions ----------

  /**
   * A new suggestion, waiting for review. From the form: url and email. From an agent (MCP
   * submit_app): also the creator's first name, categories and the hash of the app's own key.
   */
  function createSubmission({ url, email, title, description, long_description, note, creator_name, categoryIds, keyHash }) {
    const id = randomUUID();
    const token = randomBytes(24).toString('base64url');
    const t = now();
    let fallbackTitle = url;
    try {
      fallbackTitle = new URL(url).hostname.replace(/^www\./, '');
    } catch { /* keep url */ }
    return transaction(db, () => {
      db.prepare(
        `INSERT INTO apps (id, title, description, long_description, url, status, creator_name, submitter_email, submitter_note,
           email_confirmed, confirm_token, app_key_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, 0, ?, ?, ?, ?)`
      ).run(id, title || fallbackTitle, description || '', nul(long_description), url, nul(creator_name), email, nul(note),
        token, nul(keyHash), t, t);
      const unknown = categoryIds?.length ? setAppCategories(id, categoryIds) : [];
      return { id, token, unknown_category_ids: unknown };
    });
  }

  /** Is this the key that submit_app handed out for the app? Constant-time on the hashes. */
  function appKeyMatches(id, key) {
    const row = db.prepare('SELECT app_key_hash FROM apps WHERE id = ?').get(id);
    if (!row?.app_key_hash || typeof key !== 'string' || !key) return false;
    const given = createHash('sha256').update(key).digest();
    return timingSafeEqual(given, Buffer.from(row.app_key_hash, 'hex'));
  }

  /** Is a public app already listed at this address? */
  function listedAt(url) {
    return db.prepare(`SELECT id FROM apps WHERE (url = ? OR origin_url = ?) AND status IN ('approved','featured') LIMIT 1`).get(url, url)?.id || null;
  }

  /** Where a submitted app is in the review – open to anyone who has its id, nothing about the submitter. */
  function appStatus(id) {
    const r = db.prepare('SELECT id, title, url, status, email_confirmed, delist_reason, created_at, updated_at, check_result, check_passed, checked_at FROM apps WHERE id = ?').get(id);
    if (!r) return null;
    const live = PUBLIC_STATUSES.includes(r.status);
    return {
      id: r.id, title: r.title, url: r.url, status: r.status, published: live,
      email_confirmed: Boolean(r.email_confirmed),
      page: live ? `${siteUrl}/app/${r.id}` : null,
      reason: live ? null : r.delist_reason || null,
      check: checkSummary(r),
      submitted_at: r.created_at, updated_at: r.updated_at,
    };
  }

  /** How a public app is used: opens and likes as plain counts, never anything about a visitor. */
  function appStats(id) {
    const r = db.prepare(`SELECT id, title, clicks_count, upvotes_count FROM apps WHERE id = ? AND status IN ('approved','featured')`).get(id);
    if (!r) return null;
    const end = new Date();
    const dayStart = (back) => new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - back)).toISOString();
    const opensSince = (from) => db.prepare('SELECT COUNT(*) AS n FROM app_open_events WHERE app_id = ? AND opened_at >= ?').get(id, from).n;
    const days = new Map(
      db.prepare('SELECT substr(opened_at, 1, 10) AS day, COUNT(*) AS n FROM app_open_events WHERE app_id = ? AND opened_at >= ? GROUP BY day')
        .all(id, dayStart(29)).map((d) => [d.day, d.n])
    );
    const daily = [];
    for (let back = 29; back >= 0; back--) {
      const day = dayStart(back).slice(0, 10);
      daily.push({ date: day, opens: days.get(day) || 0 });
    }
    const subject = db.prepare(
      `SELECT c.id, c.name FROM app_categories ac JOIN categories c ON c.id = ac.category_id
       WHERE ac.app_id = ? AND c.type = 'subject' ORDER BY c.sort_order LIMIT 1`
    ).get(id);
    let rank = null;
    if (subject) {
      const peers = db.prepare(
        `SELECT a.clicks_count AS n FROM apps a JOIN app_categories ac ON ac.app_id = a.id
         WHERE ac.category_id = ? AND a.status IN ('approved','featured')`
      ).all(subject.id);
      rank = { subject: subject.name, place: 1 + peers.filter((p) => p.n > r.clicks_count).length, of: peers.length };
    }
    return {
      id: r.id, title: r.title, page: `${siteUrl}/app/${r.id}`,
      opens: { today: opensSince(dayStart(0)), last_7_days: opensSince(dayStart(6)), last_30_days: opensSince(dayStart(29)), total: r.clicks_count || 0 },
      likes: r.upvotes_count || 0,
      rank_in_subject: rank,
      daily,
      timezone: 'UTC',
      tracking_since: TRACKING_SINCE,
    };
  }

  function confirmEmail(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return false;
    const r = db.prepare('SELECT id FROM apps WHERE confirm_token = ?').get(token);
    if (!r) return false;
    db.prepare('UPDATE apps SET email_confirmed = 1 WHERE id = ?').run(r.id);
    return true;
  }

  // ---------- upvotes ----------

  function toggleUpvote(kind, targetId, voterId) {
    const table = kind === 'idea' ? 'idea_upvotes' : 'app_upvotes';
    const col = kind === 'idea' ? 'idea_id' : 'app_id';
    const parent = kind === 'idea' ? 'ideas' : 'apps';
    const hash = voterHash(voterId);
    return transaction(db, () => {
      const target = kind === 'idea'
        ? db.prepare('SELECT id FROM ideas WHERE id = ?').get(targetId)
        : db.prepare(`SELECT id FROM apps WHERE id = ? AND status IN ('approved','featured')`).get(targetId);
      if (!target) return null;
      const removed = db.prepare(`DELETE FROM ${table} WHERE ${col} = ? AND voter_hash = ?`).run(targetId, hash).changes;
      let upvoted;
      if (removed) {
        db.prepare(`UPDATE ${parent} SET upvotes_count = MAX(upvotes_count - 1, 0) WHERE id = ?`).run(targetId);
        upvoted = false;
      } else {
        db.prepare(`INSERT INTO ${table} (${col}, voter_hash, created_at) VALUES (?, ?, ?)`).run(targetId, hash, now());
        db.prepare(`UPDATE ${parent} SET upvotes_count = upvotes_count + 1 WHERE id = ?`).run(targetId);
        upvoted = true;
      }
      const { upvotes_count } = db.prepare(`SELECT upvotes_count FROM ${parent} WHERE id = ?`).get(targetId);
      return { upvoted, upvotes_count };
    });
  }

  function myUpvotes(voterId) {
    const hash = voterHash(voterId);
    return {
      apps: db.prepare('SELECT app_id FROM app_upvotes WHERE voter_hash = ?').all(hash).map((r) => r.app_id),
      ideas: db.prepare('SELECT idea_id FROM idea_upvotes WHERE voter_hash = ?').all(hash).map((r) => r.idea_id),
    };
  }

  // ---------- resources ----------

  function resourceRow(r, { withContent = true } = {}) {
    const res = {
      id: r.id, title: r.title, slug: r.slug, excerpt: r.excerpt, category: r.category, icon: r.icon,
      sort_order: r.sort_order, is_published: Boolean(r.is_published), created_at: r.created_at, updated_at: r.updated_at,
    };
    if (withContent) res.content = r.content;
    return res;
  }

  function listResources({ category, publishedOnly = true, withContent = true, limit = 1000 } = {}) {
    const where = [];
    const params = [];
    if (publishedOnly) where.push('is_published = 1');
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    return db.prepare(
      `SELECT * FROM resources ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY sort_order, title LIMIT ?`
    ).all(...params, limit).map((r) => resourceRow(r, { withContent }));
  }

  function getResourceBySlug(slug) {
    const r = db.prepare('SELECT * FROM resources WHERE slug = ? AND is_published = 1 ORDER BY sort_order LIMIT 1').get(slug);
    return r ? resourceRow(r) : null;
  }

  function getResource(id) {
    const r = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
    return r ? resourceRow(r) : null;
  }

  const RESOURCE_FIELDS = ['title', 'slug', 'excerpt', 'content', 'category', 'icon', 'sort_order', 'is_published'];

  function createResource(fields) {
    const id = randomUUID();
    const t = now();
    db.prepare(
      `INSERT INTO resources (id, title, slug, excerpt, content, category, icon, sort_order, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, fields.title, fields.slug, nul(fields.excerpt), fields.content ?? '', fields.category, nul(fields.icon),
      fields.sort_order ?? 0, fields.is_published === undefined ? 1 : bool(fields.is_published), t, t);
    return getResource(id);
  }

  function updateResource(id, patch) {
    const fields = { ...patch };
    if (fields.is_published !== undefined) fields.is_published = bool(fields.is_published);
    const sets = RESOURCE_FIELDS.filter((f) => fields[f] !== undefined);
    if (sets.length) {
      db.prepare(`UPDATE resources SET ${sets.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
        .run(...sets.map((f) => nul(fields[f])), now(), id);
    }
    return getResource(id);
  }

  function deleteResource(id) {
    return db.prepare('DELETE FROM resources WHERE id = ?').run(id).changes > 0;
  }

  // ---------- settings ----------

  function allSettings() {
    const out = {};
    for (const r of db.prepare('SELECT key, value FROM settings ORDER BY key').all()) out[r.key] = parseJson(r.value);
    return out;
  }

  function listSettings({ keyPrefix } = {}) {
    const rows = keyPrefix
      ? db.prepare(`SELECT * FROM settings WHERE key LIKE ? ESCAPE '\\' ORDER BY key`).all(`${String(keyPrefix).replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
      : db.prepare('SELECT * FROM settings ORDER BY key').all();
    return rows.map((r) => ({ key: r.key, value: parseJson(r.value), updated_at: r.updated_at }));
  }

  function getSetting(key) {
    const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return r ? parseJson(r.value) : null;
  }

  function setSetting(key, value) {
    const t = now();
    db.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).run(key, JSON.stringify(value ?? null), t);
    return { key, value: value ?? null, updated_at: t };
  }

  // ---------- ideas ----------

  function ideaRow(r, { admin = false } = {}) {
    const idea = {
      id: r.id, user_id: r.user_id, title: r.title, description: r.description,
      target_age: r.target_age, target_subject: r.target_subject, status: r.status,
      claimed_by: r.claimed_by, claimed_at: r.claimed_at, built_app_id: r.built_app_id,
      upvotes_count: r.upvotes_count, comments_count: r.comments_count,
      created_at: r.created_at, updated_at: r.updated_at,
      creator_name: r.creator_name, claimer_name: r.claimer_name,
      profiles: personOrNull(r.creator_name),
      claimer: personOrNull(r.claimer_name),
    };
    if (admin) {
      idea.submitter_email = r.submitter_email;
      idea.profile = idea.profiles;
      idea.claimer_profile = idea.claimer;
    }
    return idea;
  }

  function listIdeas({ status, target_age, target_subject, search, sortBy, limit = 1000, admin = false } = {}) {
    const where = [];
    const params = [];
    if (status && status !== 'all') {
      where.push('status = ?');
      params.push(status);
    }
    if (target_age) {
      where.push('target_age = ?');
      params.push(target_age);
    }
    if (target_subject) {
      where.push('target_subject = ?');
      params.push(target_subject);
    }
    if (search) {
      where.push(`(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')`);
      params.push(likeEscape(search), likeEscape(search));
    }
    let order = 'created_at DESC';
    if (sortBy === 'popular') order = 'upvotes_count DESC, created_at DESC';
    if (sortBy === 'claimed') {
      where.push(`status = 'claimed'`);
      order = 'claimed_at DESC';
    }
    return db.prepare(
      `SELECT * FROM ideas ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} LIMIT ?`
    ).all(...params, limit).map((r) => ideaRow(r, { admin }));
  }

  function topIdeas(limit = 3) {
    return db.prepare(`SELECT * FROM ideas WHERE status = 'open' ORDER BY upvotes_count DESC, created_at DESC LIMIT ?`)
      .all(limit).map((r) => ideaRow(r));
  }

  function getIdea(id, { admin = false } = {}) {
    const r = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
    return r ? ideaRow(r, { admin }) : null;
  }

  function createIdea(fields) {
    const id = randomUUID();
    const t = now();
    db.prepare(
      `INSERT INTO ideas (id, creator_name, submitter_email, title, description, target_age, target_subject, status,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, nul(fields.creator_name), nul(fields.email), fields.title, fields.description ?? '',
      nul(fields.target_age), nul(fields.target_subject), fields.status || 'open', t, t);
    return getIdea(id, { admin: true });
  }

  const IDEA_FIELDS = ['title', 'description', 'target_age', 'target_subject', 'status', 'claimed_by', 'claimer_name',
    'claimed_at', 'built_app_id', 'creator_name'];

  function updateIdea(id, patch) {
    const fields = { ...patch };
    if (fields.status === 'open') {
      fields.claimed_by = null;
      fields.claimer_name = fields.claimer_name ?? null;
      fields.claimed_at = null;
    }
    if (fields.status === 'claimed' && fields.claimed_at === undefined) {
      const cur = db.prepare('SELECT claimed_at FROM ideas WHERE id = ?').get(id);
      if (cur && !cur.claimed_at) fields.claimed_at = now();
    }
    const sets = IDEA_FIELDS.filter((f) => fields[f] !== undefined);
    if (sets.length) {
      db.prepare(`UPDATE ideas SET ${sets.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
        .run(...sets.map((f) => nul(fields[f])), now(), id);
    }
    return getIdea(id, { admin: true });
  }

  function deleteIdea(id) {
    return db.prepare('DELETE FROM ideas WHERE id = ?').run(id).changes > 0;
  }

  function ideaStats() {
    const rows = db.prepare('SELECT status, upvotes_count, comments_count FROM ideas').all();
    const built = rows.filter((i) => i.status === 'built').length;
    return {
      total: rows.length,
      open: rows.filter((i) => i.status === 'open').length,
      claimed: rows.filter((i) => i.status === 'claimed').length,
      built,
      totalUpvotes: rows.reduce((s, i) => s + (i.upvotes_count || 0), 0),
      totalComments: rows.reduce((s, i) => s + (i.comments_count || 0), 0),
      conversionRate: rows.length ? Math.round((built / rows.length) * 100) : 0,
    };
  }

  // ---------- statistics ----------

  function publicStats() {
    const apps = db.prepare(
      `SELECT COUNT(*) AS n, COUNT(DISTINCT COALESCE(user_id, creator_name)) AS creators,
         COALESCE(SUM(upvotes_count), 0) AS upvotes
       FROM apps WHERE status IN ('approved','featured')`
    ).get();
    const subjects = db.prepare(`SELECT COUNT(*) AS n FROM categories WHERE type = 'subject'`).get().n;
    return { apps: apps.n, creators: apps.creators, subjects, upvotes: apps.upvotes };
  }

  function platformStats() {
    const count = (sql, ...p) => db.prepare(sql).get(...p).n;
    const byStatus = Object.fromEntries(APP_STATUSES.map((s) => [s, count('SELECT COUNT(*) AS n FROM apps WHERE status = ?', s)]));
    return {
      apps: { total: count('SELECT COUNT(*) AS n FROM apps'), ...byStatus },
      pending_unconfirmed_email: count(`SELECT COUNT(*) AS n FROM apps WHERE status = 'pending' AND submitter_email IS NOT NULL AND email_confirmed = 0`),
      ideas: count('SELECT COUNT(*) AS n FROM ideas'),
      resources: count('SELECT COUNT(*) AS n FROM resources'),
      categories: count('SELECT COUNT(*) AS n FROM categories'),
      upvotes: count('SELECT COALESCE(SUM(upvotes_count), 0) AS n FROM apps') + count('SELECT COALESCE(SUM(upvotes_count), 0) AS n FROM ideas'),
      clicks: count('SELECT COALESCE(SUM(clicks_count), 0) AS n FROM apps'),
    };
  }

  /** Same report as the old app_open_analytics RPC (UTC calendar days including today). */
  function appAnalytics(days = 7) {
    if (![7, 30, 90].includes(days)) throw new Error('days must be 7, 30 or 90');
    const end = new Date();
    const startDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - (days - 1)));
    const periodStart = startDay.toISOString();
    const periodEnd = end.toISOString();
    const counts = new Map(
      db.prepare('SELECT app_id, COUNT(*) AS n FROM app_open_events WHERE opened_at >= ? AND opened_at <= ? GROUP BY app_id')
        .all(periodStart, periodEnd).map((r) => [r.app_id, r.n])
    );
    const dailyRows = new Map(
      db.prepare('SELECT substr(opened_at, 1, 10) AS day, COUNT(*) AS n FROM app_open_events WHERE opened_at >= ? AND opened_at <= ? GROUP BY day')
        .all(periodStart, periodEnd).map((r) => [r.day, r.n])
    );
    const appRows = db.prepare('SELECT id, title, status, clicks_count, upvotes_count, comments_count FROM apps').all()
      .map((a) => ({
        id: a.id, title: a.title, status: a.status, total_opens: a.clicks_count || 0,
        period_opens: counts.get(a.id) || 0, upvotes: a.upvotes_count || 0, comments: a.comments_count || 0,
      }));
    appRows.sort((a, b) => b.period_opens - a.period_opens || b.total_opens - a.total_opens || a.title.localeCompare(b.title));
    const daily = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDay.getTime() + i * 86_400_000).toISOString().slice(0, 10);
      daily.push({ date: d, opens: dailyRows.get(d) || 0 });
    }
    return {
      period_days: days,
      period_start: periodStart,
      period_end: periodEnd,
      timezone: 'UTC',
      tracking_since: TRACKING_SINCE,
      total_opens: appRows.reduce((s, a) => s + a.total_opens, 0),
      period_opens: [...counts.values()].reduce((s, n) => s + n, 0),
      apps_opened: counts.size,
      apps: appRows.slice(0, 100),
      daily,
    };
  }

  return {
    db, voterHash,
    listCategories, getCategory, createCategory, updateCategory, deleteCategory,
    listPublicApps, listAdminApps, getApp, topApps, recentApps, relatedApps,
    createApp, updateApp, deleteApp, setAppCategories, trackClick,
    createSubmission, confirmEmail, sendConfirmation, resendMail,
    appKeyMatches, saveCheck, setOwnImage, setCurriculum, curriculumUsed, syncAddress, releaseAddress, listedAt, appStatus, appStats,
    toggleUpvote, myUpvotes,
    listResources, getResource, getResourceBySlug, createResource, updateResource, deleteResource,
    allSettings, listSettings, getSetting, setSetting,
    listIdeas, topIdeas, getIdea, createIdea, updateIdea, deleteIdea, ideaStats,
    publicStats, platformStats, appAnalytics,
    log,
  };
}
