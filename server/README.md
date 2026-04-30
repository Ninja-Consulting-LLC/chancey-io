# Chancey contact-form worker

A small Cloudflare Worker that backs the contact form on
[chancey.io/contact/](https://chancey.io/contact/). It:

1. Accepts a JSON POST from the static marketing site.
2. Verifies a Google reCAPTCHA v3 token.
3. Forwards the message to the admin inbox via Amazon SES SMTP using
   [`worker-mailer`](https://www.npmjs.com/package/worker-mailer).

The Worker is intentionally separate from the static site so the marketing
site can stay on GitHub Pages with no server runtime.

The repo layout, wrangler config, env-file pattern, and deploy scripts mirror
[`chancey-api`](../../chancey/chancey-api).

---

## Layout

| File | Purpose |
| --- | --- |
| `wrangler.jsonc` | Two envs: `dev` (`chancey-contact-dev`) and `production` (`chancey-contact`). |
| `.env.deploy` *(gitignored)* | CLI-only `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`. Source before running deploys. |
| `.env.deploy.example` | Committed template with instructions. |
| `.dev.vars` *(gitignored)* | Worker-runtime secrets used by `wrangler dev`. |
| `.dev.vars.example` | Committed template with instructions. |
| `src/worker.ts` | The Worker handler. |

`.gitignore` already excludes `.env.deploy`, `.dev.vars`, `.dev.vars.*`, and
`.wrangler/`.

---

## One-time setup

### 1. Register reCAPTCHA v3

1. Open <https://www.google.com/recaptcha/admin/create>.
2. Pick **reCAPTCHA v3**.
3. Add `chancey.io` (and `localhost` for local testing).
4. Copy the **site key** (public — for the static site build) and the
   **secret key** (for the Worker).

### 2. Configure the static site (build-time, public)

In your build environment (or in your shell before `npm run build`):

```bash
export PUBLIC_RECAPTCHA_SITE_KEY="..."
export PUBLIC_CONTACT_ENDPOINT="https://chancey-contact.ninjaconsultingllc.workers.dev"
# (or your custom-domain URL once you set one)
```

These are baked into the static site at build time — they're public-safe.

### 3. Configure deploy credentials (CLI-only, never runtime)

```bash
cp .env.deploy.example .env.deploy
# Fill in CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID — see comments
# in the example file for where to get them.
```

### 4. Configure runtime secrets for local dev

```bash
cp .dev.vars.example .dev.vars
# Fill in SMTP_USER, SMTP_PASSWORD, MAIL_FROM, MAIL_TO, RECAPTCHA_SECRET.
```

### 5. Configure runtime secrets for prod (one-time per env)

```bash
set -a; source .env.deploy; set +a

# dev:
npx wrangler secret put SMTP_USER --env dev
npx wrangler secret put SMTP_PASSWORD --env dev
npx wrangler secret put MAIL_FROM --env dev
npx wrangler secret put MAIL_TO --env dev
npx wrangler secret put RECAPTCHA_SECRET --env dev

# production:
npx wrangler secret put SMTP_USER --env production
npx wrangler secret put SMTP_PASSWORD --env production
npx wrangler secret put MAIL_FROM --env production
npx wrangler secret put MAIL_TO --env production
npx wrangler secret put RECAPTCHA_SECRET --env production
```

(Each command opens a one-line stdin prompt — paste the value, hit return.)

---

## Deploy

### Via CI (preferred)

The `.github/workflows/contact-worker.yml` workflow ships every change once
the GitHub repo has these set:

- **Secrets** (Settings → Secrets and variables → Actions → Secrets):
  - `CLOUDFLARE_API_TOKEN` — same value as `chancey-api`.
  - `CLOUDFLARE_ACCOUNT_ID` — same value as `chancey-api`.
- **Environments** (Settings → Environments):
  - `chancey-contact-dev` — no reviewer needed.
  - `chancey-contact-prod` — no reviewer needed if production should deploy
    automatically when changes merge to `main`.

Then:

| Trigger | Action |
| --- | --- |
| Pull request that touches `server/**` | typecheck + `wrangler deploy --dry-run` for both envs |
| Push to `main` (touching `server/**`) | auto-deploy to **dev**, then **production** |
| Actions UI → "Run workflow" | manual deploy to `dev` or `production` |

Worker *runtime* secrets (`SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`,
`MAIL_TO`, `RECAPTCHA_SECRET`) are set **once** with `wrangler secret put`
and persist on the Worker — CI never sees them.

### Manual / local deploy

```bash
set -a; source .env.deploy; set +a

# Validate without deploying:
npm run check          # dev env
npm run check:prod     # production env

# Deploy:
npm run deploy:dev     # → chancey-contact-dev.<your>.workers.dev
npm run deploy:prod    # → chancey-contact.<your>.workers.dev (or routed domain)

# Live logs:
npm run tail:dev
npm run tail:prod
```

---

## Local development

```bash
npm install                         # one-time
cp .dev.vars.example .dev.vars      # fill in real values
npm run dev                         # serves at http://127.0.0.1:8787
```

Point the static dev server at the local Worker:

```bash
cd ..    # back to the marketing site root
PUBLIC_RECAPTCHA_SITE_KEY=test-site-key \
PUBLIC_CONTACT_ENDPOINT=http://127.0.0.1:8787 \
npm run dev
```

reCAPTCHA v3 only works on registered domains. If you didn't add `localhost`
to your reCAPTCHA registration, leave `PUBLIC_RECAPTCHA_SITE_KEY` empty for
local development — the Worker is permissive when `RECAPTCHA_SECRET` is
unset (it logs `skipped` but still sends the email).

---

## API

### `POST /` (any path on the worker)

Request body (JSON):

```json
{
  "name": "Mira",
  "email": "mira@example.com",
  "topic": "general",
  "message": "Hi there!",
  "recaptcha_token": "...",
  "website": ""
}
```

Validation:

- `name`, `email`, `message` are required and trimmed.
- `email` must look like an email.
- `message` is capped at 5,000 characters.
- `website` is a honeypot — bots fill every visible input. If non-empty,
  the Worker returns 200 silently and sends nothing.
- `recaptcha_token` is verified against Google. Score must be ≥ 0.5.

Responses:

| Status | Meaning |
| --- | --- |
| `200 { ok: true }` | Sent (or honeypot hit — silent) |
| `400` | Invalid JSON / missing fields / bad email |
| `403 { error: "recaptcha_failed" }` | reCAPTCHA score too low or token invalid |
| `405` | Method other than POST/OPTIONS |
| `502 { error: "send_failed" }` | SMTP send threw |

### `OPTIONS *`

CORS preflight. `ALLOWED_ORIGIN` accepts a comma-separated list and supports
`*` wildcards for subdomains (e.g. `https://*.trycloudflare.com`).

---

## Environment / secrets

### Worker `vars` (non-secret, in `wrangler.jsonc`)

| Name | Purpose |
| --- | --- |
| `STAGE` | `dev` or `production` — used for routing & logging. |
| `SMTP_HOST` | `email-smtp.us-east-1.amazonaws.com`. |
| `SMTP_PORT` | `587` (STARTTLS submission). |
| `MAIL_HOSTNAME` | SMTP HELO/EHLO hostname (`chancey.io`). |
| `ALLOWED_ORIGIN` | Comma-separated CORS allowlist. Supports `*` wildcards. |
| `RECAPTCHA_ALLOWED_HOSTNAMES` | Comma-separated hostnames accepted from Google reCAPTCHA verification. |

### Worker secrets (set with `wrangler secret put`)

| Name | Purpose |
| --- | --- |
| `SMTP_USER` | SES SMTP username (an IAM access key id). |
| `SMTP_PASSWORD` | SES SMTP password. |
| `MAIL_FROM` | Verified SES sender (e.g. `lucky@chancey.io`). |
| `MAIL_TO` | Admin inbox (e.g. `lucky@chancey.io`). |
| `RECAPTCHA_SECRET` | Google reCAPTCHA v3 secret key. |

### Deploy-time (CLI-only, in `.env.deploy`)

| Name | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Wrangler auth — `dash.cloudflare.com/profile/api-tokens`. |
| `CLOUDFLARE_ACCOUNT_ID` | Same account that hosts `chancey-api`. |
