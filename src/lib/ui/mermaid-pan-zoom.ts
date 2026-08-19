/**
 * Mermaid 图表缩放/平移控制器（自包含，无第三方依赖）。
 *
 * 实现参考：
 * - https://github.com/anvaka/panzoom —— Transform{x,y,scale} 模型、滚轮围绕光标缩放、
 *   指针拖动平移、requestAnimationFrame 批量应用、min/max 缩放夹取
 * - https://github.com/bumbu/svg-pan-zoom —— zoomIn()/zoomOut()/reset()/fit() 按钮 API、
 *   zoomScaleSensitivity 缩放灵敏度；以及「变换作用在 SVG 内部 <g> 上」的做法
 *
 * 关键：变换一律通过 SVG 原生 `transform="matrix(…)"` 作用到内容 `<g>`，
 * 不做 CSS transform 缩放外层 div —— CSS 缩放会把 SVG 栅格化成位图，
 * 放大后文字发糊；原生 <g> 变换始终以矢量重绘，任意缩放下都清晰。
 *
 * 坐标系：mermaid 输出 `<svg width="100%" viewBox="0 0 W H">`，内容在 viewBox
 * 用户坐标系内；此处 Transform 的单位就是 viewBox 单位，屏幕↔用户换算按
 * svg 的实际显示矩形做缩放。
 */

export interface PanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  /** 滚轮缩放灵敏度（svg-pan-zoom 风格，越小越缓；默认 0.2） */
  zoomScaleSensitivity?: number;
  /** 平移速度（1=1:1 跟随指针） */
  panSpeed?: number;
  onZoomChange?: (scale: number) => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface PanZoomApi {
  /** 以视口中心为锚点放大 */
  zoomIn(): void;
  /** 以视口中心为锚点缩小 */
  zoomOut(): void;
  /** 缩放到整个图表适配视口宽度（回到初始状态） */
  fit(): void;
  /** 缩放到整个图表同时适配视口宽与高（contain，居中；全屏用） */
  contain(): void;
  /** 恢复 scale=1 且图表与视口左上角对齐 */
  reset(): void;
  /** 以视口中心为锚点缩放到指定倍数 */
  zoomTo(scale: number): void;
  getScale(): number;
  /** 立即应用一次变换（把待处理的 rAF 帧同步落盘，供按钮点击后读取） */
  applyNow(): void;
  dispose(): void;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const SVG_NS = 'http://www.w3.org/2000/svg';

/** 把 svg 的所有子元素包进一个新 <g data-cpd-pz-g>，返回该 g（pan/zoom 作用目标） */
function wrapContentInGroup(svg: SVGSVGElement): SVGGElement {
  const existing = svg.querySelector<SVGGElement>('g[data-cpd-pz-g]');
  if (existing) return existing;
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('data-cpd-pz-g', '');
  while (svg.firstChild) g.appendChild(svg.firstChild);
  svg.appendChild(g);
  return g;
}

export function createMermaidPanZoom(
  viewport: HTMLElement,
  svg: SVGSVGElement,
  options: PanZoomOptions = {},
): PanZoomApi {
  const minZoom = options.minZoom ?? 0.5;
  const maxZoom = options.maxZoom ?? 8;
  const sensitivity = options.zoomScaleSensitivity ?? 0.2;
  const panSpeed = options.panSpeed ?? 1;
  const onZoomChange = options.onZoomChange;

  const g = wrapContentInGroup(svg);

  // viewBox 用户坐标系尺寸（无 viewBox 时退化为显示尺寸）
  const readUserSize = (): { w: number; h: number } => {
    const vb = svg.getAttribute('viewBox');
    if (vb) {
      const parts = vb.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) return { w: parts[2], h: parts[3] };
    }
    const w = svg.getAttribute('width');
    const h = svg.getAttribute('height');
    const fw = w ? Number.parseFloat(w) : 0;
    const fh = h ? Number.parseFloat(h) : 0;
    if (fw > 0 && fh > 0) return { w: fw, h: fh };
    const r = svg.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };

  const userSize = readUserSize();

  const transform: Transform = { x: 0, y: 0, scale: 1 };

  let dirty = false;
  let raf = 0;

  const applyTransform = (): void => {
    dirty = false;
    raf = 0;
    g.setAttribute('transform', `matrix(${transform.scale} 0 0 ${transform.scale} ${transform.x} ${transform.y})`);
  };

  const schedule = (): void => {
    if (dirty) return;
    dirty = true;
    raf = window.requestAnimationFrame(applyTransform);
  };

  // 屏幕坐标 → viewBox 用户坐标（按 svg 实际显示矩形换算，x/y 各取各自缩放比以兼容 letterbox）
  const toUser = (clientX: number, clientY: number): { x: number; y: number } => {
    const r = svg.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { x: 0, y: 0 };
    return {
      x: ((clientX - r.left) / r.width) * userSize.w,
      y: ((clientY - r.top) / r.height) * userSize.h,
    };
  };

  const viewportCenterUser = (): { x: number; y: number } => {
    const r = viewport.getBoundingClientRect();
    return toUser(r.left + r.width / 2, r.top + r.height / 2);
  };

  // 以用户坐标 (ux, uy) 为锚点缩放 ratio 倍：保持锚点下的图表坐标不漂移
  const zoomByRatioAt = (ux: number, uy: number, ratio: number): void => {
    const nextScale = clamp(transform.scale * ratio, minZoom, maxZoom);
    const effective = nextScale / transform.scale;
    if (effective === 1) return;
    transform.x = ux - effective * (ux - transform.x);
    transform.y = uy - effective * (uy - transform.y);
    transform.scale = nextScale;
    onZoomChange?.(transform.scale);
    schedule();
  };

  /* ---------------- 滚轮缩放（panzoom 的 onMouseWheel 公式） ---------------- */
  const onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey) return; // 交给浏览器原生页面缩放
    e.preventDefault();
    e.stopPropagation();
    let delta = e.deltaY;
    if (e.deltaMode > 0) delta *= 100;
    const deltaAdjusted = Math.min(0.25, Math.abs((sensitivity * delta) / 128));
    const ratio = 1 - Math.sign(delta) * deltaAdjusted;
    const p = toUser(e.clientX, e.clientY);
    zoomByRatioAt(p.x, p.y, ratio);
  };

  /* ---------------- 指针拖动（panzoom 的 onMouseDown/Move + handleTouchMove） ---------------- */
  let panning = false;
  let dragged = false; // 是否真的拖动过（用于放行点击：拖动不消费点击，原地点击可触发图中链接）
  let lastX = 0;
  let lastY = 0;

  const onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = toUser(e.clientX, e.clientY);
    lastX = p.x;
    lastY = p.y;
    panning = true;
    dragged = false;
    viewport.classList.add('is-panning');
    viewport.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!panning) return;
    const p = toUser(e.clientX, e.clientY);
    const dx = p.x - lastX;
    const dy = p.y - lastY;
    // 超过阈值才算「拖动」：才开始 preventDefault（避免拖动时选中文本/滚动），
    // 原地按下松开仍能触发图中链接点击
    if (!dragged && Math.hypot(dx, dy) > 1.5) {
      dragged = true;
      e.preventDefault();
    }
    if (dragged) {
      transform.x += dx * panSpeed;
      transform.y += dy * panSpeed;
      schedule();
    }
    lastX = p.x;
    lastY = p.y;
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    panning = false;
    viewport.classList.remove('is-panning');
  };

  /* ---------------- 按钮 API（svg-pan-zoom 风格） ---------------- */
  const zoomIn = (): void => {
    const c = viewportCenterUser();
    zoomByRatioAt(c.x, c.y, 1.25);
  };

  const zoomOut = (): void => {
    const c = viewportCenterUser();
    zoomByRatioAt(c.x, c.y, 0.8);
  };

  const zoomTo = (scale: number): void => {
    const c = viewportCenterUser();
    zoomByRatioAt(c.x, c.y, scale / transform.scale);
  };

  const reset = (): void => {
    transform.scale = 1;
    transform.x = 0;
    transform.y = 0;
    onZoomChange?.(1);
    schedule();
  };

  // 当前 scale=1（viewBox 100% 宽）即「适配视口宽度」的初始状态
  const fit = reset;

  // contain：同时适配宽高并居中（全屏弹层初始视图）。
  // 以内容 <g> 的包围盒为准（而非 svg 盒，后者含 mermaid 的留白），居中才精确；
  // 平移量必须换算回 viewBox 用户单位（÷viewBox 映射比 k），否则按视口像素
  // 计算的偏移会被 k 倍放大。
  const contain = (): void => {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (vw === 0 || vh === 0) return;
    transform.scale = 1;
    transform.x = 0;
    transform.y = 0;
    applyTransform();
    const box = g.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const svgRect = svg.getBoundingClientRect();
    const k = svgRect.width / userSize.w; // 每 user 单位对应的屏幕像素（viewBox 映射比）
    const boxW = box.width / k;
    const boxH = box.height / k;
    const boxLeft = (box.left - svgRect.left) / k;
    const boxTop = (box.top - svgRect.top) / k;
    const scale = clamp(Math.min(vw / box.width, vh / box.height), minZoom, maxZoom);
    transform.scale = scale;
    transform.x = (vw / k - boxW * scale) / 2 - boxLeft * scale;
    transform.y = (vh / k - boxH * scale) / 2 - boxTop * scale;
    onZoomChange?.(scale);
    schedule();
  };

  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);

  return {
    zoomIn,
    zoomOut,
    fit,
    contain,
    reset,
    zoomTo,
    getScale: () => transform.scale,
    applyNow: () => {
      if (raf) window.cancelAnimationFrame(raf);
      applyTransform();
    },
    dispose: () => {
      if (raf) window.cancelAnimationFrame(raf);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
