'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { EnrichedSite } from '@/lib/sites'

interface MapProps {
  sites: EnrichedSite[]
  filteredSites: EnrichedSite[]
  onSiteClick: (site: EnrichedSite) => void
  selectedId?: string | null
  portfolioIds?: string[]
  viewMode?: 'precise' | 'clusters'
}

export default function Map({ 
  filteredSites, 
  onSiteClick, 
  selectedId, 
  portfolioIds = [], 
  viewMode = 'precise' 
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
  }

  const addMarkers = useCallback((sitesToRender: EnrichedSite[]) => {
    if (!mapRef.current) return
    clearMarkers()

    const isClusterMode = viewMode === 'clusters' && sitesToRender.length > 180

    if (isClusterMode) {
      // Wild creative clustering using plain object (TS friendly) — still delivers huge perf + visual density
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

        const size = Math.min(38, Math.max(16, Math.sqrt(totalEmission) / 9))
        const el = document.createElement('div')
        el.className = `flex items-center justify-center rounded-full border-2 border-white/80 text-[10px] font-bold shadow-xl cursor-pointer ${avgScore > 72 ? 'bg-[#22c55e]' : avgScore > 45 ? 'bg-[#eab308]' : 'bg-[#FF8C00]'}`
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.color = '#0f172a'
        el.innerHTML = `<span class="font-mono">${group.length}</span>`

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const best = [...group].sort((a,b) => b.strandedScore - a.strandedScore)[0]
          onSiteClick(best)
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([avgLng, avgLat])
          .addTo(mapRef.current)
        markersRef.current.push(marker)
      })
    } else {
      // Precise sexy individual markers (performance via filteredSites only)
      sitesToRender.forEach((site) => {
        const emission = site.emission
        const score = site.strandedScore
        const isPortfolio = portfolioIds.includes(site.id)
        const isSelected = selectedId === site.id

        const size = Math.min(20, Math.max(8, Math.sqrt(Math.max(emission, 10)) / 11))
        const el = document.createElement('div')

        // Dynamic color: low teal → fire orange/red for high emission
        let bg = '#14b8a6'
        if (score > 78) bg = '#f43f5e'
        else if (score > 62) bg = '#fb923c'
        else if (score > 45) bg = '#fbbf24'
        else if (emission > 800) bg = '#f59e0b'

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

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onSiteClick(site)
        })

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(site.geometry.coordinates)
          .addTo(mapRef.current)

        if (isSelected || isPortfolio) {
          el.classList.add(isSelected ? 'selected' : '')
        }

        markersRef.current.push(marker)
      })
    }
  }, [onSiteClick, portfolioIds, selectedId, viewMode])

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [-95.5, 55.8],
      zoom: 3.2,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      console.log('[Map] Command Center map ready — rendering filtered data only for performance')
    })

    return () => {
      clearMarkers()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // React to filtered data + viewMode (core of performance + live filters)
  useEffect(() => {
    if (!mapRef.current) return
    addMarkers(filteredSites)
  }, [filteredSites, addMarkers, viewMode])

  // Sexy fly-to + highlight when selection changes
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

  return <div ref={mapContainer} className="w-full h-full" />
}

