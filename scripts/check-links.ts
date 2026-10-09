/**
 * bun run check:links —— 站内链接与标题层级门禁（借鉴 blume audit 形态：违规汇总 + exit 1）。
 *
 * 扫描 src/content/docs 下的 .md / .mdx，规则：
 *   dead-link          markdown 链接（行内 + 引用式）与图片目标中，
 *                      解析后不在路由全集内的站内地址
 *   heading-hierarchy  markdown 标题（#~######）出现跳级（如 h2 直接 h4）
 *
 * 路由全集（trailingSlash: always，路由均以 / 结尾；匹配允许尾斜杠差异）：
 *   内容：src/content/docs 每文件 → '/'+id（去扩展名、/index 收敛）+'/'，
 *         同时登记 .md 端点 '/'+id+'.md'（保留 index）
 *   页面：walk src/pages，排除 404.astro 与 [...].ts rest 动态路由；
 *         .astro → 目录型路由；文件名含 . 的端点（llms.txt.ts → /llms.txt、
 *         rss.xml.ts → /rss.xml）按文件名登记；命名动态段 [project] 按内容
 *         顶层目录展开（.well-known/skills/[project]/SKILL.md.ts）
 *
 * 提取链接前先掩码 frontmatter、围栏代码块与行内代码；行列号基于原文件。
 * 跳过：外链（任意 URI scheme / 协议相对 //）、纯锚点（#开头）。
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

interface RawLink {
  /** 目标起始偏移（原文件坐标） */
  offset: number;
  href: string;
}

interface Span {
  start: number;
  end: number;
}

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOCS_ROOT = join(REPO_ROOT, 'src', 'content', 'docs');
const PAGES_ROOT = join(REPO_ROOT, 'src', 'pages');

const FRONTMATTER_RE = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE_RE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
const INLINE_CODE_RE = /(`+)[\s\S]*?\1/g;
/** 引用式链接定义：[label]: target（尖括号目标单独捕获） */
const REFDEF_RE = /^ {0,3}\[([^\]\n]+)\]:[ \t]*(?:<([^>\n]*)>|([^\s]+))[^\n]*$/gm;
/** 行内链接/图片骨架：[label]( */
const INLINE_SKELETON_RE = /!?\[((?:\\.|[^\]\\[]|\[[^\]\n]*\])*)\]\(/g;
/** 全写/缩写引用：[text][label] / [text][] */
const FULL_REF_RE = /!?\[((?:\\.|[^\]\\[]|\[[^\]\n]*\])*)\]\[([^\]\n]*)\]/g;
/** 简写引用：[label]（后面不是 [ ( :） */
const SHORTCUT_RE = /\[([^\]\n]+)\](?![([:])/g;
const HEADING_RE = /^ {0,3}(#{1,6})(?:[ \t]+|$)/gm;
const PAGE_EXT_RE = /\.(astro|ts|js|mjs|jsx|mts|cts)$/;
const URI_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

const RULE_ORDER: ReadonlyArray<string> = ['dead-link', 'heading-hierarchy'];

// ─── 豁免掩码（等长替换，行列号不变） ─────────────────────────────────────────

function blankRange(chars: string[], start: number, end: number): void {
  for (let i = start; i < end && i < chars.length; i++) {
    if (chars[i] !== '\n') chars[i] = ' ';
  }
}

function blankMatches(text: string, re: RegExp): string {
  const chars = text.split('');
  for (const m of text.matchAll(re)) {
    blankRange(chars, m.index, m.index + m[0].length);
  }
  return chars.join('');
}

/** 掩码 frontmatter、围栏代码块、行内代码（链接提取与标题扫描共用） */
function maskExemptRegions(text: string): string {
  const chars = text.split('');

  const fm = FRONTMATTER_RE.exec(text);
  if (fm) blankRange(chars, fm.index, fm.index + fm[0].length);

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

  const masked = blankMatches(chars.join(''), INLINE_CODE_RE);
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

// ─── 路由全集 ────────────────────────────────────────────────────────────────

/** 内容路由：HTML 目录路由（/index 收敛）+ .md 端点（保留 index）；顺带收集 EN 顶层目录 */
function buildContentRoutes(root: string): { routes: Set<string>; topDirs: string[] } {
  const routes = new Set<string>();
  const topDirs = new Set<string>();
  for (const rel of collectMarkdown(root)) {
    const id = rel.replace(/\.(md|mdx)$/, '');
    const firstSeg = id.split('/')[0] ?? '';
    if (firstSeg !== '' && firstSeg !== 'zh') topDirs.add(firstSeg);
    const stripped = id === 'index' ? '' : id.replace(/\/index$/, '');
    routes.add(stripped === '' ? '/' : `/${stripped}/`);
    routes.add(`/${id}.md`);
  }
  return { routes, topDirs: [...topDirs].sort() };
}

function addPageFile(routes: Set<string>, segments: ReadonlyArray<string>, filename: string): void {
  const base = filename.replace(PAGE_EXT_RE, '');
  if (/^\[.+\]$/.test(base)) return; // 无法静态枚举的命名动态路由文件
  if (base.includes('.')) {
    // 端点：文件名自带扩展名（llms.txt.ts → /llms.txt、rss.xml.ts → /rss.xml、
    // index.json.ts → /.well-known/skills/index.json）
    routes.add(`/${[...segments, base].join('/')}`);
    return;
  }
  const segs = base === 'index' ? segments : [...segments, base];
  routes.add(segs.length === 0 ? '/' : `/${segs.join('/')}/`);
}

function buildPageRoutes(root: string, topDirs: ReadonlyArray<string>): Set<string> {
  const routes = new Set<string>();
  const visit = (dir: string, segments: ReadonlyArray<string>): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === '404.astro') continue; // 404 不作为可链接路由
      if (/^\[\.\.\..+\]$/.test(entry.name)) continue; // rest 动态路由（[...markdown].ts）
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        const param = /^\[([^\].]+)\]$/.test(entry.name);
        if (param) {
          // 命名动态段：按内容顶层目录枚举（.well-known/skills/[project]/）
          for (const top of topDirs) visit(full, [...segments, top]);
        } else {
          visit(full, [...segments, entry.name]);
        }
      } else if (entry.isFile() && PAGE_EXT_RE.test(entry.name)) {
        addPageFile(routes, segments, entry.name);
      }
    }
  };
  visit(root, []);
  return routes;
}

// ─── href 归一化与匹配 ───────────────────────────────────────────────────────

/** 折叠多余斜杠并解析 . / .. 段；绝对路径返回值不以 / 结尾（根为 /） */
function normalizePath(p: string): string {
  const isAbs = p.startsWith('/');
  const out: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (out.length > 0 && out[out.length - 1] !== '..') out.pop();
      else if (!isAbs) out.push('..');
      continue;
    }
    out.push(seg);
  }
  const joined = out.join('/');
  if (isAbs) return joined === '' ? '/' : `/${joined}`;
  return joined === '' ? '.' : joined;
}

/** 相对 href 按所在文档的 URL 目录解析；绝对 href 直接归一化 */
function resolveHref(pathOnly: string, fileRel: string): string {
  if (pathOnly.startsWith('/')) return normalizePath(pathOnly);
  const dir = fileRel.includes('/')
    ? fileRel.slice(0, fileRel.lastIndexOf('/'))
    : '';
  return normalizePath(`/${dir}/${pathOnly}`);
}

/** 路由匹配，允许尾斜杠差异 */
function routeExists(routes: ReadonlySet<string>, p: string): boolean {
  if (routes.has(p)) return true;
  if (p.endsWith('/')) return routes.has(p.slice(0, -1));
  return routes.has(`${p}/`);
}

function isExternal(href: string): boolean {
  return URI_SCHEME_RE.test(href) || href.startsWith('//');
}

// ─── 链接提取 ────────────────────────────────────────────────────────────────

function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

function inRanges(spans: ReadonlyArray<Span>, pos: number): boolean {
  return spans.some((s) => pos >= s.start && pos < s.end);
}

/**
 * 解析行内链接目标：[text](  <target> | target  "title"|'title'|(title)  )。
 * 入参 openParen 指向 '('；支持 URL 中成对括号。失败返回 null。
 */
function readInlineTarget(
  text: string,
  openParen: number,
): { href: string; end: number } | null {
  let i = openParen + 1;
  const isSpace = (c: string | undefined): boolean => c === ' ' || c === '\t' || c === '\n';
  while (i < text.length && isSpace(text[i])) i++;

  let href = '';
  if (text[i] === '<') {
    i++;
    while (i < text.length && text[i] !== '>') {
      if (text[i] === '\n') return null;
      href += text[i];
      i++;
    }
    if (i >= text.length) return null;
    i++;
  } else {
    let depth = 0;
    while (i < text.length) {
      const c = text[i] ?? '';
      if (c === '\\' && i + 1 < text.length) {
        href += c + (text[i + 1] ?? '');
        i += 2;
        continue;
      }
      if (depth === 0 && isSpace(c)) break;
      if (c === '(') depth++;
      else if (c === ')') {
        if (depth === 0) break;
        depth--;
      }
      href += c;
      i++;
    }
  }

  // 可选标题 + 收尾 ')'
  while (i < text.length && isSpace(text[i])) i++;
  const quote = text[i];
  if (quote === '"' || quote === "'" || quote === '(') {
    const close = quote === '(' ? ')' : quote;
    i++;
    while (i < text.length && text[i] !== close) {
      if (text[i] === '\n') return null;
      i++;
    }
    if (i >= text.length) return null;
    i++;
    while (i < text.length && isSpace(text[i])) i++;
  }
  if (text[i] !== ')') return null;
  return { href, end: i + 1 };
}

/** 从掩码后的文本提取全部链接（行内 + 引用式）与图片目标 */
function extractLinks(text: string, masked: string): RawLink[] {
  const links: RawLink[] = [];
  const spans: Span[] = [];

  // 1) 引用式定义 [label]: target
  const refdefs = new Map<string, string>();
  for (const m of masked.matchAll(REFDEF_RE)) {
    const label = normalizeLabel(m[1] ?? '');
    const target = (m[2] ?? m[3] ?? '').trim();
    if (label !== '' && target !== '' && !label.startsWith('^')) {
      refdefs.set(label, target);
    }
    spans.push({ start: m.index, end: m.index + m[0].length });
  }

  // 2) 行内链接/图片 [text](target "title")
  for (const m of masked.matchAll(INLINE_SKELETON_RE)) {
    const openParen = m.index + m[0].length - 1;
    const parsed = readInlineTarget(text, openParen);
    if (!parsed) continue;
    spans.push({ start: m.index, end: parsed.end });
    if (parsed.href.trim() !== '') {
      links.push({ offset: openParen + 1, href: parsed.href });
    }
  }

  // 3) 全写/缩写引用 [text][label] / [text][]
  for (const m of masked.matchAll(FULL_REF_RE)) {
    const inlineLabel = m[2] ?? '';
    const label = normalizeLabel(inlineLabel !== '' ? inlineLabel : (m[1] ?? ''));
    spans.push({ start: m.index, end: m.index + m[0].length });
    const target = refdefs.get(label);
    if (target !== undefined && target !== '') {
      links.push({ offset: m.index, href: target });
    }
  }

  // 4) 简写引用 [label]（仅当定义存在；排除脚注 [^x] 与已匹配区间）
  for (const m of masked.matchAll(SHORTCUT_RE)) {
    if (inRanges(spans, m.index)) continue;
    const label = normalizeLabel(m[1] ?? '');
    if (label === '' || label.startsWith('^')) continue;
    const target = refdefs.get(label);
    if (target === undefined || target === '') continue;
    links.push({ offset: m.index, href: target });
  }

  return links;
}

// ─── 规则检查 ────────────────────────────────────────────────────────────────

function checkDeadLinks(
  file: string,
  links: ReadonlyArray<RawLink>,
  routes: ReadonlySet<string>,
  starts: number[],
  push: (v: Violation) => void,
): void {
  for (const link of links) {
    const { href } = link;
    if (href === '' || href.startsWith('#')) continue; // 空目标 / 纯锚点
    if (isExternal(href)) continue; // 外链
    const pathOnly = href.split('#')[0] ?? '';
    if (pathOnly === '') continue; // 剥离 hash 后只剩锚点
    const resolved = resolveHref(pathOnly, file);
    if (routeExists(routes, resolved)) continue;
    const { line, col } = locate(starts, link.offset);
    push({
      file,
      line,
      col,
      rule: 'dead-link',
      message: `死链 "${href}"（解析为 ${resolved}，不在路由全集）`,
    });
  }
}

function checkHeadings(
  file: string,
  masked: string,
  starts: number[],
  push: (v: Violation) => void,
): void {
  let prev: number | null = null; // 首个标题不限制层级
  for (const m of masked.matchAll(HEADING_RE)) {
    const level = (m[1] ?? '#').length;
    if (prev !== null && level > prev + 1) {
      const hashOffset = m.index + (m[0].indexOf('#') || 0);
      const { line, col } = locate(starts, hashOffset);
      push({
        file,
        line,
        col,
        rule: 'heading-hierarchy',
        message: `标题跳级：h${prev} 后出现 h${level}`,
      });
    }
    prev = level;
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
  const content = buildContentRoutes(DOCS_ROOT);
  const routes = content.routes;
  for (const route of buildPageRoutes(PAGES_ROOT, content.topDirs)) routes.add(route);

  const violations: Violation[] = [];
  const push = (v: Violation): void => {
    violations.push(v);
  };

  for (const rel of files) {
    const text = readFileSync(join(DOCS_ROOT, rel), 'utf8');
    const starts = lineStartsOf(text);
    const masked = maskExemptRegions(text);

    checkDeadLinks(rel, extractLinks(text, masked), routes, starts, push);
    checkHeadings(rel, masked, starts, push);
  }

  printReport(violations, files.length, 'check:links');
}

main();
