import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';

// Astro 6+ 移除 legacy collections：docs 集合需显式 glob loader。
// 默认 generateId = 相对路径去扩展名（保留 index，如 chronosync/index），
// 与 [...markdown].ts / sitemap / llms.txt 的路由约定一致。
export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/docs' }),
    schema: docsSchema(),
  }),
};
