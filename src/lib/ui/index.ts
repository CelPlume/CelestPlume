/**
 * CelestPlume Docs Kit — 公共 API（纯 TS，无 React）
 *
 * 用法示例（Astro）：
 * ```astro
 * ---
 * import { renderSidebar, renderToc, callout, cards } from '../lib/ui';
 * import { Icon } from '../lib/ui/icons';
 * ---
 * <div set:html={renderSidebar({ tree: [...], pathname: Astro.url.pathname })} />
 * ```
 *
 * 交互：<script>import { initCelestialUI } from '../lib/ui/runtime'; initCelestialUI();</script>
 */

export * from './types';
export { el, elSelf, attrsToString, escapeHtml, text, raw, parseHtml } from './html';
export type { Attrs, AttrValue, HtmlChild, ElementOptions } from './html';
export { Icon } from './icons';
export type { IconName } from './icons';
export {
  PALETTE,
  SEMANTIC_COLORS,
  LAYOUT,
  FONTS,
  THEME_STORAGE_KEY,
  resolveInitialTheme,
  applyTheme,
} from './tokens';
export type { CpdThemeMode, PaletteEntry } from './tokens';
export {
  renderSidebar,
  renderNavNode,
  isNavLinkActive,
  getItemOffset as getSidebarItemOffset,
  SIDEBAR_ID,
} from './sidebar';
export { renderDrawer } from './drawer';
export type { DrawerOptions } from './drawer';
export {
  renderToc,
  renderTocItem,
  collectHeadings,
  getItemOffset as getTocItemOffset,
  getLineOffset,
} from './toc';
export {
  callout,
  card,
  cards,
  steps,
  step,
  tabs,
  accordion,
  accordions,
  breadcrumb,
  pagination,
  file,
  folder,
  files,
  codeBlock,
  code,
  heading,
  badge,
  kbd,
  themeToggle,
  link,
  button,
  dropdown,
  dropdownItem,
  dropdownGroup,
  dropdownLabel,
  dropdownSeparator,
  modal,
} from './components';
export type {
  CalloutOptions,
  CardOptions,
  TabsOptions,
  TabPanel,
  AccordionOptions,
  BreadcrumbItem,
  PaginationItem,
  PaginationLabels,
  TreeFolderOptions,
  TreeOptions,
  CodeBlockOptions,
  HeadingOptions,
  HeadingLevel,
  BadgeVariant,
  LinkOptions,
  ButtonOptions,
  ButtonVariant,
  ButtonSize,
  DropdownOptions,
  DropdownItemOptions,
  ModalOptions,
} from './components';
export { initCelestialUI } from './runtime';
export type { CelestialUiOptions } from './runtime';
export { githubCard, githubCards, fetchGithubRepo } from './github-card';
export type { GithubCardOptions, GithubCardsLayout, GithubRepoData } from './github-card';
export { renderImageZoom } from './image-zoom';
export type { ImageZoomOptions } from './image-zoom';
