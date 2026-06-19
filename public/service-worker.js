// Minimal no-op service worker to prevent 404s when registration exists.
// This does not implement caching or offline behavior.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // intentionally no-op: let network requests proceed normally
});
