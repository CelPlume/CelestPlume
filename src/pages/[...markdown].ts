import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { downlevelMarkdown } from '../lib/agent/downlevel';

/**
 * 每篇文档的 Markdown 端点：`/<path>.md`。
 * 路径与内容集合 id 一一对应（保留 `index`，如 `/chronosync/index.md`），
 * 供 LLM/agent 直接取干净的 GFM 原文，绕过 HTML 渲染。
 * MDX 文档的 body 经 downlevel 降级：剥离 import、剔除 <Preview> 演示、
 * <GitHubCard(s)> 转为仓库链接列表、写作语法降级（见 src/lib/agent/downlevel.ts）。
 * 页面级加密的文档（frontmatter `encrypted` + `password`）整篇脱敏：
 * 只输出提示，绝不让正文明文经本端点泄露。
 */

/** 内容集合 id → .md 端点路径（仅去扩展名） */
function mdPath(id: string): string {
  return `${id.replace(/\.(md|mdx)$/i, '')}.md`;
}

const ENCRYPTED_NOTE_EN =
  '> This page is password-protected. The full content is encrypted at build time; open the web page and enter the password to read it.';
const ENCRYPTED_NOTE_ZH =
  '> 本页受密码保护。正文已在构建期加密，请访问网页端输入密码查看，密文不会经 Markdown 端点泄露。';

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  return docs.map((entry) => {
    const encrypted = entry.data.encrypted === true && !!entry.data.password?.trim();
    const body = encrypted
      ? (entry.id.startsWith('zh/') ? ENCRYPTED_NOTE_ZH : ENCRYPTED_NOTE_EN)
      : downlevelMarkdown(entry.body ?? '', {
          basePath: `src/content/docs/${entry.id}`,
        });
    return {
      params: { markdown: mdPath(entry.id) },
      props: {
        title: entry.data.title,
        description: entry.data.description ?? '',
        body,
      },
    };
  });
}

export const GET: APIRoute = ({ props }) => {
  const { title, description, body } = props as {
    title: string;
    description: string;
    body: string;
  };
  const out = ['---', `title: ${title}`, description ? `description: ${description}` : null, '---', '', body]
    .filter((line) => line !== null)
    .join('\n');
  return new Response(out, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
