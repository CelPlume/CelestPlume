/**
 * remark 插件：把文档正文里的 ```mermaid 代码块替换为可客户端渲染的容器。
 *
 * Astro 原生做法：经 astro.config.mjs 的 markdown.remarkPlugins 注册，对 Starlight
 * 正文生效（与同目录 rehype-image-zoom.ts 的注入模式一致，Starlight 自身不提供
 * remark/rehype 配置项，只能走 Astro 的 markdown 配置）。
 *
 * 输出结构（.cpd-mermaid 容器）：
 *   - 源码以 JSON 字符串形式嵌入 <script type="application/json">，
 *     既避免被 markdown 二次解析，也不受 HTML 转义影响（`<` → \u003c 防 `</script>` 提前闭合）
 *   - 占位符 .cpd-mermaid-ph 在客户端渲染期间展示（加载态）
 * 客户端负责：动态引入 mermaid → render → 注入 SVG → 挂载缩放/平移/复制工具栏
 * （见 src/lib/ui/mermaid.ts）。
 */

import type { Plugin } from 'unified';
import type { Root, Code, Html } from 'mdast';

export interface RemarkMermaidOptions {
  /** 占位符文案（默认英文 "Loading diagram…"） */
  placeholder?: string;
}

const MERMAID_LANG = 'mermaid';

/** JSON 字符串化并转义 `<`，防止源码里出现 `</script>` 提前闭合内嵌脚本 */
function jsonForScript(source: string): string {
  return JSON.stringify(source).replace(/</g, '\\u003c');
}

function buildContainer(source: string, placeholder: string): string {
  return [
    '<div class="cpd-mermaid" data-cpd-mermaid>',
    `<script type="application/json" data-cpd-mermaid-src>${jsonForScript(source)}</script>`,
    '<div class="cpd-mermaid-ph" role="img" aria-label="Diagram">',
    '<span class="cpd-mermaid-ph-spinner" aria-hidden="true"></span>',
    `<span class="cpd-mermaid-ph-text">${placeholder}</span>`,
    '</div>',
    '</div>',
  ].join('\n');
}

/** 递归把 mermaid code 节点替换为 html 容器（不依赖 unist-util-visit，自包含） */
function transformMermaid(node: unknown, placeholder: string): unknown {
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (n.type === 'code' && String(n.lang ?? '').toLowerCase() === MERMAID_LANG) {
      const htmlNode: Html = {
        type: 'html',
        value: buildContainer(String(n.value ?? ''), placeholder),
      };
      return htmlNode;
    }
    if (Array.isArray(n.children)) {
      n.children = (n.children as unknown[]).map((child) => transformMermaid(child, placeholder));
    }
  }
  return node;
}

export function remarkMermaid(options: RemarkMermaidOptions = {}): (tree: Root) => void {
  const placeholder = options.placeholder ?? 'Loading diagram…';
  return (tree) => {
    transformMermaid(tree as unknown as Code, placeholder);
  };
}

export default remarkMermaid as Plugin<[RemarkMermaidOptions?], Root>;
