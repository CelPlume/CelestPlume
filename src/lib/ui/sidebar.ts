/**
 * CelestPlume Docs Kit — 左侧边栏构建器（纯 TS）
 *
 * 对齐 Plumest Sidebar 的结构与样式语义：
 * - 折叠分组（chevron 旋转）、分隔标签（SidebarSeparator）
 * - 激活项高亮（primary 文字 + 左侧竖条）、激活路径自动展开
 * - 桌面端可折叠（hover 展开）、移动端抽屉（overlay + 滑入动画）
 *
 * 输出静态 HTML 字符串；交互由 runtime.ts 的 `initCelestialUI` 接管。
 * 所有类名以 `cpd-` 前缀隔离，避免与 Starlight / 主页样式冲突。
 */

import { el } from './html';
import type { Attrs } from './html';
import { Icon } from './icons';
import type { NavNode, SidebarConfig } from './types';

export const SIDEBAR_ID = 'cpd-sidebar';

/** 每级缩进（Plumest: calc((2 + 3 * depth) * var(--spacing))，spacing = 0.25rem） */
export function getItemOffset(depth: number): string {
  return `calc(${2 + 3 * depth} * var(--cpd-spacing))`;
}

interface RenderContext {
  pathname: string;
  defaultOpenLevel: number;
  dir: 'ltr' | 'rtl';
}

/** 判断链接是否激活（精确匹配，容忍 href 尾部的 `/`） */
export function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === pathname) return true;
  return pathname === href.replace(/\/$/, '');
}

function renderIcon(icon: string | undefined): string {
  return icon ? `<span class="cpd-sidebar-icon" aria-hidden="true">${icon}</span>` : '';
}

function renderNode(node: NavNode, depth: number, ctx: RenderContext): string {
  switch (node.type) {
    case 'separator': {
      return el(
        'p',
        { class: `cpd-sidebar-separator${depth === 0 ? ' cpd-sidebar-separator-first' : ''}` },
        node.label,
      );
    }

    case 'link': {
      const active = isNavLinkActive(node.href, ctx.pathname);
      if (node.unlisted && !active) return '';
      const attrs: Attrs = {
        class: 'cpd-sidebar-item',
        href: node.href,
        'data-cpd-active': active ? 'true' : 'false',
        ...(node.external ? { target: '_blank', rel: 'noreferrer' } : {}),
        style: { paddingInlineStart: getItemOffset(depth) },
      };
      const chevron = node.external ? Icon.externalLink({ class: 'cpd-sidebar-item-icon' }) : '';
      return el(
        'a',
        attrs,
        [renderIcon(node.icon), `<span>${node.label}</span>`, chevron],
      );
    }

    case 'folder': {
      const hasActiveChild = node.children.some(
        (child) =>
          (child.type === 'link' && isNavLinkActive(child.href, ctx.pathname)) ||
          (child.type === 'folder' &&
            child.children.some(
              (g) => g.type === 'link' && isNavLinkActive(g.href, ctx.pathname),
            )),
      );
      const defaultOpen =
        node.collapsible === false ||
        hasActiveChild ||
        node.defaultOpen === true ||
        ctx.defaultOpenLevel >= depth;
      const nextDepth = depth + 1;

      const triggerAttrs: Attrs = {
        class: 'cpd-sidebar-folder-trigger',
        'data-cpd-folder-toggle': '',
        type: 'button',
        'aria-expanded': defaultOpen ? 'true' : 'false',
        style: { paddingInlineStart: getItemOffset(depth) },
      };

      const trigger = el(
        'button',
        triggerAttrs,
        [renderIcon(node.icon), `<span>${node.label}</span>`, Icon.chevronDown({ class: 'cpd-sidebar-chevron' })],
      );

      const children = node.children.map((child) => renderNode(child, nextDepth, ctx)).join('');

      return el(
        'div',
        {
          class: 'cpd-sidebar-folder',
          'data-cpd-folder': '',
          'data-cpd-depth': String(depth),
          'data-cpd-open': defaultOpen ? 'true' : 'false',
        },
        [
          trigger,
          el('div', { class: 'cpd-sidebar-folder-content', 'data-cpd-folder-content': '' }, children),
        ],
      );
    }
  }
}

/** 渲染单个导航节点（导出供文档演示） */
export function renderNavNode(node: NavNode, depth = 0, pathname = '/'): string {
  return renderNode(node, depth, { pathname, defaultOpenLevel: 0, dir: 'ltr' });
}

/** 渲染完整侧边栏（桌面 aside + 移动端抽屉壳） */
export function renderSidebar(config: SidebarConfig): string {
  const ctx: RenderContext = {
    pathname: config.pathname,
    defaultOpenLevel: config.defaultOpenLevel ?? 0,
    dir: config.dir ?? 'ltr',
  };

  const linksHtml = (config.links ?? [])
    .map((node) => renderNode(node, 0, ctx))
    .join('');
  const treeHtml = config.tree.map((node) => renderNode(node, 0, ctx)).join('');

  const inner = el('div', { class: 'cpd-sidebar-inner' }, [
    el('div', { class: 'cpd-sidebar-header' }, [
      el('div', { class: 'cpd-sidebar-title' }, config.title ?? ''),
      el(
        'button',
        {
          class: 'cpd-btn cpd-btn-ghost cpd-sidebar-collapse',
          type: 'button',
          'data-cpd-collapse': '',
          'aria-label': 'Collapse Sidebar',
        },
        Icon.panelLeft({ class: 'cpd-sidebar-collapse-icon' }),
      ),
    ]),
    el('nav', { class: 'cpd-sidebar-nav' }, [linksHtml, treeHtml]),
    config.footer ? el('div', { class: 'cpd-sidebar-footer' }, config.footer) : '',
  ]);

  const aside = el(
    'aside',
    { id: SIDEBAR_ID, class: 'cpd-sidebar', 'data-cpd-sidebar': '', 'data-cpd-collapsed': 'false' },
    inner,
  );

  // 移动端抽屉（内容在初始化时由 runtime 克隆，避免重复渲染树）
  const drawer = el(
    'div',
    { class: 'cpd-sidebar-drawer', 'data-cpd-drawer': '', 'data-cpd-open': 'false' },
    [
      el('div', { class: 'cpd-sidebar-drawer-overlay', 'data-cpd-drawer-overlay': '' }, ''),
      el(
        'aside',
        { class: 'cpd-sidebar-drawer-panel', 'aria-label': 'Sidebar' },
        el('div', { class: 'cpd-sidebar-drawer-content', 'data-cpd-drawer-content': '' }, ''),
      ),
    ],
  );

  return `<div class="cpd-sidebar-root" data-cpd-sidebar-root dir="${ctx.dir}">${aside}${drawer}</div>`;
}
