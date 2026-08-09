---
title: 更新日志
description: SDNUChronoSync 完整版本历史。
sidebar:
  order: 6
---
本文件保留项目全部版本记录；项目首页仅展示最近三个月的版本。

## 📝 更新日志

### v3.6.2 (2026-08-04) - 前端引导脚本回归修复与头像跨域缓存修复

**登录后页面加载修复**

- 修复 v3.6.1 引入的登录后页面卡在"正在加载..."的回归：`<script define:vars>` 会被 Astro 以未打包的内联经典脚本输出，其中的源码级静态 `import` 语句触发浏览器 `Cannot use import statement outside a module`，`initAuth` 从未执行；改为内联变量脚本暴露构建期 changelog 版本，引导脚本按 `type="module"` 正常打包
- 头像跨域缓存请求改为不带凭据（`credentials: 'omit'`）：第三方图床（Alist）返回通配 `Access-Control-Allow-Origin: *` 时浏览器拒绝带凭据请求，此前控制台持续报 CORS 错误

**更新日志弹窗 UI 优化与"有新版本"提示修复**

- 更新日志弹窗按项目组件约定重构：统一使用 ModalTitleCard 头部（图标容器 + 标题），面板收窄为 `max-w-3xl` 并采用 `rounded-xl` 圆角与描边，底部新增操作栏与圆角"关闭"按钮，同时移除标题下冗余的副标题与多余的绝对定位关闭按钮
- 修复"有新版本"徽章与自动弹出从未生效的问题：引导脚本与 Astro 岛组件各自持有独立的 Pinia 实例（`src/pages/_app.ts` 为每个岛新建 store），引导脚本写入的 `hasNewVersion` 标志弹窗组件永远读不到；改为引导脚本广播 `chronosync:changelog-new` 窗口事件，弹窗组件监听事件后自行打开并展示"有新版本"徽章

**登录与加载性能优化**

- 消除页面冗余请求：仪表盘各 Astro 岛（导航、我的课表、邮箱绑定检查、移动端抽屉）此前各自持有独立 Pinia 实例，一次页面加载会并发发起 6 次相同的 `/api/auth/users/me` 请求；改为模块级单飞去重，并发调用共享一次网络请求，401 清 token 仍只执行一次
- `/api/admin/public/site-config` 同样单飞去重（每页 1 次）；两个公开配置端点 `/code-injection`、`/site-config` 增加 `Cache-Control: private, max-age=300`，配置变更不频繁，重复访问命中浏览器缓存
- 更新日志改为按需加载：构建阶段将最近三个月更新日志渲染为 `changelog.json` 静态资源，页面不再内联约 32KB 渲染 HTML（仪表盘首包 99.5KB→56.9KB），点击"更新日志"或检测到新版本时才请求加载
- 部署配置：uvicorn worker 数 1→2，为并发登录留出余量（业务连接池上限 60，低于 PostgreSQL 默认 100）

**验证**

- 前端 lint、类型检查与生产构建通过；构建产物确认引导脚本以 `type="module"` 加载、无经典脚本泄漏 `import`
- 生产重新部署后用真实账号完成登录、课表加载与头像渲染验证
- 浏览器实测更新日志弹窗：新头部与窄面板布局、无副标题、底部操作栏正常；模拟旧版本记录后刷新会自动弹出并显示"有新版本"徽章，版本一致时不打扰；控制台零错误
- 性能修复验证：浏览器实测仪表盘 `/api/auth/users/me` 6→1 次、`/site-config` 每页 1 次；更新日志首次访问自动弹出并加载、二次访问零请求；两公开端点返回 `Cache-Control: private, max-age=300`
- 性能修复质量门槛：前端 lint、类型检查与生产构建通过；后端 compileall、启动冒烟与 pytest 131 passed / 21 skipped（需真实 PostgreSQL）

### v3.6.1 (2026-08-03) - 认证并发、迁移治理与 Docker 可靠性加固

**认证并发与兼容**

- 登录与注册限流计数改为 SQLite/PostgreSQL 原子 upsert，并按各自窗口清理过期状态；并发重复注册统一返回 400
- 邮箱验证码仅保存由统一 `SECRET_KEY` 派生的 HMAC 摘要，发送冷却、失败次数和一次性消费使用条件更新；升级时主动使旧明文验证码失效
- 生产多 worker 继续共享数据库认证状态，并强制使用同一个稳定 `SECRET_KEY`，避免验证码 HMAC 与 JWT 在 worker 间失效

**数据库与运行可靠性**

- `/health` 使用独立单连接、2 秒超时的 PostgreSQL 探针池，业务连接池耗尽时快速返回 503
- 旧 SQLite 启动门禁和专用升级器补齐认证字段、共享状态表与索引；新 Alembic revision `a9f8e7d6c5b4` 清除遗留明文验证码并增加限流清理索引
- PostgreSQL 18 数据卷挂载到 `/var/lib/postgresql`；镜像包含离线迁移工具、排除真实数据库与持久化状态，并用 `frontend/bun.lock` 冻结前端依赖

**站点发现与迁移兼容**

- 新增 `/llms.txt` 与 `/llms-full.txt`，为 LLM/Agent 提供符合 llmstxt.org 提案的站点索引和完整内容入口
- 未版本化 PostgreSQL catalog 的 bootstrap 校验继续以 `c4d5e6f7a8b9` 为基线，排除后续 revision 才新增的认证表和 `users.token_version`，再由 Alembic 升级到 head

**文档与验证**

- 开发规范、完整版本历史和通用部署说明分别集中到[开发指南](/zh/chronosync/development/)、本文件与[部署指南](/zh/chronosync/deployment/)
- 后端完整回归 `152 passed`；前端 lint 为 0 error，类型检查和生产构建通过；真实生产 SQLite 副本已完成 PostgreSQL 18 迁移与应用 smoke
- 更新日志弹窗不再运行时请求外部站点：构建阶段直接读取仓库 `docs/CHANGELOG.md`，渲染最近三个月的版本条目并内联进页面，移除后端代理接口

### v3.6.0 (2026-08-02) - 性能优化、认证安全加固与多 worker 可靠性

**登录性能与密码哈希**

- 登录验密从 bcrypt（cost=12，约 166ms）切换为 argon2id（约 41ms），存量 bcrypt 哈希在登录成功后自动重哈希升级
- 移除已停止维护的 passlib 依赖，密码哈希直连 argon2-cffi（+ bcrypt 仅作存量兼容）

**并发与响应速度**

- 66 个阻塞端点由 `async def` 改为同步 `def`（FastAPI 线程池），登录不再卡死事件循环（登录期间 `/health` 从 168ms 降至 10ms），轻量端点并发不再线性排队
- 新增 `RequestTimingMiddleware`，生产日志输出 `TIMING method path status X.Xms` 每请求耗时，支持定位慢端点
- 课表接口响应体瘦身：个人端点不再嵌套完整 schedule/owner（857KB→735KB），团队聚合端点 3.47MB→1.52MB（243→153ms），筛选端点 349KB→150KB，并消除序列化 N+1
- FastAPI 足以应对当前业务规模；关键性能基线与复测方法维护在[开发指南](/zh/chronosync/development/)的性能章节

**认证安全**

- JWT 增加 `token_version`（payload `tver`）：修改密码、邮箱重置密码、管理员重置密码后，该用户已签发的旧 token 立即失效
- 密码最小长度 6→8（NIST SP 800-63B），前端注册/忘记密码/初始管理员表单同步
- 登录限流（默认 8 次/学号+IP/300s，锁定 600s）、注册 IP 限流（默认 10 次/600s）、邮箱验证码（5 次错误作废、恒定时间比较、一次性消费、60s 发送冷却）全部改为数据库共享存储，`--workers N` 多 worker 部署下限流与验证码正确共享
- 新增 `REGISTER_RATE_LIMIT_MAX_ATTEMPTS` / `REGISTER_RATE_LIMIT_WINDOW_SECONDS` 环境变量；移除 `AUTH_RATE_LIMIT_MAX_KEYS`（DB 存储不再需要）

**数据库可靠性与迁移治理**

- SQLite→PostgreSQL 导库原子化：导入、序列修复、行数核验在同一事务，非空目标拒绝，失败全回滚
- 分享表纳入迁移清单：`temporary_shares` / `team_heatmap_shares` 按外键顺序迁移，修复静默丢数据风险
- Alembic 版本链治理：生产 PostgreSQL 唯一现役 revision 链 + 受限 bootstrap + 应用启动 `current == head` 门禁；旧 SQLite 升级器使用工作副本与原子替换
- Docker Compose 固定 PostgreSQL 主版本，不再使用 `postgres:latest`
- 分享访问计数改为数据库原子表达式更新，消除并发计数丢失
- 同名团队课表数据库级唯一约束，并发只生成一条
- 智能排班日期锚点统一使用目标课表 `start_date`
- 团队创建/导入/成员/管理员操作改为路由级单事务，中途失败整体回滚
- `/health` 增加数据库连接与 schema 版本校验，非就绪返回 503
- PostgreSQL 集成测试接入 CI：迁移、并发、事务、健康验收在真实 PostgreSQL 上运行
- Docker 后端依赖由 `uv.lock` 冻结并 `uv sync --frozen` 构建
- 新 Alembic revision `f0a1b2c3d4e5`：`users.token_version` 列 + `login_rate_limits` / `register_rate_limits` / `verification_codes` 三张共享存储表（PostgreSQL 需执行 `alembic upgrade head`）
- 旧 SQLite 升级器同步补齐 `token_version` 列；PostgreSQL 集成测试 `HEAD_REVISION` 跟随新 head

**测试与文档**

- 扩充 JWT 失效、限流锁定、验证码作废、bcrypt 升级、迁移链和健康检查回归覆盖，当前全量门禁通过

### v3.5.0 (2026-08-01) - WebVPN 校外接入、双账号认证与教务连接安全

**校外 WebVPN 教务接入**

- 课表导入与空教室查询新增 WebVPN 和直连两种连接模式，默认通过学校 WebVPN 工作
- 导入器与空教室查询统一复用 `JwxtAuthSession`，避免两套认证实现发生协议漂移
- 会话与连接模式显式绑定，并按上游要求展示统一身份认证或教务系统验证码
- 新增 WebVPN、直连地址及会话稳定性相关部署参数

**校外部署的直连保护**

- 当前服务器无法访问校园网内教务地址时，前端保留但禁用“直连教务系统”选项
- 明确提示直连模式仅适用于校园网部署，同时保留后端直连能力供后续恢复

**WebVPN 与教务系统双账号认证**

- WebVPN 模式改为两阶段认证：先登录统一身份认证，再在同一会话中输入独立的教务系统账号密码
- 课表导入和空教室查询新增 `auth_stage` 状态及独立 WebVPN 登录接口，未完成第一阶段时禁止访问教务登录
- 两个阶段分别处理验证码；提交完成后立即清空浏览器中的密码字段
- 教务密码错误或上游临时失败时保留已建立的 WebVPN 隧道，重试无需再次完成统一身份认证

**隧道验证与凭据安全**

- WebVPN 登录成功后实际探测隧道内教务登录页，不再仅依赖固定域名或重定向结果判断成功
- 验证码响应必须为图片类型，避免将 WebVPN 登录页或其他 HTML 响应误当作验证码
- WebVPN 与教务系统凭据仅在当前认证请求中使用，不写入数据库、环境变量、缓存或日志
- 补充协议、路由、会话重试和前端阶段切换回归测试，并同步更新安全约定与使用文档

### v3.4.3 (2026-05-29) - 时区一致性、团队热力图与调度可靠性修复

**迁移脚本与文档整理**

- 数据库迁移工作流统一归入 `scripts/migrations/` 目录
- 历史 Alembic 迁移链完整归档到 `scripts/migrations/legacy_alembic/`
- 同步更新[迁移脚本说明](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README.md)中的迁移清单与执行规则

**管理员诊断与上传安全加固**

- 管理员诊断端点增加访问控制与输入校验
- 文件上传管线错误边界收紧，避免异常信息泄露到客户端

**团队热力图与分享链接恢复**

- 修复团队热力图数据聚合不准确的问题，恢复多人忙闲视图的正确展示
- 分享链接管理能力回归：支持有效期、权限配置与二维码展示

**默认课表解析一致性**

- 当前课表解析统一遵循默认课表真相源，不再出现前后端判定不一致的情况

**时区统一：日历与导出遵循上海墙钟时间**

- 日历视图、ICS 导出/导入流程统一按 `Asia/Shanghai` 时区生成与解析事件
- 修复跨时区场景下事件时间偏移导致的课表显示与导出不一致

**调度回归测试场景保留**

- 新增 Team1 调度回归测试场景文档，确保批量排班与智能排班可重复验证

**团队排班预览延迟创建修复**

- 团队排班预览不再提前展示尚未实际创建的事件，保持预览与最终结果一致

**团队插入防漂移修复**

- 批量排班与智能排班插入可复用课表时，事件不再跨周次或日期发生偏移
- 修复复用已有课表写入目标时事件错位的根因

### v3.4.2 (2026-05-28) - 默认课表、共享链接与排班稳定性发布

**后端数据层与迁移**

- `Schedule` 模型新增 `is_default` 字段，支持默认课表机制
- `Schedule` 生命周期开始转向由 `start_date + total_weeks` 推导，隐藏态与默认态单独建模
- 新增分享与协作相关数据结构，并补齐 CRUD / Schema 映射
- 历史 Alembic 迁移链已归档到 `scripts/migrations/legacy_alembic/`；当前默认课表/隐藏课表数据纠偏统一由 `scripts/migrations/add_schedule_visibility_and_default_truth.py` 执行

**默认课表选择与写入策略**

- 后端 `admin`、`import_route`、`schedule`、`schedules` 路由统一默认课表规则
- “当前课表”统一复用默认课表解析，不再单独维护一套判定
- 前端 `ScheduleEditor` 新增“设为默认课表”交互
- 前端课表 Store 在“我的课表”优先加载默认课表
- `frontend/src/types/index.ts` 补充默认课表相关类型定义

**批量排班与智能排班稳定性修复**

- `batch_operations.py` 与 `smart_schedule.py` 支持一致的课表插入目标逻辑（new/default/specific）
- 修复智能排班在冲突、容量与周次分配上的稳定性问题
- 修复批量添加日程与智能排班弹窗首开输入不可直接聚焦的问题

**临时约课与团队热力图分享能力**

- 后端新增临时约课与团队热力图分享路由、公开访问能力与可复用可用性服务
- 前端新增 `TeamAvailabilityShareModal`，支持图片/链接分享、权限与有效期配置、二维码展示
- `AllTeamsViewPage`、`TeamViewPage`、`TemporaryTeamDrawer`、`TeamAvailabilityGrid`、`TeamHeatmapDrawer` 等页面完成分享链路接入
- 新增分享页面入口 `frontend/src/pages/share.astro`，公开视图由 `PublicScheduleView` 承载

**前端性能与层级修复**

- `UserAvatar` 统一走本地缓存策略，基于更新时间控制失效，减少重复头像请求
- 新增 `frontend/src/utils/avatarCache.ts`，在大量成员展示场景下降低带宽开销
- `TeamSlotDetailDrawer` 层级修复，确保不被上层抽屉遮挡

### v3.4.1 (2026-05-28) - UI 打磨、临时约课搜索重构与共同空闲增强

**UI 去 AI 味与布局修复**

- `ScheduleGanttWeekView` 卡片高度从 68px 提升至 82px，行间距 78px → 90px，最小行高 112px → 130px，修复"第 x 周"信息截断
- 甘特图、周列表视图、日程列表统一采用 slate 调色板、rounded-2xl 圆角、柔和阴影，去除默认 AI 模板感
- `TeamMemberStrip` 从圆形首字母头像改为 `UserAvatar` 组件，显示真实头像

**临时约课搜索体验重构**

- `TemporaryTeamDrawer` 移除 watch 自动搜索，改为按钮触发 + Enter 快捷键
- 搜索结果展示：用户头像（`UserAvatar`）、姓名、学号、班级、学院
- 后端 `team.py` 搜索接口和 `temporary.py` 忙闲接口返回 `avatar_url` 和 `college` 字段
- 类型定义 `UserSearchResult`、`AvailabilitySlot` 成员数组同步新增 `avatar_url`、`college`

**共同空闲功能增强**

- `TeamAvailabilityGrid` 新增 PNG 导出功能，标题"第 x 周共同空闲"居中，底部右下角 logo 水印（`/logo.png`，140px，opacity 0.6）
- 点击忙闲格子弹出 `TeamHeatmapDrawer` 详情抽屉，展示该时段空闲/忙碌成员列表（头像 + 姓名 + 课程信息）
- `TeamAvailabilityGrid` 新增 `#header-left` 插槽，临时约课抽屉中周次输入与导出按钮纵向对齐

**团队视图忙闲/热力图整合**

- `TeamViewPage` 将"忙闲视图"与"热力图"合并为单一"闲"视图模式（周/月/闲），移除 `teamViewMode` 独立标签
- `AllTeamsViewPage` 桌面端视图切换按钮组新增"闲"按钮，移动端下拉菜单同步新增"忙闲视图"选项
- 忙闲视图新增成员多选头像选择器（支持全选/清空/单个切换），未选择成员时显示"请先选择要查看的成员"提示
- 点击"应用筛选"立即同步筛选成员并刷新忙闲数据，仅显示筛选成员的忙闲状态
- `getWeekNumber` 从 `TeamViewPage` 本地函数移至 `@/utils/date` 共享工具函数

**导出与剪贴板修复**

- `TeamSlotDetailDrawer` 导出区域重构为展开式面板：多选导出字段（姓名/学号/班级/学院/空闲时间）+ 格式选择（TXT/CSV/EXCEL）+ 独立复制区（姓名/学号/姓名+学号）
- Excel 导出从动态 `import('xlsx')` 改为静态 `import * as XLSX from 'xlsx'`，`astro.config.mjs` 新增 `optimizeDeps.include: ['xlsx']`，修复 Vite 504 Outdated Optimize Dep
- 剪贴板复制新增 `navigator.clipboard` 可用性检测，非 HTTPS 环境自动回退 `document.execCommand('copy')`，修复 `Cannot read properties of undefined (reading 'writeText')`
- 忙碌成员显示简化为橙色姓名标签，移除课程/教室详情

**层级修复**

- `TeamSlotDetailDrawer` z-index 从 `z-50` → `z-[110]` → `z-[200]`，确保可靠覆盖 `TemporaryTeamDrawer`（Headless UI Dialog z-[100]）

### v3.4.0 (2026-05-27) - 团队协作增强、批量排班与智能排班

**团队协作数据层**

- `models.py` 新增 Team 设置字段：`visibility_model`、`allow_member_invite`、`max_members`、`join_policy`、`shift_definitions`、`schedule_config`
- 新增 7 个数据模型：`TeamScheduleTask`（排班任务）、`TeamShiftDefinition`（班次定义）、`TeamScheduledEvent`（排班事件关联）、`TeamBatchOperation`（批量操作记录）、`TeamBatchOperationItem`（批量操作明细）、`TeamRecurringEventRule`（周期排班规则）、`TemporaryTeam`（临时团队）
- `schemas.py` 新增 16 个 Pydantic schema，覆盖排班任务、批量操作、临时团队等场景
- `crud.py` 新增 `get_events_by_schedule_id()`、`create_batch_operation()`、`complete_batch_operation()`
- 新增 Alembic 迁移 `b3c4d5e6f7a8`：teams 表新列 + 7 张新表

**批量排班操作**

- `POST /api/teams/{id}/batch-events/preview`：冲突预览，返回每用户的冲突详情（day_of_week + 时间重叠检测）
- `POST /api/teams/{id}/batch-events/execute`：批量创建课程事件，支持跳过（skip）和强制（force）两种冲突策略
- 冲突去重：按 (user_id, week, day_of_week) 去重，避免同一课程多 Event 行产生重复冲突
- 自动为无课表成员创建「{团队名} 团队日程」Schedule，周一对齐 semester_start
- `GET /api/teams/{id}/batch-operations/{id}`：详情按用户合并（merged weeks/days/title），每用户仅一行
- 支持 `schedule_target` 参数：`default`（使用活跃课表）或 `new`（新建团队日程）

**智能排班系统**

- `POST /api/teams/{id}/schedule-tasks/preview`：预览时运行贪心算法，返回成员分配统计、失败 slot、用户名称映射
- `POST /api/teams/{id}/schedule-tasks`：创建排班任务，自动写入批量操作日志
- 支持两种模式：周次模式（selected_weeks + shifts）和按日期模式（specific_dates，每日期支持 required_count）
- 稳定贪心算法：按 (name, day_of_week) 分组，取所有周次可用人员交集（稳定集合），选恰好 needed 人作为 primary，每周分配相同 primary，仅在冲突时替换
- 替换候选排除已分配人员，max_per_member 全局生效
- 自动推断 semester_start（从 selected_weeks 或 specific_dates）
- FK 安全：失败记录使用 member_ids[0] 而非 user_id=0

**临时团队查询**

- `POST /api/temporary/availability`：查询任意用户组合的可用性，无需加入团队
- 支持日期范围过滤、三级可见度（busy_only / course_title / full_detail）
- 前端 TemporaryTeamDrawer：快速搜索成员、查看多人共同空闲时段

**团队设置扩展**

- 团队编辑模态框重构为 3 个标签页：团队信息、成员管理、团队操作
- 支持配置：可见度模型、入队策略（自由/审批/邀请）、最大成员数、成员邀请开关
- 团队操作标签页整合批量排班和智能排班入口

**PostgreSQL 迁移修复**

- 修复 Alembic 初始 schema 缺少新 teams 列和 7 张新表的问题（`create_all()` 不会 ALTER 已有表）
- 新增 `repair_team_tables.py`：幂等 PG 修复脚本，处理新列、团队协作表及 `temporary_shares`、`team_heatmap_shares` 的完整 DDL和必要索引
- `sqlite_to_postgres.py` 更新 `TABLES_IN_ORDER` 至 18 张表，完整覆盖 `temporary_shares` 与 `team_heatmap_shares`

**前端组件新增**

- `BatchTeamEventModal`：批量排班模态框，HeadlessUI Dialog，冲突预览面板、缺失课表蓝色提示条、课表写入目标选择
- `TeamScheduleTaskModal`：智能排班模态框，药丸式星期选择器、周次/按日期双模式切换、结果展示（成员计数+列表/日历视图）
- `BatchOperationsLog`：批量操作日志面板，内联详情展开（非底部浮层），按用户合并视图
- `TemporaryTeamDrawer`：临时团队查询抽屉，快速搜索成员、共同空闲查看
- `TeamAvailabilityGrid`：颜色编码可用性网格
- `TeamMemberSchedulePanel`：成员个人课表面板
- `TeamMemberStrip`：成员头像条（添加/移除/角色选择）
- `TeamSlotDetailDrawer`：时段详情抽屉

**UI 修复与统一**

- 删除 `CreatorTeamManagement.vue`，功能整合到 `TeamEditorModal` 标签页
- 所有模态框统一 HeadlessUI Dialog 模式（`ModalTitleCard`、`bg-slate-950/40 backdrop-blur-sm` 背景、`ring-1 ring-slate-200/80`、`rounded-xl`、`input-base` 输入框）
- 嵌套模态框层级：父 Dialog 使用 `:static` 禁用 FocusTrap，子 Dialog 使用 `z-[200]`
- `ScheduleEditor` 修复：删除确认弹窗打开时父 Dialog 加 `:static` 防止焦点抢占
- `StackedEventsModal` 使用 `UserAvatar` 组件显示真实头像
- `Navigation` 管理员区字体从 `font-medium` 改为 `font-semibold`

### v3.3.1 (2026-05-27) - 应用内浏览器引导、CI/CD 自动打包与序列修复

**应用内浏览器引导**

- 新增 `frontend/src/utils/inAppBrowser.ts`：检测微信、QQ、企业微信、钉钉、支付宝等应用内浏览器
- 新增 `frontend/src/components/InAppBrowserPrompt.vue`：双模式引导组件（dialog 弹窗 + toast 通知）
- Dialog 模式：首次从应用内打开链接时弹出操作步骤引导，标题前显示地球图标，步骤中显示横排三点菜单图标
- Toast 模式：Dialog 已展示过的当天内再次打开时，以 Toast 通知轻提示
- localStorage 记录弹窗展示时间戳，24 小时内不重复弹出 Dialog；sessionStorage 阻止内链跳转时重复触发
- 接入页面：首页、登录、注册、找回密码、分享课表、我的课表、团队视图（共 7 个页面）
- Toast 系统扩展：`Toast` 接口新增 `iconSvg` 和 `inlineSvg` 字段，`ToastItem` 支持自定义图标和描述内联 SVG 渲染

**CI/CD 自动打包**

- 新增 `.github/workflows/docker-publish.yml`：推送到 main 分支时自动构建 Docker 镜像并打 `latest` + `x.y.z` tag
- 推送 `v*` 格式 git tag 时额外追加该 tag 作为镜像 tag
- AGENTS.md 新增版本号管理章节：列出发布时必须同步修改的 4 处版本号及手动发版流程

**PostgreSQL 序列修复**

- `scripts/migrations/sqlite_to_postgres.py` 新增序列重置步骤：数据导入完成后自动将所有含 `id` 列的表的序列设为 `MAX(id)`
- 修复从 SQLite 迁移数据后新插入记录因序列未重置导致的 `UniqueViolation` 错误

### v3.3.0 (2026-05-26) - PostgreSQL 支持、Alembic 迁移与数据迁移工具

**PostgreSQL 数据库支持**

- 新增 `psycopg[binary]` 驱动依赖，后端支持连接 PostgreSQL 数据库
- `database.py` 新增 `pool_recycle` 参数（默认 1800 秒），防止长时间空闲连接被服务端断开
- 引擎创建时输出数据库类型日志（SQLite/PostgreSQL），不泄露连接串或密码
- `models.py` 关联表 `user_teams` 和 `team_admins` 添加 `ondelete=CASCADE`，PG 删除用户/团队时自动清理关联数据
- `models.py` 索引字段统一添加显式 `String(N)` 长度（student_id=50、full_name=100 等），提升 PG 索引效率

**Alembic 数据库迁移体系**

- 初始化 Alembic，配置从 `DATABASE_URL` 环境变量动态读取连接串
- 新增 `initial_schema` 迁移：PostgreSQL 上创建全部表，SQLite 上跳过（由 `create_all` 处理）
- 新增 `add_performance_indexes` 迁移：为 `schedules(owner_id, status)`、`events(schedule_id, day_of_week)`、`login_records(user_id, login_time)` 创建组合索引
- 后续模型变更统一走 Alembic 迁移，不再使用手动 SQL 脚本

**SQLite 到 PostgreSQL 数据迁移工具**

- 新增 `scripts/migrations/sqlite_to_postgres.py`：当前工具会先校验 SQLite 完整性与 PostgreSQL 目标 schema，再按外键依赖顺序迁移全部 18 张 tracked tables（包括 `temporary_shares` 与 `team_heatmap_shares`）
- 支持 boolean 字段自动转换（SQLite 的 0/1 转为 PG 的 true/false）
- 导入期间保持 PostgreSQL 外键检查开启，`schedule_adjustments` 先于 `events`，不使用 `session_replication_role`
- 当前工具仅接受所有 tracked tables 均为空的目标库，不提供 `--force` 或清表模式；全部插入、序列修复和计数校验位于同一事务，失败会整体回滚并非零退出
- 新增[迁移 Runbook](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README_PG.md)：完整的迁移步骤、验证方法和回滚方案

**Docker Compose 改造**

- `docker-compose.yml` 新增 `db` 服务（`postgres:latest`），带健康检查和 `postgres_data` 持久化卷
- 应用服务 `DATABASE_URL` 改为 PostgreSQL 连接串，`depends_on` 加入数据库健康检查
- 删除废弃的 `version` 属性和未定义的网络引用
- 新增 `.env.example` 和 `backend/.env.example`，提供 `POSTGRES_PASSWORD`、`SECRET_KEY`、连接池等配置模板

**文档更新**

- [部署指南](/zh/chronosync/deployment/)新增“数据库配置”章节：PostgreSQL 连接池参数、`pg_dump`/`pg_restore` 备份恢复、从 SQLite 迁移的步骤
- [项目说明](/zh/chronosync/)技术栈更新：数据库从 SQLite 改为 SQLite/PostgreSQL（推荐生产环境使用 PostgreSQL）

### v3.2.0 (2026-05-18) - UI视觉收敛、认证表单统一与移动端导航优化

**UI视觉收敛与排版优化**

- 移除基础输入框/按钮/下拉组件的默认阴影，仅保留浮层与模态框阴影，界面更加简洁清爽
- 圆角体系统一：输入框统一为 rounded-lg(8px)、列表卡统一为 rounded-xl(12px)，移除 22px/28px/32px 大圆角
- 删除 BaseLayout 中全局强制 border-radius: 1rem 规则，恢复组件自主控制圆角
- 标题字重从 font-black/font-bold 统一降为 font-semibold，正文对比度从 gray-500 提升至 slate-600，提升可读性
- 移除全大写标签与高 tracking（Day Agenda 改为当日安排），恢复中文界面正常词形
- PageHeaderCard 移除渐变背景/阴影/ring，改为纯边线容器，视觉更轻量
- Navigation 侧边栏从 shadow-sm ring 改为 border-r 分隔，管理员区 red 改为更低饱和的 rose
- MyTeamsPage 指标区与团队代码区去除卡片嵌套，改为扁平信息展示
- 危险操作色从 red 统一改为 rose，降低饱和度，减少视觉攻击性

**认证表单UI统一**

- 登录/注册/找回密码表单统一使用 input-base CSS 类，替换内联样式
- 标准化圆角从 rounded-xl 统一为 rounded-lg，保持视觉一致性
- 简化按钮样式，移除渐变背景和阴影效果
- 移除 AuthShell 装饰性背景元素和丝带动画，回归简洁设计
- 统一颜色变量从 gray 改为 slate，保持调色板一致性
- 简化卡片样式，移除 backdrop-blur 和毛玻璃效果

**移动端底部标签栏**

- 新增 MobileBottomTabBar 移动端底部快速导航栏，包含课表、团队、空教室、个人四个高频功能入口
- 标签栏固定在视口底部，仅在 lg 断点以下显示（lg:hidden）
- 支持 iPhone 安全区域适配（env(safe-area-inset-bottom)），避免遮挡 Home 指示器
- 主内容区域自动添加 pb-20 底部间距，防止标签栏遮挡内容
- 现有移动端顶部栏、抽屉、侧边栏和桌面端布局保持不变

### v3.1.2 (2026-03-23) - 调休稳定性、课表视图细化与 ICS 兼容修复

**调休与教程入口修复**

- 调休请求改为显式校验模型，放假与换课不再因为联合类型解析歧义而触发 422；调休确认步骤也改成模态框内覆盖层，避免嵌套确认弹窗导致焦点丢失和表单状态错乱。
- 教程链接常量同步到最新文章锚点，首页、导入弹窗、调休页和团队页内的教程入口现在会跳到正确章节。

**课表工作台与日程查看体验**

- 登录成功后的默认落点统一改为 `/dashboard/my-schedule`，即使 `redirect=/` 也不会再回到主页。
- 周列表视图重新压缩了头部与卡片排版，教师/地点信息固定到右上角 badge 下方，整张卡片可直接点击查看课表详情。
- 甘特图周视图改为“行是日期、列是时间”的横向布局，支持点击课程查看详情、重叠课程分 lane 展示、横向滚动与更接近单元格占比的课程卡片。
- 甘特图时间轴进一步改为“课内按真实分钟比例、超长空档按压缩比例”显示，像 `10:10-11:45` 会按时间准确落位，而午休和晚间长空档不会再被拉成与一节课等长的巨大空白。

**ICS 导入导出与前端工程化**

- 修复 ICS 导出时中文课表名导致的响应头编码报错，下载文件名改为兼容 RFC 5987 的写法。
- 导出流程显式使用 `calendar.serialize()`，并统一按 `Asia/Shanghai` 时区生成事件；导入流程新增 `utf-8-sig`、`utf-8`、`gb18030` 编码兼容与时区归一化，保证导出后可稳定回导。
- 前端新增可执行的 ESLint 基线与 `bun run lint` 脚本，现有历史 warning 暂保留为非阻塞，但本地质量门槛已补齐为 `lint + type-check + build`。

### v3.1.1 (2026-03-09) - 交互修复、管理员邮箱持久化与 Python 3.12 兼容

**工作台与弹层交互修复**

- 统一课表页、团队视图、管理员页面和分享面板的下拉菜单样式，移动端分享面板重新整理为更紧凑的纵向布局，二维码尺寸与间距同步优化。
- "我的课表"在没有可用课表、课表已过期或当前未激活时，仍会保留新建课表、导入课表和教程入口，不再出现只能返回上一层的空状态。
- 课表设置、团队筛选、分享有效期、系统设置等下拉菜单统一改为基于组件容器的外部点击关闭；带搜索的下拉现在会保持实底搜索区，点击搜索框不会误选下方条目。
- `PickerPopover` 通用日期/时间选择器补充窄屏最小宽度、边缘避让和视口夹取逻辑，竖屏下选中日期的圆形不再被裁剪。
- 预设头像抽屉在手机竖屏下改为贴底显示，整个分类卡片都可直接展开；Profile、系统设置、放假调休等页面的 Tab 外框与内部按钮圆角同步统一。

**认证、模态框与管理员流程**

- 退出登录后返回首页；退出后的下一次登录默认进入 `/dashboard/my-schedule`，普通登录流程仍支持按站内 `redirect` 参数回跳。
- 课表编辑弹窗顶部"创建/保存"按钮重新绑定到底层表单，团队管理和课表删除确认移除原生 `confirm/alert`，统一使用项目确认弹窗和 Toast 提示。
- 管理员在后台创建或编辑用户时填写的邮箱现在会端到端保存，后端会自动做 trim、去重和大小写规范化，避免用户登录后仍被误判为未绑定邮箱。

**后端兼容与开发稳定性**

- 修复 Python 3.12 环境下 ICS 相关路由启动失败的问题：补齐 `rich` 运行时依赖、将 `tatsu` 约束在兼容版本，并在导入 `ics` 前回填旧版依赖所需的 `collections` 别名。
- `CodeEditor` 改用原生 `ResizeObserver` 替代 `@vueuse/core` 的 `useResizeObserver`，降低 Vite 开发态 `Outdated Optimize Dep` 报错概率。
- 为课表弹出选择器、下拉菜单守卫、登录回跳、管理员邮箱保存等场景补充前后端回归测试。

### v3.1.0 (2026-03-07) - 资料增强、团队卡片重构与课表多视图升级

**个人资料与团队元数据**

- 后端新增 `users.bio`、`teams.description`、`teams.cover_image_url` 字段，并补充迁移脚本 `add_profile_bio_and_team_metadata.py` 与 schema 测试。
- 个人中心支持编辑个人简介，头像设置新增预设头像抽屉；团队创建与团队管理支持团队介绍、团队图标上传和预设图标选择。
- 团队图标 URL 新增白名单校验与统一上传管线，兼容本地存储和已配置的 HTTPS 外部存储域名。

**课表工作台与演示体验**

- 我的课表页面重构为顶部信息卡 + 多视图工作区，新增课表周视图、日历日视图、甘特图周视图、周列表视图。
- 个性化设置支持单色/多彩卡片两种模式，当前时间指示线、即将开始课程高亮和提醒样式同步升级。
- 首页 `PerspectiveSchedule` 改为基于真实 demo 课程数据展示三种日程演示，不再只展示空骨架。
- 分享面板新增二维码预览与更清晰的有效期说明；导入、导出、调休、分享等弹窗统一改版。

**统一交互层与稳定性**

- 新增 `PickerPopover` 通用弹出式日期/时间选择器，支持在抽屉、弹窗和移动端视口中自适应定位，统一替换课表、筛选、调休、导入等原生日期时间输入。
- 新增 `PageHeaderCard`，并重构 `ModalTitleCard` 为带吸顶标题栏和操作区的统一弹窗头部组件，覆盖个人中心、团队、系统设置、分享等页面。
- 更新日志代理新增缓存与离线回退机制，前端在 `fallback` 状态下不再误报新版本。
- `astro.config.mjs` 追加 DiceBear 依赖预构建排除，降低开发态组件水合和预构建缓存异常。

### v3.0.0 (2026-02-18) - 首页重构与认证交互统一

**首页与引导体验**

- 首页从登录入口页升级为完整落地页，新增主题 Hero、功能展示区、CTA 区与交互演示模块。
- 新增 `LandingNavbar` 登录态菜单：已登录用户可直接进入工作台/个人中心，退出登录回到首页。
- Hero 区"井然有序"标题下方波浪下划线加粗为单条连续 SVG 波浪（`stroke-width 8.5`，`preserveAspectRatio=none` 全宽拉伸，不再平铺）。
- 教程按钮移至 Hero CTA 行，与注册/登录/特色功能并排展示，移除原独立教程区块。
- `PerspectiveSchedule` 3D 课表演示新增自动轮播课程详情弹窗动画（仿 `EventDetailModal` 样式），当前时间指示线旁新增 11:45 时间标签。
- 新增 `ShareShowcase`：课表分享演示，含图片导出、链接分享、ICS 导出三标签页，ICS 标签页含 Apple 日历与 Google 日历导入进度动画。
- 新增 `ImportShowcase`：教务系统导入演示，含示例账号密码输入动画与导入进度展示。
- 新增 `TeamManageShowcase`：团队创建与管理页面轮换动画，展示 2025ACM集训队、2026环梦工坊编程竞赛组等真实场景团队。
- `FeatureSection` 集成上述三个新演示组件，功能描述更新（分享功能新增 ICS/Apple/Google 日历说明）。
- 核心流程新增教程快捷入口，覆盖导入课表、高级调休、团队协作等场景。

**UI 交互细节**

- 新增 `NavTooltip` 通用悬停提示组件，支持 `top`/`bottom`/`right` 三方向、`disabled` 禁用、`block` 全宽模式，带平滑淡入/淡出动画。
- 侧边栏导航（`Navigation`）折叠状态下所有图标按钮悬停显示 Tooltip（右侧弹出）；展开状态下主题切换与收起按钮悬停显示 Tooltip（底部弹出）。
- 落地页顶部导航栏（`LandingNavbar`）各链接与主题切换按钮均集成 Tooltip。
- `PasswordInput` 显示/隐藏密码按钮悬停显示"显示密码"/"隐藏密码" Tooltip，自动覆盖全部 9 处使用场景（登录、注册、找回密码、个人中心、教务导入、管理员等）。
- 侧边栏折叠时 `overflow` 切换为 `visible`，确保 Tooltip 不被容器裁剪。

**认证与表单体验**

- 登录/注册/找回密码页面统一迁移到 `AuthShell`，保持视觉与交互一致。
- 注册、找回密码、强制绑定邮箱、个人中心邮箱验证统一使用 `OtpInput` 多格验证码输入。
- 认证与空教室登录表单统一为 Toast 校验反馈，发送验证码流程统一空值/格式/冷却/并发提示。
- `PasswordInput` 组件修复显示按钮点击穿透问题，并支持 `revealed` 可选受控模式。

**课表与日历能力**

- 月视图重构为 `MonthSplitView` 分栏布局（左侧月历 + 右侧当日课表），提升浏览与点击效率。
- 新增 `calendar-grouping.ts` 抽离按天取数与课程分组逻辑，减少周/月视图重复实现。
- 修复课表页面 SSR/CSR 水合不一致问题。
- 当前时间指示器支持颜色与粗细配置，并同步应用到个人课表与团队演示视图。

**管理界面与弹层稳定性**

- 管理员用户列表与团队列表操作菜单支持按视口空间自动向上/向下展开。
- 全站下拉菜单、弹窗、抽屉等交互层级统一，减少遮挡和误触。
- 多个管理与编辑弹窗完成布局与信息层级优化，提升桌面与移动端可读性。

**工程与依赖**

- 前端依赖升级：`astro` 更新到 `5.17.2`，`@astrojs/vue` 更新到 `5.1.4`。
- Vite 预构建排除 `@headlessui/vue`，缓解开发态 `Outdated Optimize Dep` 导致的水合异常。
- 前端开发脚本统一为 `astro dev --force`，每次启动强制刷新依赖缓存。
- 后端空教室楼宇映射修正：长清湖校区楼名统一为 `文淙楼信工`、`文淙楼心理`。
- Dockerfile 修复：移除对 `bun.lock` 与 `uv.lock` 的硬依赖（`bun.lock` 已在 `.gitignore` 中排除，原构建命令 `--frozen-lockfile` / `--frozen` 导致 GitHub Actions 持续失败）；前端改为 `bun install`，后端改为 `uv sync --no-dev`，依赖层缓存仍以 `package.json` / `pyproject.toml` 为键。
- Dockerfile 优化：将 6 条独立 `ENV` 指令合并为单条多行声明，减少镜像层数。

**后端安全、性能与稳定性**

- 登录接口增加失败限流与锁定机制，并对限流状态增加周期清理和容量上限，降低暴力破解与高基数请求导致的内存增长风险。
- 教务系统导入与空教室查询链路补充 HTTPS 规范化、请求超时控制、会话缓存 TTL/容量治理与并发安全更新，减少上游异常时的级联影响。
- 课表状态计算抽离为统一工具函数，`/api/schedules` 与 `/api/import/schedules` 读取路径仅在状态变化时写库，减少无效 `commit` 带来的数据库开销。
- 后端运行与部署链路统一迁移到 `uv`（`uv sync` / `uv run`），Docker 构建与 Supervisor 启动命令同步更新。
- 新增后端 API 冒烟脚本 `backend/scripts/smoke_httpx_lifespan.py`，使用 `ASGITransport + Lifespan` 验证启动与基础路由可用性。

### v2.9.4 (2026-01-27) - 页脚链接与密码输入体验统一

**前端体验**

- 页脚新增快捷入口：使用教程、更新日志、关于项目、项目主页（图标复用导航栏风格），放置在版权信息之前。
- 密码输入框统一使用 `PasswordInput` 组件，并确保每个输入框的显示/隐藏状态互不影响（避免“密码”与“确认密码”联动切换）。

### v2.9.3 (2026-01-27) - 安全加固与部署文档完善

**后端安全与健壮性**

- JWT `SECRET_KEY` 机制加固：生产环境（`APP_ENV=production` 或 `ENV=production`）必须显式设置 `SECRET_KEY`，避免默认弱密钥；开发环境自动生成进程级临时密钥并提示（重启会导致 token 失效）。
- OAuth2 tokenUrl 路径统一为 `/api/auth/token`，避免认证流程在不同环境下路径不一致。
- 邮箱相关请求统一使用 `EmailStr` 校验，并对邮箱做规范化（trim + lowercase），登录/绑定/注册查重为大小写不敏感。
- 邮箱验证码改为使用 `secrets` 生成（更安全），并增加过期清理与容量上限，避免内存增长；发送失败不再回传底层异常细节。

**管理后台配置（避免泄露敏感信息）**

- 系统设置接口不再返回已保存的 `email.password`、`alist.token`、`alist.password` 明文，新增 `has_password/has_token` 仅用于提示“已保存但已遮蔽”。
- 保存系统设置时，若前端提交敏感字段为空字符串，后端保留原有值，避免误清空。
- 连接测试接口支持在请求未携带敏感字段时复用已保存的密钥进行测试。

**前端认证与表单体验**

- 修复开放重定向风险：`redirect` 仅允许站内路径（`/path`），拒绝外部 URL 与可疑格式。
- 认证失败/401 跳转统一携带 `redirect=当前路径`，登录后可返回原页面；分享页登录/注册跳转使用“路径+query+hash”作为回跳来源。
- 登录/注册/找回密码表单增强：密码显示/隐藏、补充 `autocomplete`，提交前对输入做 trim/lowercase；验证码倒计时在组件卸载时清理，避免定时器泄漏。
- 系统设置页适配遮蔽密钥字段：显示“已保存，如需修改请重新输入”，并调整“测试连接”可用条件。

**部署与开发文档**

- 部署文档与 README：补充容器部署关键环境变量（`APP_ENV`/`SECRET_KEY`）、统一 `docker compose` 命令示例、修正容器内数据库备份路径为 `/app/data/schedule_app.db`。
- 开发启动脚本 `scripts/start_dev.sh` 前端依赖安装与启动改为 `bun install` / `bun run dev`（不再使用 npm）。

### v2.9.2 (2026-01-26) - 学院字段与资料表单完善

**用户信息**

- 新增“学院”字段：注册、个人中心、管理员编辑用户均为必填下拉选择（仅允许从预置列表选择）
- 个人中心：头像设置卡片高度自适应，避免左右卡片高度差异导致底部空白

**数据库迁移**

- 新增迁移脚本：`scripts/migrations/add_college_field.py`（升级到 v2.9.2+ 需先执行，详见[迁移脚本说明](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README.md)）

### v2.9.1 (2026-01-22) - 课表引导与下拉体验修复

**体验修复**

- 我的课表：当用户没有任何课表时，在页面提示中增加《创建你的第一张课表》教程链接，引导完成课表创建
- 个人中心：年级下拉选择的搜索框层级修复，避免被列表选项遮挡

### v2.9.0 (2026-01-03) - 登录与交互体验优化

**登录与认证**

- 🔐 **支持邮箱登录**
  - 后端认证支持使用 `student_id` / `email` 登录
  - 前端登录与错误提示文案同步为“学号/邮箱”

**年级选择体验**

- 🎓 **新增年级下拉选择组件**
  - 新增 `GradeDropdown`，支持搜索/自定义（管理员）/自动从学号推断
  - 注册、个人中心、管理员编辑用户统一使用下拉选择

**课表事件查看体验**

- 🗓️ **新增事件详情弹窗**
  - 点击事件先查看详情，具备权限时可一键进入编辑
  - 适配个人课表、团队事件、管理员查看用户课表
  - 移动端弹窗宽度与间距优化；日历层级（z-index）调整避免遮挡

**后台管理 UI**

- 🛠️ **管理列表交互优化**
  - 用户管理表格勾选列合并头像展示，筛选/操作菜单层级修复
  - 批量恢复确认 Toast 仅在客户端挂载，避免 SSR/水合问题
  - 团队管理列表操作改为菜单，减少按钮拥挤

**开发脚本与日志**

- 🧰 **开发启动脚本增强**
  - `scripts/start_dev.sh` 增加严格模式与输出优化，支持 `ENABLE_HTTP2=1`
- 📜 **初始管理员输出更稳健**
  - 初次创建管理员时额外输出到 stderr，提升在 reload/日志重定向下的可见性

### v2.8.2 (2026-01-03) - 前端首屏性能与部署静态资源优化

**前端性能优化**

- 🖼️ **导出功能按需加载 html2canvas**
  - `MySchedulePage.vue` 导出课表图片时改为动态 `import('html2canvas')`
  - `frontend/src/utils/export.ts` 导出 PDF 时动态加载 html2canvas，减少首屏包体积

- ⚡ **Astro 组件水合策略优化**
  - `ToastContainer`、`EmailBindingChecker` 从 `client:load` 调整为 `client:idle`，延后非关键组件水合
  - `Footer` 从 `client:load` 调整为 `client:visible`，仅进入视口时加载（首页/登录/注册/找回密码/仪表盘等页面）

**侧边栏状态同步优化**

- 🧭 **事件驱动替代轮询**
  - UI Store 在侧边栏状态变更时派发 `sidebar-toggle` 事件
  - `DashboardLayout.astro` 移除 100ms 的 localStorage 轮询回退逻辑，改为事件监听更新布局，降低无意义 CPU 占用

**部署与 Nginx 优化**

- 🌐 **静态资源缓存与压缩**
  - `/assets/`（Vite hash 资源）启用 1 年缓存并标记 `immutable`
  - `.html` 禁用缓存，避免发布后用户命中旧 HTML 指向旧资源
  - 公共图片/图标启用 7 天缓存（无 hash）
  - 启用 gzip（JS/CSS/JSON/SVG 等常见类型）
  - `location ^~ /static/avatars/` 优先匹配，避免被图片正则 location 抢占
  - PID 写入 `/tmp` 且日志输出到 stdout/stderr，便于容器化运行

### v2.8.1 (2025-12-23) - 批量导入导出与日志系统优化

**批量导入导出功能**

- 📥 **CSV批量导入用户**
  - 新增用户CSV模板下载功能（`/api/admin/users/import-template.csv`）
  - 支持从CSV文件批量导入用户，自动创建账户
  - 导入结果详细反馈：成功数、跳过数、失败数及错误详情
  - 前端新增 `CsvImportModal.vue` 组件处理CSV上传和进度显示

- 📥 **CSV批量导入/更新团队**
  - 新增团队CSV模板下载功能（`/api/admin/teams/import-template.csv`）
  - 支持创建新团队和更新现有团队（基于团队名称匹配）
  - 自动同步团队成员和管理员列表（通过学号）
  - 导入响应新增 `updated_count` 字段，区分新增和更新操作
  - 前端显示"新增X，更新Y，跳过Z"的详细统计信息

- 📤 **增强的导出功能**
  - 用户/团队管理支持导出为CSV、Excel、PDF三种格式
  - 新增统一的导出工具函数（`frontend/src/utils/export.ts`）
  - 导出文件名包含精确时间戳（年-月-日_时-分格式）
  - 团队导出新增"成员学号列表"和"管理员学号列表"列
  - Excel导出使用xlsx库，PDF导出使用jsPDF+html2canvas
  - CSV导出添加UTF-8 BOM，确保Excel正确显示中文

**空教室查询优化**

- 🏫 **UI简化与体验提升**
  - 移除缓存会话功能，简化登录流程
  - 移除"记住登录"复选框和本地存储交互
  - 导出选项整合为下拉菜单（CSV/Excel/PDF）
  - 优化按钮样式和布局，提升界面一致性
  - 导出文件名包含精确时间戳

**模态框系统重构**

- 🎨 **Headless UI集成**
  - 所有模态框迁移至Headless UI的Dialog组件
  - 统一的过渡动画和可访问性支持
  - 重构组件：`CreatorTeamManagement`、`DissolveTeamModal`、`JoinTeam`、`LeaveTeamModal`、`MyTeamsPage`、`ScheduleAdjuster`、`ScheduleEditor`、`TeamEditorModal`
  - 移除内联成功/错误消息，统一使用Toast通知
  - 模态框宽度优化（`TeamEditorModal` 从 max-w-2xl 扩展至 max-w-4xl）

**用户管理增强**

- 👥 **批量操作与模态框优化**
  - `BanUserModal` 重构为Headless UI组件，支持封禁/解封双模式
  - 新增 `BatchRestoreConfirmToast` 组件用于批量恢复确认
  - 用户管理页面集成批量恢复和封禁功能模态框
  - 表格支持固定表头（sticky headers），大数据量下滚动更流畅
  - Toast通知增强：成功操作和错误处理的详细反馈
  - 下拉菜单z-index优化（z-40/z-50），避免被其他元素遮挡

**后端日志系统升级**

- 📊 **结构化日志集成**
  - 全面替换print语句为logging调用
  - 新增集中式日志配置（`backend/uvicorn_log_config.json`）
  - 实现跨模块的统一日志格式和处理
  - 增强错误追踪和调试能力
  - 改进组件：
    - 配置管理（`config.py`）
    - CRUD操作（`crud.py`）
    - 导入流程（`importer.py`）
    - API路由（`routers/schedules.py`）
    - 邮件服务（`services/email.py`）
    - 服务器启动（`start_server.py`）
  - 数据库初始化和事件导入的详细日志记录
  - ICS导入/导出过程的调试信息优化
  - Docker supervisord配置更新，集成uvicorn日志配置

**技术改进**

- ✅ 新增前端工具：`utils/export.ts` - 统一的导出工具函数
  - `exportToCsv()` - CSV导出（带UTF-8 BOM）
  - `exportToXlsx()` - Excel导出
  - `exportToPdf()` - PDF导出（支持多页分页）
  - `downloadBlob()` - 文件下载辅助函数
- ✅ 新增后端端点：
  - `GET /api/admin/users/import-template.csv` - 用户导入模板
  - `POST /api/admin/users/import-csv` - 批量导入用户
  - `GET /api/admin/teams/import-template.csv` - 团队导入模板
  - `POST /api/admin/teams/import-csv` - 批量导入/更新团队
- ✅ API客户端扩展：
  - `downloadUserImportTemplate()` - 下载用户模板
  - `importUsersFromCsv()` - 导入用户CSV
  - `downloadTeamImportTemplate()` - 下载团队模板
  - `importTeamsFromCsv()` - 导入团队CSV
- ✅ 日志配置文件：`backend/uvicorn_log_config.json`
- ✅ Docker配置更新：supervisord集成日志配置参数

### v2.8.0 (2025-12-22) - 空教室查询与UI体验全面优化

**新增功能**

- 🏫 **空教室查询系统**
  - 新增空教室查询功能，支持查询山东师范大学各校区空闲教室
  - 独立的教务系统会话管理，不影响平台登录状态
  - 支持按时间段、教学楼、教室类型等条件筛选
  - 新增 `/dashboard/classroom` 页面和 `EmptyClassroomQuery.vue` 组件
  - API 请求自动跳过全局错误处理，避免 token 失效误判

**CORS 配置增强**

- 🌍 **动态 CORS 配置**
  - 新增 `ALLOWED_ORIGINS` 环境变量支持动态配置允许的跨域来源
  - 支持逗号分隔多个域名，灵活适配不同部署环境
  - 更新 `docker-compose.yml` 和 `env.example` 配置示例
  - README 新增详细的 CORS 配置指南（本地开发、Docker、Docker Compose）

**管理功能优化**

- 👥 **用户管理增强**
  - 用户角色筛选逻辑重构，支持更精细的筛选条件
  - 新增封禁类型筛选：全部封禁、账号封禁、IP封禁、邮箱封禁
  - 角色显示优化，封禁用户显示具体封禁类型文本
  - 用户管理表格支持固定表头，大数据量下滚动更流畅
  - 新增 `getBanStatusText()` 辅助函数，统一封禁状态显示

- 📊 **批量操作工具栏**
  - 新增 `BatchActionBar.vue` 组件，提供统一的批量操作界面
  - 支持批量删除、批量封禁、批量恢复用户
  - 集成下拉菜单，操作更直观高效
  - 实时显示已选择项数量

**团队管理优化**

- 👥 **团队成员信息增强**
  - 团队编辑模态框显示成员邮箱地址
  - 未绑定邮箱显示"未绑定邮箱"提示
  - 邮箱地址支持截断显示，鼠标悬停查看完整内容

**UI/UX 改进**

- 🎨 **自定义滚动条样式**
  - 新增 `.scrollbar-custom`、`.scrollbar-custom-x`、`.scrollbar-custom-both` 工具类
  - 统一的细滚动条设计（6px 宽度），提升视觉美观度
  - 支持纵向、横向、双向滚动条自定义
  - 滚动条 hover 时颜色加深，交互反馈更明显

- 📋 **固定表头与滚动优化**
  - 用户管理、登录记录等大表格支持固定表头（sticky top-0）
  - 表格内容区域最大高度限制（max-h-[70vh]），超出自动滚动
  - 新增 `.table-container-fixed`、`.table-content-scroll` 等工具类
  - 模态框内表格同样支持固定头部和滚动内容

- 🎯 **模态框布局优化**
  - 新增 `.modal-header-fixed`、`.modal-content-scroll`、`.modal-footer-fixed` 工具类
  - 模态框头部和底部固定，内容区域可滚动
  - 统一的模态框布局规范，提升一致性

**代码质量提升**

- 🧹 **代码清理与优化**
  - 移除未使用的导入（`ArrowDownTrayIcon`、`ClipboardDocumentIcon` 等）
  - 修复 `ProfilePage.vue` 中的函数引用错误（`handleCardFileUpload`）
  - 优化 API 工具类，支持按 URL 跳过全局错误处理
  - 改进类型定义，增强代码可维护性

**技术改进**

- ✅ 新增前端组件：
  - `EmptyClassroomQuery.vue` - 空教室查询组件
  - `BatchActionBar.vue` - 批量操作工具栏
- ✅ 新增页面路由：
  - `/dashboard/classroom.astro` - 空教室查询页面
- ✅ Tailwind 配置扩展：
  - 新增滚动条自定义样式工具类
  - 新增固定表头/模态框布局工具类
- ✅ API 工具优化：
  - `shouldSkipGlobalErrorHandler()` 方法支持按 URL 跳过错误处理
  - 教务系统相关请求不触发平台登出逻辑

### v2.7.4 (2025-12-20) - 代码注入白名单提示完善与Docker环境变量修复

**代码注入体验与可观测性**

- 🚦 **系统设置页告警提示**
  - 后端 `GET /api/admin/settings` 会返回代码注入校验 `warnings`，用于前端展示。
  - 当 `config.toml` 预置的代码注入包含不被允许的域/标签/属性时：
    - 配置仍会正常加载（不影响服务启动）。
    - 系统设置 → 代码注入会展示红色告警并高亮对应（Header/Body）编辑器。

**部署修复**

- 🐳 **Docker 环境变量**
  - Docker 镜像内默认补充 `CODE_INJECTION_ALLOWED_HOSTS=analytics.hxcn.dev`，避免生产环境因未加载本地 `.env` 导致白名单缺失。

### v2.7.3 (2025-12-20) - TypeScript类型安全增强与UI交互优化

**类型系统增强**

- 🔧 **TypeScript类型完善**
  - 扩展 User 类型，新增 `status` 和 `schedules` 可选字段，支持用户状态和课表关联。
  - 导入会话接口新增 `source` 字段（'real' | 'fallback'），标识验证码来源。
  - 导航组件新增 `NavItem` 类型定义，支持外部链接和按钮点击事件。
  - Toast 容器样式函数返回类型明确为 `CSSProperties`，增强类型安全。
  - 事件模态框 `delete` 事件类型从可选改为必需，统一删除逻辑。

- 📝 **表单输入类型安全**
  - 筛选侧边栏输入事件使用 `HTMLInputElement` 类型断言。
  - 事件模态框周数输入使用空值合并运算符（`??`）替代逻辑或（`||`）。
  - 课表编辑器状态选择函数参数类型明确为 `'进行' | '结束' | '隐藏'`。

**UI/UX改进**

- 🎨 **侧边栏折叠功能**
  - 新增可折叠侧边栏，支持展开/收起状态持久化（localStorage）。
  - 折叠状态下显示图标和展开按钮，节省屏幕空间。
  - 主内容区域和页脚自动适应侧边栏宽度（lg:pl-72 ↔ lg:pl-20）。
  - 使用 UI Store 管理折叠状态，支持跨组件同步。
  - 轮询机制确保同标签页内状态实时更新。

- 👤 **个人资料页面重设计**
  - 邮箱绑定/更换功能集成到个人资料页面。
  - 新增邮箱验证码发送功能，支持60秒冷却。
  - 修改密码时，已绑定邮箱的用户需要输入邮箱验证码。
  - 统计卡片重新设计：课表数、课程数、注册时间三列布局。
  - 安全概览卡片展示最近登录设备、IP、浏览器信息。
  - 用户头像支持 2xl 和 3xl 尺寸（w-24/h-24 和 w-32/h-32）。

**管理功能优化**

- 👥 **用户管理界面改进**
  - 用户课表信息显示使用可选链操作符（`?.`），避免空值错误。
  - 封禁状态判断从 `role === 'banned'` 改为 `status !== 'normal'`。
  - 用户课表模态框 API 调用统一使用 `createScheduleEvent` / `updateScheduleEvent` / `deleteScheduleEvent`。

**Bug修复**

- 🐛 **ICS导入修复**
  - 修复从文件导入课表时未携带认证 Token 的问题。
  - 使用 localStorage 获取 access_token 并添加到请求头。
  - 导出函数参数使用空值合并确保类型安全。

- 🔧 **环境变量类型声明**
  - 新增 `env.d.ts` 文件，声明 Vite 环境变量类型。
  - 定义 `ImportMetaEnv` 接口，包含 `VITE_API_BASE_URL` 可选字段。

**技术改进**

- ✅ 新增 UI Store 方法：
  - `initSidebarState()` - 初始化侧边栏状态
  - `toggleSidebar()` - 切换侧边栏展开/收起
  - `setSidebarCollapsed(value)` - 设置侧边栏状态
- ✅ 布局响应式优化：主内容区和页脚支持过渡动画（transition-all duration-300）
- ✅ 类型安全提升：移除类型断言，使用明确的类型定义
- ✅ 代码质量改进：使用现代 TypeScript 语法（可选链、空值合并）

### v2.7.2 (2025-12-20) - 管理员安全增强与UI体验优化

**安全增强**

- 🔐 **管理员密码变更追踪**
  - 新增 `password_changed` 字段追踪管理员是否已修改默认密码。
  - 首次启动的管理员必须修改密码才能解除安全警告。
  - 移除基于 localStorage 的检查，改用数据库字段追踪。
  - 新增迁移脚本：`scripts/migrations/add_password_changed_field.py`

**UI/UX改进**

- 🎨 **个人资料页面重设计**
  - 采用 shadow-sm、ring-1 和 rounded-xl 样式重新设计个人资料卡片。
  - 响应式布局：移动端垂直居中，桌面端水平左对齐。
  - 优化角色徽章样式，添加 ring-1 ring-inset 提升视觉一致性。
  - 使用响应式网格布局重新组织个人信息展示。

- 🎯 **通知系统统一化**
  - `FirstStartAdminModal` 和 `MySchedulePage` 替换 alert 对话框为 Toast 通知。
  - 密码修改成功/失败显示详细的 Toast 提示。
  - ICS 导入功能改用 Toast 显示导入数量或错误详情。

- 📤 **分享功能增强**
  - `ShareOptionsModal` 新增 scheduleId 属性，未选课时禁用链接分享。
  - 重新设计模态框布局：水平标题栏、描述文本、关闭按钮。
  - `ShareScheduleView` 添加撤销确认对话框，防止误操作。
  - 使用统一的 useToastStore 替代分散的 Toast 通知。

**管理界面增强**

- 👥 **用户管理界面优化**
  - `UserEditModal` 新增邮箱输入字段，支持验证。
  - `UserManagementPage` 表格新增邮箱列显示，未绑定显示"未绑定"。
  - 更新 User 和 UpdateUserRequest 类型，添加可选邮箱字段。
  - 表单提交时自动处理邮箱去除首尾空格和 null 转换。

**配置管理优化**

- ⚙️ **配置热重载支持**
  - 新增 CONFIG_TOML_PATH 和 CONFIG_PATH 环境变量支持自定义配置路径。
  - 实现配置文件修改时自动热重载机制。
  - 通过 _last_mtime 追踪文件修改时间，透明地检测配置变更。
  - 使用 pathlib.Path 实现跨平台路径处理。

- 📝 **代码注入配置改进**
  - 空的代码注入字段从 `""` 改为 `''' '''`（多行字符串）。
  - 保持内容为空的同时使用 TOML 多行字符串语法。
  - 提升配置文件可读性和 TOML 规范一致性。

**邮件系统修复**

- 📧 **模板变量语法修复**
  - HTML 模板中替换 `{code}` 和 `{year}` 为 `$CODE` 和 `$year`。
  - 更新 Template.substitute() 调用，使用大写的 CODE 占位符。
  - 确保使用 Template 字符串插值而非 f-string 格式化。

**数据库迁移优化**

- 🗄️ **迁移脚本改进**
  - 修正课表分享迁移脚本的备份文件名格式：`schedule_app.db_backup_`。
  - 修正迁移脚本中的数据库相对路径：从 `backend/` 改为 `../../backend/`。
  - 新增 `add_password_changed_field.py` 迁移脚本，支持 `--db-path` 和 `--skip-backup` 参数。

**文档完善**

- 📚 **部署指南增强**
  - 新增版本特定的迁移需求说明，包含升级路径。
  - 记录 v2.6.0+ 和 v2.7.0+ 升级的必需迁移。
  - 添加每个迁移脚本的版本引入日期。
  - 包含多版本升级的执行顺序说明和备份警告。

### v2.7.1 (2025-12-19) - 安全加固与受控注入升级

**安全增强**

- 🔐 **管理员初始化安全加固**
  - **移除硬编码默认口令**：首次启动（数据库无管理员）自动创建 `student_id=admin` 管理员，并生成一次性随机强口令。
  - **一次性输出**：初始口令仅在后端启动日志中以 `[SECURITY]` 前缀输出一次；请首次启动后立即保存。
  - **强制修改提醒**：默认管理员首次登录会弹出不可跳过的提示，引导尽快修改密码。

- 🧩 **受控代码注入机制升级（统计脚本 / 样式表 / Meta）**
  - **从任意 HTML 注入收敛为结构化条目**：后端解析/校验后输出 `script/link/meta` 结构化数据，前端通过 DOM API 渲染（不再使用任意 HTML 注入）。
  - **外域白名单**：外部资源必须为 `https://` 且 host 必须在环境变量 `CODE_INJECTION_ALLOWED_HOSTS` 中（多个域名逗号分隔）。
  - **失败即关闭（fail-closed）**：校验失败会拒绝保存，公开端点返回空列表。
  - **CSP 同步**：如新增统计域名，需要同步更新反代层 CSP（Docker 示例见 `docker/nginx.conf`）。

- 🪪 **头像 URL 校验**
  - 仅允许本地头像路径（`storage.local.base_url` 下）或 HTTPS 且 host 属于配置存储域名（`storage.alist.url`/`storage.alist.access_domain`），降低 XSS/追踪风险。

- 🧾 **上传日志脱敏（AList/第三方上传）**
  - 结构化日志替换调试输出，对 `Authorization/token/password/cookie` 等敏感字段脱敏。
  - 避免在错误详情中返回第三方响应体，降低凭证泄露风险。

### v2.7.0 (2025-12-18) - 邮箱验证与用户封禁体系升级

**核心功能**

- 📧 **邮箱验证与绑定系统**
  - **注册邮箱验证**：新用户注册时必须验证邮箱，通过SMTP发送验证码。
  - **强制邮箱绑定**：老用户登录后强制补录邮箱（全屏模态框，无法关闭）。
  - **邮箱配置管理**：管理后台支持配置SMTP服务器（用户名、密码、服务器地址、端口、加密方式）。
  - **测试邮件功能**：支持发送测试邮件验证SMTP配置是否正确。
  - **验证码冷却**：60秒发送间隔限制，防止滥用。
  - **邮箱服务**：支持SSL/TLS/Plain三种加密方式，兼容QQ邮箱、163邮箱等主流邮箱服务商。

- 🔐 **找回密码功能**
  - **自助重置密码**：用户可通过学号+邮箱+验证码重置密码。
  - **安全验证流程**：验证学号存在、邮箱已绑定、验证码正确后才能重置。
  - **独立找回页面**：新增 `/forget` 页面，登录页添加"忘记密码"入口。

- 🛡️ **用户封禁体系升级**
  - **多种封禁类型**：支持账号封禁（ban）、IP封禁（ipban）、邮箱封禁（emailban）三种封禁方式。
  - **状态字段重构**：新增 `status` 字段（normal/ban/ipban/emailban）替代原有 `role` 字段的封禁逻辑。
  - **封禁UI优化**：用户管理页面支持下拉选择封禁类型，显示当前封禁状态。
  - **登录拦截增强**：封禁用户无法获取登录Token，返回403错误。
  - **管理员绕过**：系统管理员可绕过IP封禁限制。
  - **邮箱封禁检查**：发送验证码时检查邮箱是否被封禁。

- 🎨 **Toast通知系统**
  - **全局Toast组件**：HeroUI风格的顶部右侧Toast通知系统。
  - **3D堆叠效果**：多个Toast支持3D堆叠显示，hover时展开。
  - **进度条指示**：自动倒计时进度条（默认3000ms）。
  - **多种类型**：支持success/error/warning/info四种通知类型。
  - **全局单例模式**：解决Astro多Vue island状态分裂问题。
  - **SSR兼容**：修复Teleport导致的hydration警告。
  - **全面替换**：所有表单、模态框的成功/错误提示统一使用Toast。

**邮件模板升级**

- 📨 **现代化邮件设计**
  - **品牌化模板**：包含Logo、图标、配色方案的专业邮件模板。
  - **响应式设计**：完美适配桌面和移动端邮件客户端。
  - **中文编码修复**：使用RFC 2047编码正确显示中文发件人名称。
  - **动态年份**：邮件页脚版权信息使用动态年份。
  - **视觉层次**：改进排版、图标、按钮样式，提升专业度。

**系统优化**

- 🗄️ **数据库迁移**
  - **自动迁移脚本**：`add_email_and_status_fields.py` 自动添加email和status字段。
  - **数据迁移**：将现有 `role='banned'` 用户迁移到 `status='ban'`。
  - **自动备份**：迁移前自动备份数据库文件。
  - **幂等性保证**：脚本支持重复执行，跳过已存在的字段。

- ⚙️ **配置管理优化**
  - **移除config.toml**：站点配置、存储配置、代码注入配置改用环境变量。
  - **邮箱配置集成**：系统设置接口新增邮箱配置（EmailConfig）。
  - **配置完整性检查**：`is_email_config_complete()` 辅助函数检查SMTP配置是否完整。

**UI/UX改进**

- ✨ **交互体验提升**
  - **统一通知系统**：所有成功/错误消息使用Toast，移除内联提示。
  - **邮箱绑定检查器**：登录后自动检查邮箱绑定状态，未绑定则强制绑定。
  - **封禁确认弹窗**：BanUserModal支持封禁/解封双模式，替代原生confirm()。
  - **QQ邮箱提示**：系统设置中输入@qq.com时显示授权码申请提示。
  - **163邮箱提示**：提示163/126/yeah.net邮箱需要使用授权码。

**技术改进**

- ✅ 新增后端服务：`services/email.py` - 邮件发送与验证码管理
- ✅ 新增前端组件：
  - `EmailBindingChecker.vue` - 强制邮箱绑定检查器
  - `ForceBindEmailModal.vue` - 强制绑定邮箱模态框
  - `ForgetPasswordForm.vue` - 找回密码表单
  - `BanUserModal.vue` - 封禁用户确认弹窗
  - `ToastContainer.vue` / `ToastItem.vue` - Toast通知组件
- ✅ 新增API端点：
  - `POST /send-verification-code` - 发送邮箱验证码
  - `POST /bind-email` - 绑定邮箱
  - `GET /email-required` - 检查邮箱是否必填
  - `POST /reset-password` - 重置密码
  - `POST /test-email` - 测试邮件连接
- ✅ 新增Schemas：
  - `SendVerificationCodeRequest/Response` - 验证码请求/响应
  - `BindEmailRequest` - 绑定邮箱请求
  - `ResetPasswordRequest` - 重置密码请求
  - `BanUserRequest` - 封禁用户请求（含ban_type）
  - `EmailConfig` - 邮箱配置模型
- ✅ 数据模型更新：
  - User模型新增 `email` 和 `status` 字段
  - UserPublic schema新增 `status` 字段

**安全增强**

- 🔒 **验证码安全**：60秒冷却时间，防止暴力破解
- 🔒 **封禁Token拦截**：封禁用户在authenticate_user阶段被拦截，无法获取JWT
- 🔒 **邮箱封禁检查**：发送验证码前检查邮箱是否被封禁
- 🔒 **管理员保护**：管理员跳过强制邮箱绑定流程
- 🔒 **向后兼容**：使用hasattr()安全检查status字段，兼容旧数据

### v2.6.0 (2025-12-17) - 课表分享与站点配置系统

**核心功能**

- 🔄 **全功能课表分享系统**
  - **分享链接生成**：支持为任意课表生成唯一的公开访问链接。
  - **权限控制**：支持三种权限模式（仅查看、需要登录访问、允许导入副本）。
  - **有效期管理**：可设置 7 天、30 天、半年、永久等多种有效期。
  - **课表导入**：访问者可将分享的课表一键保存到自己的账户中。
  - **分享管理**：独立的分享管理面板，支持查看访问次数、撤销分享。

- ⚙️ **站点配置管理系统**
  - **动态站点信息**：在管理后台直接修改网站名称、描述、SEO 关键词。
  - **品牌个性化**：支持自定义站点 Logo 和 Favicon 图标。
  - **多源图标支持**：支持使用系统预设图标、外部图片 URL 或本地上传图片（需配置 AList）。
  - **代码注入**：支持配置全局统计代码（Analytics Code）。
  - **实时预览**：配置修改即使生效，提供所见即所得的预览功能。

**UI/UX 改进**

- 🎨 **视觉体验升级**：全面使用 Heroicons 图标库替换原有 Emoji，提升界面专业度与一致性。
- 📅 **课表编辑器优化**：统一的输入框与下拉菜单样式，新增自定义状态选择组件，支持"恢复默认"操作。
- 📝 **代码编辑器增强**：配置编辑器支持深色模式与自动换行（Word Wrap）切换。
- 🧩 **模态框优化**：改进模态框层级管理（Z-index），修复连接测试结果显示方式。

**系统与运维**

- 🐳 **Docker 优化**：修复 Docker 构建依赖问题，优化基础镜像，新增自动发布工作流。
- 📂 **脚本规范化**：重组 `scripts` 目录，归档数据库迁移脚本与启动脚本。
- 🛡️ **数据安全**：迁移脚本增加自动数据库备份功能。

### v2.5.4 (2025-11-02) - 团队筛选权限修复与只读成员课表

**问题修复**

- 修复：普通成员/团队管理员在团队视图筛选他人课表时出现 403 或筛选结果为空的问题。现在会在筛选请求中自动携带当前团队 `team_ids` 并在请求前同步视图对应的日期范围；当存在筛选条件时，日历优先使用过滤结果进行渲染。（前端 `TeamViewPage.vue`、`stores/schedule.ts`）

**新增功能**

- 新增：只读的“成员课表查看”面板，供团队创建者/团队管理员使用。支持周/月视图、日期导航，以及从过滤接口汇总生成的“课表选择”下拉；非系统管理员不再调用管理员专用接口。（前端 `UserScheduleViewer.vue`、`TeamEditorModal.vue`）

**其他修复**

- 修复：`UserScheduleViewer.vue` 模板缺失闭合标签导致的编译错误。

### v2.5.3 (2025-11-01) - 团队管理权限与复选框点击修复

**问题修复**

- 修复：以团队创建者身份从 CreatorTeamManagement 打开 TeamEditorModal 无法进行任何操作的问题。通过在模态框挂载时初始化认证状态，确保权限判断生效，与 AdminTeamManagement 行为一致。（前端 `TeamEditorModal.vue`）
- 修复：成员列表与“全选”复选框需要点击视觉中心下方才会触发的问题。调整元素层级与指针事件，确保复选框视觉中心处点击即可正确响应。（前端 `TeamEditorModal.vue`）

**影响范围**

- 仅前端交互与权限判定逻辑，无后端改动。
- 既有管理员入口行为不受影响。

### v2.5.2 (2025-10-31) - 中国大陆网络优化与加载加速

**网络与性能优化**

- 移除 Google Fonts 与 Material Icons 外链，改用本地/系统字体栈，避免在中国大陆网络环境下因 `fonts.googleapis.com` 阻断引发的 `net::ERR_SOCKET_NOT_CONNECTED`。
- 更新 Tailwind `sans` 字体栈为中文友好系统字体（PingFang SC、Microsoft YaHei、Noto Sans SC、Source Han Sans SC 等），提升可读性与加载速度。
- 减少第三方阻塞请求，加快登录页与仪表板首屏渲染，改善部分安卓设备加载过慢问题。
- 在弱网/受限网络环境下提升稳定性，避免外部资源加载失败导致的渲染卡顿。

### v2.5.1 (2025-10-30) - 模态框交互体验优化

**可访问性增强**

- ♿ **模态框焦点管理**：改进用户交互流程
  - EventModal 添加初始焦点管理，自动聚焦到取消按钮
  - UserScheduleModal 增强焦点控制，提升键盘导航体验
  - TeamEditorModal 优化嵌套模态框交互逻辑
- 🎯 **嵌套模态框处理**：防止意外关闭
  - TeamEditorModal 在日程模态框打开时阻止关闭
  - 保护用户操作流程，避免数据丢失
  - 优化模态框层级管理
- ⌨️ **键盘交互优化**：提升无障碍访问
  - 响应式焦点引用管理
  - 改进 ESC 键和点击外部区域的行为
  - 确保焦点始终在可操作元素上

**技术改进**

- ✅ 引入 `initialFocusRef` 响应式引用
- ✅ 重构模态框关闭逻辑，支持条件关闭
- ✅ 统一焦点管理策略，提升用户体验
- ✅ 完善模态框组件的可访问性标准

### v2.5.0 (2025-10-30) - 登录记录管理与用户体验全面优化

**安全增强功能**

- 🔐 **登录记录管理系统**：完整的用户登录追踪功能
  - 新增 LoginRecord 模型，记录用户登录时间、IP地址、用户代理信息
  - 支持查看最近登录记录和完整登录历史
  - 管理员可查看所有用户的登录记录，增强安全监控
- 🛡️ **用户封禁与恢复**：完善的管理员工具
  - 新增用户封禁功能，支持管理员封禁违规用户
  - 用户封禁后无法登录系统，返回503错误页面
  - 支持解封恢复功能，灵活管理用户状态
- 📊 **登录历史集成**：用户管理增强
  - 用户管理页面新增登录记录查看功能
  - 个人资料页面集成登录历史展示
  - 提升用户对账户活动的透明度

**用户体验优化**

- 🎨 **更新日志功能**：新增版本更新追踪
  - 新增 ChangelogModal 组件展示更新内容
  - 后端代理接口避免CORS问题
  - UI状态管理新版本通知
  - 导航栏集成更新日志入口
- 🎯 **模态框系统重构**：统一交互体验
  - 使用 Headless UI 的 Dialog 和 Transition 组件
  - 增强可访问性和动画效果
  - 统一团队管理模态框样式和行为
  - 实现 Teleport 渲染，提升视觉层次
- 📋 **批量操作增强**：管理员效率提升
  - 新增 BatchActionBar 组件支持批量操作
  - 用户管理页面集成批量删除、封禁、恢复功能
  - 团队管理支持批量成员操作
  - 增强确认删除模态框支持批量操作

**界面与交互优化**

- 🎨 **下拉菜单统一设计**：视觉一致性提升
  - 新增统一下拉样式配置
  - 支持搜索过滤功能的下拉菜单
  - 优化选择器交互体验
- 📝 **输入框样式标准化**：表单视觉升级
  - 统一输入框基础样式
  - 增强搜索输入框视觉效果
  - 提升整体表单美观度
- ⏳ **加载状态优化**：更流畅的等待体验
  - 增大加载指示器尺寸，提升可见性
  - 优化字母间距，改善可读性
  - 统一加载动画样式

**日历与事件管理**

- 📅 **堆叠事件处理**：复杂课表场景支持
  - 新增 StackedEventsModal 处理同时间段多课程
  - 支持团队和个人视图的事件堆叠显示
  - 优化事件点击和模态状态管理
- 🔄 **课程时间更新**：课时调整标准化
  - 更新第10-11节课时间设置
  - 前后端时间计算逻辑同步
  - 优化事件重叠检测算法

**团队管理优化**

- 👥 **管理权限细分**：更精细的权限控制
  - 区分创建团队和管理团队权限
  - 支持查看可管理的团队列表
  - 优化团队操作权限判断逻辑
- 🏗️ **团队生命周期管理**：完整流程支持
  - 创建、管理、转让、解散全流程
  - 二次确认机制防止误操作
  - 团队转让和解散的完整记录

**系统优化**

- 🚀 **加载指示器统一**：性能与视觉提升
  - 新增 ButtonLoadingSpinner 和 PageLoadingSpinner 组件
  - 替换所有旧式加载指示器
  - 统一加载状态视觉风格
- 🗂️ **功能结构调整**：简化管理界面
  - 移除日程管理功能模块
  - 用户管理页面整合用户日程显示
  - 简化管理员导航结构
- 📖 **文档清理**：项目结构优化
  - 移除 FEATURE_GUIDE.md 文档
  - 调整文档策略和内容管理方式

### v2.4.0 (2025-10-22) - 团队管理员功能与权限增强

**新增功能**

- ✨ **团队管理员角色系统**：支持团队内部的分层管理
  - 新增团队管理员（Team Admin）角色，区别于系统管理员和团队创建者
  - 团队创建者可以将普通成员提升为团队管理员
  - 团队管理员拥有成员管理、课表管理等权限
  - 支持团队管理员降级为普通成员
- ✨ **团队管理员API接口**：
  - `POST /api/teams/{team_id}/admins/{user_id}` - 提升成员为团队管理员
  - `DELETE /api/teams/{team_id}/admins/{user_id}` - 移除团队管理员权限
- ✨ **增强的权限控制**：
  - 团队管理员可以管理团队成员（添加、移除）
  - 团队管理员可以编辑团队信息
  - 保护机制：不能移除团队创建者和系统管理员
  - 权限层级：系统管理员 > 团队创建者 > 团队管理员 > 普通成员

**后端改进**

- ✅ 新增 `team_admins_table` 关联表，支持多对多的团队管理员关系
- ✅ 新增 CRUD 函数：
  - `is_team_admin()` - 检查用户是否为团队管理员
  - `add_team_admin()` - 添加团队管理员
  - `remove_team_admin()` - 移除团队管理员
- ✅ 优化权限检查函数 `check_team_admin_permission()`
  - 支持系统管理员、团队创建者、团队管理员三种角色
- ✅ 增强成员移除逻辑：
  - 移除成员时自动清除其团队管理员权限
  - 禁止移除团队创建者
  - 禁止移除系统管理员
- ✅ 所有团队查询接口增加 admins 字段加载

**前端优化**

- ✅ 新增 `canAdminManage()` 函数判断管理权限
  - 团队管理员可以看到"管理团队"按钮
  - 普通成员显示"退出团队"按钮
- ✅ 团队响应数据包含管理员列表信息
- ✅ 优化团队管理界面的权限显示

**数据模型变更**

- ✅ Team 模型新增 `admins` 关系字段
- ✅ TeamResponse schema 新增 `admins` 字段
- ✅ 自动数据库迁移支持

### v2.3.0 (2025-10-14) - UI优化与品牌升级

**新增功能**

- ✨ **课表操作菜单重构**：全新的"更多"按钮设计
  - 整合5大核心功能：添加日程、导入课表、导出课表、放假调休、课表设置
  - 统一的模态框交互，提升用户体验
  - 响应式设计，完美适配移动端和桌面端
- ✨ **ICS文件导入增强**：优化导入流程
  - 新增导入选项弹窗，支持ICS文件和教务系统两种导入方式
  - 图标化界面，操作更直观
  - 详细的导入结果反馈
- ✨ **导出选项弹窗**：简化导出操作
  - 统一的导出入口
  - 支持PNG图片和ICS文件两种格式
  - 一键选择，快速操作
- 🎨 **品牌视觉升级**：增强品牌形象
  - 添加多种尺寸的favicon图标（PNG、JPG、SVG）
  - 优化网站图标显示效果
  - 提升浏览器标签页识别度

**UI/UX优化**

- ✅ 使用Heroicons图标库，统一视觉风格
- ✅ 优化按钮布局，减少界面复杂度
- ✅ 改进响应式断点设置
  - 移动端（< 640px）：图标优先显示
  - 桌面端（>= 640px）：图标+文字组合显示
- ✅ 优化操作流程，减少页面跳转

**技术改进**

- ✅ 新增`ImportOptionsModal.vue`组件
- ✅ 新增`ExportOptionsModal.vue`组件
- ✅ 重构`MySchedulePage.vue`操作按钮区域
- ✅ 优化文件上传和下载逻辑

### v2.2.1 (2025-10-07) - 代码清理与优化

**优化改进**

- 🧹 **代码清理**：移除所有测试和废弃代码
  - 删除示例用户创建代码
  - 移除数据库迁移脚本
  - 清理控制台调试日志
  - 删除临时捕获文件和备份文件
- ✅ **功能验证**：完成前后端功能测试
  - 后端API接口测试通过
  - 前端页面加载正常
  - 用户认证功能正常
- 📖 **文档更新**：更新README.md
  - 移除测试账户相关说明
  - 更新项目结构描述
  - 修正API接口文档说明

### v2.2.0 (2025-10-07) - ICS导入功能与UI优化

**新增功能**

- ✅ **ICS文件导入**：支持从标准ICS文件导入课表事件
  - 兼容苹果日历、Google Calendar、Outlook等主流日历应用
  - 自动计算事件的周数和星期几
  - 智能跳过早于课表开始日期的事件
  - 详细的导入结果反馈（成功数量、失败原因）
- ✅ **统一操作菜单**：重构课表页面UI
  - 新增"更多"按钮，整合5大核心功能
  - 添加日程、导入课表、导出课表、放假调休、课表设置
  - 模态框式交互，操作流程更清晰
- ✅ **导入选项弹窗**：新增 `ImportOptionsModal.vue` 组件
  - 支持从ICS文件导入
  - 支持从教务系统导入
  - 图标化界面，操作直观
- ✅ **导出选项弹窗**：新增 `ExportOptionsModal.vue` 组件
  - 导出为PNG图片
  - 导出为ICS文件
  - 一键选择，快速操作

**后端改进**

- ✅ 新增API端点：`POST /api/schedules/import-ics`
- ✅ ICS文件解析与验证逻辑
- ✅ 周数和星期自动计算算法
- ✅ 完善的错误处理和日志记录

**UI/UX优化**

- ✅ 响应式"更多"按钮设计（移动端/桌面端自适应）
- ✅ 使用 Heroicons 图标库统一视觉风格
- ✅ 优化操作流程，减少页面跳转
- ✅ 提升移动端使用体验

### v2.1.1 (2025-09-30) - 品牌升级

**品牌更新**

- ✅ **正式命名**：系统正式命名为"时序同笺 (SDNUChronoSync)"
- ✅ **界面更新**：导航栏、登录页、注册页全面使用新名称
- ✅ **文档完善**：README 更新品牌信息
- ✅ **导航增强**：新增"使用教程"和"关于"外部链接
  - 使用教程：https://hs.cnies.org/archives/chronosync-user-guide
  - 关于本项目：https://hs.cnies.org/archives/chronosync
- ✅ **用户体验**：所有页面统一品牌形象

### v2.1.0 (2025-09-30) - 团队管理系统完整升级

**核心功能增强**

- ✅ **团队所有权转让**：创建者可以安全转让团队管理权限给其他成员
- ✅ **团队解散功能**：带二次确认的团队解散流程，永久删除团队及成员关系
- ✅ **成员退出机制**：普通成员支持自主退出团队
- ✅ **高级筛选系统**：团队课表支持按成员、班级、年级多维度筛选
- ✅ **课程冲突识别**：智能识别和显示同一时间段的课程冲突
- ✅ **创建者管理面板**：专属的高级团队管理界面，统一管理所有创建的团队

**新增组件**

- ✅ `CreatorTeamManagement.vue` - 创建者高级管理面板
- ✅ `TransferTeamModal.vue` - 团队转让确认流程
- ✅ `DissolveTeamModal.vue` - 解散团队二次确认
- ✅ `LeaveTeamModal.vue` - 退出团队确认
- ✅ `TeamEventDetailModal.vue` - 课程冲突详情显示
- ✅ `FilterSidebar.vue` - 多条件组合筛选侧边栏

**后端架构改进**

- ✅ 团队转让接口：`POST /api/teams/{id}/transfer`
- ✅ 权限检查函数：`check_team_admin_permission()` / `check_team_member_permission()`
- ✅ 活跃课表筛选：只聚合 status="进行" 的课表
- ✅ 管理员全局监控：`GET /api/admin/teams` 获取所有团队统计

**UI/UX 优化**

- ✅ 移动端侧边筛选抽屉，完美适配小屏幕
- ✅ 实时状态反馈，所有操作提供即时成功/错误提示
- ✅ 团队卡片重新设计，清晰展示创建者/成员角色
- ✅ 统计卡片展示：我的团队数、创建的团队数、总成员数

### v2.0.0 (2025-09-28) - 高级调休与团队协作系统基础

**重大功能更新**

- ✅ **多课表管理系统**：支持创建和管理多个课表
- ✅ **高级调休功能**：节假日设置与智能换课系统
- ✅ **基础团队协作**：基于邀请码的团队创建和加入
- ✅ **权限分层管理**：系统管理员、团队创建者、普通成员三级权限
- ✅ **团队课表聚合**：查看团队所有成员的课程安排
- ✅ **调休记录管理**：支持撤销和修改调休设置
- ✅ **实时数据同步**：调休和团队变更立即生效
- ✅ **导航系统升级**：新增"我的团队"功能入口
- ✅ **API架构扩展**：新增团队和调休相关接口
- ✅ **数据库模型扩展**：新增 Team、user_teams_table、ScheduleAdjustment 模型

**技术改进**

- ✅ 服务器端调休逻辑处理，确保数据一致性
- ✅ 完善的错误处理和用户反馈机制
- ✅ 响应式UI适配新功能
- ✅ TypeScript类型系统完善
- ✅ 向后兼容性保证

### v1.2.0 (2025-09-27)

- ✅ 个人资料管理系统
- ✅ 头像上传功能（本地存储/AList支持）
- ✅ 密码修改功能
- ✅ 系统设置管理
- ✅ 教务系统课表导入

### v1.1.0 (2025-09-26)

- ✅ 多课表支持
- ✅ 课表导入功能
- ✅ ICS格式导出
- ✅ 课表状态管理
- ✅ 课程详细信息

### v1.0.0 (2025-09-25)

- ✅ 基础功能完成
- ✅ 用户认证系统
- ✅ 个人日程管理
- ✅ 团队视图功能
- ✅ 管理员功能
- ✅ 响应式 UI 设计
- ✅ 多平台支持
