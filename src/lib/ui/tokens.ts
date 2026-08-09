/**
 * CelestPlume Docs Kit — 设计令牌（TypeScript）
 *
 * 单一事实来源：所有 `--cpd-*` CSS 变量由这里的常量生成，
 * `celestial-docs.css` 通过 `[data-cpd-theme]` 注入深浅两套值。
 * 颜色体系 **对齐 Plumest 默认主题**
 * （中性 zinc 基底 + 近黑主色）。
 */

export const THEME_STORAGE_KEY = 'celplume-theme';

export type CpdThemeMode = 'dark' | 'light' | 'system';

/** 主题模式 → 实际渲染值（system 跟随系统偏好） */
export function resolveThemeMode(mode: CpdThemeMode): 'dark' | 'light' {
  if (mode !== 'system') return mode;
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** 从 localStorage 解析初始主题模式（无记录/非法值 → 跟随系统） */
export function resolveInitialTheme(): CpdThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'system';
}

/**
 * 应用主题：data-cpd-theme = 实际深浅（CSS 只认这个），
 * data-cpd-theme-mode = 模式（dark/light/system，图标显示与循环切换用）。
 * 注意：观察者不得回写 data-cpd-theme（避免 MutationObserver 死锁）。
 */
export function applyTheme(mode: CpdThemeMode): void {
  const root = document.documentElement;
  root.setAttribute('data-cpd-theme', resolveThemeMode(mode));
  root.setAttribute('data-cpd-theme-mode', mode);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable（隐私模式）— 属性已生效 */
  }
}

/** 语义色（深浅模式共享，Plumest 原值） */
export const SEMANTIC_COLORS = {
  info: 'oklch(62.3% 0.214 259.815)',
  warning: 'oklch(76.9% 0.188 70.08)',
  error: 'oklch(63.7% 0.237 25.331)',
  success: 'oklch(72.3% 0.219 149.579)',
  idea: 'oklch(70.5% 0.209 60.849)',
} as const;

/** 基础色板（每项在 :root 与 [data-cpd-theme='dark'] 下各有一份） */
export interface PaletteEntry {
  variable: string;
  light: string;
  dark: string;
}

export const PALETTE: PaletteEntry[] = [
  { variable: '--cpd-background', light: 'hsl(0 0% 96%)', dark: 'hsl(0 0% 7.04%)' },
  { variable: '--cpd-foreground', light: 'hsl(0 0% 3.9%)', dark: 'hsl(0 0% 92%)' },
  { variable: '--cpd-muted', light: 'hsl(0 0% 96.1%)', dark: 'hsl(0 0% 12.9%)' },
  { variable: '--cpd-muted-foreground', light: 'hsl(0 0% 45.1%)', dark: 'hsl(0 0% 70% / 0.8)' },
  { variable: '--cpd-popover', light: 'hsl(0 0% 98%)', dark: 'hsl(0 0% 11.6%)' },
  { variable: '--cpd-popover-foreground', light: 'hsl(0 0% 15.1%)', dark: 'hsl(0 0% 86.9%)' },
  { variable: '--cpd-card', light: 'hsl(0 0% 94.7%)', dark: 'hsl(0 0% 9.8%)' },
  { variable: '--cpd-card-foreground', light: 'hsl(0 0% 3.9%)', dark: 'hsl(0 0% 98%)' },
  { variable: '--cpd-border', light: 'hsl(0 0% 80% / 0.5)', dark: 'hsl(0 0% 40% / 0.2)' },
  // 主色：Plumest 默认近黑（浅色 #171717 / 深色 #fafafa）
  { variable: '--cpd-primary', light: 'hsl(0 0% 9%)', dark: 'hsl(0 0% 98%)' },
  { variable: '--cpd-primary-foreground', light: 'hsl(0 0% 98%)', dark: 'hsl(0 0% 9%)' },
  { variable: '--cpd-secondary', light: 'hsl(0 0% 93.1%)', dark: 'hsl(0 0% 12.9%)' },
  { variable: '--cpd-secondary-foreground', light: 'hsl(0 0% 9%)', dark: 'hsl(0 0% 92%)' },
  { variable: '--cpd-accent', light: 'hsl(0 0% 82% / 0.5)', dark: 'hsl(0 0% 40.9% / 0.3)' },
  { variable: '--cpd-accent-foreground', light: 'hsl(0 0% 9%)', dark: 'hsl(0 0% 90%)' },
  { variable: '--cpd-ring', light: 'hsl(0 0% 63.9%)', dark: 'hsl(0 0% 54.9%)' },
  { variable: '--cpd-overlay', light: 'hsl(0 0% 0% / 0.2)', dark: 'hsl(0 0% 0% / 0.2)' },
  // 侧边栏（Plumest：与页面背景同色 + 右分隔线）
  { variable: '--cpd-sidebar', light: 'hsl(0 0% 96%)', dark: 'hsl(0 0% 7.04%)' },
  { variable: '--cpd-sidebar-foreground', light: 'hsl(0 0% 3.9%)', dark: 'hsl(0 0% 92%)' },
  { variable: '--cpd-sidebar-border', light: 'hsl(0 0% 80% / 0.5)', dark: 'hsl(0 0% 40% / 0.2)' },
  { variable: '--cpd-sidebar-accent', light: 'hsl(0 0% 82% / 0.5)', dark: 'hsl(0 0% 40.9% / 0.3)' },
  { variable: '--cpd-sidebar-accent-foreground', light: 'hsl(0 0% 9%)', dark: 'hsl(0 0% 90%)' },
] as const;

/** 布局度量（Plumest：侧栏/目录 256px，版心 97rem，正文最宽 800px） */
export const LAYOUT = {
  sidebarWidth: '256px',
  tocWidth: '256px',
  layoutWidth: '97rem',
  pageMaxWidth: '800px',
  radius: '8px',
  /** 移动端抽屉宽度 */
  drawerWidth: '85%',
  drawerMaxWidth: '380px',
  /** 导航折叠触发断点（px） */
  mdBreakpoint: 768,
  xlBreakpoint: 1280,
} as const;

/** 字体栈（与主页 celestial-tokens 保持一致） */
export const FONTS = {
  sans: `'Manrope','LxgwNeoXiHei',ui-sans-serif,system-ui,'Segoe UI',Roboto,'Source Sans 3','Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif`,
  display: `'Plus Jakarta Sans','LxgwNeoXiHei',ui-sans-serif,system-ui,'Segoe UI',Roboto,'Source Sans 3','Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif`,
  mono: `'Maple Mono','Fira Code','LxgwNeoXiHei',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New','Roboto Mono','Microsoft YaHei UI','Microsoft YaHei',monospace`,
} as const;
