// PWA сервис-воркер: кэшируем публичные ресурсы, НО не кэшируем приватные admin .enc/.salt.
const CACHE_NAME = 'print-price-cache-v17';

const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './calculation.js',
  './markdownExporter.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

function isPrivateAdminAsset(url) {
  return url.endsWith('/admin-lock.json.enc')
      || url.endsWith('/admin-prices.json.enc')
      || url.endsWith('/admin-lock.salt')
      || url.includes('admin-lock.json.enc')
      || url.includes('admin-prices.json.enc')
      || url.includes('admin-lock.salt');
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (isPrivateAdminAsset(req.url)) {
    return; // не перехватываем приватные файлы
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkResp => {
        if (req.method === 'GET'
            && networkResp.ok
            && !isPrivateAdminAsset(req.url)
            && !req.url.endsWith('/admin.html')) {
          const cloned = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, cloned));
        }
        return networkResp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
