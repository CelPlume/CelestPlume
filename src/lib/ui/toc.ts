/**
 * CelestPlume Docs Kit — Plumest TOC 目录构建器（纯 TS）
 *
 * Block 风格（Fumadocs `TOCItems` 的无框架移植，替代旧 ClerkTOC 轨道线方案）：
 * - **零 SVG**：条目即纯 `<a>` 文本，无左侧连接线、无肘形拐角、无步骤圆徽
 * - **滑块高亮**：一个绝对定位的圆角背景（`.cpd-toc-thumb`）覆盖当前阅读区间，
 *   客户端以 `clip-path: inset()` 驱动；布局只在 ResizeObserver 中测量一次，
 *   滚动更新零 DOM 几何读取（读写解耦，杜绝 Layout Thrashing）
 * - **长标题自适应**：滑块基于条目真实渲染高度（offsetTop + offsetHeight），
 *   单行/多行折行均能完整包裹
 *
 * 输出纯 HTML 字符串；`data-cpd-toc-*` 钩子供 runtime 接管。
 */

import { el } from './html';
import { Icon } from './icons';
import type { TocItem, TocOptions } from './types';

/** 条目文字缩进（px）：h2 0.75rem，每降一级 +0.75rem */
export function getItemOffset(depth: number): number {
  if (depth <= 2) return 12;
  if (depth === 3) return 24;
  return 36;
}

export interface RenderTocOptions extends TocOptions {
  /** 为所有条目生成连续编号（行内数字徽章） */
  steps?: boolean;
}

/**
 * 渲染目录容器（含 "On this page" 标题、滚动区、条目列表与空状态）。
 * 背景滑块的 `clip-path` 由 runtime 在激活区间变化时写入。
 */
export function renderToc(items: TocItem[], options: RenderTocOptions = {}): string {
  const numbered = items.map((item, i) => ({ ...item, step: item.step ?? (options.steps ? i + 1 : undefined) }));

  const list = numbered.length
    ? el('div', { class: 'cpd-toc-items', 'data-cpd-toc-items': '' }, [
        el('div', { class: 'cpd-toc-thumb', 'data-cpd-toc-thumb': '', 'aria-hidden': 'true' }, ''),
        ...numbered.map((item) =>
          el(
            'a',
            {
              class: 'cpd-toc-item',
              href: item.url,
              'data-cpd-toc-item': '',
              'data-cpd-active': 'false',
              'data-depth': String(item.depth),
              style: { paddingInlineStart: `${getItemOffset(item.depth)}px` },
            },
            [
              item.step !== undefined ? el('span', { class: 'cpd-toc-step-badge' }, String(item.step)) : '',
              el('span', { class: 'cpd-toc-item-text' }, item.title),
            ],
          ),
        ),
      ])
    : options.empty === false
      ? ''
      : el('div', { class: 'cpd-toc-empty' }, 'No headings on this page');

  return el(
    'nav',
    { class: 'cpd-toc', 'data-cpd-toc': '', 'aria-label': 'Table of contents' },
    [
      el('h3', { class: 'cpd-toc-title' }, [
        Icon.text({ class: 'cpd-toc-title-icon' }),
        options.title ?? 'On this page',
      ]),
      el('div', { class: 'cpd-toc-scroll', 'data-cpd-toc-scroll': '' }, list),
    ],
  );
}

/**
 * 从文档容器提取标题，生成 TocItem[]。
 * 扫描 h2/h3/h4 中带 id 的元素；带 `data-cpd-step` 标记的标题按文档顺序连续编号。
 */
export function collectHeadings(container: ParentNode, root: string | HTMLElement = 'article'): TocItem[] {
  const scope = typeof root === 'string' ? container.querySelector(root) : root;
  if (!scope) return [];

  const items: TocItem[] = [];
  let counter = 0;

  scope.querySelectorAll('h2[id], h3[id], h4[id]').forEach((node) => {
    const heading = node as HTMLElement;
    const text = heading.textContent?.trim() ?? '';
    if (!text) return;

    let step: number | undefined;
    if (heading.hasAttribute('data-cpd-step')) step = ++counter;

    items.push({
      url: `#${heading.id}`,
      title: text,
      depth: Number(heading.tagName.slice(1)),
      step,
    });
  });

  return items;
}
