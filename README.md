# Homepage

The homepage is static HTML in `index.html`, styled by `src/home.css`. Vite produces the deployable `dist/` directory. The previous React style experiment remains in `src/App.jsx` and `src/index.css`.

- Build: `npm ci` then `npm run build`.
- Check: `node scripts/check-site.mjs`.
- Deploy: commit source and `dist/`, then push `main`; the existing Cloudflare integration publishes `dist/`.
- Game: `public/minesweeper/index.html`. Game logic and styling are preserved; the page adds a home link.
- `public/home/minesweeper.png` is an actual screenshot of this repository's game.
- The three decorative WebP patterns come from the provided local Grail reference assets (https://grail-app.com/). They are used as reference-derived decoration, not as a claim of original artwork. No Grail logo or product text is used.
