import { getCollection } from 'astro:content';
import { downlevelMarkdown } from '../lib/agent/downlevel';

/** 文档 id → 站内路由（index 收敛为目录根、去掉扩展名），与 sitemap 一致 */
function route(id: string): string {
  const clean = id.replace(/\.(md|mdx)$/i, '');
  const p = clean.replace(/\/index$/, '');
  return `/${p}/`;
}

/**
 * /llms-full.txt — 全站文档全文（EN + ZH）拼接，供 LLM/agent 一次性读取。
 * body 经 downlevel 降级为纯净 GFM（剥 import、剔 <Preview>、GitHubCard → 链接、
 * 写作语法降级）。页面级加密的文档整篇脱敏为提示行，正文密文不进本端点。
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
    const encrypted = entry.data.encrypted === true && !!entry.data.password?.trim();
    const body = encrypted
      ? (entry.id.startsWith('zh/')
          ? '> 本页受密码保护。正文已在构建期加密，请访问网页端输入密码查看。'
          : '> This page is password-protected; open the web page and enter the password to read it.')
      : downlevelMarkdown(entry.body ?? '', {
          basePath: `src/content/docs/${entry.id}`,
        });
    out.push(`## ${entry.data.title}`);
    out.push('');
    out.push(`${site}${route(entry.id)}`);
    out.push('');
    out.push(body);
    out.push('');
    out.push('---');
    out.push('');
  }

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
