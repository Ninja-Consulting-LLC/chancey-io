#!/usr/bin/env node
/**
 * Pull real app screenshots from the Chancey app repo into this site.
 *
 * Runs the app's own store-screenshot generator
 * (chancey-app/scripts/generate-store-screenshots.mjs) with
 * CHANCEY_MARKETING_SCREENSHOT_DIR pointed at public/app-screenshots, so the
 * marketing site uses the exact same render the App Store / Play Store get.
 *
 *   npm run screenshots:pull
 *
 * Env:
 *   CHANCEY_APP_DIR  Override the app location. Default tries common siblings.
 *
 * Requires the app repo to be buildable (its generator builds + serves it and
 * drives Playwright). If the app or its deps are missing, this exits non-zero
 * with a clear message; the site falls back to the built-in mock previews.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(siteRoot, 'public', 'app-screenshots');

const candidates = [
  process.env.CHANCEY_APP_DIR,
  path.resolve(siteRoot, '../chancey/chancey-app'),
  path.resolve(siteRoot, '../../chancey/chancey-app'),
  path.join(process.env.HOME || '', 'Work/chancey/chancey-app'),
].filter(Boolean);

const appDir = candidates.find(
  (d) => d && fs.existsSync(path.join(d, 'scripts', 'generate-store-screenshots.mjs'))
);

if (!appDir) {
  console.error(
    'Chancey app repo not found. Set CHANCEY_APP_DIR or place it at ../chancey/chancey-app.\n' +
      'Tried:\n  ' +
      candidates.join('\n  ')
  );
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

console.log(`Generating screenshots from ${appDir}`);
console.log(`Output: ${outDir}`);

const result = spawnSync('npm', ['run', 'screenshots:stores'], {
  cwd: appDir,
  stdio: 'inherit',
  env: { ...process.env, CHANCEY_MARKETING_SCREENSHOT_DIR: outDir },
});

if (result.status !== 0) {
  console.error(
    '\nScreenshot generation failed. The site will keep using the built-in ' +
      'mock previews until this succeeds.'
  );
  process.exit(result.status ?? 1);
}

const manifest = path.join(outDir, 'manifest.json');
if (fs.existsSync(manifest)) {
  console.log(`\nDone. Wrote ${manifest}`);
} else {
  console.warn('\nGenerator finished but no manifest.json was written.');
}
