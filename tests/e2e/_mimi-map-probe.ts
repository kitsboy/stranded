/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Page } from '@playwright/test'

/**
 * Shared probes for the map's pins — used by `map-pin-hit-target.spec.ts` and by
 * the throwaway diagnostics next to it.
 *
 * The app paints pins two ways (audit F4): MapLibre canvas circles in the
 * default `native-clusters` view, DOM markers in `precise`/`dom`. There is no DOM
 * element for the canvas ones, so these helpers reach the app's own MapLibre
 * instance — read-only, the same React-fiber walk the mobile audit and the fix-1
 * verifier used — and measure with the app's own projection and its own rendered
 * features.
 */

export const PIN_SEL = '.map-pin-hit'
export const TAP_MIN = 44
export const PROBE_OFFSET = 20
export const UNCLUSTERED_LAYER = 'stranded-unclustered'
export const CLUSTER_LAYER = 'stranded-clusters'

/**
 * Install the in-page map finder. A phone page holds TWO MapLibre instances (the
 * map stage and the desktop right-column copy, `display:none` below xl), and the
 * earlier ad-hoc walk sometimes returned the one with nothing painted. This
 * collects every instance reachable from the canvases and exposes them; the
 * probes below then pick the one that is actually on screen. Installed with
 * `addInitScript` so a navigation cannot lose it.
 */
export async function installMapFinder(page: Page) {
  await page.addInitScript(() => {
    const w = window as any
    w.__mimiFindMaps = function findMaps(): any[] {
      const isMap = (v: any) =>
        v && typeof v === 'object' && typeof v.getCanvas === 'function' && typeof v.project === 'function'
      const fibKey = (n: any) =>
        n && Object.keys(n).find((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'))
      const nodes: Element[] = []
      for (const n of Array.from(document.querySelectorAll('.maplibregl-canvas, [data-testid="map-stage"]'))) {
        nodes.push(n)
        let p: Element | null = n.parentElement
        for (let i = 0; i < 5 && p; i++) {
          nodes.push(p)
          p = p.parentElement
        }
      }
      const seeds: any[] = []
      for (const n of nodes) {
        const k = fibKey(n)
        if (k && (n as any)[k]) seeds.push((n as any)[k])
      }
      const check = (v: any) => {
        try {
          if (isMap(v)) return v
        } catch { /* ignore */ }
        if (v && typeof v === 'object') {
          for (const key of ['current', 'map', 'mapRef']) {
            try {
              if (isMap(v[key])) return v[key]
            } catch { /* ignore */ }
          }
        }
        return null
      }
      const found: any[] = []
      const seenFibers = new Set<any>()
      for (const seed of seeds) {
        let f = seed
        for (let up = 0; f && up < 40; up++) {
          if (!seenFibers.has(f)) {
            seenFibers.add(f)
            let hit = check(f.stateNode)
            if (!hit) {
              let h = f.memoizedState
              let hops = 0
              while (h && typeof h === 'object' && hops < 60 && !hit) {
                hit = check(h.memoizedState) || check(h)
                h = h.next
                hops++
              }
            }
            if (hit && !found.includes(hit)) found.push(hit)
          }
          f = f.return
        }
      }
      return found
    }
  })
}

/**
 * Pick the map instance that is actually on screen (most painted features of the
 * on-screen candidates) and park it on `window.__mimiMap`. Returns false when no
 * instance is reachable yet.
 */
export async function visibleMap(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const w = window as any
    const maps: any[] = w.__mimiFindMaps ? w.__mimiFindMaps() : []
    const usable = maps.filter((m) => {
      const c = m?.getCanvas?.()
      if (!c) return false
      const r = c.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) return false
      if (r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) return false
      return getComputedStyle(c).visibility !== 'hidden' && c.getClientRects().length > 0
    })
    w.__mimiMapsSeen = maps.length
    if (!usable.length) return false
    let best = usable[0]
    let bestCount = -1
    for (const m of usable) {
      const c = m.getCanvas() as HTMLCanvasElement
      const r = c.getBoundingClientRect()
      let n = 0
      try {
        n = m.queryRenderedFeatures(
          [
            [2, 2],
            [r.width - 2, r.height - 2],
          ],
          { layers: ['stranded-unclustered', 'stranded-clusters'] },
        ).length
      } catch { /* ignore */ }
      if (n > bestCount) {
        bestCount = n
        best = m
      }
    }
    w.__mimiMap = best
    return true
  })
}

export type CanvasProbe = {
  kind: 'centre' | 'near'
  dx: number
  dy: number
  x: number
  y: number
  /** Does the app's own hit test find a painted pin at this exact pixel? */
  directOnPin: boolean
  /** …or any painted site/cluster feature? */
  directOnAnyMarker: boolean
}

export type CanvasPinReport = {
  id: string
  name: string
  x: number
  y: number
  drawnPx: number
  probes: CanvasProbe[]
}

/**
 * Probe directions: the pin's centre (the control — it worked before the fix
 * too) and four points 20 px out, which is inside the 44 px target (half = 22 px)
 * and outside everything the app used to paint (largest circle here 25 px across,
 * half = 12.5 px). Each direction is checked against the app's OWN hit test so a
 * probe that happens to land on a neighbouring cluster is not used as evidence.
 */
const PROBE_VECTORS: { kind: 'centre' | 'near'; dx: number; dy: number }[] = [
  { kind: 'centre', dx: 0, dy: 0 },
  { kind: 'near', dx: PROBE_OFFSET, dy: 0 },
  { kind: 'near', dx: -PROBE_OFFSET, dy: 0 },
  { kind: 'near', dx: 0, dy: PROBE_OFFSET },
  { kind: 'near', dx: 0, dy: -PROBE_OFFSET },
]

/**
 * The pins the app is painting right now, from its own rendered features: page
 * coordinates, drawn size, and the probe points above.
 */
export async function canvasPins(page: Page) {
  await visibleMap(page)
  return page.evaluate(
    ({ layer, clusterLayer, vectors }) => {
      const map = (window as any).__mimiMap
      if (!map) return { error: 'no map handle', pins: [] as any[] }
      const canvas = map.getCanvas() as HTMLCanvasElement
      const cr = canvas.getBoundingClientRect()
      const feats = map.queryRenderedFeatures(
        [
          [2, 2],
          [cr.width - 2, cr.height - 2],
        ],
        { layers: [layer] },
      )
      const pins: any[] = []
      for (const f of feats) {
        const p = map.project((f.geometry as any).coordinates)
        const radius = f.layer?.paint?.['circle-radius']
        pins.push({
          id: String(f.properties?.id ?? ''),
          name: String(f.properties?.name ?? ''),
          x: cr.x + p.x,
          y: cr.y + p.y,
          drawnPx: Math.round((typeof radius === 'number' ? radius : 0) * 2),
          probes: vectors.map((v: any) => {
            const c = { x: p.x + v.dx, y: p.y + v.dy }
            // The app's own hit test (Map.tsx) looks in a 44x44 box around the
            // tap (PIN_HIT_RADIUS = 22), not at a single pixel. A near-miss
            // point can be a single-pixel miss yet still fall inside a
            // neighbour's 44 px box — the app would then open the neighbour,
            // which is correct but is not this assertion. So the "does another
            // marker own this point" check must use the same box the app uses,
            // or a near-miss that the app routes to a neighbour is not skipped.
            const box: [[number, number], [number, number]] = [
              [c.x - 22, c.y - 22],
              [c.x + 22, c.y + 22],
            ]
            return {
              kind: v.kind,
              dx: v.dx,
              dy: v.dy,
              x: cr.x + c.x,
              y: cr.y + c.y,
              directOnPin: map.queryRenderedFeatures([c.x, c.y], { layers: [layer] }).length > 0,
              directOnAnyMarker:
                map.queryRenderedFeatures(box, { layers: [layer, clusterLayer] }).length > 0,
            }
          }),
        })
      }
      return { cr: { x: cr.x, y: cr.y, width: cr.width, height: cr.height }, zoom: map.getZoom(), pins }
    },
    { layer: UNCLUSTERED_LAYER, clusterLayer: CLUSTER_LAYER, vectors: PROBE_VECTORS },
  )
}

/** Park the map at a given view using its own instance (no app code involved). */
export async function setView(page: Page, lng: number, lat: number, zoom: number): Promise<boolean> {
  await visibleMap(page)
  return page.evaluate(
    ({ lng, lat, zoom }) => {
      const map = (window as any).__mimiMap
      if (!map) return false
      map.jumpTo({ center: [lng, lat], zoom })
      return true
    },
    { lng, lat, zoom },
  )
}

/** A point over bare map (canvas), clear of every pin's 44 px box and of chrome. */
export async function emptyMapPoint(page: Page) {
  await visibleMap(page)
  return page.evaluate(
    ({ radius }) => {
      const map = (window as any).__mimiMap
      if (!map) return null
      const canvas = map.getCanvas() as HTMLCanvasElement
      const cr = canvas.getBoundingClientRect()
      const feats = map.queryRenderedFeatures(
        [
          [2, 2],
          [cr.width - 2, cr.height - 2],
        ],
        { layers: ['stranded-unclustered', 'stranded-clusters'] },
      )
      const centres = feats.map((f: any) => {
        const p = map.project((f.geometry as any).coordinates)
        return { x: cr.x + p.x, y: cr.y + p.y }
      })
      for (let y = Math.round(cr.y + 110); y < Math.round(Math.min(cr.bottom, window.innerHeight) - 40); y += 12) {
        for (let x = Math.round(cr.x + 12); x < Math.round(cr.right - 12); x += 12) {
          if (centres.some((c: any) => Math.abs(c.x - x) <= radius && Math.abs(c.y - y) <= radius)) continue
          const el = document.elementFromPoint(x, y)
          if (!el) continue
          if (el.closest('button, a, input, select, textarea, [role="dialog"], nav')) continue
          if (!el.closest('.maplibregl-map')) continue
          return { x, y }
        }
      }
      return null
    },
    { radius: PROBE_OFFSET + 2 },
  )
}

/** 'map' | 'chrome' | 'other' | null for a page point. */
export async function ownerAt(page: Page, x: number, y: number) {
  return page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y)
      if (!el) return null as string | null
      if (el.closest('button, a, input, select, textarea, [role="dialog"], nav')) return 'chrome'
      return el.closest('.maplibregl-map') ? 'map' : 'other'
    },
    { x, y },
  )
}

/** Every clipboard write the page attempts, in order. */
export async function installClipboardSpy(page: Page) {
  await page.addInitScript(() => {
    const w = window as any
    w.__clipboardWrites = []
    const clip = navigator.clipboard
    if (!clip) return
    const original = clip.writeText.bind(clip)
    clip.writeText = (text: string) => {
      w.__clipboardWrites.push(String(text))
      return original(text)
    }
  })
}

export async function clipboardWrites(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as any).__clipboardWrites ?? [])
}

/** The `?site=` the app currently has in its URL. */
export async function siteFromUrl(page: Page): Promise<string | null> {
  return page.evaluate(() => new URL(location.href).searchParams.get('site'))
}
