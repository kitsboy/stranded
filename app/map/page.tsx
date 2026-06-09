'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Zap, RefreshCw, Target, Download, ChevronDown } from 'lucide-react'
import { Toaster, toast } from 'sonner'

import SiteDetailsPanel from '@/components/SiteDetailsPanel'
import LayerControls from '@/components/LayerControls'
import MissionPanel from '@/components/MissionPanel'
import { loadSites, filterSites, EnrichedSite } from '@/lib/sites'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

function StrandedCommandCenter() {
  const [allSites, setAllSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<EnrichedSite | null>(null)
  const [portfolio, setPortfolio] = useState<EnrichedSite[]>([])
  const [viewMode, setViewMode] = useState<'precise' | 'clusters'>('precise')
  const [liveBtcPrice, setLiveBtcPrice] = useState(85000)

  // Sexy advanced filters - start with ALL 2611 visible by default
  const [minEmission, setMinEmission] = useState(0)
  const [maxEmission, setMaxEmission] = useState(100000)
  const [selectedProvinces, setSelectedProvinces] = useState<Set<string>>(new Set())
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [minScore, setMinScore] = useState(0)
  const [showAllProvinces, setShowAllProvinces] = useState(false)

  const [layers, setLayers] = useState({ sites: true, grid: false, internet: false })

  const searchParams = useSearchParams()
  const router = useRouter()

  // Load full 2611 with enrichment (performance + types)
  useEffect(() => {
    loadSites().then(sites => {
      setAllSites(sites)
      setLoading(false)
      console.log(`[COMMAND CENTER] 2,611 enriched sites loaded. Wild mode engaged.`)

      // Restore deep link
      const siteId = searchParams.get('site')
      if (siteId) {
        const match = sites.find(s => s.id === siteId)
        if (match) {
          setTimeout(() => {
            setSelectedSite(match)
            // Auto-add a little portfolio love
            if (!portfolio.some(p => p.id === match.id)) {
              // don't auto add, just select
            }
          }, 420)
        }
      }
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  // Live BTC price (wild useful)
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        const json = await res.json()
        if (json?.bitcoin?.usd) setLiveBtcPrice(json.bitcoin.usd)
      } catch (_) {
        // graceful fallback
      }
    }
    fetchPrice()
    const id = setInterval(fetchPrice, 1000 * 95) // polite polling
    return () => clearInterval(id)
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

    // Layer "hacks" — wild creative interpretation
    if (layers.grid) {
      result = result.filter(s => (s.properties.distance_to_grid_km || 999) < 18)
    }
    if (layers.internet) {
      result = result.filter(s => ['fiber', 'starlink'].includes((s.properties.internet_type || '').toLowerCase()))
    }
    return result
  }, [allSites, minEmission, maxEmission, selectedProvinces, selectedSources, minScore, layers])

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
  }, [selectedSite])

  // Note: Global CommandPalette is now handled at root layout via GlobalCommand.tsx + Nav Cmd+K


  const handleSelectSite = (site: EnrichedSite) => {
    setSelectedSite(site)
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

  const addToPortfolio = (site: EnrichedSite) => {
    if (portfolio.some(p => p.id === site.id)) {
      toast.info('Already in mission')
      return
    }
    const next = [...portfolio, site]
    setPortfolio(next)
    setSelectedSite(site)
    toast.success('Added to Mission', { 
      description: `${site.properties.name} • Score ${site.strandedScore}`,
      action: { label: 'View Portfolio', onClick: () => {} }
    })
  }

  const removeFromPortfolio = (id: string) => {
    setPortfolio(p => p.filter(s => s.id !== id))
  }

  const clearPortfolio = () => setPortfolio([])

  const flyToFromPortfolio = (site: EnrichedSite) => {
    setSelectedSite(site)
  }

  const exportMission = () => {
    if (!portfolio.length) return
    const data = {
      missionGenerated: new Date().toISOString(),
      btcPriceUsed: liveBtcPrice,
      totalSites: portfolio.length,
      totalDailyPotentialCAD: portfolio.reduce((s, x) => s + x.potentialDailyProfitCAD, 0),
      sites: portfolio.map(s => ({
        name: s.properties.name,
        province: s.properties.province,
        emission_kg_day: s.emission,
        strandedScore: s.strandedScore,
        potentialDailyCAD: s.potentialDailyProfitCAD,
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stranded-mission-${portfolio.length}-sites.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Mission brief exported')
  }

  const resetFilters = () => {
    setMinEmission(0)
    setMaxEmission(100000)
    setSelectedProvinces(new Set())
    setSelectedSources(new Set())
    setMinScore(0)
    setViewMode('precise')
    setLayers({ sites: true, grid: false, internet: false })
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
      if (e.key.toLowerCase() === 'c' && (e.metaKey || e.ctrlKey) && selectedSite) {
        e.preventDefault()
        addToPortfolio(selectedSite)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSite])

  const totalPotential = portfolio.reduce((s, x) => s + x.potentialDailyProfitCAD, 0)

  return (
    <div className="relative w-full overflow-hidden bg-[var(--bg-dark)] text-white map-container">
      <Toaster position="top-center" richColors closeButton />

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
                SHOW ALL 2,611
              </button>
            )}
          </div>
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
      <div className="absolute top-16 left-4 z-[65] w-72 glass rounded-3xl p-5 shadow-2xl border border-white/10 hidden xl:block">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#FF8C00] font-semibold tracking-widest text-xs">
            <Filter size={16} /> FILTERS • LIVE
          </div>
          <button onClick={resetFilters} className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white">
            <RefreshCw size={13} /> RESET
          </button>
        </div>

        {/* Emission Range — daring & useful */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5 text-gray-400">
            <div>EMISSION (kg/day)</div>
            <div className="font-mono text-white">{minEmission.toLocaleString()} — {maxEmission.toLocaleString()}</div>
          </div>
          <input type="range" min="0" max="65000" step="50" value={minEmission} onChange={e => setMinEmission(Number(e.target.value))} className="w-full accent-[#FF8C00]" />
          <input type="range" min="0" max="65000" step="50" value={maxEmission} onChange={e => setMaxEmission(Number(e.target.value))} className="w-full accent-[#FF8C00] mt-1" />
        </div>

        {/* Score threshold */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 mb-1.5 flex justify-between">
            MIN STRANDED SCORE <span className="font-mono text-white">{minScore}</span> (0 = show all)
          </div>
          <input type="range" min="0" max="98" value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-[#5BC0BE]" />
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

        <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
          <button onClick={() => setViewMode(viewMode === 'precise' ? 'clusters' : 'precise')} className="flex-1 text-xs py-2 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2">
            {viewMode === 'precise' ? 'CLUSTER VIEW (perf)' : 'PRECISE MARKERS'}
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
      />

      {/* Right side — SiteDetails + Mission (sexy stacked) - mobile friendly, properly constrained above footer */}
      <div className="absolute top-16 right-2 md:right-4 z-[65] flex flex-col gap-3 w-[min(340px,92vw)] max-h-[calc(100%-2rem)] overflow-hidden">
        <AnimatePresence>
          {selectedSite && (
            <motion.div 
              initial={{opacity:0, x:30}} 
              animate={{opacity:1, x:0}} 
              exit={{opacity:0, x:20}}
              className="flex-1 min-h-0 overflow-y-auto pb-2"   // Scrollable details area; leaves room for MissionPanel below it in the column
            >
              <SiteDetailsPanel 
                site={selectedSite} 
                onClose={() => setSelectedSite(null)} 
                onAddToMission={addToPortfolio}
                liveBtcPrice={liveBtcPrice}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The wild useful Mission Portfolio panel - stays visible at bottom of the column */}
        <MissionPanel 
          portfolio={portfolio} 
          liveBtcPrice={liveBtcPrice} 
          onRemove={removeFromPortfolio} 
          onClear={clearPortfolio}
          onFlyTo={flyToFromPortfolio}
        />

        {portfolio.length > 0 && (
          <button 
            onClick={exportMission}
            className="self-end text-xs flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <Download size={13} /> EXPORT MISSION BRIEF
          </button>
        )}
      </div>

      {/* Floating Layer + View controls (enhanced) */}
      <div className="absolute bottom-5 right-5 z-[60]">
        <LayerControls 
          layers={layers} 
          onToggle={(l) => setLayers(prev => ({...prev, [l]: !prev[l]}))} 
        />
      </div>

      {/* Bottom status + view toggle */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2">
        <div className="glass text-xs px-5 py-1.5 rounded-3xl flex items-center gap-3 border border-white/10">
          {loading ? 'Loading full dataset…' : `${filteredSites.length.toLocaleString()} sites in view • ${portfolio.length} in active mission`}
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} className="ml-2 text-[#5BC0BE] hover:underline flex items-center gap-1 text-[11px]">
            <Target size={13}/> COMMAND PALETTE (⌘K)
          </button>
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
