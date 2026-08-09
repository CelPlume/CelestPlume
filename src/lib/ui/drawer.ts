/**
 * Drawer — 侧滑面板组件（右侧滑入 + 遮罩 + 头部关闭；基础 = blur 遮罩，
 * fullscreen 变体 = 全屏模态）
 * ------------------------------------------------------------
 * 纯 TS 构建器，返回静态 HTML 字符串；交互由 src/lib/ui/runtime.ts
 * 经 `data-cpd-drawer-*` 钩子接管（触发按钮 data-cpd-drawer-trigger、
 * 遮罩点击 / Escape / 关闭按钮 data-cpd-drawer-close）。
 *
 * 用法（站点导航/侧边栏的折叠面板）：
 *   renderDrawer({
 *     title: 'Navigation',
 *     content: renderSidebar({ ... }),   // 或任意 HTML
 *   });
 * 面板始终固定在视口右侧，从顶部导航（--cp-nav-height / --sl-nav-height）
 * 下方开始，不遮导航栏。
 */
import { el, raw, escapeHtml } from './html';
import { Icon } from './icons';

export interface DrawerOptions {
  /** 面板 id（可选） */
  id?: string;
  /** 标题：DrawerHeader 左侧文本，兼作 aria-label */
  title: string;
  /** 初始是否打开（默认关闭；由 data-cpd-open 控制显隐） */
  open?: boolean;
  /** 滑出方向：目前仅右侧（RTL 布局自动翻转到左侧） */
  side?: 'right';
  /** 面板宽度（CSS 值，默认 28rem） */
  width?: string;
  /** 面板最大宽度（CSS 值，默认 100dvw） */
  maxWidth?: string;
  /** 主体内容（HTML 字符串） */
  content?: string;
  /** 关闭按钮 aria-label（默认 Close） */
  closeLabel?: string;
  /** 全屏模态变体：黑/50 无 blur 遮罩 + 高投影 + 28rem 面板 */
  fullscreen?: boolean;
}

export function renderDrawer(options: DrawerOptions): string {
  const {
    id,
    title,
    open = false,
    side = 'right',
    width = 'var(--cpd-drawer-width, 28rem)',
    maxWidth = '100dvw',
    content = '',
    closeLabel = 'Close',
    fullscreen = false,
  } = options;

  const panelStyle = `width:${width};max-width:${maxWidth}`;
  const safeTitle = escapeHtml(title);

  return el(
    'div',
    {
      class: 'cpd-drawer',
      'data-cpd-drawer': '',
      'data-cpd-open': open ? 'true' : 'false',
      ...(id ? { id } : {}),
      ...(fullscreen ? { 'data-cpd-drawer-fullscreen': '' } : {}),
    },
    [
      el('div', { class: 'cpd-drawer-overlay', 'data-cpd-drawer-overlay': '' }, ''),
      el(
        'aside',
        {
          class: 'cpd-drawer-panel',
          'data-cpd-drawer-side': side,
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': safeTitle,
          style: panelStyle,
        },
        [
          el('div', { class: 'cpd-drawer-header' }, [
            el('h2', { class: 'cpd-drawer-title' }, safeTitle),
            el(
              'button',
              {
                class: 'cpd-btn cpd-btn-ghost cpd-drawer-close',
                type: 'button',
                'data-cpd-drawer-close': '',
                'aria-label': closeLabel,
              },
              Icon.x({}),
            ),
          ]),
          el('div', { class: 'cpd-drawer-body', 'data-cpd-drawer-content': '' }, raw(content)),
        ],
      ),
    ],
  );
}
