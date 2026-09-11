#!/usr/bin/env node
/**
 * qa-legibility.mjs — raw legibility counters for stranded.giveabit.io.
 *
 * The companion to `qa-widths.mjs`: that script answers "does this page pass?"
 * with per-page verdicts; this one dumps the *numbers behind* a legibility
 * claim so a report never has to quote a hand-waved count.
 *
 *   node scripts/qa-legibility.mjs                          # against the live site
 *   node scripts/qa-legibility.mjs http://localhost:3011    # against a local dist
 *   node scripts/qa-legibility.mjs https://stranded.giveabit.io 10   # floor = 10px
 *
 * Reports, per page per width:
 *   1. every visible text node below the floor, grouped by class signature
 *      (so you can see WHICH component produces them, not just how many)
 *   2. every non-inline control whose box is under 44x44 CSS px, with the
 *      phone-only (390/430) subset called out separately
 *
 * Writes the raw sample to /tmp/legibility-probe.json.
 *
 * HONESTY NOTE (why the floor is a parameter): a count of "tiny text" depends
 * entirely on how the walker treats inline nodes and aria-hidden subtrees. Any
 * claim of the form "there are N nodes below Xpx" is only meaningful with the
 * floor, the widths and this script named. The floor rule the site actually
 * commits to is 11px (see docs/qa/VERDICT-legibility.md).
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.argv.find(a => a.startsWith('http')) || 'https://stranded.giveabit.io'
const FLOOR = Number(process.argv.find(a => /^\d+$/.test(a) && Number(a) < 40) || 11)
const TAP_MIN = 44
const WIDTHS = [390, 430, 768, 1440]
const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'map-cockpit', path: '/map/?site=G10161' },
  { slug: 'sites', path: '/sites/' },
  { slug: 'dashboard', path: '/dashboard/' },
  { slug: 'open-data', path: '/open-data/' },
]
// Third-party tile/price hosts: slow, rate-limited, and irrelevant to layout.
const BLOCK = /tile\.openstreetmap|basemaps\.cartocdn|api\.coingecko|tilecarto/i

const TINY = (floor) => {
  const out = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = walker.nextNode())) {
    const text = (n.textContent || '').trim()
    if (!text) continue
    const el = n.parentElement
    if (!el) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    if (el.closest('[aria-hidden="true"]')) continue
    const fs = parseFloat(cs.fontSize)
    if (!(fs < floor)) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    out.push({
      text: text.slice(0, 48), tag: el.tagName.toLowerCase(), fs,
      cls: typeof el.className === 'string' ? el.className : '',
      w: Math.round(r.width), h: Math.round(r.height),
    })
  }
  return out
}

const CONTROLS = () => {
  const sel = 'a[href], button, select, input, textarea, summary, [role="button"], [role="tab"], [role="checkbox"], [tabindex]:not([tabindex="-1"])'
  const out = []
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue
    let r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const r0 = r
    // A form control inside its own <label>: the label is the target (WCAG 2.5.5).
    if (el.tagName === 'INPUT') {
      const lab = el.closest('label')
      if (lab) {
        const lr = lab.getBoundingClientRect()
        if (lr.width >= r0.width && lr.height >= r0.height) r = lr
      }
    }
    const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent ||
      el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 44)
    if (!name) continue
    const p = el.parentElement
    const inline = el.tagName === 'A' && p && ['P', 'LI', 'SPAN', 'DIV'].includes(p.tagName) &&
      p.textContent.trim().length > name.length + 12
    out.push({
      name, tag: el.tagName.toLowerCase(),
      w: Math.round(r.width), h: Math.round(r.height), inline,
      cls: typeof el.className === 'string' ? el.className.slice(0, 130) : '',
      testid: el.getAttribute('data-testid') || '',
    })
  }
  return out
}

const browser = await chromium.launch()
const data = { base: BASE, floor: FLOOR, tiny: {}, controls: {} }
for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 880 },
    deviceScaleFactor: 2,
    isMobile: width <= 430,
    hasTouch: width <= 430,
  })
  await ctx.route('**/*', route => (BLOCK.test(route.request().url()) ? route.abort() : route.continue()))
  for (const p of PAGES) {
    const page = await ctx.newPage()
    try {
      await page.goto(BASE + p.path, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(3500)
      const key = `${p.slug}@${width}`
      const tiny = await page.evaluate(TINY, FLOOR)
      const controls = await page.evaluate(CONTROLS)
      data.tiny[key] = tiny
      data.controls[key] = controls
      console.log(`${key}: text<${FLOOR}px=${tiny.length}  controls<${TAP_MIN}px(non-inline)=${controls.filter(c => !c.inline && (c.w < TAP_MIN || c.h < TAP_MIN)).length}`)
    } finally {
      await page.close()
    }
  }
  await ctx.close()
}
await browser.close()
writeFileSync('/tmp/legibility-probe.json', JSON.stringify(data, null, 1))

const all = Object.entries(data.tiny).flatMap(([k, rows]) => rows.map(r => ({ ...r, key: k })))
console.log(`\n==== TEXT BELOW ${FLOOR}px: ${all.length} node(s) across ${WIDTHS.length} widths x ${PAGES.length} pages ====`)
const byClass = new Map()
for (const r of all) {
  const sig = `${r.fs}px|${r.cls.replace(/text-\[\d+px\]/g, 'text-[Npx]').replace(/\s+/g, ' ').slice(0, 120)}`
  if (!byClass.has(sig)) byClass.set(sig, { n: 0, fs: r.fs, sample: r.text, pages: new Set(), cls: r.cls })
  const e = byClass.get(sig); e.n++; e.pages.add(r.key.split('@')[0])
}
for (const [, v] of [...byClass.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 25))
  console.log(`${String(v.n).padStart(5)}x ${v.fs}px [${[...v.pages].join(',')}] eg="${v.sample}"\n        ${v.cls}`)

const ctl = Object.entries(data.controls).flatMap(([k, rows]) =>
  rows.filter(r => !r.inline && (r.w < TAP_MIN || r.h < TAP_MIN)).map(r => ({ ...r, key: k })))
console.log(`\n==== CONTROLS UNDER ${TAP_MIN}px (non-inline) ====`)
const seen = new Map()
for (const c of ctl) {
  const sig = `${c.name}|${c.w}x${c.h}|${c.tag}`
  if (!seen.has(sig)) seen.set(sig, { ...c, widths: new Set() })
  seen.get(sig).widths.add(c.key.split('@')[1])
}
for (const [, v] of [...seen.entries()].sort((a, b) => a[1].h - b[1].h).slice(0, 30))
  console.log(`${v.w}x${v.h}  <${v.tag}> "${v.name}"  [${[...v.widths].join(',')}]  ${v.testid ? 'testid=' + v.testid : ''}\n      ${v.cls}`)
console.log('\nraw sample: /tmp/legibility-probe.json')
