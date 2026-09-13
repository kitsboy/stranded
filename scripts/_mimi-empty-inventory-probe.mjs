/**
 * Probe: the fuel-budget empty-inventory deep link (?miners=0&gensets=&mode=manual)
 * at 1400px — does the panel render, and what does it show? (throwaway diagnostic)
 */
import { chromium } from 'playwright'

const BASE = process.env.PROBE_BASE || 'http://localhost:3003'
const URL_ = process.argv[2] || '/map/?site=G12350&miners=0&asic=s21xp&gensets=&mode=manual&tpl=custom'
const width = Number(process.argv[3] || 1400)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 300)))
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)) })
await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
await page.goto(BASE + URL_, { waitUntil: 'domcontentloaded', timeout: 60000 })
const t0 = Date.now()
let found = false
try {
  await page.waitForFunction(() => !!document.querySelector('[data-testid="site-details-panel"], [data-testid="mobile-site-peek"]'), null, { timeout: 90000 })
  found = true
} catch { /* report below */ }
await page.waitForTimeout(2000)
const state = await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)
  return {
    url: location.search,
    hasPanel: !!p,
    cockpit: !!document.querySelector('[data-testid="site-cockpit"]'),
    summary: !!document.querySelector('[data-testid="build-summary"]'),
    summaryPower: document.querySelector('[data-testid="build-summary-power"]')?.textContent,
    fuelBudget: document.querySelector('[data-testid="fleet-fuel-budget"]')?.textContent?.slice(0, 80),
    siteName: document.querySelector('[data-testid="site-details-panel"] h2')?.textContent,
    selected: !!document.querySelector('[data-testid="map-right-column"]'),
  }
})
console.log('found at', Date.now() - t0, 'ms')
console.log(JSON.stringify(state, null, 2))
console.log('errors:', errs.slice(0, 6))
await browser.close()
