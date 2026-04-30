import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chancey.io',
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'always',
    format: 'directory',
  },
});
