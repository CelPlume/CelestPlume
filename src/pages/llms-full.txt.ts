import { getCollection } from 'astro:content';

/** 文档 id → 站内路由（index 收敛为目录根、去掉扩展名），与 sitemap 一致 */
function route(id: string): string {
  const clean = id.replace(/\.(md|mdx)$/i, '');
  const p = clean.replace(/\/index$/, '');
  return `/${p}/`;
}

/**
 * /llms-full.txt — 全站文档原文（EN + ZH）拼接，供 LLM/agent 一次性读取。
 */
export async function GET(context: { site: string | URL }) {
  const site = String(context.site).replace(/\/$/, '');
  const docs = await getCollection('docs');

  const out: string[] = [];
  out.push('# Celest Plume — Full Documentation');
  out.push('');
  out.push(`> Source: ${site}`);
  out.push('');

  for (const entry of docs) {
    out.push(`## ${entry.data.title}`);
    out.push('');
    out.push(`${site}${route(entry.id)}`);
    out.push('');
    out.push(entry.body ?? '');
    out.push('');
    out.push('---');
    out.push('');
  }

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
