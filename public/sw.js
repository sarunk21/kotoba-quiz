const CACHE_NAME = 'kotoba-quiz-cache-v2';

// Static resources to cache on install (app skeleton) — favicon di /icons/ + Bab 1-10 covers
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/favicon-32x32.png',
  '/stories/bab1/cover.png',
  '/stories/bab2/cover.png',
  '/stories/bab3/cover.png',
  '/stories/bab4/cover.png',
  '/stories/bab5/cover.png',
  '/stories/bab6/cover.png',
  '/stories/bab7/cover.png',
  '/stories/bab8/cover.png',
  '/stories/bab9/cover.png',
  '/stories/bab10/cover.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // hapus cache lama kotoba-quiz-cache-* dan audio yang kebesaran
          if (cache !== CACHE_NAME && cache.startsWith('kotoba-quiz-cache-')) {
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

  // Network-first untuk navigasi (HTML) agar tidak stale setelah deploy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-While-Revalidate untuk asset lain dengan limit 50
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
              // batasi 50 entries
              cache.keys().then(keys => {
                if (keys.length > 50) cache.delete(keys[0]);
              });
            }
            return networkResponse;
          })
          .catch(() => {
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
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const c of clients) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
