/**
 * Mimi · t_90eed310 — page geometry snapshot, for before/after diffs.
 *
 * The /docs/api fix is coarse-pointer only, so at 1440 with a fine pointer the
 * page must be byte-identical. On a phone the `Source:` row is allowed to grow
 * (that is what a real 44px target costs inside a line); everything ELSE must
 * keep its geometry other than a pure vertical shift.
 *
 * Snapshots: page height + the box of every `hit-area-inline` / `hit-area-row`
 * link, its parent line, the next sibling, and the footer, on one route at one
 * width with either a fine or a coarse pointer.
 *
 * Usage: node scripts/_mimi-page-geometry.mjs <baseUrl> <route> <width> <fine|coarse> <outFile>
 */
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const [baseUrl, route = '/docs/api', widthArg = '1440', mode = 'fine', outFile = '/tmp/geom.json'] = process.argv.slice(2)
const width = Number(widthArg)

mkdirSync(path.dirname(outFile), { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext(
  mode === 'coarse'
    ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width, height: 900 } },
)
const page = await ctx.newPage()
await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1500)

const out = await page.evaluate(() => {
  const box = (e) => {
    if (!e) return null
    const r = e.getBoundingClientRect()
    const cs = getComputedStyle(e)
    const scroller = e.closest('[style*="overflow"]')
    return {
      tag: e.tagName.toLowerCase(),
      cls: (e.getAttribute('class') || '').slice(0, 60),
      x: +r.x.toFixed(1),
      y: +(r.y + window.scrollY).toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      display: cs.display,
      pad: `${cs.paddingTop}/${cs.paddingBottom}`,
      docOffset: scroller ? null : undefined,
    }
  }
  const links = Array.from(document.querySelectorAll('a.hit-area-inline, .hit-area-row'))
  return {
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth: window.innerWidth,
    pointerCoarse: window.matchMedia('(pointer: coarse)').matches,
    links: links.map((a) => ({
      box: box(a),
      text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      href: a.getAttribute('href'),
      parent: box(a.parentElement),
      prev: box(a.parentElement?.previousElementSibling),
      next: box(a.parentElement?.nextElementSibling),
      nextNext: box(a.parentElement?.nextElementSibling?.nextElementSibling),
    })),
    footer: box(document.querySelector('footer')),
    mainEnd: box(document.querySelector('#main-content > *:last-child')),
  }
})

writeFileSync(outFile, JSON.stringify({ baseUrl, route, width, mode, at: new Date().toISOString(), ...out }, null, 2))
console.log(`wrote ${outFile}: scrollHeight=${out.scrollHeight} innerWidth=${out.innerWidth} coarse=${out.pointerCoarse} links=${out.links.length}`)
await browser.close()
