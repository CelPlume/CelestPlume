import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

/**
 * /.well-known/skills/<project>/SKILL.md — Agent Skills 发现协议的技能文件
 * （YAML frontmatter + markdown，agentskills.io 规范）。
 * 正文 = 项目简介 + 该项目全部文档的 HTML 路由与对应 .md 端点清单。
 * 索引见 ../index.json.ts。
 */

/** 顶层项目简介（key = 内容集合首段目录） */
const PROJECT_META: Record<string, { description: string }> = {
  guides: {
    description: 'Getting-started guides for the Celest Plume documentation portal.',
  },
  chronosync: {
    description:
      'ChronoSync (时序同笺) documentation: about, user tutorials, deployment and legal pages.',
  },
  'bookmark-harbor': {
    description:
      'BookmarkHarbor (书签浏览器) documentation: about, development and frontend guides.',
  },
  picumet: {
    description: 'Picumet documentation: about, API reference, development and frontend guides.',
  },
  contribution: {
    description:
      'Contribution guides: design system, styles and component docs of the Plumest Docs Kit.',
  },
};

/** 文档 id → 站内路由（index 收敛为目录根、去掉扩展名），与 sitemap 一致 */
function route(id: string): string {
  const clean = id.replace(/\.(md|mdx)$/i, '');
  const p = clean.replace(/\/index$/, '');
  return `/${p}/`;
}

/** 文档 id → .md 端点 URL 路径（保留 `index`，与 [...markdown].ts 的 mdPath 一致；带前导斜杠） */
function mdPath(id: string): string {
  return `/${id.replace(/\.(md|mdx)$/i, '')}.md`;
}

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  const byProject: Record<string, { title: string; id: string }[]> = {};

  for (const entry of docs) {
    const top = entry.id.split('/')[0];
    if (top === 'zh') continue;
    (byProject[top] ??= []).push({ title: entry.data.title, id: entry.id });
  }

  return Object.entries(byProject).map(([project, entries]) => ({
    params: { project },
    props: {
      project,
      description:
        (PROJECT_META[project] ?? { description: `Documentation section "${project}".` })
          .description,
      entries,
    },
  }));
}

export const GET: APIRoute = ({ props, site }) => {
  const { project, description, entries } = props as {
    project: string;
    description: string;
    entries: { title: string; id: string }[];
  };
  const base = String(site).replace(/\/$/, '');

  const lines = [
    '---',
    `name: ${project}`,
    `description: ${description}`,
    '---',
    '',
    description,
    '',
    '## Documentation',
    '',
    ...entries.map(
      (entry) =>
        `- [${entry.title}](${base}${route(entry.id)}): markdown at ${base}${mdPath(entry.id)}`,
    ),
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
