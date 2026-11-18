import { test } from 'node:test';
import assert from 'node:assert/strict';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const session = JSON.parse(process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON || '{}');
assert.ok(url && key && session.access_token, 'Run with the app connection and injected admin session');
async function report(days, token = session.access_token) {
  return fetch(`${url}/rest/v1/rpc/app_open_analytics`, {
    method: 'POST', headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ period_days: days }),
  });
}

test('anonymous visitors cannot read admin opening statistics', async () => {
  const response = await report(7, key);
  assert.ok([401, 403].includes(response.status));
});
for (const days of [7, 30, 90]) {
  test(`admin report returns exactly ${days} UTC days including today`, async () => {
    const response = await report(days);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.period_days, days);
    assert.equal(data.daily.length, days);
    assert.equal(data.daily.at(-1).date, data.period_end.slice(0, 10));
    assert.equal(data.timezone, 'UTC');
    assert.equal(data.daily.reduce((sum, day) => sum + day.opens, 0), data.period_opens);
  });
}
test('unsupported reporting period is rejected', async () => {
  assert.equal((await report(8)).status, 400);
});