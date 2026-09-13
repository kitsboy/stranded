/**
 * Probe: does a named fleet template survive a reload? (throwaway diagnostic)
 */
import { chromium } from 'playwright'

const BASE = process.env.PROBE_BASE || 'http://localhost:3003'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('pageerror', e => console.log('PAGE ERR', String(e).slice(0, 200)))
await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
await page.goto(`${BASE}/map/?site=G12350`, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'), null, { timeout: 60000 })
await page.waitForTimeout(2500)
await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
await page.waitForTimeout(2000)
await page.locator('[data-testid="site-section-tab-build"]:visible').tap()
await page.waitForTimeout(600)
const panel = page.locator('[data-testid="site-details-panel"]:visible').first()

await panel.getByTestId('miner-stack-save-template').tap()
await page.waitForTimeout(400)
await panel.getByTestId('miner-stack-save-form').locator('input').fill('PROBE build')
await panel.getByTestId('miner-stack-save-form').getByRole('button', { name: 'Save', exact: true }).tap()
await page.waitForTimeout(800)
console.log('after save, localStorage:', await page.evaluate(() => localStorage.getItem('stranded.fleets.v1')))
console.log('cards:', await panel.locator('[data-testid^="fleet-preset-card-"]').allInnerTexts())

await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'), null, { timeout: 60000 })
await page.waitForTimeout(2500)
console.log('after reload, localStorage:', await page.evaluate(() => localStorage.getItem('stranded.fleets.v1')))
await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
await page.waitForTimeout(1800)
await page.locator('[data-testid="site-section-tab-build"]:visible').tap()
await page.waitForTimeout(800)
const panel2 = page.locator('[data-testid="site-details-panel"]:visible').first()
console.log('cards after reload:', await panel2.locator('[data-testid^="fleet-preset-card-"]').allInnerTexts())
await browser.close()
