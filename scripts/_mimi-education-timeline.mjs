/**
 * Timeline probe: how long does live /education take to reach its settled
 * layout viewport, and when do the dataset-driven <select> options land?
 * Usage: node scripts/_mimi-education-timeline.mjs <baseUrl> [deviceWidth]
 */
import { chromium } from '@playwright/test'

const [baseUrl, dw = '390', dh = '844', onboarding = '0'] = process.argv.slice(2)
const width = Number(dw)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: Number(dh) }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
if (onboarding === '1') await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
const t0 = Date.now()
await page.goto(`${baseUrl}/education`, { waitUntil: 'domcontentloaded', timeout: 60000 })
for (let i = 0; i < 20; i++) {
  const s = await page.evaluate(() => ({
    iw: window.innerWidth,
    cw: document.documentElement.clientWidth,
    sw: document.documentElement.scrollWidth,
    selects: Array.from(document.querySelectorAll('select')).map((x) => x.options.length),
    widest: (() => {
      let best = null
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) continue
        const cs = getComputedStyle(el)
        if (cs.position === 'fixed' || cs.position === 'absolute') continue
        if (r.right <= document.documentElement.clientWidth + 0.5) continue
        if (!best || r.width > best.w) best = { w: Math.round(r.width), tag: el.tagName.toLowerCase(), testid: el.getAttribute('data-testid') || '', cls: (el.getAttribute('class') || '').slice(0, 40) }
      }
      return best
    })(),
  }))
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s iw=${s.iw} cw=${s.cw} sw=${s.sw} selects=${JSON.stringify(s.selects)} widest=${JSON.stringify(s.widest)}`)
  await page.waitForTimeout(2000)
}
await browser.close()
