'use client'

import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter, Zap, RefreshCw, Target, Download, ChevronDown, ChevronUp, Maximize2,
  ChevronLeft, ChevronRight, Bookmark, Camera, Printer, Trash2, Layers, X,
} from 'lucide-react'
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
import { parseMapUrl, buildMapUrl, buildMapShareUrl, haversineKm, type MapUrlState } from '@/lib/map-url-state'
import {
  getFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  getRecentFilterPresets,
  recordRecentFilterPreset,
  type FilterPreset,
} from '@/lib/bookmarks'
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
import EmissionPresets from '@/components/EmissionPresets'
import MapFilterSummary from '@/components/MapFilterSummary'
import {
  MAP_FILTERS_COLLAPSED_KEY,
  SLIDER_MAX_EMISSION,
  DEFAULT_MAX_EMISSION,
  SCORE_PRESETS,
  countActiveMapFilters,
  buildMapFilterChips,
  matchScorePresetLabel,
} from '@/lib/map-filters'
import {
  getMapViewBookmarks,
  saveMapViewBookmark,
  deleteMapViewBookmark,
  type MapViewBookmark,
} from '@/lib/map-bookmarks'
import { createMapViewHistory } from '@/lib/map-view-history'
import type { MapHandle, MapStyleMode } from '@/components/Map'
import MapStatsBar from '@/components/MapStatsBar'
import MapProvinceBars from '@/components/MapProvinceBars'
import MobileFilterDrawer from '@/components/MobileFilterDrawer'
import MapFiltersPanel from '@/components/MapFiltersPanel'
import { computeMapFilterStats, buildFilterAnnouncement, siteDensityTier } from '@/lib/map-stats'
import { useReducedMotion } from '@/lib/useReducedMotion'


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
  const reducedMotion = useReducedMotion()
  const [isXlViewport, setIsXlViewport] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const sync = () => setIsXlViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Sexy advanced filters - start with ALL 2611 visible by default
  const [minEmission, setMinEmission] = useState(0)
  const [maxEmission, setMaxEmission] = useState(100000)
  const [selectedProvinces, setSelectedProvinces] = useState<Set<string>>(new Set())
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [minScore, setMinScore] = useState(0)
  const [showAllProvinces, setShowAllProvinces] = useState(false)
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  const [onlyMissionSites, setOnlyMissionSites] = useState(false)
  const [emissionLogScale, setEmissionLogScale] = useState(false)
  const emissionLabelTapRef = useRef<{ target: 'min' | 'max' | null; at: number }>({ target: null, at: 0 })

  const [layers, setLayers] = useState({ sites: true, grid: false, internet: false, satellite: false, terrain: false, heatmap: false, choropleth: false })
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.75)
  const [terrainExaggeration, setTerrainExaggeration] = useState(1)
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null)
  const [presetName, setPresetName] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showLayersPanel, setShowLayersPanel] = useState(true)
  const [showMissionRing, setShowMissionRing] = useState(true)
  const [mobileSiteSheet, setMobileSiteSheet] = useState<'peek' | 'expanded'>('peek')
  const [filterPresetsRevision, setFilterPresetsRevision] = useState(0)
  const [compareSites, setCompareSites] = useState<EnrichedSite[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [radiusFilter, setRadiusFilter] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null)
  const [centerTarget, setCenterTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [boundsTarget, setBoundsTarget] = useState<{ sites: EnrichedSite[]; padding?: number; key: number } | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('dark')
  const [showSiteLabels, setShowSiteLabels] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(false)
  const [mapBookmarks, setMapBookmarks] = useState<MapViewBookmark[]>([])
  const [bookmarkName, setBookmarkName] = useState('')
  const [historyTick, setHistoryTick] = useState(0)
  const [showSearchHint, setShowSearchHint] = useState(false)

  const mapApiRef = useRef<MapHandle | null>(null)
  const viewHistoryRef = useRef(createMapViewHistory())
  const urlSyncReady = useRef(false)

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
      if (urlState.maxEmission != null) setMaxEmission(urlState.maxEmission)
      if (urlState.provinces?.length) {
        setSelectedProvinces(new Set(urlState.provinces))
        if (urlState.provinces.length > 6) setShowAllProvinces(true)
      }
      if (urlState.sources?.length) setSelectedSources(new Set(urlState.sources))

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
          if (preset.maxEmission != null) setMaxEmission(preset.maxEmission)
          setSelectedProvinces(new Set(preset.provinces))
          if (preset.sources?.length) setSelectedSources(new Set(preset.sources))
          recordRecentFilterPreset(preset.name)
          toast.success(t('mapPresetLoaded').replace('{name}', preset.name))
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
    setFiltersCollapsed(localStorage.getItem(MAP_FILTERS_COLLAPSED_KEY) === '1')
    setMapBookmarks(getMapViewBookmarks())
    if (localStorage.getItem('stranded-map-performance-mode') === '1') {
      setPerformanceMode(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('stranded-map-performance-mode', performanceMode ? '1' : '0')
  }, [performanceMode])

  const setFiltersCollapsedPersisted = useCallback((collapsed: boolean) => {
    setFiltersCollapsed(collapsed)
    if (typeof window !== 'undefined') {
      localStorage.setItem(MAP_FILTERS_COLLAPSED_KEY, collapsed ? '1' : '0')
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
    if (onlyMissionSites && portfolio.length > 0) {
      const missionIds = new Set(portfolio.map(p => p.id))
      result = result.filter(s => missionIds.has(s.id))
    }
    return result
  }, [allSites, minEmission, maxEmission, selectedProvinces, selectedSources, minScore, layers, radiusFilter, onlyMissionSites, portfolio])

  const filterState = useMemo(() => ({
    minEmission,
    maxEmission,
    selectedProvinces,
    selectedSources,
    minScore,
    onlyMissionSites,
    gridLayer: layers.grid,
    internetLayer: layers.internet,
    radiusFilter,
  }), [minEmission, maxEmission, selectedProvinces, selectedSources, minScore, onlyMissionSites, layers.grid, layers.internet, radiusFilter])

  const activeFilterCount = useMemo(() => countActiveMapFilters(filterState), [filterState])

  const filterStats = useMemo(() => computeMapFilterStats(filteredSites), [filteredSites])

  const densityTier = useMemo(
    () => siteDensityTier(filteredSites.length, allSites.length),
    [filteredSites.length, allSites.length],
  )

  const densityTierLabel = useMemo(() => {
    const key = {
      sparse: 'mapDensitySparse',
      moderate: 'mapDensityModerate',
      dense: 'mapDensityDense',
      full: 'mapDensityFull',
    }[densityTier] as 'mapDensitySparse' | 'mapDensityModerate' | 'mapDensityDense' | 'mapDensityFull'
    return t(key)
  }, [densityTier, t])

  const filterAnnouncement = useMemo(() => {
    if (loading) return t('mapLoadingDataset')
    return buildFilterAnnouncement(
      filteredSites.length,
      allSites.length,
      {
        minScore,
        minEmission,
        maxEmission,
        provinceCount: selectedProvinces.size,
        sourceCount: selectedSources.size,
        hasRadius: !!radiusFilter,
        gridLayer: layers.grid,
        internetLayer: layers.internet,
      },
      {
        base: t('mapFilterAnnounce'),
        score: s => tf(locale, 'mapFilterAnnounceScore', { score: s }),
        emission: (min, max) => tf(locale, 'mapFilterAnnounceEmission', { min: min.toLocaleString(), max: max.toLocaleString() }),
        provinces: c => tf(locale, 'mapFilterAnnounceProvinces', { count: c }),
        sources: c => tf(locale, 'mapFilterAnnounceSources', { count: c }),
        radius: t('mapFilterAnnounceRadius'),
        grid: t('mapFilterAnnounceGrid'),
        internet: t('mapFilterAnnounceInternet'),
      },
    )
  }, [
    loading, filteredSites.length, allSites.length, minScore, minEmission, maxEmission,
    selectedProvinces.size, selectedSources.size, radiusFilter, layers.grid, layers.internet,
    locale, t,
  ])

  const effectivePerformanceMode = performanceMode || reducedMotion

  const filterChips = useMemo(() => buildMapFilterChips(
    filterState,
    {
      emission: t('mapEmissionRange'),
      score: t('mapMinScore'),
      provinces: t('mapProvinces'),
      sources: t('mapSourceType'),
      missionOnly: t('mapOnlyMission'),
      grid: t('mapGrid'),
      internet: 'Internet',
      radius: t('mapRadius').replace('{km}', '').trim(),
    },
    {
      resetEmission: () => { setMinEmission(0); setMaxEmission(DEFAULT_MAX_EMISSION) },
      clearScore: () => setMinScore(0),
      clearProvinces: () => setSelectedProvinces(new Set()),
      clearSources: () => setSelectedSources(new Set()),
      clearMissionOnly: () => setOnlyMissionSites(false),
      clearGrid: () => setLayers(l => ({ ...l, grid: false })),
      clearInternet: () => setLayers(l => ({ ...l, internet: false })),
      clearRadius: () => setRadiusFilter(null),
    },
  ), [filterState, t])

  const scorePresetLabel = matchScorePresetLabel(minScore)
  const scoreIsCustom = minScore > 0 && !scorePresetLabel

  const handleEmissionLabelTap = (target: 'min' | 'max') => {
    const now = Date.now()
    const last = emissionLabelTapRef.current
    if (last.target === target && now - last.at < 360) {
      if (target === 'min') setMinEmission(0)
      else setMaxEmission(DEFAULT_MAX_EMISSION)
      toast.message(target === 'min' ? 'Min emission reset' : 'Max emission reset')
      emissionLabelTapRef.current = { target: null, at: 0 }
      return
    }
    emissionLabelTapRef.current = { target, at: now }
  }

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

  const currentMapUrlState = useMemo((): MapUrlState => ({
    site: selectedSite?.id,
    minScore: minScore > 0 ? minScore : undefined,
    minEmission: minEmission > 0 ? minEmission : undefined,
    maxEmission: maxEmission < DEFAULT_MAX_EMISSION ? maxEmission : undefined,
    provinces: selectedProvinces.size ? Array.from(selectedProvinces) : undefined,
    sources: selectedSources.size ? Array.from(selectedSources) : undefined,
    radius: radiusFilter?.radiusKm,
    lat: radiusFilter?.lat,
    lng: radiusFilter?.lng,
  }), [selectedSite, minScore, minEmission, maxEmission, selectedProvinces, selectedSources, radiusFilter])

  useEffect(() => {
    if (!loading) urlSyncReady.current = true
  }, [loading])

  // Deep linking + full filter URL state (#338)
  useEffect(() => {
    if (!urlSyncReady.current) return
    router.replace(buildMapUrl(currentMapUrlState), { scroll: false })
  }, [currentMapUrlState, router])

  // Note: Global CommandPalette is now handled at root layout via GlobalCommand.tsx + Nav Cmd+K


  const handleSelectSite = (site: EnrichedSite) => {
    setSelectedSite(site)
    setMobileSiteSheet('peek')
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

  const handleMapViewChange = useCallback((view: { lat: number; lng: number; zoom: number }) => {
    viewHistoryRef.current.push(view)
    setHistoryTick(n => n + 1)
  }, [])

  const historyBack = () => {
    const prev = viewHistoryRef.current.back()
    if (!prev) return
    setCenterTarget({ lat: prev.lat, lng: prev.lng, zoom: prev.zoom })
    setHistoryTick(n => n + 1)
  }

  const historyForward = () => {
    const next = viewHistoryRef.current.forward()
    if (!next) return
    setCenterTarget({ lat: next.lat, lng: next.lng, zoom: next.zoom })
    setHistoryTick(n => n + 1)
  }

  const canHistoryBack = historyTick >= 0 && viewHistoryRef.current.canGoBack()
  const canHistoryForward = historyTick >= 0 && viewHistoryRef.current.canGoForward()

  const saveMapBookmark = () => {
    const api = mapApiRef.current
    const view = api?.getView()
    if (!view) {
      toast.error('Map not ready yet')
      return
    }
    const bookmark = saveMapViewBookmark({
      name: bookmarkName.trim() || `View ${mapBookmarks.length + 1}`,
      center: { lat: view.lat, lng: view.lng },
      zoom: view.zoom,
      filters: {
        minEmission,
        maxEmission,
        minScore,
        provinces: Array.from(selectedProvinces),
        sourceTypes: Array.from(selectedSources),
        viewMode,
        mapStyle,
      },
    })
    setMapBookmarks(getMapViewBookmarks())
    setBookmarkName('')
    toast.success(t('mapViewBookmarkSaved'), { description: bookmark.name })
  }

  const loadMapBookmark = (bookmark: MapViewBookmark) => {
    setMinEmission(bookmark.filters.minEmission)
    setMaxEmission(bookmark.filters.maxEmission)
    setMinScore(bookmark.filters.minScore)
    setSelectedProvinces(new Set(bookmark.filters.provinces))
    setSelectedSources(new Set(bookmark.filters.sourceTypes))
    setViewMode(bookmark.filters.viewMode)
    if (bookmark.filters.mapStyle) {
      setMapStyle(bookmark.filters.mapStyle)
      setLayers(prev => ({
        ...prev,
        satellite: bookmark.filters.mapStyle === 'satellite',
        terrain: bookmark.filters.mapStyle === 'terrain',
      }))
    }
    setCenterTarget({ lat: bookmark.center.lat, lng: bookmark.center.lng, zoom: bookmark.zoom })
    toast.success(tf(locale, 'mapViewBookmarkLoaded', { name: bookmark.name }))
  }

  const fitToFilteredSites = () => {
    if (!filteredSites.length) {
      toast.info('No sites to fit')
      return
    }
    mapApiRef.current?.fitToSites(filteredSites)
    setBoundsTarget({ sites: filteredSites, padding: 52, key: Date.now() })
    toast.success(tf(locale, 'mapFitBoundsDone', { count: filteredSites.length }))
  }

  const exportMapScreenshot = () => {
    const dataUrl = mapApiRef.current?.exportScreenshot()
    if (!dataUrl) {
      toast.error('Could not capture map canvas')
      return
    }
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `stranded-map-${Date.now()}.png`
    a.click()
    toast.success(t('mapScreenshotSaved'))
  }

  const printMap = () => {
    window.print()
  }

  const handleMapStyleChange = (style: MapStyleMode) => {
    setMapStyle(style)
    setLayers(prev => ({
      ...prev,
      satellite: style === 'satellite',
      terrain: style === 'terrain',
    }))
  }

  const shareMapView = async () => {
    const url = buildMapShareUrl(currentMapUrlState, window.location.origin)
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('mapShareLinkCopied'))
    } catch {
      toast.info(url)
    }
  }

  const closeAllPanels = useCallback(() => {
    if (showKeyboardHelp) { setShowKeyboardHelp(false); return }
    if (showCompare) { setShowCompare(false); return }
    if (showMobileFilters) { setShowMobileFilters(false); return }
    if (showLayersPanel) { setShowLayersPanel(false); return }
    if (selectedSite) {
      if (mobileSiteSheet === 'expanded') { setMobileSiteSheet('peek'); return }
      setSelectedSite(null)
    }
  }, [showKeyboardHelp, showCompare, showMobileFilters, showLayersPanel, selectedSite, mobileSiteSheet])

  const isTypingTarget = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null
    return !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))
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
    setMaxEmission(DEFAULT_MAX_EMISSION)
    setSelectedProvinces(new Set())
    setSelectedSources(new Set())
    setMinScore(0)
    setOnlyMissionSites(false)
    setViewMode(filteredSites.length > 180 ? 'native-clusters' : 'precise')
    setLayers({ sites: true, grid: false, internet: false, satellite: false, terrain: false, heatmap: false, choropleth: false })
    setRadiusFilter(null)
    toast.success('Showing all 2,611 locations')
  }

  const totalPotential = portfolioDailyPotentialCad(portfolio, liveBtcPrice)

  const savedPresets = useMemo(() => {
    void filterPresetsRevision
    return getFilterPresets()
  }, [filterPresetsRevision])

  const recentPresets = useMemo(() => {
    void filterPresetsRevision
    return getRecentFilterPresets()
  }, [filterPresetsRevision])

  const buildCurrentFilterPreset = (name: string): FilterPreset => ({
    name,
    minScore,
    minEmission,
    maxEmission: maxEmission < DEFAULT_MAX_EMISSION ? maxEmission : undefined,
    provinces: Array.from(selectedProvinces),
    sources: selectedSources.size ? Array.from(selectedSources) : undefined,
  })

  const applyPreset = (preset: FilterPreset) => {
    setMinScore(preset.minScore)
    setMinEmission(preset.minEmission)
    if (preset.maxEmission != null) setMaxEmission(preset.maxEmission)
    else setMaxEmission(DEFAULT_MAX_EMISSION)
    setSelectedProvinces(new Set(preset.provinces))
    setSelectedSources(new Set(preset.sources ?? []))
    recordRecentFilterPreset(preset.name)
    setFilterPresetsRevision(n => n + 1)
    toast.success(tf(locale, 'mapPresetApplied', { name: preset.name }))
  }

  const handleDeletePreset = (name: string) => {
    deleteFilterPreset(name)
    setFilterPresetsRevision(n => n + 1)
    toast.success(tf(locale, 'mapPresetDeleted', { name }))
  }

  const saveCurrentPreset = () => {
    const name = presetName.trim() || `Preset ${new Date().toLocaleDateString()}`
    saveFilterPreset(buildCurrentFilterPreset(name))
    setPresetName('')
    setFilterPresetsRevision(n => n + 1)
    toast.success(tf(locale, 'mapPresetSaved', { name }))
  }

  const shareCurrentPreset = async () => {
    const preset = buildCurrentFilterPreset(presetName.trim() || 'Shared filters')
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

  const exportGeo = useCallback(() => {
    downloadBlob(exportFilteredGeojson(filteredSites), `stranded-filtered-${filteredSites.length}.geojson`, 'application/geo+json')
    toast.success('GeoJSON exported')
  }, [filteredSites])

  // Keyboard shortcuts (#333)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllPanels()
        return
      }
      if (isTypingTarget(e)) return

      if (e.key.toLowerCase() === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        resetFilters()
        toast('Filters reset')
        return
      }
      if (e.key.toLowerCase() === 'm' && e.shiftKey && !e.metaKey && !e.ctrlKey && selectedSite) {
        e.preventDefault()
        addToPortfolio(selectedSite)
        return
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowKeyboardHelp(true)
        return
      }
      if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        exportGeo()
        return
      }
      if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        setShowLayersPanel(v => !v)
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-command-palette'))
        return
      }
      if ((e.key === 'j' || e.key === 'k') && selectedSite && !e.metaKey && !e.ctrlKey) {
        const sorted = [...filteredSites].sort((a, b) => b.strandedScore - a.strandedScore)
        const idx = sorted.findIndex(s => s.id === selectedSite.id)
        if (idx < 0) return
        const next = e.key === 'j' ? sorted[idx + 1] : sorted[idx - 1]
        if (next) {
          e.preventDefault()
          setSelectedSite(next)
          setMobileSiteSheet('peek')
          toast.message(next.properties.name || next.id, { description: `Score ${next.strandedScore}` })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSite, addToPortfolio, filteredSites, closeAllPanels, exportGeo])

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
    <div className={`relative w-full overflow-hidden bg-[var(--bg-dark)] text-white map-command-center ${fullscreen ? 'fixed inset-0 z-[200] h-screen' : 'map-container'}`} role="region" aria-label="Stranded command center map">
      <div className="map-print-header hidden text-black font-semibold">Stranded Command Center — Map View</div>
      {loading && loadProgress < 100 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[80] w-48 h-1 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={loadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Loading sites">
          <div className="h-full bg-[#FF8C00] transition-all" style={{ width: `${loadProgress}%` }} />
        </div>
      )}
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="map-filter-announcer">
        {filterAnnouncement}
      </div>

      {radiusFilter && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[70] glass px-4 py-2 rounded-2xl border border-[#FF8C00]/40 text-xs flex flex-wrap items-center gap-3 no-print max-w-[92vw]">
          <span className="text-[#FF8C00] shrink-0">{tf(locale, 'mapRadius', { km: radiusFilter.radiusKm })}</span>
          <label className="flex items-center gap-2 text-gray-400 min-w-[140px]">
            <span className="text-[10px] shrink-0">{t('mapRadiusAdjust')}</span>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={radiusFilter.radiusKm}
              onChange={e => setRadiusFilter(prev => prev ? { ...prev, radiusKm: Number(e.target.value) } : prev)}
              className="w-24 accent-[#FF8C00]"
            />
          </label>
          <span className="text-gray-400 hidden sm:inline">@ {radiusFilter.lat.toFixed(2)}, {radiusFilter.lng.toFixed(2)}</span>
          <button type="button" onClick={() => setRadiusFilter(null)} className="text-gray-500 hover:text-white">✕</button>
        </div>
      )}

      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[69] flex items-center gap-1.5 no-print mt-10 sm:mt-0 sm:top-[4.25rem]">
        <button
          type="button"
          onClick={historyBack}
          disabled={!canHistoryBack}
          className="glass p-1.5 rounded-lg border border-white/15 disabled:opacity-35 hover:border-[#5BC0BE]/40"
          aria-label={t('mapHistoryBack')}
          title={t('mapHistoryBack')}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={historyForward}
          disabled={!canHistoryForward}
          className="glass p-1.5 rounded-lg border border-white/15 disabled:opacity-35 hover:border-[#5BC0BE]/40"
          aria-label={t('mapHistoryForward')}
          title={t('mapHistoryForward')}
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          onClick={fitToFilteredSites}
          className="glass px-2 py-1 rounded-lg border border-white/15 text-[10px] hover:border-[#FF8C00]/40 flex items-center gap-1"
          title={t('mapFitBounds')}
        >
          <Maximize2 size={12} /> {t('mapFitBounds')}
        </button>
        <button
          type="button"
          onClick={exportMapScreenshot}
          className="glass p-1.5 rounded-lg border border-white/15 hover:border-[#5BC0BE]/40"
          aria-label={t('mapScreenshot')}
          title={t('mapScreenshot')}
        >
          <Camera size={14} />
        </button>
        <button
          type="button"
          onClick={printMap}
          className="glass p-1.5 rounded-lg border border-white/15 hover:border-[#5BC0BE]/40 print-show"
          aria-label={t('mapPrint')}
          title={t('mapPrint')}
        >
          <Printer size={14} />
        </button>
      </div>

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
            {activeFilterCount > 0 && (
              <span
                className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-[#5BC0BE]/15 border border-[#5BC0BE]/40 text-[#5BC0BE] font-medium"
                data-testid="hud-active-filter-count"
              >
                {tf(locale, 'mapActiveFilters', { count: String(activeFilterCount) })}
              </span>
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

      <div className="absolute top-16 left-4 z-[65] w-72 hidden xl:flex flex-col gap-4 items-stretch pointer-events-none [&>*]:pointer-events-auto">
      <div
        className="glass rounded-3xl shadow-2xl border border-white/10 flex flex-col min-h-0 max-h-[min(58vh,calc(100vh-20rem))] overflow-hidden shrink-0"
        data-tour="map-filters"
      >
        <div className="map-filter-scroll flex-1 min-h-0 overflow-y-auto">
          <div className="sticky top-0 z-10 px-5 pt-5 pb-3 bg-[var(--glass)] backdrop-blur-xl border-b border-white/10 rounded-t-3xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#FF8C00] font-semibold tracking-widest text-xs min-w-0">
                <Filter size={16} className="shrink-0" />
                <span className="truncate">{t('mapFiltersLive')}</span>
                {activeFilterCount > 0 && (
                  <span
                    className="shrink-0 px-1.5 py-px rounded-full text-[9px] font-bold bg-[#FF8C00] text-black"
                    data-testid="filter-panel-active-count"
                  >
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setFiltersCollapsedPersisted(!filtersCollapsed)}
                  className="text-[10px] flex items-center gap-0.5 text-gray-400 hover:text-white"
                  aria-expanded={!filtersCollapsed}
                  aria-label={filtersCollapsed ? t('mapExpandFilters') : t('mapCollapseFilters')}
                >
                  {filtersCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
                <button type="button" onClick={resetFilters} className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white">
                  <RefreshCw size={13} /> {t('mapReset')}
                </button>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="text-[9px] text-gray-500 mt-1">
                {tf(locale, 'mapFiltersActive', { count: String(activeFilterCount) })}
              </div>
            )}
          </div>

          {!filtersCollapsed && (
            <>
              <div className="px-5 pt-3 space-y-3">
                <MapStatsBar stats={filterStats} />
                <MapProvinceBars provinces={filterStats.provinces} />
              </div>
              <MapFilterSummary chips={filterChips} />

              <div className="px-5 pb-5 pt-3 space-y-5">
                <label className="flex items-center justify-between gap-2 text-xs cursor-pointer group">
                  <span className="text-gray-300 group-hover:text-white transition">{t('mapOnlyMission')}</span>
                  <input
                    type="checkbox"
                    checked={onlyMissionSites}
                    onChange={e => setOnlyMissionSites(e.target.checked)}
                    disabled={!portfolio.length}
                    className="accent-[#FF8C00]"
                  />
                </label>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 text-gray-400 items-center gap-2">
                    <div>{t('mapEmissionRange')}</div>
                    <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emissionLogScale}
                        onChange={e => setEmissionLogScale(e.target.checked)}
                        className="accent-[#5BC0BE] scale-90"
                      />
                      {t('mapEmissionLogScale')}
                    </label>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-white mb-1.5">
                    <button
                      type="button"
                      onClick={() => handleEmissionLabelTap('min')}
                      className="hover:text-[#FF8C00] transition"
                      title={t('mapEmissionResetHint')}
                    >
                      {minEmission.toLocaleString()}
                    </button>
                    <span className="text-gray-500">—</span>
                    <button
                      type="button"
                      onClick={() => handleEmissionLabelTap('max')}
                      className="hover:text-[#FF8C00] transition"
                      title={t('mapEmissionResetHint')}
                    >
                      {maxEmission.toLocaleString()}
                    </button>
                  </div>
                  <div className="px-0.5 overflow-hidden">
                    <DualRangeSlider
                      min={0}
                      max={SLIDER_MAX_EMISSION}
                      step={50}
                      valueMin={minEmission}
                      valueMax={maxEmission}
                      logScale={emissionLogScale}
                      onChange={(lo, hi) => { setMinEmission(lo); setMaxEmission(hi) }}
                    />
                  </div>
                  <EmissionPresets
                    minEmission={minEmission}
                    maxEmission={maxEmission}
                    onSelect={(lo, hi) => { setMinEmission(lo); setMaxEmission(hi) }}
                  />
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1.5 flex justify-between items-center">
                    <span>
                      {t('mapMinScore')}{' '}
                      {scoreIsCustom && (
                        <span className="text-[#FF8C00] font-medium ml-1">{t('mapScoreCustom')}</span>
                      )}
                    </span>
                    <span className="font-mono text-white">{minScore}</span>
                  </div>
                  <input type="range" min="0" max="98" value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-[#5BC0BE]" />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {SCORE_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMinScore(preset.v)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${minScore === preset.v ? 'border-[#FF8C00] text-[#FF8C00] bg-[#FF8C00]/10' : 'border-white/15 text-gray-400'}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest mb-1.5 text-gray-400 flex items-center justify-between gap-2">
                    <span>{t('mapProvinces')}</span>
                    <div className="flex items-center gap-2 text-[10px] normal-case tracking-normal">
                      <button type="button" onClick={() => setSelectedProvinces(new Set(provinces))} className="text-[#5BC0BE] hover:underline">
                        {t('mapSelectAll')}
                      </button>
                      <button type="button" onClick={() => setSelectedProvinces(new Set())} className="text-gray-400 hover:text-white">
                        {t('mapClear')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAllProvinces(!showAllProvinces)}
                        className="flex items-center gap-0.5 text-gray-400 hover:text-[#FF8C00] transition"
                      >
                        {showAllProvinces ? t('mapCollapse') : t('mapExpand')}
                        <ChevronDown size={12} className={`transition-transform ${showAllProvinces ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className={`flex flex-wrap gap-1.5 pr-1 transition-all duration-200 ${showAllProvinces ? 'max-h-[220px]' : 'max-h-[78px]'} overflow-auto map-filter-scroll`}>
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

                <div>
                  <div className="text-xs uppercase tracking-widest mb-2 text-gray-400 flex items-center justify-between gap-2">
                    <span>{t('mapSourceType')}</span>
                    <div className="flex items-center gap-2 text-[10px] normal-case tracking-normal">
                      <button type="button" onClick={() => setSelectedSources(new Set(sourceTypes))} className="text-[#5BC0BE] hover:underline">
                        {t('mapSelectAll')}
                      </button>
                      <button type="button" onClick={() => setSelectedSources(new Set())} className="text-gray-400 hover:text-white">
                        {t('mapClear')}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sourceTypes.map(s => (
                      <button key={s} onClick={() => toggleSource(s)} className={`filter-chip text-xs px-3 py-px rounded-full border ${selectedSources.has(s) ? 'active border-[#FF8C00]' : 'border-white/20 hover:border-white/40'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs uppercase tracking-widest mb-2 text-gray-400">MAP VIEW BOOKMARKS</div>
                  <div className="flex gap-1 mb-2">
                    <input
                      value={bookmarkName}
                      onChange={e => setBookmarkName(e.target.value)}
                      placeholder={t('mapViewBookmarkName')}
                      className="flex-1 text-xs px-2 py-1 rounded-lg bg-black/30 border border-white/15"
                    />
                    <button
                      type="button"
                      onClick={saveMapBookmark}
                      className="text-[10px] px-2 py-1 rounded-lg bg-[#5BC0BE]/20 border border-[#5BC0BE]/40 text-[#5BC0BE] flex items-center gap-1"
                    >
                      <Bookmark size={11} /> {t('mapViewBookmark')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mapBookmarks.map(b => (
                      <span key={b.id} className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => loadMapBookmark(b)}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 hover:border-[#FF8C00]/50"
                        >
                          {b.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteMapViewBookmark(b.id)
                            setMapBookmarks(getMapViewBookmarks())
                            toast.message(t('mapViewBookmarkDeleted'))
                          }}
                          className="text-[9px] text-gray-500 hover:text-white px-0.5"
                          aria-label={`Delete ${b.name}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="text-xs uppercase tracking-widest mb-2 text-gray-400">{t('mapFilterPresets')}</div>
                  {recentPresets.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">{t('mapRecentPresets')}</div>
                      <div className="flex flex-wrap gap-1">
                        {recentPresets.map(p => (
                          <button
                            key={`recent-${p.name}`}
                            type="button"
                            onClick={() => applyPreset(p)}
                            className="text-[10px] px-2 py-0.5 rounded-full border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
                            data-testid={`recent-preset-${p.name}`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-1 mb-2">
                    <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder={t('mapPresetName')} className="flex-1 text-xs px-2 py-1 rounded-lg bg-black/30 border border-white/15" />
                    <button type="button" onClick={saveCurrentPreset} className="text-[10px] px-2 py-1 rounded-lg bg-[#FF8C00]/20 border border-[#FF8C00]/40 text-[#FF8C00]">{t('mapSave')}</button>
                    <button type="button" onClick={shareCurrentPreset} className="text-[10px] px-2 py-1 rounded-lg border border-[#5BC0BE]/40 text-[#5BC0BE]">{t('mapShare')}</button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {savedPresets.map(p => (
                      <span key={p.name} className="inline-flex items-center gap-0.5">
                        <button type="button" onClick={() => applyPreset(p)} className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 hover:border-[#5BC0BE]/50">{p.name}</button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(p.name)}
                          className="p-0.5 text-gray-500 hover:text-red-400 rounded"
                          aria-label={t('mapDeletePreset')}
                          data-testid={`delete-preset-${p.name}`}
                        >
                          <Trash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={fitToFilteredSites}
                    className="w-full text-xs py-2 rounded-2xl border border-[#FF8C00]/40 text-[#FF8C00] hover:bg-[#FF8C00]/10 flex items-center justify-center gap-2"
                  >
                    <Maximize2 size={14} /> {t('mapFitToFiltered')}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={cycleViewMode} className="flex-1 text-xs py-2 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2">
                      {viewModeLabel[viewMode]}
                    </button>
                    <button type="button" onClick={() => setLayers(l => ({ ...l, grid: !l.grid }))} className={`text-xs px-3 rounded-2xl border ${layers.grid ? 'bg-[#5BC0BE] text-black border-[#5BC0BE]' : 'border-white/20'}`}>
                      {t('mapGrid')}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        {isXlViewport && <OnboardingTour layout="stacked" />}
      </div>

      <button
        type="button"
        data-testid="mobile-filters-btn"
        onClick={() => setShowMobileFilters(true)}
        className="xl:hidden fixed top-[4.5rem] left-3 z-[68] glass px-3 py-2 rounded-2xl border border-white/10 text-xs flex items-center gap-2 touch-manipulation"
        aria-label={t('mapFilters')}
      >
        <Filter size={14} className="text-[#FF8C00]" />
        {t('mapFilters')}
        {activeFilterCount > 0 && (
          <span className="px-1.5 py-px rounded-full bg-[#FF8C00] text-black text-[10px] font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      <MobileFilterDrawer open={showMobileFilters} onClose={() => setShowMobileFilters(false)}>
        <MapStatsBar stats={filterStats} className="mb-4" />
        <MapProvinceBars provinces={filterStats.provinces} className="mb-4" />
        <MapFilterSummary chips={filterChips} />
        <MapFiltersPanel
          minEmission={minEmission}
          maxEmission={maxEmission}
          minScore={minScore}
          selectedProvinces={selectedProvinces}
          selectedSources={selectedSources}
          showAllProvinces={showAllProvinces}
          presetName={presetName}
          provinces={provinces}
          sourceTypes={sourceTypes}
          viewMode={viewMode}
          viewModeLabel={viewModeLabel}
          savedPresets={savedPresets}
          recentPresets={recentPresets}
          layersGrid={layers.grid}
          onMinEmissionChange={setMinEmission}
          onMaxEmissionChange={setMaxEmission}
          onMinScoreChange={setMinScore}
          onToggleProvince={toggleProvince}
          onToggleSource={toggleSource}
          onShowAllProvincesToggle={() => setShowAllProvinces(v => !v)}
          onPresetNameChange={setPresetName}
          onSavePreset={saveCurrentPreset}
          onSharePreset={shareCurrentPreset}
          onApplyPreset={applyPreset}
          onDeletePreset={handleDeletePreset}
          onResetFilters={resetFilters}
          onCycleViewMode={cycleViewMode}
          onToggleGridLayer={() => setLayers(l => ({ ...l, grid: !l.grid }))}
          onClose={() => setShowMobileFilters(false)}
          t={t}
        />
      </MobileFilterDrawer>

      {/* THE MAP — heart of the experience */}
      <Map
        sites={allSites}
        filteredSites={filteredSites}
        onSiteClick={handleSelectSite}
        selectedId={selectedSite?.id}
        portfolioIds={portfolio.map(p => p.id)}
        showMissionRing={showMissionRing}
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
        boundsTarget={boundsTarget}
        mapStyle={mapStyle}
        showSiteLabels={showSiteLabels}
        highlightedProvinces={Array.from(selectedProvinces)}
        performanceMode={effectivePerformanceMode}
        sitesLoading={loading}
        onViewChange={handleMapViewChange}
        onMapReady={api => { mapApiRef.current = api }}
        onCoordCopied={() => toast.success(t('mapCoordCopied'))}
        coordCopyLabel={t('mapCoordCopy')}
      />

      <QuickActions
        actions={[
          { id: 'locate', label: 'Near me (50 km)', icon: MapFabIcons.locate, onClick: nearMe },
          { id: 'share', label: 'Share view', icon: MapFabIcons.share, onClick: shareMapView },
          { id: 'reset', label: 'Reset filters', icon: MapFabIcons.reset, onClick: resetFilters },
        ]}
      />

      {/* Mobile site bottom sheet (#336) */}
      <AnimatePresence>
        {selectedSite && (
          <motion.div
            className="xl:hidden fixed inset-x-0 bottom-0 z-[82] pointer-events-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 520) {
                setSelectedSite(null)
                setMobileSiteSheet('peek')
              } else if (info.offset.y < -50) {
                setMobileSiteSheet('expanded')
              }
            }}
            data-testid="mobile-site-sheet"
          >
            <div className="mx-auto w-full max-w-lg pb-[env(safe-area-inset-bottom)]">
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-2 mt-2" aria-hidden />
              <SiteDetailsPanel
                key={selectedSite.id}
                site={selectedSite}
                compact={mobileSiteSheet === 'peek'}
                onExpand={() => setMobileSiteSheet('expanded')}
                onClose={() => { setSelectedSite(null); setMobileSiteSheet('peek') }}
                onAddToMission={addToPortfolio}
                liveBtcPrice={liveBtcPrice}
                allSites={allSites}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side — SiteDetails + Mission (desktop) */}
      <div className="absolute top-16 right-2 md:right-4 z-[65] hidden xl:flex flex-col gap-3 w-[min(340px,92vw)] max-h-[calc(100%-2rem)] overflow-hidden">
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
      {!isXlViewport && <OnboardingTour layout="floating" />}

      {/* Score legend + layer controls */}
      <div className="absolute bottom-5 right-5 z-[60] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setShowMissionRing(v => !v)}
          className={`text-[10px] px-2.5 py-1 rounded-full border transition ${showMissionRing ? 'border-[#67e8f9]/50 text-[#67e8f9] bg-[#67e8f9]/10' : 'border-white/15 text-gray-400'}`}
          data-testid="mission-ring-toggle"
          aria-pressed={showMissionRing}
          title={t('mapMissionRingToggle')}
        >
          {showMissionRing ? t('mapMissionRingOn') : t('mapMissionRingOff')}
        </button>
        <ScoreLegend compact />
        {showLayersPanel && (
        <LayerControls
          layers={layers}
          onToggle={(l) => setLayers(prev => ({ ...prev, [l]: !prev[l] }))}
          onApplyPreset={(preset: LayerPresetId) => {
            const p = LAYER_PRESETS[preset]
            setLayers(prev => ({ ...prev, ...p.layers }))
            if (preset === 'satellite') setMapStyle('satellite')
            else if (preset === 'minimal') setMapStyle('dark')
            else setMapStyle('dark')
            toast.success(`Applied ${p.label} layer preset`)
          }}
          heatmapOpacity={heatmapOpacity}
          onHeatmapOpacityChange={setHeatmapOpacity}
          terrainExaggeration={terrainExaggeration}
          onTerrainExaggerationChange={setTerrainExaggeration}
          mapStyle={mapStyle}
          onMapStyleChange={handleMapStyleChange}
          showSiteLabels={showSiteLabels}
          onSiteLabelsChange={setShowSiteLabels}
          performanceMode={performanceMode}
          onPerformanceModeChange={setPerformanceMode}
        />
        )}
        {!showLayersPanel && (
          <button
            type="button"
            onClick={() => setShowLayersPanel(true)}
            className="text-[10px] px-2.5 py-1.5 rounded-xl border border-white/15 text-gray-400 hover:text-white flex items-center gap-1"
            data-testid="layers-panel-reopen"
          >
            <Layers size={12} /> {t('mapLayers')}
          </button>
        )}
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
        <div className="glass text-xs px-5 py-1.5 rounded-3xl flex flex-wrap items-center gap-3 border border-white/10">
          {loading ? t('mapLoadingDataset') : tf(locale, 'mapSitesInView', { count: filteredSites.length.toLocaleString(), mission: String(portfolio.length) })}
          {!loading && allSites.length > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-gray-400"
              data-testid="map-site-density"
              title={tf(locale, 'mapSiteDensity', { tier: densityTierLabel })}
            >
              {tf(locale, 'mapSiteDensity', { tier: densityTierLabel })}
            </span>
          )}
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} className="ml-2 text-[#5BC0BE] hover:underline flex items-center gap-1 text-[11px]">
            <Target size={13}/> {t('mapCommandPalette')}
          </button>
          {selectedSite && (
            <CopyLinkButton
              url={buildMapShareUrl(currentMapUrlState, typeof window !== 'undefined' ? window.location.origin : '')}
              label="Copy"
              successMessage={t('mapShareLinkCopied')}
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
