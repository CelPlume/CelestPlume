// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'CelestPlume',
      // 默认语言为英文，中文作为备选语言
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        zh: { label: '简体中文', lang: 'zh-CN' },
      },
      sidebar: [
        {
          label: '开始',
          items: [
            { label: 'Introduction', link: '/guides/example/' },
          ],
        },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/CelPlume/CelestPlume' },
      ],
    }),
  ],
});
