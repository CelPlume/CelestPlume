---
title: 部署指南
description: Docker Compose、单容器与源码三种部署方式，以及数据库配置、持久化、环境变量与故障排查。
sidebar:
  order: 6
---

 # SDNUChronoSync 部署指南

多用户课表与日程管理工具的完整部署指南，支持三种部署方式。

## 📋 目录

- [系统要求](#系统要求)
- [部署方式](#部署方式)
  - [1. Docker Compose 部署 (推荐)](#1-docker-compose-部署-推荐)
  - [2. Docker 单容器部署](#2-docker-单容器部署)
  - [3. 源码部署 (bun + uv)](#3-源码部署-bun--uv)
- [数据库配置](#数据库配置)
  - [PostgreSQL (推荐)](#postgresql-推荐)
  - [SQLite (开发用)](#sqlite-开发用)
  - [从 SQLite 迁移到 PostgreSQL](#从-sqlite-迁移到-postgresql)
- [容器持久化配置](#容器持久化配置)
- [环境配置](#环境配置)
- [故障排除](#故障排除)

## 📦 系统要求

### Docker 部署
- Docker 20.0+ 
- Docker Compose 2.0+
- 可用内存: 1GB+
- 可用磁盘: 2GB+

### 源码部署
- Python 3.10+
- uv 0.4+
- Bun 1.0+（前端仅支持 Bun，不要使用 npm/yarn）
- 可用内存: 512MB+
- 可用磁盘: 1GB+

## 🚀 部署方式

### 1. Docker Compose 部署 (推荐)

最简单的一键部署方式，适合生产环境使用。

#### 快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd SDNUChronoSync

# 2. 创建数据目录
mkdir -p data/{uploads,config,logs}

# 3. 仅在配置不存在时写入初始模板；升级和重跑不得覆盖现有配置
test -f data/config/config.toml || cp backend/config.toml data/config/config.toml

# 4. 仅首次部署创建环境文件；已有 .env 必须原样保留
if [ ! -f .env ]; then
  umask 077
  cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
APP_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
EOF
fi

# 5. 启动服务（自动启动 PostgreSQL + 应用）
docker compose up -d

# 6. 查看服务状态
docker compose ps
```

#### 关键环境变量（生产环境必设）

生产环境必须设置 `SECRET_KEY`（JWT 与邮箱验证码摘要共用；所有 worker 必须一致），并显式设置 `APP_ENV=production`。Docker Compose 已从 `.env` 传入这两个值。

生成一个随机 `SECRET_KEY`（二选一）：

```bash
# 方式 A：openssl
openssl rand -hex 32

# 方式 B：uv + python
cd backend && uv run python -c "import secrets; print(secrets.token_urlsafe(48))"
```

然后把它写入 `docker-compose.yml` 的 `environment:`（示例）：

```yaml
environment:
  - APP_ENV=production
  - SECRET_KEY=<paste-your-secret-key-here>
  # 可选：跨域（逗号分隔多个域名）
  # - ALLOWED_ORIGINS=https://your-domain.com,http://localhost:4321
```

如果设置了 `APP_ENV=production` 但未设置 `SECRET_KEY`，后端会拒绝启动（避免默认弱密钥带来的安全风险）。

#### 服务访问

- **应用地址**: https://localhost:1145
- **API文档**: https://localhost:1145/docs
- **健康检查**: https://localhost:1145/health

> Docker 镜像内置 Nginx 已启用 **HTTPS + HTTP/2**（单连接多路复用）。默认会自动生成自签证书，浏览器首次访问可能提示“不安全”；生产环境请挂载你的正式证书到 `/etc/nginx/certs/tls.crt` 和 `/etc/nginx/certs/tls.key`。

PostgreSQL 18 及更高版本的实际 `PGDATA` 位于 `/var/lib/postgresql/<主版本>/docker`；Compose 因此把 named volume 挂载到父目录 `/var/lib/postgresql`。改回 `/var/lib/postgresql/data` 会使实际数据库集群落入未受管的匿名卷。
Compose 将 `./data/logs` 挂载到 `/app/logs`。Supervisor 以追加模式重新打开既有日志，容器重启不会截断旧文件；升级和迁移不得删除或重新初始化该目录。

#### 管理命令

```bash
# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重新构建并启动
docker compose up -d --build

# 进入容器
docker compose exec sdnu-chronosync bash

# 备份 PostgreSQL 数据库
mkdir -p backups
docker compose exec db pg_dump -U chronosync -d chronosync -Fc > "backups/chronosync_$(date +%Y%m%d_%H%M%S)_$$.dump"
```

## 💾 数据库配置

### PostgreSQL (推荐)

生产环境的唯一 schema 真相源是 `scripts/migrations/alembic/`。Docker entrypoint 会在启动 Supervisor 前执行 `uv run alembic -c /app/alembic.ini upgrade head`；应用启动时再次校验 `alembic_version` 必须等于现役 head。PostgreSQL 路径不会调用 `Base.metadata.create_all()` 补表或升级，版本缺失/不匹配时应用拒绝启动。

源码部署或维护窗口内手工升级：

```bash
cd backend
export DATABASE_URL='postgresql+psycopg://chronosync:密码@localhost:5432/chronosync'
uv run alembic -c alembic.ini upgrade head
uv run alembic -c alembic.ini current
uv run alembic -c alembic.ini heads
```

`current` 与 `heads` 必须显示相同 revision。对 fresh 空库直接执行 `upgrade head`。若旧 PostgreSQL 是早期 `create_all` 创建、业务表已存在但没有 `alembic_version`，不要直接启动或手工 `stamp head`；只能在停机、备份后运行受限 bootstrap：

```bash
cd backend
uv run python ../scripts/migrations/bootstrap_postgres.py --database-url "$DATABASE_URL"
```

bootstrap 仅接受代码中声明的 `c4d5e6f7a8b9` catalog 基线（完整表、列、主键、外键和必要索引），先 stamp 到该明确 revision，再事务性升级到 head；任一对象不完整都会拒绝，不能用来绕过任意旧 schema。

#### 环境变量

| 变量 | 说明 | 示例 |
|---|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL 密码（必填） | `openssl rand -hex 16` 生成 |
| `DATABASE_URL` | SQLAlchemy 连接串 | `postgresql+psycopg://chronosync:密码@db:5432/chronosync` |
| `DB_POOL_SIZE` | 连接池大小（默认 10） | `10` |
| `DB_MAX_OVERFLOW` | 溢出连接数（默认 20） | `20` |
| `DB_POOL_RECYCLE` | 连接回收秒数（默认 1800） | `1800` |

业务连接数上限为每进程 `DB_POOL_SIZE + DB_MAX_OVERFLOW`，另有 1 个独立健康检查连接；多进程部署需按每 worker 增加 1 个探针连接调整 PostgreSQL `max_connections`。

健康检查使用独立的单连接池，池等待与数据库连接超时均为 2 秒；业务连接池耗尽时探针会快速返回非就绪，不会等待 `DB_POOL_TIMEOUT`。

### SQLite (开发与旧部署兼容)

本地开发可继续使用 SQLite；应用仅在 SQLite 路径保留 `Base.metadata.create_all()`，用于创建缺失对象。它不会替代旧生产库的字段升级。

```bash
cd backend
# 默认 DATABASE_URL=sqlite:///./schedule_app.db
uv run python main.py
```

已上线旧 SQLite 在切换 PostgreSQL 前必须停机运行专用 upgrader；不要靠启动应用隐式修库。

### 从 SQLite 迁移到 PostgreSQL

完整命令、校验点和回滚步骤只维护在 [迁移 Runbook](../scripts/migrations/README_PG.md)。必须在停机维护窗口执行，期间禁止任一应用进程写入源库或目标库；先保留原 SQLite 和旧容器，只升级工作副本，并且只向 fresh 空 PostgreSQL 导入。

### 2. Docker 单容器部署

适合简单部署场景，手动管理数据持久化。

#### 构建镜像

> Docker 镜像构建使用 `backend/uv.lock` 和 `frontend/bun.lock` 冻结前后端依赖，并分别执行 `uv sync --frozen`、`bun install --frozen-lockfile`。`.dockerignore` 会排除数据库、环境文件、虚拟环境、上传目录和缓存，避免把生产数据打入镜像。

```bash
# 1. 构建镜像
docker build -t sdnu-chronosync:latest .

# 2. 准备数据目录和配置文件
mkdir -p ~/sdnu-data/{uploads,config,logs}
test -f ~/sdnu-data/config/config.toml || cp backend/config.toml ~/sdnu-data/config/config.toml

# 3. 运行容器（需要先启动外部 PostgreSQL）
docker run -d \
  --name sdnu-chronosync \
  -p 1145:1145 \
  -e APP_ENV=production \
  -e SECRET_KEY='<replace-with-strong-random-string>' \
  -e DATABASE_URL='postgresql+psycopg://chronosync:password@host.docker.internal:5432/chronosync' \
  -e ALLOWED_ORIGINS='https://your-domain.com' \
  -v ~/sdnu-data/uploads:/app/uploads \
  -v ~/sdnu-data/config/config.toml:/app/config.toml:ro \
  -v ~/sdnu-data/logs:/app/logs \
  --restart unless-stopped \
  sdnu-chronosync:latest
```

**注意：**如果要通过管理后台修改“系统设置/代码注入”等配置，请将 `-v ~/sdnu-data/config/config.toml:/app/config.toml:ro` 改为可写挂载（移除 `:ro`）。

**重要提示：**外部 PostgreSQL 数据由数据库服务自身持久化；应用容器只绑定挂载上传目录、`config.toml` 和日志目录。确保 `~/sdnu-data/config/config.toml` 在启动容器前已存在。

#### 管理命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs sdnu-chronosync -f

# 停止容器
docker stop sdnu-chronosync

# 启动容器
docker start sdnu-chronosync

# 删除容器
docker rm sdnu-chronosync

# 备份 PostgreSQL 数据库（需连接到 PostgreSQL 容器）
docker exec sdnu-chronosync-db pg_dump -U chronosync -d chronosync -Fc > "backup_$(date +%Y%m%d_%H%M%S)_$$.dump"
```

### 3. 源码部署 (bun + uv)

适合开发环境或需要自定义的场景。

#### 环境准备

```bash
# 0. 安装 uv（https://docs.astral.sh/uv/getting-started/installation/）

# 1. 安装 Python 依赖
cd backend
uv sync

# 2. 安装前端依赖（只允许 bun）
cd ../frontend
bun install

# 3. 构建前端
bun run build
```

#### 启动服务

##### 方式一：使用启动脚本 (推荐)

```bash
# 项目根目录下
chmod +x scripts/start_dev.sh
./scripts/start_dev.sh
```

##### 方式二：手动启动

```bash
# 终端1: 启动后端 (端口8000)
cd backend
uv run python main.py

# 可选：让后端端口本身使用 HTTPS + HTTP/2（需要 TLS；默认会自动生成自签证书）
# 然后访问 https://localhost:8000
# ENABLE_HTTP2=1 uv run python main.py

# 终端2: 启动前端 (端口4321)
cd frontend
bun run dev

# 终端3: 使用 nginx 反向代理到1145端口 (可选)
# 配置 nginx.conf 将请求转发到对应服务
```

#### 生产环境部署

```bash
# 1. 构建前端
cd frontend
bun run build

# 2. 配置生产环境服务器 (nginx + uvicorn)
# nginx 配置示例：
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/certs/tls.crt;
    ssl_certificate_key /etc/nginx/certs/tls.key;
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ @backend;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location @backend {
        proxy_pass http://127.0.0.1:8000;
    }
}

# 3. 使用 uv 启动后端
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 💾 容器持久化配置

### 数据持久化策略

容器化部署需要将重要数据持久化到宿主机，确保容器重启后数据不丢失。

### 宿主机目录结构

应用文件推荐使用以下绑定挂载；PostgreSQL 数据不放在该目录中的 SQLite 文件里，而是由 `postgres_data` named volume 持久化：

```
~/sdnu-data/
├── uploads/
│   └── avatars/
├── config/
│   └── config.toml
└── logs/
    ├── fastapi.log
    └── nginx.log
```

必须先创建 `config.toml`，否则 Docker 可能把目标路径创建成目录。

#### 1. Docker Compose 持久化（自动配置）

当前 `docker-compose.yml` 的持久化关系为：

```yaml
services:
  db:
    volumes:
      - postgres_data:/var/lib/postgresql

  sdnu-chronosync:
    volumes:
      - ./data/uploads:/app/uploads
      - ./data/config/config.toml:/app/config.toml:ro
      - ./data/logs:/app/logs

volumes:
  postgres_data:
```

PostgreSQL 18 及更高版本的实际 `PGDATA` 位于 `/var/lib/postgresql/<主版本>/docker`，因此 named volume 必须挂载父目录 `/var/lib/postgresql`。若希望通过管理后台保存站点配置或代码注入，需要移除 `config.toml` 挂载的 `:ro`；否则直接在宿主机编辑并重启容器。

#### 2. Docker 单容器持久化 (手动配置)

```bash
# 创建宿主机目录
mkdir -p ~/sdnu-data/{database,uploads,config,logs}

# 仅首次部署复制初始配置；已有文件不得覆盖
test -f ~/sdnu-data/config/config.toml || cp backend/config.toml ~/sdnu-data/config/config.toml

# 运行容器并挂载目录（通过环境变量指定数据库路径）
docker run -d \
  --name sdnu-chronosync \
  -p 1145:1145 \
  -e DATABASE_URL=sqlite:////app/data/schedule_app.db \
  -v ~/sdnu-data/database:/app/data \
  -v ~/sdnu-data/uploads:/app/uploads \
  -v ~/sdnu-data/config/config.toml:/app/config.toml:ro \
  -v ~/sdnu-data/logs:/app/logs \
  --restart unless-stopped \
  sdnu-chronosync:latest
```

**挂载说明：**
- `~/sdnu-data/database:/app/data` - 数据库文件目录（必须是 database 子目录）
- `~/sdnu-data/uploads:/app/uploads` - 用户上传文件目录
- `~/sdnu-data/config/config.toml:/app/config.toml:ro` - 配置文件（只读）
- `~/sdnu-data/logs:/app/logs` - 应用日志目录

#### 3. 数据备份策略

PostgreSQL 使用 `pg_dump` 备份，支持热备份（不停机）：

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
set -euo pipefail

RUN_ID="$(date +%Y%m%d_%H%M%S)_$$"
BACKUP_DIR="./backups/$RUN_ID"
mkdir -p "$BACKUP_DIR"

# 备份 PostgreSQL（custom 格式，支持选择性恢复）
docker compose exec -T db pg_dump -U chronosync -d chronosync -Fc > "$BACKUP_DIR/chronosync.dump"

# 保留上传、配置、环境变量和运行日志；每次写入独立目录。
cp -a ./data/uploads "$BACKUP_DIR/uploads"
cp -a ./data/config "$BACKUP_DIR/config"
cp -a ./data/logs "$BACKUP_DIR/logs"
if [ -f ./.env ]; then
  cp -a ./.env "$BACKUP_DIR/.env"
fi

# 不自动删除旧备份；按实际存储容量另行制定保留策略。
echo "备份完成: $BACKUP_DIR"
EOF

chmod +x backup.sh

# 设置定时备份 (可选)
# crontab -e
# 0 2 * * * /path/to/backup.sh
```

恢复备份：

```bash
# 恢复 PostgreSQL 备份
docker compose exec db pg_restore -U chronosync -d chronosync backups/xxx/chronosync.dump

# 或恢复到新数据库
docker compose exec db createdb -U chronosync chronosync_restore
docker compose exec db pg_restore -U chronosync -d chronosync_restore backups/xxx/chronosync.dump
```

### 重要目录说明

| 目录/文件 | 用途 | 是否必须持久化 |
|-----------|------|---------------|
| PostgreSQL 命名卷 (`postgres_data`) | PostgreSQL 数据文件 | 必须保留 |
| `.env` | 数据库密码、统一 `SECRET_KEY` 与其他环境变量 | 必须保留且不得重新生成 |
| `/app/uploads/avatars/` | 用户头像文件 | 必须保留原挂载 |
| `/app/config.toml` | 应用配置文件 | 必须保留原文件 |
| `/app/logs/` | 应用与 Supervisor 日志 | 必须保留原目录；重启追加，不清空旧日志 |

## ⚙️ 环境配置

### 配置文件说明

主配置文件：`config.toml`

```toml
[storage]
provider = "local"  # 或 "alist"

[storage.local]
upload_path = "uploads/avatars"
base_url = "/static/avatars"

[storage.alist]
version = 3
url = "https://your-alist-instance.com"
upload_path = "your-upload-path"
token = "your-token"
username = "your-username"
password = "your-password"
```

### 环境变量 (Docker)

```bash
# .env 文件示例
NODE_ENV=production
PYTHONUNBUFFERED=1

# 生产环境强烈建议设置（用于签发登录 token）
APP_ENV=production
SECRET_KEY=<a long random string>

# PostgreSQL 密码（必填，Docker Compose 使用）
POSTGRES_PASSWORD=<a long random password>

# 可选：数据库配置（默认使用 Docker Compose 中的 PostgreSQL）
# DATABASE_URL=postgresql+psycopg://chronosync:password@db:5432/chronosync

# 可选：连接池参数
# DB_POOL_SIZE=10
# DB_MAX_OVERFLOW=20
# DB_POOL_RECYCLE=1800

# 可选：跨域（逗号分隔多个域名）
# ALLOWED_ORIGINS=https://your-domain.com,http://localhost:4321

# 可选：管理员初始化行为
# AUTO_CREATE_ADMIN=1
# SHOW_INITIAL_ADMIN_PASSWORD=1
# DEFAULT_ADMIN_PASSWORD=<set only if you know what you are doing>
# CREATE_SAMPLE_USERS=0

# 可选：外部存储配置
# STORAGE_PROVIDER=alist
# ALIST_URL=https://your-alist.com
# ALIST_TOKEN=your-token

# 可选：受控代码注入外域白名单（多个域名用逗号分隔）
# CODE_INJECTION_ALLOWED_HOSTS=analytics.hxcn.dev,hm.baidu.com,www.googletagmanager.com
```

### CORS 配置

浏览器出现 `Access to fetch ... has been blocked by CORS policy` 时，把前端实际 Origin 写入 `ALLOWED_ORIGINS`，多个来源用逗号分隔；该值是环境变量，不在 `config.toml` 中配置，修改后必须重启后端或重建容器。

```bash
# 本地开发：backend/.env
ALLOWED_ORIGINS=http://localhost:4321

# Docker 单容器
docker run ... \
  -e ALLOWED_ORIGINS='https://your-domain.com,http://localhost:4321' \
  ...
```

Docker Compose 在应用服务的 `environment:` 中配置：

```yaml
environment:
  - ALLOWED_ORIGINS=https://your-domain.com,http://localhost:4321
```

随后执行 `docker compose up -d`。CORS 只接受完整 Origin（协议、主机和端口），不要填写页面路径，也不要为方便开发放宽为任意来源。

### 后端稳定性与性能参数

| 变量 | 默认值 | 说明 |
|---|---:|---|
| `DB_POOL_SIZE` | `10` | 每个 worker 的 PostgreSQL 常驻业务连接数 |
| `DB_MAX_OVERFLOW` | `20` | 每个 worker 的临时溢出连接数 |
| `DB_POOL_TIMEOUT` | `30` | 业务连接池等待秒数 |
| `DB_POOL_RECYCLE` | `1800` | PostgreSQL 连接回收秒数 |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | `300` | 登录失败统计窗口 |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | `8` | 窗口内最大登录失败次数 |
| `AUTH_RATE_LIMIT_LOCKOUT_SECONDS` | `600` | 登录锁定秒数 |
| `AUTH_RATE_LIMIT_CLEANUP_INTERVAL_SECONDS` | `300` | 过期限流记录清理间隔 |
| `REGISTER_RATE_LIMIT_MAX_ATTEMPTS` | `10` | 注册 IP 窗口内最大尝试次数 |
| `REGISTER_RATE_LIMIT_WINDOW_SECONDS` | `600` | 注册 IP 统计窗口 |
| `JWXT_HTTP_TIMEOUT_GET` | `10` | 教务 GET 请求超时秒数 |
| `JWXT_HTTP_TIMEOUT_POST` | `15` | 教务 POST 请求超时秒数 |
| `JWXT_MAX_CONCURRENCY` | `3` | 空教室上游请求最大并发 |
| `CLASSROOM_SESSION_TTL_SECONDS` | `600` | 空教室认证会话有效期 |
| `CLASSROOM_SESSION_MAX_ITEMS` | `256` | 单进程空教室会话容量 |
| `CLASSROOM_SESSION_CLEANUP_INTERVAL_SECONDS` | `60` | 会话清理间隔 |

登录、注册限流与邮箱验证码使用数据库共享状态，多 worker 可共享；所有 worker 仍必须使用同一个稳定 `SECRET_KEY`，否则 JWT 与验证码 HMAC 无法跨进程验证。每个 worker 的业务连接上限是 `DB_POOL_SIZE + DB_MAX_OVERFLOW`，并额外使用 1 个独立健康探针连接；增加 worker 前按此核算 PostgreSQL `max_connections`。

教务连接地址：

```bash
# 校园网直连上游实际只支持 HTTP，不要强制改为 HTTPS。
JWXT_DIRECT_BASE_URL=http://jwxt.sdnu.edu.cn/jwglxt
JWXT_WEBVPN_BASE_URL=https://webvpn.sdnu.edu.cn:10443/http/<token>/jwglxt
JWXT_WEBVPN_SSO_LOGIN_URL=https://webvpn.sdnu.edu.cn/enlink/sso/login
```

WebVPN 与教务系统账号可不同，凭据由用户每次输入，禁止写入环境变量、配置文件或日志。

## 🔐 受控代码注入（统计脚本 / 样式表 / Meta）

本项目支持在页面 `head` / `body` 注入第三方统计或样式资源，但为避免 XSS 风险，已将“代码注入”收敛为**受控白名单机制**。

### 注入限制（摘要）

- 仅允许 `script[src]` / `link[rel=stylesheet,href]` / `meta[name|property,content]`
- 禁止 inline script、禁止事件属性（如 `onclick`）
- 同源脚本仅允许 `/assets/*.js`；同源样式仅允许 `/assets/*.css`
- 外部资源仅允许 `https://` 且域名必须在 `CODE_INJECTION_ALLOWED_HOSTS` 中

### 如何配置外域白名单（CODE_INJECTION_ALLOWED_HOSTS）

- **源码部署/直接运行**
  - 推荐在 `backend/.env` 中添加：
    - `CODE_INJECTION_ALLOWED_HOSTS=analytics.hxcn.dev`
  - 或在启动后端前设置系统环境变量。
- **systemd**
  - 在 unit 中设置 `Environment="CODE_INJECTION_ALLOWED_HOSTS=analytics.hxcn.dev"`，或使用 `EnvironmentFile=`；修改后执行 `systemctl daemon-reload` 并重启服务。
- **Docker Compose 部署**
  - 在 `docker-compose.yml` 的 `environment:` 中添加：
    - `CODE_INJECTION_ALLOWED_HOSTS=analytics.hxcn.dev`
- **Docker 单容器部署**
  - `docker run` 时添加：
    - `-e CODE_INJECTION_ALLOWED_HOSTS=analytics.hxcn.dev`

### 反向代理 / CSP 注意事项

如果你允许外域统计脚本，反向代理层需要同步放行：

- `script-src` / `script-src-elem`：允许脚本域名
- `connect-src`：允许统计上报域名（很多统计使用 `fetch` 上报）

Docker 部署使用的 Nginx 配置在 `docker/nginx.conf`，如你更换统计域名，需要同步更新 CSP。

### 默认账户

系统在数据库中不存在 `student_id=admin` 时自动创建管理员账户：

- 用户名：`admin`；
- 密码：首次启动时随机生成，仅在初始化日志中输出一次；
- 权限：管理员。

测试学生账户默认不创建。只有显式设置 `CREATE_SAMPLE_USERS=1` 才会创建样例用户，生产环境不要启用。

#### 获取管理员初始密码

当系统检测到数据库中不存在管理员账户时，会自动创建 `student_id=admin` 的管理员账号，并在后端启动日志中输出一次：

`[SECURITY] Password: <random_password>`

可选环境变量：

- `DEFAULT_ADMIN_PASSWORD`：指定初始管理员密码（生产环境不建议使用固定弱口令）
- `SHOW_INITIAL_ADMIN_PASSWORD=0`：不在日志中打印初始密码（打印为 `<hidden>`）
- `AUTO_CREATE_ADMIN=0`：禁用自动创建管理员（不建议，可能导致无法登录管理后台）

##### Docker / docker compose

首次启动后立即查看容器日志，找到上述 `SECURITY` 输出：

```bash
docker compose logs --no-color sdnu-chronosync | grep "\[SECURITY\]"
```

##### 普通安装（直接运行）

如果你是用 `uv run python main.py` / `uv run uvicorn` 直接启动后端，初始密码会打印在当前终端输出中。请在首次启动时保存该密码。

##### 普通安装（systemd）

如果你用 systemd 托管后端服务，可使用：

```bash
journalctl -u <your-service-name> -b --no-pager | grep "\[SECURITY\]"
```

安全提醒：该初始密码仅会输出一次；请在首次登录后立即修改管理员密码。

## 🔧 故障排除

### 常见问题

#### 1. 容器无法启动

```bash
# 检查端口占用
netstat -tulpn | grep 1145

# 检查容器日志
docker compose logs sdnu-chronosync

# 检查资源使用
docker stats
```

#### 2. 数据库连接或 revision 检查失败

```bash
# 检查 PostgreSQL 容器状态与日志
docker compose ps db
docker compose logs db
docker compose exec db pg_isready -U chronosync -d chronosync

# 检查应用镜像看到的 Alembic current/head
docker compose run --rm --entrypoint uv sdnu-chronosync \
  run alembic -c /app/alembic.ini current
docker compose run --rm --entrypoint uv sdnu-chronosync \
  run alembic -c /app/alembic.ini heads

# 仅对 fresh 空库或已在现役链上的数据库执行升级
docker compose run --rm --entrypoint uv sdnu-chronosync \
  run alembic -c /app/alembic.ini upgrade head
```

PostgreSQL 禁止用 `Base.metadata.create_all()` 或历史修复脚本绕过版本门禁。已有业务表但没有 `alembic_version` 时，按本文件 PostgreSQL 章节执行受限 bootstrap；SQLite 切换 PostgreSQL 时按 [迁移 Runbook](../scripts/migrations/README_PG.md) 执行 fresh cutover。

**常见错误：数据库和配置文件未生效**

如果发现数据库或 config.toml 没有按预期加载，请检查：

```bash
# 1. 确认 PostgreSQL 容器正在运行
docker compose ps db

# 2. 只验证环境文件和必填变量，不回显密钥内容
test -f .env
set -a
. ./.env
set +a
test -n "${POSTGRES_PASSWORD:-}"
test -n "${SECRET_KEY:-}"

# 3. 确认配置文件存在；仅在缺失时复制模板
test -f /path/to/sdnu-data/config/config.toml || \
  cp backend/config.toml /path/to/sdnu-data/config/config.toml

# 4. 重启容器使更改生效
docker compose restart
```

#### 3. 文件上传失败

```bash
# 检查上传目录权限
ls -la data/uploads/

# 修复权限
chmod -R 755 data/uploads/
```

#### 4. 前端资源加载失败

```bash
# 重新构建镜像
docker compose up -d --build

# 检查 nginx 配置
docker compose exec sdnu-chronosync nginx -t
```


#### 5. 访问返回 502，日志提示 `--log-config` 路径不存在

旧镜像的 `supervisord.conf` 可能引用了不存在的 Uvicorn 日志配置。优先从当前源码重新构建镜像，保证代码、`uvicorn_log_config.json` 和 Supervisor 配置一致：

```bash
docker compose up -d --build
```

确实不能重建旧镜像时，才把修正后的 Supervisor 配置挂载到 `/etc/supervisor/conf.d/supervisord.conf:ro`。生产切换到当前镜像后应移除该兼容挂载，避免旧配置长期覆盖镜像内配置。

### 日志查看

```bash
# 应用日志
docker compose logs -f sdnu-chronosync

# 后端API日志
docker compose exec sdnu-chronosync tail -f logs/fastapi.log

# Nginx日志
docker compose exec sdnu-chronosync tail -f logs/nginx.log

# 系统监控
docker compose exec sdnu-chronosync top
```

### 性能优化

默认单 worker 已满足轻量部署。增加 Uvicorn worker 前必须同时核算 PostgreSQL 连接数和内存，并确保所有 worker 使用同一个 `SECRET_KEY`：

```ini
# docker/supervisord.conf 示例
command=uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

每个 worker 最多使用 `DB_POOL_SIZE + DB_MAX_OVERFLOW` 个业务连接，并额外保留 1 个独立健康探针连接。连接池可通过环境变量调整：

```bash
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
```

健康探针连接池固定为单连接，池等待与建连超时均为 2 秒，用于在业务池耗尽时快速返回非就绪。调整 PostgreSQL `shared_buffers`、`effective_cache_size`、`work_mem` 前应基于实际内存和查询负载测量，不使用固定模板值。

## 📞 技术支持

如果遇到问题，请检查：

1. 系统资源是否充足
2. 端口是否被占用
3. 数据目录权限是否正确
4. 防火墙是否阻止访问

更多帮助请查看项目文档或提交Issue。

---

🎉 **部署完成后，访问 https://localhost:1145 开始使用！**
