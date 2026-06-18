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

## Contact Worker

The contact service worker lives in [contact-worker](contact-worker/README.md). Its CI workflow validates Worker changes on pull requests and deploys to Cloudflare Workers from `main`.
