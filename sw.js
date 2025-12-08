
const CACHE_VERSION = 'v3';
const STATIC_CACHE = `smart-finance-static-${CACHE_VERSION}`;
const DATA_CACHE = `smart-finance-data-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json', // If exists
  'https://cdn.tailwindcss.com', // External CDN
];

// API endpoints that are safe to cache (Reference Data)
const CACHEABLE_API_ROUTES = [
  '/rest/v1/products',
  '/rest/v1/warehouses',
  '/rest/v1/company_settings',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== STATIC_CACHE && key !== DATA_CACHE) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API Requests
  if (url.pathname.startsWith('/rest/v1/')) {
    const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.includes(route));
    
    if (isCacheable) {
      // Stale-While-Revalidate for reference data
      event.respondWith(
        caches.open(DATA_CACHE).then((cache) => {
          return cache.match(request).then((response) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
            return response || fetchPromise;
          });
        })
      );
    } else {
      // Network-First for critical data (Invoices, Debts, etc.)
      event.respondWith(
        fetch(request)
          .then((response) => {
            return caches.open(DATA_CACHE).then((cache) => {
              // Optional: Cache successful GET requests for offline fallback
              if (request.method === 'GET' && response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            });
          })
          .catch(() => {
            return caches.match(request).then((response) => {
              if (response) return response;
              
              // Return a dedicated offline JSON response
              return new Response(JSON.stringify({ 
                error: 'offline', 
                message: 'You are offline. This data is not available in cache.' 
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
          })
      );
    }
    return;
  }

  // 2. Static Assets (Navigations, JS, CSS, Images)
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((networkResponse) => {
        return caches.open(STATIC_CACHE).then((cache) => {
          // Cache new static assets dynamically
          if (request.method === 'GET' && networkResponse.ok) {
             cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(() => {
        // Fallback for navigation (HTML)
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
    })
  );
});
