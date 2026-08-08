# AGENTS.md

面向 AI 编码助手（及协作者）的项目说明。

## 包管理规则（重要）

本项目**仅允许使用 [bun](https://bun.sh/) 作为包管理器与脚本运行器**。

- ✅ 允许：`bun install`、`bun run dev`、`bun run build`、`bun add <pkg>`、`bunx <cmd>`
- ❌ **禁止**：`npm`、`pnpm`、`yarn`（包括 `npm install`、`pnpm add`、`yarn dev` 等）

如需安装依赖或运行脚本，请一律使用 bun。

## 技术栈

- [Astro](https://astro.build/) + [@astrojs/starlight](https://starlight.astro.build/)
- 双语文档站点：英文（默认 `root`）与简体中文（`zh`）

## 常用命令

```bash
bun install        # 安装依赖
bun run dev        # 本地开发服务器（默认 http://localhost:4321）
bun run build      # 构建生产版本到 dist/
bun run preview    # 预览生产构建
bun run typecheck  # TypeScript 类型检查
bun run lint       # ESLint 代码检查
```

## 验证规则（重要）

每次修改代码（`.astro`、`.ts`、`.tsx`、`.js` 等源文件）后，**必须** 依次执行以下验证：

1. `bun run typecheck` — TypeScript 类型检查必须通过
2. `bun run lint` — ESLint 检查必须通过
3. `bun run build` — 生产构建必须通过

若仅修改文档内容（`.md` / `.mdx` 文档文件）或静态资源，只需执行 `bun run build` 验证构建通过即可。

**禁止**在 typecheck / lint / build 报错时交付代码。

## 命名与 i18n 规范

- 英文页面品牌名：`Celest Plume`（完整名，hero/关于等详细处使用）、`CelPlume`（缩写，导航/按钮/卡片等一般位置使用）
- 中文页面品牌名：`天空之翼`（一般位置）、`Celest Plume` 仅在 hero 主标题区保留英文名
- 中文页面不应出现英文文案（品牌名、技术术语除外）；英文页面不应出现中文文案
- 主页 i18n：`src/pages/index.astro`（英文 `/`）与 `src/pages/zh/index.astro`（中文 `/zh/`）为两个独立页面，
  共用 `src/components/HomePage.astro` 与 `src/layouts/Home.astro`，文案全部来自 `src/styles/celestial-tokens.ts` 的 `UI_EN` / `UI_ZH`
- 主页左上角 Logo：`/images/CelPlume.webp`（带文字的完整 Logo）
- Favicon：`/images/CelPlume_favicon_256.jpg`
- 深浅色模式：主页和文档页均需完整支持深/浅色切换，不得有"浅色模式下仍是深色背景"的残留

## 图标规范（重要）

- **图标一律使用 [Iconify](https://iconify.design/) 图标集，禁止使用 emoji 作为图标**
- 图标数据必须保存在本地：通过 `@iconify-json/*` 包安装图标集（如 `@iconify-json/lucide`），
  由 `astro-icon` 在构建时内联为 SVG；禁止运行时从 Iconify API 在线拉取
- 用法：`import { Icon } from 'astro-icon/components'`，`<Icon name="lucide:calendar-days" />`
- 新增图标时：`bun add @iconify-json/<set>`，并在 `astro.config.mjs` 的 `icon({ include: ... })` 中登记图标名
- 项目数据中的图标字段（`celestial-tokens.ts` 的 `Project.icon`）存 Iconify 名（如 `lucide:brain`），不得存 emoji

## 样式规范

- 主页样式参数（颜色、粒子/动画/布局常量）统一写在 `src/styles/celestial-tokens.ts`（TypeScript），
  运行时不在 JS 中手写样式字符串；动态样式通过 CSS 变量由 TS 常量驱动
- 主页专属样式 `src/styles/celestial.css` 仅由 `src/layouts/Home.astro` 引入，**不得**加入 Starlight 的 `customCss`（否则会污染文档页主题）

## 目录结构

- `astro.config.mjs` —— Starlight 与 i18n（locales）配置
- `src/content/docs/` —— 英文文档（`root`）
- `src/content/docs/zh/` —— 简体中文文档
- `src/content.config.ts` —— 内容集合（docs schema）定义
