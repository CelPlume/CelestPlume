/**
 * remark 插件：CPD 指令渲染桥（在 remark-directive 之后运行）。
 *
 * remark-directive 只负责把 `:x[…]` 解析为指令节点，节点本身不会被渲染
 * 输出。本插件给受支持的文本指令设置 `data.hName/hProperties`
 * （mdast-util-to-hast 的未知节点据此输出 HTML）：
 *
 * - 文本指令 `:cpd-mark[text]{variant="…"}`（remark-marker 产出）
 *   → `<mark class="cpd-marker cpd-marker--{variant}">`，未知变体回退 primary
 * - 文本指令 `:spoiler[text]`
 *   → `<button type="button" class="cpd-spoiler" aria-expanded="false">`
 *
 * 内容型组件（视频嵌入 / 链接卡片）走 Plumest MDX 组件规范
 * （<BilibiliVideo> / <YouTubeVideo> / <BilibiliCard>），不再提供 `::` 指令；
 * 残留的叶子/容器指令整体回退为字面量文本，宁缺毋错。
 */

import type { Root, RootContent } from 'mdast';
import type { LeafDirective, TextDirective } from 'mdast-util-directive';

const MARK_VARIANTS: Record<string, true> = {
  primary: true,
  secondary: true,
  tertiary: true,
  error: true,
  tip: true,
};

interface MdDirective {
  type: string;
  name?: string;
  attributes?: Record<string, string | null | undefined> | null;
  children?: unknown;
}

interface DirectiveHost {
  type?: string;
  children?: (RootContent | MdDirective)[];
}

function asDirective(node: unknown): MdDirective | null {
  if (!node || typeof node !== 'object') return null;
  const candidate = node as MdDirective;
  if (
    (candidate.type !== 'textDirective' &&
      candidate.type !== 'leafDirective' &&
      candidate.type !== 'containerDirective') ||
    typeof candidate.name !== 'string'
  ) {
    return null;
  }
  return candidate;
}

/** 文本指令 → 行内元素（data.hName 路线，子内容原样保留）。 */
function mapTextDirective(node: TextDirective): void {
  if (node.name === 'cpd-mark') {
    const candidate = node.attributes?.variant;
    const variant = candidate && MARK_VARIANTS[candidate] ? candidate : 'primary';
    node.data = {
      ...node.data,
      hName: 'mark',
      hProperties: {
        className: ['cpd-marker', `cpd-marker--${variant}`],
        'data-marker': variant,
      },
    };
    return;
  }

  if (node.name === 'spoiler') {
    node.data = {
      ...node.data,
      hName: 'button',
      hProperties: {
        type: 'button',
        className: ['cpd-spoiler'],
        'data-cpd-spoiler': '',
        'aria-expanded': 'false',
      },
    };
  }
  // 未知文本指令：保持无 data → remark-rehype 丢弃（与 remark-directive 默认一致）
}

function directiveSourceText(node: MdDirective): string {
  const attrs = node.attributes ?? {};
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  const tag = node.type === 'textDirective' ? ':' : node.type === 'leafDirective' ? '::' : ':::';
  return `${tag}${node.name}${attrText ? `{${attrText}}` : ''}`;
}

/** unified transformer：遍历指令节点并落地为 HTML 输出形态。 */
export default function remarkCpdDirectives(): (tree: Root) => void {
  const visit = (parent: DirectiveHost): void => {
    if (!Array.isArray(parent.children)) return;
    parent.children = parent.children.flatMap((child) => {
      const directive = asDirective(child);
      if (!directive) {
        visit(child as DirectiveHost);
        return [child as RootContent];
      }
      if (directive.type === 'textDirective') {
        mapTextDirective(directive as unknown as TextDirective);
        return [child as RootContent];
      }
      // 叶子/容器指令（未受支持）：还原为作者书写的字面量，避免内容静默丢失
      const literal: RootContent = {
        type: 'paragraph',
        children: [{ type: 'text', value: directiveSourceText(directive) }],
      } as unknown as RootContent;
      return [literal];
    });
  };

  return (tree: Root) => {
    visit(tree as unknown as DirectiveHost);
  };
}
