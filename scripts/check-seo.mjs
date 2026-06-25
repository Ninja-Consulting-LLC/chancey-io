import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const adminMode = process.env.CHECK_ADMIN_DIST === '1';
const fail = (message) => {
  console.error(`SEO check failed: ${message}`);
  process.exitCode = 1;
};

if (!fs.existsSync(dist)) {
  fail('dist/ does not exist. Run npm run build:public first.');
  process.exit();
}

if (adminMode) {
  const adminDist = path.join(root, '.admin-dist');
  const adminIndex = path.join(adminDist, 'index.html');
  const adminHtml = fs.existsSync(adminIndex) ? fs.readFileSync(adminIndex, 'utf8') : '';
  if (!adminHtml) fail('admin dist index missing. Run npm run build:admin first.');
  if (!adminHtml.includes('noindex,nofollow')) fail('admin dist index must be noindex.');
  if (fs.existsSync(path.join(adminDist, 'sitemap-index.xml'))) {
    fail('admin dist must not include sitemap-index.xml.');
  }
  if (process.exitCode) process.exit();
  console.log('SEO check passed.');
  process.exit();
}

const robotsPath = path.join(dist, 'robots.txt');
const robots = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf8') : '';
if (!robots.includes('Disallow: /admin/')) fail('robots.txt must block /admin/.');
if (!robots.includes('Sitemap: https://chancey.io/sitemap-index.xml')) {
  fail('robots.txt must point at the production sitemap index.');
}

const sitemapFiles = fs
  .readdirSync(dist)
  .filter((name) => /^sitemap.*\.xml$/.test(name))
  .map((name) => path.join(dist, name));
if (sitemapFiles.length === 0) fail('sitemap XML was not generated.');
for (const file of sitemapFiles) {
  const xml = fs.readFileSync(file, 'utf8');
  if (xml.includes('/admin/') || xml.includes('admin.chancey.io')) {
    fail(`${path.basename(file)} includes admin URL.`);
  }
}

if (fs.existsSync(path.join(dist, 'admin'))) fail('public dist must not include /admin/.');

const htmlFiles = collectHtml(dist);
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(dist, file);
  if (relative.startsWith(`admin${path.sep}`)) continue;
  const noindex = html.includes('<meta name="robots" content="noindex');
  if (!html.includes('<link rel="canonical" href="https://chancey.io/')) {
    fail(`${relative} missing production canonical.`);
  }
  if (!noindex && !html.includes('<meta name="robots" content="index, follow,')) {
    fail(`${relative} missing index robots meta.`);
  }
  if (!html.includes('application/ld+json')) {
    fail(`${relative} missing JSON-LD structured data.`);
  }
}

if (process.exitCode) process.exit();
console.log('SEO check passed.');

function collectHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}
