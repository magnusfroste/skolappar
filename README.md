# Skolappar 📚

A Swedish catalogue of small educational web apps for children, made by parents (www.skolappar.com).
Visitors browse and play apps, upvote, suggest apps ("Tipsa om en app") and post app ideas. There are no
user accounts; the site is administered at `/admin` and by an AI agent over MCP (`/mcp`). The same endpoint has an open
part, without a key, where a parent's agent submits the app it built and follows it.

## How it is built

- **Frontend:** React + TypeScript + Vite, shadcn/ui and Tailwind (`src/`). It talks only to the site's own
  JSON API through `src/lib/api.ts`.
- **Server:** `server/` – plain Node (≥ 22.16, runs on 24) with no runtime npm dependencies: `node:http` and
  the built-in `node:sqlite`. It serves the built frontend (`dist/`, SPA fallback), the API under `/api`,
  images under `/images`, `/mcp`, `/llms.txt`, `/guide.md`, `/sitemap.xml` and `/healthz`.
- **Data:** SQLite at `$DATA_DIR/skolappar.db` (WAL mode; the schema is created and migrated at start, see
  `server/db.mjs`). Images live in `$DATA_DIR/images` (content-addressed file names).
- **Container:** the root `Dockerfile` (build with Vite, run `node server/index.mjs` as uid 10001 on `$PORT`).

| File | What it does |
| --- | --- |
| `server/app.mjs` | routes: public API, admin API, MCP, images, SEO files, static files |
| `server/store.mjs` | all reads and writes (shared by API, admin and MCP) |
| `server/mcp.mjs` | MCP endpoint and the administration tools (JSON-RPC 2.0, plain JSON responses) |
| `server/mcp-public.mjs` | the open MCP tools: read the catalogue, submit an app, follow it |
| `server/check.mjs` | `check_app`: what an address shows about an app without a browser (https, no login, title, lang, viewport, icon, tracking, foreign scripts, links out, touch-action, weight), each finding pointing to a guide section. Run at `submit_app` and kept on the app (`check` for the reviewer and in `app_status`; `guide_ok` shows "Följer guiden" on the app's page) |
| `server/content/kotten.js` | the snippet apps load from `/kotten.js`: counts a start and play time, and what the app reports (`skolappar.event`: rounds, result, level, hint, sound off; the last level when the child leaves). Sent with `sendBeacon` to `POST /api/events`, which knows the app by the page's address and adds to `app_events_daily` (per app, day and event; levels also per level). No cookies, no storage, no ids, no IP address kept. Read in `app_stats` as `in_app` (30 days, with a level funnel) |
| `weeklyDigests` in `server/store.mjs`, `weeklyDigestMail` in `server/mailer.mjs` | the weekly letter to makers: every Monday from 08:00 Swedish time (an hourly timer, once per ISO week, setting `digest_week`; `DIGEST=off` stops it), one mail per confirmed address behind listed apps that had any visit – opens this week and the week before, and from the snippet rounds, finished share, result, minutes, furthest level, where most stopped, and one idea for the next version. Stop link `/brev/av/<app id>.<signature>` (a button first; stops every app of that address, `digest_off`). Admin tool `send_weekly_letter` (dry run by default, no addresses) |
| `server/safefetch.mjs` | fetches addresses given by visitors and agents (card images, `check_app`); refuses private, loopback and link-local addresses at every hop |
| `server/content.mjs`, `server/content/` | the starter template (`content/starter/`, live at `/starter/`, MCP `get_starter`) and the agent skills (`content/skills/<name>/SKILL.md`, `/skills`, MCP `list_skills`/`get_skill`): plain files, read at start |
| `server/curriculum.mjs`, `server/content/lgr22.json` | Lgr22: the central content of 17 subjects from Skolverket's open Syllabus API, built by `node scripts/lgr22.mjs` (run again when a syllabus changes, and read the diff: ids are by position). MCP `get_curriculum`, `GET /api/curriculum`; an app is linked with `curriculum_ids` (table `app_curriculum`), shown on its page and filtered on with `/api/apps?lgr=<area>` |
| `rankScores` in `server/store.mjs` | the recommended order (`/api/apps?sort=recommended`, the start page, `/apps` by default, `list_apps`): one score per app, the same for every visitor – opens in 7 days (log), likes, children stay (finished rounds and minutes from the snippet, neutral below 5 reports), new (fades over 14 days), featured, and a small shake seeded by the date. Weights in `RANK` |
| `src/components/MoreLikeThis.tsx`, `src/hooks/usePlayedInTab.ts` | "Mer som det här" on the start page: apps of the same subject and grade as those just opened in this tab. The tab keeps the last five ids in `sessionStorage` (gone when the tab closes); nothing is sent |
| `src/components/WeeklyRocket.tsx` | "Veckans spelraket" on the start page: the listed app whose id is in the setting `weekly_app_id` (set with `set_setting`; Hermes can rotate it weekly). Hidden when the setting is empty or the app is not listed |
| `server/guide.mjs` | the build guide "Så bygger du en skolapp": one text for the page `/bygg`, `/guide.md`, `/api/guide`, `llms.txt` and the MCP tool `get_guide` |
| `server/importer.mjs` | one-shot import of the old Supabase data (`POST /api/admin/import`) |
| `server/mailer.mjs` | outgoing mail behind one interface: Cloudflare, Brevo, a Resend-compatible API or a logging stub |

## Configuration (environment variables)

| Variable | Required | Meaning |
| --- | --- | --- |
| `ADMIN_KEY` | yes (secret) | protects `/api/admin/*`, `/admin` and the administration tools of `/mcp` (`Authorization: Bearer …`). Without it the admin API answers 503; the public site and the open part of `/mcp` still work. |
| `AGENT_KEY_HASHES` | no | SHA-256 hashes (hex, comma separated) of agent keys that open the administration tools of `/mcp` only – as `Authorization: Bearer …` or `X-Api-Key`. Holds the hash of the `skol_…` key the agent had on Supabase, so it keeps its key. New key: `openssl rand -hex 24`, hash it with `printf %s "$KEY" \| sha256sum`. |
| `PORT` | no | default 8080 |
| `DATA_DIR` | no | default `./data`; a persistent disk in production (`/data`) |
| `SITE_URL` | no | absolute URLs in llms.txt, sitemap and mails; default `https://www.skolappar.com` |
| `MAIL_PROVIDER` | no | `cloudflare`, `brevo`, `resend` or `stub` (see [Mail](#mail)). Default: `resend` if `MAIL_API_URL` is set, else `stub` (mails are only logged). |
| `MAIL_FROM` | for mail | sender, e.g. `Skolappar <hej@skolappar.com>` |
| `MAIL_API_KEY` | for mail (secret) | the provider's API token or key |
| `MAIL_CLOUDFLARE_ACCOUNT_ID` | for `cloudflare` | the Cloudflare account that owns the sending domain |
| `MAIL_API_URL` | for `resend` | endpoint of a Resend-compatible API |
| `SUBMIT_RATE_LIMIT` | no | submissions and ideas per IP and hour (default 5) |
| `SHIPHOLM_API_KEY` | no (secret) | an API key of the Shipholm account that serves skolappar.com. With it an app at `<name>.shipholm.dev` gets `<name>.skolappar.com` when it is approved (Shipholm's `grant_subdomain`) and gives it back when it is delisted or deleted (`server/shipholm.mjs`, `syncAddress` in the store). Without it apps keep the address they came with |
| `DIGEST` | no | `off` stops the weekly letter to makers (it is on by default and needs mail to be set up) |
| `PARTNER_KEYS` | no (secret) | partners such as Shipholm Studio, as `name:sha256hex` pairs (comma separated). A partner sends its key as `X-Partner-Key` on `/mcp` and on the image upload. It opens no admin tool. It gets its own limits instead of the per-IP ones (submit 100, check 500, image 200 an hour), its submissions carry `source: <name>`, and `submit_app(email_verified: true)` skips the confirmation mail – for an address the partner has verified itself. A key that matches no partner is 401 |
| `CHECK_RATE_LIMIT` | no | `check_app` calls without a key per IP and hour (default 30) |
| `ALLOW_PRIVATE_FETCH` | no | `true` lets image downloads and `check_app` reach private addresses – local development only |

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
- MCP, administration: `POST /mcp` with `Authorization: Bearer $ADMIN_KEY` (or an agent key, see `AGENT_KEY_HASHES`). Tools: `list_submissions`, `resend_mail`, `list_apps`, `get_app`,
  `create_app`, `update_app`, `set_app_image`, `delete_app`, ideas, resources, categories, settings,
  `platform_stats` and `app_analytics` – plus the open tools below. A wrong key is 401, never the open part.
- MCP, open: `POST /mcp` without a key (`server/mcp-public.mjs`). Read: `get_guide`, `publish_on_shipholm` (the steps to put an app on Shipholm: the parent allows it in the browser, no key to copy), `get_curriculum`, `get_starter`, `list_skills`, `get_skill`, `check_app`, `list_categories`, `list_apps`,
  `get_app`, `list_ideas`, `list_resources`, `app_status`, `app_stats` (openings and likes of any listed
  app; nothing about visitors). Write: `submit_app` (https address, title, description, the parent's first
  name and e-mail; same queue, confirmation mail and hourly limit per address as the form) answers with an
  `app_key` for that one app – shown once, only its SHA-256 is kept – which `update_my_app`, `set_my_app_image` (while the app
  waits or was rejected) and `withdraw_my_app` take. The card image is given as SVG text, as an address, or uploaded as
  a file: `PUT /api/apps/<id>/image` with the header `X-App-Key` and the file as the body (20 an hour per address).
  An app without an image gets a card in its subject's colour with the subject's symbol. On a listed app a change with the key waits for review
  (`proposed_change`; the reviewer's `list_changes` / `review_change`) while the listed version stays, so nothing
  unreviewed reaches the catalogue. A lost key: `recover_app_keys(email)` mails a link to that address
  (`/nyckel/<token>`, a day, once, three a day per address); the page gives a new key per app and the old ones
  stop working. The address is never an identifier by itself – it only receives the link. The e-mail address is never returned.

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
