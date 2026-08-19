---
title: Picumet
description: 多云对象存储管理平台 — 统一文件管理、细粒度权限、分享链接与 PicGo/PicList 接入，运行在 Cloudflare 边缘网络。
sidebar:
  order: 1
---

[![GitHub](https://img.shields.io/badge/GitHub-CelPlume--Picumet-blue?logo=github)](https://github.com/CelPlume/Picumet)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002.svg)](https://hono.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)

## 在线访问

前往 [GitHub 仓库](https://github.com/CelPlume/Picumet) 查看源码和部署说明。

## 项目概述

Picumet 是一个多云对象存储管理平台。提供统一的文件管理界面和细粒度权限控制,支持分享链接与 PicGo/PicList 接入,整体运行在 Cloudflare 边缘网络。

## 功能概览

- **认证**：注册、登录(HttpOnly Cookie + JWT)、邮箱验证、密码找回。
- **权限**：管理员/用户/访客三级角色、路径级 ACL、文件与路径密码。
- **文件**：卡片/列表视图、单文件与分片上传、断点续传、硬删除、重命名、移动(Saga)、批量操作、搜索、排序。
- **预览**：图片缩放/旋转、视频/音频播放、代码高亮(highlight.js,预先转义)。文件卡片带视频缩略图和文件夹内部预览。
- **复制链接**：多文件弹窗,支持直链/HTML/Markdown/BBCode,公开直链或签名直链。
- **分享**：密码、过期时间、下载次数限制、公开页、二维码。
- **外观**：浅色/深色/跟随系统、强调色(动态前景色)、模糊效果、图片/URL 背景、文件夹显示开关、自定义文件 emoji。
- **API 密钥**：`pk_x.sk_y` 不透明令牌(只存哈希)、IP 白名单、WebDAV Basic 认证、PicGo 上传接口 `/api/upload`。
- **管理后台**：仪表板、用户、配额、存储源、挂载点、权限规则、分享、文件、日志、系统设置。
- **自由模式**：用户自带对象存储凭据的临时会话,凭据用 AES-256-GCM 加密写入 KV,短 TTL。
- **安全**：CSP、CSRF Token、速率限制(fail-closed)、路径遍历防护、危险文件拦截、SSRF 校验、SQL 参数化、下载令牌原子消费。

## 架构原则

按业务领域组织代码,不按技术层次。

- 后端业务代码放在 `workers/src/services/<domain>/`,每个服务自包含 `handlers.ts`、`schemas.ts`、`types.ts`、领域逻辑和 `README.md`。`index.ts` 只负责路由与中间件装配。
- 所有服务依赖权限服务做鉴权,依赖存储服务访问对象,避免循环依赖。
- 中间件(`auth`、`csrf`、`rate-limit`)、数据层(`db/repos/`)、工具(`utils/`)和公共契约(`shared/`)属于薄基础设施层,不承载业务。
- 前端遵循同样规则。`pages/` 每个路由一个页面,页面内的子功能收进 `components/files/` 和 `components/layout/`,`components/ui/` 只放可复用的 UI 原语。

完整设计见[架构文档](/zh/picumet/dev/architecture/),范围与进度见[进度文档](/zh/picumet/about/progress/)。

## 项目结构

```
picumet/
├── assets/logo.svg          # 品牌标识
├── frontend/                # React 应用(Vite + TypeScript + Tailwind)
│   └── src/
│       ├── pages/           # 每个路由一个页面
│       ├── components/      # files/ · layout/ · ui/
│       ├── lib/             # api · utils · i18n
│       └── stores/          # theme · auth · site
├── workers/                 # Cloudflare Workers API(Hono + D1/KV/R2)
│   └── src/
│       ├── services/        # auth · files · uploads · shares · storage · webdav · ...
│       ├── middleware/      # auth · csrf · rate-limit · global
│       ├── db/repos/        # D1 数据访问层
│       ├── utils/           # path · crypto · ssrf · smtp
│       └── shared/          # schemas · types · errors · response
├── shared/                  # 前后端共享类型
└── docs/                    # 文档
```

## 文档

| 指南 | 内容 |
| :--- | :--- |
| [系统架构](/zh/picumet/dev/architecture/) | 服务设计、数据模型、安全设计。 |
| [API 参考](/zh/picumet/api/api/) | 认证、全部端点、错误码。 |
| [前端指南](/zh/picumet/ui/ui/) | 路由、布局、响应式、无障碍。 |
| [开发指南](/zh/picumet/dev/development/) | 本地环境、测试、代码规范。 |
| [部署指南](/zh/picumet/dev/deployment/) | Cloudflare 部署、CI、密钥管理。 |
| [实施进度](/zh/picumet/about/progress/) | 范围、状态、审计闭环。 |
