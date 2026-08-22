import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

/**
 * 每篇文档的原始 Markdown 端点：`/<path>.md`。
 * 路径与内容集合 id 一一对应（保留 `index`，如 `/chronosync/index.md`），
 * 供 LLM/agent 直接取原文，绕过 HTML 渲染。
 * MDX 文档的 body 含 `import` 行与 JSX 组件标签，属原始源码的一部分。
 */

/** 内容集合 id → .md 端点路径（仅去扩展名） */
function mdPath(id: string): string {
  return `${id.replace(/\.(md|mdx)$/i, '')}.md`;
}

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  return docs.map((entry) => ({
    params: { markdown: mdPath(entry.id) },
    props: {
      title: entry.data.title,
      description: entry.data.description ?? '',
      body: entry.body ?? '',
    },
  }));
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
