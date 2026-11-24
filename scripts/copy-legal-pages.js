// Copies the store-ready legal & support pages from app-store/ into the web export, so the hosted
// site serves them at /privacy, /terms and /support (Vercel `cleanUrls`). Run after `expo export -p web`.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

if (!fs.existsSync(dist)) {
  console.error('dist/ not found. Run `npx expo export -p web` first.');
  process.exit(1);
}

for (const page of ['privacy', 'terms', 'support']) {
  fs.copyFileSync(path.join(root, 'app-store', `${page}.html`), path.join(dist, `${page}.html`));
}
console.log('Copied privacy, terms and support pages into dist/');
