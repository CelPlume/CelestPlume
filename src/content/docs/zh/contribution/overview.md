---
title: 贡献概述
description: 贡献分类的定位、Docs Kit 的组织方式与新增组件的规范。
---

**贡献**分类是项目自身样式与组件规范的家园 —— **Plumest** 文档样式背后的
纯 TypeScript 手搓无框架 UI Kit。

本分类此前并不存在，随 Kit 一起引入。扩展站点组件前请先读这里的约定，
再按文末清单执行。

## Kit 是什么

`src/lib/ui/` 是用**纯 TypeScript** 实现的 Plumest 风格文档 UI ——
左侧边栏、ClerkTOC、文档样式与常用内容组件：

- **不依赖 React。** 构建器都是返回 HTML 字符串的普通函数。
- **零运行时依赖。** 交互只有约 350 行原生 TypeScript（`src/lib/ui/runtime.ts`）。
- **服务端安全。** 所有内容构建期输出为静态 HTML，可配合 Astro
  的 `set:html`、纯 HTML 或任意 SSR 环境使用。

参考实现位于本地克隆 `reference/`（已 gitignore）；
拿不准预期行为时先读它，但 Kit 本身必须保持无框架。

## 分类内容

| 页面 | 内容 |
| --- | --- |
| [设计系统](/zh/contribution/design-system/) | 设计原则、色彩、字体、间距、图标、动效一览 |
| [样式规范](/zh/contribution/styles/) | 设计令牌、色板、字体、布局网格 |
| [组件文档](/zh/contribution/components/) | 组件参考——每个构建器独立一页、带实时预览 |

文档页由 Starlight 渲染，Kit 可见外壳经组件覆盖接入；Kit 的完整在线演示
（侧边栏 + ClerkTOC + 组件）见 [/zh/demo/](/zh/demo/)。

## 目录结构

```text
src/
├── lib/ui/                  # Kit（纯 TS）
│   ├── html.ts              #   escape / attrs / el 原语
│   ├── types.ts             #   共享类型（NavNode、TocItem 等）
│   ├── icons.ts             #   内联 lucide 风格 SVG 图标集
│   ├── tokens.ts            #   设计令牌（TS 常量 → CSS 变量）
│   ├── sidebar.ts           #   左侧边栏构建器
│   ├── toc.ts               #   ClerkTOC 构建器 + 标题收集
│   ├── components.ts        #   callout / cards / steps / tabs 等构建器
│   ├── github-card.ts       #   GitHubCard 构建器 + 构建期抓取
│   ├── runtime.ts           #   无框架客户端运行时
│   └── index.ts             #   公共 API 出口
├── styles/
│   ├── celestial-docs.css   # Kit 样式（cpd- 前缀、令牌驱动）
│   └── starlight-plumest.css # Starlight 外壳中和 + 文档页 chrome
├── components/
│   ├── starlight/           # Starlight 覆盖组件（Header、Sidebar、PageTitle 等）
│   │   └── …                #   13 个覆盖，把 Kit 接入外壳
│   ├── kit/Preview.astro    # MDX 组件文档的实时预览框
│   └── DocsKitDemo.astro    # 演示页主体
├── scripts/
│   └── celestial-docs-runtime.ts # 注入每个文档页
├── layouts/
│   └── DocsKit.astro        # 演示页布局（字体 + runtime）
└── pages/
    ├── demo.astro           # 英文在线演示
    └── zh/demo.astro        # 中文在线演示
```

## 约定（必须遵守）

1. **一切加前缀。** 类名以 `cpd-` 开头、CSS 变量以 `--cpd-` 开头、
   交互钩子用 `data-cpd-*` 属性。不得样式化前缀之外的内容 ——
   Starlight 与主页必须保持不受影响。
2. **令牌驱动样式。** 颜色与布局值先加进 `src/lib/ui/tokens.ts`，
   再在 `celestial-docs.css` 里通过 CSS 变量消费；禁止在 CSS 中硬编码色值。
3. **构建器必须转义。** 所有文本内容走 `html.ts` 的转义
   （`el`/`text`）；不要把不可信字符串直接拼成原始 HTML。
4. **运行时用事件委托。** 新交互通过 `data-cpd-*` 钩子在
   `initCelestialUI` 内挂接；必须幂等、可重复初始化。
5. **双语文档。** 每个新文档页都要有英文（`src/content/docs/`）与
   中文（`src/content/docs/zh/`）版本且 slug 对应，并同步
   `astro.config.mjs` 的侧边栏。

## 新增组件的步骤

1. 需要新结构时先在 `src/lib/ui/types.ts` 加类型。
2. 在 `src/lib/ui/components.ts`（或新模块）加构建器，带 JSDoc、
   返回 HTML 字符串。
3. 在 `src/styles/celestial-docs.css` 的新 `cpd-` 小节加样式 ——
   深浅两套都必须由令牌覆盖。
4. 需要行为时加 `data-cpd-*` 钩子，并在 `src/lib/ui/runtime.ts` 接线。
5. 在 `src/lib/ui/index.ts` 导出，然后在
   [组件文档](/zh/contribution/components/) 下新增一页——每个构建器独立一页，
   带各状态的实时预览（参考 `src/content/docs/zh/contribution/components/`）。
6. 验证：`bun run typecheck` → `bun run lint` → `bun run build`。
