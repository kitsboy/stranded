/**
 * Mimi · t_152a2036 — desktop parity for the phone-sheet sections.
 *
 * The sections are a small-screen affordance: at xl+ the panel is the docked
 * right-column cockpit and must keep every block, in the same order, at the
 * same geometry. This compares a FINE-POINTER 1440px snapshot of two base URLs
 * (typically live vs the local build) as a multiset of
 * `tag.class [x,y,w,h]` rows, so an added no-style wrapper shows up as one
 * extra entry while anything that actually moved shows up as a differing row.
 *
 * Usage: node scripts/_mimi-sections-desktop-parity.mjs <urlA> <urlB> [width]
 */
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'

const urlA = process.argv[2] || 'https://stranded.giveabit.io'
const urlB = process.argv[3] || 'http://localhost:3013'
const width = Number(process.argv[4] || 1440)
const outDir = process.env.OUT_DIR || '/tmp/mimi-desktop-parity'
mkdirSync(outDir, { recursive: true })

const snapshot = async (browser, baseUrl) => {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${baseUrl}/map/?site=G12350`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="map-right-column"] [data-testid="site-details-panel"]'),
    null,
    { timeout: 60000 },
  )
  await page.waitForTimeout(4000)
  const snap = await page.evaluate(() => {
    const column = document.querySelector('[data-testid="map-right-column"]')
    const panel = column?.querySelector('[data-testid="site-details-panel"]')
    if (!panel) return null
    const rows = []
    for (const el of [panel, ...Array.from(panel.querySelectorAll('*'))]) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const cls = (el.className || '')
        .toString()
        .replace(/\bsite-section-(overview|build|financials|evidence)\b/g, '')
        .replace(/\bsite-section-off\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 70)
      rows.push(`${el.tagName.toLowerCase()}.${cls} [${[r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10).join(',')}]`)
    }
    const sheet = document.querySelector('[data-testid="mobile-site-sheet"]')
    return {
      rows,
      panelScrollHeight: panel.scrollHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      navInDom: !!panel.querySelector('[data-testid="site-section-nav"]'),
      sheetVisible: sheet ? sheet.getBoundingClientRect().width > 0 : false,
      sectionOffCount: panel.querySelectorAll('.site-section-off').length,
    }
  })
  await page.screenshot({ path: `${outDir}/desktop-${width}-${baseUrl.replace(/[^a-z0-9]+/gi, '_').slice(-24)}.png`, fullPage: false })
  await ctx.close()
  return snap
}

const browser = await chromium.launch()
const a = await snapshot(browser, urlA)
const b = await snapshot(browser, urlB)
await browser.close()

const count = (rows) => rows.reduce((m, r) => (m.set(r, (m.get(r) || 0) + 1), m), new Map())
const ca = count(a.rows)
const cb = count(b.rows)
const onlyA = []
const onlyB = []
for (const [k, n] of ca) {
  const m = cb.get(k) || 0
  for (let i = m; i < n; i++) onlyA.push(k)
}
for (const [k, n] of cb) {
  const m = ca.get(k) || 0
  for (let i = m; i < n; i++) onlyB.push(k)
}

const report = {
  at: new Date().toISOString(),
  width,
  urlA,
  urlB,
  rowsA: a.rows.length,
  rowsB: b.rows.length,
  identicalCounts: onlyA.length === 0 && onlyB.length === 0,
  onlyA,
  onlyB,
  meta: { a: { ...a, rows: undefined }, b: { ...b, rows: undefined } },
}
writeFileSync(`${outDir}/parity.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ...report, onlyA: onlyA.slice(0, 12), onlyB: onlyB.slice(0, 12) }, null, 2))
