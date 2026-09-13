import { test, expect, type Page } from '@playwright/test'

/**
 * Every `hit-area-inline` link, on a coarse pointer, must be a REAL 44px target.
 *
 * WHY THIS EXISTS AS A TEST (card t_90eed310, follow-up to t_ff2b0edd):
 * `a.hit-area-inline` grows an inline box with `padding-block: 1rem`. That is
 * layout-neutral and it is a genuine 44px target ONLY while nothing takes the
 * painted padding back out of hit testing. Two things do:
 *
 *   1. an ancestor with `overflow: hidden` — an ancestor's clip clips HIT
 *      TESTING as well as paint, and Tailwind's `truncate` sets it. Measured on
 *      the live panel: province link rect 46px, reachable 16px.
 *   2. a LATER INLINE-LEVEL SIBLING — the following line box sits on the link's
 *      bottom padding band and wins the hit test there. Measured on the live
 *      /docs/api page: the "ECCC Open Data" link had a 48px rect and only 34px
 *      reachable, because "Try it on the map →" right below it is
 *      `display: inline-block`. Nothing in its ancestor chain had a clip: this
 *      trap needs no `overflow` at all, which is why the audit is behavioural.
 *
 * Reproduced in controlled micro-tests (`scripts/_mimi-hit-inline-linebox.mjs`):
 * 48px rect → 48px reachable with nothing after it, 34px with a following
 * `inline-block`, 34px inside a `truncate` line, and with `.hit-area-row`
 * (min-height 44 + inline-flex) → 44px reachable in the same trap positions.
 *
 * So the assertion is never "the rect is 44px". It is: the link is >= 44px tall,
 * AND a tap 2px inside each edge and at its centre lands on the link, AND at
 * least 42 of the 1px steps down its own centre column reach it. A rect-only
 * assertion is what let this pattern look green while being unreachable.
 */

const TAP_MIN = 44
const SEL = 'a.hit-area-inline, .hit-area-row'
const WIDTH = 390

// Every route that renders a `hit-area-inline` / `hit-area-row` link on a phone.
// /map is covered separately: its links live inside a spring-animated bottom sheet.
const ROUTES = ['/', '/open-data', '/docs/api', '/provinces/'] as const

type LinkMeasured = {
  text: string
  href: string
  height: number
  reachable: number
  hitTop: boolean
  hitBottom: boolean
  hitMiddle: boolean
  topOwner: string
  bottomOwner: string
  midOwner: string
}

/** Measure one link by index, the way a thumb finds it. */
const measureOne = (page: Page, index: number) =>
  page.evaluate(
    ({ sel, i }) => {
      const el = document.querySelectorAll(sel)[i] as HTMLElement | undefined
      if (!el) return null
      const desc = (node: Element | null) => {
        if (!node) return 'null'
        const cls = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.')
        return `${node.tagName.toLowerCase()}${cls ? '.' + cls : ''}`
      }
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      // Scroll of the document by 1px shifts the box under the probe; the rect is
      // read in the same frame as the probes, so they always agree.
      const ownsAt = (y: number) => {
        const hit = document.elementFromPoint(cx, y)
        return !!(hit && (hit === el || el.contains(hit)))
      }
      const ownerAt = (y: number) => {
        const hit = document.elementFromPoint(cx, y)
        return hit ? (hit === el || el.contains(hit) ? 'LINK' : desc(hit)) : 'null'
      }
      let reachable = 0
      for (let y = Math.floor(r.top); y <= Math.ceil(r.bottom); y++) if (ownsAt(y)) reachable++
      return {
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) || el.getAttribute('href') || '?',
        href: el.getAttribute('href') || '(none)',
        height: Math.round(r.height),
        reachable,
        hitTop: ownsAt(r.top + 2),
        hitBottom: ownsAt(r.bottom - 2),
        hitMiddle: ownsAt(r.top + r.height / 2),
        topOwner: ownerAt(r.top + 2),
        bottomOwner: ownerAt(r.bottom - 2),
        midOwner: ownerAt(r.top + r.height / 2),
      }
    },
    { sel: SEL, i: index },
  ) as Promise<LinkMeasured | null>

/** Scroll the whole page once so lazily-mounted sections exist, then come back. */
async function revealPage(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(600)
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.9
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((res) => setTimeout(res, 50))
    }
    window.scrollTo(0, 0)
    await new Promise((res) => setTimeout(res, 200))
  })
  await page.waitForTimeout(400)
}

/** Measure every visible link in document order, centring each one first. */
async function measureAll(page: Page): Promise<LinkMeasured[]> {
  const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, SEL)
  const out: LinkMeasured[] = []
  for (let i = 0; i < count; i++) {
    const hidden = await page.evaluate(
      ({ sel, i }) => {
        const el = document.querySelectorAll(sel)[i] as HTMLElement | undefined
        if (!el) return true
        const r = el.getBoundingClientRect()
        return r.width === 0 || r.height === 0
      },
      { sel: SEL, i },
    )
    if (hidden) continue
    await page.evaluate(
      ({ sel, i }) => {
        const el = document.querySelectorAll(sel)[i] as HTMLElement | undefined
        if (el) el.scrollIntoView({ block: 'center' })
      },
      { sel: SEL, i },
    )
    await page.waitForTimeout(150)
    const m = await measureOne(page, i)
    if (m) out.push(m)
  }
  return out
}

function assertRealTarget(m: LinkMeasured, where: string) {
  const label = `"${m.text}" (${m.href}) on ${where}`
  expect(m.height, `${label} — border-box height`).toBeGreaterThanOrEqual(TAP_MIN)
  expect(m.hitTop, `${label} — tap 2px inside the TOP edge lands on ${m.topOwner}`).toBe(true)
  expect(m.hitBottom, `${label} — tap 2px inside the BOTTOM edge lands on ${m.bottomOwner}`).toBe(true)
  expect(m.hitMiddle, `${label} — tap at the centre lands on ${m.midOwner}`).toBe(true)
  // 2px of slack for the rounding at each edge of a pixel scan.
  expect(m.reachable, `${label} — reachable pixels down its own centre column`).toBeGreaterThanOrEqual(TAP_MIN - 2)
}

test.describe.configure({ timeout: 180_000 })

for (const route of ROUTES) {
  test(`every hit-area link on ${route} is a real ${TAP_MIN}px target @${WIDTH}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    try {
      await revealPage(page, route)
      const links = await measureAll(page)
      // The routes below are chosen because they render these links; a route that
      // silently lost them all would hide the regression, so require presence.
      expect(links.length, `${route} rendered no hit-area links to check`).toBeGreaterThan(0)
      for (const m of links) assertRealTarget(m, route)
    } finally {
      await ctx.close()
    }
  })
}

/**
 * The regression this card exists for: the /docs/api source link sits in a `<p>`
 * immediately above an `inline-block` anchor. Nothing clips it — the following
 * line box simply owns the link's bottom padding band — so the link measured a
 * 48px rect with only 34px of it reachable. `.hit-area-row` gives it an atomic
 * 44px box that nothing can sit on.
 */
test(`docs/api source link: the padded box is reachable, not just painted @${WIDTH}px`, async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  try {
    await revealPage(page, '/docs/api')
    const linkIndex = await page.evaluate((sel) => {
      const links = Array.from(document.querySelectorAll(sel)) as HTMLElement[]
      return links.findIndex((a) => /ECCC/.test(a.textContent || '') && a.closest('p'))
    }, SEL)
    expect(linkIndex, 'the /docs/api "ECCC Open Data" source link is missing').toBeGreaterThanOrEqual(0)
    await page.evaluate(({ sel, i }) => (document.querySelectorAll(sel)[i] as HTMLElement).scrollIntoView({ block: 'center' }), { sel: SEL, i: linkIndex })
    await page.waitForTimeout(200)
    const m = await measureOne(page, linkIndex)
    expect(m, 'link vanished between locating and measuring it').not.toBeNull()
    assertRealTarget(m!, 'the /docs/api source line')

    // A REAL tap 3px inside the bottom edge — inside the box the fix created,
    // outside where the raw text box ends. The link has no `target="_blank"`, so
    // the proof is the navigation REQUEST it starts: we assert the tap reached
    // the link without needing open.canada.ca to answer.
    const point = await page.evaluate(
      ({ sel, i }) => {
        const el = document.querySelectorAll(sel)[i] as HTMLElement
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.bottom - 3 }
      },
      { sel: SEL, i: linkIndex },
    )
    const [nav] = await Promise.all([
      page.waitForRequest((r) => r.isNavigationRequest() && /open\.canada\.ca/.test(r.url()), { timeout: 8000 }),
      page.touchscreen.tap(point.x, point.y),
    ])
    expect(nav.url(), 'tap at the bottom edge opened the wrong target').toMatch(/open\.canada\.ca/)
  } finally {
    await ctx.close()
  }
})

/**
 * The link inside the miner-stack cockpit (`/map/?site=G12350`) — the last
 * `hit-area-inline` link in the repo that only exists once the sheet is expanded
 * and the "How this is computed" disclosure is open.
 */
test(`cockpit "Verify this yourself" link is a real ${TAP_MIN}px target @${WIDTH}px`, async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  const panelSel = '[data-testid="mobile-site-peek"], [data-testid="site-details-panel"]'
  try {
    await page.goto('/map/?site=G12350', { waitUntil: 'domcontentloaded', timeout: 60000 })
    // The map boots a MapLibre canvas and the sheet is inside an AnimatePresence
    // spring that re-mounts it, so wait on presence, not on Playwright's "stable
    // visible" check, which never settles. Generous timeout: a loaded box can take
    // well over 30s to get here (measured: this file's sibling specs share the
    // machine), and a page-load timeout is not a tap-target regression.
    await page.waitForFunction(
      (sel) => Array.from(document.querySelectorAll(sel)).some((n) => n.getBoundingClientRect().width > 0),
      panelSel,
      { timeout: 60000 },
    )
    // The sheet is inside a spring that re-mounts it: wait on presence, then settle.
    await page.waitForTimeout(2500)
    await page.locator('[data-testid="mobile-site-expand"]:visible').first().tap()
    await page.waitForTimeout(2500)
    const cockpit = page.locator('[data-testid="cockpit-how"]:visible').first()
    if (await cockpit.count()) {
      const open = await cockpit.evaluate((node) => node.hasAttribute('open'))
      if (!open) await cockpit.locator('summary').first().click({ timeout: 8000 })
      await page.waitForTimeout(600)
    }
    // The cockpit link lives inside the sheet's own scrollport. Centre it there
    // before probing: a link whose box is half outside the scrollport answers
    // elementFromPoint with the sheet, and that is not the link's fault.
    const linkIndex = await page.evaluate((sel) => {
      const links = Array.from(document.querySelectorAll(sel)) as HTMLElement[]
      return links.findIndex((a) => /Verify this yourself/.test(a.textContent || '') && a.getBoundingClientRect().width > 0)
    }, SEL)
    expect(linkIndex, 'cockpit "Verify this yourself →" link not found (sheet expanded, cockpit open)').toBeGreaterThanOrEqual(0)
    await page.evaluate(
      ({ sel, i }) => {
        const el = document.querySelectorAll(sel)[i] as HTMLElement
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
      { sel: SEL, i: linkIndex },
    )
    await page.waitForTimeout(500)
    const target = await measureOne(page, linkIndex)
    expect(target, 'cockpit link vanished between locating and measuring it').not.toBeNull()
    assertRealTarget(target!, 'the miner-stack cockpit')
  } finally {
    await ctx.close()
  }
})
