/**
 * t_0b9e6cb1 — Stranded /map: the layers panel gets a phone form.
 *
 * Proves, in a real browser (real CDP touch events, coarse pointer), that:
 *   1. the floating layer stack is gone below xl and still there at >=1280px;
 *   2. the new "Layers" button is visible AND reachable (elementFromPoint owns it);
 *   3. the old panel footprint over the map is now bare map (elementFromPoint);
 *   4. a pin that sat under the old panel is tappable again (touch tap -> site card);
 *   5. the map pans from the half that used to be swallowed (clipboard coord delta);
 *   6. the drawer carries the same controls, every one of them reachable, and the
 *      layer toggles still work from inside it;
 *   7. no console errors; no horizontal overflow.
 *
 * Usage: node scripts/verify-mobile-layers-drawer.mjs [baseUrl] [--shots dir]
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const baseUrl = (args.find(a => !a.startsWith('--')) || 'http://127.0.0.1:3099').replace(/\/$/, '')
const shotsIdx = args.indexOf('--shots')
const shotsDir = shotsIdx >= 0 ? args[shotsIdx + 1] : '/tmp/layers-drawer-shots'
const DEEP_LINK = '/map/?site=G12350'
const WIDTHS = [360, 390, 430]
const DESKTOP = 1440
const results = []
const fail = []

mkdirSync(shotsDir, { recursive: true })

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })

const newPage = async (width, height = 844) => {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: width < 900,
    hasTouch: width < 900,
    deviceScaleFactor: width < 900 ? 2 : 1,
    userAgent: width < 900
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
    serviceWorkers: 'block',
  })
  // Capture what the app writes to the clipboard (its own coordinate readout path).
  await ctx.addInitScript(() => {
    window.__copied = []
    const w = navigator.clipboard && navigator.clipboard.writeText
    if (w) {
      navigator.clipboard.writeText = async (t) => { window.__copied.push(String(t)); return undefined }
    }
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)))
  return { ctx, page, errors }
}

const waitForMap = async (page) => {
  await page.waitForSelector('.maplibregl-canvas', { timeout: 45000 })
  await page.waitForFunction(
    () => document.querySelectorAll('.maplibregl-canvas').length > 0
      && !!document.querySelector('[data-testid="map-stage"]'),
    null, { timeout: 45000 })
  await page.waitForTimeout(4500) // tiles + dataset paint
}

/**
 * First-visit guidance (quick tour z-75 + getting-started strip) sits on top of the
 * map and is unrelated to this card (audit finding F13). It is measured once, then
 * dismissed so the layer-panel measurements describe what a returning user sees.
 */
const overlaySnapshot = (page) => page.evaluate(() => {
  const pick = (s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return cs.display === 'none' ? null : { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), z: cs.zIndex }
  }
  return {
    onboardingTour: pick('[data-testid="onboarding-tour"]'),
    firstRunStrip: pick('[data-testid="map-first-run-strip"]'),
  }
})

const dismissFirstRun = async (page) => {
  for (const sel of ['[data-testid="onboarding-dismiss"]:visible', '[data-testid="first-run-dismiss"]:visible']) {
    const b = page.locator(sel).first()
    if (await b.count()) { await b.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(500) }
  }
  await page.waitForTimeout(600)
}

const glyph = (page) => page.evaluate(() => {
  const q = (s) => document.querySelector(s)
  const stack = q('.map-layer-stack')
  const stackCs = stack ? getComputedStyle(stack) : null
  const r = stack ? stack.getBoundingClientRect() : null
  return {
    stackDisplay: stackCs ? stackCs.display : 'absent',
    stackRect: r ? { x: +r.x.toFixed(0), y: +r.y.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0) } : null,
    panelUnified: document.querySelectorAll('.map-layer-panel-unified').length,
    layersBtn: !!document.querySelector('[data-testid="mobile-layers-btn"]'),
    filtersBtn: !!document.querySelector('[data-testid="mobile-filters-btn"]'),
    drawer: !!document.querySelector('[data-testid="mobile-layers-drawer"]'),
    hOverflow: document.documentElement.scrollWidth - window.innerWidth,
  }
})

const ownAt = (page, x, y) => page.evaluate(({ x, y }) => {
  const el = document.elementFromPoint(x, y)
  if (!el) return { who: 'null', desc: 'null' }
  const desc = (n) => n ? `${n.tagName.toLowerCase()}${n.getAttribute('data-testid') ? '[data-testid=' + n.getAttribute('data-testid') + ']' : ''}.${(n.className || '').toString().split(' ').slice(0, 3).join('.')}` : 'null'
  const isMap = !!el.closest('.maplibregl-canvas') || el.classList.contains('maplibregl-canvas')
  const layersBtn = el.closest('[data-testid="mobile-layers-btn"]')
  const filtersBtn = el.closest('[data-testid="mobile-filters-btn"]')
  return {
    who: isMap ? 'map-canvas' : layersBtn ? 'layers-btn' : filtersBtn ? 'filters-btn' : 'other',
    desc: desc(el),
    tag: el.tagName,
  }
}, { x, y })

const tap = async (page, x, y) => {
  await page.touchscreen.tap(x, y)
  await page.waitForTimeout(700)
}

/* ── 1. phone viewports ─────────────────────────────────────────────────── */
for (const width of WIDTHS) {
  const { ctx, page, errors } = await newPage(width)
  await page.goto(`${baseUrl}${DEEP_LINK}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await waitForMap(page)

  const g = await glyph(page)
  const firstVisit = await overlaySnapshot(page)
  await dismissFirstRun(page)
  results.push({ width, ...g, firstVisitOverlays: firstVisit })
  const afterDismiss = await glyph(page)
  results.push({ width: 'after-dismiss-' + width, ...afterDismiss })

  if (g.stackDisplay !== 'none') fail.push(`${width}px: .map-layer-stack is ${g.stackDisplay} (must be none)`)
  if (!g.layersBtn) fail.push(`${width}px: no [data-testid=mobile-layers-btn]`)
  if (!g.filtersBtn) fail.push(`${width}px: no [data-testid=mobile-filters-btn]`)
  if (g.hOverflow > 1) fail.push(`${width}px: horizontal overflow ${g.hOverflow}px`)

  // 2. the Layers button must be reachable, not painted under the HUD
  const btnBox = await page.locator('[data-testid="mobile-layers-btn"]').boundingBox()
  const btnHit = await ownAt(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2)
  const fBox = await page.locator('[data-testid="mobile-filters-btn"]').boundingBox()
  const fHit = await ownAt(page, fBox.x + fBox.width / 2, fBox.y + fBox.height / 2)
  results.push({ width: 'btn' + width, layersBtnBox: btnBox, layersBtnHit: btnHit, filtersBtnBox: fBox, filtersBtnHit: fHit })
  if (btnHit.who !== 'layers-btn') fail.push(`${width}px: Layers button not reachable (hit=${btnHit.who} ${btnHit.desc})`)
  if (fHit.who !== 'filters-btn') fail.push(`${width}px: Filters button not reachable (hit=${fHit.who} ${fHit.desc})`)

  if (width === 390) {
    // The audit measured the panel at x=186..378, y=-195..755 — i.e. the in-stage
    // part is x∈[186,378], y∈[0,755]. Everything below is that footprint.
    const FOOTPRINT = { x0: 186, x1: 378, y0: 0, y1: 755 }

    const closeCard = async () => {
      const c = page.locator('[aria-label="Close site details"]:visible').first()
      if (await c.count()) { await c.click(); await page.waitForTimeout(900) }
    }
    await closeCard()

    // 3. classify who owns the old footprint now (with the site card closed and the
    //    first-run overlays dismissed): a point may only belong to the map or to
    //    chrome that pre-dates this card (the top HUD stack, the FAB, the footer).
    const cls = (o) => {
      if (o.who === 'map-canvas') return 'map-canvas'
      if (o.who === 'layers-btn' || o.who === 'filters-btn') return 'phone-buttons'
      return 'other'
    }
    const owners = []
    for (const x of [190, 240, 290, 340, 375]) {
      for (const y of [240, 320, 420, 520, 600]) {
        const o = await ownAt(page, x, y)
        owners.push({ x, y, ...o, cls: cls(o) })
      }
    }
    const tally = owners.reduce((a, o) => { a[o.cls] = (a[o.cls] || 0) + 1; return a }, {})
    // Chrome that pre-dates this card (the top HUD/toolbar stack, the FAB, the
    // footer) is allowed to sit where it always sat; a LAYER PANEL is not.
    const strays = await page.evaluate((pts) => pts.filter(p => {
      const el = document.elementFromPoint(p.x, p.y)
      if (!el || el.closest('.maplibregl-canvas')) return false
      if (el.closest('[data-testid="mobile-layers-btn"], [data-testid="mobile-filters-btn"]')) return false
      if (el.closest('[data-testid="mobile-site-sheet"], .map-top-stack, [data-testid="map-toolbar"], [data-testid="map-hud"], [data-testid="quick-actions-fab"], .map-status-bar, .map-footer-bar, [data-testid="map-attribution"]')) return false
      return { x: p.x, y: p.y, tag: el.tagName, cls: (el.className || '').toString().slice(0, 80) }
    }).length, owners.map(o => ({ x: o.x, y: o.y })))
    const panelStillThere = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.map-layer-stack, .map-layer-panel-unified'))
        .some(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0))
    results.push({ width: '390-old-panel-footprint', footprint: FOOTPRINT, sampled: owners.length, tally, strayCount: strays, owners })
    if (strays) fail.push(`390px: ${strays} unclassified element(s) over the old panel footprint`)
    if (panelStillThere) fail.push('390px: a layer panel still occupies space over the map')
    const panelOwned = await page.evaluate(() => document.elementsFromPoint(195, 450).some(el => el.closest('.map-layer-stack, .map-layer-panel-unified')))
    if (panelOwned) fail.push('390px: a layer panel is still under (195,450)')

    const deepPinHit = await ownAt(page, 195, 450)
    results.push({ width: '390-deeplink-pin-point', hit: deepPinHit })
    if (deepPinHit.who !== 'map-canvas') fail.push(`390px: (195,450) owner is ${deepPinHit.who} ${deepPinHit.desc}, not the map`)
    await page.screenshot({ path: `${shotsDir}/${width}-map-bare.png` })

    /* 4. THE pin test.
     * (a) find the deep-linked pin by tapping; (b) drag the map so the pin sits deep
     *     inside the old panel footprint — the drag itself starts there, so it also
     *     proves the map receives gestures on that half; (c) tap the pin there and
     *     require the site card to open. */
    const clipLen = () => page.evaluate(() => (window.__copied || []).length)
    const cardVisible = () => page.locator('[data-testid="mobile-site-sheet"]:visible').count()
    const tapAndSee = async (x, y) => {
      const before = await clipLen()
      await tap(page, x, y)
      const opened = await cardVisible()
      const after = await clipLen()
      return { opened, missed: after > before }
    }

    let pin = null
    const sweep = []
    outer:
    for (const y of [360, 400, 440, 480, 520]) {
      for (const x of [120, 160, 200, 240, 280]) {
        const r = await tapAndSee(x, y)
        sweep.push({ x, y, ...r })
        if (r.opened) { pin = { x, y }; break outer }
        await closeCard()
      }
    }
    results.push({ width: '390-pin-locate-sweep', taps: sweep.length, pin, sweep })
    if (!pin) {
      fail.push('390px: could not locate the deep-linked pin by tapping (1,000+ ms of taps, no card)')
    } else {
      await closeCard()
      const inZone = pin.x >= FOOTPRINT.x0 && pin.x <= FOOTPRINT.x1
      results.push({ width: '390-pin-located', pin, insideOldPanelFootprint: inZone })

      // (b) PAN TEST — a 120px single-finger drag that STARTS inside the old panel
      //     footprint (x=300, the half that used to be swallowed). The app's own
      //     coordinate readout (clipboard) gives the centre before/after.
      const readCoord = async () => {
        const before = await page.evaluate(() => (window.__copied || []).length)
        await tap(page, 40, 640) // bare map, above the status bar, nowhere near a pin
        const after = await page.evaluate(() => (window.__copied || []).length)
        const coord = await page.evaluate(() => (window.__copied || []).slice(-1)[0] || null)
        return { coord, fresh: after > before }
      }
      const drag = async (sx, sy, dx, dy) => {
        const cdp = await ctx.newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] })
        for (let i = 1; i <= 10; i++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + (dx * i) / 10, y: sy + (dy * i) / 10 }] })
          await page.waitForTimeout(20)
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await page.waitForTimeout(1400)
      }
      const num = (s) => (s ? s.split(',').map(v => parseFloat(v)) : null)
      const panFrom = { x: 300, y: 520 }
      const startOwner = await ownAt(page, panFrom.x, panFrom.y)
      const r0 = await readCoord()
      await drag(panFrom.x, panFrom.y, -120, 0)
      const r1 = await readCoord()
      const c0 = r0.coord, c1 = r1.coord
      const p0 = num(c0), p1 = num(c1)
      const dLng = p0 && p1 ? +(p1[1] - p0[1]).toFixed(3) : null
      const panned = dLng != null && Math.abs(dLng) > 0.5
      results.push({ width: '390-pan-from-old-panel-half', dragFrom: panFrom, ownerAtDragStart: startOwner, before: c0, after: c1, freshReads: [r0.fresh, r1.fresh], dLng, panned })
      if (startOwner.who !== 'map-canvas') fail.push(`390px: drag start (300,520) is owned by ${startOwner.who}, not the map`)
      if (!r0.fresh || !r1.fresh) fail.push(`390px: coordinate readout did not refresh (${r0.fresh}/${r1.fresh})`)
      if (!panned) fail.push(`390px: a 120px drag starting at (300,520) — inside the old panel footprint — did not pan the map (Δlng=${dLng})`)

      // (c) move the pin to the middle of the old footprint (a no-op if it is
      //     already there), then tap it exactly there: the point the panel owned.
      //     The pan above shifted every pin left by 120px, so the located pin is
      //     expected at pinNow.
      const target = { x: 300, y: 450 }
      const pinNow = { x: Math.round(pin.x - 120), y: pin.y }
      const dx = Math.round(target.x - pinNow.x), dy = Math.round(target.y - pinNow.y)
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        await drag(300, 520, dx, dy)
        pinNow.x += dx; pinNow.y += dy
      }
      const inFootprint = (p) => p.x >= FOOTPRINT.x0 + 10 && p.x <= FOOTPRINT.x1 - 10 && p.y > 260 && p.y < 600
      const candidates = [pinNow, target, { x: pinNow.x - 25, y: pinNow.y }, { x: pinNow.x + 25, y: pinNow.y }, { x: pinNow.x, y: pinNow.y - 25 }, { x: pinNow.x, y: pinNow.y + 25 }]
        .filter(inFootprint)
        .filter((p, i, a) => a.findIndex(q => q.x === p.x && q.y === p.y) === i)
      const attempts = []
      let hit = null
      for (const p of candidates) {
        const owner = await ownAt(page, p.x, p.y)
        const t = await tapAndSee(p.x, p.y)
        attempts.push({ ...p, owner: owner.who, ...t })
        if (t.opened) { hit = p; break }
        await closeCard()
      }
      const hitOwner = hit ? await ownAt(page, hit.x, hit.y) : null
      const cardText = hit ? (await page.locator('[data-testid="mobile-site-sheet"]').innerText()).slice(0, 160).replace(/\n/g, ' | ') : null
      await page.waitForTimeout(800) // the app syncs state->URL through next/router (async)
      const url = page.url()
      const urlSyncsSite = /site=G?\d+/i.test(url)
      results.push({ width: '390-pin-tap-under-old-panel', expectedPin: pinNow, movedBy: { dx, dy }, candidates, attempts, hit, ownerAtHit: hitOwner, cardText, url, urlSyncsSite, oldPanelZone: `x∈[${FOOTPRINT.x0},${FOOTPRINT.x1}]` })
      if (!hit) {
        fail.push(`390px: no pin opened at any of ${candidates.length} points inside the old panel footprint (${candidates.map(c => `${c.x},${c.y}`).join(' / ')})`)
      } else {
        if (hit.x < FOOTPRINT.x0 || hit.x > FOOTPRINT.x1) fail.push(`390px: the tappable pin sits at x=${hit.x}, outside the old panel footprint`)
        if (hitOwner.who !== 'map-canvas') fail.push(`390px: (${hit.x},${hit.y}) is owned by ${hitOwner.who}, not the map`)
        // NOTE: whether the URL picks up ?site= is the deep-link/back card's lane
        // (audit F6) — reported here, not asserted.
      }
      await page.screenshot({ path: `${shotsDir}/${width}-pin-tapped-under-old-panel.png` })
      await closeCard()
      await page.screenshot({ path: `${shotsDir}/${width}-after-pan.png` })
    }

    // 6. the Layers drawer: same controls, all reachable, and they still work
    await closeCard()
    await page.locator('[data-testid="mobile-layers-btn"]').click()
    await page.waitForTimeout(900)
    const drawerOpen = await page.locator('[data-testid="mobile-layers-drawer"]:visible').count()
    if (!drawerOpen) fail.push('390px: Layers drawer did not open')
    await page.screenshot({ path: `${shotsDir}/${width}-layers-drawer-open.png` })

    const drawerProbe = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="mobile-layers-drawer"]')
      if (!root) return { error: 'no drawer' }
      const body = root.querySelector('.map-filter-scroll')
      const surface = root.firstElementChild && root.firstElementChild.tagName === 'BUTTON'
        ? root.children[1]
        : root.firstElementChild
      const r = surface.getBoundingClientRect()
      const panel = root.querySelector('.map-layer-panel-unified')
      const pr = panel ? panel.getBoundingClientRect() : null
      const controls = Array.from(body.querySelectorAll('button, input, summary, label'))
      const uniq = controls.filter(c => {
        const b = c.getBoundingClientRect()
        return b.width > 0 && b.height > 0 && b.top < window.innerHeight && b.bottom > 0
      })
      let reachable = 0
      const blocked = []
      for (const c of uniq) {
        const b = c.getBoundingClientRect()
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
        const ok = hit && (hit === c || c.contains(hit) || hit.contains(c))
        if (ok) reachable++
        else blocked.push({ txt: (c.textContent || '').trim().slice(0, 30), hit: hit ? hit.tagName + '.' + (hit.className || '').toString().slice(0, 40) : 'null' })
      }
      const txt = (body.innerText || '')
      return {
        drawerRect: { x: +r.x.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0) },
        panelRect: pr ? { x: +pr.x.toFixed(0), y: +pr.y.toFixed(0), w: +pr.width.toFixed(0), h: +pr.height.toFixed(0) } : null,
        panelScrollable: body.scrollHeight > body.clientHeight,
        controlCount: uniq.length,
        reachable,
        blocked,
        has: {
          legend: !!body.querySelector('[data-testid="score-legend"]'),
          ring: !!body.querySelector('[data-testid="mission-ring-toggle"]'),
          styleSwitcher: /BASE MAP STYLE/i.test(txt),
          presets: txt.includes('Satellite'),
          sites: txt.includes('Methane'),
          performance: txt.includes('Performance'),
        },
        bodyTxt: txt.slice(0, 240).replace(/\n+/g, ' | '),
      }
    })
    results.push({ width: '390-layers-drawer', ...drawerProbe })
    if (drawerProbe.error) fail.push('390px: ' + drawerProbe.error)
    if (drawerProbe.controlCount === 0) fail.push('390px: Layers drawer has no controls')
    if (drawerProbe.blocked && drawerProbe.blocked.length) {
      fail.push(`390px: ${drawerProbe.blocked.length}/${drawerProbe.controlCount} drawer controls unreachable`)
    }
    if (drawerProbe.drawerRect.w > 380) fail.push(`390px: drawer ${drawerProbe.drawerRect.w}px wide — covers the whole screen`)
    for (const k of ['legend', 'ring', 'styleSwitcher', 'presets', 'sites', 'performance']) {
      if (!drawerProbe.has[k]) fail.push(`390px: drawer is missing the "${k}" control`)
    }

    // toggling a layer from the drawer must actually flip the layer
    const gridToggle = page.locator('[data-testid="mobile-layers-drawer"] input[type="checkbox"]').nth(1)
    const beforeToggle = await gridToggle.isChecked()
    await gridToggle.click({ force: true })
    await page.waitForTimeout(700)
    const afterToggle = await gridToggle.isChecked()
    results.push({ width: '390-drawer-toggle', beforeToggle, afterToggle })
    if (beforeToggle === afterToggle) fail.push('390px: toggling a layer inside the drawer did nothing')

    // close by backdrop tap -> map free again
    await page.locator('[data-testid="mobile-layers-drawer"] > button').first().click({ position: { x: 350, y: 400 } })
    await page.waitForTimeout(800)
    const closed = await page.locator('[data-testid="mobile-layers-drawer"]:visible').count()
    const afterClose = await ownAt(page, 195, 450)
    results.push({ width: '390-drawer-closed', closed, owner: afterClose })
    if (closed) fail.push('390px: drawer did not close on backdrop tap')
    if (afterClose.who !== 'map-canvas') fail.push(`390px: after closing, (195,450) owner is ${afterClose.who}`)

    // 7. Escape closes it too (the FocusTrap path)
    await page.locator('[data-testid="mobile-layers-btn"]').click()
    await page.waitForTimeout(1000)
    const openedForEsc = await page.locator('[data-testid="mobile-layers-drawer"]:visible').count()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1400) // let the spring exit animation finish
    const escClosed = await page.locator('[data-testid="mobile-layers-drawer"]:visible').count()
    results.push({ width: '390-drawer-escape', openedForEsc, stillVisible: escClosed })
    if (openedForEsc === 0) fail.push('390px: Layers drawer did not reopen for the Escape check')
    if (escClosed) fail.push('390px: Escape did not close the Layers drawer')
  }

  // Local-only noise: the proof-per-pin fetch to api.satohash.io is CORS-restricted
  // to the production origin, so it can only fail when served from 127.0.0.1.
  const NOISE = /api\.satohash\.io|CORS policy|Failed to load resource|net::|ERR_/i
  const noise = errors.filter(e => NOISE.test(e))
  const consoleClean = errors.filter(e => !NOISE.test(e))
  results.push({ width: 'console' + width, errors: consoleClean, ignoredLocalNoise: noise.length })
  if (consoleClean.length) fail.push(`${width}px console errors: ${consoleClean.slice(0, 3).join(' | ')}`)
  await ctx.close()
}

/* ── 2. desktop parity: the corner panel must still be there ─────────────── */
{
  const { ctx, page, errors } = await newPage(DESKTOP, 900)
  await page.goto(`${baseUrl}${DEEP_LINK}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await waitForMap(page)
  const g = await glyph(page)
  results.push({ width: 'desktop' + DESKTOP, ...g })
  if (g.stackDisplay === 'none') fail.push(`${DESKTOP}px: the desktop layer panel disappeared (display:none)`)
  const stackBox = await page.locator('.map-layer-stack').boundingBox()
  const panelControls = await page.locator('.map-layer-stack button, .map-layer-stack input, .map-layer-stack label').count()
  results.push({ width: 'desktop-controls', stackBox, panelControls })
  if (!panelControls) fail.push(`${DESKTOP}px: desktop panel has no controls`)
  await page.screenshot({ path: `${shotsDir}/desktop-${DESKTOP}-panel.png` })
  const consoleClean = errors.filter(e => !/api\.satohash\.io|CORS policy|ERR_|Failed to load resource|net::/i.test(e))
  if (consoleClean.length) fail.push(`desktop console errors: ${consoleClean.slice(0, 3).join(' | ')}`)
  await ctx.close()
}

await browser.close()

console.log(JSON.stringify({ baseUrl, pass: fail.length === 0, fail, results }, null, 2))
if (fail.length) process.exitCode = 1
