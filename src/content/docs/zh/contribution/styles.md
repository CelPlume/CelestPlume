---
title: 样式规范
description: Docs Kit 的设计令牌、色板、字体与布局度量。
---

Docs Kit 的样式位于 `src/styles/celestial-docs.css`，由
`src/lib/ui/tokens.ts` 的设计令牌驱动。全部命名空间隔离：
类名 `cpd-` 前缀、变量 `--cpd-*` 前缀。

色板是 **Plumest 默认主题**：中性 zinc 基底 + 近黑主色。主页的天琴色系不受影响。

## 令牌

令牌是唯一事实来源。`tokens.ts` 中的色板为每个变量声明**浅色**与**深色**
两套值；CSS 在 `:root`（浅色）与 `:root[data-cpd-theme='dark']`（深色）下注入。

### 色板

| 变量 | 浅色 | 深色 |
| --- | --- | --- |
| `--cpd-background` | `hsl(0 0% 96%)` | `hsl(0 0% 7.04%)` |
| `--cpd-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 92%)` |
| `--cpd-muted` | `hsl(0 0% 96.1%)` | `hsl(0 0% 12.9%)` |
| `--cpd-muted-foreground` | `hsl(0 0% 45.1%)` | `hsl(0 0% 70% / 0.8)` |
| `--cpd-popover` | `hsl(0 0% 98%)` | `hsl(0 0% 11.6%)` |
| `--cpd-popover-foreground` | `hsl(0 0% 15.1%)` | `hsl(0 0% 86.9%)` |
| `--cpd-card` | `hsl(0 0% 94.7%)` | `hsl(0 0% 9.8%)` |
| `--cpd-card-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 98%)` |
| `--cpd-border` | `hsl(0 0% 80% / 0.5)` | `hsl(0 0% 40% / 0.2)` |
| `--cpd-primary` | `hsl(0 0% 9%)` | `hsl(0 0% 98%)` |
| `--cpd-primary-foreground` | `hsl(0 0% 98%)` | `hsl(0 0% 9%)` |
| `--cpd-secondary` | `hsl(0 0% 93.1%)` | `hsl(0 0% 12.9%)` |
| `--cpd-secondary-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 92%)` |
| `--cpd-accent` | `hsl(0 0% 82% / 0.5)` | `hsl(0 0% 40.9% / 0.3)` |
| `--cpd-accent-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 90%)` |
| `--cpd-ring` | `hsl(0 0% 63.9%)` | `hsl(0 0% 54.9%)` |
| `--cpd-overlay` | `hsl(0 0% 0% / 0.2)` | `hsl(0 0% 0% / 0.2)` |
| `--cpd-sidebar` | `hsl(0 0% 96%)` | `hsl(0 0% 7.04%)` |
| `--cpd-sidebar-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 92%)` |
| `--cpd-sidebar-border` | `hsl(0 0% 80% / 0.5)` | `hsl(0 0% 40% / 0.2)` |
| `--cpd-sidebar-accent` | `hsl(0 0% 82% / 0.5)` | `hsl(0 0% 40.9% / 0.3)` |
| `--cpd-sidebar-accent-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 90%)` |

`--cpd-primary` 为 Plumest 的中性近黑主色（浅色 `#171717` / 深色
`#fafafa`）：驱动激活链接、侧边栏激活项、ClerkTOC 轨道与强调。主页保留
自己的天琴色系，互不干扰。

### 语义色

深浅模式共享，供 Callout、Badge 与 TOC 阶数圆点使用：

| 变量 | 值 |
| --- | --- |
| `--cpd-info` | `oklch(62.3% 0.214 259.815)` |
| `--cpd-warning` | `oklch(76.9% 0.188 70.08)` |
| `--cpd-error` | `oklch(63.7% 0.237 25.331)` |
| `--cpd-success` | `oklch(72.3% 0.219 149.579)` |
| `--cpd-idea` | `oklch(70.5% 0.209 60.849)` |

### 布局变量

| 变量 | 值 | 含义 |
| --- | --- | --- |
| `--cpd-sidebar-width` | `256px` | 桌面侧边栏宽度 |
| `--cpd-toc-width-desktop` | `256px` | ≥1280px 时的 TOC 宽度 |
| `--cpd-layout-width` | `97rem` | 整体布局最大宽度（演示网格） |
| `--cpd-page-max-width` | `800px` | 文章列最大宽度 |
| `--cpd-radius` | `8px` | 基础圆角 |
| `--cpd-spacing` | `0.25rem` | 间距单位（缩进为 `calc(N * var(--cpd-spacing))`） |
| `--cpd-header-height` | `0 / 56px` | 网格内顶栏（仅移动端） |

## 主题切换

Kit 支持三种模式：

1. **显式：** `html[data-cpd-theme='dark']` → 深色；缺省 → 浅色。
2. **跟随系统：** 无显式属性时，`prefers-color-scheme: dark` 媒体查询
   自动切到深色。
3. **切换按钮：** `data-cpd-theme-toggle` 调用 `tokens.ts` 的
   `applyTheme()`，持久化到 `localStorage['celplume-theme']`
   （与主页共用键）。文档站上，Starlight 的 `data-theme` 属性与
   expressive-code 代码块主题跟随同一值。

## 字体

| 字体族 | 变量 | 用途 |
| --- | --- | --- |
| Manrope + LxgwNeoXiHei | `--cpd-font-sans` | 正文、界面 |
| Plus Jakarta Sans + LxgwNeoXiHei | `--cpd-font-display` | 标题、导航、面包屑、kbd |
| Maple Mono + Fira Code | `--cpd-font-mono` | 代码、TOC 阶数数字 |
| Libertine + LxgwNeoZhiSong | `--cpd-font-serif` | 品牌衬线（页头、侧栏） |

正文 `1rem / 1.75` 行高；文章标题从 `2rem`（h1）到 `1.05rem`（h4），
字重 600，大标题带轻微负字距。行内代码为带边框的 `--cpd-secondary`
小片；代码块（文档页为 astro-expressive-code）渲染为单层 `--cpd-card`：
`13px` 等宽、`1px` 边框、ghost 复制按钮——与 Plumest 一致。

## 布局

### 文档页（Starlight 外壳）

可见外壳通过 `src/components/starlight/` 下的 Starlight 组件覆盖替换：

- 固定 56px 顶栏（品牌 + 搜索 + 语言切换 + 主题切换）；
- 固定 256px 侧边栏列，独立滚动（Plumest 行为）；
- 文章列上限 800px（无右侧本页目录栏）。

### 演示页（`/demo/`、`/zh/demo/`）

演示页仍使用五列 CSS 网格（移植自 Plumest）：

```text
"sidebar sidebar header toc toc"
"sidebar sidebar toc-popover toc toc"
"sidebar sidebar main toc toc"  1fr
```

- 列宽：`1fr | sidebar | content | toc | 1fr`，其中 content 为
  `minmax(0, calc(layout − sidebar − toc))`，文章列自身上限 `800px`。
- **≥1280px：** 侧边栏 + TOC 同时可见。
- **768–1279px：** TOC 隐藏，侧边栏保留。
- **<768px：** 侧边栏变为带遮罩的滑入抽屉；顶栏汉堡按钮打开它。

折叠侧边栏时在 `.cpd-layout` 上设置 `data-cpd-collapsed`，网格列宽收为
`0`、侧边栏滑出；浮动展开按钮随之出现。

## 动效

微交互以 `150ms ease` 动画（链接、卡片、复制按钮、chevron）；较大表面以
`200ms ease`（抽屉、折叠面板、文件树）。动效只改动 `opacity`、
`transform` 与 `background-color`——绝不触碰布局属性。

## 新增令牌

1. 在 `src/lib/ui/tokens.ts` 的 `PALETTE`（或新增常量）中加入条目，
   同时给出 `light` 与 `dark` 值。
2. 在 `celestial-docs.css` 的 `:root` 与 `:root[data-cpd-theme='dark']`
   下输出变量（需要跟随系统时同步加入 `prefers-color-scheme` 块）。
3. 在上方表格中补充文档。
