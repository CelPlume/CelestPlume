/**
 * CelestPlume Docs Kit — SVG 渲染原语（纯 TS）
 *
 * lucide 风格线条图标（24×24、stroke=currentColor、stroke-width=2）。
 * 每个图标单独一个文件（src/lib/ui/icons/<name>.ts），统一经本函数渲染；
 * 通过 `class` 控制尺寸，颜色继承 currentColor。
 */

export interface IconOptions {
  class?: string;
  'stroke-width'?: number;
}

export function svg(paths: string, options?: IconOptions): string {
  const strokeWidth = options?.['stroke-width'] ?? 2;
  const cls = options?.class;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"` +
    (cls ? ` class="${cls}"` : '') +
    ` aria-hidden="true" focusable="false">${paths}</svg>`
  );
}
