import assert from 'node:assert/strict';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key, 'Public app connection must be available');
async function read(table, select) {
  const response = await fetch(`${url}/rest/v1/${table}?select=${select}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  assert.equal(response.status, 200, `${table} must remain readable`);
  return response.json();
}
const [profiles, apps, ideas, comments, ideaComments] = await Promise.all([
  read('profiles', 'id'), read('apps', 'id,user_id,status'),
  read('ideas', 'user_id,claimed_by'), read('comments', 'user_id,app_id'),
  read('idea_comments', 'user_id'),
]);
const publicApps = apps.filter(a => ['approved', 'featured'].includes(a.status));
const appIds = new Set(publicApps.map(a => a.id));
const allowed = new Set([
  ...publicApps.map(a => a.user_id),
  ...ideas.flatMap(i => [i.user_id, i.claimed_by]).filter(Boolean),
  ...comments.filter(c => appIds.has(c.app_id)).map(c => c.user_id),
  ...ideaComments.map(c => c.user_id),
]);
assert.ok(profiles.length > 0, 'Public creator profiles must remain visible');
assert.equal(profiles.filter(p => !allowed.has(p.id)).length, 0, 'Anonymous readers must not see non-contributing profiles');
console.log('PASS: anonymous profile reads are restricted to public contributors');