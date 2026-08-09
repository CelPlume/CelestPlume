/**
 * CelestPlume Docs Kit — 共享类型（纯 TS）
 *
 * 与 Plumest 的 page-tree / toc 模型对齐（简化版）：
 * - NavNode: 侧边栏导航树（分组 / 链接 / 分隔标签）
 * - TocItem: 目录条目（含可选的 step 编号，驱动 ClerkTOC 的时间线样式）
 */
/** 侧边栏链接项 */
export interface NavLink {
  type: 'link';
  /** 显示名 */
  label: string;
  /** 目标地址（站内相对路径或完整 URL） */
  href: string;
  /** 是否外部链接（渲染 ExternalLink 图标） */
  external?: boolean;
  /** 自定义图标（Iconify 名或 SVG 字符串），默认无 */
  icon?: string;
  /** 是否默认隐藏（仅当前激活时显示） */
  unlisted?: boolean;
}

/** 侧边栏折叠分组 */
export interface NavFolder {
  type: 'folder';
  label: string;
  /** 子节点 */
  children: NavNode[];
  /** 默认展开（否则仅激活路径展开） */
  defaultOpen?: boolean;
  /** 是否可折叠，默认 true */
  collapsible?: boolean;
  /** 分组自身可点击跳转的地址 */
  href?: string;
  /** 分组内链接的图标 */
  icon?: string;
}

/** 侧边栏分隔标签（SidebarSeparator） */
export interface NavSeparator {
  type: 'separator';
  label: string;
}

export type NavNode = NavLink | NavFolder | NavSeparator;

/** 完整侧边栏配置 */
export interface SidebarConfig {
  /** 顶部标题（如品牌名） */
  title?: string;
  /** 顶部分组（渲染在页面树之前） */
  links?: NavNode[];
  /** 页面树 */
  tree: NavNode[];
  /** 底部区域（主题切换等按钮），由调用方传入 HTML */
  footer?: string;
  /** 当前路径（用于激活高亮） */
  pathname: string;
  /** 展开层级：level <= defaultOpenLevel 的分组默认展开（从 1 开始） */
  defaultOpenLevel?: number;
  /** 语言方向 */
  dir?: 'ltr' | 'rtl';
  /** 移动端抽屉导航树（全站导航：四组导航 + 二级菜单 + 文章树）；缺省则抽屉为空 */
  drawerNav?: NavNode[];
  /** 可访问性文案（默认英文） */
  labels?: {
    /** 抽屉关闭按钮 aria-label */
    close?: string;
    /** 抽屉导航树 aria-label */
    tree?: string;
    /** 桌面侧栏折叠按钮 aria-label */
    collapse?: string;
  };
}

/** 目录条目（与 Plumest toc 模型对齐） */
export interface TocItem {
  /** 锚点地址，如 #installation */
  url: string;
  /** 标题文本 */
  title: string;
  /** 标题层级：2 = h2, 3 = h3, 4 = h4 */
  depth: number;
  /** 可选编号（驱动 ClerkTOC 的 step 圆徽） */
  step?: number;
}

/** 目录生成选项 */
export interface TocOptions {
  /** 标题文本（默认 "On this page"） */
  title?: string;
  /** 是否显示空状态卡片（无标题时） */
  empty?: boolean;
}

export type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'idea';

export type ThemeMode = 'dark' | 'light';

/** 站点语言（与主页 celestial-tokens 的 Locale 对齐） */
export type Locale = 'en' | 'zh';

export type Dir = 'ltr' | 'rtl';
