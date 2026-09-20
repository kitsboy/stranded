/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page } from '@playwright/test'
import {
  PROBE_OFFSET,
  TAP_MIN,
  canvasPins,
  clipboardWrites,
  emptyMapPoint,
  installClipboardSpy,
  installMapFinder,
  ownerAt,
  setView,
  siteFromUrl,
  visibleMap,
  PIN_SEL,
} from './_mimi-map-probe'

/**
 * Pins are tappable, and a stray tap copies nothing (mobile audit F4 + F5).
 *
 * WHY THIS EXISTS: on a phone the pins are the only way to open a site (audit
 * F3), and they were far smaller than a thumb. Both pin paths were under the
 * 44 px floor:
 *
 *   - the DEFAULT phone view is `native-clusters`: MapLibre circles painted on
 *     the canvas. Measured here at the deep-linked view: 21 px across (the audit
 *     measured ~25 px), i.e. a 10 px radius. The audit's +/-22 px grid probe
 *     around the deep-linked pin hit it at 479 of 2,025 points (~24 %). There is
 *     no DOM element to measure, so the hit area is now a 44x44 query box around
 *     the tap (`PIN_HIT_RADIUS` in components/Map.tsx).
 *   - `precise`/`dom` render DOM markers of 8-20 px plus border. Those become a
 *     transparent 44 px box (`.map-pin-hit`) with the unchanged pin centred in it.
 *
 * And a tap that missed a pin used to fall through to `map.on('click')`, which
 * wrote lat/lng to the clipboard and toasted "Coordinates copied": 31 of 99 taps
 * in the audit's sweep silently clobbered the clipboard. Only the coordinate
 * readout copies now.
 *
 * WHAT THIS PINS DOWN (behaviour, not class names):
 *   1. canvas pins: a REAL TOUCH tap at 20 px from a pin's centre — up, down,
 *      left and right — opens that site, while the same points are proved to be
 *      near misses by the app's OWN hit test (`queryRenderedFeatures` returns no
 *      pin there). The centre tap is the control: it worked before the fix too.
 *   2. DOM pins: every marker element is >= 44x44, a point 20 px off its centre
 *      is owned by it, and a real touch tap there selects that site.
 *   3. a touch tap between pins writes NOTHING to the clipboard (a writeText spy
 *      proves no write was even attempted), raises no toast and opens no site.
 *   4. the explicit coordinate readout still copies, and returns its own value.
 *
 * 20 px is deliberate: outside everything the app paints (largest canvas circle
 * 21 px across, half = 10.5 px; DOM dot max 20 px + 3 px border, half = 13 px)
 * and inside the 44 px target (half = 22 px). A failure here cannot be "the pin
 * moved".
 *
 * Each test loops 360/390/430 one context at a time: a single map paints 2,611
 * sites, so ten parallel browsers is a CI-load problem.
 */

const WIDTHS = [360, 390, 430] as const
/** A filtered view: <= 180 sites keeps the app in `precise` (DOM markers). */
const PRECISE_URL = '/map/?site=G12350&minScore=85'
const CLOSE_SEL = '[aria-label="Close site details"]:visible'

test.describe.configure({ timeout: 1_200_000 })

/**
 * Dismiss the two first-visit overlays. A fresh browser context has neither a
 * dismissed getting-started strip (`FirstRunStrip`) nor a dismissed onboarding
 * tour (`OnboardingTour`, a `role="dialog"` card the size of a phone pinned over
 * the lower map) — and both sit over the map with `pointer-events-auto`, so a
 * "bare map" probe can land on them. A returning visitor sees neither.
 */
async function dismissFirstRunOverlays(page: Page) {
  for (const sel of ['[data-testid="first-run-dismiss"]', '[data-testid="onboarding-dismiss"]']) {
    const el = page.locator(sel).first()
    if (await el.count()) {
      await el.tap().catch(() => undefined)
      // Tolerate the page/context closing mid-test (a sibling test's teardown
      // can close the shared browser while this wait is pending — that must not
      // surface as a spurious "Target page ... has been closed" failure).
      await page.waitForTimeout(400).catch(() => undefined)
    }
  }
}

/** The phone default: all 2,611 sites -> the app auto-selects native-clusters. */
async function bootDefault(page: Page) {
  await page.goto('/map/?site=G12350', { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.waitForSelector('.maplibregl-canvas', { timeout: 90_000 })
  await page.waitForTimeout(1500)
  await dismissFirstRunOverlays(page)
  await page.waitForTimeout(12_000)
  expect(await visibleMap(page), 'no on-screen MapLibre instance reachable from the DOM').toBe(true)
  await expect
    .poll(async () => ((await canvasPins(page)).pins ?? []).length, { timeout: 120_000, intervals: [2000] })
    .toBeGreaterThan(0)
  await page.waitForTimeout(1500)
}

/** Close the site card with its own control (best effort — the URL may keep
 *  naming the deep-linked site while the dataset is still landing). */
async function closeCard(page: Page) {
  for (let i = 0; i < 2; i++) {
    const btn = page.locator(CLOSE_SEL).first()
    if (!(await btn.count())) return
    await btn.tap()
    await page.waitForTimeout(900)
    if ((await siteFromUrl(page)) === null) return
  }
}

/* ------------------------------------------- 1. canvas pins (phone default) */

/**
 * Where to park the map so several unclustered pins are actually painted. At the
 * deep-linked view (zoom ~8-10) the whole country is one cluster plus the linked
 * pin, which is not enough pins to test "each pin"; at zoom 12 the clusters have
 * broken up. The first view that paints at least two pins wins; whatever is
 * chosen is reported in the annotation.
 */
const CANDIDATE_VIEWS = [
  { label: 'Toronto', lng: -79.3832, lat: 43.6532, zoom: 11 },
  { label: 'Calgary', lng: -114.0719, lat: 51.0447, zoom: 11 },
  { label: 'Montreal', lng: -73.5674, lat: 45.5019, zoom: 11 },
  { label: 'Vancouver', lng: -123.1207, lat: 49.2827, zoom: 11 },
  { label: 'the deep-linked site', lng: -122.33839, lat: 49.22849, zoom: 12 },
]

test('canvas pins: a touch tap 20px off a pin opens it, a tap between pins copies nothing', async ({ browser }) => {
  const summary: string[] = []
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    const page = await ctx.newPage()
    try {
      await installClipboardSpy(page)
      await installMapFinder(page)
      await bootDefault(page)

      /* Pick a view with several painted pins, then close the card so the URL
       * has to move for a tap to count. */
      let chosen = CANDIDATE_VIEWS[CANDIDATE_VIEWS.length - 1]
      let chosenPins = 0
      for (const view of CANDIDATE_VIEWS) {
        await setView(page, view.lng, view.lat, view.zoom)
        await page.waitForTimeout(3000)
        const survey = await canvasPins(page)
        const count = (survey.pins ?? []).length
        if (count > chosenPins) {
          chosen = view
          chosenPins = count
        }
        if (count >= 2) break
      }
      expect(chosenPins, `no unclustered pin painted at any candidate view @${width}px`).toBeGreaterThan(0)
      await closeCard(page)

      /* (a) every probe direction on every pin the app is painting. */
      const first = await canvasPins(page)
      const painted: any[] = first.pins ?? []
      expect(painted.length, `no canvas pin painted at ${chosen.label} @${width}px`).toBeGreaterThan(0)

      const results: string[] = []
      let nearMissesOpened = 0
      let provenChanges = 0
      // Tap pins that are NOT the one the deep link already opened first, so the
      // URL has to move for the tap to pass — that is the discriminating half.
      const current = await siteFromUrl(page)
      const order = [...painted].sort((a: any, b: any) =>
        (a.id === current ? 1 : 0) - (b.id === current ? 1 : 0),
      )
      for (const paintedPin of order) {
        // Near misses FIRST, centre last: the centre tap opens the same site the
        // near taps do, and once it has run the URL already names this pin — so a
        // centre-first order would hide whether a near miss moved anything.
        const wants = [...paintedPin.probes].sort(
          (a: any, b: any) => (a.kind === 'centre' ? 1 : 0) - (b.kind === 'centre' ? 1 : 0),
        )
        for (const wanted of wants) {
          // Re-survey every round: opening a card can move the map.
          const survey = await canvasPins(page)
          const pin = (survey.pins ?? []).find((p: any) => p.id === paintedPin.id)
          if (!pin) break
          const probe = (pin.probes as any[]).find((pr: any) => pr.dx === wanted.dx && pr.dy === wanted.dy)
          if (!probe) continue

          // The app's own hit test is the "before" half of the proof: a near
          // miss must NOT be a hit on a painted pin…
          if (probe.kind === 'near') {
            expect(
              probe.directOnPin,
              `the ${probeLabel(probe)} point on ${pin.id} is a direct hit — not a near miss, so it proves nothing`,
            ).toBe(false)
            nearMissesOpened++
          } else {
            expect(probe.directOnPin, `the centre of ${pin.id} is not a hit at all @${width}px`).toBe(true)
          }
          // …and it must not land on any other painted marker (a cluster tap
          // would zoom instead, which is correct but is not this assertion).
          if (probe.directOnAnyMarker && probe.kind === 'near') {
            results.push(`${pin.id} ${probeLabel(probe)}: skipped (another marker owns it)`)
            nearMissesOpened--
            continue
          }
          if ((await ownerAt(page, probe.x, probe.y)) !== 'map') {
            results.push(`${pin.id} ${probeLabel(probe)}: skipped (chrome is over it)`)
            if (probe.kind === 'near') nearMissesOpened--
            continue
          }

          const before = await siteFromUrl(page)
          await page.touchscreen.tap(probe.x, probe.y)
          await expect
            .poll(() => siteFromUrl(page), {
              message: `tapping ${probeLabel(probe)} on "${pin.name}" (${pin.id}, drawn ${pin.drawnPx}px) did not open it @${width}px`,
              timeout: 8000,
            })
            .toBe(pin.id)
          if (probe.kind === 'near' && before !== pin.id) provenChanges++
          results.push(`${pin.id} ${probeLabel(probe)}: opened${probe.kind === 'near' && before !== pin.id ? ' (url moved)' : ''}`)
        }
      }
      expect(nearMissesOpened, `near-miss probes proven and opened @${width}px (${results.join(' · ')})`).toBeGreaterThan(0)
      expect(
        provenChanges,
        `near-miss taps that moved the URL from another site to the pin they hit @${width}px (${results.join(' · ')})`,
      ).toBeGreaterThan(0)

      /* (b) a tap between pins is not a pin: no clipboard write, no toast, no site. */
      await closeCard(page)
      const point = await emptyMapPoint(page)
      expect(point, `no bare map point to tap @${width}px`).not.toBeNull()
      const beforeEmpty = await siteFromUrl(page)
      await page.touchscreen.tap((point as any).x, (point as any).y)
      await page.waitForTimeout(1200)
      expect(await clipboardWrites(page), `a tap that missed every pin wrote to the clipboard @${width}px`).toEqual([])
      await expect(page.locator('text=Coordinates copied')).toHaveCount(0)
      expect(await siteFromUrl(page), `a tap between pins changed the open site @${width}px`).toBe(beforeEmpty)

      summary.push(
        `${width}px: ${painted.length} painted pin(s) [${painted.map((p) => `${p.id} ${p.drawnPx}px`).join(', ')}] — ${results.join(' · ')}`,
      )
    } finally {
      await ctx.close()
    }
  }
  test.info().annotations.push({ type: 'canvas-pins', description: summary.join(' | ') })
})

function probeLabel(p: { kind: string; dx: number; dy: number }) {
  if (p.kind === 'centre') return 'centre'
  return `${PROBE_OFFSET}px ${p.dx > 0 ? 'right' : p.dx < 0 ? 'left' : p.dy > 0 ? 'below' : 'above'}-of-centre`
}

/* ---------------------------------------------------- 2. DOM pins (precise) */

test(`DOM pins: every marker is >= ${TAP_MIN}px and a tap ${PROBE_OFFSET}px off centre selects the site`, async ({ browser }) => {
  const summary: string[] = []
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    try {
      await page.goto(PRECISE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      await page.waitForTimeout(1500)
      await dismissFirstRunOverlays(page)
      await page.waitForFunction((sel) => document.querySelectorAll(sel).length > 5, PIN_SEL, { timeout: 120_000 })
      await page.waitForTimeout(2500)

      const survey = await page.evaluate(
        ({ pinSel, offset }) => {
          const pins = Array.from(document.querySelectorAll(pinSel)) as HTMLElement[]
          const out: any[] = []
          let undersized = 0
          let smallest = Number.POSITIVE_INFINITY
          for (const el of pins) {
            const r = el.getBoundingClientRect()
            if (!r.width || !r.height) continue
            if (r.width < 44 || r.height < 44) undersized++
            smallest = Math.min(smallest, r.width, r.height)
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const dirs = [
              { dx: offset, dy: 0 },
              { dx: -offset, dy: 0 },
              { dx: 0, dy: offset },
              { dx: 0, dy: -offset },
            ]
            const owned = dirs.filter((d) => {
              const hit = document.elementFromPoint(cx + d.dx, cy + d.dy)
              return !!hit && (hit === el || el.contains(hit))
            })
            out.push({
              label: el.getAttribute('aria-label') || el.title || '(unlabelled)',
              width: r.width,
              height: r.height,
              cx,
              cy,
              ownedDirs: owned.length,
            })
          }
          return { total: out.length, undersized, smallest, pins: out }
        },
        { pinSel: PIN_SEL, offset: PROBE_OFFSET },
      )

      expect(survey.total, `no DOM pins rendered @${width}px`).toBeGreaterThan(5)
      expect(survey.undersized, `marker elements under ${TAP_MIN}px @${width}px`).toBe(0)
      expect(Math.round(survey.smallest), `smallest marker element @${width}px`).toBeGreaterThanOrEqual(TAP_MIN)
      const withOwned = survey.pins.filter((p: any) => p.ownedDirs > 0)
      expect(withOwned.length, `pins owning a point ${PROBE_OFFSET}px off their centre @${width}px`).toBeGreaterThan(0)

      // One real touch tap per width on the 44 px target, on a pin clear of the
      // bottom sheet: the canvas path above is where "every probe direction"
      // lives; a marker-element geometry check plus a real tap is enough here.
      const fresh = await page.evaluate(
        ({ pinSel, offset }) => {
          const pins = Array.from(document.querySelectorAll(pinSel)) as HTMLElement[]
          for (const el of pins) {
            const r = el.getBoundingClientRect()
            const cy = r.top + r.height / 2
            if (cy > 844 * 0.55 || cy < 100) continue
            const cx = r.left + r.width / 2
            for (const d of [
              { dx: offset, dy: 0 },
              { dx: -offset, dy: 0 },
              { dx: 0, dy: offset },
            ]) {
              const hit = document.elementFromPoint(cx + d.dx, cy + d.dy)
              if (!hit || !(hit === el || el.contains(hit))) continue
              return { label: el.getAttribute('aria-label') || '', probe: { x: cx + d.dx, y: cy + d.dy } }
            }
          }
          return null
        },
        { pinSel: PIN_SEL, offset: PROBE_OFFSET },
      )
      expect(fresh, `no DOM pin with a reachable ${PROBE_OFFSET}px point @${width}px`).not.toBeNull()
      await page.touchscreen.tap((fresh as any).probe.x, (fresh as any).probe.y)
      await expect
        .poll(
          () =>
            page.evaluate(() => document.querySelector('.maplibregl-marker.selected')?.getAttribute('aria-label') ?? null),
          {
            message: `a tap ${PROBE_OFFSET}px off "${(fresh as any).label}" did not select it @${width}px`,
            timeout: 6000,
          },
        )
        .toBe((fresh as any).label)
      summary.push(
        `${width}px: ${survey.total} markers measured (min ${Math.round(survey.smallest)}px, all ${withOwned.length} with a reachable ${PROBE_OFFSET}px point), 1 tapped → selected`,
      )
    } finally {
      await ctx.close()
    }
  }
  test.info().annotations.push({ type: 'dom-pins', description: summary.join(' | ') })
})

/* ------------------------------------------------------- 3. explicit control */

test('the coordinate readout still copies, and returns its own coordinates', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await ctx.newPage()
  try {
    await installClipboardSpy(page)
    await page.goto('/map/?site=G12350', { waitUntil: 'domcontentloaded', timeout: 120_000 })
    const control = page.locator('[data-testid="map-coord-copy"]')
    await control.waitFor({ state: 'visible', timeout: 90_000 })

    expect(await control.evaluate((el) => el.tagName), 'the readout must be an operable control').toBe('BUTTON')
    const shown = (await control.innerText()).replace(/\s+/g, ' ')

    await control.click()
    await expect.poll(async () => (await clipboardWrites(page)).length, { timeout: 5000 }).toBeGreaterThan(0)
    const value = (await clipboardWrites(page)).at(-1)!
    expect(value, 'copied coordinate format').toMatch(/^-?\d+\.\d{5}, -?\d+\.\d{5}$/)

    const [lat, lng] = value.split(', ').map(Number)
    expect(shown, `copied ${value} but the readout says ${shown}`).toContain(lat.toFixed(4))
    expect(shown, `copied ${value} but the readout says ${shown}`).toContain(Math.abs(lng).toFixed(4))

    const real = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null)
    if (real) expect(real, 'the real clipboard holds the copied coordinate').toBe(value)
  } finally {
    await ctx.close()
  }
})
