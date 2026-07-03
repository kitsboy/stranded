const CACHE = 'stranded-v3'
const PRECACHE = [
  '/',
  '/map',
  '/education',
  '/sites',
  '/pitch',
  '/dashboard',
  '/provinces',
  '/bookmarks',
  '/methodology',
  '/about',
  '/global',
  '/benchmarks',
  '/data/stranded-sites.geojson',
  '/data/live-stats.json',
  '/logo.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res.ok && (e.request.url.includes('/data/') || e.request.url.endsWith('.html'))) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        }
        return res
      }).catch(() => cached)
      return cached || fetched
    })
  )
})