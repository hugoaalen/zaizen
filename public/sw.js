const CACHE_VERSION = 'zaizen-shell-v2'
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/ZaiZen_icon-192.png',
  '/icons/ZaiZen_icon-512.png',
  '/icons/ZaiZen_icon-180.png'
]

const cacheAppShell = async () => {
  const cache = await caches.open(CACHE_VERSION)
  await cache.addAll(CORE_ASSETS)

  const response = await fetch('/index.html', { cache: 'no-store' })
  const html = await response.text()
  const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
    .map(match => match[1])
  await cache.addAll([...new Set(assetPaths)])
}

self.addEventListener('install', event => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE_VERSION).then(cache => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
