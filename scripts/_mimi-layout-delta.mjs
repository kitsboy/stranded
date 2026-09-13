/**
 * Mimi · t_ff2b0edd — did anything move that should not have?
 *
 * The fix grows two things on a phone (the province row and the pill row) and
 * nothing else. This measures the SPONSORED CARD (which must not grow: the
 * link there takes its padding back out with a negative block margin) and the
 * panel/sheet boxes, at 390px.
 *
 * Usage: node scripts/_mimi-layout-delta.mjs <baseUrl> [width]
 */
import { chromium } from '@playwright/test'

const baseUrl = process.argv[2] || 'http://127.0.0.1:3003'
const width = Number(process.argv[3] || 390)
const PANEL_SEL = '[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.goto(`${baseUrl}/map/?site=G12350`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction((s) => Array.from(document.querySelectorAll(s)).some((n) => n.getBoundingClientRect().width > 0), PANEL_SEL, { timeout: 30000 })
await page.waitForTimeout(3000)

const snap = () =>
  page.evaluate((sel) => {
    const panel = Array.from(document.querySelectorAll(sel)).find((p) => p.getBoundingClientRect().width > 0)
    if (!panel) return { error: 'no panel' }
    const h = (e) => (e ? +e.getBoundingClientRect().height.toFixed(1) : null)
    const tadbuy = panel.querySelector('a[href*="tadbuy"]')
    const province = panel.querySelector('a[href*="provinces"]')
    return {
      panel: h(panel),
      provinceLine: h(province && province.closest('p')),
      provinceLink: h(province),
      sponsoredCard: h(tadbuy && tadbuy.parentElement),
      tadbuyLink: h(tadbuy),
      sherpacartaRow: h(panel.querySelector('a[href*="sherpacarta"]')?.parentElement),
      sherpacartaLink: h(panel.querySelector('a[href*="sherpacarta"]')),
    }
  }, PANEL_SEL)

const out = { baseUrl, width, peek: await snap() }
const expander = page.locator('[data-testid="mobile-site-expand"]:visible').first()
if (await expander.count()) {
  await expander.tap()
  await page.waitForTimeout(2500)
  await page.evaluate((sel) => {
    const panel = Array.from(document.querySelectorAll(sel)).find((p) => p.getBoundingClientRect().width > 0)
    const a = panel && panel.querySelector('a[href*="sherpacarta"]')
    if (a) a.scrollIntoView({ block: 'center' })
  }, PANEL_SEL)
  await page.waitForTimeout(700)
  out.expanded = await snap()
}
console.log(JSON.stringify(out, null, 2))
await browser.close()
