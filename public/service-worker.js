const CACHE_NAME = 'nba-park-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione aqui outros assets estáticos que você quer cachear
  // Ex: '/src/globals.css', '/src/main.tsx', etc.
  // Para assets gerados pelo build (com hash no nome), você precisaria de um plugin PWA no Vite
  // ou uma estratégia de cache mais dinâmica.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});