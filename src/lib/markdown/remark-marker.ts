/**
 * remark 插件：马克笔高亮 `==文本==`（可选语义后缀 `{.variant}`）。
 *
 * 与 Shirone 相同的实现路径：在 remark 解析**之前**把标记语法重写为
 * remark-directive 文本指令 `:mark[文本]{variant="…"}`（此后由 remark-directive
 * 与 remark-cpd-directives 渲染为 `<mark class="cpd-marker--…">`）。
 * 借助指令标签解析，`==嵌套 **Markdown** 强调==` 中的内联格式得以保留。
 *
 * 免疫规则（与 Shirone 对齐）：
 * - 围栏代码块内的 `==` 不重写；行内反引号代码内的 `==` 保持字面量；
 * - 反斜杠转义 `\==x==` 不重写；紧邻更多 `=` 的 `====` 视为普通文本；
 * - 标签内容含 `[`/`]` 或未知 `{.foo}` 后缀时整段放弃重写（宁缺毋错）。
 * 变体集合：primary（默认）/ secondary / tertiary / error / tip。
 */

import type { Plugin } from 'unified';
import type { Root } from 'mdast';

const MARK_VARIANTS: Record<string, true> = {
  primary: true,
  secondary: true,
  tertiary: true,
  error: true,
  tip: true,
};
const FENCE_OPENER = /^[\t ]{0,3}(`{3,}|~{3,})/;
const VARIANT_SUFFIX = /^\{\.([a-z]+)\}/i;

function isEscaped(source: string, index: number): boolean {
  let backslashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
    backslashCount += 1;
  }
  return backslashCount % 2 === 1;
}

function rewriteLine(line: string): string {
  let output = '';
  let cursor = 0;
  let codeDelimiter = '';

  while (cursor < line.length) {
    if (line[cursor] === '`') {
      const delimiter = line.slice(cursor).match(/^`+/)?.[0] ?? '`';
      if (!codeDelimiter) {
        codeDelimiter = delimiter;
      } else if (delimiter.length === codeDelimiter.length) {
        codeDelimiter = '';
      }
      output += delimiter;
      cursor += delimiter.length;
      continue;
    }

    if (
      codeDelimiter ||
      line.slice(cursor, cursor + 2) !== '==' ||
      line[cursor - 1] === '=' ||
      line[cursor + 2] === '=' ||
      isEscaped(line, cursor)
    ) {
      output += line[cursor];
      cursor += 1;
      continue;
    }

    const closingIndex = line.indexOf('==', cursor + 2);
    if (closingIndex === -1 || line[closingIndex + 2] === '=' || isEscaped(line, closingIndex)) {
      output += line[cursor];
      cursor += 1;
      continue;
    }

    const content = line.slice(cursor + 2, closingIndex);
    if (!content.trim() || content.includes('[') || content.includes(']')) {
      output += line[cursor];
      cursor += 1;
      continue;
    }

    const suffixMatch = line.slice(closingIndex + 2).match(VARIANT_SUFFIX);
    if (suffixMatch && !MARK_VARIANTS[suffixMatch[1].toLowerCase()]) {
      output += line.slice(cursor, closingIndex + 2 + suffixMatch[0].length);
      cursor = closingIndex + 2 + suffixMatch[0].length;
      continue;
    }

    const variant = suffixMatch ? suffixMatch[1].toLowerCase() : 'primary';
    const suffixLength = suffixMatch?.[0].length ?? 0;

    output += `:cpd-mark[${content}]{variant="${variant}"}`;
    cursor = closingIndex + 2 + suffixLength;
  }

  return output;
}

/** 把 `==文本=={.variant}` 重写为 `:cpd-mark[文本]{variant="…"}`（fence 感知）。 */
export function rewriteMarkerSyntax(source: string): string {
  if (typeof source !== 'string' || !source.includes('==')) return source;

  let fence: { character: string; length: number } | null = null;
  return source
    .split(/(\r?\n)/)
    .map((part) => {
      if (part === '\n' || part === '\r\n') return part;

      const fenceMatch = part.match(FENCE_OPENER);
      if (fenceMatch) {
        const marker = fenceMatch[1];
        if (!fence) {
          fence = { character: marker[0], length: marker.length };
        } else if (
          marker[0] === fence.character &&
          marker.length >= fence.length &&
          new RegExp(`^[\\t ]{0,3}${fence.character}{${fence.length},}[\\t ]*$`).test(part)
        ) {
          fence = null;
        }
        return part;
      }

      return fence ? part : rewriteLine(part);
    })
    .join('');
}

interface ParserHost {
  parser?: (value: string, file?: { path?: string }) => unknown;
}

/** unified 插件：包装 parser，在解析前应用标记语法重写。 */
function remarkMarker(this: ParserHost): void {
  const parser = this.parser;
  if (typeof parser !== 'function') {
    throw new TypeError('remarkMarker requires an initialized Markdown parser.');
  }

  this.parser = (value: string, file?: { path?: string }): unknown => {
    const source = typeof value === 'string' ? value : String(value ?? '');
    return parser(rewriteMarkerSyntax(source), file);
  };
}

export default remarkMarker as unknown as Plugin<[], Root>;
