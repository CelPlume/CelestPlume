---
title: 关于时序同笺
description: 时序同笺 (SDNUChronoSync) 是一个现代化的、全功能的多用户课表与日程管理 Web 应用，专为山东师范大学设计。支持个人多课表管理、高级调休功能、完整的团队协作系统，以及灵活的管理员控制功能。专为教育机构和团队协作场景设计。
sidebar:
  order: 1
---
[![GitHub](https://img.shields.io/badge/GitHub-SDNUChronoSync-blue?logo=github)](https://github.com/CelPlume/SDNUChronoSync)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)

## 🌐 在线访问

**线上地址：[https://sxtj.hxcn.space](https://sxtj.hxcn.space)**

**使用教程：[时序同笺保姆级用户教程](https://celplume.hxcn.space/zh/chronosync/tutorials/nanny-user-tutorial/)**

欢迎访问在线版本，体验完整的课表与日程管理功能。

## 📋 项目简介

时序同笺 (SDNUChronoSync) 是一个现代化的、全功能的多用户课表与日程管理 Web 应用，专为山东师范大学设计。支持个人多课表管理、高级调休功能、完整的团队协作系统，以及灵活的管理员控制功能。专为教育机构和团队协作场景设计。

## ✨ 功能特性

### 个人日程管理

- **多课表管理**：支持创建多个课表，如"大二上学期"、"大二下学期"等
- **默认课表机制**：系统自动将进行中且创建最早的课表设为默认课表，也支持在课表编辑弹窗手动设为默认；我的课表页面优先展示默认课表
- **灵活导入方式**：
  - 从正方教务系统一键导入课表
  - 从ICS文件导入（支持其他日历应用导出的文件）
  - 手动创建日程事件
- **灵活的日程编辑**：支持手动创建、编辑和删除日程事件
- **多视图模式**：支持课表周视图、日历日视图、甘特图周视图、周列表视图四种模式自由切换
- **月视图分栏联动**：月视图支持左侧月历 + 右侧当日课表分栏，点击日期即可查看当日分组课程
- **个性化卡片配色**：支持单色/多彩两种卡片配色模式，并可分别调整背景色、文字色、当前时间指示线和即将开始课程高亮样式
- **自定义日期/时间选择器**：日期与时间输入统一使用弹出式日历/时间面板，支持在抽屉、弹窗和移动端视口中自适应定位
- **多种导出格式**：
  - 导出为PNG图片，方便分享截图
  - 导出为ICS文件，兼容各大日历应用（苹果日历、Google Calendar等），日历视图与ICS导出/导入统一按 `Asia/Shanghai` 时区处理

### 智能调休系统

- **节假日设置**：HOLIDAY类型调整，逻辑隐藏指定日期的所有课程
- **智能换课系统**：SWAP类型调整，将源日期课程完整移动到目标日期
- **服务器端逻辑**：调休计算在后端处理，确保数据一致性和完整性
- **调休记录追踪**：完整记录所有调休操作的历史和影响范围
- **实时生效机制**：调休设置立即在课表视图中反映，无需刷新

### 团队协作系统

- **智能邀请机制**：8位随机邀请码（大写字母+数字，避免易混淆字符0,O,1,I）
- **灵活团队管理**：团队创建者自动成为管理员，支持添加/移除成员、编辑团队介绍和团队图标
- **团队管理员角色**：支持指定团队管理员，分担团队管理工作
  - 创建者可以提升成员为团队管理员
  - 团队管理员拥有成员管理和课表管理权限
  - 支持随时添加或移除团队管理员权限
- **团队所有权转让**：创建者可以将团队管理权转让给其他成员
- **分层权限控制**：系统管理员 > 团队创建者 > 团队管理员 > 普通成员的四级权限体系
- **团队课表聚合**：实时查看团队所有成员的活跃课程安排和时间冲突
- **高级筛选功能**：支持按成员姓名、学号、班级、年级等多维度筛选
- **团队资料增强**：团队列表卡片展示团队介绍、团队图标、邀请码和成员预览，创建/编辑时支持上传图标与选择预设图标
- **便捷成员操作**：通过学号精确添加成员，支持成员自主退出和管理员移除
- **团队生命周期管理**：从创建、管理、转让到解散的完整流程
- **批量排班操作**：批量为团队成员创建课程事件，支持冲突预览（跳过/强制两种策略）、按周次和星期筛选、自动为无课表成员创建团队日程
- **智能排班系统**：基于稳定贪心策略自动分配成员到班次，支持周次模式和按日期模式，预览时展示成员分配统计、列表/日历双视图，结果自动写入批量操作日志
- **排班课表插入模式**：批量排班与智能排班统一支持三种写入策略（新建课表 / 插入默认课表 / 插入指定课表）
- **临时团队查询**：无需加入团队，快速搜索任意成员并查看多人共同空闲时段，支持按日期范围和忙闲/课程名/详情三级可见度筛选
- **团队设置扩展**：可见度模型（busy_only/course_title/full_detail）、入队策略（自由/审批/邀请）、最大成员数、成员邀请开关

### 管理员功能

- **用户管理**：创建、编辑、删除用户账户
- **用户状态管理**：支持多种封禁类型（账号封禁、IP封禁、邮箱封禁）和恢复用户账户
- **高级筛选功能**：支持按角色、封禁状态等多维度筛选用户
- **登录记录监控**：查看所有用户的登录历史和活动追踪
- **批量操作**：支持批量删除、封禁、恢复用户，配合批量操作工具栏高效管理
- **团队监控**：监管所有团队的运行状态
- **系统设置**：配置头像上传、存储、邮箱通知等系统参数
- **站点配置**：自定义站点名称、描述、Logo和Favicon
- **邮箱配置**：配置SMTP服务器、测试邮件连接

### 高级功能

- **课表分享系统**：
  - 生成公开分享链接（支持有效期和权限设置）
  - 访问者可查看或导入分享的课表
  - 完整的分享管理面板（查看访问量、二维码、撤销分享）
- **临时约课与团队热力图分享**：
  - 临时约课支持图片导出与链接分享，支持有效期和访问权限设置
  - 团队热力图支持链接分享、二维码展示，并支持成员日程可见性控制
  - 公开访问页可按分享权限展示忙闲结果和成员信息
- **空教室查询系统**：
  - 实时查询山东师范大学各校区空闲教室
  - 支持按时间段、教学楼、教室类型筛选
  - 独立会话管理，不影响平台登录状态
  - 直观的查询结果展示
- **首页引导与演示系统**：
  - 首页升级为完整落地页（导航栏、主题 Hero、功能区、CTA 区）
  - Hero 区"井然有序"标题下方加粗连续波浪下划线，教程按钮与注册/登录/特色功能并排展示
  - 提供团队排班、空教室查询、课表分享（图片/链接/ICS）、教务导入、团队管理的交互式演示卡片
  - `PerspectiveSchedule` 使用真实 demo 课程数据展示三种日程视图，并保留自动轮播课程详情弹窗动画与当前时间标签
  - 关键流程内置教程入口（导入、调休、团队协作等）
- **站点配置系统**：
  - 动态修改站点标题、描述和关键词
  - 支持上传或使用外部链接设置Logo和Favicon
  - 受控代码注入（统计脚本 / 样式表 / Meta 标签）

## 🔐 受控代码注入（Analytics / Styles / Meta）

本项目支持在页面 `head` / `body` 注入第三方统计或样式资源，但为避免 XSS 风险，已将“代码注入”收敛为**受控白名单机制**：后端负责解析与校验，前端仅按结构化数据创建 DOM 元素（不使用任意 HTML 注入）。

### 校验失败时的行为

- **系统设置页保存**：校验失败会拒绝保存（返回 400），并提示具体原因。
- **配置文件预置（config.toml）**：配置依然会被正常加载，但系统设置页会显示校验告警，并对有问题的编辑器区域进行红色高亮提示；公开端点会 fail-closed（返回空列表，不注入任何内容）。

### 允许的标签与限制

- **允许的标签**
  - `script`：必须使用 `src`（禁止 inline script）
  - `link`：仅允许 `rel="stylesheet"` 且必须使用 `href`
  - `meta`：仅允许 `name/property + content`（禁止 `http-equiv` / `charset`）
- **允许的属性**
  - `script`：`src`, `async`, `defer`, `type`, `integrity`, `crossorigin`, `referrerpolicy`, 以及 `data-*`
  - `link`：`rel`, `href`, `media`, `integrity`, `crossorigin`, `referrerpolicy`
  - `meta`：`name`, `property`, `content`
- **URL 规则**
  - 同源脚本只允许 `/assets/*.js`
  - 同源样式只允许 `/assets/*.css`
  - 外部资源只允许 `https://` 且域名必须在白名单 `CODE_INJECTION_ALLOWED_HOSTS` 中
- **安全限制**
  - 禁止任何事件属性（如 `onclick`）
  - 最大长度：`20_000` 字符；最大条目数：`50`
  - 校验失败会拒绝保存 / 或公开端点返回空列表（fail-closed）

### 如何添加 Umami（示例）

在管理后台 → 系统设置 → 代码注入（Header）中填写：

```html
<script defer src="https://analytics.hxcn.dev/script.js" data-website-id="<your-id>"></script>
```

其中 `data-website-id` 属于 `data-*`，会被保留并透传。

### 外域白名单与 CSP

外部资源域名通过 `CODE_INJECTION_ALLOWED_HOSTS` 配置，反向代理层还需同步放行 CSP 的 `script-src`、`script-src-elem` 与 `connect-src`。各运行方式的环境变量配置和重启命令统一见[部署指南](/zh/chronosync/dev/deployment/)。

### UI/UX 特性

- **响应式设计**：完美适配桌面、平板和手机
- **移动端底部标签栏**：移动端底部固定快速导航栏，包含课表、团队、空教室、个人四个高频功能入口，支持 iPhone 安全区域适配
- **可折叠侧边栏**：支持展开/收起状态持久化，节省屏幕空间；折叠后图标悬停显示 Tooltip 提示导航名称
- **统一认证页壳**：登录、注册、找回密码统一使用 AuthShell 布局，减少重复并保持体验一致
- **OTP验证码输入**：注册、找回、绑定邮箱/改密等流程统一使用多格 OTP 输入组件
- **表单反馈一致性**：认证与空教室登录表单统一使用 Toast 反馈，不依赖浏览器原生提示
- **统一模态框系统**：基于Headless UI的可访问性组件
- **统一页面头卡系统**：个人中心、我的团队、我的课表等页面使用统一 PageHeaderCard 顶部信息卡片
- **Toast通知系统**：HeroUI风格的3D堆叠Toast通知，支持多种类型和自动消失
- **智能加载指示器**：统一的加载状态视觉反馈
- **实时状态反馈**：操作结果立即反馈给用户
- **直观的视觉设计**：清晰的信息层次和交互指引
- **批量操作支持**：高效的批量管理功能，配合批量操作工具栏
- **自定义滚动条**：优雅的细滚动条样式，提升视觉体验
- **固定表头设计**：大数据表格支持固定表头，滚动内容时表头保持可见
- **弹层层级与菜单自适应**：下拉/弹窗层级统一，管理员列表操作菜单根据剩余空间自动向上/向下展开；日期/时间选择器在抽屉和移动端中会自动避让边缘；带搜索的下拉菜单会保持实底搜索区并支持点击外部关闭
- **更新日志集成**：实时查看系统版本更新内容

### 高性能架构

- **前后端分离**：Astro + Vue.js 前端，FastAPI 后端
- **智能状态管理**：Pinia 驱动的响应式状态系统
- **数据库优化**：SQLAlchemy ORM 的高效查询，支持 SQLite（开发）和 PostgreSQL（生产推荐）
- **头像缓存优化**：统一头像组件并基于更新时间做本地缓存失效控制，减少团队聚合、临时约课、热力图等高频场景重复请求
- **连接池管理**：PostgreSQL 模式下支持 pool_size、max_overflow、pool_recycle 等可配置参数
- **数据库迁移**：生产 PostgreSQL 只使用 `scripts/migrations/alembic/` 的单一 Alembic 版本链，`backend/alembic.ini` 指向该现役路径；`legacy_alembic/` 仅供历史核对，禁止生成新 revision
- **启动门禁**：容器启动会先执行 `alembic upgrade head`，应用随后校验数据库 `current == head`；缺失或不兼容的 `alembic_version` 会拒绝启动，PostgreSQL 不再通过 `Base.metadata.create_all()` 升级
- **旧库切换**：已上线 SQLite 必须在停机维护窗口先运行 `upgrade_legacy_sqlite.py`（单次备份、完整性/外键/catalog 验证），再迁入由 `alembic upgrade head` 创建的 fresh PostgreSQL；完整操作和回滚见[迁移 Runbook](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README_PG.md)
- **API设计**：RESTful接口设计，支持并发访问
- **开发期稳定性优化**：Vite 预构建排除 `@headlessui/vue`，并使用 `astro dev --force` 降低依赖缓存失效导致的水合异常

### LLM 支持（llms.txt）

本站已接入 [llmstxt.org](https://llmstxt.org) 提案，为 LLM/Agent 提供站点内容的可解析索引：

- `/llms.txt`：LLM 可读的站点索引（H1 标题 + 简介 + 关键链接），遵循 llmstxt.org 格式规范
- `/llms-full.txt`：站点完整内容单文件（项目简介、功能特性、使用指南、技术架构、API 概览）

源文件位于 `frontend/public/`，构建后自动发布到站点根目录（如 `https://sxtj.hxcn.space/llms.txt`）；更新站点功能时请同步维护这两个文件，保持与本文档内容一致。

## 📖 使用指南

### 🎯 首页与新手引导

1. **访问首页**：

   - 未登录用户可直接从首页进入注册/登录
   - 已登录用户可从首页右上角菜单进入工作台或个人中心
   - 退出登录后将返回首页，不再强制跳转登录页
   - 从退出态重新登录时，会默认回到 `/dashboard/my-schedule`

2. **查看交互演示**：

   - 首页提供日程视图、团队协作、空教室查询三类可视化演示
   - 可快速了解核心功能后再进入工作台实操

3. **使用教程入口**：

   - 首页功能区、导入弹窗、调休页、团队页均提供教程跳转入口
   - 可直达“个人课表 / 导入课表 / 高级调休 / 团队协作”对应章节

### 🎯 个人课表管理

1. **创建课表**：

   - 访问"我的课表"页面
   - 点击课表下拉菜单中的"新建课表"
   - 设置课表名称、学期开始日期和总周数
   - 如果当前没有可用课表，页面空状态仍会直接提供"新建课表"、"导入课表"和教程入口

2. **使用"更多"操作菜单**：

   - 点击页面右上角的"更多"按钮，可访问以下功能：
     - **添加日程**：手动创建日程事件
     - **导入课表**：选择从ICS文件或教务系统导入
     - **分享课表**：生成分享链接、导出为图片或ICS文件
     - **放假调休**：设置节假日和课程对调
     - **课表设置**：编辑课表名称、日期等信息

3. **切换视图与跳转日期**：

   - 课表页顶部可直接切换课表、视图和课表操作菜单
   - 支持课表、日历、甘特、周列表四种视图
   - 顶部"跳转"与各类日期/时间输入均使用统一弹出式选择器

4. **导入课程**：

   - 点击“更多” -> “导入课表” -> “从教务系统导入”
   - 当前界面固定使用 `WebVPN`；`直连教务系统` 仅校园网可用，因项目服务器不在校园网内而暂时显示为禁用
   - 第一步输入 WebVPN / 统一身份认证账号和密码；仅在 CAS 明确要求时输入验证码
   - WebVPN 隧道建立后，第二步在同一会话中输入另一套教务系统账号和密码；仅在教务系统要求时输入验证码
   - 两套凭据只用于当前认证请求，不写入数据库、环境变量或日志；教务认证成功后系统自动获取并导入课表

   - **从ICS文件导入**：
     - 点击"更多" → "导入课表" → "从ICS文件导入"
     - 选择从其他日历应用导出的.ics文件
     - 系统自动解析并导入事件

   - **手动添加**：
     - 点击"更多" → "添加日程"
     - 或直接点击日历上的日期

5. **分享与导出**：

   - 点击"更多" → "分享课表"打开分享面板，提供以下功能：

   - **生成分享链接**（推荐）：
     - 创建公开访问链接，支持设置有效期和导入权限
     - 可在分享详情中查看二维码、访问次数与权限说明
     - 适合发送给好友或在社交媒体分享
   
   - **导出为图片**：
     - 选择"导出图片"选项
     - 下载当前课表的 PNG 截图，适合打印或保存
   
   - **导出为ICS**：
     - 选择"导出ICS"选项
     - 下载 .ics 文件，可导入到苹果日历、Google Calendar等应用

6. **多课表管理**：

   - 支持同时管理多个课表（如不同学期）
   - 通过下拉菜单快速切换活跃课表
   - 每个课表独立管理课程和调休设置

### 🎯 高级调休功能

1. **节假日设置（HOLIDAY类型）**：

   - 在"我的课表"页面点击"更多" → "放假调休"
   - 选择"设置假期"模式
   - 选择需要放假的日期
   - 点击"确认放假"，系统将逻辑隐藏该日期的所有课程

2. **智能换课（SWAP类型）**：

   - 点击"更多" → "放假调休"
   - 选择"对调工作日"模式
   - 设置源日期（需要移动的课程日期）
   - 设置目标日期（课程移动到的日期）
   - 系统自动创建覆盖事件，保持原有课程信息

3. **调休记录管理**：

   - 所有调休操作记录在ScheduleAdjustment表中
   - 支持查看调休历史和影响的事件数量
   - 调休效果立即在课表视图中生效

### 🎯 课表分享功能

1. **创建分享**：

   - 在"我的课表"页面点击"更多" → "分享课表"
   - 设置有效期（1天、7天、30天、永久）
   - 设置访问权限：
     - **仅查看**：访问者只能查看课表，无法进行其他操作
     - **需要登录**：访问者必须登录系统才能查看
     - **允许导入**：访问者可以将课表保存到自己的账户
   - 点击"生成链接"获取分享链接
   - 在手机上打开分享面板时，二维码、权限说明与操作按钮会自动改为更紧凑的纵向布局

2. **管理分享**：

   - 在"分享课表"面板下方查看所有分享历史
   - 实时监控每个链接的访问次数
   - 支持随时撤销（删除）分享链接，链接失效后无法访问

3. **访问分享**：

   - 访问分享链接进入只读课表视图
   - 支持切换周/月视图查看
   - 如果权限允许，点击"导入课表"将课程复制到自己的账户

### 🎯 团队协作系统

#### 1. 创建团队

- 访问"我的团队"页面（导航栏"团队"菜单）
- 点击右上角"创建团队"
- 输入团队名称、团队介绍，并可上传图标或选择预设图标
- 点击"创建团队"按钮
- 系统自动生成8位安全邀请码（避免0O1I等易混淆字符）
- 创建者自动成为团队管理员并加入成员列表
- 页面显示团队代码，可一键复制分享给成员

#### 2. 加入团队

- 向团队创建者获取8位团队邀请码
- 点击"加入团队"并输入邀请码（自动转换为大写）
- 点击"加入团队"按钮
- 系统验证邀请码有效性后自动加入团队
- 成功加入后可立即查看团队课表

#### 3. 团队管理（创建者和团队管理员）

  **基础管理：**

- 点击团队卡片上的"管理团队"按钮
- 打开高级团队管理面板
- 可编辑团队名称、团队介绍和团队图标
- 预设图标抽屉支持直接生成并上传团队图标
- 查看创建的所有团队及成员统计
  **成员管理：**

- **添加成员**：在团队编辑窗口输入学号，系统自动查找并添加用户

- **移除成员**：点击成员列表中的"移除"按钮删除成员
  - 团队管理员可以移除普通成员
  - 不能移除团队创建者和系统管理员

- **查看成员**：查看所有成员的姓名、学号、班级等信息
  **团队管理员管理（仅创建者）：**

- **提升管理员**：
  - 在团队成员列表中选择普通成员
  - 点击"设为管理员"按钮
  - 该成员将获得团队管理权限
  - 团队管理员可以管理成员、编辑团队信息

- **移除管理员**：
  - 在团队管理员列表中选择要降级的管理员
  - 点击"移除管理员"按钮
  - 该用户将降级为普通成员
  **团队转让（仅创建者）：**

- 点击"转让团队"按钮

- 从当前成员列表中选择新的团队创建者

- 确认后，团队所有权和管理权限将转移给新创建者

- 原创建者将变成普通成员
  **解散团队（仅创建者）：**

- 点击"解散团队"按钮

- 输入团队名称进行二次确认

- 确认后团队及所有成员关系将被永久删除

- 此操作不可撤销

#### 4. 退出团队（普通成员）

- 在"我的团队"页面找到要退出的团队
- 点击团队卡片上的"退出团队"按钮
- 在弹出的确认窗口中确认退出
- 退出后将无法再访问该团队的课表

#### 5. 团队课表聚合视图

   **查看团队课表：**

- 点击团队卡片上的"查看课表"按钮

- 进入团队课表聚合视图页面

- 显示所有成员的活跃课表（status="进行"）

- 不同成员的课程用不同颜色标识
  **高级筛选功能：**

- **按成员筛选**：勾选特定成员，只显示其课程

- **按成员搜索**：成员多选下拉支持即时搜索

- **按班级筛选**：选择班级，显示该班级所有成员的课程

- **按年级筛选**：选择年级，显示该年级所有成员的课程

- **关键词搜索**：搜索成员姓名或课程名称

- **移动端支持**：移动端提供侧边筛选抽屉
  **视图模式：**

- **周视图**：查看一周的课程安排，适合查看详细时间

- **月视图**：查看整月的课程分布，适合宏观规划

- **日期导航**：前后翻页或跳转到今天
  **课程冲突识别：**

- 同一时间多个成员有课时，可点击查看详情

- 显示所有冲突的课程列表

- 标识出每门课的授课教师和地点

- 便于协调团队会议时间

#### 6. 批量排班操作

   **批量创建课程事件：**

- 在团队课表页面点击"批量排班"按钮
- 选择目标成员（支持全选/反选）
- 设置周次范围和星期几
- 系统自动预览冲突情况：
  - **跳过模式**：遇到冲突自动跳过，仅创建无冲突的事件
  - **强制模式**：忽略冲突强制创建所有事件
- 选择课表写入目标：使用成员活跃课表或新建团队日程
- 确认后批量创建，操作结果记录在批量操作日志中

   **批量操作日志：**

- 查看所有批量排班操作的历史记录
- 每条记录显示操作状态、创建时间、执行人
- 展开详情面板查看按用户合并的操作明细（用户、课程、周次、星期、时间、数量、状态）

#### 7. 智能排班系统

   **创建排班任务：**

- 在团队课表页面点击"智能排班"按钮
- 定义班次：设置班次名称、开始/结束时间、星期几
- 选择排班模式：
  - **周次模式**：选择需要排班的周次，设置每班次所需人数
  - **按日期模式**：选择具体日期，每日期可独立设置所需人数
- 设置每人最大排班次数（可选）
- 系统自动运行贪心算法预览分配结果：
  - 显示每个成员的分配次数统计
  - 列表视图：按班次分组，展示每班次的分配成员和周次
  - 日历视图：时间 x 星期网格，展示所有班次的分配情况
- 确认后创建排班任务，结果自动写入批量操作日志

   **算法特性：**

- 稳定分配：优先选择在所有排班周次中都有空闲的成员（稳定集合）
- 每周分配相同的 primary 人员，仅在某周出现冲突时从该周可用人员中选替补
- 替补不会与已分配人员重复
- max_per_member 全局生效，确保排班公平性

#### 8. 临时团队查询

- 点击导航栏"临时查询"或在团队页面点击"快速查询"
- 搜索并添加需要查看的成员（无需加入同一团队）
- 选择日期范围
- 系统自动显示所有成员的忙闲视图：
  - 仅显示忙闲状态（busy_only）
  - 显示课程名称（course_title）
  - 显示完整详情（full_detail，含教师、地点）
- 适合临时协调跨团队会议时间

#### 6. 管理员团队监控

- 访问管理后台"团队管理"页面
- 查看系统中所有团队的统计信息
- 搜索和筛选特定团队
- 查看任意团队的成员列表
- 必要时删除不活跃或违规的团队

### 🎯 个人资料管理

1. **基本信息**：

   - 查看和编辑个人信息（姓名、学号、班级、年级、学院、个人简介）
   - 上传和更换头像（支持本地存储/AList）
   - 支持选择预设头像，并在本地生成后上传到当前存储
   - 查看账户统计：课表数、课程数、注册时间

2. **邮箱管理**（v2.7.3+）：

   - **绑定邮箱**：在个人资料页面绑定邮箱，用于找回密码
   - **更换邮箱**：输入新邮箱地址，获取验证码后确认更换
   - **验证码冷却**：60秒发送间隔，防止滥用
   - **清空功能**：支持清空输入内容，重新填写

3. **密码安全**（v2.7.3+）：

   - **修改密码**：输入当前密码和新密码
   - **邮箱验证**：已绑定邮箱的用户修改密码时需要输入邮箱验证码
   - **安全提升**：双重验证确保账户安全

4. **登录记录**：

   - 查看最近登录设备、IP地址、浏览器信息
   - 查看完整登录历史记录
   - 监控账户安全状态

### 🎯 界面个性化

1. **侧边栏折叠**（v2.7.3+）：

   - **展开/收起**：点击侧边栏顶部的折叠按钮切换状态
   - **状态持久化**：折叠状态自动保存，刷新页面后保持
   - **节省空间**：折叠后仅显示图标，适合小屏幕或需要更多内容空间的场景
   - **平滑过渡**：主内容区域和页脚自动适应侧边栏宽度变化

2. **主题设置**：

   - 支持浅色/深色主题切换
   - 主题偏好自动保存

3. **课表个性化**：

   - 支持单色/多彩两种日程卡片配色模式
   - 支持自定义当前时间指示线颜色与宽度
   - 支持即将开始课程的高光边框/边框跑马灯颜色设置

### 🎯 空教室查询

   - 访问“空教室查询”页面（导航栏“空教室查询”菜单）
   - 当前界面固定使用 `WebVPN`；`直连教务系统` 仅校园网可用，因项目服务器不在校园网内而暂时不可选
   - 第一步输入 WebVPN / 统一身份认证账号和密码，建立 WebVPN 隧道
   - 第二步在同一会话中输入另一套教务系统账号和密码；两个认证阶段各自按上游要求显示验证码
   - 登录后选择查询时间段和校区，支持按教学楼、教室类型等条件筛选
   - 两套凭据不持久化；教务会话独立管理，不影响平台登录状态

### 🎯 管理员功能

1. **用户管理**：

   - 创建、编辑、删除用户账户
   - 可直接维护用户邮箱，后台会自动去重、规范化并持久保存
   - 重置用户密码和角色权限
   - 查看用户的课表和活动统计
   - 用户账户封禁和恢复功能
   - 批量操作：批量删除、封禁、恢复用户
   - 批量导入导出：CSV/Excel/PDF格式导入导出用户数据
   - 高级筛选：按角色、封禁状态等多维度筛选用户
   - 查看用户登录历史和最近登录记录

2. **系统设置**：

   - 配置头像上传方式（本地存储/AList）
   - 设置文件上传限制和存储路径
   - 管理系统全局配置参数

3. **团队监控**：

   - 查看所有团队信息
   - 批量导入导出：CSV/Excel/PDF格式导入导出团队数据
   - 必要时删除团队
   - 监控团队活动和成员状况

## 🛠️ 技术栈

### 前端

- **Astro** - 静态站点生成和路由
- **Vue.ts 3** - 交互式 UI 组件
- **Tailwind CSS** - 响应式样式框架
- **Headless UI** - 无样式 UI 组件
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端

### 后端

- **Python 3.10+** - 编程语言
- **FastAPI** - Web 框架
- **SQLAlchemy** - ORM
- **SQLite** / **PostgreSQL** - 数据库（推荐生产环境使用 PostgreSQL）
- **JWT** - 用户认证
- **ICS** - 日历导出

## 📁 项目结构

项目目录结构、各模块职责与 API 接口清单已迁移至 [系统架构与技术参考](/zh/chronosync/dev/architecture/)，本文不再内联维护。

## 项目文档

- [部署指南](/zh/chronosync/dev/deployment/)：Docker Compose、单容器、环境变量、HTTPS/CORS、持久化、备份恢复和故障排查。
- [开发指南](/zh/chronosync/dev/development/)：本地开发、代码规范、质量门槛、性能安全基线、发布与迁移治理。
- [SQLite 到 PostgreSQL 迁移 Runbook](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README_PG.md)：完整停机迁移、验证与回滚步骤。
- [完整更新日志](/zh/chronosync/about/changelog/)：项目全部版本记录；本文仅展示最近三个月。


## 🔌 API 接口

完整的 REST API 接口清单（认证、课表、调休、分享、团队、个人资料、管理员、教务连接与空教室等）见 [系统架构与技术参考](/zh/chronosync/dev/architecture/) 的「API 接口」章节。

## 📥 课表导入功能

系统支持两种课表导入方式：从教务系统导入和从ICS文件导入。

### 📚 教务系统课表导入

系统支持从山东师范大学正方教务系统导入课表。每个导入会话固定绑定一种连接方式：`webvpn`（默认）或 `direct`。

1. **获取用户课表列表**

   - `GET /api/import/schedules`
   - **描述**：获取当前用户的所有课表列表，用于选择导入目标。
   - **响应**：返回课表列表数组。

2. **创建教务会话**

   - `GET /api/import/zfw/session?connection_mode=webvpn|direct`
   - **描述**：创建独立的 `requests.Session`。WebVPN 模式先访问 SSO 入口、解析 `ssoConf.url` 中的 CAS 地址并判断是否需要验证码；直连模式直接获取正方教务验证码。
   - **响应**：

     ```json
     {
       "session_id": "string",
       "connection_mode": "webvpn",
       "captcha_required": false,
       "captcha_image": null,
       "message": "当前连接方式无需预先输入验证码",
       "source": "real"
     }
     ```

3. **提交登录信息并导入**

   - `POST /api/import/zfw`
   - **描述**：服务端在会话绑定的连接方式中完成登录，读取正方教务课表并写入目标课表。请求里的 `connection_mode` 必须与创建会话时一致，防止会话跨隧道复用。
   - **请求体**：

     ```json
     {
       "session_id": "string",
       "connection_mode": "webvpn",
       "username": "string (学号)",
       "password": "string",
       "captcha": "string | null",
       "action": "string ('create_new' 或 'use_existing')",
       "schedule_id": "integer (action为use_existing时必填)",
       "schedule_name": "string (action为create_new时的课表名称)"
     }
     ```
   - **响应**：成功时返回导入数量；如果 CAS 登录过程临时要求验证码，则保留当前会话并返回 `captcha_required=true`、`captcha_image` 和错误信息，前端可直接补填后重试。

4. **刷新验证码（可选）**

   - `GET /api/import/zfw/refresh/{session_id}?connection_mode=webvpn|direct`
   - **描述**：仅对当前会话刷新验证码。连接方式必须与会话一致。
   - **响应**：返回与创建会话接口相同的结构，并更新 `captcha_required` 与 `captcha_image`。

WebVPN 登录链路为：WebVPN SSO 入口 -> 解析 CAS 登录 URL -> `/authserver/checkNeedCaptcha.htl` -> AES-CBC 加密 CAS 密码 -> CAS 登录 -> 访问 WebVPN 改写后的正方教务地址。直连链路保留原正方 RSA 密码加密与验证码流程。账号、密码和验证码仅用于当前请求，不写入数据库或日志；会话到期后从内存缓存移除。

### 📆 ICS文件导入

系统支持从标准ICS文件导入课表事件，兼容各大日历应用（苹果日历、Google Calendar、Outlook等）导出的文件。

#### API端点

- **端点**: `POST /api/schedules/import-ics`
- **描述**: 解析ICS文件并导入事件到指定课表
- **请求格式**: `multipart/form-data`
- **参数**:
  - `file`: ICS文件（必需，只接受.ics格式）
  - `schedule_id`: 目标课表ID（必需）

#### 导入逻辑

1. **时间计算**: 根据课表的开始日期，自动计算每个事件的周数和星期几
2. **日期验证**: 自动跳过早于课表开始日期的事件
3. **事件创建**: 提取事件的标题、描述、地点、开始/结束时间等信息
4. **错误处理**: 记录导入失败的事件及原因

#### 响应示例

```json
{
  "success": true,
  "message": "成功导入 15 个事件，3 个事件导入失败",
  "count": 15,
  "errors": [
    "事件 '早期课程' 时间早于课表开始时间",
    "事件 '无效事件' 缺少时间信息"
  ]
}
```

#### 使用说明

1. 从其他日历应用（如苹果日历、Google Calendar）导出ICS文件
2. 在"我的课表"页面点击"更多" → "导入课表" → "从ICS文件导入"
3. 选择ICS文件上传
4. 系统自动解析文件并导入事件到当前活跃课表
5. 显示导入成功的数量和错误信息

## 📚 参考资料

本项目在开发过程中参考了以下开源项目和资源，特此致谢：

### 正方教务系统相关项目

- [openschoolcn/zfn_api](https://github.com/openschoolcn/zfn_api) - 正方教务系统API
- [whliao5am/zfnew](https://github.com/whliao5am/zfnew) - 正方教务系统新版本
- [whx1024/zfn_api12](https://github.com/whx1024/zfn_api12) - 正方教务系统API 1.2
- [zaigie/zfnew_webApi](https://github.com/zaigie/zfnew_webApi) - 正方教务系统Web API
- [dairoot/school-api](https://github.com/dairoot/school-api) - 学校API项目
- [DuskU/zhengfang](https://gitee.com/DuskU/zhengfang) - 正方教务系统Gitee版本
- [FarmerChillax/new-school-sdk](https://github.com/FarmerChillax/new-school-sdk) - 新学校SDK
- [Srpihot/zfapi](https://github.com/Srpihot/zfapi) - 正方教务系统API

### 课表管理相关项目

- [xxyangyoulin/ClassSchedule](https://github.com/xxyangyoulin/ClassSchedule) - 课程表项目
- [YZune/WakeupSchedule_Kotlin](https://github.com/YZune/WakeupSchedule_Kotlin) - WakeUp课程表Kotlin版本
- [qwqVictor/CQUPT-ics](https://github.com/qwqVictor/CQUPT-ics) - 重庆邮电大学ICS课表
- [XiaoNaoWeiSuo/Grade2](https://github.com/XiaoNaoWeiSuo/Grade2) - 成绩管理系统

### 技术文档

- [WakeUp课程表重构说明](https://yzune.github.io/2018/08/15/WakeUp%E8%AF%BE%E7%A8%8B%E8%A1%A8%E9%87%8D%E6%9E%84%E8%AF%B4%E6%98%8E/) - 课程表重构技术文档
- [CSDN博客 - 正方教务系统](https://blog.csdn.net/gitblog_00713/article/details/147225292) - 正方教务系统相关技术文章

### UI组件库

- [satyamchaudharydev/horrible-snake-35](https://uiverse.io/satyamchaudharydev/horrible-snake-35) - 加载动画组件（HTML/CSS）
- [Siyu1017/old-goat-8](https://uiverse.io/Siyu1017/old-goat-8) - Windows 11 风格加载动画组件

## 📄 许可证

本项目采用 MIT 许可证。

## 📞 联系我们

- 🌐 **项目主页**：[https://github.com/CelPlume/SDNUChronoSync](https://github.com/CelPlume/SDNUChronoSync)
- 📖 **使用教程**：[https://celplume.hxcn.space/zh/chronosync/tutorials/chronosync-user-guide/](https://celplume.hxcn.space/zh/chronosync/tutorials/chronosync-user-guide/)
- ℹ️ **关于本项目**：[https://celplume.hxcn.space/zh/chronosync/](https://celplume.hxcn.space/zh/chronosync/)
- 💬 **问题反馈**：通过项目 [Issues](https://github.com/CelPlume/SDNUChronoSync/issues) 提出
- 📧 **邮箱联系**：[hxcn@cnies.org](mailto:hxcn@cnies.org)

## 📝 更新日志（最近三个月）

完整版本历史见 [完整更新日志](/zh/chronosync/about/changelog/)。

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

- 开发规范、完整版本历史和通用部署说明分别集中到 `/zh/chronosync/dev/development/`、`/zh/chronosync/about/changelog/` 与 `/zh/chronosync/dev/deployment/`
- 后端完整回归 `152 passed`；前端 lint 为 0 error，类型检查和生产构建通过；真实生产 SQLite 副本已完成 PostgreSQL 18 迁移与应用 smoke
- 更新日志弹窗不再运行时请求外部站点：构建阶段直接读取仓库 `/zh/chronosync/about/changelog/`，渲染最近三个月的版本条目并内联进页面，移除后端代理接口

### v3.6.0 (2026-08-02) - 性能优化、认证安全加固与多 worker 可靠性

**登录性能与密码哈希**

- 登录验密从 bcrypt（cost=12，约 166ms）切换为 argon2id（约 41ms），存量 bcrypt 哈希在登录成功后自动重哈希升级
- 移除已停止维护的 passlib 依赖，密码哈希直连 argon2-cffi（+ bcrypt 仅作存量兼容）

**并发与响应速度**

- 66 个阻塞端点由 `async def` 改为同步 `def`（FastAPI 线程池），登录不再卡死事件循环（登录期间 `/health` 从 168ms 降至 10ms），轻量端点并发不再线性排队
- 新增 `RequestTimingMiddleware`，生产日志输出 `TIMING method path status X.Xms` 每请求耗时，支持定位慢端点
- 课表接口响应体瘦身：个人端点不再嵌套完整 schedule/owner（857KB→735KB），团队聚合端点 3.47MB→1.52MB（243→153ms），筛选端点 349KB→150KB，并消除序列化 N+1
- FastAPI 足以应对当前业务规模；关键性能基线与复测方法维护在[开发指南](/zh/chronosync/dev/development/)的性能章节

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

- [部署指南](/zh/chronosync/dev/deployment/)新增“数据库配置”章节：PostgreSQL 连接池参数、`pg_dump`/`pg_restore` 备份恢复、从 SQLite 迁移的步骤
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
