/**
 * Agent 端点 Markdown 结构化降级（Downlevel）
 *
 * 服务端把 MDX 源码降级为纯净 GFM，供 `/<id>.md` 端点与 `/llms-full.txt`
 * 消费（Coding Agent / LLM 抓取时不再被 import 语句与自定义 JSX 干扰）。
 *
 * 转换规则（与本项目内容实际用到的组件/语法对齐）：
 * - `import ...` 语句：剥离（ESM 是页面代码，不是内容）
 * - `<GitHubCard owner repo>`：转为 `[owner/repo](https://github.com/owner/repo)` 列表项
 * - `<Preview ...>...</Preview>`：整块剔除（交互演示 HTML 对 agent 无意义）
 * - `<!-- @include: … -->`：按 remark-includes 同款规则展开（需 basePath）
 * - `==文本=={.variant}`：马克笔高亮 → `**文本**`
 * - `:spoiler[文本]`：隐秘文本直接显形（对 agent 无保密意义）
 * - `*[术语]: 释义` 字典行：剥离（正文术语保持原样）
 * - `[+tag]` 引用 / `[+tag]:` 定义：转为 GFM 脚注 `[^tag]` / `[^tag]: 内容`
 * - `<BilibiliCard bvid>` / `<BilibiliVideo bvid p>` / `<YouTubeVideo id>`：
 *   转为对应视频页链接列表项
 * - 围栏代码块（``` /~~~）原样保留，任何转换都不进入其内部
 *
 * 已知限制：属性解析面向本项目内容形态（字符串属性与对象字面量数组），
 * 不做通用 MDX 语法树解析；未识别的 JSX 标签原样保留，宁多勿缺。
 */

import { expandMarkdownIncludes } from '../markdown/remark-includes';
import { rewriteMarkerSyntax } from '../markdown/remark-marker';
import { dirname } from 'node:path';

/** 围栏占位符前后缀（控制字符，正文中不可能出现） */
const FENCE_SENTINEL = '\u0000FENCE';

interface FenceToken {
  placeholder: string;
  source: string;
}

/** 把围栏代码块替换为占位符，返回掩码后的文本与令牌表 */
function maskFences(text: string): { masked: string; tokens: FenceToken[] } {
  const tokens: FenceToken[] = [];
  const lines = text.split('\n');
  const out: string[] = [];
  let inFence = false;
  let fenceMark = '';
  let buffer: string[] = [];

  for (const line of lines) {
    const match = /^\s*(`{3,}|~{3,})/.exec(line);
    if (!inFence && match) {
      inFence = true;
      fenceMark = match[1];
      buffer = [line];
      continue;
    }
    if (inFence) {
      buffer.push(line);
      // 结束围栏：相同标记且长度 ≥ 起始围栏
      if (new RegExp(`^\\s*${fenceMark[0]}{${fenceMark.length},}\\s*$`).test(line)) {
        inFence = false;
        const source = buffer.join('\n');
        const placeholder = `${FENCE_SENTINEL}${tokens.length}\u0000`;
        tokens.push({ placeholder, source });
        out.push(placeholder);
      }
      continue;
    }
    out.push(line);
  }
  // 未闭合围栏：原样返还，不阻塞端点
  if (inFence) {
    const source = buffer.join('\n');
    const placeholder = `${FENCE_SENTINEL}${tokens.length}\u0000`;
    tokens.push({ placeholder, source });
    out.push(placeholder);
  }

  return { masked: out.join('\n'), tokens };
}

/** 括号配对扫描：从 start 出发，跳过字符串字面量，返回匹配的闭合括号索引 */
function matchBracket(text: string, start: number, open: string, close: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** 定位下一个指定标签的 JSX 元素（属性含嵌套括号/字符串时安全） */
function findJsxElement(
  text: string,
  tag: string,
  from = 0,
): { start: number; end: number; tagSource: string; selfClosing: boolean } | null {
  const needle = `<${tag}`;
  let pos = from;
  for (;;) {
    const start = text.indexOf(needle, pos);
    if (start === -1) return null;
    pos = start + needle.length;
    const next = text[pos];
    // 排除 <PreviewGroup 之类的更长标签名
    if (next && /[A-Za-z0-9_-]/.test(next)) continue;

    // 扫描开标签直到 '>'（跳过字符串与括号）
    let quote: string | null = null;
    let i = pos;
    let tagEnd = -1;
    let selfClosing = false;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '>') {
        // '/>' 为自闭合；'>' 仅为开标签结束
        selfClosing = text[i - 1] === '/';
        tagEnd = i;
        break;
      }
    }
    if (tagEnd === -1) return null;

    const tagSource = text.slice(start, tagEnd + 1);
    let end = tagEnd + 1;
    if (!selfClosing) {
      // 找闭合标签（本项目组件不嵌套自身）
      const closeIdx = text.indexOf(`</${tag}`, tagEnd);
      if (closeIdx === -1) return null;
      const closeEnd = text.indexOf('>', closeIdx);
      if (closeEnd === -1) return null;
      end = closeEnd + 1;
    }
    return { start, end, tagSource, selfClosing };
  }
}

/** 从开标签源码中提取字符串属性值 */
function extractStringAttr(tagSource: string, attr: string): string | undefined {
  const m = new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tagSource);
  return m?.[1] ?? m?.[2];
}

/** 从开标签源码中提取花括号表达式属性（括号配对安全） */
function extractBraceAttr(tagSource: string, attr: string): string | undefined {
  const m = new RegExp(`\\b${attr}\\s*=\\s*\\{`).exec(tagSource);
  if (!m) return undefined;
  const openIdx = m.index + m[0].length - 1;
  const closeIdx = matchBracket(tagSource, openIdx, '{', '}');
  if (closeIdx === -1) return undefined;
  return tagSource.slice(openIdx + 1, closeIdx);
}

const repoLink = (owner: string, repo: string): string =>
  `- [${owner}/${repo}](https://github.com/${owner}/${repo})`;

/** `*[术语]: 释义` 字典行（剥离） */
const ABBR_DEFINITION_LINE = /^\*\[[^\]\s"{}=]+\]:[ \t]+.+$/u;

/** `[+tag]: 行内内容` 定义起始行 */
const ANNOTATION_DEF_LINE = /^\[\+([^\]\s"{}=]+)\]:[ \t]*(.*)$/u;

/** `[+tag]` 行内引用 */
const ANNOTATION_REF_PATTERN = /\[\+([^\]\s]+)\]/gu;

/** `:cpd-mark[文本]{variant="…"}`（rewriteMarkerSyntax 的产物；内容不含方括号） */
const MARK_DIRECTIVE = /:cpd-mark\[([^\]]+)\]\{variant="[^"]*"\}/gu;

/** `:spoiler[` 的配对括号扫描（标签允许嵌套一层 `[...]`） */
function revealSpoilers(text: string): string {
  if (!text.includes(':spoiler[')) return text;

  let output = '';
  let cursor = 0;
  for (;;) {
    const start = text.indexOf(':spoiler[', cursor);
    if (start === -1) break;
    output += text.slice(cursor, start);

    let depth = 0;
    let end = -1;
    for (let i = start + ':spoiler'.length; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '[') depth += 1;
      else if (ch === ']') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) {
      // 未闭合：原样保留
      output += ':spoiler';
      cursor = start + ':spoiler'.length;
      continue;
    }
    output += text.slice(start + ':spoiler['.length, end);
    cursor = end + 1;
  }
  output += text.slice(cursor);
  return output;
}

/** 注释/指令语法 → GFM（脚注化注释、显形隐秘文本、链接化仓库/视频指令） */
function downlevelInlineSyntax(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let annotationDefLabel: string | null = null;

  for (const line of lines) {
    // 注释定义块：`[+tag]: …` + 缩进续行 → GFM 脚注（续行统一 4 空格，
    // 保证空行之后仍归属同一条脚注）
    if (annotationDefLabel !== null) {
      if (line.trim() === '') {
        out.push('');
        continue;
      }
      if (line.startsWith('  ') || line.startsWith('\t')) {
        const dedented = line.startsWith('\t') ? line.slice(1) : line.slice(2);
        out.push(`    ${dedented}`);
        continue;
      }
      annotationDefLabel = null;
    }

    const defMatch = line.match(ANNOTATION_DEF_LINE);
    if (defMatch) {
      annotationDefLabel = defMatch[1];
      out.push(`[^${defMatch[1]}]: ${defMatch[2]}`);
      continue;
    }

    if (ABBR_DEFINITION_LINE.test(line)) continue;
    if (line.includes('[+')) {
      out.push(line.replace(ANNOTATION_REF_PATTERN, '[^$1]'));
      continue;
    }
    out.push(line);
  }

  return out
    .join('\n')
    .replace(MARK_DIRECTIVE, '**$1**')
    .trim();
}

/** 剥离 ESM import 语句（含跨行，跳过字符串内的括号） */
function stripImports(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let pending = false;
  let depth = 0;

  for (const line of lines) {
    if (!pending && /^\s*import\s/.test(line)) {
      pending = true;
      depth = 0;
      let quote: string | null = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
          if (ch === '\\') i++;
          else if (ch === quote) quote = null;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
          quote = ch;
          continue;
        }
        if ('([{'.includes(ch)) depth++;
        else if (')]}'.includes(ch)) depth--;
      }
      if (depth <= 0) pending = false;
      continue;
    }
    if (pending) {
      // 跨行 import 的续行
      let quote: string | null = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
          if (ch === '\\') i++;
          else if (ch === quote) quote = null;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
          quote = ch;
          continue;
        }
        if ('([{'.includes(ch)) depth++;
        else if (')]}'.includes(ch)) depth--;
      }
      if (depth <= 0) pending = false;
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

/** 折叠 3 个以上连续空行为 2 个（剔除组件后遗留的空行） */
function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * 把 MDX 源码 body 降级为纯净 GFM。
 * `basePath`：源文件在仓库内的路径（相对 cwd），供 `<!-- @include -->`
 * 按包含方目录解析；缺省时不展开 include 注释（保持字面量）。
 * 幂等：对已降级的普通 markdown 再跑一遍不会有可观察变化。
 */
export function downlevelMarkdown(
  body: string,
  options: { basePath?: string } = {},
): string {
  const { masked, tokens } = maskFences(body);

  // include 展开（与 remark-includes 同款规则；缺失/非法保持字面量）
  let text = options.basePath
    ? expandMarkdownIncludes(masked, { baseDir: dirname(options.basePath) }).source
    : masked;

  // 马克笔 `==文本=={.v}` → `:cpd-mark[文本]`（内容不含方括号，正则安全）
  text = rewriteMarkerSyntax(text);
  // 隐秘文本显形（对 agent 抓取无保密意义）
  text = revealSpoilers(text);
  // 注释 → 脚注、abbr 字典剥离、:cpd-mark → 加粗
  text = downlevelInlineSyntax(text);
  text = stripImports(text);

  // GitHubCard（单卡）→ 列表项
  for (;;) {
    const el0 = findJsxElement(text, 'GitHubCard');
    if (!el0) break;
    const owner = extractStringAttr(el0.tagSource, 'owner');
    const repo = extractStringAttr(el0.tagSource, 'repo');
    const replacement = owner && repo ? repoLink(owner, repo) : '';
    text = text.slice(0, el0.start) + replacement + text.slice(el0.end);
  }

  // BilibiliCard（链接卡片）→ 视频页链接列表项
  for (;;) {
    const el0 = findJsxElement(text, 'BilibiliCard');
    if (!el0) break;
    const bvid = extractStringAttr(el0.tagSource, 'bvid');
    const replacement = bvid ? `- [Bilibili: ${bvid}](https://www.bilibili.com/video/${bvid})` : '';
    text = text.slice(0, el0.start) + replacement + text.slice(el0.end);
  }

  // BilibiliVideo / YouTubeVideo（视频 facade）→ 视频页链接列表项
  for (;;) {
    const el0 = findJsxElement(text, 'BilibiliVideo');
    if (!el0) break;
    const bvid = extractStringAttr(el0.tagSource, 'bvid');
    const p = extractStringAttr(el0.tagSource, 'p') ?? extractBraceAttr(el0.tagSource, 'p') ?? '1';
    const replacement =
      bvid && /^\d+$/u.test(p)
        ? `- [Bilibili: ${bvid}](https://www.bilibili.com/video/${bvid}?p=${p})`
        : '';
    text = text.slice(0, el0.start) + replacement + text.slice(el0.end);
  }
  for (;;) {
    const el0 = findJsxElement(text, 'YouTubeVideo');
    if (!el0) break;
    const id = extractStringAttr(el0.tagSource, 'id');
    const replacement = id ? `- [YouTube: ${id}](https://www.youtube.com/watch?v=${id})` : '';
    text = text.slice(0, el0.start) + replacement + text.slice(el0.end);
  }

  // Preview（交互演示）→ 整块剔除
  for (;;) {
    const el0 = findJsxElement(text, 'Preview');
    if (!el0) break;
    text = text.slice(0, el0.start) + text.slice(el0.end);
  }

  text = collapseBlankLines(text);

  // 还原围栏代码块
  for (const token of tokens) text = text.replace(token.placeholder, token.source);

  return text.trim() + '\n';
}
