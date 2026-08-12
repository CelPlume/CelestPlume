---
title: 前端设计指南
description: 语义 token、配色系统、暗黑模式策略、统一组件（InfoBox、TabBar、PickerPopover、CodeEditor）、两种 tab 规范、组件全景清单与踩坑记录。
sidebar:
  order: 8
---
# SDNUChronoSync 前端设计系统（Design System / DESIGN.md）

> 本文档是前端**视觉、交互与主题设计**的唯一事实来源（source of truth）。
> 它记录：语义 token 体系、暗黑模式策略、配色、字体、圆角/阴影、共享组件类、统一组件
> （`InfoBox`/`TabBar`/`PickerPopover`/`CodeEditor`）、两种 tab 的规范与平滑切换、全部组件
> 全景清单、以及踩过的每一个坑。
>
> **规则**：新增/修改任何颜色、字号、圆角、阴影、暗色行为、交互组件前，**先读本文档**，保持与既有体系一致。
>
> 配套文档：更新日志 `docs/CHANGELOG.md`；架构 `docs/architecture.md`；部署 `docs/DEPLOYMENT.md`；
> 开发流程 `docs/DEVELOPMENT.md`。

## 目录

1. [文档目的与约定](#1-文档目的与约定)
2. [主题策略总览](#2-主题策略总览)
3. [语义 Token 体系（CSS 变量）](#3-语义-token-体系css-变量)
4. [配色系统（Tailwind 色板）](#4-配色系统tailwind-色板)
5. [字体排版 Typography](#5-字体排版-typography)
6. [圆角 / 阴影 / 间距](#6-圆角--阴影--间距)
7. [共享组件类（addComponents）](#7-共享组件类addcomponents)
8. [统一组件一：InfoBox（提示框）](#8-统一组件一infobox提示框)
9. [统一组件二：TabBar（页签）](#9-统一组件二tabbar页签)
10. [统一组件三：PickerPopover（日期/时间选择）](#10-统一组件三pickerpopover日期时间选择)
11. [统一组件四：CodeEditor（代码编辑器）](#11-统一组件四codeeditor代码编辑器)
12. [Tab 系统规范（两种 tab + 平滑切换）](#12-tab-系统规范两种-tab--平滑切换)
13. [头像与团队封面色板](#13-头像与团队封面色板)
14. [后端联动（availability / 头像上传）](#14-后端联动availability--头像上传)
15. [组件全景清单（按页/功能检索）](#15-组件全景清单按页功能检索)
16. [暗黑模式踩坑记录（Lession Learned）](#16-暗黑模式踩坑记录lession-learned)
17. [验证方法论（浏览器审计 / 构建）](#17-验证方法论浏览器审计--构建)
18. [提交规范与工作流](#18-提交规范与工作流)

---

## 1. 文档目的与约定

### 1.1 为什么写这份文档

本项目的深色模式、token 体系和统一组件是**多次迭代、踩了大量坑**之后收敛出来的。曾经出现过：

- 每个组件各自硬编码颜色 → 深浅色不统一、反复遗漏；
- `:global(.dark)` 在 Vue scoped 里不编译 → 深色永远不生效却查不到原因；
- 激活 tab 与容器同色 → 深色下「看不出激活」；
- 主按钮 hover 成近白 → 白字看不见；
- 嵌套弹窗一点就关；
- 全库修复脚本误伤 → 把正确的深色变体删掉。

这份文档把这些经验**固化下来**，让后续任何修改都能「一次做对」，并且让组件可检索、可复用。

### 1.2 核心约定（必须遵守）

1. **能用 token 用 token**（CSS 变量）；只能局部的补 `dark:` 变体；**禁止逐组件硬编码十六进制颜色**。
2. **提示框一律用 `InfoBox`**；页签/分段一律用 `TabBar` 或遵守其激活态基准。
3. **深色激活态基准**：容器 `dark:bg-neutral-800`，激活 `dark:bg-neutral-700`，文字 `dark:text-neutral-50`。
4. **主按钮 hover 用 `hover:bg-primary-500`**，绝不用 `hover:bg-primary-50`，绝不用非法透明度 `/300`。
5. **scoped 样式里的深色覆写必须用非 scoped `<style>` 块**，`<style scoped>` 内 `:global(html.dark)` 不编译。
6. **z-index 用 token**（`--layer-*`），不用 `z-[9999]` 魔数。
7. 改完必须：`grep -rnE "\]\s+dark:"` 为空 → `vue-tsc` → `eslint` → `astro build` → 无头浏览器逐页审计。

---

## 2. 主题策略总览

### 2.1 暗黑模式开关

- **`tailwind.config.mjs`**：`darkMode: 'class'`。`<html>` 上挂 `dark` 类即进入深色。
- **store**：`frontend/src/stores/theme.ts` 统一读写。localStorage key：`app-theme`，值 `dark` / `light`。
- **主题切换按钮**（`Navigation.vue`）：为避免 SSR/客户端 hydration 不一致（sun/moon 图标 `d` 路径不同导致的
  Vue warn），**同时渲染太阳+月亮两个图标**，用 `dark:block` / `dark:hidden` 的 CSS 类切换显示，而不是
  `v-if="isDark"`。这样 SSR 与客户端 DOM 完全一致。

```html
<SunIcon class="h-5 w-5 hidden dark:block" aria-hidden="true" />
<MoonIcon class="h-5 w-5 dark:hidden" aria-hidden="true" />
```

### 2.2 深色不靠「反色滤镜」

历史上有过一个 `filter: invert()` hack，已删除——它会连带反掉图片、品牌色、Logo，且无法精确控制。

### 2.3 两条并行机制

| 机制 | 适用场景 | 说明 |
|---|---|---|
| ① 语义 token（CSS 变量） | 表面/边框/文字/强调色的**页面级**大面积 | `BaseLayout.astro` 定义，`:root` 浅色、`html.dark` 深色，组件消费 `var(--...)` 自动切换 |
| ② Tailwind `dark:` 变体 | 单个组件内的小色块 | 类名补 `dark:bg-…`、`dark:text-…` 等 |

> 六个 showcase mock 组件（`*Showcase.vue`、`PerspectiveSchedule.vue`）已全部改为消费 token（机制 ①）。

---

## 3. 语义 Token 体系（CSS 变量）

定义位置：`frontend/src/layouts/BaseLayout.astro` 的全局 `<style is:global>`。

### 3.1 层级（z-index）token

| 变量 | 值 | 用途 |
|---|---|---|
| `--layer-dropdown` | 1200 | 下拉菜单 |
| `--layer-popover` | 1250 | 弹出层/选择器 |
| `--layer-modal` | 1400 | 弹窗 |
| `--layer-toast` | 1500 | Toast 通知（最顶层） |

使用：`style="z-index: var(--layer-modal)"`。**禁止**写死 `z-[9999]` 等魔数（会跟 toast/modal 打架）。

### 3.2 语义色 token

| 变量 | 浅色 | 深色 (`html.dark`) | 用途 |
|---|---|---|---|
| `--bg-page` | `#f8fafc` | `#0f172a` | 页面底 |
| `--bg-card` | `#ffffff` | `#1e293b` | 卡片/面板表面 |
| `--bg-muted` | `#f1f5f9` | `#334155` | 次级表面（输入底） |
| `--bg-subtle` | `#e2e8f0` | `#475569` | 更弱表面（分隔/悬停底） |
| `--border` | `#e2e8f0` | `#334155` | 常规边框 |
| `--border-strong` | `#cbd5e1` | `#475569` | 强调边框 |
| `--text` | `#0f172a` | `#f8fafc` | 主文字 |
| `--text-2` | `#475569` | `#cbd5e1` | 次级文字 |
| `--text-3` | `#64748b` | `#94a3b8` | 弱文字/占位 |
| `--text-4` | `#94a3b8` | `#64748b` | 最弱文字 |
| `--accent` | `#0ea5e9` | `#38bdf8` | 强调色（主色） |
| `--accent-strong` | `#0284c7` | `#0ea5e9` | 强调色（按下/实底） |
| `--accent-soft` | `#e0f2fe` | `#0c4a6e` | 强调色浅底 |

消费示例：

```css
.card {
  background: var(--bg-card);
  color: var(--text);
  border-color: var(--border);
}
```

---

## 4. 配色系统（Tailwind 色板）

`frontend/tailwind.config.mjs` → `theme.extend.colors`。

### 4.1 `primary`（强调主色 = 天蓝 sky）

> 全站唯一强调色。历史曾有 `secondary`（fuchsia 紫）色板，已删除；`sky` 也已并入 `primary`。

| 阶 | 值 |
|---|---|
| 50 | `#f0f9ff` |
| 100 | `#e0f2fe` |
| 200 | `#bae6fd` |
| 300 | `#7dd3fc` |
| 400 | `#38bdf8` |
| 500 | `#0ea5e9` |
| 600 | `#0284c7` |
| 700 | `#0369a1` |
| 800 | `#075985` |
| 900 | `#0c4a6e` |

> ⚠️ **`primary` 只有 50–900，没有 950。** 任何 `primary-950` 类都是无效的、会被 Tailwind 静默丢弃（深色不生效）。
> 写深色浅底时用 `primary-900`，如 `dark:bg-primary-900/30`。

### 4.2 `neutral`（中性色 = slate）

> 全站统一用 `neutral` 替代散落的 `gray`/`slate`。**不要**再引入 `gray-*`/`slate-*`。

| 阶 | 值 |
|---|---|
| 50 | `#f8fafc` |
| 100 | `#f1f5f9` |
| 200 | `#e2e8f0` |
| 300 | `#cbd5e1` |
| 400 | `#94a3b8` |
| 500 | `#64748b` |
| 600 | `#475569` |
| 700 | `#334155` |
| 800 | `#1e293b` |
| 900 | `#0f172a` |
| 950 | `#020617` |

> `neutral-800`（#1e293b）是**卡片/面板**标准深色；`neutral-700`（#334155）是**激活态**标准；`neutral-900`（#0f172a）是**页面/凹陷轨道**标准。

### 4.3 强调辅助色（语义色）

沿用 Tailwind 默认 `blue`/`emerald`/`amber`/`red`（均含 950）。深色统一约定：

| 语义 | 浅色 | 深色 |
|---|---|---|
| 信息 | `bg-blue-50 text-blue-800 border-blue-200` | `dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800` |
| 成功 | `bg-green-50 text-green-800` | `dark:bg-green-900/25 dark:text-green-200` |
| 警告 | `bg-amber-50 text-amber-800` | `dark:bg-amber-900/25 dark:text-amber-200` |
| 危险 | `bg-red-50 text-red-800` | `dark:bg-red-900/25 dark:text-red-200` |
| 强调（紫） | `bg-purple-50 text-purple-800` | `dark:bg-purple-900/30 dark:text-purple-200` |
| 强调（橙） | `bg-orange-50 text-orange-800` | `dark:bg-orange-900/25 dark:text-orange-200` |

---

## 5. 字体排版 Typography

`tailwind.config.mjs` → `theme.extend.fontFamily`。

| 族 | 字体栈 | 用途 |
|---|---|---|
| `sans` | 系统无衬线栈（`-apple-system`、`PingFang SC`、`Microsoft YaHei` 等） | 正文/UI |
| `display` | `STSong`、`Songti SC`、`Noto Serif SC`、`SimSun` 等衬线 | 展示/标题 |

`BaseLayout.astro` 里 `html` 全局设了 `font-family: -apple-system, ...`，保证中文环境一致。

---

## 6. 圆角 / 阴影 / 间距

### 6.1 圆角约定

| 用途 | 值 |
|---|---|
| 小按钮 / 徽章 | `rounded-md` / `rounded-lg` |
| 卡片 / 面板 | `rounded-xl` / `rounded-2xl` |
| 大面板 / 弹窗 | `rounded-[28px]`（如 ShareScheduleView） |
| 胶囊（多选/分段） | `rounded-full` |

### 6.2 阴影约定

- 卡片阴影统一 `shadow-sm` / `shadow-xl`（弹窗）。
- **深色下大多数卡片阴影要关掉** `dark:shadow-none`（深色底上阴影不明显，且会显得脏）。
- 主按钮光晕 `shadow-[0_16px_36px_-18px_rgba(2,132,199,0.95)]` 只在浅色用，深色 `dark:shadow-none`。

### 6.3 间距

- 页面边距 `p-4 md:p-6`；弹窗内边距 `px-4 pb-4 pt-5 sm:p-6`。
- tab/分段容器内 `p-1`。

---

## 7. 共享组件类（addComponents）

定义位置：`tailwind.config.mjs` → `plugins` → `addComponents`。全部已内置 `dark:` 变体（除注明外）。

| 类名 | 用途 | 暗色 |
|---|---|---|
| `.input-base` | 标准输入框 | ✅ |
| `.select-base` | 标准下拉框 | ✅ |
| `.input-search` | 带左图标搜索框 | ✅ |
| `.dropdown-button` / `.dropdown-menu` / `.dropdown-item` / `.dropdown-search` / `.dropdown-search-input` / `.dropdown-check` | Headless 下拉 | ✅ |
| `.picker-input-base` / `.picker-trigger-button` | Picker 输入/触发钮 | ✅ |
| `.btn-secondary` / `.btn-primary` | 次级/主按钮 | ✅ |
| `.warning-surface` / `.warning-surface-soft` | 琥珀提示框（旧类，深色已补 `.dark .warning-surface` 覆写） | ✅ |
| `.btn-clear-selection` | 取消选择小按钮 | ⚠️ 仍用 `slate-*`，尚未迁移 neutral |
| `.scrollbar-custom` | 自定义滚动条 | — |

> 新代码优先复用这些类，而不是手写一整套 `@apply`。
> ⚠️ `addComponents` 里的自定义类**没有 `dark:` 自动变体**，需要手动补 `.dark .xxx { … }` 覆写。

---

## 8. 统一组件一：InfoBox（提示框）

文件：`frontend/src/components/InfoBox.vue`。

### 8.1 背景

曾散落大量语义提示框（「重要提示」「注意事项」「危险操作」「临时约课」「已登录教务系统」「代码注入」等），
每个组件各自硬编码配色 → 深浅色不统一、反复遗漏。现收敛为单一组件，三种变体：

| variant | 语义 | 浅色 | 深色 |
|---|---|---|---|
| `info` | 说明/提示 | `bg-primary-50 text-primary-900 border-primary-200` | `dark:bg-primary-900/25 dark:text-primary-100 dark:border-primary-800/70` |
| `warning` | 注意事项 | `bg-amber-50 text-amber-900 border-amber-200` | `dark:bg-amber-900/25 dark:text-amber-100 dark:border-amber-800/70` |
| `danger` | 危险操作 | `bg-red-50 text-red-900 border-red-200` | `dark:bg-red-900/25 dark:text-red-100 dark:border-red-800/70` |

### 8.2 用法

```vue
<InfoBox variant="warning" title="注意事项">
  <ul class="list-disc list-inside">
    <li>转让后您将不再是团队创建者</li>
    <li>此操作不可撤销</li>
  </ul>
</InfoBox>
```

### 8.3 已迁移位置

`TransferTeamModal`（注意事项）、`DissolveTeamModal`（危险操作）、`TemporaryTeamDrawer`（临时约课说明）、
`ScheduleImporter`（重要提示）。新增同类提示框一律用 `InfoBox`，**不要再写硬编码色块**。

---

## 9. 统一组件二：TabBar（页签）

文件：`frontend/src/components/TabBar.vue`。

### 9.1 背景

系统设置、团队管理等处的 tab 栏各写一份，激活态深浅色不一致（曾出现激活 tab 与容器同为
`dark:bg-neutral-800` 导致深色下「看不出激活」）。现收敛为单一组件。

### 9.2 Props 与用法

- `tabs: { id, name|label }[]`、`modelValue`（激活 id）、`stretch?: boolean`（按钮平分占满宽度）。
- `v-model` 双向绑定。

```vue
<TabBar :tabs="tabs" v-model="activeTab" />
<TabBar stretch :tabs="[{id:'swap',name:'对调工作日'},{id:'holiday',name:'设置假期'}]" v-model="mode" />
```

### 9.3 滑动指示器（平滑切换）

参照 `~/AinOfficialWiki` 的 `Tabs.vue`，实现**滑动指示胶囊**：

- 容器 `relative`，一个绝对定位的胶囊 `<span>`（`bg-white shadow dark:bg-neutral-700`）铺在按钮下方。
- 用 `getBoundingClientRect` 测量激活按钮的 `left`/`width`，写入 `transform: translate3d(...)` 和 `width`。
- CSS `transition-[width,transform,opacity] duration-200 ease-out` 让它平滑滑到激活 tab。
- 在 `onMounted`/`resize`/`modelValue`/`tabs` 变化时重新同步。
- 按钮只保留文字色（激活 `dark:text-neutral-50`），背景由胶囊负责。

### 9.4 已迁移位置

`admin/SystemSettings.vue`（站点/存储/邮箱/代码注入）、`TeamEditorModal.vue`（团队信息/成员管理/可见范围/操作）、
`ScheduleAdjuster.vue`（对调工作日/设置假期，`stretch`）。新增页签一律用 `TabBar`。

---

## 10. 统一组件三：PickerPopover（日期/时间选择）

文件：`frontend/src/components/PickerPopover.vue`。

- 触发按钮用共享类 `.picker-input-base` / `.picker-trigger-button`（`addComponents` 内置 dark）。
- 面板 `panelClass` 是**计算属性**里的类字符串，曾是唯一浅色点（`bg-white` 无 dark）→ 已补
  `dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none dark:ring-neutral-700`。
- 日历格子/时间/分/清空/今天/确定按钮全部有 dark 变体。
- ⚠️ 在 JS 字符串里拼 class 时，**别忘了 dark 变体**（`.vue` 模块检查看不到样式，用构建产物核对）。

---

## 11. 统一组件四：CodeEditor（代码编辑器）

文件：`frontend/src/components/CodeEditor.vue`（系统设置「代码注入」用）。

- scoped 类（`.code-editor-container`/`.line-numbers`/`.code-textarea`）写死浅色背景，**无 dark 自动变体**。
- 修复：在 `<style scoped>` 后另起**非 scoped `<style>`** 写 `html.dark .code-editor-container { … }` 等覆写，
  覆盖背景、行号、文字、错误态、滚动条。
- ⚠️ 这就是「scoped 里 `:global(html.dark)` 不编译」坑的正面解法，见 §16 第 9 条。

---

## 12. Tab 系统规范（两种 tab + 平滑切换）

本项目有两种 tab/切换器，**规范不同**，务必区分：

### 12.1 场景一：页面选项切换（TabBar / ProfilePage）

用于「同一页面不同选项切换」：个人中心、系统设置、管理团队。

- 组件：`TabBar.vue`（含滑动指示器）。
- 容器 `bg-neutral-100 dark:bg-neutral-800`；激活由**滑动胶囊**负责背景，文字 `dark:text-neutral-50`。
- **不允许有 focus 光晕边框**（`focus:ring-2 focus:ring-primary-500` 会造成「点击后一直发光，点别处才消失」）——
  只留 `focus:outline-none`。基准参照 `ProfilePage.vue`（无光晕）。
- 激活态深色基准：容器 `dark:bg-neutral-800`，激活胶囊 `dark:bg-neutral-700`，文字 `dark:text-neutral-50`。

### 12.2 场景二：选择器切换（全选/清空、多选、智能排班切换器）

用于「全选/多选/清空」或模式切换（周/日、week/date、权限选择等），散落在各表单里（`EmptyClassroomQuery`、
`BatchTeamEventModal`、`TeamScheduleTaskModal`、`AllTeamsViewPage`、`SystemSettings` 存储切换）。

- 容器 **`bg-neutral-100 dark:bg-neutral-900`**（比卡片 `neutral-800` 深一档，形成**凹陷轨道**，否则与卡片同色看不清）。
- 激活：`bg-white dark:bg-neutral-700` + `dark:text-neutral-50`（文字必须浅色，否则黑字压深底不可读）。
- 未激活：`text-neutral-600 dark:text-neutral-300`，hover `dark:hover:bg-neutral-800`。
- 平滑：已有 `transition-all` / `transition-colors`，色变平滑。

### 12.3 关键教训（反复踩）

1. **激活态文字必须有 `dark:text-neutral-50`**——曾因脚本误删导致黑字压深底不可读。
2. **激活背景不能等于容器色**（都 `dark:bg-neutral-800` 就看不出激活）。
3. **容器背景要区别于所在卡片**（同 `dark:bg-neutral-800` 则轨道隐形）→ 选择器轨道用 `dark:bg-neutral-900`。
4. **页面 tab 不要 focus 光晕**。

---

## 13. 头像与团队封面色板

- `avatarPresets` 17 组 DiceBear 风格**统一收敛为 `primary`/`neutral` 单锚调性**（不再五颜六色）。
- 预设头像上传：`avatarPresetSvgToFile` 会把生成的 SVG **栅格化为 PNG** 再上传。
  原因：后端 `ALLOWED_IMAGE_EXTENSIONS` 只收 `jpg/jpeg/png/gif/webp`，不收 SVG；且 SVG 静态服务是 XSS 向量。
- 远程头像（`gastigado.cnies.org` 等）无 CORS 头时，浏览器 `fetch` 会被拦；`<img>` 展示不受影响。

---

## 14. 后端联动（availability / 头像上传）

### 14.1 availability 周参数

- 前端 `getWeekNumber` 返回的是**日历周**（一年最多 53）；后端 availability 路由原来限制 `week ≤ 30` → 返回 422。
- 修复：team 与 temporary 两处 availability 路由 `week` 上限 `le=30 → le=53`（`reference_date` 才是真实周解析依据，
  `week` 只是兜底）。

### 14.2 头像上传

- 后端 `ALLOWED_IMAGE_EXTENSIONS = {jpg,jpeg,png,gif,webp}`，**不含 SVG**。
- 前端预设头像由 SVG 栅格化为 PNG 后上传，绕过后端校验且规避 SVG XSS。

---

## 15. 组件全景清单（按页/功能检索）

> 完整清单，方便检索「某个界面用哪个组件、深色是否覆盖」。除注明外均已深色适配。

### 15.1 顶层布局

| 组件 | 作用 | 备注 |
|---|---|---|
| `BaseLayout.astro` | 全局 token 变量、字体、body 底 | 深色基础 |
| `Navigation.vue` | 桌面侧栏 | 主题切换按钮（图标 `dark:block/hidden` 双渲染） |
| `MobileDrawer.vue` | 移动抽屉 | |
| `MobileBottomTabBar.vue` | 移动底栏 | |
| `Footer.vue` | 页脚 | |

### 15.2 课表（Schedule）

| 组件 | 作用 |
|---|---|
| `MySchedulePage.vue` | 我的课表主页面（周/日/日历/列表视图、课表选择、分享管理、统计卡） |
| `ScheduleGanttWeekView.vue` / `ScheduleDayListView.vue` / `ScheduleCalendar.vue` | 周/日/日历视图（ScheduleCalendar 的 `.week-view`/`.time-column` 用**非 scoped** `<style>` 深色覆写） |
| `ScheduleEditor.vue` / `EventModal.vue` / `EventDetailModal.vue` / `StackedEventsModal.vue` / `TeamEventDetailModal.vue` | 编辑/事件弹窗 |
| `ScheduleAdjuster.vue` | 调休（对调工作日/设置假期，TabBar stretch） |
| `ScheduleImporter.vue` / `ImportScheduleModal.vue` / `JwxtConnectionModeSelector.vue` / `ImportOptionsModal.vue` | 导入课表（WebVPN/教务选择、步骤提示） |
| `ScheduleList.vue` | 课表列表 |
| `ExportOptionsModal.vue` / `ShareOptionsModal.vue` / `ShareScheduleView.vue` / `TeamAvailabilityShareModal.vue` | 导出/分享 |
| `PickerPopover.vue` | 日期/时间选择器 |
| `EmptyClassroomQuery.vue` / `CsvImportModal.vue` / `PersonalizationModal.vue` | 找空教室/CSV 导入/个性化 |

### 15.3 团队（Team）

| 组件 | 作用 |
|---|---|
| `MyTeamsPage.vue` / `TeamList.vue` / `AllTeamsViewPage.vue` | 我的团队/团队列表/团队视图 |
| `TeamViewPage.vue` | 团队视图（周/月/热力图、筛选栏） |
| `TeamEditorModal.vue` | 管理团队（团队信息/成员/可见范围/团队操作；TabBar；批量添加日程/智能排班/转让/解散 按钮） |
| `DissolveTeamModal.vue` / `TransferTeamModal.vue` / `LeaveTeamModal.vue` | 解散/转让/退出确认弹窗 |
| `TeamHeatmapDrawer.vue` / `TeamAvailabilityGrid.vue` / `TeamSlotDetailDrawer.vue` | 热力图/共同空闲 |
| `TeamScheduleTaskModal.vue` / `BatchTeamEventModal.vue` / `BatchOperationsLog.vue` / `TemporaryTeamDrawer.vue` | 智能排班/批量添加/批量操作日志/临时约课 |
| `CreateTeam.vue` / `JoinTeam.vue` / `AvatarPresetDrawer.vue` / `TutorialEntry.vue` | 创建/加入团队、头像预设 |
| `UserScheduleViewer.vue` / `TeamMemberSchedulePanel.vue` / `TeamMemberStrip.vue` / `ActionConfirmModal.vue` / `FilterSidebar.vue` | 成员课表/成员条/确认/筛选 |

### 15.4 管理后台（admin）

| 组件 | 作用 |
|---|---|
| `admin/UserManagementPage.vue` | 用户管理（表格/下拉/封禁） |
| `admin/AdminTeamManagement.vue` | 团队管理（编辑/删除/成员） |
| `admin/SystemSettings.vue` | 系统设置（站点/存储/邮箱/代码注入；TabBar + CodeEditor） |
| `admin/UserEditModal.vue` / `admin/BanUserModal.vue` / `admin/UserScheduleModal.vue` / `admin/ConfirmDeleteModal.vue` / `admin/BatchRestoreConfirmToast.vue` | 子弹窗/确认/批量恢复 |

### 15.5 认证 / 着陆 / 导航

| 组件 | 作用 |
|---|---|
| `LoginForm.vue` / `RegisterForm.vue` / `ForgetPasswordForm.vue` / `ForceBindEmailModal.vue` / `FirstStartAdminModal.vue` | 登录/注册/找回/邮箱绑定/初始管理员 |
| `LandingNavbar.vue` / `CTASection.vue` / `FeatureSection.vue` / 6 个 `*Showcase.vue` / `PerspectiveSchedule.vue` | 着陆页 |
| `ChangelogModal.vue` | 更新日志（`dark:prose-invert`） |
| `InAppBrowserPrompt.vue` | 应用内浏览器提示 |

### 15.6 统一组件与复用规则

1. **提示框** → `InfoBox.vue`
2. **页签/分段** → `TabBar.vue`；选择器切换器遵守「容器 `dark:bg-neutral-900` + 激活 `dark:bg-neutral-700`」基准
3. **输入框/下拉/选择器** → `.input-base`/`.select-base`/`.dropdown-*`/`.picker-*`（`addComponents`，内置 dark）
4. **语义色块** → 统一 `bg-*-50 dark:bg-*-900/N + text-*-800 dark:text-*-200` 约定
5. **主按钮 hover** → `bg-primary-600 hover:bg-primary-500`（不要 `hover:bg-primary-50`，不要非法透明度 `/300`）

---

## 16. 暗黑模式踩坑记录（Lession Learned）

> 每条都曾造成「深色不生效」「构建失败」或「交互 bug」，务必牢记。

1. **`primary-950` 不存在**。`dark:bg-primary-950/30` 静默无效 → 深色下表面保持浅色。一律改用 `primary-900`。
2. **`:global(.dark)` 不会编译进 Vue scoped style**。正确做法：Tailwind `dark:` 变体或 CSS 变量。
3. **`dark:` 追加到 `:class` 绑定外 = 构建报错**。检查：`grep -rnE "\]\s+dark:" components/` 必须为空
   （`transition-[...]` 任意值里的 `]` 是误报）。
4. **`addComponents` 自定义类没有 dark 自动变体**，需手动 `.dark .xxx { … }` 覆写（如 `.warning-surface`）。
5. **`hover:bg-white`/`hover:bg-neutral-50` 深色下会变亮**，补 `dark:hover:bg-neutral-800`。
6. **WSL2 文件监听不可靠，dev server 会 stale**。用 `curl` 核对模块、删缓存干净重启、以 `astro build` 为准。
7. **z-index 用 token 不用魔数**。
8. **无头浏览器审计**：亮度 `0.299r+0.587g+0.114b > 215` 且面积 `>40×40` 记为漏网浅色。
9. **scoped 里 `:global(html.dark)` 不被编译** → 用**非 scoped `<style>`** 写 `html.dark .xxx`（ScheduleCalendar/CodeEditor/PersonalizationModal）。
10. **激活 tab = 容器色 = 看不见** → 激活 `dark:bg-neutral-700`。
11. **主按钮 `hover:bg-primary-50` 白字消失**；**非法透明度 `/300`** 让深色 hover 失效 → `hover:bg-primary-500`。
12. **嵌套弹窗一点就关**：子弹窗 `Teleport to="body"` 在父面板 DOM 之外，点击子弹窗触发父 outside-click。
    修复：子弹窗开关加进父 `Dialog` 的 `:static` **且**加进 `handleClose` 的早返回守卫。
13. **多个 dev server 抢端口**：旧进程占 4322 → 浏览器拿旧模块。`ss -tlnp | grep :4322` 确认单实例。
14. **语义色块统一约定**：`bg-red-50 dark:bg-red-900/25`、`bg-blue-50 dark:bg-blue-900/30` 等 + `text-*-800 dark:text-*-200`。
15. **`hover:dark:` 非规范写法会被误判**：功能等价 `dark:hover:`，但正则按 `dark:bg-*` 会误匹配。一律写 `dark:hover:`。
16. **全库脚本「按行补 dark」会误伤**：某行已有别的 `dark:` 变体时，别再补默认色；且勿把 `hover:dark:bg-*` 当冲突背景。
17. **JS 字符串拼 class 也要带 dark**（如 PickerPopover `panelClass`）；`.vue` 模块检查看不到样式，用构建产物核对。

---

## 17. 验证方法论（浏览器审计 / 构建）

### 17.1 必跑清单

改完任何深色/交互后，按序执行：

```bash
cd frontend
grep -rnE "\]\s+dark:" src/components/      # 必须为空
bun run type-check                            # vue-tsc 0 错误
bun run lint                                  # 0 错误（存量 warning 可忽略）
bun run build                                 # astro build 14 页成功
```

### 17.2 无头浏览器逐页审计

用 Playwright/puppeteer 打开每个页面，注入 `access_token` + `app-theme=dark`，遍历所有元素：

```js
const lum = (c) => { const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return m ? 0.299*m[1]+0.587*m[2]+0.114*m[3] : -1; };
// 对每个元素：opacity>0.05 && width>40 && height>40 && lum(bgColor)>215 → 漏网浅色
```

按面积排序逐处修。

### 17.3 测试账号

- 后端用 **PostgreSQL**（`DATABASE_URL=postgresql+psycopg://chronosync:...@localhost:5432/chronosync`），
  不是 SQLite。SQLite 里插的用户对运行中的后端**无效**。
- admin 账号：`admin` / `975280hc`（测试用）。
- JWT 有效期 15 分钟，测试间隔久需重新登录刷新 token。

### 17.4 dev server 排障

- 确认只有一个 astro dev 进程占 4322：`ss -tlnp | grep :4322`。
- 模块是否最新：`curl http://localhost:4322/src/components/<File>.vue`。
- 样式是否进产物：`astro build` 后 grep `dist/` 里的 CSS/JS（`<style>` 单独注入，不在 `.vue` 模块里）。

---

## 18. 提交规范与工作流

### 18.1 约定式提交（Conventional Commits）

按功能/模块分组提交，格式 `type(scope): subject`：

| type | 用途 |
|---|---|
| `feat` | 新功能/深色适配 |
| `fix` | bug 修复 |
| `docs` | 文档 |
| `refactor` | 重构（不改行为） |
| `chore` | 杂项 |

本项目按模块提交的示例：

```text
feat(dark-mode): establish design token system and unified UI components
feat(dark-mode): adapt schedule and classroom views
feat(dark-mode): adapt team, heatmap and temporary-scheduling views
feat(dark-mode): adapt admin user, team and system pages
feat(dark-mode): adapt auth, landing, navigation and showcase views
feat(avatar): converge preset accents to primary palette and rasterize to PNG
fix(api): accept calendar-week in availability queries
```

### 18.2 提交纪律

- **只提交自己的改动**。见到 git 里不是你的（如 `.gitignore` 里的 `_apkwork/*`、`server-sync/`，或别人的
  未提交文件）**不要动**，用 `git add <明确文件>` 精确暂存，别用 `git add .`。
- 一次提交一个模块，body 写清「为什么改、约束、取舍」。
- 提交前确保 `type-check` + `build` 通过。

### 18.3 修改流程

1. 先读本 `DESIGN.md` + `tailwind.config.mjs` + `BaseLayout.astro`。
2. 能用 token 用 token；局部用 `dark:`；提示框用 `InfoBox`；页签用 `TabBar`。
3. 改完跑 §17.1 必跑清单 + 无头浏览器逐页审计。
4. 按模块约定式提交，只 `git add` 自己的文件。

---

## 19. 深色实现细则（正确 vs 错误对照）

### 19.1 卡片/面板

```html
<!-- ✅ 正确：卡片在深色用 neutral-800，阴影关掉 -->
<div class="rounded-xl bg-white shadow-sm dark:bg-neutral-800 dark:shadow-none">

<!-- ❌ 错误：深色没补背景 → 白卡片 -->
<div class="rounded-xl bg-white shadow-sm">
```

### 19.2 主按钮（白字）

```html
<!-- ✅ 正确：hover 到 primary-500（仍够深，白字可见） -->
<button class="bg-primary-600 text-white hover:bg-primary-500">

<!-- ❌ 错误：hover 到 primary-50（近白）→ 白字看不见 -->
<button class="bg-primary-600 text-white hover:bg-primary-50">

<!-- ❌ 错误：非法透明度 /300（仅支持 /0–/100）→ 深色 hover 失效 -->
<button class="bg-primary-600 text-white dark:hover:bg-primary-900/300">
```

### 19.3 页面 tab（TabBar）

```html
<!-- ✅ TabBar：激活由滑动胶囊负责，文字浅色，无 focus 光晕 -->
<TabBar :tabs="tabs" v-model="activeTab" />
```

### 19.4 选择器切换器（全选/清空等）

```html
<!-- ✅ 容器凹陷轨道 neutral-900（区别于卡片 800），激活 neutral-700 + 浅文字 -->
<div class="rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-900">
  <button :class="selected
    ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-neutral-50'
    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'">全选</button>

<!-- ❌ 错误：激活=容器同色（都 800）→ 看不出激活；激活文字没 dark:text → 黑字不可读 -->
```

### 19.5 语义色块

```html
<!-- ✅ 信息：bg-blue-50 dark:bg-blue-900/30 + text-blue-800 dark:text-blue-200 -->
<div class="rounded-md bg-blue-50 p-4 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">

<!-- ❌ 错误：只写浅色 -->
<div class="rounded-md bg-blue-50 p-4 text-blue-800">
```

### 19.6 输入框

```html
<!-- ✅ 用共享类 .input-base（addComponents 内置 dark） -->
<input class="input-base" />

<!-- ❌ 错误：手写 bg-white 忘 dark -->
<input class="bg-white border-neutral-200" />
```

---

## 20. 深色实现 Playbook（一步步）

给「把某个页面/组件做深色」的完整步骤：

1. **读规范**：先看 `DESIGN.md` §4 色板、§7 共享类、§12 tab 规范。
2. **找浅色**：`grep -nE "bg-white|bg-neutral-50|text-neutral-900|border-neutral-200" <File>.vue`。
3. **分两类**：
   - 页面大面积/卡片 → 用 token（`var(--bg-card)`）或 `dark:bg-neutral-800/900`；
   - 语义色块 → 按 §4.3 约定补 `dark:bg-*-900/N + dark:text-*-200`；
   - 按钮/交互 → 按 §19 正确写法。
4. **scoped 样式里写死的颜色** → 另起非 scoped `<style>` 写 `html.dark .xxx`。
5. **校验**：
   - `grep -rnE "\]\s+dark:"` 为空；
   - `vue-tsc`、`astro build` 通过；
   - 无头浏览器逐页审计（§17.2），确认 0 残留浅色、激活态可见、hover 正常。
6. **提交**：按模块 `feat(dark-mode): ...` 约定式提交，只 `git add` 本模块文件。

---

## 21. 常见问题 FAQ

**Q：深色下某块还是白的，代码里明明有 dark？**
A：大概率是 dev server stale（§16 第 6、13 条）。`curl` 核对模块、确认单实例、硬刷新；以 `astro build` 产物为准。

**Q：激活 tab 看不见？**
A：激活背景与容器同色（都 `dark:bg-neutral-800`）。改激活为 `dark:bg-neutral-700`（§16 第 10 条）。

**Q：点击 tab 后一直有个发光边框？**
A：是 `focus:ring-2 focus:ring-primary-500`。去掉，只留 `focus:outline-none`（§12.1）。

**Q：选中的文字黑乎乎看不清？**
A：激活态忘了 `dark:text-neutral-50`（§16 第 10/15 条）。

**Q：scoped 里写 `:global(html.dark)` 没用？**
A：Vue scoped 不编译它。用非 scoped `<style>` 块（§16 第 9 条）。

**Q：嵌套弹窗（解散）一点就关？**
A：子弹窗 teleport 到 body，触发父弹窗 outside-click。把子开关加进父 `:static` **并**加进 `handleClose` 守卫（§16 第 12 条）。

**Q：`hover:dark:bg-*` 对吗？**
A：功能等价 `dark:hover:bg-*`，但非规范且会被工具误判，一律写 `dark:hover:`（§16 第 15 条）。

**Q：后端 availability 报 422？**
A：前端发日历周（最大 53），后端原来限 30。已放宽到 53（§14.1）。

**Q：预设头像上传 400？**
A：SVG 不被后端接受。前端栅格化为 PNG 再传（§13）。

---

## 22. 各模块深色实现要点（深度复盘）

### 22.1 课表模块

- `ScheduleCalendar.vue` 的 `.week-view`/`.time-column`/`.time-column-header` 是 **scoped 类写死白底**，
  已用**非 scoped `<style>`** 补 `html.dark` 覆写（§16 第 9 条）。滚动条 track/thumb 也深色化。
- `MySchedulePage.vue` 的打印/导出视图（内联 `background:#ffffff`）是**故意白**（打印用），**不要动**。
- `ScheduleAdjuster.vue` 的「对调工作日/设置假期」已迁移到 `TabBar stretch`（平分两个标签）。
- `EmptyClassroomQuery.vue` 的周/日/节次选择器：容器 `dark:bg-neutral-900` 凹陷轨道 + 激活 `dark:bg-neutral-700`。

### 22.2 团队模块

- `TeamEditorModal.vue` 的批量添加日程/智能排班/转让/解散按钮：`bg-white dark:bg-neutral-800` +
  `border-*-300 dark:border-*-800` + `text-*-700 dark:text-*-300` + `hover:bg-*-50 dark:hover:bg-*-900/30`。
- `DissolveTeamModal` 一点就关的根因是父 `TeamEditorModal` 的 `handleClose` 守卫漏了 `showDissolveModal`；
  **已修复**：`:static` 列表 + `handleClose` 早返回都含 `showDissolveModal`（§16 第 12 条）。
- 团队成员徽章：创建者 `bg-blue-100 dark:bg-blue-900/40`、管理员 `bg-purple-100 dark:bg-purple-900/40`。

### 22.3 管理后台

- 表格行操作下拉 `z-[260]`，行 `focus-within:z-[220]` 让打开菜单的行高于相邻行（z-index 约定）。
- 用户列表操作格 `sticky right-0 z-[90]`，下拉菜单在 `z-[260]` 容器内。
- `SystemSettings.vue` 的代码注入用 `CodeEditor.vue`（非 scoped 深色覆写）。
- 管理端三页已全量深色：user-management（142 处 dark）、team-management（139）、system-settings（102）。

### 22.4 认证/着陆

- 主题切换图标用双渲染 + `dark:block/hidden`，消除 hydration mismatch（§2.1）。
- 更新日志 `ChangelogModal` 用 `dark:prose-invert` 让 markdown 正文在深色下变浅。
- 六个 showcase mock 消费 token（`var(--bg-card)` 等），深色自动切换。

### 22.5 头像

- 17 组预设 accent 收敛到 primary/neutral。
- 上传路径 SVG→PNG 栅格化（§13）。