/**
 * Follow-up: WHY did `hit-area-inline` deliver 48px of *paint* but only ~16px
 * of *hit area* on the real site panel?
 *
 * Hypothesis: the province link sits inside `<p class="… truncate">`, and
 * `truncate` sets `overflow: hidden`; an ancestor's overflow clip also clips
 * hit testing, so the link's vertical padding (which by design paints outside
 * the line box) is unreachable.
 *
 * Cases (the link — never the paragraph — carries the target style):
 *   A  no clip:                         <p><a padding-block:16px></p>
 *   B  clipped ancestor (truncate):     <p style="overflow:hidden;white-space:nowrap"><a padding-block:16px></p>
 *   C  clipped ancestor + inline-flex:  <p style="overflow:hidden;white-space:nowrap"><a display:inline-flex;min-height:44px></p>
 *   D  clipped ancestor + inline-block: <p style="overflow:hidden;white-space:nowrap"><a display:inline-block;line-height:44px></p>
 */
import { chromium } from '@playwright/test'

const caseHtml = (pStyle, aId, aStyle) => `
  <div style="padding:6px 0">
    <div style="overflow:hidden;width:320px">
      <p style="margin:0;font:16px/1.5 sans-serif;${pStyle}">Mission, <a id="${aId}" href="#" style="${aStyle}">British Columbia</a></p>
    </div>
  </div>`

const html = `<!doctype html><html><body style="margin:0;font:16px/1.5 sans-serif">
<div style="padding:40px">
  <h3>A — padded inline, no clip</h3>
  ${caseHtml('', 'A', 'padding-block:16px')}
  <h3>B — padded inline inside overflow:hidden (truncate)</h3>
  ${caseHtml('overflow:hidden;white-space:nowrap;text-overflow:ellipsis', 'B', 'padding-block:16px')}
  <h3>C — 44px inline-flex inside overflow:hidden</h3>
  ${caseHtml('overflow:hidden;white-space:nowrap;text-overflow:ellipsis', 'C', 'display:inline-flex;align-items:center;min-height:44px')}
  <h3>D — 44px inline-block inside overflow:hidden</h3>
  ${caseHtml('overflow:hidden;white-space:nowrap;text-overflow:ellipsis', 'D', 'display:inline-block;line-height:44px')}
</div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html)

const out = await page.evaluate(() => {
  const report = {}
  for (const id of ['A', 'B', 'C', 'D']) {
    const el = document.getElementById(id)
    const r = el.getBoundingClientRect()
    const p = el.closest('p').getBoundingClientRect()
    const midX = r.left + r.width / 2
    const own = (y) => document.elementFromPoint(midX, y) === el
    let first = null
    let last = null
    for (let y = r.top + 0.5; y < r.bottom; y += 1) {
      if (own(y)) {
        if (first === null) first = y
        last = y
      }
    }
    report[id] = {
      rectHeight: +r.height.toFixed(1),
      paragraphHeight: +p.height.toFixed(1),
      ownedHeight: first === null ? 0 : +(last - first + 1).toFixed(1),
      ownedFromTop: first === null ? null : +(first - r.top).toFixed(1),
      ownedFromBottom: last === null ? null : +(r.bottom - last).toFixed(1),
    }
  }
  return report
})

console.log(JSON.stringify(out, null, 2))
await browser.close()
