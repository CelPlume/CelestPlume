---
title: BookmarkHarbor
description: A local-first, file-manager-style bookmark browser with a modern UI and multilingual support.
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

## Online access

Visit the [GitHub repository](https://github.com/CelPlume/BookmarkHarbor) for the source code.

## Project overview

BookmarkHarbor manages bookmarks the way a file manager manages files: folders, selection, drag-and-drop reordering, and standard editing shortcuts. All data stays in the browser's LocalStorage, so the collection is private and works offline. It is a single-page React front end with no backend and no account system.

## Features

- File-manager interactions: single and multi select, Shift range select, double-click open, inline rename.
- Three views (card, list, tile) with optional per-folder view memory.
- Drag and drop with cycle detection for reorder and cross-folder moves.
- Inspector for title, URL, color, cover, and icon, with metadata fetch.
- Favorites, Read Later, and Trash with soft delete and restore.
- Undo/redo history, Netscape HTML import/export, and zh/en internationalization.

## Architecture

A single-page React application persisted to LocalStorage. Framework-free domain logic lives in `src/core/` (storage, selection, ordering, cycle detection, import/export, metadata, validation); the UI in `src/components/` uses HeroUI, Tailwind, and Iconify. See the [architecture guide](/bookmark-harbor/dev/architecture/) for the full design.

## Project structure

```
BookmarkHarbor/
├── src/
│   ├── App.tsx               # App shell, state, orchestration
│   ├── components/           # React UI components
│   ├── core/                 # Framework-free domain logic and hooks
│   ├── i18n/                 # i18next resources (zh, en)
│   ├── styles/               # Tailwind 4, HeroUI styles, theme variables
│   └── test/                 # Vitest unit tests
├── docs/                     # Project documentation
├── vite.config.ts            # Vite 8 (Rolldown) configuration
├── wrangler.jsonc            # Cloudflare static-assets config
└── package.json
```

## Documentation

| Guide | Contents |
| :--- | :--- |
| [Architecture](/bookmark-harbor/dev/architecture/) | Data model, domain modules, state, design decisions, theming. |
| [Frontend guide](/bookmark-harbor/ui/ui/) | Views, layout, interactions, keyboard shortcuts, settings, accessibility. |
| [Development guide](/bookmark-harbor/dev/development/) | Local setup, conventions, testing, commit rules. |
| [Deployment guide](/bookmark-harbor/dev/deployment/) | Production build, Cloudflare Pages, static hosting. |
