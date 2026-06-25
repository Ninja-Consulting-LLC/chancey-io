import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Production default; staging CI overrides with SITE_URL=https://staging.chancey.io
  // so canonicals, sitemap, and OG URLs are correct per environment.
  site: process.env.SITE_URL || 'https://chancey.io',
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'always',
    format: 'directory',
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !new URL(page).pathname.startsWith('/admin/'),
    }),
  ],
});
