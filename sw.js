// Simple, clean service worker to satisfy PWA requirements
// But configured for STRICT ONLINE-ONLY behavior as requested by the user.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('Service Worker: Clearing Cache for online-only enforcement');
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// A fetch listener is required for the site to be recognized as a PWA.
// We pass through directly to the network via event.respondWith(fetch(event.request))
// to satisfy PWABuilder's strict offline/fetch handler checker, while ensuring the app
// remains strictly online-only and always fetches fresh content from the server.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Offline fallback
      return new Response("You are currently offline. Please check your internet connection.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    })
  );
});
