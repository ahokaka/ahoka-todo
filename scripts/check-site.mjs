// Run after npm run build: node scripts/check-site.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

// 1. Every local asset or link referenced by a built page must exist.
for (const page of ['dist/index.html', 'dist/minesweeper/index.html']) {
  for (const [, url] of read(page).matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|\/\/|#|data:|mailto:)/.test(url)) continue;
    const path = resolve(fileURLToPath(new URL(dirname(page) + '/', root)), url.split(/[?#]/)[0]);
    assert(existsSync(path), `Missing asset or page: ${url} in ${page}`);
  }
}

// 2. The homepage is the self-contained Planet Jumping experience.
const home = read('dist/index.html');
for (const id of ['preloader', 'preloader-count', 'preloader-value', 'floating-logo', 'scene-canvas',
                  'portal-canvas', 'portal', 'portal-video', 'portal-image', 'planet-title', 'facts',
                  'next-number', 'next-name', 'transition-video']) {
  assert(home.includes(`id="${id}"`), `Homepage is missing #${id}`);
}
assert(home.includes('class="experience" data-planet="mars"'), 'Homepage must start in the mars state');
assert(home.includes('<style>') && home.includes('<script>'), 'Homepage must inline its style and script');
assert(!/<script[^>]+src="https?:/.test(home), 'Homepage must not load external JavaScript');
assert(!/<link[^>]+rel="stylesheet"[^>]+https?:/.test(home), 'Homepage must not load external CSS');
for (const asset of [
  '3c83091e-4046-4fd6-adbb-2edb728be79a.mp4', 'fc3ded42-e845-41f3-a830-5cab512d79cd.mp4',
  'b30f64d9-1637-477a-83df-d0fc6461a422.mp4', '5fc5651c-3b5d-4171-b507-87f7e635d1b4.mp4',
  'd6fb8b6b-c15e-4aaa-9cf7-45bbb5e33372.jpg', 'eb7e0f53-50cd-4af5-abc4-8b9a52cdc01b.svg'
]) {
  assert(home.includes(asset), `Homepage must reference the supplied asset ${asset}`);
}

// 3. Minesweeper is embedded in the homepage and still stands alone at /minesweeper/.
assert(home.includes("'./minesweeper/index.html?embed=1&lang='"), 'Homepage must embed Minesweeper in embed mode and pass the language');
assert(home.includes('id="menu"'), 'Homepage must keep the button that opens the game');
const game = read('dist/minesweeper/index.html');
assert(game.includes('href="../index.html"'), 'Minesweeper must link back to the homepage');
assert(game.includes("params.get('embed') === '1'"), 'Minesweeper must support embed mode');
assert.equal(read('public/minesweeper/index.html'), game, 'dist/minesweeper/index.html must match the public copy');
assert.equal(read('public/minesweeper/game.js'), read('dist/minesweeper/game.js'));
assert.equal(read('public/minesweeper/style.css'), read('dist/minesweeper/style.css'));
assert.equal(read('public/minesweeper/i18n.js'), read('dist/minesweeper/i18n.js'));

// 4. Both pages ship an English/Chinese switch.
for (const [page, file] of [['homepage', home], ['game', game]]) {
  assert(file.includes('data-i18n'), `${page} must tag its text for i18n`);
}
assert(read('public/minesweeper/i18n.js').includes('zh: {'), 'Minesweeper i18n must ship Chinese strings');

// 5. The removed spiral homepage must not come back.
assert(!existsSync(new URL('src', root)), 'src/ (old spiral homepage) should be gone');
assert(!existsSync(new URL('public/home', root)), 'public/home (old card art) should be gone');

console.log('PASS: Planet Jumping homepage, embedded Minesweeper, bilingual text, and preserved game files.');