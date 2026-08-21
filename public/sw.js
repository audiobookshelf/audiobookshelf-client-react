/*
 * audiobookshelf service worker.
 *
 * Installability only, online-first. This worker exists so the app meets the "has a service worker"
 * install criterion and launches standalone.
 * Offline support (app shell, data, media) is intentionally out of scope, matching the
 * Vue client (workbox offline:false, cacheAssets:false, preCaching:[], runtimeCaching:[]).
 *
 */

self.addEventListener('install', () => {
  // Activate immediately so a new deploy's worker takes over without waiting for a reload.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Take control of open clients right away so the worker is active on first load.
  event.waitUntil(self.clients.claim())
})
