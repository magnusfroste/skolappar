# Architecture rules

- The site has no user accounts. Visitors suggest apps (`POST /api/submissions`, stored as `pending` with the
  submitter's email) and post ideas anonymously; both are rate-limited per IP. Upvotes are anonymous: the
  browser keeps a random id in localStorage and the server stores only sha256(id + server secret).
- All data access goes through `server/store.mjs`, so the public API, the admin API and the MCP tools share
  one set of rules. The frontend talks to the server only via `src/lib/api.ts`.
- The server has no runtime npm dependencies (Node built-ins only, `node:sqlite`). Schema changes are new
  entries appended to `MIGRATIONS` in `server/db.mjs` – never edit a released one.
- Admin (`/api/admin/*`, `/admin`, the administration tools of `/mcp`) is protected by the `ADMIN_KEY` secret.
  `/mcp` without a key is the open part (`server/mcp-public.mjs`): it must never return an e-mail address or
  let anything unreviewed into the catalogue. Without `ADMIN_KEY` the admin endpoints
  answer 503 and the public site keeps working. Never log the admin key or email addresses.
- The build guide lives in `server/guide.mjs` only; the page `/bygg`, `/guide.md` and `get_guide` render it.
  A tool it names must exist in the open MCP part (a test checks that).
- The starter template and the skills are files under `server/content/`. They name tools and guide sections;
  a test checks that each exists, so rename in both places.
- An address that a visitor or an agent gave us is fetched with `fetchOutside` (`server/safefetch.mjs`), never
  with plain `fetch`: the open MCP part must not be a way into the cluster's network.
- An app's address in the catalogue follows its status: call `store.syncAddress(id)` after a status change and
  `store.releaseAddress(id)` before a delete, or a `<name>.skolappar.com` address is left behind at Shipholm.
- Opening counts: `POST /api/apps/:id/click` counts only listed apps and logs a timestamped event without
  visitor identity; the admin view and the `app_analytics` MCP tool read the same report.
- Reuse a shared app-thumbnail component across card variants so screenshot and fallback behaviour stays consistent.
