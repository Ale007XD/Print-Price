// Этот файл: sw.js
const CACHE_NAME = 'banner-calculator-cache-v6';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './calculation.js',
  './markdownExporter.js',
  './prices.json',
  './manifest.json',
  './icons/pwa-192x192.png',
  './icons/pwa-512x512.png',
  'https://unpkg.com/vue@3/dist/vue.global.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэш открыт, добавляю файлы в кэш...');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
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
            console.log('Удаляю старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
