#!/usr/bin/env node
/**
 * qa-widths.mjs — responsive + plausibility harness for stranded.giveabit.io
 *
 * Written for the Responsive QA card. Copy into the repo as `scripts/qa-widths.mjs`
 * and run with the repo's own playwright (already a devDependency):
 *
 *   node scripts/qa-widths.mjs                        # against the live site
 *   node scripts/qa-widths.mjs http://localhost:3003  # against a local build
 *   node scripts/qa-widths.mjs --assert               # non-zero exit on any finding
 *
 * WHY IT MEASURES SO MUCH: a screenshot only helps if a human (or a vision model)
 * looks at it, and that is not always available. So layout judgements are turned
 * into assertions — clipping, overlap, tiny text, overflow, undersized controls —
 * which is both stricter and reproducible. Screenshots are still written, for the
 * cases where a human does look.
 *
 * Per width x page:
 *   1. console / page errors, failed requests — FRESH context per page (reusing one
 *      page across navigations attributes one page's late errors to the next, which
 *      produced phantom findings in the first version of this script)
 *   2. horizontal overflow (scrollWidth vs innerWidth)
 *   3. interactive controls clipped by the viewport edge
 *   4. interactive controls that OVERLAP each other (the desktop toolbar-vs-docked-panel
 *      class of bug, caught numerically)
 *   5. visible text below 11px
 *   6. smallest *control* target at mobile widths (inline links in prose are listed
 *      separately — WCAG 2.5.5 exempts them, and flagging them buries the real one).
 *      For a form control wrapped in its own <label>, the LABEL is measured: the
 *      target is the row you can tap, not the glyph inside it (WCAG 2.5.5).
 *   7. implausible magnitudes (a unit bug looks perfectly fine in a screenshot)
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv.find(a => a.startsWith('http')) || 'https://stranded.giveabit.io'
const ASSERT = process.argv.includes('--assert')

const WIDTHS = [390, 430, 768, 1024, 1280, 1440, 1920]
const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'map-cockpit', path: '/map/?site=G10161' }, // cockpit via deep link — no marker click needed
  { slug: 'sites', path: '/sites/' },
  { slug: 'open-data', path: '/open-data/' },
  { slug: 'dashboard', path: '/dashboard/' },
]
const MOBILE_MAX = 767
const MIN_TOUCH = 44          // cockpit controls (the card's bar)
const MIN_TOUCH_OTHER = 24    // WCAG 2.5.8 AA floor for every other page
const MIN_FONT = 11          // px, visible text
const MIN_CONTROL = 24       // px — ignore tiny things when computing overlap (noise)
const OVERLAP_PCT = 0.4      // overlap > 40% of the smaller control counts
const CEILINGS = [
  // Plausibility bands, not "expected values". A full-gas build on the largest
  // site (G10161 Keele Valley: 105.8 MW of gas, ~26k miners) legitimately reaches
  // ~6.6e8 sats/day and ~$5e5/day, so the ceilings sit well above that and catch
  // only order-of-magnitude unit bugs — the cockpit's formatSats double-conversion
  // showed sats/day at ~1e16.
  { re: /([\d,]{4,})\s*sats\s*\/?\s*day/i, max: 1e10, label: 'sats/day' },
  { re: /\$\s?([\d,]{5,})\s*\/?\s*day/i, max: 1e8, label: '$/day' },
  { re: /([\d,]{4,})\s*kW\b/i, max: 2e5, label: 'kW' },
]

const results = []
const num = s => Number(String(s).replace(/[,\s]/g, ''))
// The card's 44px bar is for cockpit controls; every other page uses the WCAG
// 2.5.8 AA floor (24px). The smallest control is still printed for every page.
const touchBar = slug => slug === 'map-cockpit' ? MIN_TOUCH : MIN_TOUCH_OTHER

async function probe(browser, width, { slug, path }) {
  const ctx = await browser.newContext({
    viewport: { width, height: width <= MOBILE_MAX ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile: width <= MOBILE_MAX,
    hasTouch: width <= MOBILE_MAX,
    userAgent: width <= MOBILE_MAX
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 240)) })
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 240)))

  const row = { width, slug, overflow: null, control: null, controlPx: null, inline: null,
                magnitudes: [], clipped: [], occluded: [], tinyText: 0, tinySample: '', errors, shot: null }
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    // Wait for the cockpit on the map page rather than a fixed short sleep — a
    // cold load has to fetch and parse the 2.85 MB dataset first, so a fixed 3-5s
    // sleep under load produces phantom "the panel is missing" findings.
    if (path.startsWith('/map')) {
      // Wait for the panel that is actually visible at this width: the docked
      // cockpit column on desktop, the bottom sheet below xl. On phones the sheet
      // opens in preview (header only) mode, so expand it before asserting — the
      // cockpit itself is only rendered once the sheet is expanded.
      const panel = width < 1280
        ? '[data-testid="mobile-site-sheet"]'
        : '[data-testid="map-right-column"]'
      await page.waitForSelector(panel, { state: 'visible', timeout: 45000 }).catch(() => {})
      const expand = page.locator('[data-testid="mobile-site-expand"]')
      if (await expand.count()) await expand.first().click().catch(() => {})
    }
    await page.waitForTimeout(3000)

    const m = await page.evaluate(({ MIN_CONTROL, OVERLAP_PCT, MIN_FONT }) => {
      const de = document.documentElement
      const vw = window.innerWidth
      const vis = el => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.bottom > 0 && r.top < window.innerHeight * 4
      }
      const desc = el => (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40)
      const nodes = [...document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')]
        .filter(vis)
        .map(el => {
          const r0 = el.getBoundingClientRect()
          const cs = getComputedStyle(el)
          const inlineLink = el.tagName === 'A' && (cs.display === 'inline' || cs.display === 'inline-block') && !el.getAttribute('aria-label')
          // EFFECTIVE TARGET SIZE for label-wrapped form controls.
          // WCAG 2.5.5 talks about the *target*, not the glyph: a 13px checkbox
          // inside its own 44px <label> row is a 44px target — the whole row is
          // clickable. Measuring the input's own rect reported that as a 13px
          // control, which is a measurement artifact, not a touch failure.
          // (Same rule the onboarding checklist relies on.)
          let r = r0
          if (el.tagName === 'INPUT') {
            const lab = el.closest('label')
            if (lab) {
              const lr = lab.getBoundingClientRect()
              if (lr.width >= r0.width && lr.height >= r0.height) r = lr
            }
          }
          return {
            label: desc(el), inline: inlineLink,
            px: Math.round(Math.min(r.width, r.height)),
            x: Math.round(r.left), y: Math.round(r.top),
            w: Math.round(r.width), h: Math.round(r.height),
          }
        })

      // Occlusion test: a rect that overlaps another rect is not proof that
      // anything is hidden — elements inside a horizontally scrollable strip or a
      // collapsed menu still report their full rect. What actually matters is
      // whether a control's centre point is reachable, so ask the browser which
      // element is painted at that point.
      const inScroller = el => {
        let n = el.parentElement
        while (n && n !== document.body) {
          const ox = getComputedStyle(n).overflowX
          if (ox === 'auto' || ox === 'scroll') return true
          n = n.parentElement
        }
        return false
      }
      // A closed <details> hides its children with content-visibility; they still
      // report a full rect and would otherwise be flagged as occluded/clipped.
      const inClosedDetails = el => {
        const d = el.closest('details')
        return !!d && !d.open
      }
      const clipped = [], occluded = []
      for (const el of document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')) {
        if (!vis(el) || inScroller(el) || inClosedDetails(el)) continue
        const r = el.getBoundingClientRect()
        const cx = Math.round(r.left + r.width / 2)
        const cy = Math.round(r.top + r.height / 2)
        const label = desc(el)
        const inlineLink = el.tagName === 'A' && (getComputedStyle(el).display === 'inline' || getComputedStyle(el).display === 'inline-block')
        if (inlineLink) continue
        if (cx < 0 || cx > window.innerWidth) { if (clipped.length < 4) clipped.push(`${label} (centre x=${cx})`); continue }
        if (cy < 0 || cy > window.innerHeight) continue
        const top = document.elementFromPoint(cx, cy)
        if (top && top !== el && !el.contains(top) && !top.contains(el)) {
          const who = (top.getAttribute('aria-label') || top.className || top.tagName).toString().slice(0, 30)
          if (occluded.length < 4) occluded.push(`${label} behind ${who}`)
        }
      }

      // visible text smaller than MIN_FONT px
      let tiny = 0, sample = ''
      for (const el of document.querySelectorAll('p, span, div, small, li, td, th, label, button, a')) {
        if (!el.childNodes.length) continue
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)
        if (!hasText || !vis(el)) continue
        const fs = parseFloat(getComputedStyle(el).fontSize)
        if (fs && fs < MIN_FONT) { tiny++; if (!sample) sample = `${fs}px "${el.textContent.trim().slice(0, 30)}"` }
      }

      return {
        scrollWidth: de.scrollWidth, innerWidth: vw,
        text: document.body ? document.body.innerText.slice(0, 20000) : '',
        nodes, clipped, occluded, tiny, sample,
      }
    }, { MIN_CONTROL, OVERLAP_PCT, MIN_FONT })

    row.overflow = m.scrollWidth - m.innerWidth
    row.clipped = m.clipped
    row.occluded = m.occluded
    row.tinyText = m.tiny
    row.tinySample = m.sample
    if (width <= MOBILE_MAX && m.nodes.length) {
      const controls = m.nodes.filter(n => !n.inline).sort((a, b) => a.px - b.px)
      const inlines = m.nodes.filter(n => n.inline).sort((a, b) => a.px - b.px)
      if (controls.length) { row.control = controls[0].label; row.controlPx = controls[0].px }
      if (inlines.length) row.inline = `${inlines[0].px}px "${inlines[0].label}"`
    }
    for (const c of CEILINGS) {
      const mm = m.text.match(c.re)
      if (mm && num(mm[1]) > c.max) row.magnitudes.push(`${c.label} ${mm[1]} > ${c.max.toLocaleString()}`)
    }
    mkdirSync('docs/qa', { recursive: true })
    row.shot = `docs/qa/${width}-${slug}.png`
    await page.screenshot({ path: row.shot, fullPage: false })
  } catch (e) {
    errors.push('nav: ' + String(e).slice(0, 200))
  } finally {
    await ctx.close()
  }
  results.push(row)
  return row
}

const browser = await chromium.launch()
for (const width of WIDTHS) {
  for (const p of PAGES) {
    const r = await probe(browser, width, p)
    const bar = touchBar(p.slug)
    const bad = []
    if (r.overflow > 1) bad.push(`overflow +${r.overflow}px`)
    if (r.controlPx != null && r.controlPx < bar) bad.push(`control ${r.controlPx}px "${r.control}" (bar ${bar}px)`)
    if (r.clipped.length) bad.push(`clipped: ${r.clipped.join('; ')}`)
    if (r.occluded.length) bad.push(`occluded: ${r.occluded.join('; ')}`)
    if (r.tinyText > 3) bad.push(`${r.tinyText} tiny text (e.g. ${r.tinySample})`)
    if (r.magnitudes.length) bad.push('magnitude: ' + r.magnitudes.join('; '))
    if (r.errors.length) bad.push(`${r.errors.length} console error(s)`)
    console.log(`[${String(width).padStart(4)}px] ${p.slug.padEnd(12)} ${bad.length ? 'FAIL  ' + bad.join(' | ') : 'ok'}`)
  }
}
await browser.close()

const fails = results.filter(r =>
  r.overflow > 1 || (r.controlPx != null && r.controlPx < touchBar(r.slug)) ||
  r.clipped.length || r.occluded.length || r.tinyText > 3 || r.magnitudes.length || r.errors.length)
console.log(`\n${results.length} checks, ${fails.length} with findings. Screenshots in docs/qa/.`)
if (fails.length) {
  console.log('\nFindings:')
  for (const f of fails) {
    const bits = []
    if (f.overflow > 1) bits.push(`horizontal overflow +${f.overflow}px`)
    if (f.controlPx != null && f.controlPx < touchBar(f.slug)) bits.push(`smallest control ${f.controlPx}px "${f.control}" (bar ${touchBar(f.slug)}px)`)
    if (f.clipped.length) bits.push('clipped at edge: ' + f.clipped.join('; '))
    if (f.occluded.length) bits.push('controls occluded by something (centre-point test): ' + f.occluded.join('; '))
    if (f.tinyText > 3) bits.push(`${f.tinyText} text nodes under ${MIN_FONT}px (e.g. ${f.tinySample})`)
    if (f.magnitudes.length) bits.push('implausible figure: ' + f.magnitudes.join('; '))
    if (f.errors.length) bits.push(`${f.errors.length} console error(s): ${f.errors.slice(0, 2).join(' / ')}`)
    console.log(`  ${f.width}px ${f.slug}: ${bits.join(' | ')}`)
  }
}
const inlineOnly = results.filter(r => r.inline)
if (inlineOnly.length) {
  console.log('\nInline text links under 44px (WCAG 2.5.5 exempts these — listed, not failures):')
  for (const r of inlineOnly) console.log(`  ${r.width}px ${r.slug}: ${r.inline}`)
}
if (ASSERT) process.exit(fails.length ? 1 : 0)
