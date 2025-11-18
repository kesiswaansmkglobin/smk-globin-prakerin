const CACHE_NAME = 'sim-prakerin-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/lovable-uploads/05a99674-2f4f-42a1-b184-4bab79cc07c7.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
