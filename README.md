# Anton's Arcade

The homepage uses `index.html`, `src/home.css`, and the original curved WebGL card spiral restored in `src/spiral.js`. Its bundled Three.js is retained in `src/vendor/`. The earlier React experiment remains in `src/App.jsx` and `src/index.css`.

- Build: `npm ci` then `npm run build`.
- Check: `node scripts/check-site.mjs` and `node scripts/check-spiral.mjs`.
- Deploy: commit source and `dist/`, then push `main`; the existing Cloudflare integration publishes `dist/`.
- Drag the spiral directly; release for inertia. The pause button stops automatic motion. Reduced motion starts paused; offscreen/hidden pages skip rendering.
- The pink Minesweeper card opens `public/minesweeper/index.html`. Its matching dark/pink styling retains existing game logic; grid columns now follow the responsive CSS cell size.
- The original Loop experiment is preserved at `public/game.html` and linked from its spiral card. Other cards are labeled visual experiments.
- `public/home/minesweeper.png` is an actual screenshot of the restyled game.

Visual direction references https://grail-app.com/. Existing reference WebP assets are retained; no Grail logo or product copy is used. Google Fonts have local fallbacks.
