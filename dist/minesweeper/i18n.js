/* =========================================================
   Minesweeper i18n — English / 简体中文
   Loaded BEFORE game.js. The game reads strings through
   MSI18N.t(key, vars); static markup carries data-i18n* tags.
   ========================================================= */
(function () {
  "use strict";

  var DICT = {
    en: {
      "doc.title": "Minesweeper — Anton's Arcade",
      "brand": "ANTON'S ARCADE",
      "back": "← Back home",
      "intro.kicker": "NO. 001 / A LITTLE LOGIC, A LITTLE JOY.",
      "intro.lead": "Once you land, start with the squares under your feet.",
      "intro.title": "Minesweeper",
      "intro.titleCn": "扫雷",
      "titlebar.field": "THE PLAYING FIELD",
      "titlebar.badge": "LOGIC / PLAY",
      "menu.game": "Game",
      "menu.help": "Help",
      "menu.new": "New",
      "menu.beginner": "Beginner",
      "menu.intermediate": "Intermediate",
      "menu.expert": "Expert",
      "menu.sound": "Sound",
      "menu.howto": "How to Play",
      "menu.about": "About",
      "counter.mines": "MINES",
      "counter.time": "TIME",
      "face.new": "New game",
      "face.pause": "Pause (P)",
      "cell.aria": "Row {r}, column {c}",
      "status.ready": "Ready",
      "status.readySeed": "Ready · seed {seed}",
      "status.noguess": "No-guess board · seed {seed}",
      "status.win": "You win! 🎉",
      "status.lose": "Boom! You hit a mine.",
      "status.paused": "⏸ Paused · press P or ⏸ to resume",
      "pause.msg": "⏸ PAUSED",
      "status.error": "Something went wrong: {msg}",
      "status.flagHint": "Right-click to flag",
      "overlay.win": "🎉 You Win!",
      "overlay.lose": "💥 Boom!",
      "overlay.winText": "All safe squares revealed!",
      "overlay.loseText": "You hit a mine.",
      "overlay.again": "Play Again",
      "overlay.close": "Close",
      "seed.label": "Seed",
      "seed.placeholder": "e.g. ABC123",
      "seed.apply": "New",
      "seed.applyTitle": "New game with this seed",
      "seed.randomTitle": "Random seed",
      "footnote": "Left-click to reveal · Right-click to flag · F2 restart · P pause",
      "lang.aria": "Switch to Chinese",
      "help.body": "Minesweeper\n\nLeft-click to reveal a square.\nRight-click to flag (🚩), then question (?), then clear.\nLeft-click a revealed number with the correct flags to 'chord'.\n\n🔒 NO-GUESS GUARANTEE:\nEvery board is verified by a solver to be winnable using pure logic — you never have to guess.\n\n🧪 SEED SYSTEM:\nEnter a seed to reproduce the exact same board any time. Press 🎲 for a random seed.",
      "about.body": "Minesweeper — Windows Classic\n\nA full-featured web remake with sound effects, a verified no-guess guarantee, and a reproducible seed system."
    },
    zh: {
      "doc.title": "扫雷 Minesweeper — Anton's Arcade",
      "brand": "ANTON'S ARCADE",
      "back": "← 返回首页",
      "intro.kicker": "NO. 001 / 一点逻辑，一点快乐。",
      "intro.lead": "落地之后，先把脚下这片方格翻开。",
      "intro.title": "扫雷",
      "intro.titleCn": "Minesweeper",
      "titlebar.field": "游戏区",
      "titlebar.badge": "逻辑 / 游戏",
      "menu.game": "游戏",
      "menu.help": "帮助",
      "menu.new": "新游戏",
      "menu.beginner": "初级",
      "menu.intermediate": "中级",
      "menu.expert": "高级",
      "menu.sound": "音效",
      "menu.howto": "玩法说明",
      "menu.about": "关于",
      "counter.mines": "剩余雷数",
      "counter.time": "用时",
      "face.new": "开始新一局",
      "face.pause": "暂停（P）",
      "cell.aria": "第 {r} 行，第 {c} 列",
      "status.ready": "准备就绪",
      "status.readySeed": "准备就绪 · 种子 {seed}",
      "status.noguess": "无猜局 · 种子 {seed}",
      "status.win": "你赢了！🎉",
      "status.lose": "踩到雷了。",
      "status.paused": "⏸ 已暂停 · 按 P 或 ⏸ 继续",
      "pause.msg": "⏸ 已暂停",
      "status.error": "出错了：{msg}",
      "status.flagHint": "右键插旗",
      "overlay.win": "🎉 你赢了！",
      "overlay.lose": "💥 踩雷了！",
      "overlay.winText": "所有安全方格都翻开了！",
      "overlay.loseText": "你踩到了一颗雷。",
      "overlay.again": "再来一局",
      "overlay.close": "关闭",
      "seed.label": "种子",
      "seed.placeholder": "例如 ABC123",
      "seed.apply": "开局",
      "seed.applyTitle": "用该种子开新局",
      "seed.randomTitle": "随机种子",
      "footnote": "左键翻开 · 右键插旗 · F2 重开 · P 暂停",
      "lang.aria": "切换到英文",
      "help.body": "扫雷\n\n左键翻开方格。\n右键插旗（🚩），再点变成问号（?），再点取消。\n在已翻开的数字上，当周围旗数正确时左键可“和弦”展开。\n\n🔒 无猜保证：\n每一局都经过求解器验证，纯逻辑可解——不需要猜。\n\n🧪 种子系统：\n输入种子即可随时复现同一张雷图，点 🎲 获得随机种子。",
      "about.body": "扫雷 — Windows 经典\n\n带音效的完整网页复刻版：经求解器验证的无猜保证，以及可复现的种子系统。"
    }
  };

  var STORAGE_KEY = "anton-arcade-lang";

  function readParam() {
    try {
      return new URLSearchParams(window.location.search).get("lang");
    } catch (e) {
      return null;
    }
  }

  function detect() {
    var fromUrl = readParam();
    if (fromUrl === "zh" || fromUrl === "en") return fromUrl;
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) { /* storage blocked */ }
    var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  var lang = detect();

  function t(key, vars) {
    var table = DICT[lang] || DICT.en;
    var text = table[key];
    if (text === undefined) text = DICT.en[key];
    if (text === undefined) return key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.replace(new RegExp("\\{" + name + "\\}", "g"), vars[name]);
      });
    }
    return text;
  }

  // Translate every element carrying a data-i18n* tag.
  function apply(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-i18n-aria]"), function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-i18n-title]"), function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-i18n-placeholder]"), function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    // data-i18n-label feeds CSS `content: attr(data-label)` (MINES / TIME captions)
    Array.prototype.forEach.call(scope.querySelectorAll("[data-i18n-label]"), function (el) {
      el.setAttribute("data-label", t(el.getAttribute("data-i18n-label")));
    });
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    document.title = t("doc.title");
  }

  function setLang(next) {
    if (next !== "zh" && next !== "en") return;
    lang = next;
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
    apply();
    if (window.Game && typeof window.Game.refreshText === "function") window.Game.refreshText();
  }

  function toggle() {
    setLang(lang === "zh" ? "en" : "zh");
  }

  window.MSI18N = {
    get lang() { return lang; },
    t: t,
    apply: apply,
    setLang: setLang,
    toggle: toggle
  };
})();
