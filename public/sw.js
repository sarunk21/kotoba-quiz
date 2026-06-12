const CACHE_NAME = 'kotoba-quiz-cache-v1';

// Static resources to cache on install (app skeleton)
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for API endpoints, dev server hot reloading (webpack-hmr), non-GET requests, etc.
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.includes('/_next/webpack-hmr') ||
    (url.hostname.includes('localhost') && url.port === '3000' && url.pathname.startsWith('/_next/')) || // HMR dev mode
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Stale-While-Revalidate Strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Return cached response as offline fallback
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/')
  );
});
