// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import rehypeImageZoom from './src/lib/markdown/rehype-image-zoom.ts';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * 把 Docs Kit 运行时注入所有页面。
 * Starlight 覆盖组件中的 <script> import 会被剥离，故用 Astro 核心 injectScript。
 */
/**
 * 把 @astrojs/sitemap 的嵌套输出（sitemap-index.xml + sitemap-N.xml）
 * 压扁为单个 sitemap.xml，保留多语言 hreflang 备用链接。
 * 必须放在 integrations 数组最后：Starlight 会把 @astrojs/sitemap 注入在 starlight
 * 之后，而 Astro 按数组顺序触发 astro:build:done，故本钩子在其之后执行。
 * 站点 URL 数未超过 @astrojs/sitemap entryLimit（45000）时只会产出单个 sitemap-0.xml。
 *
 * 额外处理：美化输出，每个标签单独一行，避免整份 sitemap 挤成一行难以阅读/排障。
 */
function flatSitemap() {
  return {
    name: 'flat-sitemap',
    hooks: {
      /** @param {import('astro').HookParameters<'astro:build:done'>} params */
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const chunk = join(out, 'sitemap-0.xml');
        const index = join(out, 'sitemap-index.xml');
        try {
          let xml = await readFile(chunk, 'utf8');
          // 美化：标签间换行（仅加空白，不改变 XML 语义）
          xml = xml.replace(/></g, '>\n<');
          await writeFile(join(out, 'sitemap.xml'), xml);
          await rm(chunk, { force: true });
          await rm(index, { force: true });
          logger.info('`sitemap.xml` generated (flat, pretty, hreflang kept)');
        } catch (err) {
          logger.error(`flat-sitemap: ${/** @type {Error} */ (err).message}`);
        }
      },
    },
  };
}

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
  // 生产站点 URL：Starlight 据此生成 sitemap、canonical、og:url 等绝对链接
  site: 'https://celplume.hxcn.space',
  // cleanURL：Astro 默认输出无 .html 的目录型路由（/page/），配合 trailingSlash 保持内部链接稳定
  trailingSlash: 'always',
  markdown: {
    // 把正文 `<img>` 重写为可点击放大的 ImageZoom 组件（含 zoom 缩放修复）
    rehypePlugins: [rehypeImageZoom],
  },
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
      // 官方 lastUpdated：页脚显示最近更新日期（取自 Git 提交历史，可用 frontmatter 覆盖）
      lastUpdated: true,
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
        // 覆盖 Starlight 默认的 /sitemap-index.xml 链接（hasTag 按 rel=sitemap 去重替换），
        // 指向压扁后的 /sitemap.xml
        { tag: 'link', attrs: { rel: 'sitemap', href: '/sitemap.xml' } },
        { tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', href: '/rss.xml', title: 'RSS' } },
        { tag: 'link', attrs: { rel: 'describedby', href: '/llms.txt' } },
        {
          // 站点统计（Umami）：defer 异步加载，不阻塞首屏
          tag: 'script',
          attrs: {
            defer: true,
            src: 'https://analytics.hxcn.dev/script.js',
            'data-website-id': '6139e9bf-ca71-41f6-839f-2241932962af',
          },
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
        // SEO：OG/Twitter 分享图（1200×630）与站点关键词。
        // 文档页 canonical / og:url / og:site_name / hreflang / sitemap 链接由 Starlight
        // 在配置 site 后自动生成（见 utils/head.ts）。
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://celplume.hxcn.space/images/og-cover.jpg',
          },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:width', content: '1200' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:height', content: '630' },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://celplume.hxcn.space/images/og-cover.jpg',
          },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:site', content: '@CelPlume' },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'keywords',
            content:
              'CelPlume, Celest Plume, documentation portal, open source, Astro, Starlight, Plumest, ChronoSync, BookmarkHarbor',
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
    // 置于数组末尾：在 Starlight 注入的 @astrojs/sitemap 之后运行，压扁为 sitemap.xml
    flatSitemap(),
  ],
});
