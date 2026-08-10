/**
 * SpecularButton — 镜面边缘高光（reactbits.dev/components/specular-button 移植）
 *
 * reactbits 原版为每个按钮各挂一张 canvas + 一个 WebGL 上下文 + 常驻 rAF，
 * 主页按钮很多时会耗尽浏览器上下文并拖慢性能。这里改为**共享单张全页 fixed
 * canvas**：逐帧追踪离光标最近的 `.cp-btn` / `.cp-mini-btn`，把它的矩形与光标
 * 角度喂给同一个圆角矩形 SDF 着色器，渲染「随光标扫过按钮边缘」的镜面高光。
 *
 * 全程 1 个 WebGL2 上下文 + 1 个 rAF；尊重 prefers-reduced-motion；无 WebGL2
 * 时静默降级（不抛错、不创建 canvas）。
 *
 * 颜色由按钮自身的 CSS 变量 `--cp-spec-line` / `--cp-spec-base` 驱动（深/浅色
 * 主题各自定义于 celestial.css），主题切换时自动重读。
 */

const BUTTON_SELECTOR = '.cp-btn, .cp-mini-btn';
/** 光标距按钮边缘多少 px 内开始点亮高光 */
const PROXIMITY = 140;
const INTENSITY = 1;
const SHINE_SIZE = 10; // 度，高光角度窗口
const SHINE_FADE = 40; // 度，高光角度淡出
const THICKNESS = 2.5; // px，高光线宽（加大使 hover 更明显）
const Z_INDEX = 999;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  // 深色基底描边，贴住边缘制造厚度感
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.35;

  // 对称镜面：朝向/背向光源的边缘都会扫到一条光带。角度窗口用椭圆法线测量，
  // 沿直边连续变化。
  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('specular shader error', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('specular link error', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function parseColor(value: string): number[] | null {
  const v = value.trim();
  if (!v) return null;
  const hex = v.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (rgb) {
    const clamp = (x: number) => Math.min(1, Math.max(0, x));
    return [clamp(Number(rgb[1]) / 255), clamp(Number(rgb[2]) / 255), clamp(Number(rgb[3]) / 255)];
  }
  return null;
}

/** 初始化共享镜面高光；返回销毁函数，失败时返回 null。 */
export function initSpecular(): (() => void) | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  });
  if (!gl) return null;

  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:' + Z_INDEX + ';';
  document.body.appendChild(canvas);

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    canvas.remove();
    return null;
  }
  const program = linkProgram(gl, vs, fs);
  if (!program) {
    canvas.remove();
    return null;
  }

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const attrib = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(attrib);
  gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const U = {
    uCenter: gl.getUniformLocation(program, 'uCenter'),
    uHalfSize: gl.getUniformLocation(program, 'uHalfSize'),
    uRadius: gl.getUniformLocation(program, 'uRadius'),
    uAngle: gl.getUniformLocation(program, 'uAngle'),
    uPx: gl.getUniformLocation(program, 'uPx'),
    uLineColor: gl.getUniformLocation(program, 'uLineColor'),
    uBaseColor: gl.getUniformLocation(program, 'uBaseColor'),
    uIntensity: gl.getUniformLocation(program, 'uIntensity'),
    uShineSize: gl.getUniformLocation(program, 'uShineSize'),
    uShineFade: gl.getUniformLocation(program, 'uShineFade'),
    uThickness: gl.getUniformLocation(program, 'uThickness'),
    uBaseWidth: gl.getUniformLocation(program, 'uBaseWidth'),
  };

  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>(BUTTON_SELECTOR),
  );
  const rects = new Map<HTMLElement, DOMRect>();

  let dpr = 1;
  let cssW = 1;
  let cssH = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // 以 canvas 自身实际渲染尺寸为准（而非 window.innerWidth）：
    // 经典滚动条时 innerWidth 含滚动条宽度、width:100% 却解析为布局视口宽，
    // 两者不一致会让缓冲区比显示更宽 → 浏览器缩放 → 轮廓整体偏左。
    const rect = canvas.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const refreshRects = () => {
    for (const el of buttons) rects.set(el, el.getBoundingClientRect());
  };

  resize();
  refreshRects();

  let refreshRaf = 0;
  const scheduleRefresh = () => {
    if (refreshRaf) return;
    refreshRaf = requestAnimationFrame(() => {
      refreshRaf = 0;
      refreshRects();
    });
  };
  const onScroll = () => scheduleRefresh();
  const onResize = () => {
    resize();
    scheduleRefresh();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  const ro = new ResizeObserver(scheduleRefresh);
  for (const el of buttons) ro.observe(el);

  // —— 指针追踪：用缓存的矩形找最近按钮，算出朝向与接近度 ——
  const pointer = { x: -9999, y: -9999 };
  let current: HTMLElement | null = null;
  let pointerAngle: number | null = null;
  let proximityT = 0;

  // 渲染循环按需启停：指针靠近按钮（或淡出进行中）才跑 rAF，空闲时完全停掉，
  // 避免整页常驻 60fps 空转占用主线程（Lighthouse main-thread-work 主要来源）。
  let raf = 0;
  let running = false;
  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onPointerMove = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const el of buttons) {
      const r = rects.get(el);
      if (!r) continue;
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      const d = Math.hypot(dx, dy);
      if (d < bestDist) {
        bestDist = d;
        best = el;
      }
    }
    current = best;
    if (current) {
      const r = rects.get(current)!;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (bestDist === 0) {
        // 在按钮内部：光停在斜对角，随光标轻微摆动
        const nx = (e.clientX - cx) / (r.width / 2);
        const ny = (cy - e.clientY) / (r.height / 2);
        pointerAngle = Math.atan2(2 / r.height, -2 / r.width) + nx * 0.3 + ny * 0.15;
      } else {
        pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
      }
      const t = Math.max(0, 1 - bestDist / Math.max(PROXIMITY, 1));
      proximityT = t * t * (3 - 2 * t);
      // 指针进入接近范围 → 启动渲染循环（空闲自停）
      if (bestDist < PROXIMITY) start();
    } else {
      proximityT = 0;
    }
  };
  window.addEventListener('pointermove', onPointerMove);

  // —— 主题感知颜色缓存：data-home-theme 变化时失效重读 ——
  const colorCache = new Map<HTMLElement, { line: number[]; base: number[] }>();
  let themeSeen = document.documentElement.getAttribute('data-home-theme');
  const themeObs = new MutationObserver(() => {
    const theme = document.documentElement.getAttribute('data-home-theme');
    if (theme !== themeSeen) {
      themeSeen = theme;
      colorCache.clear();
    }
  });
  themeObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-home-theme'],
  });

  const colorsFor = (el: HTMLElement) => {
    let c = colorCache.get(el);
    if (!c) {
      const cs = getComputedStyle(el);
      c = {
        line: parseColor(cs.getPropertyValue('--cp-spec-line')) ?? [1, 1, 1],
        base: parseColor(cs.getPropertyValue('--cp-spec-base')) ?? [0.6, 0.5, 0.35],
      };
      colorCache.set(el, c);
    }
    return c;
  };

  // —— 渲染循环 ——
  let angle = 2.4;
  let bright = 0;
  let last = performance.now();

  const loop = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const active = current && rects.get(current) ? current : null;

    if (active && pointerAngle != null) {
      const diff = ((pointerAngle - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += diff * (1 - Math.exp(-dt * 7));
    }
    const brightTarget = active ? proximityT : 0;
    bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8));

    gl.clear(gl.COLOR_BUFFER_BIT);

    if (active && bright > 0.003) {
      // 逐帧读取活动按钮的实时位置：跟随入场动画 / 滚动 / 布局变化，
      // 避免缓存矩形过期导致高光偏离按钮真实位置。
      const r = active.getBoundingClientRect();
      rects.set(active, r);
      const sx = canvas.width / cssW; // 设备像素 / CSS 像素（x）
      const sy = canvas.height / cssH; // 设备像素 / CSS 像素（y）
      const { line, base } = colorsFor(active);
      gl.useProgram(program);
      gl.uniform2f(
        U.uCenter,
        (r.left + r.width / 2) * sx,
        (cssH - (r.top + r.height / 2)) * sy,
      );
      gl.uniform2f(U.uHalfSize, (r.width / 2) * sx, (r.height / 2) * sy);
      gl.uniform1f(U.uRadius, (Math.min(r.width, r.height) / 2) * sx);
      gl.uniform1f(U.uAngle, angle);
      gl.uniform1f(U.uPx, sx);
      gl.uniform3f(U.uLineColor, line[0], line[1], line[2]);
      gl.uniform3f(U.uBaseColor, base[0], base[1], base[2]);
      gl.uniform1f(U.uIntensity, INTENSITY * bright);
      gl.uniform1f(U.uShineSize, (SHINE_SIZE * Math.PI) / 180);
      gl.uniform1f(U.uShineFade, (SHINE_FADE * Math.PI) / 180);
      gl.uniform1f(U.uThickness, THICKNESS * sx);
      gl.uniform1f(U.uBaseWidth, sx);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // 空闲自停：无活动按钮且高光已衰减到 0 → 停掉 rAF，页面闲置时零主线程开销
    if (!active && bright < 0.003) stop();
  };

  return () => {
    stop();
    if (refreshRaf) cancelAnimationFrame(refreshRaf);
    ro.disconnect();
    themeObs.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
  };
}
