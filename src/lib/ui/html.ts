/**
 * CelestPlume Docs Kit — HTML 原语（纯 TS，无框架依赖）
 *
 * 提供极小的 HTML 字符串构建工具集：
 * - `escapeHtml` 防注入
 * - `attrs` 属性序列化（支持布尔属性、style 对象、事件委托用 data-* 钩子）
 * - `el` 元素构建（可嵌套、可传数组子节点）
 *
 * 设计目标：函数式、零依赖、可被 Astro 的 `set:html` 与客户端 runtime 共用。
 */

/** 可序列化为 HTML 子节点的值 */
export type HtmlChild = string | number | boolean | null | undefined | HtmlChild[];

export type AttrValue = string | number | boolean | null | undefined;

export interface Attrs {
  [name: string]: AttrValue | Record<string, string | number> | undefined;
}

/** HTML 转义（& < > " '） */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttrValue(value: string): string {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

function normalizeAttrName(name: string): string {
  // 形如 style.background → 保留原样（style 对象由 styleObjectToString 处理）
  return name;
}

function styleObjectToString(style: Record<string, string | number>): string {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(';');
}

/** 将属性对象序列化为 HTML 属性字符串（不包含外层空格） */
export function attrsToString(attributes: Attrs | undefined): string {
  if (!attributes) return '';
  const parts: string[] = [];

  for (const [rawName, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) continue;

    if (typeof value === 'object') {
      // style 对象
      parts.push(`${rawName}="${styleObjectToString(value)}"`);
      continue;
    }

    if (value === true) {
      parts.push(normalizeAttrName(rawName));
      continue;
    }

    parts.push(`${normalizeAttrName(rawName)}="${escapeAttrValue(String(value))}"`);
  }

  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

function flattenChildren(children: HtmlChild[]): string[] {
  const out: string[] = [];
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) {
      out.push(...flattenChildren(child));
    } else {
      out.push(String(child));
    }
  }
  return out;
}

export interface ElementOptions {
  tag: string;
  attrs?: Attrs;
  children?: HtmlChild | HtmlChild[];
  /** 子节点按原始字符串插入（默认转义） */
  raw?: boolean;
}

/**
 * 构建单个 HTML 元素字符串。
 *
 * @example
 * el('a', { href: '/docs', class: 'link', 'data-cpd': true }, 'Docs')
 * // => <a href="/docs" class="link" data-cpd>Docs</a>
 */
export function el(tag: string, attrs: Attrs | undefined, children: HtmlChild | HtmlChild[]): string {
  const childList = Array.isArray(children) ? children : [children];
  const body = flattenChildren(childList).join('');

  return `<${tag}${attrsToString(attrs)}>${body}</${tag}>`;
}

/** 便捷：无子元素的元素 */
export function elSelf(tag: string, attrs?: Attrs): string {
  return `<${tag}${attrsToString(attrs)} />`;
}

/**
 * 便捷：转义文本节点。
 * `el('p', {}, text('a < b'))` 等价于 `el('p', {}, 'a &lt; b')`
 */
export function text(value: string): string {
  return escapeHtml(value);
}

/** 便捷：无条件原样插入（调用方保证内容安全） */
export function raw(value: string): string {
  return value;
}

/** 从 HTML 字符串解析出元素（供客户端 runtime 使用） */
export function parseHtml<T extends Element>(html: string): T | null {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return (template.content.firstElementChild as T | null) ?? null;
}
