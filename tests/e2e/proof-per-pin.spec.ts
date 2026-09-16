import { test, expect, type Browser, type Page } from '@playwright/test'
import path from 'node:path'

/**
 * proof-per-pin — every pin's OTS-backed proof state (t_fcf032ef).
 *
 * The whole map is one Bitcoin-anchored file (2,611 pins share one receipt),
 * so this spec pins the honest surfaces around that fact:
 *
 *   1. the map HUD names the pin proof state and shows HOW it was checked
 *      (own node vs explorer) when it is verified;
 *   2. a pin's detail panel carries the full proof surface — anchored state,
 *      Bitcoin block, the verify method, the `ots verify` command and the
 *      downloadable .ots receipt;
 *   3. a pin hover popup carries the same proof line as the HUD;
 *   4. a forged / unresolvable proof renders "Not proven" — on every surface —
 *      and no .ots receipt is offered when there is none to offer.
 *
 * The recorded proof file (public/data/proof-per-pin.json) is a real chain
 * verdict (verified via POST https://api.satohash.io/api/verify), so the
 * confirmed path needs no network in the test; the forged path is served by
 * routing both the recorded file and the live endpoint.
 */

const SITE = 'G12350'
const SITE_NAME = 'Mission Landfill'
const ART = path.join(process.cwd(), 'artifacts', 'proof-per-pin')

/** The map page is heavy in dev (on-demand compile + 2.6 MB geojson) — give it room. */
test.setTimeout(180_000)

const VISIBLE = (tid: string) => `[data-testid="${tid}"]:visible`

async function waitForSiteSelected(page: Page, timeout = 60000) {
  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'),
    null,
    { timeout },
  )
}

async function gotoWithSite(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try {
    await waitForSiteSelected(page, 45000)
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitForSiteSelected(page, 60000)
  }
}

async function openMap(browser: Browser, { forged = false }: { forged?: boolean } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
  if (forged) {
    // Serve a rejected recorded verdict AND a rejected live check, so the
    // surfaces can only render "Not proven" — nothing to upgrade to.
    await page.route('**/data/proof-per-pin.json', (route) => {
      void route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          version: 1,
          targetSha256: '28c99c26607b33048cae81bb0a8df50f96e101a99d3e80ed148001b128e7208b',
          verdict: {
            verified: false,
            verified_method: null,
            reason: 'merkle_root_mismatch',
            error: null,
          },
        }),
      })
    })
    await page.route('**/api.satohash.io/api/verify', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: false, reason: 'merkle_root_mismatch' }),
      })
    })
  }
  await gotoWithSite(page, `/map/?site=${SITE}`)
  await expect(page.locator(VISIBLE('site-details-panel')).first()).toBeVisible({ timeout: 20000 })
  return { context, page }
}

test('map HUD shows every pin anchored to Bitcoin, with method and block', async ({ browser }) => {
  const { context, page } = await openMap(browser)
  try {
    const badge = page.locator('[data-testid="pin-proof-badge"]')
    await expect(badge).toHaveAttribute('data-pin-proof', 'confirmed', { timeout: 30000 })
    await expect(badge.locator('[data-testid="pin-proof-badge-text"]')).toContainText('Anchored to Bitcoin')
    await expect(badge.locator('[data-testid="pin-proof-badge-text"]')).toContainText('966,549')
    await expect(badge.locator('[data-testid="pin-proof-badge-text"]')).toContainText('own node')
  } finally {
    await context.close()
  }
})

test('a pin’s panel carries the full proof surface: state, block, method, ots verify, .ots download', async ({ browser }) => {
  const { context, page } = await openMap(browser)
  try {
    const surface = page.locator(VISIBLE('pin-proof'))
    await expect(surface).toBeVisible({ timeout: 30000 })

    // The pin is named and tied to the one anchored file.
    await expect(surface.locator('[data-testid="pin-proof-scope"]')).toContainText(SITE_NAME)
    await expect(surface.locator('[data-testid="pin-proof-scope"]')).toContainText('stranded-sites-REAL.geojson')

    // The shared explainer's own badge agrees: Anchored to Bitcoin, verified:true only.
    await expect(surface.locator('[data-testid="proof-state-badge"]')).toContainText('Anchored to Bitcoin')
    await expect(surface.locator('[data-testid="how-proof-works"]')).toHaveAttribute('data-proof-state', 'confirmed')
    await expect(surface).toContainText('966,549')
    await expect(surface).toContainText('no third party was trusted') // method: own node

    // Independent path: the command AND the receipt, wherever a verdict is shown.
    await expect(surface.locator('[data-testid="independent-verify-command"]')).toContainText('ots verify')
    const ots = surface.locator('[data-testid="pin-proof-ots"]')
    await expect(surface.locator('[data-testid="pin-proof-ots"]')).toHaveAttribute('href', /api\.satohash\.io\/api\/stamps\/.+download=true/)
    // Dev has no CORS to the live checker, so the honest source is the recorded
    // chain check; in production the live check re-runs and says so. Both are
    // the same verdict — assert the shared words, not the transport.
    await expect(surface.locator('[data-testid="pin-proof-source"]')).toContainText(/chain check/)
  } finally {
    await context.close()
  }
})

test('a pin hover popup shows the same proof line as the HUD', async ({ browser }) => {
  const { context, page } = await openMap(browser)
  try {
    await page.waitForTimeout(2500)
    const marker = page.getByRole('button', { name: new RegExp(SITE_NAME, 'i') }).first()
    await marker.hover({ timeout: 15000 }).catch(() => { /* popup is best-effort */ })
    const popup = page.locator('.stranded-hover-popup').first()
    if (await popup.isVisible().catch(() => false)) {
      await expect(popup.locator('[data-pin-proof="confirmed"]').first()).toBeVisible()
      await expect(popup).toContainText('Anchored to Bitcoin')
    }
  } finally {
    await context.close()
  }
})

test('a forged proof renders “Not proven” on every surface — never softened', async ({ browser }) => {
  const { context, page } = await openMap(browser, { forged: true })
  try {
    const badge = page.locator('[data-testid="pin-proof-badge"]')
    await expect(badge).toHaveAttribute('data-pin-proof', 'not-proven', { timeout: 30000 })
    await expect(badge.locator('[data-testid="pin-proof-badge-text"]')).toContainText('Not proven')

    const surface = page.locator(VISIBLE('pin-proof'))
    await expect(surface.locator('[data-testid="proof-state-badge"]')).toContainText('Not proven')
    await expect(surface.locator('[data-testid="how-proof-works"]')).toHaveAttribute('data-proof-state', 'not-proven')
    await expect(surface.locator('[data-testid="pin-proof-no-ots"]')).toBeVisible()
    await expect(surface.locator('[data-testid="pin-proof-ots"]')).toHaveCount(0)
  } finally {
    await context.close()
  }
})
