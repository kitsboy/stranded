/**
 * Mimi · t_152a2036 — probe the phone sheet's Overview / Build / Financials /
 * Evidence sections.
 *
 * For each width it opens /map/?site=G12350 on an emulated touch viewport
 * (Chromium device emulation — NOT real iOS), expands the bottom sheet, and
 * reports:
 *   - the section nav's box + each tab's box (>=44px floor, horizontal fit)
 *   - whether the nav stays inside the sheet while the section scrolls
 *   - which blocks are painted in each section (data-site-section annotations)
 *   - document/layout-viewport overflow
 *   - one screenshot per section
 *
 * Usage: node scripts/_mimi-sections-probe.mjs <baseUrl> <outDir> [widths...]
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const baseUrl = process.argv[2] || 'http://localhost:3012'
const outDir = process.argv[3] || '/tmp/sections-probe'
const widths = (process.argv.slice(4).length ? process.argv.slice(4) : ['360', '375', '390', '430']).map(Number)
const SECTIONS = ['overview', 'build', 'financials', 'evidence']

mkdirSync(outDir, { recursive: true })

const measure = (page) =>
  page.evaluate((SECTIONS) => {
    const vis = (el) => {
      const cs = getComputedStyle(el)
      return cs.display !== 'none' && cs.visibility !== 'hidden'
    }
    const rect = (el) => {
      const r = el.getBoundingClientRect()
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) }
    }
    const panels = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]'))
    const panel = panels.find((p) => p.getBoundingClientRect().width > 0) || null
    const out = {
      panel: panel ? rect(panel) : null,
      panelTestId: panel ? panel.getAttribute('data-testid') : null,
      tabs: [],
      nav: null,
      scrollable: null,
      paintedBlocks: {},
      hiddenBlocks: 0,
      deviceWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
    if (!panel) return out

    const nav = panel.querySelector('[data-testid="site-section-nav"]')
    out.nav = nav ? { ...rect(nav), role: nav.getAttribute('role'), scrollTop: panel.scrollTop } : null
    if (nav) {
      const nr = nav.getBoundingClientRect()
      const inside = document.elementFromPoint(nr.left + nr.width / 2, nr.top + nr.height / 2)
      out.navSelfOwned = !!(inside && (inside === nav || nav.contains(inside)))
      out.navOwner = inside ? `${inside.tagName.toLowerCase()} "${(inside.textContent || '').trim().slice(0, 20)}"` : 'null'
      // Nothing may sit over the strip (a sticky bar that gets covered is not reachable).
      const over = []
      for (const el of Array.from(panel.querySelectorAll('*'))) {
        if (el === nav || nav.contains(el) || el.contains(nav)) continue
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue
        const b = el.getBoundingClientRect()
        if (!b.width || !b.height) continue
        const ix = Math.min(nr.right, b.right) - Math.max(nr.left, b.left)
        const iy = Math.min(nr.bottom, b.bottom) - Math.max(nr.top, b.top)
        if (ix > 1 && iy > 1) over.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 30)}`)
      }
      out.navCoveredBy = over.slice(0, 5)
    }

    for (const s of SECTIONS) {
      const tab = panel.querySelector(`[data-testid="site-section-tab-${s}"]`)
      out.tabs.push(
        tab
          ? { id: s, ...rect(tab), selected: tab.getAttribute('aria-selected'), tabindex: tab.getAttribute('tabindex'), text: (tab.textContent || '').trim(), textOverflow: tab.scrollWidth > tab.clientWidth + 1 }
          : { id: s, missing: true },
      )
    }

    // Which annotated blocks are painted right now, per section marker.
    const painted = {}
    const annotated = []
    for (const sec of SECTIONS) {
      for (const el of Array.from(panel.querySelectorAll(`.site-section-${sec}`))) annotated.push([sec, el])
    }
    const missingMarker = annotated.length
    for (const [sec, el] of annotated) {
      if (vis(el)) painted[sec] = (painted[sec] || 0) + 1
    }
    out.paintedBlocks = painted
    out.annotatedBlocks = missingMarker
    out.hiddenBlocks = annotated.filter(([, el]) => !vis(el)).length

    // The scrollable body inside the sheet.
    const scroller = panel
    out.scrollable = { scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight, scrollTop: scroller.scrollTop, overflowY: getComputedStyle(scroller).overflowY }
    return out
  }, SECTIONS)

const report = { baseUrl, at: new Date().toISOString(), emulation: 'chromium device emulation (not real iOS)', results: {} }
const browser = await chromium.launch()

for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 160)}`) })
  const entry = { errors: errs, sections: {} }

  try {
    await page.goto(`${baseUrl}/map/?site=G12350`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForFunction(
      () => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'),
      null,
      { timeout: 45000 },
    )
    await page.waitForTimeout(2500)
    entry.defaultState = await measure(page)
    await page.screenshot({ path: path.join(outDir, `peek-${width}.png`) })

    const expander = page.locator('[data-testid="mobile-site-expand"]:visible').first()
    await expander.tap()
    await page.waitForTimeout(2500)
    entry.afterExpand = await measure(page)

    for (const s of SECTIONS) {
      const tab = page.locator(`[data-testid="site-section-tab-${s}"]:visible`).first()
      await tab.tap()
      await page.waitForTimeout(700)
      entry.sections[s] = await measure(page)
      await page.screenshot({ path: path.join(outDir, `section-${s}-${width}.png`) })
    }

    // Sticky behaviour: scroll the panel a long way down and re-measure the nav.
    await page.evaluate(() => {
      const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find((n) => n.getBoundingClientRect().width > 0)
      if (p) p.scrollTop = p.scrollHeight
    })
    await page.waitForTimeout(600)
    entry.afterScroll = await measure(page)
    await page.screenshot({ path: path.join(outDir, `scrolled-${width}.png`) })
  } catch (e) {
    entry.fatal = String(e).slice(0, 400)
  }
  report.results[width] = entry
  await ctx.close()
}

await browser.close()
writeFileSync(path.join(outDir, 'sections-probe.json'), JSON.stringify(report, null, 2))
const brief = Object.fromEntries(
  Object.entries(report.results).map(([w, e]) => [
    w,
    {
      fatal: e.fatal,
      errors: e.errors,
      nav: e.sections?.overview?.nav,
      navOwned: `${e.sections?.overview?.navSelfOwned}/${e.sections?.overview?.navOwner}`,
      navCoveredBy: e.sections?.overview?.navCoveredBy,
      tabs: (e.sections?.overview?.tabs || []).map((t) => `${t.id}${t.missing ? '(missing)' : ` ${t.w}x${t.h} sel=${t.selected} ovf=${t.textOverflow}`}`),
      viewport: `${e.sections?.overview?.deviceWidth}/${e.sections?.overview?.scrollWidth}`,
      painted: Object.fromEntries(Object.entries(e.sections || {}).map(([k, v]) => [k, v.paintedBlocks])),
      annotated: e.sections?.overview?.annotatedBlocks,
      hidden: Object.fromEntries(Object.entries(e.sections || {}).map(([k, v]) => [k, v.hiddenBlocks])),
      sticky: e.afterScroll?.nav ? `panelTop=${e.afterScroll.panel?.y} navTop=${e.afterScroll.nav.y} scrollTop=${e.afterScroll.scrollable?.scrollTop} covered=${JSON.stringify(e.afterScroll.navCoveredBy)}` : null,
    },
  ]),
)
console.log(JSON.stringify(brief, null, 2))
