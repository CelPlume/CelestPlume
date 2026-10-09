/**
 * remark 插件：缩写词 `*[SSR]: 服务端渲染` 字典 + 正文自动匹配。
 *
 * 两段实现（与 Shirone 对齐，Shirone 作者的 Plume 兼容语法）：
 * 1. parser 包装（解析前）：把 `*[术语]: 释义` 行重写为叶子指令
 *    `::cpd-abbr-def{term="…" expansion="…"}`；重复定义保留为字面量段落。
 * 2. 树遍历：收集定义 → 构建词边界正则（最长词优先）→ 把正文文本节点中的
 *    匹配词替换为 `<abbr class="cpd-abbr" title="术语: 释义">术语</abbr>`。
 *
 * CelestPlume 适配：不引入 Popover/JS，释义走原生 `title` 提示（零运行时，
 * 无 JS 也可读）；代码/行内代码/链接/图片/HTML 父节点内不替换。
 */

import type { Plugin } from 'unified';
import type { Root } from 'mdast';

const DEFINITION_NAME = 'cpd-abbr-def';
const LITERAL_DEFINITION_NAME = 'cpd-abbr-literal-def';
const DEFINITION_PATTERN = /^\*\[([^\]\s"{}=]+)\]:[ \t]+(.+)$/u;
const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})/;
const TERM_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}._+-]{0,47}$/u;
const SKIPPED_PARENT_TYPES: Record<string, true> = {
  cpdAbbrLiteral: true,
  code: true,
  definition: true,
  html: true,
  image: true,
  imageReference: true,
  inlineCode: true,
  link: true,
  linkReference: true,
};

interface MdNode {
  type?: string;
  name?: string;
  value?: string;
  children?: MdNode[];
  attributes?: Record<string, string | undefined>;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 把 `*[术语]: 释义` 字典行重写为叶子指令行（fence 感知）。 */
export function rewriteAbbreviationDefinitions(source: string): string {
  const lines = String(source).split(/\r?\n/u);
  const output: string[] = [];
  const definitions = new Set<string>();
  let fenceMarker = '';

  for (const line of lines) {
    const fence = line.match(FENCE_PATTERN)?.[1] ?? '';
    if (fenceMarker) {
      output.push(line);
      if (fence && fence[0] === fenceMarker[0] && fence.length >= fenceMarker.length) {
        fenceMarker = '';
      }
      continue;
    }

    if (fence) {
      fenceMarker = fence;
      output.push(line);
      continue;
    }

    const match = line.match(DEFINITION_PATTERN);
    if (!match) {
      output.push(line);
      continue;
    }

    const [, term, expansion] = match;
    if (!TERM_PATTERN.test(term) || !expansion.trim()) {
      output.push(line);
      continue;
    }
    if (definitions.has(term)) {
      output.push(`::${LITERAL_DEFINITION_NAME}{value="${escapeAttribute(line)}"}`);
      continue;
    }

    definitions.add(term);
    output.push(`::${DEFINITION_NAME}{term="${term}" expansion="${escapeAttribute(expansion.trim())}"}`);
    output.push('');
  }

  return output.join('\n');
}

interface ReplaceState {
  referenceIndex: number;
}

function replaceReferences(
  parent: MdNode,
  definitions: Map<string, string>,
  referencePattern: RegExp,
  state: ReplaceState,
): void {
  if (!Array.isArray(parent.children) || SKIPPED_PARENT_TYPES[parent.type ?? '']) {
    return;
  }

  const children: MdNode[] = [];
  for (const child of parent.children) {
    if (child.type !== 'text') {
      replaceReferences(child, definitions, referencePattern, state);
      children.push(child);
      continue;
    }

    const nodeValue = child.value ?? '';
    const segments: MdNode[] = [];
    let cursor = 0;
    for (const match of nodeValue.matchAll(referencePattern)) {
      const prefix = match[1];
      const term = match[2];
      const expansion = definitions.get(term);
      const start = (match.index ?? 0) + prefix.length;
      if (expansion === undefined) continue;
      if (start > cursor) {
        segments.push({ type: 'text', value: nodeValue.slice(cursor, start) });
      }
      state.referenceIndex += 1;
      segments.push({
        type: 'cpdAbbreviation',
        data: {
          hName: 'abbr',
          hProperties: {
            className: ['cpd-abbr'],
            title: `${term}: ${expansion}`,
            'data-cpd-abbr': `${term}: ${expansion}`,
            ariaLabel: `${term}: ${expansion}`,
            tabIndex: 0,
          },
        },
        children: [{ type: 'text', value: term }],
      });
      cursor = start + term.length;
    }

    if (segments.length === 0) {
      children.push(child);
      continue;
    }
    if (cursor < nodeValue.length) {
      segments.push({ type: 'text', value: nodeValue.slice(cursor) });
    }
    children.push(...segments);
  }
  parent.children = children;
}

interface ParserHost {
  parser?: (value: string, file?: { path?: string }) => unknown;
}

/** unified 插件：parser 包装（字典行→指令）+ 树遍历（匹配替换）。 */
function remarkAbbreviations(this: ParserHost): (tree: MdNode) => void {
  const parser = this.parser;
  if (typeof parser !== 'function') {
    throw new TypeError('remarkAbbreviations requires an initialized Markdown parser.');
  }

  this.parser = (value: string, file?: { path?: string }): unknown => {
    const source = typeof value === 'string' ? value : String(value ?? '');
    return parser(rewriteAbbreviationDefinitions(source), file);
  };

  return (tree: MdNode) => {
    const definitions = new Map<string, string>();
    const visibleChildren: MdNode[] = [];
    for (const child of tree.children ?? []) {
      if (child.type === 'leafDirective' && child.name === LITERAL_DEFINITION_NAME) {
        const value = child.attributes?.value;
        if (typeof value === 'string') {
          visibleChildren.push({
            type: 'cpdAbbrLiteral',
            data: { hName: 'p' },
            children: [{ type: 'text', value }],
          });
        }
        continue;
      }
      if (child.type !== 'leafDirective' || child.name !== DEFINITION_NAME) {
        visibleChildren.push(child);
        continue;
      }

      const term = child.attributes?.term;
      const expansion = child.attributes?.expansion;
      if (
        typeof term === 'string' &&
        typeof expansion === 'string' &&
        TERM_PATTERN.test(term) &&
        expansion.trim() &&
        !definitions.has(term)
      ) {
        definitions.set(term, expansion.trim());
      }
    }
    tree.children = visibleChildren;

    if (definitions.size > 0) {
      const terms = Array.from(definitions.keys())
        .sort((left, right) => right.length - left.length)
        .map(escapePattern)
        .join('|');
      const referencePattern = new RegExp(
        `(^|[^\\p{L}\\p{N}_])(${terms})(?=$|[^\\p{L}\\p{N}_])`,
        'gu',
      );
      replaceReferences(tree, definitions, referencePattern, { referenceIndex: 0 });
    }
  };
}

export default remarkAbbreviations as unknown as Plugin<[], Root>;
