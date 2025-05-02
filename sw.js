const CACHE_NAME = 'flappy-fish-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/game.js',
    '/pwa.js',
    '/sounds/background.mp3',
    '/sounds/flap.mp3',
    '/sounds/hit.mp3',
    '/sounds/score.mp3',
    '/assets/images/fish.png',
    '/assets/images/background.png',
    '/manifest.json'
  ];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
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

// Add this to your fetch event listener
self.addEventListener('fetch', (e) => {
    e.respondWith(
      caches.match(e.request)
        .then(response => {
          // Return cached response if found
          if (response) return response;
          
          // Try network request
          return fetch(e.request)
            .catch(() => {
              // If both cache and network fail, return a fallback
              if (e.request.headers.get('accept').includes('text/html')) {
                return caches.match('/offline.html');
              }
            });
        })
    );
  });