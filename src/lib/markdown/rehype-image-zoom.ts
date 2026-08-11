/**
 * rehype 插件：把文档正文里的每个 `<img>` 重写为可点击放大的 ImageZoom 组件。
 *
 * 同时修复「markdown/mdx 图片设置了 zoom 却未按缩放渲染」的问题：
 * 正文容器 `.cpd-article` 是 flex 布局，直接作为 flex item 的 `<img>` 会被
 * 拉伸到整行宽度，`style="zoom: N%"` 因此失效。把图片包进非 flex 的
 * `.cpd-iz` 容器后，`zoom` 才能按原始尺寸真正缩放。
 *
 * 兼容两种 markdown 图片写法：
 * - `![alt](src)`（markdown 语法）→ remark-rehype 生成 `<img>` 元素节点
 * - 原生 `<img … />` HTML → 因 Astro 的 rehype-raw 在用户 rehype 插件之后
 *   运行，此时仍是 `raw` 文本节点，这里先解析其 HTML 再逐图转换
 *
 * 由 astro.config.mjs 的 `markdown.rehypePlugins` 注册，对 Starlight 正文生效。
 */

import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import type { Element, Root, RootContent } from 'hast';
import { renderImageZoom, type ImageZoomOptions } from '../ui/image-zoom';

interface RehypeImageZoomOptions {
  /** 是否启用（默认 true） */
  enabled?: boolean;
}

/** 递归遍历：转换 `<img>`、折叠“仅含单张图片”的 `<p>`、解析 raw HTML */
/** 行内容器：其中的图片若是与文本混排（或位于链接内）则视为行内图，不包裹 */
const INLINE_CONTAINERS = new Set([
  'a', 'span', 'em', 'strong', 'code', 'label', 'button', 'small', 'abbr',
  'sub', 'sup', 'b', 'i', 'u', 'mark',
]);

/** 图片是否应被包裹为独立块（否则保持行内，如徽章/链接图） */
function isStandaloneImg(
  node: Element,
  parent: Element | undefined,
  inAnchor: boolean,
): boolean {
  if (inAnchor) return false;
  // 无父元素 = 直接作为片段根/文章的直接子节点，视为独立块图
  if (!parent) return true;
  if (parent.tagName === 'a') return false;
  if (INLINE_CONTAINERS.has(parent.tagName)) {
    const others = parent.children.filter(
      (c) => c !== node && !(c.type === 'text' && (c.value ?? '').trim() === ''),
    );
    if (others.length > 0) return false;
  }
  return true;
}

/** 判断图片是否有水平 auto 外边距（居中意图） */
function hasCenterIntent(style: string | undefined): boolean {
  if (!style) return false;
  const normalized = style.replace(/\s+/g, '').toLowerCase();
  return (
    normalized.includes('margin-left:auto') ||
    normalized.includes('margin-right:auto') ||
    /margin:0?auto/.test(normalized)
  );
}

function transformChildren(
  children: RootContent[],
  parent?: Element,
  inAnchor = false,
): void {
  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // 原生 HTML（rehype-raw 尚未解析）：解析后逐图转换，再序列化回 raw
    if (node.type === 'raw') {
      const parsed = fromHtml(node.value ?? '', { fragment: true }) as Root;
      transformChildren(parsed.children as RootContent[]);
      node.value = toHtml(parsed, { allowDangerousHtml: true });
      continue;
    }

    if (node.type !== 'element') continue;

    // 单张图片 <img>
    if (node.tagName === 'img') {
      if (isStandaloneImg(node, parent, inAnchor)) {
        const replacement = buildReplacement(node);
        if (replacement) {
          children.splice(i, 1, ...replacement);
          i += replacement.length - 1;
        }
      }
      continue;
    }

    // 折叠「仅含单张图片」的 <p>，避免 `<p></p><div>` 这类非法嵌套
    if (node.tagName === 'p') {
      const imgs = node.children.filter(
        (c): c is Element => c.type === 'element' && c.tagName === 'img',
      );
      const nonWhitespace = node.children.filter(
        (c) => !(c.type === 'text' && (c.value ?? '').trim() === ''),
      );
      if (imgs.length === 1 && nonWhitespace.length === 1 && nonWhitespace[0] === imgs[0]) {
        const replacement = buildReplacement(imgs[0]);
        if (replacement) {
          children.splice(i, 1, ...replacement);
          i += replacement.length - 1;
        }
        continue;
      }
    }

    if ('children' in node && node.children) {
      const nextInAnchor = inAnchor || node.tagName === 'a';
      transformChildren(node.children as RootContent[], node, nextInAnchor);
    }
  }
}

/** 把一个 `<img>` hast 节点转成 ImageZoom 的根节点列表 */
function buildReplacement(node: Element): Element[] | null {
  const props = node.properties ?? {};
  const src = typeof props.src === 'string' ? props.src : '';
  if (!src) return null;

  const toStr = (v: unknown): string | undefined =>
    v == null ? undefined : String(v);

  const className = Array.isArray(props.className)
    ? props.className.filter((c): c is string => typeof c === 'string').join(' ')
    : toStr(props.className);

  const style = toStr(props.style) ?? '';

  const options: ImageZoomOptions = {
    src,
    alt: toStr(props.alt),
    style,
    width: toStr(props.width),
    height: toStr(props.height),
    className,
    loading: toStr(props.loading),
    center: hasCenterIntent(style),
  };

  const html = renderImageZoom(options);
  const root = fromHtml(html, { fragment: true }) as Root;
  return root.children as Element[];
}

export default function rehypeImageZoom(
  options: RehypeImageZoomOptions = {},
): (tree: Root) => void {
  const { enabled = true } = options;
  return (tree) => {
    if (!enabled) return;
    transformChildren(tree.children as RootContent[]);
  };
}
