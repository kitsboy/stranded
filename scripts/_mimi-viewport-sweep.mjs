/**
 * Mimi · t_88d78786 — sweep every route for layout-viewport inflation on phones.
 *
 * Companion to scripts/_mimi-viewport-culprit.mjs (single route, full offender
 * list). This one walks the whole route list across the acceptance widths and
 * emits one JSON document, so "before" and "after" can be diffed mechanically.
 *
 * Usage: node scripts/_mimi-viewport-sweep.mjs <baseUrl> <outFile> [label]
 */
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const [baseUrl, outFile, label = ''] = process.argv.slice(2)

const ROUTES = [
  '/',
  '/education',
  '/provinces/',
  '/sites/',
  '/open-data',
  '/docs/api',
  '/map/?site=G12350',
  '/dashboard',
  '/methodology',
  '/print/province',
]

const WIDTHS = [
  { w: 360, h: 740 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
  { w: 844, h: 390 }, // phone landscape
]

const SETTLE_MS = 3000

/**
 * Per-route readiness. `/education` renders its "Select Real Site from Dataset"
 * picker ONLY after the dataset fetch resolves (it has ~30 <option>s; the other
 * selects on the page have a handful). Without waiting for it the sweep reads
 * the pre-fetch layout, which is a DIFFERENT (smaller) defect — measured live:
 * 390 "clean" pre-fetch vs 360 → 788 and 375 → 381 post-fetch on the same run.
 */
const READY = {
  '/education': async (page) => {
    await page
      .waitForFunction(() => Array.from(document.querySelectorAll('select')).some((s) => s.options.length > 10), null, { timeout: 20000 })
      .catch(() => {})
  },
}

const SAMPLE = (page) =>
  page.evaluate(() => {
    const d = document.documentElement
    const desc = (n) => {
      const cls = (n.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 4).join('.')
      return `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${cls ? '.' + cls : ''}`
    }
    const layoutW = d.clientWidth
    const offenders = []
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed' || cs.position === 'absolute') continue
      if (r.right <= layoutW + 0.5) continue
      offenders.push({
        el: desc(el),
        right: +r.right.toFixed(1),
        width: +r.width.toFixed(1),
        overflowX: cs.overflowX,
        minWidth: cs.minWidth,
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      })
    }
    offenders.sort((a, b) => b.right - a.right)
    return {
      innerWidth: window.innerWidth,
      clientWidth: d.clientWidth,
      scrollWidth: d.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      offenders: offenders.slice(0, 6),
    }
  })

const browser = await chromium.launch()
const results = []

for (const { w, h } of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  for (const route of ROUTES) {
    const page = await ctx.newPage()
    let row
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      if (READY[route]) await READY[route](page)
      // Settle: keep sampling for >= SETTLE_MS and only accept a value that has
      // been stable for 3 reads. innerWidth read too early UNDER-reports the
      // defect — /education reads 381 before the site select's options populate
      // and 788 after, on the same page load (measured both).
      const t0 = Date.now()
      let last = ''
      let stable = 0
      row = await SAMPLE(page)
      while (Date.now() - t0 < 20000) {
        const key = `${row.innerWidth}/${row.clientWidth}/${row.scrollWidth}/${row.error ?? ''}`
        stable = key === last ? stable + 1 : 0
        last = key
        if (row.error || (stable >= 2 && Date.now() - t0 >= SETTLE_MS)) break
        await page.waitForTimeout(250)
        row = await SAMPLE(page)
      }
    } catch (e) {
      row = { error: String(e).slice(0, 200) }
    }
    const bad = row.error ? true : row.innerWidth - w > 1 || row.scrollWidth > row.clientWidth + 1
    results.push({ device: w, route, ...row, fail: bad })
    console.log(`${bad ? 'FAIL' : 'ok  '} ${String(w).padStart(3)}px ${route} -> innerWidth=${row.innerWidth ?? '?'} clientWidth=${row.clientWidth ?? '?'} scrollWidth=${row.scrollWidth ?? '?'}`)
    await page.close()
  }
  await ctx.close()
}

await browser.close()

const failing = results.filter((r) => r.fail)
if (outFile) {
  writeFileSync(outFile, JSON.stringify({ baseUrl, label, at: new Date().toISOString(), results, failing: failing.length }, null, 2))
  console.log(`\nwrote ${outFile} — ${failing.length}/${results.length} failing`)
}
process.exit(failing.length ? 1 : 0)
