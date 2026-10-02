# Map Layers ticks — handoff for the next model (2026-10-02)

Cam is out of Grok credit. Finish this on a cheap model. Repo is `/root/stranded` (github.com/kitsboy/stranded, branch `main`). Do not edit the MASTER-BRAIN mirror. Do not push `buffy/v2.11.1-hud-fix`.

Live site: https://stranded.giveabit.io/map/
Identity: `curl -sS "https://stranded.giveabit.io/data/live-stats.json?cb=$RANDOM"` must show the commit you pushed and version `2.12.3` or later. CI workflow name contains `verify`. Watch it with `gh run watch`. Do not say live until the SHA matches.

## What Cam asked

Every checkbox under Map Layers must show its thing when ticked and remove it when unticked. Methane was the priority: untick must make the orange pins disappear. Welcome card scroll is good enough. Do not restyle it.

## What was wrong (measured on the live 2.12.2 bundle)

1. Untick changed the box. Pins stayed. `stranded-clusters` visibility stayed `visible`.
2. Heatmap, choropleth, and cluster updates called `map.once('load', ...)`. That event already fired after first paint, so the callback never ran. Satellite and terrain worked when React state actually committed, because they do not use that wait.
3. A Playwright `.click()` on the checkbox toggles the DOM and does **not** commit React state. A real label click, or `input[__reactProps].onChange(...)`, does. Do not judge the map from a raw Playwright click. Click the label, or call the React onClick/onChange, then read layer visibility off the map instance.

## What 2.12.3 changes

- `components/Map.tsx`: hiding methane sets cluster visibility to `none` and replaces the GeoJSON with an empty collection. An `idle` listener repeats the hide while the box is off. Heatmap and choropleth retry on `idle`, not `load`. Satellite/terrain retry on `idle` if the `osm` layer is not ready yet. Site-name text size is readable at country zoom.
- `components/LayerControls.tsx`: every tick, including energy overlays, uses `onClick` + `preventDefault` on the label and a `readOnly` checkbox. React owns the checked state. Test ids: `layer-methane`, `layer-grid`, `layer-internet`, `layer-satellite`, `layer-terrain`, `layer-heatmap`, `layer-choropleth`, `layer-labels`, `layer-performance`, `overlay-<id>`.

## What each box is supposed to do

| Box | Expected |
| --- | --- |
| Methane Sites | Pins and cluster numbers appear / vanish. Source id `stranded-sites`. Layers `stranded-clusters`, `stranded-cluster-count`, `stranded-unclustered`. |
| Power Grid | Not a line layer. Filters methane sites to `effectiveGridKm(site) < 18` in `app/map/page.tsx`. Pin count must drop. Do not invent transmission lines. |
| Internet Coverage | Same idea. Filters with `hasStrongConnectivity`. No fibre lines exist in the data. |
| Satellite Imagery | Adds raster layer `satellite` (Esri World Imagery, already in the style). Untick removes it and restores street or dark. Wired in `onToggle` in `app/map/page.tsx` (`setMapStyle`). |
| 3D Terrain | Pitch goes to 50 and hillshade layer appears. Untick sets pitch 0 and removes hillshade. |
| Emission Heatmap | Layer `emission-heat-layer`. Must not hide the methane pins. Insert with `beforePinLayer`. |
| Province choropleth | Layers `province-choropleth-fill` and `province-choropleth-outline`. Same insert rule. |
| Site names | Layer `stranded-site-labels` visibility. Must be readable at zoom 3.2 when ticked. |
| Performance mode | Sets class `map-performance-mode` and shortens animations. Not a map layer. Leave it. |
| Official energy overlays | Separate GeoJSON. Off by default. Filled dot = plant, ring = remote community. Do not invent geothermal sites (official count is 0). |

## How to prove it

Use Playwright only to drive the React handler, then read the map. The map instance is the hook ref whose `.getLayer('stranded-clusters')` exists. Walk React fibers from `#__next` / the stage div. Do not trust a screenshot alone, and do not trust `input.click()` from Playwright.

Pass when, after each toggle:

- Methane off: `getLayoutProperty('stranded-clusters','visibility') === 'none'` and `queryRenderedFeatures` on that layer is 0. On again: visibility `visible` and features > 0.
- Heatmap on: layer `emission-heat-layer` exists and visibility is `visible`. Off: `none`.
- Choropleth on/off: `province-choropleth-fill` visibility follows the box.
- Satellite on: layer `satellite` visible, `osm` none. Off: satellite gone, street or dark back.
- Terrain on: `getPitch() > 20` and hillshade exists. Off: pitch 0, hillshade gone.
- Grid on: rendered cluster count drops versus all sites. Off: count returns. Same for internet.

If a box's React prop (`showSites`, `showHeatmap`, …) is false on the **committed** Map fiber (`memoizedProps`, not `alternate`) and the layer is still visible, the bug is in `components/Map.tsx`, not the checkbox. If the committed prop is still true, the click did not commit. Call the label `onClick`.

## Do not

- Do not paint StatCan tables, CER projections, or rasters. No coordinates, no pins. See `docs/DATA-SOURCES-RENEWABLES.md`.
- Do not geocode names to fill geothermal.
- Do not put satellite, heatmap, or choropleth above the methane pins (`beforePinLayer`).
- Do not switch Dark back to CARTO `dark_all`. It paints "API KEY REQUIRED". Dark is Esri World Dark Gray.
- Welcome card: Cam said it is better. Leave `components/OnboardingTour.tsx` alone unless he asks again.
