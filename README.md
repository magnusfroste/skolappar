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
| `server/mailer.mjs` | outgoing mail behind one interface: Cloudflare, Brevo, a Resend-compatible API or a logging stub |

## Configuration (environment variables)

| Variable | Required | Meaning |
| --- | --- | --- |
| `ADMIN_KEY` | yes (secret) | protects `/api/admin/*`, `/admin` and `/mcp` (`Authorization: Bearer …`). Without it they answer 503 and the public site still works. |
| `PORT` | no | default 8080 |
| `DATA_DIR` | no | default `./data`; a persistent disk in production (`/data`) |
| `SITE_URL` | no | absolute URLs in llms.txt, sitemap and mails; default `https://www.skolappar.com` |
| `MAIL_PROVIDER` | no | `cloudflare`, `brevo`, `resend` or `stub` (see [Mail](#mail)). Default: `resend` if `MAIL_API_URL` is set, else `stub` (mails are only logged). |
| `MAIL_FROM` | for mail | sender, e.g. `Skolappar <hej@skolappar.com>` |
| `MAIL_API_KEY` | for mail (secret) | the provider's API token or key |
| `MAIL_CLOUDFLARE_ACCOUNT_ID` | for `cloudflare` | the Cloudflare account that owns the sending domain |
| `MAIL_API_URL` | for `resend` | endpoint of a Resend-compatible API |
| `SUBMIT_RATE_LIMIT` | no | submissions and ideas per IP and hour (default 5) |

## Mail

The server sends two mails: the confirmation link after a suggestion (`POST /api/submissions`) and a note
when a confirmed suggestion is published. Both go through `createMailer()` in `server/mailer.mjs`; the
provider is chosen by `MAIL_PROVIDER`. If a provider lacks a setting the server logs a warning at start and
falls back to the stub, so the site keeps working. Each send logs `mail "<subject>" sent via <provider>` or
the failure reason (never the recipient).

The outcome of the last confirmation and published mail is stored per submission (`confirm_mail`,
`published_mail` and their times on `apps`) and shown in `/admin` (review list and app editor) with a
**Skicka igen** button; the API is `POST /api/admin/apps/:id/resend-mail` `{kind: "confirm"|"published"}`
and the MCP tool `resend_mail`. Full delivery history lives in Cloudflare (Email Sending → Activity log).

**Cloudflare (current).** [Email Sending](https://developers.cloudflare.com/email-service/) REST API, which
reaches any recipient. Needs the Workers Paid plan on the account (3,000 mails a month included) and
`skolappar.com` onboarded under *Compute → Email Service → Email Sending* (that adds the `cf-bounce` SPF/DKIM
records and DMARC). Settings: `MAIL_PROVIDER=cloudflare`, `MAIL_FROM`, `MAIL_CLOUDFLARE_ACCOUNT_ID`, and
`MAIL_API_KEY` = an account API token with only **Email Sending: Edit**.

**Switch to Brevo.** In Brevo, verify the sender domain `skolappar.com` (it adds its own DKIM/DMARC TXT
records; add them in Cloudflare DNS) and create an API key (*SMTP & API → API keys*). Then, on Shipholm
(tenant `wm7w6gke`, app `skolappar`):

```bash
./agentbuild env set --app skolappar wm7w6gke MAIL_PROVIDER brevo
./agentbuild env set --app skolappar --secret wm7w6gke MAIL_API_KEY      # paste the Brevo key on stdin
./agentbuild env unset --app skolappar wm7w6gke MAIL_CLOUDFLARE_ACCOUNT_ID
```

(or `set_env` over the Shipholm MCP API), commit and push the platform repo. `MAIL_FROM` stays. No code
change is needed; to add another provider, add an entry to `PROVIDERS` in `server/mailer.mjs` with a test in
`server/test/mailer.test.mjs`.

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
- MCP: `POST /mcp` with `Authorization: Bearer $ADMIN_KEY`. Tools: `list_submissions`, `resend_mail`, `list_apps`, `get_app`,
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
