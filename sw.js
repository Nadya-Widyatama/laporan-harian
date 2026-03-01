/* ============================================================
   sw.js — Service Worker for Laporan Harian Kerja PWA
   Enables offline usage on Android
   ============================================================ */

const CACHE_NAME = 'laporan-harian-v1';

// All files to cache for offline use
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    // Google Fonts cached separately via fetch handler
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    // ExcelJS CDN
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
];

// ── Install: cache all assets ──────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app assets...');
            // Cache local files strictly, CDN files best-effort
            return cache.addAll([
                './',
                './index.html',
                './style.css',
                './app.js',
                './manifest.json',
            ]).then(() => {
                // Cache CDN resources best-effort (don't fail install if CDN is down)
                return Promise.allSettled(
                    [
                        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
                        'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
                    ].map(url => cache.add(url).catch(() => null))
                );
            });
        }).then(() => {
            console.log('[SW] All assets cached!');
            return self.skipWaiting();
        })
    );
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ── Fetch: serve from cache, fallback to network ───────────
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Serve cached, but also update cache in background (stale-while-revalidate)
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse;
            }

            // Not in cache — fetch from network and cache it
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
                    return networkResponse;
                }
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return networkResponse;
            }).catch(() => {
                // Offline fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
