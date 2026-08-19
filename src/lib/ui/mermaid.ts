/**
 * 文档正文 Mermaid 图表客户端渲染 + 缩放/平移/复制工具栏。
 *
 * - 动态 import('mermaid')：静态引入会把 ~1.5MB 渲染引擎打进每个文档页的
 *   运行时 chunk，而多数页面根本没有图表；改在检测到 `.cpd-mermaid` 容器时才
 *   按需加载（mermaid 是运行期按内容决定的插件，无法静态瘦身）。
 * - 渲染后注入 `.cpd-mermaid-scene > svg`，由 createMermaidPanZoom 接管
 *   滚轮缩放 / 指针拖动平移 / 按钮 API。
 * - 工具栏（放大 / 缩小 / 适应宽度 / 复位 / 复制代码）收进一个 Dropdown 菜单，
 *   复用 Docs Kit 的 dropdown()/dropdownItem()；开合交互由全局 initDropdowns 的
 *   事件委托接管（动态注入的菜单无需重复挂载监听）。
 * - 深浅色主题跟随：监听 <html data-cpd-theme> 变化，重设 mermaid theme 后重渲染。
 *
 * 服务端配合：src/lib/markdown/remark-mermaid.ts 把 ```mermaid 代码块替换为
 * `<div class="cpd-mermaid" data-cpd-mermaid>` + 内嵌 JSON 源码。
 */

import { dropdown, dropdownItem, dropdownGroup, dropdownSeparator } from './components';
import { Icon } from './icons';
import { createMermaidPanZoom, type PanZoomApi } from './mermaid-pan-zoom';
import type { MermaidConfig, RenderResult } from 'mermaid';

/**
 * 运行期按需加载的渲染器最小接口（mermaid 未具名导出 Mermaid 接口本身，
 * 用已导出的 MermaidConfig / RenderResult 构造结构类型即可）。
 */
interface MermaidRenderer {
  initialize(config: MermaidConfig): void;
  render(id: string, text: string, container?: Element | null): Promise<RenderResult>;
}

interface MermaidInstanceState {
  source: string;
  viewport: HTMLElement;
  panzoom: PanZoomApi;
}

const state = new WeakMap<HTMLElement, MermaidInstanceState>();

let renderCounter = 0;

const isDark = (): boolean =>
  document.documentElement.getAttribute('data-cpd-theme') === 'dark';

const isZh = (): boolean =>
  document.documentElement.lang.toLowerCase().startsWith('zh');

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }
};

const mermaidConfig = (): MermaidConfig => ({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: isDark() ? 'dark' : 'default',
  fontFamily: 'inherit',
  flowchart: { htmlLabels: true, curve: 'basis' },
});

/* ---------------- 工具栏（Dropdown 菜单） ---------------- */

type ToolbarKey =
  | 'tools'
  | 'zoomIn'
  | 'zoomOut'
  | 'fit'
  | 'reset'
  | 'fullscreen'
  | 'fullscreenTitle'
  | 'copy'
  | 'copied';

const TOOLBAR_COPY: Record<'en' | 'zh', Record<ToolbarKey, string>> = {
  en: {
    tools: 'Diagram tools',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit to width',
    reset: 'Reset',
    fullscreen: 'Fullscreen',
    fullscreenTitle: 'Open diagram fullscreen',
    copy: 'Copy code',
    copied: 'Copied',
  },
  zh: {
    tools: '图表工具',
    zoomIn: '放大',
    zoomOut: '缩小',
    fit: '适应宽度',
    reset: '复位',
    fullscreen: '全屏',
    fullscreenTitle: '全屏查看图表',
    copy: '复制代码',
    copied: '已复制',
  },
};

const t = (key: ToolbarKey): string => TOOLBAR_COPY[isZh() ? 'zh' : 'en'][key];

type ToolbarAction = 'zoom-in' | 'zoom-out' | 'fit' | 'reset' | 'fullscreen' | 'copy';

function buildToolbar(
  source: string,
  api: PanZoomApi,
  onFullscreen: () => void,
): HTMLElement {
  const content = [
    dropdownItem({ label: t('zoomIn'), icon: Icon.zoomIn({ class: 'cpd-dropdown-item-icon' }) }),
    dropdownItem({ label: t('zoomOut'), icon: Icon.zoomOut({ class: 'cpd-dropdown-item-icon' }) }),
    dropdownItem({ label: t('fit'), icon: Icon.maximize({ class: 'cpd-dropdown-item-icon' }) }),
    dropdownItem({ label: t('reset'), icon: Icon.rotateCcw({ class: 'cpd-dropdown-item-icon' }) }),
    dropdownItem({ label: t('fullscreen'), icon: Icon.maximize2({ class: 'cpd-dropdown-item-icon' }) }),
    dropdownSeparator(),
    dropdownItem({ label: t('copy'), icon: Icon.copy({ class: 'cpd-dropdown-item-icon' }) }),
  ].join('');

  const toolbar = document.createElement('div');
  toolbar.className = 'cpd-mermaid-toolbar';
  toolbar.setAttribute('aria-label', t('tools'));
  toolbar.innerHTML = dropdown({
    trigger:
      Icon.layoutGrid({ class: 'cpd-dropdown-item-icon' }) +
      Icon.chevronDown({ class: 'cpd-mermaid-toolbar-caret' }),
    content: dropdownGroup(undefined, content),
    width: '200px',
    triggerClass: 'cpd-mermaid-toolbar-btn',
  });

  const actions: ToolbarAction[] = ['zoom-in', 'zoom-out', 'fit', 'reset', 'fullscreen', 'copy'];
  toolbar.querySelectorAll<HTMLElement>('[data-cpd-dropdown-item]').forEach((item, i) => {
    item.setAttribute('tabindex', '0');
    item.dataset.cpdMermaidAction = actions[i] ?? '';
  });

  toolbar.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-cpd-mermaid-action]');
    if (!item) return;
    const act = item.dataset.cpdMermaidAction;
    if (act === 'zoom-in') {
      api.zoomIn();
    } else if (act === 'zoom-out') {
      api.zoomOut();
    } else if (act === 'fit') {
      api.fit();
    } else if (act === 'reset') {
      api.reset();
    } else if (act === 'fullscreen') {
      onFullscreen();
    } else if (act === 'copy') {
      void copyText(source).then((ok) => {
        if (ok) flashCopied(item, t('copied'));
      });
    }
  });

  return toolbar;
}

function flashCopied(item: HTMLElement, copiedLabel: string): void {
  const labelEl = item.querySelector<HTMLElement>('.cpd-dropdown-item-label');
  const iconEl = item.querySelector<HTMLElement>('.cpd-dropdown-item-icon');
  const prevLabel = labelEl?.textContent ?? '';
  const prevIcon = iconEl?.innerHTML ?? '';
  if (labelEl) labelEl.textContent = copiedLabel;
  if (iconEl) iconEl.innerHTML = Icon.check({ class: 'cpd-dropdown-item-icon' });
  window.setTimeout(() => {
    if (labelEl) labelEl.textContent = prevLabel;
    if (iconEl) iconEl.innerHTML = prevIcon;
  }, 1200);
}

/* ---------------- 全屏弹层（交互与 ImageZoom 一致） ---------------- */

interface BodyAttrs {
  overflow: string;
  width: string;
}

function bodyScrollDisable(): BodyAttrs {
  const bodyStyle = document.body.style;
  const prev = { overflow: bodyStyle.overflow, width: bodyStyle.width };
  bodyStyle.overflow = 'hidden';
  bodyStyle.width = `${document.body.clientWidth}px`;
  return prev;
}

function bodyScrollEnable(prev: BodyAttrs): void {
  const bodyStyle = document.body.style;
  bodyStyle.width = prev.width;
  bodyStyle.overflow = prev.overflow;
}

/**
 * 把图表放到全屏 `<dialog>` 弹层里展示：深色遮罩 + 顶部关闭按钮 +
 * 滚轮缩放 / 拖动平移（独立 pan-zoom），Escape / 点遮罩 / 关闭按钮退出，
 * 打开期间锁定页面滚动 —— 交互与 ImageZoom 一致。
 */
async function openFullscreen(
  container: HTMLElement,
  mermaid: MermaidRenderer,
  source: string,
): Promise<void> {
  const dialog = document.createElement('dialog');
  dialog.className = 'cpd-mermaid-fs';
  dialog.setAttribute('aria-label', t('fullscreen'));

  const stage = document.createElement('div');
  stage.className = 'cpd-mermaid-fs-stage';

  const viewport = document.createElement('div');
  viewport.className = 'cpd-mermaid-fs-viewport cpd-mermaid-viewport';
  viewport.dataset.cpdMermaidViewport = '';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'cpd-mermaid-fs-close';
  closeBtn.setAttribute('aria-label', isZh() ? '关闭' : 'Close');
  closeBtn.title = isZh() ? '关闭' : 'Close';
  closeBtn.innerHTML = Icon.x({});

  stage.appendChild(viewport);
  dialog.append(closeBtn, stage);
  document.body.appendChild(dialog);

  const prevBody = bodyScrollDisable();
  let panzoom: PanZoomApi | null = null;

  const cleanup = (): void => {
    if (dialog.dataset.closed) return;
    dialog.dataset.closed = 'true';
    panzoom?.dispose();
    dialog.close();
    dialog.remove();
    bodyScrollEnable(prevBody);
  };

  closeBtn.addEventListener('click', cleanup);
  // 点遮罩关闭（图表区域内的点击交给 pan-zoom 平移，不关闭）
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || (e.target as HTMLElement).classList.contains('cpd-mermaid-fs-stage')) {
      cleanup();
    }
  });
  // 原生 <dialog> 在 Escape 时会先发 cancel 再发 close
  dialog.addEventListener('cancel', cleanup);
  dialog.addEventListener('close', cleanup);

  dialog.showModal();

  try {
    const { svg, bindFunctions } = await mermaid.render(`cpd-mermaid-fs-${renderCounter++}`, source);
    viewport.innerHTML = svg;
    bindFunctions?.(viewport);
    const svgEl = viewport.querySelector<SVGSVGElement>('svg');
    if (svgEl) {
      // 覆盖 mermaid 内联的 max-width（自然宽度封顶），全屏下铺满视口宽度
      svgEl.style.maxWidth = 'none';
      panzoom = createMermaidPanZoom(viewport, svgEl, {});
      panzoom.contain();
    }
  } catch {
    const errBox = document.createElement('div');
    errBox.className = 'cpd-mermaid-error-box';
    const head = document.createElement('p');
    head.className = 'cpd-mermaid-error-head';
    head.textContent = isZh() ? '图表渲染失败：' : 'Diagram failed to render:';
    const pre = document.createElement('pre');
    pre.className = 'cpd-mermaid-error-src';
    pre.textContent = source;
    errBox.append(head, pre);
    viewport.appendChild(errBox);
  }
}

/* ---------------- 渲染 ---------------- */

function extractSource(container: HTMLElement): string {
  const srcEl = container.querySelector<HTMLElement>('[data-cpd-mermaid-src]');
  if (!srcEl) return '';
  try {
    const parsed = JSON.parse(srcEl.textContent ?? '""');
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return '';
  }
}

async function renderDiagram(
  container: HTMLElement,
  mermaid: MermaidRenderer,
  sourceOverride?: string,
): Promise<void> {
  const source = sourceOverride ?? extractSource(container);
  if (!source) return;

  container.innerHTML = '';
  container.classList.add('cpd-mermaid-ready');

  const viewport = document.createElement('div');
  viewport.className = 'cpd-mermaid-viewport';
  viewport.dataset.cpdMermaidViewport = '';
  container.appendChild(viewport);

  try {
    const { svg, bindFunctions } = await mermaid.render(`cpd-mermaid-${renderCounter++}`, source);
    viewport.innerHTML = svg;
    bindFunctions?.(viewport);
  } catch {
    container.classList.add('cpd-mermaid-error');
    const errBox = document.createElement('div');
    errBox.className = 'cpd-mermaid-error-box';
    const head = document.createElement('p');
    head.className = 'cpd-mermaid-error-head';
    head.textContent = isZh() ? '图表渲染失败：' : 'Diagram failed to render:';
    const pre = document.createElement('pre');
    pre.className = 'cpd-mermaid-error-src';
    pre.textContent = source;
    errBox.append(head, pre);
    viewport.appendChild(errBox);
    return;
  }

  const svgEl = viewport.querySelector<SVGSVGElement>('svg');
  if (!svgEl) return;

  const panzoom = createMermaidPanZoom(viewport, svgEl, {});
  state.set(container, { source, viewport, panzoom });
  container.appendChild(
    buildToolbar(source, panzoom, () => void openFullscreen(container, mermaid, source)),
  );
}

/** 主题变化 → 重设 mermaid theme 并重渲染该图（保留容器，重建视口/工具栏） */
function watchTheme(container: HTMLElement, mermaid: MermaidRenderer): void {
  if (container.dataset.cpdMermaidThemeWatched) return;
  container.dataset.cpdMermaidThemeWatched = 'true';
  const observer = new MutationObserver(() => {
    if (!container.isConnected) return;
    // 首次渲染后源码脚本已被清空，重渲染时从状态里复用源码
    const prev = state.get(container);
    prev?.panzoom.dispose();
    state.delete(container);
    mermaid.initialize(mermaidConfig());
    void renderDiagram(container, mermaid, prev?.source);
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-cpd-theme'],
  });
}

export async function initMermaidDiagrams(root: ParentNode = document): Promise<void> {
  const containers = Array.from(root.querySelectorAll<HTMLElement>('[data-cpd-mermaid]'));
  if (containers.length === 0) return;

  // 运行期按内容决定是否加载 mermaid（见文件头注释）：
  // 静态 import 会把整个渲染引擎打进所有文档页 chunk，这里按需动态加载。
  const mod = await import('mermaid');
  const mermaid = mod.default as MermaidRenderer;
  mermaid.initialize(mermaidConfig());

  for (const container of containers) {
    if (container.dataset.cpdMermaidReady) continue;
    container.dataset.cpdMermaidReady = 'true';
    void renderDiagram(container, mermaid);
    watchTheme(container, mermaid);
  }
}
