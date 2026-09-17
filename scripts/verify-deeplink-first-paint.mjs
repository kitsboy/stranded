/**
 * verify-deeplink-first-paint.mjs — fix 2/3: the deep-linked site's card must come from
 * the site's OWN record (~1 s), not from the whole 2,611-site dataset (was 10–37 s).
 *
 * Measures, on a throttled phone profile (Slow 4G + 4× CPU) and on a desktop profile:
 *   - t_card      : navigationStart → the deep-linked site's card is on screen, named
 *   - t_full      : navigationStart → the map has reached its full 2,611-site state
 *   - the record  : was /data/site/<id>.json fetched, how big, how long
 * and prints the timeline (FCP / LCP / the resource entries / long tasks). Screenshots at
 * 1 s, at the card, and at full load.
 *
 * Usage:
 *   node scripts/verify-deeplink-first-paint.mjs                 # local: serves ./dist
 *   node scripts/verify-deeplink-first-paint.mjs --live          # against stranded.giveabit.io
 *   node scripts/verify-deeplink-first-paint.mjs --site G12350 --out docs/evidence/x
 * Exit 0 = every measured run met its budget; 1 = a run missed it (numbers still printed).
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { chromium } from 'playwright'

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d }

const LIVE = has('--live')
const DIST = arg('--dist', 'dist')
const SITE = arg('--site', 'G12350')
const OUT = arg('--out', '/tmp/deeplink-first-paint')
const TAG = arg('--tag', '')
const jsonName = `${TAG ? TAG + '-' : ''}VERIFY-${LIVE ? 'live' : 'local'}.json`
const PORT = Number(arg('--port', '4391'))
const STRICT_CONSOLE = has('--strict-console')

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.geojson': 'application/geo+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
}
const COMPRESSIBLE = /^(text|application\/(json|javascript|geo\+json|xml|manifest\+json))/

/** Minimal static server for ./dist — trailing-slash index resolution + gzip, like the CDN. */
function serveDist(root) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x')
      let file = path.join(root, decodeURIComponent(url.pathname))
      if (!file.startsWith(root)) { res.writeHead(403).end(); return }
      let stat = fs.existsSync(file) ? fs.statSync(file) : null
      if (stat?.isDirectory()) {
        const idx = path.join(file, 'index.html')
        if (fs.existsSync(idx)) { file = idx; stat = fs.statSync(idx) }
      }
      if (!stat || !stat.isFile()) {
        const html = file + '.html'
        if (fs.existsSync(html)) { file = html; stat = fs.statSync(html) }
      }
      if (!stat?.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return }
      const ext = path.extname(file)
      const type = MIME[ext] || 'application/octet-stream'
      const raw = fs.readFileSync(file)
      const headers = { 'content-type': type, 'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=60' }
      const ae = String(req.headers['accept-encoding'] || '')
      if (COMPRESSIBLE.test(type) && /gzip/.test(ae)) {
        const body = zlib.gzipSync(raw)
        headers['content-encoding'] = 'gzip'
        res.writeHead(200, { ...headers, 'content-length': body.length }).end(body)
        return
      }
      res.writeHead(200, { ...headers, 'content-length': raw.length }).end(raw)
    })
    server.listen(PORT, '127.0.0.1', () => resolve(server))
  })
}

const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const UA_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36'

const profiles = [
  { name: 'phone-390-slow4g-4xcpu', path: `/map/?site=${SITE}`, viewport: { width: 390, height: 844 }, mobile: true, ua: UA_MOBILE, cpu: 4, net: { down: 1.6, up: 0.75, rtt: 150 }, budgetMs: Number(arg('--budget-phone', '5000')), pathBudgetMs: Number(arg('--budget-path', '1500')) },
  { name: 'phone-390-fast-4xcpu', path: `/map/?site=${SITE}`, viewport: { width: 390, height: 844 }, mobile: true, ua: UA_MOBILE, cpu: 4, net: { down: 10, up: 2, rtt: 20 }, budgetMs: Number(arg('--budget-phone-fast', '4000')), pathBudgetMs: Number(arg('--budget-path', '1500')) },
  { name: 'desktop-1440-nothrottle', path: `/map/?site=${SITE}`, viewport: { width: 1440, height: 900 }, mobile: false, ua: UA_DESKTOP, cpu: 1, net: null, budgetMs: Number(arg('--budget-desktop', '2500')), pathBudgetMs: Number(arg('--budget-path', '1500')) },
  // Regression guard: no deep link → no early record, and the map still reaches its full
  // 2,611-site state on a throttled phone (before/after comparison for "nothing else regressed").
  { name: 'phone-390-plain-map-slow4g', path: '/map/', expectCard: false, viewport: { width: 390, height: 844 }, mobile: true, ua: UA_MOBILE, cpu: 4, net: { down: 1.6, up: 0.75, rtt: 150 }, budgetMs: 0, fullBudgetMs: Number(arg('--budget-plain-full', '20000')) },
]

const baseUrl = LIVE ? 'https://stranded.giveabit.io' : `http://127.0.0.1:${PORT}`
fs.mkdirSync(OUT, { recursive: true })

let server = null
if (!LIVE) {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error(`✖ ${DIST}/index.html missing — run \`npm run build\` first (or use --live)`)
    process.exit(2)
  }
  server = await serveDist(path.resolve(DIST))
  console.log(`🧪 local static server: ${baseUrl} (${DIST}/, gzip, trailing-slash)`)
}

const browser = await chromium.launch()
const results = []
let failures = 0

for (const p of profiles) {
  const ctx = await browser.newContext({
    viewport: p.viewport, hasTouch: p.mobile, isMobile: p.mobile,
    deviceScaleFactor: p.mobile ? 2 : 1, userAgent: p.ua,
  })
  await ctx.addInitScript(() => {
    try {
      ['stranded-onboarding-dismissed', 'stranded-map-firstrun-dismissed', 'stranded-map-search-hint-dismissed']
        .forEach((k) => localStorage.setItem(k, '1'))
    } catch {}
    window.__v = { cls: 0, fcp: 0, lcp: 0, longTasks: 0, longTaskMs: 0, dt: [] }
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__v.fcp = Math.round(e.startTime) }).observe({ type: 'paint', buffered: true })
      new PerformanceObserver((l) => { const e = l.getEntries(); if (e.length) window.__v.lcp = Math.round(e[e.length - 1].startTime) }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__v.longTasks++; window.__v.longTaskMs += Math.round(e.duration); window.__v.dt.push(Math.round(e.duration)) } }).observe({ type: 'longtask', buffered: true })
    } catch {}
  })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 200)))

  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu })
  // Cold load, every profile: a shared link is usually a first visit, and a stale HTTP cache
  // must not be able to flatter the number.
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  if (p.net) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: p.net.rtt,
      downloadThroughput: Math.round((p.net.down * 1024 * 1024) / 8),
      uploadThroughput: Math.round((p.net.up * 1024 * 1024) / 8),
    })
  }

  const url = `${baseUrl}${p.path}`
  // The name the card must show, read from the site's own published record
  // (dist/, or the live URL) BEFORE navigagting — never fetched from inside the page,
  // which would warm the very request being measured.
  let expectedName = SITE
  let recInfo = null
  try {
    let raw
    if (LIVE) {
      const r = await fetch(`${baseUrl}/data/site/${SITE}.json`)
      recInfo = { ok: r.ok, status: r.status }
      raw = r.ok ? await r.text() : null
    } else {
      const f = path.join(DIST, 'data', 'site', `${SITE}.json`)
      raw = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null
      recInfo = { ok: !!raw, status: raw ? 200 : 404 }
    }
    if (raw) {
      const j = JSON.parse(raw)
      recInfo.name = j?.properties?.name || null
      recInfo.bytes = Buffer.byteLength(raw)
      expectedName = recInfo.name || SITE
    }
  } catch (e) { recInfo = { ok: false, error: String(e).slice(0, 120) } }

  // No record (a pre-fix build): find the name in the canonical dataset instead, so the
  // card can still be timed from the same signal.
  if (expectedName === SITE) {
    for (const f of [path.join(DIST, 'data', 'stranded-sites.geojson'), 'public/data/stranded-sites.geojson']) {
      try {
        if (!fs.existsSync(f)) continue
        const geo = JSON.parse(fs.readFileSync(f, 'utf8'))
        const hit = (geo.features || []).find((x) => String(x.properties?.ghgrp_id) === SITE || String(x.id) === SITE)
        if (hit?.properties?.name) { expectedName = hit.properties.name; recInfo = { ...recInfo, nameFrom: f }; break }
      } catch {}
    }
  }
  const t0 = Date.now()
  const cardTestId = p.mobile ? 'mobile-site-sheet' : 'map-right-column'
  const nameSel = p.mobile ? '[data-testid="mobile-site-sheet"] h2' : '[data-testid="map-right-column"] h2'

  await page.goto(url, { waitUntil: 'commit', timeout: 180000 }).catch((e) => console.log('  goto: ' + e.message.slice(0, 90)))

  // the site name we expect, straight from the site's own published record
  let tCard = null, tFull = null
  const deadline = Date.now() + 150000
  // NOTE: no screenshots inside this loop. A screenshot is a CDP round-trip that has to wait
  // for the renderer, so taking one at 1 s delayed the very next observation by seconds and
  // inflated every number this script exists to report. Shots are taken after the loop.
  while (Date.now() < deadline) {
    const state = await page.evaluate(({ cardTestId, nameSel }) => {
      const card = document.querySelector(`[data-testid="${cardTestId}"]`)
      const nameEl = document.querySelector(nameSel)
      const count = document.querySelector('[data-testid="map-site-count"]')
      return {
        card: !!card,
        name: nameEl ? nameEl.innerText.trim() : null,
        count: count ? count.innerText.trim() : null,
        chip: !!document.querySelector('[data-testid="map-deeplink-loading"]'),
      }
    }, { cardTestId, nameSel }).catch(() => ({}))
    const cardVisible = !!state.card && typeof state.name === 'string' && state.name.toLowerCase().includes(expectedName.toLowerCase().slice(0, 12))
    if (tCard === null && cardVisible) tCard = Date.now() - t0
    if (tFull === null && state.count && state.count.replace(/[^0-9]/g, '') === '2611') tFull = Date.now() - t0
    // Keep polling until BOTH are seen: the card can land a beat after full state (or long
    // before it — that is the whole point of the fix), and breaking on the first signal
    // would silently hide the one we care about.
    if (tCard !== null && tFull !== null) break
    if (tFull !== null && Date.now() - t0 - tFull > 20000) break
    await page.waitForTimeout(50)
  }
  await page.screenshot({ path: path.join(OUT, `${TAG ? TAG + '-' : ''}${p.name}-card.png`) }).catch(() => {})

  const v = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {}
    const res = performance.getEntriesByType('resource').map((r) => ({
      name: new URL(r.name).pathname, ms: Math.round(r.duration), kb: Math.round((r.transferSize || 0) / 1024), start: Math.round(r.startTime),
    }))
    return { fcp: window.__v.fcp, lcp: window.__v.lcp, cls: Math.round(window.__v.cls * 1000) / 1000, longTasks: window.__v.longTasks, longTaskMs: window.__v.longTaskMs, dcl: Math.round(nav.domContentLoadedEventEnd || 0), loadEnd: Math.round(nav.loadEventEnd || 0), res }
  })

  const recordRes = v.res.find((r) => r.name === `/data/site/${SITE}.json`) || null
  const geoRes = v.res.find((r) => r.name.endsWith('stranded-sites.geojson')) || null
  // The honest split: what the deep-link path itself costs, versus what the app costs to boot.
  const recordDone = recordRes ? recordRes.start + recordRes.ms : null
  const sinceRecord = tCard != null && recordDone != null ? tCard - recordDone : null
  const sincePaint = tCard != null && v.fcp ? tCard - v.fcp : null
  const ok = p.expectCard === false
    ? tFull !== null && (p.fullBudgetMs == null || tFull <= p.fullBudgetMs) && tCard === null && (!STRICT_CONSOLE || consoleErrors.length === 0)
    : tCard !== null && tCard <= p.budgetMs && (p.pathBudgetMs == null || sinceRecord == null || sinceRecord <= p.pathBudgetMs) && tFull !== null && (!STRICT_CONSOLE || consoleErrors.length === 0)
  if (!ok) failures++

  const line = [
    `\n### ${p.name}  ${ok ? '✅' : '❌'}`,
    `  url: ${url}`,
    `  site card ("${expectedName}") visible at : ${tCard === null ? 'NEVER' : tCard + ' ms'}   ${p.expectCard === false ? '(expected: no card — plain map)' : `(budget ${p.budgetMs} ms)`}`,
    `    └ deep-link path alone: record in hand at ${recordDone == null ? '?' : recordDone} ms → card ${sinceRecord == null ? '?' : sinceRecord} ms later · ${sincePaint == null ? '?' : sincePaint} ms after first paint`,
    `  map at full 2,611-site state        : ${tFull === null ? 'NEVER within 150 s' : tFull + ' ms'}${p.fullBudgetMs ? `   (budget ${p.fullBudgetMs} ms)` : ''}`,
    `  site record /data/site/${SITE}.json : ${recordRes ? `${recordRes.ms} ms, ${recordRes.kb} KB, start ${recordRes.start} ms` : (recInfo?.ok ? 'present but not requested by the page' : 'NOT AVAILABLE — ' + JSON.stringify(recInfo))}`,
    `  full dataset geojson                : ${geoRes ? `${geoRes.ms} ms, ${geoRes.kb} KB, start ${geoRes.start} ms` : 'not fetched'}`,
    `  FCP ${v.fcp} ms · LCP ${v.lcp} ms · DCL ${v.dcl} ms · load ${v.loadEnd} ms · CLS ${v.cls}`,
    `  long tasks: ${v.longTasks} (${v.longTaskMs} ms blocked)`,
    `  console errors: ${consoleErrors.length}${consoleErrors.length ? ' → ' + JSON.stringify(consoleErrors.slice(0, 4)) : ''}`,
  ].join('\n')
  console.log(line)
  results.push({ profile: p.name, ok, tCard, tFull, budgetMs: p.budgetMs, expectedName, record: recInfo, recordRes, geoRes, recordDone, cardAfterRecordMs: sinceRecord, cardAfterFcpMs: sincePaint, vitals: { ...v, res: v.res.filter((r) => r.name.includes('/data/') || r.name === '/sw.js') }, consoleErrors, site: SITE, url, live: LIVE })
  await ctx.close()
}

await browser.close()
if (server) server.close()

const jsonPath = path.join(OUT, jsonName)
fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), site: SITE, live: LIVE, results }, null, 2))
console.log(`\n${failures === 0 ? '✅' : '❌'} ${failures} of ${profiles.length} profiles missed budget — raw numbers: ${jsonPath}`)
process.exit(failures === 0 ? 0 : 1)
