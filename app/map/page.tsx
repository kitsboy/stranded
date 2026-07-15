'use client'

import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Zap, RefreshCw, Target, Download, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import SiteDetailsPanel from '@/components/SiteDetailsPanel'
import LayerControls, { LAYER_PRESETS, type LayerPresetId } from '@/components/LayerControls'
import DualRangeSlider from '@/components/DualRangeSlider'
import type { LiveStats } from '@/types/live-stats'
import MissionPanel from '@/components/MissionPanel'
import CompareSitesModal from '@/components/CompareSitesModal'
import { loadSites, filterSites, EnrichedSite, effectiveGridKm, hasStrongConnectivity } from '@/lib/sites'
import { savePortfolio, loadPortfolioIds, portfolioShareUrl, exportPortfolioCsv, exportPortfolioPdfHtml, portfolioDailyPotentialCad, scalePotentialCad } from '@/lib/portfolio'
import { decodePortfolioShare } from '@/lib/portfolio'
import { parseMapUrl, haversineKm } from '@/lib/map-url-state'
import { getFilterPresets, saveFilterPreset, type FilterPreset } from '@/lib/bookmarks'
import { exportFilteredGeojson, exportSitesKml, downloadBlob } from '@/lib/export-formats'
import { savePortfolioProfile } from '@/lib/portfolio-profiles'
import { addSiteAlert, evaluateWatchHits, markAlertNotified } from '@/lib/alerts'
import { decodePresetHash, presetShareUrl } from '@/lib/filter-preset-hash'
import KeyboardHelpModal from '@/components/KeyboardHelpModal'
import ScoreLegend from '@/components/ScoreLegend'
import { useBtcUsd } from '@/components/BtcPriceProvider'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'
import OnboardingTour from '@/components/OnboardingTour'
import QuickActions, { MapFabIcons } from '@/components/QuickActions'
import CopyLinkButton from '@/components/CopyLinkButton'
import { recordRecentSite } from '@/lib/recent-sites'


const Map = dynamic(() => import('@/components/Map'), { ssr: false })
type MapViewMode = 'precise' | 'dom' | 'native-clusters'

function StrandedCommandCenter() {
  const [allSites, setAllSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<EnrichedSite | null>(null)
  const [portfolio, setPortfolio] = useState<EnrichedSite[]>([])
  const [viewMode, setViewMode] = useState<MapViewMode>('precise')
  const didAutoCluster = useRef(false)
  const liveBtcPrice = useBtcUsd()
  const { locale, t } = useLocale()

  // Sexy advanced filters - start with ALL 2611 visible by default
  const [minEmission, setMinEmission] = useState(0)
  const [maxEmission, setMaxEmission] = useState(100000)
  const [selectedProvinces, setSelectedProvinces] = useState<Set<string>>(new Set())
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [minScore, setMinScore] = useState(0)
  const [showAllProvinces, setShowAllProvinces] = useState(false)

  const [layers, setLayers] = useState({ sites: true, grid: false, internet: false, satellite: false, terrain: false, heatmap: false, choropleth: false })
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.75)
  const [terrainExaggeration, setTerrainExaggeration] = useState(1)
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null)
  const [presetName, setPresetName] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [compareSites, setCompareSites] = useState<EnrichedSite[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [radiusFilter, setRadiusFilter] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null)
  const [centerTarget, setCenterTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [showSearchHint, setShowSearchHint] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.ok ? r.json() : null)
      .then(s => setLiveStats(s))
      .catch(() => {})
  }, [])

  // Load full 2611 with enrichment (performance + types)
  useEffect(() => {
    setLoadProgress(30)
    loadSites().then(sites => {
      setLoadProgress(100)
      setAllSites(sites)
      setLoading(false)

      const urlState = parseMapUrl(searchParams)
      if (urlState.minScore != null) setMinScore(urlState.minScore)
      if (urlState.minEmission != null) setMinEmission(urlState.minEmission)
      if (urlState.provinces?.length) {
        setSelectedProvinces(new Set(urlState.provinces))
        if (urlState.provinces.length > 6) setShowAllProvinces(true)
      }

      if (urlState.radius && urlState.lat != null && urlState.lng != null) {
        setRadiusFilter({ lat: urlState.lat, lng: urlState.lng, radiusKm: urlState.radius })
      }

      const siteId = urlState.site || searchParams.get('site')
      if (siteId) {
        const match = sites.find(s => s.id === siteId || String(s.properties.ghgrp_id) === siteId)
        if (match) {
          recordRecentSite(match)
          setTimeout(() => {
            setSelectedSite(match)
            // ensure province of deep-linked site is not filtered out
            if (match.properties.province) {
              setSelectedProvinces(prev => {
                if (prev.size === 0) return prev
                const next = new Set(prev)
                next.add(match.properties.province)
                return next
              })
            }
          }, 420)
        } else {
          toast.error(t('mapSiteNotFound'))
        }
      }

      const missionToken = urlState.mission || searchParams.get('mission')
      if (missionToken) {
        const ids = decodePortfolioShare(missionToken)
        const restored = ids.map(id => sites.find(s => s.id === id)).filter(Boolean) as EnrichedSite[]
        if (restored.length) {
          setPortfolio(restored)
          savePortfolio(restored)
          toast.success(`Mission restored (${restored.length} sites)`)
        }
      } else {
        const savedIds = loadPortfolioIds()
        if (savedIds.length) {
          const restored = savedIds.map(id => sites.find(s => s.id === id)).filter(Boolean) as EnrichedSite[]
          if (restored.length) setPortfolio(restored)
        }
      }

      // Hash preset share: /map#preset=<base64>
      const hashMatch = typeof window !== 'undefined' ? window.location.hash.match(/^#preset=(.+)$/) : null
      if (hashMatch) {
        const preset = decodePresetHash(hashMatch[1])
        if (preset) {
          setMinScore(preset.minScore)
          setMinEmission(preset.minEmission)
          setSelectedProvinces(new Set(preset.provinces))
          toast.success(`Loaded shared preset: ${preset.name}`)
        }
      }

      // Local watch-site alerts on map open
      const hits = evaluateWatchHits(sites.map(s => ({ id: s.id, strandedScore: s.strandedScore, emission: s.emission })))
      hits.forEach(hit => {
        toast.message(`Watch alert: ${hit.name}`, {
          description: hit.reasons.join(' · '),
          duration: 9000,
          action: {
            label: 'Open',
            onClick: () => {
              const s = sites.find(x => x.id === hit.siteId)
              if (s) setSelectedSite(s)
            },
          },
        })
        markAlertNotified(hit.siteId)
      })
    }).catch(err => {
      console.error(err)
      setLoading(false)
      toast.error(t('mapLoadFailed'))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('stranded-map-search-hint-dismissed')) {
      setShowSearchHint(true)
    }
  }, [])

  // Compute filtered (live filtering = sexy + performant)
  const filteredSites = useMemo(() => {
    let result = filterSites(allSites, {
      minEmission,
      maxEmission,
      provinces: selectedProvinces.size ? selectedProvinces : undefined,
      sourceTypes: selectedSources.size ? selectedSources : undefined,
      minScore,
    })

    // Grid / connectivity layers use Score v3 measured-or-inferred distance & internet
    if (layers.grid) {
      result = result.filter(s => effectiveGridKm(s) < 18)
    }
    if (layers.internet) {
      result = result.filter(s => hasStrongConnectivity(s))
    }
    if (radiusFilter) {
      const { lat, lng, radiusKm } = radiusFilter
      result = result.filter(s => {
        const [slng, slat] = s.geometry.coordinates
        return haversineKm(lat, lng, slat, slng) <= radiusKm
      })
    }
    return result
  }, [allSites, minEmission, maxEmission, selectedProvinces, selectedSources, minScore, layers, radiusFilter])

  useEffect(() => {
    if (!didAutoCluster.current && filteredSites.length > 180) {
      setViewMode('native-clusters')
      didAutoCluster.current = true
    }
  }, [filteredSites.length])

  const cycleViewMode = () => {
    setViewMode(m => (m === 'precise' ? 'native-clusters' : m === 'native-clusters' ? 'dom' : 'precise'))
  }

  const viewModeLabel: Record<MapViewMode, string> = {
    precise: t('mapPreciseMarkers'),
    'native-clusters': t('mapNativeClusters'),
    dom: t('mapDomClusters'),
  }

  const provinces = useMemo(() => {
    return Array.from(new Set(allSites.map(s => s.properties.province).filter(Boolean))).sort()
  }, [allSites])

  const sourceTypes = useMemo(() => {
    return Array.from(new Set(allSites.map(s => s.properties.source_type).filter(Boolean))).sort()
  }, [allSites])

  // Deep linking + URL state (item 2 + 10)
  useEffect(() => {
    if (!selectedSite) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('site', selectedSite.id)
    router.replace(`/map?${params.toString()}`, { scroll: false })
  }, [selectedSite, router, searchParams])

  // Note: Global CommandPalette is now handled at root layout via GlobalCommand.tsx + Nav Cmd+K


  const handleSelectSite = (site: EnrichedSite) => {
    setSelectedSite(site)
    recordRecentSite(site)
    // If user is deep in filters and the site is filtered out, relax filters a little
    if (!filteredSites.some(s => s.id === site.id)) {
      setMinEmission(Math.min(minEmission, site.emission * 0.6))
      setMaxEmission(Math.max(maxEmission, site.emission * 1.1))
    }
    toast.success(`Flown to ${site.properties.name || 'site'}`, { description: `Stranded Score: ${site.strandedScore}` })
  }

  const toggleProvince = (prov: string) => {
    const next = new Set(selectedProvinces)
    if (next.has(prov)) next.delete(prov)
    else next.add(prov)
    setSelectedProvinces(next)
  }

  const toggleSource = (src: string) => {
    const next = new Set(selectedSources)
    if (next.has(src)) next.delete(src)
    else next.add(src)
    setSelectedSources(next)
  }

  const addToPortfolio = useCallback((site: EnrichedSite) => {
    setPortfolio(prev => {
      if (prev.some(p => p.id === site.id)) {
        toast.info('Already in mission')
        return prev
      }
      const next = [...prev, site]
      savePortfolio(next)
      toast.success('Added to Mission', { description: `${site.properties.name} • Score ${site.strandedScore}` })
      return next
    })
    setSelectedSite(site)
  }, [])

  const toggleCompare = (site: EnrichedSite) => {
    setCompareSites(prev => {
      if (prev.some(s => s.id === site.id)) return prev.filter(s => s.id !== site.id)
      if (prev.length >= 3) { toast.info('Max 3 sites for compare'); return prev }
      return [...prev, site]
    })
  }

  const removeFromPortfolio = (id: string) => {
    setPortfolio(p => { const n = p.filter(s => s.id !== id); savePortfolio(n); return n })
  }

  const restoreToPortfolio = useCallback((site: EnrichedSite) => {
    setPortfolio(prev => {
      if (prev.some(p => p.id === site.id)) return prev
      const next = [...prev, site]
      savePortfolio(next)
      return next
    })
  }, [])

  const applyMissionTemplate = useCallback((sites: EnrichedSite[]) => {
    setPortfolio(sites)
    savePortfolio(sites)
  }, [])

  const nearMe = () => {
    if (!navigator.geolocation) {
      toast.error(t('mapGeolocateError'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCenterTarget({ lat, lng, zoom: 9 })
        setRadiusFilter({ lat, lng, radiusKm: 50 })
        toast.success(t('mapGeolocateSuccess'))
      },
      () => toast.error(t('mapGeolocateDenied')),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const shareMapView = async () => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedSite) params.set('site', selectedSite.id)
    const url = `${window.location.origin}/map?${params.toString()}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Map view link copied')
    } catch {
      toast.info(url)
    }
  }

  const clearPortfolio = () => { setPortfolio([]); savePortfolio([]) }

  const flyToFromPortfolio = (site: EnrichedSite) => {
    setSelectedSite(site)
  }

  const exportMission = () => {
    if (!portfolio.length) return
    const data = {
      missionGenerated: new Date().toISOString(),
      btcPriceUsed: liveBtcPrice,
      totalSites: portfolio.length,
      totalDailyPotentialCAD: portfolioDailyPotentialCad(portfolio, liveBtcPrice),
      sites: portfolio.map(s => ({
        name: s.properties.name,
        province: s.properties.province,
        emission_kg_day: s.emission,
        strandedScore: s.strandedScore,
        potentialDailyCAD: scalePotentialCad(s.potentialDailyProfitCAD, liveBtcPrice),
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stranded-mission-${portfolio.length}-sites.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Mission brief exported (JSON)')
  }

  const exportMissionCsv = () => {
    if (!portfolio.length) return
    const csv = exportPortfolioCsv(portfolio, liveBtcPrice)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stranded-mission-${portfolio.length}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  const exportMissionPdf = () => {
    if (!portfolio.length) return
    const html = exportPortfolioPdfHtml(portfolio, liveBtcPrice)
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
    toast.success('PDF print dialog opened')
  }

  const emailMission = () => {
    if (!portfolio.length) return
    const body = portfolio.map(s => `${s.properties.name} (${s.properties.province}) — score ${s.strandedScore}`).join('%0A')
    window.location.href = `mailto:hello@giveabit.io?subject=Stranded Mission (${portfolio.length} sites)&body=${body}`
  }

  const shareMission = async () => {
    if (!portfolio.length) return
    const url = portfolioShareUrl(portfolio)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Mission share link copied', { description: url })
    } catch {
      toast.info(url)
    }
  }

  const resetFilters = () => {
    setMinEmission(0)
    setMaxEmission(100000)
    setSelectedProvinces(new Set())
    setSelectedSources(new Set())
    setMinScore(0)
    setViewMode(filteredSites.length > 180 ? 'native-clusters' : 'precise')
    setLayers({ sites: true, grid: false, internet: false, satellite: false, terrain: false, heatmap: false, choropleth: false })
    toast.success('Showing all 2,611 locations')
  }

  // Keyboard joy (wild)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        resetFilters()
        toast('Filters reset')
      }
      // Shift+M — do not steal browser Cmd/Ctrl+C (copy)
      if (e.key.toLowerCase() === 'm' && e.shiftKey && !e.metaKey && !e.ctrlKey && selectedSite) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        e.preventDefault()
        addToPortfolio(selectedSite)
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        e.preventDefault()
        setShowKeyboardHelp(true)
      }
      // j/k — next/prev site in filtered list when a site is selected
      if ((e.key === 'j' || e.key === 'k') && selectedSite && !e.metaKey && !e.ctrlKey) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        const sorted = [...filteredSites].sort((a, b) => b.strandedScore - a.strandedScore)
        const idx = sorted.findIndex(s => s.id === selectedSite.id)
        if (idx < 0) return
        const next = e.key === 'j' ? sorted[idx + 1] : sorted[idx - 1]
        if (next) {
          e.preventDefault()
          setSelectedSite(next)
          toast.message(next.properties.name || next.id, { description: `Score ${next.strandedScore}` })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSite, addToPortfolio, filteredSites])

  const totalPotential = portfolioDailyPotentialCad(portfolio, liveBtcPrice)

  const applyPreset = (preset: FilterPreset) => {
    setMinScore(preset.minScore)
    setMinEmission(preset.minEmission)
    setSelectedProvinces(new Set(preset.provinces))
    toast.success(`Loaded preset: ${preset.name}`)
  }

  const saveCurrentPreset = () => {
    const name = presetName.trim() || `Preset ${new Date().toLocaleDateString()}`
    saveFilterPreset({ name, minScore, minEmission, provinces: Array.from(selectedProvinces) })
    setPresetName('')
    toast.success(`Saved filter preset: ${name}`)
  }

  const shareCurrentPreset = async () => {
    const preset: FilterPreset = {
      name: presetName.trim() || 'Shared filters',
      minScore,
      minEmission,
      provinces: Array.from(selectedProvinces),
    }
    const url = presetShareUrl(preset, window.location.origin)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Preset share link copied (URL hash)')
    } catch {
      toast.info(url)
    }
  }

  const exportKml = () => {
    const sites = portfolio.length ? portfolio : filteredSites.slice(0, 200)
    downloadBlob(exportSitesKml(sites), `stranded-${sites.length}-sites.kml`, 'application/vnd.google-earth.kml+xml')
    toast.success('KML exported')
  }

  const exportGeo = () => {
    downloadBlob(exportFilteredGeojson(filteredSites), `stranded-filtered-${filteredSites.length}.geojson`, 'application/geo+json')
    toast.success('GeoJSON exported')
  }

  const saveMissionProfile = () => {
    if (!portfolio.length) return
    const name = window.prompt('Mission profile name')?.trim()
    if (!name) return
    savePortfolioProfile(name, portfolio.map(p => p.id))
    toast.success(`Saved mission profile: ${name}`)
  }

  const watchSite = () => {
    if (!selectedSite) return
    addSiteAlert({
      siteId: selectedSite.id,
      name: selectedSite.properties.name || selectedSite.id,
      minScore: selectedSite.strandedScore,
      minEmission: Math.round(selectedSite.emission * 0.9),
    })
    toast.success('Watch alert saved — toast when score/emission thresholds met')
  }

  // Periodic watch threshold toasts while map is open
  useEffect(() => {
    if (!allSites.length) return
    const tick = () => {
      const hits = evaluateWatchHits(
        allSites.map(s => ({ id: s.id, strandedScore: s.strandedScore, emission: s.emission })),
        { skipRecentlyNotified: true },
      )
      hits.slice(0, 2).forEach(hit => {
        toast.warning(`Threshold: ${hit.name}`, { description: hit.reasons.join(' · '), duration: 7000 })
        markAlertNotified(hit.siteId)
      })
    }
    const id = setInterval(tick, 120_000)
    return () => clearInterval(id)
  }, [allSites])

  return (
    <div className={`relative w-full overflow-hidden bg-[var(--bg-dark)] text-white ${fullscreen ? 'fixed inset-0 z-[200] h-screen' : 'map-container'}`} role="region" aria-label="Stranded command center map">
      {loading && loadProgress < 100 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[80] w-48 h-1 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={loadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Loading sites">
          <div className="h-full bg-[#FF8C00] transition-all" style={{ width: `${loadProgress}%` }} />
        </div>
      )}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loading ? 'Loading sites dataset' : `${filteredSites.length.toLocaleString()} of ${allSites.length.toLocaleString()} sites visible`}
      </div>

      {radiusFilter && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[70] glass px-4 py-1.5 rounded-2xl border border-[#FF8C00]/40 text-xs flex items-center gap-3">
          <span className="text-[#FF8C00]">{tf(locale, 'mapRadius', { km: radiusFilter.radiusKm })}</span>
          <span className="text-gray-400">@ {radiusFilter.lat.toFixed(2)}, {radiusFilter.lng.toFixed(2)}</span>
          <button type="button" onClick={() => setRadiusFilter(null)} className="text-gray-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Top mission HUD */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 text-xs">
        <div className="glass px-4 py-1.5 rounded-2xl flex items-center gap-4 border border-white/10">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-[#FF8C00]" />
            <span className="font-mono text-[#FF8C00]">{filteredSites.length.toLocaleString()}</span>
            <span className="text-gray-400">/ {allSites.length.toLocaleString()} visible</span>
            {filteredSites.length < allSites.length && allSites.length > 0 && (
              <button 
                onClick={resetFilters} 
                className="ml-2 px-2 py-0.5 text-[10px] rounded bg-[#FF8C00] text-black font-medium hover:bg-orange-400"
              >
                {t('mapShowAll')}
              </button>
            )}
          </div>
          <div className="h-3 w-px bg-white/20" />
          <button
            type="button"
            data-testid="geolocate-btn"
            onClick={nearMe}
            className="text-[10px] px-2 py-0.5 rounded-full border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
            aria-label={t('mapGeolocate')}
          >
            {t('mapGeolocate')}
          </button>
          <div className="h-3 w-px bg-white/20" />
          <div>
            BTC <span className="btc-ticker font-semibold text-emerald-400">${liveBtcPrice.toLocaleString()}</span>
          </div>
          {portfolio.length > 0 && (
            <>
              <div className="h-3 w-px bg-white/20" />
              <div className="text-[#FF8C00] font-medium">MISSION: C${totalPotential.toLocaleString()}/day</div>
            </>
          )}
        </div>
      </div>

      {/* Left premium filter command center (wild creative) */}
      {showSearchHint && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[72] max-w-md w-[92vw] glass px-4 py-3 rounded-2xl border border-[#5BC0BE]/40 text-xs flex items-start gap-3 shadow-lg">
          <div className="flex-1">
            <span className="text-[#5BC0BE] font-semibold">Tip:</span> Press{' '}
            <kbd className="px-1.5 py-px bg-white/10 rounded font-mono">⌘K</kbd> to fuzzy-search 2,611 sites by name, province, or company.
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('stranded-map-search-hint-dismissed', '1')
              setShowSearchHint(false)
            }}
            className="text-gray-400 hover:text-white shrink-0"
            aria-label="Dismiss search hint"
          >
            ✕
          </button>
        </div>
      )}

      <div className="absolute top-16 left-4 z-[65] w-72 glass rounded-3xl p-5 shadow-2xl border border-white/10 hidden xl:block" data-tour="map-filters">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#FF8C00] font-semibold tracking-widest text-xs">
            <Filter size={16} /> {t('mapFiltersLive')}
          </div>
          <button onClick={resetFilters} className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white">
            <RefreshCw size={13} /> {t('mapReset')}
          </button>
        </div>

        {/* Emission Range — daring & useful */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5 text-gray-400">
            <div>EMISSION (kg/day)</div>
            <div className="font-mono text-white">{minEmission.toLocaleString()} — {maxEmission.toLocaleString()}</div>
          </div>
          <DualRangeSlider min={0} max={65000} step={50} valueMin={minEmission} valueMax={maxEmission} onChange={(lo, hi) => { setMinEmission(lo); setMaxEmission(hi) }} />
        </div>

        {/* Score threshold */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 mb-1.5 flex justify-between">
            MIN STRANDED SCORE <span className="font-mono text-white">{minScore}</span> (0 = show all)
          </div>
          <input type="range" min="0" max="98" value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-[#5BC0BE]" />
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: 'All', v: 0 },
              { label: 'Med+', v: 45 },
              { label: 'High+', v: 65 },
              { label: 'Elite', v: 85 },
            ].map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => setMinScore(t.v)}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${minScore === t.v ? 'border-[#FF8C00] text-[#FF8C00] bg-[#FF8C00]/10' : 'border-white/15 text-gray-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Province pills - expandable to show all 10 provinces + 3 territories */}
        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest mb-1.5 text-gray-400 flex items-center justify-between">
            PROVINCES
            <button 
              onClick={() => setShowAllProvinces(!showAllProvinces)} 
              className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-[#FF8C00] transition"
            >
              {showAllProvinces ? 'COLLAPSE' : 'EXPAND'} 
              <ChevronDown size={12} className={`transition-transform ${showAllProvinces ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className={`flex flex-wrap gap-1.5 pr-1 transition-all duration-200 ${showAllProvinces ? 'max-h-[220px]' : 'max-h-[78px]'} overflow-auto`}>
            {provinces.map(p => (
              <button key={p} onClick={() => toggleProvince(p)} className={`filter-chip text-xs px-3 py-px rounded-full border ${selectedProvinces.has(p) ? 'active border-[#FF8C00]' : 'border-white/20 hover:border-white/40'}`}>
                {p}
              </button>
            ))}
          </div>
          {!showAllProvinces && provinces.length > 6 && (
            <div className="text-[9px] text-gray-500 mt-0.5">+{provinces.length - 6} more (territories &amp; provinces)</div>
          )}
        </div>

        {/* Source type chips */}
        <div>
          <div className="text-xs uppercase tracking-widest mb-2 text-gray-400">SOURCE TYPE</div>
          <div className="flex flex-wrap gap-1.5">
            {sourceTypes.map(s => (
              <button key={s} onClick={() => toggleSource(s)} className={`filter-chip text-xs px-3 py-px rounded-full border ${selectedSources.has(s) ? 'active border-[#FF8C00]' : 'border-white/20 hover:border-white/40'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-xs uppercase tracking-widest mb-2 text-gray-400">FILTER PRESETS</div>
          <div className="flex gap-1 mb-2">
            <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name" className="flex-1 text-xs px-2 py-1 rounded-lg bg-black/30 border border-white/15" />
            <button onClick={saveCurrentPreset} className="text-[10px] px-2 py-1 rounded-lg bg-[#FF8C00]/20 border border-[#FF8C00]/40 text-[#FF8C00]">Save</button>
            <button onClick={shareCurrentPreset} className="text-[10px] px-2 py-1 rounded-lg border border-[#5BC0BE]/40 text-[#5BC0BE]">Share</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {getFilterPresets().map(p => (
              <button key={p.name} onClick={() => applyPreset(p)} className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 hover:border-[#5BC0BE]/50">{p.name}</button>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
          <button onClick={cycleViewMode} className="flex-1 text-xs py-2 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2">
            {viewModeLabel[viewMode]}
          </button>
          <button onClick={() => setLayers(l => ({...l, grid: !l.grid}))} className={`text-xs px-3 rounded-2xl border ${layers.grid ? 'bg-[#5BC0BE] text-black border-[#5BC0BE]' : 'border-white/20'}`}>GRID</button>
        </div>
      </div>

      {/* THE MAP — heart of the experience */}
      <Map
        sites={allSites}
        filteredSites={filteredSites}
        onSiteClick={handleSelectSite}
        selectedId={selectedSite?.id}
        portfolioIds={portfolio.map(p => p.id)}
        viewMode={viewMode}
        showSatellite={layers.satellite}
        showTerrain={layers.terrain}
        showHeatmap={layers.heatmap}
        showChoropleth={layers.choropleth}
        heatmapOpacity={heatmapOpacity}
        terrainExaggeration={terrainExaggeration}
        liveBtcPrice={liveBtcPrice}
        radiusOverlay={radiusFilter}
        centerTarget={centerTarget}
      />

      <QuickActions
        actions={[
          { id: 'locate', label: 'Near me (50 km)', icon: MapFabIcons.locate, onClick: nearMe },
          { id: 'share', label: 'Share view', icon: MapFabIcons.share, onClick: shareMapView },
          { id: 'reset', label: 'Reset filters', icon: MapFabIcons.reset, onClick: resetFilters },
        ]}
      />

      {/* Right side — SiteDetails + Mission (sexy stacked) - mobile friendly, properly constrained above footer */}
      <div className="absolute top-16 right-2 md:right-4 z-[65] flex flex-col gap-3 w-[min(340px,92vw)] max-h-[calc(100%-2rem)] overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedSite && (
            <SiteDetailsPanel
              key={selectedSite.id}
              site={selectedSite}
              onClose={() => setSelectedSite(null)}
              onAddToMission={addToPortfolio}
              liveBtcPrice={liveBtcPrice}
              allSites={allSites}
            />
          )}
        </AnimatePresence>

        {/* The wild useful Mission Portfolio panel - stays visible at bottom of the column */}
        <MissionPanel 
          portfolio={portfolio} 
          liveBtcPrice={liveBtcPrice} 
          onRemove={removeFromPortfolio}
          onRestore={restoreToPortfolio}
          onClear={clearPortfolio}
          onFlyTo={flyToFromPortfolio}
          onApplyTemplate={applyMissionTemplate}
          allSites={allSites}
        />

        {portfolio.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            <button onClick={exportMission} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10"><Download size={11} /> JSON</button>
            <button onClick={exportMissionCsv} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">CSV</button>
            <button onClick={exportMissionPdf} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">PDF</button>
            <button onClick={shareMission} className="text-[10px] px-2 py-1 rounded-full bg-[#5BC0BE]/10 border border-[#5BC0BE]/30 text-[#5BC0BE]">Share</button>
            <button onClick={emailMission} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">Email</button>
            <button onClick={exportKml} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">KML</button>
            <button onClick={exportGeo} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">GeoJSON</button>
            <button onClick={saveMissionProfile} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">Save profile</button>
          </div>
        )}
        {selectedSite && (
          <button onClick={watchSite} className="text-[10px] self-end text-gray-400 hover:text-[#5BC0BE]">Watch site (local alert)</button>
        )}
        <button onClick={() => setFullscreen(f => !f)} className="text-[10px] self-end px-2 py-1 rounded-full border border-white/15 text-gray-400 hover:text-white">
          {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
        {compareSites.length >= 2 && (
          <button onClick={() => setShowCompare(true)} className="text-xs px-3 py-1 rounded-full bg-[#FF8C00]/20 border border-[#FF8C00]/40 text-[#FF8C00]">
            Compare {compareSites.length} sites
          </button>
        )}
        {selectedSite && (
          <button onClick={() => toggleCompare(selectedSite)} className="text-[10px] text-gray-400 hover:text-white self-end">
            {compareSites.some(s => s.id === selectedSite.id) ? 'Remove from compare' : 'Add to compare'}
          </button>
        )}
      {showCompare && <CompareSitesModal sites={compareSites} liveBtc={liveBtcPrice} onClose={() => setShowCompare(false)} />}
      </div>
      <KeyboardHelpModal open={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />
      <OnboardingTour />

      {/* Score legend + layer controls */}
      <div className="absolute bottom-5 right-5 z-[60] flex flex-col items-end gap-2">
        <ScoreLegend compact />
        <LayerControls
          layers={layers}
          onToggle={(l) => setLayers(prev => ({ ...prev, [l]: !prev[l] }))}
          onApplyPreset={(preset: LayerPresetId) => {
            const p = LAYER_PRESETS[preset]
            setLayers(prev => ({ ...prev, ...p.layers }))
            toast.success(`Applied ${p.label} layer preset`)
          }}
          heatmapOpacity={heatmapOpacity}
          onHeatmapOpacityChange={setHeatmapOpacity}
          terrainExaggeration={terrainExaggeration}
          onTerrainExaggerationChange={setTerrainExaggeration}
        />
      </div>

      {liveStats && (
        <div className="absolute top-14 right-2 md:right-4 z-[62] max-w-[min(340px,92vw)]">
          <div className="glass text-[10px] px-3 py-1.5 rounded-xl border border-[#5BC0BE]/30 text-gray-300">
            ECCC reporting year <span className="font-mono text-[#5BC0BE]">{liveStats.ecccReportingYear ?? '2023'}</span>
            {' · '}synced {new Date(liveStats.generatedAt).toLocaleDateString()}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-[58] bg-[#0f172a]/90 border-t border-white/10 px-4 py-1.5 text-[10px] text-gray-500 flex flex-wrap items-center justify-between gap-2">
        <span>Data: Environment and Climate Change Canada (ECCC) GHGRP · Open Government of Canada</span>
        <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] hover:underline shrink-0">ECCC dataset ↗</a>
      </div>

      {/* Bottom status + view toggle */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2">
        <div className="glass text-xs px-5 py-1.5 rounded-3xl flex items-center gap-3 border border-white/10">
          {loading ? t('mapLoadingDataset') : tf(locale, 'mapSitesInView', { count: filteredSites.length.toLocaleString(), mission: String(portfolio.length) })}
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} className="ml-2 text-[#5BC0BE] hover:underline flex items-center gap-1 text-[11px]">
            <Target size={13}/> {t('mapCommandPalette')}
          </button>
          {selectedSite && (
            <CopyLinkButton
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/map?site=${selectedSite.id}`}
              label="Copy"
              successMessage="Site deep link copied"
            />
          )}
        </div>
      </div>

    </div>
  )
}

// Wrap the page that uses useSearchParams() in a Suspense boundary.
// This is required by Next.js 14+ for correct prerendering / static export behavior.
export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--bg-dark)] text-gray-400">
        Loading Stranded Command Center…
      </div>
    }>
      <StrandedCommandCenter />
    </Suspense>
  )
}
