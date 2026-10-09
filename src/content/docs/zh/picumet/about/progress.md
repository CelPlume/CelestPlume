---
title: "实施进度"
description: "范围、状态、审计闭环与路线图。"
sidebar:
  order: 1
---

## 状态图例

| 标记 | 含义 |
| :--- | :--- |
| 已完成 | 已实现、已测试并已验证。 |
| 进行中 | 已实现；验证或打磨尚未完成。 |
| 计划中 | 已纳入范围，尚未实现。 |
| 已否决 | 明确不在范围内。 |

## 路线图

| 阶段 | 范围 | 状态 |
| :--- | :--- | :--- |
| 阶段 1 | 核心平台：认证、文件、配额、角色、存储源、系统设置 | 已完成 |
| 阶段 2 | 上传（分片/断点续传）、预览、分享、管理面板、API 密钥、WebDAV、自由模式 | 已完成 |
| 阶段 3 | AWS S3、外观主题、管理员登录、公告关闭 | 基本完成；Oracle Provider 待实现 |
| 阶段 4 | 路径变量 DSL（`{year}/{month}`）、统计分析 | 计划中 |

## 功能领域

| 领域 | 状态 | 说明 |
| :--- | :--- | :--- |
| 部署：Cloudflare Pages + Workers | 已完成 | 已否决 Vercel 与 EdgeOne。 |
| 存储源 | 已完成 | R2 与 S3 已实现；Oracle 待实现；已否决另外 9 家存储源。 |
| 文件浏览（卡片/列表视图） | 已完成 | `GET /api/files`、排序、搜索、分页。 |
| 上传（单文件） | 已完成 | 基于会话，带配额预留。 |
| 上传（分片/大文件） | 已完成 | 断点续传 + 服务端分片记录。 |
| 彻底删除 | 已完成 | 先删元数据的事务，异步清理对象。 |
| 重命名 | 已完成 | `PUT /api/files/:id`。 |
| 移动（Saga） | 已完成 | 源删除 + 目标写入的权限检查。 |
| 预览：图片/视频/音频/代码 | 已完成 | 图片缩放/旋转；视频 canvas 缩略图；highlight.js 预先转义。 |
| 选择与多选 | 已完成 | 网格 + 列表，列表视图支持范围选择。 |
| 拖拽排序与拖拽移动 | 进行中 | 拖拽移动可用；验证记录待补。 |
| 文件夹视图记忆 | 已完成 | 存于 `localStorage`。 |
| 属性面板 | 已完成 | 桌面端固定侧栏 + 移动端右侧抽屉；可编辑标题/颜色/封面/表情。 |
| 复制链接 | 已完成 | 多文件弹窗；直链/HTML/Markdown/BBCode；公开直链或签名直链。 |
| 分享 | 已完成 | 密码、有效期、下载次数限制、二维码。 |
| 外观 | 已完成 | 浅色/深色/跟随系统，强调色（HSL + YIQ 前景），模糊，背景图片/URL，文件夹预览开关。已移除纯色背景。 |
| 国际化（zh / en） | 已完成 | |
| 响应式布局 | 已完成 | 桌面/平板/手机；浮动操作栏在 350-1080 px 范围内测试。 |
| 用户 | 已完成 | 注册、登录、邮箱验证、访客角色、自由模式。 |
| 权限与配额 | 已完成 | 3 种角色、路径 ACL、文件/路径密码、存储与文件数配额。已否决下载速度与每月流量配额。 |
| 存储配置 | 已完成 | 挂载、上传/CDN 域名、路径前缀、排序、签名。同路径多挂载与路径 DSL 待实现。 |
| 管理后台 | 已完成 | 仪表盘、用户、存储、挂载、规则、分享、文件、日志。统计分析待实现。 |
| 系统设置 | 已完成 | 站点信息、注册/访客开关、Turnstile。 |
| API 密钥 + 兼容协议 | 已完成 | `pk_x.sk_y` 不透明令牌、WebDAV、PicGo/PicList。已否决 S3/OSS 协议网关。 |
| 安全 | 已完成 | CSP、CSRF、限流、路径穿越、SSRF、SQL 参数化、原子下载令牌。热点文件检测与强制签名 URL 为计划项。 |
| 图片编辑器入口（Squoosh） | 已完成 | |
| 视频/音频播放器 | 已完成 | |

## 已否决的决策

| 决策 | 原因 |
| :--- | :--- |
| 回收站 | 为避免对象存储与数据库之间软删除状态不一致而移除。 |
| 下载速度/每月流量配额 | 只需要存储容量与文件数配额。 |
| S3/OSS 协议网关 | 只提供 WebDAV 与自定义上传 API。 |
| 另外 9 家存储源（B2、IDrive、GCS、COS、OSS、OBS、Scaleway、Filebase、Kodo） | 不在范围内。 |
| 客户端加密 | 不在范围内；敏感路径链接改用签名 URL。 |
| Vercel/EdgeOne 托管 | 只用 Cloudflare。 |

## 安全审计闭环

审计发现已全部修复并用回归测试锁死。参见 `workers/tests/security-regressions.test.ts`、`workers/tests/s3-provider.test.ts`、`frontend/src/lib/escape.test.ts` 与 `frontend/src/pages/Register.test.tsx`。

| 风险 | 修复 | 证据 |
| :--- | :--- | :--- |
| 自由模式凭据在 KV 中明文存储（高危） | AES-256-GCM 加密 + 短 TTL + 随机 `sid` cookie + IP 绑定 | 加密/解密/防篡改用例 |
| API 密钥 IP 白名单未强制执行（高危） | `apiKeyAuthMiddleware` 对非白名单 IP 返回 `403` | 入站/出站白名单用例 |
| 分片上传分片恒为空、无续传契约（高危） | 服务端 `parts_completed`、`GET /parts` 续传契约、跳过 pre-HEAD 合并 | 续传流程：缺口 → 拒绝 → 完成 |
| 缺失 `/register`、忘记密码只是占位（高危） | 独立的 `/register` 与 `/reset-password` 页面，调用真实 API | 注册提交/报错用例 |
| 下载令牌非原子消费（中危） | 把 KV 的 get→delete 换成原子的 `DELETE ... RETURNING` | 单次消费与重复 401 用例 |
| 限流 fail-open（中危） | 认证/敏感写端点在 KV 故障时 fail-closed（返回 `503`） | 生产环境 KV 故障用例 |
| S3/Oracle Provider 测试 + 能力矩阵（中危） | 预签名分片 URL 单元测试（本地签名）；Oracle 待实现 | S3 Provider 用例 |
| highlight.js 转义 + 前端回归（中危） | `escapeHtml` 预先转义，作为纵深防御 | 转义用例 |
| CI/CD + 覆盖率门禁（中危） | `.github/workflows/ci.yml`（bun，仅 CI）、前端覆盖率门禁、路由懒加载 | 行覆盖率 100% |

## 当前基线

- 后端：127 个 Vitest 用例全部通过；`tsc --noEmit` 无报错。
- 前端：7 个 Vitest 用例全部通过；构建成功；`tsc --noEmit` 无报错。
- 语言：zh + en。

## 接下来

- Oracle Cloud Provider 实现。
- 同路径多挂载支持。
- 路径变量 DSL（`{year}/{month}`）。
- 管理后台统计分析。
- 热点文件检测与强制签名 URL。
- 持续补充拖拽交互与属性面板编辑的验证记录。

相关指南：[架构](/zh/picumet/dev/architecture/)、[API 参考](/zh/picumet/api/api/)、[前端指南](/zh/picumet/ui/ui/)、[开发指南](/zh/picumet/dev/development/)、[部署指南](/zh/picumet/dev/deployment/)。
