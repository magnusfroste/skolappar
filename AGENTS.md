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
- Opening counts: `POST /api/apps/:id/click` counts only listed apps and logs a timestamped event without
  visitor identity; the admin view and the `app_analytics` MCP tool read the same report.
- Reuse a shared app-thumbnail component across card variants so screenshot and fallback behaviour stays consistent.
