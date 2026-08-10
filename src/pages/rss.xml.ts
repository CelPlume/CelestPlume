import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { stat } from 'node:fs/promises';

/**
 * 站点 RSS（/rss.xml）：聚合全部文档页（EN + ZH），供 Google 等内容源抓取发现。
 * 文档页无显式发布日期，故以源文件 mtime 作为 pubDate。
 */
export async function GET(context: { site: string | URL }) {
  const docs = await getCollection('docs');

  const items = await Promise.all(
    docs.map(async (entry) => {
      let pubDate = new Date();
      if (entry.filePath) {
        try {
          const s = await stat(entry.filePath);
          pubDate = s.mtime;
        } catch {
          /* 取不到 mtime 时退回当前时间 */
        }
      }
      return {
        title: entry.data.title,
        description: entry.data.description,
        // entry.id 可能带 .md/.mdx 扩展名，路由不含扩展
        link: `/${entry.id.replace(/\.(md|mdx)$/i, '')}/`,
        pubDate,
      };
    }),
  );

  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Celest Plume — Documentation Feed',
    description:
      'Casting scales of old, spread wings to realms untold. 天空之翼 — 双语文档与项目更新。',
    site: context.site,
    items,
  });
}
