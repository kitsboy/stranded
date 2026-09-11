import { test, expect } from '@playwright/test'

/**
 * Mobile legibility guard — the type floor and the touch-target floor.
 *
 * WHY THIS EXISTS AS A TEST: the 2026-09 responsive pass fixed four named
 * findings and still shipped ~11.7k rendered text nodes below 11px (9px was the
 * *default* micro-label size, and the nav tagline — the most repeated string on
 * the site — was one of them). A measurement that only ever runs by hand will
 * drift back. The floor is therefore asserted here, on every push/PR, against
 * the static build the deploy actually serves.
 *
 * THE RULE (see docs/qa/VERDICT-legibility.md):
 *   - text-label = 12px — anything a user is meant to READ
 *   - text-micro = 11px — map/chart chrome whose box is fixed by an
 *     absolutely-positioned layout; the absolute minimum, never the only copy
 *     of a number or a name
 *   - a control on a coarse pointer gets a >=44px touch box
 * Deliberate exemptions (inline prose links, native range inputs, focus-only
 * skip links, chart row links) are named in that doc — they are NOT asserted
 * here because a passing assertion would imply a guarantee the design does not
 * make.
 */

const FLOOR_PX = 11
const TAP_MIN = 44

const PAGES = ['/', '/map/', '/sites/', '/dashboard/', '/open-data/', '/education/', '/pitch/']
const WIDTHS = [390, 1440] as const

/** Every visible text node whose computed font-size is under the floor. */
function collectTinyText(floor: number) {
  const out: string[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = (node.textContent || '').trim()
    if (!text) continue
    const el = node.parentElement
    if (!el) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    if (el.closest('[aria-hidden="true"]')) continue
    const fs = parseFloat(cs.fontSize)
    if (!(fs < floor)) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    out.push(`${fs}px "${text.slice(0, 40)}"`)
  }
  return out
}

for (const width of WIDTHS) {
  for (const path of PAGES) {
    test(`type floor: nothing below ${FLOOR_PX}px on ${path} @${width}px`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width, height: width < 640 ? 844 : 900 },
        isMobile: width < 640,
        hasTouch: width < 640,
      })
      const page = await ctx.newPage()
      try {
        await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 })
        // The map/sites pages hydrate their panels after the shell paints; give
        // React a beat so the assertion sees rendered content, not the skeleton.
        await page.waitForTimeout(2500)
        const tiny = await page.evaluate(collectTinyText, FLOOR_PX)
        expect(
          tiny,
          `${tiny.length} text node(s) below the ${FLOOR_PX}px floor on ${path} @${width}px — ` +
            `use text-label (12px) or text-micro (11px), or move the value into a title/aria-label`,
        ).toEqual([])
      } finally {
        await ctx.close()
      }
    })
  }
}

/**
 * Touch targets. Asserted on the surfaces where a 44px box is a design
 * commitment; each selector was measured after the fix, so a regression (a
 * removed min-h-11, a re-introduced h-8) fails loudly instead of quietly
 * shrinking the target back to 24px.
 */
const TOUCH_TARGETS: { path: string; name: string; sel: string }[] = [
  { path: '/', name: 'get-started checklist checkbox target', sel: '[data-testid="onboarding-checklist"] label.hit-area-44' },
  { path: '/', name: 'nav language toggle', sel: 'button[aria-label^="Change language"]' },
  { path: '/dashboard/', name: 'dashboard metric chip', sel: 'button:has-text("Avg score")' },
  { path: '/sites/', name: 'sites export button', sel: 'button:has-text("TABLE VIEW")' },
]

for (const t of TOUCH_TARGETS) {
  test(`touch target: ${t.name} is >= ${TAP_MIN}px @390px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    try {
      await page.goto(t.path, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2500)
      const el = page.locator(t.sel).first()
      await expect(el, `${t.sel} not found on ${t.path}`).toBeVisible({ timeout: 10000 })
      const box = await el.boundingBox()
      expect(box, `${t.sel} has no box`).not.toBeNull()
      expect(Math.round(box!.height), `${t.name} height`).toBeGreaterThanOrEqual(TAP_MIN)
      expect(Math.round(box!.width), `${t.name} width`).toBeGreaterThanOrEqual(TAP_MIN)
    } finally {
      await ctx.close()
    }
  })
}

test('touch target: map toolbar controls are >= 44px @390px', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  try {
    await page.goto('/map/?site=G10161', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3500)
    const small = await page.evaluate((min: number) => {
      const out: string[] = []
      for (const el of Array.from(document.querySelectorAll('.map-toolbar-pill button, .map-toolbar-pill__btn, .map-toolbar-pill__fit'))) {
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) continue
        if (Math.min(r.width, r.height) < min) {
          out.push(`${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}"`)
        }
      }
      return out
    }, TAP_MIN)
    expect(small, 'map toolbar controls under the touch floor').toEqual([])
  } finally {
    await ctx.close()
  }
})
