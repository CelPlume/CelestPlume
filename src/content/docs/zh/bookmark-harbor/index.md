---
title: 书签浏览器
description: 本地优先、文件管理器风格的书签浏览器——现代界面、多语言支持。
sidebar:
  order: 1
---

[![GitHub](https://img.shields.io/badge/GitHub-CelPlume--BookmarkHarbor-blue?logo=github)](https://github.com/CelPlume/BookmarkHarbor)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![HeroUI](https://img.shields.io/badge/HeroUI-3-0072F5.svg)](https://heroui.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4.svg)](https://tailwindcss.com/)
[![Bun](https://img.shields.io/badge/Bun-1.3-f9f1e0.svg)](https://bun.sh/)

## 在线访问

前往 [GitHub 仓库](https://github.com/CelPlume/BookmarkHarbor) 查看源码。

## 项目概述

书签浏览器以文件管理器的方式管理书签：使用文件夹、选择、拖拽排序与标准编辑快捷键。所有数据都保存在浏览器 LocalStorage 中，收藏私密且可离线使用。这是无后端、无账号体系的单页 React 前端。

## 功能概览

- 文件管理器式交互：单选、多选、Shift 范围选择、双击打开、内联重命名。
- 三种视图（卡片 / 列表 / 平铺），可选按文件夹记忆视图。
- 拖拽与循环检测，支持同级排序与跨文件夹移动。
- 属性面板编辑标题、URL、颜色、封面与图标，支持元信息抓取。
- 收藏夹 / 稍后阅读 / 回收站，支持软删除与恢复。
- 撤销 / 重做历史、Netscape HTML 导入导出、中英国际化。

## 架构

单页 React 应用，持久化到 LocalStorage。无框架领域逻辑位于 `src/core/`（存储、选择、排序、循环检测、导入导出、元信息、校验）；`src/components/` 中的 UI 使用 HeroUI、Tailwind 与 Iconify。完整设计见[架构文档](/zh/bookmark-harbor/dev/architecture/)。

## 项目结构

```
BookmarkHarbor/
├── src/
│   ├── App.tsx               # 应用外壳、状态与编排
│   ├── components/           # React UI 组件
│   ├── core/                 # 无框架领域逻辑与 hooks
│   ├── i18n/                 # i18next 资源（zh、en）
│   ├── styles/               # Tailwind 4、HeroUI 样式、主题变量
│   └── test/                 # Vitest 单元测试
├── docs/                     # 项目文档
├── vite.config.ts            # Vite 8（Rolldown）配置
├── wrangler.jsonc            # Cloudflare 静态资源配置
└── package.json
```

## 文档

| 指南 | 内容 |
| :--- | :--- |
| [系统架构](/zh/bookmark-harbor/dev/architecture/) | 数据模型、领域模块、状态、设计决策、主题。 |
| [前端指南](/zh/bookmark-harbor/ui/ui/) | 视图、布局、交互、键盘快捷键、设置、无障碍。 |
| [开发指南](/zh/bookmark-harbor/dev/development/) | 本地搭建、规范、测试、提交约定。 |
| [部署指南](/zh/bookmark-harbor/dev/deployment/) | 生产构建、Cloudflare Pages、静态托管。 |
