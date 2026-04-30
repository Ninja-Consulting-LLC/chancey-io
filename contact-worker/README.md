# Chancey Contact Worker

Cloudflare Worker for handling website contact submissions separately from the GitHub Pages site.

## Endpoints

- `GET /health` returns a small health payload.
- `POST /v1/contact` accepts JSON contact requests.

Example request:

```json
{
  "name": "Jane Example",
  "email": "jane@example.com",
  "subject": "Account question",
  "message": "I need help with Chancey.",
  "source": "support-page"
}
```

The optional `company` field is a honeypot. If it is filled in, the worker accepts the request without sending email.

## Deployment

The Worker deploys through `.github/workflows/contact-worker.yml`.

Required GitHub Actions repository secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Set or rotate them with GitHub CLI:

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID --repo Ninja-Consulting-LLC/chancey-io
gh secret set CLOUDFLARE_API_TOKEN --repo Ninja-Consulting-LLC/chancey-io
```

Pull requests run a Wrangler dry run. Pushes to `main` deploy the Worker.

## Runtime Email Secret

The Worker sends email through Resend. Configure the runtime secret after the Worker exists:

```bash
CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... \
  npx --yes wrangler@4 secret put RESEND_API_KEY --config contact-worker/wrangler.toml
```

Until `RESEND_API_KEY` is configured, valid contact submissions return `503 email_provider_not_configured`.

## Local Checks

```bash
npm ci
npx --yes wrangler@4 deploy --dry-run --config contact-worker/wrangler.toml
```
