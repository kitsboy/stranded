import { test, expect, type Page } from '@playwright/test'

/**
 * Mobile layout viewport regression guard.
 *
 * THE BUG THIS PINS (measured on stranded.giveabit.io at commit 3f41745):
 *   device width | innerWidth | doc scrollWidth | FAB right edge
 *        360     |    419     |      419        |      407
 *        375     |    419     |      419        |      407
 *        390     |    420     |      420        |      408
 * The header's right cluster measured 233.9px (menu 44 + theme 44 + density
 * 56.5 + language 65.4 + gaps) and the brand 129.4px; with px-6 (48) and
 * gap-4 (16) the header's in-flow min-content was ~427px. On a phone Chromium
 * widens the LAYOUT viewport to fit min-content, so `position: fixed` chrome
 * anchored to `right-4` of a 419/420px viewport — the quick-actions FAB
 * (and the bottom sheet, which is `left-0 right-0`) sat off the visible screen.
 *
 * The fix is at the offender, not a blanket `overflow:hidden`/`100vw`:
 *   - the density toggle (the widest non-essential control) moves into the
 *     MobileNav drawer on phones and stays in the header at >=md
 *   - the header row tightens to px-4 / gap-2 below md (px-6 / gap-4 at md+)
 *   - the >=md link strip is `hidden md:flex` (below md it was a ZERO-width
 *     horizontal scroll box, so its links were unreachable) and `min-w-0`
 *   - the drawer out-ranks the map chrome it covers (`body.mobile-nav-open`)
 *
 * Language deliberately STAYS in the header at phone widths — it is asserted
 * visible at 390px by tests/e2e/legibility.spec.ts.
 *
 * Note: Chromium emulation is NOT real iOS Safari. Real-device QA still
 * belongs on hardware.
 */

const MOBILE = [
  { w: 360, h: 740 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
  { w: 844, h: 390 }, // phone landscape — the >=md strip is live here
]

const facts = (page: Page) =>
  page.evaluate(() => {
    const d = document.documentElement
    const box = (sel: string) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { l: +r.left.toFixed(1), r: +r.right.toFixed(1), t: +r.top.toFixed(1), b: +r.bottom.toFixed(1), w: +r.width.toFixed(1) }
    }
    return {
      innerWidth: window.innerWidth,
      vvWidth: +window.visualViewport!.width.toFixed(1),
      vvScale: window.visualViewport!.scale,
      clientWidth: d.clientWidth,
      scrollWidth: d.scrollWidth,
      fab: box('[data-testid="quick-actions-fab"]'),
      visible: (sel: string) => {
        const el = document.querySelector(sel)
        if (!el) return false
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0
      },
    }
  })

async function openMap(page: Page) {
  await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
  await page.goto('/map/?site=G12350')
  await page.waitForTimeout(2500)
}

for (const { w, h } of MOBILE) {
  test(`layout viewport == device width and FAB on-screen @${w}px`, async ({ browser }) => {
    test.setTimeout(90000)
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    const page = await context.newPage()
    await openMap(page)
    const f = await facts(page)
    // The layout viewport must equal the device width — this is the regression.
    expect(Math.abs(f.innerWidth - w), `innerWidth ${f.innerWidth} != device ${w}`).toBeLessThanOrEqual(1)
    expect(Math.abs(f.vvWidth - w), `visualViewport.width ${f.vvWidth} != device ${w}`).toBeLessThanOrEqual(1)
    expect(f.vvScale).toBe(1)
    // No document-level horizontal overflow.
    expect(f.scrollWidth, `documentElement.scrollWidth ${f.scrollWidth} > clientWidth ${f.clientWidth}`).toBeLessThanOrEqual(f.clientWidth + 1)
    // The quick-actions FAB is fully inside the visible viewport.
    expect(f.fab, 'quick-actions FAB missing').not.toBeNull()
    expect(f.fab!.l, 'FAB clipped left').toBeGreaterThanOrEqual(-0.5)
    expect(f.fab!.r, 'FAB clipped right').toBeLessThanOrEqual(w + 0.5)
    expect(f.fab!.t).toBeGreaterThanOrEqual(-0.5)
    expect(f.fab!.b, 'FAB clipped bottom').toBeLessThanOrEqual(h + 0.5)
    await page.screenshot({ path: test.info().outputPath(`viewport-${w}x${h}.png`) })
    await context.close()
  })
}

test('phone header keeps real controls and the drawer keeps density reachable @390px', async ({ browser }) => {
  test.setTimeout(90000)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await openMap(page)

  // The three controls a phone header must still carry: theme, language, menu.
  for (const [name, sel] of [
    ['theme toggle', 'button[aria-label^="Switch to"]'],
    ['language toggle', 'button[aria-label^="Change language"]'],
    ['menu button', 'button[aria-label="Open menu"]'],
  ] as const) {
    const el = page.locator(sel).filter({ visible: true }).first()
    await expect(el, `${name} not visible in the phone header`).toBeVisible({ timeout: 10000 })
    const b = await el.boundingBox()
    expect(b, `${name} has no box`).not.toBeNull()
    expect(Math.min(b!.width, b!.height), `${name} under the 44px touch floor`).toBeGreaterThanOrEqual(44)
  }
  // Density is NOT in the header on a phone — it must not reappear there and
  // re-inflate the header. (It stays in the header at >=md: see the test below.)
  expect(await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.nav-root button[aria-label^="Density"]'))
    return btns.some(b => (b as HTMLElement).offsetParent !== null && b.getBoundingClientRect().width > 0)
  }), 'density toggle is visible in the phone header again').toBe(false)

  // Open the drawer: density is reachable there, is a 44px target, and toggles.
  await page.getByRole('button', { name: 'Open menu' }).tap()
  const density = page.locator('.mobile-nav-drawer button[aria-label^="Density"]')
  await expect(density).toBeVisible({ timeout: 10000 })
  const box = await density.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  const label0 = await density.getAttribute('aria-label')
  await density.tap()
  await expect.poll(() => density.getAttribute('aria-label'), { timeout: 5000 }).not.toBe(label0)
  await density.tap()
  await expect.poll(() => density.getAttribute('aria-label'), { timeout: 5000 }).toBe(label0)
  await context.close()
})

test('every drawer row is pointer-reachable while the drawer is open @390px', async ({ browser }) => {
  // The drawer used to be painted UNDER the map chrome (map HUD z-70, FAB z-78,
  // filter drawer z-85 vs nav z-50): 12 of its 13 links were pointer-blocked.
  test.setTimeout(90000)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await openMap(page)
  await page.getByRole('button', { name: 'Open menu' }).tap()
  await page.waitForTimeout(800)
  const blocked = await page.evaluate(() => {
    const drawer = document.querySelector('.mobile-nav-drawer')!
    const out: string[] = []
    for (const el of Array.from(drawer.querySelectorAll('a, button'))) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
      if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) {
        out.push(`${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)} -> ${hit ? hit.tagName.toLowerCase() : 'nothing'}`)
      }
    }
    return out
  })
  expect(blocked, `drawer rows occluded by page chrome: ${blocked.join('; ')}`).toEqual([])
  // Closing must release the z-index lift, or the header would stay above modals.
  await page.keyboard.press('Escape')
  await expect.poll(() => page.evaluate(() => document.body.className.includes('mobile-nav-open')), { timeout: 5000 }).toBe(false)
  await context.close()
})

test('desktop 1440px keeps the full header and has no overflow', async ({ browser }) => {
  test.setTimeout(90000)
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await openMap(page)
  for (const [name, sel] of [
    ['density toggle', 'button[aria-label^="Density"]'],
    ['language toggle', 'button[aria-label^="Change language"]'],
    ['search button', 'button[title^="Search sites"]'],
    // Trailing-slash form: the static export writes hrefs as `/education/`.
    ['nav link strip', '.nav-root a[href$="/education/"]'],
  ] as const) {
    await expect(page.locator(sel).filter({ visible: true }).first(), `${name} missing at 1440px`).toBeVisible({ timeout: 10000 })
  }
  // The mobile menu button must NOT appear on desktop.
  expect(await page.locator('button[aria-label="Open menu"]').filter({ visible: true }).count(), 'mobile menu button visible at 1440px').toBe(0)
  const f = await facts(page)
  expect(f.scrollWidth).toBeLessThanOrEqual(f.clientWidth + 1)
  expect(f.innerWidth).toBe(1440)
  await context.close()
})
