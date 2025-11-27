// Service Worker for Nonstop Knight PWA
const CACHE_NAME = 'nonstop-knight-v1';
const RUNTIME_CACHE = 'nonstop-knight-runtime-v1';

// Get the base path
const getBasePath = () => {
  const path = self.location.pathname.replace('/sw.js', '');
  return path || '';
};

const BASE_PATH = getBasePath();
const pathPrefix = BASE_PATH ? BASE_PATH + '/' : '/';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  pathPrefix,
  pathPrefix + 'index.html',
  pathPrefix + 'game.js',
  pathPrefix + 'nonstopphoto1.jpg',
  pathPrefix + 'nonstopphoto2.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails and it's a navigation request, return cached index.html
            if (event.request.mode === 'navigate') {
              return caches.match(pathPrefix + 'index.html') || 
                     caches.match(pathPrefix) ||
                     caches.match('/index.html') ||
                     caches.match('/');
            }
          });
      })
  );
});