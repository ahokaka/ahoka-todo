# Anton's Arcade

首页是一个**单文件**的沉浸式太空入口（"Planet Jumping"）：黑色开场加载火星俯冲片段 → 中心开出一个圆角矩形「传送门」窗口 → 从火星出发，经地球，到金星。

## 首页 `index.html`

- CSS 与 JS 全部内联，**不引入任何外部 JS/CSS 库**。字体用 `@font-face` 优先取本地 SF Pro / Aalto，取不到就回落到 Arial / Arial Narrow，布局不受影响。
- 媒体全部用提示词给定的 CDN 外链：
  - 背景视频：`3c83091e…`（火星）、`fc3ded42…`（去地球）、`b30f64d9…`（去金星）
  - 开场视频：`5fc5651c…`；传送门静帧：`d6fb8b6b…`（水星）；Logo：`eb7e0f53…`
- **传送门是真 canvas 遮罩**：`#portal-canvas` 每帧按 `#portal` 的实时 `getBoundingClientRect()` 采样约 44 个圆角矩形点，做焦距 850 的伪透视投影后 `clip()`，媒体在窗口里是 screen-locked 的 cover 绘制，所以是「窗口在静止画面上移动」的效果，不是贴图卡片。指针倾斜最多约 ±18.7° / ±16.5°，滚轮不动，纯靠指针。
- 状态机只有三步：`mars → earth → venus`，金星是终点（再点不响应）。数据、事实文案、传送门目标都在脚本顶部的 `states` 里。
- 加载流程：开场视频按 `duration / 3` 加速播放约 3 秒，右上角细计数器走 0→100%；结束后计数器上浮消散、Logo 从正中滑到左上角入位。
- ⚠️ 兼容性处理：浏览器不一定会为这些片段派发 `ended` 事件（实测 Chrome 里就不会），所以加载完成判定是「`ended` 事件 **或** 播放进度到 100% **或** 6 秒兜底」，三选一先到先算，避免卡在 100% 不动。

## 中英文切换

- 首页右上角 **EN / 中文** 按钮，切换会即时重绘标题、四行行星事实、侧栏行星名、按钮与 aria 文本，并写进 `localStorage`（键 `anton-arcade-lang`）；也支持 `?lang=zh` / `?lang=en` 直接指定。
- 扫雷页自己也有同样的按钮，文案字典在 `public/minesweeper/i18n.js`（`MSI18N.t()`）。
- 从首页打开扫雷时会把当前语言通过 `?lang=` 传给 iframe；在首页切语言时若面板已打开，会重新载入 iframe 以同步。
- 中文用系统字体栈（PingFang / 微软雅黑），并把大标题字号调小、间距加大，避免中文字面过宽。

## 扫雷

- 源码：`public/minesweeper/`（`index.html` + `style.css` + `game.js` + `i18n.js`）。玩法、无猜生成、种子系统、暂停逻辑全部未改，只改了外观与文案层。
- 外观改为与首页同一套黑/白极简风；`game.js` 里所有面向用户的字符串都走 `t("…")`，由 `i18n.js` 提供中英文。
- `?embed=1`（或被 iframe 嵌套）时给 `body` 加 `.embed`：隐藏页头、页脚、介绍文案和重复的标题条，只留游戏本体；手机上棋盘会自动收窄单元格以避免横向溢出。
- 首页右上角的 **玩扫雷 / Play Minesweeper** 按钮打开面板即 `?embed=1` 的 iframe，所以游戏逻辑仍然只有一份。

## 响应式

- 断点：900px、640px、380px，以及横屏矮屏 `max-height:560px`。
- 手机（≤640px）：隐藏行星侧栏，传送门与下一站标题上移，事实列表与行星名堆到底部，加载提示移到传送门下方；`(pointer:coarse)` 下关掉自定义光标并恢复原生光标。

## 构建与发布

- 构建：`npm ci` 然后 `npm run build`（Vite 把根 `index.html` 输出到 `dist/`，并把 `public/` 原样拷进 `dist/`）。
- 检查：`node scripts/check-site.mjs`（页面本地引用都存在、首页内联且无外部 JS、六个 CDN 资源都在、扫雷嵌入与独立页都正常、双语标记存在、`dist/` 与 `public/` 游戏文件一致、旧螺旋首页没有被带回来）。
- 发布：提交源码与 `dist/`，推 `main`，已有的 Cloudflare 集成会发布 `dist/`。
- `package.json` 里还留着一批旧依赖（react / motion / tailwind 等）：首页已经不用它们，保留只是为了不改动 lockfile。想清理的话单独做一次提交更安全。

## 其它

- `public/game.html` 是早前的 Loop 可玩原型，仍然可用，只是首页不再挂它的入口。
- `design-qa.md`、`lumora-hero-setup-summary.md` 记录的是已经下线的旧螺旋首页，留作历史记录。
