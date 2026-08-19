---
title: Picumet
description: Multi-cloud object storage with fine-grained access control — unified file manager, share links, PicGo/PicList integration, all on the Cloudflare edge network.
sidebar:
  order: 1
---

[![GitHub](https://img.shields.io/badge/GitHub-CelPlume--Picumet-blue?logo=github)](https://github.com/CelPlume/Picumet)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002.svg)](https://hono.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)

## Online Access

Visit the [GitHub repository](https://github.com/CelPlume/Picumet) for source code and deployment instructions.

## Project Overview

Picumet is a multi-cloud object storage management platform. It gives you a unified file manager and fine-grained access control over your cloud files, with share links and PicGo/PicList integration, all running on the Cloudflare edge network.

## Features

- **Auth**: Register, login (HttpOnly cookie + JWT), email verification, password reset.
- **Permissions**: Admin/user/guest roles, path-level ACLs, file and path passwords.
- **Files**: Card/list views, upload (single and multipart), resume, hard delete, rename, move (Saga), batch operations, search, sort.
- **Previews**: Image zoom/rotate, video/audio players, code highlighting (highlight.js, pre-escaped). File cards render video thumbnails and folder previews.
- **Copy links**: Multi-file dialog with direct/HTML/Markdown/BBCode formats, direct public path or signed URLs.
- **Shares**: Password, expiry, download limits, public page, QR code.
- **Appearance**: Light/dark/system themes, accent color with dynamic foreground, blur, background image/URL, folder preview switch, custom file emoji.
- **API keys**: `pk_x.sk_y` opaque tokens (hash only), IP allowlist, WebDAV Basic auth, PicGo upload at `/api/upload`.
- **Admin**: Dashboard, users, quotas, storage sources, mounts, rules, shares, files, logs, settings.
- **Free mode**: Temporary sessions with user-provided storage credentials (AES-256-GCM in KV, short TTL).
- **Security**: CSP, CSRF tokens, rate limiting (fail closed), path traversal protection, dangerous file blocking, SSRF checks, SQL parameterization, atomic download tokens.

## Architecture

Organize code by business domain, not by technical layer.

- Backend business code lives in `workers/src/services/<domain>/`. Each service is self-contained with `handlers.ts`, `schemas.ts`, `types.ts`, domain logic, and a `README.md`. The `index.ts` file only assembles routes and middleware.
- Every service depends on the Permissions service for authorization and the Storage service for object access. Avoid circular dependencies.
- Middleware (`auth`, `csrf`, `rate-limit`), the data layer (`db/repos/`), utilities (`utils/`), and shared contracts (`shared/`) are thin infrastructure layers. They carry no business logic.
- The frontend follows the same rule. `pages/` holds one page per route, and page sub-features live in `components/files/` and `components/layout/`. The `components/ui/` folder holds reusable UI primitives only.

See the [architecture guide](/picumet/dev/architecture/) for the full design, and the [implementation progress](/picumet/about/progress/) for scope and status.

## Project Structure

```
picumet/
├── assets/logo.svg          # Brand mark
├── frontend/                # React app (Vite + TypeScript + Tailwind)
│   └── src/
│       ├── pages/           # One page per route
│       ├── components/      # files/ · layout/ · ui/
│       ├── lib/             # api · utils · i18n
│       └── stores/          # theme · auth · site
├── workers/                 # Cloudflare Workers API (Hono + D1/KV/R2)
│   └── src/
│       ├── services/        # auth · files · uploads · shares · storage · webdav · ...
│       ├── middleware/      # auth · csrf · rate-limit · global
│       ├── db/repos/        # D1 data access
│       ├── utils/           # path · crypto · ssrf · smtp
│       └── shared/          # schemas · types · errors · response
├── shared/                  # Shared types between frontend and backend
└── docs/                    # Documentation
```

## Documentation

| Guide | Contents |
| :--- | :--- |
| [Architecture](/picumet/dev/architecture/) | Services, data model, security design. |
| [API reference](/picumet/api/api/) | Auth, endpoints, errors. |
| [Frontend guide](/picumet/ui/ui/) | Routes, layout, responsive design, accessibility. |
| [Development guide](/picumet/dev/development/) | Local setup, testing, coding conventions. |
| [Deployment guide](/picumet/dev/deployment/) | Cloudflare deployment, CI, secrets. |
| [Implementation progress](/picumet/about/progress/) | Scope, status, audit closure. |
