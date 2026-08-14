/**
 * CelestPlume Docs Kit — 内容组件构建器（纯 TS）
 *
 * 移植 Plumest 的常用内容组件，输出静态 HTML 字符串：
 * Callout / Cards / Steps / Tabs / Accordions /
 * Breadcrumb / Pagination / Files / CodeBlock / Heading /
 * Badge / Kbd / ThemeToggle。
 *
 * 交互组件（tabs / accordions / copy / heading 锚点 / 主题切换）
 * 由 runtime.ts 的 `initCelestialUI` 通过 `data-cpd-*` 钩子接管。
 */

import { el } from './html';
import type { Attrs } from './html';
import { Icon } from './icons';
import type { CalloutType } from './types';

/* ============================================================
   Callout
   ============================================================ */

export interface CalloutOptions {
  type?: CalloutType;
  title?: string;
  icon?: string;
}

const CALLOUT_ICONS: Record<CalloutType, string> = {
  info: Icon.info(),
  warning: Icon.triangleAlert(),
  error: Icon.circleX(),
  success: Icon.circleCheck(),
  idea: Icon.lightbulb(),
};

export function callout(content: string, options: CalloutOptions = {}): string {
  const type = options.type ?? 'info';
  const body = [
    options.title ? el('p', { class: 'cpd-callout-title' }, options.title) : '',
    el('div', { class: 'cpd-callout-desc' }, content),
  ].join('');

  return el(
    'div',
    {
      class: `cpd-callout cpd-callout-${type}`,
      'data-cpd-callout': '',
      role: 'note',
    },
    [
      el('span', { class: 'cpd-callout-bar', 'aria-hidden': 'true' }, ''),
      el(
        'span',
        { class: 'cpd-callout-icon', 'aria-hidden': 'true' },
        options.icon ?? CALLOUT_ICONS[type],
      ),
      el('div', { class: 'cpd-callout-body' }, body),
    ],
  );
}

/* ============================================================
   Cards
   ============================================================ */

/** lucide 图标名 → kit 内联 SVG（Docs Kit 自带 lucide 风格路径，不依赖 astro-icon） */
const LUCIDE_ICONS: Record<string, (o?: { class?: string }) => string> = {
  'file-text': Icon.file,
  zap: Icon.zap,
  palette: Icon.palette,
  'arrow-right': Icon.arrowRight,
  'external-link': Icon.externalLink,
  'book-open': Icon.bookOpen,
  'folder-open': Icon.folderOpen,
  'folder-tree': Icon.folder,
  folder: Icon.folder,
  check: Icon.check,
  copy: Icon.copy,
  link: Icon.link,
  search: Icon.search,
  sun: Icon.sun,
  moon: Icon.moon,
  monitor: Icon.monitor,
  languages: Icon.languages,
  github: Icon.github,
  info: Icon.info,
  'circle-info': Icon.info,
  'triangle-alert': Icon.triangleAlert,
  'circle-x': Icon.circleX,
  'circle-check': Icon.circleCheck,
  lightbulb: Icon.lightbulb,
  'chevron-down': Icon.chevronDown,
  'chevron-right': Icon.chevronRight,
  'chevron-left': Icon.chevronLeft,
  'chevrons-right': Icon.chevronsRight,
  'chevrons-down-up': Icon.chevronsDownUp,
  'layout-grid': Icon.layoutGrid,
  'list-ordered': Icon.listOrdered,
  'panels-top-left': Icon.panelsTopLeft,
  'move-left': Icon.moveLeft,
  'arrow-up-right': Icon.arrowUpRight,
  'sun-moon': Icon.sunMoon,
  heading: Icon.heading,
  tag: Icon.tag,
  keyboard: Icon.keyboard,
  text: Icon.text,
  code: Icon.code,
  compass: Icon.compass,
  list: Icon.list,
  star: Icon.star,
};

/**
 * 解析卡片/按钮图标字段：`lucide:<name>` → kit 内联 SVG；
 * 其余原样（视为已内联的 SVG 字符串）。未收录的 lucide 名不渲染，
 * 避免把 `lucide:xxx` 当作裸文本显示。
 */
function resolveIcon(icon?: string): string {
  if (!icon) return '';
  if (icon.startsWith('lucide:')) {
    const fn = LUCIDE_ICONS[icon.slice('lucide:'.length)];
    return fn ? fn() : '';
  }
  return icon;
}

export interface CardOptions {
  title: string;
  description?: string;
  href?: string;
  external?: boolean;
  icon?: string;
  children?: string;
}

export function card(options: CardOptions): string {
  const inner = [
    el('div', { class: 'cpd-card-head' }, [
      options.icon ? el('span', { class: 'cpd-card-icon' }, resolveIcon(options.icon)) : '',
      el('h3', { class: 'cpd-card-title' }, options.title),
    ]),
    options.description ? el('p', { class: 'cpd-card-desc' }, options.description) : '',
    options.children ? el('div', { class: 'cpd-card-children' }, options.children) : '',
  ].join('');

  const attrs: Attrs = { class: 'cpd-card' };
  if (options.href) {
    attrs.href = options.href;
    if (options.external) {
      attrs.target = '_blank';
      attrs.rel = 'noreferrer';
    }
  }

  return el(options.href ? 'a' : 'div', attrs, inner);
}

export function cards(items: CardOptions[] | string, options: { className?: string } = {}): string {
  const inner = Array.isArray(items) ? items.map(card).join('') : items;
  return el('div', { class: `cpd-cards${options.className ? ` ${options.className}` : ''}` }, inner);
}

/* ============================================================
   Steps
   ============================================================ */

export function steps(children: string[] | string): string {
  const inner = Array.isArray(children)
    ? children
        .map((c) => (c.startsWith('<div class="cpd-step">') ? c : el('div', { class: 'cpd-step' }, c)))
        .join('')
    : children;
  return el('div', { class: 'cpd-steps' }, inner);
}

export function step(content: string): string {
  return el('div', { class: 'cpd-step' }, content);
}

/* ============================================================
   Tabs（simple mode，对齐 Plumest Tabs items API）
   ============================================================ */

export interface TabPanel {
  /** 原始标题（用于展示）；value 缺省时自动转义 */
  title?: string;
  value?: string;
  content: string;
}

function escapeValue(v: string): string {
  return v.toLowerCase().replace(/\s/, '-');
}

export interface TabsOptions {
  items: readonly string[];
  label?: string;
  defaultIndex?: number;
  panels?: TabPanel[];
}

export function tabs(options: TabsOptions): string {
  const defaultIndex = options.defaultIndex ?? 0;

  const triggers = (options.panels?.length ? options.panels : options.items.map((t) => ({ title: t, value: t, content: '' })))
    .map((panel, i) => {
      const value = panel.value ?? (panel.title ? escapeValue(panel.title) : String(i));
      const active = i === defaultIndex;
      return el(
        'button',
        {
          class: 'cpd-tabs-trigger',
          role: 'tab',
          type: 'button',
          'data-cpd-tab': '',
          'data-value': value,
          'data-active': active ? 'true' : 'false',
          'aria-selected': active ? 'true' : 'false',
        },
        panel.title ?? panel.value ?? String(i),
      );
    })
    .join('');

  const panels = (options.panels ?? [])
    .map((panel, i) => {
      const value = panel.value ?? (panel.title ? escapeValue(panel.title) : String(i));
      const active = i === defaultIndex;
      return el(
        'div',
        {
          class: 'cpd-tabs-panel',
          role: 'tabpanel',
          'data-cpd-tab-panel': '',
          'data-value': value,
          'data-active': active ? 'true' : 'false',
        },
        panel.content,
      );
    })
    .join('');

  return el('div', { class: 'cpd-tabs', 'data-cpd-tabs': '' }, [
    el('div', { class: 'cpd-tabs-list', role: 'tablist' }, [
      options.label ? el('span', { class: 'cpd-tabs-label' }, options.label) : '',
      triggers,
      el('span', { class: 'cpd-tabs-indicator', 'data-cpd-tabs-indicator': '', 'aria-hidden': 'true' }, ''),
    ]),
    el('div', { class: 'cpd-tabs-panels' }, panels),
  ]);
}

/* ============================================================
   Accordions
   ============================================================ */

export interface AccordionOptions {
  title: string;
  id?: string;
  content: string;
  defaultOpen?: boolean;
}

export function accordion(options: AccordionOptions): string {
  const value = options.id ?? options.title;
  const trigger = el(
    'button',
    {
      class: 'cpd-accordion-trigger',
      type: 'button',
      'data-cpd-accordion-toggle': '',
      'aria-expanded': options.defaultOpen ? 'true' : 'false',
    },
    [`<span>${options.title}</span>`, Icon.chevronDown({ class: 'cpd-accordion-chevron' })],
  );

  const copyButton = options.id
    ? el(
        'button',
        {
          class: 'cpd-btn cpd-btn-ghost cpd-accordion-copy',
          type: 'button',
          'data-cpd-copy-anchor': '',
          'data-cpd-anchor': `#${options.id}`,
          'aria-label': 'Copy link',
        },
        Icon.link({ class: 'cpd-accordion-copy-icon' }),
      )
    : '';

  return el(
    'div',
    {
      class: 'cpd-accordion',
      'data-cpd-accordion': '',
      'data-cpd-accordion-value': value,
      'data-open': options.defaultOpen ? 'true' : 'false',
    },
    [
      el('div', { class: 'cpd-accordion-header' }, [trigger, copyButton]),
      el(
        'div',
        { class: 'cpd-accordion-content', 'data-cpd-accordion-content': '' },
        el('div', { class: 'cpd-accordion-body' }, options.content),
      ),
    ],
  );
}

export function accordions(items: AccordionOptions[]): string {
  return el('div', { class: 'cpd-accordions', 'data-cpd-accordions': '' }, items.map(accordion).join(''));
}

/* ============================================================
   Breadcrumb
   ============================================================ */

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function breadcrumb(items: BreadcrumbItem[]): string {
  const inner = items
    .map((item, i) => {
      const isLast = i === items.length - 1;
      const content = item.href
        ? el('a', { class: `cpd-breadcrumb-link${isLast ? ' cpd-breadcrumb-current' : ''}`, href: item.href }, item.name)
        : el('span', { class: 'cpd-breadcrumb-current' }, item.name);
      return [
        i !== 0 ? Icon.chevronRight({ class: 'cpd-breadcrumb-sep' }) : '',
        content,
      ].join('');
    })
    .join('');

  return el('nav', { class: 'cpd-breadcrumb', 'aria-label': 'Breadcrumb' }, inner);
}

/* ============================================================
   Pagination
   ============================================================ */

export interface PaginationItem {
  title: string;
  description?: string;
  href: string;
}

export interface PaginationLabels {
  previous?: string;
  next?: string;
}

export function pagination(
  previous: PaginationItem | undefined,
  next: PaginationItem | undefined,
  labels: PaginationLabels = {},
): string {
  const prevLabel = labels.previous ?? 'Previous Page';
  const nextLabel = labels.next ?? 'Next Page';
  const renderItem = (item: PaginationItem, isNext: boolean) =>
    el('a', { class: `cpd-pagination-item${isNext ? ' cpd-pagination-next' : ''}`, href: item.href }, [
      el('div', { class: 'cpd-pagination-label' }, [
        isNext ? '' : Icon.chevronLeft({ class: 'cpd-pagination-icon' }),
        `<span>${isNext ? nextLabel : prevLabel}</span>`,
        isNext ? Icon.chevronRight({ class: 'cpd-pagination-icon' }) : '',
      ]),
      el('p', { class: 'cpd-pagination-title' }, item.title),
      item.description ? el('p', { class: 'cpd-pagination-desc' }, item.description) : '',
    ]);

  return el('nav', { class: 'cpd-pagination', 'aria-label': 'Pagination' }, [
    previous ? renderItem(previous, false) : '',
    next ? renderItem(next, true) : '',
  ]);
}

/* ============================================================
   Tree（文件夹/文件行 + chevron 旋转 + 可选缩进线；
   文件夹图标随开关状态切换）
   ============================================================ */

export function file(name: string, icon = Icon.file()): string {
  return el('div', { class: 'cpd-tree-file', role: 'treeitem' }, [icon, `<span>${name}</span>`]);
}

export interface TreeFolderOptions {
  name: string;
  defaultOpen?: boolean;
  /** 关闭态文件夹图标（原始 SVG） */
  icon?: string;
  /** 打开态文件夹图标（原始 SVG） */
  openIcon?: string;
}

export function folder(children: string, options: TreeFolderOptions): string {
  const open = options.defaultOpen ?? false;
  const icon = options.icon ?? Icon.folder();
  const openIcon = options.openIcon ?? Icon.folderOpen();

  const trigger = el(
    'button',
    {
      class: 'cpd-tree-folder-trigger',
      type: 'button',
      'data-cpd-folder-toggle': '',
      'aria-expanded': open ? 'true' : 'false',
    },
    [
      Icon.chevronRight({ class: 'cpd-tree-chevron' }),
      el('span', { class: 'cpd-tree-folder-icon' }, [
        el('span', { 'data-icon': 'closed', 'aria-hidden': 'true' }, icon),
        el('span', { 'data-icon': 'open', 'aria-hidden': 'true' }, openIcon),
      ]),
      `<span>${options.name}</span>`,
    ],
  );

  return el(
    'div',
    { class: 'cpd-tree-folder', 'data-cpd-folder': '', 'data-cpd-open': open ? 'true' : 'false' },
    [
      trigger,
      el(
        'div',
        { class: 'cpd-tree-folder-content', 'data-cpd-folder-content': '' },
        el('div', { class: 'cpd-tree-folder-content-inner' }, children),
      ),
    ],
  );
}

export interface TreeOptions {
  /** 显示子级缩进线（「无缩进线」模式；默认 true） */
  lines?: boolean;
}

export function files(children: string, options: TreeOptions = {}): string {
  const lines = options.lines ?? true;
  return el(
    'div',
    { class: 'cpd-tree', role: 'tree', 'data-cpd-lines': lines ? 'true' : 'false' },
    children,
  );
}

/* ============================================================
   Dropdown（自适应宽面板、16px 圆角、8px 内边距、灰遮罩 hover、
   fade+zoom+slide 开合动画）
   ============================================================ */

export interface DropdownItemOptions {
  label: string;
  /** 前置图标（原始 SVG，20px） */
  icon?: string;
  /** 右侧快捷键提示（kbd） */
  shortcut?: string;
  disabled?: boolean;
  /** 提供 href 时渲染为 <a>（点击后关闭菜单） */
  href?: string;
}

export function dropdownItem(options: DropdownItemOptions): string {
  const attrs: Attrs = {
    class: 'cpd-dropdown-item',
    role: 'menuitem',
    'data-cpd-dropdown-item': '',
  };
  if (options.disabled) attrs['data-disabled'] = '';
  const content = [
    options.icon ? el('span', { class: 'cpd-dropdown-item-icon' }, options.icon) : '',
    el('span', { class: 'cpd-dropdown-item-label' }, options.label),
    options.shortcut ? el('kbd', { class: 'cpd-dropdown-shortcut' }, options.shortcut) : '',
  ].join('');
  if (options.href) {
    return el('a', { ...attrs, href: options.href }, content);
  }
  return el('div', attrs, content);
}

/** 分组标题（11px 大写弱色） */
export function dropdownLabel(label: string): string {
  return el('p', { class: 'cpd-dropdown-label' }, label);
}

/** 分隔线 */
export function dropdownSeparator(): string {
  return el('div', { class: 'cpd-dropdown-separator', role: 'separator' }, '');
}

/** 分组：可选标题 + 若干菜单项 */
export function dropdownGroup(label: string | undefined, items: string): string {
  return el('div', { class: 'cpd-dropdown-group', role: 'group' }, [
    label ? dropdownLabel(label) : '',
    items,
  ]);
}

export interface DropdownOptions {
  /** 触发按钮内容（任意 HTML） */
  trigger: string;
  /** 菜单内容（dropdownItem / dropdownGroup / dropdownSeparator） */
  content: string;
  /** 初始是否展开（文档预览用；默认 false） */
  open?: boolean;
  /** 菜单宽度（默认自适应，封顶 300px） */
  width?: string;
  /** hover 打开 / 移出延迟关闭（站点导航项目菜单用） */
  hover?: boolean;
  /** 触发按钮附加类（自定义样式，如导航链接样式） */
  triggerClass?: string;
}

export function dropdown(options: DropdownOptions): string {
  const open = options.open ?? false;
  return el(
    'div',
    {
      class: 'cpd-dropdown',
      'data-cpd-dropdown': '',
      'data-open': open ? 'true' : 'false',
      ...(options.hover ? { 'data-cpd-hover': '' } : {}),
    },
    [
      el(
        'button',
        {
          class: `cpd-dropdown-trigger${options.triggerClass ? ` ${options.triggerClass}` : ''}`,
          type: 'button',
          'data-cpd-dropdown-trigger': '',
          'aria-haspopup': 'menu',
          'aria-expanded': open ? 'true' : 'false',
        },
        options.trigger,
      ),
      el(
        'div',
        {
          class: 'cpd-dropdown-menu',
          role: 'menu',
          'data-cpd-dropdown-menu': '',
          'data-open': open ? 'true' : 'false',
          ...(options.width ? { style: `width:${options.width}` } : {}),
        },
        options.content,
      ),
    ],
  );
}

/* ============================================================
   Modal（弹窗：遮罩 blur + 圆角 20 卡片 + header/body/footer；
   触发按钮用 data-cpd-modal-trigger + data-cpd-modal-target 指向 id）
   ============================================================ */

export interface ModalOptions {
  id: string;
  title: string;
  description?: string;
  /** 头部圆形图标（原始 SVG，40px 圆环） */
  icon?: string;
  /** 主体 HTML */
  content: string;
  /** 底部操作区 HTML（如 button() 输出） */
  footer?: string;
  /** 初始是否打开（默认 false） */
  open?: boolean;
  /** 关闭按钮 aria-label（默认 Close） */
  closeLabel?: string;
  /** 面板最大宽度（默认 400px） */
  width?: string;
}

export function modal(options: ModalOptions): string {
  const open = options.open ?? false;
  const closeLabel = options.closeLabel ?? 'Close';

  const headerIcon = options.icon
    ? el('div', { class: 'cpd-modal-icon' }, options.icon)
    : '';
  const heading =
    options.title || options.description
      ? el('div', { class: 'cpd-modal-heading' }, [
          options.title ? el('h3', { class: 'cpd-modal-title' }, options.title) : '',
          options.description ? el('p', { class: 'cpd-modal-desc' }, options.description) : '',
        ])
      : '';
  const header = headerIcon || heading ? el('div', { class: 'cpd-modal-header' }, [headerIcon, heading]) : '';

  return el(
    'div',
    {
      class: 'cpd-modal',
      'data-cpd-modal': '',
      'data-open': open ? 'true' : 'false',
      ...(options.id ? { id: options.id } : {}),
    },
    [
      el('div', { class: 'cpd-modal-overlay', 'data-cpd-modal-overlay': '' }, [
        el(
          'div',
          {
            class: 'cpd-modal-panel',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': options.title,
            ...(options.width ? { style: `max-width:${options.width}` } : {}),
          },
          [
            el(
              'button',
              {
                class: 'cpd-modal-close',
                type: 'button',
                'data-cpd-modal-close': '',
                'aria-label': closeLabel,
              },
              Icon.x({}),
            ),
            header,
            el('div', { class: 'cpd-modal-body' }, options.content),
            options.footer ? el('div', { class: 'cpd-modal-footer' }, options.footer) : '',
          ],
        ),
      ]),
    ],
  );
}

/* ============================================================
   CodeBlock（Snippet 风格：header 条 + tabs + 复制按钮）
   ============================================================ */

export interface CodeBlockTab {
  label: string;
  code: string;
}

export interface CodeBlockOptions {
  code: string;
  filename?: string;
  lang?: string;
  /** 多代码 tab（Snippet）：提供后 header 渲染 tab，复制按钮复制当前 tab */
  tabs?: CodeBlockTab[];
}

const LANG_LABELS: Record<string, string> = {
  ts: 'TS',
  typescript: 'TS',
  js: 'JS',
  javascript: 'JS',
  jsx: 'JSX',
  tsx: 'TSX',
  mjs: 'MJS',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  md: 'MD',
  markdown: 'MD',
  py: 'Python',
  python: 'Python',
  astro: 'Astro',
  yaml: 'YAML',
  yml: 'YAML',
};

export function codeBlock(options: CodeBlockOptions): string {
  const langClass = options.lang ? ` language-${options.lang}` : '';

  const copyBtn = el(
    'button',
    {
      class: 'cpd-btn cpd-btn-ghost cpd-code-copy',
      type: 'button',
      'data-cpd-copy': '',
      'aria-label': 'Copy code',
    },
    Icon.copy({ class: 'cpd-code-copy-icon' }),
  );

  // 多 tab（Snippet）：tab 触发条 + 各 tab 一个面板（运行时切换）
  const tabs = options.tabs && options.tabs.length > 0 ? options.tabs : null;
  if (tabs) {
    const triggers = tabs
      .map(
        (tab, i) =>
          el(
            'button',
            {
              class: 'cpd-code-tab',
              role: 'tab',
              type: 'button',
              'data-cpd-code-tab': '',
              'data-value': String(i),
              'data-active': i === 0 ? 'true' : 'false',
              'aria-selected': i === 0 ? 'true' : 'false',
            },
            tab.label,
          ),
      )
      .join('');
    const panels = tabs
      .map(
        (tab, i) =>
          el(
            'pre',
            {
              class: 'cpd-code-pre cpd-code-panel',
              'data-cpd-code-panel': '',
              'data-value': String(i),
              'data-active': i === 0 ? 'true' : 'false',
            },
            el('code', { class: `cpd-code-code${langClass}` }, tab.code),
          ),
      )
      .join('');

    return el('figure', { class: 'cpd-code cpd-code-tabbed', 'data-cpd-code': '' }, [
      el('figcaption', { class: 'cpd-code-header' }, [
        el('div', { class: 'cpd-code-tabs', role: 'tablist' }, triggers),
        copyBtn,
      ]),
      panels,
    ]);
  }

  // 单代码块：header 显示文件名或语言标签
  const label = options.filename
    ? el('span', { class: 'cpd-code-filename' }, [
        Icon.file({ class: 'cpd-code-filename-icon' }),
        options.filename,
      ])
    : el(
        'span',
        { class: 'cpd-code-lang' },
        options.lang ? (LANG_LABELS[options.lang] ?? options.lang.toUpperCase()) : 'Code',
      );

  return el('figure', { class: 'cpd-code', 'data-cpd-code': '' }, [
    el('figcaption', { class: 'cpd-code-header' }, [label, copyBtn]),
    el('pre', { class: 'cpd-code-pre', 'data-cpd-code-pre': '' }, [
      el('code', { class: `cpd-code-code${langClass}` }, options.code),
    ]),
  ]);
}

/* ============================================================
   Heading（锚点 + 复制链接）
   ============================================================ */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingOptions {
  id: string;
  /** 是否标记为 TOC 阶数项（配合 ClerkTOC steps） */
  step?: boolean;
}

export function heading(level: HeadingLevel, text: string, options: HeadingOptions): string {
  const attrs: Attrs = {
    id: options.id,
    class: 'cpd-heading',
    'data-cpd-heading': '',
  };
  if (options.step) attrs['data-cpd-step'] = '';

  return el(`h${level}`, attrs, [
    el('a', { class: 'cpd-heading-anchor', href: `#${options.id}` }, text),
    el(
      'button',
      {
        class: 'cpd-btn cpd-btn-ghost cpd-heading-copy',
        type: 'button',
        'data-cpd-copy-anchor': '',
        'data-cpd-anchor': `#${options.id}`,
        'aria-label': 'Copy anchor link',
      },
      Icon.link({ class: 'cpd-heading-copy-icon' }),
    ),
  ]);
}

/* ============================================================
   Badge / Kbd
   ============================================================ */

export type BadgeVariant = 'default' | 'gold' | 'info' | 'warning' | 'error' | 'success';

export function badge(text: string, variant: BadgeVariant = 'default'): string {
  return el('span', { class: `cpd-badge cpd-badge-${variant}` }, text);
}

export function kbd(text: string): string {
  return el('kbd', { class: 'cpd-kbd' }, text);
}

/** 行内代码（构建器文本内的 `` `code` `` 不会解析 markdown，用本组件渲染） */
export function code(text: string): string {
  return el('code', { class: 'cpd-inline-code' }, text);
}

/* ============================================================
   ThemeToggle
   ============================================================ */

export function themeToggle(label = 'Toggle theme'): string {
  return el(
    'button',
    {
      class: 'cpd-btn cpd-btn-ghost cpd-theme-toggle',
      type: 'button',
      'data-cpd-theme-toggle': '',
      'aria-label': label,
      title: label,
    },
    [
      Icon.monitor({ class: 'cpd-theme-icon cpd-theme-icon-monitor' }),
      Icon.sun({ class: 'cpd-theme-icon cpd-theme-icon-sun' }),
      Icon.moon({ class: 'cpd-theme-icon cpd-theme-icon-moon' }),
    ],
  );
}

/* ============================================================
   Link（内链右箭头、外链右上箭头；箭头样式由 .cpd-article a 提供）
   ============================================================ */

export interface LinkOptions {
  href: string;
  label: string;
  external?: boolean;
  icon?: string;
}

export function link(options: LinkOptions): string {
  const attrs: Attrs = { class: 'cpd-link', href: options.href };
  if (options.external) {
    attrs.target = '_blank';
    attrs.rel = 'noreferrer';
  }
  return el('a', attrs, [options.icon ?? '', `<span>${options.label}</span>`]);
}

/* ============================================================
   Button（solid/subtle/surface/outline/ghost/plain + sm/md/lg；
   有 href 渲染 <a>，否则渲染原生 <button type="button">）
   ============================================================ */

export type ButtonVariant = 'solid' | 'subtle' | 'surface' | 'outline' | 'ghost' | 'plain';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonColor = 'primary' | 'info' | 'success' | 'warning' | 'error' | 'idea';

export interface ButtonOptions {
  label: string;
  /** 提供 href 时渲染为 <a>（asChild 语义） */
  href?: string;
  external?: boolean;
  /** 置于文本前的原始 SVG 字符串 */
  icon?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 色板：语义色由 --cpd-* 令牌提供 */
  color?: ButtonColor;
  /** 附加 HTML 属性（如 data-cpd-drawer-trigger） */
  attrs?: Record<string, string>;
}

export function button(options: ButtonOptions): string {
  const variant = options.variant ?? 'solid';
  const size = options.size ?? 'md';
  const color = options.color ?? 'primary';
  const cls = `cpd-button cpd-button-${variant} cpd-button-${size} cpd-button-color-${color}`;
  const content = [options.icon ?? '', `<span>${options.label}</span>`];
  if (options.href) {
    const attrs: Attrs = { class: cls, href: options.href, ...options.attrs };
    if (options.external) {
      attrs.target = '_blank';
      attrs.rel = 'noreferrer';
    }
    return el('a', attrs, content);
  }
  return el('button', { class: cls, type: 'button', ...options.attrs }, content);
}
