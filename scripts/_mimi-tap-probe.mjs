/**
 * Mimi · t_ff2b0edd — measure the site-panel inline link tap targets.
 *
 * For each requested width it opens /map/?site=G12350 on a touch viewport,
 * expands the mobile site sheet, and reports for the three named links:
 *   - the border-box height (what a thumb has to hit)
 *   - an elementFromPoint hit-test 2px inside the top and bottom edge
 *     (a rect is only a real target if the link is what receives the tap there)
 *   - any OTHER anchor whose rect overlaps this link's rect
 *
 * Usage: node scripts/_mimi-tap-probe.mjs <baseUrl> <outDir> [widths...]
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const baseUrl = process.argv[2] || 'http://localhost:3003'
const outDir = process.argv[3] || '/tmp/tap-probe'
const widths = (process.argv.slice(4).length ? process.argv.slice(4) : ['360', '375', '390', '430']).map(Number)

const TARGETS = {
  province: 'a[href*="provinces"]',
  tadbuy: 'a[href*="tadbuy"]',
  sherpacarta: 'a[href*="sherpacarta"]',
}

mkdirSync(outDir, { recursive: true })

const measure = async (page) => {
  return page.evaluate((targets) => {
    const label = (el) =>
      (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48) || el.getAttribute('href') || '?'

    const info = (el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const midX = r.left + r.width / 2
      const owner = (y) => {
        const hit = document.elementFromPoint(midX, y)
        if (!hit) return 'null'
        const cs = getComputedStyle(hit)
        return `${hit.tagName.toLowerCase()}${hit.id ? '#' + hit.id : ''}[${(hit.className || '').toString().slice(0, 60)}] z=${cs.zIndex} pos=${cs.position} txt="${(hit.textContent || '').trim().slice(0, 24)}"`
      }
      const probe = (y) => {
        const hit = document.elementFromPoint(midX, y)
        return !!(hit && (hit === el || el.contains(hit)))
      }
      return {
        text: label(el),
        href: el.getAttribute('href'),
        display: cs.display,
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        height: +r.height.toFixed(1),
        padBlock: [cs.paddingTop, cs.paddingBottom].join('/'),
        hitTop: probe(r.top + 2),
        hitBottom: probe(r.bottom - 2),
        hitMiddle: probe(r.top + r.height / 2),
        topOwner: owner(r.top + 2),
        bottomOwner: owner(r.bottom - 2),
        middleOwner: owner(r.top + r.height / 2),
      }
    }

    const out = { state: null, found: {}, missing: [], overlaps: {}, anchors: [] }
    const panels = Array.from(
      document.querySelectorAll('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'),
    )
    // At phone widths the desktop right-column copy of the panel is also in the
    // DOM (hidden xl:flex) — measure the VISIBLE one, not the first match.
    const panel = panels.find((p) => p.getBoundingClientRect().width > 0) || null
    out.state = panel ? panel.getAttribute('data-testid') : 'none'
    if (!panel) return out
    out.anchors = Array.from(panel.querySelectorAll('a[href]'))
      .map((a) => `${(a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)} :: ${a.getAttribute('href')}`)
      .slice(0, 40)
    const scope = (sel) => panel.querySelector(sel)

    for (const [name, sel] of Object.entries(targets)) {
      const el = scope(sel)
      if (!el) {
        out.missing.push(name)
        continue
      }
      out.found[name] = info(el)
    }

    const all = Array.from(panel.querySelectorAll('a[href]'))
    for (const [name, sel] of Object.entries(targets)) {
      const el = scope(sel)
      if (!el) continue
      const a = el.getBoundingClientRect()
      const hits = []
      for (const other of all) {
        if (other === el || el.contains(other) || other.contains(el)) continue
        const b = other.getBoundingClientRect()
        if (!b.width || !b.height) continue
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left)
        const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
        if (ix > 0.5 && iy > 0.5) {
          hits.push({ text: label(other), overlap: `${ix.toFixed(0)}x${iy.toFixed(0)}` })
        }
      }
      out.overlaps[name] = hits
    }

    // Non-anchor interactive/tooltip neighbours that the grown box would sit
    // over (a <span title> tooltip target is not a link but still shouldn't be
    // swallowed by a padded neighbour).
    const nb = Array.from(panel.querySelectorAll('button, [title], input, select, summary, [role="button"]'))
    const near = {}
    for (const [name, sel] of Object.entries(targets)) {
      const el = scope(sel)
      if (!el) continue
      const a = el.getBoundingClientRect()
      const hits = []
      for (const other of nb) {
        if (other === el || el.contains(other) || other.contains(el)) continue
        const b = other.getBoundingClientRect()
        if (!b.width || !b.height) continue
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left)
        const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
        if (ix > 0.5 && iy > 0.5) {
          hits.push({ tag: other.tagName.toLowerCase(), text: label(other), overlap: `${ix.toFixed(0)}x${iy.toFixed(0)}` })
        }
      }
      near[name] = hits
    }
    out.neighbourOverlaps = near
    return out
  }, TARGETS)
}

const report = { baseUrl, at: new Date().toISOString(), results: {} }
const browser = await chromium.launch()

for (const width of widths) {
  const ctx = await browser.newContext({
    viewport: { width, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)))
  const entry = { peek: null, expanded: null, errors: errs }

  try {
    await page.goto(`${baseUrl}/map/?site=G12350`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(4000)
    // Make sure the site sheet exists at all (the map may still be settling).
    // NB: don't use waitForSelector here — the sheet is inside an AnimatePresence
    // whose spring re-mounts it, so Playwright's "stable visible" check never settles.
    await page.waitForFunction(
      () => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'),
      null,
      { timeout: 30000 },
    )
    // Let the sheet's spring settle before hit-testing: mid-animation the panel
    // is still translating, and elementFromPoint then reports whatever the
    // moving sheet is passing over.
    await page.waitForTimeout(2500)
    entry.peek = await measure(page)
    await page.screenshot({ path: path.join(outDir, `peek-${width}.png`) })

    const expander = page.locator('[data-testid="mobile-site-expand"]')
    if (await expander.count()) {
      await expander.first().click()
      await page.waitForTimeout(2500)
      // Measure the header link while the sheet is still at its top; scrolling
      // to the tail would put it out of the viewport, where elementFromPoint
      // legitimately returns null.
      entry.expandedTop = await measure(page)
      // The expanded sheet is scrollable; bring the tail of the panel into view
      // so the Tadbuy + Sherpacarta links are rendered and measurable.
      await page.evaluate(() => {
        const panels = Array.from(
          document.querySelectorAll('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'),
        )
        const panel = panels.find((p) => p.getBoundingClientRect().width > 0)
        const a = panel && panel.querySelector('a[href*="sherpacarta"]')
        if (a) a.scrollIntoView({ block: 'center' })
      })
      await page.waitForTimeout(600)
      entry.expanded = await measure(page)
      await page.screenshot({ path: path.join(outDir, `expanded-${width}.png`) })
    }
  } catch (e) {
    entry.fatal = String(e).slice(0, 300)
  }
  report.results[width] = entry
  await ctx.close()
}

await browser.close()
writeFileSync(path.join(outDir, 'tap-probe.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
