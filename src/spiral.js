/* ============================================================
   漂浮卡片 —— WebGL 螺旋（Three.js）
   ============================================================
   逐字复刻 grail-app 的 "Quest Spiral gl" 组件。
   源码：reference/grail-app/HomePage.js（未压缩，可对照）

   为什么必须用 WebGL：
   原版卡片是「弯曲的平面」，顶点着色器把它沿 x 轴向后卷曲：
       p.z -= uBend * position.x * position.x;
   CSS 3D 的变换矩阵无法表达曲面弯曲，所以纯 CSS 永远做不出
   那个"实体卡片"的感觉 —— 这是换 WebGL 的核心理由。

   原版参数（从源码提取，未改动）：
     angleStep .65(rad)   radius 2.6    squish .7   gapX -.05
     gapY .40             edgeTwist -.06            bend .06
     mouseTilt .12        magnet .10   autoSpeed .15
   原版定位：
     r    = 序号 * angleStep
     x    = radius * sin(r)
     z    = radius * squish * cos(r)
     y    = 序号 * gapY
     roty = -r                     ← 沿螺旋切线，这是螺旋感的来源
   ============================================================ */

import * as THREE from './vendor/three.module.min.js';

const stage = document.getElementById('stage');
const host = document.getElementById('stageGL');
const maskCanvas = document.getElementById('stageMask');
const hit = document.getElementById('stageHit');
const dataEl = document.getElementById('spiralData');
if (!stage || !host || !dataEl) {
  console.warn('spiral: 缺少必要的 DOM 节点');
  throw new Error('spiral init failed');
}

const CARDS = JSON.parse(dataEl.textContent);
const N = CARDS.length;
const cover = new Image();
cover.src = new URL('../public/home/minesweeper.png', import.meta.url).href + '?v=3';

/* ---------------- 参数 ----------------
   P 里保留原版的参考值（对照用）。
   实际生效的半径/步进在下面 STEP 与 geomParams() 里 ——
   因为原版是"12 张卡 + 手调滑杆"，这里按自己的卡数做了换算。 */
const P = {
  angleStep: 0.65,   // 原版值，仅参考
  radius: 2.6,       // 原版滑杆起点，仅参考（静止时实际是 12）
  squish: 0.7,
  gapX: -0.05,
  gapY: 0.40,        // 原版值，实际见 geomParams
  edgeTwist: -0.06,
  bend: 0.06,
  mouseTilt: 0.12,
  magnet: 0.10,
  autoSpeed: 0.15,
};

/* 卡片宽高比：原版卡片的世界尺寸 2 宽 × 2.59 高（从截图量得），
   即 0.77 : 1 —— 一个明显的竖版比例。
   注意：CARD_H / CARD_ASPECT 必须在下面 STEP_NARROW 之前声明。
   const 有暂时性死区，先引用后声明会抛 ReferenceError，
   而顶层抛错会让整个模块中断、WebGL 根本不会初始化
   （曾经因为这个导致整块 canvas 空白）。 */
const CARD_ASPECT = 0.7723;
const CARD_H = 2.59;
const CARD_W = CARD_H * CARD_ASPECT;

/* 环上的角度步进（弧度）。
   决定「相邻卡片沿螺旋隔多远」：间距 = radius × STEP − 卡宽。
   原版 0.65 配 12 张卡刚好；这里卡数多，收到 0.2334，
   环上间距 2.90 卡宽 → 0.40 卡宽。
   注意：这个值不影响半径、卡片大小、螺旋铺开度 —— 那些由 radius 管。

   桌面 radius=12，要求间距 = 0.40 卡宽：
     radius × STEP = 1.4 × 卡宽  →  STEP = 1.4 × 2.0 / 12 = 0.2334
   窄屏 radius 只有 6.5，同样的「0.40 卡宽」需要更大的步进，
   所以按半径换算。 */
const STEP = 0.2334;
const STEP_NARROW = (1.4 * CARD_W) / 6.5;

const CAM_Z = 16;
const FOV = 38;

/* 是否尊重系统的「减弱动效」偏好。
   注意：这个声明被误删过一次，导致 frame() 里抛
   ReferenceError: reduce is not defined，
   主循环第一次执行就中断、画面全黑（frames 恒为 0）。
   凡是 frame() 用到的顶层变量，声明必须留在文件顶部。 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. 把每张游戏卡画成纹理
   ============================================================
   关键：原版卡片是「亮色调」的，不是暗色。
   我下载了它真实的卡片素材看过（reference/grail-app/patterns/）：
   每张都是「浅色底 + 一个高饱和的粗几何符号」的扁平图形，
   比如浅蓝底配宝蓝色帆船、橙红配黑的重复几何块。
   源码里 surround 是 #f2cdf8（浅粉），也是浅色基调。
   所以这里用「浅色底 + 实心几何块」的配色，
   而不是深色渐变 —— 那正是之前"卡片太黑"的原因。
   ============================================================ */
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* 卡片配色：浅色底 + 高饱和前景色。对照原版素材的调性选的。 */
const CARD_COLORS = [
  { bg: '#d9c94a', fg: '#6b6320' },   // 芥末黄 / 橄榄（原版出现最多的那张）
  { bg: '#8a6aa8', fg: '#4a3560' },   // 灰紫
  { bg: '#b23a2a', fg: '#f2e8d5' },   // 砖红 / 米白
  { bg: '#8a98a8', fg: '#3f4a57' },   // 灰蓝
  { bg: '#8a5f3a', fg: '#3d2a1a' },   // 棕
  { bg: '#c4b8d4', fg: '#5a4a70' },   // 浅灰紫
  { bg: '#4a7a9e', fg: '#bfe0f0' },   // 中蓝
  { bg: '#b8923a', fg: '#5a4418' },   // 赭黄
  { bg: '#7a8f6a', fg: '#33402a' },   // 灰绿
  { bg: '#a86a8a', fg: '#4a2a3a' },   // 灰玫
  { bg: '#6a8fa8', fg: '#d4e4ef' },   // 灰青
  { bg: '#a85f4a', fg: '#f0dcd4' },   // 陶土
];

/* 把画布裁成圆角，让卡片有实体边缘 */
function clipCard(g, W, H) {
  const r = Math.round(W * 0.045);
  roundRect(g, 0, 0, W, H, r);
  g.clip();
}

/* 在卡片上铺一层重复的粗几何纹样 —— 照着原版素材的感觉做：
   大色块、直角、重复排布。 */
function drawPattern(g, W, H, kind, fg, bg) {
  const cell = W / 5;
  g.save();
  g.globalAlpha = 1;

  if (kind % 3 === 0) {
    // 棋盘 + 圆点：交替实心方块
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 5; x++) {
        if ((x + y) % 2 === 0) {
          g.fillStyle = fg;
          g.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    g.fillStyle = bg;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 5; x++) {
        if ((x + y) % 2 !== 0) {
          g.beginPath();
          g.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.18, 0, 6.283);
          g.fill();
        }
      }
    }
  } else if (kind % 3 === 1) {
    // 阶梯折线：像原版那种"阶梯块"
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 5; x++) {
        const odd = (x + y) % 2 === 0;
        g.fillStyle = odd ? fg : bg;
        const cx = x * cell, cy = y * cell;
        // 阶梯形状：两个错位的方块
        g.fillRect(cx, cy + cell * (odd ? 0.25 : 0), cell * 0.6, cell * 0.55);
        g.fillRect(cx + cell * 0.4, cy + cell * (odd ? 0.5 : 0.45), cell * 0.6, cell * 0.55);
      }
    }
  } else {
    // 大圆弧：交替的半圆
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 5; x++) {
        const odd = (x + y) % 2 === 0;
        g.fillStyle = odd ? fg : bg;
        g.beginPath();
        g.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.52, 0, 6.283);
        g.fill();
      }
    }
  }
  g.restore();
}

/* ============================================================
   卡片纹理 —— 两种版式，对应原版的两种卡
   ============================================================
   看原站截图能分辨出两类卡：
     A. 图案卡：整张是重复的粗几何图案，底部一条白色窄带写标题
        （截图里芥末黄的蛇形格、灰紫的圆点树、砖红的重复块）
     B. 任务卡：白底，左上小徽章 + 灰色小字序列名 + 加粗大字标题
        + 灰色描述 + 一行小头像（截图里 "Eat your next meal..."）
   这里按序号交替生成，让螺旋上两种卡混着出现。
   ============================================================ */
function makeCardTexture(card, index) {
  const W = 512, H = Math.round(512 / CARD_ASPECT);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  const pal = CARD_COLORS[index % CARD_COLORS.length];
  const bg = card.bg || pal.bg;
  const fg = card.fg || pal.fg;
  // 每 3 张出 1 张任务卡，其余是图案卡
  const isTask = (index % 3 === 1) && !!card.desc;

  g.save();
  clipCard(g, W, H);

  if (card.featured) {
    g.fillStyle = '#f2cdf8';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#382339';
    g.font = '500 20px system-ui, sans-serif';
    g.fillText('现在可玩 / NO. 001', 36, 50);
    g.font = '48px Georgia, serif';
    g.fillText('Minesweeper', 36, 115);
    g.font = '24px system-ui, sans-serif';
    g.fillText('扫雷 · 让逻辑先走', 36, 162);
    if (cover.complete && cover.naturalWidth) {
      const h = 360, w = h * cover.naturalWidth / cover.naturalHeight;
      g.drawImage(cover, (W - w) / 2, 196, w, h);
    }
    g.font = '600 25px system-ui, sans-serif';
    g.fillText('点击卡片，来一局', 36, H - 45);
  } else if (isTask) {
    /* ---------- B. 白底任务卡 ---------- */
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);

    const px = Math.round(W * 0.075);
    let y = Math.round(H * 0.055);

    // 徽章
    g.fillStyle = fg;
    roundRect(g, px, y, 44, 44, 12);
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = `700 ${Math.round(W * 0.062)}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(card.mark || '◆', px + 22, y + 24);

    y += 74;
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#9a90a0';
    g.font = `500 ${Math.round(W * 0.036)}px system-ui, sans-serif`;
    g.fillText(card.kick || '', px, y);

    y += 46;
    g.fillStyle = '#1c1620';
    g.font = `700 ${Math.round(W * 0.075)}px system-ui, sans-serif`;
    // 标题换行（最多两行）
    wrapText(g, card.title || '', px, y, W - px * 2, Math.round(W * 0.082), 2);

    y += 128;
    g.fillStyle = '#6a6070';
    g.font = `400 ${Math.round(W * 0.037)}px system-ui, sans-serif`;
    wrapText(g, card.desc || '', px, y, W - px * 2, Math.round(W * 0.05), 3);

    // 底部一行小头像圆点（原版有，纯装饰）
    const ay = H - Math.round(H * 0.075);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(px + 14 + i * 40, ay, 13, 0, 6.283);
      g.fillStyle = CARD_COLORS[(index + i * 3) % CARD_COLORS.length].bg;
      g.fill();
      g.strokeStyle = '#ffffff';
      g.lineWidth = 3;
      g.stroke();
    }
    g.fillStyle = '#9a90a0';
    g.font = `500 ${Math.round(W * 0.03)}px system-ui, sans-serif`;
    g.fillText('0:18', px + 132, ay + 5);

  } else {
    /* ---------- A. 图案卡 ---------- */
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    drawPattern(g, W, H, index, fg, bg);

    // 中央符号，压暗一点和图案分层
    g.fillStyle = fg;
    g.font = `700 ${Math.round(W * 0.24)}px system-ui, -apple-system, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.globalAlpha = 0.85;
    g.fillText(card.mark || '◆', W / 2, H * 0.42);
    g.globalAlpha = 1;

    // 底部白色窄带 + 标题（原版图案卡就是这个做法）
    const bh = Math.round(H * 0.135);
    const by = H - bh - Math.round(W * 0.055);
    const pad = Math.round(W * 0.055);
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.22)';
    g.shadowBlur = 14;
    g.shadowOffsetY = 3;
    g.fillStyle = '#ffffff';
    roundRect(g, pad, by, W - pad * 2, bh, Math.round(W * 0.028));
    g.fill();
    g.restore();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#2a2230';
    g.font = `700 ${Math.round(W * 0.055)}px system-ui, -apple-system, sans-serif`;
    g.fillText(card.title || '', pad + 20, by + bh * 0.42);

    g.fillStyle = '#9a90a0';
    g.font = `500 ${Math.round(W * 0.033)}px system-ui, -apple-system, sans-serif`;
    g.fillText(card.kick || '', pad + 20, by + bh * 0.76);
  }

  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/* 按宽度断行，最多 maxLines 行 */
function wrapText(g, text, x, y, maxW, lineH, maxLines) {
  const words = String(text).split(/([\u4e00-\u9fff])/).filter(Boolean);
  let line = '', n = 0;
  for (const w of words) {
    const test = line + w;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y + n * lineH);
      line = w; n++;
      if (n >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && n < maxLines) g.fillText(line, x, y + n * lineH);
}

/* ============================================================
   背面的徽记纹理
   ============================================================
   原版每张卡背面另有一张 emblem 图（源码 uBack）。
   卡片背面朝中轴，螺旋转到后半圈时我们看到的就是它，
   所以这张纹理决定了后半圈好不好看：
   用该卡的配色做「大色块 + 中央徽记」，比正面简洁一档，
   避免正反面都花、远看糊成一片。

   关键：建模时先水平镜像一次（scale(-1,1)）。
   因为从背面看，PlaneGeometry 的 uv 是左右翻转的 ——
   不预镜像的话背面文字会反着显示。
   ============================================================ */
function makeBackTexture(card, index) {
  const W = 512, H = Math.round(512 / CARD_ASPECT);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  const pal = CARD_COLORS[index % CARD_COLORS.length];
  const bg = card.bg || pal.bg;
  const fg = card.fg || pal.fg;

  g.save();
  clipCard(g, W, H);

  // 底色，比正面略深一点，正反面才有区分
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 外圈细边框，像实体卡片的背面
  const m = Math.round(W * 0.045);
  g.strokeStyle = fg;
  g.globalAlpha = 0.5;
  g.lineWidth = Math.round(W * 0.012);
  roundRect(g, m, m, W - m * 2, H - m * 2, Math.round(W * 0.03));
  g.stroke();
  g.globalAlpha = 1;

  // 中央徽记：同心圆 + 大符号
  const cx = W / 2, cy = H * 0.44;
  const r = W * 0.26;
  g.fillStyle = fg;
  g.globalAlpha = 0.14;
  g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill();
  g.globalAlpha = 0.24;
  g.beginPath(); g.arc(cx, cy, r * 0.72, 0, 6.283); g.fill();
  g.globalAlpha = 1;

  g.fillStyle = fg;
  g.font = `700 ${Math.round(W * 0.20)}px system-ui, -apple-system, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(card.mark || '◆', cx, cy);

  // 底部一行小字：卡片名（预镜像，所以从背面看是正的）
  g.font = `700 ${Math.round(W * 0.045)}px system-ui, -apple-system, sans-serif`;
  g.fillText(card.title || '', cx, H * 0.80);

  g.restore();

  // 水平镜像：背面视角的 uv 是反的，预翻转一次抵消掉
  const m2 = document.createElement('canvas');
  m2.width = W; m2.height = H;
  const g2 = m2.getContext('2d');
  g2.translate(W, 0);
  g2.scale(-1, 1);
  g2.drawImage(c, 0, 0);

  const tex = new THREE.CanvasTexture(m2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/* ============================================================
   2. 着色器
   bend 段逐字来自原版；其余是它的等价精简（原版还叠了背面图案
   和 smear，这里不需要）。
   ============================================================ */
const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // The original bend is baked into geometry so raycasting matches the visible card.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

/* 片元着色器。
   卡片背面朝中轴，所以螺旋转到后半圈时，我们看到的是卡片的背面。
   原版给背面单独配了一张纹理（源码里的 uBack，注释写着
   "Back of the card — the guild emblem, full-bleed"）。
   照这个来：正面用卡片纹理，背面用该卡的配色画一个徽记图案。
   这样后半圈的卡片也能显示，而不是被整片剔除。
   注意：背面纹理在建模时就已经左右镜像过一次，
   所以 gl_FrontFacing 为 false 时直接采样即可，文字不会反。 */
const FRAG = `
precision highp float;
uniform sampler2D uTex;   // 正面：卡片图案 + 标题
uniform sampler2D uBack;  // 背面：徽记图案
uniform float uDim;
varying vec2 vUv;
void main() {
  vec4 c = gl_FrontFacing
    ? texture2D(uTex, vUv)
    : texture2D(uBack, vUv);
  gl_FragColor = vec4(c.rgb * uDim, c.a);
  #include <colorspace_fragment>
}
`;

/* ============================================================
   3. 场景
   ============================================================ */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
camera.position.set(0, 0, CAM_Z);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

const planeGeo = new THREE.PlaneGeometry(CARD_W, CARD_H, 24, 24);
const positions = planeGeo.attributes.position;
for (let i = 0; i < positions.count; i++) {
  positions.setZ(i, -P.bend * (positions.getX(i) ** 2 + 0.35 * positions.getY(i) ** 2));
}
planeGeo.computeVertexNormals();
const group = new THREE.Group();
scene.add(group);

const meshes = [];
CARDS.forEach((card, i) => {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: makeCardTexture(card, i) },
      uBack: { value: makeBackTexture(card, i) },
      uDim: { value: 1.0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    /* 双面渲染：卡片背面朝中轴，螺旋转到后半圈时我们看到的
       正是背面，必须让它渲染出来（正面纹理 + 背面徽记）。
       配合下面的 backside 处理，背面要左右翻转一次，
       否则背面上的文字会是镜像。 */
    side: THREE.DoubleSide,
    transparent: false,
  });
  const mesh = new THREE.Mesh(planeGeo, mat);
  mesh.userData = {
    index: i,
    bx: 0, by: 0,          // 基准位置（磁吸偏移的锚点）
    dim: 1.0,
    scale: 1,
    hot: 0,
  };
  group.add(mesh);
  meshes.push(mesh);
});
cover.onload = () => {
  meshes.forEach((mesh, i) => {
    if (!CARDS[i].featured) return;
    mesh.material.uniforms.uTex.value.dispose();
    mesh.material.uniforms.uTex.value = makeCardTexture(CARDS[i], i);
  });
};

/* ============================================================
   4. 几何：原版公式
   ============================================================ */
function geomParams() {
  const narrow = stageSize().w < 900;
  /* 半径 12 不是 2.6。
     源码里半径是插值的：g = 12 + (o.radius - 12) * m，
     m 是「稳定进度」—— 螺旋静止时 m → 1，于是 g → 12。
     滑杆上的 2.6 只是起点，静止时的实际半径是 12。
     这个差别决定了观感：
       半径 2.6 → 相邻卡弧长 1.7，小于卡宽 2.0 → 糊成一团
       半径 12  → 相邻卡弧长 7.8，约 4 倍卡宽      → 张张分明
     （这正是之前"卡片挤成一堆"的根因） */
  return {
    gapY: 0.297,  // 36 张卡，纵向总跨约 13（保持卡片大小）
    /* 半径越大 → 螺旋摊得越开、卡片越小，两侧不再留空。
       12 是让螺旋横向铺满视口的值（卡片正好缩到原版那种 7.7% 宽）。 */
    radius: narrow ? 6.5 : 12,
  };
}

function layout() {
  const { gapY, radius } = geomParams();

  meshes.forEach((m, k) => {
    /* 角度步进决定「环上卡片有多密」：每张卡往前转 angleStep 弧度。
       原版是 0.65，但那是配 12 张卡的；18 张卡用 0.65 时相邻卡
       在环上相隔 2.9 个卡宽，显得很空。
       收到 0.40、同时把卡数提到 24，间距降到 1.40 卡宽 ——
       半径 12、卡片大小、螺旋铺开度都不受影响（那些由 radius 管）。 */
    const r = k * (stageSize().w < 900 ? STEP_NARROW : STEP);
    const sinR = Math.sin(r);
    const cosR = Math.cos(r);

    // ↓↓↓ 原版三行公式（z 是纵深，x 是横向铺开）
    let x = radius * sinR;
    const z = radius * P.squish * cosR;
    const y = (k - (N - 1) / 2) * gapY;   // 减中值 → 螺旋以原点为中心
    x += k * P.gapX;
    // ↑↑↑

    /* 朝向：背面始终指向中轴。
       卡片站的位置是 (x, z)，这是它绕中轴转过的角度 a 决定的；
       要让背面朝向中轴，卡片自身就转 a。
       关键：a 必须由「当前绕行角度」算出来，而不是按序号定死 ——
       按序号定死的话，整组自转时卡片自己不转，就会一直朝着同一个
       方向（这就是"旋转时不会调整角度"的原因）。
       所以这里只存基准角度 userData.baseRot，实际朝向在主循环里
       叠加 group 的自转量一起算。 */
    const a = Math.atan2(x, z);          // x = R·sin(a), z = R·cos(a)
    m.userData.baseRot = a;

    m.position.set(x, y, z);
    m.rotation.set(0, a, 0);
    m.userData.bx = x;
    m.userData.by = y;
  });
}

/* 视野自适应。
   原版是横向铺满、允许两侧溢出（它截图里右侧的卡就被切掉了）。
   宽屏按 1.0 铺开，正好对上原图实测的卡片占宽。 */
function fitView() {
  const { w, h } = stageSize();
  const narrow = w < 900;
  const { gapY, radius } = geomParams();

  const spanY = (N - 1) * gapY + CARD_H;
  const spanX = 2 * radius + CARD_W;

  const viewH = 2 * Math.tan((FOV * Math.PI / 180) / 2) * CAM_Z;
  const viewW = viewH * (w / h);

  const fitX = narrow ? 2.0 : 1.0;
  const s = Math.min((viewW * fitX) / spanX, (viewH * 0.92) / spanY);
  group.scale.setScalar(s);
}

/* 取舞台的实际尺寸。
   有些内嵌 WebView / 离屏浏览器会把布局视口报成 1×1：
     window.innerWidth/Height = 1
     documentElement.clientWidth/Height = 0
   这时 CSS 里的 92vh 也算不出高度，.stage 只有约 1px 高，
   卡片"渲染了却看不见"（canvas 内部尺寸再大也没用，
   CSS 布局高度才是决定它显示多大的那个）。
   所以：尺寸退化时，把像素高度直接写到元素行内样式上，
   绕开 vh 依赖，再退回一个合理默认值。 */
function stageSize() {
  let w = stage.clientWidth || 0;
  let h = stage.clientHeight || 0;

  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  const docW = document.documentElement?.clientWidth || 0;
  const docH = document.documentElement?.clientHeight || 0;

  const degenerate = (w < 8 || h < 8) && (vh < 8 || docH < 8);

  if (w < 8) w = vw >= 8 ? vw : (docW >= 8 ? docW : 1280);
  if (h < 8) h = vh >= 8 ? vh : (docH >= 8 ? docH : 800);

  // 视口彻底不可用时，用行内像素高度顶住，别让 vh 把舞台压成一条线
  if (degenerate && stage) {
    stage.style.minHeight = h + 'px';
    stage.style.height = h + 'px';
  }
  return { w, h };
}

function resize() {
  const { w, h } = stageSize();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  /* 第三参数 false：不要让 three 去写 canvas 的 CSS 尺寸，
     显示尺寸交给 CSS（100% × 100%）控制，
     这里只把渲染缓冲区设成对应的像素尺寸。
     注意这一行必须真的被执行：曾经因为上一行注释里混进了
     字面量 "\n"，把这条语句一并注释掉，
     渲染缓冲区停在默认 300×150，整块画面全黑。 */
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  fitView();
}

/* ============================================================
   5. 指针：倾角 + 磁吸 + 命中
   ============================================================ */
const S = {
  spin: 0, spinVel: P.autoSpeed,
  mx: 0, my: 0, tx: 0, ty: 0,
  dragging: false, lastX: 0, pull: 0,
  dragMoved: false,
};

let hovered = -1;

// Native raycasting uses the same curved geometry that is rendered.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pick(px, py) {
  const { w, h } = stageSize();
  pointer.set(px / w * 2 - 1, 1 - py / h * 2);
  raycaster.setFromCamera(pointer, camera);
  const intersection = raycaster.intersectObjects(meshes, false)[0];
  return intersection ? intersection.object.userData.index : -1;
}

let downPt = { x: 0, y: 0 }, lastTime = 0;
hit.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary || e.button !== 0) return;
  hit.setPointerCapture(e.pointerId);
  S.dragging = true;
  S.dragMoved = false;
  S.lastX = e.clientX;
  S.pull = 0;
  lastTime = e.timeStamp;
  downPt = { x: e.clientX, y: e.clientY };
});
hit.addEventListener('pointermove', (e) => {
  const b = stage.getBoundingClientRect();
  S.mx = ((e.clientX - b.left) / b.width - 0.5) * 2;
  S.my = ((e.clientY - b.top) / b.height - 0.5) * 2;
  if (S.dragging) {
    const angle = (e.clientX - S.lastX) * 0.005;
    S.spin += angle;
    S.pull = clamp(angle / Math.max((e.timeStamp - lastTime) / 1000, 0.008), -3, 3);
    S.lastX = e.clientX;
    lastTime = e.timeStamp;
    S.dragMoved ||= Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) > 6;
  }
  hovered = S.dragging ? -1 : pick(e.clientX - b.left, e.clientY - b.top);
  hit.style.cursor = S.dragging ? 'grabbing' : (CARDS[hovered]?.href ? 'pointer' : 'grab');
}, { passive: true });
const endDrag = () => { S.dragging = false; };
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => hit.addEventListener(ev, endDrag));
hit.addEventListener('pointerleave', () => { hovered = -1; S.mx = 0; S.my = 0; });
hit.addEventListener('click', (e) => {
  if (S.dragMoved) return;
  const b = stage.getBoundingClientRect();
  const idx = pick(e.clientX - b.left, e.clientY - b.top);
  if (CARDS[idx]?.href) window.location.href = CARDS[idx].href;
});
hit.addEventListener('wheel', (e) => {
  S.spinVel = clamp(S.spinVel + e.deltaY * 0.001, -1.5, 1.5);
}, { passive: true });

let paused = reduce, visible = true;
const toggle = document.getElementById('motionToggle');
function syncMotionButton() {
  toggle.textContent = paused ? '继续旋转' : '暂停旋转';
  toggle.setAttribute('aria-pressed', String(paused));
}
toggle.addEventListener('click', () => { paused = !paused; S.pull = 0; syncMotionButton(); });
syncMotionButton();
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(stage);

/* ============================================================
   6. 主循环
   ============================================================ */
const clock = new THREE.Clock();

function frame() {
  try {
    const dt = Math.min(clock.getDelta(), 0.05);
    const k = dt * 60;
    if (document.hidden || !visible) { requestAnimationFrame(frame); return; }

    if (!paused) {
      if (!S.dragging) S.spin += S.spinVel * dt + S.pull * dt;
      if (!S.dragging) S.pull *= Math.pow(0.94, k);
      S.spinVel += (P.autoSpeed - S.spinVel) * 0.02 * k;

      // 原版：整组 rotation 跟随鼠标，mouseTilt 为最大倾角（弧度）
      S.tx += (-S.my * P.mouseTilt - S.tx) * Math.min(1, dt * 4);
      S.ty += (S.mx * P.mouseTilt - S.ty) * Math.min(1, dt * 4);
    }

    group.rotation.y = S.ty + S.spin;
    group.rotation.x = -0.06 + S.tx;

    // 磁吸的目标点（组局部坐标）
    const wx = S.mx * 3.2;
    const wy = -S.my * 2.0;
    const ease = Math.min(1, dt * 6);

    meshes.forEach((m, i) => {
      /* 朝向：背面始终指向中轴。
         卡片位置由它绕中轴的角度 a 决定；要背面朝中轴，卡片的
         y 朝向就该是 a。关键是这里必须写「组坐标系里的角度」，
         组自转时世界朝向自然跟着转 —— 卡片因此始终径向。
         绝不能按序号定死一个固定角度：那样整组自转时卡片自己
         不转，会永远朝着同一个方向（这正是之前的 bug）。 */
      m.rotation.y = m.userData.baseRot;

      // 高斯衰减的磁吸强度（原版 magnet * exp(-d²/9)）
      const dx = m.userData.bx - wx;
      const dy = m.userData.by - wy;
      const magnet = P.magnet * Math.exp(-(dx * dx + dy * dy) / 9);

      // 目标状态：hover 的那张放大一点、略往前
      const isHot = i === hovered;
      const targetScale = isHot ? 1.22 : 1.0;

      // 用「朝目标插值」，不累积误差
      if (typeof m.userData.scale !== 'number') m.userData.scale = 1;
      m.userData.scale += (targetScale - m.userData.scale) * ease;

      m.scale.setScalar(m.userData.scale);

      // 位置 = 基准 + 磁吸偏移
      m.position.x = m.userData.bx + (wx - m.userData.bx) * magnet;
      m.position.y = m.userData.by + (wy - m.userData.by) * magnet * 0.5;
      m.position.z = m.userData.bz + (isHot ? 0.3 : 0);
    });

    renderer.render(scene, camera);
  } catch (err) {
    // 主循环一旦抛错就会永久停摆（画面上什么都不动），
    // 所以这里捕获并把首个异常暴露出来，不要静默死掉。
    if (!window.__frameErr) {
      window.__frameErr = (err && err.stack) || String(err);
      console.error('[spiral] frame error:', err);
    }
  }
  requestAnimationFrame(frame);
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

/* ============================================================
   7. 暗角 + 颗粒遮罩
   ============================================================ */
const grainTile = (function makeGrain(size = 96) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const val = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
    img.data[i + 3] = 15;
  }
  g.putImageData(img, 0, 0);
  return c;
})();

function paintMask() {
  if (!maskCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { w, h } = stageSize();
  maskCanvas.width = Math.round(w * dpr);
  maskCanvas.height = Math.round(h * dpr);
  const ctx = maskCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const g = ctx.createRadialGradient(
    w / 2, h * 0.5, Math.min(w, h) * 0.26,
    w / 2, h * 0.5, Math.max(w, h) * 0.88
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.82, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(9,6,13,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

/* ============================================================
   8. 启动
   ============================================================ */
function boot() {
  resize();
  layout();
  // z 基准在 layout 之后记录
  meshes.forEach((m) => { m.userData.bz = m.position.z; });
  paintMask();

  // 入场：从画面外转入
  S.spin = -meshes[CARDS.findIndex(card => card.featured)].userData.baseRot;
  clock.start();
  requestAnimationFrame(frame);
}

let rt;
window.addEventListener('resize', () => {
  resize();
  layout();
  meshes.forEach((m) => { m.userData.bz = m.position.z; });
  clearTimeout(rt);
  rt = setTimeout(paintMask, 160);
});

boot();
