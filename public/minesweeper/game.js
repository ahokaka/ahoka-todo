/* =========================================================
   Minesweeper — Windows Classic, no-guess + seed system
   ========================================================= */
(function () {
  "use strict";

  /* ------------------- Sound Engine (Web Audio) ------------------- */
  const Sound = (function () {
    let ctx = null;
    let muted = false;

    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
    }

    function tone(freq, start, dur, type, vol) {
      if (muted || !ctx) return;
      const t = ctx.currentTime + (start || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    function sweep(f1, f2, start, dur, type, vol) {
      if (muted || !ctx) return;
      const t = ctx.currentTime + (start || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "triangle";
      osc.frequency.setValueAtTime(f1, t);
      osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    function noise(start, dur, vol) {
      if (muted || !ctx) return;
      const t = ctx.currentTime + (start || 0);
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol || 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
    }

    return {
      init: ensure,
      setMuted(m) { muted = !!m; },
      isMuted() { return muted; },
      click()   { tone(240, 0, 0.05, "square", 0.12); },
      uncover() { tone(520, 0, 0.06, "triangle", 0.18); tone(780, 0.02, 0.05, "triangle", 0.1); },
      flag()    { sweep(600, 900, 0, 0.1, "square", 0.15); },
      question(){ sweep(500, 350, 0, 0.12, "square", 0.14); },
      chord()   { noise(0, 0.06, 0.12); tone(700, 0, 0.06, "triangle", 0.12); },
      boom()    { noise(0, 0.45, 0.5); sweep(160, 30, 0, 0.5, "sawtooth", 0.35); },
      win() {
        const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
        notes.forEach((n, i) => tone(n, i * 0.12, 0.16, "triangle", 0.2));
      },
      lose() {
        const notes = [500, 400, 300, 200, 120];
        notes.forEach((n, i) => tone(n, i * 0.14, 0.18, "sawtooth", 0.18));
      }
    };
  })();

  /* ------------------- Levels ------------------- */
  const LEVELS = {
    beginner:     { rows: 9,  cols: 9,  mines: 10, name: "Beginner" },
    intermediate: { rows: 16, cols: 16, mines: 40, name: "Intermediate" },
    expert:       { rows: 16, cols: 30, mines: 99, name: "Expert" }
  };

  /* =====================================================
     DETERMINISTIC NO-GUESS GENERATOR + SEED SYSTEM
     -----------------------------------------------------
     Guarantees every board is solvable WITHOUT guessing:
     1. Every generation is driven by a deterministic seeded RNG, so the same
        seed always reproduces the exact same board (full reproducibility).
     2. Every candidate uses classic full-density random placement, rejects any
        oversized zero basin, and is accepted only when a logical solver can
        finish it by deduction alone (never needing a 50/50 guess).
     ===================================================== */

  // FNV-1a string hash -> 32-bit seed
  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Mulberry32 seeded PRNG (fast, high quality, reproducible)
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Fisher-Yates shuffle driven by an RNG
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // Count total mines currently placed
  function countMinesOn(board) {
    let n = 0;
    for (const row of board) for (const c of row) if (c.mine) n++;
    return n;
  }
  function computeNumbers(board) {
    const rows = board.length, cols = board[0].length;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) n++;
      }
      board[r][c].num = n;
    }
  }

  // ---------- Fast deterministic no-guess solver ----------
  // Uses the same deductions a human can apply: single-number rules, subset
  // differences between neighboring constraints, and the global mine count.
  function solveNoGuess(board, sr, sc) {
    const rows = board.length, cols = board[0].length;
    const totalMines = countMinesOn(board);
    const totalSafe = rows * cols - totalMines;
    const revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    const flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    let revealedCount = 0;
    let flagCount = 0;
    const key = (r, c) => r * cols + c;
    const pos = (k) => [Math.floor(k / cols), k % cols];

    function reveal(r, c) {
      if (revealed[r][c] || flagged[r][c]) return 0;
      if (board[r][c].mine) return -1;
      const stack = [[r, c]];
      let changed = 0;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        if (revealed[cr][cc] || flagged[cr][cc]) continue;
        if (board[cr][cc].mine) return -1;
        revealed[cr][cc] = true;
        revealedCount++;
        changed++;
        if (board[cr][cc].num === 0) {
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                !revealed[nr][nc] && !board[nr][nc].mine) stack.push([nr, nc]);
          }
        }
      }
      return changed;
    }

    function flag(r, c) {
      if (flagged[r][c]) return 0;
      if (revealed[r][c] || !board[r][c].mine) return -1;
      flagged[r][c] = true;
      flagCount++;
      return 1;
    }

    if (reveal(sr, sc) < 0) return false;
    let guard = 0;
    while (revealedCount < totalSafe && guard++ < rows * cols * 8) {
      let progressed = false;
      const constraints = [];

      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (!revealed[r][c] || board[r][c].num === 0) continue;
        let adjacentFlags = 0;
        const hidden = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (flagged[nr][nc]) adjacentFlags++;
          else if (!revealed[nr][nc]) hidden.push(key(nr, nc));
        }
        if (!hidden.length) continue;
        const need = board[r][c].num - adjacentFlags;
        if (need < 0 || need > hidden.length) return false;
        if (need === 0) {
          for (const k of hidden) {
            const [nr, nc] = pos(k);
            const changed = reveal(nr, nc);
            if (changed < 0) return false;
            if (changed > 0) progressed = true;
          }
        } else if (need === hidden.length) {
          for (const k of hidden) {
            const [nr, nc] = pos(k);
            const changed = flag(nr, nc);
            if (changed < 0) return false;
            if (changed > 0) progressed = true;
          }
        } else {
          hidden.sort((a, b) => a - b);
          constraints.push({ cells: hidden, set: new Set(hidden), need });
        }
      }
      if (progressed) continue;

      const allHidden = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (!revealed[r][c] && !flagged[r][c]) allHidden.push(key(r, c));
      }
      const remaining = totalMines - flagCount;
      if (remaining === 0) {
        for (const k of allHidden) {
          const [r, c] = pos(k);
          const changed = reveal(r, c);
          if (changed < 0) return false;
          if (changed > 0) progressed = true;
        }
      } else if (remaining === allHidden.length) {
        for (const k of allHidden) {
          const [r, c] = pos(k);
          const changed = flag(r, c);
          if (changed < 0) return false;
          if (changed > 0) progressed = true;
        }
      }
      if (progressed) continue;

      // If constraint A is contained in B, B-A has need(B)-need(A) mines.
      outer:
      for (let i = 0; i < constraints.length; i++) {
        for (let j = 0; j < constraints.length; j++) {
          if (i === j) continue;
          const a = constraints[i], b = constraints[j];
          if (a.cells.length >= b.cells.length) continue;
          let subset = true;
          for (const k of a.cells) if (!b.set.has(k)) { subset = false; break; }
          if (!subset) continue;
          const diff = b.cells.filter((k) => !a.set.has(k));
          const diffNeed = b.need - a.need;
          if (diffNeed < 0 || diffNeed > diff.length) return false;
          if (diffNeed === 0) {
            for (const k of diff) {
              const [r, c] = pos(k);
              const changed = reveal(r, c);
              if (changed < 0) return false;
              if (changed > 0) progressed = true;
            }
          } else if (diffNeed === diff.length) {
            for (const k of diff) {
              const [r, c] = pos(k);
              const changed = flag(r, c);
              if (changed < 0) return false;
              if (changed > 0) progressed = true;
            }
          }
          if (progressed) break outer;
        }
      }
      if (!progressed) return false;
    }
    return revealedCount === totalSafe;
  }

  // Largest number of cells that any single zero-click can flood open. This
  // controls every empty basin on the board, not just the first-click basin.
  function largestOpening(board, stopAfter) {
    const rows = board.length, cols = board[0].length;
    const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
    let largest = 1;
    for (let sr = 0; sr < rows; sr++) for (let sc = 0; sc < cols; sc++) {
      if (seen[sr][sc] || board[sr][sc].mine || board[sr][sc].num !== 0) continue;
      const stack = [[sr, sc]];
      const revealedByFlood = new Set();
      while (stack.length) {
        const [r, c] = stack.pop();
        if (seen[r][c] || board[r][c].mine || board[r][c].num !== 0) continue;
        seen[r][c] = true;
        revealedByFlood.add(r * cols + c);
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || board[nr][nc].mine) continue;
          revealedByFlood.add(nr * cols + nc);
          if (!seen[nr][nc] && board[nr][nc].num === 0) stack.push([nr, nc]);
        }
      }
      largest = Math.max(largest, revealedByFlood.size);
      if (largest > stopAfter) return largest;
    }
    return largest;
  }

  function makeEmptyBoard(rows, cols) {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({
      mine: false, revealed: false, flagged: false, question: false,
      num: 0, exploded: false, wrongflag: false
    })));
  }

  // ---------- Classic-density no-guess construction ----------
  // Classic implementations shuffle all eligible cells and place the complete
  // mine count in one pass. We do the same, reject oversized zero basins, then
  // accept only candidates the fast logical solver can finish without guessing.
  function generateBoard(rows, cols, mines, seed, sr, sc) {
    const forbidden = new Set();
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = sr + dr, nc = sc + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) forbidden.add(nr + "," + nc);
    }

    const candidates = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!forbidden.has(r + "," + c)) candidates.push([r, c]);
    }
    const rng = mulberry32(hashString(seed + "|" + rows + "x" + cols + "|" + sr + "," + sc) >>> 0);
    const openingLimit = rows * cols <= 81 ? 20 : (cols >= 30 ? 32 : 28);
    const maxAttempts = 50000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const order = candidates.slice();
      shuffle(order, rng);
      const board = makeEmptyBoard(rows, cols);
      for (let i = 0; i < mines; i++) board[order[i][0]][order[i][1]].mine = true;
      computeNumbers(board);
      if (largestOpening(board, openingLimit) > openingLimit) continue;
      if (solveNoGuess(board, sr, sc)) {
        return { board, placed: mines, attempts: attempt, largestOpening: largestOpening(board, Infinity) };
      }
    }
    throw new Error("Unable to generate a compact no-guess board for this seed.");
  }

  /* ------------------- Game State ------------------- */
  const Game = {
    level: "beginner",
    seed: "",         // seed for deterministic board generation
    rows: 0, cols: 0, totalMines: 0,
    board: [],
    flags: 0,
    revealedCount: 0,
    started: false,
    over: false,
    won: false,
    timer: 0,
    timerId: null,
    paused: false,
    firstClickDone: false,
    faceState: "normal"
  };

  /* ------------------- DOM refs ------------------- */
  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const faceEl = $("faceButton");
  const pauseEl = $("pauseButton");
  const pauseOverlay = $("pauseOverlay");
  const mineCounterEl = $("mineCounter");
  const timerCounterEl = $("timerCounter");
  const statusTextEl = $("statusText");

  /* ------------------- Helpers ------------------- */
  function inBounds(r, c) {
    return r >= 0 && r < Game.rows && c >= 0 && c < Game.cols;
  }
  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc)) out.push([nr, nc]);
      }
    }
    return out;
  }
  function cell(r, c) { return Game.board[r][c]; }

  /* ------------------- Board setup ------------------- */
  // Create an empty board (no mines) representing the pre-first-click state.
  function blankBoard() {
    const board = [];
    for (let r = 0; r < Game.rows; r++) {
      const row = [];
      for (let c = 0; c < Game.cols; c++) {
        row.push({ mine: false, revealed: false, flagged: false,
                   question: false, num: 0, exploded: false, wrongflag: false });
      }
      board.push(row);
    }
    return board;
  }

  function resetBoard() {
    clearInterval(Game.timerId);
    Game.timerId = null;
    const cfg = LEVELS[Game.level];
    Game.rows = cfg.rows;
    Game.cols = cfg.cols;
    Game.totalMines = cfg.mines;
    Game.flags = 0;
    Game.revealedCount = 0;
    Game.started = false;
    Game.over = false;
    Game.won = false;
    Game.firstClickDone = false;
    Game.timer = 0;
    Game.paused = false;
    if (pauseEl) pauseEl.textContent = "⏸";
    if (pauseOverlay) pauseOverlay.hidden = true;
    setFace("normal");
    Game.board = blankBoard();

    renderBoard();
    updateMineCounter();
updateTimer();
    statusTextEl.textContent = (Game.seed ? "Ready  ·  seed " + Game.seed : "Ready");
  }

function renderBoard() {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = "repeat(" + Game.cols + ", var(--cell-size))";
    for (let r = 0; r < Game.rows; r++) {
for (let c = 0; c < Game.cols; c++) {
        const div = document.createElement("div");
        div.className = "cell covered";
        div.setAttribute("role", "gridcell");
        div.setAttribute("aria-label", "row " + (r + 1) + ", column " + (c + 1));
        div.dataset.r = r;
        div.dataset.c = c;
        boardEl.appendChild(div);
      }
    }
  }

  /* ------------------- Seeded no-guess board creation ------------------- */
  // Called on the first click. Generates the mine layout deterministically
  // from Game.seed (or a fresh random seed) and the first-click position, then
  // reveals the clicked cell.
  function generateAndRevealFirst(r, c) {
    if (!Game.seed) Game.seed = makeRandomSeed();
    const gen = generateBoard(
      Game.rows, Game.cols, Game.totalMines,
      Game.seed, r, c
    );
    Game.board = gen.board;
    const actualMines = countMinesOn(Game.board);
    Game.totalMines = actualMines;

    // sync UI cell coords
    for (let rr = 0; rr < Game.rows; rr++) {
      for (let cc = 0; cc < Game.cols; cc++) {
        const cl = Game.board[rr][cc];
        cl._row = rr; cl._col = cc;
      }
    }
    updateMineCounter();
    statusTextEl.textContent = "No-guess board · seed " + Game.seed;
    syncSeedInput();
    // reveal the first click (it is guaranteed safe)
    revealAt(r, c);
  }

  function makeRandomSeed() {
    // A short, friendly, reproducible seed.
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return s;
  }

  function syncSeedInput() {
    const inp = $("seedInput");
    if (inp && Game.seed) inp.value = Game.seed;
  }

// Start a new game using the provided seed (or a random one if blank).
  function setSeed(raw) {
    let s = (raw || "").trim();
    if (!s) s = makeRandomSeed();
    Game.seed = s;
    syncSeedInput();
    newGame(false);   // keep the explicitly set seed
  }

  /* ------------------- Rendering a cell ------------------- */
  function updateCellUI(c) {
    const div = boardEl.children[c._row * Game.cols + c._col];
    if (!div) return;
    div.className = "cell";

    if (c.revealed) {
      div.classList.add("revealed");
      if (c.mine) {
        div.classList.add("mine");
        div.textContent = "💣";
        if (c.exploded) div.classList.add("explode");
      } else if (c.wrongflag) {
        div.classList.add("wrongflag");
        div.textContent = "❌";
      } else if (c.num > 0) {
        div.classList.add("n" + c.num);
        div.textContent = c.num;
      } else {
        div.textContent = "";
      }
    } else {
      div.classList.add("covered");
      if (c.flagged) {
        div.classList.add("flag");
        div.textContent = "🚩";
      } else if (c.question) {
        div.classList.add("question");
        div.textContent = "?";
      } else {
        div.textContent = "";
      }
    }
  }

  /* ------------------- Reveal ------------------- */
  // Reveals a cell. Returns true if the game is lost (explosion).
  function revealAt(r, c) {
    const cl = cell(r, c);
    if (cl.revealed) return false;
    if (cl.flagged) return false;
    cl.question = false;

    if (cl.mine) {
      cl.exploded = true;
      cl.revealed = true;
      gameOver(false);
      return true;
    }

    cl.revealed = true;
    Game.revealedCount++;
    Sound.uncover();
    updateCellUI(cl);
    // Only expand from an empty (0) cell; a numbered cell reveals itself alone.
    if (cl.num === 0) {
      floodReveal(r, c);
    }

    checkWin();
    return false;
  }

  // Flood-reveal the connected zero region.
  function floodReveal(r, c) {
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const nbs = neighbors(cr, cc);
      for (const [nr, nc] of nbs) {
        const n = cell(nr, nc);
        if (n.revealed || n.flagged) continue;
        if (n.mine) continue;
        n.revealed = true;
        Game.revealedCount++;
        updateCellUI(n);
        if (n.num === 0) stack.push([nr, nc]);
      }
    }
  }

  /* ------------------- Chord ------------------- */
  function chord(r, c) {
    const cl = cell(r, c);
    if (!cl.revealed || cl.num === 0) return;
    const nbs = neighbors(r, c);
    let flagCount = 0;
    nbs.forEach(([nr, nc]) => { if (cell(nr, nc).flagged) flagCount++; });
    if (flagCount !== cl.num) return;

    Sound.chord();
    let lost = false;
    nbs.forEach(([nr, nc]) => {
      if (lost) return;
      const n = cell(nr, nc);
      if (n.revealed || n.flagged) return;
      n.question = false;
      lost = revealAt(nr, nc) === true;
    });
    if (lost) gameOver(false);
    else checkWin();
  }

  /* ------------------- Win / Lose ------------------- */
  function requiredCellCount() {
    let n = 0;
    for (let r = 0; r < Game.rows; r++) for (let c = 0; c < Game.cols; c++) {
      const cl = Game.board[r][c];
      if (!cl.mine) n++;
    }
    return n;
  }

  function checkWin() {
    if (Game.over) return;
    if (Game.revealedCount >= requiredCellCount()) {
      gameOver(true);
    }
  }

  function gameOver(won) {
    if (Game.over) return;
    Game.over = true;
    Game.won = won;
    clearInterval(Game.timerId);
    Game.timerId = null;
    lightFaces();
    if (won) {
      setFace("win");
      Sound.win();
      statusTextEl.textContent = "You win! 🎉";
      showOverlay(true);
      autoFlagMines();
    } else {
      setFace("lose");
      Sound.boom();
      statusTextEl.textContent = "Boom! You hit a mine.";
      showOverlay(false);
    }
    updateMineCounter();
  }

  function autoFlagMines() {
    for (let r = 0; r < Game.rows; r++)
      for (let c = 0; c < Game.cols; c++) {
        const cl = cell(r, c);
        if (cl.mine && !cl.revealed) {
          cl.flagged = true;
          Game.flags++;
          updateCellUI(cl);
        }
      }
  }

  function lightFaces() {
    // reveal all mines on lose (classic behavior)
    if (!Game.won) {
      for (let r = 0; r < Game.rows; r++)
        for (let c = 0; c < Game.cols; c++) {
          const cl = cell(r, c);
          if (cl.mine) cl.revealed = true;
          if (!cl.mine && cl.flagged) {
            cl.wrongflag = true;
            cl.flagged = false;
            cl.revealed = true;
            cl.num = 0;
          }
          updateCellUI(cl);
        }
    }
  }

  /* ------------------- Flag cycle ------------------- */
  function cycleFlag(r, c) {
    const cl = cell(r, c);
    if (cl.revealed || Game.over) return;
    if (!cl.flagged && !cl.question) {
      cl.flagged = true;
      Game.flags++;
      Sound.flag();
    } else if (cl.flagged) {
      cl.flagged = false;
      cl.question = true;
      Game.flags--;
      Sound.question();
    } else if (cl.question) {
      cl.question = false;
      Sound.click();
    }
    updateCellUI(cl);
    updateMineCounter();
  }

  /* ------------------- Counters / Timer ------------------- */
  function pad3(n) {
    n = Math.max(0, Math.min(999, n));
    return n.toString().padStart(3, "0");
  }
  function updateMineCounter() {
    mineCounterEl.textContent = pad3(Game.totalMines - Game.flags);
  }
  function formatTime(seconds) {
    seconds = Math.max(0, Math.min(5999, seconds));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  }
  function updateTimer() {
    timerCounterEl.textContent = formatTime(Game.timer);
  }
  function tickTimer() {
    Game.timer++;
    updateTimer();
    if (Game.timer >= 5999) clearInterval(Game.timerId);
  }
  function startTimer() {
    if (Game.started || Game.over || Game.paused) return;
    Game.started = true;
    Game.timerId = setInterval(tickTimer, 1000);
  }
  function togglePause() {
    if (!Game.started || Game.over) return;
    Game.paused = !Game.paused;
    if (Game.paused) {
      clearInterval(Game.timerId);
      Game.timerId = null;
      if (pauseOverlay) pauseOverlay.hidden = false;
      if (pauseEl) pauseEl.textContent = "▶";
      setFace("normal");
      statusTextEl.dataset.prev = statusTextEl.textContent;
      statusTextEl.textContent = "⏸ Paused  ·  press P or ⏸ to resume";
    } else {
      if (pauseOverlay) pauseOverlay.hidden = true;
      if (pauseEl) pauseEl.textContent = "⏸";
      Game.timerId = setInterval(tickTimer, 1000);
      if (statusTextEl.dataset.prev) statusTextEl.textContent = statusTextEl.dataset.prev;
    }
  }

  /* ------------------- Face ------------------- */
  function setFace(state) {
    Game.faceState = state;
    const faces = { normal: "🙂", happy: "😮", win: "😎", lose: "😵" };
    faceEl.textContent = faces[state] || "🙂";
  }

  /* ------------------- Effects ------------------- */
  function showOverlay(won) {
    const old = document.querySelector(".overlay");
    if (old) old.remove();
    const ov = document.createElement("div");
    ov.className = "overlay";
    const head = document.createElement("h2");
    head.textContent = won ? "🎉 You Win!" : "💥 Boom!";
    const p = document.createElement("p");
    p.textContent = won
      ? "All safe squares revealed!"
      : "You hit a mine. ";
    const btnRow = document.createElement("div");
    btnRow.className = "overlay-btns";
    const again = document.createElement("button");
    again.textContent = "Play Again";
    again.onclick = () => { ov.remove(); newGame(); };
    const close = document.createElement("button");
    close.textContent = "Close";
    close.onclick = () => ov.remove();
    btnRow.appendChild(again);
    btnRow.appendChild(close);
    ov.appendChild(head);
    ov.appendChild(p);
    ov.appendChild(btnRow);
    $("gameWindow").appendChild(ov);
  }

  let toastTimer = null;
  function flashMessage(msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

/* ------------------- New game / action dispatch ------------------- */
  function newGame(refreshSeed) {
    // Every new game gets a fresh random seed automatically,
    // unless a seed was just set explicitly (refreshSeed === false).
    if (refreshSeed !== false) {
      Game.seed = makeRandomSeed();
      syncSeedInput();
    }
    resetBoard();
  }

  function menuAction(action) {
    closeMenus();
    if (action === "new") { newGame(); }
    else if (action === "beginner") { Game.level = "beginner"; refreshChecks(); newGame(); }
    else if (action === "intermediate") { Game.level = "intermediate"; refreshChecks(); newGame(); }
    else if (action === "expert") { Game.level = "expert"; refreshChecks(); newGame(); }
    else if (action === "sound") {
      const m = !Sound.isMuted();
      Sound.setMuted(m);
      refreshChecks();
    }
    else if (action === "howto") { showHelp(); }
    else if (action === "about") { showAbout(); }
  }

  function refreshChecks() {
    $("checkBeginner").textContent = Game.level === "beginner" ? "✓" : "";
    $("checkSound").textContent = Sound.isMuted() ? "" : "✓";
  }

  function showHelp() {
    const msg = "Minesweeper\n\n" +
      "Left-click to reveal a square.\n" +
      "Right-click to flag (🚩), then question (?), then clear.\n" +
      "Left-click a revealed number with the correct flags to 'chord'.\n\n" +
      "🔒 NO-GUESS GUARANTEE:\n" +
      "Every board is verified by a solver to be winnable using pure logic — you never have to guess.\n\n" +
      "🧪 SEED SYSTEM:\n" +
      "Enter a seed to reproduce the exact same board any time. Press 🎲 for a random seed.";
    window.alert(msg);
  }

  function showAbout() {
    window.alert("Minesweeper — Windows Classic\n\nA full-featured web remake with sound effects, a verified no-guess guarantee, and a reproducible seed system.");
  }

  /* ------------------- Menus ------------------- */
  let activeMenu = null;
  function openMenu(name) {
    closeMenus();
    const pop = name === "game" ? $("popoverGame") : $("popoverHelp");
    const btn = name === "game" ? $("menuGame") : $("menuHelp");
    pop.hidden = false;
    btn.classList.add("active");
    const rect = btn.getBoundingClientRect();
    const winRect = $("gameWindow").getBoundingClientRect();
    pop.style.top = (rect.bottom - winRect.top) + "px";
    pop.style.left = (rect.left - winRect.left) + "px";
    activeMenu = name;
    pop.dataset.menu = name;
  }
  function closeMenus() {
    $("popoverGame").hidden = true;
    $("popoverHelp").hidden = true;
    $("menuGame").classList.remove("active");
    $("menuHelp").classList.remove("active");
    activeMenu = null;
  }
  function bindMenuItems() {
    document.querySelectorAll("#popoverGame .menu-item[data-action]").forEach((el) => {
      el.onclick = () => menuAction(el.dataset.action);
    });
    document.querySelectorAll("#popoverHelp .menu-item[data-action]").forEach((el) => {
      el.onclick = () => menuAction(el.dataset.action);
    });
  }

  /* ------------------- Event wiring ------------------- */
  function wireEvents() {
    boardEl.addEventListener("mousedown", (e) => {
      const div = e.target.closest(".cell");
      if (!div || Game.paused) return;
      const r = +div.dataset.r, c = +div.dataset.c;
      const cl = cell(r, c);
      if (e.button === 0 && !Game.over && !cl.revealed && !cl.flagged) {
        setFace("happy");
      }
    });

    boardEl.addEventListener("mouseup", (e) => {
      if (Game.faceState === "happy") setFace("normal");
    });

    boardEl.addEventListener("click", (e) => {
      const div = e.target.closest(".cell");
      if (!div) return;
      const r = +div.dataset.r, c = +div.dataset.c;
      const cl = cell(r, c);
      if (Game.over || Game.paused) return;

      if (!Game.firstClickDone) {
        Game.firstClickDone = true;
        generateAndRevealFirst(r, c);
        startTimer();
        return;
      }

      if (cl.revealed) {
        chord(r, c);
        return;
      }
      if (cl.flagged) return;
      revealAt(r, c);
    });

    boardEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const div = e.target.closest(".cell");
      if (!div || Game.paused) return;
      const r = +div.dataset.r, c = +div.dataset.c;
      cycleFlag(r, c);
    });

    faceEl.addEventListener("mousedown", () => {});
    faceEl.addEventListener("click", () => {
      newGame();
    });

    // Seed controls
    const seedInput = $("seedInput");
    if (seedInput) {
      seedInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); setSeed(seedInput.value); }
      });
    }
    const applyBtn = $("seedApply");
    if (applyBtn) applyBtn.addEventListener("click", () => setSeed(seedInput ? seedInput.value : ""));
    const randomBtn = $("seedRandom");
    if (randomBtn) randomBtn.addEventListener("click", () => setSeed(""));

    // Menu buttons
    $("menuGame").addEventListener("click", (e) => { e.stopPropagation(); openMenu("game"); });
    $("menuHelp").addEventListener("click", (e) => { e.stopPropagation(); openMenu("help"); });

    document.addEventListener("click", (e) => {
      if (activeMenu && !e.target.closest(".menu-popover") && !e.target.closest(".menu-btn")) {
        closeMenus();
      }
    });

    // Pause button & P key
    if (pauseEl) {
      pauseEl.addEventListener("click", (e) => { e.stopPropagation(); togglePause(); });
    }
    if (pauseOverlay) {
      pauseOverlay.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); newGame(); }
      if ((e.key === "p" || e.key === "P") && !(e.target instanceof HTMLInputElement)) {
        togglePause();
      }
    });
    document.addEventListener("pointerdown", () => Sound.init(), { once: true });
    window.addEventListener("mousedown", () => Sound.init(), { once: true });
  }

  /* ------------------- Init ------------------- */
  window.addEventListener("error", (ev) => {
    const s = document.getElementById("statusText");
    if (s) s.textContent = "Something went wrong: " + (ev.message || "unknown");
  });

  function init() {
    bindMenuItems();
    refreshChecks();
    resetBoard();
    wireEvents();
  }

  window.Game = {
    newGame, menuAction, resetBoard, init,
    setSeed, makeRandomSeed, generateBoard, solveNoGuess
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
