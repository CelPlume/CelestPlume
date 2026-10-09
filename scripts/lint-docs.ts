/**
 * bun run lint:docs —— 文档内容门禁（借鉴 blume audit 形态：违规汇总 + exit 1）。
 *
 * 扫描 src/content/docs 下的 .md / .mdx，规则：
 *   term-casing        专有名词大小写（中英文档均检查，命中错误形态即报）
 *   zh-halfwidth-punct /zh/ 文档散文中的半角标点（, ; : ? ! 应为全角，；：？！）
 *   en-cjk             非 /zh/ 文档混入 CJK 字符（含全角标点）
 *
 * 豁免引擎：先掩码 frontmatter、围栏代码块（```/~~~）、行内代码（含多反引号）、
 * 链接目标 ](…) 与引用式链接定义行，再逐规则扫描；掩码按等长替换，
 * 报告的行列号始终基于原文件。
 * zh-halfwidth-punct 额外豁免 HTML 标签/属性与 GFM 表格分隔行（对齐冒号是语法）。
 *
 * 退出码：有违规 = 1，否则 0。
 */
import { readdirSync, readFileSync, type Dirent } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Violation {
  file: string;
  line: number;
  col: number;
  rule: string;
  message: string;
}

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOCS_ROOT = join(REPO_ROOT, 'src', 'content', 'docs');

/** 专有名词词典：小写/错误形态（键）→ 期望形态（值） */
const TERM_DICT: ReadonlyArray<readonly [lower: string, expected: string]> = [
  ['github', 'GitHub'],
  ['typescript', 'TypeScript'],
  ['javascript', 'JavaScript'],
  ['astro', 'Astro'],
  ['starlight', 'Starlight'],
  ['chronosync', 'ChronoSync'],
  ['sdunuchronosync', 'SDNUChronoSync'],
  ['bookmarkharbor', 'BookmarkHarbor'],
  ['picumet', 'Picumet'],
  ['plumest', 'Plumest'],
  ['celplume', 'CelPlume'],
  ['celestplume', 'CelestPlume'],
];

const TERM_REGEXPS: ReadonlyArray<RegExp> = TERM_DICT.map(
  ([lower]) => new RegExp(`\\b${lower}\\b`, 'gi'),
);

/** 半角 → 全角 对照 */
const HALFWIDTH_TO_FULLWIDTH: Readonly<Record<string, string>> = {
  ',': '，',
  ';': '；',
  ':': '：',
  '?': '？',
  '!': '！',
};
const HALFWIDTH_RE = /[,;:?!]/g;

/** CJK：汉字/假名/谚文 + CJK 符号与标点（U+3000-303F）+ 全角/半角形式（含全角标点） */
const CJK_RE =
  /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}|[\u3000-\u303F\uFF00-\uFFEF]/gu;

const FRONTMATTER_RE = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE_RE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
const INLINE_CODE_RE = /(`+)[\s\S]*?\1/g;
const LINK_TARGET_RE = /\]\([^)\n]*\)/g;
const REFDEF_LINE_RE = /^ {0,3}\[[^\]\n]+\]:[^\n]*/gm;
/** GFM 表格分隔行（如 `| :--- | :--- |`）——对齐冒号属语法，不算散文标点 */
const TABLE_DELIM_RE = /^[ \t]*\|?(?:[ \t]*:?-+:?[ \t]*\|)*[ \t]*:?-+:?[ \t]*\|?[ \t]*$/;

const RULE_ORDER: ReadonlyArray<string> = ['term-casing', 'zh-halfwidth-punct', 'en-cjk'];

// ─── 豁免引擎 ────────────────────────────────────────────────────────────────

/** 把 [start, end) 内的字符（保留换行）替换为空格，保证等长、行列号不变 */
function blankRange(chars: string[], start: number, end: number): void {
  for (let i = start; i < end && i < chars.length; i++) {
    if (chars[i] !== '\n') chars[i] = ' ';
  }
}

/** 用正则批量掩码命中区间 */
function blankMatches(text: string, re: RegExp): string {
  const chars = text.split('');
  for (const m of text.matchAll(re)) {
    blankRange(chars, m.index, m.index + m[0].length);
  }
  return chars.join('');
}

const HTML_TAG_START_RE = /[A-Za-z/!]/;
const MDX_MODULE_LINE_RE = /^(?:import|export)\b[^\n]*/gm;

/**
 * 掩码写作语法的指令构造（remark-directive / Plume 兼容语法，非散文）：
 * - 文本/叶子指令 `:name[label]{attrs}` / `::name{attrs}`（可出现在句中）
 * - 缩写字典行 `*[术语]: 释义`（整行）
 * 指令名与属性是语法构造而非文案，词法与标点规则均不适用。
 */
const DIRECTIVE_CONSTRUCT_RE = /:{1,3}[A-Za-z][A-Za-z0-9-]*(?:\[[^\]\n]*\])?(?:\{[^}\n]*\})?/g;
const ABBR_DEFINITION_CONSTRUCT_RE = /^\s*\*\[[^\]\n]+\]:[^\n]*$/gm;

function maskDirectiveConstructs(text: string): string {
  return blankMatches(blankMatches(text, DIRECTIVE_CONSTRUCT_RE), ABBR_DEFINITION_CONSTRUCT_RE);
}

/**
 * 掩码 HTML/JSX 标签（可跨行）：从 `<tag` 到配对 `>`；
 * 引号与 {} 表达式内的 `>` 不视为标签结尾（支持 html={[...]} 多行属性）。
 * 未闭合时放弃该起点继续扫描。注释 <!-- … --> 同样覆盖。
 */
function maskHtmlTags(text: string): string {
  const chars = text.split('');
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '<' || !HTML_TAG_START_RE.test(text[i + 1] ?? '')) {
      i++;
      continue;
    }
    const start = i;
    i++;
    let quote: string | null = null;
    let braceDepth = 0;
    let end = -1;
    while (i < text.length) {
      const c = text[i] ?? '';
      if (quote !== null) {
        if (c === '\\') {
          i += 2;
          continue;
        }
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '{') {
        braceDepth++;
      } else if (c === '}') {
        braceDepth--;
      } else if (c === '>' && braceDepth <= 0) {
        end = i;
        break;
      }
      i++;
    }
    if (end < 0) {
      i = start + 1; // 未闭合：回退一格继续找下一个 <
    } else {
      blankRange(chars, start, end + 1);
      i = end + 1;
    }
  }
  return chars.join('');
}

/**
 * 返回与原文等长的掩码串：frontmatter、围栏代码块、行内代码、
 * 链接目标 ](…)、引用式定义行、MDX import/export 语句行被替换为空格。
 * alsoHtml = true 时额外掩码 HTML/JSX 标签/属性（zh-halfwidth-punct 用）。
 */
function maskExemptRegions(text: string, alsoHtml = false): string {
  const chars = text.split('');

  // 1) frontmatter（开头的 --- 块）
  const fm = FRONTMATTER_RE.exec(text);
  if (fm) blankRange(chars, fm.index, fm.index + fm[0].length);

  // 2) 围栏代码块（``` 或 ~~~，含围栏行本身与 info string）
  let fence: { ch: string; len: number } | null = null;
  let offset = 0;
  for (const line of text.split('\n')) {
    const active = fence;
    const close = active !== null ? FENCE_CLOSE_RE.exec(line) : null;
    if (active !== null) blankRange(chars, offset, offset + line.length);
    if (
      active !== null &&
      close !== null &&
      close[1] !== undefined &&
      close[1][0] === active.ch &&
      close[1].length >= active.len
    ) {
      fence = null;
    } else if (active === null) {
      const open = FENCE_OPEN_RE.exec(line);
      if (open && open[1] !== undefined) {
        blankRange(chars, offset, offset + line.length);
        fence = { ch: open[1][0] ?? '`', len: open[1].length };
      }
    }
    offset += line.length + 1;
  }

  let masked = chars.join('');

  // 3) 行内代码 span（含多反引号），连同反引号一起掩码
  masked = blankMatches(masked, INLINE_CODE_RE);

  // 4) 链接/图片目标 ](…)（含标题）
  masked = blankMatches(masked, LINK_TARGET_RE);

  // 5) 引用式链接定义行（[label]: target 整行非散文）
  masked = blankMatches(masked, REFDEF_LINE_RE);

  // 5b) 写作语法指令构造（:name[..]{..} / ::name{..} / *[术语]: 释义）
  masked = maskDirectiveConstructs(masked);

  // 6) MDX import/export 语句行（模块路径与代码，非散文；如 '…Preview.astro'）
  masked = blankMatches(masked, MDX_MODULE_LINE_RE);

  // 7)（可选）HTML/JSX 标签/属性（可跨行）
  if (alsoHtml) masked = maskHtmlTags(masked);

  return masked;
}

// ─── 行列号 ──────────────────────────────────────────────────────────────────

function lineStartsOf(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

/** 基于行首偏移表，把字符偏移换算为 { line, col }（均从 1 起） */
function locate(starts: number[], offset: number): { line: number; col: number } {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((starts[mid] ?? 0) <= offset) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, col: offset - (starts[lo] ?? 0) + 1 };
}

// ─── 文件遍历 ────────────────────────────────────────────────────────────────

function collectMarkdown(root: string): string[] {
  const out: string[] = [];
  const visit = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        out.push(relative(root, full).split(sep).join('/'));
      }
    }
  };
  visit(root);
  return out.sort();
}

// ─── 规则扫描 ────────────────────────────────────────────────────────────────

function checkTerms(
  file: string,
  text: string,
  masked: string,
  starts: number[],
  push: (v: Violation) => void,
): void {
  for (let i = 0; i < TERM_REGEXPS.length; i++) {
    const re = TERM_REGEXPS[i];
    const expected = TERM_DICT[i]?.[1];
    if (!re || expected === undefined) continue;
    for (const m of masked.matchAll(re)) {
      const actual = text.slice(m.index, m.index + m[0].length);
      if (actual === expected) continue; // 已是正确形态
      const { line, col } = locate(starts, m.index);
      push({ file, line, col, rule: 'term-casing', message: `"${actual}" 应为 "${expected}"` });
    }
  }
}

function checkZhHalfwidth(
  file: string,
  text: string,
  masked: string,
  starts: number[],
  push: (v: Violation) => void,
): void {
  let offset = 0;
  for (const line of masked.split('\n')) {
    const originalLine = text.slice(offset, offset + line.length);
    if (!TABLE_DELIM_RE.test(originalLine)) {
      for (const m of line.matchAll(HALFWIDTH_RE)) {
        const ch = originalLine[m.index] ?? '';
        // 数字分隔符豁免：千分位逗号（1,024）与时间/比率冒号（12:30）保留半角
        const prev = line[m.index - 1] ?? '';
        const next = line[m.index + 1] ?? '';
        if ((ch === ',' || ch === ':') && /\d/.test(prev) && /\d/.test(next)) continue;
        // markdown 图片语法豁免：![alt](src) 的 ! 是语法前缀，不是感叹号
        if (ch === '!' && next === '[') continue;
        const full = HALFWIDTH_TO_FULLWIDTH[ch] ?? ch;
        const { line: ln, col } = locate(starts, offset + m.index);
        push({
          file,
          line: ln,
          col,
          rule: 'zh-halfwidth-punct',
          message: `半角 "${ch}" 应为全角 "${full}"`,
        });
      }
    }
    offset += line.length + 1;
  }
}

function checkEnCjk(
  file: string,
  text: string,
  masked: string,
  starts: number[],
  push: (v: Violation) => void,
): void {
  let offset = 0;
  for (const line of masked.split('\n')) {
    let first = -1;
    let count = 0;
    for (const m of line.matchAll(CJK_RE)) {
      if (first < 0) first = m.index;
      count++;
    }
    if (count > 0 && first >= 0) {
      const { line: ln, col } = locate(starts, offset + first);
      push({
        file,
        line: ln,
        col,
        rule: 'en-cjk',
        message: `出现 CJK 字符 "${text.charAt(offset + first)}"（本行共 ${count} 处）`,
      });
    }
    offset += line.length + 1;
  }
}

// ─── 汇总输出 ────────────────────────────────────────────────────────────────

function printReport(violations: Violation[], scannedCount: number, scriptName: string): void {
  if (violations.length === 0) {
    console.log(`✓ ${scriptName} 通过：扫描 ${scannedCount} 个文件，无违规`);
    return;
  }

  const sorted = [...violations].sort((a, b) =>
    a.file !== b.file ? (a.file < b.file ? -1 : 1) : a.line - b.line || a.col - b.col,
  );

  let currentFile = '';
  for (const v of sorted) {
    if (v.file !== currentFile) {
      if (currentFile !== '') console.log('');
      currentFile = v.file;
    }
    console.log(`${v.file}:${v.line}:${v.col} [${v.rule}] ${v.message}`);
  }

  const byRule = new Map<string, number>();
  const offenderFiles = new Set<string>();
  for (const v of violations) {
    byRule.set(v.rule, (byRule.get(v.rule) ?? 0) + 1);
    offenderFiles.add(v.file);
  }
  const parts = RULE_ORDER.filter((r) => byRule.has(r)).map((r) => `${r}: ${byRule.get(r) ?? 0}`);
  console.log(
    `\n✗ ${violations.length} 个违规（${parts.join('，')}），涉及 ${offenderFiles.size}/${scannedCount} 个文件`,
  );
  process.exitCode = 1;
}

// ─── 入口 ────────────────────────────────────────────────────────────────────

function main(): void {
  const files = collectMarkdown(DOCS_ROOT);
  const violations: Violation[] = [];
  const push = (v: Violation): void => {
    violations.push(v);
  };

  for (const rel of files) {
    const text = readFileSync(join(DOCS_ROOT, rel), 'utf8');
    const starts = lineStartsOf(text);
    const masked = maskExemptRegions(text);

    checkTerms(rel, text, masked, starts, push);

    if (rel === 'zh' || rel.startsWith('zh/') || rel.includes('/zh/')) {
      // zh 规则额外豁免 HTML 标签/属性
      checkZhHalfwidth(rel, text, maskExemptRegions(text, true), starts, push);
    } else {
      checkEnCjk(rel, text, masked, starts, push);
    }
  }

  printReport(violations, files.length, 'lint:docs');
}

main();
