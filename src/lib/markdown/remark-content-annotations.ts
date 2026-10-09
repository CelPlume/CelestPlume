/**
 * remark 插件：内容注释 `[+tag]` 行内标记 + `[+tag]:` 定义块。
 *
 * 两段实现（与 Shirone 对齐）：
 * 1. parser 包装（解析前）：把定义块（`[+tag]:` 行 + 随后的缩进续行）
 *    重写为容器指令 `:::cpd-content-note-definition{label="…"}`。
 * 2. 树遍历：收集全部定义（并从正文移除）→ 把文本节点中的 `[+tag]`
 *    引用替换为触发徽标 + 在文章根部追加 Popover 卡片。
 *
 * 交互为零 JS：触发徽标用原生 `popovertarget` 声明式关联
 * `<aside popover>`；定位用 CSS Anchor Positioning（`@supports` 回退居中）。
 * 定义正文允许富 Markdown（段落/列表/链接/行内代码）；
 * 同一 label 多条定义渲染为有序列表；未定义的引用保持字面量。
 * 代码 / 定义 / 图片 / 行内代码 / 链接父节点内不替换。
 */

import type { Plugin } from 'unified';
import type { Root } from 'mdast';

const DEFINITION_NAME = 'cpd-content-note-definition';
const DEFINITION_PATTERN = /^\[\+([^\]\s"{}=]+)\]:[ \t]*(.*)$/u;
const REFERENCE_PATTERN = /\[\+([^\]\s]+)\]/gu;
const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})/;
const SKIPPED_PARENT_TYPES: Record<string, true> = {
  code: true,
  definition: true,
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
  ordered?: boolean;
  spread?: boolean;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

function cloneNode<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneNode(item)) as unknown as T;
  if (!value || typeof value !== 'object') return value;
  const entries = Object.entries(value as Record<string, unknown>).map(([key, child]) => [
    key,
    cloneNode(child),
  ]);
  return Object.fromEntries(entries) as unknown as T;
}

function isIndentedDefinitionLine(line: string): boolean {
  return line.startsWith('  ') || line.startsWith('\t');
}

function removeDefinitionIndent(line: string): string {
  return line.startsWith('\t') ? line.slice(1) : line.slice(2);
}

/** 把 `[+tag]:` 定义块重写为容器指令（fence 感知）。 */
export function rewriteContentAnnotationDefinitions(source: string): string {
  const lines = String(source).split(/\r?\n/u);
  const output: string[] = [];
  let fenceMarker = '';

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
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

    const definition = line.match(DEFINITION_PATTERN);
    if (!definition) {
      output.push(line);
      continue;
    }

    const [, label, inlineContent] = definition;
    const content: string[] = inlineContent ? [inlineContent] : [];
    let nextIndex = index + 1;

    while (nextIndex < lines.length) {
      const nextLine = lines[nextIndex];
      if (nextLine.trim() === '') {
        content.push('');
        nextIndex += 1;
        continue;
      }
      if (!isIndentedDefinitionLine(nextLine)) break;
      content.push(removeDefinitionIndent(nextLine));
      nextIndex += 1;
    }

    while (content.at(-1) === '') content.pop();
    if (!content.some((contentLine) => contentLine.trim() !== '')) {
      output.push(...lines.slice(index, nextIndex));
      index = nextIndex - 1;
      continue;
    }

    output.push(`:::${DEFINITION_NAME}{label="${label}"}`);
    output.push(...content);
    output.push(':::');
    index = nextIndex - 1;
  }

  return output.join('\n');
}

/** 单条定义 → div；多条定义 → 有序列表（各自带 data.hName 定制类名）。 */
function createDefinitionBody(definitions: MdNode[][]): MdNode {
  if (definitions.length === 1) {
    return {
      type: 'cpdContentAnnotationBody',
      data: {
        hName: 'div',
        hProperties: { className: ['cpd-anno-body'] },
      },
      children: cloneNode(definitions[0]),
    };
  }

  return {
    type: 'list',
    ordered: true,
    spread: true,
    data: {
      hName: 'ol',
      hProperties: { className: ['cpd-anno-list'] },
    },
    children: definitions.map((definition) => ({
      type: 'listItem',
      spread: true,
      data: {
        hName: 'li',
        hProperties: { className: ['cpd-anno-item'] },
      },
      children: cloneNode(definition),
    })),
  };
}

function createAnnotationReference(
  label: string,
  definitions: MdNode[][],
  index: number,
): { trigger: MdNode; popover: MdNode } {
  const id = `cpd-anno-${index}`;
  const anchorName = `--${id}`;
  const trigger: MdNode = {
    type: 'cpdContentAnnotationReference',
    data: {
      hName: 'button',
      hProperties: {
        type: 'button',
        className: ['cpd-anno-trigger'],
        popovertarget: id,
        ariaLabel: label,
        style: `anchor-name: ${anchorName}`,
      },
    },
    children: [
      {
        type: 'text',
        value: '+',
        data: {
          hName: 'span',
          hProperties: { ariaHidden: 'true' },
        },
      },
    ],
  };
  const popover: MdNode = {
    type: 'cpdContentAnnotationPopover',
    data: {
      hName: 'aside',
      hProperties: {
        id,
        className: ['cpd-anno-popover'],
        popover: 'auto',
        role: 'note',
        ariaLabel: label,
        // 直接内联 position-anchor（避免自定义属性间接引用的兼容性差异）
        style: `position-anchor: ${anchorName}`,
      },
    },
    children: [
      {
        type: 'paragraph',
        data: {
          hName: 'p',
          hProperties: { className: ['cpd-anno-label'] },
        },
        children: [{ type: 'text', value: label }],
      },
      createDefinitionBody(definitions),
    ],
  };

  return { trigger, popover };
}

interface TransformState {
  referenceIndex: number;
}

function transformReferences(
  parent: MdNode,
  definitions: Map<string, MdNode[][]>,
  popovers: MdNode[],
  state: TransformState,
): void {
  if (!Array.isArray(parent.children) || SKIPPED_PARENT_TYPES[parent.type ?? '']) {
    return;
  }

  const children: MdNode[] = [];
  for (const child of parent.children) {
    if (child.type !== 'text') {
      transformReferences(child, definitions, popovers, state);
      children.push(child);
      continue;
    }

    const nodeValue = child.value ?? '';
    let cursor = 0;
    for (const match of nodeValue.matchAll(REFERENCE_PATTERN)) {
      const label = match[1];
      const annotationDefinitions = definitions.get(label);
      if (!annotationDefinitions?.length) continue;

      if ((match.index ?? 0) > cursor) {
        children.push({
          type: 'text',
          value: nodeValue.slice(cursor, match.index),
        });
      }
      state.referenceIndex += 1;
      const { trigger, popover } = createAnnotationReference(
        label,
        annotationDefinitions,
        state.referenceIndex,
      );
      children.push(trigger);
      popovers.push(popover);
      cursor = (match.index ?? 0) + match[0].length;
    }

    if (cursor === 0) {
      children.push(child);
    } else if (cursor < nodeValue.length) {
      children.push({ type: 'text', value: nodeValue.slice(cursor) });
    }
  }
  parent.children = children;
}

interface ParserHost {
  parser?: (value: string, file?: { path?: string }) => unknown;
}

/** unified 插件：parser 包装（定义块→指令）+ 树遍历（引用→徽标 + Popover）。 */
function remarkContentAnnotations(this: ParserHost): (tree: MdNode) => void {
  const parser = this.parser;
  if (typeof parser !== 'function') {
    throw new TypeError('remarkContentAnnotations requires an initialized Markdown parser.');
  }

  this.parser = (value: string, file?: { path?: string }): unknown => {
    const source = typeof value === 'string' ? value : String(value ?? '');
    return parser(rewriteContentAnnotationDefinitions(source), file);
  };

  return (tree: MdNode) => {
    const definitions = new Map<string, MdNode[][]>();
    const visibleChildren: MdNode[] = [];

    for (const child of tree.children ?? []) {
      if (child.type !== 'containerDirective' || child.name !== DEFINITION_NAME) {
        visibleChildren.push(child);
        continue;
      }

      const label = child.attributes?.label;
      if (typeof label !== 'string' || !label || child.children?.length === 0) {
        continue;
      }
      const entries = definitions.get(label) ?? [];
      entries.push(child.children ?? []);
      definitions.set(label, entries);
    }

    tree.children = visibleChildren;
    if (definitions.size === 0) return;

    const popovers: MdNode[] = [];
    transformReferences(tree, definitions, popovers, { referenceIndex: 0 });
    tree.children?.push(...popovers);
  };
}

export default remarkContentAnnotations as unknown as Plugin<[], Root>;
