/**
 * remark 插件：文件片段导入（Plume 兼容语法）。
 *
 * 在 remark 解析**之前**把 `<!-- @include: … -->` 注释展开为目标文件内容，
 * 支持整文件、行号切片与命名区块三种形态：
 *
 *   <!-- @include: ../snippets/prerequisites.md -->
 *   <!-- @include: ../../src/config/siteConfig.ts{10-25} -->
 *   <!-- @include: ./example.ts{5-} -->        从第 5 行到结尾
 *   <!-- @include: ./example.ts{-4} -->        从开头到第 4 行
 *   <!-- @include: ./example.ts#auth-config --> 命名区块（#region/#endregion）
 *
 * 语义（与 Shirone 对齐）：
 * - 路径相对**包含方文件**所在目录解析（无文件上下文时回退 cwd），并限制在工作区内；
 * - 围栏代码块内的 include 注释保持字面量；缺失文件 / 非法区间 / 递归包含原样保留；
 * - 展开内容递归展开（嵌套 include），每行保留 include 注释的缩进。
 * 纯字符串变换，供 /<id>.md 与 llms-full 的 downlevel 管线复用。
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

const INCLUDE_LINE =
  /^([\t ]{0,3})<!--[\t ]*@include:[\t ]*([^\s]+?)(?:\{(\d*)-(\d*)\}|#([A-Za-z0-9._-]+))?[\t ]*-->[\t ]*$/u;
const FENCE_LINE = /^[\t ]{0,3}(`{3,}|~{3,})/u;
const REGION_START = /(?:#|\/\/|<!--)\s*region\s+([A-Za-z0-9._-]+)\s*(?:-->)?\s*$/u;
const REGION_END = /(?:#|\/\/|<!--)\s*endregion(?:\s+[A-Za-z0-9._-]+)?\s*(?:-->)?\s*$/u;

function insideWorkspace(filePath: string): boolean {
  const root = resolve(process.cwd());
  const relativePath = relative(root, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function sliceLines(content: string, start: string | undefined, end: string | undefined): string | null {
  if (start === undefined && end === undefined) return content;
  const lines = content.split(/\r?\n/u);
  const first = start ? Number.parseInt(start, 10) : 1;
  const last = end ? Number.parseInt(end, 10) : lines.length;
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first) {
    return null;
  }
  return lines.slice(first - 1, last).join('\n');
}

function sliceRegion(content: string, region: string): string | null {
  const lines = content.split(/\r?\n/u);
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const startMatch = lines[index].match(REGION_START);
    if (startMatch?.[1] === region) {
      start = index + 1;
      break;
    }
  }
  if (start < 0) return null;
  for (let index = start; index < lines.length; index += 1) {
    if (REGION_END.test(lines[index])) return lines.slice(start, index).join('\n');
  }
  return null;
}

function readInclude(
  includePath: string,
  start: string | undefined,
  end: string | undefined,
  region: string | undefined,
  baseDir: string,
  stack: string[],
): string | null {
  const target = resolve(baseDir, includePath);
  if (!insideWorkspace(target) || stack.includes(target) || !existsSync(target)) return null;
  let content: string;
  try {
    content = readFileSync(target, 'utf8');
  } catch {
    return null;
  }
  if (region) return sliceRegion(content, region);
  return sliceLines(content, start, end);
}

export interface ExpandIncludesOptions {
  baseDir?: string;
  stack?: string[];
}

export interface ExpandIncludesResult {
  source: string;
  included: boolean;
}

/** 展开 Markdown 源码中的全部 include 注释（fence 感知、递归、防环）。 */
export function expandMarkdownIncludes(
  source: string,
  options: ExpandIncludesOptions = {},
): ExpandIncludesResult {
  const baseDir = options.baseDir ?? process.cwd();
  const stack = options.stack ?? [];
  const lines = String(source).split(/\r?\n/u);
  const output: string[] = [];
  let fence: { character: string; length: number } | null = null;
  let included = false;

  for (const line of lines) {
    const fenceMatch = line.match(FENCE_LINE);
    if (fenceMatch) {
      if (!fence) fence = { character: fenceMatch[1][0], length: fenceMatch[1].length };
      else if (fenceMatch[1][0] === fence.character && fenceMatch[1].length >= fence.length) fence = null;
      output.push(line);
      continue;
    }
    if (fence) {
      output.push(line);
      continue;
    }

    const match = line.match(INCLUDE_LINE);
    if (!match) {
      output.push(line);
      continue;
    }
    const [, indent, includePath, start, end, region] = match;
    const target = resolve(baseDir, includePath);
    const content = readInclude(includePath, start, end, region, baseDir, stack);
    if (content === null) {
      output.push(line);
      continue;
    }
    included = true;

    // 代码目标（非 Markdown）自动包一层代码围栏：切片行以高亮代码块呈现，
    // 与行号/语法高亮同步生效；围栏标记取内容中最长反引号串 +1 防冲突。
    const isMarkdownTarget = /\.(md|markdown|mdx)$/iu.test(target);
    let spliced = content;
    if (!isMarkdownTarget) {
      const lang = target.includes('.') ? target.split('.').pop() ?? 'text' : 'text';
      const longestRun = content.match(/`{3,}/gu)?.reduce((max, run) => Math.max(max, run.length), 2) ?? 2;
      const fenceMark = '`'.repeat(longestRun + 1);
      spliced = [`${fenceMark}${lang}`, content, fenceMark].join('\n');
    }

    const expanded = expandMarkdownIncludes(spliced, {
      baseDir: dirname(target),
      stack: [...stack, target],
    });
    output.push(...expanded.source.split('\n').map((childLine) => `${indent}${childLine}`));
  }

  return { source: output.join('\n'), included };
}

interface ParserHost {
  parser?: (value: string, file?: { path?: string }) => unknown;
}

/**
 * 挂载为 parser 包装（unified 插件，`this` 为处理器）：
 * 解析前展开 include。unified 调用 parser 时传 `(String(file), file)`，
 * 第二参数即带 path 的 VFile —— 路径相对包含方目录解析，无路径时回退 cwd。
 */
function remarkIncludes(this: ParserHost): void {
  const parser = this.parser;
  if (typeof parser !== 'function') {
    throw new TypeError('remarkIncludes requires an initialized Markdown parser.');
  }

  this.parser = (value: string, file?: { path?: string }): unknown => {
    const source = typeof value === 'string' ? value : String(value ?? '');
    const baseDir = file?.path ? dirname(resolve(file.path)) : process.cwd();
    const expanded = expandMarkdownIncludes(source, { baseDir });
    return parser(expanded.source);
  };
}

export default remarkIncludes as unknown as Plugin<[], Root>;
