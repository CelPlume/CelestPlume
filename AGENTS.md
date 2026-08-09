# AGENTS.md

面向 AI 编码助手（及协作者）的项目说明。

## 包管理规则（重要）

本项目**仅允许使用 [bun](https://bun.sh/) 作为包管理器与脚本运行器**。

- ✅ 允许：`bun install`、`bun run dev`、`bun run build`、`bun add <pkg>`、`bunx <cmd>`
- ❌ **禁止**：`npm`、`pnpm`、`yarn`（包括 `npm install`、`pnpm add`、`yarn dev` 等）

如需安装依赖或运行脚本，请一律使用 bun。

## 技术栈

- [Astro](https://astro.build/) + [@astrojs/starlight](https://starlight.astro.build/)
- 双语文档站点：英文（默认 `root`）与简体中文（`zh`）

## 常用命令

```bash
bun install        # 安装依赖
bun run dev        # 本地开发服务器（默认 http://localhost:4321）
bun run build      # 构建生产版本到 dist/
bun run preview    # 预览生产构建
bun run typecheck  # TypeScript 类型检查
bun run lint       # ESLint 代码检查
```

## 提交信息规范（重要）

遵循 [Conventional Commits 约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)
（参考 `~/AinOfficialWiki/AGENTS.md` 与 `~/BrushUp/AGENTS.md` 的约定，详见两者
「提交信息规范」/「约定式提交（强约束）」章节）。

- **格式**：`<type>(<scope>): <subject>`，subject 后空一行接 body，末尾可选 footer
- **type**（必选）：

  | type | 用途 |
  |---|---|
  | `feat` | 新功能 |
  | `fix` | 缺陷修复 |
  | `docs` | 仅文档变更 |
  | `style` | 格式/样式，不影响逻辑 |
  | `refactor` | 重构，不改行为 |
  | `perf` | 性能优化 |
  | `test` | 测试 |
  | `build` | 构建系统/依赖 |
  | `ci` | CI 配置 |
  | `chore` | 其他不修改 src/test 的变更 |
  | `revert` | 回退先前的提交 |

- **scope**（可选）：影响范围（模块/组件/文件名）。本项目常用：
  `docs-kit`（`src/lib/ui`）、`starlight`（覆盖组件）、`home`（主页）、`deps`（依赖）、
  `docs`（文档内容）、`config`（工程配置）
- **subject**：中文、简短（≤50 字），概括本次提交的动机而非过程
- **body**：说明改动点、影响范围与必要背景；用**多个独立 `-m`** 组织
  （第一个 `-m` 为标题，后续每个 `-m` 一段无序列表项）；
  **禁止**用 `\n` 把多条说明塞进单个 `-m` 伪装多段
- **footer**（可选）：`BREAKING CHANGE:` 等；如需决策记录可用
  `Constraint:` / `Rejected:` / `Directive:` / `Tested:` trailer
- 示例：

  ```bash
  git commit \
    -m "fix(docs-kit): 修复 ClerkTOC 首项无轨道覆盖" \
    -m "- 过滤 Starlight Overview 伪条目（slug 为 _top）" \
    -m "- 轨道测量改为整条 item 高度，主色线到达轮廓顶部" \
  ```

## 验证规则（重要）

每次修改代码（`.astro`、`.ts`、`.tsx`、`.js` 等源文件）后，**必须** 依次执行以下验证：

1. `bun run typecheck` — TypeScript 类型检查必须通过
2. `bun run lint` — ESLint 检查必须通过
3. `bun run build` — 生产构建必须通过

若仅修改文档内容（`.md` / `.mdx` 文档文件）或静态资源，只需执行 `bun run build` 验证构建通过即可。

**禁止**在 typecheck / lint / build 报错时交付代码。

## 命名与 i18n 规范

- 英文页面品牌名：`Celest Plume`（完整名，hero/关于等详细处使用）、`CelPlume`（缩写，导航/按钮/卡片等一般位置使用）
- 中文页面品牌名：`天空之翼`（一般位置）、`Celest Plume` 仅在 hero 主标题区保留英文名
- 中文页面不应出现英文文案（品牌名、技术术语除外）；英文页面不应出现中文文案
- 主页 i18n：`src/pages/index.astro`（英文 `/`）与 `src/pages/zh/index.astro`（中文 `/zh/`）为两个独立页面，
  共用 `src/components/HomePage.astro` 与 `src/layouts/Home.astro`，文案全部来自 `src/styles/celestial-tokens.ts` 的 `UI_EN` / `UI_ZH`
- 主页左上角 Logo：`/images/CelPlume.webp`（带文字的完整 Logo）
- Favicon：`/images/CelPlume_favicon_256.jpg`
- 深浅色模式：主页和文档页均需完整支持深/浅色切换，不得有"浅色模式下仍是深色背景"的残留

## 图标规范（重要）

- **图标一律使用 [Iconify](https://iconify.design/) 图标集，禁止使用 emoji 作为图标**
- 图标数据必须保存在本地：通过 `@iconify-json/*` 包安装图标集（如 `@iconify-json/lucide`），
  由 `astro-icon` 在构建时内联为 SVG；禁止运行时从 Iconify API 在线拉取
- 用法：`import { Icon } from 'astro-icon/components'`，`<Icon name="lucide:calendar-days" />`
- 新增图标时：`bun add @iconify-json/<set>`，并在 `astro.config.mjs` 的 `icon({ include: ... })` 中登记图标名
- 项目数据中的图标字段（`celestial-tokens.ts` 的 `Project.icon`）存 Iconify 名（如 `lucide:brain`），不得存 emoji

## 主页设计风格（神圣诗意 / 天文主题）

主页视觉统一为「神圣诗意 / 天文」风格（深蓝夜背景 + 三色系），常量在
`src/styles/celestial-tokens.ts`（TS 驱动 CSS 变量）与 `src/styles/celestial.css`
（`:root[data-home-theme]` 深/浅两套）。

- **三色系**（品牌色，深色模式值 / 浅色模式变体）：
  - 珍珠白 `--cp-pearl`（`#f8f5ef` / `#1a1a2e`）
  - 淡金 `--cp-gold`（`#d4af6c` / `#a8813a`），衍生 `--cp-gold-soft` / `--cp-gold-pale`
  - 月光银 `--cp-moonlight`（`#b8c5d6` / `#5a6578`），衍生 `--cp-silver`
- **底色**：深蓝夜 `--cp-night-deep`（`#0a0f1c` / 浅色 `#ffffff`）、`--cp-night`、`--cp-night-soft`
- **loading 图标**（Uiverse bright-lizard-8 旋转光圈 + 字母跳动，主页与文档页同款）：
  - 深色模式：保持彩虹光圈现状（默认 keyframes 不动）
  - 浅色模式：光圈改用主页同款三色（`loader-rotate-light` / `cpd-loader-rotate-light`，
    珍珠白 + 淡金 + 月光银，主页 `--cp-*` 变量 / 文档页固定 hex）
  - 字母颜色跟随 `--cp-pearl`（主页）与 `--cpd-foreground`（文档页），深浅色自动适配
- 新元素配色优先取自三色系与 `--cp-night-*` 底；改动 `celestial.css` 时保持
  `:root[data-home-theme='light']` 变体同步（AGENTS.md 其他规则：仅 Home.astro 引入）

## 样式规范

- 主页样式参数（颜色、粒子/动画/布局常量）统一写在 `src/styles/celestial-tokens.ts`（TypeScript），
  运行时不在 JS 中手写样式字符串；动态样式通过 CSS 变量由 TS 常量驱动
- 主页专属样式 `src/styles/celestial.css` 仅由 `src/layouts/Home.astro` 引入，**不得**加入 Starlight 的 `customCss`（否则会污染文档页主题）

## 样式命名（Plumest）

项目文档 UI 样式统称 **Plumest**（词首大写；用作形容词时按句法小写首字母，如
`Plumest-style` / `plumest.css` 文件名）。代码注释、文档、CSS 文件名一律用
Plumest 指代本样式；**不得**再以其他项目/框架的样式名命名或描述本项目样式，
对外不出现相关字样（README 鸣谢除外）。

## Docs Kit（无框架组件库，重要）

- **`src/lib/ui/`** —— 纯 TypeScript 手搓的 Plumest 风格文档 UI（左侧边栏 / ClerkTOC
  （Plumest 风格主色连接线 + 步骤圆徽，文档页右侧栏与 demo 页共用）/ 文档样式 /
  内容组件），**不依赖 React、零运行时依赖**；构建器返回 HTML 字符串，
  `src/lib/ui/runtime.ts` 通过 `data-cpd-*` 钩子接管交互
- 内容组件不含 inline-toc（已按需求移除）；文章内嵌目录请直接用右侧 ClerkTOC
- **构建器文本内的行内代码一律用 `code()` 组件**：构建器参数（如
  `step('...')`、`callout('...')`、`tabs({ panels: [{ content }] })`）输出纯 HTML，
  **不解析 markdown**，反引号 `` ` `` 会原样显示。需要行内代码时写
  `` step(`先用 ${code('bun install')} 安装依赖。`) ``（模板字符串 + `code()`），
  渲染为 `<code class="cpd-inline-code">`（Plumest 风格：secondary 底色 + 细边框）。
  反例（**禁止**）：`step('先用 `bun install` 安装依赖。')`
- **`src/styles/celestial-docs.css`** —— Kit 样式，类名 `cpd-` 前缀、CSS 变量 `--cpd-*` 前缀，
  令牌源在 `src/lib/ui/tokens.ts`；经 Starlight `customCss` 加载（文档页专属），**不得**进入主页
- 演示页：`/demo/`（EN）与 `/zh/demo/`（ZH），使用 `src/layouts/DocsKit.astro` +
  `src/components/DocsKitDemo.astro`，独立于 Starlight
- Kit 的组件/样式规范文档位于 `src/content/docs/contribution/`（贡献分类，EN+ZH）
- 参考实现：`reference/` 下的本地克隆（已 gitignore 且从 tsconfig/eslint 排除）

## 字体管理（重要）

**按需引入**：字体统一放在 `src/styles/fonts/` 独立 CSS 文件，不同页面只引入自己需要的：
- `fonts-home.css`（主页）＝ `sans.css`（正文）＋ `serif.css`（衬线显示）
- `fonts-docs.css`（文档页）＝ `sans.css` ＋ `heading.css`（标题）＋ `mono.css`（等宽）＋
  `serif.css`（品牌衬线，页头/侧栏品牌文字与主页同款）
- 主页经 `src/layouts/Home.astro` frontmatter 引入；文档页经 `astro.config.mjs` 的 Starlight
  `customCss` 引入（`fonts-docs.css` 排最前）；demo 页经 `DocsKit.astro` 引入
- 本地字重文件位于 `public/fonts/`（全量/子集 woff2）；CDN 字体用 jsDelivr `@fontsource`
  woff2（`cdn.jsdelivr.net/npm/@fontsource/<family>@<ver>/files/<id>-<subset>-<weight>-<style>.woff2`），
  **禁止** fonts.googleapis.com / fonts.gstatic.com（国内网络会挂起导致页面无法加载）

**当前字体与字重**（括号内为支持的全部字重 → 本地/当前已用）：
- Manrope（200–800 → 已用 300/400/500，jsDelivr）
- Plus Jakarta Sans（200–800 → 已用 400/500/600/700，jsDelivr）—— 标题/导航/面包屑/kbd 英文
- Maple Mono（100–800 → 已用 400/500，jsDelivr）—— mono 栈第一顺位
- Fira Code（300–700 → 已用 400/500，jsDelivr）
- Libertinus Serif（400/600/700 → 已用 400/700/400-italic，jsDelivr）—— 主页 `Libertine` 别名
  （Linux Libertine 的维护分支，jsDelivr 有 woff2，故直接引用；若需原版需自行转换）
- LxgwNeoXiHei 霞鹜新晰黑（仅 400 → 本地 `public/fonts/lxgw-neoxihei-400.woff2`，全量）——
  正文/标题中文；jsDelivr 无 woff2，从 GitHub release TTF 用 fontTools 转
- LxgwNeoZhiSong 霞鹜新致宋（仅 400 → 本地 `public/fonts/lxgw-neozhisong-subset-400.woff2`，
  **子集**，覆盖当前项目全部中文字符约 800 个）—— 主页衬线中文
- 注意：Libertine/LxgwNeoZhiSong 无细体/粗体字重，粗体由浏览器合成；"标题粗、其余细"由
  CSS `font-weight` 控制（700 / 400）

**重新生成中文字体子集/新增中文字符**（新增内容出现缺字时执行）：
```bash
# 1. 收集项目全部 CJK 字符
python3 - <<'EOF'
import pathlib
chars = set()
for p in pathlib.Path('src').rglob('*'):
    if p.is_dir() or p.suffix not in ('.astro','.ts','.tsx','.mjs','.mdx','.md','.css','.json'): continue
    if 'node_modules' in p.parts: continue
    for ch in p.read_text(encoding='utf-8'):
        cp = ord(ch)
        if (0x3000<=cp<=0x303F or 0x2E80<=cp<=0x2EFF or 0x3040<=cp<=0x30FF or
            0x3100<=cp<=0x312F or 0x3200<=cp<=0x32FF or 0x3400<=cp<=0x4DBF or
            0x4E00<=cp<=0x9FFF or 0xF900<=cp<=0xFAFF or 0xFE30<=cp<=0xFE4F or
            0xFF00<=cp<=0xFFEF): chars.add(ch)
open('/tmp/chars.txt','w',encoding='utf-8').write(''.join(sorted(chars)))
EOF
# 2. 重新生成子集 woff2
python3 -m fontTools.subset LXGWNeoZhiSong.ttf --text-file=/tmp/chars.txt \
  --flavor=woff2 --output-file=public/fonts/lxgw-neozhisong-subset-400.woff2
# 源 TTF：https://github.com/lxgw/LxgwNeoZhiSong/releases（v1.066 起）
# NeoXiHei 全量转换（如需重做）：
#   python3 -c "from fontTools.ttLib import TTFont; f=TTFont('LXGWNeoXiHei.ttf'); f.flavor='woff2'; f.save('public/fonts/lxgw-neoxihei-400.woff2')"
# 源 TTF：https://github.com/lxgw/LxgwNeoXiHei/releases（v1.304）
```

**新增 CDN 字体字重**：直接改对应 `src/styles/fonts/*.css` 加 `@font-face`（jsDelivr woff2 URL，
`font-display: swap`）；**新增本地字重**：转换后放 `public/fonts/` 并更新本段"当前字体与字重"。

**字体栈（中英文混排规则）**：英文优先字体无 CJK 字形，中文自动落回 LxgwNeoXiHei——
- 正文：`'Manrope','LxgwNeoXiHei',ui-sans-serif,system-ui,'Segoe UI',Roboto,'Source Sans 3','Helvetica Neue',Arial,emoji 回退,sans-serif`
- 标题/导航/面包屑/kbd：`'Plus Jakarta Sans','LxgwNeoXiHei',…同上回落`
- 品牌衬线（docs 页头/侧栏与主页同款）：`--cpd-font-serif: 'Libertine','LxgwNeoZhiSong',Georgia,serif`
- mono：`'Maple Mono','Fira Code','LxgwNeoXiHei',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New','Roboto Mono','Microsoft YaHei UI','Microsoft YaHei',monospace`
- 主页衬线：`--font-display: 'Libertine','LxgwNeoZhiSong',Georgia,serif`；`--font-serif: 'LxgwNeoZhiSong','Libertine',Georgia,serif`

**主题（深浅色三态）**：`celplume-theme` 存 `dark|light|system`（默认 system 跟随系统）。
`html[data-cpd-theme]`（docs）/ `html[data-home-theme]`（主页）= 实际深浅；`data-cpd-theme-mode` /
`data-home-theme-mode` = 模式（图标与循环用）。**警告**：任何 MutationObserver 只允许"读
data-cpd-theme → 写 data-theme"，**绝不回写 data-cpd-theme**（历史死锁：观察器回调写同属性
造成无限循环，页面整页卡死，见 ThemeProvider.astro 注释）。

**文档页加载动画**：与主页完全同款（Uiverse bright-lizard-8：彩虹旋转光圈 + 字母跳动，见
`celestial-docs.css` 的 `.cpd-loader-*`）；**仅会话内首次进入文档页显示**（`sessionStorage`
键 `celplume-docs-visited` 标记），页面内导航/刷新不再出现，由 `PageFrame.astro` 内联脚本控制。

## 文档写作规范（good-docs 原则）

参考 [fuma-nama 的 good-docs](https://github.com/fuma-nama/fuma/blob/main/content/good-docs.mdx)。
适用于 `src/content/docs/` 全部文档（EN + ZH 双份）。

- **简单词、直接陈述**：不写 fancy 措辞；去掉冗余（"you can"、"you may"、"please"、
  "you need to"）——"To enable B, configure C"，不要 "You can configure C to enable B"
- **主语前置**：短句、主语开头（"Astro is a web framework, it is becoming
  popular."，不要 "One of the documentation frameworks, Astro, is becoming popular"）
- **短段落**：每段不超过 9 行；要点用**列表**表达，不用连接词串联
- **用表格表达条件/属性**：Props 表格（参数/类型/默认值/说明）是组件文档标配
- **代码块优先**：技术示例用代码块 + 代码注释解释，长文解释留给复杂算法
- **少用有序列表**：步骤用带含义的标题分段（`## 三步`），不用 "1. 2. 3."
- **首次出现缩写/术语要拼全**；相关名词附超链接
- **标题即摘要**：更多标题 = 更好的锚点与扫读体验；用 **加粗** 标出关键信息
- 构建器文本内的行内代码见 Docs Kit 段（必须用 `code()`，禁止 markdown 反引号）
- 组件文档结构（每个组件 EN+ZH 一致）：frontmatter（title/description/sidebar.order）→
  一句话用途 → `<Preview>` 实况示例（配代码块）→ Props 表格 → Notes 列表

## 目录结构

- `astro.config.mjs` —— Starlight 与 i18n（locales）配置
- `src/content/docs/` —— 英文文档（`root`）
- `src/content/docs/zh/` —— 简体中文文档
- `src/content.config.ts` —— 内容集合（docs schema）定义
