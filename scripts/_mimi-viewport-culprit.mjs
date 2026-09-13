/**
 * Mimi · t_90eed310 — who widens the LAYOUT viewport on a phone?
 *
 * A phone browser widens the layout viewport to the page's in-flow min-content
 * when something cannot fit, so `window.innerWidth` (and every `position:fixed`
 * box anchored to it) drifts past the device width. This reports the numbers and
 * the elements whose right edge exceeds the layout viewport, widest first — so
 * the fix lands on the real offender instead of a blanket `overflow:hidden`.
 *
 * Usage: node scripts/_mimi-viewport-culprit.mjs <baseUrl> <route> <deviceWidth>
 */
import { chromium } from '@playwright/test'

const [baseUrl, route = '/', deviceWidth = '390'] = process.argv.slice(2)
const width = Number(deviceWidth)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1500)

const out = await page.evaluate(() => {
  const desc = (n) => {
    const cls = (n.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 5).join('.')
    return `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${cls ? '.' + cls : ''}`
  }
  const layoutW = document.documentElement.clientWidth
  const offenders = []
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.position === 'fixed' || cs.position === 'absolute') continue // they follow, they do not push
    if (r.right <= layoutW + 0.5) continue
    offenders.push({
      el: desc(el),
      right: +r.right.toFixed(1),
      width: +r.width.toFixed(1),
      overflowX: cs.overflowX,
      position: cs.position,
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      depth: (() => {
        let d = 0
        let p = el.parentElement
        while (p) {
          d++
          p = p.parentElement
        }
        return d
      })(),
    })
  }
  offenders.sort((a, b) => b.right - a.right)
  return {
    device: window.outerWidth,
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    offenders: offenders.slice(0, 12),
  }
})

console.log(JSON.stringify({ baseUrl, route, width, ...out }, null, 2))
await browser.close()
