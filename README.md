# Chancey Website

Public marketing, support, and legal website for Chancey.

## Commands

```bash
npm ci
npm run build
npm run dev
```

GitHub Actions deploys `main` to GitHub Pages at `https://chancey.io`.

`PUBLIC_CHANCEY_APP_URL` controls every "Open web app" link. Production builds
use `https://app.chancey.io`; PR/stage builds use `https://stage.app.chancey.io`.

## Admin Analytics

The private admin dashboard is built at `/admin/` and should be exposed at
`https://admin.chancey.io` once DNS/custom-domain hosting is configured.

Required public build variables:

- `PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk key for the target environment.
- `PUBLIC_CHANCEY_API_BASE_URL`: Chancey Worker API base URL.

Required Worker-side access:

- `https://admin.chancey.io` must be in `chancey-api` `ALLOWED_ORIGINS`.
- Signed-in users must match `ADMIN_USER_IDS` or `ADMIN_EMAILS`.

SEO rule: admin is always `noindex,nofollow` and is blocked from public
`robots.txt`. Do not include `admin.chancey.io` or `/admin/` in sitemap URLs.

Source status:

- Cloudflare traffic needs zone analytics credentials on the Worker.
- App Store metrics need App Store Connect Sales/Trends or Analytics access.
- Android installs need the Play Console `gs://pubsite_prod_rev...` report bucket.
- RevenueCat counters start when webhook events arrive.

First Google Search Console setup remains manual: verify `chancey.io` with a
Cloudflare DNS TXT record, then submit `https://chancey.io/sitemap-index.xml`.

## Contact Worker

The contact service worker lives in [contact-worker](contact-worker/README.md). Its CI workflow validates Worker changes on pull requests and deploys to Cloudflare Workers from `main`.
