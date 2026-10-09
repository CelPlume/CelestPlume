import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

/**
 * /.well-known/skills/index.json — Agent Skills 发现协议索引
 * （Cloudflare Agent Skills Discovery，扩展 RFC 8615；参考 Docus 的
 * nuxt-agent-discovery 产出形态）。每个顶层项目一个技能，
 * SKILL.md 端点见 ../[project]/SKILL.md.ts。
 */

/** 顶层项目元数据（key = 内容集合首段目录） */
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

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');

  // 顶层目录 → 技能（排除 zh 镜像；zh 文档经对应 EN 技能的 SKILL.md 一并列出）
  const docCount: Record<string, number> = {};
  for (const entry of docs) {
    const top = entry.id.split('/')[0];
    if (top === 'zh') continue;
    docCount[top] = (docCount[top] ?? 0) + 1;
  }

  const skills = Object.entries(docCount).map(([name]) => ({
    name,
    description: (PROJECT_META[name] ?? { description: `Documentation section "${name}".` })
      .description,
    files: ['SKILL.md'],
  }));

  return new Response(JSON.stringify({ skills }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
