import { test, expect, type Browser, type Page } from '@playwright/test'

/**
 * Phone-sheet sections — Overview / Build / Financials / Evidence.
 *
 * WHY THIS EXISTS AS A TEST: the bottom sheet used to be one ~9-screen scroll
 * with every metric in it. The four sections are a presentation/state-navigation
 * change (no financial formula moved), and this spec pins the properties that
 * make them safe:
 *
 *   - the nav is reachable while the section scrolls (sticky), is not covered by
 *     anything, and every tab is a >=44px thumb target that fits the sheet at
 *     360/375/390/430 without document overflow;
 *   - entering a section by a REAL TAP makes that section's controls visible and
 *     the other three sections' controls hidden (nothing is reachable twice);
 *   - switching sections keeps form state (nothing unmounts) and there is still
 *     exactly ONE copy of each control in the panel;
 *   - a newly selected site opens on Overview and never shows the previous
 *     site's build values;
 *   - DESKTOP (the docked right column) shows all four sections at once with no
 *     tab strip — the sections are a small-screen affordance only.
 *
 * Emulation note: Chromium device emulation with touch — NOT real iOS Safari.
 */

const WIDTHS = [
  { w: 360, h: 740 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
] as const

const SECTIONS = ['overview', 'build', 'financials', 'evidence'] as const
type Section = (typeof SECTIONS)[number]

/** One representative control per section, used to prove what is on screen. */
const SECTION_CONTROLS: Record<Section, string> = {
  overview: 'site-score-why',
  build: 'site-cockpit',
  financials: 'site-roi-summary',
  evidence: 'site-bank-export',
}

const TAP_MIN = 44

async function openExpandedSheet(browser: Browser, w: number, h: number, path = '/map/?site=G12350') {
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // The sheet lives inside an AnimatePresence spring that re-mounts it, so
  // Playwright's stable+visible check never settles — wait on presence, then
  // let the spring finish before any hit test.
  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'),
    null,
    { timeout: 45000 },
  )
  await page.waitForTimeout(2500)
  await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
  await page.waitForTimeout(2000)
  // The docked desktop copy of the panel is in the DOM at phone widths
  // (`hidden xl:flex`), so every assertion is scoped to the VISIBLE panel.
  const panel = page.locator('[data-testid="site-details-panel"]:visible').first()
  await expect(panel).toBeVisible({ timeout: 15000 })
  return { context, page, panel }
}

const tab = (page: Page, s: Section) => page.locator(`[data-testid="site-section-tab-${s}"]:visible`).first()

for (const { w, h } of WIDTHS) {
  test(`sections: nav fits, every tab is a ${TAP_MIN}px target and taps switch section @${w}`, async ({ browser }) => {
    test.setTimeout(180000)
    const { context, page, panel } = await openExpandedSheet(browser, w, h)
    try {
      const nav = page.locator('[data-testid="site-section-nav"]')
      await expect(nav).toBeVisible({ timeout: 15000 })

      // Horizontal fit: the strip and every tab stay inside the sheet, and the
      // page itself never scrolls sideways.
      const navBox = (await nav.boundingBox())!
      expect(navBox.x, `nav left ${navBox.x}`).toBeGreaterThanOrEqual(-0.5)
      expect(navBox.x + navBox.width, `nav right ${navBox.x + navBox.width} > ${w}`).toBeLessThanOrEqual(w + 0.5)
      const doc = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(doc.innerWidth, 'layout viewport').toBeLessThanOrEqual(w + 1)
      expect(doc.scrollWidth, 'document scrollWidth').toBeLessThanOrEqual(doc.clientWidth + 1)

      for (const s of SECTIONS) {
        const t = tab(page, s)
        await expect(t, `${s} tab missing`).toBeVisible({ timeout: 10000 })
        const b = (await t.boundingBox())!
        expect(Math.round(b.height), `${s} tab height @${w}`).toBeGreaterThanOrEqual(TAP_MIN)
        expect(Math.round(b.width), `${s} tab width @${w}`).toBeGreaterThanOrEqual(TAP_MIN)
        // The tab must be what a thumb actually reaches at its centre.
        const owned = await page.evaluate(
          ({ x, y, id }) => {
            const el = document.elementFromPoint(x, y)
            return !!(el && (el.getAttribute('data-testid') === `site-section-tab-${id}` || el.closest(`[data-testid="site-section-tab-${id}"]`)))
          },
          { x: b.x + b.width / 2, y: b.y + b.height / 2, id: s },
        )
        expect(owned, `${s} tab centre is not owned by the tab @${w}`).toBe(true)
      }

      // Default state: Overview.
      await expect(tab(page, 'overview')).toHaveAttribute('aria-selected', 'true')
      await expect(panel.getByTestId(SECTION_CONTROLS.overview)).toBeVisible()

      // Real taps, one section at a time.
      for (const s of SECTIONS) {
        await tab(page, s).tap()
        await expect(tab(page, s), `${s} tab not selected after the tap`).toHaveAttribute('aria-selected', 'true')
        await expect(panel.getByTestId(SECTION_CONTROLS[s]), `${s} controls not on screen`).toBeVisible({ timeout: 10000 })
        for (const other of SECTIONS.filter(x => x !== s)) {
          await expect(
            panel.getByTestId(SECTION_CONTROLS[other]),
            `${other} controls still on screen while ${s} is selected`,
          ).toBeHidden()
        }
      }

      // The nav must stay reachable once the section has been scrolled, and must
      // paint over what scrolls under it (a strip with a gap above it is not a bar).
      await page.evaluate(() => {
        const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)
        if (p) p.scrollTop = p.scrollHeight
      })
      await page.waitForTimeout(600)
      const scrolled = await page.evaluate(() => {
        const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)!
        const n = p.querySelector('[data-testid="site-section-nav"]')!
        const pr = p.getBoundingClientRect()
        const nr = n.getBoundingClientRect()
        const stripEl = document.elementFromPoint(pr.left + pr.width / 2, pr.top + 6)
        return {
          gap: +(nr.top - pr.top).toFixed(1),
          insideNav: !!(stripEl && stripEl.closest('[data-testid="site-section-nav"]')),
          stripOwner: stripEl ? stripEl.getAttribute('data-testid') || stripEl.className.toString().slice(0, 30) : 'null',
          navTop: +nr.top.toFixed(1),
        }
      })
      expect(scrolled.gap, `no strip of scrolling content above the sticky nav (gap ${scrolled.gap}px)`).toBeLessThanOrEqual(2)
      expect(scrolled.insideNav, `the sheet's top edge is scrolling content ("${scrolled.stripOwner}"), not the nav`).toBe(true)
    } finally {
      await context.close()
    }
  })
}

test('sections: form state survives switching sections, and controls exist exactly once', async ({ browser }) => {
  test.setTimeout(180000)
  const { context, page, panel } = await openExpandedSheet(browser, 390, 844)
  try {
    // No control may be rendered twice inside the panel (the sections must not
    // duplicate the same form). Counted in the DOM: both section gating and the
    // hidden docked cockpit would fool a plain locator count.
    const dupes = await page.evaluate((ids) => {
      const panel = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)
      return Object.fromEntries(ids.map(id => [id, panel ? panel.querySelectorAll(`[data-testid="${id}"]`).length : -1]))
    }, ['miner-stack-count', 'miner-stack-dec', 'miner-stack-inc', 'site-notes', 'site-raw-properties', 'site-bank-export', 'site-cockpit', 'site-roi-summary', 'site-score-why'])
    for (const [id, n] of Object.entries(dupes)) {
      expect(n, `${id} is rendered ${n} times inside the panel (expected exactly 1)`).toBe(1)
    }

    // ---- Build: change the miner count, remember it.
    await tab(page, 'build').tap()
    const count = panel.getByTestId('miner-stack-count')
    const before = (await count.innerText()).trim()
    await panel.getByTestId('miner-stack-dec').tap()
    await expect.poll(async () => (await count.innerText()).trim(), { timeout: 5000 }).not.toBe(before)
    const edited = (await count.innerText()).trim()
    // …and the gauge/readouts follow the same single source of truth.
    await expect(panel.getByTestId('cockpit-readout-strip')).toContainText('Miners')

    // ---- Financials: open the advanced assumptions.
    await tab(page, 'financials').tap()
    await panel.getByTestId('site-advanced-toggle').tap()
    await expect(panel.getByTestId('site-advanced-panel')).toBeVisible({ timeout: 5000 })

    // ---- Evidence: type a note.
    await tab(page, 'evidence').tap()
    const notes = panel.getByTestId('site-notes').locator('textarea')
    await notes.fill('due diligence: verify gas composition')
    await expect(notes).toHaveValue('due diligence: verify gas composition')

    // ---- Back to Build: the count is the value we left, not a re-derived one.
    await tab(page, 'build').tap()
    // innerText (not toHaveText): the count button also carries screen-reader
    // copy that only shows on wider pointers.
    await expect.poll(async () => (await count.innerText()).trim(), { timeout: 5000 }).toBe(edited)
    // ---- Back to Financials: the disclosure is still open (state, not DOM luck).
    await tab(page, 'financials').tap()
    await expect(panel.getByTestId('site-advanced-panel')).toBeVisible()
    // ---- Evidence again: the typed note is still there.
    await tab(page, 'evidence').tap()
    await expect(notes).toHaveValue('due diligence: verify gas composition')
    // Everything restored to the state it was left in → still one copy each.
    await expect(panel.getByTestId('miner-stack-count')).toHaveCount(1)
    await expect(panel.getByTestId('site-notes').locator('textarea')).toHaveCount(1)
  } finally {
    await context.close()
  }
})

test('sections: the Overview CTA routes to Build, and closing the sheet leaves the map', async ({ browser }) => {
  test.setTimeout(180000)
  const { context, page, panel } = await openExpandedSheet(browser, 390, 844)
  try {
    const cta = panel.getByTestId('site-section-cta-build')
    await expect(cta).toBeVisible({ timeout: 15000 })
    const box = (await cta.boundingBox())!
    expect(Math.round(box.height), 'Configure build CTA height').toBeGreaterThanOrEqual(TAP_MIN)
    await cta.tap()
    await expect(tab(page, 'build')).toHaveAttribute('aria-selected', 'true')
    await expect(panel.getByTestId('site-cockpit')).toBeVisible()
    // The CTA belongs to Overview, so it is gone once Build is on screen.
    await expect(cta).toBeHidden()

    // Close: the sheet disappears and the map is still there.
    await page.locator('[data-testid="site-details-panel"] [aria-label="Close site details"]:visible').first().tap()
    await expect(page.locator('[data-testid="mobile-site-sheet"]')).toHaveCount(0)
    await expect(page.getByTestId('map-stage')).toBeVisible({ timeout: 15000 })
  } finally {
    await context.close()
  }
})

test('sections: a newly selected site opens on Overview with its own build values', async ({ browser }) => {
  test.setTimeout(180000)
  const { context, page, panel } = await openExpandedSheet(browser, 390, 844)
  try {
    // Leave site A on Build with an edited machine count.
    await tab(page, 'build').tap()
    await panel.getByTestId('miner-stack-dec').tap()
    await page.waitForTimeout(300)
    const siteAId = (await panel.getByTestId('site-view-compare').getAttribute('href'))?.match(/a=([^&]+)/)?.[1]
    expect(siteAId, 'site A id').toBeTruthy()

    // `j` selects the next site in the score order — an in-app selection, so the
    // panel is re-mounted without a page load.
    await page.locator('body').press('j')
    await page.waitForTimeout(1500)
    await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
    await page.waitForTimeout(1500)

    const panelB = page.locator('[data-testid="site-details-panel"]:visible').first()
    const siteBId = (await panelB.getByTestId('site-view-compare').getAttribute('href'))?.match(/a=([^&]+)/)?.[1]
    expect(siteBId, 'site B id').toBeTruthy()
    expect(siteBId).not.toBe(siteAId)

    // Default section for the new site: Overview, not the Build we left site A on.
    await expect(page.locator('[data-testid="site-section-tab-overview"]:visible')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="site-section-tab-build"]:visible')).toHaveAttribute('aria-selected', 'false')

    // And its build values are its own: compare against a fresh load of site B.
    await page.locator('[data-testid="site-section-tab-build"]:visible').tap()
    await page.waitForTimeout(500)
    const carried = (await panelB.getByTestId('miner-stack-count').innerText()).trim()

    const fresh = await context.newPage()
    await fresh.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
    await fresh.goto(`/map/?site=${siteBId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await fresh.waitForFunction(() => !!document.querySelector('[data-testid="mobile-site-peek"]'), null, { timeout: 45000 })
    await fresh.waitForTimeout(2500)
    await fresh.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
    await fresh.waitForTimeout(1500)
    await fresh.locator('[data-testid="site-section-tab-build"]:visible').tap()
    await fresh.waitForTimeout(500)
    const reference = (await fresh.locator('[data-testid="site-details-panel"]:visible').first().getByTestId('miner-stack-count').innerText()).trim()
    await fresh.close()

    expect(carried, `site ${siteBId} kept site ${siteAId}'s build values`).toBe(reference)
  } finally {
    await context.close()
  }
})

for (const w of [1280, 1440]) {
  test(`desktop @${w}: all four sections at once, no tab strip, no section gating`, async ({ browser }) => {
    test.setTimeout(180000)
    const context = await browser.newContext({ viewport: { width: w, height: 900 } })
    const page = await context.newPage()
    await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
    try {
      await page.goto('/map/?site=G12350', { waitUntil: 'domcontentloaded', timeout: 60000 })
      const panel = page.locator('[data-testid="site-details-panel"]:visible').first()
      await expect(panel).toBeVisible({ timeout: 45000 })
      await page.waitForTimeout(1500)

      // No sections UI on the docked cockpit…
      await expect(page.locator('[data-testid="site-section-nav"]:visible')).toHaveCount(0)
      await expect(page.locator('[data-testid="site-section-cta-build"]:visible')).toHaveCount(0)

      // …and every section's content is on screen at once, nothing hidden.
      for (const s of SECTIONS) {
        await expect(panel.getByTestId(SECTION_CONTROLS[s]), `desktop lost the ${s} section`).toBeVisible({ timeout: 15000 })
      }
      await expect(panel.getByTestId('site-raw-properties')).toBeAttached()
      const gating = await panel.evaluate((el) => el.querySelectorAll('.site-section-off').length)
      expect(gating, 'desktop must not hide any section block').toBe(0)
      const annotated = await panel.evaluate((el) => el.querySelectorAll('[class*="site-section-"]').length)
      expect(annotated, 'every section block is still rendered').toBeGreaterThan(20)
    } finally {
      await context.close()
    }
  })
}
