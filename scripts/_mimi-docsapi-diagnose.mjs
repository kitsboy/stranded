/**
 * Mimi · t_90eed310 — why is the /docs/api "ECCC Open Data" link reachable only
 * 32 of its 48px? Pixel-by-pixel owner dump plus the geometry of every box near
 * the link (the link's padding region, its parent, and the next line box).
 */
import { chromium } from '@playwright/test'

const baseUrl = process.argv[2] || 'https://stranded.giveabit.io'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(`${baseUrl}/docs/api`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1500)
await page.evaluate(() => {
  const a = Array.from(document.querySelectorAll('a.hit-area-inline')).find((x) => /ECCC/.test(x.textContent || ''))
  if (a) a.scrollIntoView({ block: 'center' })
})
await page.waitForTimeout(400)

const out = await page.evaluate(() => {
  const a = Array.from(document.querySelectorAll('a.hit-area-inline')).find((x) => /ECCC/.test(x.textContent || ''))
  const r = a.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const desc = (n) => {
    if (!n || n.nodeType !== 1) return String(n)
    const c = (n.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.')
    return `${n.tagName.toLowerCase()}${c ? '.' + c : ''}`
  }
  const rows = []
  for (let y = Math.floor(r.top) - 6; y <= Math.ceil(r.bottom) + 6; y++) {
    const hit = document.elementFromPoint(cx, y)
    const own = hit === a || (hit && a.contains(hit))
    rows.push({
      y,
      off: +(y - r.top).toFixed(1),
      own,
      owner: hit ? (own ? 'LINK' : desc(hit)) : 'null',
      hitRect: hit ? `${hit.getBoundingClientRect().height.toFixed(1)}h` : '-',
    })
  }
  const p = a.parentElement
  const next = a.nextElementSibling
  const box = (n) => {
    if (!n) return null
    const b = n.getBoundingClientRect()
    const cs = getComputedStyle(n)
    return { el: desc(n), tag: n.tagName, top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1), display: cs.display, lineHeight: cs.lineHeight, fontSize: cs.fontSize, margin: cs.margin, padding: cs.padding }
  }
  return {
    link: { ...box(a), cls: a.className, text: a.textContent },
    parent: box(p),
    next: next ? { ...box(next), cls: next.className } : null,
    parentChildren: Array.from(p.parentElement?.children || []).slice(0, 6).map(box),
    rows,
  }
})
console.log(`link ${out.link.top}..${out.link.bottom} h=${out.link.h} display=${out.link.display} padding=${out.link.padding}`)
console.log(`parent ${out.parent.el} ${out.parent.top}..${out.parent.bottom} h=${out.parent.h} display=${out.parent.display}`)
console.log(`next   ${out.next ? `${out.next.el} ${out.next.top}..${out.next.bottom} h=${out.next.h}` : 'none'}`)
for (const r of out.rows) {
  console.log(`y=${String(r.y).padStart(5)} off=${String(r.off).padStart(6)} ${r.own ? 'LINK' : r.owner}`)
}
await browser.close()
