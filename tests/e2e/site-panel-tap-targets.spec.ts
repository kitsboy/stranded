import { test, expect, type Page } from '@playwright/test'

/**
 * Site-panel touch targets — the three inline links on the site panel
 * (`/map/?site=G12350`) that measured under the 44px floor on a phone.
 *
 * WHY THIS EXISTS AS A TEST: the 2026-09 responsive pass fixed the touch floor
 * for every *control* it could find, and deliberately left inline prose links
 * alone (WCAG 2.5.5/2.5.8 exempt them). Three of the panel's links are not
 * prose, though, and all three slipped through that exemption:
 *
 *   - the province link in the panel header ("British Columbia") — a nav link
 *     sitting in a 14-16px line,
 *   - the sponsored "Shop miners…" link (TadbuyAdHook) — a 16px inline-flex box,
 *   - "Legal via Sherpacarta" — a bordered full-width pill at 31px, which is a
 *     control by any reading of the rule.
 *
 * Two different fixes, for a reason worth keeping:
 *   - Tadbuy and the pill are not clipped, so `hit-area-inline` (padding-block
 *     on the inline box) does the job with zero layout movement.
 *   - The province link sits inside `<p class="… truncate">` — and an
 *     `overflow: hidden` ancestor clips HIT TESTING as well as paint, so the
 *     same padding grew its rect to 48px while a thumb could still only reach
 *     ~16px of it (measured). It uses `.hit-area-row` instead: a real 44px
 *     atomic inline box that grows the line.
 *
 * The assertions below are deliberately behavioural, not class-based: a rect
 * that is 44px tall but buried under a neighbour, or clipped away, or scrolled
 * out of the viewport, is not a target. Every target must be >= 44px tall AND
 * be what elementFromPoint returns 2px inside each edge and at its centre AND
 * overlap no other link's hit area.
 *
 * Measured before the fix (live, commit 09a7766):
 *   peek sheet      province 14px (reachable 14px)
 *   expanded sheet  province 16px · tadbuy 16px · sherpacarta 31.4px
 * Measured after (local static build):
 *   province 44px · tadbuy 48px · sherpacarta 44px, fully reachable, no overlap
 */

const WIDTHS = [360, 375, 390, 430] as const
const TAP_MIN = 44

// Every case here boots the real map (MapLibre canvas + a spring-animated bottom
// sheet), waits for it to settle, and then performs real taps. That is ~15-25s
// per case on an idle box and well past the 30s default on a loaded one.
test.describe.configure({ timeout: 120_000 })
const PANEL_SEL = '[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'

const TARGETS = {
  province: 'a[href*="provinces"]',
  tadbuy: 'a[href*="tadbuy"]',
  sherpacarta: 'a[href*="sherpacarta"]',
} as const

type TargetName = keyof typeof TARGETS

type Measured = {
  rect: { x: number; y: number; width: number; height: number }
  /** Is the link itself what a tap 2px inside the top / bottom edge, and at its centre, lands on? */
  hitTop: boolean
  hitBottom: boolean
  hitMiddle: boolean
  /** Anchors whose rect overlaps this link's rect (none is allowed). */
  overlapping: string[]
}

async function panelState(page: Page) {
  return page.evaluate((sel) => {
    const panels = Array.from(document.querySelectorAll(sel))
    // Below xl the desktop right-column copy of the panel is in the DOM but
    // display:none — always measure the visible one.
    const panel = panels.find((p) => p.getBoundingClientRect().width > 0)
    return panel ? panel.getAttribute('data-testid') : null
  }, PANEL_SEL)
}

/** Measure one panel link the way a thumb finds it. */
async function measureTarget(page: Page, name: TargetName): Promise<Measured | null> {
  return page.evaluate(
    ({ sel, targetSel }) => {
      const panels = Array.from(document.querySelectorAll(sel))
      const panel = panels.find((p) => p.getBoundingClientRect().width > 0)
      if (!panel) return null
      const el = panel.querySelector(targetSel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      const midX = r.left + r.width / 2
      const owned = (y: number) => {
        const hit = document.elementFromPoint(midX, y)
        return !!(hit && (hit === el || el.contains(hit)))
      }
      const overlapping: string[] = []
      for (const other of Array.from(panel.querySelectorAll('a[href]'))) {
        if (other === el || el.contains(other) || other.contains(el)) continue
        const b = other.getBoundingClientRect()
        if (!b.width || !b.height) continue
        const ix = Math.min(r.right, b.right) - Math.max(r.left, b.left)
        const iy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)
        if (ix > 0.5 && iy > 0.5) {
          overlapping.push(`${(other.textContent || '').trim().slice(0, 40)} [${Math.round(ix)}x${Math.round(iy)}]`)
        }
      }
      return {
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        hitTop: owned(r.top + 2),
        hitBottom: owned(r.bottom - 2),
        hitMiddle: owned(r.top + r.height / 2),
        overlapping,
      }
    },
    { sel: PANEL_SEL, targetSel: TARGETS[name] },
  )
}

function assertTarget(m: Measured, name: string, width: number) {
  expect(Math.round(m.rect.height), `${name} link height @${width}`).toBeGreaterThanOrEqual(TAP_MIN)
  expect(m.hitTop, `tap 2px inside ${name}'s top edge lands on it @${width}`).toBe(true)
  expect(m.hitBottom, `tap 2px inside ${name}'s bottom edge lands on it @${width}`).toBe(true)
  expect(m.hitMiddle, `tap ${name} at its centre @${width}`).toBe(true)
  expect(m.overlapping, `${name} overlaps another link's hit area @${width}`).toEqual([])
}

/** Bring the panel tail (Tadbuy + Sherpacarta) into the phone viewport. */
async function scrollToTail(page: Page) {
  await centerInScrollport(page, 'sherpacarta')
}

/**
 * Centre a panel link inside its OWN scroll container (the bottom sheet).
 * `scrollIntoView` also scrolls the document, which moves the map page under
 * the sheet and makes the tap point drift; this touches only the sheet.
 */
async function centerInScrollport(page: Page, name: TargetName) {
  await page.evaluate(
    ({ sel, targetSel }) => {
      const panels = Array.from(document.querySelectorAll(sel))
      const panel = panels.find((p) => p.getBoundingClientRect().width > 0)
      const el = panel && panel.querySelector(targetSel)
      if (!el) return
      let scroller: HTMLElement | null = el.parentElement
      while (scroller) {
        const cs = getComputedStyle(scroller)
        if (/(auto|scroll)/.test(cs.overflowY) && scroller.scrollHeight > scroller.clientHeight + 4) break
        scroller = scroller.parentElement
      }
      if (!scroller) return
      const r = el.getBoundingClientRect()
      const sr = scroller.getBoundingClientRect()
      scroller.scrollTop += r.top - sr.top - (sr.height - r.height) / 2
    },
    { sel: PANEL_SEL, targetSel: TARGETS[name] },
  )
  await page.waitForTimeout(400)
}

/** Open the phone site sheet on the reference site, and optionally expand it. */
async function openPanel(page: Page, expand: boolean) {
  await page.goto('/map/?site=G12350', { waitUntil: 'domcontentloaded', timeout: 60000 })
  // The sheet lives inside an AnimatePresence spring that re-mounts it; wait on
  // presence, not on Playwright's "stable + visible" check, which never settles.
  await page.waitForFunction(
    (sel) => {
      const p = Array.from(document.querySelectorAll(sel))
      return p.some((n) => n.getBoundingClientRect().width > 0)
    },
    PANEL_SEL,
    { timeout: 30000 },
  )
  // Let the spring settle: mid-animation the sheet is still translating and a
  // hit test reports whatever it happens to be passing over.
  await page.waitForTimeout(2500)
  if (expand) {
    await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
    await page.waitForTimeout(2500)
  }
}

for (const width of WIDTHS) {
  test(`site panel peek: province link is >= ${TAP_MIN}px @${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    try {
      await openPanel(page, false)
      expect(await panelState(page), 'peek sheet not rendered').toBe('mobile-site-peek')
      const m = await measureTarget(page, 'province')
      expect(m, 'province link missing from the peek sheet').not.toBeNull()
      assertTarget(m!, 'province', width)
    } finally {
      await ctx.close()
    }
  })

  test(`site panel expanded: all three links are >= ${TAP_MIN}px @${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    try {
      await openPanel(page, true)
      expect(await panelState(page), 'expanded sheet not rendered').toBe('site-details-panel')

      // The header link first, while the sheet is still scrolled to the top —
      // once we scroll to the tail it leaves the viewport, and elementFromPoint
      // (rightly) reports null there.
      const header = await measureTarget(page, 'province')
      expect(header, 'province link missing from the expanded sheet').not.toBeNull()
      assertTarget(header!, 'province', width)

      await scrollToTail(page)
      for (const name of ['tadbuy', 'sherpacarta'] as TargetName[]) {
        const m = await measureTarget(page, name)
        expect(m, `${name} link missing from the expanded sheet @${width}`).not.toBeNull()
        assertTarget(m!, name, width)
      }
    } finally {
      await ctx.close()
    }
  })
}

/**
 * Real taps, not forced clicks. Each link is tapped 3px inside its bottom edge
 * — inside the box the fix created, outside where the old text box ended — so a
 * regression that shrinks the target back fails here by never navigating.
 * The tap point is asserted to be owned by the link first, so a failure says
 * "the target is not reachable there" rather than "the navigation timed out".
 */
for (const width of WIDTHS) {
  test(`real tap reaches every link's full box @${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    try {
      await openPanel(page, true)

      const tapInsideBottom = async (name: TargetName) => {
        await centerInScrollport(page, name)
        const m = await measureTarget(page, name)
        expect(m, `${name} missing`).not.toBeNull()
        expect(m!.hitBottom, `tap point 3px inside ${name}'s bottom edge is not owned by it @${width}`).toBe(true)
        return { x: m!.rect.x + m!.rect.width / 2, y: m!.rect.y + m!.rect.height - 3 }
      }

      for (const name of ['tadbuy', 'sherpacarta'] as TargetName[]) {
        const { x, y } = await tapInsideBottom(name)
        const [popup] = await Promise.all([
          page.waitForEvent('popup', { timeout: 8000 }),
          page.touchscreen.tap(x, y),
        ])
        expect(popup.url(), `${name} popup url`).toMatch(name === 'tadbuy' ? /tadbuy\.giveabit\.io/ : /sherpacarta/)
        await popup.close()
      }

      // The province link navigates in place — tapped 3px inside its bottom edge.
      const { x, y } = await tapInsideBottom('province')
      await page.touchscreen.tap(x, y)
      await page.waitForURL(/\/provinces\/?\?name=/, { timeout: 15000 })
    } finally {
      await ctx.close()
    }
  })
}
