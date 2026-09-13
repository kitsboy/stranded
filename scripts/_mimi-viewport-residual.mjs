/**
 * Mimi · t_88d78786 — WHICH unclipped box is still inflating the layout viewport?
 *
 * _mimi-viewport-culprit.mjs reports in-flow (`static`) boxes whose right edge
 * exceeds the layout viewport. That finds the offender when the page inflates
 * a lot. It cannot explain a RESIDUAL inflation, because a box inside an
 * `overflow-x: auto` container is reported even though the container clips it
 * (it does not push), and a box that the LAYOUT algorithm widens the viewport
 * for may be positioned (skipped by the culprit tool).
 *
 * This one reports every element past the layout viewport together with whether
 * an ancestor actually clips it — i.e. only `clipped: false` rows can be the
 * cause. Widest first.
 *
 * Usage: node scripts/_mimi-viewport-residual.mjs <baseUrl> <route> <deviceWidth>
 */
import { chromium } from '@playwright/test'

const [baseUrl, route = '/education', deviceWidth = '360'] = process.argv.slice(2)
const width = Number(deviceWidth)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(2500)

const out = await page.evaluate(() => {
  const desc = (n) => {
    const cls = (n.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 4).join('.')
    return `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.getAttribute('data-testid') ? `[${n.getAttribute('data-testid')}]` : ''}${cls ? '.' + cls : ''}`
  }
  const clippedBy = (el) => {
    let p = el.parentElement
    while (p && p !== document.documentElement) {
      const ox = getComputedStyle(p).overflowX
      if (ox !== 'visible') return desc(p)
      p = p.parentElement
    }
    return null
  }
  const layoutW = document.documentElement.clientWidth
  const rows = []
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    if (r.right <= layoutW + 0.5 && r.width <= layoutW + 0.5) continue
    const cs = getComputedStyle(el)
    rows.push({
      el: desc(el),
      right: +r.right.toFixed(1),
      width: +r.width.toFixed(1),
      position: cs.position,
      clippedBy: clippedBy(el),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 36),
    })
  }
  // Unclipped first (those are the only ones that can push), then widest.
  rows.sort((a, b) => Number(!!a.clippedBy) - Number(!!b.clippedBy) || b.width - a.width)
  return {
    innerWidth: window.innerWidth,
    clientWidth: layoutW,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    unclipped: rows.filter((r) => !r.clippedBy).slice(0, 12),
    clipped: rows.filter((r) => r.clippedBy).slice(0, 6),
  }
})

console.log(JSON.stringify({ baseUrl, route, width, ...out }, null, 2))
await browser.close()
