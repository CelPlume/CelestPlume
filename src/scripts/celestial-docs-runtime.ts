import { initCelestialUI } from '../lib/ui/runtime';

// 文档页运行时入口（经 astro.config.mjs 的 celestialUiRuntime 注入所有页面；
// 主页等非 cpd 页面执行时为无害空操作）。
initCelestialUI();
