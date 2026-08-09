// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

/**
 * 把 Docs Kit 运行时注入所有页面。
 * Starlight 覆盖组件中的 <script> import 会被剥离，故用 Astro 核心 injectScript。
 */
function celestialUiRuntime() {
  return {
    name: 'celestial-ui-runtime',
    hooks: {
      /** @param {import('astro').HookParameters<'astro:config:setup'>} params */
      'astro:config:setup'(params) {
        params.injectScript('page', 'import "/src/scripts/celestial-docs-runtime.ts";');
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  trailingSlash: 'always',
  integrations: [
    celestialUiRuntime(),
    starlight({
      // English (root locale) — CelPlume is the short brand; long name "Celest Plume" appears in home hero
      title: 'CelPlume',
      description: 'Casting scales of old, spread wings to realms untold.',
      // Starlight favicon — 256px jpg
      favicon: '/images/CelPlume_favicon_256.jpg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        zh: { label: '简体中文', lang: 'zh-CN' },
      },
      // 文档侧边栏树（同时是 Pagefind / sitemap / 分页的数据源）
      sidebar: [
        {
          label: 'Guides',
          translations: { 'zh-CN': '指南' },
          items: [
            { label: 'Introduction', translations: { 'zh-CN': '介绍' }, link: '/guides/example/' },
          ],
        },
        {
          label: 'ChronoSync',
          translations: { 'zh-CN': '时序同笺' },
          items: [
            {
              label: 'About',
              translations: { 'zh-CN': '关于项目' },
              items: [
                {
                  label: 'About ChronoSync',
                  translations: { 'zh-CN': '时序同笺' },
                  link: '/chronosync/',
                },
                {
                  label: 'Changelog',
                  translations: { 'zh-CN': '更新日志' },
                  link: '/chronosync/about/changelog/',
                },
              ],
            },
            {
              label: 'Tutorials',
              translations: { 'zh-CN': '用户教程' },
              autogenerate: { directory: 'chronosync/tutorials' },
            },
            {
              label: 'Development',
              translations: { 'zh-CN': '开发部署' },
              autogenerate: { directory: 'chronosync/dev' },
            },
            {
              label: 'Legal',
              translations: { 'zh-CN': '法律条款' },
              autogenerate: { directory: 'chronosync/legal' },
            },
          ],
        },
        {
          label: 'BookmarkHarbor',
          translations: { 'zh-CN': 'BookmarkHarbor' },
          autogenerate: { directory: 'bookmark-harbor' },
        },
        {
          label: 'Contribution',
          translations: { 'zh-CN': '贡献' },
          items: [
            {
              label: 'Overview',
              translations: { 'zh-CN': '概述' },
              link: '/contribution/overview/',
            },
            {
              label: 'Styles',
              translations: { 'zh-CN': '样式规范' },
              link: '/contribution/styles/',
            },
            {
              label: 'Components',
              translations: { 'zh-CN': '组件文档' },
              autogenerate: { directory: 'contribution/components' },
            },
          ],
        },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/CelPlume/CelestPlume' },
      ],
      // ClerkTOC 层级：h2–h4
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      // 用 Plumest 风格的组件整体替换 Starlight 可见外壳
      components: {
        PageFrame: './src/components/starlight/PageFrame.astro',
        Header: './src/components/starlight/Header.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
        TwoColumnContent: './src/components/starlight/TwoColumnContent.astro',
        PageSidebar: './src/components/starlight/PageSidebar.astro',
        ContentPanel: './src/components/starlight/ContentPanel.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
        MarkdownContent: './src/components/starlight/MarkdownContent.astro',
        Pagination: './src/components/starlight/Pagination.astro',
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        MobileMenuToggle: './src/components/starlight/MobileMenuToggle.astro',
        MobileMenuFooter: './src/components/starlight/MobileMenuFooter.astro',
      },
      // Docs Kit 样式 + Starlight 外壳中和（均不进入主页）
      customCss: [
        './src/styles/fonts/fonts-docs.css',
        './src/styles/celestial-docs.css',
        './src/styles/site-nav.css',
        './src/styles/starlight-plumest.css',
      ],
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://cdn.jsdelivr.net' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: '' },
        },
        {
          // 预加载正文字体（Manrope 400）：首绘前就绪，避免 swap 引起 CLS（文档页 CLS 主因）
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
            href: 'https://cdn.jsdelivr.net/npm/@fontsource/manrope@5.3.0/files/manrope-latin-400-normal.woff2',
          },
        },
      ],
    }),
    // MDX：供贡献分类的组件文档嵌入实时预览（纯 TS 构建器，无 React）
    mdx(),
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
          'monitor',
          'languages',
          'chevron-down',
          'arrow-right',
          'search',
          'x',
          'menu',
          'book-open',
          'star',
          'github',
          'panel-right',
          'mouse-pointer-click',
          'link',
          'message-square',
        ],
      },
    }),
  ],
});
