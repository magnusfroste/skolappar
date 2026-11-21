// SQLite database: opening, schema and migrations.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Migrations run in order; each one moves the schema to version index + 1.
 * Never edit a released migration – append a new one.
 */
const MIGRATIONS = [
  `
  CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX categories_type_idx ON categories(type, sort_order);

  CREATE TABLE apps (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    creator_name TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    long_description TEXT,
    url TEXT NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','approved','rejected','featured','delisted')),
    is_featured INTEGER NOT NULL DEFAULT 0,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    delist_reason TEXT,
    submitter_email TEXT,
    submitter_note TEXT,
    email_confirmed INTEGER NOT NULL DEFAULT 0,
    confirm_token TEXT UNIQUE,
    published_notified_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX apps_status_idx ON apps(status, created_at);

  CREATE TABLE app_categories (
    app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (app_id, category_id)
  );
  CREATE INDEX app_categories_category_idx ON app_categories(category_id);

  CREATE TABLE app_open_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    opened_at TEXT NOT NULL
  );
  CREATE INDEX app_open_events_time_idx ON app_open_events(opened_at, app_id);

  CREATE TABLE app_upvotes (
    app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (app_id, voter_hash)
  );
  CREATE INDEX app_upvotes_voter_idx ON app_upvotes(voter_hash);

  CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX resources_slug_idx ON resources(slug);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE ideas (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    creator_name TEXT,
    submitter_email TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_age TEXT,
    target_subject TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    claimed_by TEXT,
    claimer_name TEXT,
    claimed_at TEXT,
    built_app_id TEXT,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX ideas_status_idx ON ideas(status, created_at);

  CREATE TABLE idea_upvotes (
    idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (idea_id, voter_hash)
  );
  CREATE INDEX idea_upvotes_voter_idx ON idea_upvotes(voter_hash);

  -- Remembers which remote image URL was stored as which local file, so imports
  -- and repeated image updates do not download the same file again.
  CREATE TABLE image_sources (
    url TEXT PRIMARY KEY,
    file TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE server_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export function openDatabase(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, 'skolappar.db'));
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  migrate(db);
  return db;
}

export function migrate(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  let row = db.prepare('SELECT version FROM schema_version').get();
  if (!row) {
    db.prepare('INSERT INTO schema_version (version) VALUES (0)').run();
    row = { version: 0 };
  }
  for (let v = row.version; v < MIGRATIONS.length; v++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[v]);
      db.prepare('UPDATE schema_version SET version = ?').run(v + 1);
    });
  }
}

export function schemaVersion(db) {
  return db.prepare('SELECT version FROM schema_version').get().version;
}

export const LATEST_SCHEMA_VERSION = MIGRATIONS.length;

/** Run fn inside a transaction (nested calls join the outer one). */
export function transaction(db, fn) {
  if (db.isTransaction) return fn();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/** A random per-installation secret (used to hash anonymous voter ids). */
export function serverSecret(db, key = 'voter_salt') {
  const row = db.prepare('SELECT value FROM server_meta WHERE key = ?').get(key);
  if (row) return row.value;
  const value = randomBytes(32).toString('hex');
  db.prepare('INSERT OR IGNORE INTO server_meta (key, value) VALUES (?, ?)').run(key, value);
  return db.prepare('SELECT value FROM server_meta WHERE key = ?').get(key).value;
}
