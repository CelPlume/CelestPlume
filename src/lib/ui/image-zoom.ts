/**
 * CelestPlume Docs Kit — ImageZoom 组件（纯 TS，无框架）
 *
 * 渲染结构沿用上游的 `data-rmiz-*` 钩子（供运行时接管交互），外层容器改用
 * Plumest 的 `cpd-iz` 前缀类名。缩略图保留文档作者在 markdown 里写的
 * `style="zoom: N%"`：把图片包进非 flex 的容器后，`zoom` 才会真正按原始
 * 尺寸缩放（根因见 celestial-docs.css 的 `.cpd-iz` 说明）。
 *
 * 用法：该构建器由 markdown rehype 插件（src/lib/markdown/rehype-image-zoom.ts）
 * 消费，把文档正文里的每个 `<img>` 重写为可点击放大的预览组件。交互由
 * runtime 的 initImageZoom 接管。
 */

import { el, elSelf } from './html';

/** 由 markdown `<img>` 的 hast 节点转换而来 */
export interface ImageZoomOptions {
  src: string;
  alt?: string;
  /** 文档里的原始 style 字符串（通常含 `zoom: N%`） */
  style?: string;
  width?: string;
  height?: string;
  className?: string;
  loading?: string;
  /** 生成的唯一 id（供 dialog 的 aria-labelledby 引用） */
  id?: string;
  /** 图片自身带水平 auto 外边距（居中意图）时，居中整个容器 */
  center?: boolean;
}

// 上游 react-medium-image-zoom 的按钮图标（IEnlarge / ICompress）
const ZOOM_ICON = `<svg aria-hidden="true" data-rmiz-btn-zoom-icon fill="currentColor" focusable="false" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M 9 1 L 9 2 L 12.292969 2 L 2 12.292969 L 2 9 L 1 9 L 1 14 L 6 14 L 6 13 L 2.707031 13 L 13 2.707031 L 13 6 L 14 6 L 14 1 Z" /></svg>`;
const UNZOOM_ICON = `<svg aria-hidden="true" data-rmiz-btn-unzoom-icon fill="currentColor" focusable="false" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M 14.144531 1.148438 L 9 6.292969 L 9 3 L 8 3 L 8 8 L 13 8 L 13 7 L 9.707031 7 L 14.855469 1.851563 Z M 8 8 L 3 8 L 3 9 L 6.292969 9 L 1.148438 14.144531 L 1.851563 14.855469 L 7 9.707031 L 7 13 L 8 13 Z" /></svg>`;

let idCounter = 0;

/**
 * 把一张 `<img>` 重写为可点击放大的 ImageZoom 结构（HTML 字符串）。
 */
export function renderImageZoom(options: ImageZoomOptions): string {
  const {
    src,
    alt = '',
    style = '',
    width,
    height,
    className,
    loading,
    id = `cpd-iz-${++idCounter}`,
    center = false,
  } = options;

  const imgAttrs: Record<string, string> = {
    src,
    ...(alt ? { alt } : {}),
    ...(style ? { style } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(className ? { class: className } : {}),
    ...(loading ? { loading } : {}),
  };

  const modalImgId = `${id}-modal-img`;
  const zoomLabel = alt ? `Expand image: ${alt}` : 'Expand image';
  const unzoomLabel = 'Minimize image';

  const rootClass = center ? 'cpd-iz cpd-iz--center' : 'cpd-iz';

  return el('div', { class: rootClass, 'data-cpd-iz': '', id }, [
    // 缩略图（原始内容，仅包一层隔离 flex 上下文）
    el(
      'div',
      { 'data-rmiz-content': 'found' },
      elSelf('img', imgAttrs),
    ),
    // 幽灵层：覆盖图片的透明层 + 聚焦时可见的放大按钮
    el('div', { 'data-rmiz-ghost': '' }, [
      el(
        'button',
        { type: 'button', 'data-rmiz-btn-zoom': '', 'aria-label': zoomLabel },
        ZOOM_ICON,
      ),
    ]),
    // 预览对话框（原生 <dialog>，打开时进入 top-layer）
    el('dialog', {
      'data-rmiz-modal': '',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': modalImgId,
      class: 'cpd-iz-dialog',
    }, [
      elSelf('div', { 'data-rmiz-modal-overlay': 'hidden' }),
      el('div', { 'data-rmiz-modal-content': '' }, [
        elSelf('img', {
          'data-rmiz-modal-img': '',
          id: modalImgId,
          src,
          ...(alt ? { alt } : {}),
        }),
        el(
          'button',
          { type: 'button', 'data-rmiz-btn-unzoom': '', 'aria-label': unzoomLabel },
          UNZOOM_ICON,
        ),
      ]),
    ]),
  ]);
}
