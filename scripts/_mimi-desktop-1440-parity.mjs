/**
 * Mimi · t_88d78786 — desktop parity snapshot for the /education site picker.
 *
 * The fix is phone-only (the row stacks below `sm`), so at 1440 with a FINE
 * pointer the page must be byte-identical. This snapshots the geometry of the
 * picker and everything around it, plus the document box, so before/after can
 * be diffed mechanically instead of eyeballed.
 *
 * Usage: node scripts/_mimi-desktop-1440-parity.mjs <baseUrl> <route> <outFile>
 */
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const [baseUrl, route = '/education', outFile = '/tmp/edu-1440.json'] = process.argv.slice(2)
mkdirSync(path.dirname(outFile), { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }) // fine pointer
const page = await ctx.newPage()
await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
// The site panel — and with it the picker — only renders once the dataset fetch
// resolves. Measuring before that silently falls through to the WRONG select
// (the genset one), so wait for the real thing and refuse to report otherwise.
const ready = await page
  .waitForFunction(() => document.querySelector('[data-testid="edu-site-picker"]') || document.querySelectorAll('div.glass.p-4.rounded-2xl.mb-4 select').length > 0, null, { timeout: 30000 })
  .then(() => true)
  .catch(() => false)
if (!ready) throw new Error('site picker never rendered — refusing to measure the wrong element')
await page.waitForTimeout(1000)

const out = await page.evaluate(() => {
  const box = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }
  }
  const picker =
    document.querySelector('[data-testid="edu-site-picker"]') ||
    document.querySelector('div.glass.p-4.rounded-2xl.mb-4 select') ||
    // last resort on the pre-fix live site: the widest <select> in the document
    [...document.querySelectorAll('select')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]
  const row = picker ? picker.parentElement : null
  const panel = row ? row.parentElement : null
  const label = row ? row.querySelector('label') : null
  const cs = picker ? getComputedStyle(picker) : null
  const rowCs = row ? getComputedStyle(row) : null
  const glossRow = document.querySelector('input[placeholder="Search terms..."]')?.parentElement ?? null
  const financingRow = document.querySelector('input[type="range"][class*="w-24"]')?.parentElement ?? null
  return {
    docScrollWidth: document.documentElement.scrollWidth,
    docScrollHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    glossRow: box(glossRow),
    glossRowStyle: glossRow ? { display: getComputedStyle(glossRow).display, flexWrap: getComputedStyle(glossRow).flexWrap, gap: getComputedStyle(glossRow).gap } : null,
    glossInput: box(document.querySelector('input[placeholder="Search terms..."]')),
    financingRow: box(financingRow),
    financingRowStyle: financingRow ? { display: getComputedStyle(financingRow).display, flexWrap: getComputedStyle(financingRow).flexWrap, rowGap: getComputedStyle(financingRow).rowGap, columnGap: getComputedStyle(financingRow).columnGap } : null,
    financingRange: box(document.querySelector('input[type="range"][class*="w-24"]')),
    picker: box(picker),
    pickerStyle: cs ? { display: cs.display, flex: cs.flex, minWidth: cs.minWidth, maxWidth: cs.maxWidth, width: cs.width, overflow: cs.overflow, fontSize: cs.fontSize, padding: cs.padding, height: cs.height } : null,
    pickerClass: picker ? picker.getAttribute('class') : null,
    pickerSelected: picker ? picker.selectedOptions?.[0]?.textContent ?? '' : null,
    row: box(row),
    rowStyle: rowCs ? { display: rowCs.display, flexDirection: rowCs.flexDirection, alignItems: rowCs.alignItems, gap: rowCs.gap, flexWrap: rowCs.flexWrap } : null,
    label: box(label),
    labelStyle: label ? { flexShrink: getComputedStyle(label).flexShrink, fontSize: getComputedStyle(label).fontSize } : null,
    panel: box(panel),
    panelCount: document.querySelectorAll('div.glass.p-4.rounded-2xl.mb-4').length,
  }
})

writeFileSync(outFile, JSON.stringify({ baseUrl, route, at: new Date().toISOString(), ...out }, null, 2))
console.log(JSON.stringify({ baseUrl, route, ...out }, null, 2))
await browser.close()
