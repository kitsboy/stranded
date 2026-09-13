/**
 * Mimi · t_90eed310 — audit every `hit-area-inline` link on a coarse pointer.
 *
 * WHY: `a.hit-area-inline` grows an INLINE box with `padding-block`. That is
 * layout-neutral, and it is a real 44px target ONLY when nothing removes the
 * painted padding from hit testing. Two things do remove it:
 *   1. an ancestor with `overflow: hidden` (an ancestor's clip clips hit testing
 *      as well as paint — `truncate` sets `overflow: hidden`), and
 *   2. a LATER INLINE-LEVEL sibling: the following line box overlaps the link's
 *      bottom padding band and wins the hit test there (measured with
 *      `_mimi-hit-inline-linebox.mjs`: 48px rect → 34px reachable with a
 *      following `<a class="inline-block">`, 48px reachable with a following
 *      `<div>` or `<p>`).
 *
 * A rect is not a target, so this script reports, per link:
 *   - rect (border box) height
 *   - REACHABLE band: the contiguous run of 1px steps down the link's own centre
 *     column where `elementFromPoint` returns the link (or a descendant), as
 *     ownedFrom/ownedTo relative to rect.top, the span length, and the full pill
 *   - ownership 2px inside the top edge, 2px inside the bottom edge, and centre
 *   - whoever owns the tap where the link does not (the cutting box)
 *   - every ancestor with a non-visible overflow axis + the effective clip band
 *
 * Usage: node scripts/_mimi-hit-area-audit.mjs <baseUrl> <outDir> [width] [height]
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const baseUrl = process.argv[2] || 'http://localhost:3003'
const outDir = process.argv[3] || '/tmp/hit-area-audit'
const width = Number(process.argv[4] || 390)
const height = Number(process.argv[5] || 844)

const ROUTES = ['/', '/open-data', '/docs/api', '/map/?site=G12350', '/provinces/']
const SEL = 'a.hit-area-inline, .hit-area-row'

mkdirSync(outDir, { recursive: true })

const desc = (node) => {
  if (!node || node.nodeType !== 1) return String(node)
  const c = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 4).join('.')
  return `${node.tagName.toLowerCase()}${node.id ? '#' + node.id : ''}${c ? '.' + c : ''}`
}

const measureOne = (page, index) =>
  page.evaluate(
    ({ sel, index }) => {
      const el = document.querySelectorAll(sel)[index]
      if (!el) return null
      const short = (s, n = 40) => (s || '').trim().replace(/\s+/g, ' ').slice(0, n)
      const desc = (node) => {
        if (!node || node.nodeType !== 1) return String(node)
        const c = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 4).join('.')
        return `${node.tagName.toLowerCase()}${node.id ? '#' + node.id : ''}${c ? '.' + c : ''}`
      }
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const cx = r.left + r.width / 2

      const ownerAt = (y) => {
        const hit = document.elementFromPoint(cx, y)
        if (!hit) return 'null'
        if (hit === el || el.contains(hit)) return 'LINK'
        return desc(hit)
      }
      const owns = (y) => ownerAt(y) === 'LINK'

      // The contiguous reachable band through the link's own centre column.
      let first = null
      let last = null
      for (let y = Math.floor(r.top); y <= Math.ceil(r.bottom); y++) {
        if (owns(y)) {
          if (first === null) first = y
          last = y
        }
      }
      let count = 0
      for (let y = Math.floor(r.top); y <= Math.ceil(r.bottom); y++) if (owns(y)) count++

      const clippers = []
      let clipTop = r.top
      let clipBottom = r.bottom
      const chain = []
      let p = el.parentElement
      while (p && p !== document.documentElement) {
        const pcs = getComputedStyle(p)
        const pr = p.getBoundingClientRect()
        const clipsY = pcs.overflowY !== 'visible'
        const clipsX = pcs.overflowX !== 'visible'
        if (chain.length < 10)
          chain.push({ el: desc(p), overflow: `${pcs.overflowX}/${pcs.overflowY}`, box: `${pr.top.toFixed(0)}..${pr.bottom.toFixed(0)} h=${pr.height.toFixed(0)}` })
        if (clipsY) {
          clippers.push({ el: desc(p), css: `${pcs.overflowX}/${pcs.overflowY}`, top: +pr.top.toFixed(1), bottom: +pr.bottom.toFixed(1), h: +pr.height.toFixed(1) })
          clipTop = Math.max(clipTop, pr.top)
          clipBottom = Math.min(clipBottom, pr.bottom)
        }
        p = p.parentElement
      }

      // Next inline-level sibling — the other thing that eats the bottom band.
      let sib = el.parentElement?.nextElementSibling
      let sibInfo = null
      while (sib && !sibInfo) {
        const scs = getComputedStyle(sib)
        const sr = sib.getBoundingClientRect()
        if (scs.display.startsWith('inline') && sr.height > 0)
          sibInfo = { el: desc(sib), display: scs.display, box: `${sr.top.toFixed(0)}..${sr.bottom.toFixed(0)}` }
        sib = sib.nextElementSibling
      }

      const ownedFrom = first === null ? null : +(first - r.top).toFixed(1)
      const ownedTo = last === null ? null : +(last - r.top).toFixed(1)

      return {
        tag: el.tagName.toLowerCase(),
        cls: el.getAttribute('class'),
        text: short(el.textContent),
        href: el.getAttribute('href') || '(none)',
        display: cs.display,
        padBlock: `${cs.paddingTop}/${cs.paddingBottom}`,
        rect: { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        rectH: +r.height.toFixed(1),
        reachable: count,
        ownedFrom,
        ownedTo,
        probeTop: ownerAt(r.top + 2),
        probeBottom: ownerAt(r.bottom - 2),
        probeMid: ownerAt(r.top + r.height / 2),
        ok: owns(r.top + 2) && owns(r.bottom - 2) && owns(r.top + r.height / 2) && count >= Math.min(r.height, 44) - 2,
        clippers,
        clipBandH: +(clipBottom - clipTop).toFixed(1),
        nextInlineSibling: sibInfo,
        near: chain,
      }
    },
    { sel: SEL, index },
  )

const report = { baseUrl, width, height, at: new Date().toISOString(), routes: {} }
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const onLive = !/localhost|127\.0\.0\.1/.test(baseUrl)

for (const route of ROUTES) {
  const entry = { links: [], hidden: [], errors: [], fatal: null }
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(onLive ? 1500 : 600)

    // Reveal everything: walk the page, then expand the mobile site sheet and
    // any <details> inside the visible panel (the cockpit link lives in one).
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.9
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 50))
      }
      window.scrollTo(0, 0)
      await new Promise((r) => setTimeout(r, 200))
    })
    const expander = page.locator('[data-testid="mobile-site-expand"]')
    if (await expander.count()) {
      await expander.first().click()
      await page.waitForTimeout(2500)
      const details = page.locator('[data-testid="mobile-site-peek"] details, [data-testid="site-details-panel"] details')
      const n = await details.count()
      for (let i = 0; i < n; i++) {
        const d = details.nth(i)
        if (await d.count()) {
          const open = await d.evaluate((node) => node.hasAttribute('open')).catch(() => true)
          if (!open) await d.locator('summary').first().click({ timeout: 5000 }).catch(() => {})
        }
      }
      await page.waitForTimeout(1200)
    }
    await page.waitForTimeout(400)

    const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, SEL)
    for (let i = 0; i < count; i++) {
      const zero = await page.evaluate(
        ({ sel, i }) => {
          const el = document.querySelectorAll(sel)[i]
          if (!el) return true
          const r = el.getBoundingClientRect()
          return r.width === 0 || r.height === 0
        },
        { sel: SEL, i },
      )
      if (zero) {
        entry.hidden.push(await measureOne(page, i))
        continue
      }
      await page.evaluate(
        ({ sel, i }) => {
          const el = document.querySelectorAll(sel)[i]
          if (el) el.scrollIntoView({ block: 'center' })
        },
        { sel: SEL, i },
      )
      await page.waitForTimeout(160)
      const m = await measureOne(page, i)
      if (m) entry.links.push({ index: i, ...m })
    }
    if (onLive || true) await page.screenshot({ path: path.join(outDir, `route-${route.replace(/[^a-z0-9]/gi, '_')}.png`), fullPage: false }).catch(() => {})
  } catch (e) {
    entry.fatal = String(e).slice(0, 300)
  }
  report.routes[route] = entry
}

await browser.close()
writeFileSync(path.join(outDir, 'hit-area-audit.json'), JSON.stringify(report, null, 2))

let fails = 0
for (const [route, entry] of Object.entries(report.routes)) {
  console.log(`\n=== ${route} — ${entry.links.length} visible, ${entry.hidden.length} hidden ${entry.fatal ? 'FATAL: ' + entry.fatal : ''}`)
  for (const l of entry.links) {
    const bad = !l.ok
    if (bad) fails++
    console.log(
      `  ${bad ? 'FAIL' : 'OK  '} rect ${l.rectH}px / reachable ${l.reachable}px [${l.ownedFrom}..${l.ownedTo}]  "${l.text}" -> ${l.href}` +
        (bad ? `\n       probes: top=${l.probeTop} | bottom=${l.probeBottom} | mid=${l.probeMid}` : '') +
        (l.clippers.length ? `\n       clip ancestor: ${l.clippers.map((c) => `${c.el} [${c.css}] h=${c.h}`).join(' ; ')} (band ${l.clipBandH}px)` : '') +
        (bad && l.nextInlineSibling && l.probeBottom !== 'LINK' ? `\n       next inline-level sibling: ${l.nextInlineSibling.el} (${l.nextInlineSibling.display}) ${l.nextInlineSibling.box}` : ''),
    )
  }
  for (const h of entry.hidden) console.log(`  (hidden at ${width}px) ${h.tag} "${h.text}" rectH=${h.rectH} display=${h.display}`)
}
console.log(`\n${fails} failing link(s) at ${width}px. wrote ${path.join(outDir, 'hit-area-audit.json')}`)
