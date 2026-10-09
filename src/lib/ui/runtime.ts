/**
 * CelestPlume Docs Kit — 客户端运行时（纯 TS，无框架）
 *
 * 通过事件委托与 `data-cpd-*` 钩子接管构建器输出的静态 HTML：
 * - 侧边栏：折叠分组 / 桌面折叠 / 移动端抽屉 / 激活项滚动可见
 * - Plumest TOC（block 风格）：布局只在 ResizeObserver 中测量一次（positions Map），
 *   激活检测（IntersectionObserver 可见集）后以 `clip-path: inset()` 驱动圆角
 *   背景滑块，滚动更新零 DOM 几何读取（读写解耦）
 * - 页面操作条：复制 Markdown / 打印
 * - Tabs / Accordions / 复制按钮 / 标题锚点复制 / 主题切换
 *
 * 用法：`initCelestialUI()` 一次性初始化；返回 dispose 函数供清理。
 */

import { applyTheme, resolveInitialTheme, LANG_STORAGE_KEY, type CpdThemeMode } from './tokens';
import { Icon } from './icons';
import { githubLanguageColor } from './github-card';
import { initImageZoom } from './image-zoom-runtime';

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

  // 抽屉移出侧栏容器到 body：fixed 面板不能活在滚动/隐藏容器里
  // （容器 display:none 连坐导致面板尺寸归零；容器的层叠上下文会把
  // 抽屉压到正文/TOC 之下——实测侧栏 shell 内 z-index:60 输给 TOC）。
  if (drawer) {
    document.body.appendChild(drawer);
  }

  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    // 折叠分组（桌面栏 + 抽屉内的导航树共用）
    const toggle = closest<HTMLElement>(target, '[data-cpd-folder-toggle]');
    if (toggle && (sidebarRoot.contains(toggle) || drawer?.contains(toggle))) {
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
  });
}

/* ============================================================
   Plumest TOC（block 风格）— 滑块驱动 + 激活检测
   ============================================================ */

function initToc(root: ParentNode): void {
  const toc = root.querySelector<HTMLElement>('[data-cpd-toc]');
  if (!toc) return;

  const container = toc.querySelector<HTMLElement>('[data-cpd-toc-items]');
  if (!container) return;

  const scrollArea = toc.querySelector<HTMLElement>('[data-cpd-toc-scroll]');
  const thumb = container.querySelector<HTMLElement>('[data-cpd-toc-thumb]');
  const itemEls = () => Array.from(container.querySelectorAll<HTMLElement>('[data-cpd-toc-item]'));

  // 布局测量仅在 ResizeObserver 回调 / 初始化时重建（读写解耦）：
  // 滚动触发的高亮更新只查表，绝不读取 DOM 几何属性，杜绝 Layout Thrashing。
  let positions: [top: number, bottom: number][] = [];
  let totalHeight = 0;
  // 与 TOC 条目一一对应的文章标题元素（无对应锚点的为 undefined）
  let headings: (HTMLElement | undefined)[] = [];
  // 标题 id → TOC 条目索引
  let idToIndex = new Map<string, number>();
  // 当前视口内可见（任意比例相交）的标题 id
  const visible = new Set<string>();
  let intersectionObserver: IntersectionObserver | null = null;

  /** 全量测量条目几何并重建标题映射（仅在初始化 / ResizeObserver 回调中调用） */
  const measure = (): void => {
    const items = itemEls();
    positions = items.map((el) => [el.offsetTop, el.offsetTop + el.offsetHeight]);
    totalHeight = container.clientHeight;
    measureHeadings();
  };

  const measureHeadings = (): void => {
    headings = itemEls().map((el) => {
      const href = el.getAttribute('href');
      if (!href?.startsWith('#')) return undefined;
      const h = document.getElementById(href.slice(1));
      return h instanceof HTMLElement ? h : undefined;
    });
    idToIndex = new Map();
    itemEls().forEach((el, i) => {
      const href = el.getAttribute('href');
      if (href?.startsWith('#')) idToIndex.set(href.slice(1), i);
    });
  };

  /**
   * 滑块覆盖 [最上面可见标题, 最下面可见标题] 的连续区间：
   * 视口内任意可见的标题（含页面末尾挤在一起的多个标题）都会被覆盖，
   * 父子层级同时可见时呈现为一个连续的圆角背景块。
   */
  const applyRange = (startIdx: number, endIdx: number): void => {
    const items = itemEls();
    const n = items.length;
    if (n === 0) return;
    const s = Math.max(0, Math.min(startIdx, n - 1));
    const e = Math.max(s, Math.min(endIdx, n - 1));

    items.forEach((el, i) => el.setAttribute('data-cpd-active', i >= s && i <= e ? 'true' : 'false'));

    if (thumb) {
      // 纯查表：positions 仅在 ResizeObserver 中重建
      const top = positions[s]?.[0] ?? 0;
      const bottom = positions[e]?.[1] ?? 0;
      thumb.style.clipPath = `inset(${top}px 0 ${Math.max(0, totalHeight - bottom)}px round 8px)`;
      // 首次定位不启用过渡（data-ready 后才有滑动动画），杜绝首屏闪烁
      if (!thumb.hasAttribute('data-ready')) {
        requestAnimationFrame(() => thumb.setAttribute('data-ready', ''));
      }
    }

    // 激活区间首项自动滚动可见（滚动真实滚动容器，避免带动窗口）
    if (scrollArea) {
      const anchor = items[s];
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
  };

  /** 可见标题索引按视口上下排序 */
  const getVisibleIndices = (): number[] => {
    const idxs: number[] = [];
    for (const id of visible) {
      const i = idToIndex.get(id);
      if (i !== undefined) idxs.push(i);
    }
    idxs.sort((a, b) => {
      const ha = headings[a];
      const hb = headings[b];
      if (!ha || !hb) return a - b;
      return ha.getBoundingClientRect().top - hb.getBoundingClientRect().top;
    });
    return idxs;
  };

  /** 无任何可见标题时的回退：最后一个顶部越过视口顶部的标题 */
  const computeFallbackIndex = (): number => {
    let cur = 0;
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      if (!h) continue;
      if (h.getBoundingClientRect().top <= 0) cur = i;
      else break;
    }
    return cur;
  };

  const update = (): void => {
    const visIdx = getVisibleIndices();
    const cur = visIdx.length ? visIdx[0] : computeFallbackIndex();
    const startIdx = visIdx.length ? visIdx[0] : cur;
    const endIdx = visIdx.length ? visIdx[visIdx.length - 1] : cur;
    applyRange(startIdx, endIdx);
  };

  const onMeasure = (): void => {
    if (itemEls().length === 0) return;
    measure();
    update();
  };

  // 初始测量 + 尺寸变化重测
  onMeasure();
  if ('ResizeObserver' in window) {
    new ResizeObserver(onMeasure).observe(container);
  }

  // 可见性检测：threshold 0（任意比例相交即视为可见），实时增删 visible 集合。
  const setupObserver = (): void => {
    if (intersectionObserver || headings.length === 0) return;
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement)) continue;
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        update();
      },
      { threshold: 0 },
    );
    for (const h of headings) if (h) intersectionObserver.observe(h);
  };
  setupObserver();

  // 滚动 / 尺寸变化时重算（可见集合为空时依赖回退索引）
  let scroller: Element = document.scrollingElement || document.documentElement;
  if (headings.length > 0) {
    let node = headings[0]?.parentElement ?? null;
    while (node && node !== document.body && node !== document.documentElement) {
      const s = getComputedStyle(node);
      if (
        node.scrollHeight > node.clientHeight &&
        (s.overflowY === 'auto' || s.overflowY === 'scroll' || s.overflowY === 'overlay')
      ) {
        scroller = node;
        break;
      }
      node = node.parentElement;
    }
  }

  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  // scroll 事件不触发在 document.scrollingElement 上（实测只触发 window/document），
  // 窗口滚动一律监听 window；内层滚动容器才监听该元素。
  if (scroller === document.scrollingElement || scroller === document.documentElement) {
    window.addEventListener('scroll', onScroll, { passive: true });
  } else {
    scroller.addEventListener('scroll', onScroll, { passive: true });
  }
  window.addEventListener('resize', onScroll);
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

function initCodeTabs(root: ParentNode): void {
  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    const trigger = target ? closest<HTMLElement>(target, '[data-cpd-code-tab]') : null;
    if (!trigger) return;
    const figure = closest<HTMLElement>(trigger, '[data-cpd-code]');
    if (!figure) return;
    const value = trigger.getAttribute('data-value');
    if (!value) return;
    figure.querySelectorAll<HTMLElement>('[data-cpd-code-tab]').forEach((t) => {
      const active = t.getAttribute('data-value') === value;
      t.setAttribute('data-active', active ? 'true' : 'false');
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    figure.querySelectorAll<HTMLElement>('[data-cpd-code-panel]').forEach((panel) => {
      panel.setAttribute('data-active', panel.getAttribute('data-value') === value ? 'true' : 'false');
    });
  });
}

function initCopy(root: ParentNode): void {
  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    const copy = closest<HTMLElement>(target, '[data-cpd-copy]');
    if (copy) {
      const code = closest<HTMLElement>(copy, '[data-cpd-code]');
      // 单代码块复制整体；多 tab 复制当前激活面板
      const pre =
        code?.querySelector<HTMLElement>('[data-cpd-code-pre]') ??
        code?.querySelector<HTMLElement>('[data-cpd-code-panel][data-active="true"]');
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

function initLang(root: ParentNode): void {
  const link = root.querySelector<HTMLAnchorElement>('[data-cpd-lang-switch]');
  if (!link) return;
  // 点击语言切换时写入偏好（供下次访问 ThemeProvider 重定向）；目标语言由 href 前缀推断
  link.addEventListener('click', () => {
    try {
      const target = link.getAttribute('href')?.startsWith('/zh') ? 'zh' : 'en';
      window.localStorage.setItem(LANG_STORAGE_KEY, target);
    } catch {
      /* storage unavailable */
    }
  });
}

/* ============================================================
   页面操作条（复制 Markdown / 打印）
   ============================================================ */

function initPageActions(root: ParentNode): void {
  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    // 复制 Markdown：拉取本页 .md 端点（与 agent 共享同一降级管线）后写入剪贴板；
    // 本地 preview（trailingSlash: always）对无尾斜杠静态文件会 404，回退重试一次
    const copyMd = closest<HTMLElement>(target, '[data-cpd-copy-md]');
    if (copyMd) {
      const url = copyMd.getAttribute('data-cpd-md-url');
      if (!url) return;
      const fetchMd = async (): Promise<string> => {
        let res = await fetch(url);
        if (!res.ok && !url.endsWith('/')) res = await fetch(`${url}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      };
      void fetchMd()
        .then((text) => copyText(text))
        .then((ok) => {
          if (ok) flashCopyButton(copyMd);
        })
        .catch(() => {
          /* 拉取失败：保持按钮原状 */
        });
      return;
    }

    if (target.closest('[data-cpd-print]')) {
      window.print();
    }
  });

  // 打印时强制浅色（页面配色与 EC 代码块主题都挂在 data-theme 选择器上），
  // 打印结束恢复原值。直接写 data-cpd-theme 由 ThemeProvider 观察者镜像 data-theme，
  // 不触碰 localStorage 的模式偏好。
  let printRestore: string | null = null;
  window.addEventListener('beforeprint', () => {
    const html = document.documentElement;
    printRestore = html.getAttribute('data-cpd-theme');
    if (printRestore !== 'light') html.setAttribute('data-cpd-theme', 'light');
  });
  window.addEventListener('afterprint', () => {
    if (printRestore) document.documentElement.setAttribute('data-cpd-theme', printRestore);
    printRestore = null;
  });
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
   Tree 折叠（文档正文/预览里的文件夹行；
   侧边栏与抽屉内的折叠由 initSidebar 负责，这里只处理外部树）
   ============================================================ */

function initTreeFolders(root: ParentNode): void {
  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;
    const toggle = closest<HTMLElement>(target, '[data-cpd-folder-toggle]');
    if (!toggle) return;
    // 侧边栏与抽屉内的折叠分组由 initSidebar 托管，避免重复触发
    if (toggle.closest('[data-cpd-sidebar-root], [data-cpd-drawer]')) return;
    const folder = closest<HTMLElement>(toggle, '[data-cpd-folder]');
    if (!folder) return;
    const open = folder.getAttribute('data-cpd-open') !== 'true';
    folder.setAttribute('data-cpd-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

/* ============================================================
   Dropdown（点击触发、hover 可选、外点/Escape 关闭、项点击关闭）
   ============================================================ */

export function initDropdowns(root: ParentNode = document): void {
  const CLOSE_DELAY_MS = 150;

  // Portal 语义：fixed 菜单定位到触发按钮下方（sideOffset 8）；
  // 横向按视口自适应——右缘放不下时右对齐触发按钮（展开在左侧）
  const positionMenu = (dd: HTMLElement): void => {
    const trigger = dd.querySelector<HTMLElement>('[data-cpd-dropdown-trigger]');
    const menu = dd.querySelector<HTMLElement>('[data-cpd-dropdown-menu]');
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const menuWidth = menu.offsetWidth || 300;
    const viewport = document.documentElement.clientWidth;
    let left = rect.left;
    if (left + menuWidth > viewport - 8) left = Math.max(8, rect.right - menuWidth);
    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.left = `${left}px`;
  };
  const positionOpenMenus = () => {
    root.querySelectorAll<HTMLElement>('[data-cpd-dropdown][data-open="true"]').forEach(positionMenu);
  };

  const setOpen = (dd: HTMLElement, open: boolean): void => {
    dd.setAttribute('data-open', open ? 'true' : 'false');
    dd.querySelector<HTMLElement>('[data-cpd-dropdown-trigger]')?.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) positionMenu(dd);
  };

  // 初始即展开的菜单（文档预览 open:true）按触发按钮定位
  positionOpenMenus();
  // 滚动/缩放时保持与触发按钮对齐（与导航 dropdown 一致的浮层语义）
  window.addEventListener('scroll', positionOpenMenus, true);
  window.addEventListener('resize', positionOpenMenus);

  // hover 模式（站点导航项目菜单）：进入打开、移出 150ms 延迟关闭
  root.querySelectorAll<HTMLElement>('[data-cpd-dropdown][data-cpd-hover]').forEach((dd) => {
    let closeTimer = 0;
    dd.addEventListener('mouseenter', () => {
      window.clearTimeout(closeTimer);
      setOpen(dd, true);
    });
    dd.addEventListener('mouseleave', () => {
      closeTimer = window.setTimeout(() => setOpen(dd, false), CLOSE_DELAY_MS);
    });
  });

  // 键盘导航：触发打开、菜单内方向键循环、Escape/Tab 关闭
  const focusableItems = (menu: HTMLElement): HTMLElement[] =>
    Array.from(menu.querySelectorAll<HTMLElement>('a[href], [tabindex]'));

  root.addEventListener('keydown', (event: Event) => {
    const e = event as KeyboardEvent;
    const target = isElement(e.target) ? e.target : null;
    if (!target) return;

    const trigger = closest<HTMLElement>(target, '[data-cpd-dropdown-trigger]');
    if (trigger) {
      const dd = closest<HTMLElement>(trigger, '[data-cpd-dropdown]');
      if (!dd) return;
      const menu = dd.querySelector<HTMLElement>('[data-cpd-dropdown-menu]');
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(dd, true);
        focusableItems(menu ?? dd)[0]?.focus();
      } else if (e.key === 'Escape') {
        setOpen(dd, false);
      }
      return;
    }

    const menu = closest<HTMLElement>(target, '[data-cpd-dropdown-menu]');
    if (!menu) return;
    const dd = closest<HTMLElement>(menu, '[data-cpd-dropdown]');
    if (!dd) return;
    const items = focusableItems(menu);
    const idx = items.indexOf(target as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(dd, false);
      dd.querySelector<HTMLElement>('[data-cpd-dropdown-trigger]')?.focus();
    } else if (e.key === 'Tab') {
      setOpen(dd, false);
    }
  });

  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    const trigger = closest<HTMLElement>(target, '[data-cpd-dropdown-trigger]');
    if (trigger) {
      const dd = closest<HTMLElement>(trigger, '[data-cpd-dropdown]');
      if (!dd) return;
      setOpen(dd, dd.getAttribute('data-open') !== 'true');
      return;
    }

    const item = closest<HTMLElement>(target, '[data-cpd-dropdown-item]');
    if (item) {
      if (item.hasAttribute('data-disabled')) return;
      const dd = closest<HTMLElement>(item, '[data-cpd-dropdown]');
      if (dd) setOpen(dd, false);
      return;
    }

    // 点击菜单外任意处关闭
    if (!target.closest('[data-cpd-dropdown]')) {
      root.querySelectorAll<HTMLElement>('[data-cpd-dropdown][data-open="true"]').forEach((dd) => setOpen(dd, false));
    }
  });

  root.addEventListener('keydown', (event: Event) => {
    if ((event as KeyboardEvent).key !== 'Escape') return;
    root.querySelectorAll<HTMLElement>('[data-cpd-dropdown][data-open="true"]').forEach((dd) => setOpen(dd, false));
  });
}

/* ============================================================
   Modal（弹窗：触发打开、遮罩/Escape/关闭按钮关闭）
   ============================================================ */

function initModals(root: ParentNode): void {
  const closeModal = (m: HTMLElement): void => {
    m.setAttribute('data-open', 'false');
    m.querySelector<HTMLElement>('[data-cpd-modal-trigger]')?.setAttribute('aria-expanded', 'false');
  };

  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    const trigger = closest<HTMLElement>(target, '[data-cpd-modal-trigger]');
    if (trigger) {
      const targetId = trigger.getAttribute('data-cpd-modal-target');
      const modal = targetId
        ? root.querySelector<HTMLElement>(`[data-cpd-modal][id="${CSS.escape(targetId)}"]`)
        : null;
      if (modal) {
        modal.setAttribute('data-open', 'true');
        trigger.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    const holder = target.closest<HTMLElement>('[data-cpd-modal]');
    if (!holder) return;
    // 关闭按钮 / 点击遮罩（面板外）关闭
    if (target.closest('[data-cpd-modal-close]')) {
      closeModal(holder);
      return;
    }
    if (target.closest('[data-cpd-modal-overlay]') && !target.closest('.cpd-modal-panel')) {
      closeModal(holder);
    }
  });

  root.addEventListener('keydown', (event: Event) => {
    if ((event as KeyboardEvent).key !== 'Escape') return;
    root.querySelectorAll<HTMLElement>('[data-cpd-modal][data-open="true"]').forEach(closeModal);
  });
}

/* ============================================================
   通用 Drawer（每个抽屉独立开关；与导航抽屉分离，文档演示互不干扰）
   ============================================================ */

function initDrawers(root: ParentNode): void {
  const allDrawers = (): NodeListOf<HTMLElement> =>
    root.querySelectorAll<HTMLElement>('[data-cpd-drawer]');

  const openDrawer = (box: HTMLElement, open: boolean) => {
    box.setAttribute('data-cpd-open', open ? 'true' : 'false');
  };

  root.addEventListener('click', (event) => {
    const target = isElement(event.target) ? event.target : null;
    if (!target) return;

    // 打开：trigger 用 data-cpd-drawer-target 显式指定目标抽屉 id
    const trigger = closest<HTMLElement>(target, '[data-cpd-drawer-trigger]');
    if (trigger) {
      const targetId = trigger.getAttribute('data-cpd-drawer-target');
      const box = targetId
        ? root.querySelector<HTMLElement>(`[data-cpd-drawer][id="${CSS.escape(targetId)}"]`)
        : null;
      if (box) {
        openDrawer(box, box.getAttribute('data-cpd-open') !== 'true');
        trigger.setAttribute('aria-expanded', box.getAttribute('data-cpd-open') === 'true' ? 'true' : 'false');
      }
      return;
    }

    // 关闭：遮罩 / 关闭按钮 / 抽屉内链接 → 关闭点击所在的抽屉
    const holder = target.closest<HTMLElement>('[data-cpd-drawer]');
    if (holder) {
      if (
        target.closest('[data-cpd-drawer-overlay]') ||
        target.closest('[data-cpd-drawer-close]') ||
        target.closest('a[href]')
      ) {
        openDrawer(holder, false);
      }
    }
  });

  root.addEventListener('keydown', (event: Event) => {
    if ((event as KeyboardEvent).key !== 'Escape') return;
    allDrawers().forEach((d) => {
      if (d.getAttribute('data-cpd-open') === 'true') openDrawer(d, false);
    });
  });
}

/* ============================================================
   GitHubCard（构建期抓取失败时回填描述/语言/star/fork；
   localStorage 缓存遵守 API 限流）
   ============================================================ */

interface GithubRuntimeData {
  description: string;
  language: string;
  stars: number;
  forks: number;
}

async function fetchGithubRepoData(
  owner: string,
  repo: string,
): Promise<GithubRuntimeData | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    );
    if (!res.ok) return null;
    const data: Record<string, unknown> = await res.json();
    return {
      description: typeof data.description === 'string' ? data.description : '',
      language: typeof data.language === 'string' && data.language ? data.language : 'Other',
      stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
      forks: typeof data.forks_count === 'number' ? data.forks_count : 0,
    };
  } catch {
    return null;
  }
}

function initGithubCards(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-cpd-github-card]').forEach((card) => {
    const owner = card.getAttribute('data-cpd-github-owner');
    const repo = card.getAttribute('data-cpd-github-repo');
    if (!owner || !repo) return;

    const apply = (data: GithubRuntimeData): void => {
      if (data.description) {
        const desc = card.querySelector<HTMLElement>('[data-cpd-github-desc]');
        if (desc) desc.textContent = data.description;
      }
      if (data.language) {
        const lang = card.querySelector<HTMLElement>('[data-cpd-github-lang]');
        const dot = card.querySelector<HTMLElement>('[data-cpd-github-lang-color]');
        if (lang) lang.textContent = data.language;
        if (dot) dot.style.backgroundColor = githubLanguageColor(data.language);
      }
      const stars = card.querySelector<HTMLElement>('[data-cpd-github-stars-num]');
      const forks = card.querySelector<HTMLElement>('[data-cpd-github-forks-num]');
      if (stars) stars.textContent = String(data.stars);
      if (forks) forks.textContent = String(data.forks);
    };

    const cacheKey = `cpd-github-${owner}/${repo}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) apply(JSON.parse(cached) as GithubRuntimeData);
    } catch {
      // 缓存损坏时忽略，仍走一次实时抓取
    }

    void fetchGithubRepoData(owner, repo).then((data) => {
      if (!data) return;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // 隐私模式等写失败时忽略
      }
      apply(data);
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
  initDrawers(root);
  initTreeFolders(root);
  initDropdowns(root);
  initModals(root);
  initToc(root);
  initTabs(root);
  initCodeTabs(root);
  initAccordions(root);
  initCopy(root);
  initPageActions(root);
  initAstroCodeCopy(root);
  initImageZoom(root);
  initTheme(root);
  initLang(root);
  initGithubCards(root);

  return () => {
    // 清理由事件委托挂在 root 上的监听（由调用方决定是否真正移除）
    // 当前实现为一次性初始化，dispose 供 HMR / 测试使用
  };
}
