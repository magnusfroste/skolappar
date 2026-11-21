# Skolappar 📚

A Swedish catalogue of small educational web apps for children, made by parents (www.skolappar.com).
Visitors browse and play apps, upvote, suggest apps ("Tipsa om en app") and post app ideas. There are no
user accounts; the site is administered at `/admin` and by an AI agent over MCP (`/mcp`).

## How it is built

- **Frontend:** React + TypeScript + Vite, shadcn/ui and Tailwind (`src/`). It talks only to the site's own
  JSON API through `src/lib/api.ts`.
- **Server:** `server/` – plain Node (≥ 22.16, runs on 24) with no runtime npm dependencies: `node:http` and
  the built-in `node:sqlite`. It serves the built frontend (`dist/`, SPA fallback), the API under `/api`,
  images under `/images`, `/mcp`, `/llms.txt`, `/sitemap.xml` and `/healthz`.
- **Data:** SQLite at `$DATA_DIR/skolappar.db` (WAL mode; the schema is created and migrated at start, see
  `server/db.mjs`). Images live in `$DATA_DIR/images` (content-addressed file names).
- **Container:** the root `Dockerfile` (build with Vite, run `node server/index.mjs` as uid 10001 on `$PORT`).

| File | What it does |
| --- | --- |
| `server/app.mjs` | routes: public API, admin API, MCP, images, SEO files, static files |
| `server/store.mjs` | all reads and writes (shared by API, admin and MCP) |
| `server/mcp.mjs` | MCP endpoint and tools (JSON-RPC 2.0, plain JSON responses) |
| `server/importer.mjs` | one-shot import of the old Supabase data (`POST /api/admin/import`) |
| `server/mailer.mjs` | outgoing mail (only logs until a mail API is configured) |

## Configuration (environment variables)

| Variable | Required | Meaning |
| --- | --- | --- |
| `ADMIN_KEY` | yes (secret) | protects `/api/admin/*`, `/admin` and `/mcp` (`Authorization: Bearer …`). Without it they answer 503 and the public site still works. |
| `PORT` | no | default 8080 |
| `DATA_DIR` | no | default `./data`; a persistent disk in production (`/data`) |
| `SITE_URL` | no | absolute URLs in llms.txt, sitemap and mails; default `https://www.skolappar.com` |
| `MAIL_API_URL`, `MAIL_API_KEY`, `MAIL_FROM` | no | an HTTP mail API with a Resend-compatible JSON body. Unset: mails are only logged. |
| `SUBMIT_RATE_LIMIT` | no | submissions and ideas per IP and hour (default 5) |

## Run locally

```bash
npm install
npm run build
ADMIN_KEY=dev-key DATA_DIR=./data npm start      # http://localhost:8080
```

For frontend work with hot reload: `PORT=8787 ADMIN_KEY=dev-key npm run dev:server` in one terminal and
`npm run dev` in another (Vite proxies `/api`, `/images` and `/mcp` to port 8787).

## Tests

```bash
npm test            # node --test: server tests in server/test/
```

## Administration

- `/admin` asks for the admin key (kept in `sessionStorage` for the tab) and shows pending submissions,
  all apps (edit, status, image, categories), statistics, ideas, categories, resources and the
  branding/theme/font/SEO/AEO settings.
- MCP: `POST /mcp` with `Authorization: Bearer $ADMIN_KEY`. Tools: `list_submissions`, `list_apps`, `get_app`,
  `create_app`, `update_app`, `set_app_image`, `delete_app`, ideas, resources, categories, settings,
  `platform_stats` and `app_analytics`.

## Import from Supabase

`POST /api/admin/import` (admin key, JSON, up to 20 MB) with
`{categories, apps, app_categories, resources, settings, ideas}` (optionally `upvotes`, `idea_upvotes`,
`app_open_events`) using the Supabase column names; apps and ideas may carry `creator_name`. Everything is
upserted in one transaction, images (apps' `image_url` and image settings) are downloaded into
`DATA_DIR/images` and rewritten to `/images/…`. Running it twice is safe.

## Hälsokoll av appar

`scripts/check-apps.mjs` hämtar alla publicerade appar från sajtens API (`SITE_URL`, standard
www.skolappar.com) och kontrollerar att varje app-URL svarar.

```bash
node scripts/check-apps.mjs
```

GitHub Action `.github/workflows/app-health.yml` kör samma koll varje måndag och öppnar ett issue (etikett
`app-health`) om någon app slutat svara.

## License

MIT
