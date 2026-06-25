import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const out = path.join(root, '.admin-dist');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const adminIndex = path.join(dist, 'admin', 'index.html');
if (!fs.existsSync(adminIndex)) {
  console.error('Admin build artifact missing: dist/admin/index.html');
  process.exit(1);
}

copy(path.join(dist, '_astro'), path.join(out, '_astro'));
copy(path.join(dist, 'favicon-16x16.png'), path.join(out, 'favicon-16x16.png'));
copy(path.join(dist, 'favicon-32x32.png'), path.join(out, 'favicon-32x32.png'));
copy(path.join(dist, 'apple-touch-icon.png'), path.join(out, 'apple-touch-icon.png'));
copy(path.join(dist, '_headers'), path.join(out, '_headers'));
copy(adminIndex, path.join(out, 'index.html'));

function copy(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
}
