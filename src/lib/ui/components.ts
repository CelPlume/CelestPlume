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
    options.icon ? el('div', { class: 'cpd-card-icon' }, resolveIcon(options.icon)) : '',
    el('h3', { class: 'cpd-card-title' }, options.title),
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
   Files（原生 <details> 折叠）
   ============================================================ */

export function file(name: string, icon = Icon.file()): string {
  return el('div', { class: 'cpd-file' }, [icon, `<span>${name}</span>`]);
}

export interface FolderOptions {
  name: string;
  defaultOpen?: boolean;
  icon?: string;
  openIcon?: string;
}

export function folder(children: string, options: FolderOptions): string {
  const icon = options.defaultOpen ? (options.openIcon ?? Icon.folderOpen()) : (options.icon ?? Icon.folder());
  return el('details', { class: 'cpd-folder', 'data-cpd-folder': '', open: options.defaultOpen ? true : undefined }, [
    el('summary', { class: 'cpd-folder-trigger' }, [icon, `<span>${options.name}</span>`]),
    el('div', { class: 'cpd-folder-content' }, children),
  ]);
}

export function files(children: string): string {
  return el('div', { class: 'cpd-files' }, children);
}

/* ============================================================
   CodeBlock
   ============================================================ */

export interface CodeBlockOptions {
  code: string;
  filename?: string;
  lang?: string;
}

export function codeBlock(options: CodeBlockOptions): string {
  const langClass = options.lang ? ` language-${options.lang}` : '';
  const header = options.filename
    ? el('figcaption', { class: 'cpd-code-header' }, [
        el('span', { class: 'cpd-code-filename' }, [
          Icon.file({ class: 'cpd-code-filename-icon' }),
          options.filename,
        ]),
        el(
          'button',
          {
            class: 'cpd-btn cpd-btn-ghost cpd-code-copy',
            type: 'button',
            'data-cpd-copy': '',
            'aria-label': 'Copy code',
          },
          Icon.copy({ class: 'cpd-code-copy-icon' }),
        ),
      ])
    : '';

  return el('figure', { class: 'cpd-code', 'data-cpd-code': '' }, [
    header,
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
   Link button（页脚 / 页头按钮）
   ============================================================ */

export interface LinkButtonOptions {
  href: string;
  label: string;
  external?: boolean;
  icon?: string;
}

export function linkButton(options: LinkButtonOptions): string {
  const attrs: Attrs = {
    class: 'cpd-btn cpd-btn-ghost cpd-link-button',
    href: options.href,
  };
  if (options.external) {
    attrs.target = '_blank';
    attrs.rel = 'noreferrer';
  }
  return el('a', attrs, [options.icon ?? '', `<span>${options.label}</span>`]);
}
