// The Royal Palette POS & Executive Management - Service Worker
const CACHE_NAME = 'trp-pwa-cache-v2';

const PRECACHE_ASSETS = [
  '/',
  '/pos',
  '/admin',
  '/menu',
  '/icons/icon.svg',
  '/manifest.json',
];

// Installation: Pre-cache essential app shell routes and static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline app shell...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Some pre-cache assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation: Clean up deprecated cache stores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Purging stale cache store:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate for app assets & Network-First with Cache Fallback for navigation
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests (mutations go through outbox engine)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Bypass external cloud BaaS / API requests (let outbox & SDK handle connectivity)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/admin/auth')) {
    return;
  }

  // 3. Navigation requests (HTML pages): Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and update cache with fresh HTML
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // If specific page wasn't cached, return POS shell
          const posFallback = await caches.match('/pos');
          if (posFallback) return posFallback;

          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;

          return new Response(
            '<!DOCTYPE html><html><head><title>Offline - The Royal Palette</title></head><body style="background:#010617;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>The Royal Palette</h2><p>Operating in Offline Safe Mode. Please reload or launch the POS terminal.</p><a href="/pos" style="color:#f59e0b;">Open POS Terminal</a></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 4. Static assets (_next/static, images, fonts, styles): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
