# Chancey Website

Public marketing, support, and legal website for Chancey.

## Commands

```bash
npm ci
npm run build
npm run dev
```

GitHub Actions deploys `main` to GitHub Pages at `https://chancey.io`.
The separate `admin` workflow deploys `main` to Cloudflare Pages project
`chancey-admin` at `https://admin.chancey.io/`.

`PUBLIC_CHANCEY_APP_URL` controls every "Open web app" link. Production builds
use `https://app.chancey.io`; PR/stage builds use `https://stage.app.chancey.io`.

## Admin Analytics

The private admin dashboard source is `src/pages/admin.astro`, but it is exposed
only through the Cloudflare Pages project `chancey-admin` at
`https://admin.chancey.io/`. `npm run build:admin` packages the admin page as
that project's root document. Normal public/staging website deploys use
`npm run build:public`, which removes the generated `/admin/` route from `dist`.

Required public build variables:

- `PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk key for the target website environment.
- `PUBLIC_CHANCEY_ADMIN_CLERK_PUBLISHABLE_KEY`: production Clerk publishable key
  for the admin dashboard.
- `PUBLIC_NOINDEX=1`: keep every admin-domain route out of search.

Required Worker-side access:

- `https://admin.chancey.io` must be in `chancey-api` `ALLOWED_ORIGINS`.
- Signed-in users must match `ADMIN_USER_IDS` or `ADMIN_EMAILS`.
- The admin dashboard always calls the production Chancey Worker API, including
  local and staging builds.
- The Refresh button calls `POST /v1/admin/analytics/import?days=<selected range>`, then
  reloads `GET /v1/admin/analytics/overview`.

SEO rule: admin is always `noindex,nofollow` and is blocked from public
`robots.txt`. Do not include `admin.chancey.io` or `/admin/` in sitemap URLs.

Source status:

- Cloudflare traffic needs zone analytics credentials on the Worker. The deploy
  token is not enough unless it also has `zone.analytics.read`.
- App Store metrics need App Store Connect Sales/Trends access, vendor number,
  and an API key.
- Android installs need the exact Play Console Cloud Storage URI copied from
  Download reports, for example `gs://pubsite_prod.../stats/installs/`. This is
  a Play-managed report bucket and does not show in the app project's Cloud
  Storage bucket list.
- RevenueCat counters start when webhook events arrive.

First Google Search Console setup remains manual: verify `chancey.io` with a
Cloudflare DNS TXT record, then submit `https://chancey.io/sitemap-index.xml`.

## Contact Worker

The contact service worker lives in [contact-worker](contact-worker/README.md). Its CI workflow validates Worker changes on pull requests and deploys to Cloudflare Workers from `main`.
