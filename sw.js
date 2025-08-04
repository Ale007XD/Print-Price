// Этот файл: sw.js
const CACHE_NAME = 'banner-calculator-cache-v1';
// ВАЖНО: Укажите полный путь к файлам с учетом имени репозитория
const REPO_NAME = '/banner-calculator'; 
const URLS_TO_CACHE = [
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/app.js`,
  `${REPO_NAME}/calculation.js`,
  `${REPO_NAME}/pdfExporter.js`,
  `${REPO_NAME}/prices.json`,
  `${REPO_NAME}/manifest.json`,
  `${REPO_NAME}/icons/pwa-192x192.png`,
  `${REPO_NAME}/icons/pwa-512x512.png`,
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если ресурс найден в кеше, возвращаем его
        if (response) {
          return response;
        }
        // Иначе, делаем запрос к сети
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
