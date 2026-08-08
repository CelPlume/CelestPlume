# CelestPlume

诗意、神圣、天启之作 —— 代码即经卷。A poetic, sacred, apocalyptic revelation in code.

双语文档站点：英文（`/`）+ 简体中文（`/zh/`），基于 [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/)。

- Slogan EN：*Casting scales of old, spread wings to realms untold.*
- Slogan ZH：*辞却尘渊旧日鳞，振翼云海入星河*

## 快速开始

```bash
bun install        # 安装依赖（仅允许 bun）
bun run dev        # 开发服务器 http://localhost:4321
bun run build      # 生产构建到 dist/
bun run preview    # 预览生产构建
bun run typecheck  # TypeScript 类型检查（astro check）
bun run lint       # ESLint
```

## 目录结构

```
src/
  pages/
    index.astro          # 英文主页（root locale）
    zh/index.astro       # 中文主页（/zh/）
  layouts/
    Home.astro           # 主页布局（导航、语言/主题切换、加载动画、页脚）
  components/
    HomePage.astro       # 主页内容（Hero 粒子文字、Projects、Philosophy、CTA）
  content/docs/          # 英文文档（Starlight）
  content/docs/zh/       # 中文文档（Starlight）
  styles/
    celestial-tokens.ts  # 设计令牌 / i18n 文案 / 项目数据（TypeScript，样式唯一数据源）
    celestial.css        # 主页专属样式（仅主页加载，不影响文档页主题）
```

## 主页效果与参考实现

主页的视觉/交互动效参考 [React Bits](https://reactbits.dev/)（作者 David Haz，仓库
[DavidHDev/react-bits](https://github.com/DavidHDev/react-bits)）与 [Uiverse](https://uiverse.io/) 实现。
参考源码：

| 主页效果 | 参考实现 |
| --- | --- |
| 粒子文字 "Celest Plume" | [Text Animations / Particle Text](https://reactbits.dev/text-animations/particle-text) — [`ParticleText.jsx`](https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/ParticleText/ParticleText.jsx)（React Bits） |
| 页面加载动画 | [Loader: bright-lizard-8](https://uiverse.io/dexter-st/bright-lizard-8) — dexter-st（Uiverse，纯 CSS） |
| 首页按钮 | [Components / Specular Button](https://reactbits.dev/components/specular-button) — 视觉参考；本项目为纯 CSS 渐变 + hover 扫光（无 WebGL / Canvas） |
| 卡片 hover | 单层纯 CSS hover（上浮 + 边框提亮 + 金色辉光），无鼠标追踪层 |

> 说明：主页**不使用任何 WebGL / Canvas 特效渲染按钮**（无 `ogl` 依赖，无按钮特效画布）。
> 加载动画为 Uiverse 纯 CSS；粒子文字为 Canvas 2D；按钮为纯 CSS 渐变 + hover 扫光；
> 项目卡片与三柱卡片均为单层 hover（效果只在卡片自身一层，无额外层级）。

> 布局：Projects 区 8 列 × 3 行 —— 行 1「时序同笺（左）/ 及时简历（右）」、
> 行 2「BookmarkHarbor（左，与时序同笺同列）/ Gastigado（右）」、
> 行 3「天空之镜（左）/ Squoosh（右）」，底部两卡等高、各宽 4 列；
> 左列两卡总高 = 右列两卡总高（共用两行轨道）。

### 参考代码（核心）

**Particle Text**（`src/components/HomePage.astro` 中的 canvas 逻辑为忠实移植；参数常量见
`src/styles/celestial-tokens.ts` 的 `PARTICLE_TEXT`）：

```ts
// 参考: react-bits ParticleText.jsx — 文本采样为粒子 + 汇聚动画 + 指针排斥 + 空闲漂移
// 关键逻辑: 离屏 canvas 绘制文本 → getImageData 按 density 步长采样 → 粒子从
// scatter 半径随机位置 easeOutCubic 汇聚到字形 → pointerRepel 排斥 → idleDrift 漂移
const step = Math.max(2, Math.floor(PARTICLE_TEXT.density));
for (let y = 0; y < offscreen.height; y += step) {
  for (let x = 0; x < offscreen.width; x += step) {
    const alpha = imageData.data[(y * offscreen.width + x) * 4 + 3];
    if (alpha > 40) targets.push({ x: width / 2 - offscreen.width / 2 + x, y: height / 2 - offscreen.height / 2 + y, alpha: alpha / 255 });
  }
}
```

**加载动画**（页面加载遮罩，`src/layouts/Home.astro`）：Uiverse.io by dexter-st 的
[`bright-lizard-8`](https://uiverse.io/dexter-st/bright-lizard-8)（MIT 许可）—— 纯 CSS
旋转光球 + 字母呼吸，无任何 WebGL / JS 动画。样式原样收录于 `celestial.css`（类名未改，
便于对照原文）；字母文案按语言本地化（EN "Loading" / ZH "加载中"），
显示时长参数见 `celestial-tokens.ts` 的 `LOADER`：

```html
<!-- From Uiverse.io by dexter-st -->
<div class="loader-wrapper">
  <span class="loader-letter">G</span>
  <span class="loader-letter">e</span>
  <span class="loader-letter">n</span>
  <span class="loader-letter">e</span>
  <span class="loader-letter">r</span>
  <span class="loader-letter">a</span>
  <span class="loader-letter">t</span>
  <span class="loader-letter">i</span>
  <span class="loader-letter">n</span>
  <span class="loader-letter">g</span>
  <div class="loader"></div>
</div>
```

```css
/* From Uiverse.io by dexter-st */
.loader {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  animation: loader-rotate 2s linear infinite;
  z-index: 0;
}
@keyframes loader-rotate {
  0%   { transform: rotate(90deg);  box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset; }
  50%  { transform: rotate(270deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 10px 0 #d60a47 inset, 0 40px 60px 0 #311e80 inset; }
  100% { transform: rotate(450deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset; }
}
```

**卡片 hover**（`.cp-project-card`，单层纯 CSS）：效果只在卡片自身一层，无额外层级；
hover 仅上浮 + 边框提亮 + 金色辉光：

```css
.cp-project-card:hover {
  transform: translateY(-6px);
  border-color: var(--cp-border-hover);
  background: var(--cp-surface-hover);
  box-shadow:
    var(--cp-shadow-card),
    inset 0 0 0 1px color-mix(in srgb, var(--cp-gold-soft) 30%, transparent),
    inset 0 0 24px -8px color-mix(in srgb, var(--cp-gold-soft) 22%, transparent);
}
```

**按钮镜面扫光**（`.cp-btn::before`，Specular Button 参考的 CSS 近似，无 WebGL）：

```css
.cp-btn::before {
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%);
  transform: rotate(12deg);
  transition: transform .9s cubic-bezier(.2,.8,.2,1);
  mix-blend-mode: overlay;
}
.cp-btn:hover::before { transform: translateX(280%) rotate(12deg); }
```

## 项目数据

Projects 区块数据来自 [CelPlume/HeavenlySpeculum](https://github.com/CelPlume/HeavenlySpeculum)：

- [`static/hero_projects.yml`](https://github.com/CelPlume/HeavenlySpeculum/blob/main/static/hero_projects.yml) — hero 项目及顺序
- [`static/projects.yml`](https://github.com/CelPlume/HeavenlySpeculum/blob/main/static/projects.yml) — 项目详情（图标/标签/按钮）

数据以 TypeScript 常量维护在 `src/styles/celestial-tokens.ts`（`PROJECTS`）。

## 图标

- 图标统一使用 [Iconify](https://iconify.design/)，数据本地化（`@iconify-json/lucide`，构建期内联 SVG）
- **禁止使用 emoji 作为图标**
- 用法：`<Icon name="lucide:calendar-days" />`，新增图标需在 `astro.config.mjs` 的 `icon({ include })` 中登记

## 品牌与 i18n

- 英文：hero 用全名 `Celest Plume`，其余位置用缩写 `CelPlume`
- 中文：一般位置写 `天空之翼`，hero 主标题区保留 `Celest Plume`
- 中文页面不出现英文文案、英文页面不出现中文文案（品牌名、技术术语除外）
- 主页深浅色独立于文档页（Starlight 原主题）
