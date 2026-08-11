/* global self, caches, URL, fetch */
/* CelestPlume 图片缓存 Service Worker
 *
 * 目标：避免每次刷新都重新下载相同的图片（教程截图、徽章等）。
 * 策略：图片请求 cache-first（命中缓存直接返回），同时在后台向网络
 * 重新校验并更新缓存（stale-while-revalidate），兼顾速度与内容新鲜度。
 *
 * 仅拦截 GET 图片请求；HTML/CSS/JS 等交由浏览器正常处理，不影响站点更新。
 */

const CACHE_NAME = 'celplume-images-v1';
const IMAGE_RE = /\.(webp|png|jpe?g|gif|svg|avif|bmp|ico)(\?|#|$)/i;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!IMAGE_RE.test(url.pathname)) return;

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: false });

  if (cached) {
    // 命中缓存：立即返回，后台静默重新校验并更新（失败不影响返回）
    fetch(request)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          cache.put(request, res.clone());
        }
      })
      .catch(() => {});
    return cached;
  }

  const response = await fetch(request);
  // 缓存同源成功响应与跨域 opaque 响应
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}
