// Basic service worker to enable PWA installation and stop 404 errors
self.addEventListener('install', () => {
  console.log('[SW] Installed');
});

self.addEventListener('activate', () => {
  console.log('[SW] Activated');
});

self.addEventListener('fetch', (event) => {
  // Pass-through
  event.respondWith(fetch(event.request));
});
