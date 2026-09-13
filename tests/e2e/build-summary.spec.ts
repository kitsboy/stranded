import { test, expect, type Browser, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * The build summary strip — the persistent power / CapEx / net / payback readout
 * that sits beside the ASIC, generator and quantity controls.
 *
 * WHY THIS EXISTS AS A TEST: the strip is only worth having if it is (a) always
 * there while you are choosing, (b) quoting EXACTLY the model numbers the rest of
 * the app quotes, and (c) honest when the build cannot work. Each of those is
 * pinned here:
 *
 *   - persistent: after the Build section is scrolled, the strip is still on
 *     screen under the section tabs, with no strip of content above the tabs, and
 *     every control can be scrolled clear of it (nothing hides under it);
 *   - consistent: its power matches the cockpit's own gauge, and its CapEx,
 *     net/day and payback match the ROI summary rows (same model, same formatter,
 *     same currency) and the bank-pack export;
 *   - live: changing the ASIC / miner count / generator mix changes it;
 *   - honest: an oversized install and a zero-gas site are named in words, and
 *     payback reads N/A instead of a fabricated number;
 *   - additive: section switching, site switching, save/reload and the fleet
 *     share URL all still work, and the docked desktop cockpit keeps every block
 *     with no tabs and no sticky strip.
 *
 * Emulation note: Chromium device emulation with touch at 360/375/390/430 and a
 * fine pointer at 1280/1440 — NOT real iOS hardware.
 */

const SITE = 'G12350'
/** Brunswick Smelter — a real dataset row with 0 kg CH4/day, so the gas ceiling is 0. */
const ZERO_GAS_SITE = 'G10035'
const WIDTHS = [
  { w: 360, h: 740 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
] as const
const DESKTOP = [1280, 1440] as const
const ART = path.join(process.cwd(), 'artifacts', 'build-summary')

const VISIBLE = (tid: string) => `[data-testid="${tid}"]:visible`

type Sheet = { context: Awaited<ReturnType<Browser['newContext']>>; page: Page; panel: ReturnType<Page['locator']> }

/** Wait until the map has selected a site (phone peek, expanded sheet, or docked panel). */
async function waitForSiteSelected(page: Page, timeout = 60000) {
  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'),
    null,
    { timeout },
  )
}

/**
 * Open a map deep link and wait for its site to be selected.
 *
 * The `?site=` link can lose a race with the map's own URL sync while the 2611
 * site rows load (measured: the map paints "2611 of 2611 sites visible" with no
 * site selected at all), which is a pre-existing timing property of the map —
 * not something this spec should paper over with an ever-longer sleep. Re-asking
 * for the same URL once is deterministic and keeps the spec honest: if the deep
 * link is genuinely broken, the retry fails too.
 */
async function gotoWithSite(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try {
    await waitForSiteSelected(page, 45000)
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitForSiteSelected(page, 60000)
  }
}

/** Open the expanded phone sheet on a site and select a section. */
async function openSheet(
  browser: Browser,
  w: number,
  h: number,
  { site = SITE, section = 'build' as 'build' | 'overview' | 'financials' | 'evidence' } = {},
): Promise<Sheet> {
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
  await gotoWithSite(page, `/map/?site=${site}`)
  await page.waitForTimeout(2500)
  await page.locator(VISIBLE('mobile-site-expand')).first().tap()
  await page.waitForTimeout(2000)
  const panel = page.locator(VISIBLE('site-details-panel')).first()
  await expect(panel).toBeVisible({ timeout: 15000 })
  if (section !== 'overview') {
    await page.locator(VISIBLE(`site-section-tab-${section}`)).tap()
    await page.waitForTimeout(600)
  }
  return { context, page, panel }
}

/** Geometry + text of the strip, read from the visible panel only. */
async function stripSnapshot(page: Page) {
  return page.evaluate(() => {
    const panel = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]'))
      .find(n => n.getBoundingClientRect().width > 0)
    if (!panel) return null
    const box = (sel: string) => {
      const el = panel.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1) }
    }
    const text = (sel: string) => (panel.querySelector(sel)?.textContent || '').replace(/\s+/g, ' ').trim()
    const roiRow = (label: string) => {
      const rows = Array.from(panel.querySelectorAll('[data-testid="site-roi-summary"] > div > div'))
      const row = rows.find(r => (r.textContent || '').includes(label))
      return row ? (row.textContent || '').replace(/\s+/g, ' ').trim() : null
    }
    return {
      panel: box('[data-testid="site-details-panel"]') ?? { top: 0, bottom: 0 },
      scrollport: (() => { const r = panel.getBoundingClientRect(); return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), height: +r.height.toFixed(1) } })(),
      sticky: box('[data-testid="site-section-sticky"]'),
      nav: box('[data-testid="site-section-nav"]'),
      strip: box('[data-testid="build-summary"]'),
      variant: panel.querySelector('[data-testid="build-summary"]')?.getAttribute('data-variant') || null,
      stripCount: panel.querySelectorAll('[data-testid="build-summary"]').length,
      power: text('[data-testid="build-summary-power"]'),
      miners: text('[data-testid="build-summary-miners"]'),
      capex: text('[data-testid="build-summary-capex"]'),
      net: text('[data-testid="build-summary-net"]'),
      payback: text('[data-testid="build-summary-payback"]'),
      note: text('[data-testid="build-summary-note"]'),
      currency: text('[data-testid="build-summary-currency"]'),
      optimistic: !!panel.querySelector('[data-testid="build-summary-optimistic"]'),
      gauge: text('[data-testid="miner-stack-gauge-label"]'),
      roi: {
        totalInvestment: roiRow('Total Investment'),
        dailyProfitNet: roiRow('Daily Profit (net)'),
        payback: roiRow('Payback (Total Capital)'),
      },
      order: Array.from(panel.querySelectorAll('[data-testid="site-section-body"] > *'))
        .filter(el => (el as HTMLElement).getBoundingClientRect().height > 1 && getComputedStyle(el).display !== 'none')
        .map(el => ({ order: getComputedStyle(el).order, id: el.getAttribute('data-testid') || el.className.toString().slice(0, 28) })),
    }
  })
}

const kW = (s: string) => s.replace(/\s*kW\s*/g, ' ').replace(/\s+/g, ' ').trim()
/** The ROI summary row's trailing fiat figure — its LAST parenthesised group
 *  (the first one is often a label, e.g. "Daily Profit (net)0.025 BTC ($1.9K)"). */
const money = (s: string | null) => {
  const groups = (s || '').match(/\(([^)]+)\)/g)
  return groups?.length ? groups[groups.length - 1].slice(1, -1).trim() : null
}

/** The ROI summary's payback row ("756 days" / "N/A") → the strip's own wording. */
function expectedPayback(roiText: string | null): string {
  const n = Number((roiText || '').match(/([\d,]+)\s*days?/)?.[1]?.replace(/,/g, ''))
  if (!Number.isFinite(n)) return 'N/A'
  return n < 730 ? `${n.toLocaleString()} d` : `${(n / 365).toFixed(1)} yr`
}

for (const { w, h } of WIDTHS) {
  test(`build summary @${w}: persistent under the tabs, and every figure matches the model`, async ({ browser }) => {
    test.setTimeout(240000)
    const { context, page, panel } = await openSheet(browser, w, h)
    try {
      const strip = panel.getByTestId('build-summary')
      await expect(strip).toBeVisible({ timeout: 15000 })

      const snap = await stripSnapshot(page)
      expect(snap, 'no visible panel').not.toBeNull()
      const s = snap!

      // One strip, and it is part of the sticky strip (tabs + summary together).
      expect(s.stripCount, 'the strip must render exactly once in the panel').toBe(1)
      expect(s.variant, 'phone sheet variant').toBe('sheet')
      expect(s.sticky, 'no sticky strip').not.toBeNull()
      expect(Math.round(s.strip!.top), 'strip must sit inside the sticky strip').toBeGreaterThanOrEqual(Math.round(s.nav!.bottom) - 1)
      expect(Math.round(s.strip!.bottom), 'strip must end the sticky strip').toBeLessThanOrEqual(Math.round(s.sticky!.bottom) + 1)

      // Currency is named, never implied.
      expect(s.currency).toBe('USD')

      // Power agrees with the cockpit's own gauge (same two model numbers).
      expect(kW(s.power)).toBe(kW(s.gauge.replace(/^[\d,]+\s*\/\s*[\d,]+\s*miners/, '')))
      // CapEx / net / payback agree with the ROI summary — same value, same formatter.
      expect(s.capex, 'CapEx vs ROI summary').toBe(money(s.roi.totalInvestment))
      expect(s.net, 'net/day vs ROI summary').toBe(money(s.roi.dailyProfitNet))
      expect(s.payback, 'payback vs ROI summary').toBe(expectedPayback(s.roi.payback))

      // The strip's own text is human, and the optimistic assumption is labelled.
      expect(s.power).toMatch(/^[\d.,]+ of [\d.,]+ kW$/)
      expect(s.miners).toMatch(/^[\d,]+ miners?$/)
      expect(s.optimistic, 'the shipped hashprice is above network — it must be labelled').toBe(true)
      expect(s.note.length, 'the capacity note must say something').toBeGreaterThan(10)

      // Two rows on a narrow phone: the metrics row sits under the power row.
      const rows = await panel.getByTestId('build-summary').evaluate(el => {
        const r = (sel: string) => el.querySelector(sel)!.getBoundingClientRect()
        return { power: r('.build-summary-power').bottom, grid: r('.build-summary-grid').top }
      })
      expect(Math.round(rows.grid), 'metrics row must follow the power row').toBeGreaterThanOrEqual(Math.round(rows.power) - 2)

      // Never let the strip eat the sheet: it is a summary, not the page.
      expect(s.sticky!.h, `sticky strip ${s.sticky!.h}px of a ${Math.round(s.scrollport.height)}px sheet`)
        .toBeLessThanOrEqual(Math.max(200, s.scrollport.height * 0.34))

      // Persistent: scroll the section to its end — the strip is still on screen,
      // flush under the tabs, and the tabs still cover the sheet's top edge.
      await page.evaluate(() => {
        const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)
        if (p) (p as HTMLElement).scrollTop = (p as HTMLElement).scrollHeight
      })
      await page.waitForTimeout(500)
      const scrolled = await page.evaluate(() => {
        const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)!
        const nav = p.querySelector('[data-testid="site-section-nav"]')!
        const strip = p.querySelector('[data-testid="build-summary"]')!
        const pr = p.getBoundingClientRect()
        const nr = nav.getBoundingClientRect()
        const sr = strip.getBoundingClientRect()
        const atTop = document.elementFromPoint(pr.left + pr.width / 2, pr.top + 6)
        return {
          gap: +(nr.top - pr.top).toFixed(1),
          navOwnsTop: !!(atTop && atTop.closest('[data-testid="site-section-nav"]')),
          stripTop: +sr.top.toFixed(1),
          stripBottom: +sr.bottom.toFixed(1),
          navBottom: +nr.bottom.toFixed(1),
          panelTop: +pr.top.toFixed(1),
          panelBottom: +pr.bottom.toFixed(1),
        }
      })
      expect(scrolled.gap, `no content above the sticky tabs (gap ${scrolled.gap}px)`).toBeLessThanOrEqual(2)
      expect(scrolled.navOwnsTop, 'the sheet top edge must be the tabs, not scrolling content').toBe(true)
      expect(Math.round(scrolled.stripTop), 'strip still pinned under the tabs after scrolling').toBeGreaterThanOrEqual(Math.round(scrolled.navBottom) - 1)
      expect(scrolled.stripBottom, 'strip still fully inside the sheet').toBeLessThanOrEqual(scrolled.panelBottom + 1)
      expect(scrolled.stripTop, 'strip still fully inside the sheet').toBeGreaterThanOrEqual(scrolled.panelTop - 1)

      // Nothing hides under the strip: each control can be scrolled clear of it.
      for (const tid of ['site-asic-select', 'site-genset-select', 'miner-stack']) {
        const probe = await page.evaluate((id: string) => {
          const p = Array.from(document.querySelectorAll('[data-testid="site-details-panel"]')).find(n => n.getBoundingClientRect().width > 0)!
          const el = p.querySelector(`[data-testid="${id}"]`) as HTMLElement
          const sticky = p.querySelector('[data-testid="site-section-sticky"]') as HTMLElement
          const target = id === 'miner-stack' ? el : el
          target.scrollIntoView({ block: 'start' })
          const r = target.getBoundingClientRect()
          const sr = sticky.getBoundingClientRect()
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(18, r.height / 2))
          return {
            top: +r.top.toFixed(1),
            stickyBottom: +sr.bottom.toFixed(1),
            owned: !!(hit && hit.closest(`[data-testid="${id}"]`)),
          }
        }, tid)
        expect(probe.top, `${tid} scrolled to the top must clear the sticky strip (top ${probe.top}, strip ends ${probe.stickyBottom})`)
          .toBeGreaterThanOrEqual(probe.stickyBottom - 1)
        expect(probe.owned, `${tid} not reachable after scrolling`).toBe(true)
      }

      fs.mkdirSync(ART, { recursive: true })
      await page.locator(VISIBLE('site-details-panel')).screenshot({ path: path.join(ART, `build-summary-${w}.png`) })
    } finally {
      await context.close()
    }
  })
}

test('build summary @390: changing ASIC, miner count or generator updates it immediately', async ({ browser }) => {
  test.setTimeout(240000)
  const { context, page, panel } = await openSheet(browser, 390, 844)
  try {
    await expect(panel.getByTestId('build-summary')).toBeVisible({ timeout: 15000 })
    const read = () => stripSnapshot(page)
    const before = (await read())!

    // …… the miner count (± on the stack).
    await panel.getByTestId('miner-stack-dec').tap()
    await expect
      .poll(async () => (await read())!.power, { timeout: 5000 })
      .not.toBe(before.power)
    const afterCount = (await read())!
    expect(afterCount.miners).not.toBe(before.miners)

    // …… the ASIC model: a smaller machine changes miners, power, CapEx, net and payback.
    await panel.getByTestId('site-asic-select').locator('select').selectOption('m30s')
    await expect
      .poll(async () => (await read())!.power, { timeout: 5000 })
      .not.toBe(afterCount.power)
    const afterAsic = (await read())!
    expect(afterAsic.capex, 'a cheaper ASIC must change total CapEx').not.toBe(afterCount.capex)
    // Net/day is quoted by a rounding formatter, so one miner's worth of change
    // can round to the same string — a different machine cannot.
    expect(afterAsic.net, 'net/day must follow the ASIC').not.toBe(afterCount.net)
    expect(afterAsic.payback, 'payback must follow the ASIC').not.toBe(afterCount.payback)

    // …… the generator mix: a different unit changes the available kW.
    await panel.getByTestId('site-genset-select').locator('select').selectOption('mobile250')
    await expect
      .poll(async () => (await read())!.power, { timeout: 5000 })
      .not.toBe(afterAsic.power)
    const afterGenset = (await read())!
    const availOf = (t: string) => Number(t.split('of')[1].replace(/[^\d.]/g, ''))
    expect(availOf(afterGenset.power), 'switching to a 250 kW unit must shrink the available kW')
      .toBeLessThan(availOf(afterAsic.power))

    // …… and installing another unit grows it again (equipment, not gas).
    await panel.getByTestId('site-genset-select').locator('select').selectOption('jenbacher316')
    await expect.poll(async () => (await read())!.power, { timeout: 5000 }).toContain('of')
    const addBtn = panel.getByTestId('miner-stack-add-genset')
    if (await addBtn.count()) {
      const pre = (await read())!
      await addBtn.tap()
      await expect.poll(async () => (await read())!.power, { timeout: 5000 }).not.toBe(pre.power)
      const post = (await read())!
      expect(availOf(post.power), 'a second unit must add available capacity').toBeGreaterThan(availOf(pre.power))
    }
  } finally {
    await context.close()
  }
})

test('build summary @390: an oversized install and a zero-gas site are stated honestly', async ({ browser }) => {
  test.setTimeout(240000)
  const { context, page, panel } = await openSheet(browser, 390, 844, { section: 'overview' })
  try {
    // ---- oversized install: push the installed count past the gas ceiling.
    await page.locator(VISIBLE('site-section-tab-financials')).tap()
    await page.waitForTimeout(400)
    await panel.getByTestId('site-advanced-toggle').tap()
    await expect(panel.getByTestId('site-advanced-panel')).toBeVisible()
    await panel.getByTestId('site-advanced-panel').locator('input[type="range"]').first().fill('10000')
    await page.waitForTimeout(400)
    await page.locator(VISIBLE('site-section-tab-build')).tap()
    await page.waitForTimeout(400)

    const over = (await stripSnapshot(page))!
    expect(over.note, 'oversized install must be named').toMatch(/beyond the gas ceiling earn nothing/i)
    expect(Number(over.note.match(/^([\d,]+)/)?.[1].replace(/,/g, '')), 'the oversized miners are counted')
      .toBeGreaterThan(0)
    // power is clamped to the ceiling, never above it
    const [used, avail] = over.power.split(' of ').map(v => Number(v.replace(/[^\d.]/g, '')))
    expect(used).toBeLessThanOrEqual(avail + 0.05)

    // ---- zero-gas site: no power, no payback figure, and words instead of a number.
    await page.locator(VISIBLE('site-section-tab-overview')).tap()
    await page.waitForTimeout(300)
  } finally {
    await context.close()
  }

  const zero = await openSheet(browser, 390, 844, { site: ZERO_GAS_SITE })
  try {
    const s = (await stripSnapshot(zero.page))!
    expect(s.currency).toBe('USD')
    expect(s.power, 'a site with no gas can supply no power').toMatch(/^0\.?0? of 0\.?0? kW$/)
    expect(s.payback, 'no net income → N/A, not a number').toBe('N/A')
    expect(s.note, 'zero gas must be said in words').toMatch(/no usable gas/i)
    expect(s.miners).toBe('0 miners')
  } finally {
    await zero.context.close()
  }
})

test('build summary @390: one strip through repeated section switches, and it follows the site', async ({ browser }) => {
  test.setTimeout(240000)
  const { context, page, panel } = await openSheet(browser, 390, 844)
  try {
    const first = (await stripSnapshot(page))!
    expect(first.stripCount).toBe(1)

    // Repeated tab navigation: the strip is present exactly once in Build and
    // absent (hidden, not unmounted) elsewhere — free of duplicate DOM.
    for (let i = 0; i < 2; i++) {
      for (const s of ['financials', 'build', 'evidence', 'build', 'overview', 'build'] as const) {
        await page.locator(VISIBLE(`site-section-tab-${s}`)).tap()
        await page.waitForTimeout(220)
        const snap = (await stripSnapshot(page))!
        expect(snap.stripCount, `strip duplicated after switching to ${s}`).toBe(1)
        if (s === 'build') {
          await expect(panel.getByTestId('build-summary')).toBeVisible()
        } else {
          await expect(panel.getByTestId('build-summary')).toBeHidden()
        }
      }
    }
    // …and the numbers are the ones we started with (no re-derivation).
    const last = (await stripSnapshot(page))!
    expect(last.power).toBe(first.power)
    expect(last.capex).toBe(first.capex)
    expect(last.net).toBe(first.net)
    expect(last.payback).toBe(first.payback)

    // ---- a newly selected site: Overview first, its own build numbers in Build.
    const siteAId = (await panel.getByTestId('site-view-compare').getAttribute('href'))?.match(/a=([^&]+)/)?.[1]
    await page.locator('body').press('j')
    await page.waitForTimeout(1600)
    await page.locator(VISIBLE('mobile-site-expand')).first().tap()
    await page.waitForTimeout(1600)
    await expect(page.locator(VISIBLE('site-section-tab-overview'))).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator(VISIBLE('build-summary'))).toBeHidden()
    await page.locator(VISIBLE('site-section-tab-build')).tap()
    await page.waitForTimeout(500)
    const siteB = (await stripSnapshot(page))!
    const siteBId = (await page.locator(VISIBLE('site-details-panel')).first().getByTestId('site-view-compare').getAttribute('href'))?.match(/a=([^&]+)/)?.[1]
    expect(siteBId).not.toBe(siteAId)

    // Compare against a fresh load of site B — the strip must not carry site A's build.
    const fresh = await context.newPage()
    await fresh.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
    await gotoWithSite(fresh, `/map/?site=${siteBId}`)
    await fresh.waitForTimeout(2500)
    await fresh.locator(VISIBLE('mobile-site-expand')).first().tap()
    await fresh.waitForTimeout(1500)
    await fresh.locator(VISIBLE('site-section-tab-build')).tap()
    await fresh.waitForTimeout(500)
    const reference = (await stripSnapshot(fresh))!
    await fresh.close()
    expect(siteB.power, 'the strip carried the previous site power').toBe(reference.power)
    expect(siteB.capex, 'the strip carried the previous site CapEx').toBe(reference.capex)
    expect(siteB.net, 'the strip carried the previous site net').toBe(reference.net)
  } finally {
    await context.close()
  }
})

test('build summary @390: save → reload → apply, and the fleet share URL, reproduce the same build', async ({ browser }) => {
  test.setTimeout(240000)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
  await gotoWithSite(page, `/map/?site=${SITE}`)
  await page.waitForTimeout(2500)
  await page.locator(VISIBLE('mobile-site-expand')).first().tap()
  await page.waitForTimeout(2000)
  await page.locator(VISIBLE('site-section-tab-build')).tap()
  await page.waitForTimeout(600)

  try {
    // A deliberately non-default build: fewer miners, a different ASIC.
    const panel = page.locator(VISIBLE('site-details-panel')).first()
    await panel.getByTestId('site-asic-select').locator('select').selectOption('m60s')
    await page.waitForTimeout(400)
    for (let i = 0; i < 3; i++) { await panel.getByTestId('miner-stack-dec').tap(); await page.waitForTimeout(120) }
    const edited = (await stripSnapshot(page))!

    // ---- save it as a named template (local-first) and take the fleet link.
    const cardsBefore = await panel.locator('[data-testid^="fleet-preset-card-"]').count()
    await panel.getByTestId('miner-stack-save-template').tap()
    const nameField = panel.getByTestId('miner-stack-save-form').locator('input')
    await nameField.fill('QA summary build')
    await panel.getByTestId('miner-stack-save-form').getByRole('button', { name: 'Save', exact: true }).tap()
    await page.waitForTimeout(600)
    // The saved card renders after the presets, and its testid carries the
    // template's own id ('custom' after a manual edit) — not the record id.
    await expect
      .poll(async () => panel.locator('[data-testid^="fleet-preset-card-"]').count(), { timeout: 10000 })
      .toBe(cardsBefore + 1)
    await expect(panel.getByTestId('fleet-preset-card-custom')).toBeVisible({ timeout: 10000 })

    await panel.getByText('Copy fleet link').tap()
    await page.waitForTimeout(400)
    const shared = await page.evaluate(() => navigator.clipboard.readText())
    expect(shared, 'fleet link').toContain(`site=${SITE}`)
    expect(shared, 'fleet link must carry the build').toMatch(/miners=/)

    // ---- reload: the saved template survived, and re-applying it reproduces the build.
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForSiteSelected(page, 60000)
    await page.waitForTimeout(2500)
    await page.locator(VISIBLE('mobile-site-expand')).first().tap()
    await page.waitForTimeout(1800)
    await page.locator(VISIBLE('site-section-tab-build')).tap()
    await page.waitForTimeout(600)
    const panel2 = page.locator(VISIBLE('site-details-panel')).first()
    await expect
      .poll(async () => panel2.locator('[data-testid^="fleet-preset-card-"]').count(), { timeout: 10000 })
      .toBe(cardsBefore + 1)
    const savedCard = panel2.locator('[data-testid^="fleet-preset-card-"]').last()
    await savedCard.getByRole('button', { name: 'Apply' }).tap()
    await page.waitForTimeout(900)
    const reapplied = (await stripSnapshot(page))!
    expect(reapplied.miners, 're-applied template miner count').toBe(edited.miners)
    expect(reapplied.power, 're-applied template power').toBe(edited.power)
    expect(reapplied.capex, 're-applied template CapEx').toBe(edited.capex)

    // ---- the shared fleet URL opens the same build on the same site.
    const fresh = await context.newPage()
    await fresh.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
    await gotoWithSite(fresh, shared)
    await fresh.waitForTimeout(2800)
    const peekExpand = fresh.locator(VISIBLE('mobile-site-expand'))
    if (await peekExpand.count()) { await peekExpand.first().tap(); await fresh.waitForTimeout(1800) }
    await fresh.locator(VISIBLE('site-section-tab-build')).tap()
    await fresh.waitForTimeout(600)
    const fromLink = (await stripSnapshot(fresh))!
    await fresh.close()
    expect(fromLink.miners, 'shared fleet URL miner count').toBe(edited.miners)
    expect(fromLink.power, 'shared fleet URL power').toBe(edited.power)
    expect(fromLink.net, 'shared fleet URL net/day').toBe(edited.net)
    expect(fromLink.payback, 'shared fleet URL payback').toBe(edited.payback)
  } finally {
    await context.close()
  }
})

test('build summary @390: the strip and the bank-pack export quote the same build', async ({ browser }) => {
  test.setTimeout(240000)
  const { context, page, panel } = await openSheet(browser, 390, 844)
  try {
    const s = (await stripSnapshot(page))!
    const [usedKw, availKw] = s.power.split(' of ').map(v => Number(v.replace(/[^\d.]/g, '')))

    await page.locator(VISIBLE('site-section-tab-evidence')).tap()
    await page.waitForTimeout(400)
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      panel.getByRole('button', { name: /Export MD/i }).tap(),
    ])
    const file = await download.path()
    expect(file).toBeTruthy()
    const md = fs.readFileSync(file!, 'utf8')

    const load = md.match(/Miner load: \*\*([\d.,]+) kW\*\* of ([\d.,]+) kW gas ceiling/)
    expect(load, 'the export must state the miner load against the gas ceiling').toBeTruthy()
    expect(Math.abs(Number(load![1].replace(/,/g, '')) - usedKw), `export used kW ${load![1]} vs strip ${usedKw}`).toBeLessThanOrEqual(1)
    expect(Math.abs(Number(load![2].replace(/,/g, '')) - availKw), `export ceiling kW ${load![2]} vs strip ${availKw}`).toBeLessThanOrEqual(1)

    const pay = md.match(/Payback \(model\): \*\*([\d,]+) days\*\*/)
    expect(pay, 'the export must state the model payback').toBeTruthy()
    const exportDays = Number(pay![1].replace(/,/g, ''))
    const stripDays = /yr/.test(s.payback)
      ? Math.round(Number(s.payback.replace(/[^\d.]/g, '')) * 365)
      : Number(s.payback.replace(/[^\d.]/g, ''))
    expect(Math.abs(stripDays - exportDays), `strip payback "${s.payback}" (~${stripDays}d) vs export ${exportDays}d`).toBeLessThanOrEqual(20)
  } finally {
    await context.close()
  }
})

for (const w of DESKTOP) {
  test(`build summary @${w}: docked panel keeps every block, shows the strip above the builder, no tabs`, async ({ browser }) => {
    test.setTimeout(240000)
    const context = await browser.newContext({ viewport: { width: w, height: 900 } })
    const page = await context.newPage()
    await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
    try {
      await gotoWithSite(page, `/map/?site=${SITE}`)
      await page.waitForTimeout(2500)
      const panel = page.locator(VISIBLE('site-details-panel')).first()
      await expect(panel).toBeVisible()

      const s = (await stripSnapshot(page))!
      expect(s.variant, 'desktop strip variant').toBe('docked')
      expect(s.stripCount).toBe(1)
      await expect(page.locator('[data-testid="site-section-nav"]:visible')).toHaveCount(0)
      await expect(page.locator('[data-testid="site-section-sticky"]:visible')).toHaveCount(0)
      await expect(panel.getByTestId('build-summary')).toBeVisible()

      // The whole docked cockpit is still there, in its original block flow —
      // no section gating, no reordering.
      for (const tid of ['site-cockpit', 'site-roi-summary', 'site-bank-export', 'site-score-why', 'site-asic-select', 'site-genset-select']) {
        await expect(panel.getByTestId(tid), `desktop lost ${tid}`).toBeVisible()
      }
      expect(await panel.evaluate(el => el.querySelectorAll('.site-section-off').length)).toBe(0)
      expect(s.order.every(o => o.order === '0'), 'desktop must not be reordered').toBe(true)

      // The strip sits above the builder (its top precedes the cockpit's).
      const cockpitTop = await panel.getByTestId('site-cockpit').evaluate(el => el.getBoundingClientRect().top)
      expect(s.strip!.top, 'the strip belongs above the builder on desktop').toBeLessThan(cockpitTop)

      // …and still quotes the ROI summary exactly.
      expect(s.capex).toBe(money(s.roi.totalInvestment))
      expect(s.net).toBe(money(s.roi.dailyProfitNet))
      expect(s.payback).toBe(expectedPayback(s.roi.payback))

      fs.mkdirSync(ART, { recursive: true })
      await panel.screenshot({ path: path.join(ART, `build-summary-${w}.png`) })
    } finally {
      await context.close()
    }
  })
}

test('build summary: type floor and no sideways scroll on the strip @390', async ({ browser }) => {
  test.setTimeout(240000)
  const { context, page, panel } = await openSheet(browser, 390, 844)
  try {
    const tiny = await panel.evaluate(() => {
      const out: string[] = []
      const strip = document.querySelector('[data-testid="build-summary"]') as HTMLElement | null
      if (!strip) return ['no strip']
      const walker = document.createTreeWalker(strip, NodeFilter.SHOW_TEXT)
      let n: Node | null
      while ((n = walker.nextNode())) {
        const text = (n.textContent || '').trim()
        if (!text) continue
        const el = n.parentElement!
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        const fs = parseFloat(cs.fontSize)
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) continue
        if (fs < 12) out.push(`${fs}px "${text.slice(0, 30)}"`)
      }
      return out
    })
    expect(tiny, 'the strip must clear the 12px readability floor (it is read, not chrome)').toEqual([])
    const doc = await page.evaluate(() => ({ iw: window.innerWidth, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    expect(doc.iw).toBeLessThanOrEqual(391)
    expect(doc.sw).toBeLessThanOrEqual(doc.cw + 1)
  } finally {
    await context.close()
  }
})
