import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { z } from 'astro:content';

// Astro 6+ 移除 legacy collections：docs 集合需显式 glob loader。
// 默认 generateId = 相对路径去扩展名（保留 index，如 chronosync/index），
// 与 [...markdown].ts / sitemap / llms.txt 的路由约定一致。
// extend 追加页面级加密 frontmatter（encrypted/password/passwordHint），
// 供 MarkdownContent 覆盖组件构建期加密正文（见 EncryptedContent.astro）。
export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/docs' }),
    schema: docsSchema({
      extend: z.object({
        encrypted: z.boolean().optional().default(false),
        password: z.string().optional(),
        passwordHint: z.string().optional(),
      }),
    }),
  }),
};
