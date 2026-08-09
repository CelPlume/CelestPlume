---
title: 系统架构与技术参考
description: 项目目录结构、各模块职责与 REST API 接口清单。
sidebar:
  order: 4
---
> 本文档集中维护项目目录结构与 REST API 接口清单（自 README 迁移，2026-08-05）。
> 架构概览：前端 Astro + Vue 3 + TypeScript + Tailwind CSS；后端 FastAPI（Python 3.10+）；
> 前后端分离，生产以单容器部署（Nginx 反代 + Supervisor 托管），数据库 PostgreSQL（开发可用 SQLite）。

## 📁 项目结构

```
SDNUChronoSync/
├── backend/                 # 后端代码
│   ├── main.py             # 应用入口
│   ├── models.py           # 数据模型 (User, Schedule, Event, ScheduleAdjustment, Team, LoginRecord, ScheduleShare, TeamScheduleTask, TeamBatchOperation等)
│   ├── schemas.py          # Pydantic 模式 (包含团队、调休、登录记录、批量操作、智能排班相关模式)
│   ├── crud.py             # 数据库操作 (团队CRUD + 调休记录 + 登录记录 + 批量操作管理)
│   ├── auth.py             # 认证逻辑
│   ├── database.py         # 数据库配置 (含user_teams_table, team_admins_table关联表)
│   ├── config.py           # 系统配置
│   ├── compat.py           # Python 3.12 / 旧版依赖兼容补丁
│   ├── utils.py            # 工具函数
│   ├── importer.py         # 教务系统导入
│   ├── pyproject.toml      # Python 项目定义（uv）
│   ├── uv.lock             # Python 依赖锁文件（uv）
│   ├── requirements.txt    # 兼容性依赖清单
│   ├── uvicorn_log_config.json  # Uvicorn日志配置
│   ├── alembic.ini         # 历史 Alembic 配置（兼容保留，不再作为新增迁移入口）
│   ├── scripts/
│   │   └── smoke_httpx_lifespan.py # 后端 API 冒烟脚本（ASGITransport + Lifespan）
│   ├── services/           # 服务层
│   │   ├── email.py        # 邮件发送与验证码管理服务
│   │   ├── uploader_service.py  # 文件上传服务（头像/团队图标通用上传管线）
│   │   └── availability.py # 团队可用性与忙闲计算服务
│   ├── tests/
│   │   ├── test_profile_team_metadata.py      # 资料与团队元数据 schema 测试
│   │   ├── test_admin_user_update_email.py    # 管理员修改用户邮箱回归测试
│   │   ├── test_importer.py                   # 教务系统导入测试
│   │   ├── test_schedule_adjustment_request.py # 调休请求校验测试
│   │   ├── test_schedule_ics.py               # ICS 导入导出测试
│   │   └── test_team_schedule_insert_logic.py # 团队排班插入逻辑测试
│   └── routers/            # API 路由
│       ├── auth.py         # 认证路由（含登录记录、邮箱验证、找回密码）
│       ├── schedule.py     # 个人日程路由
│       ├── schedules.py    # 多课表+调休管理+ICS导入/导出路由
│       ├── team.py         # 完整团队管理路由（含团队设置、成员日程查询）
│       ├── admin.py        # 管理员路由（含用户封禁、登录记录查询）
│       ├── admin_settings.py # 系统设置路由（含站点配置、代码注入、邮箱配置）
│       ├── import_route.py # 教务系统导入路由
│       ├── profile.py      # 个人资料路由（含登录历史）
│       ├── share.py        # 课表分享路由
│       ├── temporary.py    # 临时团队可用性查询路由
│       ├── classroom.py    # 空教室查询路由
│       ├── batch_operations.py # 批量排班操作路由（冲突检测、跳过/强制策略）
│       └── smart_schedule.py   # 智能排班路由（贪心算法、周次/按日期双模式）
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   │   ├── ScheduleAdjuster.vue      # 调休管理组件（节假日+换课）
│   │   │   ├── ScheduleCalendar.vue      # 日历视图组件（支持调休、堆叠事件）
│   │   │   ├── calendar/MonthSplitView.vue # 月视图分栏（日历+当日课表）
│   │   │   ├── ScheduleEditor.vue        # 课表编辑器
│   │   │   ├── ScheduleGanttWeekView.vue # 甘特图周视图
│   │   │   ├── ScheduleDayListView.vue   # 周列表视图
│   │   │   ├── ScheduleImporter.vue      # 教务系统导入
│   │   │   ├── ImportOptionsModal.vue    # 导入选项弹窗（ICS/教务系统）
│   │   │   ├── ExportOptionsModal.vue    # 导出选项弹窗（PNG/ICS）
│   │   │   ├── ShareOptionsModal.vue     # 分享/导出选项弹窗
│   │   │   ├── ShareScheduleView.vue     # 分享管理面板
│   │   │   ├── PublicScheduleView.vue    # 公开课表只读视图
│   │   │   ├── ImportScheduleModal.vue   # 导入分享课表模态框
│   │   │   ├── EmptyClassroomQuery.vue   # 空教室查询组件
│   │   │   ├── MySchedulePage.vue        # 个人课表页面（含调休、分享功能）
│   │   │   ├── MyTeamsPage.vue           # 我的团队管理页面（创建/加入/列表）
│   │   │   ├── TeamViewPage.vue          # 团队课表聚合视图（筛选+冲突识别+批量排班+智能排班入口）
│   │   │   ├── AllTeamsViewPage.vue      # 全团队视图页面
│   │   │   ├── TeamEditorModal.vue       # 团队编辑模态框（3标签页：团队信息+成员管理+团队操作）
│   │   │   ├── AvatarPresetDrawer.vue    # 头像/团队图标预设抽屉
│   │   │   ├── BatchTeamEventModal.vue   # 批量排班模态框（冲突预览+跳过/强制策略+课表写入目标选择）
│   │   │   ├── TeamScheduleTaskModal.vue # 智能排班模态框（周次/按日期模式+成员分配预览+列表/日历视图）
│   │   │   ├── BatchOperationsLog.vue    # 批量操作日志面板（按用户合并视图+状态筛选）
│   │   │   ├── TemporaryTeamDrawer.vue   # 临时团队查询抽屉（快速多人空闲查询）
│   │   │   ├── TeamAvailabilityGrid.vue  # 团队成员可用性网格（颜色编码+点击选择）
│   │   │   ├── TeamAvailabilityShareModal.vue # 团队可用性分享模态框（图片/链接/二维码）
│   │   │   ├── TeamMemberSchedulePanel.vue # 团队成员个人课表面板
│   │   │   ├── TeamMemberStrip.vue       # 团队成员头像条（添加/移除+角色选择）
│   │   │   ├── TeamSlotDetailDrawer.vue  # 团队时段详情抽屉（成员列表+冲突信息）
│   │   │   ├── TeamHeatmapDrawer.vue     # 团队热力图详情抽屉（空闲/忙碌成员列表）
│   │   │   ├── TransferTeamModal.vue     # 团队所有权转让模态框
│   │   │   ├── DissolveTeamModal.vue     # 解散团队确认模态框
│   │   │   ├── LeaveTeamModal.vue        # 退出团队确认模态框
│   │   │   ├── TeamEventDetailModal.vue  # 团队课程详情及冲突显示
│   │   │   ├── EventDetailModal.vue      # 事件详情模态框
│   │   │   ├── StackedEventsModal.vue    # 堆叠事件详情显示
│   │   │   ├── FilterSidebar.vue         # 团队课表高级筛选侧边栏
│   │   │   ├── ChangelogModal.vue        # 更新日志显示模态框
│   │   │   ├── BatchActionBar.vue        # 批量操作工具栏
│   │   │   ├── ButtonLoadingSpinner.vue  # 按钮加载指示器
│   │   │   ├── PageHeaderCard.vue        # 页面顶部信息卡片
│   │   │   ├── PageLoadingSpinner.vue    # 页面加载指示器
│   │   │   ├── Navigation.vue            # 导航栏（含团队、空教室查询、更新日志入口）
│   │   │   ├── MobileDrawer.vue          # 移动端菜单
│   │   │   ├── MobileBottomTabBar.vue    # 移动端底部标签栏（课表/团队/空教室/个人）
│   │   │   ├── EventModal.vue            # 事件编辑弹窗
│   │   │   ├── PickerPopover.vue         # 通用弹出式日期/时间选择器
│   │   │   ├── CodeEditor.vue            # 代码编辑器（支持代码注入配置）
│   │   │   ├── EmailBindingChecker.vue   # 强制邮箱绑定检查器
│   │   │   ├── ForceBindEmailModal.vue   # 强制绑定邮箱模态框
│   │   │   ├── ForgetPasswordForm.vue    # 找回密码表单
│   │   │   ├── RegisterForm.vue          # 注册表单（含邮箱验证）
│   │   │   ├── LoginForm.vue             # 登录表单
│   │   │   ├── PasswordInput.vue         # 统一密码输入组件（支持显示/隐藏）
│   │   │   ├── OtpInput.vue              # 多格验证码输入组件
│   │   │   ├── SendCodeLabel.vue         # 验证码按钮状态标签
│   │   │   ├── TutorialEntry.vue         # 教程快捷入口组件
│   │   │   ├── LandingNavbar.vue         # 首页导航栏（支持登录态菜单）
│   │   │   ├── HeroTypewriter.vue        # 首页打字机标题组件
│   │   │   ├── PerspectiveSchedule.vue   # 首页3D课表演示组件（含自动课程详情动画）
│   │   │   ├── TeamViewShowcase.vue      # 首页团队协作演示组件
│   │   │   ├── ClassroomShowcase.vue     # 首页空教室演示组件
│   │   │   ├── ShareShowcase.vue         # 首页课表分享演示组件（图片/链接/ICS三标签）
│   │   │   ├── ImportShowcase.vue        # 首页教务系统导入演示组件
│   │   │   ├── TeamManageShowcase.vue    # 首页团队管理演示组件
│   │   │   ├── NavTooltip.vue            # 通用悬停提示组件（支持 top/bottom/right 方向）
│   │   │   ├── FeatureSection.vue        # 首页功能展示区
│   │   │   ├── CTASection.vue            # 首页行动引导区
│   │   │   ├── InAppBrowserPrompt.vue    # 应用内浏览器引导组件（dialog + toast 双模式）
│   │   │   ├── Footer.vue               # 页脚组件
│   │   │   ├── Toast/                   # Toast 通知子系统
│   │   │   │   ├── index.ts             # Toast 类型定义与导出
│   │   │   │   ├── ToastContainer.vue   # Toast通知容器
│   │   │   │   └── ToastItem.vue        # Toast通知项
│   │   │   ├── SEO/                     # SEO 子系统
│   │   │   │   └── StructuredData.astro # 结构化数据（JSON-LD）
│   │   │   ├── auth/AuthShell.astro     # 认证页面通用外壳
│   │   │   └── admin/                   # 管理员组件
│   │   │       ├── AdminTeamManagement.vue   # 管理员团队管理组件
│   │   │       ├── UserManagementPage.vue    # 用户管理页面（含登录记录、批量操作）
│   │   │       ├── ConfirmDeleteModal.vue    # 批量删除确认模态框
│   │   │       ├── UserEditModal.vue         # 用户编辑模态框
│   │   │       ├── UserScheduleModal.vue     # 用户课表显示模态框
│   │   │       ├── BanUserModal.vue          # 封禁用户确认模态框
│   │   │       ├── BatchRestoreConfirmToast.vue  # 批量恢复确认模态框
│   │   │       ├── CsvImportModal.vue        # CSV导入模态框
│   │   │       └── SystemSettings.vue        # 系统设置组件（含邮箱配置）
│   │   ├── layouts/        # Astro 布局
│   │   │   ├── BaseLayout.astro          # 基础布局
│   │   │   └── DashboardLayout.astro     # 仪表板布局
│   │   ├── pages/          # 页面路由
│   │   │   ├── index.astro               # 首页
│   │   │   ├── login.astro               # 登录页
│   │   │   ├── register.astro            # 注册页（含邮箱验证）
│   │   │   ├── forget.astro              # 找回密码页
│   │   │   ├── share.astro               # 公开课表分享页
│   │   │   ├── 503.astro                 # 账户封禁错误页面
│   │   │   └── dashboard/                # 仪表板页面
│   │   │       ├── my-schedule.astro     # 个人课表（含调休管理）
│   │   │       ├── my-teams.astro        # 我的团队管理
│   │   │       ├── classroom.astro       # 空教室查询
│   │   │       ├── team-view.astro       # 团队视图（动态团队ID通过 query 参数传递）
│   │   │       ├── profile.astro         # 个人资料（含登录历史）
│   │   │       └── admin/                # 管理员页面
│   │   │           ├── user-management.astro  # 用户管理页面
│   │   │           ├── team-management.astro  # 团队管理页面
│   │   │           └── system-settings.astro  # 系统设置页面
│   │   ├── stores/         # Pinia 状态管理
│   │   │   ├── auth.ts                   # 认证状态
│   │   │   ├── schedule.ts               # 课表状态（含调休逻辑）
│   │   │   ├── team.ts                   # 团队状态管理
│   │   │   ├── ui.ts                     # UI状态管理（含更新日志通知）
│   │   │   ├── siteConfig.ts             # 站点配置状态（标题、Logo、代码注入等）
│   │   │   ├── theme.ts                  # 主题状态管理
│   │   │   └── toast.ts                  # Toast通知全局单例状态
│   │   ├── types/          # TypeScript 类型定义
│   │   │   └── index.ts                  # 包含Team、ScheduleAdjustment、LoginRecord、ShiftDefinition、BatchOperation、ScheduleTask等类型
│   │   ├── constants/      # 前端常量
│   │   │   ├── scheduleDisplay.ts         # 课表显示个性化配置常量
│   │   │   └── tutorialLinks.ts           # 教程入口链接常量
│   │   └── utils/          # 工具函数
│   │       ├── inAppBrowser.ts           # 应用内浏览器检测与引导工具
│   │       ├── api.ts                    # API 客户端
│   │       ├── avatarCache.ts            # 头像本地缓存失效控制
│   │       ├── avatarPresets.ts          # 头像/团队图标预设数据与生成逻辑
│   │       ├── calendar-grouping.ts      # 日历按天/按课程分组工具
│   │       ├── clipboard.ts              # 剪贴板复制兼容工具
│   │       ├── colors.ts                 # 颜色工具
│   │       ├── colleges.ts               # 学院列表常量
│   │       ├── date.ts                   # 日期工具
│   │       ├── export.ts                 # 导出工具（CSV/Excel/PDF）
│   │       ├── grades.ts                 # 年级列表常量
│   │       ├── changelogService.ts       # 更新日志服务
│   │       ├── dropdownBehavior.ts       # 下拉菜单点击外部关闭与高度工具
│   │       ├── pickerPopoverLayout.ts    # 日期/时间选择器布局计算工具
│   │       ├── scheduleView.ts           # 多视图统计与事件筛选工具
│   │       ├── schedule-segments.ts      # 课表时间段工具
│   │       └── url.ts                    # URL 安全校验与路径工具
│   ├── tests/               # Bun 前端单测
│   │   ├── avatar-presets.test.ts       # 预设头像/图标资源测试
│   │   ├── clipboard.test.ts            # 剪贴板回退逻辑测试
│   │   ├── dropdown-behavior.test.ts    # 下拉菜单行为测试
│   │   ├── dropdown-component-guards.test.ts # 下拉组件回归守卫测试
│   │   ├── login-redirect.test.ts       # 登录回跳逻辑测试
│   │   ├── picker-popover-layout.test.ts # 日期时间选择器布局测试
│   │   ├── schedule-adjuster.test.ts    # 调休组件测试
│   │   ├── schedule-editor-modal.test.ts # 课表编辑弹窗动作测试
│   │   ├── schedule-gantt-alignment.test.ts # 甘特图对齐测试
│   │   ├── schedule-views.test.ts       # 多视图统计与筛选测试
│   │   └── team-modal-actions.test.ts   # 团队模态框动作测试
│   ├── astro.config.mjs    # Astro 配置
│   ├── tailwind.config.mjs # Tailwind 配置
│   └── package.json        # 依赖管理
├── scripts/                # 脚本目录
│   ├── migrations/         # 数据库迁移脚本
│   │   ├── README.md       # 统一迁移脚本清单、版本说明与执行规则
│   │   ├── README_PG.md    # SQLite 到 PostgreSQL 迁移指南
│   │   ├── sqlite_to_postgres.py  # SQLite 到 PostgreSQL 数据迁移工具（含团队协作表）
│   │   ├── repair_team_tables.py  # 遗留补丁：治理前团队协作表修复（新结构变更一律走 Alembic）
│   │   ├── add_email_and_status_fields.py  # 添加邮箱和状态字段
│   │   ├── add_college_field.py            # 添加学院字段
│   │   ├── add_password_changed_field.py   # 添加密码变更字段
│   │   ├── add_profile_bio_and_team_metadata.py # 添加个人简介与团队元数据字段
│   │   ├── add_schedule_visibility_and_default_truth.py # 遗留补丁：默认课表/隐藏课表真相源迁移（已并入 Alembic 链）
│   │   ├── add_schedule_share.sh           # 添加课表分享功能
│   │   └── legacy_alembic/  # 历史 Alembic 迁移归档（仅保留，不再新增）
│   ├── testing/            # 测试相关脚本与数据
│   └── start_dev.sh        # 开发环境启动脚本
├── Dockerfile              # Docker 镜像构建文件
├── docker/                 # Docker 部署配置
│   ├── nginx.conf          # Nginx 反向代理配置
│   ├── supervisord.conf    # Supervisor 进程管理配置
│   └── entrypoint.sh       # 容器入口脚本
├── docker-compose.yml      # Docker Compose 部署（含 PostgreSQL 服务）
├── .env.example            # 环境变量模板
├── docs/                    # 部署、开发与完整更新日志
│   ├── DEPLOYMENT.md        # 部署指南
│   ├── DEVELOPMENT.md       # 开发与质量门槛
│   └── CHANGELOG.md         # 完整版本历史
├── .gitignore              # Git 忽略文件
└── README.md               # 项目说明与最近三个月更新
```


## 🔌 API 接口

### 认证接口

- `POST /api/auth/token` - 用户登录
- `POST /api/auth/register` - 用户注册（支持邮箱验证）
- `GET /api/auth/users/me` - 获取当前用户信息
- `POST /api/auth/send-verification-code` - 发送邮箱验证码（60秒冷却）
- `POST /api/auth/bind-email` - 绑定邮箱到用户账户
- `GET /api/auth/email-required` - 检查邮箱验证是否必填
- `POST /api/auth/reset-password` - 重置密码（需验证码）

### 课表管理接口

- `GET /api/schedules/` - 获取用户所有课表
- `POST /api/schedules/` - 创建新课表
- `GET /api/schedules/{id}` - 获取指定课表详情
- `PUT /api/schedules/{id}` - 更新课表信息
- `DELETE /api/schedules/{id}` - 删除课表
- `GET /api/schedules/{id}/events` - 获取课表事件（含调休逻辑）
- `POST /api/schedules/{id}/events` - 在课表中创建事件
- `PUT /api/schedules/{id}/events/{event_id}` - 更新课表事件
- `DELETE /api/schedules/{id}/events/{event_id}` - 删除课表事件
- `POST /api/schedules/import-ics` - 从ICS文件导入事件到指定课表
- `GET /api/schedules/{id}/export.ics` - 导出课表为ICS文件

### 调休管理接口

- `GET /api/schedules/{id}/adjustments` - 获取课表的所有调休历史记录
- `POST /api/schedules/{id}/adjustments` - 创建调休调整（HOLIDAY/SWAP类型）
  - **HOLIDAY类型**：`{ "adjustment_type": "HOLIDAY", "holiday_date": "2024-10-01" }`
  - **SWAP类型**：`{ "adjustment_type": "SWAP", "source_date": "2024-10-01", "target_date": "2024-10-02" }`

### 课表分享接口

- `POST /api/schedules/{id}/share` - 创建课表分享链接
- `GET /api/schedules/{id}/shares` - 获取课表的所有分享记录
- `DELETE /api/shares/{share_id}` - 撤销（删除）分享
- `GET /api/public/shares/{token}` - 查看分享的课表（公开接口）
- `POST /api/public/shares/{token}/import` - 导入分享的课表到当前账户

### 团队管理接口

**用户团队操作：**

- `POST /api/teams` - 创建新团队（自动生成8位邀请码，创建者自动加入）
- `POST /api/me/teams/join` - 通过邀请码加入团队
- `GET /api/me/teams` - 获取我参与的所有团队列表
- `POST /api/me/teams/{id}/leave` - 退出团队（普通成员）

**团队信息查询：**

- `GET /api/teams/{id}` - 获取团队详细信息（包含成员列表、创建者信息）
- `GET /api/teams/{id}/schedules` - 获取团队聚合课表视图（所有成员的活跃课表）

**团队管理操作（需要创建者或团队管理员权限）：**

- `PUT /api/teams/{id}` - 更新团队名称
- `POST /api/teams/{id}/members` - 添加团队成员（通过学号精确查找）
- `DELETE /api/teams/{id}/members/{user_id}` - 移除团队成员（不能移除创建者和系统管理员）

**团队设置接口：**

- `GET /api/teams/{id}/settings` - 获取团队设置（可见度模型、入队策略等）
- `PUT /api/teams/{id}/settings` - 更新团队设置
- `GET /api/teams/{id}/member-schedule/{user_id}` - 获取指定成员的日程数据

**批量排班接口：**

- `POST /api/teams/{id}/batch-events/preview` - 预览批量排班（返回冲突检测结果）
- `POST /api/teams/{id}/batch-events/execute` - 执行批量排班（支持跳过/强制策略）
- `GET /api/teams/{id}/batch-operations` - 获取批量操作列表
- `GET /api/teams/{id}/batch-operations/{op_id}` - 获取批量操作详情（按用户合并视图）

**智能排班接口：**

- `POST /api/teams/{id}/schedule-tasks/preview` - 预览智能排班（返回成员分配统计）
- `POST /api/teams/{id}/schedule-tasks` - 创建智能排班任务
- `GET /api/teams/{id}/schedule-tasks` - 获取排班任务列表

**临时团队查询接口：**

- `POST /api/temporary/availability` - 查询多人可用性（无需加入团队）

**团队管理员管理（仅创建者和系统管理员）：**

- `POST /api/teams/{id}/admins/{user_id}` - 提升成员为团队管理员
  - 要求：目标用户必须是团队成员
  - 限制：不能提升创建者（已有隐式权限）和系统管理员
- `DELETE /api/teams/{id}/admins/{user_id}` - 移除团队管理员权限
  - 将团队管理员降级为普通成员
  - 限制：不能降级创建者

**团队所有权管理（仅创建者权限）：**

- `POST /api/teams/{id}/transfer` - 转让团队所有权给其他成员
- `DELETE /api/teams/{id}` - 解散团队（删除团队及所有成员关系）

**管理员专用接口：**

- `GET /api/admin/teams` - 获取系统中所有团队列表（包含统计信息）

### 路由说明

团队管理接口使用统一的路由前缀，遵循 RESTful 设计原则：

- `/api/teams/*` - 团队的增删改查操作
- `/api/me/teams/*` - 当前用户的团队操作
- `/api/admin/teams` - 管理员团队监控

所有接口均需要 JWT 身份验证，通过 `Authorization: Bearer <token>` 请求头传递。

### 个人资料接口

- `GET /api/profile/` - 获取个人资料
- `PUT /api/profile/` - 更新个人资料
- `POST /api/profile/change-password` - 修改密码
- `POST /api/profile/avatar` - 更新头像URL
- `POST /api/profile/upload-avatar` - 上传头像文件
- `GET /api/profile/statistics` - 获取个人统计数据
- `GET /api/profile/recent-login` - 获取最近一次登录记录
- `GET /api/profile/login-history` - 获取登录历史记录（支持分页）

### 管理员接口

**用户管理：**

- `GET /api/admin/users` - 获取所有用户（管理员）
- `POST /api/admin/users` - 创建用户
- `PUT /api/admin/users/{id}` - 更新用户
- `DELETE /api/admin/users/{id}` - 删除用户
- `POST /api/admin/users/{id}/ban` - 封禁用户账户（支持ban_type: ban/ipban/emailban）
- `POST /api/admin/users/{id}/restore` - 恢复用户账户（重置status为normal）

**批量导入导出：**

- `GET /api/admin/users/import-template.csv` - 下载用户CSV导入模板
- `POST /api/admin/users/import-csv` - 批量导入用户（multipart/form-data，file参数）
- `GET /api/admin/teams/import-template.csv` - 下载团队CSV导入模板
- `POST /api/admin/teams/import-csv` - 批量导入/更新团队（multipart/form-data，file参数）

**用户课表管理：**

- `GET /api/admin/users/{id}/schedules-list` - 获取用户的所有课表列表
- `GET /api/admin/users/{id}/schedules` - 获取用户的所有日程事件
- `POST /api/admin/schedule/{user_id}` - 为指定用户创建日程
- `PUT /api/admin/schedule/{event_id}` - 更新任意日程事件
- `DELETE /api/admin/schedule/{event_id}` - 删除任意日程事件

**登录记录查询：**

- `GET /api/admin/users/{id}/recent-login` - 获取指定用户的最近登录记录
- `GET /api/admin/users/{id}/login-history` - 获取指定用户的登录历史记录

**系统设置：**

- `GET /api/admin/settings` - 获取系统设置（含邮箱配置）
- `POST /api/admin/settings` - 更新系统设置（含邮箱配置）
- `POST /api/admin/settings/test-alist` - 测试AList存储连接
- `POST /api/admin/settings/test-email` - 测试邮件连接（发送测试邮件）

**站点配置接口：**

- `GET /api/admin/public/site-config` - 获取公开站点配置（无需认证）
- `GET /api/admin/public-files` - 获取Public目录下的图标文件列表
- `GET /api/admin/settings` - 获取完整系统设置（含站点配置）
- `POST /api/admin/settings` - 更新系统设置（含站点配置 `[site]` 部分）

### 教务连接与空教室接口

- `GET /api/import/zfw/session?connection_mode=webvpn|direct` - 创建课表导入教务会话
- `GET /api/import/zfw/refresh/{session_id}?connection_mode=webvpn|direct` - 刷新当前导入会话验证码
- `POST /api/import/zfw` - 使用会话绑定的连接方式登录并导入课表
- `GET /api/classroom/session?connection_mode=webvpn|direct` - 创建空教室查询教务会话
- `GET /api/classroom/refresh-captcha/{session_id}?connection_mode=webvpn|direct` - 刷新当前空教室会话验证码
- `POST /api/classroom/login` - 使用会话绑定的连接方式登录教务系统
- `POST /api/classroom/query` - 使用已登录会话查询空教室

`connection_mode` 默认为 `webvpn`；会话创建后不能切换模式，模式不匹配返回 HTTP 400。后端暂时保留 `direct` 协议实现供校园网部署使用，但当前前端将直连选项显示为禁用。

### 更新日志

更新日志不再请求外部站点：前端构建阶段直接读取仓库 `docs/CHANGELOG.md` 渲染为 HTML 并内联进页面（更新日志弹窗），版本变更提示由构建产物内的内容哈希与本地存储比较得出，无运行时接口。
