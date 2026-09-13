/**
 * Quick probe: does the build summary strip render, is it inside the sticky
 * strip, and what does it say? (Throwaway diagnostic used while building the
 * feature; the committed coverage is tests/e2e/build-summary.spec.ts.)
 *
 * Usage: node scripts/_mimi-build-summary-probe.mjs [siteId] [width]
 */
import { chromium, devices } from 'playwright'

const siteId = process.argv[2] || 'G12350'
const width = Number(process.argv[3] || 390)
const BASE = process.env.PROBE_BASE || 'http://localhost:3003'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 640, hasTouch: width < 640, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0, 200)) })
page.on('pageerror', e => console.log('PAGE ERR:', String(e).slice(0, 200)))
await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
await page.goto(`${BASE}/map/?site=${siteId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })

const sel = '[data-testid="site-details-panel"]:visible'
if (width < 640) {
  await page.waitForFunction(() => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'), null, { timeout: 45000 })
  await page.waitForTimeout(2500)
  await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
  await page.waitForTimeout(2000)
  await page.locator('[data-testid="site-section-tab-build"]:visible').tap()
  await page.waitForTimeout(800)
} else {
  await page.waitForFunction(() => !!document.querySelector('[data-testid="site-details-panel"]'), null, { timeout: 60000 })
  await page.waitForTimeout(2500)
}
const panel = page.locator(sel).first()
const out = await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)
  const t = (el, s) => (el?.querySelector(`[data-testid="${s}"]`)?.textContent || '').trim()
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }
  if (!p) return { error: 'no visible panel' }
  const sticky = p.querySelector('[data-testid="site-section-sticky"]')
  const nav = p.querySelector('[data-testid="site-section-nav"]')
  const sum = p.querySelector('[data-testid="build-summary"]')
  const gauge = p.querySelector('[data-testid="miner-stack-gauge-label"]')
  const roiRow = label => {
    const rows = Array.from(p.querySelectorAll('[data-testid="site-roi-summary"] > div > div'))
    const row = rows.find(r => (r.textContent || '').includes(label))
    return row ? row.textContent.trim().replace(/\s+/g, ' ') : null
  }
  return {
    variant: sum?.getAttribute('data-variant'),
    insideSticky: !!(sticky && sum && sticky.contains(sum)),
    sticky: box(sticky),
    nav: box(nav),
    sum: box(sum),
    panel: box(p),
    power: t(p, 'build-summary-power'),
    miners: t(p, 'build-summary-miners'),
    capex: t(p, 'build-summary-capex'),
    net: t(p, 'build-summary-net'),
    payback: t(p, 'build-summary-payback'),
    note: t(p, 'build-summary-note'),
    rows: (() => {
      const s = p.querySelector('[data-testid="build-summary"]')
      if (!s) return null
      const h = sel => { const e = s.querySelector(sel); return e ? +e.getBoundingClientRect().height.toFixed(1) : null }
      return {
        total: +s.getBoundingClientRect().height.toFixed(1),
        power: h('.build-summary-power'),
        head: h('.build-summary-power-head'),
        meter: h('.build-summary-meter'),
        sub: h('.build-summary-power-sub'),
        grid: h('.build-summary-grid'),
        note: h('.build-summary-note'),
        noteLines: (() => { const e = s.querySelector('.build-summary-note'); return e ? Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)) : null })(),
      }
    })(),
    currency: t(p, 'build-summary-currency'),
    optimistic: !!p.querySelector('[data-testid="build-summary-optimistic"]'),
    gauge: (gauge?.textContent || '').trim().replace(/\s+/g, ' '),
    roi: { totalInv: roiRow('Total Investment'), dailyProfitNet: roiRow('Daily Profit (net)'), payback: roiRow('Payback (Total Capital)') },
    buildOrder: Array.from(p.querySelectorAll('[data-testid="site-section-body"] > *'))
      .filter(el => el.getBoundingClientRect().height > 1 && getComputedStyle(el).display !== 'none')
      .map(el => `${getComputedStyle(el).order}:${el.getAttribute('data-testid') || el.className.toString().slice(0, 24)}`),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
