/** Quick check: what is painted in the strip between the sheet's top edge and the sticky section nav while the section is scrolled? */
import { chromium } from '@playwright/test'

const baseUrl = process.argv[2] || 'http://localhost:3012'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(`${baseUrl}/map/?site=G12350`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction(() => !!document.querySelector('[data-testid="mobile-site-peek"]'), null, { timeout: 45000 })
await page.waitForTimeout(2500)
await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
await page.waitForTimeout(2500)

const out = await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find((n) => n.getBoundingClientRect().width > 0)
  const nav = p.querySelector('[data-testid="site-section-nav"]')
  const desc = (el) =>
    el ? `${el.tagName.toLowerCase()}${el.getAttribute('data-testid') ? '[' + el.getAttribute('data-testid') + ']' : ''}.${(el.className || '').toString().slice(0, 40)} "${(el.textContent || '').trim().slice(0, 30)}"` : 'null'
  p.scrollTop = p.scrollHeight
  const rects = () => {
    const pr = p.getBoundingClientRect()
    const nr = nav.getBoundingClientRect()
    const probeY = pr.top + 6
    const x = pr.left + pr.width / 2
    return { panelTop: +pr.top.toFixed(1), navTop: +nr.top.toFixed(1), gap: +(nr.top - pr.top).toFixed(1), inGap: desc(document.elementFromPoint(x, probeY)), padTop: getComputedStyle(p).paddingTop, paddingBoxTop: +(pr.top + parseFloat(getComputedStyle(p).borderTopWidth)).toFixed(1) }
  }
  const before = rects()
  return { before, scrolled: p.scrollTop }
})
await page.waitForTimeout(400)
const after = await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find((n) => n.getBoundingClientRect().width > 0)
  const nav = p.querySelector('[data-testid="site-section-nav"]')
  const pr = p.getBoundingClientRect()
  const nr = nav.getBoundingClientRect()
  const el = document.elementFromPoint(pr.left + pr.width / 2, pr.top + 6)
  return {
    panelTop: +pr.top.toFixed(1),
    navTop: +nr.top.toFixed(1),
    gap: +(nr.top - pr.top).toFixed(1),
    inGap: el ? `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 30)} "${(el.textContent || '').trim().slice(0, 25)}"` : 'null',
  }
})
console.log(JSON.stringify({ ...out, after }, null, 2))
await browser.close()
