// Bump on every deploy that must invalidate HTML/data caches
const CACHE = 'stranded-v8'
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
  '/compare',
  '/print/province',
  '/funding',
  '/partnerships',
  '/data/stranded-sites.geojson',
  '/data/live-stats.json',
  '/logo.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(PRECACHE.map(url => c.add(url).catch(() => undefined)))
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

function isHtmlOrData(url) {
  try {
    const u = new URL(url)
    if (u.origin !== self.location.origin) return false
    if (u.pathname.includes('/data/')) return true
    if (u.pathname.endsWith('.html')) return true
    // pretty URLs for static pages
    if (!u.pathname.includes('.') || u.pathname.endsWith('/')) return true
    return false
  } catch {
    return false
  }
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const req = e.request

  // Network-first for HTML + /data so deploys and stats refresh promptly
  if (isHtmlOrData(req.url)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {})
          }
          return res
        })
        .catch(() => caches.match(req).then(c => c || caches.match('/')))
    )
    return
  }

  // Cache-first for static assets (chunks, images)
  e.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(res => {
        if (res.ok && req.url.includes('/_next/static/')) {
          caches.open(CACHE).then(c => c.put(req, res.clone())).catch(() => {})
        }
        return res
      }).catch(() => cached)
      return cached || fetched
    })
  )
})
