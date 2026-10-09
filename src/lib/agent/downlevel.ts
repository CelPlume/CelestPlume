/**
 * Agent 端点 Markdown 结构化降级（Downlevel）
 *
 * 服务端把 MDX 源码降级为纯净 GFM，供 `/<id>.md` 端点与 `/llms-full.txt`
 * 消费（Coding Agent / LLM 抓取时不再被 import 语句与自定义 JSX 干扰）。
 *
 * 转换规则（与本项目内容实际用到的组件对齐）：
 * - `import ...` 语句：剥离（ESM 是页面代码，不是内容）
 * - `<GitHubCard owner repo>`：转为 `[owner/repo](https://github.com/owner/repo)` 列表项
 * - `<GitHubCards items={[...]}>`：每个仓库一个列表项（`layout` 等展示属性丢弃）
 * - `<Preview ...>...</Preview>`：整块剔除（交互演示 HTML 对 agent 无意义）
 * - 围栏代码块（``` /~~~）原样保留，任何转换都不进入其内部
 *
 * 已知限制：属性解析面向本项目内容形态（字符串属性与对象字面量数组），
 * 不做通用 MDX 语法树解析；未识别的 JSX 标签原样保留，宁多勿缺。
 */

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

/** 从对象字面量数组文本中逐个提取 `{ ... }` 分组 */
function extractObjectGroups(arrayText: string): string[] {
  const groups: string[] = [];
  let i = 0;
  for (;;) {
    const open = arrayText.indexOf('{', i);
    if (open === -1) break;
    const close = matchBracket(arrayText, open, '{', '}');
    if (close === -1) break;
    groups.push(arrayText.slice(open + 1, close));
    i = close + 1;
  }
  return groups;
}

/** GitHubCards 的 items 数组 → 仓库对列表 */
function extractRepoPairs(itemsText: string): { owner: string; repo: string }[] {
  return extractObjectGroups(itemsText)
    .map((group) => ({
      owner: /owner\s*:\s*['"]([^'"]+)['"]/.exec(group)?.[1] ?? '',
      repo: /repo\s*:\s*['"]([^'"]+)['"]/.exec(group)?.[1] ?? '',
    }))
    .filter((pair) => pair.owner && pair.repo);
}

const repoLink = (owner: string, repo: string): string =>
  `- [${owner}/${repo}](https://github.com/${owner}/${repo})`;

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
 * 幂等：对已降级的普通 markdown 再跑一遍不会有可观察变化。
 */
export function downlevelMarkdown(body: string): string {
  const { masked, tokens } = maskFences(body);
  let text = stripImports(masked);

  // GitHubCard（单卡）→ 列表项
  for (;;) {
    const el0 = findJsxElement(text, 'GitHubCard');
    if (!el0) break;
    const owner = extractStringAttr(el0.tagSource, 'owner');
    const repo = extractStringAttr(el0.tagSource, 'repo');
    const replacement = owner && repo ? repoLink(owner, repo) : '';
    text = text.slice(0, el0.start) + replacement + text.slice(el0.end);
  }

  // GitHubCards（多卡）→ 每仓一个列表项
  for (;;) {
    const el0 = findJsxElement(text, 'GitHubCards');
    if (!el0) break;
    const items = extractBraceAttr(el0.tagSource, 'items');
    const replacement = items
      ? extractRepoPairs(items)
          .map(({ owner, repo }) => repoLink(owner, repo))
          .join('\n')
      : '';
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
