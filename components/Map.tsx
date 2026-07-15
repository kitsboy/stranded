'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { EnrichedSite, scoreTierColor } from '@/lib/sites'
import { emissionChoroplethGeojson } from '@/lib/province-choropleth'

export type MapViewMode = 'precise' | 'dom' | 'native-clusters'

interface MapProps {
  sites: EnrichedSite[]
  filteredSites: EnrichedSite[]
  onSiteClick: (site: EnrichedSite) => void
  selectedId?: string | null
  portfolioIds?: string[]
  /** @deprecated use native-clusters */
  viewMode?: MapViewMode | 'clusters'
  showSatellite?: boolean
  showTerrain?: boolean
  showHeatmap?: boolean
  showChoropleth?: boolean
  liveBtcPrice?: number
  radiusOverlay?: { lat: number; lng: number; radiusKm: number } | null
}

const SITES_SOURCE = 'stranded-sites'
const CLUSTER_LAYER = 'stranded-clusters'
const CLUSTER_COUNT_LAYER = 'stranded-cluster-count'
const UNCLUSTERED_LAYER = 'stranded-unclustered'

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

function sitesToGeoJSON(sites: EnrichedSite[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: sites.map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: s.geometry.coordinates },
      properties: {
        id: s.id,
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
  viewMode,
  showSatellite = false,
  showTerrain = false,
  showHeatmap = false,
  showChoropleth = false,
  liveBtcPrice = 85000,
  radiusOverlay = null,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const sitesRef = useRef(filteredSites)
  const onSiteClickRef = useRef(onSiteClick)
  const nativeHandlersAttached = useRef(false)

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

    map.on('click', CLUSTER_LAYER, (e) => {
      const feature = e.features?.[0]
      if (!feature) return
      const clusterId = feature.properties?.cluster_id
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const source = map.getSource(SITES_SOURCE) as maplibregl.GeoJSONSource
      if (clusterId == null) return
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        map.easeTo({ center: coords, zoom })
      }).catch(() => {})
    })

    map.on('click', UNCLUSTERED_LAYER, (e) => {
      const feature = e.features?.[0]
      const siteId = feature?.properties?.id
      if (!siteId) return
      const site = sitesRef.current.find(s => s.id === siteId)
      if (site) onSiteClickRef.current(site)
    })

    map.on('mouseenter', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = '' })
  }, [])

  const ensureNativeLayers = useCallback((map: maplibregl.Map) => {
    if (!map.getSource(SITES_SOURCE)) {
      map.addSource(SITES_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
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
        const isPortfolio = portfolioIds.includes(site.id)
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
          : '0 0 5px rgba(0,0,0,0.5)'
        el.style.cursor = 'pointer'
        el.style.transition = 'transform 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms ease'
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
  }, [onSiteClick, portfolioIds, selectedId, liveBtcPrice])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded?.()) return
    const layers = (map as maplibregl.Map & { _strandedLayers?: Record<string, boolean> })._strandedLayers || {}
    if (showSatellite !== layers.satellite) {
      if (showSatellite && !map.getLayer('satellite')) {
        map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-opacity': 0.85 } })
      } else if (!showSatellite && map.getLayer('satellite')) {
        map.removeLayer('satellite')
      }
      layers.satellite = showSatellite
    }
    if (showTerrain !== layers.terrain) {
      map.setPitch(showTerrain ? 50 : 0)
      layers.terrain = showTerrain
    }
    ;(map as maplibregl.Map & { _strandedLayers?: Record<string, boolean> })._strandedLayers = layers
  }, [showSatellite, showTerrain])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OSM' },
          'satellite': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 },
          'terrain': { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, encoding: 'terrarium', maxzoom: 15 },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [-95.5, 55.8],
      zoom: 3.2,
      attributionControl: false,
      pitch: showTerrain ? 45 : 0,
      touchZoomRotate: true,
      cooperativeGestures: false,
    })
    ;(map as maplibregl.Map & { _strandedLayers?: Record<string, boolean> })._strandedLayers = { satellite: false, terrain: showTerrain }
    mapRef.current = map

    return () => {
      clearMarkers()
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
    const totals: Record<string, number> = {}
    sites.forEach(s => {
      const p = s.properties.province || 'Unknown'
      totals[p] = (totals[p] || 0) + s.emission
    })
    const geojson = emissionChoroplethGeojson(totals)
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
            'interpolate', ['linear'], ['get', 'intensity'],
            0, 'rgba(91,192,190,0.12)',
            0.35, 'rgba(251,191,36,0.28)',
            1, 'rgba(255,140,0,0.48)',
          ],
          'fill-outline-color': 'rgba(255,255,255,0.25)',
        },
      })
    }
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', showChoropleth ? 'visible' : 'none')
    }
  }, [sites, showChoropleth])

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
    }
  }, [showHeatmap])

  useEffect(() => {
    syncChoropleth()
  }, [syncChoropleth])

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
    const portfolio = portfolioIds.length ? portfolioIds : ['']

    map.setPaintProperty(UNCLUSTERED_LAYER, 'circle-stroke-width', [
      'case',
      ['==', ['get', 'id'], selected],
      3,
      ['in', ['get', 'id'], ['literal', portfolio]],
      2,
      1.5,
    ] as maplibregl.ExpressionSpecification)

    map.setPaintProperty(UNCLUSTERED_LAYER, 'circle-stroke-color', [
      'case',
      ['==', ['get', 'id'], selected],
      '#ffffff',
      ['in', ['get', 'id'], ['literal', portfolio]],
      '#67e8f9',
      'rgba(255,255,255,0.85)',
    ] as maplibregl.ExpressionSpecification)
  }, [selectedId, portfolioIds])

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
    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 7.2),
      speed: 1.35,
      curve: 1.4,
      essential: true,
    })
  }, [selectedId, filteredSites])

  return (
    <div
      ref={mapContainer}
      className="w-full h-full touch-manipulation"
      style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      role="application"
      aria-label="Interactive map of stranded methane sites"
    />
  )
}