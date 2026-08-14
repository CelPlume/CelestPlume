/**
 * CelestPlume Docs Kit — 内联 SVG 图标集（纯 TS）
 *
 * lucide 风格线条图标（24×24、stroke=currentColor、stroke-width=2）。
 * 内联字符串：服务端可拼进 HTML，客户端无需额外依赖；
 * 通过 `class` 控制尺寸，颜色继承 currentColor。
 */

interface IconOptions {
  class?: string;
  'stroke-width'?: number;
}

function svg(paths: string, options?: IconOptions): string {
  const strokeWidth = options?.['stroke-width'] ?? 2;
  const cls = options?.class;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"` +
    (cls ? ` class="${cls}"` : '') +
    ` aria-hidden="true" focusable="false">${paths}</svg>`
  );
}

export const Icon = {
  chevronDown: (o?: IconOptions) =>
    svg('<path d="m6 9 6 6 6-6"/>', o),
  chevronRight: (o?: IconOptions) =>
    svg('<path d="m9 18 6-6-6-6"/>', o),
  chevronLeft: (o?: IconOptions) =>
    svg('<path d="m15 18-6-6 6-6"/>', o),
  chevronsUpDown: (o?: IconOptions) =>
    svg('<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>', o),
  externalLink: (o?: IconOptions) =>
    svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', o),
  info: (o?: IconOptions) =>
    svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', o),
  triangleAlert: (o?: IconOptions) =>
    svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>', o),
  circleX: (o?: IconOptions) =>
    svg('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>', o),
  circleCheck: (o?: IconOptions) =>
    svg('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>', o),
  lightbulb: (o?: IconOptions) =>
    svg('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>', o),
  link: (o?: IconOptions) =>
    svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', o),
  copy: (o?: IconOptions) =>
    svg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', o),
  check: (o?: IconOptions) =>
    svg('<path d="M20 6 9 17l-5-5"/>', o),
  file: (o?: IconOptions) =>
    svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>', o),
  folder: (o?: IconOptions) =>
    svg('<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>', o),
  folderOpen: (o?: IconOptions) =>
    svg('<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>', o),
  text: (o?: IconOptions) =>
    svg('<path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/>', o),
  panelLeft: (o?: IconOptions) =>
    svg('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>', o),
  search: (o?: IconOptions) =>
    svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', o),
  x: (o?: IconOptions) =>
    svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', o),
  sun: (o?: IconOptions) =>
    svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', o),
  moon: (o?: IconOptions) =>
    svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', o),
  monitor: (o?: IconOptions) =>
    svg('<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>', o),
  languages: (o?: IconOptions) =>
    svg('<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>', o),
  github: (o?: IconOptions) =>
    svg('<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>', o),
  arrowRight: (o?: IconOptions) =>
    svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', o),
  bookOpen: (o?: IconOptions) =>
    svg('<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>', o),
  list: (o?: IconOptions) =>
    svg('<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>', o),
  compass: (o?: IconOptions) =>
    svg('<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>', o),
  code: (o?: IconOptions) =>
    svg('<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>', o),
  palette: (o?: IconOptions) =>
    svg('<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>', o),
  zap: (o?: IconOptions) =>
    svg('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>', o),
  star: (o?: IconOptions) =>
    svg('<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>', o),
  layoutGrid: (o?: IconOptions) =>
    svg('<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>', o),
  listOrdered: (o?: IconOptions) =>
    svg('<path d="M10 12h11"/><path d="M10 18h11"/><path d="M10 6h11"/><path d="M4 10h2"/><path d="M4 6h1v4"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>', o),
  panelsTopLeft: (o?: IconOptions) =>
    svg('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>', o),
  chevronsDownUp: (o?: IconOptions) =>
    svg('<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>', o),
  chevronsRight: (o?: IconOptions) =>
    svg('<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>', o),
  moveLeft: (o?: IconOptions) =>
    svg('<path d="M6 8 2 12l4 4"/><path d="M2 12h20"/>', o),
  arrowUpRight: (o?: IconOptions) =>
    svg('<path d="M7 7h10v10"/><path d="M7 17 17 7"/>', o),
  sunMoon: (o?: IconOptions) =>
    svg('<path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>', o),
  heading: (o?: IconOptions) =>
    svg('<path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/>', o),
  tag: (o?: IconOptions) =>
    svg('<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>', o),
  keyboard: (o?: IconOptions) =>
    svg('<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>', o),
  gitFork: (o?: IconOptions) =>
    svg('<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>', o),
} as const;

export type IconName = keyof typeof Icon;
