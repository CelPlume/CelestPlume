import { getCollection } from 'astro:content';

/** 文档 id → 站内路由（index 收敛为目录根、去掉扩展名），与 sitemap 一致 */
function route(id: string): string {
  const clean = id.replace(/\.(md|mdx)$/i, '');
  const p = clean.replace(/\/index$/, '');
  return `/${p}/`;
}

const SECTION_NAME: Record<string, string> = {
  guides: 'Guides',
  chronosync: 'ChronoSync',
  'bookmark-harbor': 'BookmarkHarbor',
  contribution: 'Contribution',
};

/**
 * /llms.txt — 面向 LLM/agent 的站点总览（llmstxt.org 规范 v2）。
 * H1 + blockquote 摘要 + 按节的「文件列表」，链接指向可读文档页。
 */
export async function GET(context: { site: string | URL }) {
  const site = String(context.site).replace(/\/$/, '');
  const docs = await getCollection('docs');

  const groups = new Map<string, { title: string; url: string; desc?: string }[]>();
  for (const entry of docs) {
    if (entry.id.startsWith('zh/')) continue; // 中文归入独立一节
    const seg = entry.id.split('/')[0];
    if (!groups.has(seg)) groups.set(seg, []);
    groups.get(seg)!.push({
      title: entry.data.title,
      url: `${site}${route(entry.id)}`,
      desc: entry.data.description,
    });
  }

  const zh = docs.filter((d) => d.id.startsWith('zh/'));

  const out: string[] = [];
  out.push('# Celest Plume');
  out.push('');
  out.push(
    '> Bilingual documentation portal (English at root, 简体中文 under /zh/) and open-source project hub, covering ChronoSync (时序同笺), BookmarkHarbor and more — user guides, dev/deploy docs and contribution specs.',
  );
  out.push('');
  out.push('## Format notes');
  out.push('');
  out.push('- This site is bilingual: English on the root paths, Simplified Chinese under `/zh/`.');
  out.push(
    '- `/llms.txt` is the curated overview; the full text of every page is in `/llms-full.txt`.',
  );
  out.push('- Pages are static HTML; each entry below links to its human-readable page.');
  out.push('');

  for (const [seg, items] of groups) {
    out.push(`## ${SECTION_NAME[seg] ?? seg}`);
    out.push('');
    for (const it of items) {
      out.push(`- [${it.title}](${it.url})${it.desc ? `: ${it.desc}` : ''}`);
    }
    out.push('');
  }

  if (zh.length) {
    out.push('## 中文文档 / Chinese');
    out.push('');
    for (const it of zh) {
      out.push(
        `- [${it.data.title}](${site}${route(it.id)})${it.data.description ? `: ${it.data.description}` : ''}`,
      );
    }
    out.push('');
  }

  out.push('## Optional');
  out.push('');
  out.push('- [GitHub repository](https://github.com/CelPlume/CelestPlume): source code and issues');
  out.push('');

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
