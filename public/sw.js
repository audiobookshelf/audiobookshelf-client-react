/*
 * audiobookshelf app-shell service worker.
 *
 * Scope: installable-shell only. Caches immutable static assets and shows an offline
 * fallback for navigations.
 *
 * Base-path aware: the SW is registered at `<base>/sw.js`, so we derive `<base>` from our own
 * location and prefix every path with it. For root deploys the prefix is ''.
 */

const CACHE_VERSION = 'abs-shell-v1'

// `<base>` for subfolder deploys, e.g. '/audiobookshelf' (empty for root). Derived from this
// worker's own url so we don't need the value injected at build time.
const BASE = self.location.pathname.replace(/\/sw\.js$/, '')
const p = (path) => `${BASE}${path}`

// Small shell precached on install so the offline fallback works on the very first disconnect.
const PRECACHE_URLS = [p('/offline.html'), p('/images/icon.svg'), p('/images/book_placeholder.jpg')]

// Immutable / static assets → cache-first.
const STATIC_PREFIXES = [p('/_next/static/'), p('/images/'), p('/vendor/')]

// Auth-sensitive, realtime, or streaming → never touched by the SW (network only, no caching).
const BYPASS_PREFIXES = [p('/api/'), p('/internal-api/'), p('/public/'), p('/hls/'), p('/socket.io/')]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.ok) {
    cache.put(request, response.clone())
  }
  return response
}

async function navigationWithOfflineFallback(request) {
  try {
    return await fetch(request)
  } catch {
    const cache = await caches.open(CACHE_VERSION)
    const offline = await cache.match(p('/offline.html'))
    return offline ?? Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only same-origin GETs are eligible; everything else falls through to the network untouched.
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return

  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigations: network-first (never cache authenticated HTML), offline page as last resort.
  if (request.mode === 'navigate') {
    event.respondWith(navigationWithOfflineFallback(request))
    return
  }
})
