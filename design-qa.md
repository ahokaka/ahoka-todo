# Spiral restoration and game styling QA

Scope: preserve the user's original curved WebGL spiral, improve rotation/interaction, and carry the homepage's black/pink typography and palette into Minesweeper. This supersedes the previous CSS-card implementation and its QA report.

## Visual evidence

- Original implementation: provided local float.js, card data and bundled Three.js. Original curve, radial facing and helix parameters retained.
- Direction: https://grail-app.com/, with the user's original spiral taking precedence over generic layout changes.
- Local screenshots: ../qa/spiral-restored.png at 1280 x 900; ../qa/spiral-mobile.png and ../qa/minesweeper-mobile.png at 390 x 844. Single-viewport captures; no full-page stitching.
- ../qa/minesweeper-styled.png is the inspected game-window crop used on the homepage card.
- Desktop and mobile inspected for heading legibility, card depth, featured game preview, controls and horizontal overflow. Neither page overflows horizontally at 390px.
- The spiral retains multicolor patterned cards; Minesweeper uses pink, near-black, Instrument Serif and Inter.

## Fixes and behavior checked

- Removed duplicate mesh registration and duplicate pattern painting.
- Baked the original bend into geometry so raycasting follows the visible card surface.
- Direct dragging replaces accumulated-speed dragging. Release velocity is bounded; returning to the start is still a drag, preventing accidental navigation.
- Actual browser drag changed the spiral orientation without opening the card. Clicking the visible Minesweeper card opened the game.
- Pause/resume changes label and pressed state. Automatic rotation observed in successive captures. Reduced motion starts paused; offscreen/hidden rendering is skipped in the frame loop.
- Beginner: 81 cells, first-click reveal, flag counter 010 to 009, pause/resume and new game checked.
- Expert: 480 cells, internal horizontal scrolling, no page overflow at desktop width.
- Game JavaScript only changes the grid column width to the responsive CSS variable; generation and solving logic remain unchanged.
- Browser inspection reported no WebGL shader errors after color-space correction.
- Runnable checks: npm run build; node scripts/check-site.mjs; node scripts/check-spiral.mjs; git diff --check.

## Limits

No measured FPS or device performance claim. No exhaustive win/lose or seed-generation regression. Existing touch flagging behavior is unchanged. Decorative prototype cards have no navigation; Minesweeper also has a normal HTML link below the spiral for keyboard access.
