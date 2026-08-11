/**
 * CelestPlume Docs Kit — ImageZoom 客户端运行时（纯 TS，无框架）
 *
 * 1:1 复刻 react-medium-image-zoom的交互：
 * - 点击缩略图 / 聚焦放大按钮 → 打开原生 <dialog>，图片从缩略图位置平滑
 *   过渡到视口居中
 * - 点击图片 / 缩小按钮 / 背景 / Esc / 滚轮 / 下滑手势 → 收起并过渡回原位
 * - 打开期间锁定 body 滚动；支持 prefers-reduced-motion（关闭过渡）
 *
 * 定位与缩放算法忠实移植自上游 utils（getScale / getImgObjectFitStyle /
 * getModalImgTransform 等）。
 */

interface ImageZoomElements {
  root: HTMLElement;
  thumbImg: HTMLImageElement;
  zoomBtn: HTMLButtonElement;
  dialog: HTMLDialogElement;
  overlay: HTMLElement;
  modalContent: HTMLElement;
  modalImg: HTMLImageElement;
  unzoomBtn: HTMLButtonElement;
}

/** 缩放边距（px），对应上游 zoomMargin 默认 0 */
const ZOOM_MARGIN = 0;
/** 下滑手势判定阈值（px），对应上游 swipeToUnzoomThreshold 默认 10 */
const SWIPE_THRESHOLD = 10;

/* ============================================================
   定位 / 缩放算法（移植自 react-medium-image-zoom/src/utils）
   ============================================================ */

interface Rect {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface ModalImgPosition extends Rect {
  initialTransform: string;
}

function getScaleToWindow(height: number, offset: number, width: number): number {
  return Math.min(
    (window.innerWidth - offset * 2) / width,
    (window.innerHeight - offset * 2) / height,
  );
}

function getScaleToWindowMax(
  containerHeight: number,
  containerWidth: number,
  offset: number,
  targetHeight: number,
  targetWidth: number,
): number {
  const scale = getScaleToWindow(targetHeight, offset, targetWidth);
  const ratio =
    targetWidth > targetHeight ? targetWidth / containerWidth : targetHeight / containerHeight;
  return scale > 1 ? ratio : scale * ratio;
}

function getScale(
  containerHeight: number,
  containerWidth: number,
  offset: number,
  targetHeight: number,
  targetWidth: number,
): number {
  if (containerHeight === 0 || containerWidth === 0) return 1;
  return targetHeight !== 0 && targetWidth !== 0
    ? getScaleToWindowMax(containerHeight, containerWidth, offset, targetHeight, targetWidth)
    : getScaleToWindow(containerHeight, offset, containerWidth);
}

/**
 * `<img>` 的定位计算（上游 getImgObjectFitStyle 的 'fill' 分支，即缩略图默认
 * object-fit: fill 的情况——我们的 markdown 图片均为此情形）。
 */
function getImgObjectFitStyle(
  container: Rect,
  offset: number,
  targetHeight: number,
  targetWidth: number,
): ModalImgPosition {
  const widthRatio = container.width / targetWidth;
  const heightRatio = container.height / targetHeight;
  const ratio = Math.max(widthRatio, heightRatio);

  const scale = getScale(
    targetHeight * ratio,
    targetWidth * ratio,
    offset,
    targetHeight,
    targetWidth,
  );

  return {
    top: container.top,
    left: container.left,
    width: container.width * scale,
    height: container.height * scale,
    initialTransform: `translate(0,0) scale(${1 / scale})`,
  };
}

function getModalImgTransform(
  position: ModalImgPosition,
  isZoomed: boolean,
): string {
  const { initialTransform, left, top, width, height } = position;
  if (!isZoomed) return initialTransform;

  const viewportX = window.innerWidth / 2;
  const viewportY = window.innerHeight / 2;
  const childCenterX = left + width / 2;
  const childCenterY = top + height / 2;

  return `translate(${viewportX - childCenterX}px,${viewportY - childCenterY}px) scale(1)`;
}

interface ModalImgStyle {
  top: number;
  left: number;
  width: number;
  height: number;
  transform: string;
}

/** 计算 modal img 在指定缩放状态下的样式 */
function getModalImgStyle(
  thumb: HTMLImageElement,
  isZoomed: boolean,
): ModalImgStyle {
  const rect = thumb.getBoundingClientRect();
  const targetWidth = thumb.naturalWidth || rect.width;
  const targetHeight = thumb.naturalHeight || rect.height;

  const position = getImgObjectFitStyle(rect, ZOOM_MARGIN, targetHeight, targetWidth);

  return {
    top: position.top,
    left: position.left,
    width: position.width,
    height: position.height,
    transform: getModalImgTransform(position, isZoomed),
  };
}

/* ============================================================
   body 滚动锁定（移植自上游 bodyScrollDisable / Enable）
   ============================================================ */

interface BodyAttrs {
  overflow: string;
  width: string;
}

const DEFAULT_BODY_ATTRS: BodyAttrs = { overflow: '', width: '' };

function bodyScrollDisable(): BodyAttrs {
  const bodyStyle = document.body.style;
  const clientWidth = document.body.clientWidth;
  const old = {
    overflow: bodyStyle.overflow,
    width: bodyStyle.width,
  };
  bodyStyle.overflow = 'hidden';
  bodyStyle.width = `${clientWidth}px`;
  return old;
}

function bodyScrollEnable(prev: BodyAttrs): void {
  const bodyStyle = document.body.style;
  bodyStyle.width = prev.width;
  bodyStyle.overflow = prev.overflow;
}

/* ============================================================
   单实例控制器
   ============================================================ */

class ImageZoomController {
  private readonly els: ImageZoomElements;
  private open = false;
  private closing = false;
  private prevBodyAttrs: BodyAttrs = { ...DEFAULT_BODY_ATTRS };
  private touchYStart?: number;
  private touchYEnd?: number;
  private transitionTimer?: number;
  private readonly onTransitionEnd = (): void => {
    if (this.closing) {
      this.closeDialog();
    }
  };
  private readonly onResize = (): void => {
    if (this.open) {
      this.applyStyle(true);
    }
  };
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.unzoom();
    }
  };
  private readonly onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey || !this.open) return;
    const browserScale = window.visualViewport?.scale ?? 1;
    if (browserScale > 1) return;
    e.stopPropagation();
    queueMicrotask(() => this.unzoom());
  };
  private readonly onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length > 1) return;
    const touch = e.changedTouches[0];
    if (e.changedTouches.length === 1 && touch) {
      this.touchYStart = touch.screenY;
    }
  };
  private readonly onTouchMove = (e: TouchEvent): void => {
    const browserScale = window.visualViewport?.scale ?? 1;
    const touch = e.changedTouches[0];
    if (
      this.open &&
      browserScale <= 1 &&
      this.touchYStart != null &&
      touch
    ) {
      this.touchYEnd = touch.screenY;
      const delta = Math.abs(
        Math.max(this.touchYStart, this.touchYEnd) -
          Math.min(this.touchYStart, this.touchYEnd),
      );
      if (delta > SWIPE_THRESHOLD) {
        this.touchYStart = undefined;
        this.touchYEnd = undefined;
        this.unzoom();
      }
    }
  };
  private readonly onTouchEnd = (): void => {
    this.touchYStart = undefined;
    this.touchYEnd = undefined;
  };

  constructor(els: ImageZoomElements) {
    this.els = els;
    const { thumbImg, zoomBtn, unzoomBtn, dialog, modalImg } = els;
    thumbImg.addEventListener('click', this.zoom);
    zoomBtn.addEventListener('click', this.zoom);
    unzoomBtn.addEventListener('click', this.handleUnzoomBtnClick);
    modalImg.addEventListener('click', this.unzoom);
    dialog.addEventListener('click', this.handleDialogClick);
    modalImg.addEventListener('transitionend', this.onTransitionEnd);
  }

  private readonly zoom = (e: Event): void => {
    if (this.open) return;
    e.preventDefault();
    e.stopPropagation();
    this.open = true;
    this.closing = false;
    this.prevBodyAttrs = bodyScrollDisable();

    // 先把 modal img 定位到缩略图原位（未放大），再 showModal 并过渡到居中
    this.applyStyle(false);
    this.els.dialog.showModal();
    this.els.overlay.setAttribute('data-rmiz-modal-overlay', 'visible');

    // 强制重排后切到放大态，触发 CSS transform 过渡
    void this.els.modalImg.offsetHeight;
    this.applyStyle(true);

    window.addEventListener('resize', this.onResize);
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
    document.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('wheel', this.onWheel, { passive: true });
  };

  private readonly unzoom = (): void => {
    if (!this.open) return;
    this.closing = true;
    this.applyStyle(false);
    this.els.overlay.setAttribute('data-rmiz-modal-overlay', 'hidden');

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchcancel', this.onTouchEnd);
    document.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('wheel', this.onWheel);

    // 过渡结束后关闭 dialog（Safari 可能延迟触发，附兜底定时器）
    this.ensureTransitionEnd();
  };

  private readonly handleUnzoomBtnClick = (e: MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    this.unzoom();
  };

  private readonly handleDialogClick = (e: MouseEvent): void => {
    const target = e.target;
    if (target === this.els.modalContent || target === this.els.modalImg) {
      e.stopPropagation();
      this.unzoom();
    }
  };

  private readonly applyStyle = (isZoomed: boolean): void => {
    const style = getModalImgStyle(this.els.thumbImg, isZoomed);
    const el = this.els.modalImg;
    el.style.top = `${style.top}px`;
    el.style.left = `${style.left}px`;
    el.style.width = `${style.width}px`;
    el.style.height = `${style.height}px`;
    el.style.transform = style.transform;
  };

  private readonly ensureTransitionEnd = (): void => {
    const td = window.getComputedStyle(this.els.modalImg).transitionDuration;
    const tdFloat = parseFloat(td);
    if (tdFloat !== 0 && !Number.isNaN(tdFloat)) {
      const tdMs = tdFloat * (td.endsWith('ms') ? 1 : 1000) + 50;
      clearTimeout(this.transitionTimer);
      this.transitionTimer = window.setTimeout(this.onTransitionEnd, tdMs);
    } else {
      this.closeDialog();
    }
  };

  private readonly closeDialog = (): void => {
    if (!this.open) return;
    this.open = false;
    this.closing = false;
    this.els.dialog.close();
    bodyScrollEnable(this.prevBodyAttrs);
  };
}

/* ============================================================
   初始化
   ============================================================ */

// 与构建器 renderImageZoom 相同的按钮图标（上游 react-medium-image-zoom）
const ZOOM_ICON = `<svg aria-hidden="true" data-rmiz-btn-zoom-icon fill="currentColor" focusable="false" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M 9 1 L 9 2 L 12.292969 2 L 2 12.292969 L 2 9 L 1 9 L 1 14 L 6 14 L 6 13 L 2.707031 13 L 13 2.707031 L 13 6 L 14 6 L 14 1 Z" /></svg>`;
const UNZOOM_ICON = `<svg aria-hidden="true" data-rmiz-btn-unzoom-icon fill="currentColor" focusable="false" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M 14.144531 1.148438 L 9 6.292969 L 9 3 L 8 3 L 8 8 L 13 8 L 13 7 L 9.707031 7 L 14.855469 1.851563 Z M 8 8 L 3 8 L 3 9 L 6.292969 9 L 1.148438 14.144531 L 1.851563 14.855469 L 7 9.707031 L 7 13 L 8 13 Z" /></svg>`;

let wrapIdCounter = 0;

/** 行内容器（与 rehype 插件保持一致） */
const INLINE_CONTAINERS = new Set([
  'a', 'span', 'em', 'strong', 'code', 'label', 'button', 'small', 'abbr',
  'sub', 'sup', 'b', 'i', 'u', 'mark',
]);

/** 判断图片是否应包裹：链接图/行内混排图不包裹，保持行内 */
function isStandaloneImg(img: HTMLImageElement): boolean {
  if (img.closest('a')) return false;
  const parent = img.parentElement;
  if (!parent) return false;
  const tag = parent.tagName.toLowerCase();
  if (INLINE_CONTAINERS.has(tag)) {
    for (const n of parent.childNodes) {
      if (n === img) continue;
      if (n.nodeType === Node.TEXT_NODE) {
        if ((n.textContent ?? '').trim()) return false;
        continue;
      }
      return false;
    }
  }
  return true;
}

/** 图片是否有水平 auto 外边距（居中意图） */
function hasCenterIntent(img: HTMLImageElement): boolean {
  const style = img.getAttribute('style') ?? '';
  if (style) {
    const normalized = style.replace(/\s+/g, '').toLowerCase();
    if (
      normalized.includes('margin-left:auto') ||
      normalized.includes('margin-right:auto') ||
      /margin:0?auto/.test(normalized)
    ) {
      return true;
    }
  }
  const cs = getComputedStyle(img);
  return cs.marginLeft === 'auto' || cs.marginRight === 'auto';
}

/** 在 img 原位置构建 .cpd-iz 结构并把 img 移入其中 */
function wrapImage(img: HTMLImageElement): HTMLElement | null {
  const parent = img.parentElement;
  if (!parent || parent.closest('[data-cpd-iz]')) return null;

  const id = `cpd-iz-c-${++wrapIdCounter}`;
  const modalImgId = `${id}-modal-img`;
  const alt = img.alt || '';
  const zoomLabel = alt ? `Expand image: ${alt}` : 'Expand image';
  const center = hasCenterIntent(img);

  const root = document.createElement('div');
  root.className = center ? 'cpd-iz cpd-iz--center' : 'cpd-iz';
  root.dataset.cpdIz = '';
  root.id = id;

  const content = document.createElement('div');
  content.dataset.rmizContent = 'found';
  parent.replaceChild(root, img);
  content.appendChild(img);
  root.appendChild(content);

  const ghost = document.createElement('div');
  ghost.dataset.rmizGhost = '';
  const zoomBtn = document.createElement('button');
  zoomBtn.type = 'button';
  zoomBtn.dataset.rmizBtnZoom = '';
  zoomBtn.setAttribute('aria-label', zoomLabel);
  zoomBtn.innerHTML = ZOOM_ICON;
  ghost.appendChild(zoomBtn);
  root.appendChild(ghost);

  const dialog = document.createElement('dialog');
  dialog.dataset.rmizModal = '';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', modalImgId);
  dialog.className = 'cpd-iz-dialog';

  const overlay = document.createElement('div');
  overlay.dataset.rmizModalOverlay = 'hidden';
  dialog.appendChild(overlay);

  const modalContent = document.createElement('div');
  modalContent.dataset.rmizModalContent = '';
  const modalImg = document.createElement('img');
  modalImg.dataset.rmizModalImg = '';
  modalImg.id = modalImgId;
  modalImg.src = img.src;
  if (alt) modalImg.alt = alt;
  const unzoomBtn = document.createElement('button');
  unzoomBtn.type = 'button';
  unzoomBtn.dataset.rmizBtnUnzoom = '';
  unzoomBtn.setAttribute('aria-label', 'Minimize image');
  unzoomBtn.innerHTML = UNZOOM_ICON;
  modalContent.append(modalImg, unzoomBtn);
  dialog.appendChild(modalContent);

  root.appendChild(dialog);
  return root;
}

/** 把正文里尚未包裹的 `<img>`（如 .md 内容）包装为 ImageZoom 结构 */
function wrapUnwrappedImages(root: ParentNode): void {
  const imgs = root.querySelectorAll<HTMLImageElement>(
    '.cpd-article img, .cpd-md-content img, .sl-markdown-content img',
  );
  imgs.forEach((img) => {
    if (img.closest('[data-cpd-iz]')) return;
    if (img.hasAttribute('data-rmiz-modal-img')) return;
    if (img.getAttribute('aria-hidden') === 'true') return;
    if (!isStandaloneImg(img)) return;
    wrapImage(img);
  });
}

function collectElements(root: HTMLElement): ImageZoomElements | null {
  const thumbImg = root.querySelector<HTMLImageElement>('[data-rmiz-content] img');
  const zoomBtn = root.querySelector<HTMLButtonElement>('[data-rmiz-btn-zoom]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-rmiz-modal]');
  const overlay = dialog?.querySelector<HTMLElement>('[data-rmiz-modal-overlay]') ?? null;
  const modalContent = dialog?.querySelector<HTMLElement>('[data-rmiz-modal-content]') ?? null;
  const modalImg = dialog?.querySelector<HTMLImageElement>('[data-rmiz-modal-img]') ?? null;
  const unzoomBtn = dialog?.querySelector<HTMLButtonElement>('[data-rmiz-btn-unzoom]') ?? null;

  if (!thumbImg || !zoomBtn || !dialog || !overlay || !modalContent || !modalImg || !unzoomBtn) return null;
  return { root, thumbImg, zoomBtn, dialog, overlay, modalContent, modalImg, unzoomBtn };
}

/**
 * 初始化页面内全部 ImageZoom 组件。可重复调用（已初始化的跳过）。
 */
export function initImageZoom(root: ParentNode = document): void {
  // 把 .md 等未经 rehype 包装的正文图片也包进 ImageZoom（修复 zoom 缩放 + 预览）
  wrapUnwrappedImages(root);

  root.querySelectorAll<HTMLElement>('[data-cpd-iz]').forEach((el) => {
    if (el.dataset.cpdIzReady === 'true') return;
    const els = collectElements(el);
    if (!els) return;
    new ImageZoomController(els);
    el.dataset.cpdIzReady = 'true';
  });
}
