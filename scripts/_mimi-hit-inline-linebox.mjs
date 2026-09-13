/**
 * Mimi · t_90eed310 — controlled micro-test: WHY does an inline `hit-area-inline`
 * link lose part of its padded hit box on a real page? The live /docs/api link
 * measures 48px rect but only 32-34px reachable, with no overflow:hidden
 * ancestor anywhere in its chain (checked: every ancestor reports
 * overflow: visible). Two live links inside the same shape of <p> behave
 * differently, so the mechanism is in the surrounding boxes, not the link.
 *
 * Variants (all: <a> with the exact coarse-pointer rule padding-block:1rem,
 * 14px text in a 20px line box, so rect = 48px, line box = 20px):
 *   A  link alone in a <p>                     (baseline, the documented pattern)
 *   B  link in a <p>, sibling <a inline-block> 24px below (the /docs/api shape)
 *   C  link in a <p>, sibling <div> 24px below
 *   D  link in a <p> followed immediately by another <p>
 *   E  link alone in a <div>                    (the app/page.tsx shape)
 *   F  link in a <p>, ITS OWN line, sibling <a inline-block> 24px below
 *
 * Usage: node scripts/_mimi-hit-inline-linebox.mjs [outDir]
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const outDir = process.argv[2] || '/tmp/hit-inline-linebox'
mkdirSync(outDir, { recursive: true })

const PAGE = `<!doctype html><html><head><style>
  body { margin: 0; background:#0b1220; color:#cbd5e1; font: 14px/20px system-ui; }
  .wrap { padding: 40px 16px; }
  .gap { height: 120px; }
  a.hit-area-inline { padding-block: 1rem; color: #5BC0BE; }
  a.sib-inline-block { display: inline-block; margin-top: 24px; color: #FF8C00; }
  div.sib-block { margin-top: 24px; }
  p { margin: 0; }
  p + p { margin-top: 24px; }
  @media (pointer: coarse) { a.hit-area-inline { padding-block: 1rem; } }
  @media (pointer: coarse) { a.hit-area-row { min-height: 44px; display: inline-flex; align-items: center; } }
</style></head><body>
<div class="wrap" id="root"></div>
<script>
  const root = document.getElementById('root')
  const linkHTML = '<a class="hit-area-inline" href="#t" id="L">ECCC Open Data</a>'
  const variants = {
    A: '<p>Source: ' + linkHTML + '</p>',
    B: '<p>Source: ' + linkHTML + '</p><a class="sib-inline-block" href="#x">Try it on the map</a>',
    C: '<p>Source: ' + linkHTML + '</p><div class="sib-block">later block</div>',
    D: '<p>Source: ' + linkHTML + '</p><p>a following paragraph</p>',
    E: '<div class="mt-6">' + linkHTML + '</div>',
    F: '<p>' + linkHTML + '</p><a class="sib-inline-block" href="#x">Try it on the map</a>',
    // The FIX shape: .hit-area-row (min-height 44 + inline-flex) in place of the
    // padding trick, in the same trap position as B/F. Computed height counts
    // toward the line box, so nothing can sit on the padded band.
    G: '<p>Source: <a class="hit-area-row" href="#t" id="L">ECCC Open Data</a></p><a class="sib-inline-block" href="#x">Try it on the map</a>',
    H: '<p>Source: <a class="hit-area-row" href="#t" id="L">ECCC Open Data</a></p><div class="sib-block">later block</div>',
  }
  for (const [k, html] of Object.entries(variants)) {
    const h = document.createElement('div')
    h.setAttribute('data-variant', k)
    h.innerHTML = html
    root.appendChild(h)
    const g = document.createElement('div'); g.className = 'gap'; root.appendChild(g)
  }
</script></body></html>`

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.setContent(PAGE)

const report = await page.evaluate(() => {
  const out = {}
  for (const host of document.querySelectorAll('[data-variant]')) {
    const a = host.querySelector('#L')
    host.scrollIntoView({ block: 'center' })
    const r = a.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const owns = (y) => {
      const h = document.elementFromPoint(cx, y)
      return !!(h && (h === a || a.contains(h)))
    }
    let first = null
    let last = null
    let count = 0
    for (let y = Math.floor(r.top); y <= Math.ceil(r.bottom); y++) {
      if (owns(y)) {
        if (first === null) first = y
        last = y
        count++
      }
    }
    const parent = a.parentElement.getBoundingClientRect()
    const next = a.parentElement.nextElementSibling
    out[host.getAttribute('data-variant')] = {
      rect: { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), h: +r.height.toFixed(1) },
      parentBox: `${parent.top.toFixed(1)}..${parent.bottom.toFixed(1)} h=${parent.height.toFixed(1)}`,
      nextBox: next ? `${next.tagName}:${next.getBoundingClientRect().top.toFixed(1)}..${next.getBoundingClientRect().bottom.toFixed(1)}` : 'none',
      reachable: count,
      ownedFrom: first === null ? null : +(first - r.top).toFixed(1),
      ownedTo: last === null ? null : +(last - r.top).toFixed(1),
      topEdgeOwned: owns(r.top + 2),
      bottomEdgeOwned: owns(r.bottom - 2),
      midOwned: owns(r.top + r.height / 2),
    }
  }
  return out
})

console.log('variant  rectH  reachable  ownedRange(offset)  top2  bot-2  mid   parentBox                 next')
for (const [k, v] of Object.entries(report)) {
  console.log(
    `${k}        ${String(v.rect.h).padStart(5)}  ${String(v.reachable).padStart(8)}  ${String(v.ownedFrom).padStart(7)}..${String(v.ownedTo).padStart(6)}  ${String(v.topEdgeOwned).padStart(5)} ${String(v.bottomEdgeOwned).padStart(6)} ${String(v.midOwned).padStart(5)}   ${v.parentBox.padEnd(24)} ${v.nextBox}`,
  )
}
writeFileSync(path.join(outDir, 'hit-inline-linebox.json'), JSON.stringify(report, null, 2))
await browser.close()
