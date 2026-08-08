// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      // English (root locale) — CelPlume is the short brand; long name "Celest Plume" appears in home hero
      title: 'CelPlume',
      description: 'Casting scales of old, spread wings to realms untold.',
      // Starlight favicon — 256px jpg
      favicon: '/images/CelPlume_favicon_256.jpg',
      // Document sidebar/topbar logo
      logo: {
        src: './public/images/CelPlume_favicon_256.jpg',
        alt: 'CelPlume',
        replacesTitle: true,
      },
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        zh: { label: '简体中文', lang: 'zh-CN' },
      },
      sidebar: [
        {
          label: 'Guides',
          translations: { 'zh-CN': '指南' },
          items: [
            { label: 'Introduction', translations: { 'zh-CN': '介绍' }, link: '/guides/example/' },
          ],
        },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/CelPlume/CelestPlume' },
      ],
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Noto+Serif+SC:wght@300;400;500;600;700&family=Inter:wght@300;400;500&display=swap',
          },
        },
        // 主页 favicon 统一使用 256px jpg（与首页一致）
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/jpeg', href: '/images/CelPlume_favicon_256.jpg' },
        },
      ],
    }),
    // 图标: Iconify 本地图标集（@iconify-json/lucide），禁止 emoji
    icon({
      include: {
        lucide: [
          'calendar-days',
          'file-text',
          'bookmark',
          'image-down',
          'zap',
          'sparkles',
          'sun',
          'moon',
          'languages',
          'arrow-right',
          'book-open',
          'star',
          'github',
        ],
      },
    }),
  ],
});
