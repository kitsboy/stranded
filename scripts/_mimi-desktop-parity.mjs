/**
 * Mimi · t_ff2b0edd — desktop (fine pointer) parity + evidence shots.
 *
 * The fix lives entirely inside `@media (pointer: coarse)`, so a mouse user at
 * 1440px must see byte-identical geometry. This measures the same three links
 * plus the panel header line at 1440 and prints them for a before/after diff,
 * and writes the 1440 screenshot.
 *
 * Usage: node scripts/_mimi-desktop-parity.mjs <baseUrl> <outDir>
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const baseUrl = process.argv[2] || 'http://127.0.0.1:3003'
const outDir = process.argv[3] || '/tmp/desktop-parity'
const PANEL_SEL = '[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(`${baseUrl}/map/?site=G12350`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction(
  (sel) => Array.from(document.querySelectorAll(sel)).some((n) => n.getBoundingClientRect().width > 0),
  PANEL_SEL,
  { timeout: 30000 },
)
await page.waitForTimeout(3000)

const out = await page.evaluate((sel) => {
  const panel = Array.from(document.querySelectorAll(sel)).find((p) => p.getBoundingClientRect().width > 0)
  if (!panel) return { error: 'no panel' }
  const box = (e) => {
    if (!e) return null
    const r = e.getBoundingClientRect()
    return {
      x: +r.x.toFixed(1),
      y: +r.y.toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      display: getComputedStyle(e).display,
      padBlock: `${getComputedStyle(e).paddingTop}/${getComputedStyle(e).paddingBottom}`,
    }
  }
  const province = panel.querySelector('a[href*="provinces"]')
  return {
    panel: box(panel),
    provinceLine: box(province && province.closest('p')),
    province: box(province),
    tadbuy: box(panel.querySelector('a[href*="tadbuy"]')),
    sherpacarta: box(panel.querySelector('a[href*="sherpacarta"]')),
  }
}, PANEL_SEL)

const shot = path.join(outDir, 'map-1440.png')
await page.screenshot({ path: shot, fullPage: false })
writeFileSync(path.join(outDir, 'desktop-parity.json'), JSON.stringify({ baseUrl, out }, null, 2))
console.log(JSON.stringify({ baseUrl, out, shot }, null, 2))
await browser.close()
