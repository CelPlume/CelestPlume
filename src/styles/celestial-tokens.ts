/**
 * CelestPlume — Celestial Design Tokens (TypeScript)
 *
 * 主页唯一的数据与样式常量来源（"用 TS 写样式"）：
 *   - 深浅色配色常量（输出到 CSS 变量 / canvas）
 *   - 粒子文字 / 加载动画（uiverse 纯 CSS）效果参数
 *   - i18n 文案（EN / ZH 完全分离，主页为 / 与 /zh/ 两个页面）
 *   - 项目数据（来自 CelPlume/HeavenlySpeculum 的 hero_projects.yml + projects.yml）
 *   - 图标一律使用 Iconify（本地 @iconify-json 图标集），禁止 emoji
 */

/* ============================================================
   Locale / Theme 基础类型
   ============================================================ */
export type Locale = 'en' | 'zh';
export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'celplume-theme';
/** i18n 偏好存储键（'en' | 'zh'），与文档页共用 */
export const LANG_STORAGE_KEY = 'celplume-lang';

export function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

/* ============================================================
   字体栈
   ============================================================ */
export const FONTS = {
  // 衬线显示：英文 Libertine（=Libertinus Serif，jsDelivr woff2），中文 LxgwNeoZhiSong（本地子集）
  display: "'Libertine','LxgwNeoZhiSong',Georgia,serif",
  serif: "'LxgwNeoZhiSong','Libertine',Georgia,serif",
  // 正文：英文 Manrope 优先（无 CJK），中文 LxgwNeoXiHei；回落系统 sans
  sans: "'Manrope','LxgwNeoXiHei',ui-sans-serif,system-ui,'Segoe UI',Roboto,'Source Sans 3','Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif",
} as const;

/* ============================================================
   粒子文字动画参数（灵感：reactbits.dev/text-animations/particle-text）
   ============================================================ */
export const PARTICLE_TEXT = {
  text: 'Celest Plume',
  particleSize: 2,
  density: 4,
  scatter: 220,
  gatherDuration: 1800,
  stagger: 420,
  pointerRepel: 42,
  repelRadius: 130,
  idleDrift: 0.8,
  glow: true,
  fontSize: 'clamp(2.6rem, 7vw, 6rem)',
  fontWeight: 800,
  colors: {
    dark: { base: '#f3e4c2', highlight: '#d4af6c' },
    light: { base: '#2a2a3e', highlight: '#a8813a' },
  },
} as const;

export const EASINGS = {
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
} as const;

/* ============================================================
   加载动画（Uiverse.io by dexter-st: bright-lizard-8）
   纯 CSS 旋转光球 + 字母呼吸，见 Home.astro <style> / celestial.css
   ============================================================ */
export const LOADER = {
  /** 显示的最短时长（ms），避免加载过快闪烁 */
  minShowMs: 250,
  /** 兜底隐藏时长（ms） */
  fallbackMs: 1000,
  /** 淡出时长（ms） */
  fadeOutMs: 500,
  /** 字母文案（仅英文 "Loading"，渲染为单字符 span） */
  letters: ['L', 'o', 'a', 'd', 'i', 'n', 'g'],
} as const;

/* ============================================================
   项目数据
   数据来源:
     - https://github.com/CelPlume/HeavenlySpeculum/blob/main/static/hero_projects.yml
     - https://github.com/CelPlume/HeavenlySpeculum/blob/main/static/projects.yml
   图标: Iconify lucide 图标名（本地 @iconify-json/lucide），禁止 emoji
   ============================================================ */
export interface ProjectButton {
  label: string;
  link: string;
  style: 'primary' | 'secondary';
}

export interface Project {
  id: string;
  icon: string; // iconify name, e.g. 'lucide:calendar-days'
  /** hero_projects.yml 中的顺序（1 起）；未出现在 hero 列表中的项目为 undefined */
  hero?: number;
  en: {
    title: string;
    description: string;
    tags: string[];
    buttons: ProjectButton[];
  };
  zh: {
    title: string;
    description: string;
    tags: string[];
    buttons: ProjectButton[];
  };
}

/** 将项目 YAML 中的相对链接解析为本站真实地址（YAML 中的 /docs/intro 在本站为 /guides/example/） */
export function resolveProjectLink(link: string, locale: Locale): string {
  if (link === '/') return locale === 'zh' ? '/zh/' : '/';
  if (link.startsWith('/docs/')) {
    return locale === 'zh' ? '/zh/guides/example/' : '/guides/example/';
  }
  return link;
}

export const PROJECTS: Project[] = [
  {
    id: 'sky-mirror',
    icon: 'lucide:sparkles',
    en: {
      title: 'Sky Mirror',
      description:
        'A futuristic, tech-forward documentation portal that mirrors tomorrow and connects the world of innovation. Built on the Plumest design system for an elegant reading experience and powerful features.',
      tags: ['React', 'Frontend', 'Docusaurus'],
      buttons: [
        { label: 'Visit Home', link: '/', style: 'primary' },
        { label: 'Read Docs', link: '/docs/intro', style: 'secondary' },
      ],
    },
    zh: {
      title: '天空之镜',
      description:
        '极具未来感和科技感的文档站点，映照科技未来，连接创新世界。采用 Plumest 设计系统，提供优雅的阅读体验和强大的功能。',
      tags: ['React', '前端', 'Docusaurus'],
      buttons: [
        { label: '访问首页', link: '/', style: 'primary' },
        { label: '查看文档', link: '/docs/intro', style: 'secondary' },
      ],
    },
  },
  {
    id: 'sdnu-chrono-sync',
    icon: 'lucide:calendar-days',
    hero: 1,
    en: {
      title: 'SDNU ChronoSync',
      description:
        'SDNUChronoSync (时序同笺) is a timetable and schedule management tool designed exclusively for Shandong Normal University students. One-click import from the academic affairs system, plus ICS export for subscribing on multi-platform calendars. Features personal profiles, team views, and an admin panel, helping students sync and plan their campus life efficiently. Front-end and back-end are separated for easy secondary development and extension.',
      tags: ['Timetable', 'Calendar', 'TypeScript'],
      buttons: [
        { label: 'Get Started', link: 'https://sxtj.hxcn.space', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/CelPlume/SDNUChronoSync', style: 'secondary' },
      ],
    },
    zh: {
      title: '时序同笺',
      description:
        'SDNUChronoSync (时序同笺) 是一个专为山东师范大学（SDNU）学生设计的课表与日程管理工具。支持从教务系统一键导入课表，并能生成ICS文件以便在多平台日历应用中订阅。项目具备个人资料管理、团队视图以及管理员后台等功能，旨在帮助用户高效地同步与规划学习生活。前端与后端分离的设计，为二次开发和功能扩展提供了便利。',
      tags: ['课程表', '日历', 'TypeScript'],
      buttons: [
        { label: '开始使用', link: 'https://sxtj.hxcn.space', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/CelPlume/SDNUChronoSync', style: 'secondary' },
      ],
    },
  },
  {
    id: 'gastigado',
    icon: 'lucide:zap',
    hero: 7,
    en: {
      title: 'Gastigado Fast Image',
      description:
        'A lightweight, high-performance image hosting solution supporting multiple image formats and CDN acceleration. API-based upload, management, and retrieval provide the best experience for storing and sharing images.',
      tags: ['Image', 'CDN', 'Web'],
      buttons: [
        { label: 'Get Started', link: 'https://gastigado.cnies.org', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/HevSpecu', style: 'secondary' },
      ],
    },
    zh: {
      title: 'Gastigado Fast Image',
      description:
        '轻量级、高性能的图床解决方案，支持多种图片格式、CDN 加速。支持API上传、管理和获取图片，为您的图片存储和分享提供最佳体验。',
      tags: ['图像', 'CDN', 'Web'],
      buttons: [
        { label: '开始使用', link: 'https://gastigado.cnies.org', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/HevSpecu', style: 'secondary' },
      ],
    },
  },
  {
    id: 'resume',
    icon: 'lucide:file-text',
    hero: 3,
    en: {
      title: 'Reactive Resume',
      description:
        'Reactive Resume is a free and open-source résumé builder that simplifies creating, updating, and sharing résumés. The platform collects zero user data and serves no ads, so your privacy is protected to the highest degree. The interface is extremely user-friendly.',
      tags: ['Résumé', 'Tool', 'Open Source'],
      buttons: [{ label: 'Get Started', link: 'https://resume.hxcn.space', style: 'primary' }],
    },
    zh: {
      title: '及时简历',
      description:
        'Reactive Resume 是一个免费且开源的简历制作工具，它简化了简历的创建、更新和共享流程。该平台完全不收集用户信息，也不进行任何形式的广告推送，因此用户的隐私得到了最高程度的保护。界面极其用户友好。',
      tags: ['简历', '工具', '开源'],
      buttons: [{ label: '开始使用', link: 'https://resume.hxcn.space', style: 'primary' }],
    },
  },
  {
    id: 'bookmark-harbor',
    icon: 'lucide:bookmark',
    en: {
      title: 'BookmarkHarbor',
      description:
        'BookmarkHarbor is a local-first, open-source bookmark browser with folders/tags, a modern UI, and multilingual support. Manage bookmarks like a file manager — local storage keeps them safe.',
      tags: ['Bookmarks', 'Local-first', 'Open Source'],
      buttons: [
        { label: 'Open App', link: 'https://bookmark.hxcn.space', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/CelPlume/BookmarkHarbor', style: 'secondary' },
      ],
    },
    zh: {
      title: 'BookmarkHarbor',
      description:
        '书签浏览器：像文件管理器一样管理书签，本地存储更安全，开源、现代美观、支持多语言。通过文件夹与标签组织你的收藏，数据保存在本地，安全可控。',
      tags: ['书签', '本地优先', '开源'],
      buttons: [
        { label: '打开应用', link: 'https://bookmark.hxcn.space', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/CelPlume/BookmarkHarbor', style: 'secondary' },
      ],
    },
  },
  {
    id: 'squoosh',
    icon: 'lucide:image-down',
    en: {
      title: 'Squoosh',
      description:
        'Browser-based image compressor with a rich codec set (AVIF, WebP, mozJPEG, PNG, QOI) and side-by-side live preview. No upload, fully private. Supports 8 languages including Simplified Chinese, Traditional Chinese, Japanese, and Korean, with automatic browser detection.',
      tags: ['Image', 'Compression', 'Web'],
      buttons: [
        { label: 'Open App', link: 'https://squoosh.hxcn.dev', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/CelPlume/squoosh', style: 'secondary' },
      ],
    },
    zh: {
      title: 'Squoosh',
      description:
        '浏览器端图像压缩工具，内置丰富编码器（AVIF、WebP、mozJPEG、PNG、QOI）与并排实时预览。无需上传，完全本地处理。支持 8 种语言（含简体中文、繁体中文），浏览器自动检测。',
      tags: ['图像', '压缩', 'Web'],
      buttons: [
        { label: '打开应用', link: 'https://squoosh.hxcn.dev', style: 'primary' },
        { label: 'GitHub', link: 'https://github.com/CelPlume/squoosh', style: 'secondary' },
      ],
    },
  },
];

/** Hero 项目（按 hero_projects.yml 顺序） */
export function getFeaturedProjects(): Project[] {
  return PROJECTS.filter((p) => p.hero !== undefined).sort((a, b) => (a.hero ?? 0) - (b.hero ?? 0));
}

/** 其余项目 */
export function getOtherProjects(): Project[] {
  return PROJECTS.filter((p) => p.hero === undefined);
}

/* ============================================================
   Philosophy 三柱
   ============================================================ */
export interface Pillar {
  num: string;
  en: { title: string; text: string };
  zh: { title: string; text: string };
}

export const PILLARS: Pillar[] = [
  {
    num: 'I',
    en: {
      title: 'Poetic Precision',
      text: 'Beauty is not ornament — it is the shape of a correctly-solved problem. Every API, every name, every frame is written as verse.',
    },
    zh: {
      title: '诗意的严谨',
      text: '美并非装饰——它是正确解答的形状。每个接口、每个命名、每一帧，皆如诗律般精准。',
    },
  },
  {
    num: 'II',
    en: {
      title: 'Divine Defaults',
      text: 'The tool arrives already blessed. Sensible defaults, blessed ergonomics, zero-config consecration.',
    },
    zh: {
      title: '天赐的默认',
      text: '工具自诞生便已受祝。合理的默认值、受祝的人机工学、零配置的祝圣。',
    },
  },
  {
    num: 'III',
    en: {
      title: 'Transcendent Craft',
      text: 'We build for centuries, not quarters. Every feather is placed with intention; every curve carries the weight of the moon.',
    },
    zh: {
      title: '超然的工艺',
      text: '我们为世纪而造，不为季度。每片翎羽皆含深意，每道弧线皆载月之重量。',
    },
  },
];

/* ============================================================
   UI 文案（bilingual，主页 EN / ZH 完全分离）
   ============================================================ */
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface UiCopy {
  htmlLang: string;
  meta: { title: string; description: string; ogLocale: string };
  brand: { name: string; footerSubtitle: string };
  nav: {
    home: string;
    /** 项目 dropdown 触发词（名字待定，先占位） */
    projects: string;
    /** 贡献导航词（名字待定，先占位） */
    contribute: string;
    about: string;
    toggleTheme: string;
    switchLang: string;
  };
  hero: {
    particleText: string;
    tagline: string;
    ctaPrimary: string;
    ctaPrimaryHref: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
  };
  projects: { eyebrow: string; title: string; desc: string };
  philosophy: { eyebrow: string; title: string; desc: string };
  cta: {
    eyebrow: string;
    title: string;
    desc: string;
    star: string;
    starHref: string;
    codex: string;
    codexHref: string;
  };
  footer: {
    brandSubtitle: string;
    columns: FooterColumn[];
    /** 官网地址（版权栏品牌名与列内「官网」项共用） */
    officialUrl: string;
    /** 版权栏中被链接的品牌名文本 */
    copyrightBrand: string;
    /** 版权栏品牌名之后的版权说明 */
    copyrightSuffix: string;
    builtWith: string;
  };
}

const EN_FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Docs',
    links: [
      { label: 'Documentation', href: '/guides/example/' },
      { label: '中文文档', href: '/zh/guides/example/' },
      { label: 'Three Pillars', href: '#philosophy' },
    ],
  },
  {
    heading: 'Covenant',
    links: [
      { label: 'Website', href: 'https://celplume.hxcn.space', external: true },
      { label: 'GitHub', href: 'https://github.com/CelPlume', external: true },
      { label: 'Issues', href: 'https://github.com/CelPlume/CelestPlume/issues', external: true },
      { label: 'License', href: 'https://github.com/CelPlume/CelestPlume/blob/main/LICENSE', external: true },
    ],
  },
];

const ZH_FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: '文档',
    links: [
      { label: '中文文档', href: '/zh/guides/example/' },
      { label: 'English Docs', href: '/guides/example/' },
      { label: '三柱之道', href: '#philosophy' },
    ],
  },
  {
    heading: '盟约',
    links: [
      { label: '官网', href: 'https://celplume.hxcn.space', external: true },
      { label: 'GitHub', href: 'https://github.com/CelPlume', external: true },
      { label: '议题', href: 'https://github.com/CelPlume/CelestPlume/issues', external: true },
      { label: '许可证', href: 'https://github.com/CelPlume/CelestPlume/blob/main/LICENSE', external: true },
    ],
  },
];

export const UI_EN: UiCopy = {
  htmlLang: 'en',
  meta: {
    title: 'Celest Plume — Casting scales of old, spread wings to realms untold.',
    description: 'Casting scales of old, spread wings to realms untold. Code as scripture, craft as sacrament.',
    ogLocale: 'en_US',
  },
  brand: { name: 'CelPlume', footerSubtitle: 'Casting scales of old, spread wings to realms untold.' },
  nav: {
    home: 'Home',
    projects: 'Projects',
    contribute: 'Contribute',
    about: 'About',
    toggleTheme: 'Toggle theme',
    switchLang: '中',
  },
  hero: {
    particleText: 'Celest Plume',
    tagline: 'Casting scales of old, spread wings to realms untold.',
    ctaPrimary: 'Begin the Revelation',
    ctaPrimaryHref: '/guides/example/',
    ctaSecondary: 'View on GitHub',
    ctaSecondaryHref: 'https://github.com/CelPlume',
  },
  projects: {
    eyebrow: 'Constellations',
    title: 'The Projects',
    desc: 'Each repository a star, each commit its light — gathered into constellations across the firmament of craft.',
  },
  philosophy: {
    eyebrow: 'Scripture',
    title: 'Three Pillars of the Plume',
    desc: 'The trinity of values that governs every line of code, every curve of the interface, every word in the docs.',
  },
  cta: {
    eyebrow: 'Invocation',
    title: 'Become a Bearer of the Plume',
    desc: 'The feather descends upon those who craft with reverence. Join the covenant, read the codex, or leave a star upon the firmament.',
    star: 'Star on GitHub',
    starHref: 'https://github.com/CelPlume/CelestPlume',
    codex: 'Read the Codex',
    codexHref: '/guides/example/',
  },
  footer: {
    brandSubtitle: 'Casting scales of old, spread wings to realms untold.',
    columns: EN_FOOTER_COLUMNS,
    officialUrl: 'https://celplume.hxcn.space',
    copyrightBrand: 'CelPlume',
    copyrightSuffix: ' · All rights reserved.',
    builtWith: 'Powered by Astro · Starlight · Plumest',
  },
};

export const UI_ZH: UiCopy = {
  htmlLang: 'zh-CN',
  meta: {
    title: '天空之翼 — 辞却尘渊旧日鳞，振翼云海入星河',
    description: '辞却尘渊旧日鳞，振翼云海入星河。代码即经卷，匠艺即圣礼。',
    ogLocale: 'zh_CN',
  },
  brand: { name: '天空之翼', footerSubtitle: '辞却尘渊旧日鳞，振翼云海入星河' },
  nav: {
    home: '首页',
    projects: '项目',
    contribute: '贡献',
    about: '关于',
    toggleTheme: '切换主题',
    switchLang: 'EN',
  },
  hero: {
    particleText: 'Celest Plume',
    tagline: '辞却尘渊旧日鳞，振翼云海入星河。',
    ctaPrimary: '开启启示',
    ctaPrimaryHref: '/zh/guides/example/',
    ctaSecondary: '查看 GitHub',
    ctaSecondaryHref: 'https://github.com/CelPlume',
  },
  projects: {
    eyebrow: '星座',
    title: '诸星之工',
    desc: '每一座仓库皆为星辰，每一次提交皆是其光——聚为工艺天穹上的璀璨星座。',
  },
  philosophy: {
    eyebrow: '典章',
    title: '羽之三柱',
    desc: '统御每一行代码、每一道界面弧线、每一个文档字眼的三位一体价值。',
  },
  cta: {
    eyebrow: '召请',
    title: '成为执羽者',
    desc: '翎羽降落于以崇敬之心造物者。加入盟约，阅读经卷，或在天穹之上留下一颗星。',
    star: 'GitHub 赠星',
    starHref: 'https://github.com/CelPlume/CelestPlume',
    codex: '阅读经卷',
    codexHref: '/zh/guides/example/',
  },
  footer: {
    brandSubtitle: '辞却尘渊旧日鳞，振翼云海入星河',
    columns: ZH_FOOTER_COLUMNS,
    officialUrl: 'https://celplume.hxcn.space',
    copyrightBrand: '天空之翼（CelPlume）',
    copyrightSuffix: ' · All rights reserved.',
    builtWith: '由 Astro · Starlight · Plumest 强力驱动',
  },
};

export function getUI(locale: Locale): UiCopy {
  return locale === 'zh' ? UI_ZH : UI_EN;
}
