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
bun run dev        # 本地开发服务器
bun run build      # 构建生产版本到 dist/
bun run preview    # 预览生产构建
```

## 目录结构

- `astro.config.mjs` —— Starlight 与 i18n（locales）配置
- `src/content/docs/` —— 英文文档（`root`）
- `src/content/docs/zh/` —— 简体中文文档
- `src/content.config.ts` —— 内容集合（docs schema）定义
