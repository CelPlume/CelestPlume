import { initCelestialUI } from '../lib/ui/runtime';
import { initMermaidDiagrams } from '../lib/ui/mermaid';

// 文档页运行时入口（经 astro.config.mjs 的 celestialUiRuntime 注入所有页面；
// 主页等非 cpd 页面执行时为无害空操作）。
initCelestialUI();

// Mermaid 图表：按需懒加载渲染引擎（仅存在 .cpd-mermaid 容器时动态引入），
// 失败静默不影响页面其余功能。
void initMermaidDiagrams(document);

// 图片缓存 Service Worker：避免刷新时重新下载相同图片。
// 仅 https / localhost 环境注册，失败静默忽略（不影响页面功能）。
if ('serviceWorker' in navigator) {
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:';
  const isLocalhost =
    typeof location !== 'undefined' &&
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (isSecure || isLocalhost) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          /* 忽略注册失败 */
        });
    });
  }
}
