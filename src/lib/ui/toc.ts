/**
 * CelestPlume Docs Kit — ClerkTOC 目录构建器（纯 TS）
 *
 * 从零复刻 Plumest 的 ClerkTOC（连接线 + 步骤圆徽 + 轨道高亮）：
 * - **服务端渲染**每条目录的连接线（item 内 svg 向上伸出 6px，深度变化处画
 *   `C` 三次贝塞尔肘形曲线）+ 灰色编号圆徽（`--cpd-muted`）
 * - **客户端轨道**（runtime.ts 测量后注入）：覆盖在主色连接线上的完整 path +
 *   `clip-path` 矩形动画高亮当前激活区间 +
 *   激活区间的编号圆徽转主色
 * - 激活检测、轨道测量由 runtime.ts 完成
 *
 * 输出纯 HTML 字符串；`data-cpd-toc-*` 钩子供 runtime 接管。
 */

import { el, raw } from './html';
import { Icon } from './icons';
import type { TocItem, TocOptions } from './types';

/** 连接线基准偏移（Plumest: BASE = 8） */
const BASE = 8;

/** 条目文字缩进（px，Plumest getItemOffset） */
export function getItemOffset(depth: number): number {
  if (depth <= 2) return 12 + BASE;
  if (depth === 3) return 24 + BASE;
  return 36 + BASE;
}

/** 连接线 x 偏移（px，Plumest getLineOffset） */
export function getLineOffset(depth: number): number {
  if (depth <= 2) return BASE;
  if (depth === 3) return 8 + BASE;
  return 16 + BASE;
}

export interface RenderTocOptions extends TocOptions {
  /** 为所有条目生成连续编号（ClerkTOC 阶数模式） */
  steps?: boolean;
}

/** 单个目录条目的渲染上下文（相邻条目的深度决定肘形曲线） */
export interface TocItemRenderContext {
  isFirst: boolean;
  isLast: boolean;
  prev?: TocItem;
  next?: TocItem;
}

/**
 * 渲染目录容器（含 "On this page" 标题、滚动区、条目列表与空状态）。
 * 轨道 SVG（主色高亮）由 runtime 在测量后注入。
 */
export function renderToc(items: TocItem[], options: RenderTocOptions = {}): string {
  const numbered = items.map((item, i) => ({ ...item, step: item.step ?? (options.steps ? i + 1 : undefined) }));

  const list = numbered.length
    ? el(
        'div',
        { class: 'cpd-toc-items', 'data-cpd-toc-items': '' },
        [
          el('div', { class: 'cpd-toc-track', 'data-cpd-toc-track': '' }, ''),
          ...numbered.map((item, i) =>
            renderTocItem(item, {
              isFirst: i === 0,
              isLast: i === numbered.length - 1,
              prev: numbered[i - 1],
              next: numbered[i + 1],
            }),
          ),
        ],
      )
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

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * 渲染单个目录条目（服务端绘制左侧连接线 SVG）。
 * 对齐 Plumest TOCItem 结构：
 * - svg 绝对定位于条目左上，向上伸出 6px，高度 = 条目高 + 6px
 * - 深度相对上一项变化时画 `C` 三次贝塞尔肘形曲线（item 顶部 12px 段）
 * - 竖线从（上一项同深度 ? 6 : 12）延续到底部
 * - 编号圆徽：灰色（`--cpd-muted`），激活时由轨道层的主色圆徽覆盖
 */
export function renderTocItem(item: TocItem, ctx: TocItemRenderContext): string {
  const l1 = getLineOffset(item.depth);
  const l0 = ctx.isFirst ? l1 : getLineOffset(ctx.prev?.depth ?? item.depth);
  const l2 = ctx.isLast ? l1 : getLineOffset(ctx.next?.depth ?? item.depth);

  const parts: string[] = [];
  if (l0 !== l1) {
    parts.push(
      `<path d="M ${l0 + 0.5} 0 C ${l0 + 0.5} 8 ${l1 + 0.5} 4 ${l1 + 0.5} 12" fill="none" class="cpd-toc-elbow"/>`,
    );
  }
  parts.push(
    `<line x1="${l1 + 0.5}" y1="${l0 === l1 ? 6 : 12}" x2="${l1 + 0.5}" y2="100%" class="cpd-toc-line"/>`,
  );
  if (item.step !== undefined) {
    parts.push(
      `<g transform="translate(${l1 + 0.5}, ${l1 === l2 ? 3 : 6})">` +
        `<circle cx="0" cy="50%" r="8" class="cpd-toc-step-circle"/>` +
        `<text x="0" y="50%" text-anchor="middle" dominant-baseline="central" class="cpd-toc-step-text">${item.step}</text>` +
        `</g>`,
    );
  }

  const svg =
    `<svg class="cpd-toc-item-line-svg" xmlns="${SVG_NS}" width="${Math.max(l0, l1) + 9}" aria-hidden="true">` +
    parts.join('') +
    '</svg>';

  return el(
    'a',
    {
      class: 'cpd-toc-item',
      href: item.url,
      'data-cpd-toc-item': '',
      'data-cpd-active': 'false',
      'data-depth': String(item.depth),
      'data-step': item.step !== undefined ? String(item.step) : undefined,
      style: { paddingInlineStart: `${getItemOffset(item.depth)}px` },
    },
    [raw(svg), el('span', {}, item.title)],
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
