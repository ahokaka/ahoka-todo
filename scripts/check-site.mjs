// Run after npm run build: node scripts/check-site.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
for (const page of ['dist/index.html', 'dist/minesweeper/index.html']) {
  for (const [, url] of read(page).matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|#|data:)/.test(url)) continue;
    const path = resolve(fileURLToPath(new URL(dirname(page) + '/', root)), url.split(/[?#]/)[0]);
    assert(existsSync(path), `Missing asset or page: ${url}`);
  }
}
assert(read('dist/index.html').includes('href="./minesweeper/index.html"'));
assert(read('dist/minesweeper/index.html').includes('href="../index.html"'));
assert.equal(read('public/minesweeper/game.js'), read('dist/minesweeper/game.js'));
assert.equal(read('public/minesweeper/style.css'), read('dist/minesweeper/style.css'));
assert(!read('dist/index.html').includes('hello@example.com'));
console.log('PASS: homepage assets, game link, return link, and preserved game files.');
