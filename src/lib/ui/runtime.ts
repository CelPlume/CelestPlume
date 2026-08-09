/**
 * CelestPlume Docs Kit — 客户端运行时（纯 TS，无框架）
 *
 * 通过事件委托与 `data-cpd-*` 钩子接管构建器输出的静态 HTML：
 * - 侧边栏：折叠分组 / 桌面折叠 / 移动端抽屉 / 激活项滚动可见
 * - ClerkTOC：连接线与轨道测量（ResizeObserver）、激活检测（IntersectionObserver）
 * - Tabs / Accordions / 复制按钮 / 标题锚点复制 / 主题切换
 *
 * 用法：`initCelestialUI()` 一次性初始化；返回 dispose 函数供清理。
 */

import { getLineOffset } from './toc';
import { applyTheme, resolveInitialTheme, type CpdThemeMode } from './tokens';
import { Icon } from './icons';

const SVG_NS = 'http://www.w3.org/2000/svg';

function isElement(node: EventTarget | null): node is Element {
  return node instanceof Element;
}

function closest<T extends Element>(node: Element, selector: string): T | null {
  return node.closest<T>(selector);
}

/* ============================================================
   通用工具
   ============================================================ */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 非安全上下文回退
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      return true;
    } catch {
      return false;
    }
  }
}

function swapIcon(button: HTMLElement, showCheck: boolean): void {
  const svg = button.querySelector('svg');
  if (!svg) return;
  const current = showCheck ? Icon.check({ class: svg.getAttribute('class') ?? undefined }) : '';
  const html = showCheck
    ? current
    : (button.getAttribute('data-cpd-original-icon') ?? '');
  if (showCheck) {
    if (!button.hasAttribute('data-cpd-original-icon')) {
      button.setAttribute('data-cpd-original-icon', svg.outerHTML);
    }
    svg.outerHTML = current;
  } else if (html) {
    svg.outerHTML = html;
    button.removeAttribute('data-cpd-original-icon');
  }
}

function flashCopyButton(button: HTMLElement): void {
  swapIcon(button, true);
  window.setTimeout(() => swapIcon(button, false), 1600);
}

/* ============================================================
   Sidebar
   ============================================================ */

function initSidebar(root: ParentNode): void {
  const sidebarRoot = root.querySelector<HTMLElement>('[data-cpd-sidebar-root]');
  if (!sidebarRoot) return;

  const desktop = sidebarRoot.querySelector<HTMLElement>('#cpd-sidebar');
  const drawer = sidebarRoot.querySelector<HTMLElement>('[data-cpd-drawer]');
  const drawerContent = drawer?.querySelector<HTMLElement>('[data-cpd-drawer-content]');

  // 抽屉内容：克隆桌面端侧边栏（避免重复渲染导航树）
  if (desktop && drawerContent) {
    const clone = desktop.querySelector('.cpd-sidebar-inner')?.cloneNode(true) as HTMLElement | null;
    if (clone) drawerContent.appendChild(clone);
  }

  const setDrawer = (open: boolean) => {
    drawer?.setAttribute('data-cpd-open', open ? 'true' : 'false');
  };

  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    // 折叠分组
    const toggle = closest<HTMLElement>(target, '[data-cpd-folder-toggle]');
    if (toggle && sidebarRoot.contains(toggle)) {
      const folder = closest<HTMLElement>(toggle, '[data-cpd-folder]');
      if (folder) {
        const open = folder.getAttribute('data-cpd-open') !== 'true';
        folder.setAttribute('data-cpd-open', open ? 'true' : 'false');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      return;
    }

    // 桌面折叠 / 展开（同时标记 sidebar-root：文档页无 .cpd-layout，靠 root 状态折叠）
    if (target.closest('[data-cpd-collapse]')) {
      const layout = closest<HTMLElement>(target, '.cpd-layout');
      const rootEl = desktop?.closest<HTMLElement>('[data-cpd-sidebar-root]');
      const collapsed = desktop?.getAttribute('data-cpd-collapsed') !== 'true';
      desktop?.setAttribute('data-cpd-collapsed', collapsed ? 'true' : 'false');
      rootEl?.setAttribute('data-cpd-collapsed', collapsed ? 'true' : 'false');
      layout?.setAttribute('data-cpd-collapsed', collapsed ? 'true' : 'false');
      return;
    }
    if (target.closest('[data-cpd-expand]')) {
      const layout = closest<HTMLElement>(target, '.cpd-layout');
      const rootEl = desktop?.closest<HTMLElement>('[data-cpd-sidebar-root]');
      desktop?.setAttribute('data-cpd-collapsed', 'false');
      rootEl?.setAttribute('data-cpd-collapsed', 'false');
      layout?.setAttribute('data-cpd-collapsed', 'false');
      return;
    }

    // 移动端抽屉：打开（页头触发）、关闭（overlay / 链接点击）
    if (target.closest('[data-cpd-drawer-trigger]')) {
      setDrawer(true);
      return;
    }
    if (target.closest('[data-cpd-drawer-overlay]')) {
      setDrawer(false);
      return;
    }
    if (drawer?.contains(target) && closest<HTMLElement>(target, 'a[href]')) {
      setDrawer(false);
    }
  });

  root.addEventListener('keydown', (event: Event) => {
    if ((event as KeyboardEvent).key === 'Escape') setDrawer(false);
  });
}

/* ============================================================
   ClerkTOC — 轨道测量 + 激活检测
   ============================================================ */

interface TrackMeasure {
  width: number;
  height: number;
  d: string;
  positions: [top: number, bottom: number, x: number][];
  stepped: boolean[];
}

/** 生成连接线 path（默认样式：深度变化用三次贝塞尔过渡，clerk 用直线） */
function buildPath(positions: [top: number, bottom: number, x: number][], curve = true): string {
  let d = '';
  for (let i = 0; i < positions.length; i++) {
    const [top, bottom, x] = positions[i];
    if (i === 0) {
      d += `M${x} ${top} L${x} ${bottom}`;
    } else {
      const [, upperBottom, upperX] = positions[i - 1];
      d += curve
        ? ` C${upperX} ${top - 4} ${x} ${upperBottom + 4} ${x} ${top} L${x} ${bottom}`
        : ` L ${upperX} ${upperBottom} ${x} ${top} L${x} ${bottom}`;
    }
  }
  return d;
}

function measureToc(items: HTMLElement[]): TrackMeasure {
  let w = 0;
  let h = 0;
  const positions: [top: number, bottom: number, x: number][] = [];

  for (const element of items) {
    const depth = Number(element.getAttribute('data-depth') ?? 2);
    const x = getLineOffset(depth) + 0.5;
    // 整条 item 高度（含 padding），与服务端淡线（item svg 从顶部画到底部）完全对齐，
    // 保证主色路径到达轮廓最顶部/最底部
    const top = element.offsetTop;
    const bottom = element.offsetTop + element.clientHeight;
    w = Math.max(x + 8, w);
    h = Math.max(h, bottom);
    positions.push([top, bottom, x]);
  }

  const d = buildPath(positions);

  return { width: w, height: h, d, positions, stepped: items.map((el) => el.hasAttribute('data-step')) };
}

function renderTrack(container: HTMLElement, measure: TrackMeasure): void {
  const track = container.querySelector<HTMLElement>('[data-cpd-toc-track]');
  if (!track) return;

  const stepGroups = measure.positions
    .map(([top, bottom, x], i) => {
      if (!measure.stepped[i]) return '';
      return (
        `<g transform="translate(${x}, ${(top + bottom) / 2})">` +
        `<circle cx="0" cy="0" r="8" class="cpd-toc-track-step-circle"/>` +
        `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" class="cpd-toc-track-step-text">` +
        `${i + 1}</text></g>`
      );
    })
    .join('');

  const svg =
    `<svg class="cpd-toc-track-svg" xmlns="${SVG_NS}" viewBox="0 0 ${measure.width} ${measure.height}" aria-hidden="true">` +
    `<path d="${measure.d}" class="cpd-toc-track-path"/>${stepGroups}</svg>`;

  track.innerHTML = svg;
  track.style.width = `${measure.width}px`;
  track.style.height = `${measure.height}px`;
}

function initToc(root: ParentNode): void {
  const toc = root.querySelector<HTMLElement>('[data-cpd-toc]');
  if (!toc) return;

  const container = toc.querySelector<HTMLElement>('[data-cpd-toc-items]');
  if (!container) return;

  const scrollArea = toc.querySelector<HTMLElement>('[data-cpd-toc-scroll]');
  const itemEls = () => Array.from(container.querySelectorAll<HTMLElement>('[data-cpd-toc-item]'));
  let measure: TrackMeasure | null = null;
  let intersectionObserver: IntersectionObserver | null = null;

  const applyActive = (items: { id: string; active: boolean }[]): void => {
    const activeEls = itemEls();
    const active = items.filter((item) => item.active);
    if (active.length === 0) return;

    const startIdx = activeEls.findIndex((el) => el.getAttribute('href') === `#${active[0].id}`);
    const endIdx = activeEls.findIndex(
      (el) => el.getAttribute('href') === `#${active[active.length - 1].id}`,
    );
    if (startIdx === -1 || !measure) return;

    const track = container.querySelector<HTMLElement>('[data-cpd-toc-track]');
    if (!track) return;

    track.style.setProperty('--cpd-track-top', `${measure.positions[startIdx][0]}px`);
    track.style.setProperty('--cpd-track-bottom', `${measure.positions[endIdx][1]}px`);
  };

  const onMeasure = (): void => {
    const items = itemEls();
    if (items.length === 0) return;
    measure = measureToc(items);
    renderTrack(container, measure);
  };

  // 初始测量 + 尺寸变化重测
  onMeasure();
  if ('ResizeObserver' in window) {
    new ResizeObserver(onMeasure).observe(container);
  }

  // 激活检测（Observer 移植：threshold 0.9 + 无激活时回退最近顶部）
  const observerItems: { id: string; active: boolean; t: number }[] = [];
  for (const el of itemEls()) {
    const href = el.getAttribute('href');
    const id = href?.startsWith('#') ? href.slice(1) : null;
    if (id) observerItems.push({ id, active: false, t: 0 });
  }

  const handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    if (entries.length === 0) return;

    let hasActive = false;
    const updated = observerItems.map((item) => {
      const entry = entries.find((e) => e.target.id === item.id);
      const active = entry ? entry.isIntersecting : item.active;
      const next = { ...item, active, t: active && item.active !== active ? Date.now() : item.t };
      if (active) hasActive = true;
      return next;
    });

    // 回退：无任何标题在视口内时，选中最接近视口顶部的标题
    if (!hasActive && entries[0].rootBounds) {
      const viewTop = entries[0].rootBounds.top;
      let min = Number.MAX_VALUE;
      let fallbackIdx = -1;
      for (let i = 0; i < updated.length; i++) {
        const element = document.getElementById(updated[i].id);
        if (!element) continue;
        const d = Math.abs(viewTop - element.getBoundingClientRect().top);
        if (d < min) {
          fallbackIdx = i;
          min = d;
        }
      }
      if (fallbackIdx !== -1) {
        updated[fallbackIdx] = { ...updated[fallbackIdx], active: true, t: Date.now() };
      }
    }

    // 同步 DOM
    for (const item of updated) {
      const anchor = container.querySelector<HTMLElement>(`a[href="#${item.id}"]`);
      anchor?.setAttribute('data-cpd-active', item.active ? 'true' : 'false');
    }

    const changed = updated.some((item, i) => observerItems[i]?.active !== item.active);
    observerItems.splice(0, observerItems.length, ...updated);
    if (changed) applyActive(updated);

    // 激活项自动滚动可见（滚动真实滚动容器，避免带动窗口）
    const activeItem = [...updated].sort((a, b) => b.t - a.t)[0];
    if (activeItem && scrollArea) {
      const anchor = container.querySelector<HTMLElement>(`a[href="#${activeItem.id}"]`);
      if (anchor) {
        // 优先使用实际可滚动的祖先（文档页 TOC 在固定壳内滚动）
        let node: HTMLElement | null = scrollArea;
        while (node && node !== document.body && node !== document.documentElement) {
          if (node.scrollHeight > node.clientHeight) break;
          node = node.parentElement;
        }
        const scroller = node ?? scrollArea;
        const areaRect = scroller.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const target =
          scroller.scrollTop + anchorRect.top - areaRect.top - (areaRect.height - anchorRect.height) / 2;
        scroller.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }
    }
  };

  const headings = observerItems
    .map((item) => document.getElementById(item.id))
    .filter((el): el is HTMLElement => el !== null);

  if ('IntersectionObserver' in window && headings.length > 0) {
    intersectionObserver = new IntersectionObserver(handleIntersection, { threshold: 0.9 });
    headings.forEach((heading) => intersectionObserver?.observe(heading));
  }
}

/* ============================================================
   Tabs / Accordions / Copy / Theme
   ============================================================ */

function moveTabsIndicator(tabs: HTMLElement): void {
  const list = tabs.querySelector<HTMLElement>('.cpd-tabs-list');
  const indicator = list?.querySelector<HTMLElement>('[data-cpd-tabs-indicator]');
  const active = list?.querySelector<HTMLElement>('[data-cpd-tab][data-active="true"]');
  if (!list || !indicator || !active) return;
  indicator.style.left = `${active.offsetLeft}px`;
  indicator.style.width = `${active.offsetWidth}px`;
}

function initTabs(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-cpd-tabs]').forEach((tabs) => {
    moveTabsIndicator(tabs);
    tabs.addEventListener('click', (event) => {
      const target = isElement(event.target) ? event.target : null;
      const trigger = target ? closest<HTMLElement>(target, '[data-cpd-tab]') : null;
      if (!trigger || !tabs.contains(trigger)) return;

      const value = trigger.getAttribute('data-value');
      if (!value) return;

      tabs.querySelectorAll<HTMLElement>('[data-cpd-tab]').forEach((t) => {
        const active = t.getAttribute('data-value') === value;
        t.setAttribute('data-active', active ? 'true' : 'false');
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      tabs.querySelectorAll<HTMLElement>('[data-cpd-tab-panel]').forEach((panel) => {
        panel.setAttribute('data-active', panel.getAttribute('data-value') === value ? 'true' : 'false');
      });
      moveTabsIndicator(tabs);
    });
  });
}

function initAccordions(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-cpd-accordions]').forEach((group) => {
    group.addEventListener('click', (event) => {
      const target = isElement(event.target) ? event.target : null;
      const toggle = target ? closest<HTMLElement>(target, '[data-cpd-accordion-toggle]') : null;
      if (!toggle) return;

      const accordion = closest<HTMLElement>(toggle, '[data-cpd-accordion]');
      if (!accordion) return;
      const open = accordion.getAttribute('data-open') !== 'true';
      accordion.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // hash 深链：打开对应 accordion
  const openFromHash = (): void => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const accordion = root.querySelector<HTMLElement>(`[data-cpd-accordion][data-cpd-accordion-value="${id}"]`);
    if (!accordion) return;
    accordion.setAttribute('data-open', 'true');
    const toggle = accordion.querySelector<HTMLElement>('[data-cpd-accordion-toggle]');
    toggle?.setAttribute('aria-expanded', 'true');
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

function initCopy(root: ParentNode): void {
  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    const copy = closest<HTMLElement>(target, '[data-cpd-copy]');
    if (copy) {
      const code = closest<HTMLElement>(copy, '[data-cpd-code]');
      const pre = code?.querySelector<HTMLElement>('[data-cpd-code-pre]');
      if (pre) {
        void copyText(pre.textContent ?? '').then((ok) => {
          if (ok) flashCopyButton(copy);
        });
      }
      return;
    }

    const anchor = closest<HTMLElement>(target, '[data-cpd-copy-anchor]');
    if (anchor) {
      const hash = anchor.getAttribute('data-cpd-anchor') ?? '';
      void copyText(`${window.location.origin}${window.location.pathname}${hash}`).then((ok) => {
        if (ok) flashCopyButton(anchor);
      });
    }
  });
}

function initTheme(root: ParentNode): void {
  const toggle = root.querySelector<HTMLElement>('[data-cpd-theme-toggle]');
  if (!toggle) return;

  applyTheme(resolveInitialTheme());

  const CYCLE: CpdThemeMode[] = ['system', 'light', 'dark'];
  const currentMode = (): CpdThemeMode => {
    const m = document.documentElement.getAttribute('data-cpd-theme-mode');
    return m === 'dark' || m === 'light' || m === 'system' ? m : 'system';
  };

  // 循环：system → light → dark → system
  toggle.addEventListener('click', () => {
    const next = CYCLE[(CYCLE.indexOf(currentMode()) + 1) % CYCLE.length];
    applyTheme(next);
  });

  // system 模式下跟随系统偏好变化
  if ('matchMedia' in window) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', () => {
      if (currentMode() === 'system') applyTheme('system');
    });
  }
}

function initAstroCodeCopy(root: ParentNode): void {
  // 文档正文代码块：expressive-code（Starlight）与 Shiki 兜底输出统一注入 kit 复制按钮
  root.querySelectorAll<HTMLPreElement>('pre.astro-code, .cpd-md-content .expressive-code pre').forEach((pre) => {
    if (pre.querySelector('[data-cpd-astro-copy]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cpd-code-copy cpd-astro-copy';
    button.setAttribute('data-cpd-astro-copy', '');
    button.setAttribute('aria-label', 'Copy code');
    button.innerHTML = Icon.copy({});
    pre.classList.add('cpd-astro-pre');
    pre.appendChild(button);
  });
  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;
    const btn = closest<HTMLElement>(target, '[data-cpd-astro-copy]');
    if (!btn) return;
    const pre = btn.closest<HTMLPreElement>('pre');
    if (!pre) return;
    void copyText(pre.textContent ?? '').then((ok) => {
      if (ok) flashCopyButton(btn);
    });
  });
}

/* ============================================================
   入口
   ============================================================ */

export interface CelestialUiOptions {
  /** 初始化范围（默认 document） */
  root?: ParentNode;
}

/**
 * 初始化全部交互。可重复调用（对已初始化的组件幂等）。
 * @returns dispose 函数
 */
export function initCelestialUI(options: CelestialUiOptions = {}): () => void {
  const root = options.root ?? document;

  initSidebar(root);
  initToc(root);
  initTabs(root);
  initAccordions(root);
  initCopy(root);
  initAstroCodeCopy(root);
  initTheme(root);

  return () => {
    // 清理由事件委托挂在 root 上的监听（由调用方决定是否真正移除）
    // 当前实现为一次性初始化，dispose 供 HMR / 测试使用
  };
}
