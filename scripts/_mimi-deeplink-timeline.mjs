// _mimi-deeplink-timeline.mjs — where does the deep-link card actually lose its time?
// Observes, inside the page: when the record request lands, when the card node is added,
// and the long tasks in between. No CPU/network throttling by default (--cpu for that).
import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT = path.resolve(process.argv[2] || 'dist')
const PORT = Number(process.argv[3] || 4397)
const CPU = Number(process.argv[4] || 1)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/geo+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  let f = path.join(ROOT, decodeURIComponent(u.pathname))
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404).end('404'); return }
  const t = MIME[path.extname(f)] || 'application/octet-stream'
  const raw = fs.readFileSync(f)
  if (/gzip/.test(String(req.headers['accept-encoding'])) && /^(text|application\/(json|javascript|geo\+json|xml))/.test(t)) {
    res.writeHead(200, { 'content-type': t, 'content-encoding': 'gzip' }).end(zlib.gzipSync(raw)); return
  }
  res.writeHead(200, { 'content-type': t }).end(raw)
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))

const browser = await chromium.launch()
const WIDTH = Number(process.argv[5] || 390)
const isMobile = WIDTH < 900
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: isMobile ? 844 : 900 },
  hasTouch: isMobile, isMobile, deviceScaleFactor: isMobile ? 2 : 1,
  userAgent: isMobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36',
})
await ctx.addInitScript(() => {
  try { ['stranded-onboarding-dismissed', 'stranded-map-firstrun-dismissed'].forEach((k) => localStorage.setItem(k, '1')) } catch {}
  window.__log = []
  const t0 = performance.now()
  window.__t0 = t0
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__log.push({ t: Math.round(e.startTime), what: 'longtask', ms: Math.round(e.duration) }) }).observe({ type: 'longtask', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__log.push({ t: Math.round(e.startTime), what: 'paint:' + e.name }) }).observe({ type: 'paint', buffered: true })
  } catch {}
  const mo = new MutationObserver(() => {
    for (const testid of ['mobile-site-sheet', 'map-right-column', 'map-deeplink-loading']) {
      if (document.querySelector(`[data-testid="${testid}"]`) && !window.__log.some((x) => x.what === 'node:' + testid)) {
        window.__log.push({ t: Math.round(performance.now()), what: 'node:' + testid })
      }
    }
    const h2 = document.querySelector('[data-testid="mobile-site-sheet"] h2')
    if (h2 && h2.innerText && !window.__log.some((x) => x.what === 'name:' + h2.innerText)) window.__log.push({ t: Math.round(performance.now()), what: 'name:' + h2.innerText })
  })
  const start = () => { try { mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true }) } catch {} }
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start)
  const of = window.fetch
  window.fetch = function (...a) {
    const url = String(a[0] instanceof Request ? a[0].url : a[0])
    const t = Math.round(performance.now())
    return of.apply(this, a).then((r) => { if (url.includes('/data/')) window.__log.push({ t, what: 'fetch-start ' + url.split('/').slice(-1)[0] }); return r })
  }
})
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.log('  console:', m.text().slice(0, 100)) })
if (CPU > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }) }
await page.goto(`http://127.0.0.1:${PORT}/map/?site=G12350`, { waitUntil: 'commit' })
await page.waitForTimeout(20000)
const log = await page.evaluate(() => ({ t0: Math.round(window.__t0), log: window.__log, res: performance.getEntriesByType('resource').filter((r) => r.name.includes('/data/')).map((r) => ({ n: r.name.split('/').slice(-1)[0], s: Math.round(r.startTime), d: Math.round(r.duration) })) }))
console.log('cpu', CPU)
for (const e of log.log.filter((x) => x.what !== 'longtask' || x.ms > 200).sort((a, b) => a.t - b.t)) console.log(String(e.t).padStart(6), e.what, e.ms ?? '')
console.log('resources:', JSON.stringify(log.res))
await browser.close(); server.close()
