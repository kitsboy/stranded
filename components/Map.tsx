'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Compass, Copy, AlertTriangle } from 'lucide-react'
import { EnrichedSite, scoreTierColor } from '@/lib/sites'
import { emissionChoroplethGeojson } from '@/lib/province-choropleth'
import { boundsFromSites, padBounds, boundsToFitTuple } from '@/lib/map-bounds'
import type { MapViewState } from '@/lib/map-view-history'

export type MapViewMode = 'precise' | 'dom' | 'native-clusters'
export type MapStyleMode = 'dark' | 'standard' | 'satellite' | 'terrain'

export type MapHandle = {
  getView: () => MapViewState | null
  fitToSites: (sites: EnrichedSite[]) => void
  exportScreenshot: () => string | null
  flyTo: (target: { lat: number; lng: number; zoom?: number }) => void
  resize: () => void
}

interface MapProps {
  sites: EnrichedSite[]
  filteredSites: EnrichedSite[]
  onSiteClick: (site: EnrichedSite) => void
  selectedId?: string | null
  portfolioIds?: string[]
  showMissionRing?: boolean
  /** @deprecated use native-clusters */
  viewMode?: MapViewMode | 'clusters'
  showSatellite?: boolean
  showTerrain?: boolean
  showHeatmap?: boolean
  showChoropleth?: boolean
  heatmapOpacity?: number
  terrainExaggeration?: number
  liveBtcPrice?: number
  radiusOverlay?: { lat: number; lng: number; radiusKm: number } | null
  centerTarget?: { lat: number; lng: number; zoom?: number } | null
  boundsTarget?: { sites: EnrichedSite[]; padding?: number; key?: number } | null
  mapStyle?: MapStyleMode
  showSiteLabels?: boolean
  highlightedProvinces?: string[]
  performanceMode?: boolean
  onViewChange?: (view: MapViewState) => void
  onMapReady?: (api: MapHandle) => void
  onCoordCopied?: (coords: { lat: number; lng: number }) => void
  sitesLoading?: boolean
  loadProgress?: number
  coordCopyLabel?: string
  resizeTrigger?: number
  loadingSitesLabel?: string
  attributionLabel?: string
  zoomLabel?: string
  bearingLabel?: string
  pitchLabel?: string
  viewportSitesLabel?: string
  tileFallbackLabel?: string
}

/** MapLibre native cluster source + layer ids (upgrade 166-175) */
const SITES_SOURCE = 'stranded-sites'
const CLUSTER_LAYER = 'stranded-clusters'
const CLUSTER_COUNT_LAYER = 'stranded-cluster-count'
const UNCLUSTERED_LAYER = 'stranded-unclustered'
const SITE_LABELS_LAYER = 'stranded-site-labels'

function isWebGLSupported(): boolean {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

const TIER_CIRCLE_COLOR: maplibregl.ExpressionSpecification = [
  'case',
  ['>=', ['get', 'score'], 85], '#a855f7',
  ['>=', ['get', 'score'], 65], '#22c55e',
  ['>=', ['get', 'score'], 45], '#eab308',
  '#f97316',
]

function resolveViewMode(
  viewMode: MapProps['viewMode'],
  siteCount: number,
): MapViewMode {
  if (viewMode === 'precise') {
    if (siteCount > 400) return 'native-clusters'
    return 'precise'
  }
  if (viewMode === 'dom') return 'dom'
  if (viewMode === 'native-clusters' || viewMode === 'clusters') return 'native-clusters'
  return siteCount > 180 ? 'native-clusters' : 'precise'
}

function countSitesInViewport(map: maplibregl.Map, sites: EnrichedSite[]): number {
  try {
    const bounds = map.getBounds()
    let count = 0
    for (const site of sites) {
      const [lng, lat] = site.geometry.coordinates
      if (bounds.contains([lng, lat])) count++
    }
    return count
  } catch {
    return sites.length
  }
}

function sitesToGeoJSON(sites: EnrichedSite[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: sites.map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: s.geometry.coordinates },
      properties: {
        id: s.id,
        name: s.properties?.name || s.id,
        score: s.strandedScore,
        emission: s.emission,
      },
    })),
  }
}

export default function Map({
  sites = [],
  filteredSites,
  onSiteClick,
  selectedId,
  portfolioIds = [],
  showMissionRing = true,
  viewMode,
  showSatellite = false,
  showTerrain = false,
  showHeatmap = false,
  showChoropleth = false,
  heatmapOpacity = 0.75,
  terrainExaggeration = 1,
  liveBtcPrice = 85000,
  radiusOverlay = null,
  centerTarget = null,
  boundsTarget = null,
  mapStyle = 'dark',
  showSiteLabels = false,
  highlightedProvinces = [],
  performanceMode = false,
  onViewChange,
  onMapReady,
  onCoordCopied,
  sitesLoading = false,
  loadProgress = 0,
  coordCopyLabel = 'Click map to copy coordinates',
  resizeTrigger = 0,
  loadingSitesLabel = 'Loading sites…',
  attributionLabel = '© CARTO · OSM',
  zoomLabel = 'Zoom',
  bearingLabel = 'Bearing',
  pitchLabel = 'Pitch',
  viewportSitesLabel = 'in view',
  tileFallbackLabel = 'Switched to OpenStreetMap tiles',
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const minimapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const minimapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const sitesRef = useRef(filteredSites)
  const onSiteClickRef = useRef(onSiteClick)
  const onViewChangeRef = useRef(onViewChange)
  const performanceModeRef = useRef(performanceMode)
  const nativeHandlersAttached = useRef(false)
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null)
  const skipHistoryRef = useRef(false)
  const viewChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 55.8, lng: -95.5 })
  const [mapBearing, setMapBearing] = useState(0)
  const [mapZoom, setMapZoom] = useState(3.2)
  const [mapPitch, setMapPitch] = useState(0)
  const [viewportSiteCount, setViewportSiteCount] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [webglUnsupported, setWebglUnsupported] = useState(false)
  const [tileFallbackActive, setTileFallbackActive] = useState(false)
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lng: number } | null>(null)
  const [copyFlash, setCopyFlash] = useState(false)
  const tileFallbackAppliedRef = useRef(false)

  onViewChangeRef.current = onViewChange
  performanceModeRef.current = performanceMode

  sitesRef.current = filteredSites
  onSiteClickRef.current = onSiteClick

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
  }

  const setNativeVisibility = useCallback((map: maplibregl.Map, visible: boolean) => {
    const vis = visible ? 'visible' : 'none'
    for (const id of [CLUSTER_LAYER, CLUSTER_COUNT_LAYER, UNCLUSTERED_LAYER]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis)
    }
  }, [])

  const attachNativeHandlers = useCallback((map: maplibregl.Map) => {
    if (nativeHandlersAttached.current) return
    nativeHandlersAttached.current = true

    const showHoverPopup = (html: string, coords: [number, number]) => {
      if (!hoverPopupRef.current) {
        hoverPopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'stranded-hover-popup',
          offset: 12,
        })
      }
      hoverPopupRef.current.setLngLat(coords).setHTML(html).addTo(map)
    }
    const hideHoverPopup = () => {
      hoverPopupRef.current?.remove()
    }

    map.on('mouseenter', CLUSTER_LAYER, (e) => {
      map.getCanvas().style.cursor = 'pointer'
      const feature = e.features?.[0]
      if (!feature) return
      const count = feature.properties?.point_count
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const scoreSum = Number(feature.properties?.score_sum ?? 0)
      const emissionSum = Number(feature.properties?.emission_sum ?? 0)
      const avgScore = count ? Math.round(scoreSum / count) : '—'
      const totalEmission = emissionSum >= 1000
        ? `${(emissionSum / 1000).toFixed(1)}t`
        : `${Math.round(emissionSum)} kg`
      showHoverPopup(
        `<div class="text-xs font-semibold">${count} sites</div>`
        + `<div class="text-[10px] text-gray-300 mt-0.5">Avg score <span class="text-[#FF8C00] font-mono">${avgScore}</span></div>`
        + `<div class="text-[10px] text-gray-400">Total ~${totalEmission}/day</div>`
        + `<div class="text-[10px] text-gray-500 mt-0.5">Click to expand cluster</div>`,
        coords,
      )
    })
    map.on('mouseleave', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ''; hideHoverPopup() })
    map.on('mouseenter', UNCLUSTERED_LAYER, (e) => {
      map.getCanvas().style.cursor = 'pointer'
      const feature = e.features?.[0]
      if (!feature) return
      const name = feature.properties?.name || 'Site'
      const score = feature.properties?.score ?? '—'
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      showHoverPopup(
        `<div class="text-xs font-semibold truncate max-w-[180px]">${name}</div><div class="text-[10px]">Score <span class="text-[#FF8C00] font-mono">${score}</span></div>`,
        coords,
      )
    })
    map.on('mouseleave', UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = ''; hideHoverPopup() })
  }, [])

  const ensureNativeLayers = useCallback((map: maplibregl.Map) => {
    if (!map.getSource(SITES_SOURCE)) {
      map.addSource(SITES_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: performanceModeRef.current ? 40 : 50,
        clusterProperties: {
          score_sum: ['+', ['get', 'score']],
          emission_sum: ['+', ['get', 'emission']],
        },
      })
    }

    if (!map.getLayer(CLUSTER_LAYER)) {
      map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: SITES_SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#5BC0BE', 25, '#22c55e', 100, '#eab308', 500, '#FF8C00',
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            18, 10, 22, 50, 28, 100, 34, 500, 40,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.85)',
          'circle-opacity': 0.92,
        },
      })
    }

    if (!map.getLayer(CLUSTER_COUNT_LAYER)) {
      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: 'symbol',
        source: SITES_SOURCE,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
        },
        paint: {
          'text-color': '#0f172a',
        },
      })
    }

    if (!map.getLayer(UNCLUSTERED_LAYER)) {
      map.addLayer({
        id: UNCLUSTERED_LAYER,
        type: 'circle',
        source: SITES_SOURCE,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': TIER_CIRCLE_COLOR,
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'emission'],
            10, 4, 100, 7, 1000, 10, 10000, 14,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.85)',
        },
      })
    }

    if (!map.getLayer(SITE_LABELS_LAYER)) {
      map.addLayer({
        id: SITE_LABELS_LAYER,
        type: 'symbol',
        source: SITES_SOURCE,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 0, 10.5, 9, 14, 11],
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-max-width': 10,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': 'rgba(15,23,42,0.85)',
          'text-halo-width': 1.2,
        },
      })
    }

    attachNativeHandlers(map)
  }, [attachNativeHandlers])

  const syncNativeClusters = useCallback((sitesToRender: EnrichedSite[], visible: boolean) => {
    const map = mapRef.current
    if (!map) return
    if (!map.isStyleLoaded?.()) {
      map.once('load', () => syncNativeClusters(sitesToRender, visible))
      return
    }

    ensureNativeLayers(map)
    const source = map.getSource(SITES_SOURCE) as maplibregl.GeoJSONSource
    source.setData(sitesToGeoJSON(sitesToRender))
    setNativeVisibility(map, visible)
  }, [ensureNativeLayers, setNativeVisibility])

  const addMarkers = useCallback((sitesToRender: EnrichedSite[], mode: MapViewMode) => {
    if (!mapRef.current) return
    clearMarkers()

    const isClusterMode = mode === 'dom' && sitesToRender.length > 180

    if (isClusterMode) {
      const buckets: Record<string, EnrichedSite[]> = {}
      sitesToRender.forEach(site => {
        const [lng, lat] = site.geometry.coordinates
        const key = `${Math.round(lng * 1.6)}:${Math.round(lat * 1.6)}`
        if (!buckets[key]) buckets[key] = []
        buckets[key].push(site)
      })

      Object.values(buckets).forEach(group => {
        const avgLng = group.reduce((s, g) => s + g.geometry.coordinates[0], 0) / group.length
        const avgLat = group.reduce((s, g) => s + g.geometry.coordinates[1], 0) / group.length
        const totalEmission = group.reduce((s, g) => s + g.emission, 0)
        const avgScore = Math.round(group.reduce((s, g) => s + g.strandedScore, 0) / group.length)
        const clusterRevenue = group.reduce((s, g) => s + g.potentialDailyProfitCAD, 0)

        const size = Math.min(38, Math.max(16, Math.sqrt(totalEmission) / 9))
        const el = document.createElement('div')
        el.title = `${group.length} sites · avg score ${avgScore} · C$${clusterRevenue.toLocaleString()}/day · ~${(clusterRevenue / liveBtcPrice * 0.0007).toFixed(3)} BTC/d`
        el.className = `flex items-center justify-center rounded-full border-2 border-white/80 text-[10px] font-bold shadow-xl cursor-pointer ${avgScore > 72 ? 'bg-[#22c55e]' : avgScore > 45 ? 'bg-[#eab308]' : 'bg-[#FF8C00]'}`
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.color = '#0f172a'
        el.textContent = String(group.length)
        el.setAttribute('role', 'button')
        el.tabIndex = 0
        el.setAttribute('aria-label', `Cluster of ${group.length} sites, average score ${avgScore}`)
        const openCluster = (e: Event) => {
          e.stopPropagation()
          const best = [...group].sort((a, b) => b.strandedScore - a.strandedScore)[0]
          onSiteClick(best)
        }
        el.addEventListener('click', openCluster)
        el.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCluster(e) }
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([avgLng, avgLat])
          .addTo(mapRef.current!)
        markersRef.current.push(marker)
      })
    } else {
      sitesToRender.forEach((site) => {
        const emission = site.emission
        const score = site.strandedScore
        const isPortfolio = showMissionRing && portfolioIds.includes(site.id)
        const isSelected = selectedId === site.id

        const size = Math.min(20, Math.max(8, Math.sqrt(Math.max(emission, 10)) / 11))
        const el = document.createElement('div')
        const bg = scoreTierColor(score)

        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.borderRadius = isPortfolio || isSelected ? '2px' : '999px'
        el.style.background = bg
        el.style.border = isSelected ? '3px solid #fff' : isPortfolio ? '2px solid #67e8f9' : '2px solid rgba(255,255,255,0.85)'
        el.style.boxShadow = isSelected
          ? '0 0 0 6px rgba(255,140,0,0.35), 0 0 14px rgba(0,0,0,0.6)'
          : isPortfolio
            ? '0 0 0 3px rgba(103,232,249,0.45), 0 0 5px rgba(0,0,0,0.5)'
            : '0 0 5px rgba(0,0,0,0.5)'
        el.style.cursor = 'pointer'
        el.style.transition = performanceModeRef.current
          ? 'none'
          : 'transform 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms ease'
        if (isSelected) el.style.transform = 'scale(1.4)'
        el.setAttribute('role', 'button')
        el.tabIndex = 0
        el.setAttribute(
          'aria-label',
          `${site.properties?.name || 'Site'}, score ${score}, ${Math.round(emission)} kg per day`,
        )
        el.title = site.properties?.name || site.id

        const openSite = (e: Event) => {
          e.stopPropagation()
          onSiteClick(site)
        }
        el.addEventListener('click', openSite)
        el.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSite(e) }
        })

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(site.geometry.coordinates)
          .addTo(mapRef.current!)

        if (isSelected || isPortfolio) {
          el.classList.add(isSelected ? 'selected' : '')
        }

        markersRef.current.push(marker)
      })
    }
  }, [onSiteClick, portfolioIds, selectedId, liveBtcPrice, showMissionRing])

  const effectiveSatellite = mapStyle === 'satellite' || showSatellite
  const effectiveTerrain = mapStyle === 'terrain' || showTerrain

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded?.()) return
    const layers = (map as maplibregl.Map & { _strandedLayers?: Record<string, boolean> })._strandedLayers || {}

    const showDark = mapStyle === 'dark'
    const showStandard = mapStyle === 'standard'
    if (map.getLayer('dark')) map.setLayoutProperty('dark', 'visibility', showDark ? 'visible' : 'none')
    if (map.getLayer('osm')) map.setLayoutProperty('osm', 'visibility', showStandard ? 'visible' : 'none')

    if (effectiveSatellite !== layers.satellite) {
      if (effectiveSatellite && !map.getLayer('satellite')) {
        map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-opacity': 0.85 } })
      } else if (!effectiveSatellite && map.getLayer('satellite')) {
        map.removeLayer('satellite')
      }
      layers.satellite = effectiveSatellite
    } else if (effectiveSatellite && map.getLayer('satellite')) {
      map.setLayoutProperty('satellite', 'visibility', 'visible')
    }

    if (effectiveTerrain !== layers.terrain) {
      map.setPitch(effectiveTerrain ? 50 : 0)
      if (effectiveTerrain && terrainExaggeration > 0) {
        if (!map.getSource('terrain')) return
        map.setTerrain({ source: 'terrain', exaggeration: terrainExaggeration })
        if (!map.getLayer('hillshade')) {
          map.addLayer({
            id: 'hillshade',
            type: 'hillshade',
            source: 'terrain',
            paint: { 'hillshade-exaggeration': 0.4 },
          }, 'osm')
        }
      } else {
        map.setTerrain(null)
        if (map.getLayer('hillshade')) map.removeLayer('hillshade')
      }
      layers.terrain = effectiveTerrain
    } else if (effectiveTerrain && map.getTerrain()) {
      map.setTerrain({ source: 'terrain', exaggeration: terrainExaggeration })
      if (map.getLayer('hillshade')) {
        map.setPaintProperty('hillshade', 'hillshade-exaggeration', terrainExaggeration * 0.4)
      }
    }
    ;(map as maplibregl.Map & { _strandedLayers?: Record<string, boolean> })._strandedLayers = layers
  }, [effectiveSatellite, effectiveTerrain, terrainExaggeration, mapStyle])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer(SITE_LABELS_LAYER)) return
    const zoom = map.getZoom()
    const visible = showSiteLabels && zoom > 10 && !showHeatmap
    map.setLayoutProperty(SITE_LABELS_LAYER, 'visibility', visible ? 'visible' : 'none')
  }, [showSiteLabels, showHeatmap, mapCenter, mapLoaded])



  const emitViewChange = useCallback((map: maplibregl.Map) => {
    if (skipHistoryRef.current) return
    if (viewChangeTimer.current) clearTimeout(viewChangeTimer.current)
    viewChangeTimer.current = setTimeout(() => {
      const c = map.getCenter()
      onViewChangeRef.current?.({
        lat: c.lat,
        lng: c.lng,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      })
    }, performanceModeRef.current ? 50 : 280)
  }, [])

  const navigateTo = useCallback((map: maplibregl.Map, opts: { center: [number, number]; zoom: number }) => {
    if (performanceModeRef.current) {
      map.jumpTo({ center: opts.center, zoom: opts.zoom })
    } else {
      map.flyTo({
        center: opts.center,
        zoom: opts.zoom,
        speed: 1.2,
        essential: true,
      })
    }
  }, [])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    setWebglUnsupported(!isWebGLSupported())

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OSM' },
          'dark': { type: 'raster', tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© CARTO © OSM' },
          'satellite': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 },
          'terrain': { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, encoding: 'terrarium', maxzoom: 15 },
        },
        layers: [
          { id: 'dark', type: 'raster', source: 'dark' },
          { id: 'osm', type: 'raster', source: 'osm', layout: { visibility: 'none' } },
        ],
      },
      center: [-95.5, 55.8],
      zoom: 3.2,
      attributionControl: false,
      pitch: showTerrain ? 45 : 0,
      touchZoomRotate: true,
      cooperativeGestures: false,
      fadeDuration: performanceMode ? 0 : 300,
    })
    ;(map as maplibregl.Map & { _strandedLayers?: Record<string, boolean> })._strandedLayers = { satellite: false, terrain: showTerrain, dark: true }
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')

    const switchToOsmFallback = () => {
      if (tileFallbackAppliedRef.current) return false
      tileFallbackAppliedRef.current = true
      if (map.getLayer('dark')) map.setLayoutProperty('dark', 'visibility', 'none')
      if (map.getLayer('osm')) map.setLayoutProperty('osm', 'visibility', 'visible')
      setTileFallbackActive(true)
      return true
    }

    map.on('error', (e) => {
      console.error('[Map] tile/style error', e?.error ?? e)
      const msg = String((e as { error?: { message?: string } })?.error?.message ?? e?.error ?? '')
      if (/cartocdn|dark_all|basemaps\.carto/i.test(msg)) {
        switchToOsmFallback()
      }
    })

    map.on('load', () => {
      setMapLoaded(true)
      map.resize()
      const api: MapHandle = {
        getView: () => {
          const m = mapRef.current
          if (!m) return null
          const c = m.getCenter()
          return { lat: c.lat, lng: c.lng, zoom: m.getZoom(), bearing: m.getBearing(), pitch: m.getPitch() }
        },
        fitToSites: (sitesToFit) => {
          const m = mapRef.current
          if (!m) return
          const raw = boundsFromSites(sitesToFit)
          if (!raw) return
          const padded = padBounds(raw)
          skipHistoryRef.current = true
          m.fitBounds(boundsToFitTuple(padded), { padding: 48, duration: performanceModeRef.current ? 0 : 900 })
          setTimeout(() => { skipHistoryRef.current = false }, performanceModeRef.current ? 80 : 1000)
        },
        exportScreenshot: () => {
          const m = mapRef.current
          if (!m) return null
          try {
            return m.getCanvas().toDataURL('image/png')
          } catch {
            return null
          }
        },
        flyTo: (target) => {
          const m = mapRef.current
          if (!m) return
          skipHistoryRef.current = true
          navigateTo(m, { center: [target.lng, target.lat], zoom: target.zoom ?? m.getZoom() })
          setTimeout(() => { skipHistoryRef.current = false }, performanceModeRef.current ? 80 : 1200)
        },
        resize: () => {
          try { mapRef.current?.resize() } catch { /* mid-teardown */ }
        },
      }
      onMapReady?.(api)
      setMapZoom(map.getZoom())
      setMapPitch(map.getPitch())
      setViewportSiteCount(countSitesInViewport(map, sitesRef.current))
    })

    map.on('mousemove', (e) => {
      setMapCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })
    map.on('rotate', () => {
      setMapBearing(map.getBearing())
      setMapPitch(map.getPitch())
    })
    map.on('move', () => {
      const c = map.getCenter()
      setMapCenter({ lat: c.lat, lng: c.lng })
      setMapBearing(map.getBearing())
      setMapZoom(map.getZoom())
      setMapPitch(map.getPitch())
      setViewportSiteCount(countSitesInViewport(map, sitesRef.current))
      if (minimapRef.current && !minimapRef.current.isMoving()) {
        minimapRef.current.setCenter(map.getCenter())
        minimapRef.current.setZoom(Math.max(map.getZoom() - 4, 0))
      }
    })
    map.on('moveend', () => emitViewChange(map))
    map.on('dblclick', (e) => {
      e.preventDefault()
      const nextZoom = Math.min(map.getZoom() + 1, map.getMaxZoom())
      if (performanceModeRef.current) {
        map.jumpTo({ center: e.lngLat, zoom: nextZoom })
      } else {
        map.easeTo({ center: e.lngLat, zoom: nextZoom, duration: 280, essential: true })
      }
    })
    map.on('click', (e) => {
      if (e.originalEvent?.shiftKey) {
        const nextZoom = Math.min(map.getZoom() + 1.5, map.getMaxZoom())
        if (performanceModeRef.current) {
          map.jumpTo({ center: e.lngLat, zoom: nextZoom })
        } else {
          map.easeTo({ center: e.lngLat, zoom: nextZoom, duration: 280, essential: true })
        }
        return
      }
      const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng }
      setClickedCoord(coords)
      const text = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
      navigator.clipboard?.writeText(text).then(() => {
        setCopyFlash(true)
        onCoordCopied?.(coords)
        setTimeout(() => setCopyFlash(false), 1600)
      }).catch(() => {})
    })

    const handleWindowResize = () => {
      try { map.resize() } catch { /* ignore */ }
    }
    window.addEventListener('resize', handleWindowResize)
    window.addEventListener('orientationchange', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
      window.removeEventListener('orientationchange', handleWindowResize)
      if (viewChangeTimer.current) clearTimeout(viewChangeTimer.current)
      hoverPopupRef.current?.remove()
      clearMarkers()
      if (minimapRef.current) {
        minimapRef.current.remove()
        minimapRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        nativeHandlersAttached.current = false
      }
    }
  // showTerrain only seeds initial pitch; live updates handled in satellite/terrain effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncChoropleth = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.isStyleLoaded?.()) {
      map.once('load', () => syncChoropleth())
      return
    }
    const srcId = 'province-choropleth'
    const layerId = 'province-choropleth-fill'
    const outlineId = 'province-choropleth-outline'
    const totals: Record<string, number> = {}
    sites.forEach(s => {
      const p = s.properties.province || 'Unknown'
      totals[p] = (totals[p] || 0) + s.emission
    })
    const geojson = emissionChoroplethGeojson(totals)
    const highlightList = highlightedProvinces.length ? highlightedProvinces : ['__none__']
    try {
      if (map.getSource(srcId)) {
        (map.getSource(srcId) as maplibregl.GeoJSONSource).setData(geojson)
      } else {
        map.addSource(srcId, { type: 'geojson', data: geojson })
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: srcId,
          paint: {
            'fill-color': [
              'case',
              ['in', ['get', 'name'], ['literal', highlightList]],
              [
                'interpolate', ['linear'], ['get', 'intensity'],
                0, 'rgba(255,140,0,0.22)',
                0.35, 'rgba(255,140,0,0.42)',
                1, 'rgba(255,140,0,0.62)',
              ],
              [
                'interpolate', ['linear'], ['get', 'intensity'],
                0, 'rgba(91,192,190,0.12)',
                0.35, 'rgba(251,191,36,0.28)',
                1, 'rgba(255,140,0,0.48)',
              ],
            ],
            'fill-outline-color': [
              'case',
              ['in', ['get', 'name'], ['literal', highlightList]],
              'rgba(255,140,0,0.75)',
              'rgba(255,255,255,0.25)',
            ],
          },
        })
        map.addLayer({
          id: outlineId,
          type: 'line',
          source: srcId,
          paint: {
            'line-color': [
              'case',
              ['in', ['get', 'name'], ['literal', highlightList]],
              '#FF8C00',
              'rgba(255,255,255,0.15)',
            ],
            'line-width': [
              'case',
              ['in', ['get', 'name'], ['literal', highlightList]],
              2.5,
              0.5,
            ],
          },
        })
      }
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'fill-color', [
          'case',
          ['in', ['get', 'name'], ['literal', highlightList]],
          [
            'interpolate', ['linear'], ['get', 'intensity'],
            0, 'rgba(255,140,0,0.22)',
            0.35, 'rgba(255,140,0,0.42)',
            1, 'rgba(255,140,0,0.62)',
          ],
          [
            'interpolate', ['linear'], ['get', 'intensity'],
            0, 'rgba(91,192,190,0.12)',
            0.35, 'rgba(251,191,36,0.28)',
            1, 'rgba(255,140,0,0.48)',
          ],
        ] as maplibregl.ExpressionSpecification)
        map.setLayoutProperty(layerId, 'visibility', showChoropleth ? 'visible' : 'none')
      }
      if (map.getLayer(outlineId)) {
        map.setLayoutProperty(outlineId, 'visibility', showChoropleth ? 'visible' : 'none')
      }
    } catch (err) {
      console.warn('[Map] choropleth sync failed', err)
    }
  }, [sites, showChoropleth, highlightedProvinces])

  const syncHeatmap = useCallback((sitesToRender: EnrichedSite[]) => {
    const map = mapRef.current
    if (!map) return
    if (!map.isStyleLoaded?.()) {
      map.once('load', () => syncHeatmap(sitesToRender))
      return
    }
    const srcId = 'emission-heat'
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: sitesToRender.map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: s.geometry.coordinates },
        properties: { weight: Math.max(0.1, Math.log10(Math.max(s.emission, 10))) },
      })),
    }
    try {
      if (map.getSource(srcId)) {
        (map.getSource(srcId) as maplibregl.GeoJSONSource).setData(geojson)
      } else {
        map.addSource(srcId, { type: 'geojson', data: geojson })
        map.addLayer({
          id: 'emission-heat-layer',
          type: 'heatmap',
          source: srcId,
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 0.6,
            'heatmap-radius': 28,
            'heatmap-opacity': 0.75,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(20,184,166,0)',
              0.3, '#14b8a6',
              0.6, '#fbbf24',
              1, '#f43f5e',
            ],
          },
        })
      }
      if (map.getLayer('emission-heat-layer')) {
        map.setLayoutProperty('emission-heat-layer', 'visibility', showHeatmap ? 'visible' : 'none')
        map.setPaintProperty('emission-heat-layer', 'heatmap-opacity', heatmapOpacity)
      }
    } catch (err) {
      console.warn('[Map] heatmap sync failed', err)
    }
  }, [showHeatmap, heatmapOpacity])

  useEffect(() => {
    syncChoropleth()
  }, [syncChoropleth])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    const id = requestAnimationFrame(() => {
      try { map.resize() } catch { /* ignore */ }
    })
    return () => cancelAnimationFrame(id)
  }, [resizeTrigger, mapLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    setViewportSiteCount(countSitesInViewport(map, filteredSites))
  }, [filteredSites, mapLoaded, mapZoom, mapCenter])

  useEffect(() => {
    if (!mapRef.current) return
    const mode = resolveViewMode(viewMode, filteredSites.length)

    syncHeatmap(filteredSites)

    if (showHeatmap) {
      clearMarkers()
      syncNativeClusters(filteredSites, false)
      return
    }

    if (mode === 'native-clusters') {
      clearMarkers()
      syncNativeClusters(filteredSites, true)
    } else {
      syncNativeClusters(filteredSites, false)
      addMarkers(filteredSites, mode)
    }
  }, [filteredSites, addMarkers, viewMode, showHeatmap, syncHeatmap, syncNativeClusters])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer(UNCLUSTERED_LAYER)) return

    const selected = selectedId || ''
    const portfolio = showMissionRing && portfolioIds.length ? portfolioIds : ['']

    map.setPaintProperty(UNCLUSTERED_LAYER, 'circle-stroke-width', [
      'case',
      ['==', ['get', 'id'], selected],
      3,
      showMissionRing && portfolioIds.length
        ? ['case', ['in', ['get', 'id'], ['literal', portfolio]], 2.5, 1.5]
        : 1.5,
    ] as maplibregl.ExpressionSpecification)

    map.setPaintProperty(UNCLUSTERED_LAYER, 'circle-stroke-color', [
      'case',
      ['==', ['get', 'id'], selected],
      '#ffffff',
      showMissionRing && portfolioIds.length
        ? ['case', ['in', ['get', 'id'], ['literal', portfolio]], '#67e8f9', 'rgba(255,255,255,0.85)']
        : 'rgba(255,255,255,0.85)',
    ] as maplibregl.ExpressionSpecification)

    if (map.getLayer(UNCLUSTERED_LAYER)) {
      map.setPaintProperty(UNCLUSTERED_LAYER, 'circle-opacity', 0.92)
    }
  }, [selectedId, portfolioIds, showMissionRing])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      const srcId = 'radius-filter'
      const layerId = 'radius-filter-layer'
      const fillId = 'radius-filter-fill'
      if (!radiusOverlay) {
        if (map.getLayer(fillId)) map.removeLayer(fillId)
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(srcId)) map.removeSource(srcId)
        return
      }
      const { lat, lng, radiusKm } = radiusOverlay
      const points = 64
      const coords: [number, number][] = []
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI
        const dx = (radiusKm / 111.32) * Math.cos(angle)
        const dy = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
        coords.push([lng + dy, lat + dx])
      }
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [coords] },
          properties: { radiusKm },
        }],
      }
      if (map.getSource(srcId)) {
        (map.getSource(srcId) as maplibregl.GeoJSONSource).setData(geojson)
      } else {
        map.addSource(srcId, { type: 'geojson', data: geojson })
        map.addLayer({
          id: fillId,
          type: 'fill',
          source: srcId,
          paint: { 'fill-color': '#FF8C00', 'fill-opacity': 0.08 },
        })
        map.addLayer({
          id: layerId,
          type: 'line',
          source: srcId,
          paint: { 'line-color': '#FF8C00', 'line-width': 2, 'line-dasharray': [2, 2] },
        })
      }
    }
    if (map.isStyleLoaded?.()) apply()
    else map.once('load', apply)
  }, [radiusOverlay])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return

    const selected = filteredSites.find(s => s.id === selectedId)
    if (!selected) return

    const [lng, lat] = selected.geometry.coordinates
    skipHistoryRef.current = true
    navigateTo(map, {
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 7.2),
    })
    setTimeout(() => { skipHistoryRef.current = false }, performanceModeRef.current ? 80 : 1400)
  }, [selectedId, filteredSites, navigateTo])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !centerTarget) return
    skipHistoryRef.current = true
    navigateTo(map, {
      center: [centerTarget.lng, centerTarget.lat],
      zoom: centerTarget.zoom ?? Math.max(map.getZoom(), 8),
    })
    setTimeout(() => { skipHistoryRef.current = false }, performanceModeRef.current ? 80 : 1200)
  }, [centerTarget, navigateTo])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !boundsTarget?.sites?.length) return
    const raw = boundsFromSites(boundsTarget.sites)
    if (!raw) return
    const padded = padBounds(raw)
    skipHistoryRef.current = true
    map.fitBounds(boundsToFitTuple(padded), {
      padding: boundsTarget.padding ?? 48,
      duration: performanceModeRef.current ? 0 : 900,
    })
    setTimeout(() => { skipHistoryRef.current = false }, performanceModeRef.current ? 80 : 1000)
  }, [boundsTarget?.key, boundsTarget?.sites, boundsTarget?.padding])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer('emission-heat-layer')) return
    map.setPaintProperty('emission-heat-layer', 'heatmap-opacity', heatmapOpacity)
  }, [heatmapOpacity])

  useEffect(() => {
    if (!minimapContainer.current || minimapRef.current) return
    const main = mapRef.current
    if (!main) return

    let mini: maplibregl.Map | null = null
    const box = document.createElement('div')
    box.className = 'absolute border-2 border-[#FF8C00]/80 bg-[#FF8C00]/10 pointer-events-none'

    try {
      mini = new maplibregl.Map({
        container: minimapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: main.getCenter(),
        zoom: Math.max(main.getZoom() - 4, 0),
        interactive: true,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      })
      minimapRef.current = mini

      mini.on('click', (e) => {
        if (!mapRef.current) return
        skipHistoryRef.current = true
        navigateTo(mapRef.current, {
          center: [e.lngLat.lng, e.lngLat.lat],
          zoom: Math.max(mapRef.current.getZoom(), 5),
        })
        setTimeout(() => { skipHistoryRef.current = false }, performanceModeRef.current ? 80 : 1200)
      })
      mini.on('mouseenter', () => { if (mini) mini.getCanvas().style.cursor = 'crosshair' })
      mini.on('mouseleave', () => { if (mini) mini.getCanvas().style.cursor = '' })

      const updateBox = () => {
        if (!minimapRef.current || !mapRef.current) return
        try {
          const b = mapRef.current.getBounds()
          const sw = minimapRef.current.project(b.getSouthWest())
          const ne = minimapRef.current.project(b.getNorthEast())
          box.style.left = `${Math.min(sw.x, ne.x)}px`
          box.style.top = `${Math.min(sw.y, ne.y)}px`
          box.style.width = `${Math.abs(ne.x - sw.x)}px`
          box.style.height = `${Math.abs(ne.y - sw.y)}px`
        } catch { /* map mid-teardown */ }
      }
      mini.on('load', () => {
        minimapContainer.current?.appendChild(box)
        updateBox()
      })
      main.on('move', updateBox)
    } catch (err) {
      console.warn('[Map] minimap init failed', err)
      minimapRef.current = null
    }

    return () => {
      box.remove()
      if (mini) {
        try { mini.remove() } catch { /* ignore */ }
      }
      minimapRef.current = null
    }
  }, [])

  const displayCoord = clickedCoord ?? mapCenter
  const showBearing = Math.abs(mapBearing) > 0.5
  const showPitch = effectiveTerrain && mapPitch > 0.5
  const loadingPct = Math.max(0, Math.min(100, Math.round(loadProgress)))

  return (
    <div className={`relative w-full h-full map-print-target map-stage-vignette ${performanceMode ? 'map-performance-mode' : ''}`}>
      <div
        ref={mapContainer}
        className="w-full h-full touch-manipulation"
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        role="application"
        aria-label="Interactive map of stranded methane sites"
      />

      {!mapLoaded && (
        <div className="absolute inset-0 z-[15] map-loading-skeleton pointer-events-none" aria-hidden data-testid="map-loading-overlay">
          <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/3 bg-[#FF8C00]/80 animate-[shimmer_1.4s_ease-in-out_infinite]" />
            </div>
            <span className="text-[10px] text-gray-400 tracking-widest uppercase">Loading map…</span>
          </div>
        </div>
      )}

      {mapLoaded && sitesLoading && (
        <div
          className="absolute top-3 right-3 z-[14] glass px-2.5 py-1 rounded-lg border border-white/15 text-[10px] text-gray-400 pointer-events-none font-mono tabular-nums"
          data-testid="map-sites-loading"
          aria-live="polite"
        >
          {loadingPct > 0 && loadingPct < 100
            ? loadingSitesLabel.replace('{pct}', String(loadingPct))
            : loadingSitesLabel.replace(' {pct}%', '').replace('{pct}%', '').replace('{pct}', '')}
        </div>
      )}

      {tileFallbackActive && (
        <div className="absolute top-3 left-3 z-[14] glass px-2 py-1 rounded-lg border border-amber-500/35 text-[9px] text-amber-200/90 pointer-events-none max-w-[10rem]" data-testid="map-tile-fallback">
          {tileFallbackLabel}
        </div>
      )}

      {webglUnsupported && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[16] glass px-3 py-2 rounded-xl border border-amber-500/40 text-[10px] text-amber-200 flex items-center gap-2 max-w-[90vw]">
          <AlertTriangle size={14} className="shrink-0" />
          <span>WebGL is unavailable — map rendering may be limited. Try updating your browser or enabling hardware acceleration.</span>
        </div>
      )}

      <div
        className="absolute bottom-[8.5rem] left-3 z-[12] pointer-events-none hidden sm:flex flex-col items-start gap-1.5 max-w-[calc(100%-10rem)]"
        data-testid="map-coordinate-strip"
        aria-label="Map coordinates and view state"
      >
        <div
          className={`map-coord-readout px-2 py-1 rounded-lg border text-[10px] font-mono tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5 ${
            copyFlash ? 'map-coord-readout--copied text-[#5BC0BE]' : 'border-white/15 text-gray-300'
          }`}
          title={coordCopyLabel}
        >
          <span className="inline-flex items-center gap-1">
            <Copy size={10} className={copyFlash ? 'text-[#5BC0BE]' : 'text-gray-500'} />
            {displayCoord.lat.toFixed(4)}°, {displayCoord.lng.toFixed(4)}°
          </span>
          <span className="text-gray-500">{zoomLabel.replace('{level}', mapZoom.toFixed(1))}</span>
          {showBearing && (
            <span className="text-gray-500">{bearingLabel.replace('{deg}', mapBearing.toFixed(0))}</span>
          )}
          {showPitch && (
            <span className="text-gray-500">{pitchLabel.replace('{deg}', mapPitch.toFixed(0))}</span>
          )}
          <span className="text-[#5BC0BE]/80">{viewportSitesLabel.replace('{count}', String(viewportSiteCount))}</span>
        </div>
      </div>

      <a
        href={tileFallbackActive ? 'https://www.openstreetmap.org/copyright' : 'https://carto.com/attributions'}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 left-3 z-[11] text-[8px] text-gray-500/80 hover:text-[#5BC0BE] transition pointer-events-auto sm:bottom-[7.25rem]"
        data-testid="map-attribution"
      >
        {tileFallbackActive ? '© OSM' : attributionLabel}
      </a>

      <div
        className="absolute top-[4.5rem] left-3 z-[12] pointer-events-none hidden sm:flex flex-col items-center xl:left-[19.5rem]"
        aria-hidden
        title="North"
      >
        <div
          className="map-compass relative w-8 h-8 rounded-full border border-white/20 flex items-center justify-center"
          style={{ transform: `rotate(${-mapBearing}deg)` }}
        >
          <Compass size={15} className="text-[#FF8C00]" strokeWidth={2.25} />
          <span className="absolute -top-0.5 text-[7px] font-bold text-[#FF8C00] leading-none">N</span>
        </div>
      </div>

      {showHeatmap && (
        <div className="map-heat-legend absolute bottom-[10.5rem] left-3 z-[12] px-2.5 py-2 rounded-lg border border-white/15 pointer-events-none hidden sm:block w-[7.5rem]">
          <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Emission density</div>
          <div className="map-heat-legend__bar w-full" />
          <div className="map-heat-legend__labels">
            <span>Low</span>
            <span>Med</span>
            <span>High</span>
          </div>
        </div>
      )}

      <div
        ref={minimapContainer}
        className="map-minimap absolute bottom-14 left-3 z-[12] w-28 h-20 rounded-lg border border-white/20 overflow-hidden shadow-lg bg-[#1e293b]/90 hidden sm:block cursor-crosshair"
        title="Click minimap to pan"
        aria-label="Overview minimap — click to pan main map"
      />
    </div>
  )
}