---
title: 开发指南
description: 本地开发、代码规范、质量门槛、性能安全基线、发布与数据库迁移治理的统一入口。
sidebar:
  order: 5
---
本文件是项目开发、验证、性能、安全、发布与数据库迁移治理的统一入口。自动化代理和人工贡献者都必须遵守这里的约束。

## 项目变更入口

### 后端

1. 数据模型放在 `backend/models.py`；结构变更必须同时提供现役 Alembic revision。
2. API 路由放在 `backend/routers/`，业务逻辑放在 `backend/services/`，数据库访问复用 `backend/crud.py`。
3. 新迁移脚本统一放在 `scripts/migrations/`，并同步更新[迁移脚本说明](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README.md)；SQLite 到 PostgreSQL 的生产切换步骤只维护在[迁移 Runbook](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README_PG.md)。

### 前端

1. Vue 组件放在 `frontend/src/components/`，Astro 页面放在 `frontend/src/pages/`。
2. 状态管理复用 Pinia stores，样式遵循现有 Tailwind CSS 与主题约定。
3. 前端依赖必须由 `frontend/bun.lock` 锁定；安装与镜像构建不得使用 npm。

### 文档入口

- [项目说明](/zh/chronosync/)
- [部署指南](/zh/chronosync/dev/deployment/)
- [完整更新日志](/zh/chronosync/about/changelog/)

## Build / Test / Run Scripts（构建/运行指令）

### Environment（必须）

- **Python 依赖管理**：统一使用 **uv**（`uv sync` / `uv run`），不再使用 conda
- **Frontend package manager**：只允许 **Bun**；禁止使用 `npm`（也不要生成/更新 `package-lock.json`）

建议初始化（仅首次）：

```bash
cd backend
uv sync
```

### Backend（FastAPI）

安装依赖：

```bash
cd backend
uv sync
```

启动（开发）：

```bash
cd backend
uv run python main.py
```

后端质量门槛（必须全部通过）：

1) **`-m` 检查（模块方式执行/基础可运行性）**

```bash
cd backend
uv run python -m compileall .
```

2) **冒烟测试（smoke test）**：确保应用可导入、`app` 存在、关键依赖未缺失

```bash
cd backend
uv run python -c "import main; assert hasattr(main, 'app'); print('backend smoke: ok')"
```

3) **单元/回归测试（pytest，必须通过）**：pytest 未声明进 pyproject，需 `--with pytest`；默认跳过需真实 PostgreSQL 的用例（`TEST_POSTGRES_URL`）

```bash
cd backend
timeout 900 env PYTHONPATH=. uv run --with pytest pytest -q
```

4) **PostgreSQL 集成测试（可选，改动迁移/导库逻辑时必跑）**：

```bash
cd backend
TEST_POSTGRES_URL='postgresql+psycopg://chronosync:<密码>@localhost:5432/<测试库>' uv run --with pytest pytest tests/test_postgres_integration.py -q
```

### Frontend（Astro + Vue）

安装依赖（只能用 bun）：

```bash
cd frontend
bun install
```

开发启动：

```bash
cd frontend
bun run dev
```

前端质量门槛（必须全部通过）：

```bash
cd frontend
bun run lint
bun run type-check
bun run build
```

Lint（必须通过）：

- 如果仓库已提供 lint 配置/脚本（例如 `eslint`/`prettier`），必须执行并通过：`bun run lint` / `bunx eslint .` / `bunx prettier -c .`
- 如果当前分支尚未引入 lint 工具：**不要擅自用 npm 安装依赖**；需要 lint 时请用 bun 引入，并同时补充：
  - `frontend/package.json` 中的 `lint` script
  - 本文件中的 lint 执行命令

## Code Style（编码风格）

### Frontend

- **TypeScript 优先**：避免 `any`；新增类型定义放在就近模块（或复用现有类型文件）
- **组件/文件命名**：Vue 组件使用 `PascalCase.vue`；其他文件遵循项目现有习惯
- **最小改动原则**：避免无关重构；只改与任务相关的部分
- **格式化工具**：若项目引入 Prettier/ESLint，请遵循其规则并保持无告警（不要“只为过 lint”而降低可读性）
- **视觉一致性（必须）**：前端组件修改必须遵循项目既有主色系与品牌风格，并同时覆盖浅色/深色场景，避免只在单一主题下可用。

### Backend

- **清晰的分层**：路由放 `routers/`，业务逻辑放 `services/`，数据库访问放 `crud.py`
- **导入与副作用**：避免在模块 import 时执行昂贵操作；保持 `main.py` 可被安全导入
- **错误处理**：对外 API 返回一致结构；避免将内部异常/栈信息直接暴露给客户端

## Performance（性能规范）

以下约束来自当前性能基线（见下方「性能结论与基线」），改动相关代码时必须遵守：

- **端点定义（必须）**：凡端点内存在阻塞 I/O（SQLAlchemy 查询/提交、密码哈希验证、上游 HTTP 请求、文件读写），必须声明为同步 `def`（FastAPI 自动放入线程池）。禁止在 `async def` 中执行阻塞调用——会阻塞事件循环（此前 bcrypt 验密 166ms 期间 `/health` 饥饿到 168ms）。仅纯异步端点（如显式 `await` 非阻塞 I/O）可用 `async def`。
- **密码哈希（必须）**：新哈希一律 argon2id，参数 `time_cost=2 / memory_cost=19456 KiB (19 MiB) / parallelism=1`（`backend/auth.py` 中 `_argon2_hasher`）。禁止新生成 bcrypt 哈希；存量 bcrypt 哈希由登录成功后自动重哈希为 argon2id（`password_needs_update` + `authenticate_user`）。
- **响应体与序列化（必须）**：课表/事件等列表聚合端点禁止返回嵌套完整 `schedule`（含 class_times）与完整 `owner`；个人端点用 `response_model_exclude={"schedule", "owner"}`，团队/筛选端点用瘦身模型 `EventTeamResponse`（`schemas.py` 中 `ScheduleBrief`/`UserBrief`）。禁止逐事件懒加载导致 N+1（序列化时每事件一次 SQL）——用 joinedload 预载或用不触发懒加载的响应模型。
- **响应耗时观测（必须保留）**：`backend/main.py` 的 `RequestTimingMiddleware` 输出 `TIMING method path status X.Xms`；生产 uvicorn 必须使用 `uvicorn_log_config.json`（含耗时字段）。
- **性能回归门槛**：argon2id 验密 <100ms；存量 bcrypt cost 12 的首次成功登录允许约 170ms，但必须在该次登录后自动升级为 argon2id。改动端点后须实测（复测方法见下）。

### 性能结论与基线

以下事实来自当前代码与实测结果，改动相关代码前先对照，避免性能回归或重复排查：

- **框架结论**：FastAPI 足以应对当前业务规模。现有性能瓶颈来自阻塞调用、密码哈希与大响应体，修复应继续聚焦这些实际热点。
- **历史根因（修复前基线）**：单 uvicorn worker（`docker/supervisord.conf` `--workers 1`）+ 大量 `async def` 端点内做阻塞 SQLAlchemy/bcrypt 调用 → 10 并发 `GET /api/schedule/` wall **1856ms**（≈10×单请求，线性排队）；登录 bcrypt（cost=12）验密 **166ms** 且卡死事件循环（期间 `/health` 被拖到 168ms）；`GET /api/schedule/` 响应体 **857KB**（590 事件 × 嵌套 schedule+owner）。数据规模极小（66 用户/8464 事件），查询本身不是瓶颈。
- **修复后基线（回归对照，同一快照/端点口径）**：argon2id 验密 **41ms**；登录端点 **80ms**；登录期间 `/health` **10ms**；10 并发重端点 wall **1134ms**（剩余为 GIL 上大响应序列化）；10 并发轻量端点 wall **46ms**（线程池已并行）；团队端点 3.47MB→**1.52MB**（243→153ms）；筛选端点 349KB→**150KB**；个人主路径 268.6KB / 14.5ms / 4 SQL（无 N+1）。
- **剩余瓶颈与已知优化**：重端点（735KB-1.5MB）纯 Python 序列化仍在 GIL 上争用 → 可 `--workers 2-4` 进程级并行（注意内存线性增长与连接池配比 pool_size/worker）；`events` 表缺 `(schedule_id)`、`(start_time, end_time)` 索引（当前 8.5k 行无感，数据增长后防退化，补索引须走 `scripts/migrations/` 且更新 PG 集成 HEAD_REVISION）；PostgreSQL 可开 `auto_explain`（`log_min_duration=100ms`）记录慢查询。
- **复测方法**：并发串行验证必须带 Authorization（无 token 的 401 秒回会误判为已并行）；事件循环饥饿验证 = 慢请求（如登录）发出 10ms 后打 `/health`，修复前被拖到 ~170ms、修复后 <10ms；验密耗时直接在 auth 层计时（argon2id 41ms / bcrypt 166ms）。

## Security and Guardrails（安全与守则）

- **敏感信息**：不要提交/回显任何密钥、口令、token、私有 URL；避免把真实凭据写入代码/文档
- **默认账户**：管理员初始口令只出现在运行日志中；不要硬编码弱口令
- **禁止行为**
  - 禁止使用 `npm`（包括 `npm install` / `npm run ...`）
  - 禁止引入或提交 `package-lock.json`
  - 禁止在输出/提交中使用 emoji（包括文档与注释），保持文字专业与可复核
  - 禁止随意放宽 CORS/CSP 或关闭鉴权以“方便开发”
- **日志**：避免在日志中输出用户隐私数据（邮箱、学号、token、验证码等）；需要时做脱敏

### 认证与密码规范

- **JWT（必须）**：HS256，`exp=30min`；签发时必须写入 `token_version`（payload `tver`），改密（`/api/profile/change-password`）、重置密码（`/api/auth/reset-password`）、管理员重置密码（`crud.update_user` password 路径）必须自增用户 `token_version`，使旧 token 立即失效（`get_current_user`/`get_optional_current_user` 校验）。新增改密/重置路径必须同步自增。
- **密码策略（必须）**：新密码最小 8 位（NIST SP 800-63B）。服务端 `schemas.py`（RegisterRequest/ResetPasswordRequest/ChangePasswordRequest）与前端表单（RegisterForm/ForgetPasswordForm/FirstStartAdminModal 等）必须同步，不得只改一端。
- **限流与验证码存储（必须）**：登录限流（`login_rate_limits`，默认 8 次/学号+IP/300s，锁定 600s）、注册限流（`register_rate_limits`，默认 10 次/IP/600s）、邮箱验证码（`verification_codes`，5 次错误作废、恒定时间比较、一次性消费、发送 60s 冷却）全部存数据库，跨 worker 共享。**禁止改回进程内 dict**；新增限流/验证码类状态一律走 DB 表。参数可用 `AUTH_RATE_LIMIT_*` / `REGISTER_RATE_LIMIT_*` 环境变量调整。
- **依赖禁令（必须）**：禁止重新引入 `passlib`（1.7.4 已停止维护）。密码哈希直连 `argon2-cffi.PasswordHasher` + `bcrypt`（仅存量兼容），实现见 `backend/auth.py`。
- **密钥（必须）**：生产（ENV/APP_ENV=production）必须设置 `SECRET_KEY`，缺失拒绝启动；占位符密钥被拒。

### 本地浏览器测试前排除访问统计

本地用真实浏览器访问线上或预览站时，必须先排除 Umami 统计，避免把测试流量计入正式数据。

在目标站点打开开发者工具 Console，执行：

```js
localStorage.setItem('umami.disabled', 1)
```

取消排除：

```js
localStorage.removeItem('umami.disabled')
```

该设置按站点生效；每个域名都要单独设置一次。智能体执行任何浏览器验证前必须先执行排除命令。

## Contribution Guidelines（贡献指南）

- **分支与 PR**
  - 小步提交：每次提交聚焦一个主题（修复/功能/文档）
  - PR 描述包含：变更点、影响范围、验证方式（贴出你跑过的命令）
  - 若涉及用户功能、前端交互、后端 API、环境变量、部署或开发流程，必须同步更新对应 Markdown 文档；文档间引用使用相对链接。
  - 每完成一个功能/模块/bug 修复，使用约定式英文提交信息（Conventional Commits），并且必须使用多个 `-m` 编写详细提交说明；说明内容使用无序列表逐条描述变更点、影响范围与验证结果。
  - 提交消息示例：
    ```bash
    git commit \
      -m "fix(frontend): improve auth form validation and toast feedback" \
      -m "- Replace native form blocking with toast-based validation hints." \
      -m "- Align OTP send-code interactions across login/register/forget flows." \
      -m "- Verify with bun run type-check and bun run build."
    ```

常规贡献流程：Fork 仓库，创建聚焦的特性或修复分支，按本节提交规范提交并推送，然后创建 Pull Request。

- **Issue**
  - 复现步骤清晰；注明环境（OS、Python 版本、uv 版本、Bun 版本）
  - 附最小必要日志（脱敏）
- **代理协作流程（必须）**
  - 编写代码前必须先进行充分思考与方案对比；可结合 `web search`、`context7 mcp`、相关 `skills`、官方文档与项目内约定后再实施修改。
  - 修改前先定位代码位置与现有约定；避免“推倒重写”
  - 代码编写后必须执行与改动相关的测试/验证（单测、构建、类型检查、冒烟测试等），不得跳过验证直接提交。
  - 修改后必须满足质量门槛：
    - 前端：`type-check` + `lint` + `build`
    - 后端：`uv run python -m compileall` + 冒烟测试 + `uv run --with pytest pytest -q`；结果以当前完整测试执行为准。

## Notes（其他）

### 版本号管理

发布新版本时，以下位置的版本号或版本记录**必须同步修改**：

| 文件 | 位置 | 说明 |
|---|---|---|
| `backend/pyproject.toml` | `version = "x.y.z"` | Python 项目元数据，`uv` 和打包使用 |
| `backend/main.py` | `version="x.y.z"`（FastAPI 初始化） | API 文档和 `/` 端点显示的版本 |
| `backend/main.py` | 根端点返回的 `"version": "x.y.z"` | `GET /` 响应体 |
| [`CHANGELOG.md`](/zh/chronosync/about/changelog/) | 新增 `### vX.Y.Z (...)` 完整记录 | 全部版本历史 |
| [`README.md`](/zh/chronosync/) | 最近三个月内保留同一版本记录 | 项目首页近期更新 |

前端"更新日志"弹窗在构建阶段从 [`CHANGELOG.md`](/zh/chronosync/about/changelog/) 渲染（`frontend/src/layouts/DashboardLayout.astro`），且只展示相对构建日期最近三个月的版本条目（用户界面不显示该限制，无需手改版本号）。**变更版本号后必须核对**：弹窗构建产物与 README「最近三个月」区间展示同一批版本条目、同一最新版本号；两者不一致或最新版本未出现时不得发布。

**CI/CD 自动行为**：推送到 `main` 分支时，GitHub Actions 自动从 `backend/pyproject.toml` 读取版本号，构建 Docker 镜像并打 `latest` 和 `x.y.z` 两个 tag 推送到 Docker Hub。推送 `v*` 格式的 git tag 时，还会额外追加该 git tag 作为镜像 tag。

**手动发版流程**：

```bash
# 1. 修改上述 5 处（保持版本号一致）
# 2. 提交
git commit -m "release: bump version to vX.Y.Z" -m "- ..."
# 3. 打 git tag
git tag vX.Y.Z
# 4. 推送（触发 CI 构建 latest + x.y.z + vX.Y.Z 三个镜像 tag）
git push origin main --tags
```

- 本仓库允许在子目录放置自己的 [`AGENTS.md`](https://github.com/CelPlume/SDNUChronoSync/blob/main/AGENTS.md) 覆盖局部规则；遇到冲突时以"就近目录"的 `AGENTS.md` 为准。

### 数据库迁移脚本规范

- 所有**新的**数据库迁移脚本必须放在 `scripts/migrations/`，**不得**再放到 `backend/migrations/`。
- `backend/migrations/` 不再作为迁移脚本目录存在；历史 Alembic 资源统一归档到 `scripts/migrations/legacy_alembic/`，不要再把迁移文件放回 `backend/migrations/`。
- 每新增、修改或废弃一个迁移脚本时，必须同步维护：
  - [迁移脚本说明](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README.md)：脚本清单、引入版本、用途、适用数据库、使用方式、注意事项；
  - [项目说明](/zh/chronosync/)、[部署指南](/zh/chronosync/dev/deployment/)或[完整更新日志](/zh/chronosync/about/changelog/)中与该变更直接相关的入口和升级说明。
- **模型与迁移 DDL 一致性（必须）**：新增列/表时，`models.py` 与 Alembic revision 必须逐项一致——列类型、nullable、以及 `server_default`（模型用 `server_default=text(...)`，迁移用 `server_default=...`，两侧都要有；参照 `is_default`/`is_hidden`/`token_version` 惯例）。缺失即视为 schema 漂移。
- **新 head 同步（必须）**：新增 revision 成为新 head 后，必须同步更新 `backend/tests/test_postgres_integration.py` 的 `HEAD_REVISION`，否则 CI 的 fresh-upgrade 门禁必红。
- **幂等守卫（必须）**：revision 内建表/加列操作需带 `if not exists` 风格守卫（参照 `d5e6f7a8b9c0`、`f0a1b2c3d4e5`）。
- **运行时状态表不进导库清单**：`login_rate_limits` / `register_rate_limits` / `verification_codes` 是运行时状态，不加入 `scripts/migrations/sqlite_to_postgres.py` 的 `TABLES_IN_ORDER`。新增同类表同样排除。

### PostgreSQL 可靠性验收（迁移/导库改动后必须）

- 在真实 PostgreSQL（CI 用 `postgres:latest`）上跑 `alembic upgrade head`，确认全部 revision 依次应用、`alembic_version` 单行且等于 head。
- 核对**模型 metadata vs 实际 catalog 零漂移**：对全部表比对列/nullable/server_default/索引（SQLite 侧由 `test_migration_governance.py` 的 `_assert_catalog_matches_metadata` 覆盖，PG 侧需手工核对或跑 `TEST_POSTGRES_URL` 集成测试）。
- 用独立临时库验证（不要在生产库上执行迁移验收），验后删除。
