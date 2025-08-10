// Сервис-воркер с PWA-кешем для публичных ресурсов.
// Критично: НЕ кэшируем приватные зашифрованные артефакты админки, чтобы их нельзя было извлечь оффлайн.
// Список запретов: admin-lock.json.enc, admin-prices.json.enc, admin-lock.salt.

const CACHE_NAME = 'print-price-cache-v15';

// Ресурсы, которые можно кэшировать (публичные)
// Не включаем admin-lock.json.enc, admin-prices.json.enc, admin-lock.salt!
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

// Маска приватных артефактов, которые нельзя кэшировать
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

  // Никогда не перехватываем и не кэшируем приватные admin .enc и .salt
  if (isPrivateAdminAsset(req.url)) {
    return; // пропускаем сеть напрямую
  }

  // Простой cache-first для публичных файлов
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkResp => {
        // Кэшируем только GET и только не-приватные и не-admin.html
        if (req.method === 'GET'
            && networkResp.ok
            && !isPrivateAdminAsset(req.url)
            && !req.url.endsWith('/admin.html')) {
          const cloned = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, cloned));
        }
        return networkResp;
      }).catch(() => {
        // Fallback можно добавить при необходимости
        return caches.match('./index.html');
      });
    })
  );
});
