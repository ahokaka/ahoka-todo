# Homepage design QA

final result: passed

## Evidence
- Visual source: https://grail-app.com/; capture `../qa/reference-desktop.png`.
- Implementation: http://127.0.0.1:4173/; `../qa/home-desktop.png`, `../qa/home-compact.png`, `../qa/home-mobile.png`.
- Desktop comparison: both source and implementation requested 1440 × 1000 CSS viewports; browser-visible captures are both 1425 × 789 pixels. Compared together in one image input, without resizing. Browser screenshots cover only the visible surface, not the entire CSS viewport.
- Additional checks: 1280 × 800 desktop and 390 × 844 mobile CSS viewports. Single-viewport captures were used; full-page stitching was discarded because the browser duplicated scroll regions in its export.
- State: loaded homepage, default cards. The reference's moving cards change placement over time. This is a style adaptation for the user's arcade, not a reproduction of Grail's product or its full 3D animation.

## Findings and comparison history
- Fixed P2: heading initially occupied too little of the desktop width. Increased its desktop size; the paired captures now show the intended oversized serif hierarchy.
- Fixed P2: game thumbnail included desktop background. Re-captured the game window at the browser's actual capture scale; verified the final crop.
- Fixed P2: short desktop viewports cut off the card action. Added a compact-height layout; verified game-card bottom at 732 CSS px in an 800px viewport.
- Fixed P2: supporting caption overlapped decorative cards. Moved it into normal document flow; inspected updated desktop and mobile layouts.
- No outstanding P0/P1/P2 findings within the requested style adaptation.

## Required fidelity surfaces
- Typography: Instrument Serif supplies the large editorial display character; Inter and system Chinese fonts keep small UI legible. It intentionally substitutes for the reference's proprietary typeface. Chinese text and mobile heading wrapping inspected.
- Layout: black open stage, layered portrait cards, generous headings, pink pill navigation and pink about section. One actual game card replaces the reference's many quest cards. Mobile makes the game the first card. No horizontal page overflow at 390 or 1440px.
- Colors: near-black, cream, pale pink and muted patterned assets match the reference palette. Caption contrast corrected.
- Assets: supplied reference WebPs, and an actual screenshot of this repo's game. No fabricated game previews. Fonts are loaded from Google Fonts with local fallbacks.
- Copy: retains Anton's Arcade and the original personal-site intent. Removes fictitious game listings and placeholder contact details; GitHub links point to the supplied repo and owner.
- Focused review: inspected actual game thumbnail crop, mobile card text/action and about-section text independently of the wide comparison.

## Functional validation
- Homepage card opens `/minesweeper/index.html`; return link opens the homepage.
- Beginner board has 81 cells; first click revealed 19 cells and reported a no-guess board.
- Flagging reduced mine counter from 010 to 009.
- Pause displayed its overlay; resume worked.
- New game changed the seed and cleared the revealed cells.
- Intermediate difficulty generated 256 cells.
- About anchor and GitHub targets checked. No browser console errors or warnings observed in the tested page.
- `npm run build`, `node scripts/check-site.mjs`, and `git diff --check` pass.
- Game JavaScript and CSS have no source diff. Prior React experiment source is retained.

## Limits
- No exhaustive solve/win/lose regression run; game logic was not modified.
- Cards use CSS depth and subtle motion rather than the reference's draggable curved WebGL spiral.
- Existing game touch/keyboard behavior remains as before.
