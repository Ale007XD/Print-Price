const CACHE_NAME = 'banner-calculator-cache-v12';
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
  './vendor/vue.global.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
