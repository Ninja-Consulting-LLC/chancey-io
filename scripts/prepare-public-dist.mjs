import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');

// Admin is deployed as the root document of the separate chancey-admin Pages
// project. The public website must not publish a duplicate /admin/ route.
fs.rmSync(path.join(dist, 'admin'), { recursive: true, force: true });

const astroDir = path.join(dist, '_astro');
if (fs.existsSync(astroDir)) {
  for (const entry of fs.readdirSync(astroDir)) {
    if (entry.startsWith('admin.astro')) fs.rmSync(path.join(astroDir, entry), { force: true });
  }
}
