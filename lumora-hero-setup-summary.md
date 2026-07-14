# Lumora 全屏电影级 Hero — 流程总结

> 切换新会话实现同样效果的完整 Checklist

---

## 一、项目初始化前提

| 项目 | 值 |
|------|-----|
| 构建工具 | Vite + React |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite` 插件） |
| 图标库 | `lucide-react` |
| 字体 | Google Fonts: **Instrument Serif** (italic for logo) |

**`package.json` 关键依赖：**
```json
"dependencies": {
  "lucide-react": "^0.507.0",
  "motion": "^12.42.2",
  "react": "^19.2.7",
  "react-dom": "^19.2.7"
},
"devDependencies": {
  "@tailwindcss/vite": "^4.3.2",
  "@vitejs/plugin-react": "^4.7.0",
  "tailwindcss": "^4.3.2",
  "vite": "^6.4.3"
}
```

> `motion` 是原始项目中的依赖，但在 App.jsx 中没有直接导入，安装即可。

**`vite.config.js` — 必须加 `base: ''`**（否则 Cloudflare Pages 自定义域名下 asset 路径会出错）：
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '',          // ← 关键：相对路径，Cloudflare Pages 兼容
})
```

**`index.html` 完整内容：**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./assets/favicon-HV1kWBx1.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lumora — Clarity in a Noisy Universe</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
    <script type="module" src="/src/main.jsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

> favicon 路径用 `./assets/favicon-HV1kWBx1.svg`，同时需要在 `public/assets/` 目录下放入该 SVG 文件，Vite 在 dev 模式下会从 `public/` 复制到构建输出。

**favicon SVG 文件路径：** `public/assets/favicon-HV1kWBx1.svg`

---

## 二、核心文件结构

```
public/
└── assets/
    └── favicon-HV1kWBx1.svg   # 紫色渐变图标
src/
├── main.jsx                    # React 入口
├── App.jsx                     # 单组件 — 全屏 Hero
└── index.css                   # Tailwind + 自定义 CSS
```

---

## 三、CSS (`index.css`) 要点

### 1. Tailwind v4 引入
```css
@import "tailwindcss";
```

### 2. 字体设置
```css
html, body {
  font-family: 'Instrument Serif', serif;
}
```
正文（subtext, buttons, stats, nav links）用行内 `style={{ fontFamily: 'system-ui, sans-serif' }}`。

### 3. `.liquid-glass` 类 — 玻璃拟态容器
```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

### 4. PNG 覆盖层动画 — `trainBob`

原始 Figma PNG URL：
```css
.overlay-png {
  background-image: url('https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png');
  background-size: cover;
  background-position: center;
  animation: trainBob 3s ease-in-out infinite;
  transform: scale(1.03);
}
@keyframes trainBob {
  0%, 100% { transform: scale(1.03) translateY(0); }
  50%      { transform: scale(1.03) translateY(-6px); }
}
```

> 该 PNG 覆盖层可替换为自己的纹理图或噪声图。

### 5. 移动菜单入场动画（关键修复）
用 CSS `@keyframes` + `animation-delay` 实现错落入场（**不要用 inline style 控制 opacity/transform，否则不会动画**）：
```css
.menu-overlay-enter {
  animation: menuFadeIn 500ms cubic-bezier(0.4,0,0.2,1) forwards;
}
@keyframes menuFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.menu-link {
  opacity: 0;
  transform: translateY(16px);
  animation: menuLinkSlideIn 500ms cubic-bezier(0.4,0,0.2,1) forwards;
}
@keyframes menuLinkSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.menu-button {
  opacity: 0;
  transform: scale(0.9);
  animation: menuButtonScaleIn 500ms cubic-bezier(0.4,0,0.2,1) forwards;
  animation-delay: 350ms;
}
@keyframes menuButtonScaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}
```
JS 中通过 `animationDelay` 行内设置每项错开 50ms：
```jsx
style={{ animationDelay: `${100 + i * 50}ms` }}
```

---

## 四、`App.jsx` 结构要点

### 整体布局
```
<section> (relative, w-full h-screen, overflow-hidden, bg-black)
  ├── <div> z-0: 4个 stacked <video> (absolute inset-0)
  │   └── 只有 activeVideo 的 opacity-100，其余 opacity-0
  │       过渡 duration-1000 ease-in-out
  ├── <div> z-[1]: .overlay-png (pointer-events-none)
  └── <div> z-10: flex flex-col h-full
      ├── <nav>: Logo + 桌面导航(.liquid-glass pill) / 移动端汉堡按钮
      ├── 移动菜单 (fixed z-50, 条件渲染)
      ├── <div> flex-1 (spacer)
      ├── Hero Content (居中)
      │   ├── Badge (.liquid-glass rounded-full pill)
      │   ├── h1 (Instrument Serif, "Clarity in an Endlessly<br />Noisy Universe")
      │   ├── p (subtext)
      │   ├── Email input (.liquid-glass rounded-full + button)
      │   └── Video Switcher (4个button, active有底边)
      ├── <div> flex-1 (spacer)
      └── Bottom Stats (| 分隔, 移动端隐藏管道符)
```

### State 管理
```js
const [activeVideo, setActiveVideo] = useState(0);
const [isTransitioning, setIsTransitioning] = useState(false);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const isDarkMode = activeVideo === 2; // "Deep Woods" — 索引2
```

### Video Switching 逻辑
```js
const handleVideoSwitch = useCallback((index) => {
  if (index === activeVideo || isTransitioning) return;
  setIsTransitioning(true);
  setActiveVideo(index);
  setTimeout(() => setIsTransitioning(false), 1000);
}, [activeVideo, isTransitioning]);
```

### 视频 URL 数据（原始 CloudFront CDN）
```js
const VIDEOS = [
  { url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4', label: 'Golden Hour' },
  { url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4', label: 'Still Water' },
  { url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4', label: 'Deep Woods' },     // index 2 = 暗色模式
  { url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4', label: 'Quiet Dawn' },
];
```

### 暗色模式切换
- 当 `activeVideo === 2`（Deep Woods），hero content 文字颜色变为 `#182C41`
- 用 `transition-colors duration-700` 过渡
- navbar 和 bottom stats 始终白色

### 移动端汉堡按钮动画
Menu 和 X 图标 absolute 定位，通过 `mobileMenuOpen` 切换 opacity + rotate：
- Menu 打开时：`opacity-0 rotate-90 scale-75`
- X 出现时：`opacity-100 rotate-0 scale-100`

---

## 五、关于"绘画的提示词"

**这套流程中没有用到 AI 绘画。** 所有视觉资产都是已存在的 URL：

| 资产 | 来源 | 说明 |
|------|------|------|
| 4 段背景视频 | CloudFront CDN URL（d8j0ntlcm91z4.cloudfront.net） | 非 AI 生成 |
| PNG 覆盖层 | Figma 图片 URL | 非 AI 生成 |

如需 AI 生成素材，需额外使用 Midjourney / DALL·E / Runway 等工具。

---

## 六、部署流程

```bash
npm run build          # 构建到 dist/
git add .gitignore dist/
git commit -m "include dist/"
git push origin main
```

> ⚠️ `.gitignore` 中**不需要**忽略 `dist/` — 需要把 `dist/` 提交到仓库，因为 Cloudflare Pages 直接从仓库的 `dist/` 目录部署（build command 留空）。

**Cloudflare Pages 配置：**
| 设置 | 值 |
|------|-----|
| Build output directory | `dist` |
| Build command | 留空 |

> ⚠️ **自定义域名样式不显示** — 部署后如果 `ahoka.xyz` 没有样式而 `xxx.pages.dev` 有，是浏览器缓存旧 HTML 导致的。在 `ahoka.xyz` 页面做**硬刷新**即可：
> - Windows: `Ctrl + Shift + R` 或 `Ctrl + F5`
> - Mac: `Cmd + Shift + R`

---

## 七、新会话复现 Checklist

- [ ] 用 Vite + React + Tailwind v4 + lucide-react 初始化项目
- [ ] 安装额外依赖 `motion`
- [ ] 配置 `vite.config.js` 加 `base: ''`
- [ ] 配置 `index.html` 加载 Instrument Serif 字体，favicon 路径用 `./assets/favicon-HV1kWBx1.svg`
- [ ] 在 `public/assets/` 放入 favicon SVG
- [ ] 写 `index.css`（Tailwind import + liquid-glass + trainBob + 移动菜单 keyframes）
- [ ] 写 `App.jsx`（单一组件，包含上述所有结构和逻辑）
- [ ] App.jsx 中**不要** `import './index.css'` — 样式在 `main.jsx` 中已导入
- [ ] 确保移动菜单用 CSS `@keyframes` + `animation-delay`，不用 inline 控制动画初态
- [ ] 确保视频切换有 `isTransitioning` 1000ms 冷却
- [ ] 确保 Deep Woods (index 2) 时 hero 内容变 `#182C41`
- [ ] 确保 `.gitignore` 不排除 `dist/`
- [ ] `npm run build` → `git add dist/` → push → Cloudflare Pages 部署
- [ ] 部署后样式不对先做硬刷新（`Ctrl+Shift+R`）
