/**
 * Does vertical padding on an INLINE box actually extend its HIT AREA in
 * Chromium, or only its getBoundingClientRect (visual/paint box)?
 *
 * Decisive micro-test: three same-shaped inline links in prose, only one of
 * which carries padding-block. We ask elementFromPoint *inside the padding,
 * above and below the text* — the exact gesture the site's `hit-area-inline`
 * pattern promises to serve.
 */
import { chromium } from '@playwright/test'

const html = `<!doctype html><html><body style="margin:0;font:16px/1.5 sans-serif">
<div style="padding:40px">
  <p id="para1">Alpha <a id="plain" href="#">plain link</a> omega</p>
  <p id="para2">Alpha <a id="padded" href="#" style="padding-block:20px">padded link</a> omega</p>
  <p id="para3">Alpha <a id="paddedFlex" href="#" style="padding-block:20px;display:inline-flex;align-items:center">padded flex link</a> omega</p>
  <p id="para4" style="position:relative">Alpha <a id="paddedRel" href="#" style="padding-block:20px;position:relative;z-index:1">relative link</a> omega</p>
</div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html)

const out = await page.evaluate(() => {
  const report = {}
  for (const id of ['plain', 'padded', 'paddedFlex', 'paddedRel']) {
    const el = document.getElementById(id)
    const r = el.getBoundingClientRect()
    const midX = r.left + r.width / 2
    const own = (y) => {
      const hit = document.elementFromPoint(midX, y)
      return hit === el
    }
    // find the real content box by asking where ownership starts/ends
    let firstOwn = null
    let lastOwn = null
    for (let y = r.top + 0.5; y < r.bottom; y += 1) {
      if (own(y)) {
        if (firstOwn === null) firstOwn = y
        lastOwn = y
      }
    }
    report[id] = {
      rectHeight: +r.height.toFixed(1),
      ownedHeight: firstOwn === null ? 0 : +(lastOwn - firstOwn + 1).toFixed(1),
      ownedFromTop: firstOwn === null ? null : +(firstOwn - r.top).toFixed(1),
      ownedFromBottom: lastOwn === null ? null : +(r.bottom - lastOwn).toFixed(1),
    }
  }
  return report
})

console.log(JSON.stringify(out, null, 2))
await browser.close()
